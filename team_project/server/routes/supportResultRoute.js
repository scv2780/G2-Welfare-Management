// server/routes/supportResultRoute.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const supportResultService = require("../services/supportResultService");

const toSafeJson = (obj) =>
  JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? Number(v) : v))
  );

// 🔹 지원결과 파일 업로드 디렉터리
const uploadDir = path.join(__dirname, "..", "uploads", "results");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const decodedName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    file.originalname = decodedName;

    const ext = path.extname(decodedName);
    const baseName = path.basename(decodedName, ext);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}${mm}${dd}`;

    const safeBaseName = baseName.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
    const newFileName = `${safeBaseName}_${todayStr}${ext}`;
    cb(null, newFileName);
  },
});

const upload = multer({ storage });

/**
 * 🔹 결과 목록
 *   GET /api/result?role=2&userId=...
 */
router.get("/", async (req, res) => {
  try {
    const role = Number(req.query.role || 2);
    const userId = Number(req.query.userId || 1); // 나중에 세션으로 교체 가능

    const result = await supportResultService.listResults(role, userId);

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /result]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원결과 목록 조회 중 오류",
    });
  }
});

/**
 * 🔹 임시저장/작성중 결과 불러오기 (작성 화면용)
 *   GET /api/result/form/:submitCode
 */
router.get("/form/:submitCode", async (req, res) => {
  try {
    const submitCode = Number(req.params.submitCode || 0);
    const planCode = req.query.planCode ? Number(req.query.planCode) : null;

    if (!submitCode) {
      return res
        .status(400)
        .json({ success: false, message: "submitCode가 필요합니다." });
    }

    const result = await supportResultService.getResultFormDataBySubmit(
      submitCode,
      planCode
    );

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /result/form/:submitCode]", e);
    res.status(500).json({
      success: false,
      message: e.message || "임시 저장된 지원결과 조회 중 오류",
    });
  }
});

/**
 * 🔹 지원결과 상세 조회 (수정/상세 화면용)
 *   GET /api/result/detail/:resultCode
 */
router.get("/detail/:resultCode", async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode || 0);
    if (!resultCode) {
      return res
        .status(400)
        .json({ success: false, message: "resultCode가 필요합니다." });
    }

    const result = await supportResultService.getResultDetail(resultCode);

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /result/detail/:resultCode]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원결과 상세 조회 중 오류",
    });
  }
});

// 기본정보
router.get("/:submitCode", async (req, res) => {
  try {
    const submitCode = Number(req.params.submitCode || 0);
    if (!submitCode) {
      return res
        .status(400)
        .json({ success: false, message: "submitCode가 필요합니다." });
    }

    const planCode = req.query.planCode ? Number(req.query.planCode) : null; // 🔹 추가

    const result = await supportResultService.getResultBasic(
      submitCode,
      planCode // 🔹 전달
    );

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /result/:submitCode]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원결과 기본 정보 조회 중 오류",
    });
  }
});

/**
 * 🔹 결과 임시 저장
 *   POST /api/result/temp
 *   FormData:
 *    - formJson: { submitCode, mainForm, resultItems, removedAttachCodes }
 *    - resultFiles: File[]
 */
router.post("/temp", upload.array("resultFiles"), async (req, res) => {
  try {
    const rawJson = req.body.formJson || "{}";
    const formJson = JSON.parse(rawJson);
    const files = req.files || [];

    const result = await supportResultService.saveResultTemp(formJson, files);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /result/temp]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * 🔹 결과 최종 제출
 *   POST /api/result/new
 *   FormData:
 *    - formJson: { submitCode, mainForm, resultItems, removedAttachCodes }
 *    - resultFiles: File[]
 */
router.post("/new", upload.array("resultFiles"), async (req, res) => {
  try {
    const { formJson } = req.body;
    if (!formJson) {
      return res
        .status(400)
        .json({ success: false, message: "formJson이 누락되었습니다." });
    }

    const parsed = JSON.parse(formJson);
    const files = req.files || [];

    const result = await supportResultService.saveResultWithItems(
      parsed,
      files
    );

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[POST /result/new]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원결과 저장 중 오류",
    });
  }
});

/**
 * 🔹 지원결과 수정 (JSON + 파일)
 *   PUT /api/result/:resultCode
 *   - formJson + resultFiles[]
 */
router.put("/:resultCode", upload.array("resultFiles"), async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode || 0);
    if (!resultCode) {
      return res
        .status(400)
        .json({ success: false, message: "resultCode가 필요합니다." });
    }

    const raw = req.body.formJson || "{}";
    const formJson = JSON.parse(raw);
    formJson.resultCode = formJson.resultCode || resultCode;

    const result = await supportResultService.updateResultWithItems(
      formJson,
      req.files || []
    );

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[PUT /result/:resultCode]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원결과 수정 중 오류",
    });
  }
});

/**
 * 🔹 지원결과 승인
 *   POST /api/result/:resultCode/approve
 */
router.post("/:resultCode/approve", async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode || 0);
    if (!resultCode) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 resultCode가 아닙니다." });
    }

    const processorCode = Number(req.body.processorCode) || null; // 🔹 추가

    const result = await supportResultService.approveSupportResult(
      resultCode,
      processorCode
    );

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[POST /result/:resultCode/approve]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원결과 승인 처리 중 오류",
    });
  }
});

/**
 * 🔹 지원결과 반려
 *   POST /api/result/:resultCode/reject
 *   body: { reason: "반려 사유" }
 */
router.post("/:resultCode/reject", async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode || 0);
    const { reason } = req.body;

    if (!resultCode) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 resultCode가 아닙니다." });
    }

    const result = await supportResultService.rejectSupportResult(
      resultCode,
      reason || ""
    );

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[POST /result/:resultCode/reject]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원결과 반려 처리 중 오류",
    });
  }
});

//반려사유 조회
router.get("/:resultCode/rejection-reason", async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode);

    if (!resultCode) {
      return res.status(400).json({
        success: false,
        message: "유효한 결과 코드가 아닙니다.",
      });
    }

    const result = await supportResultService.getRejectionReason(resultCode);

    if (!result) {
      // 반려 이력이 없는 경우
      return res.status(200).json({
        success: false,
        message: "반려 사유를 찾을 수 없습니다.",
      });
    }

    // { rejection_reason: '...' } 그대로 넘겨줌
    return res.json({
      success: true,
      result,
      rejection_reason: result.rejection_reason,
      rejection_date: result.approval_date,
    });
  } catch (e) {
    console.error("[GET /api/result/:resultCode/rejection-reason]", e);
    res.status(500).json({
      success: false,
      message: e.message || "반려 사유 조회 중 오류가 발생했습니다.",
    });
  }
});

//재승인요청
router.post("/:resultCode/resubmit", async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode);
    const requesterCode = Number(req.body.requesterCode || 0); // 담당자 user_code

    if (!resultCode) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 resultCode 아닙니다." });
    }
    if (!requesterCode) {
      // 나중에 로그인 붙이면 req.user.user_code 같은 걸로 대체
      return res
        .status(400)
        .json({ success: false, message: "요청자 코드가 없습니다." });
    }

    const result = await supportResultService.resubmitResult(
      resultCode,
      requesterCode
    );

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /result/:resultCode/resubmit]", e);
    res.status(500).json({
      success: false,
      message: e.message || "재승인 요청 처리 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
