// server/services/counselService.js
const counselMapper = require("../mappers/counselMapper");

module.exports = {
  /**
   * 역할별 상담 목록 조회
   * role: 2 = 담당자, 3 = 관리자, 4 = 시스템
   */
  listCounsel(role, userId) {
    return counselMapper.listCounselByRole(Number(role), Number(userId));
  },

  // 상담 작성
  async saveCounsel(body, files) {
    return counselMapper.saveCounsel(body, files);
  },

  //상담 상세
  async getCounselDetail(submitCode) {
    return counselMapper.getCounselDetail(submitCode);
  },
  //상담 승인
  async approveCounsel(submitCode, processorCode) {
    return await counselMapper.approveCounsel(submitCode, processorCode);
  },
  //상담 반려
  async rejectCounsel(submitCode, reason) {
    return await counselMapper.rejectCounsel(submitCode, reason);
  },

  // 반려 사유 조회
  async getRejectionReason(submitCode) {
    return await counselMapper.getRejectionReason(submitCode);
  },
  //임시저장
  async saveCounselTemp(body, files) {
    return counselMapper.saveCounselTemp(body, files);
  },
};
