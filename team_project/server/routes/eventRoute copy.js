// eventRoute.js
const express = require("express");
const router = express.Router();
const eventService = require("../services/eventService");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 업로드 경로와 파일명 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath))
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

// ==========================
// 이벤트 메인페이지
// GET /event
// ==========================
router.get("/", async (req, res) => {
  try {
    const events = await eventService.getEventMainpage();
    res.status(200).json({
      status: "success",
      data: events,
    });
  } catch (err) {
    console.error(
      "[eventRoute.js || 이벤트 메인페이지 목록 조회 실패]",
      err.message
    );
    res.status(500).json({
      status: "error",
      message: "이벤트 메인페이지 목록 조회 중 에러 발생",
    });
  }
});

// ==========================
// 이벤트 목록 조회
// GET /event
// ==========================
router.get("/list", async (req, res) => {
  try {
    // 쿼리스트링에서 검색 조건 받기
    const filters = {
      recruit_status: req.query.recruit_status || null,
      recruit_start_date: req.query.recruit_start_date || null,
      recruit_end_date: req.query.recruit_end_date || null,
      event_start_date: req.query.event_start_date || null,
      event_end_date: req.query.event_end_date || null,
      event_name: req.query.event_name || null,
      register_status: req.query.register_status || null,
    };

    const events = await eventService.getEventList(filters);

    res.status(200).json({
      status: "success",
      data: events,
    });
  } catch (err) {
    console.error("[eventRoute.js || 이벤트 목록 조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "이벤트 목록 조회 중 에러 발생",
    });
  }
});

// ==========================
// 이벤트 작성자별 계획/결과 목록 조회
// GET /event/applyResult
// ==========================
router.get("/applyResult", async (req, res) => {
  try {
    // 쿼리스트링에서 검색 조건 받기
    const filters = {
      recruit_status: req.query.recruit_status || null,
      recruit_start_date: req.query.recruit_start_date || null,
      recruit_end_date: req.query.recruit_end_date || null,
      event_start_date: req.query.event_start_date || null,
      event_end_date: req.query.event_end_date || null,
      event_name: req.query.event_name || null,
      role: req.query.role || null,
      user_code: req.query.user_code || null,
    };

    const events = await eventService.getEventApplyResult(filters);

    res.status(200).json({
      status: "success",
      data: events,
    });
  } catch (err) {
    console.error(
      "[eventRoute.js || 이벤트 작성자별 계획/결과 목록 조회 실패]",
      err.message
    );
    res.status(500).json({
      status: "error",
      message: "이벤트 작성자별 계획/결과 목록 조회 중 에러 발생",
    });
  }
});

// ==========================
// 이벤트 + 첨부파일 등록
// POST /event
// ==========================
router.post("/", upload.array("attachments"), async (req, res) => {
  try {
    // JSON 문자열을 객체로 변환
    const eventInfo = JSON.parse(req.body.eventInfo);
    const subManagers = req.body.sub_managers
      ? JSON.parse(req.body.sub_managers)
      : [];

    // 첨부파일 정보
    const attachments = req.files.map((file) => ({
      original_filename: Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      ),
      server_filename: file.filename,
      file_path: `/uploads/${file.filename}`,
    }));

    // DB에 저장할 통합 객체
    const newEvent = {
      ...eventInfo,
      sub_managers: subManagers,
      attachments,
    };

    // DB 서비스 호출
    const savedEvent = await eventService.createEventFull(newEvent);

    res.status(201).json({ status: "success", data: savedEvent });
  } catch (err) {
    console.error("[eventRoute.js || 이벤트 등록 실패]", err.message);
    res
      .status(500)
      .json({ status: "error", message: "이벤트 등록 중 에러 발생" });
  }
});

// ==========================
// 이벤트 신청 내역 등록
// POST /event/apply
// ==========================
router.post("/apply", async (req, res) => {
  try {
    const newEventApply = await eventService.createEventApply(req.body);
    res.status(201).json({
      status: "success",
      data: newEventApply,
    });
  } catch (err) {
    console.error("[eventRoute.js || 이벤트 신청 내역 등록 실패]", err.message);
    res.status(err.message === "이미 신청한 이벤트입니다." ? 400 : 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// ==========================
// 이벤트 신청 내역 조회
// GET /event/applyList?user_code=XXX
// ==========================
router.get("/applyList", async (req, res) => {
  console.log("🔥 applyList 라우터 들어옴"); // 가장 중요
  try {
    const user_code = req.query.user_code;
    console.log("user_code:", user_code);
    if (!user_code) {
      return res.status(400).json({
        status: "error",
        message: "user_code가 필요합니다.",
      });
    }

    const myApplies = await eventService.getMyEventApplyList(user_code);
    console.log("🔥 DB 결과:", myApplies);
    res.status(200).json({
      status: "success",
      data: myApplies,
    });
  } catch (err) {
    console.error(
      "[eventRoute.js || 내가 신청한 이벤트 조회 실패]",
      err.message
    );
    res.status(500).json({
      status: "error",
      message: "내가 신청한 이벤트 조회 중 에러 발생",
    });
  }
});

// ==========================
// 이벤트 신청 취소
// DELETE /event/apply/:apply_code
// ==========================
router.delete("/apply/:apply_code", async (req, res) => {
  const apply_code = req.params.apply_code;
  try {
    const result = await eventService.cancelApply(apply_code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ==========================
// 이벤트 수정
// PUT /event/:event_code
// ==========================
router.put("/:event_code", async (req, res) => {
  try {
    const updatedEvent = await eventService.modifyEvent(
      req.body,
      req.params.event_code
    );
    res.status(200).json({
      status: "success",
      data: updatedEvent,
    });
  } catch (err) {
    console.error("[eventRoute.js || 이벤트 수정 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "이벤트 수정 중 에러 발생",
    });
  }
});

// ==========================
// 이벤트 삭제
// DELETE /event/:event_code
// ==========================
router.delete("/:event_code", async (req, res) => {
  try {
    const deletedEvent = await eventService.removeEvent(req.params.event_code);
    res.status(200).json({
      status: "success",
      data: deletedEvent,
    });
  } catch (err) {
    console.error("[eventRoute.js || 이벤트 삭제 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "이벤트 삭제 중 에러 발생",
    });
  }
});

// ==========================
// 세부 이벤트 전체 목록 조회
// GET /event/sub
// ==========================
router.get("/sub", async (req, res) => {
  try {
    const subEvents = await eventService.getSubEventList();
    res.status(200).json({
      status: "success",
      data: subEvents,
    });
  } catch (err) {
    console.error("[eventRoute.js || 세부 이벤트 전체조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "세부 이벤트 전체조회 중 에러 발생",
    });
  }
});

// ==========================
// 세부 이벤트 단건 조회
// GET /event/sub/:sub_event_code
// ==========================
router.get("/sub/:sub_event_code", async (req, res) => {
  try {
    const subEvent = await eventService.getSubEvent(req.params.sub_event_code);
    res.status(200).json({
      status: "success",
      data: subEvent,
    });
  } catch (err) {
    console.error("[eventRoute.js || 세부 이벤트 단건조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "세부 이벤트 단건조회 중 에러 발생",
    });
  }
});

// ==========================
// 세부 이벤트 등록
// POST /event/sub
// ==========================
router.post("/sub", async (req, res) => {
  try {
    const newSubEvent = await eventService.createSubEvent(req.body);
    res.status(201).json({
      status: "success",
      data: newSubEvent,
    });
  } catch (err) {
    console.error("[eventRoute.js || 세부 이벤트 등록 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "세부 이벤트 등록 중 에러 발생",
    });
  }
});

// ==========================
// 세부 이벤트 수정
// PUT /event/sub/:sub_event_code
// ==========================
router.put("/sub/:sub_event_code", async (req, res) => {
  try {
    const updatedSubEvent = await eventService.modifySubEvent(
      req.body,
      req.params.sub_event_code
    );
    res.status(200).json({
      status: "success",
      data: updatedSubEvent,
    });
  } catch (err) {
    console.error("[eventRoute.js || 세부 이벤트 수정 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "세부 이벤트 수정 중 에러 발생",
    });
  }
});

// ==========================
// 세부 이벤트 삭제
// DELETE /event/sub/:sub_event_code
// ==========================
router.delete("/sub/:sub_event_code", async (req, res) => {
  try {
    const deletedSubEvent = await eventService.removeSubEvent(
      req.params.sub_event_code
    );
    res.status(200).json({
      status: "success",
      data: deletedSubEvent,
    });
  } catch (err) {
    console.error("[eventRoute.js || 세부 이벤트 삭제 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "세부 이벤트 삭제 중 에러 발생",
    });
  }
});

// ==========================
// 전체 매니저 조회
// GET /event/manager
// ==========================
router.get("/manager", async (req, res) => {
  try {
    const managers = await eventService.getManagerAll();
    console.log("API returned managers:", managers);
    res.status(200).json({
      status: "success",
      data: managers,
    });
  } catch (err) {
    console.error("[eventRoute.js || 전체 매니저 조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "전체 매니저 조회 중 에러 발생",
    });
  }
});

// 참가자 목록 조회
router.get("/attendanceList", async (req, res) => {
  try {
    const { applyStatus, eventName, managerName, page, size } = req.query;
    const result = await eventService.getAttendance({
      applyStatus,
      eventName,
      managerName,
      page,
      size,
    });

    res.status(200).json({
      status: "success",
      data: {
        rows: result.rows,
        totalCount: result.totalCount,
        page: result.page,
        size: result.size,
      },
    });
  } catch (err) {
    console.error("[eventRoute.js || /attendance 실패]", err.message);
    res.status(500).json({ status: "error", message: "참가자 목록 조회 실패" });
  }
});

// 내가 등록한 이벤트 참가자 목록 조회
router.get("/myAttendanceList/:eventCode", async (req, res) => {
  try {
    const eventCode = req.params.eventCode;
    const result = await eventService.getMyAttendance(eventCode);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    console.error("[eventRoute.js || /myAttendanceList 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "내가 등록한 이벤트 참가자 목록 조회 실패",
    });
  }
});

// 신청자/자녀 단건 조회
router.get("/attendanceList/:apply_code", async (req, res) => {
  try {
    const apply_code = req.params.apply_code;

    const result = await eventService.getAttendanceOne(apply_code);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    console.error(
      "[eventRoute.js || /attendanceOne/:apply_code 실패]",
      err.message
    );
    res
      .status(500)
      .json({ status: "error", message: "신청자/자녀 단건 조회 실패" });
  }
});

// ==========================
// 이벤트 단건 조회
// GET /event/:event_code
// ==========================
router.get("/:event_code", async (req, res) => {
  try {
    const event_code = req.params.event_code;
    const user_code = req.query.user_code; // 여기서 로그인 유저 코드 받기

    const event = await eventService.getEvent(event_code, user_code);
    console.log("API returned event:", event);
    res.status(200).json({
      status: "success",
      data: event,
    });
  } catch (err) {
    console.error("[eventRoute.js || 이벤트 단건조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "이벤트 단건조회 중 에러 발생",
    });
  }
});

// ==========================
// 이벤트 계획 승인
// GET /event/:eventCode/approve
// ==========================
router.post("/:eventCode/approve", async (req, res) => {
  try {
    const eventCode = Number(req.params.eventCode);
    const result = await eventService.approveEventPlan(eventCode);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /event/:eventCode/approve]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================
// 이벤트 계획 반려
// POST /event/:eventCode/reject
// ==========================
router.post("/:eventCode/reject", async (req, res) => {
  try {
    const eventCode = Number(req.params.eventCode);
    const { reason } = req.body;

    const result = await eventService.rejectEventPlan(eventCode, reason || "");

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /event/:eventCode/reject]", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

//반려사유 조회
router.get("/:eventCode/rejection-reason", async (req, res) => {
  try {
    const eventCode = Number(req.params.eventCode);

    if (!eventCode) {
      return res.status(400).json({
        success: false,
        message: "유효한 이벤트 코드가 아닙니다.",
      });
    }

    const result = await eventService.getRejectionReason(eventCode);

    if (!result) {
      // 반려 이력이 없는 경우
      return res.status(404).json({
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
    console.error("[GET /api/event/:eventCode/rejection-reason]", e);
    res.status(500).json({
      success: false,
      message: e.message || "반려 사유 조회 중 오류가 발생했습니다.",
    });
  }
});

// ==========================
// 결과보고서 + 첨부파일 등록
// POST /event/result
// ==========================
router.post("/result", upload.array("attachments"), async (req, res) => {
  try {
    // JSON 문자열을 객체로 변환
    const resultInfo = JSON.parse(req.body.resultInfo);

    // 첨부파일 정보
    const attachments = req.files.map((file) => ({
      original_filename: Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      ),
      server_filename: file.filename,
      file_path: `/uploads/${file.filename}`,
    }));

    // DB에 저장할 통합 객체
    const newResult = {
      ...resultInfo,
      attachments,
    };

    // DB 서비스 호출
    const savedResult = await eventService.createEventResultFull(newResult);

    res.status(201).json({ status: "success", data: savedResult });
  } catch (err) {
    console.error("[eventRoute.js || 결과보고서 등록 실패]", err.message);
    res
      .status(500)
      .json({ status: "error", message: "결과보고서 등록 중 에러 발생" });
  }
});

// ==========================
// 결과보고서 단건 조회
// GET /event/result/:event_result_code
// ==========================
router.get("/result/:event_result_code", async (req, res) => {
  try {
    const event_result_code = req.params.event_result_code;

    const result = await eventService.getResult(event_result_code);
    console.log("API returned event:", result);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    console.error("[eventRoute.js || 결과보고서 단건조회 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "결과보고서 단건조회 중 에러 발생",
    });
  }
});

// ==========================
// 결과보고서 승인
// GET /event/result/:resultCode/approve
// ==========================
router.post("/result/:resultCode/approve", async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode);
    const result = await eventService.approveEventResult(resultCode);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /event/:resultCode/approve]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================
// 결과보고서 반려
// POST /event/result/:resultCode/reject
// ==========================
router.post("/result/:resultCode/reject", async (req, res) => {
  try {
    const resultCode = Number(req.params.resultCode);
    const { reason } = req.body;

    const result = await eventService.rejectEventResult(
      resultCode,
      reason || ""
    );

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /event/:resultCode/reject]", e);
    res.status(500).json({
      success: false,
      message: e.message,
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
        message: "유효한 결과보고서 코드가 아닙니다.",
      });
    }

    const result = await eventService.getResultRejectionReason(resultCode);

    if (!result) {
      // 반려 이력이 없는 경우
      return res.status(404).json({
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
    console.error("[GET /api/event/:resultCode/rejection-reason]", e);
    res.status(500).json({
      success: false,
      message: e.message || "반려 사유 조회 중 오류가 발생했습니다.",
    });
  }
});

// ==========================
// 이벤트 신청내역 승인
// GET /event/myApply/approve/:applyCode
// ==========================
router.post("/myApply/approve/:applyCode", async (req, res) => {
  try {
    const applyCode = Number(req.params.applyCode);
    const result = await eventService.approveMyApply(applyCode);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /event/myApply/approve/:applyCode]", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================
// 이벤트 신청내역 취소
// POST /event/myApply/reject/:applyCode
// ==========================
router.post("/myApply/reject/:applyCode", async (req, res) => {
  try {
    const applyCode = Number(req.params.applyCode);

    const result = await eventService.rejectMyApply(applyCode);

    res.json({ success: true, result });
  } catch (e) {
    console.error("[POST /event/myApply/reject/:applyCode]", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

module.exports = router;
