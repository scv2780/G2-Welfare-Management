// eventMapper.js
const pool = require("../configs/db.js");
const eventSQL = require("../sql/eventSQL.js");

const moment = require("moment");
const commonCodeService = require("../services/commonCodeService.js");

function safeJSON(v) {
  return JSON.parse(
    JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x))
  );
}
// ==========================
// 이벤트
// ==========================

// ✅ 이벤트 메인페이지
async function selectEventMainpage() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(eventSQL.selectEventMainpage);
    console.log("[eventMapper.js || 이벤트 메인페이지 목록 조회 성공]", rows);
    return rows;
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트 메인페이지 목록 조회 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 이벤트 목록
async function selectEventList(filters) {
  let conn;
  try {
    conn = await pool.getConnection();

    const params = [
      filters.recruit_status,
      filters.recruit_status,
      filters.recruit_start_date,
      filters.recruit_start_date,
      filters.recruit_end_date,
      filters.recruit_end_date,
      filters.event_start_date,
      filters.event_start_date,
      filters.event_end_date,
      filters.event_end_date,
      filters.event_name,
      filters.event_name,
      filters.register_status,
    ];

    const rows = await conn.query(eventSQL.selectEventList, params);
    if (!rows || !rows.length) return [];

    for (const event of rows) {
      event.register_status_name = await commonCodeService.getCodeName(
        "DF",
        event.register_status
      );
    }

    console.log("[eventMapper.js || 이벤트 목록 조회 성공]", rows);
    return rows;
  } catch (err) {
    console.error("[eventMapper.js || 이벤트 목록 조회 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 이벤트 작성자별 계획/결과 목록(검색조건)
async function selectEventApplyResult(filters) {
  let conn;
  try {
    conn = await pool.getConnection();

    const params = [
      filters.recruit_status,
      filters.recruit_status,
      filters.recruit_start_date,
      filters.recruit_start_date,
      filters.recruit_end_date,
      filters.recruit_end_date,
      filters.event_start_date,
      filters.event_start_date,
      filters.event_end_date,
      filters.event_end_date,
      filters.event_name,
      filters.event_name,
      filters.role,
      filters.user_code,
    ];

    const rows = await conn.query(eventSQL.selectEventApplyResult, params);
    if (!rows || !rows.length) return [];

    for (const event of rows) {
      event.register_status_name = await commonCodeService.getCodeName(
        "BA",
        event.register_status
      );
      event.result_status_name = await commonCodeService.getCodeName(
        "BA",
        event.result_status
      );
    }

    console.log("공통코드", rows[0].register_status);
    // console.log(
    //   "[eventMapper.js || 이벤트 작성자별 계획/결과 목록 조회 성공]",
    //   rows
    // );
    return rows;
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트 작성자별 계획/결과 목록 조회 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 이벤트 단건조회 + 세부 이벤트 + 서브 매니저 + 첨부파일
async function selectEventOneFull(event_code, user_code) {
  let conn;
  try {
    conn = await pool.getConnection();

    // 결과보고서 승인 유무
    const resultStatus = await conn.query(eventSQL.selectResultStatus);

    // 1️⃣ 이벤트 단건조회
    const rows = await conn.query(eventSQL.selectEventOne, [event_code]);
    const event = rows[0];
    if (!event) return null;

    // 2️⃣ 코드명 매핑 (공통코드 있는 컬럼만)
    event.recruit_status_name = await commonCodeService.getCodeName(
      "DC",
      event.recruit_status
    );
    event.register_status_name = await commonCodeService.getCodeName(
      "BA",
      event.register_status
    );
    event.event_type_name = await commonCodeService.getCodeName(
      "DD",
      event.event_type
    );

    // 3️⃣ 세부 이벤트 조회
    const subEvents = await conn.query(eventSQL.selectSubEventList, [
      event_code,
    ]);

    // 4️⃣ 첨부파일 조회 (코드명 없음)
    const attachments = await conn.query(eventSQL.selectAttachList, [
      event_code,
    ]);

    // 5️⃣ 서브 매니저 조회 (코드값만 가져와서 Node.js에서 매핑)
    let subManagers = await conn.query(eventSQL.selectManager, [event_code]);
    subManagers = await Promise.all(
      subManagers.map(async (m) => {
        m.manager_type_name = await commonCodeService.getCodeName(
          "DA",
          m.manager_type
        );
        m.manager_category_name = await commonCodeService.getCodeName(
          "DB",
          m.manager_category
        );
        return m;
      })
    );

    // 6️⃣ 신청제(DD1)일 경우 이미 신청했는지 확인
    let alreadyApplied = false;
    if (user_code && event.event_type === "DD1") {
      const appliedRows = await conn.query(eventSQL.selectEventApplyExist, [
        user_code,
        event_code,
        null,
        null,
      ]);
      alreadyApplied = appliedRows[0].cnt > 0;
    }
    // 7️⃣ 예약제(DD2) 신청 여부 반영
    if (user_code && event.event_type === "DD2") {
      const subEventsWithApplied = await Promise.all(
        subEvents.map(async (sub) => {
          const rows = await conn.query(eventSQL.selectEventApplyExist, [
            user_code,
            event_code,
            sub.sub_event_code,
            sub.sub_event_code,
          ]);
          const applied = rows[0].cnt > 0;
          return { ...sub, applied };
        })
      );
      // 예약제(DD2)인 경우 반환
      return {
        ...event,
        sub_events: subEventsWithApplied,
        attachments,
        sub_managers: subManagers,
        alreadyApplied: false, // 예약제 버튼
        resultStatus,
      };
    }

    // 신청제(DD1)인 경우는 그대로 alreadyApplied만 반환
    return {
      ...event,
      sub_events: subEvents,
      attachments,
      sub_managers: subManagers,
      alreadyApplied, // 신청제 버튼
      resultStatus,
    };
    // 반환
  } catch (err) {
    console.error("[eventMapper.js || selectEventOneFull 실패]", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 이벤트 + 세부 이벤트 + 첨부파일 + 서브매니저 등록
async function addEventFull(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1️⃣ 이벤트 등록
    const eventParams = [
      data.org_code,
      data.user_code,
      data.event_name,
      data.event_type,
      data.event_content,
      data.event_location,
      data.target_audience,
      data.max_participants,
      moment(data.recruit_start_date).format("YYYY-MM-DD"),
      moment(data.recruit_end_date).format("YYYY-MM-DD"),
      moment(data.event_start_date).format("YYYY-MM-DD HH:mm:ss"),
      moment(data.event_end_date).format("YYYY-MM-DD HH:mm:ss"),
      data.recruit_status,
      moment(data.event_register_date).format("YYYY-MM-DD HH:mm:ss"),
      data.register_status,
    ];
    const eventResult = await conn.query(eventSQL.insertEvent, eventParams);
    const event_code = eventResult.insertId;

    // 2️⃣ 세부 이벤트 등록
    if (data.sub_events && data.sub_events.length > 0) {
      for (const sub of data.sub_events) {
        const subParams = [
          sub.sub_event_name,
          sub.sub_event_start_date,
          sub.sub_event_end_date,
          sub.sub_recruit_count,
          event_code,
        ];
        await conn.query(eventSQL.insertSubEvent, subParams);
      }
    }

    // 3️⃣ 첨부파일 등록
    if (data.attachments && data.attachments.length > 0) {
      for (const file of data.attachments) {
        const attachParams = [
          file.original_filename,
          file.server_filename,
          file.file_path,
          "event", // linked_table_name
          event_code, // linked_record_pk
        ];
        await conn.query(eventSQL.insertAttachment, attachParams);
      }
    }

    // 4️⃣ 메인 매니저 등록 (이벤트 등록한 회원)
    await conn.query(eventSQL.insertManager, [
      "DB2", // DB2 이벤트
      event_code,
      "DA1", // 메인 매니저
      data.user_code,
    ]);

    // 5️⃣ 서브 매니저 등록
    if (data.sub_managers && data.sub_managers.length > 0) {
      for (const subMgr of data.sub_managers) {
        await conn.query(eventSQL.insertManager, [
          "DB2", // DB2 이벤트
          event_code,
          "DA2", // 서브 매니저
          subMgr.user_code,
        ]);
      }
    }

    // 6️⃣ 🔥 이벤트 승인요청 중복 여부 체크
    const [existReq] = await conn.query(eventSQL.getApprovalForPlan, [
      event_code,
    ]);

    // 7️⃣ 🔥 이벤트 승인요청 등록
    if (!existReq) {
      await conn.query(eventSQL.insertRequestApprovalForPlan, [
        data.user_code, // requester_code
        1, // processor_code (관리자)
        "AE6", // approval_type (이벤트 계획)
        "BA1", // state (요청)
        "event", // linked_table_name
        event_code, // linked_record_pk
      ]);
    }

    await conn.commit();
    return { event_code, ...data };
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("[eventMapper.js || 이벤트 전체 등록 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 전체 매니저 조회
async function getAllManagers() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(eventSQL.selectManagerAll);
    console.log("[eventMapper.js || 전체 매니저 조회 성공]", rows);
    return rows;
  } catch (err) {
    console.error("[eventMapper.js || 전체 매니저 조회 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 이벤트 + 세부 이벤트 등록
async function addEventWithSub(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    // 1️⃣ 이벤트 등록
    const params = [
      data.org_code,
      data.user_code,
      data.event_name,
      data.event_type,
      data.event_content,
      data.event_location,
      data.target_audience,
      data.max_participants,
      moment(data.recruit_start_date).format("YYYY-MM-DD"),
      moment(data.recruit_end_date).format("YYYY-MM-DD"),
      moment(data.event_start_date).format("YYYY-MM-DD HH:mm:ss"),
      moment(data.event_end_date).format("YYYY-MM-DD HH:mm:ss"),
      data.recruit_status,
      moment(data.event_register_date).format("YYYY-MM-DD HH:mm:ss"),
      data.register_status,
    ];

    const result = await conn.query(eventSQL.insertEvent, params);
    const event_code = result.insertId; // 새로 생성된 이벤트 코드

    // 2️⃣ sub_events 등록 (예약제)
    if (data.sub_events && data.sub_events.length > 0) {
      for (const sub of data.sub_events) {
        const subParams = [
          sub.sub_event_name,
          sub.sub_event_start_date,
          sub.sub_event_end_date,
          sub.sub_recruit_count,
          event_code,
        ];
        await conn.query(eventSQL.insertSubEvent, subParams);
      }
    }

    return { event_code, ...data };
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트+세부 이벤트 등록 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 이벤트 신청 내역 등록
async function addEventApply(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    const params = [
      moment(data.apply_date).format("YYYY-MM-DD"),
      data.apply_type,
      data.user_code,
      data.event_code,
      data.sub_event_code,
    ];

    const duplicate = await checkDuplicateApply({
      user_code: data.user_code,
      event_code: data.event_code,
      sub_event_code: data.sub_event_code,
    });

    if (duplicate) {
      throw new Error("이미 신청한 이벤트/서브 이벤트입니다.");
    }

    const rows = await conn.query(eventSQL.insertEventApply, params);
    console.log("[eventMapper.js || 이벤트 신청 내역 등록 성공]");
    return rows;
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트 신청 내역 등록 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 이벤트 신청 내역 조회
async function selectEventApplyList(user_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("=== DEBUG user_code:", user_code);
    const rows = await conn.query(eventSQL.selectEventApplyList, [user_code]);

    // 필요하다면 apply_type, apply_status 코드명을 commonCodeService에서 매핑
    for (const row of rows) {
      row.apply_type_name = await commonCodeService.getCodeName(
        "DD",
        row.apply_type
      );
      row.apply_status_name = await commonCodeService.getCodeName(
        "DE",
        row.apply_status
      );

      // 신청일정, 신청인원, 마감인원은 이미 SQL에서 계산되어 있음
      // 필요 시 JS에서 포맷 변경 가능
    }
    console.log("=== DEBUG rows:", rows);
    console.log("[eventMapper.js || 이벤트 신청 내역 조회 성공]", rows);
    return rows;
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트 신청 내역 조회 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 이벤트 신청자 수 조회
async function selectEventApplyCount(event_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("=== DEBUG event_code:", event_code);
    const rows = await conn.query(eventSQL.selectEventApplyCount, [event_code]);

    // 필요하다면 apply_type, apply_status 코드명을 commonCodeService에서 매핑
    for (const row of rows) {
      row.apply_type_name = await commonCodeService.getCodeName(
        "DD",
        row.apply_type
      );
      row.apply_status_name = await commonCodeService.getCodeName(
        "DE",
        row.apply_status
      );

      // 신청일정, 신청인원, 마감인원은 이미 SQL에서 계산되어 있음
      // 필요 시 JS에서 포맷 변경 가능
    }
    console.log("=== DEBUG rows:", rows);
    console.log("[eventMapper.js || 이벤트 신청자 수 조회 성공]", rows);
    return rows;
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트 신청자 수 조회 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ==========================
// 이벤트 신청 취소
// ==========================
async function cancelApply(apply_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1️⃣ 신청 내역 확인 (선택적, 로그 용도)
    const [apply] = await conn.query(
      `SELECT event_code, sub_event_code FROM event_apply WHERE apply_code = ?`,
      [apply_code]
    );
    if (!apply) throw new Error("신청 내역을 찾을 수 없습니다.");

    // 2️⃣ 신청 내역 삭제
    await conn.query(eventSQL.deleteEventApply, [apply_code]);

    await conn.commit();
    return { status: "success", message: "신청이 취소되었습니다." };
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("[eventMapper.js || 신청 취소 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 중복 신청 여부 확인
async function checkDuplicateApply(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(eventSQL.selectEventApplyExist, [
      data.user_code,
      data.event_code,
      data.sub_event_code,
      data.sub_event_code,
    ]);
    // console.log(rows[0].cnt);
    console.log("[eventMapper.js || 이벤트 신청 중복 체크 성공]");
    return rows[0].cnt > 0;
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트 신청 중복 체크 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 이벤트 + 세부 이벤트 수정
async function updateEventWithSub(data, event_code) {
  let conn;
  try {
    conn = await pool.getConnection();

    // 1️⃣ 이벤트 테이블 업데이트
    await conn.query(eventSQL.updateEvent, [data, event_code]);

    // 2️⃣ 기존 세부 이벤트 삭제
    await conn.query(`DELETE FROM sub_event WHERE event_code = ?`, [
      event_code,
    ]);

    // 3️⃣ 새로운 sub_events 등록
    if (data.sub_events && data.sub_events.length > 0) {
      for (const sub of data.sub_events) {
        const subParams = [
          sub.sub_event_name,
          sub.sub_event_start_date,
          sub.sub_event_end_date,
          sub.sub_recruit_count,
          event_code,
        ];
        await conn.query(eventSQL.insertSubEvent, subParams);
      }
    }

    return { event_code, ...data };
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트+세부 이벤트 수정 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 이벤트 수정
async function updateEvent(data, event_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(eventSQL.updateEvent, [data, event_code]);
    console.log("[eventMapper.js || 이벤트 수정 성공]");
    return rows;
  } catch (err) {
    console.error("[eventMapper.js || 이벤트 수정 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 이벤트 삭제
async function deleteEvent(event_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(eventSQL.deleteEvent, [event_code]);
    console.log("[eventMapper.js || 이벤트 삭제 성공]");
    return rows;
  } catch (err) {
    console.error("[eventMapper.js || 이벤트 삭제 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ==========================
// 세부 이벤트
// ==========================

// ✅ 세부 이벤트 전체 조회
async function selectSubEventList() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(eventSQL.selectSubEventList);
    console.log("[eventMapper.js || 세부 이벤트 전체조회 성공]");
    return rows;
  } catch (err) {
    console.error("[eventMapper.js || 세부 이벤트 전체조회 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 세부 이벤트 단건 조회
async function selectSubEventOne(sub_event_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(eventSQL.selectSubEventOne, [
      sub_event_code,
    ]);
    console.log("[eventMapper.js || 세부 이벤트 단건조회 성공]");
    return rows[0];
  } catch (err) {
    console.error("[eventMapper.js || 세부 이벤트 단건조회 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 세부 이벤트 등록
async function addSubEvent(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    const params = [
      data.sub_event_name,
      data.sub_event_start_date,
      data.sub_event_end_date,
      data.sub_recruit_count,
      data.event_code,
    ];
    const rows = await conn.query(eventSQL.insertSubEvent, params);
    console.log("[eventMapper.js || 세부 이벤트 등록 성공]");
    return rows;
  } catch (err) {
    console.error("[eventMapper.js || 세부 이벤트 등록 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 세부 이벤트 수정
async function updateSubEvent(data, sub_event_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(eventSQL.updateSubEvent, [
      data,
      sub_event_code,
    ]);
    console.log("[eventMapper.js || 세부 이벤트 수정 성공]");
    return rows;
  } catch (err) {
    console.error("[eventMapper.js || 세부 이벤트 수정 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// ✅ 세부 이벤트 삭제
async function deleteSubEvent(sub_event_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(eventSQL.deleteSubEvent, [sub_event_code]);
    console.log("[eventMapper.js || 세부 이벤트 삭제 성공]");
    return rows;
  } catch (err) {
    console.error("[eventMapper.js || 세부 이벤트 삭제 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 이벤트 + 세부 이벤트 등록
async function addEventWithSub(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    // 1️⃣ 이벤트 등록
    const params = [
      data.org_code,
      data.user_code,
      data.event_name,
      data.event_type,
      data.event_content,
      data.event_location,
      data.target_audience,
      data.max_participants,
      moment(data.recruit_start_date).format("YYYY-MM-DD"),
      moment(data.recruit_end_date).format("YYYY-MM-DD"),
      moment(data.event_start_date).format("YYYY-MM-DD HH:mm:ss"),
      moment(data.event_end_date).format("YYYY-MM-DD HH:mm:ss"),
      data.recruit_status,
      moment(data.event_register_date).format("YYYY-MM-DD HH:mm:ss"),
      data.register_status,
    ];

    const result = await conn.query(eventSQL.insertEvent, params);
    const event_code = result.insertId; // 새로 생성된 이벤트 코드

    // 2️⃣ sub_events 등록 (예약제)
    if (data.sub_events && data.sub_events.length > 0) {
      for (const sub of data.sub_events) {
        const subParams = [
          sub.sub_event_name,
          sub.sub_event_start_date,
          sub.sub_event_end_date,
          sub.sub_recruit_count,
          event_code,
        ];
        await conn.query(eventSQL.insertSubEvent, subParams);
      }
    }

    return { event_code, ...data };
  } catch (err) {
    console.error(
      "[eventMapper.js || 이벤트+세부 이벤트 등록 실패]",
      err.message
    );
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 🔹 이벤트계획 승인
async function approveEventPlan(eventCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const eventId = Number(eventCode);
    if (!eventId) {
      throw new Error("유효한 eventCode가 아닙니다.");
    }

    // 1) event 상태 BA2(승인)로 변경
    await conn.query(eventSQL.updateEventStatus, ["BA2", eventId]);

    // 2) request_approval 상태 BA2(승인)로 변경
    const result = await conn.query(eventSQL.updateApprovalApproveForPlan, [
      eventId,
    ]);

    await conn.commit();
    return safeJSON({
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 이벤트 계획 반려
async function rejectEventPlan(eventCode, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const eventId = Number(eventCode);
    if (!eventId) {
      throw new Error("유효한 eventCode가 아닙니다.");
    }

    // 1) event 상태 BA3(반려)로 변경
    await conn.query(eventSQL.updateEventStatus, ["BA3", eventId]);

    // 2) request_approval 상태 BA3(반려)로 변경
    const result = await conn.query(eventSQL.updateApprovalRejectForPlan, [
      reason || "",
      eventId,
    ]);

    await conn.commit();
    return safeJSON({
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 이벤트계획에 대한 반려 사유,일자 조회
async function getRejectionReason(eventCode) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(eventSQL.getRejectReasonByPlan, [eventCode]);

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
async function resubmitPlan(eventCode, requesterCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) event 상태를 BA1(요청)으로 변경
    await conn.query(eventSQL.updateEventStatus, ["BA1", eventCode]);

    // 2) request_approval에 새 승인요청 INSERT
    await conn.query(eventSQL.insertRequestApprovalForPlan, [
      requesterCode, // requester_code (담당자)
      1, // processor_code (관리자, 임시)
      "AE6", // approval_type
      "BA1", // state: 요청
      "event",
      eventCode, // linked_record_pk = plan_code
    ]);

    await conn.commit();
    return safeJSON({
      eventCode,
      register_status: "BA3",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 결과보고서 + 첨부파일 등록
async function addEventResultFull(data) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1️⃣ 결과보고서 등록
    const resultParams = [
      data.result_status,
      data.result_subject,
      data.result_content,
      moment(data.report_register_date).format("YYYY-MM-DD"),
      data.event_code,
    ];
    const reportResult = await conn.query(
      eventSQL.insertEventResult,
      resultParams
    );
    const event_result_code = reportResult.insertId;

    // 2️⃣ 첨부파일 등록
    if (data.attachments && data.attachments.length > 0) {
      for (const file of data.attachments) {
        const attachParams = [
          file.original_filename,
          file.server_filename,
          file.file_path,
          "event_result", // linked_table_name
          event_result_code, // linked_record_pk
        ];
        await conn.query(eventSQL.insertAttachment, attachParams);
      }
    }

    // 3️⃣ 🔥 결과보고서 승인요청 중복 여부 체크
    const [existReq] = await conn.query(eventSQL.getApprovalForResult, [
      event_result_code,
    ]);

    // 4️⃣ 🔥 결과보고서 승인요청 등록
    if (!existReq) {
      await conn.query(eventSQL.insertRequestApprovalForResult, [
        data.user_code, // requester_code
        1, // processor_code (관리자)
        "AE7", // approval_type (이벤트 결과)
        "BA1", // state (요청)
        "event_result", // linked_table_name
        event_result_code, // linked_record_pk
      ]);
    }

    await conn.commit();
    return { event_result_code, ...data };
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("[eventMapper.js || 결과보고서 등록 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 결과보고서 + 첨부파일 단건조회
async function selectResultOneFull(event_result_code) {
  let conn;
  try {
    conn = await pool.getConnection();

    // 1️⃣ 결과보고서 단건조회
    const rows = await conn.query(eventSQL.selectResultOne, [
      event_result_code,
    ]);
    const result = rows[0];
    if (!result) return null;

    // 2️⃣ 코드명 매핑 (공통코드 있는 컬럼만)
    result.result_status_name = await commonCodeService.getCodeName(
      "BA",
      result.result_status
    );

    // 3️⃣ 첨부파일 조회 (코드명 없음)
    const attachments = await conn.query(eventSQL.selectResultAttachList, [
      event_result_code,
    ]);

    return {
      ...result,
      attachments,
    };
    // 반환
  } catch (err) {
    console.error("[eventMapper.js || selectEventOneFull 실패]", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// 🔹 결과보고서 승인
async function approveEventResult(resultCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const resultId = Number(resultCode);
    if (!resultId) {
      throw new Error("유효한 resultCode가 아닙니다.");
    }

    // 1) result 상태 BA2(승인)로 변경
    await conn.query(eventSQL.updateEventResultStatus, ["BA2", resultId]);

    // 2) request_approval 상태 BA2(승인)로 변경
    const result = await conn.query(eventSQL.updateApprovalApproveForResult, [
      resultId,
    ]);

    await conn.commit();
    return safeJSON({
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 결과보고서 반려
async function rejectEventResult(resultCode, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const resultId = Number(resultCode);
    if (!resultId) {
      throw new Error("유효한 resultCode가 아닙니다.");
    }

    // 1) 결과보고서 상태 BA3(반려)로 변경
    await conn.query(eventSQL.updateEventResultStatus, ["BA3", resultId]);

    // 2) request_approval 상태 BA3(반려)로 변경
    const result = await conn.query(eventSQL.updateApprovalRejectForResult, [
      reason || "",
      resultId,
    ]);

    await conn.commit();
    return safeJSON({
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 결과보고서에 대한 반려 사유,일자 조회
async function getResultRejectionReason(resultCode) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(eventSQL.getRejectReasonByResult, [
      resultCode,
    ]);

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

//결과보고서 재승인 신청
async function resubmitResult(resultCode, requesterCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) result 상태를 BA1(요청)으로 변경
    await conn.query(eventSQL.updateEventResultStatus, ["BA1", resultCode]);

    // 2) request_approval에 새 승인요청 INSERT
    await conn.query(eventSQL.insertRequestApprovalForResult, [
      requesterCode, // requester_code (담당자)
      1, // processor_code (관리자, 임시)
      "AE7", // approval_type
      "BA1", // state: 요청
      "event_result",
      resultCode, // linked_record_pk = plan_code
    ]);

    await conn.commit();
    return safeJSON({
      resultCode,
      result_status: "BA3",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// ==========================
// 참가자 목록 조회
// ==========================
async function selectAttendance(filters) {
  let conn;
  try {
    conn = await pool.getConnection();

    // 와일드카드/NULL 준비
    const applyStatusLike = filters.applyStatus
      ? `%${filters.applyStatus}%`
      : null;
    const eventNameLike = filters.eventName ? `%${filters.eventName}%` : null;
    const managerNameLike = filters.managerName
      ? `%${filters.managerName}%`
      : null;

    const page = Number(filters.page || 1);
    const size = Number(filters.size || 20);
    const limit = size;
    const offset = (page - 1) * size;

    const params = [
      applyStatusLike,
      filters.applyStatus ? applyStatusLike : null,
      eventNameLike,
      filters.eventName ? eventNameLike : null,
      managerNameLike,
      filters.managerName ? managerNameLike : null,
      limit,
      offset,
    ];

    const rows = await conn.query(eventSQL.selectAttendance, params);

    for (const apply of rows) {
      apply.apply_status_name = await commonCodeService.getCodeName(
        "DE",
        apply.apply_status
      );
      apply.attend_status_name = await commonCodeService.getCodeName(
        "DG",
        apply.attend_status
      );
      apply.child_gender_name = await commonCodeService.getCodeName(
        "AC",
        apply.child_gender
      );
    }

    // count
    const countParams = [
      applyStatusLike,
      filters.applyStatus ? applyStatusLike : null,
      eventNameLike,
      filters.eventName ? eventNameLike : null,
      managerNameLike,
      filters.managerName ? managerNameLike : null,
    ];
    const countRows = await conn.query(eventSQL.countAttendance, countParams);
    const totalCount = countRows[0] ? countRows[0].cnt : 0;

    return { rows, totalCount };
  } catch (err) {
    console.error("[eventMapper.js || selectAttendance 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn && conn.release();
  }
}

// ==========================
// 내가 등록한 이벤트 참가자 목록 조회
// ==========================
async function selectMyAttendance(eventCode) {
  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query(eventSQL.selectMyAttendance, [eventCode]);

    for (const apply of rows) {
      apply.apply_status_name = await commonCodeService.getCodeName(
        "DE",
        apply.apply_status
      );
      apply.attend_status_name = await commonCodeService.getCodeName(
        "DG",
        apply.attend_status
      );
      apply.child_gender_name = await commonCodeService.getCodeName(
        "AC",
        apply.child_gender
      );
    }

    return rows;
  } catch (err) {
    console.error("[eventMapper.js || selectAttendance 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn && conn.release();
  }
}

// ==========================
// 참가자/자녀 단건 조회
// ==========================
async function selectAttendanceOne(apply_code) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(eventSQL.selectAttendanceOne, [apply_code]);

    for (const apply of rows) {
      apply.apply_status_name = await commonCodeService.getCodeName(
        "DE",
        apply.apply_status
      );
      apply.attend_status_name = await commonCodeService.getCodeName(
        "DG",
        apply.attend_status
      );
      apply.child_gender_name = await commonCodeService.getCodeName(
        "AC",
        apply.child_gender
      );
    }

    console.log("[eventMapper.js || selectAttendanceOne 성공]");
    return rows[0];
  } catch (err) {
    console.error("[eventMapper.js || selectAttendanceOne 실패]", err.message);
    throw err;
  } finally {
    if (conn) conn && conn.release();
  }
}

// 🔹 이벤트 신청내역 승인
async function approveMyApply(applyCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const applyId = Number(applyCode);
    if (!applyId) {
      throw new Error("유효한 applyCode 아닙니다.");
    }

    // 신청내역 상태 DE2(승인)로 변경
    const result = await conn.query(eventSQL.updateApprovalApproveForMyApply, [
      applyId,
    ]);

    await conn.commit();
    return safeJSON({
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 신청내역 취소
async function rejectMyApply(applyCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const applyId = Number(applyCode);
    if (!applyId) {
      throw new Error("유효한 applyCode가 아닙니다.");
    }

    // 이벤트 신청내역 상태 DE4(취소)로 변경
    const result = await conn.query(eventSQL.updateApprovalRejectForMyApply, [
      applyId,
    ]);

    await conn.commit();
    return safeJSON({
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  selectEventMainpage,
  selectEventList,
  selectEventOneFull,
  addEventWithSub,
  updateEventWithSub,
  addEventApply,
  updateEvent,
  deleteEvent,
  selectSubEventList,
  selectSubEventOne,
  addSubEvent,
  updateSubEvent,
  deleteSubEvent,
  addEventFull,
  checkDuplicateApply,
  selectEventApplyList,
  selectEventApplyCount,
  cancelApply,
  selectEventApplyResult,
  approveEventPlan,
  rejectEventPlan,
  getRejectionReason,
  resubmitPlan,
  addEventResultFull,
  selectResultOneFull,
  approveEventResult,
  rejectEventResult,
  getResultRejectionReason,
  resubmitResult,
  getAllManagers,
  selectAttendance,
  selectAttendanceOne,
  approveMyApply,
  rejectMyApply,
  selectMyAttendance,
};
