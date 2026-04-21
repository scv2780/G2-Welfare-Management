// eventService.js
const eventMapper = require("../mappers/eventMapper");

// ==========================
// 이벤트 서비스
// ==========================

// ✅ 이벤트 메인페이지
async function getEventMainpage() {
  try {
    const events = await eventMapper.selectEventMainpage();
    return events;
  } catch (err) {
    console.error(
      "[eventService.js || 이벤트 메인페이지 목록 조회 실패]",
      err.message
    );
    throw err;
  }
}

// ✅ 이벤트 목록
async function getEventList(filters) {
  try {
    const events = await eventMapper.selectEventList(filters);
    return events;
  } catch (err) {
    console.error("[eventService.js || 이벤트 목록 조회 실패]", err.message);
    throw err;
  }
}

// ✅ 이벤트 작성자별 계획/결과 목록(검색조건)
async function getEventApplyResult(filters) {
  try {
    const events = await eventMapper.selectEventApplyResult(filters);
    return events;
  } catch (err) {
    console.error(
      "[eventService.js || 이벤트 작성자별 계획/결과 목록 조회 실패]",
      err.message
    );
    throw err;
  }
}

// ✅ 이벤트 단건 조회
async function getEvent(event_code, user_code) {
  try {
    const event = await eventMapper.selectEventOneFull(event_code, user_code);
    return event;
  } catch (err) {
    console.error("[eventService.js || 이벤트 단건조회 실패]", err.message);
    throw err;
  }
}

// 이벤트 + 세부 이벤트 + 첨부파일 + 서브매니저 등록
async function createEventFull(data) {
  try {
    const result = await eventMapper.addEventFull(data);
    return result;
  } catch (err) {
    console.error("[eventService.js || 전체 이벤트 등록 실패]", err.message);
    throw err;
  }
}

// 전체 매니저 조회
async function getManagerAll() {
  try {
    const managers = await eventMapper.getAllManagers();
    return managers;
  } catch (err) {
    console.error("[eventService.js || 전체 매니저 조회 실패]", err.message);
    throw err;
  }
}

// 이벤트 + 세부 이벤트 등록
async function createEvent(data) {
  try {
    const result = await eventMapper.addEventWithSub(data);
    return result;
  } catch (err) {
    console.error("[eventService.js || 이벤트 등록 실패]", err.message);
    throw err;
  }
}

// 이벤트 신청 내역 등록 (중복 체크 포함)
async function createEventApply(data) {
  try {
    const exists = await eventMapper.checkDuplicateApply(data);
    if (exists) {
      throw new Error("이미 신청한 이벤트입니다.");
    }

    const result = await eventMapper.addEventApply(data);
    return result;
  } catch (err) {
    console.error(
      "[eventService.js || 이벤트 신청 내역 등록 실패]",
      err.message
    );
    throw err;
  }
}

// 이벤트 신청 내역 조회
async function getMyEventApplyList(user_code) {
  try {
    const applies = await eventMapper.selectEventApplyList(user_code);
    return applies;
  } catch (err) {
    console.error(
      "[eventService.js || 내가 신청한 이벤트 내역 조회 실패]",
      err.message
    );
    throw err;
  }
}

// 이벤트 신청자 수 조회
async function getMyEventApplyCount(event_code) {
  try {
    const applies = await eventMapper.selectEventApplyCount(event_code);
    return applies;
  } catch (err) {
    console.error(
      "[eventService.js || 이벤트 신청자 수 조회 실패]",
      err.message
    );
    throw err;
  }
}

// ✅ 이벤트 신청 취소
async function cancelApply(apply_code) {
  try {
    const result = await eventMapper.cancelApply(apply_code);
    return result;
  } catch (err) {
    console.error("[eventService.js || 이벤트 신청 취소 실패]", err.message);
    throw err;
  }
}

// 이벤트 + 세부 이벤트 수정
async function modifyEvent(data, event_code) {
  try {
    const result = await eventMapper.updateEventWithSub(data, event_code);
    return result;
  } catch (err) {
    console.error("[eventService.js || 이벤트 수정 실패]", err.message);
    throw err;
  }
}

// ✅ 이벤트 삭제
async function removeEvent(event_code) {
  try {
    const result = await eventMapper.deleteEvent(event_code);
    return result;
  } catch (err) {
    console.error("[eventService.js || 이벤트 삭제 실패]", err.message);
    throw err;
  }
}

// ==========================
// 세부 이벤트 서비스
// ==========================

// ✅ 세부 이벤트 전체 목록 조회
async function getSubEventList() {
  try {
    const subEvents = await eventMapper.selectSubEventList();
    return subEvents;
  } catch (err) {
    console.error(
      "[eventService.js || 세부 이벤트 전체조회 실패]",
      err.message
    );
    throw err;
  }
}

// ✅ 세부 이벤트 단건 조회
async function getSubEvent(sub_event_code) {
  try {
    const subEvent = await eventMapper.selectSubEventOne(sub_event_code);
    return subEvent;
  } catch (err) {
    console.error(
      "[eventService.js || 세부 이벤트 단건조회 실패]",
      err.message
    );
    throw err;
  }
}

// ✅ 세부 이벤트 등록
async function createSubEvent(data) {
  try {
    const result = await eventMapper.addSubEvent(data);
    return result;
  } catch (err) {
    console.error("[eventService.js || 세부 이벤트 등록 실패]", err.message);
    throw err;
  }
}

// ✅ 세부 이벤트 수정
async function modifySubEvent(data, sub_event_code) {
  try {
    const result = await eventMapper.updateSubEvent(data, sub_event_code);
    return result;
  } catch (err) {
    console.error("[eventService.js || 세부 이벤트 수정 실패]", err.message);
    throw err;
  }
}

// ✅ 세부 이벤트 삭제
async function removeSubEvent(sub_event_code) {
  try {
    const result = await eventMapper.deleteSubEvent(sub_event_code);
    return result;
  } catch (err) {
    console.error("[eventService.js || 세부 이벤트 삭제 실패]", err.message);
    throw err;
  }
}

//승인
async function approveEventPlan(eventCode) {
  return await eventMapper.approveEventPlan(eventCode);
}

//반려
async function rejectEventPlan(eventCode, reason) {
  return await eventMapper.rejectEventPlan(eventCode, reason);
}

// 반려사유 조회
async function getRejectionReason(eventCode) {
  return await eventMapper.getRejectionReason(eventCode);
}

//재승인요청
async function resubmitPlan(eventCode, requesterCode) {
  return await eventMapper.resubmitPlan(eventCode, requesterCode);
}

// 결과보고서 + 첨부파일 등록
async function createEventResultFull(data) {
  try {
    const result = await eventMapper.addEventResultFull(data);
    return result;
  } catch (err) {
    console.error("[eventService.js || 결과보고서 등록 실패]", err.message);
    throw err;
  }
}

// 결과보고서 단건 조회
async function getResult(event_result_code) {
  try {
    const result = await eventMapper.selectResultOneFull(event_result_code);
    return result;
  } catch (err) {
    console.error("[eventService.js || 결과보고서 단건조회 실패]", err.message);
    throw err;
  }
}

//결과 승인
async function approveEventResult(resultCode) {
  return await eventMapper.approveEventResult(resultCode);
}

//결과 반려
async function rejectEventResult(resultCode, reason) {
  return await eventMapper.rejectEventResult(resultCode, reason);
}

//결과 반려사유 조회
async function getResultRejectionReason(resultCode) {
  return await eventMapper.getResultRejectionReason(resultCode);
}

//결과 재승인요청
async function resubmitResult(resultCode, requesterCode) {
  return await eventMapper.resubmitResult(resultCode, requesterCode);
}

// 참가자 목록 조회
async function getAttendance(filters) {
  try {
    // 필터 기본값 / 후처리 가능
    const page = Number(filters.page || 1);
    const size = Number(filters.size || 20);

    const result = await eventMapper.selectAttendance({
      applyStatus: filters.applyStatus || null,
      eventName: filters.eventName || null,
      managerName: filters.managerName || null,
      page,
      size,
    });

    return {
      rows: result.rows,
      totalCount: result.totalCount,
      page,
      size,
    };
  } catch (err) {
    console.error("[eventService.js || getAttendance 실패]", err.message);
    throw err;
  }
}

// 내가 등록한 이벤트 참가자 목록 조회
async function getMyAttendance(eventCode) {
  try {
    const result = await eventMapper.selectMyAttendance(eventCode);
    return result;
  } catch (err) {
    console.error("[eventService.js || getMyAttendance 실패]", err.message);
    throw err;
  }
}

// 신청자/자녀 조회
async function getAttendanceOne(apply_code) {
  try {
    const result = await eventMapper.selectAttendanceOne(apply_code);
    return result;
  } catch (err) {
    console.error("[eventService.js || getAttendanceOne 실패]", err.message);
    throw err;
  }
}

// 이벤트 신청내역 승인
async function approveMyApply(applyCode) {
  return await eventMapper.approveMyApply(applyCode);
}

// 이벤트 신청내역 취소
async function rejectMyApply(applyCode) {
  return await eventMapper.rejectMyApply(applyCode);
}

module.exports = {
  getEventMainpage,
  getEventList,
  getEvent,
  createEvent,
  modifyEvent,
  removeEvent,
  getSubEventList,
  getSubEvent,
  createSubEvent,
  modifySubEvent,
  removeSubEvent,
  createEventFull,
  createEventApply,
  getMyEventApplyList,
  cancelApply,
  getEventApplyResult,
  approveEventPlan,
  rejectEventPlan,
  getRejectionReason,
  resubmitPlan,
  createEventResultFull,
  getResult,
  approveEventResult,
  rejectEventResult,
  getResultRejectionReason,
  resubmitResult,
  getManagerAll,
  getAttendance,
  getAttendanceOne,
  approveMyApply,
  rejectMyApply,
  getMyAttendance,
  getMyEventApplyCount,
};
