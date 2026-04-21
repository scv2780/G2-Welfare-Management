// team_project/server/routes/approvalRoute.js

const express = require("express");
const router = express.Router();
const approvalService = require("../services/approvalService");

// GET /approvals
router.get("/", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    const list = await approvalService.managerApprovalList({
      state,
      keyword,
      page,
      size,
    });

    return res.status(200).json({
      status: "success",
      data: list,
    });
  } catch (err) {
    console.error("[GET /approvals] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: err.message || "서버 오류 (approvals)",
    });
  }
});

/** ✅ 승인 처리: PUT /approvals/:code/approve */
router.put("/:code/approve", async (req, res) => {
  try {
    const approvalCode = req.params.code;

    // 🔹 프론트에서 넘겨준 처리자 user_code 사용
    const processorCode = req.body?.processorCode;

    if (!processorCode) {
      return res.status(400).json({
        status: "fail",
        message: "처리자 코드(processorCode)가 없습니다.",
      });
    }

    const result = await approvalService.approve({
      approvalCode,
      processorCode,
    });

    if (!result.affectedRows) {
      return res.status(400).json({
        status: "fail",
        message: "이미 처리되었거나 존재하지 않는 승인코드",
      });
    }

    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.error("[PUT /approvals/:code/approve] 실패:", err.stack || err);
    return res
      .status(500)
      .json({ status: "error", message: "승인 처리 중 오류" });
  }
});

// ✅ 반려 처리: PUT /approvals/:code/reject
router.put("/:code/reject", async (req, res) => {
  try {
    const approvalCode = req.params.code;
    const { reason, processorCode } = req.body || {};

    if (!processorCode) {
      return res.status(400).json({
        status: "fail",
        message: "처리자 코드(processorCode)가 없습니다.",
      });
    }

    const result = await approvalService.reject({
      approvalCode,
      reason,
      processorCode,
    });

    if (!result.affectedRows) {
      return res.status(400).json({
        status: "fail",
        message: "이미 처리되었거나 존재하지 않는 승인코드",
      });
    }

    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.error("[PUT /approvals/:code/reject] 실패:", err.stack || err);
    return res
      .status(500)
      .json({ status: "error", message: "반려 처리 중 오류" });
  }
});

// ✅ 기관 담당자 승인/요청 목록 (AE2)
router.get("/staff", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);
    const loginId = req.query.loginId || "";
    const role = req.query.role || "";

    const list = await approvalService.staffApprovalList({
      state,
      keyword,
      page,
      size,
      loginId,
      role,
    });

    return res.status(200).json({
      status: "success",
      data: list,
    });
  } catch (err) {
    console.error("[GET /approvals/staff] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: err.message || "서버 오류 (approvals/staff)",
    });
  }
});

// ✅ 기관 담당자 승인 (BA2 + role AA2)
router.put("/staff/:code/approve", async (req, res) => {
  try {
    const approvalCode = req.params.code;

    // 🔹 프론트에서 보낸 처리자 user_code 받기
    const processorCode = req.body.processorCode;

    const result = await approvalService.approveStaff({
      approvalCode,
      processorCode,
    });

    if (!result.affectedRows) {
      return res.status(400).json({
        status: "fail",
        message:
          "변경된 행이 없습니다. (이미 처리되었거나 존재하지 않는 승인코드)",
      });
    }

    return res.status(200).json({
      status: "success",
    });
  } catch (err) {
    console.error(
      "[PUT /approvals/staff/:code/approve] 실패:",
      err.stack || err
    );
    return res.status(500).json({
      status: "error",
      message: err.message || "기관 담당자 승인 처리 중 오류",
    });
  }
});

// ✅ 기관 담당자 반려 (BA3)
router.put("/staff/:code/reject", async (req, res) => {
  try {
    const approvalCode = req.params.code;
    const { reason, processorCode } = req.body;

    const result = await approvalService.rejectStaff({
      approvalCode,
      reason,
      processorCode,
    });

    if (!result.affectedRows) {
      return res.status(400).json({
        status: "fail",
        message:
          "변경된 행이 없습니다. (이미 처리되었거나 존재하지 않는 승인코드)",
      });
    }

    return res.status(200).json({
      status: "success",
    });
  } catch (err) {
    console.error(
      "[PUT /approvals/staff/:code/reject] 실패:",
      err.stack || err
    );
    return res.status(500).json({
      status: "error",
      message: err.message || "기관 담당자 반려 처리 중 오류",
    });
  }
});

// 우선순위 승인 요청 목록 (페이징 + 검색/정렬)
router.get("/priority", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const orderBy = req.query.orderBy || "latest";

    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    const loginId = req.query.loginId || "";
    const role = req.query.role || ""; // 🔹 역할 추가 (AA3 / AA4)

    const result = await approvalService.getPriorityApprovalList({
      page,
      size,
      state,
      keyword,
      orderBy,
      loginId,
      role, // 🔹 서비스로 전달
    });

    return res.status(200).json({
      status: "success",
      data: result, // { rows, totalCount, page, size }
    });
  } catch (err) {
    console.error("[GET /api/approvals/priority] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: "서버 오류",
    });
  }
});

// 지원계획 승인 요청 목록 (페이징 + 검색/정렬)
router.get("/support-plan", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const orderBy = req.query.orderBy || "latest";

    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    const loginId = req.query.loginId || "";
    const role = req.query.role || "";

    const result = await approvalService.getSupportPlanApprovalList({
      page,
      size,
      state,
      keyword,
      orderBy,
      loginId,
      role,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { rows, totalCount, page, size }
    });
  } catch (err) {
    console.error("[GET /api/approvals/support-plan] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: "서버 오류",
    });
  }
});

// 지원결과 승인 요청 목록 (페이징 + 검색/정렬)
router.get("/support-result", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const orderBy = req.query.orderBy || "latest";

    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    // 🔹 추가: 로그인 아이디 / 역할
    const loginId = req.query.loginId || "";
    const role = req.query.role || "";

    const result = await approvalService.getSupportResultApprovalList({
      page,
      size,
      state,
      keyword,
      orderBy,
      loginId,
      role,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { rows, totalCount, page, size }
    });
  } catch (err) {
    console.error(
      "[GET /api/approvals/support-result] 실패:",
      err.stack || err
    );
    return res.status(500).json({
      status: "error",
      message: "서버 오류",
    });
  }
});

// 이벤트 계획 승인 요청 목록 (페이징 + 검색/정렬)
router.get("/event-plan", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const orderBy = req.query.orderBy || "latest";

    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    // 🔹 추가: 로그인 아이디 / 역할
    const loginId = req.query.loginId || "";
    const role = req.query.role || "";

    const result = await approvalService.getEventPlanApprovalList({
      page,
      size,
      state,
      keyword,
      orderBy,
      loginId,
      role,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { rows, totalCount, page, size }
    });
  } catch (err) {
    console.error("[GET /api/approvals/event-plan] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: "서버 오류",
    });
  }
});

// 이벤트 결과 승인 요청 목록 (페이징 + 검색/정렬)
router.get("/event-result", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const orderBy = req.query.orderBy || "latest";

    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    // 🔹 추가: 로그인 아이디 / 역할
    const loginId = req.query.loginId || "";
    const role = req.query.role || "";

    const result = await approvalService.getEventResultApprovalList({
      page,
      size,
      state,
      keyword,
      orderBy,
      loginId,
      role,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { rows, totalCount, page, size }
    });
  } catch (err) {
    console.error("[GET /api/approvals/event-result] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: "서버 오류",
    });
  }
});

// 🔹 후원 계획 승인 요청 목록 (AE8, 페이징 + 검색/정렬)
router.get("/sponsorship-plan", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const orderBy = req.query.orderBy || "latest";

    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    // 🔹 추가: 로그인 아이디 / 역할
    const loginId = req.query.loginId || "";
    const role = req.query.role || "";

    const result = await approvalService.getSponsorshipPlanApprovalList({
      page,
      size,
      state,
      keyword,
      orderBy,
      loginId,
      role,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { rows, totalCount, page, size }
    });
  } catch (err) {
    console.error(
      "[GET /api/approvals/sponsorship-plan] 실패:",
      err.stack || err
    );
    return res.status(500).json({
      status: "error",
      message: "서버 오류",
    });
  }
});

// 🔹 후원 결과 승인 요청 목록 (AE9, 페이징 + 검색/정렬)
router.get("/sponsorship-result", async (req, res) => {
  try {
    const state = req.query.state || "";
    const keyword = req.query.keyword || "";
    const orderBy = req.query.orderBy || "latest";

    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    const loginId = req.query.loginId || "";
    const role = req.query.role || "";

    const result = await approvalService.getSponsorshipResultApprovalList({
      page,
      size,
      state,
      keyword,
      orderBy,
      loginId,
      role,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { rows, totalCount, page, size }
    });
  } catch (err) {
    console.error(
      "[GET /api/approvals/sponsorship-result] 실패:",
      err.stack || err
    );
    return res.status(500).json({
      status: "error",
      message: "서버 오류",
    });
  }
});

module.exports = router;
