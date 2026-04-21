<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <div class="form-action">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>

      <!-- <div class="flex items-center gap-2">
        <MaterialButton v-if="canEdit" @click="goEdit" color="dark" size="sm"
          >수정하기</MaterialButton
        >

        <MaterialButton v-if="canReEdit" @click="goEdit" color="dark" size="sm"
          >재수정하기</MaterialButton
        >
      </div> -->
    </div>

    <div class="detail-card">
      <header class="flex justify-between items-center detail-header">
        <h2 class="text-2xl font-semibold">메인 이벤트 정보</h2>
        <span
          v-if="seeStatus"
          class="status-pill"
          :class="statusClass(event.register_status)"
        >
          {{ event.register_status_name }}
        </span>
      </header>

      <div class="event-main-image">
        <img v-if="mainImage" :src="mainImage" alt="대표 이미지" />
        <div v-else class="no-image">이미지 없음</div>
      </div>

      <div class="meta-card improved-meta">
        <div class="info-grid">
          <div class="info-label">이벤트명</div>
          <div class="info-value">{{ event.event_name }}</div>

          <div class="info-label">기관명</div>
          <div class="info-value">{{ event.org_name }}</div>

          <div class="info-label">장소</div>
          <div class="info-value">{{ event.event_location }}</div>

          <div class="info-label">지원 대상</div>
          <div class="info-value">{{ event.target_audience }}</div>

          <div class="info-label">최대 참여자</div>
          <div class="info-value">{{ event.max_participants }}</div>

          <div class="info-label">모집 기간</div>
          <div class="info-value">
            {{ formatDate(event.recruit_start_date) }} ~
            {{ formatDate(event.recruit_end_date) }}
          </div>

          <div class="info-label">진행 기간</div>
          <div class="info-value">
            {{ formatDate(event.event_start_date) }} ~
            {{ formatDate(event.event_end_date) }}
          </div>
        </div>
      </div>

      <div class="content-block">
        <div class="content-title">내용</div>
        <div class="content-box whitespace-pre-line">
          {{ event.event_content }}
        </div>
      </div>

      <div v-if="event.attachments.length" class="block-card">
        <div class="field-block">
          <div class="field-label">첨부파일</div>
          <ul class="file-list">
            <li v-for="file in event.attachments" :key="file.server_filename">
              <a :href="file.file_path" :download="file.original_filename">{{
                file.original_filename
              }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div
      v-if="event.event_type === 'DD2' && event.sub_events.length"
      class="detail-card"
    >
      <h2 class="text-xl font-semibold mb-4">예약/세부 이벤트 정보</h2>

      <div v-if="loginRole === 'AA1'">
        <div class="field-block">
          <div class="field-label">예약 일정 (클릭하여 신청)</div>
          <FullCalendar ref="calendarRef" :options="calendarOptions" />
        </div>
      </div>

      <div v-else-if="['AA2', 'AA3', 'AA4'].includes(loginRole)">
        <table class="sub-event-table">
          <thead>
            <tr>
              <th>세부이벤트코드</th>
              <th>세부이벤트명</th>
              <th>시행기간</th>
              <th>모집인원</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in event.sub_events" :key="sub.sub_event_code">
              <td>{{ sub.sub_event_code }}</td>
              <td>{{ sub.sub_event_name }}</td>
              <td>
                {{ sub.sub_event_start_date }} ~ {{ sub.sub_event_end_date }}
              </td>
              <td>{{ sub.sub_recruit_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      class="detail-card"
      v-if="mainManager.manager_name || subManagers.length"
    >
      <h2 class="text-lg font-semibold mb-4">매니저 정보</h2>

      <div v-if="mainManager.manager_name" class="meta-card mb-4">
        <h5>메인 매니저 정보</h5>

        <table class="manager-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>부서</th>
              <th>이메일</th>
              <th>전화번호</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ mainManager.manager_name }}</td>
              <td>{{ mainManager.department }}</td>
              <td>{{ mainManager.email }}</td>
              <td>{{ mainManager.phone }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="subManagers.length" class="meta-card">
        <h5>서브 매니저 정보</h5>

        <table class="manager-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>부서</th>
              <th>이메일</th>
              <th>전화번호</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mgr in subManagers" :key="mgr.manager_num">
              <td>{{ mgr.manager_name }}</td>
              <td>{{ mgr.department }}</td>
              <td>{{ mgr.email }}</td>
              <td>{{ mgr.phone }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="pt-4 border-t mt-2 space-y-3">
      <div class="applyBtn">
        <MaterialButton
          color="dark"
          size="lg"
          class="px-8"
          v-if="canApply"
          @click="applySimple"
          >신청하기</MaterialButton
        >

        <MaterialButton
          color="dark"
          size="lg"
          class="px-8"
          v-else-if="applied"
          disabled
          >신청 완료</MaterialButton
        >

        <MaterialButton
          v-else-if="loginRole === 'AA1' && event.event_type === 'DD1'"
          color="dark"
          size="lg"
          class="px-8"
          disabled
          >신청 불가능</MaterialButton
        >
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import MaterialButton from "@/components/MaterialButton.vue";

const route = useRoute();
const router = useRouter();
const calendarRef = ref(null);

const eventCode = Number(route.params.eventCode || 0);

// 로그인 권한
const getLoginRole = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const data = JSON.parse(userStr);
    return data.role || null;
  } catch {
    return null;
  }
};
const loginRole = ref(getLoginRole());

const event = ref({
  sub_events: [],
  attachments: [],
});

const mainImage = ref("");
const isApplied = ref(false);

// 로그인 유저 코드
const getLoginUserCode = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const data = JSON.parse(userStr);
    return data.user_code || null;
  } catch {
    return null;
  }
};

// 현재 이벤트가 신청 가능한 상태인지 체크
const isBlockedByResultStatus = computed(() => {
  if (!event.value.resultStatus) return false;
  // eventCode 전체에 대해 BA2(종료) 상태가 있는지 확인
  return event.value.resultStatus.some(
    (r) => r.event_code === eventCode && r.result_status === "BA2"
  );
});

// 상태 버튼 표시 (AA1: 일반 사용자)
const canApply = computed(() => {
  // 신청제(DD1)이고, 일반 사용자(AA1)이며, 이미 신청하지 않았고, 종료되지 않은 경우
  return (
    loginRole.value === "AA1" &&
    event.value.event_type === "DD1" &&
    !isApplied.value &&
    !isBlockedByResultStatus.value
  );
});

const applied = computed(() => {
  if (loginRole.value !== "AA1") return false;
  // 신청 완료 상태이며, 이벤트가 종료되지 않은 경우에만 '신청 완료' 버튼 표시
  return isApplied.value && !isBlockedByResultStatus.value;
});

// 작성자 버튼 표시
// const canEdit = computed(
//   () => loginRole.value === "AA2" && event.value.register_status === "BA2" // BA2: 승인 완료 상태에서만 수정 가능하도록 가정
// );
// const canReEdit = computed(
//   () => loginRole.value === "AA2" && event.value.register_status === "BA3" // BA3: 반려 상태에서 재수정 가능하도록 가정
// );

const seeStatus = computed(
  () => loginRole.value === "AA2" || loginRole.value === "AA3"
);

// 상태 Pill 클래스
const statusClass = (status) => {
  switch (status) {
    case "BA1":
      return "status-pill--before";
    case "BA2":
      return "status-pill--done";
    case "BA3":
      return "status-pill--rejected";
    default:
      return "";
  }
};

// 메인 매니저 필터링 (DA1)
const mainManager = computed(
  () => event.value.sub_managers?.find((m) => m.manager_type === "DA1") || {}
);

// 서브매니저 필터링 (DA2)
const subManagers = computed(
  () => event.value.sub_managers?.filter((m) => m.manager_type === "DA2") || []
);

// 날짜 포맷
const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// 이벤트 조회
const fetchEvent = async () => {
  try {
    const userCode = getLoginUserCode();
    const res = await axios.get(`/api/event/${eventCode}`, {
      params: { user_code: userCode },
    });
    event.value = res.data.data || {};
    isApplied.value = !!event.value.alreadyApplied;

    // 대표 이미지
    const img = event.value.attachments.find((x) =>
      /\.(jpg|jpeg|png|gif)$/i.test(x.original_filename)
    );
    mainImage.value = img ? img.file_path : "";

    // 캘린더 이벤트
    calendarOptions.value.events = (event.value.sub_events || []).map((s) => ({
      id: String(s.sub_event_code),
      title: s.sub_event_name,
      start: s.sub_event_start_date,
      end: s.sub_event_end_date,
      extendedProps: { code: s.sub_event_code, isApplied: !!s.applied },
      color: s.applied ? "gray" : undefined,
    }));

    await nextTick();
  } catch (err) {
    console.error("fetchEvent error:", err);
  }
};

// 단순 신청 (DD1 또는 DD2의 캘린더 클릭)
const applyEvent = async ({ sub_event_code = null }) => {
  const userCode = getLoginUserCode();
  if (!userCode) return alert("로그인 상태가 아닙니다.");

  try {
    const res = await axios.post("/api/event/apply", {
      apply_type: event.value.event_type,
      event_code: event.value.event_code,
      sub_event_code,
      user_code: userCode,
    });

    if (res.data && res.data.status) {
      alert("신청 완료! 내 신청 내역에 등록되었습니다.");
      return true;
    } else {
      alert("신청 실패: " + res.data.message);
      return false;
    }
  } catch (error) {
    console.error("신청 API 오류", error);
    alert("신청 중 오류가 발생했습니다.");
    return false;
  }
};

// 신청 버튼 (DD1 전용)
const applySimple = async () => {
  if (isApplied.value) return alert("이미 신청한 이벤트입니다.");
  if (event.value.event_type !== "DD1") return; // DD1 전용

  const ok = await applyEvent({});
  if (ok) isApplied.value = true;
};

// 한국 날짜만
function formatKoreanDateOnly(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

// 한국 시간만
function formatKoreanTime(date) {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "오후" : "오전";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${ampm} ${hours}:${minutes}`;
}

// 캘린더 클릭 예약 (DD2 전용)
const onEventClick = async (info) => {
  if (loginRole.value !== "AA1")
    return alert("신청은 일반 사용자(AA1)만 가능합니다.");

  // resultStatus 체크: 해당 이벤트 코드 && BA2
  const blocked = (event.value.resultStatus || []).some(
    (r) => r.event_code === eventCode && r.result_status === "BA2"
  );
  if (blocked) return alert("종료된 이벤트입니다.");

  if (info.event.extendedProps.isApplied)
    return alert("이미 신청한 일정입니다.");

  const confirmApply = confirm(
    `예약 일정: ${formatKoreanDateOnly(info.event.start)} ${formatKoreanTime(
      info.event.start
    )} - ${formatKoreanTime(info.event.end)}\n` +
      `"${info.event.title}" 예약하시겠습니까?`
  );
  if (!confirmApply) return;

  const success = await applyEvent({
    sub_event_code: info.event.extendedProps.code,
  });
  if (!success) return;

  // UI 업데이트
  info.event.setProp("color", "gray");
  info.event.setExtendedProp("isApplied", true);

  const idx = event.value.sub_events.findIndex(
    (s) => s.sub_event_code === info.event.extendedProps.code
  );
  if (idx !== -1) event.value.sub_events[idx].applied = true;

  // 캘린더 다시 렌더링
  if (calendarRef.value) {
    calendarRef.value.getApi().render();
  }
};

// 화면 이동
const goBack = () => router.back();
// const goEdit = () => router.push({ name: "EventEdit", params: { eventCode } });

// FullCalendar 옵션
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  events: [],
  eventClick: onEventClick,
  locale: "ko",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  },
});

onMounted(fetchEvent);
</script>

<style scoped>
/* =========================================================================
   📌 디자인 개선된 스타일 (기존 스타일에서 업데이트 및 추가)
   ========================================================================= */

section {
  color: #111827;
}

/* 카드 간격 */
.space-y-6 > * + * {
  margin-top: 1.5rem !important;
}

/* 상단 액션 라인 */
.form-action {
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

/* 바깥 카드 */
.detail-card {
  background: #ffffff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}

/* 헤더 */
.detail-header {
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

/* 메타 정보 카드 공통 (내부 블록) */
.meta-card {
  background: #fff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  margin-bottom: 1rem;
}
.meta-card h5 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
}
/* meta-row는 이제 메인 매니저에 사용되지 않음 */
.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}
.meta-row span:first-child {
  color: #6b7280;
}
.meta-row span:last-child {
  color: #111827;
}

/* =============================
   📌 기본정보 Grid 레이아웃 (개선)
   ============================= */
.improved-meta {
  padding: 0;
  overflow: hidden;
  margin-bottom: 1.5rem; /* 아래쪽 마진 추가 */
  border: none; /* 외부 meta-card의 테두리 제거 */
}

.info-grid {
  display: grid;
  grid-template-columns: 160px 1fr;
  border: 1px solid #e5e7eb;
  border-radius: 0.8rem;
  overflow: hidden; /* 내부 border를 깔끔하게 처리 */
}

.info-label {
  background: #f9fafb;
  padding: 0.85rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.info-value {
  padding: 0.85rem 1rem;
  font-size: 0.9rem;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
}

/* 마지막 row border 제거 */
.info-grid > div:nth-last-child(1),
.info-grid > div:nth-last-child(2) {
  border-bottom: none;
}
.info-grid > div:nth-last-child(1) {
  border-right: none;
}

/* ============================
   📌 내용 블록 스타일 (개선)
   ============================ */
.content-block {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.content-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: #4b5563;
}

.content-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.7rem;
  padding: 1rem;
  min-height: 120px;
  max-height: 350px;
  overflow-y: auto;
  color: #111827;
  line-height: 1.6;
  font-size: 0.95rem;
}

/* =============================
   📌 기타 요소
   ============================= */

/* 상태 Pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid transparent;
  font-weight: 600;
}
.status-pill--before {
  background: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}
.status-pill--done {
  background: #111827;
  color: #f9fafb;
  border-color: #111827;
}
.status-pill--rejected {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

/* 이미지 영역 */
.event-main-image {
  width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  margin-bottom: 1.5rem; /* 마진 증가 */
  border-radius: 0.7rem; /* 모서리 둥글게 */
  overflow: hidden;
}
.event-main-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 첨부파일 리스트 */
.file-list {
  margin-top: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  list-style: none;
  padding: 0;
}
.file-list li + li {
  margin-top: 0.25rem;
}
.file-list a {
  color: #2563eb;
  text-decoration: underline;
}

/* 테이블 공통 스타일 */
.sub-event-table,
.manager-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}
.sub-event-table th,
.sub-event-table td,
.manager-table th,
.manager-table td {
  border: 1px solid #e5e7eb;
  padding: 0.7rem 0.5rem;
  font-size: 0.875rem;
  text-align: left;
}
.sub-event-table th,
.manager-table th {
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
}

/* 신청하기 버튼 줄 */
.applyBtn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 0.4rem;
  width: 100%;
}
</style>
