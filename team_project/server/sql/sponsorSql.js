//전체 조회
const sponsor_all = `select 
  program_code,
	program_name,
    sponsor_type,
    status,
    start_date,
    end_date,
    donation_type,
    donation_unit,
    goal_amount,
    current_amount,
    writer,
    create_date,
    approval_status
 from support_program`;

//단건 조회
const sponsor_search = `select
    program_code,
	  program_name,
    sponsor_type,
    status,
    start_date,
    end_date,
    donation_type,
    donation_unit,
    goal_amount,
    current_amount,
    writer,
    create_date,
    approval_status
 from support_program
 where program_code = ?`;

// //조건 조회
// const sponsor_search_condition = `select
//             program_code,
//             program_name,
//             sponsor_type,
//             status,
//             start_date,
//             end_date,
//             donation_type,
//             donation_unit,
//             goal_amount,
//             current_amount,
//             writer,
//             create_date,
//             approval_status
//      from support_program
//     where 1=1
//     AND program_code = IFNULL(:programCode, program_code)
//     AND sponsor_type = IFNULL(:sponsorType, sponsor_type)
//     AND status = IFNULL(:status, status)
//     AND (
//         (start_date <= :endDate AND end_date >= :startDate)
//         OR (:startDate IS NULL OR :startDate = '')
//     )
//  `;
//등록
const sponsor_program = `
  insert into support_program  (
    program_name,
    sponsor_type,
    status,
    start_date,
    end_date,
    donation_type,
    donation_unit,
    goal_amount,
    current_amount,
    writer,
    create_date,
    approval_status
)    
values (?,?,?,?,?,?,?,?,0,?,?,?)
 `;

//수정
const sponsor_update = `
  update support_program set
    program_name = ?,
    sponsor_type = ?,
    status = ?,
    start_date = ?,
    end_date = ?,
    donation_type = ?,
    donation_unit = ?,
    goal_amount = ?,
    approval_status = ?
    where program_code = ?
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

// 첨부파일 조회
const selectAttachList = `
SELECT
    attach_code,
    original_filename,
    server_filename,
    file_path
FROM attachment
WHERE linked_table_name = 'support_program'
  AND linked_record_pk = ?
`;

// 첨부파일 한 건 삭제
const deleteAttachmentByCode = `
    DELETE FROM attachment
    WHERE linked_record_pk = ?
      AND linked_table_name = 'support_program'
  `;

// 🔹 지원결과 승인요청 INSERT
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
      ?,          -- approval_type (예: 'AE8')
      CURDATE(),  -- request_date
      NULL,       -- approval_date
      ?,          -- state (EC1: 요청)
      NULL,       -- rejection_reason
      ?,          -- linked_table_name ('support_program')
      ?           -- linked_record_pk (program_code)
    )
  `;

// 🔹 지원결과 승인요청 → 승인(BA2)
const updateApprovalApproveForResult = `
    UPDATE request_approval
    SET
      state = 'BA2',          -- 승인
      approval_date = CURDATE(),
      rejection_reason = NULL
    WHERE linked_table_name = 'support_program'
      AND linked_record_pk = ?
      AND approval_type = 'AE8'
      AND state = 'BA1'
  `;

// 🔹 지원결과 승인요청 → 반려(EC3)
const updateApprovalRejectForResult = `
    UPDATE request_approval
    SET
      state = 'BA3',          -- 반려
      approval_date = CURDATE(),
      rejection_reason = ?
    WHERE linked_table_name = 'support_program'
      AND linked_record_pk = ?
      AND approval_type = 'AE8'
      AND state = 'BA1'
  `;

// 반려사유
const getRejectReasonByResult = `
  SELECT
    rejection_reason,
    approval_date   --  반려된 날짜
  FROM request_approval
  WHERE linked_table_name = 'support_program'
    AND linked_record_pk = ?
    AND approval_type = 'AE8'
    AND state = 'BA3'      -- 반려 상태
  ORDER BY
    approval_date DESC,
    request_date DESC,
    approval_code DESC
  LIMIT 1
`;

const updateSupportResultStatus = `
    UPDATE support_program
    SET status = ?
    WHERE program_code = ?
  `;

// 후원 결제 삽입
const payments = `
    insert into support_transaction (
    transaction_type,
    userID, 
    transaction_amount, 
    payment_method,
    donation_datetime, 
    deposit_date,
    status, 
    program_code )
    values ('단기',?,?,'카카오페이',now(),CURDATE(),'완료',?
    );
  
  `;
//후원 결제 조회
const mygiving = `
  SELECT
    p.program_name,
    p.sponsor_type,
    p.status,
    p.start_date,
    p.end_date,
    p.goal_amount,
    t.transaction_amount,
    t.program_code,
    p.writer,
    t.deposit_date,
    t.userID
FROM
    support_transaction t
INNER JOIN
    support_program p ON t.program_code = p.program_code;
    `;

//활동 보고서 조회
const activity_select = `
select
	p.program_name,
	s.activity_code,
    s.writer,
    s.title,
    s.content,
    s.create_date,
    s.used_amount, -- 전체 사용 금액 sum()
    s.program_code,
    p.goal_amount
from support_activity s left join
support_program p on s.program_code = p.program_code
;
`;
//활동 보고서 단건 조회
const activity_select_one = `
select
	p.program_name,
	s.activity_code,
    s.writer,
    s.title,
    s.content,
    s.create_date,
    s.used_amount, -- 전체 사용 금액 sum()
    s.program_code,
    p.goal_amount
from support_activity s left join
support_program p on s.program_code = p.program_code
where s.activity_code = ?
;
`;

//활동 보고서 삽입
const activity = `
insert into 
	support_activity(
		    writer,
        title,
        content,
        create_date,
        used_amount,
        program_code
    )
    values(?,?,?,CURDATE(),?,?);
`;

//활동 보고서 추가 사항 삽입
const activity_history = `
   insert into  donation_expenditure(
    activity_code,
    usage_item,
    recipient,
    amount,
    used_at)
    values(?,?,?,?,?)
;
`;
//활동 보고서 내역 합계 금액
const activity_history_sum = `
SELECT
    sum(d.amount)
FROM
    support_activity s
right JOIN
    donation_expenditure d ON s.activity_code = d.activity_code
where s.activity_code = ? ;
`;

//활동 보고서 내역 조회
const activity_history_select = `
SELECT
    d.id,
    d.activity_code,
    d.usage_item,
    d.recipient,
    d.amount,
    d.used_at
FROM
    support_activity s
right JOIN
    donation_expenditure d ON s.activity_code = d.activity_code
where s.activity_code = ?;
`;

// 현재금액 조회
const current_amount = `
select program_code,
current_amount from support_program where program_code = ?;
`;
//금액 변경
const update_current_amount = `
update 
support_program 
set 
current_amount = ? where program_code = ?;
`;

// 총괄 내역서
const summaryStatement = `
SELECT 
    o.org_name,
    sp.program_name ,
    sp.start_date,
    sp.end_date,
    sp.goal_amount ,
    sp.current_amount ,
    IFNULL(SUM(de.amount), 0) as useAmount ,
    (sp.current_amount - IFNULL(SUM(de.amount), 0))  as remainder
	,sa.activity_code,
  sp.program_code
FROM support_program sp
LEFT JOIN users u
    ON sp.writer = u.user_id     
LEFT JOIN organization o
    ON u.org_code = o.org_code
LEFT JOIN support_activity sa
    ON sp.program_code = sa.program_code
LEFT JOIN donation_expenditure de
    ON sa.activity_code = de.activity_code
GROUP BY 
    o.org_name,
    sp.program_name,
    sp.start_date,
    sp.end_date,
    sp.goal_amount,
    sp.current_amount
    ,sa.activity_code
    ;
`;

// 총괄 내역서 단건
const summaryStatementSelect = `
SELECT
    sp.program_name,
    de.used_at,
    de.usage_item,
    de.recipient,
    de.amount,

    sp.current_amount AS totalDonation,

    t.totalUsedAmount,
    (sp.current_amount - t.totalUsedAmount) AS remainder

FROM support_program sp

LEFT JOIN support_activity sa
    ON sp.program_code = sa.program_code

LEFT JOIN donation_expenditure de
    ON sa.activity_code = de.activity_code

LEFT JOIN (
    SELECT 
        sa.program_code,
        SUM(de.amount) AS totalUsedAmount
    FROM support_activity sa
    LEFT JOIN donation_expenditure de
        ON sa.activity_code = de.activity_code
    GROUP BY sa.program_code
) t ON t.program_code = sp.program_code

WHERE sp.program_code = ?
ORDER BY de.used_at ASC;

`;

module.exports = {
  sponsor_all,
  sponsor_program,
  sponsor_search,
  // sponsor_search_condition,
  sponsor_update,
  insertAttachment,
  selectAttachList,
  deleteAttachmentByCode,
  insertRequestApprovalForResult,
  updateApprovalApproveForResult,
  updateApprovalRejectForResult,
  getRejectReasonByResult,
  updateSupportResultStatus,
  payments,
  mygiving,
  activity,
  activity_select,
  activity_history,
  activity_history_sum,
  activity_history_select,
  current_amount,
  update_current_amount,
  activity_select_one,
  summaryStatement,
  summaryStatementSelect,
};
