// test-db.js
const pool = require('./configs/db');
const userInfoMapper = require('./mappers/userInfoMapper');

(async () => {
  try {
    console.log('=== DB 테스트 시작 ===');

    const testUser = {
      role: 'AA1',
      userId: 'seung2',
    };

    const result = await userInfoMapper.findUserInfo(testUser);

    console.log('\n=== SQL 실행 결과 ===');
    console.log(result);

    console.log('\n=== DB 테스트 완료 ===');
    process.exit(0);
  } catch (err) {
    console.error('\n[ DB 테스트 실패 ]');
    console.error(err);
    process.exit(1);
  }
})();
