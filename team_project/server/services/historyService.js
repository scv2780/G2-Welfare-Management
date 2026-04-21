// team_project/server/services/historyService.js

const historyMapper = require("../mappers/historyMapper");

// 수정 이력 목록 조회
async function getHistoryList({
  searchField,
  keyword,
  orderBy,
  typeCode,
  orgCode,
  managerCode,
  loginId,
  role,
  page,
  size,
}) {
  return await historyMapper.historyList({
    searchField,
    keyword,
    orderBy,
    typeCode,
    orgCode,
    managerCode,
    loginId,
    role,
    page,
    size,
  });
}

module.exports = {
  getHistoryList,
};
