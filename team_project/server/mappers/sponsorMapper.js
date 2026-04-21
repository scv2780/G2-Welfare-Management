const pool = require("../configs/db.js");
const sponsorSql = require("../sql/sponsorSql.js");

async function sponsorSQL() {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();
    const sponsorRows = await sponsorConn.query(sponsorSql.sponsor_all);
    console.log("[ sponsorConn.js || 성공 ]");
    //  console.log(sponsorRows);
    return sponsorRows;
  } catch (err) {
    console.error("[ sponsorConn.js || 실패 ]", err.message);
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}

//활동 보고서 전체 조회
async function activitySQL() {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();
    const sponsorRows = await sponsorConn.query(sponsorSql.activity_select);
    console.log("[ activitySQL.js || 성공 ]");
    //  console.log(sponsorRows);
    return sponsorRows;
  } catch (err) {
    console.error("[ activitySQL.js || 실패 ]", err.message);
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}

//활동 보고서 단건 조회
async function activity_SelectSQL(activity_code) {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();

    const activity = await sponsorConn.query(
      sponsorSql.activity_select_one,
      [activity_code]
    );

    const history = await sponsorConn.query(
      sponsorSql.activity_history_select,
      [activity_code]
    );

    return { activity, history };
  } catch (err) {
    console.error("[ activity_SelectSQL 실패 ]", err.message);
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}



async function programAddSQL(programDataArray, attachments) {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();

    // 구조분해 제거
    const result = await sponsorConn.query(
      sponsorSql.sponsor_program,
      programDataArray
    );

    const program_code = result.insertId;
    console.log("프로그램 코드:", program_code);
    console.log("[ sponsorConn.js || 프로그램 등록 쿼리 성공 ]");

    if (attachments && attachments.length > 0) {
      console.log("업로드중");
      for (const file of attachments) {
        const attachParams = [
          file.original_filename,
          file.server_filename,
          file.file_path,
          "support_program",
          program_code,
        ];
        await sponsorConn.query(sponsorSql.insertAttachment, attachParams);
      }
    }
    await sponsorConn.commit();
    return { programResult: result };
  } catch (err) {
    console.error("[ sponsorConn.js || 프로그램 등록 쿼리 실패 ]", err.message);
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}

async function programUpdateSQL(programDataArray) {
  let sponsorConn;
  console.log(programDataArray);
  try {
    sponsorConn = await pool.getConnection();
    //  쿼리와 함께 데이터 배열을 두 번째 인수로 전달
    const sponsorRows = await sponsorConn.query(
      sponsorSql.sponsor_update,
      programDataArray // <--- 이 배열이 쿼리의 Placeholder(?)에 순서대로 바인딩됨
    );
    console.log("[ programUpdateSQL.js || 프로그램 업데이트 쿼리 성공 ]");
    return sponsorRows;
  } catch (err) {
    console.error(
      "[ programUpdateSQL.js || 프로그램 업데이트 쿼리 실패 ]",
      err.message
    );
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}

async function programSearch(programCode) {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();
    const sponsorRows = await sponsorConn.query(
      sponsorSql.sponsor_search,
      [programCode] // 단건 조회이므로 program_code만 배열로 전달
    );
    const attachments = await sponsorConn.query(sponsorSql.selectAttachList, [
      programCode,
    ]);

    console.log("[ sponsorConn.js || 프로그램 단건 조회 쿼리 성공 ]");
    return { sponsorRows, attachments };
  } catch (err) {
    console.error(
      "[ sponsorConn.js || 프로그램 단건 조회 쿼리 실패 ]",
      err.message
    );
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}

// [추가] 조건 검색을 처리하는 함수를 추가합니다.
async function programSearchCondition(searchParams) {
  let sponsorConn;

  // 1. 기본 쿼리 및 위치 지정자 배열 초기화
  let sql = `SELECT 
        program_code, program_name, sponsor_type, status, start_date, end_date, 
        donation_type, donation_unit, goal_amount, current_amount, writer, 
        create_date, approval_status 
        FROM support_program WHERE 1=1`;

  const params = [];

  // 2. 프로그램 코드
  if (searchParams.programCode && searchParams.programCode !== "") {
    sql += ` AND program_code = ?`;
    params.push(searchParams.programCode);
  }

  // 3. 후원 방법
  if (searchParams.sponsorType && searchParams.sponsorType !== "") {
    sql += ` AND sponsor_type = ?`;
    params.push(searchParams.sponsorType);
  }

  // 4. 승인 상태 (status)
  if (searchParams.status && searchParams.status !== "") {
    sql += ` AND status = ?`;
    params.push(searchParams.status);
  }

  // *주의: Vue에서 'approval_status'를 보내지만, 검색 필드는 'status'를 사용합니다.
  // 백엔드 파라미터에 'approval_status'가 있다면 처리 로직을 추가합니다.
  if (searchParams.approval_status && searchParams.approval_status !== "") {
    sql += ` AND approval_status = ?`;
    params.push(searchParams.approval_status);
  }

  // 5. 날짜 범위
  // Vue에서는 빈 문자열 ''로 오기 때문에 빈 문자열을 검사해야 합니다.
  if (
    searchParams.startDate &&
    searchParams.startDate !== "" &&
    searchParams.endDate &&
    searchParams.endDate !== ""
  ) {
    sql += ` AND start_date <= ? AND end_date >= ?`;
    params.push(searchParams.endDate); // 날짜 범위 조건
    params.push(searchParams.startDate);
  }

  console.log("동적 쿼리 생성:", sql);
  console.log("동적 파라미터 배열:", params);

  try {
    sponsorConn = await pool.getConnection();
    const sponsorRows = await sponsorConn.query(
      sql,
      params // <--- 위치 지정자 (?)에 배열을 전달합니다.
    );
    console.log("[ sponsorConn.js || 프로그램 동적 조회 쿼리 성공 ]");
    return sponsorRows;
  } catch (err) {
    console.error(
      "[ sponsorConn.js || 프로그램 동적 조회 쿼리 실패 ]",
      err.message
    );
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}

// 🔹 후원계획 승인 요청 (EC2 + request_approval BA2 + support_result 생성)
async function requestApprovalProgram(programCode, requesterCode) {
  const conn = await pool.getConnection();
  console.log("매퍼 코드와 아이디" + programCode + "|" + requesterCode);
  try {
    await conn.beginTransaction();

    // 1) 프로그램 상태 변경
    await conn.query(
      "UPDATE support_program SET approval_status = '승인대기중' WHERE program_code = ?",
      [programCode]
    );

    // 2) 승인 요청 INSERT
    await conn.query(sponsorSql.insertRequestApprovalForResult, [
      requesterCode,
      1, // 관리자 (임시)
      "AE8",
      "BA1",
      "support_program",
      programCode,
    ]);

    await conn.commit();
    return { programCode };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

//승인 완료
async function approvalProgram(programCode) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1) 프로그램 상태 변경
    await conn.query(
      "UPDATE support_program SET status = '진행중', approval_status = '승인' WHERE program_code = ?",
      [programCode]
    );

    // 2) 승인 요청 업데이트
    await conn.query(sponsorSql.updateApprovalApproveForResult, [programCode]);

    await conn.commit();
    return { programCode };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 후원계획 반려 (EC3 + request_approval BA3 + 사유)
async function rejectSupportPlan(planCode, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const planId = Number(planCode);
    //planId는 프로그램 번호 reason은 반려 사유
    if (!planId) {
      throw new Error("유효한 planCode가 아닙니다.");
    }

    // 1) 프로그램 상태 변경
    await conn.query(
      "UPDATE support_program SET status = '진행전', approval_status = '반려' WHERE program_code = ?",
      [planId]
    );

    // 2) request_approval 상태 BA3(반려) + 사유 업데이트
    const result = await conn.query(sponsorSql.updateApprovalRejectForResult, [
      reason || "",
      planId,
    ]);

    await conn.commit();
    return {
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 후원계획(plan)에 대한 반려 사유,일자 조회
async function getRejectionReason(planCode) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql.getRejectReasonByPlan, [planCode]);

    if (!rows || rows.length === 0) {
      // 반려 이력이 없으면 null
      return null;
    }

    // { rejection_reason, rejection_date } 형태
    return safeJSON(rows[0]);
  } finally {
    conn.release();
  }
}
//재승인 신청
async function resubmitPlan(planCode, requesterCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 현재 support_plan 확인 (상태/submit_code 등 필요하면 여기서 확인)
    const [plan] = await conn.query(sql.getSupportPlanByCode, [planCode]);
    if (!plan) {
      throw new Error("해당 plan_code의 지원계획을 찾을 수 없습니다.");
    }

    // 2) support_plan 상태를 CC6(재승인요청)으로 변경
    await conn.query(sql.updateSupportPlanStatus, ["EC4", planCode]);

    // 3) request_approval에 새 승인요청 INSERT
    await conn.query(sql.insertRequestApprovalForPlan, [
      requesterCode, // requester_code (담당자)
      1, // processor_code (관리자, 임시)
      "AE8", // approval_type
      "BA1", // state: 요청
      "support_program",
      planCode, // linked_record_pk = plan_code
    ]);

    await conn.commit();
    return safeJSON({
      planCode,
      status: "EC3",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function payments(programDataArray) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    console.log("데이터", programDataArray);
    const result = await conn.query(sponsorSql.payments, programDataArray);

    console.log("[ sponsorConn.js || 프로그램 등록 쿼리 성공 ]");

    await conn.commit();
    return { programResult: result };
  } catch (err) {
    console.error("[ sponsorConn.js || 프로그램 등록 쿼리 실패 ]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}
//나의 후원 내역 조회
async function mygivingSQL() {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();
    const sponsorRows = await sponsorConn.query(sponsorSql.mygiving);
    console.log(sponsorRows);
    console.log("[ mygiving.js || 성공 ]");
    //  console.log(sponsorRows);
    return sponsorRows;
  } catch (err) {
    console.error("[ mygiving.js || 실패 ]", err.message);
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}
//활동 보고서 추가
async function activityAddSQL(programDataArray) {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();

    // 구조분해 제거
    const result = await sponsorConn.query(
      sponsorSql.activity,
      programDataArray
    );

    const program_code = result.insertId;
    console.log("프로그램 코드:", program_code);
    console.log("[ sponsorConn.js || 활동보고서 등록 쿼리 성공 ]");

    await sponsorConn.commit();
    return { programResult: result };
  } catch (err) {
    console.error(
      "[ sponsorConn.js || 활동보고서 등록 쿼리 실패 ]",
      err.message
    );
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}
//보고서 사용 내역 추가
async function activityHistoryAddSQL(arr) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(sponsorSql.activity_history, arr);
    await conn.commit();
  } catch (err) {
    console.error("[activityHistoryAddSQL 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}
//결제에 따른 현재 모금액 변경
async function current_amountUpdate(amount, code) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1) 현재금액 조회
    const rows = await conn.query(sponsorSql.current_amount, [code]);
    const curr_amount = rows[0].current_amount;

    // 2) 새로운 금액 계산
    const new_amount = curr_amount + amount;

    // 3) update 실행
    await conn.query(sponsorSql.update_current_amount, [new_amount, code]);

    await conn.commit();
  } catch (err) {
    console.error("[activityHistoryAddSQL 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

//활동 보고서 전체 조회
async function summaryStatement() {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();
    const sponsorRows = await sponsorConn.query(sponsorSql.summaryStatement);
    console.log("[ summaryStatement.js || 성공 ]");
    //  console.log(sponsorRows);
    return sponsorRows;
  } catch (err) {
    console.error("[ summaryStatement.js || 실패 ]", err.message);
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}

//활동 보고서 단건 조회
async function summaryStatementSelect(activity_code) {
  let sponsorConn;
  try {
    sponsorConn = await pool.getConnection();
    const sponsorRows = await sponsorConn.query(
      sponsorSql.summaryStatementSelect,
      [activity_code]
    );
    console.log("[ summaryStatementSelect.js || 성공 ]");
    //  console.log(sponsorRows);
    return sponsorRows;
  } catch (err) {
    console.error("[ summaryStatementSelect.js || 실패 ]", err.message);
    throw err;
  } finally {
    if (sponsorConn) sponsorConn.release();
  }
}

module.exports = {
  sponsorSQL,
  programAddSQL,
  programSearch,
  programSearchCondition,
  programUpdateSQL,
  requestApprovalProgram,
  approvalProgram,
  rejectSupportPlan,
  getRejectionReason,
  resubmitPlan,
  payments,
  mygivingSQL,
  activityAddSQL,
  activitySQL,
  activityHistoryAddSQL,
  current_amountUpdate,
  summaryStatement,
  summaryStatementSelect,activity_SelectSQL
};
