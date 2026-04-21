<template>
  <section class="p-6">
    <!-- 🔥 전체 내용을 가운데로 모으는 래퍼 -->
    <div class="max-w-5xl mx-auto">
      <div class="form-actions">
        <h2
          class="text-2xl md:text-3xl font-bold tracking-tight whitespace-nowrap align-middle"
        >
          버전별 목록
        </h2>

        <MaterialButton color="dark" size="sm" @click="goToNew">
          조사지 제작하기
        </MaterialButton>
      </div>

      <div v-if="loading">불러오는 중...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>

      <!-- 🔥 카드 형태 테이블 -->
      <div v-else class="table-card">
        <table class="nice-table">
          <thead>
            <tr>
              <th class="th-cell">템플릿코드</th>
              <th class="th-cell">템플릿버전코드</th>
              <th class="th-cell">버전번호</th>
              <th class="th-cell">버전세부번호</th>
              <th class="th-cell">사용여부</th>
              <th class="th-cell">유효시작일</th>
              <th class="th-cell">유효종료일</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in paginatedData"
              :key="row.template_ver_code"
              class="table-row-item"
              :class="{ 'is-current': row.is_current === 'Y' }"
              @click="goToDetail(row.template_ver_code)"
            >
              <td class="td-cell mono">{{ row.template_code }}</td>
              <td class="td-cell mono">{{ row.template_ver_code }}</td>
              <td class="td-cell">{{ row.version_no }}</td>
              <td class="td-cell">{{ row.version_detail_no }}</td>

              <td class="td-cell">
                <span v-if="row.is_current === 'Y'" class="badge badge-active">
                  사용중
                </span>
                <span v-else class="badge badge-inactive"> 미사용 </span>
              </td>

              <td class="td-cell">
                {{ row.effective_from?.slice?.(0, 10) || "-" }}
              </td>
              <td class="td-cell">
                {{ row.effective_to?.slice?.(0, 10) || "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div class="mt-6 text-center">
        <MaterialPagination color="dark" size="md">
          <MaterialPaginationItem
            prev
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          />
          <MaterialPaginationItem
            v-for="page in totalPages"
            :key="page"
            :label="page"
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
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import MaterialPagination from "@/components/MaterialPagination.vue";
import MaterialPaginationItem from "@/components/MaterialPaginationItem.vue";
import MaterialButton from "@/components/MaterialButton.vue";

const router = useRouter();
const list = ref([]);
const loading = ref(false);
const error = ref(null);

const currentPage = ref(1);
const pageSize = 10;

const totalPages = computed(() => Math.ceil(list.value.length / pageSize));

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return list.value.slice(start, start + pageSize);
});

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await axios.get("/api/survey");
    list.value = Array.isArray(data.result) ? data.result : [];
  } catch (e) {
    error.value = e.message || "목록 조회 중 오류";
  } finally {
    loading.value = false;
  }
});

function goToNew() {
  router.push("/survey/new");
}

function goToDetail(templateVerCode) {
  router.push({
    name: "survey-detail-by-ver",
    params: { templateVerCode },
  });
}
</script>

<style scoped>
section {
  color: #111827;
  font-size: 15px; /* 전체 기본 폰트 크기 */
}

.pagination {
  display: inline-flex !important;
}

.form-actions {
  padding-bottom: 0.9rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

/* 카드 컨테이너 */
.table-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

/* 테이블 */
.nice-table {
  width: 100%;
  table-layout: fixed; /* 칼럼 폭 균등 분배 */
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

/* 행 */
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

/* 호버 */
.table-row-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

/* 사용중 강조 */
.table-row-item.is-current {
  border-left: 3px solid #111827;
  background: linear-gradient(
    to right,
    rgba(17, 24, 39, 0.06),
    rgba(249, 250, 251, 1)
  );
}

/* 모든 테이블 셀 공통 */
table th,
table td {
  font-size: 15px !important;
  font-weight: 400;
  font-family: "Noto Sans KR", sans-serif;
  text-align: center !important; /* ★ 무조건 중앙 */
}

/* 뱃지 */
.badge {
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

.badge-active {
  background-color: #deeec8 !important; /* green pastel */
  border: 1px solid #bedca0 !important;
  color: #3f7a3a !important;
}

.badge-inactive {
  background-color: #e4e6e1 !important; /* gray pastel */
  border: 1px solid #d0d3cd !important;
  color: #4b5563 !important;
}
</style>
