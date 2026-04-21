// server/services/supportResultService.js
const supportResultMapper = require("../mappers/supportResultMapper.js");

module.exports = {
  // 목록 보기
  listResults(role, userId) {
    return supportResultMapper.listSupportResultsByRole(
      Number(role),
      Number(userId)
    );
  },

  // 기본정보 (이름/생년월일/계획서/결과일)
  getResultBasic(submitCode, planCode) {
    return supportResultMapper.getResultBasic(
      Number(submitCode),
      planCode ? Number(planCode) : null
    );
  },

  // 결과 최종 저장
  saveResultWithItems(formJson, files) {
    return supportResultMapper.saveResultWithItems(formJson, files);
  },

  // 결과 임시저장
  saveResultTemp(formJson, files) {
    return supportResultMapper.saveResultTemp(formJson, files);
  },

  // 작성 화면 "불러오기"
  getResultFormDataBySubmit(submitCode, planCode) {
    return supportResultMapper.getResultFormDataBySubmit(
      Number(submitCode),
      planCode ? Number(planCode) : null
    );
  },

  // 수정 화면 조회
  getResultDetail(resultCode) {
    return supportResultMapper.getResultDetail(Number(resultCode));
  },

  // 수정
  updateResultWithItems(formJson, files) {
    return supportResultMapper.updateResultWithItems(formJson, files);
  },

  // 승인
  approveSupportResult(resultCode, processorCode) {
    return supportResultMapper.approveSupportResult(
      Number(resultCode),
      processorCode
    );
  },

  //반려
  rejectSupportResult(resultCode, reason) {
    return supportResultMapper.rejectSupportResult(Number(resultCode), reason);
  },

  // 반려사유 조회
  getRejectionReason(resultCode) {
    return supportResultMapper.getRejectionReason(resultCode);
  },

  //재승인요청
  resubmitResult(resultCode, requesterCode) {
    return supportResultMapper.resubmitResult(resultCode, requesterCode);
  },
};
