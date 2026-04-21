const bcrypt = require('bcrypt');
const salt = 10;

// 해싱
async function hashPw(userPw) {
  return await bcrypt.hash(userPw, salt);
}

// 체크
async function checkPw(userPw, dbHashPw) {
  return await bcrypt.compare(userPw, dbHashPw);
}

module.exports = {
  hashPw,
  checkPw,
};
