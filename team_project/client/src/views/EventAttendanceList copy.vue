<!-- src/views/EventAttendanceList.vue -->
<template>
  <section class="priority-page">
    <h2 class="priority-title">참가자 목록</h2>

    <!-- 검색 영역 -->
    <div class="priority-filters">
      <input
        v-model="filters.eventName"
        class="priority-input"
        placeholder="이벤트명"
        @keyup.enter="search"
      />

      <input
        v-model="filters.managerName"
        class="priority-input"
        placeholder="메인매니저명"
        @keyup.enter="search"
      />

      <select
        v-model="filters.applyStatus"
        class="priority-select"
        @change="search"
      >
        <option value="">전체</option>
        <option value="DE1">요청</option>
        <option value="DE2">승인</option>
        <option value="DE4">취소</option>
      </select>

      <div class="flex gap-2">
        <button class="priority-btn-search" @click="search">검색</button>
        <button class="priority-btn-reset" @click="reset">초기화</button>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="priority-card">
      <table class="priority-table">
        <thead>
          <tr>
            <th>신청코드</th>
            <th>이벤트명</th>
            <th>신청자</th>
            <th>신청일</th>
            <th>메인매니저</th>
            <th>신청상태</th>
            <!-- <th>참석상태</th> -->
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, idx) in rows"
            :key="row.apply_code || idx"
            class="priority-row"
            @click="viewApplyDetail(row.apply_code, row.event_code)"
          >
            <td>{{ row.apply_code }}</td>
            <td>{{ row.event_name }}</td>
            <td>{{ row.applicant_name }}</td>
            <td>{{ formatDate(row.apply_date) }}</td>
            <td>{{ row.manager_name }}</td>

            <td>
              <span
                :class="['priority-badge', stateBadgeClass(row.apply_status)]"
              >
                {{ codeLabel(row.apply_status_name) }}
              </span>
            </td>

            <!-- <td>
              <span
                :class="['priority-badge', stateBadgeClass(row.attend_status)]"
              >
                {{ codeLabel(row.attend_status_name) }}
              </span>
            </td> -->
          </tr>

          <tr v-if="rows.length === 0">
            <td class="priority-empty" colspan="7">조회 결과가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이징 -->
    <div class="priority-pagination">
      <button
        class="priority-page-btn"
        :disabled="page <= 1"
        @click="changePage(page - 1)"
      >
        이전
      </button>

      <span class="priority-page-info"
        >{{ page }} / {{ totalPages }} (총 {{ totalCount }}건)</span
      >

      <button
        class="priority-page-btn"
        :disabled="page >= totalPages"
        @click="changePage(page + 1)"
      >
        다음
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();

const filters = ref({
  applyStatus: "",
  eventName: "",
  managerName: "",
});

const rows = ref([]);
const totalCount = ref(0);

// 페이징
const page = ref(1);
const size = ref(20);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / size.value))
);

// API 호출
const load = async () => {
  try {
    const res = await axios.get("/api/event/attendanceList", {
      params: {
        applyStatus: filters.value.applyStatus || null,
        eventName: filters.value.eventName || null,
        managerName: filters.value.managerName || null,
        page: page.value,
        size: size.value,
      },
    });

    if (res.data.status === "success") {
      rows.value = res.data.data.rows;
      totalCount.value = res.data.data.totalCount;
    }
  } catch (err) {
    console.error(err);
    alert("서버 오류가 발생했습니다.");
  }
};

function search() {
  page.value = 1;
  load();
}

function reset() {
  filters.value.applyStatus = "";
  filters.value.eventName = "";
  filters.value.managerName = "";
  page.value = 1;
  load();
}

function changePage(next) {
  if (next < 1 || next > totalPages.value) return;
  page.value = next;
  load();
}

function formatDate(v) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

// 상태 라벨
function codeLabel(code) {
  const map = {
    DE1: "요청",
    DE2: "승인",
    DE4: "취소",
    DG1: "참석",
    DG2: "미참석",
  };
  return map[code] || code || "";
}

// badge 색상
function stateBadgeClass(code) {
  switch (code) {
    case "DE1":
      return "priority-badge-request"; // 요청
    case "DE2":
      return "priority-badge-approve"; // 승인
    case "DE4":
      return "priority-badge-reject"; // 취소
    case "DG1":
      return "priority-badge-approve"; // 참석
    case "DG2":
      return "priority-badge-reject"; // 미참석
    default:
      return "priority-badge-default";
  }
}

// 이벤트 상세화면 보기
const viewApplyDetail = (apply_code, event_code) => {
  router.push({
    name: "EventMyApplyInfo",
    params: { applyCode: apply_code, eventCode: event_code },
  });
};

onMounted(load);
</script>

<style scoped>
/* ========== priority 공통 디자인 그대로 사용 ========== */
* {
  font-size: 15px;
}
/* 페이지 전체 */
.priority-page {
  width: 1600px; /* 전체 폭 고정 */
  margin: 24px auto 40px; /* 좌우 가운데 정렬 */
  padding: 0 16px;
}

.priority-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111827;
}

.priority-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}

.priority-input,
.priority-select {
  padding: 7px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
}

.priority-btn-search {
  background: #2563eb;
  color: white;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
}

.priority-btn-reset {
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
}

/* 카드 */
.priority-card {
  width: 100%; /* 부모 폭에 맞춤 */
  max-width: 1600px; /* 최대 폭 동일 */
  margin: 0 auto;
  padding: 12px 16px;
  overflow-x: hidden;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
}

/* 테이블 */
.priority-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  table-layout: fixed; /* 컬럼 폭 고정 */
}

/* th 스타일 */
.priority-table thead th {
  text-align: center;
  padding: 6px 4px; /* 패딩 최소화 */
  font-size: 15px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* td 기본 스타일 */
.priority-table tbody td {
  padding: 6px 4px; /* 패딩 최소화 */
  border-bottom: 1px solid #f3f4f6;
  text-align: center;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 컬럼 폭 조정 */
.priority-table th:nth-child(1),
.priority-table td:nth-child(1) {
  width: 6%;
} /* 신청코드 */
.priority-table th:nth-child(2),
.priority-table td:nth-child(2) {
  width: 30%;
} /* 이벤트명 */
.priority-table th:nth-child(3),
.priority-table td:nth-child(3) {
  width: 14%;
} /* 신청자 */
.priority-table th:nth-child(4),
.priority-table td:nth-child(4) {
  width: 12%;
} /* 신청일 */
.priority-table th:nth-child(5),
.priority-table td:nth-child(5) {
  width: 14%;
} /* 메인매니저 */
.priority-table th:nth-child(6),
.priority-table td:nth-child(6) {
  width: 14%;
} /* 신청상태 */

/* 이름 컬럼 왼쪽 정렬 */
.priority-table tbody td:nth-child(2) {
  text-align: left;
}

/* 버튼/상태 컬럼 중앙 */
.priority-table tbody td:nth-child(1),
.priority-table tbody td:nth-child(3),
.priority-table tbody td:nth-child(5),
.priority-table tbody td:nth-child(6) {
  text-align: center;
}

/* hover */
.priority-row:hover {
  background: #f3f4ff;
}

.priority-empty {
  text-align: center;
  padding: 14px 0;
  color: #9ca3af;
}

.priority-pagination {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.priority-page-btn {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 12px;
}

.priority-page-btn:disabled {
  opacity: 0.5;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid transparent;
}

.priority-badge-request {
  background: #eef2ff;
  color: #3730a3;
  border-color: #c7d2fe;
}

.priority-badge-approve {
  background: #ecfdf5;
  color: #166534;
  border-color: #bbf7d0;
}

.priority-badge-reject {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.priority-badge-default {
  background: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}
* {
  font-size: 15px;
}
</style>
