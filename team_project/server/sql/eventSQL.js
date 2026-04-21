// Table : event, sub_event, event_apply, event_result

// 이벤트 메인페이지
const selectEventMainpage = `
  SELECT 
    e.event_code,
    e.event_name,
    e.event_start_date,
    e.event_end_date,
    e.recruit_start_date,
    e.recruit_end_date,
    e.max_participants,
    COALESCE(SUM(se.sub_recruit_count), 0) AS total_sub_recruit_count,
    a.server_filename,
    a.file_path
  FROM event e
  LEFT JOIN sub_event se ON e.event_code = se.event_code
  LEFT JOIN (
    SELECT linked_record_pk, MIN(server_filename) AS server_filename, MIN(file_path) AS file_path
    FROM attachment
    WHERE linked_table_name = 'event'
      AND LOWER(SUBSTRING_INDEX(original_filename, '.', -1)) IN ('jpg', 'jpeg', 'png', 'gif')
    GROUP BY linked_record_pk
  ) a ON e.event_code = a.linked_record_pk
  GROUP BY e.event_code
  ORDER BY e.event_code DESC
`;

// 이벤트 목록(검색조건)
const selectEventList = `
  SELECT 
    e.event_code,
    e.user_code,
    e.event_name,
    e.target_audience,
    e.event_register_date,
    e.event_start_date,
    e.event_end_date,
    e.recruit_start_date,
    e.recruit_end_date,
    e.max_participants,
    COALESCE(SUM(se.sub_recruit_count), 0) AS total_sub_recruit_count,
    a.server_filename,
    a.file_path,
    e.org_code,
    org.org_name AS org_name,
    u.name AS main_manager_name,
    e.register_status
  FROM event e
  LEFT JOIN sub_event se ON e.event_code = se.event_code
  LEFT JOIN (
    SELECT linked_record_pk, MIN(server_filename) AS server_filename, MIN(file_path) AS file_path
    FROM attachment
    WHERE linked_table_name = 'event'
      AND LOWER(SUBSTRING_INDEX(original_filename, '.', -1)) IN ('jpg', 'jpeg', 'png', 'gif')
    GROUP BY linked_record_pk
  ) a ON e.event_code = a.linked_record_pk
  LEFT JOIN organization org ON e.org_code = org.org_code
  LEFT JOIN users u ON e.user_code = u.user_code
  WHERE 1=1
    -- 모집상태
    AND (? IS NULL OR e.recruit_status = ?)
    -- 모집기간
    AND (? IS NULL OR e.recruit_start_date >= ?)
    AND (? IS NULL OR e.recruit_end_date <= ?)
    -- 시행기간
    AND (? IS NULL OR e.event_start_date >= ?)
    AND (? IS NULL OR e.event_end_date <= ?)
    -- 이벤트명
    AND (? IS NULL OR e.event_name LIKE CONCAT('%', ?, '%'))
    -- 등록 상태가 승인인 이벤트만 조회
    AND e.register_status = 'BA2'
  GROUP BY e.event_code
  ORDER BY e.event_code DESC
`;

// 이벤트 작성자별 계획/결과 목록(검색조건)
const selectEventApplyResult = `
  SELECT 
    e.event_code,
    e.user_code,
    e.event_name,
    e.event_register_date,
    e.event_start_date,
    e.event_end_date,
    e.recruit_start_date,
    e.recruit_end_date,
    e.max_participants,
    COALESCE(SUM(se.sub_recruit_count), 0) AS total_sub_recruit_count,
    a.server_filename,
    a.file_path,
    org.org_name AS org_name,
    u.name AS main_manager_name,
    e.register_status,
    er.event_result_code,
    er.result_status
  FROM event e
  LEFT JOIN sub_event se ON e.event_code = se.event_code
  LEFT JOIN (
    SELECT linked_record_pk, MIN(server_filename) AS server_filename, MIN(file_path) AS file_path
    FROM attachment
    WHERE linked_table_name = 'event'
      AND LOWER(SUBSTRING_INDEX(original_filename, '.', -1)) IN ('jpg', 'jpeg', 'png', 'gif')
    GROUP BY linked_record_pk
  ) a ON e.event_code = a.linked_record_pk
  LEFT JOIN organization org ON e.org_code = org.org_code
  LEFT JOIN users u ON e.user_code = u.user_code
  LEFT JOIN event_result er ON er.event_code = e.event_code
  WHERE 1=1
    -- 모집상태
    AND (? IS NULL OR e.recruit_status = ?)
    -- 모집기간
    AND (? IS NULL OR e.recruit_start_date >= ?)
    AND (? IS NULL OR e.recruit_end_date <= ?)
    -- 시행기간
    AND (? IS NULL OR e.event_start_date >= ?)
    AND (? IS NULL OR e.event_end_date <= ?)
    -- 이벤트명
    AND (? IS NULL OR e.event_name LIKE CONCAT('%', ?, '%'))
    -- 이벤트 등록자명
    AND ( ? = 'AA3' OR e.user_code = ?)
  GROUP BY e.event_code
  ORDER BY e.event_code DESC
`;

// 첨부파일 등록
const insertAttachment = `
INSERT INTO attachment (
  original_filename,
  server_filename,
  file_path,
  linked_table_name,
  linked_record_pk
) VALUES (?, ?, ?, ?, ?)
`;

// 이벤트 첨부파일 조회
const selectAttachList = `
SELECT
    attach_code,
    original_filename,
    server_filename,
    file_path
FROM attachment
WHERE linked_table_name = 'event'
  AND linked_record_pk = ?
`;

// 결과보고서 첨부파일 조회
const selectResultAttachList = `
SELECT
    attach_code,
    original_filename,
    server_filename,
    file_path
FROM attachment
WHERE linked_table_name = 'event_result'
  AND linked_record_pk = ?
`;

// 매니저 등록
const insertManager = `
INSERT INTO manager (
  manager_category,
  manager_category_code,
  manager_type,
  user_code
) VALUES (?, ?, ?, ?)
`;

// 해당 이벤트 매니저 조회
const selectManager = `
SELECT
    u.user_id,
    u.phone,
    u.email,
    u.department,
    m.manager_num,
    u.name AS manager_name,
    m.manager_type,
    m.manager_category
FROM manager m
LEFT JOIN users u ON m.user_code = u.user_code
WHERE m.manager_category_code IS NOT NULL
  AND m.manager_type IN ('DA1','DA2')
  AND m.manager_category = 'DB2'
  AND m.manager_category_code = ?
`;

// 매니저 전체 조회
const selectManagerAll = `
  SELECT 
    user_code
   ,name
   ,org_code
  FROM users
  WHERE role = 'AA2'
  AND is_active = 1
`;

// 이벤트 단건조회
const selectEventOne = `
SELECT 
    e.event_code,
    e.user_code,
    e.event_name,
    e.event_content,
    e.event_location,
    e.target_audience,
    e.max_participants,
    e.recruit_start_date,
    e.recruit_end_date,
    e.event_start_date,
    e.event_end_date,
    e.recruit_status, -- 코드값만
    e.register_status, -- 코드값만
    e.event_type,     -- 코드값만
    org.org_name AS org_name,
    u.name AS main_manager_name
FROM event e
LEFT JOIN organization org ON e.org_code = org.org_code
LEFT JOIN users u ON e.user_code = u.user_code
WHERE e.event_code = ?
`;

// 결과보고서 승인 유무
const selectResultStatus = `
  SELECT e.event_code
		    ,er.result_status
  FROM event e
  join event_result er on e.event_code = er.event_code
`;

// 이벤트 등록
const insertEvent = `
INSERT INTO event (
  org_code
 ,user_code
 ,event_name
 ,event_type
 ,event_content
 ,event_location
 ,target_audience
 ,max_participants
 ,recruit_start_date
 ,recruit_end_date
 ,event_start_date
 ,event_end_date
 ,recruit_status
 ,event_register_date
 ,register_status)
VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
`;

// 이벤트 신청 내역 등록
const insertEventApply = `
INSERT INTO event_apply (
  apply_date
 ,apply_type 
 ,user_code
 ,event_code
 ,sub_event_code)
VALUES ( ?, ?, ?, ?, ? )
`;

// 이벤트 신청 내역 조회
const selectEventApplyList = `
SELECT
    ea.apply_code,
    DATE_FORMAT(ea.apply_date, '%Y-%m-%d') AS apply_date,
    ea.apply_type,
    ea.apply_status,
    ea.user_code,
    ea.event_code,
    ea.sub_event_code,
    e.event_name,
    e.target_audience,
    se.sub_event_name,
    se.sub_event_start_date,
    se.sub_event_end_date,
    se.sub_recruit_count,
    -- 신청일정
    CASE
        WHEN ea.apply_type = 'DD1' THEN 
            CONCAT(
                DATE_FORMAT(e.event_start_date, '%Y-%m-%d'),
                ' ~ ',
                DATE_FORMAT(e.event_end_date, '%Y-%m-%d')
            )
        WHEN ea.apply_type = 'DD2' THEN 
            CONCAT(
                DATE_FORMAT(se.sub_event_start_date, '%Y-%m-%d %H:%i'),
                ' ~ ',
                DATE_FORMAT(se.sub_event_end_date, '%Y-%m-%d %H:%i')
            )
        ELSE '-'
    END AS apply_period,
    -- 신청인원
    CASE
        WHEN ea.apply_type = 'DD1' THEN
            (SELECT COUNT(*) FROM event_apply ea2 WHERE ea2.event_code = ea.event_code AND ea2.sub_event_code IS NULL)
        WHEN ea.apply_type = 'DD2' THEN
            (SELECT COUNT(*) FROM event_apply ea2 WHERE ea2.sub_event_code = ea.sub_event_code)
        ELSE 0
    END AS current_count,
    -- 마감인원
    CASE
        WHEN ea.apply_type = 'DD1' THEN e.max_participants
        WHEN ea.apply_type = 'DD2' THEN se.sub_recruit_count
        ELSE 0
    END AS max_count
FROM event_apply ea
LEFT JOIN event e ON ea.event_code = e.event_code
LEFT JOIN sub_event se ON ea.sub_event_code = se.sub_event_code
WHERE ea.user_code = ?
ORDER BY ea.apply_date DESC
`;

// 이벤트 신청자 수 조회
const selectEventApplyCount = `
SELECT
    ea.apply_code,
    DATE_FORMAT(ea.apply_date, '%Y-%m-%d') AS apply_date,
    ea.apply_type,
    ea.apply_status,
    ea.user_code,
    ea.event_code,
    ea.sub_event_code,
    e.event_name,
    se.sub_event_name,
    se.sub_event_start_date,
    se.sub_event_end_date,
    se.sub_recruit_count,
    -- 신청일정
    CASE
        WHEN ea.apply_type = 'DD1' THEN 
            CONCAT(
                DATE_FORMAT(e.event_start_date, '%Y-%m-%d'),
                ' ~ ',
                DATE_FORMAT(e.event_end_date, '%Y-%m-%d')
            )
        WHEN ea.apply_type = 'DD2' THEN 
            CONCAT(
                DATE_FORMAT(se.sub_event_start_date, '%Y-%m-%d %H:%i'),
                ' ~ ',
                DATE_FORMAT(se.sub_event_end_date, '%Y-%m-%d %H:%i')
            )
        ELSE '-'
    END AS apply_period,
    -- 신청인원
    CASE
        WHEN ea.apply_type = 'DD1' THEN
            -- DD1: 해당 이벤트 전체 신청인원 (sub_event_code 없음)
            (SELECT COUNT(*) FROM event_apply ea2 WHERE ea2.event_code = ea.event_code AND ea2.sub_event_code IS NULL)
        WHEN ea.apply_type = 'DD2' THEN
            -- DD2: 세부 이벤트별 신청인원
            (SELECT COUNT(*) FROM event_apply ea2 WHERE ea2.sub_event_code = ea.sub_event_code)
        ELSE 0
    END AS current_count,
    -- 총 이벤트 신청인원
    CASE
        WHEN ea.apply_type = 'DD1' THEN 
          (SELECT COUNT(*) 
          FROM event_apply ea2 
          WHERE ea2.event_code = ea.event_code)
        WHEN ea.apply_type = 'DD2' THEN
          (SELECT COUNT(*) 
          FROM event_apply ea2 
          WHERE ea2.event_code = ea.event_code)
        ELSE 0
    END AS total_event_count
FROM event_apply ea
LEFT JOIN event e ON ea.event_code = e.event_code
LEFT JOIN sub_event se ON ea.sub_event_code = se.sub_event_code
WHERE e.event_code = ?
ORDER BY ea.apply_date DESC
`;

// 이벤트 신청 취소
const deleteEventApply = `
DELETE FROM event_apply
WHERE apply_code = ?
`;

// 이벤트 중복 신청 체크
const selectEventApplyExist = `
SELECT
  COUNT(*) AS cnt
 ,user_code
 ,event_code
 ,sub_event_code       
FROM event_apply
WHERE user_code = ?
  AND event_code = ?
  AND (sub_event_code = ? OR (sub_event_code IS NULL AND ? IS NULL))
`;

// 세부 이벤트 조회
const selectSubEventList = `
  SELECT 
    sub_event_code,
    sub_event_name,
    sub_event_start_date,
    sub_event_end_date,
    sub_recruit_count
FROM sub_event
WHERE event_code = ?
ORDER BY sub_event_code ASC
`;

// 세부 이벤트 등록
const insertSubEvent = `
INSERT INTO sub_event (
   sub_event_name
  ,sub_event_start_date
  ,sub_event_end_date
  ,sub_recruit_count
  ,event_code)
VALUES ( ?, ?, ?, ?, ? )
`;

// 세부 이벤트 수정
const updateSubEvent = `
UPDATE sub_event
SET ?
WHERE sub_event_code = ?
`;

// 세부 이벤트 삭제
const deleteSubEvent = `
DELETE FROM sub_event
WHERE sub_event_code = ?`;

// 해당 이벤트에 대한 승인요청이 이미 있는지 체크
const getApprovalForPlan = `
SELECT approval_code 
      FROM request_approval
      WHERE linked_table_name = 'event'
        AND linked_record_pk = ?
        AND approval_type = 'AE6'
        AND state IN ('BA1', 'BA2', 'BA3')
      LIMIT 1
`;

// 🔹 이벤트 계획 승인요청 INSERT
const insertRequestApprovalForPlan = `
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
      ?,          -- approval_type (예: 'AE6')
      CURDATE(),  -- request_date
      NULL,       -- approval_date
      ?,          -- state (BA1: 요청)
      NULL,       -- rejection_reason
      ?,          -- linked_table_name ('event')
      ?           -- linked_record_pk (event_code)
    )
  `;

// 🔹 이벤트계획 승인요청 → 승인(BA2)
const updateApprovalApproveForPlan = `
    UPDATE request_approval
    SET
      state = 'BA2',          -- 승인
      approval_date = CURDATE(),
      rejection_reason = NULL
    WHERE linked_table_name = 'event'
      AND linked_record_pk = ?
      AND approval_type = 'AE6'
      AND state = 'BA1'
  `;

// 🔹 이벤트 계획 승인요청 → 반려(BA3)
const updateApprovalRejectForPlan = `
    UPDATE request_approval
    SET
      state = 'BA3',          -- 반려
      approval_date = CURDATE(),
      rejection_reason = ?
    WHERE linked_table_name = 'event'
      AND linked_record_pk = ?
      AND approval_type = 'AE6'
      AND state = 'BA1'
  `;

// 반려사유
const getRejectReasonByPlan = `
  SELECT
    rejection_reason,
    approval_date AS rejection_date   --  반려된 날짜
  FROM request_approval
  WHERE linked_table_name = 'event'
    AND linked_record_pk = ?
    AND approval_type = 'AE6'
    AND state = 'BA3'      -- 반려 상태
  ORDER BY
    approval_date DESC,
    request_date DESC,
    approval_code DESC
  LIMIT 1
`;

const updateEventStatus = `
    UPDATE event
    SET register_status = ?
    WHERE event_code = ?
  `;

// 결과보고서 등록
const insertEventResult = `
INSERT INTO event_result (
  result_status
 ,result_subject
 ,result_content
 ,report_register_date
 ,event_code)
VALUES ( ?, ?, ?, ?, ? )
`;

// 결과보고서 단건조회
const selectResultOne = `
SELECT 
    event_result_code,
    event_code,
    result_status,
    result_subject,
    result_content,
    report_register_date
FROM event_result
WHERE event_result_code = ?
`;

// 해당 결과보고서에 대한 승인요청이 이미 있는지 체크
const getApprovalForResult = `
SELECT approval_code 
      FROM request_approval
      WHERE linked_table_name = 'event_result'
        AND linked_record_pk = ?
        AND approval_type = 'AE7'
        AND state IN ('BA1', 'BA2', 'BA3')
      LIMIT 1
`;

// 🔹 결과보고서 승인요청 INSERT
const insertRequestApprovalForResult = `
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
      ?,          -- approval_type (예: 'AE7')
      CURDATE(),  -- request_date
      NULL,       -- approval_date
      ?,          -- state (BA1: 요청)
      NULL,       -- rejection_reason
      ?,          -- linked_table_name ('event_result')
      ?           -- linked_record_pk (event_result_code)
    )
  `;

// 🔹 결과보고서 승인요청 → 승인(BA2)
const updateApprovalApproveForResult = `
    UPDATE request_approval
    SET
      state = 'BA2',          -- 승인
      approval_date = CURDATE(),
      rejection_reason = NULL
    WHERE linked_table_name = 'event_result'
      AND linked_record_pk = ?
      AND approval_type = 'AE7'
      AND state = 'BA1'
  `;

// 🔹 결과보고서 승인요청 → 반려(BA3)
const updateApprovalRejectForResult = `
    UPDATE request_approval
    SET
      state = 'BA3',          -- 반려
      approval_date = CURDATE(),
      rejection_reason = ?
    WHERE linked_table_name = 'event_result'
      AND linked_record_pk = ?
      AND approval_type = 'AE7'
      AND state = 'BA1'
  `;

// 반려사유
const getRejectReasonByResult = `
  SELECT
    rejection_reason,
    approval_date AS rejection_date   --  반려된 날짜
  FROM request_approval
  WHERE linked_table_name = 'event_result'
    AND linked_record_pk = ?
    AND approval_type = 'AE7'
    AND state = 'BA3'      -- 반려 상태
  ORDER BY
    approval_date DESC,
    request_date DESC,
    approval_code DESC
  LIMIT 1
`;

// 이벤트 상태 업데이트
const updateEventResultStatus = `
    UPDATE event_result
    SET result_status = ?
    WHERE event_result_code = ?
  `;

// 이벤트 수정
const updateEvent = `
UPDATE event
SET ?
WHERE event_code = ?
`;

// 이벤트 삭제
const deleteEvent = `
DELETE FROM event
WHERE event_code = ?`;

// 참가자 목록
const selectAttendance = `
  SELECT 
      ea.apply_code,
      ea.apply_date,
      ea.apply_status,
      ea.attend_status,

      -- 신청자 정보
      u2.name AS applicant_name,
      u2.ssn AS applicant_ssn,
      u2.phone AS applicant_phone,
      u2.address AS applicant_address,
      u2.email AS applicant_email,
      u2.org_code AS applicant_org_code,

      -- 자녀 정보 (한 명)
      c.child_name,
      c.gender AS child_gender,
      c.ssn AS child_ssn,

      -- 기관 정보
      o.org_name AS applicant_org_name,

      -- 이벤트 / 서브 이벤트 / 매니저
      e.event_code,
      e.event_name,
      e.user_code,
      u.name AS manager_name,
      se.sub_event_code,
      se.sub_event_name

  FROM event_apply ea
  LEFT JOIN users u2 ON ea.user_code = u2.user_code
  LEFT JOIN child c ON u2.user_code = c.user_code
  LEFT JOIN organization o ON u2.org_code = o.org_code
  LEFT JOIN event e ON ea.event_code = e.event_code
  LEFT JOIN users u ON e.user_code = u.user_code
  LEFT JOIN sub_event se ON ea.sub_event_code = se.sub_event_code
  WHERE 1=1
    AND (ea.apply_status LIKE ? OR ? IS NULL)
    AND (e.event_name LIKE ? OR ? IS NULL)
    AND (u.name LIKE ? OR ? IS NULL)
  ORDER BY ea.apply_date DESC
  LIMIT ? OFFSET ?
`;

// 내가 등록한 이벤트 참가자 목록
const selectMyAttendance = `
  SELECT 
      ea.apply_code,
      ea.apply_date,
      ea.apply_status,
      ea.attend_status,

      -- 신청자 정보
      u2.name AS applicant_name,
      u2.ssn AS applicant_ssn,
      u2.phone AS applicant_phone,
      u2.address AS applicant_address,
      u2.email AS applicant_email,
      u2.org_code AS applicant_org_code,

      -- 자녀 정보 (한 명)
      c.child_name,
      c.gender AS child_gender,
      c.ssn AS child_ssn,

      -- 이벤트 / 서브 이벤트 / 매니저
      e.event_code,
      e.event_name,
      e.user_code,
      u.name AS manager_name

  FROM event_apply ea
  LEFT JOIN users u2 ON ea.user_code = u2.user_code
  LEFT JOIN child c ON u2.user_code = c.user_code
  LEFT JOIN event e ON ea.event_code = e.event_code
  LEFT JOIN users u ON e.user_code = u.user_code
  WHERE ea.event_code = ?
  ORDER BY ea.apply_date DESC
`;

// 참가자/자녀 단건 조회
const selectAttendanceOne = `
  SELECT 
      ea.apply_code,
      ea.apply_date,
      ea.apply_status,
      ea.attend_status,

      -- 신청자 정보
      u2.name AS applicant_name,
      u2.ssn AS applicant_ssn,
      u2.phone AS applicant_phone,
      u2.address AS applicant_address,
      u2.email AS applicant_email,
      u2.org_code AS applicant_org_code,

      -- 자녀 정보 (한 명)
      c.child_name,
      c.gender AS child_gender,
      c.ssn AS child_ssn,

      -- 기관 정보
      o.org_name AS applicant_org_name,

      -- 이벤트 / 서브 이벤트 / 매니저
      e.event_code,
      e.event_name,
      u.name AS manager_name,
      se.sub_event_code,
      se.sub_event_name

  FROM event_apply ea
  LEFT JOIN users u2 ON ea.user_code = u2.user_code
  LEFT JOIN child c ON u2.user_code = c.user_code
  LEFT JOIN organization o ON u2.org_code = o.org_code
  LEFT JOIN event e ON ea.event_code = e.event_code
  LEFT JOIN users u ON e.user_code = u.user_code
  LEFT JOIN sub_event se ON ea.sub_event_code = se.sub_event_code
  WHERE ea.apply_code = ?
`;

const countAttendance = `
  SELECT COUNT(*) AS cnt
    FROM event_apply ea
    LEFT JOIN event e ON ea.event_code = e.event_code
    LEFT JOIN users u ON e.user_code = u.user_code
    WHERE 1=1
      AND (ea.apply_status LIKE ? OR ? IS NULL)
      AND (e.event_name LIKE ? OR ? IS NULL)
      AND (u.name LIKE ? OR ? IS NULL)
`;

// // 해당 신청내역에 대한 승인요청이 이미 있는지 체크
// const getApprovalForMyApply = `
// SELECT apply_code
//       FROM event_apply
//       WHERE apply_code = ?
//       AND apply_status IN ('DE1', 'DE2', 'DE4')
//       LIMIT 1
// `;

// 🔹 이벤트 신청 승인요청 → 승인(DE2)
const updateApprovalApproveForMyApply = `
    UPDATE event_apply
    SET
      apply_status = 'DE2',          -- 승인
      approval_date = CURDATE()
    WHERE apply_code = ?
      AND apply_status = 'DE1'
  `;

// 🔹 이벤트 신청 승인요청 → 취소(DE4)
const updateApprovalRejectForMyApply = `
    UPDATE event_apply
    SET
      apply_status = 'DE4',          -- 취소
      approval_date = CURDATE()
    WHERE apply_code = ?
      AND apply_status = 'DE1'
  `;

module.exports = {
  selectEventMainpage,
  selectEventList,
  selectEventOne,
  insertEvent,
  insertEventApply,
  updateEvent,
  deleteEvent,
  selectSubEventList,
  insertSubEvent,
  updateSubEvent,
  deleteSubEvent,
  insertAttachment,
  insertManager,
  selectAttachList,
  selectManager,
  selectEventApplyExist,
  selectEventApplyList,
  deleteEventApply,
  selectEventApplyResult,
  getApprovalForPlan,
  insertRequestApprovalForPlan,
  updateApprovalApproveForPlan,
  updateApprovalRejectForPlan,
  getRejectReasonByPlan,
  updateEventStatus,
  insertEventResult,
  selectResultOne,
  getApprovalForResult,
  insertRequestApprovalForResult,
  updateApprovalApproveForResult,
  updateApprovalRejectForResult,
  getRejectReasonByResult,
  updateEventResultStatus,
  selectResultAttachList,
  selectManagerAll,
  selectAttendance,
  countAttendance,
  selectAttendanceOne,
  // getApprovalForMyApply,
  updateApprovalApproveForMyApply,
  updateApprovalRejectForMyApply,
  selectMyAttendance,
  selectResultStatus,
  selectEventApplyCount,
};
