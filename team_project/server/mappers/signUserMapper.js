const pool = require('../configs/db');
const signUserSQL = require('../sql/signUserSQL');

// 중복 확인
async function findUserId(id) {
  return await pool.query(signUserSQL.FIND_ID, [id]);
}

// 개인 회원가입
async function addUser(conn, dataParams) {
  return await conn.query(signUserSQL.INSERT_USER, dataParams);
}

// 기관 목록 조회
async function findOrgList() {
  const result = await pool.query(signUserSQL.FIND_ORG_LIST);
  return result;
}

// 기관 code 가져오기
async function findOrgCode(conn, orgName) {
  return await conn.query(signUserSQL.FIND_ORG_CODE, [orgName]);
}

// 기관 회원가입
async function addOrg(conn, dataParams) {
  const result = await conn.query(signUserSQL.INSERT_USER, dataParams);
  return result;
}

// 승인 요청 테이블 기입
async function requestApproval(conn, data) {
  const { user_code, approval_type, request_date, state } = data;
  return await conn.query(signUserSQL.REQUEST_USER, [
    user_code,
    approval_type,
    request_date,
    state,
  ]);
}

// 로그인
async function authLogin(data) {
  const result = await pool.query(signUserSQL.AUTH_LOGIN, [data]);
  return result;
}

// id 찾기
async function findId(data) {
  return await pool.query(signUserSQL.FIND_USER_ID, [data.name, data.phone]);
}

// pw 찾기
async function findPw(data) {
  return await pool.query(signUserSQL.FIND_USER_PW, data);
}

// pw 변경
async function updatePw(data) {
  return await pool.query(signUserSQL.FIND_RESET_PW, [
    data.newHashPw,
    data.user_id,
  ]);
}

module.exports = {
  findUserId,
  addUser,
  findOrgList,
  findOrgCode,
  addOrg,
  requestApproval,
  authLogin,
  findId,
  findPw,
  updatePw,
};
