const pool = require('../configs/db');
const code = require('../configs/userRoleCode');
const smsUtil = require('../utils/sms');
const { sendSms } = require('../utils/solapi');
const signUserMapper = require('../mappers/signUserMapper');
const { hashPw, checkPw } = require('../utils/crypto');
const { INSERT_DATA } = require('../configs/insertData');
const { makeParams } = require('../utils/sqlParamUtil');
const { createUser } = require('./factories/userFactory');
const { encryptSsn, decryptSsn } = require('../utils/ssnCrypto');

// 전체 목록 조회 test
async function checkId(id) {
  const result = await signUserMapper.findUserId(id);
  if (result[0] != null)
    return { ok: false, message: '이미 사용중인 아이디입니다.' };
  return { ok: true, message: '사용 가능한 아이디입니다.' };
}

// sms 인증
function getSmsCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

async function sendCode(phone) {
  if (phone.data.length < 10)
    return {
      ok: false,
      message: '연락처는 10~11자로 입력하셔야 됩니다.',
    };

  const code = getSmsCode();
  const textMsg = `[ 인증번호 : ${code} ]`;
  console.log(textMsg);

  const result = await sendSms(phone.data, textMsg);
  if (!result.ok) return { ok: false, message: '문자 전송 실패' };

  smsUtil.makeCode(phone.data, code);
  return { ok: true, message: '인증코드 전송 완료' };
}

async function verifyCode(data) {
  const result = smsUtil.verifiedCode(data.phone, data.code);
  if (!result) return { ok: false, message: '전화번호 인증 실패' };
  return { ok: true, message: '전화번호 인증 완료' };
}

// 개인 회원
async function addUser(userData) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 첫 번째: 기관 코드 조회
    const resOrgCode = await signUserMapper.findOrgCode(
      conn,
      userData.org_name
    );
    const orgCode = resOrgCode.length == 0 ? null : resOrgCode[0].org_code;

    // 두 번째: 해싱
    const hashedPw = await hashPw(userData.userPw);
    const enc = encryptSsn(userData.ssn);

    // 세 번째: 도메인
    const tempData = createUser(userData, {
      orgCode: orgCode,
      hashedPw: hashedPw,
      ssn: enc.ssn,
      ssn_iv: enc.ssn_iv,
    });

    // 네 번째: params 가공
    const dataParams = makeParams(INSERT_DATA, tempData);

    // 다섯 번째: db
    await signUserMapper.addUser(conn, dataParams);

    await conn.commit();
    return { ok: true, message: '개인 유저 등록 성공' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// 기관 목록 조회
async function findOrg() {
  return await signUserMapper.findOrgList();
}

// 기관 회원
async function addOrg(userData) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 첫 번째: 기관 조회
    const orgCode = await signUserMapper.findOrgCode(conn, userData.org_name);
    if (orgCode[0] == null)
      return { ok: false, message: '일치하는 기관이 없습니다.' };

    // 두 번째: 해싱
    const hashedPw = await hashPw(userData.userPw);
    const enc = encryptSsn(userData.ssn);

    // 세 번째: 도메인
    const tempData = createUser(userData, {
      orgCode: orgCode[0].org_code,
      hashedPw: hashedPw,
      ssn: enc.ssn,
      ssn_iv: enc.ssn_iv,
      isActive: 0,
      department: userData.department,
    });

    // 네 번째: params 가공
    const dataParams = makeParams(INSERT_DATA, tempData);

    // 다섯 번째: db insert
    const userCode = await signUserMapper.addOrg(conn, dataParams);

    // 여섯 번째: approval params 가공
    const reqData = {
      user_code: userCode.insertId,
      approval_type: code.APPROVAL_USER_ROLE[userData.role],
      request_date: userData.joinDate,
      state: 'BA1',
    };

    // 일곱 번째: db insert
    await signUserMapper.requestApproval(conn, reqData);

    await conn.commit();
    return { ok: true, message: '등록 성공' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// 로그인
async function login(data) {
  try {
    const result = await signUserMapper.authLogin(data.userId);

    if (!result || result.length == 0)
      return { ok: false, message: '존재하지 않는 아이디입니다.' };

    const isPw = await checkPw(data.userPw, result[0].password_hash);
    if (!isPw) return { ok: false, message: '패스워드가 맞지 않습니다.' };

    if (result[0].delete_status == 1)
      return { ok: false, message: '비활성화 계정입니다.' };

    return { ok: true, message: '로그인 성공', ...result[0] };
  } catch (err) {
    throw err;
  }
}

// id, pw 찾기
async function findIdPw(type, data) {
  switch (type) {
    case 'findId': {
      const result = await signUserMapper.findId(data);
      if (!result || result.length == 0)
        return { ok: false, message: '맞는 아이디가 없습니다.' };

      return { ok: true, data: result[0] };
    }
    case 'findPw': {
      const payLoad = [data.user_id, data.name, data.phone];
      const result = await signUserMapper.findPw(payLoad);

      if (result.length == 0) return { ok: false, message: '값이 없습니다.' };

      return { ok: true, message: '다음 단계로' };
    }
    case 'findResetPw':
      const newHashPw = await hashPw(data.newPw);
      const { user_id } = data;
      const result = await signUserMapper.updatePw({ user_id, newHashPw });
      if (result.affectedRows == 0) return { ok: false, message: '변경 실패' };

      return { ok: true, message: '변경 성공' };
    default:
      throw new Error('type 오류');
  }
}

module.exports = {
  checkId,
  sendCode,
  verifyCode,
  addUser,
  findOrg,
  addOrg,
  login,
  findIdPw,
};
