// services/orgService.js
const orgMapper = require("../mappers/orgMapper");
//목록
async function organizationList() {
  return await orgMapper.organizationList();
}
//수정
async function organizationUpdate(payload) {
  return await orgMapper.organizationUpdate(payload);
}
//삭제
async function organizationDelete(org_code) {
  return await orgMapper.organizationDelete(org_code);
}
//추가
async function organizationInsert(payload) {
  return await orgMapper.organizationInsert(payload);
}

module.exports = {
  organizationList,
  organizationUpdate,
  organizationDelete,
  organizationInsert,
};
