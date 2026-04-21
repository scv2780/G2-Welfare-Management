// server/sql/supportResultSql.js
module.exports = {
  // 🔹 목록: 전체
  listSupportResultAll: `
SELECT
  sr.result_code,
  sr.plan_code,
  sp.submit_code,
  sr.status,
  ss.submit_at,
  sp.written_at    AS plan_written_at,
  sr.written_at    AS result_written_at,

  writer.name      AS writer_name,    -- 보호자
  c.child_name     AS child_name,     -- 자녀
  assi.name        AS assi_name,
  org.org_name     AS org_name,
  cp.level         AS level           -- ⭐ 우선순위

FROM support_result sr
JOIN support_plan sp
  ON sp.plan_code = sr.plan_code
JOIN survey_submission ss
  ON ss.submit_code = sp.submit_code
LEFT JOIN child c
  ON c.child_code = ss.child_code
JOIN users writer
  ON writer.user_code = ss.written_by
LEFT JOIN users assi
  ON assi.user_code = sr.assi_by
LEFT JOIN organization org
  ON org.org_code = writer.org_code
LEFT JOIN case_priority cp
  ON cp.submit_code = sp.submit_code   -- ⭐ 우선순위 조인
  AND cp.is_current = 'Y'

ORDER BY sr.result_code DESC
`,

  listSupportResultByAssignee: `
SELECT DISTINCT
  sr.result_code,
  sr.plan_code,
  sp.submit_code,
  sr.status,
  ss.submit_at,
  sp.written_at    AS plan_written_at,
  sr.written_at    AS result_written_at,

  writer.name      AS writer_name,
  c.child_name     AS child_name,
  assi.name        AS assi_name,
  org.org_name     AS org_name,
  cp.level         AS level           -- ⭐ 우선순위

FROM support_result sr
JOIN support_plan sp
  ON sp.plan_code = sr.plan_code
JOIN survey_submission ss
  ON ss.submit_code = sp.submit_code
LEFT JOIN child c
  ON c.child_code = ss.child_code
JOIN users writer
  ON writer.user_code = ss.written_by
LEFT JOIN users assi
  ON assi.user_code = sr.assi_by
LEFT JOIN organization org
  ON org.org_code = writer.org_code
LEFT JOIN case_priority cp
  ON cp.submit_code = sp.submit_code   -- ⭐ 우선순위 조인
  AND cp.is_current = 'Y'

WHERE sr.assi_by = ?

ORDER BY sr.result_code DESC
`,

  // 🔹 목록: 일반 사용자용
  listSupportResultByWriter: `
SELECT
  sr.result_code,
  sr.plan_code,
  sp.submit_code,
  sr.status,
  ss.submit_at,
  sp.written_at    AS plan_written_at,
  sr.written_at    AS result_written_at,

  writer.name      AS writer_name,
  c.child_name     AS child_name,
  assi.name        AS assi_name,
  org.org_name     AS org_name,
  cp.level         AS level           -- ⭐ 우선순위

FROM support_result sr
JOIN support_plan sp
  ON sp.plan_code = sr.plan_code
JOIN survey_submission ss
  ON ss.submit_code = sp.submit_code
LEFT JOIN child c
  ON c.child_code = ss.child_code
JOIN users writer
  ON writer.user_code = ss.written_by
LEFT JOIN users assi
  ON assi.user_code = sr.assi_by
LEFT JOIN organization org
  ON org.org_code = writer.org_code
LEFT JOIN case_priority cp
  ON cp.submit_code = sp.submit_code   -- ⭐ 우선순위 조인
  AND cp.is_current = 'Y'

WHERE ss.written_by = ?

ORDER BY sr.result_code DESC
`,

  // 🔹 목록: 기관 관리자용 (같은 기관 소속 전체)
  listSupportResultByOrg: `
SELECT 
  sr.result_code,
  sr.plan_code,
  sp.submit_code,
  sr.status,
  ss.submit_at,
  sp.written_at    AS plan_written_at,
  sr.written_at    AS result_written_at,

  writer.name      AS writer_name,
  c.child_name     AS child_name,
  assi.name        AS assi_name,
  org.org_name     AS org_name,
  cp.level         AS level           -- ⭐ 우선순위
  

FROM support_result sr
JOIN support_plan sp
  ON sp.plan_code = sr.plan_code
JOIN survey_submission ss
  ON ss.submit_code = sp.submit_code
LEFT JOIN child c
  ON c.child_code = ss.child_code
JOIN users writer
  ON writer.user_code = ss.written_by
LEFT JOIN users assi
  ON assi.user_code = sr.assi_by
LEFT JOIN organization org
  ON org.org_code = writer.org_code
LEFT JOIN case_priority cp
  ON cp.submit_code = sp.submit_code   -- ⭐ 우선순위 조인
  AND cp.is_current = 'Y'

WHERE writer.org_code = ?

ORDER BY sr.result_code DESC
`,

  getOrgCodeByUser: `
  SELECT org_code
  FROM users
  WHERE user_code = ?
`,

  // 🔹 submit_code → plan_code, assi_by
  getPlanBySubmitCode: `
    SELECT
      sp.plan_code,
      sp.assi_by
    FROM support_plan sp
    WHERE sp.submit_code = ?
    ORDER BY sp.plan_code DESC
    LIMIT 1
  `,

  // 🔹 plan_code → support_result 한 건 (존재 여부 확인)
  getSupportResultByPlan: `
    SELECT
      result_code,
      plan_code,
      status,
      actual_from,
      actual_to,
      written_at,
      assi_by
    FROM support_result
    WHERE plan_code = ?
    ORDER BY result_code DESC
    LIMIT 1
  `,

  // 🔹 support_result 새로 insert
  insertSupportResult: `
    INSERT INTO support_result (
      plan_code,
      actual_from,
      actual_to,
      status,
      written_at,
      assi_by
    ) VALUES (?, ?, ?, ?, ?, ?)
  `,

  // 🔹 support_result update (기존 행 있을 때)
  updateSupportResultByCode: `
    UPDATE support_result
    SET
      actual_from = ?,
      actual_to   = ?,
      status      = ?,
      written_at  = ?
    WHERE result_code = ?
  `,

  // 🔹 result_code 기준 기존 item 삭제
  deleteSupportResultItemsByResultCode: `
    DELETE FROM support_result_item
    WHERE result_code = ?
  `,

  // 🔹 새 결과 item insert
  insertSupportResultItem: `
    INSERT INTO support_result_item (
      result_code,
      item_title,
      content_for_user,
      content_for_org,
      written_at
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 🔹 첨부파일 insert (support_result용)
  insertAttachmentForResult: `
    INSERT INTO attachment (
      original_filename,
      server_filename,
      file_path,
      linked_table_name,
      linked_record_pk
    ) VALUES (?, ?, ?, ?, ?)
  `,

  // 🔹 첨부파일 한 건 삭제 (support_result용)
  deleteAttachmentByCodeForResult: `
    DELETE FROM attachment
    WHERE attach_code = ?
      AND linked_table_name = 'support_result'
  `,

  // 🔹 plan_code → support_result 헤더 (마지막 한 건)
  getSupportResultHeaderByPlan: `
    SELECT
      sr.result_code,
      sr.plan_code,
      sr.actual_from,
      sr.actual_to,
      sr.status,
      sr.written_at
    FROM support_result sr
    WHERE sr.plan_code = ?
    ORDER BY sr.result_code DESC
    LIMIT 1
  `,

  // 🔹 result_code → 결과 item들
  getSupportResultItemsByResultCode: `
    SELECT
      result_item_code,
      item_title,
      content_for_user,
      content_for_org,
      written_at
    FROM support_result_item
    WHERE result_code = ?
    ORDER BY result_item_code ASC
  `,

  // 🔹 result_code 기준 첨부파일 목록
  getAttachmentsBySupportResult: `
    SELECT
      attach_code,
      original_filename,
      server_filename,
      file_path
    FROM attachment
    WHERE linked_table_name = 'support_result'
      AND linked_record_pk = ?
    ORDER BY attach_code ASC
  `,

  // 🔹 resultCode로 지원결과 헤더 조회
  getSupportResultDetailByCode: `
    SELECT
      sr.result_code,
      sr.plan_code,
      sr.actual_from,
      sr.actual_to,
      sr.status,
      sr.written_at
    FROM support_result sr
    WHERE sr.result_code = ?
  `,

  // 🔹 result_code 기준으로 실제 진행기간만 수정
  updateSupportResultPeriodByCode: `
    UPDATE support_result
    SET
      actual_from = ?,
      actual_to   = ?
    WHERE result_code = ?
  `,

  // submit_code 기준 기본 정보 + 계획/결과 작성일 조회
  getResultBasicBySubmitCode: `
  SELECT
    ss.submit_code,
    -- 보호자 이름 (기존 writer_name)
    u.name              AS guardian_name,
    u.ssn               AS ssn,

    -- ✅ child 테이블 + 사용자(user) 장애유형 병합
    c.child_name        AS child_name,
    COALESCE(c.disability_type, u.disability_type) AS disability_type,

    MIN(cn.written_at)  AS counsel_submit_at,
    MAX(sp.written_at)  AS plan_submit_at,
    MAX(sr.written_at)  AS result_written_at,

    -- ✅ 담당자 이름
    MAX(ua.name)        AS assignee_name,

    -- ✅ 우선순위 (case_priority.level)
    MAX(cp.level)       AS level

  FROM survey_submission ss
  JOIN users u
    ON u.user_code = ss.written_by               -- 보호자(작성자)
  LEFT JOIN child c
    ON c.child_code = ss.child_code
  LEFT JOIN counsel_note cn
    ON cn.submit_code = ss.submit_code
  LEFT JOIN support_plan sp
    ON sp.submit_code = ss.submit_code
  LEFT JOIN support_result sr
    ON sr.plan_code = sp.plan_code
  LEFT JOIN users ua
    ON ua.user_code = sp.assi_by                 -- 담당자
  LEFT JOIN case_priority cp
    ON cp.submit_code = ss.submit_code           -- ⭐ 우선순위 조인

  WHERE ss.submit_code = ?

  GROUP BY
    ss.submit_code,
    guardian_name,
    ssn,
    child_name,
    COALESCE(c.disability_type, u.disability_type)
`,

  // 🔹 plan_code 기준으로 계획 목표 목록 조회
  getPlanGoalsByPlanCode: `
    SELECT
      item_title
    FROM support_plan_item
    WHERE plan_code = ?
    ORDER BY plan_item_code ASC
  `,

  // 🔹 submit_code 기준으로 "이미 결과가 연결된" plan_code 찾기
  getPlanCodeBySubmitFromResult: `
  SELECT
    sr.plan_code
  FROM support_result sr
  JOIN support_plan sp
    ON sp.plan_code = sr.plan_code
  WHERE sp.submit_code = ?
  ORDER BY sr.result_code DESC
  LIMIT 1
`,

  // 🔹 result_code 로 support_result 한 건 조회
  getSupportResultByCode: `
    SELECT *
    FROM support_result
    WHERE result_code = ?
    LIMIT 1
  `,

  // 🔹 지원결과 상태 변경 (예: CD5: 승인, CD7: 반려 등)
  updateSupportResultStatus: `
    UPDATE support_result
    SET status = ?
    WHERE result_code = ?
  `,

  // 🔹 해당 지원결과(result_code)에 대한 승인요청이 이미 있는지 체크
  getApprovalForResult: `
    SELECT approval_code
    FROM request_approval
    WHERE linked_table_name = 'support_result'
      AND linked_record_pk = ?
      AND approval_type = 'AE5'
      AND state IN ('BA1', 'BA2', 'BA3')
    LIMIT 1
  `,

  // 🔹 지원결과 승인요청 INSERT
  insertRequestApprovalForResult: `
    INSERT INTO request_approval (
      requester_code,
      processor_code,
      approval_type,
      request_date,
      approval_date,
      state,
      rejection_reason,
      linked_table_name,
      linked_record_pk
    ) VALUES (
      ?,          -- requester_code (담당자 user_code)
      ?,          -- processor_code (관리자 user_code, 임시로 1)
      ?,          -- approval_type (예: 'AE5')
      CURDATE(),  -- request_date
      NULL,       -- approval_date
      ?,          -- state (BA1: 요청)
      NULL,       -- rejection_reason
      ?,          -- linked_table_name ('support_result')
      ?           -- linked_record_pk (result_code)
    )
  `,

  // 🔹 지원결과 승인요청 → 승인(BA2)
  updateApprovalApproveForResult: `
  UPDATE request_approval
  SET
    state = 'BA2',              -- 승인
    approval_date = CURDATE(),
    processor_code = ?,         -- 🔹 승인 처리한 사람(user_code)
    rejection_reason = NULL
  WHERE linked_table_name = 'support_result'
    AND linked_record_pk = ?
    AND approval_type = 'AE5'
    AND state = 'BA1'
`,

  // 🔹 지원결과 승인요청 → 반려(BA3)
  updateApprovalRejectForResult: `
    UPDATE request_approval
    SET
      state = 'BA3',          -- 반려
      approval_date = CURDATE(),
      rejection_reason = ?
    WHERE linked_table_name = 'support_result'
      AND linked_record_pk = ?
      AND approval_type = 'AE5'
      AND state = 'BA1'
  `,

  // 반려사유
  getRejectReasonByResult: `
  SELECT
    rejection_reason,
    approval_date   -- 🔥 반려된 날짜
  FROM request_approval
  WHERE linked_table_name = 'support_result'
    AND linked_record_pk = ?
    AND approval_type = 'AE5'
    AND state = 'BA3'      -- 반려 상태
  ORDER BY
    approval_date DESC,
    request_date DESC,
    approval_code DESC
  LIMIT 1
`,

  // 🔹 result_code 로 plan_code 찾기 (support_result → support_plan 연결)
  getPlanCodeByResultCode: `
    SELECT plan_code
    FROM support_result
    WHERE result_code = ?
    LIMIT 1
  `,

  // 🔹 plan_code 기준으로 support_plan 상태 변경
  updateSupportPlanStatusFromResult: `
    UPDATE support_plan
    SET status = ?
    WHERE plan_code = ?
  `,
};
