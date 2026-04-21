<!-- src/views/StaffApprovals.vue -->
<template>
 <div class="apv-page">
  <h2 class="apv-title">전체 후원 내역</h2>


  <!-- 테이블 -->
  <div class="priority-card">
    <!-- 로딩 표시 -->
    <div v-if="loading" class="priority-loading">불러오는 중...</div>
  
    <!-- 목록 테이블 -->
    <table v-else class="priority-table">
   <thead>
    <tr>
     <th>후원일자</th>
     <th>후원자</th>
     <th>후원 금액</th>
     <th>프로그램</th>
     <th>후원 타입</th>
     <th>상태</th>
     <th>시작일</th>
     <th>종료일</th>
     <th>목표 금액</th>
    </tr>
   </thead>
   <tbody>
    <tr v-if="!loading && sponsorList.length === 0">
      <td colspan="10" class="apv-empty">데이터가 없습니다.</td>
    </tr>
    <tr v-for="sponsor in sponsorList" :key="sponsor.program_code">
     <td>{{ dateFormat(sponsor.deposit_date, "yyyy-MM-dd") }}</td>
     <td>{{ sponsor.userID }}</td>
     <td>{{ numberFormat(sponsor.transaction_amount) }}원</td>
     <td>{{ sponsor.program_name }}</td>
     <td>{{ sponsor.sponsor_type }}</td>
     <td>{{ sponsor.status }}</td>
     <td>{{ dateFormat(sponsor.start_date, "yyyy-MM-dd") }}</td>
     <td>{{ dateFormat(sponsor.end_date, "yyyy-MM-dd") }}</td>
     <td>{{ numberFormat(sponsor.goal_amount) }}원</td>
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
import { ref, onBeforeMount } from "vue";

let sponsorList = ref([]);
const loading = ref(false); // loading 상태 추가

const getSponsorList = async () => {
 loading.value = true; // 로딩 시작
 let result = await axios
  .get(`/api/sponsor/mygiving`)
  .catch((err) => console.log(err));

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
</script>

<style scoped>
* {
 font-size: 15px;
}

/* === 최소한의 페이지 레이아웃 스타일 === */
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


/* 🔥 테이블 컨테이너 스타일 */
.priority-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
  padding: 12px 16px; 
  overflow: hidden; 
}

/* 🔥 로딩 스타일 */
.priority-loading {
 font-size: 13px;
 color: #6b7280;
 padding: 8px 4px;
 text-align: center;
}

/* 🔥 테이블 스타일 */
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

.priority-table tbody tr:hover {
 background: #f9fbff;
}


.apv-empty { /* 빈 데이터 메시지 스타일 */
 text-align: center;
 padding: 14px 0;
 color: #6b7280;
}


/* 🔥🔥🔥 정렬 및 너비 규칙 (금액만 우측 정렬) 🔥🔥🔥 */

/* 금액 컬럼 셀(td) 우측 정렬 */
.priority-table td:nth-child(3), /* 후원 금액 */
.priority-table td:nth-child(9) { /* 목표 금액 */
 text-align: right !important;
}

/* 컬럼 너비 지정 (선택적으로 적용) */
.priority-table th:nth-child(1),
.priority-table td:nth-child(1),
.priority-table th:nth-child(8),
.priority-table td:nth-child(8),
.priority-table th:nth-child(9),
.priority-table td:nth-child(9) {
 width: 10%; /* 날짜 컬럼 너비 */
}

.priority-table th:nth-child(3),
.priority-table td:nth-child(3),
.priority-table th:nth-child(10),
.priority-table td:nth-child(10) {
 width: 11%; /* 금액 컬럼 너비 */
}

.priority-table th:nth-child(2),
.priority-table td:nth-child(2) {
 width: 8%; /* 후원자 컬럼 너비 */
}

.priority-table th:nth-child(5),
.priority-table td:nth-child(5),
.priority-table th:nth-child(6),
.priority-table td:nth-child(6) {
 width: 7%; /* 후원 타입, 상태 컬럼 너비 */
}

</style>

