// server/sql/applicationSQL.js

// 1) 일반 사용자: 내가 보호자인 신청
const selectMyApplications = `
  SELECT
      ss.submit_code                              AS submit_code
    , c.child_name                                AS child_name
    , parent.name                                 AS name          -- 보호자 이름
    , mgr.name                                    AS assi_name     -- 담당자 이름
    , org.org_name                                AS org_name
    , ss.submit_at                                AS survey_date
    , cp.level                                    AS priority_level

    , MAX(sp.plan_code)                           AS plan_code
    , MAX(sp.status)                              AS plan_status

    , MAX(sr.result_code)                         AS result_code
    , MAX(sr.status)                              AS result_status

, GROUP_CONCAT(DISTINCT sp.status)            AS plan_status_list  
    , GROUP_CONCAT(DISTINCT sr.status)            AS result_status_list 

    , MAX(cs.status)                              AS counsel_status  
  FROM survey_submission ss

  JOIN users parent
    ON parent.user_code = ss.written_by

  LEFT JOIN child c
    ON c.child_code = ss.child_code

  LEFT JOIN users mgr
    ON mgr.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = parent.org_code

  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'

  LEFT JOIN support_plan sp
    ON sp.submit_code = ss.submit_code

  LEFT JOIN support_result sr
    ON sr.plan_code = sp.plan_code

  LEFT JOIN counsel_note cs                         -- ✅ 상담 JOIN 추가
    ON cs.submit_code = ss.submit_code

  WHERE parent.user_id = ?

  GROUP BY
      ss.submit_code,
      c.child_name,
      parent.name,
      mgr.name,
      org.org_name,
      ss.submit_at,
      cp.level

  ORDER BY
    ss.submit_at DESC,
    ss.submit_code DESC
`;

// 2) 담당자: 내가 담당자인 신청 목록 (assi_by = 나)
const selectAssiApplications = `
  SELECT
      ss.submit_code                              AS submit_code
    , c.child_name                                AS child_name
    , parent.name                                 AS name          -- 보호자 이름
    , mgr.name                                    AS assi_name     -- 담당자 이름
    , org.org_name                                AS org_name
    , ss.submit_at                                AS survey_date
    , cp.level                                    AS priority_level

    , MAX(sp.plan_code)                           AS plan_code
    , MAX(sp.status)                              AS plan_status

    , MAX(sr.result_code)                         AS result_code
    , MAX(sr.status)                              AS result_status

, GROUP_CONCAT(DISTINCT sp.status) AS plan_status_list
, GROUP_CONCAT(DISTINCT sr.status) AS result_status_list

    , MAX(cs.status) AS counsel_status
  FROM survey_submission ss

  JOIN users parent
    ON parent.user_code = ss.written_by

  LEFT JOIN child c
    ON c.child_code = ss.child_code

  LEFT JOIN users mgr
    ON mgr.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = parent.org_code

  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'

  LEFT JOIN support_plan sp
    ON sp.submit_code = ss.submit_code

  LEFT JOIN support_result sr
    ON sr.plan_code = sp.plan_code

    LEFT JOIN counsel_note cs                 
    ON cs.submit_code = ss.submit_code

  -- 🔑 로그인한 담당자(AA2)의 user_id 기준
  WHERE mgr.user_id = ?

  GROUP BY
      ss.submit_code,
      c.child_name,
      parent.name,
      mgr.name,
      org.org_name,
      ss.submit_at,
      cp.level

  ORDER BY
    ss.submit_at DESC,
    ss.submit_code DESC
`;

// 3) 기관 관리자: 내 기관(org_code)의 신청 전체
const selectOrgApplications = `
  SELECT
      ss.submit_code                              AS submit_code
    , c.child_name                                AS child_name
    , parent.name                                 AS name          -- 보호자 이름
    , mgr.name                                    AS assi_name     -- 담당자 이름
    , org.org_name                                AS org_name
    , ss.submit_at                                AS survey_date
    , cp.level                                    AS priority_level

    , MAX(sp.plan_code)                           AS plan_code
    , MAX(sp.status)                              AS plan_status

    , MAX(sr.result_code)                         AS result_code
    , MAX(sr.status)                              AS result_status

, GROUP_CONCAT(DISTINCT sp.status) AS plan_status_list
, GROUP_CONCAT(DISTINCT sr.status) AS result_status_list

    , MAX(cs.status) AS counsel_status
  FROM survey_submission ss

  JOIN users parent
    ON parent.user_code = ss.written_by

  LEFT JOIN child c
    ON c.child_code = ss.child_code

  LEFT JOIN users mgr
    ON mgr.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = parent.org_code

  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'

  LEFT JOIN support_plan sp
    ON sp.submit_code = ss.submit_code

  LEFT JOIN support_result sr
    ON sr.plan_code = sp.plan_code

    LEFT JOIN counsel_note cs                 
    ON cs.submit_code = ss.submit_code

  -- 🔑 로그인한 관리자(AA3)의 org_code와 같은 기관의 신청
  WHERE parent.org_code = (
    SELECT org_code
    FROM users
    WHERE user_id = ?
  )

  GROUP BY
      ss.submit_code,
      c.child_name,
      parent.name,
      mgr.name,
      org.org_name,
      ss.submit_at,
      cp.level

  ORDER BY
    ss.submit_at DESC,
    ss.submit_code DESC
`;

// 4) 시스템 관리자: 전체 신청
const selectAllApplications = `
  SELECT
      ss.submit_code                              AS submit_code
    , c.child_name                                AS child_name
    , parent.name                                 AS name          -- 보호자 이름
    , mgr.name                                    AS assi_name     -- 담당자 이름
    , org.org_name                                AS org_name
    , ss.submit_at                                AS survey_date
    , cp.level                                    AS priority_level

    , MAX(sp.plan_code)                           AS plan_code
    , MAX(sp.status)                              AS plan_status

    , MAX(sr.result_code)                         AS result_code
    , MAX(sr.status)                              AS result_status
    
    , GROUP_CONCAT(DISTINCT sp.status) AS plan_status_list
, GROUP_CONCAT(DISTINCT sr.status) AS result_status_list

    , MAX(cs.status) AS counsel_status
  FROM survey_submission ss

  JOIN users parent
    ON parent.user_code = ss.written_by

  LEFT JOIN child c
    ON c.child_code = ss.child_code

  LEFT JOIN users mgr
    ON mgr.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = parent.org_code

  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code
   AND cp.is_current = 'Y'

  LEFT JOIN support_plan sp
    ON sp.submit_code = ss.submit_code

  LEFT JOIN support_result sr
    ON sr.plan_code = sp.plan_code

    LEFT JOIN counsel_note cs                 
    ON cs.submit_code = ss.submit_code
  GROUP BY
      ss.submit_code,
      c.child_name,
      parent.name,
      mgr.name,
      org.org_name,
      ss.submit_at,
      cp.level

  ORDER BY
    ss.submit_at DESC,
    ss.submit_code DESC
`;

module.exports = {
  selectMyApplications,
  selectAssiApplications,
  selectOrgApplications,
  selectAllApplications,
};
