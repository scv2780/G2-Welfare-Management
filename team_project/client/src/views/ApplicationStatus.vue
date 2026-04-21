<!-- src/views/ApplicationStatus.vue -->
<template>
  <div class="as-page">
    <h2 class="as-title">나의 지원 신청 현황</h2>

    <!-- 권한 없음 -->
    <div v-if="!isUser" class="as-no-auth">
      <p>접근 권한이 없습니다. (일반 이용자 전용 페이지)</p>
    </div>

    <!-- 목록 -->
    <div v-else>
      <div class="as-table-wrap">
        <table class="as-table">
          <thead>
            <tr>
              <th>No</th>
              <th>이름</th>
              <th>보호자</th>
              <th>담당자</th>
              <th>기관</th>
              <th>지원 신청일</th>
              <th>우선순위</th>
              <th>계획 현황</th>
              <th>결과 현황</th>
            </tr>
          </thead>

          <tbody>
            <!-- 로딩 -->
            <tr v-if="loading">
              <td colspan="9" class="as-empty">불러오는 중...</td>
            </tr>

            <!-- 데이터 없음 -->
            <tr v-else-if="statusList.length === 0">
              <td colspan="9" class="as-empty">조회된 신청 내역이 없습니다.</td>
            </tr>

            <!-- 데이터 표시 -->
            <tr
              v-else
              v-for="(row, idx) in statusList"
              :key="row.submit_code || idx"
            >
              <td>{{ idx + 1 }}</td>

              <td>{{ row.child_name || "본인" }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.assi_name || "-" }}</td>
              <td>{{ row.org_name || "-" }}</td>

              <!-- 지원 신청일 (조사지 상세 이동) -->
              <td class="as-link" @click="goSurveyDetail(row.submit_code)">
                {{ formatDate(row.survey_date) }}
              </td>

              <!-- 우선순위 -->
              <td>
                <span class="as-tag" :class="'lvl-' + row.priority_level">
                  {{ convertPriority(row.priority_level) }}
                </span>
              </td>

              <!-- 지원 계획 상태 -->
              <td class="as-link" @click="goPlanDetail(row.submit_code)">
                {{ summarizePlanStatus(row.plan_status_list || []) }}
              </td>
              <!-- 지원결과 -->
              <td class="as-link" @click="goResultDetail(row.submit_code)">
                {{ summarizeResultStatus(row.result_status_list || []) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "@/store/authLogin";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

// 권한 체크 (일반 회원만)
const isUser = computed(() => auth.role === "AA1");

// 상태
const loading = ref(false);
const statusList = ref([]);

// 날짜 포맷
const formatDate = (d) => (d ? d.substring(0, 10) : "-");

// 우선순위 매핑 (BB)
const convertPriority = (code) => {
  switch (code) {
    case "BB1":
      return "긴급";
    case "BB2":
      return "중점";
    case "BB3":
      return "계획";
    default:
      return "-";
  }
};

function normalizeStatusList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// plan_status 하나의 코드 → 그룹
function mapPlanGroup(code) {
  switch (code) {
    case "CC1":
    case "CC2":
      return "NONE"; // 작성 전
    case "CC3":
    case "CC4":
      return "ONGOING"; // 검토중/진행중
    case "CC5":
      return "DONE"; // 지원완료
    default:
      return "NONE";
  }
}

function summarizePlanStatus(planStatusesRaw) {
  const planStatuses = normalizeStatusList(planStatusesRaw); // 👈 문자열 → 배열 변환
  const groups = planStatuses.map(mapPlanGroup);
  const total = planStatuses.length;

  if (total === 0) return "-";
  if (groups.includes("ONGOING")) return `진행 ${total}건`;
  if (groups.includes("DONE")) return `완료 ${total}건`;
  return "-";
}

function mapResultGroup(code) {
  switch (code) {
    case "CD1":
    case "CD2":
    case "CD3":
      return "NONE"; // 작성 전
    case "CD4":
      return "ONGOING"; // 지원중/승인요청
    case "CD5":
      return "DONE"; // 지원완료
    default:
      return "NONE";
  }
}

function summarizeResultStatus(resultStatusesRaw) {
  const resultStatuses = normalizeStatusList(resultStatusesRaw);

  // 🔥 CD3는 카운트 자체에서 제외
  const filtered = resultStatuses.filter((code) => code !== "CD3");

  const total = filtered.length;
  if (total === 0) return "-";

  const groups = filtered.map(mapResultGroup);

  if (groups.includes("ONGOING")) return `진행 ${total}건`;
  if (groups.includes("DONE")) return `완료 ${total}건`;
  return "-";
}

// 이동 함수
const goSurveyDetail = (submitCode) => {
  if (!submitCode) return;
  router.push(`/survey/submission/${submitCode}`);
};

const goPlanDetail = (submitCode) => {
  if (!submitCode) return;

  router.push({
    name: "planList",
    query: {
      submitCode: submitCode,
    },
  });
};

const goResultDetail = (submitCode) => {
  if (!submitCode) return;
  router.push({
    name: "resultList",
    query: {
      submitCode: submitCode,
    },
  });
};

// 데이터 조회
const fetchMyApplications = async () => {
  loading.value = true;

  try {
    const res = await axios.get("/api/applications/mine", {
      params: {
        loginId: auth.userId, // users.user_id
        role: auth.role, // "AA1" (일반 사용자)
      },
    });

    console.log("[ApplicationStatus] raw response:", res.data);

    const raw = res.data?.data ?? [];
    let list = [];

    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === "object") {
      list = [raw];
    }

    statusList.value = list.filter((row) => row && row.submit_code);
  } catch (err) {
    console.error("[ApplicationStatus] 조회 실패:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!isUser.value) return;
  fetchMyApplications();
});
</script>

<style scoped>
.as-page {
  padding: 24px;
  color: #111827;
  font-size: 15px;
}

/* 페이지 제목 */
.as-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

/* 권한 없음 박스 */
.as-no-auth {
  padding: 30px 20px;
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
  background: #f9fafb;
  text-align: center;
  color: #4b5563;
}

/*** 테이블 카드 래퍼 (조사지 목록이랑 비슷한 카드 느낌) ***/
.as-table-wrap {
  margin-top: 8px;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden; /* 둥근 모서리에 맞게 잘리도록 */
}

/*** 테이블 기본 ***/
.as-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 14px;
}

.as-table th,
.as-table td {
  font-family:
    "Noto Sans KR",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  text-align: center;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/*** 헤더 셀 (nice-table th-cell 느낌) ***/
.as-table thead th {
  padding: 0.7rem 0.9rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

/*** 바디 셀 (nice-table td-cell 느낌) ***/
.as-table tbody td {
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  vertical-align: middle;
}

/*** 행 스타일 + 줄무늬 + hover 효과 ***/
.as-table tbody tr {
  transition:
    background-color 0.12s ease,
    box-shadow 0.15s ease,
    transform 0.08s ease;
}

.as-table tbody tr:nth-child(odd) {
  background-color: #ffffff;
}

.as-table tbody tr:nth-child(even) {
  background-color: #f9fafb;
}

.as-table tbody tr:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

/*** 로딩/빈 상태 셀 ***/
.as-empty {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

/*** 링크 스타일 (계획/결과/조사지 상세 이동용) ***/
.as-link {
  color: #111827;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.as-link:hover {
  color: #030712;
}

/*** 우선순위 태그 (살짝 pill 느낌 유지) ***/
.as-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: #ffffff;
}

/* 긴급 */
.lvl-BB1 {
  background-color: #fab39f !important;
  color: #8a2e2e !important;
  border: 1px solid #e28f7f !important;
}

/* 중점 */
.lvl-BB2 {
  background-color: #fce8a1 !important;
  color: #b0681b !important;
  border: 1px solid #e6c77b !important;
}

/* 계획 */
.lvl-BB3 {
  background-color: #e4f0ff !important;
  color: #476c99 !important;
  border: 1px solid #a5c3da !important;
}

/*** 반응형: 화면 좁을 때 헤더 글씨/패딩 줄이기 ***/
@media (max-width: 900px) {
  .as-table thead th {
    white-space: normal;
    font-size: 13px;
    line-height: 1.3;
    padding: 0.45rem 0.5rem;
  }

  .as-table tbody td {
    font-size: 13px;
    padding: 0.5rem 0.6rem;
  }
}
</style>
