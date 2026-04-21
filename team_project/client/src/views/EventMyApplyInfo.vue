<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <div class="form-action">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>
    </div>

    <div v-if="applyInfo" class="detail-card">
      <header class="flex justify-between items-center detail-header">
        <div>
          <h2 class="text-2xl font-semibold">이벤트 신청 상세 내역</h2>
        </div>

        <span
          v-if="isManager"
          class="status-pill"
          :class="statusClass(applyInfo.apply_status)"
        >
          {{ applyInfo.apply_status_name }}
        </span>
      </header>

      <div class="event-main-image">
        <img v-if="mainImage" :src="mainImage" alt="대표 이미지" />
        <div v-else class="no-image">이미지 없음</div>
      </div>

      <div class="meta-card improved-meta">
        <h5 class="meta-card-title">메인 이벤트 정보</h5>
        <div class="info-grid">
          <div class="info-label">이벤트명</div>
          <div class="info-value">{{ event.event_name }}</div>

          <div class="info-label">기관명</div>
          <div class="info-value">{{ event.org_name }}</div>

          <div class="info-label">매니저</div>
          <div class="info-value">{{ event.main_manager_name }}</div>

          <div class="info-label">장소</div>
          <div class="info-value">{{ event.event_location }}</div>

          <div class="info-label">지원 대상</div>
          <div class="info-value">{{ event.target_audience }}</div>

          <div class="info-label">최대 참여자</div>
          <div class="info-value">{{ event.max_participants }}</div>

          <div class="info-label">모집 기간</div>
          <div class="info-value">
            {{ formatKoreanDateOnly(event.recruit_start_date) }} ~
            {{ formatKoreanDateOnly(event.recruit_end_date) }}
          </div>

          <div class="info-label">진행 기간</div>
          <div class="info-value">
            <!-- DD1 : 날짜 + 시간 -->
            <template v-if="event.event_type === 'DD1'">
              {{ formatKoreanDateOnly(event.event_start_date) }}
              {{ formatKoreanTime(event.event_start_date) }} ~
              {{ formatKoreanTime(event.event_end_date) }}
            </template>

            <!-- DD2 : 날짜만 -->
            <template v-else>
              {{ formatKoreanDateOnly(event.event_start_date) }} ~
              {{ formatKoreanDateOnly(event.event_end_date) }}
            </template>
          </div>
        </div>
      </div>

      <div class="content-block">
        <div class="content-title">이벤트 내용</div>
        <div class="content-box whitespace-pre-line">
          {{ event.event_content }}
        </div>
      </div>

      <div v-if="subEventApplies.length" class="detail-card sub-event-card">
        <h2 class="text-xl font-semibold mb-4">신청한 세부 이벤트 정보</h2>

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
            <tr v-for="sub in subEventApplies" :key="sub.sub_event_code">
              <td>{{ sub.sub_event_code }}</td>
              <td>{{ sub.sub_event_name }}</td>
              <td>
                {{ formatKoreanDateOnly(sub.sub_event_start_date) }}
                {{ formatKoreanTime(sub.sub_event_start_date) }} ~
                {{ formatKoreanTime(sub.sub_event_end_date) }}
              </td>
              <td>{{ sub.sub_recruit_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="meta-card">
        <h5>자녀 정보</h5>
        <div class="info-grid child-info-grid">
          <div class="info-label">자녀명</div>
          <div class="info-value">{{ applyInfo.child_name }}</div>

          <div class="info-label">성별</div>
          <div class="info-value">{{ applyInfo.child_gender_name }}</div>

          <!-- <div class="info-label">주민번호</div>
          <div class="info-value">{{ applyInfo.child_ssn }}</div> -->
        </div>
      </div>

      <div class="meta-card">
        <h5>신청자 정보</h5>
        <div class="info-grid applicant-info-grid">
          <div class="info-label">신청자명</div>
          <div class="info-value">{{ applyInfo.applicant_name }}</div>

          <div class="info-label">주소</div>
          <div class="info-value">{{ applyInfo.applicant_address }}</div>

          <div class="info-label">소속기관</div>
          <div class="info-value">{{ applyInfo.applicant_org_name }}</div>

          <!-- <div class="info-label">주민번호</div>
          <div class="info-value">{{ applyInfo.applicant_ssn }}</div> -->

          <div class="info-label">전화번호</div>
          <div class="info-value">{{ applyInfo.applicant_phone }}</div>

          <div class="info-label">이메일</div>
          <div class="info-value">{{ applyInfo.applicant_email }}</div>
        </div>
      </div>

      <div class="block-card">
        <div class="field-block">
          <div class="field-label">첨부파일</div>

          <div v-if="event.attachments?.length">
            <ul class="file-list">
              <li v-for="file in event.attachments" :key="file.server_filename">
                <span class="file-name" @click="previewFile(file)">
                  {{ file.original_filename }}
                </span>
              </li>
            </ul>
          </div>
          <div v-else class="text-xs text-gray-400">
            첨부된 파일이 없습니다.
          </div>
        </div>

        <div v-if="previewImage" class="preview-modal" @click="closePreview">
          <img :src="previewImage" class="preview-img" />
        </div>
      </div>
    </div>

    <div class="pt-4 border-t mt-2 space-y-3" v-if="isManager">
      <div class="approve-actions">
        <MaterialButton
          color="dark"
          size="sm"
          class="px-4"
          @click="handleApprove"
        >
          승인
        </MaterialButton>
        <MaterialButton
          color="dark"
          size="sm"
          class="px-4"
          @click="handleReject"
        >
          취소
        </MaterialButton>
      </div>
    </div>
  </section>
</template>

<script setup>
// 기능 로직은 변경하지 않습니다.
import { ref, onMounted, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";

const route = useRoute();
const router = useRouter();

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

const applyInfo = ref({});

const isManager = computed(() => {
  // 로그인 권한이 AA2일때만 버튼 보여주기
  return loginRole.value === "AA2";
});

const applyCode = Number(route.params.applyCode || 0);
const eventCode = Number(route.params.eventCode || 0);

const event = ref({
  sub_events: [],
  attachments: [],
});

const mainImage = ref("");
const isApplied = ref(false);

// 미리보기 이미지
const previewImage = ref("");

// 파일 미리보기
const previewFile = (file) => {
  const ext = file.original_filename.split(".").pop().toLowerCase();

  // 이미지면 모달로 보기
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    previewImage.value = file.file_path;
    return;
  }

  // PDF면 새 창 미리보기
  if (ext === "pdf") {
    window.open(file.file_path, "_blank");
    return;
  }

  // 그 외 파일은 다운로드
  window.location.href = file.file_path;
};

const closePreview = () => {
  previewImage.value = "";
};

// 날짜 포맷
//const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

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

    await nextTick();
  } catch (err) {
    console.error("fetchEvent error:", err);
  }
};

const subEventApplies = ref([]);
const fetchMySubEventApplies = async () => {
  try {
    const userCode = getLoginUserCode();
    if (!userCode) {
      subEventApplies.value = [];
      return;
    }

    const res = await axios.get("/api/event/applyList", {
      params: { user_code: userCode },
    });

    const allApplies = res.data.data || [];

    // DD2 세부 이벤트이면서 현재 이벤트 코드에 해당하는 것만 필터링
    subEventApplies.value = allApplies.filter(
      (item) =>
        item.apply_type === "DD2" && Number(item.event_code) === eventCode
    );

    console.log("신청한 세부 이벤트:", subEventApplies.value);
  } catch (err) {
    console.error("신청한 세부 이벤트 조회 실패:", err);
    subEventApplies.value = [];
  }
};

// 상태 Pill 클래스
const statusClass = (status) => {
  switch (status) {
    case "DE1":
      return "status-pill--before";
    case "DE2":
      return "status-pill--done";
    case "DE4":
      return "status-pill--rejected";
    default:
      return "";
  }
};

// 신청자/자녀 조회
const fetchApply = async () => {
  try {
    const res = await axios.get(`/api/event/attendanceList/${applyCode}`);
    applyInfo.value = res.data.data || {};

    await nextTick();
  } catch (err) {
    console.error("fetchApply error:", err);
  }
};

// 승인 (담당자)
const handleApprove = async () => {
  try {
    const res = await axios.post(`/api/event/myApply/approve/${applyCode}`);
    if (res.data.success) {
      alert("승인되었습니다.");

      await fetchEvent();
      await fetchApply();
      console.log("applyInfo after approve:", applyInfo.value);
    } else {
      alert(res.data.message || "승인 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 취소 (담당자)
const handleReject = async () => {
  try {
    const res = await axios.post(`/api/event/myApply/reject/${applyCode}`);
    if (res.data.success) {
      alert("취소 처리되었습니다.");

      await fetchEvent();
      await fetchApply();
    } else {
      alert(res.data.message || "취소 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 화면 이동
const goBack = () => router.back();

onMounted(async () => {
  await fetchEvent();
  await fetchApply();
  await fetchMySubEventApplies();
});
</script>

<style scoped>
/* =========================================================================
   📌 스타일 시작 (참고 코드 기반으로 신청 상세 내역에 맞게 재구성 및 추가)
   ========================================================================= */

section {
  color: #111827;
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

.detail-card + .detail-card {
  margin-top: 2rem;
}
.sub-event-card {
  padding-top: 1.5rem;
}

/* 헤더 */
.detail-header {
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

/* 승인/반려 버튼 줄 (가운데 정렬) */
.approve-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 0.4rem;
  width: 100%;
}

/* 카드 공통 스타일 */
.block-card {
  background: #fff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 1rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.meta-card {
  background: #fff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 0; /* info-grid 내부에서 처리 */
  margin-bottom: 1.5rem;
  overflow: hidden; /* info-grid border-radius */
}
.meta-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  padding: 1rem 1rem 0 1rem;
  color: #111827;
}
.meta-card h5 {
  /* 자녀/신청자 정보 타이틀 */
  font-size: 1.1rem;
  font-weight: 700;
  padding: 1rem 1rem 0 1rem;
  color: #111827;
}

/* =============================
   📌 정보 그리드 스타일 (개선된 가독성)
   ============================= */
.info-grid {
  display: grid;
  grid-template-columns: 160px 1fr; /* 라벨 160px, 값 나머지 */
  border: 1px solid #e5e7eb;
  border-radius: 0.8rem;
  margin: 1rem; /* meta-card 내부 여백 */
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
.info-grid > div:nth-last-child(2),
.info-grid > div:last-child {
  border-bottom: none;
}

/* ============================
   📌 이벤트 내용 가독성 박스
   ============================ */
.content-block {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.content-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: #6b7280;
}

.content-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.7rem;
  padding: 1rem;
  min-height: 100px;
  max-height: 350px;
  overflow-y: auto;
  color: #111827;
  line-height: 1.45;
}

/* 상태 Pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid transparent;
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
  margin-bottom: 1rem;
}
.event-main-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
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
.file-name {
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}

/* 세부 이벤트 테이블 */
.sub-event-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}
.sub-event-table th,
.sub-event-table td {
  border: 1px solid #e5e7eb;
  padding: 0.75rem;
  font-size: 0.875rem;
  text-align: left;
}
.sub-event-table th {
  background: #f3f4f6;
  font-weight: 600;
  color: #4b5563;
}
</style>
