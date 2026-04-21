<template>
 <div class="apv-page">
  <h2 class="apv-title">후원 총괄표</h2>

    <div class="apv-toolbar">
   <div class="search-box">
    <input
     type="text"
     placeholder="프로그램명 입력"
     v-model="searchKeyword"
    />
   </div>
  </div>

    <div class="priority-card">
      <div v-if="loading" class="priority-loading">불러오는 중...</div>

      <table v-else class="priority-table">
    <thead>
     <tr>
      <th>기관명</th>
      <th>프로그램</th>
      <th>후원 기간</th>
      <th>목표 금액</th>
      <th>모금 금액</th>
      <th>사용 금액</th>
      <th>잔액</th>
     </tr>
    </thead>
    <tbody>
     <tr v-if="!loading && finalList.length === 0">
      <td :colspan="isOrgVisible ? 10 : 9" class="apv-empty">
       데이터가 없습니다.
      </td>
     </tr>
     <tr
      v-for="r in finalList"
      :key="r.program_code"
      @click="goDetail(r.program_code)"
      class="click-row"
     >
      <td>{{ r.org_name }}</td>
      <td>{{ r.program_name }}</td>

      <td>
       {{ dateFormat(r.start_date, "yyyy-MM-dd") }}~
       {{ dateFormat(r.end_date, "yyyy-MM-dd") }}
      </td>
      <td>{{ numberFormat(r.goal_amount) }}원</td>
      <td>{{ numberFormat(r.current_amount) }}원</td>
      <td>{{ numberFormat(r.useAmount) }}원</td>
      <td>{{ numberFormat(r.remainder) }}원</td>
     </tr>
    </tbody>
   </table>
  </div>
 </div>
</template>

<script setup>
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import numberFormat from "@/utils/numberFormat";
import { ref, onBeforeMount, computed } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
let sponsorList = ref([]); // 전체 조회 조건 조회

// ** [추가] loading ref 및 isOrgVisible 임시 추가 **
const searchKeyword = ref("");
const loading = ref(false); 
const isOrgVisible = computed(() => true); 
// ** ------------------------------------------- **

const getSponsorList = async () => {
 loading.value = true; // 로딩 시작
 let result = await axios
  .get(`/api/sponsor/summaryStatementList`)
  .catch((err) => console.log(err));

 // API 호출 실패 처리 추가 (이전 대화에서 논의된 부분)
 if (!result || !result.data) {
  console.log("조회 결과 데이터가 유효하지 않습니다.");
  sponsorList.value = [];
  loading.value = false; // 로딩 끝
  return;
 }
 const res = result.data.serviceSponsor;

 let list = JSON.parse(JSON.stringify(res));
 sponsorList.value = list;
 console.log(JSON.parse(JSON.stringify(sponsorList.value)));
 loading.value = false; // 로딩 끝
};

onBeforeMount(() => {
 getSponsorList();
});
defineExpose({
 getSponsorList,
});

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

const goDetail = (code) => {
  const userDataString = localStorage.getItem("user");
const userData = userDataString ? JSON.parse(userDataString) : {};
const userRole = userData.role;

// AA0과 AA1은 상세보기 권한이 없는 역할로 가정
const hasDetailPermission = computed(() => {
    return userRole !== 'AA0' && userRole !== 'AA1';
});
if (!hasDetailPermission.value) {
        // 권한이 없는 경우 (AA0 또는 AA1) 아무것도 하지 않고 함수 종료
        console.log(`[권한 없음] ${userRole} 역할은 상세보기를 할 수 없습니다.`);
        return;
    }


 router.push(`/budget-summary/${code}`);
};
</script>

<style scoped>
/*
 * 스타일은 이전 대화에서 수정된 내용을 기반으로 합니다.
 * 단, 새 클래스(`priority-card`, `priority-loading`, `priority-table`)에
 * 대응하는 스타일 정의가 필요합니다.
 */

* {
 font-size: 15px;
}
/* === ManagerApprovals.vue 와 동일 스타일 === */
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
 justify-content: flex-end; /* 우측 정렬 */
 align-items: center;
 gap: 12px;
 margin-bottom: 16px;
 flex-wrap: wrap;
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

/* ---------------------------------------------------- */
/* 🔥 변경된 테이블 컨테이너 및 로딩 스타일 (이전 SponsorshipPlanApproval.vue에서 가져옴) */
/* ---------------------------------------------------- */

.priority-card {
 background: #ffffff;
 border-radius: 12px;
 border: 1px solid #e5e7eb;
 box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
 padding: 12px 16px; /* apv-table-wrap 대신 사용 */
}

.priority-loading {
 font-size: 13px;
 color: #6b7280;
 padding: 8px 4px; /* apv-empty와 유사하지만 로딩 전용 */
}

.priority-table {
 width: 100%;
 border-collapse: collapse;
 font-size: 13px;
 /* apv-table 대신 사용 */
}


/* apv-table의 스타일을 priority-table로 재정의 */
.priority-table thead {
 background: #f5f7fb;
}

.priority-table th,
.priority-table td {
 padding: 9px 10px;
 border-bottom: 1px solid #edf2f7;
 text-align: center;
}

.priority-table th {
 font-weight: 600;
 color: #4a5568;
 white-space: nowrap;
}

.priority-table tbody tr:hover {
 background: #f9fbff;
}

.apv-empty { /* 빈 데이터 메시지는 기존 클래스 유지 */
 text-align: center;
 padding: 14px 0;
 color: #6b7280;
}

.click-row {
 cursor: pointer;
}
.click-row:hover {
 background-color: #eef3ff;
}


/* 🔥 테이블 레이아웃/정렬 스타일 (이전과 동일하게 유지) */

/* 프로그램명 컬럼만 중앙 정렬 재정의 */
.priority-table td:nth-child(2) {
 text-align: center !important;
}

/* 금액 관련 컬럼 오른쪽 정렬 (4~7번째 컬럼) */
.priority-table td:nth-child(4),
.priority-table td:nth-child(5),
.priority-table td:nth-child(6),
.priority-table td:nth-child(7) {
 text-align: right !important;
}

/* 금액 관련 컬럼 헤더 중앙 정렬 */
.priority-table th:nth-child(4),
.priority-table th:nth-child(5),
.priority-table th:nth-child(6),
.priority-table th:nth-child(7) {
 text-align: center !important;
}

/* 컬럼별 너비 조절 */
.priority-table th:nth-child(1),
.priority-table td:nth-child(1) {
 width: 12%;
}

.priority-table th:nth-child(2),
.priority-table td:nth-child(2) {
 width: 13%;
}

.priority-table th:nth-child(3),
.priority-table td:nth-child(3) {
 width: 16%;
}

.priority-table td:nth-child(4),
.priority-table td:nth-child(5),
.priority-table td:nth-child(6),
.priority-table td:nth-child(7) {
 width: 13%;
}
</style>