<template>
  <div class="apv-page">
    <h2 class="apv-title">후원 활동 보고서</h2>

    <div class="apv-toolbar apv-toolbar-top">
      <MaterialButton
        color="dark"
        size="sm"
        @click="programAdd()"
        v-if="userRole !== 'AA1' && userRole !== 'AA0'"
      >
        후원 활동 보고서 등록
      </MaterialButton>
      <div class="search-box">
        <input
          type="text"
          placeholder="프로그램명 입력"
          v-model="searchKeyword"
        />
      </div>
    </div>

    <div class="priority-card">
      <table class="priority-table">
        <thead>
          <tr>
            <th>프로그램</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>목표 금액</th>
            <th>사용 금액</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="program in finalList"
            @click="selectProgram(program)"
            :key="program.program_code"
          >
            <td>{{ program.program_name }}</td>
            <td>{{ program.title }}</td>
            <td>{{ program.writer }}</td>
            <td>{{ dateFormat(program.create_date, "yyyy-MM-dd") }}</td>
            <td>{{ numberFormat(program.goal_amount) }}원</td>
            <td>{{ numberFormat(program.used_amount) }}원</td>
          </tr>
        </tbody>
      </table>

      <div v-if="sponsorList.length === 0" class="apv-empty">
        조회된 후원 프로그램이 없습니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import numberFormat from "@/utils/numberFormat";
import { ref, onBeforeMount, computed } from "vue";
import MaterialButton from "@/components/MaterialButton.vue";
const userJsonString = localStorage.getItem("user");
let userObject = {};
try {
  userObject = userJsonString ? JSON.parse(userJsonString) : {};
} catch (e) {
  console.error("❌ user 파싱 실패:", e);
  userObject = {};
}

const userRole = userObject.role || "AA0";

const emit = defineEmits(["go-to-add", "select-program"]);

let sponsorList = ref([]); // 전체 조회 조건 조회
let programList = ref([]); // 검색창 프로그램 명 리스트 불러오기
const searchKeyword = ref("");
const getSponsorList = async (params = {}) => {
  let result = await axios
    .get(`/api/sponsor/activity`, { params: params })
    .catch((err) => console.log(err));

  if (!result || !result.data) {
    console.log("조회 결과 데이터가 유효하지 않습니다.");
    sponsorList.value = [];
    return;
  }
  const res = result.data.serviceSponsor;

  let list = JSON.parse(JSON.stringify(res));

  sponsorList.value = list;
  // 2. 검색 조건이 없는 최초 로딩 시에만 programList를 갱신
  //  (검색 결과는 programList에 영향을 주지 않아야 함)
  if (Object.keys(params).length === 0) {
    programList.value = list;
  }
  console.log(JSON.parse(JSON.stringify(sponsorList.value)));
};

onBeforeMount(() => {
  getSponsorList();
});
defineExpose({
  getSponsorList,
});

const programAdd = () => {
  emit("go-to-add"); // 'go-to-add' 이벤트를 발생시킴
};
// -------------------------------
// 검색 기능
// -------------------------------
const finalList = computed(() => {
  const kw = searchKeyword.value.trim();
  if (!kw) return sponsorList.value; // 검색어 없으면 전체 리턴

  // 검색어 있을 때만 필터
  return sponsorList.value.filter((item) => item.program_name.includes(kw));
});
// client/comments/Sponsor/ProgramList.vue
const selectProgram = async (item) => {
  const userRole = userObject.role;

  // AA0과 AA1은 상세보기 권한이 없는 역할로 가정
  const hasDetailPermission = computed(() => {
    return userRole !== "AA0" && userRole !== "AA1";
  });
  if (!hasDetailPermission.value) {
    // 권한이 없는 경우 (AA0 또는 AA1) 아무것도 하지 않고 함수 종료
    console.log(`[권한 없음] ${userRole} 역할은 상세보기를 할 수 없습니다.`);
    return;
  }

  const res = await axios.get(`/api/sponsor/activity/${item.activity_code}`);

  emit("select-program", {
    ...res.data.activity[0],
    history: res.data.history,
  });
};
</script>
<style scoped>
* {
  font-size: 15px;
}

/* === 페이지 레이아웃 및 제목 === */
.apv-page {
  max-width: 1600px;
  margin: 24px auto;
  padding: 0 16px 40px;
}

.apv-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* 상단 툴바 */
.apv-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* 등록 버튼 포함 툴바 */
.apv-toolbar-top {
  justify-content: space-between;
  margin-bottom: 8px; /* 제목과 테이블 사이 간격 조절 */
}

/* 검색 */
.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #bbb;
  padding: 5px 10px;
  border-radius: 10px;
  background-color: white;
}

.search-box input {
  border: none;
  outline: none;
  border-radius: 5px;
}

/* 버튼 공통 */
.apv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #d2d6e0;
  background: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition: 0.12s ease-in-out;
  white-space: nowrap;
}

.apv-btn:hover {
  filter: brightness(0.98);
}

.apv-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 버튼 스타일 변형 */
.apv-btn-primary {
  background: #7ea6f6;
  border-color: #7ea6f6;
  color: #fff;
}

.apv-btn-primary:hover {
  filter: brightness(0.96);
}

/* 🔥 테이블 컨테이너 스타일 (priority-card) */
.priority-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  padding: 12px 16px;
  overflow: hidden;
}

/* 🔥 테이블 스타일 (priority-table) */
.priority-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.priority-table thead {
  background: #f5f7fb;
}

.priority-table th,
.priority-table td {
  padding: 9px 10px;
  border-bottom: 1px solid #edf2f7;
  /* 기본은 중앙 정렬 */
  text-align: center;
}

.priority-table th {
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
}

/* 테이블 행 호버 시 스타일 */
.priority-table tbody tr {
  cursor: pointer;
}
.priority-table tbody tr:hover {
  background: #f9fbff;
}

.apv-empty {
  /* 빈 데이터 메시지 스타일 */
  text-align: center;
  padding: 14px 0;
  color: #6b7280;
}

/* 🔥🔥🔥 정렬 및 너비 규칙 (금액만 우측 정렬) 🔥🔥🔥 */

/* 금액 컬럼 셀(td) 우측 정렬: 5번째(목표 금액), 6번째(사용 금액) */
.priority-table td:nth-child(5),
.priority-table td:nth-child(6) {
  text-align: right !important;
}

/* 컬럼 너비 지정 */
.priority-table th:nth-child(5),
.priority-table td:nth-child(5),
.priority-table th:nth-child(6),
.priority-table td:nth-child(6) {
  width: 15%; /* 금액 컬럼 너비 */
}

.priority-table th:nth-child(4),
.priority-table td:nth-child(4) {
  width: 15%; /* 작성일 컬럼 너비 */
}

.priority-table th:nth-child(3),
.priority-table td:nth-child(3) {
  width: 10%; /* 작성자 컬럼 너비 */
}

/* 나머지 (프로그램, 제목)은 남은 공간을 유연하게 차지 */

/* 모바일 대응 (필요한 부분만 간결하게 유지) */
@media (max-width: 800px) {
  .apv-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}
</style>
