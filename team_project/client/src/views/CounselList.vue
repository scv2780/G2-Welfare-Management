<template>
  <section class="p-6">
    <div class="page-shell">
      <!-- 헤더 -->
      <header class="mb-2 header-row">
        <div class="header-title">
          <h2
            class="text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap align-middle"
          >
            상담 목록
          </h2>
        </div>
      </header>

      <!-- 🔍 검색 / 필터 / 정렬 라인 -->
      <div class="filter-row">
        <form class="filter-form" @submit.prevent="onSearch">
          <!-- 검색 인풋 -->
          <div class="filter-field filter-field--search">
            <input
              v-model="searchText"
              type="text"
              class="search-input"
              :placeholder="searchPlaceholder"
            />
          </div>

          <!-- 상태 셀렉트 -->
          <div class="filter-field filter-field--select select-wrapper">
            <select v-model="statusFilter" class="select-input">
              <option value="ALL">전체 상태</option>
              <option value="TEMP">상담전</option>
              <option value="CB3">검토전</option>
              <option value="CB4">반려</option>
              <option value="CB5">검토완료</option>
              <option value="CB6">재승인요청</option>
            </select>
          </div>

          <!-- 정렬 셀렉트 -->
          <div class="filter-field filter-field--select select-wrapper">
            <select v-model="sortOption" class="select-input">
              <option value="COUNSEL_RECENT">상담일 최신순</option>
              <option value="COUNSEL_OLD">상담일 오래된순</option>
              <option value="SUBMIT_RECENT">제출일 최신순</option>
              <option value="SUBMIT_OLD">제출일 오래된순</option>
              <option value="NAME">이름순</option>
            </select>
          </div>

          <!-- 검색 버튼 -->
          <div class="filter-field filter-field--button">
            <MaterialButton type="submit" color="dark" size="sm">
              검색
            </MaterialButton>
          </div>
        </form>
      </div>

      <!-- 상태 표시 -->
      <div v-if="loading" class="text-gray-500">불러오는 중...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else-if="list.length === 0" class="empty-state">
        상담 내역이 없습니다.
      </div>

      <!-- 상담 목록 카드 + 테이블 -->
      <div v-else class="table-wrapper">
        <div class="table-card">
          <table class="nice-table">
            <thead>
              <tr>
                <th class="th-cell text-center w-14">No</th>

                <!-- 지원자 이름 -->
                <th class="th-cell">지원자 이름</th>

                <!-- 보호자 이름 -->
                <th class="th-cell">보호자 이름</th>

                <!-- 담당자 -->
                <th class="th-cell">담당자</th>

                <!-- 시스템만 기관명 -->
                <th v-if="selectedRole === 4" class="th-cell">기관명</th>

                <th class="th-cell">조사지 제출일</th>
                <th class="th-cell">상담 작성일</th>
                <th class="th-cell">상태</th>
                <th class="th-cell text-center w-24" v-if="isAssigneeRole"></th>
                <th class="th-cell text-center w-24" v-else></th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(row, idx) in paginatedList"
                :key="row.submit_code"
                class="table-row-item"
                @click="goDetail(row)"
              >
                <td class="td-cell text-center">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </td>

                <!-- 지원자 이름: child_name 있으면 자녀 이름 / 없으면 본인 -->
                <td class="td-cell">
                  {{ row.child_name ? row.child_name : "본인" }}
                </td>

                <!-- 보호자이름 -->
                <td class="td-cell">
                  {{ row.writer_name }}
                </td>

                <!-- 담당자 -->
                <td class="td-cell">
                  {{ row.assi_name }}
                </td>

                <!-- 시스템만 기관이름 -->
                <td v-if="selectedRole === 4" class="td-cell">
                  {{ row.org_name || "-" }}
                </td>

                <td class="td-cell">{{ formatDate(row.submit_at) }}</td>

                <td class="td-cell">
                  {{
                    isTempStatus(row.status)
                      ? "-"
                      : formatDate(row.note_created_at)
                  }}
                </td>

                <!-- 상태 -->
                <td class="td-cell td-status">
                  <button
                    v-if="normStatus(row.status) === 'CB4'"
                    type="button"
                    class="status-pill status-pill--rejected status-pill--clickable"
                    @click.stop="openRejectReason(row)"
                  >
                    {{ statusLabel(row.status) }}
                  </button>

                  <span
                    v-else
                    class="status-pill"
                    :class="statusPillClass(row.status)"
                  >
                    {{ statusLabel(row.status) }}
                  </span>
                </td>

                <!-- 액션 버튼 -->
                <td class="td-cell text-center">
                  <template v-if="isAssigneeRole">
                    <MaterialButton
                      v-if="['CB1', 'CB2'].includes(normStatus(row.status))"
                      color="dark"
                      size="sm"
                      @click.stop="goWrite(row)"
                    >
                      작성하기
                    </MaterialButton>

                    <MaterialButton
                      v-else-if="normStatus(row.status) === 'CB3'"
                      color="dark"
                      size="sm"
                      @click.stop="goEdit(row)"
                    >
                      수정하기
                    </MaterialButton>

                    <MaterialButton
                      v-else-if="normStatus(row.status) === 'CB4'"
                      color="dark"
                      size="sm"
                      @click.stop="goEdit(row)"
                    >
                      재수정하기
                    </MaterialButton>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 🔹 페이지네이션 -->
        <div v-if="totalPages > 1" class="mt-6 text-center">
          <MaterialPagination color="dark" size="md" class="pagination">
            <MaterialPaginationItem
              prev
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            />
            <MaterialPaginationItem
              v-for="page in totalPages"
              :key="page"
              :label="String(page)"
              :active="page === currentPage"
              @click="changePage(page)"
            />
            <MaterialPaginationItem
              next
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            />
          </MaterialPagination>
        </div>
      </div>

      <!-- 🔻 반려 사유 모달 -->
      <div v-if="rejectReasonModalOpen" class="modal-overlay">
        <div class="modal-container">
          <h3 class="text-lg font-semibold mb-3">반려 사유</h3>

          <div v-if="rejectReasonLoading" class="text-sm text-gray-500">
            불러오는 중...
          </div>

          <div v-else-if="rejectReasonError" class="text-sm text-red-600">
            {{ rejectReasonError }}
          </div>

          <div v-else class="space-y-2">
            <!-- 반려일자 -->
            <div v-if="rejectReasonDate" class="text-xs text-gray-600">
              반려일자:
              <span class="font-medium">
                {{ String(rejectReasonDate).slice(0, 10) }}
              </span>
            </div>

            <!-- 반려사유 -->
            <div
              class="text-sm whitespace-pre-line text-gray-800 max-h-60 overflow-y-auto border rounded px-3 py-2 bg-gray-50"
            >
              {{ rejectReasonText || "등록된 반려 사유가 없습니다." }}
            </div>
          </div>

          <div class="modal-actions mt-4 flex justify-end gap-2">
            <MaterialButton
              color="dark"
              size="sm"
              @click="closeRejectReasonModal"
            >
              닫기
            </MaterialButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";
import MaterialPagination from "@/components/MaterialPagination.vue";
import MaterialPaginationItem from "@/components/MaterialPaginationItem.vue";

const router = useRouter();

// 🔹 로그인된 사용자 정보 (localStorage에서 읽음)
const currentUserId = ref(null);
const rawAuthCode = ref(""); // AA1~AA4
const selectedRole = ref(2); // 1~4 매핑된 숫자 역할

const list = ref([]);
const loading = ref(false);
const error = ref(null);

// 🔍 검색 / 필터 / 정렬 상태
const searchText = ref(""); // 인풋에 묶여있는 값
const appliedSearch = ref(""); // 실제 필터에 쓰는 값(검색 버튼 눌렀을 때만 갱신)
const statusFilter = ref("ALL"); // ALL | CB1~CB6
const sortOption = ref("COUNSEL_RECENT");

// placeholder (시스템이면 기관명 포함)
const searchPlaceholder = computed(() => {
  if (selectedRole.value === 4) {
    return "지원자, 보호자, 담당자, 기관명 검색";
  }
  return "지원자, 보호자, 담당자 검색";
});

// 🔹 페이징 상태
const currentPage = ref(1);
const pageSize = 10;

// 🔻 반려 사유 모달 상태
const rejectReasonModalOpen = ref(false);
const rejectReasonText = ref("");
const rejectReasonLoading = ref(false);
const rejectReasonError = ref("");
const rejectReasonDate = ref("");

// 역할 코드 → 숫자 역할 매핑
function mapAuthToRole(code) {
  switch (code) {
    case "AA1":
      return 1;
    case "AA2":
      return 2;
    case "AA3":
      return 3;
    case "AA4":
      return 4;
    default:
      return 1;
  }
}

// 🔹 담당자 역할 여부 (2이면 true)
const isAssigneeRole = computed(() => Number(selectedRole.value) === 2);

// 🔹 status 정규화
function normStatus(raw) {
  return (raw ?? "").toString().trim().toUpperCase();
}

// 임시 상태: CB1, CB2 둘 다 "상담 전"으로 처리
function isTempStatus(code) {
  const s = normStatus(code);
  return s === "CB1" || s === "CB2";
}

function formatDate(val) {
  return val?.slice?.(0, 10) || "-";
}

function statusLabel(code) {
  switch (normStatus(code)) {
    case "CB1":
      return "상담전";
    case "CB2":
      return "상담전";
    case "CB3":
      return "검토전";
    case "CB4":
      return "반려";
    case "CB5":
      return "검토완료";
    case "CB6":
      return "재승인요청";
    default:
      return code || "-";
  }
}

// 🔹 배지 색상 클래스
function statusPillClass(code) {
  switch (normStatus(code)) {
    case "CB1":
    case "CB2":
      return "status-pill--before";
    case "CB3":
      return "status-pill--review";
    case "CB5":
      return "status-pill--done";
    case "CB6":
      return "status-pill--resubmit";
    default:
      return "status-pill--default";
  }
}

// 🔍 검색/필터/정렬이 모두 적용된 리스트
const filteredList = computed(() => {
  let rows = [...list.value];

  // 1) 검색 (지원자 / 보호자 / 담당자 / [시스템이면 기관명])
  const q = appliedSearch.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((row) => {
      const baseTargets = [
        row.child_name, // 지원자
        row.writer_name, // 보호자
        row.assi_name, // 담당자
      ];
      const extraTargets =
        selectedRole.value === 4
          ? [row.org_name] // 시스템 권한일 때 기관명
          : [];

      const targets = [...baseTargets, ...extraTargets];

      return targets.some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }

  // 2) 상태 필터
  if (statusFilter.value !== "ALL") {
    if (statusFilter.value === "TEMP") {
      // 상담전(CB1, CB2) 모두 포함
      rows = rows.filter((row) => isTempStatus(row.status));
    } else {
      rows = rows.filter(
        (row) => normStatus(row.status) === statusFilter.value
      );
    }
  }
  // 3) 정렬
  if (sortOption.value === "COUNSEL_RECENT") {
    // 상담일 최신순 (note_created_at DESC)
    rows.sort((a, b) => {
      const aDate = a.note_created_at ?? "";
      const bDate = b.note_created_at ?? "";

      if (aDate && bDate && aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      // 상담일이 없거나 같으면 제출일 기준 보조 정렬
      return (b.submit_at || "").localeCompare(a.submit_at || "");
    });
  } else if (sortOption.value === "COUNSEL_OLD") {
    // 상담일 오래된순 (note_created_at ASC)
    rows.sort((a, b) => {
      const aDate = a.note_created_at ?? "";
      const bDate = b.note_created_at ?? "";

      if (aDate && bDate && aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }

      return (a.submit_at || "").localeCompare(b.submit_at || "");
    });
  } else if (sortOption.value === "SUBMIT_RECENT") {
    // 제출일 최신순 (submit_at DESC)
    rows.sort((a, b) => {
      return (b.submit_at || "").localeCompare(a.submit_at || "");
    });
  } else if (sortOption.value === "SUBMIT_OLD") {
    // 제출일 오래된순 (submit_at ASC)
    rows.sort((a, b) => {
      return (a.submit_at || "").localeCompare(b.submit_at || "");
    });
  } else if (sortOption.value === "NAME") {
    // 이름순: child_name 기준, 없으면 "본인"
    rows.sort((a, b) => {
      const an = a.child_name || "본인";
      const bn = b.child_name || "본인";
      return an.localeCompare(bn, "ko");
    });
  }
  return rows;
});

// 🔹 페이지 수 & 페이징된 리스트
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredList.value.length / pageSize) || 1)
);

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredList.value.slice(start, start + pageSize);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

// 🔍 검색 버튼 / 엔터 눌렀을 때
function onSearch() {
  appliedSearch.value = searchText.value;
  currentPage.value = 1;
}

// 🔹 상담 목록 조회
async function fetchList() {
  loading.value = true;
  error.value = null;

  try {
    const params = {
      role: selectedRole.value,
      userId: currentUserId.value,
    };

    const { data } = await axios.get("/api/counsel", { params });
    list.value = Array.isArray(data?.result) ? data.result : [];
    currentPage.value = 1; // 목록 다시 불러올 때 첫 페이지로
  } catch (e) {
    console.error(e);
    error.value = e.message || "상담 목록 조회 중 오류";
    list.value = [];
  } finally {
    loading.value = false;
  }
}

// 🔹 반려 사유 모달 열기
async function openRejectReason(row) {
  rejectReasonModalOpen.value = true;
  rejectReasonText.value = "";
  rejectReasonDate.value = "";
  rejectReasonError.value = "";
  rejectReasonLoading.value = true;

  try {
    const submitCode = Number(row.submit_code);
    if (!submitCode) {
      throw new Error("유효한 제출번호가 없습니다. (submit_code 없음)");
    }

    const { data } = await axios.get(
      `/api/counsel/${submitCode}/rejection-reason`
    );

    if (data?.success === false) {
      throw new Error(data.message || "반려 사유를 불러오지 못했습니다.");
    }

    const r = data.result || data;

    rejectReasonText.value = r.rejection_reason ?? data.rejection_reason ?? "";
    rejectReasonDate.value = r.rejection_date ?? data.rejection_date ?? "";
  } catch (e) {
    console.error(e);
    rejectReasonError.value =
      e.response?.data?.message || e.message || "반려 사유 조회 중 오류";
  } finally {
    rejectReasonLoading.value = false;
  }
}

function closeRejectReasonModal() {
  rejectReasonModalOpen.value = false;
}

// 라우팅
function goWrite(row) {
  router.push({
    name: "counsel-new",
    params: { submitCode: row.submit_code },
  });
}

function goEdit(row) {
  router.push({
    name: "counsel-edit",
    params: { submitCode: row.submit_code },
  });
}

function goDetail(row) {
  router.push({
    name: "counsel-detail",
    params: { submitCode: row.submit_code },
    query: { role: selectedRole.value },
  });
}

// 🔹 마운트 시 localStorage에서 사용자/역할 정보 읽기
onMounted(() => {
  try {
    const stored = localStorage.getItem("user");

    if (stored) {
      const u = JSON.parse(stored);

      const userCode = u.user_code ?? null;
      const auth = u.role ?? "AA1";

      currentUserId.value = userCode ? Number(userCode) : null;
      rawAuthCode.value = String(auth).toUpperCase();
      selectedRole.value = mapAuthToRole(rawAuthCode.value);
    } else {
      // 로그인 정보가 없을 때 기본 (일반 사용자)
      currentUserId.value = null;
      rawAuthCode.value = "AA1";
      selectedRole.value = mapAuthToRole("AA1");
    }
  } catch (e) {
    console.error("localStorage user 파싱 오류:", e);
    currentUserId.value = null;
    rawAuthCode.value = "AA1";
    selectedRole.value = mapAuthToRole("AA1");
  }

  fetchList();
});
</script>

<style scoped>
section {
  color: #111827;
  font-size: 15px; /* 전체 기본 폰트 크기 */
}

/* 페이지 전체 폭 컨테이너: 헤더 + 카드 폭 통일 */
.page-shell {
  max-width: 1600px;
  margin: 0 auto;
}

/* 헤더 한 줄 유지 */
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 1rem;
}

/* 왼쪽 제목 */
.header-title {
  flex: 1 1 auto;
  min-width: 0;
}

/* 오른쪽 역할 표시 영역 */
.header-action {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  white-space: nowrap;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 13px;
  background-color: #f3f4f6;
  color: #4b5563;
}

.role-warning {
  font-size: 12px;
  color: #b91c1c;
}

/* 🔍 필터 라인 */
.filter-row {
  margin-bottom: 0.75rem;
  margin-top: 0.25rem;
  width: 100%;
}

.filter-form {
  display: flex;
  flex-wrap: wrap; /* 화면 좁으면 자동 줄바꿈 */
  gap: 0.5rem;
  align-items: stretch;
  width: 100%;
}

/* 공통 필드 래퍼 */
.filter-field {
  display: flex;
}

/* 검색 인풋은 가능한 한 넓게 차지 */
.filter-field--search {
  flex: 1 1 260px; /* 남는 공간 다 먹고, 최소 260px */
  min-width: 0;
}

/* 셀렉트들은 내용 크기만큼 */
.filter-field--select {
  flex: 0 0 auto;
}

/* 버튼도 내용 크기만큼 */
.filter-field--button {
  flex: 0 0 auto;
}

/* 검색 인풋 (pill 스타일) */
.search-input {
  width: 100%;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.45rem 0.9rem;
  font-size: 15px;
  background-color: #ffffff;
  outline: none;
}

.search-input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.16);
}

/* 셀렉트 wrapper */
.select-wrapper {
  position: relative;
  display: inline-block;
  min-width: 120px;
}

/* 셀렉트 인풋 (pill) */
.select-input {
  width: 100%;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 0.45rem 1.1rem 0.45rem 0.8rem;
  font-size: 15px;
  background-color: #ffffff;
  outline: none;
  color: #374151;
}

.select-input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.16);
}

/* 비었을 때 */
.empty-state {
  margin-top: 1.5rem;
  text-align: center;
  padding: 2.5rem 1rem;
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
  background-color: #f9fafb;
  font-size: 15px;
  color: #6b7280;
}

/* 상담 목록 래퍼 */
.table-wrapper {
  margin-top: 0.5rem;
}

/* 카드 컨테이너 */
.table-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  width: 100%;
}

/* 테이블 */
.nice-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: center; /* ★ 전체 중앙 정렬 */
}

/* 헤더 셀 */
.th-cell {
  padding: 0.75rem 0.9rem;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
  text-align: center; /* ★ 중앙 정렬 */
}

@media (max-width: 900px) {
  .th-cell {
    white-space: normal; /* 줄바꿈 허용 */
    font-size: 13px;
    line-height: 1.3;
    padding: 0.4rem 0.5rem;
  }
}

/* 바디 셀 */
.td-cell {
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  text-align: center; /* ★ 중앙 정렬 */
}

.td-cell.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 15px;
  color: #4b5563;
  text-align: center; /* ★ 중앙 정렬 */
}

/* 행 스타일 */
.table-row-item {
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
  cursor: pointer;
}

/* 줄무늬 */
.table-row-item:nth-child(odd) {
  background-color: #ffffff;
}
.table-row-item:nth-child(even) {
  background-color: #f9fafb;
}

/* 호버 효과 */
.table-row-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

/* 상태 배지 공통 */
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.32rem 0.75rem;
  border-radius: 999px;
  font-size: 13px; /* 살짝 작게 */
  font-weight: 500;
  border: 1px solid transparent;
  min-width: auto; /* 길이 강제하지 않음 */
  line-height: 1.1; /* 더 콤팩트하게 */
  height: auto;
}
/* 상담전 (CB1, CB2) - 회색 */
.status-pill--before {
  background-color: #f2f3f5; /* p-bg-gray */
  color: #646b78; /* p-text-gray */
  border-color: #d6d9df; /* p-border-gray */
}

/* 검토전 (CB3) - 노랑 */
.status-pill--review {
  background-color: #fff7d1; /* p-bg-yellow */
  color: #a07c18; /* p-text-yellow */
  border-color: #f3db85; /* p-border-yellow */
}

/* 반려 (CB4) - 빨강 + 클릭 가능 */
.status-pill--rejected {
  background-color: #fab39f; /* p-bg-red */
  color: #8a2e2e; /* p-text-red */
  border-color: #e28f7f; /* p-border-red */
}

.status-pill--clickable {
  cursor: pointer;
  transition:
    transform 0.1s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.status-pill--clickable:hover {
  transform: translateY(-0.5px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.16);
}

/* 검토완료 (CB5) - 초록 */
.status-pill--done {
  background-color: #deeec8 !important;
  border: 1px solid #bedca0 !important;
  color: #3f7a3a !important;
}

/* 재승인요청 (CB6) - 주황 */
.status-pill--resubmit {
  background-color: #fce8a1; /* p-bg-orange */
  color: #b0681b; /* p-text-orange */
  border-color: #f3d488; /* p-border-orange */
}

/* 기타 기본값 - 연한 회색 */
.status-pill--default {
  background-color: #e4e6e1 !important;
  border: 1px solid #d0d3cd !important;
  color: #4b5563 !important;
}
/* 공통 폰트 정리 */
table th,
table td {
  font-family:
    "Noto Sans KR",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 15px !important;
  text-align: center !important; /* ★ 무조건 중앙 */
}

/* 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-container {
  background: #ffffff;
  border-radius: 0.9rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.4);
}

/* 페이지네이션 */
.pagination {
  display: inline-flex;
}

.td-status {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}
</style>
