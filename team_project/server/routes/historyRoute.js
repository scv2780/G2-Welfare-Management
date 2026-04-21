// team_project/server/routes/historyRoute.js

const express = require("express");
const router = express.Router();
const historyService = require("../services/historyService");

// GET /histories  - 수정 이력 목록
router.get("/", async (req, res) => {
  try {
    const searchField = req.query.searchField || "all"; // all, revision_date, modifier_name
    const keyword = req.query.keyword || "";
    const orderBy = req.query.orderBy || "latest"; // latest / oldest
    const typeCode = req.query.typeCode || ""; // BD1~BD8 (이력 유형)

    const orgCode = req.query.orgCode || ""; // 시스템 관리자용 기관 필터
    const managerCode = req.query.managerCode || ""; // 기관 관리자용 담당자 필터

    const loginId = req.query.loginId || ""; // 로그인한 아이디 (기관 제한용)
    const role = req.query.role || ""; // AA3 / AA4

    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    const result = await historyService.getHistoryList({
      searchField,
      keyword,
      orderBy,
      typeCode,
      orgCode,
      managerCode,
      loginId,
      role,
      page,
      size,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { list, totalCount, page, size }
    });
  } catch (err) {
    console.error("[GET /histories] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: err.message || "서버 오류 (histories)",
    });
  }
});

module.exports = router;
