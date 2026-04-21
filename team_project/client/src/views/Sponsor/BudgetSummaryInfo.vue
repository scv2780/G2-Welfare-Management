<template>
  <div class="summary-info-container">
    <!-- 제목 -->
    <h2 class="title">후원금 상세 사용 내역</h2>

    <!-- 요약 정보 -->
    <div v-if="header" class="summary-box">
      <div class="summary-header">
        <h3>{{ header.program_name }}</h3>
        <!-- <button class="btn-back" @click="goDetail()">← 목록으로</button> -->

        <MaterialButton
          color="dark"
          size="sm"
          variant="outlined"
          @click="goDetail()"
        >
          ← 목록으로
        </MaterialButton>
      </div>

      <div class="summary-grid">
        <div class="item">
          <label>총 모금액</label>
          <p>{{ numberFormat(header.totalDonation) }} 원</p>
        </div>

        <div class="item">
          <label>총 사용 금액</label>
          <p>{{ numberFormat(header.totalUsedAmount) }} 원</p>
        </div>

        <div class="item">
          <label>잔액</label>
          <p>{{ numberFormat(header.remainder) }} 원</p>
        </div>
      </div>
    </div>

    <!-- 상세 사용 내역 -->
    <h3 class="sub-title">사용 내역</h3>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>사용일자</th>
            <th>사용항목</th>
            <th>사용처</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in list" :key="idx">
            <td>{{ dateFormat(row.used_at, "yyyy-MM-dd") }}</td>
            <td>{{ row.usage_item }}</td>
            <td>{{ row.recipient }}</td>
            <td>{{ numberFormat(row.amount) }} 원</td>
          </tr>

          <tr v-if="list.length === 0">
            <td colspan="4" class="empty">사용 내역이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import numberFormat from "@/utils/numberFormat";
import { useRouter } from "vue-router";
import MaterialButton from "@/components/MaterialButton.vue";

const router = useRouter();
const props = defineProps({
  programCode: String,
});
const list = ref([]);
const header = ref(null);

// 상세 조회 API
const loadDetail = async (programCode) => {
  try {
    const res = await axios.get(
      `/api/sponsor/summaryStatementList/${programCode}`
    );
    console.log(programCode);
    const data = res.data.serviceSponsor;

    if (data.length === 0) {
      list.value = [];
      header.value = null;
      return;
    }

    // 상단 요약 정보 (모든 row가 동일)
    header.value = {
      program_name: data[0].program_name,
      totalDonation: data[0].totalDonation,
      totalUsedAmount: data[0].totalUsedAmount,
      remainder: data[0].remainder,
    };

    // 상세 내역 리스트
    list.value = data.map((item) => ({
      used_at: item.used_at,
      usage_item: item.usage_item,
      recipient: item.recipient,
      amount: item.amount,
    }));
  } catch (err) {
    console.error("상세조회 오류:", err);
  }
};

// 초기 로딩
onMounted(() => {
  loadDetail(props.programCode);
});

const goDetail = () => {
  router.push(`/budget-summary`);
};
</script>

<style scoped>
.summary-info-container {
  max-width: 900px;
  margin: 24px auto;
  padding: 0 16px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
}

.summary-box {
  background: #f7f9fc;
  padding: 18px;
  border-radius: 12px;
  margin-bottom: 28px;
  border: 1px solid #e2e7f0;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.btn-back {
  border: 1px solid #7ea6f6;
  background: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #315fbf;
  font-size: 12px;
}
.btn-back:hover {
  background: #eef3ff;
}

.summary-grid {
  margin-top: 12px;
  display: flex;
  gap: 24px;
}

.summary-grid .item label {
  font-size: 13px;
  color: #666;
}

.summary-grid .item p {
  margin-top: 4px;
  font-size: 16px;
  font-weight: 600;
}

.sub-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.table-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e7f0;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background: #f5f7fb;
  padding: 10px;
  font-weight: 600;
  color: #4a5568;
}

.data-table td {
  padding: 10px;
  border-bottom: 1px solid #edf2f7;
}

.data-table tbody tr:hover {
  background: #f9fbff;
}

.empty {
  text-align: center;
  padding: 14px 0;
  color: #6b7280;
}
</style>
