// server/routes/supportPlanRoute.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const supportPlanService = require("../services/supportPlanService");

const toSafeJson = (obj) =>
  JSON.parse(
    JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? Number(v) : v))
  );

const uploadDir = path.join(__dirname, "..", "uploads", "plans");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 여기 storage 정의는 new / temp 공용으로 사용
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    // 1) latin1 → utf8 복원 (한글 깨짐 방지)
    const decodedName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    file.originalname = decodedName;

    const ext = path.extname(decodedName); // ".hwp"
    const baseName = path.basename(decodedName, ext); // "지원계획서"

    // 오늘 날짜(YYYYMMDD)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}${mm}${dd}`;

    // 파일명에 쓸 수 없는 특수문자 정리
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");

    const newFileName = `${safeBaseName}_${todayStr}${ext}`;
    cb(null, newFileName);
  },
});

const upload = multer({ storage });

//목록
router.get("/", async (req, res) => {
  try {
    const role = Number(req.query.role || 2);
    const userId = Number(req.query.userId || 1); // TODO: 로그인 세션에서 가져오도록 변경 가능

    const result = await supportPlanService.listPlans(role, userId);

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /plans]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원계획 목록 조회 중 오류",
    });
  }
});

// ✅ 담당자 전용 상단 테이블 목록
// GET /api/plans/assignee?userId=123
router.get("/assignee", async (req, res) => {
  try {
    const userId = Number(req.query.userId || 0);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "로그인 아이디가 필요합니다.",
      });
    }

    const result = await supportPlanService.listAssigneePlanCandidates(userId);

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /plans/assignee]", e);
    res.status(500).json({
      success: false,
      message: e.message || "담당자용 지원계획 대상 목록 조회 중 오류",
    });
  }
});

// 지원자 정보 띄우기
router.get("/:submitCode", async (req, res) => {
  try {
    const submitCode = Number(req.params.submitCode);
    if (!submitCode) {
      return res
        .status(400)
        .json({ success: false, message: "제출코드가 필요합니다." });
    }

    const result = await supportPlanService.getPlanBasic(submitCode);

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /plans/:submitCode]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원계획 기본 정보 조회 중 오류",
    });
  }
});

// 지원계획 저장
router.post(
  "/new",
  upload.array("planFiles"), // PlanWrite에서 formData.append("planFiles", file) 기준
  async (req, res) => {
    try {
      const { formJson } = req.body;
      if (!formJson) {
        return res
          .status(400)
          .json({ success: false, message: "formJson이 누락되었습니다." });
      }

      const parsed = JSON.parse(formJson); // { submitCode, mainForm, planItems }
      const files = req.files || [];

      const result = await supportPlanService.savePlanWithItems(parsed, files);

      res.json({ success: true, result: toSafeJson(result) });
    } catch (e) {
      console.error("[POST /plans/new]", e);
      res.status(500).json({
        success: false,
        message: e.message || "지원계획 저장 중 오류",
      });
    }
  }
);

// 지원계획 상세 조회 / 수정
router.get("/detail/:planCode", async (req, res) => {
  try {
    const planCode = Number(req.params.planCode);
    if (!planCode) {
      return res
        .status(400)
        .json({ success: false, message: "계획코드가 필요합니다." });
    }

    const result = await supportPlanService.getPlanDetail(planCode);

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /plans/detail/:planCode]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원계획 상세 조회 중 오류",
    });
  }
});

//  지원계획 수정 (JSON + 파일)
router.put("/:planCode", upload.array("planFiles"), async (req, res) => {
  try {
    const planCode = Number(req.params.planCode || 0);
    if (!planCode) {
      return res
        .status(400)
        .json({ success: false, message: "계획코드가 필요합니다." });
    }

    const raw = req.body.formJson || "{}";
    const formJson = JSON.parse(raw);

    // 혹시나 planCode가 body에 없으면 params 값으로 채워주기
    formJson.planCode = formJson.planCode || planCode;

    const result = await supportPlanService.updatePlanWithItems(
      formJson,
      req.files || []
    );

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[PUT /plans/:planCode]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원계획 수정 중 오류",
    });
  }
});

//재승인요청
router.post("/:planCode/resubmit", async (req, res) => {
  try {
    const planCode = Number(req.params.planCode);
    const requesterCode = Number(req.body.requesterCode || 0); // 담당자 user_code

    if (!planCode) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 계획서 코드가 아닙니다." });
    }
    if (!requesterCode) {
      // 나중에 로그인 붙이면 req.user.user_code 같은 걸로 대체
      return res
        .status(400)
        .json({ success: false, message: "요청자 코드가 없습니다." });
    }

    const result = await supportPlanService.resubmitPlan(
      planCode,
      requesterCode
    );

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /plans/:planCode/resubmit]", e);
    res.status(500).json({
      success: false,
      message: e.message || "재승인 요청 처리 중 오류가 발생했습니다.",
    });
  }
});

// 임시 저장
router.post("/temp", upload.array("planFiles"), async (req, res) => {
  try {
    const rawJson = req.body.formJson || "{}";
    const formJson = JSON.parse(rawJson);
    const files = req.files || [];

    const result = await supportPlanService.savePlanTemp(formJson, files);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /plans/temp]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

//임시저장 불러오기
router.get("/form/:submitCode", async (req, res) => {
  try {
    const submitCode = Number(req.params.submitCode);
    const result = await supportPlanService.getPlanFormData(submitCode);

    res.json({ success: true, result: toSafeJson(result) });
  } catch (e) {
    console.error("[GET /plans/form/:submitCode]", e);
    res.status(500).json({
      success: false,
      message: e.message || "지원계획 불러오기 중 오류",
    });
  }
});

// 🔹 지원계획 승인
router.post("/:planCode/approve", async (req, res) => {
  try {
    const planCode = Number(req.params.planCode);
    const processorCode = Number(req.body.processorCode) || null; // 🔹 추가

    const result = await supportPlanService.approveSupportPlan(
      planCode,
      processorCode
    );

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /plans/:planCode/approve]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// 🔹 지원계획 반려
router.post("/:planCode/reject", async (req, res) => {
  try {
    const planCode = Number(req.params.planCode);
    const { reason } = req.body;

    const result = await supportPlanService.rejectSupportPlan(
      planCode,
      reason || ""
    );

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /plans/:planCode/reject]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

//반려사유 조회
router.get("/:planCode/rejection-reason", async (req, res) => {
  try {
    const planCode = Number(req.params.planCode);

    if (!planCode) {
      return res.status(400).json({
        success: false,
        message: "유효한 계획 코드가 아닙니다.",
      });
    }

    const result = await supportPlanService.getRejectionReason(planCode);

    if (!result) {
      // 반려 이력이 없는 경우
      return res.status(200).json({
        success: false,
        message: "반려 사유를 찾을 수 없습니다.",
      });
    }

    // { rejection_reason, rejection_date } 그대로 넘겨줌
    return res.json({
      success: true,
      result,
      rejection_reason: result.rejection_reason,
      rejection_date: result.rejection_date,
    });
  } catch (e) {
    console.error("[GET /api/plans/:planCode/rejection-reason]", e);
    res.status(500).json({
      success: false,
      message: e.message || "반려 사유 조회 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
