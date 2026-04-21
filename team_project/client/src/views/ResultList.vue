<!-- src/views/ResultList.vue -->
<template>
  <section class="p-6">
    <div class="page-shell">
      <!-- 상단 타이틀 -->
      <header class="header-row mb-4">
        <div class="header-title">
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight">
            지원결과 목록
          </h2>
        </div>

        <!-- 🔘 submitCode로 필터되어 있을 때만 전체 보기 버튼 -->
        <div v-if="filterSubmitCode" class="header-action">
          <MaterialButton
            color="dark"
            size="sm"
            variant="outlined"
            @click="clearSubmitFilter"
          >
            전체 결과 목록 보기
          </MaterialButton>
        </div>
      </header>

      <!-- 🔍 검색 / 필터 / 정렬 (일반 이용자 제외) -->
      <div v-if="selectedRole !== 1" class="filter-row">
        <form class="filter-form" @submit.prevent="onSearch">
          <!-- 검색 인풋 -->
          <div class="filter-field filter-field--search">
            <input
              v-model="searchText"
              type="text"
              class="search-input"
              :placeholder="searchPlaceholder"
              @keyup.enter="onSearch"
            />
          </div>

          <!-- 상태 셀렉트 -->
          <div class="filter-field filter-field--select select-wrapper">
            <select
              v-model="statusFilter"
              class="select-input"
              @change="onFilterChange"
            >
              <option value="ALL">전체 상태</option>
              <option value="ING">지원중</option>
              <option value="REVIEW">검토중</option>
              <option value="DONE">지원완료</option>
              <option value="RESUBMIT">재승인요청</option>
              <option value="REJECT">반려</option>
            </select>
          </div>

          <!-- 정렬 셀렉트 -->
          <div class="filter-field filter-field--select select-wrapper">
            <select
              v-model="sortOption"
              class="select-input"
              @change="onFilterChange"
            >
              <option value="RESULT_RECENT">결과 작성일 최신순</option>
              <option value="RESULT_OLD">결과 작성일 오래된순</option>
              <option value="PLAN_RECENT">계획 작성일 최신순</option>
              <option value="PLAN_OLD">계획 작성일 오래된순</option>
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
      <div v-if="loading" class="text-gray-500 text-sm">불러오는 중...</div>
      <div v-else-if="error" class="text-red-600 text-sm">
        {{ error }}
      </div>
      <div v-else-if="!plans.length" class="empty-state">
        등록된 지원결과가 없습니다.
      </div>
      <!-- ✅ 2) 데이터는 있는데, 필터/검색 결과가 0건인 경우 -->
      <div v-else-if="!filteredPlans.length" class="empty-state">
        등록된 지원결과가 없습니다.
      </div>

      <!-- 목록 -->
      <div v-else class="table-wrapper">
        <div class="table-card">
          <table class="nice-table">
            <thead>
              <tr>
                <th class="th-cell text-center w-14">No</th>
                <th class="th-cell">지원자 이름</th>
                <th class="th-cell">보호자 이름</th>
                <th class="th-cell">담당자 이름</th>
                <th v-if="selectedRole === 4" class="th-cell">기관명</th>
                <th class="th-cell">계획 작성일</th>
                <th class="th-cell">결과 작성일</th>
                <th class="th-cell">우선순위</th>
                <th class="th-cell text-center">상태</th>
                <th class="th-cell text-center w-28"></th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(row, idx) in paginatedPlans"
                :key="row.resultCode || row.planCode || idx"
                class="table-row-item"
                @click.stop="goDetail(row)"
              >
                <!-- No (페이징 반영) -->
                <td class="td-cell text-center">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </td>

                <!-- 지원자 이름 -->
                <td class="td-cell">
                  {{ row.childName || "본인" }}
                </td>

                <!-- 보호자 이름 -->
                <td class="td-cell">
                  {{ row.writerName || "-" }}
                </td>

                <!-- 담당자 이름 -->
                <td class="td-cell">
                  {{ row.assiName || "-" }}
                </td>

                <!-- 시스템(4)일 때만 기관명 -->
                <td v-if="selectedRole === 4" class="td-cell">
                  {{ row.orgName || "-" }}
                </td>

                <td class="td-cell">
                  {{ formatDate(row.writtenAt) }}
                </td>

                <td class="td-cell">
                  {{
                    ["CD1", "CD3"].includes(normStatus(row.status))
                      ? "-"
                      : formatDate(row.resultWrittenAt)
                  }}
                </td>

                <!-- 우선순위 -->
                <td class="td-cell">
                  {{ priorityLabel(row.level) }}
                </td>

                <!-- 상태 배지 -->
                <td class="td-cell text-center td-status">
                  <button
                    v-if="
                      normStatus(row.status) === 'CD7' && selectedRole !== 1
                    "
                    type="button"
                    class="status-pill status-pill--rejected status-pill--clickable p-red"
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

                <!-- 작업 버튼 -->
                <td class="td-cell">
                  <div class="flex items-center justify-center">
                    <!-- 담당자(2)만 버튼 -->
                    <template v-if="selectedRole === 2">
                      <MaterialButton
                        v-if="['CD1', 'CD3'].includes(normStatus(row.status))"
                        color="dark"
                        size="sm"
                        @click.stop="handleWrite(row)"
                      >
                        작성하기
                      </MaterialButton>

                      <MaterialButton
                        v-else-if="normStatus(row.status) === 'CD4'"
                        color="dark"
                        size="sm"
                        @click.stop="handleEdit(row)"
                      >
                        수정하기
                      </MaterialButton>

                      <MaterialButton
                        v-else-if="normStatus(row.status) === 'CD7'"
                        color="dark"
                        size="sm"
                        @click.stop="handleReEdit(row)"
                      >
                        재수정하기
                      </MaterialButton>

                      <span v-else class="text-gray-400 text-xs"></span>
                    </template>

                    <span v-else class="text-gray-400 text-xs"></span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
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
            <p class="text-sm text-gray-600">
              반려일자:
              <span class="font-medium">
                {{ formatDate(rejectReasonDate) }}
              </span>
            </p>

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
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useRouter, useRoute } from "vue-router";
import MaterialButton from "@/components/MaterialButton.vue";
import MaterialPagination from "@/components/MaterialPagination.vue";
import MaterialPaginationItem from "@/components/MaterialPaginationItem.vue";

const router = useRouter();
const route = useRoute();

/** 🔹 submitCode 쿼리로 받아와서 필터에 사용 */
const filterSubmitCode = ref(route.query.submitCode || null);

// 로그인/역할 정보
const currentUserId = ref(null);
const rawAuthCode = ref(""); // AA1~AA4
const selectedRole = ref(1); // 1~4 숫자 역할

function mapAuthToRole(code) {
  switch (code) {
    case "AA1":
      return 1; // 일반
    case "AA2":
      return 2; // 담당자
    case "AA3":
      return 3; // 관리자
    case "AA4":
      return 4; // 시스템
    default:
      return 1;
  }
}

// 목록 데이터 및 상태
const plans = ref([]);
const loading = ref(false);
const error = ref("");

// 날짜 포맷터
const formatDate = (v) => {
  if (!v) return "-";
  return String(v).slice(0, 10);
};

// 상태 코드 정규화
function normStatus(raw) {
  return (raw ?? "").toString().trim().toUpperCase();
}

// 결과 상태 코드 라벨
function statusLabel(code) {
  switch (normStatus(code)) {
    case "CD1":
    case "CD3":
      return "지원중";
    case "CD4":
      return "검토중";
    case "CD5":
      return "지원완료";
    case "CD6":
      return "재승인요청";
    case "CD7":
      return "반려";
    default:
      return code || "-";
  }
}

// 상태별 배지 스타일
function statusPillClass(code) {
  switch (normStatus(code)) {
    case "CD1":
    case "CD3":
      return "p-blue";
    case "CD4":
      return "p-yellow";
    case "CD5":
      return "p-green";
    case "CD6":
      return "p-orange";
    case "CD7":
      return "p-red";
    default:
      return "p-gray";
  }
}

// 🔍 검색 / 상태 / 정렬 상태
const searchText = ref("");
const appliedSearchText = ref("");
const statusFilter = ref("ALL");
const sortOption = ref("RESULT_RECENT");

const searchPlaceholder = computed(() => {
  if (selectedRole.value === 4) {
    return "지원자, 보호자, 담당자, 기관명 검색";
  }
  return "지원자, 보호자, 담당자 검색";
});

// 🔍 검색/필터/정렬 적용 리스트
const filteredPlans = computed(() => {
  let rows = [...plans.value];

  if (selectedRole.value === 1) {
    rows = rows.filter((row) => {
      const s = normStatus(row.status);
      return s !== "CD1" && s !== "CD3";
    });
  }

  // 🔹 submitCode로 필터 (다른 화면에서 링크 타고 들어온 경우)
  if (filterSubmitCode.value) {
    rows = rows.filter(
      (row) => String(row.submitCode) === String(filterSubmitCode.value)
    );
  }

  // 1) 검색
  const q = appliedSearchText.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((row) => {
      const baseTargets = [row.childName, row.writerName, row.assiName];
      const extraTargets = selectedRole.value === 4 ? [row.orgName] : [];
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
    rows = rows.filter((row) => {
      const s = normStatus(row.status);
      switch (statusFilter.value) {
        case "ING": // 지원중: CD1, CD3
          return s === "CD1" || s === "CD3";
        case "REVIEW": // 검토중
          return s === "CD4";
        case "DONE": // 지원완료
          return s === "CD5";
        case "RESUBMIT": // 재승인요청
          return s === "CD6";
        case "REJECT": // 반려
          return s === "CD7";
        default:
          return true;
      }
    });
  }

  // 3) 정렬
  if (sortOption.value === "RESULT_RECENT") {
    rows.sort((a, b) => {
      const aDate = a.resultWrittenAt ?? "";
      const bDate = b.resultWrittenAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }
      const aPlan = a.writtenAt ?? "";
      const bPlan = b.writtenAt ?? "";
      if (aPlan && bPlan && aPlan !== bPlan) {
        return bPlan.localeCompare(aPlan);
      }
      return Number(b.resultCode || 0) - Number(a.resultCode || 0);
    });
  } else if (sortOption.value === "RESULT_OLD") {
    rows.sort((a, b) => {
      const aDate = a.resultWrittenAt ?? "";
      const bDate = b.resultWrittenAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }
      const aPlan = a.writtenAt ?? "";
      const bPlan = b.writtenAt ?? "";
      if (aPlan && bPlan && aPlan !== bPlan) {
        return aPlan.localeCompare(bPlan);
      }
      return Number(a.resultCode || 0) - Number(b.resultCode || 0);
    });
  } else if (sortOption.value === "PLAN_RECENT") {
    rows.sort((a, b) => {
      const aDate = a.writtenAt ?? "";
      const bDate = b.writtenAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }
      return Number(b.resultCode || 0) - Number(a.resultCode || 0);
    });
  } else if (sortOption.value === "PLAN_OLD") {
    rows.sort((a, b) => {
      const aDate = a.writtenAt ?? "";
      const bDate = b.writtenAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }
      return Number(a.resultCode || 0) - Number(b.resultCode || 0);
    });
  } else if (sortOption.value === "NAME") {
    rows.sort((a, b) => {
      const an = a.childName || "본인";
      const bn = b.childName || "본인";
      return an.localeCompare(bn, "ko");
    });
  }

  return rows;
});

// 페이징
const currentPage = ref(1);
const pageSize = 10;

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredPlans.value.length / pageSize) || 1)
);

const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredPlans.value.slice(start, start + pageSize);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

// 검색 버튼 / 엔터
function onSearch() {
  appliedSearchText.value = searchText.value;
  currentPage.value = 1;
}

// 상태/정렬 변경
function onFilterChange() {
  currentPage.value = 1;
}

// ✅ submitCode 필터 해제 (일반 이용자용)
function clearSubmitFilter() {
  filterSubmitCode.value = null;
  currentPage.value = 1;

  const newQuery = { ...route.query };
  delete newQuery.submitCode;

  router.replace({
    name: route.name,
    query: newQuery,
  });
}

// 목록 조회
const loadList = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get("/api/result", {
      params: {
        role: selectedRole.value,
        userId: currentUserId.value,
      },
    });

    plans.value = res.data?.result || [];
    currentPage.value = 1;
  } catch (e) {
    console.error(e);
    error.value = e.message || "지원결과 목록 조회 중 오류";
    plans.value = [];
  } finally {
    loading.value = false;
  }
};

function priorityLabel(code) {
  const c = (code || "").toUpperCase();
  switch (c) {
    case "BB1":
      return "긴급";
    case "BB2":
      return "중점";
    case "BB3":
      return "계획";
    default:
      return "-";
  }
}

// 첫 로딩
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

  loadList();
});

// 작성하기: result-write
const handleWrite = (row) => {
  router.push({
    name: "result-write",
    params: { submitcode: row.submitCode },
    query: {
      planCode: row.planCode,
      submitCode: row.submitCode,
      role: selectedRole.value,
    },
  });
};

// 수정하기: result-edit
const handleEdit = (row) => {
  router.push({
    name: "result-edit",
    params: { resultCode: row.resultCode },
    query: { planCode: row.planCode, submitCode: row.submitCode },
  });
};

// 재수정하기: result-edit
const handleReEdit = (row) => {
  router.push({
    name: "result-edit",
    params: { resultCode: row.resultCode },
    query: { planCode: row.planCode, submitCode: row.submitCode },
  });
};

// 상세: resultDetail
function goDetail(row) {
  router.push({
    name: "resultDetail",
    params: { resultCode: row.resultCode },
    query: {
      submitCode: row.submitCode,
      planCode: row.planCode,
      role: selectedRole.value,
    },
  });
}

// 반려 사유 모달 상태
const rejectReasonModalOpen = ref(false);
const rejectReasonText = ref("");
const rejectReasonDate = ref("");
const rejectReasonLoading = ref(false);
const rejectReasonError = ref("");

// 반려 사유 모달 열기 + 서버 조회
async function openRejectReason(row) {
  rejectReasonModalOpen.value = true;
  rejectReasonText.value = "";
  rejectReasonDate.value = "";
  rejectReasonError.value = "";
  rejectReasonLoading.value = true;

  try {
    const { data } = await axios.get(
      `/api/result/${row.resultCode}/rejection-reason`
    );

    if (data?.success === false) {
      throw new Error(data.message || "반려 사유를 불러오지 못했습니다.");
    }

    rejectReasonText.value =
      data?.result?.rejection_reason ?? data?.rejection_reason ?? "";

    // 반려일자 필드
    rejectReasonDate.value =
      data?.result?.approval_date ?? data?.approval_date ?? "";
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
</script>

<style scoped>
section {
  color: #111827;
  font-size: 15px; /* 기본 폰트 크기 */
}

/* 페이지 폭 통일 */
.page-shell {
  max-width: 1600px; /* ✅ 1600px로 확장 */
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

.header-title {
  flex: 1 1 auto;
  min-width: 0;
}

.header-action {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  white-space: nowrap;
}

/* 🔍 필터 라인 */
.filter-row {
  margin-bottom: 0.75rem;
  margin-top: 0.25rem;
  width: 100%;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: stretch;
  width: 100%;
}

.filter-field {
  display: flex;
}

.filter-field--search {
  flex: 1 1 260px;
  min-width: 0;
}

.filter-field--select {
  flex: 0 0 auto;
}

.filter-field--button {
  flex: 0 0 auto;
}

/* 검색 인풋 */
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
  min-width: 150px;
}

/* 셀렉트 인풋 */
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

/* 목록 래퍼 */
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
}

/* 헤더 셀 */
.th-cell {
  padding: 0.75rem 0.9rem;
  text-align: center; /* ✅ 중앙 정렬 */
  font-size: 15px; /* ✅ 15px */
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
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
  font-size: 15px; /* ✅ 15px */
  text-align: center; /* ✅ 기본 중앙 정렬 */
}

/* 행 스타일 */
.table-row-item {
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
  cursor: pointer;
}

.table-row-item:nth-child(odd) {
  background-color: #ffffff;
}
.table-row-item:nth-child(even) {
  background-color: #f9fafb;
}

.table-row-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

/* 클릭 가능한 배지 (반려) */
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 페이지네이션 */
.pagination {
  display: inline-flex;
}

/* 상태 칸 오버플로우 처리 */
.td-status {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

/* ✅ 테이블 전체 공통 폰트/정렬 */
table th,
table td {
  font-size: 15px;
  font-family:
    "Noto Sans KR",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  text-align: center;
}
</style>
