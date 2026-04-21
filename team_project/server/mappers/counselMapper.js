// server/mappers/counselMapper.js
const pool = require("../configs/db");
const sql = require("../sql/counselSql");
const { logHistoryDiff } = require("../utils/historyUtil");

// BigInt → Number (JSON 직렬화 보호)
function safeJSON(v) {
  return JSON.parse(
    JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x))
  );
}

// 🔹 DB에서 읽어온 파일명 복원용 디코더
function decodeFilenameFromDb(name) {
  if (!name) return name;
  try {
    return decodeURIComponent(name); // "%ED%85%8C..." → "테스트파일.docx"
  } catch (e) {
    // 예전에 깨진 값이나, 인코딩 안 된 값은 그대로 돌려보냄
    return name;
  }
}

//빈 문자열('')을 NULL 로 바꿔서 DATE 컬럼에 넣을 수 있게 해주는 헬퍼
function normalizeDateForDb(val) {
  if (val == null) return null; // null, undefined
  if (typeof val === "string" && val.trim() === "") return null;
  return val; // '2025-11-14' 같은 정상 값은 그대로
}

async function listCounselByRole(role, userId) {
  const conn = await pool.getConnection();
  try {
    let rows;

    if (role === 1) {
      // 🔹 1: 일반 사용자는 상담 목록 보지 못함
      rows = [];
    } else if (role === 2) {
      // 🔹 2: 담당자 - 내가 담당자인 상담만
      rows = await conn.query(sql.listCounselByAssignee, [userId]);
    } else if (role === 3) {
      // 🔹 3: 관리자 - 내 기관(org_code)에 속한 작성자들의 상담만
      const orgRows = await conn.query(sql.getUserOrgByUserCode, [userId]);
      const org = orgRows && orgRows[0];

      if (!org || !org.org_code) {
        rows = [];
      } else {
        rows = await conn.query(sql.listCounselByOrg, [org.org_code]);
      }
    } else {
      // 🔹 4: 시스템(기타 포함) - 전체 상담
      rows = await conn.query(sql.listCounselAll);
    }

    return safeJSON(rows);
  } finally {
    conn.release();
  }
}

// 상담 상세들을 "index 기반" 평탄화해서 history 에 쓸 수 있게 변환
function normalizeDetailsForHistory(detailsRows = []) {
  return detailsRows.map((d) => ({
    counsel_date: d.counsel_date || null,
    title: (d.title || "").trim(),
    content: (d.content || "").trim(),
  }));
}

// before/after 의 상세들을 detail1_*, detail2_* ... 형식으로 평탄화해서
// beforeRow/afterRow 에 merge 해주는 헬퍼
function mergeDetailsIntoHistoryRows(
  beforeDetails,
  afterDetails,
  beforeRow,
  afterRow
) {
  const beforeNorm = normalizeDetailsForHistory(beforeDetails);
  const afterNorm = normalizeDetailsForHistory(afterDetails);

  const maxLen = Math.max(beforeNorm.length, afterNorm.length);

  for (let i = 0; i < maxLen; i++) {
    const idx = i + 1;
    const before = beforeNorm[i] || {
      counsel_date: null,
      title: "",
      content: "",
    };
    const after = afterNorm[i] || {
      counsel_date: null,
      title: "",
      content: "",
    };

    const prefix = `detail${idx}_`;

    beforeRow[`${prefix}date`] = before.counsel_date;
    beforeRow[`${prefix}title`] = before.title;
    beforeRow[`${prefix}content`] = before.content;

    afterRow[`${prefix}date`] = after.counsel_date;
    afterRow[`${prefix}title`] = after.title;
    afterRow[`${prefix}content`] = after.content;
  }

  return { beforeRow, afterRow };
}

// 저장 / 수정 / 재수정
async function saveCounsel(body, files = []) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      submitCode,
      priority,
      mainForm,
      records,
      removeAttachmentCodes = [], // 🔹 프론트에서 넘어오는 삭제 대상 첨부코드 배열
      modifier, // ⭐ 히스토리용 수정자(user_code)
      requesterCode,
    } = body;

    // ⭐ beforeRow 준비용 변수
    let beforeRow = null;

    // 1) 기존 상담 존재 여부 확인
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);

    let counsel_code;
    const now = new Date();
    let needApprovalRequest = false; // 🔹 이번 저장에서 승인요청을 새로 넣어야 하는지 여부

    if (exist.length === 0) {
      // 🔹 상담 처음 작성: status = CB3(검토전)으로 신규 생성 + 승인요청 필요
      const res = await conn.query(sql.insertCounselNote, [
        submitCode, // submit_code
        "CB3", // status
        now, // written_at
      ]);
      counsel_code = res.insertId;
      needApprovalRequest = true; // 👉 처음 작성이므로 승인요청 생성

      // ⚠️ 최초 작성은 beforeRow가 없으므로 히스토리 기록은 생략
    } else {
      // 🔹 기존 상담 있음
      counsel_code = exist[0].counsel_code;
      const currentStatus = (exist[0].status || "").trim().toUpperCase();

      // ⭐ 1-1) 수정 전 상태 읽기 (기존 상담이 있을 때만)
      const beforeDetailsAll = await conn.query(
        sql.getCounselDetailsByCounsel,
        [counsel_code]
      );
      const beforePriorityRows = await conn.query(
        sql.getCurrentPriorityBySubmit,
        [submitCode]
      );

      const beforeMain = beforeDetailsAll[0] || {};
      const beforeSubDetails = beforeDetailsAll.slice(1); // 🔥 추가 상담 기록들만

      const beforePriority = beforePriorityRows[0]?.level || null;

      // 기본 필드 (우선순위 + 메인 상담)
      beforeRow = {
        priority: beforePriority,
        main_counsel_date: beforeMain.counsel_date || null,
        main_title: beforeMain.title || "",
        main_content: beforeMain.content || "",
      };

      // 🔥 “추가 상담 기록들”만 history 비교 대상에 포함
      // detail1_date, detail1_title, detail1_content ... 이런 식으로 key 생성
      beforeRow = mergeDetailsIntoHistoryRows(
        beforeSubDetails, // before 쪽 상세
        [], // after는 나중에 채울 거라 지금은 빈 배열
        beforeRow,
        {} // afterRow 는 여기선 무시
      ).beforeRow;

      if (currentStatus === "CB1") {
        await conn.query(sql.updateCounselNote, [
          "CB3", // 임시 → 검토전
          now, // written_at
          counsel_code,
        ]);
        needApprovalRequest = true;
      } else if (currentStatus === "CB2") {
        await conn.query(sql.updateCounselNote, ["CB3", now, counsel_code]);
        needApprovalRequest = true;
      } else if (currentStatus === "CB4") {
        await conn.query(sql.updateCounselNoteKeepStatus, [
          now, // written_at
          counsel_code,
        ]);
        needApprovalRequest = true;
      } else {
        // ✅ 일반 수정
        await conn.query(sql.updateCounselNote, [
          currentStatus, // 기존 상태 그대로
          now, // written_at
          counsel_code,
        ]);
      }
    }

    // 2) 기존 상담 상세 삭제
    await conn.query(sql.deleteCounselDetails, [counsel_code]);

    // 3) 상담 상세 입력들 (추가 기록들)
    for (const rec of records || []) {
      await conn.query(sql.insertCounselDetail, [
        counsel_code,
        rec.counselDate,
        rec.title,
        rec.content,
      ]);
    }

    // 3-1) 메인 상담 내용
    if (mainForm && (mainForm.title || mainForm.content)) {
      await conn.query(sql.insertCounselDetail, [
        counsel_code,
        mainForm.counselDate,
        mainForm.title,
        mainForm.content,
      ]);
    }

    // 4) 우선순위 처리
    const effectivePriority = priority || "BB3";

    await conn.query(sql.resetPriority, [submitCode]);
    await conn.query(sql.insertPriority, [submitCode, effectivePriority, "Y"]);

    // 5) 첨부파일 처리
    if (Array.isArray(removeAttachmentCodes) && removeAttachmentCodes.length) {
      for (const attachCode of removeAttachmentCodes) {
        if (attachCode == null) continue;
        await conn.query(sql.deleteAttachmentOne, [
          counsel_code, // linked_record_pk
          attachCode, // attach_code
        ]);
      }
    }

    if (Array.isArray(files) && files.length > 0) {
      const basePath = "/uploads/counsel";

      for (const f of files) {
        await conn.query(sql.insertAttachment, [
          f.originalname,
          f.filename,
          basePath,
          "counsel_note",
          counsel_code,
          effectivePriority,
        ]);
      }
    }

    // 6) 승인요청 처리
    if (needApprovalRequest) {
      if (!requesterCode) {
        // 컬럼이 NOT NULL이면 이렇게 막는 게 안전함
        throw new Error(
          "승인요청 작성자의 정보가 없습니다. 다시 로그인 후 시도해주세요."
        );
      }

      await conn.query(sql.insertRequestApproval, [
        requesterCode, // 🔹 로그인한 담당자의 user_code
        null, // processor_code (관리자, 아직 미정이므로 NULL)
        "AE3", // approval_type
        "BA1", // state (요청)
        "counsel_note", // linked_table_name
        counsel_code, // linked_record_pk
        effectivePriority,
      ]);
    }

    // ⭐ 7) 수정 후(after) 상태 읽고 history 기록 (기존 상담이 있던 경우에만)
    if (exist.length > 0) {
      const afterDetailsAll = await conn.query(sql.getCounselDetailsByCounsel, [
        counsel_code,
      ]);
      const afterPriorityRows = await conn.query(
        sql.getCurrentPriorityBySubmit,
        [submitCode]
      );

      const afterMain = afterDetailsAll[0] || {};
      const afterSubDetails = afterDetailsAll.slice(1); // 🔥 추가 상담 기록들만

      const afterPriority = afterPriorityRows[0]?.level || null;

      // 기본 필드
      let afterRow = {
        priority: afterPriority,
        main_counsel_date: afterMain.counsel_date || null,
        main_title: afterMain.title || "",
        main_content: afterMain.content || "",
      };

      // 🔥 상세들까지 펼쳐서 afterRow 에도 merge (역시 추가 기록만)
      const merged = mergeDetailsIntoHistoryRows(
        [], // before 쪽은 이미 beforeRow에 들어가 있으니 비워둠
        afterSubDetails, // after 쪽 상세
        {}, // beforeRow는 여기선 안 씀
        afterRow
      );
      afterRow = merged.afterRow;

      // 비교해야 할 모든 필드 목록
      const fieldSet = new Set([
        "priority",
        "main_counsel_date",
        "main_title",
        "main_content",
        ...Object.keys(beforeRow).filter((k) => k.startsWith("detail")),
        ...Object.keys(afterRow).filter((k) => k.startsWith("detail")),
      ]);

      await logHistoryDiff(conn, {
        tableName: "counsel_note",
        tablePk: counsel_code,
        modifier, // 프론트에서 body.modifier 로 넘어온 user_code
        historyType: "BD2", // 상담 수정 타입 코드
        beforeRow,
        afterRow,
        fields: Array.from(fieldSet),
      });
    }

    await conn.commit();
    return safeJSON({
      counsel_code,
      mode: exist.length ? "update" : "insert",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 상세보기 + 수정
async function getCounselDetail(submitCode) {
  const conn = await pool.getConnection();
  try {
    // 1) 헤더 + 기본 제출/작성자 정보
    const headerRows = await conn.query(sql.getCounselHeaderBySubmit, [
      submitCode,
    ]);

    if (!headerRows || headerRows.length === 0) {
      return null;
    }
    const h = headerRows[0];

    // 2) 상담 상세들
    const detailRows = await conn.query(sql.getCounselDetailsByCounsel, [
      h.counsel_code,
    ]);

    // 3) 우선순위
    const prRows = await conn.query(sql.getCurrentPriorityBySubmit, [
      submitCode,
    ]);
    const priority = prRows[0]?.level || "계획";

    // 4) 🔹 첨부파일 목록
    const attachRows = await conn.query(sql.getAttachmentsByCounsel, [
      h.counsel_code,
    ]);

    const mainDetail = detailRows[0] || null;
    const otherDetails = detailRows.slice(1);

    return safeJSON({
      submit_info: {
        childName: h.child_name,
        guardianName: h.guardian_name,
        assigneeName: h.assignee_name,
        disabilityType: h.disability_type,
        submitAt: h.submit_at,
      },
      main: mainDetail
        ? {
            counsel_date: mainDetail.counsel_date,
            title: mainDetail.title,
            content: mainDetail.content,
          }
        : {
            counsel_date: "",
            title: "",
            content: "",
          },
      details: otherDetails.map((d) => ({
        detail_code: d.detail_code,
        counsel_date: d.counsel_date,
        title: d.title,
        content: d.content,
      })),
      priority,
      status: h.status,
      attachments: (attachRows || []).map((a) => ({
        attachCode: a.attach_code,
        originalFilename: decodeFilenameFromDb(a.original_filename),
        serverFilename: a.server_filename,
        filePath: a.file_path,
        url: `${a.file_path}/${a.server_filename}`,
      })),
    });
  } finally {
    conn.release();
  }
}

// 상담 승인 (request_approval.state = BA2 + counsel_note.status = CB5 + support_plan 생성)
async function approveCounsel(submitCode, processorCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) submitCode 로 counsel_note 찾기
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);
    if (!exist.length) {
      throw new Error("해당 제출코드의 상담이 존재하지 않습니다.");
    }
    const counselCode = exist[0].counsel_code;

    // 3) request_approval 상태 BA2로 업데이트 + processor_code 기록
    const result = await conn.query(sql.updateApprovalApprove, [
      processorCode || null, // 🔹 승인 처리자
      counselCode,
    ]);

    // 4) counsel_note.status = 'CB5' (검토완료) 로 변경
    await conn.query(sql.updateCounselNoteApprove, [counselCode]);

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

// 상담 반려 (request_approval.state = BA3 + rejection_reason + counsel_note.status = CB4)
async function rejectCounsel(submitCode, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) submitCode 로 counsel_code 찾기
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);
    if (!exist.length) {
      throw new Error("해당 제출코드의 상담이 존재하지 않습니다.");
    }
    const counselCode = exist[0].counsel_code;

    // 2) request_approval 상태 BA3로 + 반려사유
    const result = await conn.query(sql.updateApprovalReject, [
      reason || "",
      counselCode,
    ]);

    // 3) ✅ counsel_note.status = 'CB4' (반려) 로 변경
    await conn.query(sql.updateCounselNoteReject, [counselCode]);

    await conn.commit();
    return safeJSON({ affectedRows: result.affectedRows });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

//  반려 사유 조회
async function getRejectionReason(submitCode) {
  const conn = await pool.getConnection();
  try {
    // 1) submitCode 로 counsel_note 찾기
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);
    if (!exist || exist.length === 0) {
      // 해당 제출코드에 상담 자체가 없으면 null
      return null;
    }

    const counselCode = exist[0].counsel_code;

    // 2) request_approval 에서 반려 사유 조회
    const rows = await conn.query(sql.getRejectReasonByCounsel, [counselCode]);

    if (!rows || rows.length === 0) {
      // 반려 이력이 없으면 null
      return null;
    }

    // { rejection_reason: '...' } 형태로 리턴
    return safeJSON(rows[0]);
  } finally {
    conn.release();
  }
}

// 🔹 상담 임시저장
async function saveCounselTemp(body, files = []) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      submitCode,
      priority,
      mainForm,
      records,
      removeAttachmentCodes = [], // 🔥 작성 화면에서 삭제한 첨부 코드들
    } = body;
    const now = new Date();

    // 1) 기존 상담 존재 여부 확인
    const exist = await conn.query(sql.getCounselBySubmit, [submitCode]);

    let counsel_code;

    if (exist.length === 0) {
      // 처음 임시저장: status = CB1 (임시저장)
      const res = await conn.query(sql.insertCounselNote, [
        submitCode,
        "CB1", // 임시저장
        now,
      ]);
      counsel_code = res.insertId;
    } else {
      // 이미 있는 상담 → status 만 CB1 로 세팅 + written_at 갱신
      counsel_code = exist[0].counsel_code;
      await conn.query(sql.updateCounselNote, [
        "CB1", // status = 임시저장
        now,
        counsel_code,
      ]);
    }

    // 2) 기존 상담 상세 싹 지우고
    await conn.query(sql.deleteCounselDetails, [counsel_code]);

    // 3) 메인 상담 내용
    if (mainForm) {
      const mainDate = normalizeDateForDb(mainForm.counselDate);
      const mainTitle = (mainForm.title || "").trim();
      const mainContent = (mainForm.content || "").trim();

      if (mainDate || mainTitle || mainContent) {
        await conn.query(sql.insertCounselDetail, [
          counsel_code,
          mainDate,
          mainTitle,
          mainContent,
        ]);
      }
    }

    // 4) 추가 상담 기록들
    for (const rec of records || []) {
      const recDate = normalizeDateForDb(rec.counselDate);
      const recTitle = (rec.title || "").trim();
      const recContent = (rec.content || "").trim();

      if (!recDate && !recTitle && !recContent) continue;

      await conn.query(sql.insertCounselDetail, [
        counsel_code,
        recDate,
        recTitle,
        recContent,
      ]);
    }

    // 5) 우선순위도 임시저장에 반영
    await conn.query(sql.resetPriority, [submitCode]);
    await conn.query(sql.insertPriority, [submitCode, priority || "계획", "Y"]);

    // 6) 🔥 첨부파일 삭제 (임시저장 화면에서 삭제한 기존 첨부들)
    if (Array.isArray(removeAttachmentCodes) && removeAttachmentCodes.length) {
      for (const attachCode of removeAttachmentCodes) {
        if (attachCode == null) continue;
        await conn.query(sql.deleteAttachmentOne, [
          counsel_code, // linked_record_pk
          attachCode, // attach_code
        ]);
      }
    }

    // 7) 🔥 새로 업로드된 파일들 첨부로 INSERT
    if (Array.isArray(files) && files.length > 0) {
      const basePath = "/uploads/counsel";

      for (const f of files) {
        // counselRoute에서 originalname 이미 UTF-8로 복원해줌
        await conn.query(sql.insertAttachment, [
          f.originalname, // original_filename
          f.filename, // server_filename
          basePath, // file_path
          "counsel_note", // linked_table_name
          counsel_code, // linked_record_pk
        ]);
      }
    }

    await conn.commit();
    return safeJSON({
      counsel_code,
      mode: exist.length ? "update-temp" : "insert-temp",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  listCounselByRole,
  saveCounsel,
  getCounselDetail,
  approveCounsel,
  rejectCounsel,
  getRejectionReason,
  saveCounselTemp,
};
