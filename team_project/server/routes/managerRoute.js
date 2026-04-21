// team_project/server/routes/managerRoute.js

const express = require("express");
const router = express.Router();
const managerService = require("../services/managerService");

router.get("/simple", async (req, res) => {
  try {
    const orgCode = req.query.orgCode || "";
    const loginId = req.query.loginId || "";

    if (!orgCode && !loginId) {
      return res.status(400).json({
        status: "error",
        message: "orgCode 또는 loginId 필요",
      });
    }

    const list = await managerService.getSimpleManagerList({
      orgCode,
      loginId,
    });

    return res.status(200).json({
      status: "success",
      data: list,
    });
  } catch (err) {
    console.error("[GET /managers/simple] 실패:", err);
    return res.status(500).json({
      status: "error",
      message: "서버 오류(managers/simple)",
    });
  }
});

module.exports = router;
