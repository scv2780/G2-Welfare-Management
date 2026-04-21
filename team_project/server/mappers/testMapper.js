const pool = require('../configs/db.js');
const testSQL = require('../sql/testSQL');

async function testListSQL() {
  let testConn;
  try {
    testConn = await pool.getConnection();
    const testRows = await testConn.query(testSQL.SELECT_ALL);
    console.log('[ testMapper.js || 성공 ]');
    return testRows;
  } catch (err) {
    console.error('[ testMapper.js || 실패 ]', err.message);
    throw err;
  } finally {
    if (testConn) testConn.release();
  }
}

module.exports = { testListSQL };
