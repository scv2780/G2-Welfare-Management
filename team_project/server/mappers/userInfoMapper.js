const pool = require('../configs/db');
const userInfoSQL = require('../sql/userInfoSQL');

// 권한에 따라 회원정보 갖고 오기
async function findUserInfo(userData) {
  try {
    let result;
    if (userData.role == 'AA1') {
      result = await pool.query(userInfoSQL.FIND_USER_INFO, [userData.userId]);
    } else {
      result = await pool.query(userInfoSQL.FIND_ORG_INFO, [userData.userId]);
    }
    if (!result) {
      return { false: true, message: '값 없음' };
    }
    return result;
  } catch (err) {
    console.error('[ findUserInfo 실패 ] : ', err);
  }
}

// 사용자 수정
async function updateUser(data) {
  const { user_id, name, phone, address, email } = data;
  try {
    const result = await pool.query(userInfoSQL.USER_UPDATE, [
      name,
      phone,
      address,
      email,
      user_id,
    ]);
    if (result.affectedRows == 1) {
      return { ok: true, message: '사용자 수정 성공' };
    }
    return { ok: false, message: '사용자 수정 실패' };
  } catch (err) {
    console.error('[ updateUser 실패 ] : ', err);
  }
}

// pw 가져오기 -> user_code 기반
async function findUserPw(data) {
  return await pool.query(userInfoSQL.FIND_USER_PW, data);
}

// pw 가져오기 -> user_id 기반
async function findUserPwForId(data) {
  return await pool.query(userInfoSQL.FIND_USER_PW_FOR_ID, data);
}

// pw 변경
async function updatePw(data) {
  return await pool.query(userInfoSQL.USER_UPDATE_PW, data);
}

// 기관 수정
async function updateOrg(data) {
  const { user_id, org_name, department } = data;
  try {
    const result = await pool.query(userInfoSQL.ORG_UPDATE, [
      org_name,
      department,
      user_id,
    ]);
    if (result.affectedRows == 1) {
      return { ok: true, message: '기관 수정 성공' };
    }
    return { ok: false, message: '해당 기관명이 없습니다.' };
  } catch (err) {
    console.error('[ updateOrg 실패 ] : ', err);
  }
}

// 자녀 수정
async function updateChild(data) {
  const { child_name, ssn, gender, disability_type, ssn_iv, child_code } = data;
  try {
    const result = await pool.query(userInfoSQL.CHILD_UPDATE, [
      child_name,
      ssn,
      gender,
      disability_type,
      ssn_iv,
      child_code,
    ]);
    if (result.affectedRows == 1) {
      return { ok: true, message: '자녀 수정 성공' };
    }
    return { ok: false, message: '자녀 수정 실패' };
  } catch (err) {
    console.error('[ updateChild 실패 ] : ', err);
  }
}

// 자녀 추가
async function addChild(data) {
  return await pool.query(userInfoSQL.CHILD_ADD, data);
}

// 자녀 삭제
async function deleteChild(data) {
  try {
    const result = await pool.query(userInfoSQL.CHILD_DELETE, [data]);
    if (result.affectedRows == 1) {
      return { ok: true, message: '자녀 삭제 성공' };
    }
    return { ok: false, message: '자녀 삭제 실패' };
  } catch (err) {
    console.error('[ deleteChild 실패 ] : ', err);
  }
}

// 회원탈퇴
async function deleteUserMapper(userData) {
  return await pool.query(userInfoSQL.DELETE_USER, [userData]);
}

module.exports = {
  findUserInfo,
  addChild,
  updateUser,
  findUserPw,
  findUserPwForId,
  updatePw,
  updateOrg,
  updateChild,
  deleteChild,
  deleteUserMapper,
};
