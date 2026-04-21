const testMapper = require('../mappers/testMapper');

// 전체 목록 조회 test
async function testUsersList() {
  const testFindDB = await testMapper.testListSQL();
  return testFindDB;
}

module.exports = { testUsersList };
