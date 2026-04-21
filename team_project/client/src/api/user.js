import axios from 'axios';

// 회원가입 -> ID 중복 확인
export async function checkId(id) {
  try {
    const res = await axios.get(`/api/user/checkid`, { params: { id } });
    return res.data;
  } catch (err) {
    console.log('에러 발생', err);
    throw err;
  }
}

// 회원가입 -> SMS 인증
export async function sendSMS(data) {
  const result = await axios.post('/api/user/sendSMS', { data });
  return result.data;
}

export async function verifySMS(phone, code) {
  const result = await axios.post('/api/user/verifySMS', { phone, code });
  return result.data;
}

// 회원가입 -> 개인 회원
export async function addUser(userData) {
  try {
    const res = await axios.post('/api/user/addUser', userData);
    return res.data;
  } catch (err) {
    console.log('[ user.js 회원가입 실패 ]', err);
    throw err;
  }
}

// 회원가입 -> 기관 조회
export async function findAllOrg() {
  try {
    const res = await axios.post('/api/user/findOrg');
    return res.data;
  } catch (err) {
    console.log('[ user.js 기관 조회 실패 ]', err);
    throw err;
  }
}

// 회원가입 -> 기관 회원
export async function addOrg(orgData) {
  try {
    const res = await axios.post('/api/user/addOrg', orgData);
    return res.data;
  } catch (err) {
    console.log('[ user.js 회원가입 실패 ]', err);
    throw err;
  }
}

// 로그인
export async function login(userData) {
  try {
    const result = await axios.post('/api/user/login', userData);
    return result.data;
  } catch (err) {
    console.log('[ user.js 로그인 실패 ]', err);
    throw err;
  }
}

// id, pw 찾기
export async function findIdPw(type, findData) {
  try {
    if (!type == 'findResetPw') {
      const result = await axios.post('/api/user/findIdPw', {
        type,
        data: findData,
      });
      return result.data;
    }
    const result = await axios.put('/api/user/findIdPw', {
      type,
      data: findData,
    });
    return result.data;
  } catch (err) {
    console.log('[ user.js ID/PW 찾기 실패 ]', err);
  }
}

// 회원정보
export async function findUserInfo(userData) {
  try {
    const result = await axios.post('/api/userinfo/findInfo', userData);
    return result.data;
  } catch (err) {
    console.log('[ user.js 회원정보 가져오기 실패 ]', err);
    throw err;
  }
}

// 사용자, 기관, 자녀 정보 수정
export async function updateInfo(type, updateData) {
  try {
    const result = await axios.put('/api/userinfo/updateInfo', {
      type,
      data: updateData,
    });
    return result.data;
  } catch (err) {
    console.error('[ updateInfo 오류 ]', err);
  }
}

// pw 교체
export async function updatePw(updateData) {
  try {
    const result = await axios.put('/api/userinfo/updatePw', {
      data: updateData,
    });
    return result.data;
  } catch (err) {
    console.error('[ updatePw 오류 ]', err);
  }
}

// 자녀 추가
export async function addChild(childData) {
  try {
    const result = await axios.post('/api/userinfo/childAdd', childData);
    return result.data;
  } catch (err) {
    console.error('[ addChild 오류 ]', err);
  }
}

// 자녀 정보 삭제
export async function deleteChild(childCode) {
  try {
    const result = await axios.delete('/api/userinfo/deleteChild', {
      data: { childCode },
    });
    return result.data;
  } catch (err) {
    console.error('[ addChild 오류 ]', err);
  }
}

// 회원탈퇴
export async function deleteUser(userData) {
  try {
    return await axios.delete('/api/userinfo/deleteUser', {
      data: userData,
    });
  } catch (err) {
    console.error('[ deleteUser 오류 ]', err);
  }
}
