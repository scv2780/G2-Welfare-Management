// server/routes/counselRoute.js
const express = require("express");
const router = express.Router();
const counselService = require("../services/counselService");

// 🔹 파일 업로드용 모듈
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// BigInt → Number (JSON 직렬화 보호용)
const toSafeJson = (obj) =>
  JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? Number(v) : v))
  );

const uploadDir = path.join(__dirname, "..", "uploads", "counsel");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    // 1) 업로드 시 넘어온 이름을 UTF-8로 복원
    const decodedName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );

    // 🔥 여기서 multer가 들고 있는 originalname도 교체해버리자
    // 이렇게 해야 나중에 mapper에서 f.originalname를 써도 한글이 제대로 들어 있음
    file.originalname = decodedName;

    const ext = path.extname(decodedName); // ".docx"
    const baseName = path.basename(decodedName, ext); // "테이블정의서양식"

    // 오늘 날짜
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}${mm}${dd}`;

    // 이상한 특수문자 정리
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");

    // 최종 서버 파일명
    const newFileName = `${safeBaseName}_${todayStr}${ext}`;

    cb(null, newFileName);
  },
});

const upload = multer({ storage });

/**
 * 상담 목록 조회
 * GET /counsel?role=2&userId=2
 */
router.get("/", async (req, res) => {
  try {
    const role = Number(req.query.role || 2);
    const userId = Number(req.query.userId || 1);

    const rows = await counselService.listCounsel(role, userId);

    res.json({ success: true, result: toSafeJson(rows) });
  } catch (e) {
    console.error("[GET /counsel]", e);
    res.status(500).json({
      success: false,
      message: e.message || "상담 목록 조회 중 오류",
    });
  }
});

// 상담 저장 (파일 + JSON 함께 처리)
router.post("/new", upload.array("mainFiles"), async (req, res) => {
  try {
    // 프론트에서 보낸 JSON 문자열
    const rawJson = req.body.formJson || "{}";
    const body = JSON.parse(rawJson);

    // multer가 저장한 파일 배열
    const files = req.files || [];

    const result = await counselService.saveCounsel(body, files);
    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /counsel/new]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 반려 사유 조회
router.get("/:submitCode/rejection-reason", async (req, res) => {
  try {
    console.log("🔍 [REJECTION-REASON] params:", req.params);
    console.log("🔍 [REJECTION-REASON] originalUrl:", req.originalUrl);
    const submitCode = Number(req.params.submitCode);

    if (!submitCode) {
      return res.status(400).json({
        success: false,
        message: "유효한 제출번호가 아닙니다.",
      });
    }

    const result = await counselService.getRejectionReason(submitCode);

    if (!result) {
      return res.status(200).json({
        success: false,
        message: "반려 사유를 찾을 수 없습니다.",
      });
    }

    // 🔥 날짜 포함해서 내려주기!
    res.json({
      success: true,
      result, // → { rejection_reason, rejection_date }
      rejection_reason: result.rejection_reason,
      rejection_date: result.rejection_date, // ← 추가!
    });
  } catch (e) {
    console.error("[GET /counsel/:submitCode/rejection-reason]", e);
    res.status(500).json({
      success: false,
      message: e.message || "반려 사유 조회 중 오류가 발생했습니다.",
    });
  }
});

// 상세조회
router.get("/:submitCode", async (req, res) => {
  try {
    const submitCode = Number(req.params.submitCode);
    const result = await counselService.getCounselDetail(submitCode);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "상담 정보를 찾을 수 없습니다." });
    }

    res.json({ success: true, result });
  } catch (e) {
    console.error("[GET /counsel/:submitCode]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 상담 승인
router.post("/:submitCode/approve", async (req, res) => {
  try {
    const submitCode = Number(req.params.submitCode);
    const processorCode = Number(req.body.processorCode) || null; // 🔹 추가

    if (!submitCode) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 submitCode가 아닙니다." });
    }

    const result = await counselService.approveCounsel(
      submitCode,
      processorCode
    );

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /counsel/:submitCode/approve]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 상담 반려
router.post("/:submitCode/reject", async (req, res) => {
  try {
    const submitCode = Number(req.params.submitCode);
    const { reason } = req.body;

    const result = await counselService.rejectCounsel(submitCode, reason);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /counsel/:submitCode/reject]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 상담 임시저장
router.post("/temp", upload.array("mainFiles"), async (req, res) => {
  try {
    const rawJson = req.body.formJson || "{}";
    const body = JSON.parse(rawJson);

    const files = req.files || []; // multer가 저장한 파일들

    const result = await counselService.saveCounselTemp(body, files);
    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /counsel/temp]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
