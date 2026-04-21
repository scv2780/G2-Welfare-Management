// server/mappers/applicationMapper.js

const db = require("../configs/db");
const applicationSQL = require("../sql/applicationSQL");

// 나의 지원 신청 현황(일반 사용자)
async function selectMyApplications(loginId) {
  const rows = await db.query(applicationSQL.selectMyApplications, [loginId]);
  return rows;
}

// 담당자 신청 현황(내가 assi_by 인 것)
async function selectAssiApplications(loginId) {
  const rows = await db.query(applicationSQL.selectAssiApplications, [loginId]);
  return rows;
}

// 기관 관리자 신청 현황(내 기관)
async function selectOrgApplications(loginId) {
  const rows = await db.query(applicationSQL.selectOrgApplications, [loginId]);
  return rows;
}

// 시스템 관리자: 전체
async function selectAllApplications() {
  const rows = await db.query(applicationSQL.selectAllApplications);
  return rows;
}

module.exports = {
  selectMyApplications,
  selectAssiApplications,
  selectOrgApplications,
  selectAllApplications,
};
