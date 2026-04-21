// attachmentMapper.js
const pool = require("../configs/db.js");
const attachmentSQL = require("../sql/attachmentSQL");

// 첨부파일 등록
async function addAttachment(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(attachmentSQL.insertAttachment, [
      data.original_filename,
      data.server_filename,
      data.file_path,
      data.linked_table_name,
      data.linked_record_pk,
    ]);
    return rows;
  } catch (err) {
    console.error("[attachmentMapper.js || 첨부파일 등록 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 첨부파일 조회
async function selectAttachments(linked_table_name, linked_record_pk) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(attachmentSQL.selectAttachList, [
      linked_table_name,
      linked_record_pk,
    ]);
    return rows;
  } catch (err) {
    console.error("[attachmentMapper.js || 첨부파일 조회 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 첨부파일 삭제
async function removeAttachment(attach_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(attachmentSQL.deleteAttachment, [
      attach_code,
    ]);
    return rows;
  } catch (err) {
    console.error("[attachmentMapper.js || 첨부파일 삭제 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  addAttachment,
  selectAttachments,
  removeAttachment,
};
