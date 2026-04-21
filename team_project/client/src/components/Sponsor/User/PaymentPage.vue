<template>
  <div class="payment-container">
    <h2 class="page-title">후원 결제</h2>

    <div v-if="isLoading" class="loading-message">
      <p>프로그램 정보를 불러오는 중입니다...</p>
    </div>

    <div v-else class="content-wrapper">
      <div class="program-summary">
        <h3>선택한 프로그램</h3>
        <p v-if="programName">
          <strong>프로그램 이름:</strong> <strong>{{ programName }}</strong>
        </p>
        <p v-else style="color: red">프로그램 정보를 불러올 수 없습니다.</p>
      </div>

      <hr class="payment-divider" />

      <div class="payment-form">
        <div class="input-group">
          <label for="amount">후원 금액 (원)</label>
          <select
            id="amount"
            v-model.number="sponsorAmount"
            :disabled="donationUnitOptions.length === 0"
          >
            <option v-if="donationUnitOptions.length === 0" :value="1">
              금액 옵션 (최소 1원)
            </option>
            <option
              v-for="amount in donationUnitOptions"
              :key="amount"
              :value="amount"
            >
              {{ formatCurrency(amount) }}원
            </option>
          </select>
        </div>

        <div class="input-group">
          <label for="name">후원자 이름</label>
          <input type="text" id="name" v-model="sponsorName" disabled />
        </div>

        <div class="input-group">
          <label for="method">결제 수단 </label>
          <div class="payment-method-box kakao-pay">
            <span class="icon">💳</span>
            <span class="method-name">카카오 페이</span>
            <span class="status">(자동 선택)</span>
          </div>
        </div>
        <div class="total-amount">
          최종 결제 금액: <strong>{{ formatCurrency(sponsorAmount) }}원</strong>
        </div>
      </div>

      <div class="payment-button-area">
        <!-- <button
          class="pay-button"
          @click="processPayment"
          :disabled="!isFormValid"
        >
          {{ formatCurrency(sponsorAmount) }}원 결제하기
        </button> -->
        <MaterialButton
          color="dark"
          size="lg"
          @click="processPayment"
          :disabled="!isFormValid"
        >
          {{ formatCurrency(sponsorAmount) }}원 결제하기
        </MaterialButton>
      </div>
    </div>
  </div>
</template>
<script setup>
import axios from "axios";
import { ref, computed, onMounted, watch } from "vue";
import MaterialButton from "@/components/MaterialButton.vue";

// -------------------------------
// Helper: Local Storage에서 userID 가져오기
// -------------------------------
const getUserIdFromLocalStorage = () => {
  try {
    const userString = localStorage.getItem("user");
    if (userString) {
      const userData = JSON.parse(userString);
      console.log("[DEBUG] 로컬 스토리지 'user' 데이터:", userData);
      // 'user_id' 키로 값을 가져옴
      return userData.user_id || "";
    }
  } catch (e) {
    console.error("Local Storage 'user' 파싱 오류:", e);
    return "";
  }
  console.log("[DEBUG] 로컬 스토리지 'user' 항목 없음.");
  return ""; // 'user' 항목이 없을 경우
};

// -------------------------------
// Props 정의 (programCode를 받음)
// -------------------------------
const props = defineProps({
  programCode: {
    type: String,
    required: true,
  },
});

// -------------------------------
// 상태값
// -------------------------------
const programName = ref("");
const programDetail = ref(null);
const donationUnit = ref("");
const sponsorAmount = ref(1);
const sponsorName = ref(getUserIdFromLocalStorage());
const isLoading = ref(true);

// -------------------------------
// Computed: 후원 금액 옵션 생성
// -------------------------------
const donationUnitOptions = computed(() => {
  if (!donationUnit.value) {
    return [];
  }
  return donationUnit.value
    .split(",")
    .map((unit) => parseInt(unit.trim()))
    .filter((amount) => !isNaN(amount) && amount >= 1)
    .sort((a, b) => a - b);
});

// -------------------------------
// Watcher: sponsorAmount 초기화 및 조정
// -------------------------------
watch(
  donationUnitOptions,
  (newOptions) => {
    // 옵션이 존재할 경우
    if (newOptions.length > 0) {
      // 현재 금액이 옵션에 포함되지 않은 경우, 첫 번째 옵션 금액으로 변경
      if (!newOptions.includes(sponsorAmount.value)) {
        sponsorAmount.value = newOptions[0];
      }
    }
    // 옵션이 전혀 없을 경우, 기본값(1)으로 설정
    else {
      sponsorAmount.value = 1;
    }
  },
  { immediate: true }
);

// -------------------------------
// Computed: 폼 유효성 검사
// -------------------------------
const isFormValid = computed(() => {
  // 금액과 이름(userID)만 확인
  return sponsorAmount.value >= 1 && sponsorName.value.trim() !== "";
});

// -------------------------------
// 함수: 통화 포맷
// -------------------------------
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("ko-KR").format(amount);
};

// -------------------------------
// 함수: 상세 정보 조회
// -------------------------------
const getProgramInfo = async (programCode) => {
  isLoading.value = true;
  try {
    const res = await axios.get(`/api/sponsor/${programCode}`);

    programDetail.value = res.data.serviceSponsor.sponsorRows[0];

    if (programDetail.value) {
      programName.value = programDetail.value.program_name;
      donationUnit.value = programDetail.value.donation_unit || "";
    }
  } catch (e) {
    console.error("결제 정보 로딩 실패:", e);
    programName.value = "정보 로딩 실패";
  } finally {
    isLoading.value = false;
  }
};

// -------------------------------
// 함수: 결제 처리 (카카오페이 ready 요청)
// -------------------------------
const processPayment = async () => {
  // [DEBUG] 카카오페이 Ready 요청 데이터 확인
  console.log("[DEBUG] 카카오페이 Ready 요청 데이터:", {
    program_code: programDetail.value.program_code,
    userID: sponsorName.value,
    amount: sponsorAmount.value,
    item_name: programName.value,
  });

  try {
    const res = await axios.post("/api/pay/kakao/ready", {
      program_code: programDetail.value.program_code,
      userID: sponsorName.value,
      amount: sponsorAmount.value,
      item_name: programName.value,
      origin: window.location.origin,
    });
    console.log("카카오페이 ready 응답:", res.data);

    // [수정/확인] tid가 응답에 포함되어 있는지 확인 후 저장
    if (!res.data.tid) {
      throw new Error("카카오페이 서버로부터 TID를 받지 못했습니다.");
    }
    // ✅ 응답 존재 확인
    if (!res.data) {
      throw new Error("서버 응답이 비어있습니다.");
    }

    // ✅ TID 존재 확인
    if (!res.data.tid) {
      throw new Error("TID를 받지 못했습니다.");
    }

    // ✅ Redirect URL 존재 확인
    if (!res.data.next_redirect_pc_url) {
      throw new Error("결제창 URL을 받지 못했습니다.");
    }
    // tid 저장 → approve 때 필요
    localStorage.setItem(
      "kakao_tid",
      JSON.stringify({
        tid: res.data.tid,
        code: programDetail.value.program_code,
      })
    );
    console.log("[DEBUG] 로컬 스토리지에 'kakao_tid' 저장 완료.");

    // 카카오페이 결제창으로 이동
    const redirectUrl = res.data.next_redirect_pc_url;
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      alert("카카오페이 결제창 URL을 불러올 수 없습니다.");
    }
  } catch (error) {
    console.error(
      "카카오페이 결제 준비 오류:",
      error.response?.data || error.message || error
    );
    alert("결제 준비 중 오류가 발생했습니다.");
  }
};

// -------------------------------
// mount 시 초기 데이터 로딩
// -------------------------------
onMounted(() => {
  getProgramInfo(props.programCode);
});
</script>
<style scoped>
/* 기존 스타일 유지 */
.payment-container {
  max-width: 600px;
  margin: 30px auto;
  padding: 30px;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.page-title {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
  font-size: 24px;
  border-bottom: 3px solid #007bff;
  display: inline-block;
  padding-bottom: 5px;
}

.program-summary {
  background: #eef;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.program-summary h3 {
  margin-top: 0;
  font-size: 18px;
  color: #007bff;
}

.payment-divider {
  border: none;
  height: 1px;
  background: #ddd;
  margin: 20px 0;
}

.payment-form .input-group {
  margin-bottom: 20px;
}

.payment-form label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #555;
}

.payment-form input[type="number"],
.payment-form input[type="text"],
.payment-form select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 16px;
}

/* 🚀 새로 추가/수정된 결제 수단 정보 박스 스타일 */
.payment-method-box {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ddd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.payment-method-box.kakao-pay {
  background-color: #fff9e6; /* 밝은 노란색 배경 */
  border-color: #fee500; /* 카카오페이 경계선 */
  color: #3c1e1e;
}

.payment-method-box .icon {
  font-size: 1.2em;
  margin-right: 10px;
}

.payment-method-box .method-name {
  flex-grow: 1;
  font-weight: 700;
}

.payment-method-box .status {
  font-size: 14px;
  color: #888;
  font-weight: normal;
  background-color: #f2f2f2;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 라벨 스타일은 기본으로 복구 */
.input-group label[for="method"] {
  display: block;
}
/* 🚀 새로 추가/수정된 결제 수단 정보 박스 스타일 끝 */

.total-amount {
  text-align: right;
  font-size: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  margin-top: 20px;
}

.payment-button-area {
  text-align: center;
  margin-top: 40px;
}

.pay-button {
  width: 100%;
  padding: 15px 0;
  font-size: 20px;
  font-weight: bold;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pay-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pay-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
