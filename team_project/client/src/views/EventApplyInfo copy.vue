<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- 상단 액션라인 -->
    <div class="form-action">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>
    </div>

    <!-- 1. 메인 이벤트 카드 -->
    <div class="detail-card">
      <header class="flex justify-between items-center detail-header">
        <h2 class="text-2xl font-semibold">메인 이벤트 정보</h2>
        <span class="status-pill" :class="statusClass(event.register_status)">
          {{ event.register_status_name }}
        </span>
      </header>

      <!-- 대표 이미지 -->
      <div class="event-main-image">
        <img v-if="mainImage" :src="mainImage" alt="대표 이미지" />
        <div v-else class="no-image">이미지 없음</div>
      </div>

      <!-- 기본 정보 -->
      <div class="meta-card improved-meta">
        <div class="info-grid">
          <div class="info-label">이벤트명</div>
          <div class="info-value">{{ event.event_name }}</div>

          <div class="info-label">기관명</div>
          <div class="info-value">{{ event.org_name }}</div>

          <div class="info-label">장소</div>
          <div class="info-value">{{ event.event_location }}</div>

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

      <!-- 내용 (가독성 개선된 별도 박스) -->
      <div class="content-block">
        <div class="content-title">내용</div>
        <div class="content-box whitespace-pre-line">
          {{ event.event_content }}
        </div>
      </div>

      <!-- 첨부파일 -->
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

        <!-- 이미지 미리보기 -->
        <div v-if="previewImage" class="preview-modal" @click="closePreview">
          <img :src="previewImage" class="preview-img" />
        </div>
      </div>
    </div>

    <!-- 2. 세부 이벤트 정보 테이블 -->
    <div v-if="event.sub_events.length" class="detail-card">
      <h2 class="text-xl font-semibold mb-4">세부 이벤트 정보</h2>

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

    <!-- 3. 매니저 정보 -->
    <div
      class="detail-card"
      v-if="mainManager.manager_name || subManagers.length"
    >
      <h2 class="text-lg font-semibold mb-4">매니저 정보</h2>

      <!-- 메인 매니저 -->
      <div v-if="mainManager.manager_name" class="meta-card mb-4">
        <h5>메인 매니저 정보</h5>
        <div class="meta-row">
          <span>이름</span><span>{{ mainManager.manager_name }}</span>
        </div>
        <div class="meta-row">
          <span>부서</span><span>{{ mainManager.department }}</span>
        </div>
        <div class="meta-row">
          <span>이메일</span><span>{{ mainManager.email }}</span>
        </div>
        <div class="meta-row">
          <span>전화번호</span><span>{{ mainManager.phone }}</span>
        </div>
      </div>

      <!-- 서브 매니저 -->
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

    <!-- 4. 관리자 승인/반려 -->
    <div class="pt-4 border-t mt-2 space-y-3" v-if="isAdmin">
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
          반려
        </MaterialButton>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";

const route = useRoute();
const router = useRouter();

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
const userCode = getLoginUserCode();

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
const role = ref(getLoginRole());

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
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    previewImage.value = file.file_path;
    return;
  }
  if (ext === "pdf") {
    window.open(file.file_path, "_blank");
    return;
  }
  window.location.href = file.file_path;
};
const closePreview = () => (previewImage.value = "");

// 관리자 권한
const isAdmin = computed(
  () => role.value === "AA3" && event.value.register_status !== "BA2"
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

// 날짜 포맷
const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// 매니저 필터링
const mainManager = computed(
  () => event.value.sub_managers?.find((m) => m.manager_type === "DA1") || {}
);
const subManagers = computed(
  () => event.value.sub_managers?.filter((m) => m.manager_type === "DA2") || []
);

// 이벤트 조회
const fetchEvent = async () => {
  try {
    const res = await axios.get(`/api/event/${eventCode}`, {
      params: { user_code: userCode },
    });
    event.value = res.data.data || {};
    isApplied.value = !!event.value.alreadyApplied;

    const img = event.value.attachments.find((x) =>
      /\.(jpg|jpeg|png|gif)$/i.test(x.original_filename)
    );
    mainImage.value = img ? img.file_path : "";
    await nextTick();
  } catch (err) {
    console.error("fetchEvent error:", err);
  }
};

// 승인/반려
const handleApprove = async () => {
  try {
    const res = await axios.post(`/api/event/${eventCode}/approve`);
    if (res.data.success) {
      alert("승인되었습니다.");
      await fetchEvent();
    } else alert(res.data.message || "승인 실패");
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

const handleReject = async () => {
  const reason = prompt("반려 사유를 입력해주세요:");
  if (!reason) return;
  try {
    const res = await axios.post(`/api/event/${eventCode}/reject`, { reason });
    if (res.data.success) {
      alert("반려 처리되었습니다.");
      await fetchEvent();
    } else alert(res.data.message || "반려 실패");
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 화면 이동
const goBack = () => router.back();

onMounted(() => fetchEvent());
</script>

<style scoped>
section {
  color: #111827;
}

.form-action {
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

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

.detail-header {
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

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
}
.meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.meta-row span:first-child {
  color: #6b7280;
}
.meta-row span:last-child {
  color: #111827;
}

/* ============================
   📌 메인이벤트 내용 가독성 박스 추가
   ============================ */
.content-block {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem; /* 🔥 이거 추가 */
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
  min-height: 120px;
  max-height: 350px;
  overflow-y: auto;
  color: #111827;
  line-height: 1.45;
}

/* 상태 Pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
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
  padding: 0.5rem;
  font-size: 0.875rem;
}
.sub-event-table th,
.manager-table th {
  background: #f3f4f6;
}

.approve-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview-img {
  max-width: 90%;
  max-height: 90%;
}

/* =============================
   📌 기본정보 가독성 개선 스타일
   ============================= */
.improved-meta {
  padding: 0; /* 외곽 패딩 제거 */
  overflow: hidden;
}

.info-grid {
  display: grid;
  grid-template-columns: 160px 1fr; /* 라벨 160px, 값 나머지 */
  border: 1px solid #e5e7eb;
  border-radius: 0.8rem;
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
.info-label:nth-last-child(2),
.info-value:last-child {
  border-bottom: none;
}
</style>
