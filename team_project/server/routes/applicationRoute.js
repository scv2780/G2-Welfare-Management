// server/routes/applicationRoute.js

const express = require("express");
const router = express.Router();
const applicationService = require("../services/applicationService");

/**
 * GET /api/applications/mine
 * query: loginId (users.user_id)
 *
 * 프론트: axios.get("/api/applications/mine", { params: { loginId: auth.userId } })
 */
router.get("/mine", async (req, res) => {
  try {
    const loginId = req.query.loginId || "";
    const role = req.query.role || "";

    if (!loginId || !role) {
      return res.status(400).json({
        status: "error",
        message: "loginId 또는 role이 전달되지 않았습니다.",
      });
    }

    const list = await applicationService.getMyApplications({
      loginId,
      role,
    });

    return res.status(200).json({
      status: "success",
      data: list,
    });
  } catch (err) {
    console.error("[GET /api/applications/mine] 실패:", err.stack || err);

    return res.status(500).json({
      status: "error",
      message: err.message || "신청 현황 조회 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
