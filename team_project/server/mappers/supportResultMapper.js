// server/mappers/supportResultMapper.js
const pool = require("../configs/db");
const sql = require("../sql/supportResultSql");
const { logHistoryDiff } = require("../utils/historyUtil");

function safeJSON(v) {
  return JSON.parse(
    JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x))
  );
}

function decodeOriginalName(file) {
  return file?.originalname || "";
}

// 🔹 결과 아이템들을 history 비교용 필드로 펼치는 헬퍼
//  - items[0] : 메인 결과 → 이미 goal / publicContent / privateContent 으로 처리
//  - index 1부터: 추가 결과 → item1_*, item2_* ... 로 history 필드 생성
function mergeResultItemsIntoHistory(
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

//목록
async function listSupportResultsByRole(role, userId) {
  const conn = await pool.getConnection();
  try {
    let rows;
    const safeUserId = Number(userId) || 0;

    if (role === 1) {
      // 🔹 일반 사용자: 내가 작성한 결과만
      rows = await conn.query(sql.listSupportResultByWriter, [safeUserId]);
    } else if (role === 2) {
      // 🔹 담당자: 내가 담당인 결과만
      rows = await conn.query(sql.listSupportResultByAssignee, [safeUserId]);
    } else if (role === 3) {
      // 🔹 기관 관리자: 내 기관 전체

      // 1) 내 기관 코드 조회
      const orgRows = await conn.query(sql.getOrgCodeByUser, [safeUserId]);
      const orgCode = orgRows[0]?.org_code;

      if (!orgCode) {
        // 기관 정보 없으면 빈 배열 반환
        rows = [];
      } else {
        // 2) 기관 기준 목록 조회
        rows = await conn.query(sql.listSupportResultByOrg, [orgCode]);
      }
    } else {
      // 🔹 role 4(시스템) 등 → 전체
      rows = await conn.query(sql.listSupportResultAll);
    }

    const mapped = rows.map((r) => ({
      resultCode: r.result_code,
      planCode: r.plan_code,
      submitCode: r.submit_code,
      status: r.status,
      submitAt: r.submit_at,
      writtenAt: r.plan_written_at,
      resultWrittenAt: r.result_written_at,
      childName: r.child_name,
      writerName: r.writer_name,
      assiName: r.assi_name,
      orgName: r.org_name ?? null,
      level: r.level ?? null,
    }));

    return safeJSON(mapped);
  } finally {
    conn.release();
  }
}

// 지원자 정보
async function getResultBasic(submitCode, planCodeFromQuery = null) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql.getResultBasicBySubmitCode, [submitCode]);
    const row = rows[0];

    if (!row) {
      throw new Error(
        "해당 submit_code의 지원결과 기본 정보를 찾을 수 없습니다."
      );
    }

    let planCode = null;

    // 1️⃣ 우선: 프론트에서 planCode를 넘겨줬다면 그걸 최우선 사용
    if (planCodeFromQuery) {
      planCode = planCodeFromQuery;
    } else {
      // 2️⃣ 없으면 기존 로직 유지

      // (1) 이 submit_code로 이미 만들어진 결과가 있는지 확인
      const [resPlanRow] = await conn.query(sql.getPlanCodeBySubmitFromResult, [
        submitCode,
      ]);

      if (resPlanRow && resPlanRow.plan_code) {
        // 👉 결과가 있는 경우: 결과에 연결된 plan_code 사용
        planCode = resPlanRow.plan_code;
      } else {
        // 👉 결과가 아직 없는 경우: "가장 최근 계획" 기준
        const [planRow] = await conn.query(sql.getPlanBySubmitCode, [
          submitCode,
        ]);
        planCode = planRow?.plan_code || null;
      }
    }

    let planGoals = [];

    if (planCode) {
      const goalRows = await conn.query(sql.getPlanGoalsByPlanCode, [planCode]);

      planGoals = (goalRows || [])
        .map((r) => (r.item_title || "").trim())
        .filter((v) => v)
        .filter((v, idx, arr) => arr.indexOf(v) === idx);
    }

    return safeJSON({
      submitCode: row.submit_code,

      childName: row.child_name || "",
      guardianName: row.guardian_name || "",
      assigneeName: row.assignee_name || "",
      disabilityType: row.disability_type || "",
      level: row.level || "",
      planSubmitAt: row.plan_submit_at,

      planGoals, // ✅ 이제 현재 planCode 기준으로만 들어감
    });
  } finally {
    conn.release();
  }
}

/**
 * 🔹 결과 최종 저장
 *  - 상태: CD4(검토중) 로 저장 (임시: CD1, 초기 자동생성: CD3)
 *  - support_result_item 갈아끼우고
 *  - 첨부파일 'support_result' 로 저장
 *  - 최초/제출 저장이므로 여기서는 히스토리 기록 ❌
 */
async function saveResultWithItems(formJson, files = []) {
  const { submitCode, planCode: rawPlanCode, mainForm, resultItems } = formJson;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ 0) planCode 결정 로직
    const explicitPlanCode = Number(rawPlanCode) || null;

    let planCode;
    let assiBy;

    if (explicitPlanCode) {
      // 🔹 프론트에서 planCode를 명시적으로 넘겨준 경우: 그 계획만 조회
      const planRows = await conn.query(
        "SELECT plan_code, assi_by FROM support_plan WHERE plan_code = ? LIMIT 1",
        [explicitPlanCode]
      );
      const plan = planRows[0];

      if (!plan || !plan.plan_code) {
        throw new Error("지정한 지원계획을 찾을 수 없습니다.");
      }

      planCode = plan.plan_code;
      assiBy = plan.assi_by || null;
    } else {
      // 🔹 기존 로직: submitCode 기준으로 최신 계획 1건 가져오기
      const [plan] = await conn.query(sql.getPlanBySubmitCode, [submitCode]);
      if (!plan || !plan.plan_code) {
        throw new Error("해당 제출건의 지원계획을 찾을 수 없습니다.");
      }

      planCode = plan.plan_code;
      assiBy = plan.assi_by || null;
    }

    // 1) plan_code 기준으로 기존 support_result 있는지 확인
    const [existing] = await conn.query(sql.getSupportResultByPlan, [planCode]);

    const actualFrom =
      mainForm.actualStart && mainForm.actualStart.length === 7
        ? mainForm.actualStart + "-01"
        : null;
    const actualTo =
      mainForm.actualEnd && mainForm.actualEnd.length === 7
        ? mainForm.actualEnd + "-01"
        : null;
    const writtenAt =
      mainForm.resultDate || new Date().toISOString().slice(0, 10);
    const status = "CD4"; // 검토중(제출완료)

    let resultCode;

    if (existing && existing.result_code) {
      // 🔁 이미 support_result 있으면 update
      resultCode = existing.result_code;

      await conn.query(sql.updateSupportResultByCode, [
        actualFrom,
        actualTo,
        status,
        writtenAt,
        resultCode,
      ]);

      // 기존 item 싹 지우고 다시 insert
      await conn.query(sql.deleteSupportResultItemsByResultCode, [resultCode]);
    } else {
      // 🆕 새로 생성
      const insertRes = await conn.query(sql.insertSupportResult, [
        planCode,
        actualFrom,
        actualTo,
        status,
        writtenAt,
        assiBy,
      ]);
      resultCode = insertRes.insertId;
    }

    // 2) 메인 결과 + 추가 결과들을 support_result_item에 insert
    const allItems = [
      {
        goal: mainForm.goal,
        publicContent: mainForm.publicContent,
        privateContent: mainForm.privateContent,
      },
      ...(resultItems || []),
    ];

    for (const item of allItems) {
      await conn.query(sql.insertSupportResultItem, [
        resultCode,
        item.goal || "",
        item.publicContent || "",
        item.privateContent || "",
        writtenAt,
      ]);
    }

    // 3) 첨부파일 → attachment에 저장
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const originalName = decodeOriginalName(file);
        const serverName = file.filename;
        const filePath = `/uploads/results/${serverName}`;

        await conn.query(sql.insertAttachmentForResult, [
          originalName,
          serverName,
          filePath,
          "support_result",
          resultCode,
        ]);
      }
    }

    // 4) request_approval 에 승인요청 한 줄 넣기
    const [existReq] = await conn.query(sql.getApprovalForResult, [resultCode]);

    if (!existReq) {
      const requesterCode = assiBy || null; // 담당자

      await conn.query(sql.insertRequestApprovalForResult, [
        requesterCode,
        null, // processor_code (관리자: 임시로 1)
        "AE5", // approval_type: 결과 승인
        "BA1", // state: 요청
        "support_result",
        resultCode,
      ]);
    }

    await conn.commit();
    return safeJSON({ resultCode });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 임시저장
async function saveResultTemp(formJson, files = []) {
  const {
    submitCode,
    planCode: rawPlanCode,
    mainForm,
    resultItems,
    removedAttachCodes = [],
  } = formJson;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ 1) planCode 결정
    const explicitPlanCode = Number(rawPlanCode) || null;

    let planCode;
    let assiBy;

    if (explicitPlanCode) {
      // 🔹 planCode가 명시적으로 넘어온 경우
      const planRows = await conn.query(
        "SELECT plan_code, assi_by FROM support_plan WHERE plan_code = ? LIMIT 1",
        [explicitPlanCode]
      );
      const plan = planRows[0];

      if (!plan || !plan.plan_code) {
        throw new Error("지정한 지원계획을 찾을 수 없습니다.");
      }

      planCode = plan.plan_code;
      assiBy = plan.assi_by || null;
    } else {
      // 🔹 기존 방식: submitCode로 최신 계획 찾기
      const [plan] = await conn.query(sql.getPlanBySubmitCode, [submitCode]);
      if (!plan || !plan.plan_code) {
        throw new Error("해당 제출건의 지원계획을 찾을 수 없습니다.");
      }

      planCode = plan.plan_code;
      assiBy = plan.assi_by || null;
    }

    // 2) plan_code 기준 기존 support_result 확인 (status 포함돼 있어야 함!)
    const [existing] = await conn.query(sql.getSupportResultByPlan, [planCode]);

    const actualFrom =
      mainForm.actualStart && mainForm.actualStart.length === 7
        ? mainForm.actualStart + "-01"
        : null;
    const actualTo =
      mainForm.actualEnd && mainForm.actualEnd.length === 7
        ? mainForm.actualEnd + "-01"
        : null;

    const writtenAt = null; // 임시저장은 작성일 null 유지
    const status = "CD1"; // 임시저장

    let resultCode;

    if (existing && existing.result_code) {
      // ✅ 이미 결과 헤더가 있는 경우
      resultCode = existing.result_code;

      const currentStatus = existing.status;

      // 🔒 제출/승인된 결과는 임시저장으로 되돌리면 안 됨
      const allowedStatuses = ["CD1", "CD3"]; // 임시 or 자동생성 초기 상태만 허용
      if (currentStatus && !allowedStatuses.includes(currentStatus)) {
        throw new Error(
          `현재 상태(${currentStatus})의 지원결과는 임시저장할 수 없습니다.`
        );
      }

      await conn.query(sql.updateSupportResultByCode, [
        actualFrom,
        actualTo,
        status, // CD1으로 세팅
        writtenAt,
        resultCode,
      ]);

      // 기존 item 싹 지우고 다시 넣기
      await conn.query(sql.deleteSupportResultItemsByResultCode, [resultCode]);
    } else {
      // 🆕 아주 예외적인 케이스: 결과 헤더가 하나도 없는 경우에만 새로 생성
      const insertRes = await conn.query(sql.insertSupportResult, [
        planCode,
        actualFrom,
        actualTo,
        status,
        writtenAt,
        assiBy,
      ]);
      resultCode = insertRes.insertId;
    }

    // 3) 메인 + 추가 결과 item 저장
    const allItems = [
      {
        goal: mainForm.goal,
        publicContent: mainForm.publicContent,
        privateContent: mainForm.privateContent,
      },
      ...(resultItems || []),
    ];

    for (const item of allItems) {
      await conn.query(sql.insertSupportResultItem, [
        resultCode,
        item.goal || "",
        item.publicContent || "",
        item.privateContent || "",
        writtenAt,
      ]);
    }

    // 4) 삭제 예정 첨부 삭제
    if (Array.isArray(removedAttachCodes) && removedAttachCodes.length > 0) {
      for (const code of removedAttachCodes) {
        const id = Number(code);
        if (!id) continue;
        await conn.query(sql.deleteAttachmentByCodeForResult, [id]);
      }
    }

    // 5) 첨부파일 INSERT (새로 선택한 것들)
    if (Array.isArray(files) && files.length > 0) {
      const basePath = "/uploads/results";

      for (const f of files) {
        const originalName = decodeOriginalName(f);
        await conn.query(sql.insertAttachmentForResult, [
          originalName,
          f.filename,
          basePath + "/" + f.filename,
          "support_result",
          resultCode,
        ]);
      }
    }

    await conn.commit();
    return safeJSON({
      resultCode,
      status,
      mode: existing && existing.result_code ? "update-temp" : "insert-temp",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 불러오기
async function getResultFormDataBySubmit(submitCode, planCodeFromQuery = null) {
  const conn = await pool.getConnection();
  try {
    let planCode;

    // 1️⃣ 프론트에서 planCode를 넘겨줬으면 그걸 우선 사용
    if (planCodeFromQuery) {
      planCode = planCodeFromQuery;
    } else {
      // 2️⃣ 없으면 기존처럼 submitCode로 계획 찾기
      const [plan] = await conn.query(sql.getPlanBySubmitCode, [submitCode]);
      if (!plan || !plan.plan_code) {
        return safeJSON({
          main: null,
          items: [],
          attachments: [],
        });
      }
      planCode = plan.plan_code;
    }

    // 2) plan_code → support_result 헤더들 조회
    const headers = await conn.query(sql.getSupportResultHeaderByPlan, [
      planCode,
    ]);

    const header = headers.find((h) => h.status === "CD1") || null;

    if (!header) {
      return safeJSON({
        main: null,
        items: [],
        attachments: [],
      });
    }

    const resultCode = header.result_code;

    const items = await conn.query(sql.getSupportResultItemsByResultCode, [
      resultCode,
    ]);
    const attachments = await conn.query(sql.getAttachmentsBySupportResult, [
      resultCode,
    ]);

    const mainItem = items[0] || null;
    const extraItems = items.slice(1).map((it) => ({
      resultItemCode: it.result_item_code,
      goal: it.item_title || "",
      publicContent: it.content_for_user || "",
      privateContent: it.content_for_org || "",
    }));

    const main = {
      resultDate: header.written_at,
      actualStart: header.actual_from
        ? String(header.actual_from).slice(0, 7)
        : "",
      actualEnd: header.actual_to ? String(header.actual_to).slice(0, 7) : "",
      goal: mainItem?.item_title || "",
      publicContent: mainItem?.content_for_user || "",
      privateContent: mainItem?.content_for_org || "",
    };

    const attachList = attachments.map((a) => ({
      attachCode: a.attach_code,
      originalFilename: a.original_filename,
      url: a.file_path,
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

/**
 * 🔹 지원결과 상세 조회 (수정 화면)
 *  - header(support_result)
 *  - items(support_result_item)
 *  - attachments(attachment, linked_table_name='support_result')
 */
async function getResultDetail(resultCode) {
  const conn = await pool.getConnection();
  try {
    // 1) 헤더
    const headers = await conn.query(sql.getSupportResultDetailByCode, [
      resultCode,
    ]);
    const header = headers[0];
    if (!header) {
      throw new Error("지원결과를 찾을 수 없습니다.");
    }

    // 🔹 이 계획에 달린 목표들
    const goalRows = await conn.query(sql.getPlanGoalsByPlanCode, [
      header.plan_code,
    ]);
    const planGoals = (goalRows || [])
      .map((r) => (r.item_title || "").trim())
      .filter((v) => v);

    // 2) item들 (메인 + 추가 결과)
    const items = await conn.query(sql.getSupportResultItemsByResultCode, [
      resultCode,
    ]);

    // 3) 첨부파일
    const attachments = await conn.query(sql.getAttachmentsBySupportResult, [
      resultCode,
    ]);

    const mainItem = items[0] || null;
    const extraItems = items.slice(1).map((it) => ({
      resultItemCode: it.result_item_code,
      goal: it.item_title || "",
      publicContent: it.content_for_user || "",
      privateContent: it.content_for_org || "",
    }));

    const main = {
      resultDate: header.written_at, // YYYY-MM-DD
      actualStart: header.actual_from
        ? String(header.actual_from).slice(0, 7)
        : "",
      actualEnd: header.actual_to ? String(header.actual_to).slice(0, 7) : "",
      goal: mainItem?.item_title || "",
      publicContent: mainItem?.content_for_user || "",
      privateContent: mainItem?.content_for_org || "",
    };

    const attachList = attachments.map((a) => ({
      attachCode: a.attach_code,
      originalFilename: a.original_filename,
      url: a.file_path,
    }));

    return safeJSON({
      status: header.status,
      planCode: header.plan_code, // 🔹 추가
      planGoals, // 🔹 추가
      main,
      items: extraItems,
      attachments: attachList,
    });
  } finally {
    conn.release();
  }
}

// 결과 수정 (+ 히스토리: BD4)
async function updateResultWithItems(formJson, files) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { resultCode, mainForm, resultItems, removedAttachCodes, modifier } =
      formJson;

    const resultId = Number(resultCode);
    if (!resultId) {
      throw new Error("resultCode가 유효하지 않습니다.");
    }

    // ⭐ 1) 수정 전 상태 가져오기 (헤더 + 전체 item)
    const headersBefore = await conn.query(sql.getSupportResultDetailByCode, [
      resultId,
    ]);
    const headerBefore = headersBefore[0];

    const itemsBefore = await conn.query(
      sql.getSupportResultItemsByResultCode,
      [resultId]
    );
    const mainBefore = itemsBefore[0] || {};

    let beforeRow = {
      actual_from: headerBefore?.actual_from || null,
      actual_to: headerBefore?.actual_to || null,
      goal: mainBefore?.item_title || "",
      publicContent: mainBefore?.content_for_user || "",
      privateContent: mainBefore?.content_for_org || "",
    };

    // 실제 진행기간 → actual_from / actual_to
    let actualFrom = null;
    let actualTo = null;

    if (mainForm?.actualStart && mainForm.actualStart.length === 7) {
      actualFrom = `${mainForm.actualStart}-01`;
    }
    if (mainForm?.actualEnd && mainForm.actualEnd.length === 7) {
      actualTo = `${mainForm.actualEnd}-01`;
    }

    // 2) support_result 기간만 업데이트 (status, written_at은 수정하지 않음)
    await conn.query(sql.updateSupportResultPeriodByCode, [
      actualFrom,
      actualTo,
      resultId,
    ]);

    // 3) 기존 item 전부 삭제
    await conn.query(sql.deleteSupportResultItemsByResultCode, [resultId]);

    // written_at
    const writtenAt =
      (mainForm?.resultDate && mainForm.resultDate.slice(0, 10)) ||
      new Date().toISOString().slice(0, 10);

    // 3-1) 메인 결과 insert
    await conn.query(sql.insertSupportResultItem, [
      resultId,
      mainForm?.goal || "",
      mainForm?.publicContent || "",
      mainForm?.privateContent || "",
      writtenAt,
    ]);

    // 3-2) 추가 결과들 insert
    if (Array.isArray(resultItems)) {
      for (const item of resultItems) {
        await conn.query(sql.insertSupportResultItem, [
          resultId,
          item.goal || "",
          item.publicContent || "",
          item.privateContent || "",
          writtenAt,
        ]);
      }
    }

    // 4) 수정 후 상태 다시 조회 (헤더 + 전체 item)
    const headersAfter = await conn.query(sql.getSupportResultDetailByCode, [
      resultId,
    ]);
    const headerAfter = headersAfter[0];

    const itemsAfter = await conn.query(sql.getSupportResultItemsByResultCode, [
      resultId,
    ]);
    const mainAfter = itemsAfter[0] || {};

    let afterRow = {
      actual_from: headerAfter?.actual_from || null,
      actual_to: headerAfter?.actual_to || null,
      goal: mainAfter?.item_title || "",
      publicContent: mainAfter?.content_for_user || "",
      privateContent: mainAfter?.content_for_org || "",
    };

    // 🔥 추가 결과들까지 history 비교 대상에 포함
    const merged = mergeResultItemsIntoHistory(
      itemsBefore,
      itemsAfter,
      beforeRow,
      afterRow
    );
    beforeRow = merged.beforeRow;
    afterRow = merged.afterRow;

    // 5) 첨부 삭제
    if (Array.isArray(removedAttachCodes) && removedAttachCodes.length > 0) {
      for (const code of removedAttachCodes) {
        const id = Number(code);
        if (!id) continue;
        await conn.query(sql.deleteAttachmentByCodeForResult, [id]);
      }
    }

    // 6) 새로 업로드된 파일들 attachment에 insert
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const originalName = decodeOriginalName(file);
        const serverName = file.filename;
        const filePath = `/uploads/results/${serverName}`;

        await conn.query(sql.insertAttachmentForResult, [
          originalName,
          serverName,
          filePath,
          "support_result",
          resultId,
        ]);
      }
    }

    // 🔹 7) 히스토리 기록 (실제 변경된 필드만)
    const fieldSet = new Set([
      "actual_from",
      "actual_to",
      "goal",
      "publicContent",
      "privateContent",
      ...Object.keys(beforeRow).filter((k) => k.startsWith("item")),
      ...Object.keys(afterRow).filter((k) => k.startsWith("item")),
    ]);

    await logHistoryDiff(conn, {
      tableName: "support_result",
      tablePk: resultId,
      modifier: modifier || null, // 프론트에서 넘겨줘야 함
      historyType: "BD4",
      beforeRow,
      afterRow,
      fields: Array.from(fieldSet),
    });

    await conn.commit();
    return safeJSON({ resultCode: resultId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 승인
async function approveSupportResult(resultCode, processorCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const id = Number(resultCode);
    if (!id) {
      throw new Error("유효한 resultCode가 아닙니다.");
    }

    // 0) result_code → plan_code 찾기
    const planRows = await conn.query(sql.getPlanCodeByResultCode, [id]);
    const planRow = planRows[0];

    if (!planRow || !planRow.plan_code) {
      throw new Error(
        "해당 result_code에 연결된 지원계획(plan)을 찾을 수 없습니다."
      );
    }

    const planCode = planRow.plan_code;

    // 1) 지원결과 상태 CD5(승인)로 변경
    await conn.query(sql.updateSupportResultStatus, ["CD5", id]);

    // 2) 연결된 support_plan 상태 CC5(결과 승인 완료)로 변경
    await conn.query(sql.updateSupportPlanStatusFromResult, ["CC5", planCode]);

    // 3) request_approval 승인 처리 (BA2) + processor_code 세팅
    const result = await conn.query(sql.updateApprovalApproveForResult, [
      processorCode || null, // 🔹 NULL 허용이면 이렇게
      id,
    ]);

    await conn.commit();
    return safeJSON({
      resultCode: id,
      planCode,
      affectedRows: result.affectedRows || result[0]?.affectedRows || 0,
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// 🔹 지원결과 반려 (CD7 + request_approval BA3 + 사유)
async function rejectSupportResult(resultCode, reason) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const id = Number(resultCode);
    if (!id) {
      throw new Error("유효한 resultCode가 아닙니다.");
    }

    // 1) 결과 상태 CD7(반려)로 변경
    await conn.query(sql.updateSupportResultStatus, ["CD7", id]);

    // 2) request_approval 반려 처리 + 사유 저장
    const result = await conn.query(sql.updateApprovalRejectForResult, [
      reason || "",
      id,
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

// 🔹 지원결과에 대한 반려 사유 조회
async function getRejectionReason(resultCode) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql.getRejectReasonByResult, [resultCode]);

    if (!rows || rows.length === 0) {
      // 반려 이력이 없으면 null
      return null;
    }

    // { rejection_reason: '...' } 형태
    return safeJSON(rows[0]);
  } finally {
    conn.release();
  }
}

//재승인 신청
async function resubmitResult(resultCode, requesterCode) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 현재 support_result 확인
    const [result] = await conn.query(sql.getSupportResultByCode, [resultCode]);
    if (!result) {
      throw new Error("해당 result_code의 지원결과를 찾을 수 없습니다.");
    }

    // 2) support_result 상태를 CD6(재승인요청)으로 변경
    await conn.query(sql.updateSupportResultStatus, ["CD6", resultCode]);

    // 3) request_approval에 새 승인요청 INSERT
    await conn.query(sql.insertRequestApprovalForResult, [
      requesterCode, // requester_code (담당자)
      null, // processor_code (관리자, 임시)
      "AE5", // approval_type
      "BA1", // state: 요청
      "support_result",
      resultCode, // linked_record_pk = result_code
    ]);

    await conn.commit();
    return safeJSON({
      resultCode,
      status: "CD6",
    });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = {
  listSupportResultsByRole,
  getResultBasic,
  saveResultWithItems,
  saveResultTemp,
  getResultFormDataBySubmit,
  getResultDetail,
  updateResultWithItems,
  approveSupportResult,
  rejectSupportResult,
  getRejectionReason,
  resubmitResult,
};
