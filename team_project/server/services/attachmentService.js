// attachmentService.js
const attachmentMapper = require("../mappers/attachmentMapper");

// 첨부파일 등록
async function createAttachment(data) {
  try {
    const result = await attachmentMapper.addAttachment(data);
    return result;
  } catch (err) {
    console.error("[attachmentService.js || 첨부파일 등록 실패]", err.message);
    throw err;
  }
}

// 첨부파일 조회
async function getAttachments(linked_table_name, linked_record_pk) {
  try {
    const attachments = await attachmentMapper.selectAttachments(
      linked_table_name,
      linked_record_pk
    );
    return attachments;
  } catch (err) {
    console.error("[attachmentService.js || 첨부파일 조회 실패]", err.message);
    throw err;
  }
}

// 첨부파일 삭제
async function removeAttachment(attach_code) {
  try {
    const result = await attachmentMapper.removeAttachment(attach_code);
    return result;
  } catch (err) {
    console.error("[attachmentService.js || 첨부파일 삭제 실패]", err.message);
    throw err;
  }
}

module.exports = {
  createAttachment,
  getAttachments,
  removeAttachment,
};
