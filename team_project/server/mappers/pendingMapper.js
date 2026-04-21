const pool = require('../configs/db');
const pendingSQL = require('../sql/pendingSQL');

async function getPendingListMapper(data) {
  try {
    const result = await pool.query(pendingSQL.GET_PENDING_LIST, [
      data.org_code,
    ]);
    return result;
  } catch (err) {
    console.error('[ getPendingListMapper 실패 ] : ', err);
  }
}

async function updateStatusMapper(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { status, assi_by, submit_code } = data;
    await conn.query(pendingSQL.UPDATE_STATUS, [status, assi_by, submit_code]);

    await conn.query(pendingSQL.INSERT_COUNSEL, [submit_code]);

    await conn.commit();

    await conn.rollback();
    return { ok: true, message: '배정 성공' };
  } catch (err) {
    console.error('[ updateStatusMapper 실패 ] : ', err);
    await conn.rollback();
    return { ok: false, message: '트랜잭션 오류 : 배정 실패' };
  } finally {
    conn.release();
  }
}

async function searchManagersMapper(data) {
  try {
    const result = await pool.query(pendingSQL.SEARCH_MANAGERS, [data]);
    if (result.length == 0) {
      return { ok: false, message: '값 없음' };
    }
    return result;
  } catch (err) {
    console.error('[ searchManagersMapper 실패 ] : ', err);
  }
}

module.exports = {
  getPendingListMapper,
  updateStatusMapper,
  searchManagersMapper,
};
