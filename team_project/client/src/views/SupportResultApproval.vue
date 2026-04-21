<!-- src/views/SupportResultApproval.vue -->
<template>
  <div class="priority-page">
    <h2 class="priority-title">지원결과 승인 요청 목록</h2>

    <!-- 검색 / 상태 / 정렬 -->
    <div class="priority-filters">
      <input
        v-model="keyword"
        class="priority-input"
        placeholder="이름/보호자/기관 검색"
        @keyup.enter="searchList"
      />

      <select v-model="state" class="priority-select" @change="searchList">
        <option value="">전체</option>
        <option value="BA1">요청</option>
        <option value="BA2">승인</option>
        <option value="BA3">반려</option>
      </select>

      <select v-model="orderBy" class="priority-select" @change="searchList">
        <option value="latest">최신순</option>
        <option value="oldest">오래된순</option>
        <option value="name">이름순</option>
        <option value="priority">우선순위순</option>
      </select>
    </div>

    <div class="priority-card">
      <!-- 로딩 표시 -->
      <div v-if="loading" class="priority-loading">불러오는 중...</div>

      <!-- 목록 테이블 -->
      <table v-else class="priority-table">
        <thead>
          <tr>
            <th>승인코드</th>
            <th>이름</th>
            <th>장애유형</th>
            <th>보호자</th>
            <th>담당자</th>
            <th v-if="isOrgVisible">기관</th>
            <th>결과 작성일</th>
            <th>우선순위</th>
            <th>상태</th>
            <th>처리일</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.approval_code"
            @click="onRowClick(item)"
            class="priority-row"
          >
            <td>{{ item.approval_code }}</td>
            <td>{{ item.child_name || "본인" }}</td>
            <td>{{ item.disability_type }}</td>
            <td>{{ item.parent_name }}</td>
            <td>{{ item.manager_name }}</td>
            <td v-if="isOrgVisible">{{ item.org_name }}</td>
            <td>{{ formatDate(item.written_at) }}</td>

            <td>
              <span
                class="priority-chip"
                :class="priorityChipClass(item.priority_level)"
              >
                {{ codeLabel(item.priority_level) }}
              </span>
            </td>

            <td>
              <span class="priority-badge" :class="stateBadgeClass(item.state)">
                {{ codeLabel(item.state) }}
              </span>
            </td>

            <td>
              {{
                item.state === "BA1" || !item.approval_date
                  ? "-"
                  : formatDate(item.approval_date)
              }}
            </td>
          </tr>

          <tr v-if="list.length === 0">
            <td class="priority-empty" :colspan="isOrgVisible ? 10 : 9">
              데이터가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 페이징 -->
      <div v-if="!loading && totalPages > 1" class="priority-pagination">
        <MaterialButton
          color="dark"
          size="sm"
          :disabled="page === 1"
          @click="changePage(page - 1)"
        >
          이전
        </MaterialButton>

        <span class="priority-page-info">
          {{ page }} / {{ totalPages }} (총 {{ totalCount }}건)
        </span>

        <MaterialButton
          color="dark"
          size="sm"
          :disabled="page === totalPages"
          @click="changePage(page + 1)"
        >
          다음
        </MaterialButton>
      </div>

      <!-- 🔹 반려사유 모달 -->
      <div
        v-if="showRejectModal"
        class="priority-modal-backdrop"
        @click.self="closeRejectModal"
      >
        <div class="priority-modal">
          <h3 class="priority-modal-title">이전 반려 사유</h3>

          <div class="priority-modal-section">
            <div class="priority-modal-label">반려 사유</div>
            <div class="priority-modal-reason">
              {{ rejectModalData.reason }}
            </div>
          </div>

          <div class="priority-modal-section">
            <div class="priority-modal-label">최신 승인 상태</div>
            <div class="priority-modal-text">
              <template v-if="rejectModalData.newestState === 'BA1'">
                이 건은 현재
                <strong>재승인 요청(대기)</strong>
                상태입니다.<br />
                재승인 승인코드:
              </template>

              <template v-else-if="rejectModalData.newestState === 'BA2'">
                이 건은 현재
                <strong>승인 완료된 건</strong>
                입니다.<br />
                최종 승인코드:
              </template>

              <template v-else-if="rejectModalData.newestState === 'BA3'">
                이 건은 현재도
                <strong>반려 상태</strong>
                입니다.<br />
                최신 승인코드:
              </template>

              <template v-else>
                이 건에는 이후 승인 이력이 있습니다.<br />
                최신 승인코드:
              </template>

              <strong>{{ rejectModalData.newestApprovalCode || "-" }}</strong>
            </div>
          </div>

          <div class="priority-modal-actions">
            <MaterialButton color="dark" size="sm" @click="closeRejectModal">
              닫기
            </MaterialButton>
          </div>
        </div>
      </div>
      <!-- 🔹 반려사유 모달 끝 -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/authLogin.js";
import MaterialButton from "@/components/MaterialButton.vue";

const router = useRouter();
const auth = useAuthStore();

const list = ref([]);

// 페이지 관련 상태
const page = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const loading = ref(false);

// 전체 페이지 수 계산
const totalPages = computed(() =>
  totalCount.value > 0 ? Math.ceil(totalCount.value / pageSize.value) : 1
);

// 검색어, 상태, 정렬
const keyword = ref("");
const state = ref("");
const orderBy = ref("latest"); // 최신순 기본

// 유저 역할 코드 (AA3 / AA4 등)
const userRole = computed(() => {
  return (
    auth.role || // 예: 'AA3', 'AA4'
    (auth.user && auth.user.roleCode) ||
    ""
  );
});

// 로그인 아이디 (기관 필터 기준)
const loginId = computed(() => {
  return (
    auth.userId ||
    auth.loginId ||
    auth.id ||
    (auth.user && auth.user.userId) ||
    ""
  );
});

// 기관 관리자 여부 (AA3)
const isOrgManager = computed(() => userRole.value === "AA3");

// 시스템 관리자 여부 (AA4)
const isSystemAdmin = computed(() => userRole.value === "AA4");

// 이 페이지 접근 가능 여부 (AA3 또는 AA4)
const canViewSupportResultPage = computed(
  () => isOrgManager.value || isSystemAdmin.value
);

// 기관 컬럼 표시 여부 (기관 관리자면 숨김)
const isOrgVisible = computed(() => !isOrgManager.value);

// 상세화면 role 값 (AA3 → 3, AA4 → 4)
const detailRole = computed(() => {
  return isSystemAdmin.value ? 4 : 3;
});

// 🔹 반려사유 모달 상태
const showRejectModal = ref(false);
const rejectModalData = ref({
  reason: "",
  newestApprovalCode: "",
  newestState: "",
});

// 공통코드 매핑
const CODE_LABEL_MAP = {
  // 요청 상태(BA)
  BA1: "요청",
  BA2: "승인",
  BA3: "반려",

  // 우선순위 유형(BB)
  BB1: "긴급",
  BB2: "중점",
  BB3: "준비",
};

function searchList() {
  page.value = 1; // 검색하면 페이지 초기화
  loadList();
}

function codeLabel(code) {
  if (!code) return "";
  return CODE_LABEL_MAP[code] || code;
}

function priorityChipClass(level) {
  switch (level) {
    case "BB1":
      return "priority-chip-danger";
    case "BB2":
      return "priority-chip-warning";
    case "BB3":
      return "priority-chip-info";
    default:
      return "priority-chip-default";
  }
}

function stateBadgeClass(state) {
  switch (state) {
    case "BA1":
      return "priority-badge-request";
    case "BA2":
      return "priority-badge-approve";
    case "BA3":
      return "priority-badge-reject";
    default:
      return "priority-badge-default";
  }
}

function formatDate(value) {
  if (!value) return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

// 🔹 지원결과 승인 목록 호출
async function loadList() {
  loading.value = true;
  try {
    const res = await axios.get("/api/approvals/support-result", {
      params: {
        page: page.value,
        size: pageSize.value,
        keyword: keyword.value,
        state: state.value,
        orderBy: orderBy.value,
        loginId: loginId.value, // 🔹 로그인 아이디
        role: userRole.value, // 🔹 역할 (AA3 / AA4)
      },
    });

    const payload = res.data?.data || {};
    const rows = Array.isArray(payload.rows) ? payload.rows : [];

    list.value = rows;
    totalCount.value = payload.totalCount ?? 0;
  } catch (err) {
    console.error("[SupportResultApproval] loadList error:", err);
    list.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
}

// 페이지 변경
function changePage(nextPage) {
  if (nextPage < 1) return;
  if (nextPage > totalPages.value) return;
  if (nextPage === page.value) return;

  page.value = nextPage;
  loadList();
}

// 🔹 모달 닫기
function closeRejectModal() {
  showRejectModal.value = false;
}

// 🔹 행 클릭 처리 (반려 + 재요청 이력 있는 옛 건 → 모달)
function onRowClick(item) {
  // has_newer_request 는 SQL에서 EXISTS(...) AS has_newer_request 로 내려옴
  if (item.state === "BA3" && item.has_newer_request) {
    // newest_approval_code 의 최신 행을 현재 목록에서 찾아서 최신 상태 확인
    const latestRow = list.value.find(
      (row) => row.approval_code === item.newest_approval_code
    );
    const newestState = latestRow?.state || "";

    rejectModalData.value = {
      reason: item.rejection_reason?.trim() || "(등록된 반려 사유가 없습니다.)",
      newestApprovalCode: item.newest_approval_code || "",
      newestState,
    };

    showRejectModal.value = true;
    return;
  }

  // 그 외는 기존 상세 이동
  goDetail(item);
}

// ✅ 각 행 클릭 시 지원결과 상세로 이동
function goDetail(item) {
  router.push({
    name: "resultDetail",
    params: { resultCode: item.result_code },
    query: {
      role: detailRole.value, // AA3 -> 3, AA4 -> 4
      submitCode: item.submit_code,
      planCode: item.plan_code,
    },
  });
}

onMounted(() => {
  if (!canViewSupportResultPage.value) {
    alert("기관 관리자 및 시스템 관리자만 접근할 수 있습니다.");
    router.push("/");
    return;
  }

  loadList();
});
</script>

<style scoped>
* {
  font-size: 15px;
}

.priority-page {
  max-width: 1600px;
  margin: 24px auto 40px;
  padding: 0 16px;
}

.priority-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111827;
}

.priority-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  padding: 12px 16px;
}

/* 🔹 테이블 기본 스타일 (후원 결과와 동일 계열) */
.priority-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.priority-table thead th {
  text-align: center;
  padding: 10px 8px;
  font-weight: 600;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  white-space: nowrap;
}

.priority-table tbody td {
  padding: 9px 8px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: middle;
  text-align: center;
}

/* 🔹 행 호버 효과 */
.priority-row {
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    transform 0.06s ease;
}

.priority-row:hover {
  background: #f3f4ff;
  transform: translateY(-1px);
}

.priority-empty {
  text-align: center;
  padding: 14px 0;
  color: #9ca3af;
}

/* 🔹 우선순위 칩 */
.priority-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}

/* 우선순위별 색상 */
.priority-chip-danger {
  background-color: #fab39f !important;
  color: #8a2e2e !important;
  border: 1px solid #e28f7f !important;
}

.priority-chip-warning {
  background-color: #fce8a1 !important;
  color: #b0681b !important;
  border: 1px solid #e6c77b !important;
}

.priority-chip-info {
  background-color: #e4f0ff !important;
  color: #476c99 !important;
  border: 1px solid #a5c3da !important;
}

.priority-chip-default {
  background: #e5e7eb;
  color: #4b5563;
}

/* 🔹 상태 배지 (요청/승인/반려) */
.priority-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid transparent;
}

/* 요청/승인/반려 색상 */
.priority-badge-request {
  background-color: #e4f0ff !important;
  color: #476c99 !important;
  border: 1px solid #a5c3da !important;
}

.priority-badge-approve {
  background-color: #deeec8 !important;
  color: #3f7a3a !important;
  border: 1px solid #bedca0 !important;
}

.priority-badge-reject {
  background-color: #fab39f !important;
  color: #8a2e2e !important;
  border: 1px solid #e28f7f !important;
}

.priority-badge-default {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #4b5563;
}

/* 🔹 로딩 텍스트 */
.priority-loading {
  font-size: 13px;
  color: #6b7280;
  padding: 8px 4px;
}

/* 🔹 페이징 영역 */
priority-pagination {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #4b5563;
}

.priority-page-btn {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  cursor: pointer;
  font-size: 12px;
  transition:
    background-color 0.12s ease,
    transform 0.06s ease,
    box-shadow 0.12s ease;
}

.priority-page-btn:hover:not(:disabled) {
  background: #eef2ff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  transform: translateY(-0.5px);
}

.priority-page-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.priority-page-info {
  min-width: 120px;
  text-align: right;
}

/* 🔹 상단 필터 영역 */
.priority-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}

.priority-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
}

.priority-select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}

/* 🔹 반려사유 모달 스타일 */
.priority-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.priority-modal {
  width: 420px;
  max-width: 90%;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
  padding: 20px 22px 16px;
}

.priority-modal-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #111827;
}

.priority-modal-section {
  margin-bottom: 12px;
}

.priority-modal-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.priority-modal-reason {
  max-height: 160px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  white-space: pre-wrap;
}

.priority-modal-text {
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
}

.priority-modal-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>
