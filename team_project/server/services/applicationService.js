// server/services/applicationService.js

const applicationMapper = require("../mappers/applicationMapper");

// 나의 지원 신청 현황 조회 서비스 (역할별 분기)
async function getMyApplications({ loginId, role }) {
  if (!loginId) {
    throw new Error("loginId가 필요합니다.");
  }
  if (!role) {
    throw new Error("role이 필요합니다.");
  }

  switch (role) {
    case "AA1": // ✅ 일반 사용자: 내가 신청한 것
      return await applicationMapper.selectMyApplications(loginId);

    case "AA2": // ✅ 담당자: 내가 담당자인 것(assi_by)
      return await applicationMapper.selectAssiApplications(loginId);

    case "AA3": // ✅ 기관 관리자: 내 기관(org_code)에 속한 신청
      return await applicationMapper.selectOrgApplications(loginId);

    case "AA4": // ✅ 시스템 관리자: 전체
      return await applicationMapper.selectAllApplications();

    default:
      throw new Error("알 수 없는 사용자 권한입니다.");
  }
}

module.exports = {
  getMyApplications,
};
