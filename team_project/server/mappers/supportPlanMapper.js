// server/mappers/supportPlanMapper.js
const pool = require("../configs/db");
const sql = require("../sql/supportPlanSql");
const { logHistoryDiff } = require("../utils/historyUtil");

function safeJSON(v) {
  return JSON.parse(
    JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x))
  );
}

// 🔹 multer가 한글 파일명을 latin1로 줄 때 대비해서 복원해주는 헬퍼
function decodeOriginalName(file) {
  return file?.originalname || "";
}

// 🔹 계획 아이템들을 history 비교용 필드로 펼치는 헬퍼
//  - beforeItems[0] / afterItems[0] : 메인 계획 (이미 goal_p / publicContent_p / privateContent_p 로 따로 처리 중)
//  - index 1부터는 "추가 계획" → item1_*, item2_* ... 로 history 필드로 만듦
function mergePlanItemsIntoHistory(
  beforeItems = [],
  afterItems = [],
  beforeRow = {},
  afterRow = {}
) {
  const maxLen = Math.max(beforeItems.length, afterItems.length);

  for (let idx = 1; idx < maxLen; idx++) {
    const before = beforeItems[idx] || {};
    const after = afterItems[idx] || {};
    const n = idx; // 두 번째 아이템부터 item1_*, item2_* ...

    const keyGoal = `item${n}_goal`;
    const keyPublic = `item${n}_public`;
    const keyPrivate = `item${n}_private`;

    if (beforeRow) {
      beforeRow[keyGoal] = before.item_title || "";
      beforeRow[keyPublic] = before.content_for_user || "";
      beforeRow[keyPrivate] = before.content_for_org || "";
    }

    if (afterRow) {
      afterRow[keyGoal] = after.item_title || "";
      afterRow[keyPublic] = after.content_for_user || "";
      afterRow[keyPrivate] = after.content_for_org || "";
    }
  }

  return { beforeRow, afterRow };
}

// ---------------------------------------------------------------------
// 목록
// ---------------------------------------------------------------------
async function listSupportPlansByRole(role, userId) {
  const conn = await pool.getConnection();
  try {
    let rows;

    if (role === 1) {
      // 🔹 일반 사용자: 내가 작성한 것만
      rows = await conn.query(sql.listSupportPlanByWriter, [userId]);
    } else if (role === 2) {
      // 🔹 담당자: 내가 담당자인 것만
      rows = await conn.query(sql.listSupportPlanByAssignee, [userId]);
    } else if (role === 3) {
      // 🔹 관리자: 내 기관 소속 애들만
      const [admin] = await conn.query(
        "SELECT org_code FROM users WHERE user_code = ?",
        [userId]
      );

      const orgCode = admin?.org_code || null;

      if (!orgCode) {
        rows = [];
      } else {
        rows = await conn.query(sql.listSupportPlanByOrg, [orgCode]);
      }
    } else {
      // 🔹 시스템(4): 전체
      rows = await conn.query(sql.listSupportPlanAll);
    }

    const mapped = rows.map((r) => ({
      planCode: r.plan_code,
      submitCode: r.submit_code,
      status: r.status,
      writtenAt: r.written_at,
      submitAt: r.submit_at,
      writerName: r.writer_name,
      assiName: r.assi_name,
      orgName: r.org_name || null,
      childName: r.child_name || null,
      level: r.level || null,
    }));

    return safeJSON(mapped);
  } finally {
    conn.release();
  }
}
// 담당자용 목록
async function listAssigneePlanCandidates(userId) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql.listAssigneePlanCandidates, [userId]);

    const mapped = rows.map((r) => ({
      submitCode: r.submit_code,
      childCode: r.child_code,
      childName: r.child_name || null,
      writerName: r.writer_name || null,
      submitAt: r.submit_at,
      level: r.level || null,
    }));

    return safeJSON(mapped);
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------
// 기본정보
// ---------------------------------------------------------------------
async function getPlanBasic(submitCode) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql.getPlanBasicBySubmitCode, [submitCode]);
    const row = rows[0];

    if (!row) {
      throw new Error("해당 submit_code의 정보를 찾을 수 없습니다.");
    }

    const childName = row.child_name || null;
    const writerName = row.writer_name || null;

    return safeJSON({
      submitCode: row.submit_code,

      // 지원자
      childName: childName,
      name: writerName,

      // 보호자 = 작성자
      guardianName: writerName,

      // 담당자
      assigneeName: row.assignee_name || null,

      // 장애유형
      disabilityType: row.disability_type || null,

      // 상담지 제출일
      counselSubmitAt: row.counsel_submit_at || null,

      level: row.level || null,
    });
  } finally {
    conn.release();
  }
}

// 계획 저장
// supportPlanMapper.js

async function savePlanWithItems(formJson, files) {
  const {
    submitCode,
    mainForm,
    planItems,
    removedAttachCodes = [], // 🔹 최종 제출 시에도 삭제 요청 반영
  } = formJson;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 0) 담당자 user_code 가져오기 (survey_submission.assi_by)
    const assiRow = await conn.query(sql.getAssigneeBySubmit, [submitCode]);
    const assiInfo = assiRow[0];
    const assiByFromSubmit = assiInfo ? assiInfo.assi_by : null;

    // YYYY-MM → YYYY-MM-01 형태로 저장
    const planFrom =
      mainForm.expectedStart && mainForm.expectedStart.length === 7
        ? mainForm.expectedStart + "-01"
        : null;
    const planTo =
      mainForm.expectedEnd && mainForm.expectedEnd.length === 7
        ? mainForm.expectedEnd + "-01"
        : null;

    const writtenAt = mainForm.planDate || new Date();
    const status = "CC3"; // 작성 완료(제출)

    // 🔥 1) 먼저, submitCode 기준으로 "임시(CC1)" 계획 있는지 확인
    const [existingTemp] = await conn.query(
      sql.getSupportPlanBySubmitCode,
      [submitCode] // 이미 status = 'CC1' 조건 포함
    );

    let planCode;
    let assiBy = assiByFromSubmit || null;

    if (existingTemp && existingTemp.plan_code) {
      // ✅ 이미 임시 저장된 계획이 있음 → 그 행을 "작성 완료"로 승격

      planCode = existingTemp.plan_code;
      assiBy = existingTemp.assi_by || assiByFromSubmit || null;

      // 기간 + 상태 + 작성일 업데이트 (CC1 → CC3)
      await conn.query(sql.updateSupportPlanByCode, [
        planFrom,
        planTo,
        status,
        writtenAt,
        planCode,
      ]);

      // 기존 item 싹 지우고
      await conn.query(sql.deleteSupportPlanItemsByPlanCode, [planCode]);
    } else {
      // 🆕 임시 계획이 없으면 새로 support_plan 생성
      const result = await conn.query(sql.insertSupportPlan, [
        submitCode,
        planFrom,
        planTo,
        status,
        writtenAt,
        assiBy,
      ]);
      planCode = result.insertId;
    }

    // 2) 메인 계획 + 추가 계획들을 support_plan_item에 insert
    const allItems = [
      {
        goal: mainForm.goal,
        publicContent: mainForm.publicContent,
        privateContent: mainForm.privateContent,
      },
      ...(planItems || []),
    ];

    for (const item of allItems) {
      await conn.query(sql.insertSupportPlanItem, [
        planCode,
        item.goal,
        item.publicContent,
        item.privateContent,
        writtenAt,
      ]);
    }

    // 3) 삭제 요청된 첨부파일 제거 (임시에서의 기존 첨부 정리)
    if (Array.isArray(removedAttachCodes) && removedAttachCodes.length > 0) {
      for (const code of removedAttachCodes) {
        const id = Number(code);
        if (!id) continue;
        await conn.query(sql.deleteAttachmentByCode, [id]);
      }
    }

    // 4) 새로 업로드된 첨부파일 INSERT
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const originalName = decodeOriginalName(file);
        const serverName = file.filename;
        const filePath = `/uploads/plans/${serverName}`;

        await conn.query(sql.insertAttachment, [
          originalName,
          serverName,
          filePath,
          "support_plan",
          planCode,
        ]);
      }
    }

    // 5) 이미 승인요청이 있는지 체크해서 중복 방지
    const [existReq] = await conn.query(sql.getApprovalForPlan, [planCode]);

    if (!existReq) {
      const requesterCode = assiBy || assiByFromSubmit || null;

      await conn.query(sql.insertRequestApprovalForPlan, [
        requesterCode,
        null,
        "AE4",
        "BA1",
        "support_plan",
        planCode,
      ]);
    }

    await conn.commit();
    return safeJSON({ planCode });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------
// 상세 조회
// ---------------------------------------------------------------------
async function getPlanDetail(planCode) {
  const conn = await pool.getConnection();
  try {
    // 1) 헤더
    const headers = await conn.query(sql.getSupportPlanDetailByCode, [
      planCode,
    ]);
    const header = headers[0];
    if (!header) {
      throw new Error("지원계획을 찾을 수 없습니다.");
    }

    // 2) item들 (메인 + 추가 계획)
    const items = await conn.query(sql.getSupportPlanItemsByPlanCode, [
      planCode,
    ]);

    // 3) 첨부파일
    const attachments = await conn.query(sql.getAttachmentsBySupportPlan, [
      planCode,
    ]);

    const mainItem = items[0] || null;
    const extraItems = items.slice(1).map((it) => ({
      planItemCode: it.plan_item_code,
      goal: it.item_title || "",
      publicContent: it.content_for_user || "",
      privateContent: it.content_for_org || "",
    }));

    const main = {
      planDate: header.written_at, // YYYY-MM-DD
      expectedStart: header.plan_from
        ? String(header.plan_from).slice(0, 7)
        : "",
      expectedEnd: header.plan_to ? String(header.plan_to).slice(0, 7) : "",
      goal: mainItem?.item_title || "",
      publicContent: mainItem?.content_for_user || "",
      privateContent: mainItem?.content_for_org || "",
    };

    const attachList = attachments.map((a) => ({
      attachCode: a.attach_code,
      originalFilename: a.original_filename,
      url: a.file_path, // '/uploads/plans/파일명...'
    }));

    return safeJSON({
      status: header.status,
      main,
      items: extraItems,
      attachments: attachList,
    });
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------
// 지원계획 수정 + 항목 + 첨부 + 히스토리
//  - 메인 + 추가 계획까지 모두 history에 반영
// ---------------------------------------------------------------------
async function updatePlanWithItems(formJson, files) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { planCode, mainForm, planItems, removedAttachCodes, modifier } =
      formJson;

    const planId = Number(planCode);
    if (!planId) {
      throw new Error("planCode가 유효하지 않습니다.");
    }

    // ⭐ 1) 수정 전 상태 조회 (beforeRow)
    const beforePlan = await conn.query(sql.getSupportPlanPeriodByCode, [
      planId,
    ]);

    const beforeItems = await conn.query(sql.getSupportPlanItemsByPlanCode, [
      planId,
    ]);

    let beforeRow = {
      plan_from: beforePlan[0]?.plan_from || null,
      plan_to: beforePlan[0]?.plan_to || null,
      goal_p: beforeItems[0]?.item_title || "",
      publicContent_p: beforeItems[0]?.content_for_user || "",
      privateContent_p: beforeItems[0]?.content_for_org || "",
    };

    // 예상 진행기간 → plan_from / plan_to
    let planFrom = null;
    let planTo = null;

    if (mainForm?.expectedStart && mainForm.expectedStart.length === 7) {
      planFrom = `${mainForm.expectedStart}-01`;
    }
    if (mainForm?.expectedEnd && mainForm.expectedEnd.length === 7) {
      planTo = `${mainForm.expectedEnd}-01`;
    }

    // 2) support_plan 기간 업데이트
    await conn.query(sql.updateSupportPlanPeriodByCode, [
      planFrom,
      planTo,
      planId,
    ]);

    // 기존 item 전부 삭제
    await conn.query(sql.deleteSupportPlanItemsByPlanCode, [planId]);

    const writtenAt =
      (mainForm?.planDate && mainForm.planDate.slice(0, 10)) ||
      new Date().toISOString().slice(0, 10);

    // 메인 item 재생성
    await conn.query(sql.insertSupportPlanItem, [
      planId,
      mainForm?.goal || "",
      mainForm?.publicContent || "",
      mainForm?.privateContent || "",
      writtenAt,
    ]);

    // 추가 item 입력
    if (Array.isArray(planItems)) {
      for (const item of planItems) {
        await conn.query(sql.insertSupportPlanItem, [
          planId,
          item.goal || "",
          item.publicContent || "",
          item.privateContent || "",
          writtenAt,
        ]);
      }
    }

    // 첨부 삭제
    if (Array.isArray(removedAttachCodes) && removedAttachCodes.length > 0) {
      for (const code of removedAttachCodes) {
        const id = Number(code);
        if (!id) continue;
        await conn.query(sql.deleteAttachmentByCode, [id]);
      }
    }

    // 새 파일 추가
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const originalName = decodeOriginalName(file);
        const serverName = file.filename;
        const filePath = `/uploads/plans/${serverName}`;

        await conn.query(sql.insertAttachment, [
          originalName,
          serverName,
          filePath,
          "support_plan",
          planId,
        ]);
      }
    }

    // ⭐ 2) 수정 후 상태 조회 (afterRow)
    const afterPlan = await conn.query(sql.getSupportPlanPeriodByCode, [
      planId,
    ]);

    const afterItems = await conn.query(sql.getSupportPlanItemsByPlanCode, [
      planId,
    ]);

    let afterRow = {
      plan_from: afterPlan[0]?.plan_from || null,
      plan_to: afterPlan[0]?.plan_to || null,
      goal_p: afterItems[0]?.item_title || "",
      publicContent_p: afterItems[0]?.content_for_user || "",
      privateContent_p: afterItems[0]?.content_for_org || "",
    };

    // 🔥 메인 외에 "추가 계획"들까지 history 비교 대상에 포함
    const merged = mergePlanItemsIntoHistory(
      beforeItems,
      afterItems,
      beforeRow,
      afterRow
    );
    beforeRow = merged.beforeRow;
    afterRow = merged.afterRow;

    // 비교해야 할 모든 필드 목록
    const fieldSet = new Set([
      "plan_from",
      "plan_to",
      "goal_p",
      "publicContent_p",
      "privateContent_p",
      ...Object.keys(beforeRow).filter((k) => k.startsWith("item")),
      ...Object.keys(afterRow).filter((k) => k.startsWith("item")),
    ]);

    // ⭐ 3) 히스토리 기록 (변경된 필드만 INSERT)
    await logHistoryDiff(conn, {
      tableName: "support_plan",
      tablePk: planId,
      modifier: modifier, // 프론트에서 보내온 user_code
      historyType: "BD3", // 계획 수정 타입 코드
      beforeRow,
      afterRow,
      fields: Array.from(fieldSet),
    });

    await conn.commit();
    return safeJSON({ planCode: planId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 계획서 임시저장
async function savePlanTemp(formJson, files = []) {
  const {
    submitCode,
    mainForm,
    planItems,
    removedAttachCodes = [], // 작성 화면에서 삭제한 첨부들
  } = formJson;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ⭐ 추가: submitCode 기준 담당자(assi_by) 조회
    const assiRow = await conn.query(sql.getAssigneeBySubmit, [submitCode]);
    const assiInfo = assiRow[0];
    const assiByFromSubmit = assiInfo ? assiInfo.assi_by : null;

    // 1) 기존 support_plan 있는지 확인 (여기 쿼리는 지금 CC1만 가져오게 바꿔둔 거지?)
    const [existing] = await conn.query(sql.getSupportPlanBySubmitCode, [
      submitCode,
    ]);

    // YYYY-MM → YYYY-MM-01
    const planFrom =
      mainForm.expectedStart && mainForm.expectedStart.length === 7
        ? mainForm.expectedStart + "-01"
        : null;
    const planTo =
      mainForm.expectedEnd && mainForm.expectedEnd.length === 7
        ? mainForm.expectedEnd + "-01"
        : null;

    const writtenAt = mainForm.planDate || new Date();
    const status = "CC1"; // 임시저장 상태

    let planCode;
    // 🔹 기본 담당자는 survey_submission.assi_by 기준
    let assiBy = assiByFromSubmit || null;

    if (existing && existing.plan_code) {
      // 🔁 이미 임시 계획 있음 → 덮어쓰기
      planCode = existing.plan_code;
      // 기존에 저장돼 있던 assi_by가 있으면 우선, 없으면 submit 기준으로 채움
      assiBy = existing.assi_by || assiByFromSubmit || null;

      await conn.query(sql.updateSupportPlanByCode, [
        planFrom,
        planTo,
        status,
        writtenAt,
        planCode,
      ]);

      // 기존 item 싹 지우고 다시 넣기
      await conn.query(sql.deleteSupportPlanItemsByPlanCode, [planCode]);
    } else {
      // 🆕 처음 임시저장할 때 support_plan 생성
      const result = await conn.query(sql.insertSupportPlan, [
        submitCode,
        planFrom,
        planTo,
        status,
        writtenAt,
        assiBy, // ✅ 이제 여기에는 담당자 user_code가 들어감
      ]);
      planCode = result.insertId;
    }

    // 2) 메인 + 추가 계획 item 저장
    const allItems = [
      {
        goal: mainForm.goal,
        publicContent: mainForm.publicContent,
        privateContent: mainForm.privateContent,
      },
      ...(planItems || []),
    ];

    for (const item of allItems) {
      await conn.query(sql.insertSupportPlanItem, [
        planCode,
        item.goal,
        item.publicContent,
        item.privateContent,
        writtenAt,
      ]);
    }

    // 3) 작성 화면에서 삭제한 기존 첨부 삭제
    if (Array.isArray(removedAttachCodes) && removedAttachCodes.length > 0) {
      for (const code of removedAttachCodes) {
        const id = Number(code);
        if (!id) continue;
        await conn.query(sql.deleteAttachmentByCode, [id]);
      }
    }

    // 4) 첨부파일 INSERT (새로 선택한 것들)
    if (Array.isArray(files) && files.length > 0) {
      const basePath = "/uploads/plans";

      for (const f of files) {
        const originalName = decodeOriginalName(f);
        await conn.query(sql.insertAttachment, [
          originalName,
          f.filename,
          basePath + "/" + f.filename,
          "support_plan",
          planCode,
        ]);
      }
    }

    await conn.commit();
    return safeJSON({
      planCode,
      status,
      mode: existing && existing.plan_code ? "update-temp" : "insert-temp",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// ---------------------------------------------------------------------
// 작성 화면에서 "불러오기" 할 때 사용하는 데이터
// ---------------------------------------------------------------------
async function getPlanFormDataBySubmit(submitCode) {
  const conn = await pool.getConnection();
  try {
    // 1) submit_code 로 support_plan 헤더 찾기 (임시저장/작성 완료 통합)
    const headers = await conn.query(sql.getSupportPlanHeaderBySubmit, [
      submitCode,
    ]);
    const header = headers[0];

    if (!header) {
      // 아직 작성/임시저장된 계획이 없는 경우
      return safeJSON({
        main: null,
        items: [],
        attachments: [],
      });
    }

    const planCode = header.plan_code;

    // 2) item들
    const items = await conn.query(sql.getSupportPlanItemsByPlanCode, [
      planCode,
    ]);

    // 3) 첨부파일
    const attachments = await conn.query(sql.getAttachmentsBySupportPlan, [
      planCode,
    ]);

    const mainItem = items[0] || null;
    const extraItems = items.slice(1).map((it) => ({
      planItemCode: it.plan_item_code,
      goal: it.item_title || "",
      publicContent: it.content_for_user || "",
      privateContent: it.content_for_org || "",
    }));

    const main = {
      planDate: header.written_at,
      expectedStart: header.plan_from
        ? String(header.plan_from).slice(0, 7)
        : "",
      expectedEnd: header.plan_to ? String(header.plan_to).slice(0, 7) : "",
      goal: mainItem?.item_title || "",
      publicContent: mainItem?.content_for_user || "",
      privateContent: mainItem?.content_for_org || "",
    };

    const attachList = attachments.map((a) => ({
      attachCode: a.attach_code,
      originalFilename: a.original_filename,
      url: a.file_path, // '/uploads/plans/파일명_날짜.hwp'
    }));

    return safeJSON({
      main,
      items: extraItems,
      attachments: attachList,
    });
  } finally {
    conn.release();
  }
}

//승인
async function approveSupportPlan(planCode, processorCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const planId = Number(planCode);
    if (!planId) {
      throw new Error("유효한 planCode가 아닙니다.");
    }

    // 1) support_plan 상태 CC4(승인)로 변경
    await conn.query(sql.updateSupportPlanStatus, ["CC4", planId]);

    // 2) request_approval 상태 BA2(승인)로 변경 + processor_code 세팅
    const result = await conn.query(sql.updateApprovalApproveForPlan, [
      processorCode || null, // 🔹 null 허용이면 이렇게
      planId,
    ]);

    // 3) ✅ support_result 헤더 자동 생성 (이미 있으면 생성 안 함)
    const [existingResult] = await conn.query(sql.getSupportResultByPlan, [
      planId,
    ]);

    if (!existingResult) {
      const [planRow] = await conn.query(sql.getSupportPlanByCode, [planId]);
      if (!planRow) {
        throw new Error("지원계획 정보를 찾을 수 없습니다.");
      }

      const assiBy = planRow.assi_by || null;

      await conn.query(sql.insertSupportResultFromPlan, [planId, assiBy]);
    }

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

// ---------------------------------------------------------------------
// 지원계획 반려 (CC7 + request_approval BA3 + 사유)
// ---------------------------------------------------------------------
async function rejectSupportPlan(planCode, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const planId = Number(planCode);
    if (!planId) {
      throw new Error("유효한 planCode가 아닙니다.");
    }

    // 1) support_plan 상태 CC7(반려)로 변경
    await conn.query(sql.updateSupportPlanStatus, ["CC7", planId]);

    // 2) request_approval 상태 BA3(반려) + 사유 업데이트
    const result = await conn.query(sql.updateApprovalRejectForPlan, [
      reason || "",
      planId,
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

// ---------------------------------------------------------------------
// 지원계획(plan)에 대한 반려 사유,일자 조회
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// 재승인 신청
// ---------------------------------------------------------------------
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
    await conn.query(sql.updateSupportPlanStatus, ["CC6", planCode]);

    // 3) request_approval에 새 승인요청 INSERT
    await conn.query(sql.insertRequestApprovalForPlan, [
      requesterCode, // requester_code (담당자)
      null, // processor_code (관리자)
      "AE4", // approval_type
      "BA1", // state: 요청
      "support_plan",
      planCode, // linked_record_pk = plan_code
    ]);

    await conn.commit();
    return safeJSON({
      planCode,
      status: "CC6",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  listSupportPlansByRole,
  getPlanBasic,
  savePlanWithItems,
  getPlanDetail,
  updatePlanWithItems,
  savePlanTemp,
  getPlanFormDataBySubmit,
  rejectSupportPlan,
  approveSupportPlan,
  getRejectionReason,
  resubmitPlan,
  listAssigneePlanCandidates,
};
