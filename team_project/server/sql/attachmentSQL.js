// attachmentSQL.js

// 첨부파일 등록
const insertAttachment = `
INSERT INTO attachment (
  original_filename,
  server_filename,
  file_path,
  linked_table_name,
  linked_record_pk
) VALUES (?, ?, ?, ?, ?)
`;

// 첨부파일 조회 (record 기준)
const selectAttachList = `
SELECT
    attach_code,
    original_filename,
    server_filename,
    file_path
FROM attachment
WHERE linked_table_name = ?
  AND linked_record_pk = ?
`;

// 첨부파일 삭제
const deleteAttachment = `
DELETE FROM attachment
WHERE attach_code = ?
`;

module.exports = {
  insertAttachment,
  selectAttachList,
  deleteAttachment,
};
