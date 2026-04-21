<template>
  <section class="p-6 max-w-5xl mx-auto">
    <div class="form-action">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>
    </div>

    <div v-if="result" class="detail-card">
      <header class="flex justify-between items-center detail-header">
        <div>
          <h2 class="text-2xl font-semibold">결과보고서 상세</h2>
        </div>

        <!-- 상태 뱃지 -->
        <span class="status-pill" :class="statusClass(result.result_status)">
          {{ result.result_status_name }}
        </span>
      </header>

      <div class="meta-card">
        <div class="meta-row">
          <span>제목</span>
          <span>{{ result.result_subject }}</span>
        </div>
        <div class="meta-row">
          <span>작성일</span>
          <span>{{ formatDate(result.report_register_date) }}</span>
        </div>
      </div>

      <div class="block-card">
        <div class="field-block">
          <div class="field-label">내용</div>
          <div class="field-value whitespace-pre-line">
            {{ result.result_content }}
          </div>
        </div>
      </div>

      <!-- 참석자 목록 -->
      <div class="block-card">
        <div class="field-block">
          <div class="field-label">참석자 목록</div>

          <!-- 데이터 로딩 후 출력 -->
          <div v-if="attendanceList && attendanceList.length">
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

                  <!-- 참석 여부 규칙 적용 -->
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

          <div v-else class="text-xs text-gray-400">
            참석자 데이터가 없습니다.
          </div>
        </div>
      </div>

      <!-- 첨부파일 -->
      <div class="block-card">
        <div class="field-block">
          <div class="field-label">첨부파일</div>

          <div v-if="result.attachments?.length">
            <ul class="file-list">
              <li
                v-for="file in result.attachments"
                :key="file.server_filename"
              >
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

        <!-- 이미지 미리보기 모달 -->
        <div v-if="previewImage" class="preview-modal" @click="closePreview">
          <img :src="previewImage" class="preview-img" />
        </div>
      </div>
    </div>

    <!-- 관리자 전용 영역: 승인/반려 버튼 -->
    <div class="pt-4 border-t mt-2 space-y-3" v-if="isAdmin">
      <!-- 승인/반려 버튼 -->
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
const eventCode = ref(0);

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

// 대표 이미지 설정
const mainImage = ref("");
const isApplied = ref(false);

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

// 상태 버튼 표시
const isAdmin = computed(
  () => loginRole.value === "AA3" && result.value?.result_status !== "BA2"
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

// API 호출
const fetchResult = async () => {
  try {
    const res = await axios.get(`/api/event/result/${resultCode}`);
    console.log("resultCode = ", resultCode);
    if (res.data?.status === "success") {
      result.value = res.data.data;
      isApplied.value = !!result.value.alreadyApplied;

      // result.event_code로 eventCode 설정
      eventCode.value = result.value.event_code || 0;
    } else {
      alert("결과보고서 조회 실패");
      return;
    }

    // 대표 이미지
    const img = result.value.attachments.find((x) =>
      /\.(jpg|jpeg|png|gif)$/i.test(x.original_filename)
    );
    mainImage.value = img ? img.file_path : "";
  } catch (err) {
    console.error("fetchResult error:", err);
    alert("서버 오류 발생");
  }
};

// 참석자 목록
const attendanceList = ref(null);
const page = ref(1);
const pageSize = 10;

const pagedAttendance = computed(() => {
  if (!attendanceList.value) return [];
  const start = (page.value - 1) * pageSize;
  return attendanceList.value.slice(start, start + pageSize);
});

const totalPages = computed(() => {
  return Math.ceil(attendanceList.value.length / pageSize);
});

// API 호출
const fetchAttendance = async () => {
  if (!eventCode.value) return;
  try {
    const res = await axios.get(
      `/api/event/myAttendanceList/${eventCode.value}`
    );

    attendanceList.value = res.data.data || [];
    page.value = 1;
  } catch (err) {
    console.error("fetchAttendance error:", err);
    alert("서버 오류 발생");
  }
};

const formatDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// 승인 (관리자)
const handleApprove = async () => {
  try {
    const res = await axios.post(`/api/event/result/${resultCode}/approve`);
    if (res.data.success) {
      alert("승인되었습니다.");
      await fetchResult();
    } else {
      alert(res.data.message || "승인 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 반려 (관리자)
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
    } else {
      alert(res.data.message || "반려 실패");
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류: " + (err.message || ""));
  }
};

// 이전 버튼
const goBack = () => router.back();

onMounted(async () => {
  await fetchResult();
  await fetchAttendance();
});
</script>

<style scoped>
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

/* 헤더 */
.detail-header {
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.block-card,
.meta-card {
  background: #fff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}
.meta-card .meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.meta-card .meta-row span:first-child {
  color: #6b7280;
}
.meta-card .meta-row span:last-child {
  color: #111827;
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

/* 상태별 톤 */
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
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.attendance-table th,
.attendance-table td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
}

.attendance-table th {
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.page-btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: #374151;
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
.file-list a {
  color: #2563eb;
  text-decoration: underline;
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
</style>
