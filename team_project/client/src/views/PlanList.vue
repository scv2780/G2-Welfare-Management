<template>
  <section class="p-6">
    <div class="page-shell">
      <!-- 상단 타이틀 + 역할 표시 -->
      <header class="header-row mb-2">
        <div class="header-title" v-if="selectedRole === 2">
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight">
            지원자 목록
          </h2>
        </div>

        <!-- 🔘 일반 이용자 + submitCode로 필터된 상태에서만 노출 -->
        <div
          v-if="selectedRole === 1 && filterSubmitCode"
          class="header-action"
        >
          <MaterialButton
            color="dark"
            size="sm"
            variant="outlined"
            @click="clearSubmitFilter"
          >
            전체 계획 목록 보기
          </MaterialButton>
        </div>
      </header>

      <!-- 🔼 담당자 전용 테이블 (다른 목록) -->
      <div v-if="isAssigneeRole" class="section-block section-block--assignee">
        <!-- 담당자용 필터 -->
        <div class="filter-row">
          <form class="filter-form" @submit.prevent="onSearchAssignee">
            <!-- 검색 인풋 -->
            <div class="filter-field filter-field--search">
              <input
                v-model="assigneeSearchText"
                type="text"
                class="search-input"
                placeholder="지원자, 보호자 검색"
                @keyup.enter="onSearchAssignee"
              />
            </div>

            <!-- 정렬 셀렉트 -->
            <div class="filter-field filter-field--select select-wrapper">
              <select
                v-model="assigneeSortOption"
                class="select-input"
                @change="onFilterChangeAssignee"
              >
                <option value="SUBMIT_RECENT">조사지 제출일 최신순</option>
                <option value="SUBMIT_OLD">조사지 제출일 오래된순</option>
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

        <!-- 상태 표시 (담당자용 목록) -->
        <div v-if="assigneeLoading" class="text-gray-500 text-sm">
          불러오는 중...
        </div>
        <div v-else-if="assigneeError" class="text-red-600 text-sm">
          {{ assigneeError }}
        </div>
        <div v-else-if="!assigneePlans.length" class="empty-state">
          우선순위가 승인된 지원자가 없습니다.
        </div>

        <!-- 담당자용 목록 -->
        <div v-else class="table-wrapper">
          <div class="table-card">
            <table class="nice-table">
              <thead>
                <tr>
                  <th class="th-cell text-center w-14">No</th>
                  <th class="th-cell">지원자 이름</th>
                  <th class="th-cell">보호자 이름</th>
                  <th class="th-cell">우선순위</th>
                  <th class="th-cell">조사지 제출일</th>
                  <th class="th-cell text-center w-28"></th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, idx) in assigneePaginatedPlans"
                  :key="row.planCode || row.submitCode || idx"
                  class="table-row-item"
                  @click="goCounselDetail(row)"
                >
                  <!-- No 컬럼 (페이징 반영) -->
                  <td class="td-cell text-center">
                    {{ (assigneeCurrentPage - 1) * assigneePageSize + idx + 1 }}
                  </td>

                  <!-- 지원자 이름 -->
                  <td class="td-cell">
                    {{ row.childName ? row.childName : "본인" }}
                  </td>

                  <!-- 보호자 이름 -->
                  <td class="td-cell">
                    {{ row.writerName || "-" }}
                  </td>

                  <!-- 우선순위 -->
                  <td class="td-cell">
                    {{ priorityLabel(row.level) }}
                  </td>

                  <!-- 조사지 제출일 -->
                  <td class="td-cell">
                    {{ formatDate(row.submitAt) }}
                  </td>

                  <!-- 작업 -->
                  <td class="td-cell">
                    <div class="flex items-center justify-center">
                      <MaterialButton
                        color="dark"
                        size="sm"
                        @click.stop="handleWrite(row)"
                      >
                        작성하기
                      </MaterialButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 페이지네이션 (담당자용) -->
          <div v-if="assigneeTotalPages > 1" class="mt-6 text-center">
            <MaterialPagination color="dark" size="md" class="pagination">
              <MaterialPaginationItem
                prev
                :disabled="assigneeCurrentPage === 1"
                @click="changeAssigneePage(assigneeCurrentPage - 1)"
              />
              <MaterialPaginationItem
                v-for="page in assigneeTotalPages"
                :key="page"
                :label="String(page)"
                :active="page === assigneeCurrentPage"
                @click="changeAssigneePage(page)"
              />
              <MaterialPaginationItem
                next
                :disabled="assigneeCurrentPage === assigneeTotalPages"
                @click="changeAssigneePage(assigneeCurrentPage + 1)"
              />
            </MaterialPagination>
          </div>
        </div>
      </div>

      <div class="header-title mb-2">
        <h2 class="text-2xl md:text-3xl font-bold tracking-tight">
          지원계획 목록
        </h2>
      </div>
      <!-- 🔽 기존 지원계획 목록 (모든 역할용, 일반이 아닌 경우에만 필터) -->
      <div class="section-block section-block--plans">
        <!-- 🔍 검색 / 필터 / 정렬 (일반 이용자 제외) -->
        <div v-if="selectedRole !== 1" class="filter-row mt-3">
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
                <option value="REVIEW">검토중</option>
                <option value="PROGRESS">진행중</option>
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
                <option value="WRITTEN_RECENT">계획 작성일 최신순</option>
                <option value="WRITTEN_OLD">계획 작성일 오래된순</option>
                <option value="SUBMIT_RECENT">조사지 제출일 최신순</option>
                <option value="SUBMIT_OLD">조사지 제출일 오래된순</option>
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

        <!-- 상태 표시 (기존 지원계획 목록) -->
        <div v-if="loading" class="text-gray-500 text-sm">불러오는 중...</div>
        <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
        <div v-else-if="!plans.length" class="empty-state">
          등록된 지원계획이 없습니다.
        </div>

        <!-- 기존 지원계획 목록 -->
        <div v-else class="table-wrapper">
          <div class="table-card">
            <table class="nice-table">
              <thead>
                <tr>
                  <th class="th-cell text-center w-14">No</th>
                  <th class="th-cell">지원자 이름</th>
                  <th class="th-cell">보호자 이름</th>
                  <th class="th-cell">담당자</th>
                  <th v-if="selectedRole === 4" class="th-cell">기관명</th>
                  <th class="th-cell">조사지 제출일</th>
                  <th class="th-cell">계획 작성일</th>
                  <th class="th-cell">우선순위</th>
                  <th class="th-cell text-center">상태</th>
                  <th class="th-cell text-center w-28"></th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, idx) in paginatedPlans"
                  :key="row.planCode"
                  class="table-row-item"
                  @click.stop="goDetail(row)"
                >
                  <!-- No 컬럼 (페이징 반영) -->
                  <td class="td-cell text-center">
                    {{ (currentPage - 1) * pageSize + idx + 1 }}
                  </td>

                  <!-- 지원자 이름 -->
                  <td class="td-cell">
                    {{ row.childName ? row.childName : "본인" }}
                  </td>

                  <!-- 보호자 이름 -->
                  <td class="td-cell">
                    {{ row.writerName || "-" }}
                  </td>

                  <!-- 담당자 -->
                  <td class="td-cell">
                    {{ row.assiName || "-" }}
                  </td>

                  <!-- 시스템(4)일 때만 기관명 -->
                  <td v-if="selectedRole === 4" class="td-cell">
                    {{ row.orgName || "-" }}
                  </td>

                  <!-- 조사지 제출일 -->
                  <td class="td-cell">
                    {{ formatDate(row.submitAt) }}
                  </td>

                  <!-- 계획 작성일 (작성전이면 -) -->
                  <td class="td-cell">
                    {{
                      isBeforeWriteStatus(row.status)
                        ? "-"
                        : formatDate(row.writtenAt)
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
                        normStatus(row.status) === 'CC7' && selectedRole !== 1
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

                  <!-- 작업 -->
                  <td class="td-cell">
                    <div class="flex items-center justify-center">
                      <template v-if="isAssigneeRole">
                        <MaterialButton
                          v-if="normStatus(row.status) === 'CC3'"
                          color="dark"
                          size="sm"
                          @click.stop="handleEdit(row)"
                        >
                          수정하기
                        </MaterialButton>
                        <MaterialButton
                          v-else-if="normStatus(row.status) === 'CC7'"
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

          <!-- 페이지네이션 (기존 목록) -->
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

          <!-- 반려일자 + 사유 -->
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

const filterSubmitCode = ref(route.query.submitCode || null);

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

// 담당자 역할 여부
const isAssigneeRole = computed(() => Number(selectedRole.value) === 2);

const formatDate = (v) => {
  if (!v) return "-";
  return String(v).slice(0, 10);
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

function normStatus(raw) {
  return (raw ?? "").toString().trim().toUpperCase();
}

// 🔹 CC1 / CC2 상태면 "작성 전" → 작성일 표시 안 함
function isBeforeWriteStatus(code) {
  const s = normStatus(code);
  return s === "CC1" || s === "CC2";
}

function statusLabel(code) {
  switch (normStatus(code)) {
    case "CC1":
    case "CC2":
      return "작성전";
    case "CC3":
      return "검토중";
    case "CC4":
      return "진행중";
    case "CC5":
      return "지원완료";
    case "CC6":
      return "재승인요청";
    case "CC7":
      return "반려";
    default:
      return code || "-";
  }
}

function statusPillClass(code) {
  switch (normStatus(code)) {
    case "CC1":
    case "CC2":
      return "p-gray";
    case "CC3":
      return "p-yellow";
    case "CC4":
      return "p-blue";
    case "CC5":
      return "p-green";
    case "CC6":
      return "p-orange";
    case "CC7":
      return "p-red";
    default:
      return "p-gray";
  }
}

/* ==============================
 * 🔼 담당자 전용 목록 상태/로직
 * ============================== */
const assigneePlans = ref([]);
const assigneeLoading = ref(false);
const assigneeError = ref("");

const assigneeSearchText = ref("");
const assigneeAppliedSearchText = ref("");
const assigneeSortOption = ref("SUBMIT_RECENT"); // SUBMIT_RECENT | SUBMIT_OLD | NAME

const assigneePageSize = 5;
const assigneeCurrentPage = ref(1);

const assigneeFilteredPlans = computed(() => {
  let rows = [...assigneePlans.value];

  // 1) 검색
  const q = assigneeAppliedSearchText.value.trim().toLowerCase();
  if (q) {
    rows = rows.filter((row) => {
      const targets = [row.childName, row.writerName];
      return targets.some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }

  // 2) 정렬
  if (assigneeSortOption.value === "SUBMIT_RECENT") {
    rows.sort((a, b) => {
      const aDate = a.submitAt ?? "";
      const bDate = b.submitAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }
      return Number(b.planCode || 0) - Number(a.planCode || 0);
    });
  } else if (assigneeSortOption.value === "SUBMIT_OLD") {
    rows.sort((a, b) => {
      const aDate = a.submitAt ?? "";
      const bDate = b.submitAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }
      return Number(a.planCode || 0) - Number(b.planCode || 0);
    });
  } else if (assigneeSortOption.value === "NAME") {
    rows.sort((a, b) => {
      const an = a.childName || "본인";
      const bn = b.childName || "본인";
      return an.localeCompare(bn, "ko");
    });
  }

  return rows;
});

const assigneeTotalPages = computed(() =>
  Math.max(
    1,
    Math.ceil(assigneeFilteredPlans.value.length / assigneePageSize) || 1
  )
);

const assigneePaginatedPlans = computed(() => {
  const start = (assigneeCurrentPage.value - 1) * assigneePageSize;
  return assigneeFilteredPlans.value.slice(start, start + assigneePageSize);
});

function changeAssigneePage(page) {
  if (page < 1 || page > assigneeTotalPages.value) return;
  assigneeCurrentPage.value = page;
}

// 🔍 담당자용 검색 버튼 / 엔터
function onSearchAssignee() {
  assigneeAppliedSearchText.value = assigneeSearchText.value;
  assigneeCurrentPage.value = 1;
}

// 🔽 담당자용 정렬 변경
function onFilterChangeAssignee() {
  assigneeCurrentPage.value = 1;
}

// 담당자용 목록 조회 (다른 API 사용)
const loadAssigneeList = async () => {
  assigneeLoading.value = true;
  assigneeError.value = "";
  try {
    const params = {
      userId: currentUserId.value,
      role: selectedRole.value,
    };
    const { data } = await axios.get("/api/plans/assignee", { params });
    assigneePlans.value = Array.isArray(data?.result) ? data.result : [];
    assigneeCurrentPage.value = 1;
  } catch (e) {
    console.error(e);
    assigneeError.value = e.message || "담당자용 목록 조회 중 오류";
    assigneePlans.value = [];
  } finally {
    assigneeLoading.value = false;
  }
};

/* ==============================
 * 🔽 기존 지원계획 목록 상태/로직
 * ============================== */
const plans = ref([]);
const loading = ref(false);
const error = ref("");

// 🔍 검색 / 상태 / 정렬 상태
const searchText = ref(""); // 인풋에 직접 타이핑하는 값
const appliedSearchText = ref(""); // 실제로 필터에 사용하는 값
const statusFilter = ref("ALL"); // ALL | BEFORE | REVIEW | PROGRESS | DONE | RESUBMIT | REJECT
const sortOption = ref("WRITTEN_RECENT"); // WRITTEN_RECENT | WRITTEN_OLD | SUBMIT_RECENT | SUBMIT_OLD | NAME

const searchPlaceholder = computed(() => {
  if (selectedRole.value === 4) {
    return "지원자, 보호자, 담당자, 기관명 검색";
  }
  return "지원자, 보호자, 담당자 검색";
});

// 🔍 검색/필터/정렬 적용된 리스트
const filteredPlans = computed(() => {
  let rows = [...plans.value];

  rows = rows.filter((row) => normStatus(row.status) !== "CC1");

  // 받은 submitcode로 필터 - 다른 화면에서 넘어오면
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
        case "REVIEW":
          return s === "CC3";
        case "PROGRESS":
          return s === "CC4";
        case "DONE":
          return s === "CC5";
        case "RESUBMIT":
          return s === "CC6";
        case "REJECT":
          return s === "CC7";
        default:
          return true;
      }
    });
  }

  // 3) 정렬
  if (sortOption.value === "WRITTEN_RECENT") {
    rows.sort((a, b) => {
      const aDate = a.writtenAt ?? "";
      const bDate = b.writtenAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }
      const aSub = a.submitAt ?? "";
      const bSub = b.submitAt ?? "";
      if (aSub && bSub && aSub !== bSub) {
        return bSub.localeCompare(aSub);
      }
      return Number(b.planCode) - Number(a.planCode);
    });
  } else if (sortOption.value === "WRITTEN_OLD") {
    rows.sort((a, b) => {
      const aDate = a.writtenAt ?? "";
      const bDate = b.writtenAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }
      const aSub = a.submitAt ?? "";
      const bSub = b.submitAt ?? "";
      if (aSub && bSub && aSub !== bSub) {
        return aSub.localeCompare(bSub);
      }
      return Number(a.planCode) - Number(b.planCode);
    });
  } else if (sortOption.value === "SUBMIT_RECENT") {
    rows.sort((a, b) => {
      const aDate = a.submitAt ?? "";
      const bDate = b.submitAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }
      return Number(b.planCode) - Number(a.planCode);
    });
  } else if (sortOption.value === "SUBMIT_OLD") {
    rows.sort((a, b) => {
      const aDate = a.submitAt ?? "";
      const bDate = b.submitAt ?? "";
      if (aDate && bDate && aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }
      return Number(a.planCode) - Number(b.planCode);
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

// 페이징 (기존 목록)
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

// 🔍 검색 버튼 / 엔터 눌렀을 때만 검색어 적용 (기존 목록)
function onSearch() {
  appliedSearchText.value = searchText.value;
  currentPage.value = 1;
}

// 🔽 상태/정렬 변경 시 (기존 목록)
function onFilterChange() {
  currentPage.value = 1;
}

// 기존 지원계획 목록 조회
const loadList = async () => {
  loading.value = true;
  error.value = "";
  try {
    const params = {
      role: selectedRole.value,
      userId: currentUserId.value,
    };
    const { data } = await axios.get("/api/plans", { params });
    plans.value = Array.isArray(data?.result) ? data.result : [];
    currentPage.value = 1;
  } catch (e) {
    console.error(e);
    error.value = e.message || "지원계획 목록 조회 중 오류";
    plans.value = [];
  } finally {
    loading.value = false;
  }
};

function clearSubmitFilter() {
  // 1) 필터 값 초기화
  filterSubmitCode.value = null;

  // 2) 페이지도 처음으로
  currentPage.value = 1;

  // 3) URL query에서 submitCode 제거 (새로 들어와도 전체 목록 보이게)
  const newQuery = { ...route.query };
  delete newQuery.submitCode;

  router.replace({
    name: route.name,
    query: newQuery,
  });
}

/* ==============================
 * 공통 액션
 * ============================== */
const handleWrite = (row) => {
  router.push({
    name: "plan-write",
    params: { submitcode: row.submitCode },
  });
};

const handleEdit = (row) => {
  router.push({
    name: "plan-edit",
    params: { planCode: row.planCode },
    query: { submitCode: row.submitCode },
  });
};

const handleReEdit = (row) => {
  router.push({
    name: "plan-edit",
    params: { planCode: row.planCode },
    query: { submitCode: row.submitCode },
  });
};

function goDetail(row) {
  router.push({
    name: "planDetail",
    params: { planCode: row.planCode },
    query: { submitCode: row.submitCode, role: selectedRole.value },
  });
}

function goCounselDetail(row) {
  const url = `/counsel/detail/${row.submitCode}?role=${selectedRole.value}`;
  window.open(url, "_blank");
}
// 반려 모달
const rejectReasonModalOpen = ref(false);
const rejectReasonText = ref("");
const rejectReasonLoading = ref(false);
const rejectReasonError = ref("");
const rejectReasonDate = ref("");

async function openRejectReason(row) {
  rejectReasonModalOpen.value = true;
  rejectReasonText.value = "";
  rejectReasonError.value = "";
  rejectReasonLoading.value = true;
  rejectReasonDate.value = "";

  try {
    const { data } = await axios.get(
      `/api/plans/${row.planCode}/rejection-reason`
    );

    if (data?.success === false) {
      throw new Error(data.message || "반려 사유를 불러오지 못했습니다.");
    }

    rejectReasonText.value =
      data?.result?.rejection_reason ?? data?.rejection_reason ?? "";
    rejectReasonDate.value =
      data?.result?.rejection_date ?? data?.rejection_date ?? "";
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

  // 기존 목록은 항상 조회
  loadList();

  // 👉 담당자라면 담당자 전용 목록도 별도로 조회
  if (selectedRole.value === 2) {
    loadAssigneeList();
  }
});
</script>

<style scoped>
section {
  color: #111827;
  font-size: 15px; /* 전체 기본 폰트 크기 */
}

/* 페이지 폭 통일 */
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
  text-align: center; /* ★ 전체 중앙정렬 */
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
  text-align: center; /* ★ 중앙정렬 */
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
  text-align: center; /* ★ 중앙정렬 */
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

.td-status {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

/* 테이블 공통 폰트 + 중앙정렬 강조 */
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
  text-align: center !important;
}

/* 🔹 위/아래 테이블 섹션 구분용 래퍼 */
.section-block {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
}

/* 위쪽 담당자 전용 영역: 살짝 회색 배경 */
.section-block--assignee {
  background-color: #e1e0e7;
}

/* 아래 기존 지원계획 영역: 흰 배경 */
.section-block--plans {
  background-color: #ffffff;
}
</style>
