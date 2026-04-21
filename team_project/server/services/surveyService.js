const surveyMapper = require("../mappers/surveyMapper");

module.exports = {
  // 버전별 조사지 목록
  listTemplates() {
    return surveyMapper.listTemplates();
  },

  // 조사지 새로 생성
  createSurvey(data) {
    return surveyMapper.insertSurvey(data);
  },

  // 최신 조사지(트리) 조회
  getLatestSurvey() {
    return surveyMapper.getLatestSurvey();
  },

  // 응답 제출
  submitSurvey(body) {
    // body: { template_ver_code, answers: { [item_code]: value | value[] }, written_by? }
    return surveyMapper.insertAnswers(body);
  },

  // 조사지 수정 (버전 업데이트)
  updateSurveyVersion(templateCode, data) {
    return surveyMapper.updateSurveyVersion(templateCode, data);
  },

  // 제출본 목록
  listSubmissions(role, userId) {
    return surveyMapper.listSubmissionsByRole(Number(role), Number(userId));
  },

  // 제출본 상세보기
  getSubmissionDetail(submitCode) {
    return surveyMapper.getSubmissionDetail(Number(submitCode));
  },

  // 제출본 수정
  updateSubmission(submitCode, body) {
    return surveyMapper.updateSubmissionAnswers(Number(submitCode), body);
  },
  // 세부버전
  getSurveyDetailByVer(templateVerCode) {
    return surveyMapper.getSurveyDetailByVer(Number(templateVerCode));
  },

  // 현재 로그인 사용자의 자녀 목록
  listChildrenByUser(userId) {
    return surveyMapper.listChildrenByUser(Number(userId));
  },
  //장애유형 업데이트
  updateUserDisabilityType(userId, disabilityType) {
    return surveyMapper.updateUserDisabilityType(
      Number(userId),
      disabilityType
    );
  },

  // 장애 유형 조회
  getUserDisabilityType(userId) {
    return surveyMapper.getUserDisabilityType(Number(userId));
  },
};
