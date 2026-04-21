// server/routes/assignRoute.js
const express = require("express");
const router = express.Router();
const assignService = require("../services/assignService");

router.post("/:submitCode", async (req, res) => {
  try {
    const submitCode = Number(req.params.submitCode);
    const assignee = Number(req.body.assignee); // 프론트에서 2로 전달됨

    if (!submitCode || !assignee) {
      return res.status(400).json({
        success: false,
        message: "submitCode 또는 담당자 정보가 유효하지 않습니다.",
      });
    }

    const result = await assignService.assignManager(submitCode, assignee);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /api/assign]", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

module.exports = router;
