const pool = require("../configs/db.js");

// group_code + code_id로 code_name 가져오기
async function getCodeName(group_code, code_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT code_name
      FROM common_code
      WHERE group_code = ?
        AND code_id = ?
      LIMIT 1
    `;
    const rows = await conn.query(query, [group_code, code_id]);
    return rows.length > 0 ? rows[0].code_name : null;
  } catch (err) {
    console.error("[commonCodeService.js || getCodeName 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// group_code로 전체 코드 리스트 가져오기 (ex.select 박스)
async function getCodeList(group_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `
      SELECT code_id, code_name
      FROM common_code
      WHERE group_code = ?
      ORDER BY code_id ASC
    `;
    const rows = await conn.query(query, [group_code]);
    return rows;
  } catch (err) {
    console.error("[commonCodeService.js || getCodeList 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  getCodeName,
  getCodeList,
};
