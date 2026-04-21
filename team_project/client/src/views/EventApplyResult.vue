<template>
  <section class="apply-page">
    <h2 class="page-title" v-if="role === 'AA2'">내 요청 목록</h2>
    <h2 class="page-title" v-if="role === 'AA3'">
      이벤트 계획/결과 승인 요청 관리
    </h2>
    <div class="table-wrap">
      <table class="apply-table">
        <thead>
          <tr>
            <th>이벤트코드</th>
            <th>이벤트명</th>
            <th>이벤트 요청일</th>
            <th>메인 매니저</th>
            <th>계획 상태</th>
            <th>결과 상태</th>
            <th>진행계획</th>
            <th>진행결과</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, idx) in events"
            :key="row.event_code || idx"
            class="click-row"
          >
            <td class="text-center">{{ row.event_code }}</td>

            <!-- 이름 → 왼쪽 정렬 -->
            <td class="text-left">{{ row.event_name }}</td>

            <!-- 날짜 → 중앙정렬 -->
            <td class="text-center">
              {{ formatDate(row.event_register_date) }}
            </td>

            <!-- 이름 → 중앙 정렬 -->
            <td class="text-center">{{ row.main_manager_name || "-" }}</td>

            <!-- 상태값 → 중앙 -->
            <td class="text-center">
              <span
                :class="['status-badge', statusBadgeClass(row.register_status)]"
              >
                {{ row.register_status_name || "-" }}
              </span>
            </td>

            <td class="text-center">
              <span
                v-if="row.event_result_code"
                :class="['status-badge', statusBadgeClass(row.result_status)]"
              >
                {{ row.result_status_name || "-" }}
              </span>
              <span v-else>-</span>
            </td>

            <!-- 중앙 -->
            <td class="text-center">
              <button class="view-btn" @click="viewPlan(row.event_code)">
                보기
              </button>
            </td>

            <!-- 중앙 -->
            <td class="text-center">
              <button
                v-if="row.event_result_code"
                class="view-btn"
                @click="viewResult(row.event_result_code)"
              >
                보기
              </button>
              <span v-else>-</span>
            </td>
          </tr>

          <tr v-if="!events.length">
            <td colspan="8" class="empty-row">등록된 이벤트가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const events = ref([]);

const getLoginUserCode = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr).user_code || null;
  } catch {
    return null;
  }
};

const getLoginRole = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr).role || null;
  } catch {
    return null;
  }
};

const user_code = getLoginUserCode();
const role = getLoginRole();

const formatDate = (v) => (v ? String(v).slice(0, 10) : "-");

const loadEvents = async () => {
  try {
    if (!user_code) {
      alert("로그인 상태가 아닙니다.");
      return;
    }

    const params = { role, user_code };
    if (role !== "AA3") params.user_code = user_code;

    const res = await axios.get("/api/event/applyResult", { params });
    events.value = res.data.data || [];
  } catch (err) {
    console.error("이벤트 요청/결과 목록 조회 실패:", err);
  }
};

const statusBadgeClass = (code) => {
  switch (code) {
    case "BA1":
      return "badge-request";
    case "BA2":
      return "badge-approve";
    case "BA3":
      return "badge-reject";
    default:
      return "badge-default";
  }
};

const viewPlan = (event_code) => {
  router.push({ name: "EventApplyInfo", params: { eventCode: event_code } });
};

const viewResult = (event_result_code) => {
  router.push({
    name: "EventResultInfo",
    params: { resultCode: event_result_code },
  });
};

onMounted(loadEvents);
</script>

<style scoped>
/* 페이지 전체 */
.apply-page {
  width: 1600px;
  margin: 24px auto 40px;
  padding: 0 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111827;
}

/* 테이블 래핑 */
.table-wrap {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  overflow-x: auto;
  padding: 12px 16px;
}

/* 테이블 */
.apply-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  table-layout: auto; /* 내용에 맞게 컬럼 너비 자동 조정 */
}

.apply-table th {
  text-align: center;
  padding: 8px 6px; /* 간격 줄임 */
  font-size: 14px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.apply-table td {
  padding: 6px 6px; /* 간격 줄임 */
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  text-align: center;
  vertical-align: middle;

  white-space: nowrap; /* 줄바꿈 방지 */
  overflow: hidden;
  text-overflow: ellipsis; /* 넘치면 … 처리 */
  max-width: 250px; /* 필요시 조절 */
}

.text-left {
  text-align: left !important;
}
.text-center {
  text-align: center !important;
}

/* hover */
.click-row:hover {
  background: #f3f4ff;
  cursor: pointer;
}

/* 빈행 */
.empty-row {
  text-align: center;
  padding: 14px 0;
  color: #9ca3af;
}

/* 버튼 */
.view-btn {
  background: #2563eb;
  color: white;
  border-radius: 6px;
  padding: 4px 10px; /* 조금 더 슬림하게 */
  font-size: 12px;
  cursor: pointer;
  border: none;
}
.view-btn:hover {
  background: #1e40af;
}

/* 상태 뱃지 */
.status-badge {
  padding: 2px 6px; /* 가로 패딩 줄임 */
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid transparent;
}

.badge-request {
  background: #eef2ff;
  color: #3730a3;
  border-color: #c7d2fe;
}

.badge-approve {
  background: #ecfdf5;
  color: #166534;
  border-color: #bbf7d0;
}

.badge-reject {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.badge-default {
  background: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}
</style>
