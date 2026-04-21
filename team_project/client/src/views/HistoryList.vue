<!-- src/views/HistoryList.vue -->
<template>
  <div class="hist-page">
    <h2 class="hist-title">히스토리</h2>

    <!-- 권한 없음 -->
    <div v-if="!isSystem && !isOrgManager" class="hist-no-auth">
      <p>접근 권한이 없습니다. (시스템 관리자 / 기관 관리자 전용)</p>
    </div>

    <!-- 권한 있을 때만 -->
    <div v-else>
      <!-- 필터 영역 -->
      <div class="hist-toolbar">
        <!-- 1행: 검색조건 + 검색창 + 검색버튼 -->
        <div class="hist-filters-row">
          <!-- 검색 기준 -->
          <select
            v-model="searchField"
            class="hist-select"
            @change="onFilterChange"
          >
            <option value="all">전체</option>
            <option value="revision_date">수정일시</option>
            <option value="modifier_name">수정자</option>
          </select>

          <!-- 검색 입력 -->
          <input
            v-model.trim="keyword"
            class="hist-input"
            placeholder="검색어 입력"
            @keyup.enter="fetchList"
          />

          <MaterialButton color="dark" size="sm" @click="fetchList">
            검색
          </MaterialButton>
        </div>

        <!-- 2행: 정렬/유형/기관 또는 담당자 -->
        <div class="hist-filters-row">
          <!-- 정렬 -->
          <select
            v-model="orderBy"
            class="hist-select"
            @change="onFilterChange"
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>

          <!-- BD 공통코드 유형 -->
          <select
            v-model="typeCode"
            class="hist-select"
            @change="onFilterChange"
          >
            <option value="">전체</option>
            <option value="BD1">조사지</option>
            <option value="BD2">상담</option>
            <option value="BD3">지원계획</option>
            <option value="BD4">지원결과</option>
            <option value="BD5">이벤트 계획</option>
            <option value="BD6">이벤트 결과</option>
            <option value="BD7">후원 계획</option>
            <option value="BD8">후원 결과</option>
          </select>

          <!-- 시스템 관리자: 기관 선택 -->
          <template v-if="isSystem">
            <select
              v-model="orgCode"
              class="hist-select"
              @change="onFilterChange"
            >
              <option value="">기관 전체</option>
              <option
                v-for="org in orgOptions"
                :key="org.org_code"
                :value="org.org_code"
              >
                {{ org.org_name }}
              </option>
            </select>
          </template>

          <!-- 기관 관리자: 담당자 선택 (user_code 기준) -->
          <template v-else-if="isOrgManager">
            <select
              v-model="managerCode"
              class="hist-select"
              @change="onFilterChange"
            >
              <option value="">담당자 전체</option>
              <option
                v-for="m in managerOptions"
                :key="m.user_code"
                :value="m.user_code"
              >
                {{ m.name }}
              </option>
            </select>
          </template>
        </div>
      </div>

      <!-- 테이블 -->
      <div class="hist-table-wrap">
        <table class="hist-table">
          <thead>
            <tr>
              <th>기록코드</th>
              <th>수정일시</th>
              <th>유형</th>
              <th v-if="isSystem">기관</th>
              <th>수정자</th>
              <th>수정자 권한</th>
              <th>변경 항목</th>
              <th>변경 전</th>
              <th>변경 후</th>
            </tr>
          </thead>

          <tbody>
            <!-- 데이터 없을 때 -->
            <tr v-if="!loading && items.length === 0">
              <td :colspan="isSystem ? 9 : 8" class="hist-empty">
                조회된 이력이 없습니다.
              </td>
            </tr>

            <!-- 목록 행 -->
            <tr v-for="row in items" :key="row.record_code">
              <td>{{ row.record_code }}</td>
              <td>{{ formatDateTime(row.revision_date) }}</td>

              <!-- 유형: BD 코드 → 한글 -->
              <td>{{ getTypeName(row.type_code) }}</td>

              <td v-if="isSystem">{{ row.org_name || "-" }}</td>

              <td>{{ row.modifier_name }}</td>

              <!-- 🔹 새 컬럼: 수정자 권한 (AA1~AA4) → 한글 -->
              <td>{{ getModifierRoleName(row.modifier_role) }}</td>

              <td>{{ getChangeItemLabel(row) }}</td>

              <td class="hist-before">
                {{ formatHistoryValue(row.before_change) }}
              </td>
              <td class="hist-after">
                {{ formatHistoryValue(row.after_change) }}
              </td>
            </tr>

            <!-- 로딩 중 -->
            <tr v-if="loading">
              <td :colspan="isSystem ? 9 : 8" class="hist-loading">
                로딩 중...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이징 -->
      <div class="hist-pagination" v-if="totalPages > 1">
        <MaterialButton
          color="dark"
          size="sm"
          :disabled="page === 1 || loading"
          @click="changePage(page - 1)"
        >
          이전
        </MaterialButton>

        <span class="hist-page-info">{{ page }} / {{ totalPages }}</span>

        <MaterialButton
          color="dark"
          size="sm"
          :disabled="page === totalPages || loading"
          @click="changePage(page + 1)"
        >
          다음
        </MaterialButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import { useAuthStore } from "@/store/authLogin";
import MaterialButton from "@/components/MaterialButton.vue";

const auth = useAuthStore();

// 권한 체크
const isSystem = computed(() => auth.role === "AA4");
const isOrgManager = computed(() => auth.role === "AA3");

const searchField = ref("all");
const keyword = ref("");
const orderBy = ref("latest");
const typeCode = ref(""); // BD1~BD8

const orgCode = ref("");
const managerCode = ref(""); // ✅ users.user_code 기준으로 사용

const items = ref([]);
const page = ref(1);
const size = ref(20);
const totalCount = ref(0);
const loading = ref(false);

const orgOptions = ref([]);
const managerOptions = ref([]);

const totalPages = computed(() =>
  totalCount.value === 0 ? 1 : Math.ceil(totalCount.value / size.value)
);

// 유형(BD) 매핑
const typeMap = {
  BD1: "조사지",
  BD2: "상담",
  BD3: "지원계획",
  BD4: "지원결과",
  BD5: "이벤트 계획",
  BD6: "이벤트 결과",
  BD7: "후원 계획",
  BD8: "후원 결과",
};
const getTypeName = (code) => typeMap[code] || "-";

// 🔹 수정자 권한 매핑 (AA 코드)
const modifierRoleMap = {
  AA1: "일반 사용자",
  AA2: "기관 담당자",
  AA3: "기관 관리자",
  AA4: "시스템 관리자",
};

// 🔹 우선순위(BB 코드) 매핑
const priorityMap = {
  BB1: "긴급",
  BB2: "중점",
  BB3: "준비",
};

const getModifierRoleName = (roleCode) => modifierRoleMap[roleCode] || "-";

// 변경 항목 컬럼명을 한글로 변환
const getChangeItemLabel = (row) => {
  if (!row) return "";

  const rawColumn = row.change_item || ""; // 예: answers, answers.76, survey_answer.answers

  // . 또는 [ 기준으로 앞부분만 컬럼명으로 사용
  // 기존: rawColumn.split(/[.\[]/)[0];
  const baseColumn = rawColumn.split(/[.[[]/)[0]; // answers.76 -> answers

  // 공통 컬럼명 매핑
  const commonColumnLabelMap = {
    status: "상태",
    answers: "조사지 답변",
    name: "이름",
    role: "권한 구분",
    is_active: "가입 상태",
    org_code: "소속 기관",

    main_title: "제목",
    main_content: "내용",
    main_counsel_date: "일자",
    plan_from: "예상 지원 시작일",
    plan_to: "예상 지원 종료일",

    goal_p: "계획 목표",
    publicContent_p: "이용자 내용",
    privateContent_p: "기관 내용",

    actual_from: "실제 지원 시작일",
    actual_to: "실제 지원 종료일",
    goal: "계획했던 목표",
    publicContent: "일반용 내용",
    privateContent: "기관용 내용",
    priority: "우선순위",

    detail_title: "추가 제목",
    detail1_title: "추가-1 제목",
    detail2_title: "추가-2 제목",
    detail3_title: "추가-3 제목",
    detail4_title: "추가-4 제목",
    detail5_title: "추가-5 제목",
    detail6_title: "추가-6 제목",
    detail7_title: "추가-7 제목",
    detail8_title: "추가-8 제목",
    detail9_title: "추가-9 제목",
    detail10_title: "추가-10 제목",

    detail_content: "추가 내용",
    detail1_content: "추가-1 내용",
    detail2_content: "추가-2 내용",
    detail3_content: "추가-3 내용",
    detail4_content: "추가-4 내용",
    detail5_content: "추가-5 내용",
    detail6_content: "추가-6 내용",
    detail7_content: "추가-7 내용",
    detail8_content: "추가-8 내용",
    detail9_content: "추가-9 내용",
    detail10_content: "추가-10 내용",

    detail_date: "추가 일자",
    detail1_date: "추가-1 일자",
    detail2_date: "추가-2 일자",
    detail3_date: "추가-3 일자",
    detail4_date: "추가-4 일자",
    detail5_date: "추가-5 일자",
    detail6_date: "추가-6 일자",
    detail7_date: "추가-7 일자",
    detail8_date: "추가-8 일자",
    detail9_date: "추가-9 일자",
    detail10_date: "추가-10 일자",

    item_private: "추가 관리자 내용",
    item1_private: "추가-1 관리자 내용",
    item2_private: "추가-2 관리자 내용",
    item3_private: "추가-3 관리자 내용",
    item4_private: "추가-4 관리자 내용",
    item5_private: "추가-5 관리자 내용",
    item6_private: "추가-6 관리자 내용",
    item7_private: "추가-7 관리자 내용",
    item8_private: "추가-8 관리자 내용",
    item9_private: "추가-9 관리자 내용",
    item10_private: "추가-10 관리자 내용",

    item_public: "추가 이용자 내용",
    item1_public: "추가-1 이용자 내용",
    item2_public: "추가-2 이용자 내용",
    item3_public: "추가-3 이용자 내용",
    item4_public: "추가-4 이용자 내용",
    item5_public: "추가-5 이용자 내용",
    item6_public: "추가-6 이용자 내용",
    item7_public: "추가-7 이용자 내용",
    item8_public: "추가-8 이용자 내용",
    item9_public: "추가-9 이용자 내용",
    item10_public: "추가-10 이용자 내용",

    item_goal: "추가 목표",
    item1_goal: "추가-1 목표",
    item2_goal: "추가-2 목표",
    item3_goal: "추가-3 목표",
    item4_goal: "추가-4 목표",
    item5_goal: "추가-5 목표",
    item6_goal: "추가-6 목표",
    item7_goal: "추가-7 목표",
    item8_goal: "추가-8 목표",
    item9_goal: "추가-9 목표",
    item10_goal: "추가-10 목표",
  };

  if (commonColumnLabelMap[baseColumn]) {
    return commonColumnLabelMap[baseColumn];
  }

  // 그래도 없으면 원래 문자열 그대로
  return rawColumn;
};

// before_change / after_change 값 포맷팅
const formatHistoryValue = (value) => {
  if (value == null || value === "") return "";

  const str = String(value).trim();

  // JSON Object 형식인지 확인
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const obj = JSON.parse(str);

      if (typeof obj !== "object" || Array.isArray(obj) || obj === null) {
        // JSON이 아닌 단일 값이 BB(공통코드) 일 수도 있으니 매핑
        return priorityMap[str] || str;
      }

      // JSON 객체일 때 내부 값을 매핑
      const parts = Object.entries(obj).map(([key, val]) => {
        // 배열이면 내부 항목도 매핑
        if (Array.isArray(val)) {
          const mappedArr = val.map((v) =>
            typeof v === "string" && priorityMap[v] ? priorityMap[v] : v
          );
          return `${key}: ${mappedArr.join(", ")}`;
        }

        // 단일 값이 BB(공통코드) 라면 치환
        if (typeof val === "string" && priorityMap[val]) {
          return `${key}: ${priorityMap[val]}`;
        }

        return `${key}: ${val}`;
      });

      return parts.join(", ");
    } catch (e) {
      // JSON 파싱 실패 → 단일 값이 BB(공통코드) 이면 매핑
      return priorityMap[str] || str;
    }
  }

  // JSON이 아니면 단일 값이 BB(공통코드)인지 체크
  return priorityMap[str] || str;
};

// 날짜 format
const formatDateTime = (v) =>
  v ? String(v).replace("T", " ").substring(0, 19) : "";

// 필터 변경 시 리로드
const onFilterChange = () => {
  page.value = 1;
  fetchList();
};

// 페이지 이동
const changePage = (p) => {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
  fetchList();
};

// 이력 조회
const fetchList = async () => {
  if (!isSystem.value && !isOrgManager.value) return;

  loading.value = true;
  try {
    const params = {
      page: page.value,
      size: size.value,
      searchField: searchField.value,
      keyword: keyword.value,
      orderBy: orderBy.value,
      typeCode: typeCode.value,
      // 🔹 권한/로그인 정보도 항상 같이 전달
      loginId: auth.userId,
      role: auth.role,
    };

    if (isSystem.value && orgCode.value) {
      params.orgCode = orgCode.value;
    }
    if (isOrgManager.value && managerCode.value) {
      // ✅ managerCode는 users.user_code
      params.managerCode = managerCode.value;
    }

    const res = await axios.get("/api/histories", { params });

    items.value = res.data?.data?.list ?? [];
    totalCount.value = res.data?.data?.totalCount ?? 0;
  } catch (err) {
    console.error(err);
    alert("이력 목록 조회 중 오류가 발생했습니다.");
  } finally {
    loading.value = false;
  }
};

// 기관목록 / 담당자 목록
const fetchOrgOptions = async () => {
  if (!isSystem.value) return;
  try {
    const res = await axios.get("/api/organization/simple");
    orgOptions.value = res.data?.data ?? [];
  } catch (err) {
    console.error(err);
  }
};

const fetchManagerOptions = async () => {
  if (!isOrgManager.value) return;
  try {
    const res = await axios.get("/api/managers/simple", {
      // ⬇️ 기존: orgCode: auth.orgCode (undefined라서 400 남)
      // params: { orgCode: auth.orgCode },
      params: { loginId: auth.userId }, // ✅ 로그인 아이디 기준으로 요청
    });

    const raw = res.data?.data ?? [];

    managerOptions.value = raw.map((m) => ({
      user_code: m.user_code ?? m.manager_code,
      name: m.name ?? m.manager_name,
    }));
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  if (isSystem.value) await fetchOrgOptions();
  if (isOrgManager.value) await fetchManagerOptions();

  fetchList();
});
</script>

<style scoped>
* {
  font-size: 15px;
}

.hist-page {
  padding: 24px;
  max-width: 1600px;
}

.hist-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
}

.hist-no-auth {
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fafafa;
  text-align: center;
  font-size: 14px;
}

/* ===========================
   🔷 필터 영역
   =========================== */

.hist-toolbar {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hist-filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hist-select,
.hist-input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
}

.hist-input {
  min-width: 220px;
}

.hist-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  cursor: pointer;
  background: white;
}

.hist-btn-primary {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

/* ===========================
   🔷 테이블 감싸는 카드 스타일
   (후원결과 priority-card 기반)
   =========================== */

.hist-table-wrap {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  padding: 12px 16px;
  overflow-x: auto;
}

/* ===========================
   🔷 테이블 전체 스타일
   (priority-table 스타일 100% 적용)
   =========================== */

.hist-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 1000px; /* 기존 유지 */
}

.hist-table thead th {
  text-align: center;
  padding: 10px 8px;
  font-weight: 600;
  font-size: 12px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  white-space: nowrap;
}

.hist-table tbody td {
  padding: 9px 8px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: middle;
  text-align: center;
  white-space: nowrap;
}

/* hover 효과 통일 */
.hist-table tbody tr:hover {
  background: #f3f4ff;
  transform: translateY(-1px);
  transition:
    background-color 0.12s ease,
    transform 0.06s ease;
}

/* ===========================
   🔷 before / after만 왼쪽 정렬 + 여러 줄 허용
   =========================== */

.hist-table td.hist-before,
.hist-table td.hist-after {
  white-space: pre-wrap;
  word-break: break-word;
  overflow: visible;
  text-overflow: unset;
  text-align: left;
}

/* ===========================
   🔷 empty & loading
   =========================== */

.hist-empty,
.hist-loading {
  text-align: center;
  padding: 14px 0;
  color: #9ca3af;
}

/* ===========================
   🔷 페이징
   =========================== */

.hist-pagination {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.hist-page-info {
  font-size: 13px;
}
</style>
