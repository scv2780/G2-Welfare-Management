<!-- src/views/StaffApprovals.vue -->
<template>
  <div class="apv-page">
    <h2 class="apv-title">기관 담당자 승인 및 요청 목록</h2>

    <!-- 검색/필터 -->
    <div class="apv-toolbar">
      <div class="apv-filters">
        <input
          v-model.trim="keyword"
          class="apv-input"
          placeholder="이름/아이디/기관명/연락처/이메일 검색"
          @keyup.enter="fetchList"
        />
        <select v-model="state" class="apv-select" @change="onFilterChange">
          <option value="">전체</option>
          <option value="BA1">요청</option>
          <option value="BA2">승인</option>
          <option value="BA3">반려</option>
        </select>
      </div>
      <MaterialButton color="dark" size="sm" @click="fetchList"
        >조회</MaterialButton
      >
    </div>

    <!-- 테이블 -->
    <div class="apv-table-wrap">
      <table class="apv-table">
        <thead>
          <tr>
            <th>승인코드</th>
            <th>이름</th>
            <th>아이디</th>
            <th v-if="isOrgVisible">기관명</th>
            <th>연락처</th>
            <th>이메일</th>
            <th>상태</th>
            <th>요청일</th>
            <th>처리일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && rows.length === 0">
            <td :colspan="isOrgVisible ? 10 : 9" class="apv-empty">
              데이터가 없습니다.
            </td>
          </tr>
          <tr v-for="r in rows" :key="r.approval_code">
            <td>{{ r.approval_code }}</td>
            <td>{{ r.user_name }}</td>
            <td>{{ r.login_id }}</td>
            <td v-if="isOrgVisible">{{ r.organization_name }}</td>
            <td>{{ r.phone }}</td>
            <td>{{ r.email }}</td>
            <td>
              <span :class="['apv-state-pill', `apv-state-${r.state}`]">
                {{ stateLabel(r.state) }}
              </span>
            </td>
            <td>{{ fmtDate(r.request_date) }}</td>
            <td>{{ r.approval_date ? fmtDate(r.approval_date) : "-" }}</td>

            <!-- 요청 상태(BA1)인 경우에만 승인/반려 버튼 -->
            <td class="apv-actions-cell">
              <!-- 🔹 요청 상태(BA1)이고, 기관 관리자(AA3)일 때만 버튼 노출 -->
              <template v-if="r.state === 'BA1' && auth.role === 'AA3'">
                <MaterialButton color="dark" size="sm" @click="onApprove(r)">
                  승인
                </MaterialButton>
                <MaterialButton color="dark" size="sm" @click="onReject(r)">
                  반려
                </MaterialButton>
              </template>
              <template v-else>
                <span class="apv-muted">-</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 반려 사유 모달 -->
    <div
      v-if="isRejectOpen"
      class="apv-modal-backdrop"
      @click.self="cancelReject"
    >
      <div class="apv-modal">
        <h3 class="apv-modal-title">반려 사유 입력</h3>
        <p class="apv-modal-sub">
          승인코드: <b>{{ rejectTarget?.approval_code }}</b> &nbsp;/ 신청자:
          <b>{{ rejectTarget?.user_name }}</b>
        </p>

        <textarea
          v-model.trim="rejectReason"
          rows="4"
          class="apv-textarea"
          placeholder="반려 사유를 입력하세요."
        ></textarea>

        <div class="apv-modal-actions">
          <MaterialButton color="dark" size="sm" @click="cancelReject"
            >취소</MaterialButton
          >
          <MaterialButton color="dark" size="sm" @click="confirmReject">
            반려 확정
          </MaterialButton>
        </div>
      </div>
    </div>

    <!-- 페이징 -->
    <div class="apv-pagination">
      <MaterialButton
        color="dark"
        size="sm"
        :disabled="page <= 1 || loading"
        @click="goPage(page - 1)"
      >
        이전
      </MaterialButton>
      <span class="apv-page-text">{{ page }}</span>
      <MaterialButton
        color="dark"
        size="sm"
        :disabled="rows.length < size || loading"
        @click="goPage(page + 1)"
      >
        다음
      </MaterialButton>
    </div>

    <div v-if="error" class="apv-error" role="alert">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useAuthStore } from "@/store/authLogin.js";
import { useRouter } from "vue-router";
import MaterialButton from "@/components/MaterialButton.vue";

const API_BASE = "/api/approvals/staff";

const auth = useAuthStore();
const router = useRouter();

// 🔹 기관명 컬럼 표시 여부 (기관 관리자 AA3 이면 숨김)
const isOrgVisible = computed(() => auth.role !== "AA3");

/* 상태 */
const rows = ref([]);
const loading = ref(false);
const error = ref("");

/* 필터/페이지 */
const state = ref(""); // '', 'BA1', 'BA2', 'BA3'
const keyword = ref("");
const page = ref(1);
const size = ref(20);

/* 반려 모달 상태 */
const isRejectOpen = ref(false);
const rejectReason = ref("");
const rejectTarget = ref(null);

/* 헬퍼 */
function stateLabel(s) {
  switch (s) {
    case "BA1":
      return "요청";
    case "BA2":
      return "승인";
    case "BA3":
      return "반려";
    default:
      return s || "-";
  }
}

function fmtDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* 목록 불러오기 */
async function fetchList() {
  loading.value = true;
  error.value = "";

  try {
    if (!auth.userId) {
      error.value = "로그인 정보가 없습니다.";
      loading.value = false;
      return;
    }

    const res = await axios.get(API_BASE, {
      params: {
        state: state.value,
        keyword: keyword.value,
        page: page.value,
        size: size.value,
        loginId: auth.userId, // 🔹 로그인 아이디
        role: auth.role, // 🔹 역할 코드(AA3 / AA4)
      },
    });

    rows.value = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (e) {
    console.error(e);
    error.value = "목록을 불러오지 못했습니다.";
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

/* 페이지 이동 */
function goPage(p) {
  if (p < 1) return;
  page.value = p;
  fetchList();
}
function onFilterChange() {
  page.value = 1;
  fetchList();
}

/* 승인/반려 버튼 */
async function onApprove(row) {
  if (
    !confirm(
      `[${row.approval_code}] ${row.user_name} (기관 담당자) 승인 처리할까요?`
    )
  )
    return;
  try {
    await axios.put(
      `${API_BASE}/${encodeURIComponent(row.approval_code)}/approve`,
      {
        // 🔹 처리자 코드 추가
        processorCode: auth.userCode,
      }
    );
    alert("승인 처리되었습니다.");
    await fetchList();
  } catch (e) {
    console.error(e);
    alert("승인 처리 중 오류가 발생했습니다.");
  }
}

function onReject(row) {
  rejectTarget.value = row;
  rejectReason.value = "";
  isRejectOpen.value = true;
}

function cancelReject() {
  isRejectOpen.value = false;
  rejectTarget.value = null;
  rejectReason.value = "";
}

async function confirmReject() {
  if (!rejectTarget.value) return;
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력하세요.");
    return;
  }

  try {
    await axios.put(
      `${API_BASE}/${encodeURIComponent(
        rejectTarget.value.approval_code
      )}/reject`,
      {
        reason: rejectReason.value,
        // 🔹 처리자 코드 추가
        processorCode: auth.userCode,
      }
    );
    alert("반려 처리되었습니다.");
    isRejectOpen.value = false;
    rejectTarget.value = null;
    rejectReason.value = "";
    await fetchList();
  } catch (e) {
    console.error(e);
    alert("반려 처리 중 오류가 발생했습니다.");
  }
}

onMounted(async () => {
  // 로컬스토리지 → pinia 복구
  auth.reload();

  if (!auth.isLogin || !auth.userId) {
    alert("로그인 정보가 없습니다. 다시 로그인 해주세요.");
    router.push("/sign-in");
    return;
  }

  // 🔹 기관 관리자(AA3), 시스템 관리자(AA4)만 접근 가능
  if (auth.role !== "AA3" && auth.role !== "AA4") {
    alert("기관 관리자 및 시스템 관리자만 접근 가능한 메뉴입니다.");
    router.push("/");
    return;
  }

  // 여기까지 통과한 경우에만 목록 조회
  fetchList();
});
</script>

<style scoped>
* {
  font-size: 15px;
}

.apv-page {
  max-width: 1600px;
  margin: 24px auto;
  padding: 0 16px 40px;
}

.apv-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #111827;
}

/* 🔹 상단 툴바 (검색/필터 라인) */
.apv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.apv-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.apv-input,
.apv-select {
  min-width: 220px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 13px;
  outline: none;
  background: #fff;
}

.apv-input:focus,
.apv-select:focus {
  border-color: #7ea6f6;
  box-shadow: 0 0 0 1px rgba(126, 166, 246, 0.25);
}

/* 🔹 버튼 공통 */
.apv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #d2d6e0;
  background: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    transform 0.06s ease,
    box-shadow 0.12s ease;
  white-space: nowrap;
}

.apv-btn:hover {
  background: #f3f4ff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  transform: translateY(-0.5px);
}

.apv-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 작은 버튼 */
.apv-btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}

/* 버튼 변형 */
.apv-btn-primary {
  background: #7ea6f6;
  border-color: #7ea6f6;
  color: #fff;
}

.apv-btn-primary:hover {
  background: #678fe0;
}

.apv-btn-danger {
  background: #f76c6c;
  border-color: #f76c6c;
  color: #fff;
}

.apv-btn-danger:hover {
  background: #e25656;
}

.apv-btn-outline {
  background: #ffffff;
  border-color: #7ea6f6;
  color: #315fbf;
}

/* 🔹 테이블 카드 (후원/지원 결과 카드랑 톤 맞춤) */
.apv-table-wrap {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  padding: 12px 16px;
  overflow-x: auto;
}

/* 🔹 테이블 기본 스타일 (priority-table 느낌으로) */
.apv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.apv-table thead th {
  text-align: center;
  padding: 10px 8px;
  font-weight: 600;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  white-space: nowrap;
}

.apv-table tbody td {
  padding: 9px 8px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: middle;
  text-align: center;
}

/* 행 호버 효과 */
.apv-table tbody tr {
  transition:
    background-color 0.12s ease,
    transform 0.06s ease;
}

.apv-table tbody tr:hover {
  background: #f3f4ff;
  transform: translateY(-1px);
}

.apv-empty {
  text-align: center;
  padding: 14px 0;
  color: #9ca3af;
}

/* 🔹 상태 Pill (priority-badge 스타일 계열) */
.apv-state-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid transparent;
}

.apv-state-BA1 {
  background-color: #e4f0ff !important;
  color: #476c99 !important;
  border: 1px solid #a5c3da !important;
}

.apv-state-BA2 {
  background-color: #deeec8 !important;
  color: #3f7a3a !important;
  border: 1px solid #bedca0 !important;
}

.apv-state-BA3 {
  background-color: #fab39f !important;
  color: #8a2e2e !important;
  border: 1px solid #e28f7f !important;
}

/* 승인/반려 버튼 들어가는 칸 */
.apv-actions-cell {
  display: flex;
  justify-content: center;
  gap: 4px;
  align-items: center;
}

.apv-muted {
  color: #9ca3af;
  font-size: 12px;
}

/* 🔹 반려 사유 모달 */
.apv-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.apv-modal {
  width: min(460px, 92vw);
  background: #ffffff;
  border-radius: 12px;
  padding: 18px 18px 16px;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.35);
  border: 1px solid #e2e7f0;
}

.apv-modal-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111827;
}

.apv-modal-sub {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 10px;
}

.apv-textarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 8px 10px;
  font-size: 13px;
  resize: vertical;
  min-height: 90px;
}

.apv-textarea:focus {
  outline: none;
  border-color: #7ea6f6;
  box-shadow: 0 0 0 1px rgba(126, 166, 246, 0.25);
}

.apv-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* 🔹 페이징/에러 */
.apv-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: #4b5563;
}

.apv-page-text {
  font-size: 13px;
}

.apv-error {
  margin-top: 8px;
  color: #b91c1c;
  font-size: 12px;
}
</style>
