// server/services/authorityTransferService.js

const authorityMapper = require("../mappers/authorityTransferMapper");

// 이용자 목록 조회
async function getAuthorityUserList({
  loginId,
  managerCode,
  keyword,
  page,
  size,
}) {
  return await authorityMapper.authorityUserList({
    loginId,
    managerCode,
    keyword,
    page,
    size,
  });
}

// 권한 이관 수행
async function transferAuthority({
  loginId,
  fromManagerCode,
  toManagerCode,
  userCodes,
}) {
  return await authorityMapper.transferUsers({
    loginId,
    fromManagerCode,
    toManagerCode,
    userCodes,
  });
}

module.exports = {
  getAuthorityUserList,
  transferAuthority,
};
