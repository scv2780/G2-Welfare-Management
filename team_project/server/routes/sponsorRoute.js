const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 업로드 경로와 파일명 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    console.log("--- MULTER LOG: Destination Path ---", uploadPath); // 로그 추가!
    if (!fs.existsSync(uploadPath))
      console.log("--- MULTER LOG: Creating Upload Directory ---"); // 로그 추가!
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 한글 지원
    const originalName = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );

    // 날짜 접미사 (yyyyMMdd)
    const now = new Date();
    const year = now.getFullYear();
    const month = ("0" + (now.getMonth() + 1)).slice(-2);
    const day = ("0" + now.getDate()).slice(-2);
    const dateSuffix = `${year}${month}${day}`;

    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);

    cb(null, `${baseName}_${dateSuffix}${ext}`);
  },
});

const upload = multer({ storage });

const {
  sponsorUsersList,
  sponsorProgramAdd,
  sponsorUsers,
  sponsorProgramUpdate,
  requestApprovalProgram,
  approvalProgram,
  rejectSupportResult,
  getRejectionReason,
  resubmitResult,
  payments,
  mygivingList,
  activityAdd,
  activityList,
  current_amountUpdate,
  summaryStatementList,
  summaryStatementListSelect,activitySelectOne
} = require("../services/sponsorService.js"); // sponsorUsers 추가

// [수정] 전체 목록 조회 및 조건 검색 처리 (클라이언트의 search()와 연동)
router.get("/", async (req, res) => {
  try {
    // 클라이언트에서 보낸 쿼리 파라미터(searchParams)를 req.query로 받습니다.
    const searchParams = req.query;

    // 파라미터가 있으면 조건 검색, 없으면 전체 검색을 서비스에서 처리합니다.
    const serviceSponsor = await sponsorUsersList(searchParams);
    // console.log("Route Layer | 검색 파라미터:", serviceSponsor);
    console.log("[ sponsorRoute.js || 전체/조건 조회 성공]");
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error("[ sponsorRoute.js || 전체/조건 조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});
// 전체 후원 내역 조회
router.get("/mygiving", async (req, res) => {
  try {
    //조회 서비스 호출
    const serviceSponsor = await mygivingList();
    console.log(serviceSponsor);
    console.log(`[ mygiving.js || 후원 조회  성공]`);
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error("[ mygiving.js || 후원 내역 조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});
// 전체 활동 내역 조회
router.get("/activity", async (req, res) => {
  try {
    //조회 서비스 호출
    const serviceSponsor = await activityList();
    console.log(serviceSponsor);
    console.log(`[ mygiving.js || 전체 활동 내역 조회  성공]`);
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error("[ mygiving.js || 전체 활동 내역 조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});
// 총괄표 전체 활동 내역 조회
router.get("/summaryStatementList", async (req, res) => {
  try {
    //조회 서비스 호출
    const serviceSponsor = await summaryStatementList();
    console.log(serviceSponsor);
    console.log(
      `[ summaryStatementList.js ||총괄표 전체 활동 내역 조회  성공]`
    );
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error(
      "[ summaryStatementList.js ||총괄표 전체 활동 내역 조회 실패]",
      err.message
    );
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});
// 총괄표 단건 활동 내역 조회
router.get("/summaryStatementList/:no", async (req, res) => {
  try {
    //조회 서비스 호출
    const programCode = req.params.no;
    const serviceSponsor = await summaryStatementListSelect(programCode);
    console.log(serviceSponsor);
    console.log(
      `[ summaryStatementListSelect.js ||총괄표 단건 활동 내역 조회  성공]`
    );
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error(
      "[ summaryStatementListSelect.js ||총괄표 단건 활동 내역 조회 실패]",
      err.message
    );
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});

router.get("/activity/:activityCode", async (req, res) => {
  try {
    const code = req.params.activityCode;

    const { activity, history } = await activitySelectOne(code);

    res.json({
      success: true,
      activity,
      history
    });

  } catch (e) {
    console.error("🔥 활동보고서 단건 조회 오류:", e);
    res.status(500).json({ message: "활동보고서 조회 실패" });
  }
});



router.post("/", upload.array("attachments"), async (req, res) => {
  try {
    const clientData = req.body;
    console.log(clientData);
    // 첨부파일 정보
    const attachments = req.files.map((file) => ({
      original_filename: Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      ),
      server_filename: file.filename,
      file_path: `/uploads/${file.filename}`,
    }));

    const serviceSponsor = await sponsorProgramAdd(clientData, attachments);
    console.log("[ ProgramADD.js || routeProgramADD 성공]");
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error("[ ProgramADD.js || routeProgramADD 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});

router.put("/:no", upload.array("attachments"), async (req, res) => {
  try {
    const programCode = req.params.no;
    let clientData = req.body;

    clientData.program_code = programCode;
    const serviceSponsor = await sponsorProgramUpdate(clientData);
    console.log(
      "[ sponsorProgramUpdateRoute.js || sponsorProgramUpdateRoute 성공]"
    );
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error(
      "[ sponsorProgramUpdateRoute.js || sponsorProgramUpdateRoute 실패]",
      err.message
    );
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});

/**
 *  지원결과 수정 (JSON + 파일)
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
 * 승인 요청
 *   POST /api/result/:resultCode/approve
 */
router.post("/:programCode/request-approval", async (req, res) => {
  try {
    const programCode = Number(req.params.programCode);
    const requesterCode = req.body.requesterCode;
    console.log("프로그램 번호" + programCode);
    console.log("유저 아이디" + requesterCode);
    if (!programCode || !requesterCode) {
      return res
        .status(400)
        .json({ success: false, message: "잘못된 요청입니다." });
    }

    const result = await requestApprovalProgram(programCode, requesterCode);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /:programCode/request-approval]", e);
    res.status(500).json({ success: false, message: "승인 요청 처리 중 오류" });
  }
});

//승인 완료 승인 대기 -> 승인 완료
router.put("/:programCode/request-approval", async (req, res) => {
  try {
    const programCode = Number(req.params.programCode);
    console.log("프로그램 번호" + programCode);
    if (!programCode) {
      return res
        .status(400)
        .json({ success: false, message: "잘못된 요청입니다." });
    }

    const result = await approvalProgram(programCode);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /:programCode/request-approval]", e);
    res.status(500).json({ success: false, message: "승인 요청 처리 중 오류" });
  }
});

/**
 * 🔹 지원결과 반려
 *   POST /api/result/:resultCode/reject
 *   body: { reason: "반려 사유" }
 */
router.put("/:resultCode/reject", async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode || 0);
    const { reason } = req.body;

    if (!resultCode) {
      return res
        .status(400)
        .json({ success: false, message: "유효한 resultCode가 아닙니다." });
    }

    const result = await rejectSupportResult(resultCode, reason || "");

    res.json({ success: true, result: result });
  } catch (e) {
    console.error("[PUT /result/:resultCode/reject]", e);
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

    const result = await getRejectionReason(resultCode);

    if (!result) {
      // 반려 이력이 없는 경우
      return res.status(404).json({
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

    const result = await resubmitResult(resultCode, requesterCode);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /result/:resultCode/resubmit]", e);
    res.status(500).json({
      success: false,
      message: e.message || "재승인 요청 처리 중 오류가 발생했습니다.",
    });
  }
});
//후원 결제
router.post("/:programCode/:user_id/payments", async (req, res) => {
  try {
    const data = req.body;
    console.log("결제 데이터", data);
    const result = await payments(data);
    //결제 금액 업데이트
    await current_amountUpdate(data.transaction_amount, data.program_code);
    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /:programCode/request-approval]", e);
    res.status(500).json({ success: false, message: "승인 요청 처리 중 오류" });
  }
});
// 활동 보고서 등록
router.post("/:programCode/:user_id/activity", async (req, res) => {
  try {
    const data = req.body;
    console.log("활동 보고서 데이터", data);
    const result = await activityAdd(data);

    res.json({ success: true, result });
  } catch (e) {
    console.error("활동 보고서 에러", e);
    res
      .status(500)
      .json({ success: false, message: "활동 보고서 등록 중 오류" });
  }
});


// [수정] 단건 조회 처리
router.get("/:no", async (req, res) => {
  try {
    // URL 파라미터에서 프로그램 코드 (no)를 추출합니다.
    const programCode = req.params.no;

    // 단건 조회 서비스 호출
    const serviceSponsor = await sponsorUsers(programCode);

    console.log(`[ sponsorRoute.js || 단건 조회 (${programCode}) 성공]`);
    res.status(200).json({
      status: "success",
      serviceSponsor,
    });
  } catch (err) {
    console.error("[ sponsorRoute.js || 단건 조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});

module.exports = router;
