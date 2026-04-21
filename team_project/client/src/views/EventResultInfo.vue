<template>
  <section class="p-6 max-w-5xl mx-auto space-y-6">
    <!-- 상단 액션라인 -->
    <div class="form-action">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>
    </div>

    <!-- 결과보고서 상세 카드 -->
    <div v-if="result" class="detail-card">
      <header class="flex justify-between items-center detail-header">
        <h2 class="text-2xl font-semibold">결과보고서 상세</h2>
        <span class="status-pill" :class="statusClass(result.result_status)">
          {{ result.result_status_name }}
        </span>
      </header>

      <!-- 기본 정보 -->
      <div class="meta-card improved-meta">
        <div class="info-grid">
          <div class="info-label">제목</div>
          <div class="info-value">{{ result.result_subject }}</div>

          <div class="info-label">작성일</div>
          <div class="info-value">
            {{ formatDate(result.report_register_date) }}
          </div>
        </div>
      </div>

      <!-- 내용 -->
      <div class="content-block">
        <div class="content-title">내용</div>
        <div class="content-box whitespace-pre-line">
          {{ result.result_content }}
        </div>
      </div>

      <!-- 참석자 목록 -->
      <div class="detail-card" v-if="attendanceList && attendanceList.length">
        <h3 class="text-xl font-semibold mb-4">참석자 목록</h3>
        <table class="attendance-table">
          <thead>
            <tr>
              <th>신청코드</th>
              <th>자녀명</th>
              <th>보호자명</th>
              <th>참석여부</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedAttendance" :key="row.apply_code">
              <td>{{ row.apply_code }}</td>
              <td>{{ row.child_name }}</td>
              <td>{{ row.applicant_name }}</td>
              <td>
                <span v-if="row.apply_status_name === '승인'">참석</span>
                <span v-else>불참석</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 페이지네이션 -->
        <div class="pagination" v-if="totalPages > 1">
          <button class="page-btn" :disabled="page === 1" @click="page--">
            이전
          </button>
          <span class="page-info"> {{ page }} / {{ totalPages }} </span>
          <button
            class="page-btn"
            :disabled="page === totalPages"
            @click="page++"
          >
            다음
          </button>
        </div>
      </div>

      <!-- 첨부파일 -->
      <div class="content-block">
        <div class="content-title">첨부파일</div>
        <div v-if="result.attachments?.length">
          <ul class="file-list">
            <li v-for="file in result.attachments" :key="file.server_filename">
              <span class="file-name" @click="previewFile(file)">
                {{ file.original_filename }}
              </span>
            </li>
          </ul>
        </div>
        <div v-else class="text-xs text-gray-400">첨부된 파일이 없습니다.</div>

        <!-- 이미지 미리보기 -->
        <div v-if="previewImage" class="preview-modal" @click="closePreview">
          <img :src="previewImage" class="preview-img" />
        </div>
      </div>
    </div>

    <!-- 관리자 전용 승인/반려 -->
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
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";

const route = useRoute();
const router = useRouter();

const result = ref(null);
const resultCode = Number(route.params.resultCode || 0);

// 로그인 권한
const getLoginRole = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr).role || null;
  } catch {
    return null;
  }
};
const loginRole = ref(getLoginRole());

// 미리보기 이미지
const previewImage = ref("");
const previewFile = (file) => {
  const ext = file.original_filename.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    previewImage.value = file.file_path;
  else if (ext === "pdf") window.open(file.file_path, "_blank");
  else window.location.href = file.file_path;
};
const closePreview = () => (previewImage.value = "");

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

// 승인/반려
const handleApprove = async () => {
  try {
    const res = await axios.post(`/api/event/result/${resultCode}/approve`);
    if (res.data.success) {
      alert("승인되었습니다.");
      await fetchResult();
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
    const res = await axios.post(`/api/event/result/${resultCode}/reject`, {
      reason,
    });
    if (res.data.success) {
      alert("반려 처리되었습니다.");
      await fetchResult();
    } else alert(res.data.message || "반려 실패");
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 데이터 호출
const fetchResult = async () => {
  try {
    const res = await axios.get(`/api/event/result/${resultCode}`);
    if (res.data?.status === "success") result.value = res.data.data;
    else alert("결과보고서 조회 실패");
  } catch (err) {
    console.error("fetchResult error:", err);
    alert("서버 오류 발생");
  }
};

// 참석자
const attendanceList = ref([]);
const page = ref(1);
const pageSize = 10;
const pagedAttendance = computed(() => {
  const start = (page.value - 1) * pageSize;
  return attendanceList.value.slice(start, start + pageSize);
});
const totalPages = computed(() =>
  Math.ceil(attendanceList.value.length / pageSize)
);
const fetchAttendance = async () => {
  if (!result.value?.event_code) return;
  try {
    const res = await axios.get(
      `/api/event/myAttendanceList/${result.value.event_code}`
    );
    attendanceList.value = res.data.data || [];
    page.value = 1;
  } catch (err) {
    console.error("fetchAttendance error:", err);
    alert("서버 오류 발생");
  }
};

const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const isAdmin = computed(
  () => loginRole.value === "AA3" && result.value?.result_status !== "BA2"
);
const goBack = () => router.back();

onMounted(async () => {
  await fetchResult();
  await fetchAttendance();
});
</script>

<style scoped>
section {
  color: #111827;
  max-width: 1600px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.form-action {
  display: flex;
  justify-content: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}

.detail-card {
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}
.detail-header {
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.meta-card {
  background: #fff;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  padding: 1.75rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  margin-bottom: 1.5rem;
}
.improved-meta .info-grid {
  display: grid;
  grid-template-columns: 160px 1fr;
  border: 1px solid #e5e7eb;
  border-radius: 0.8rem;
  overflow: hidden;
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
.info-label:nth-last-child(2),
.info-value:last-child {
  border-bottom: none;
}

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
  min-height: 120px;
  max-height: 350px;
  overflow-y: auto;
  line-height: 1.45;
}

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

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.75rem;
  font-size: 0.875rem;
}
.attendance-table th,
.attendance-table td {
  border: 1px solid #e5e7eb;
  padding: 0.6rem 0.75rem;
  text-align: left;
}
.attendance-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
}
.attendance-table tbody tr:nth-child(even) {
  background: #f9fafb;
}
.attendance-table tbody tr:hover {
  background: #f3f4f6;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}
.page-btn {
  padding: 0.35rem 0.8rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-info {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
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
.file-list a,
.file-name {
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}
.file-list a:hover,
.file-name:hover {
  color: #1d4ed8;
}

.approve-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 0.4rem;
  width: 100%;
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
</style>
