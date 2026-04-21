// server/sql/authorityTransferSQL.js

// 🔹 기관 관리자(로그인 아이디 기준)의 기관 안에 있는 이용자(AA1) 목록 조회 기본
//  - 여기서는 "같은 기관" 필터만 걸고
//  - 담당자(managerCode) 필터는 mapper 쪽에서 authorityUserManagerFilter 를 붙여서 사용
const authorityUserListBase = `
  SELECT
      u.user_code,
      u.user_id,
      u.name,
      u.phone
  FROM users u
  WHERE u.role = 'AA1'
    AND u.org_code = (
      SELECT u2.org_code
      FROM users u2
      WHERE u2.user_id = ?
      LIMIT 1
    )
`;

// 🔹 카운트용 기본 (기관 기준만)
const authorityUserCountBase = `
  SELECT
      COUNT(*) AS totalCount
  FROM users u
  WHERE u.role = 'AA1'
    AND u.org_code = (
      SELECT u2.org_code
      FROM users u2
      WHERE u2.user_id = ?
      LIMIT 1
    )
`;

// 🔹 담당자별 이용자 필터용 공통 WHERE 조각
//  - u.user_code 가 아래 3가지 업무테이블 기준으로
//    해당 담당자(assi_by)가 맡고 있는 이용자인 경우에만 포함
const authorityUserManagerFilter = `
  u.user_code IN (
      -- 1) 조사지 담당자
      SELECT ss.written_by
      FROM survey_submission ss
      WHERE ss.assi_by = ?

      UNION

      -- 2) 지원계획 담당자
      SELECT ss.written_by
      FROM support_plan sp
      JOIN survey_submission ss
        ON ss.submit_code = sp.submit_code
      WHERE sp.assi_by = ?

      UNION

      -- 3) 지원결과 담당자
      SELECT ss.written_by
      FROM support_result sr
      JOIN support_plan sp
        ON sp.plan_code = sr.plan_code
      JOIN survey_submission ss
        ON ss.submit_code = sp.submit_code
      WHERE sr.assi_by = ?
  )
`;

/* 🔹 조사지 담당자(assi_by) 이관용
   - written_by = 일반회원(user_code)
   - assi_by     = 담당자(user_code)
*/
const transferSurveyAssiByBase = `
  UPDATE survey_submission ss
  JOIN users u
    ON u.user_code = ss.written_by
   SET ss.assi_by = ?
 WHERE ss.assi_by = ?
`;

/* 🔹 지원계획 담당자(assi_by) 이관용
   - support_plan.submit_code -> survey_submission.submit_code
   - survey_submission.written_by = 일반회원(user_code)
*/
const transferSupportPlanAssiByBase = `
  UPDATE support_plan sp
  JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  JOIN users u
    ON u.user_code = ss.written_by
   SET sp.assi_by = ?
 WHERE sp.assi_by = ?
`;

/* 🔹 지원결과 담당자(assi_by) 이관용
   - support_result.plan_code -> support_plan.plan_code
   - support_plan.submit_code -> survey_submission.submit_code
   - survey_submission.written_by = 일반회원(user_code)
*/
const transferSupportResultAssiByBase = `
  UPDATE support_result sr
  JOIN support_plan sp
    ON sp.plan_code = sr.plan_code
  JOIN survey_submission ss
    ON ss.submit_code = sp.submit_code
  JOIN users u
    ON u.user_code = ss.written_by
   SET sr.assi_by = ?
 WHERE sr.assi_by = ?
`;

module.exports = {
  authorityUserListBase,
  authorityUserCountBase,
  authorityUserManagerFilter, // ✅ 새로 추가된 필터 조각
  transferSurveyAssiByBase,
  transferSupportPlanAssiByBase,
  transferSupportResultAssiByBase,
};
