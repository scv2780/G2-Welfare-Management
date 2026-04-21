// server/routes/authorityTransferRoute.js

const express = require("express");
const router = express.Router();
const authorityService = require("../services/authorityTransferService");

/**
 * GET /authority-transfer/users
 * 기관 관리자 전용:
 *   - loginId : 로그인한 관리자 user_id (필수)
 *   - managerCode : 담당자 user_code (선택, 없으면 기관 내 전체 이용자)
 *   - keyword : 아이디/이름/연락처 검색어 (선택)
 *   - page, size : 페이징
 */
router.get("/users", async (req, res) => {
  try {
    const loginId = req.query.loginId || "";
    const managerCode = req.query.managerCode || "";
    const keyword = req.query.keyword || "";
    const page = parseInt(req.query.page || "1", 10);
    const size = parseInt(req.query.size || "20", 10);

    if (!loginId) {
      return res.status(400).json({
        status: "error",
        message: "loginId는 필수입니다.",
      });
    }

    const result = await authorityService.getAuthorityUserList({
      loginId,
      managerCode,
      keyword,
      page,
      size,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { list, totalCount, page, size }
    });
  } catch (err) {
    console.error("[GET /authority-transfer/users] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: err.message || "서버 오류 (authority-transfer/users)",
    });
  }
});

/**
 * POST /authority-transfer/transfer
 * Body:
 * {
 *   loginId:         string,   // 로그인 관리자 user_id
 *   fromManagerCode: number,   // 현재 담당자 user_code
 *   toManagerCode:   number,   // 이관 받을 담당자 user_code
 *   userCodes:       number[]  // 이관할 이용자 user_code 배열
 * }
 */
router.post("/transfer", async (req, res) => {
  try {
    const { loginId, fromManagerCode, toManagerCode, userCodes } =
      req.body || {};

    if (!loginId || !fromManagerCode || !toManagerCode) {
      return res.status(400).json({
        status: "error",
        message: "loginId, fromManagerCode, toManagerCode는 필수입니다.",
      });
    }

    if (!Array.isArray(userCodes) || userCodes.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "이관할 이용자 목록(userCodes)이 비어 있습니다.",
      });
    }

    if (String(fromManagerCode) === String(toManagerCode)) {
      return res.status(400).json({
        status: "error",
        message: "같은 담당자에게는 이관할 수 없습니다.",
      });
    }

    const result = await authorityService.transferAuthority({
      loginId,
      fromManagerCode,
      toManagerCode,
      userCodes,
    });

    return res.status(200).json({
      status: "success",
      data: result, // { affectedRows }
    });
  } catch (err) {
    console.error(
      "[POST /authority-transfer/transfer] 실패:",
      err.stack || err
    );
    return res.status(500).json({
      status: "error",
      message: err.message || "서버 오류 (authority-transfer/transfer)",
    });
  }
});

module.exports = router;
