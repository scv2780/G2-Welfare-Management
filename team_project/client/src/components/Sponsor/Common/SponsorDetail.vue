<template>
  <div class="detail-container">
    <div v-if="isLoading" class="loading-message">
      <p>프로그램 상세 정보를 불러오는 중입니다...</p>
    </div>
    <div v-else-if="error" class="error-message">
      <p>상세 정보를 불러오는 데 실패했습니다. 다시 시도해 주세요.</p>
    </div>

    <div v-else-if="programDetail" class="content-area">
      <h1 class="program-title">{{ programDetail.program_name }}</h1>
      <p class="summary-text">{{ programDetail.summary }}</p>

      <hr class="section-divider" />

      <div class="info-table">
        <div class="info-row">
          <span class="label">진행 기간</span>
          <span class="value">
            {{ formatDate(programDetail.start_date) }} ~
            {{ formatDate(programDetail.end_date) }}
          </span>
        </div>
      </div>

      <hr class="section-divider" />

      <div class="image-area">
        <img
          v-for="(attachment, index) in attachments"
          :key="index"
          :src="attachment.file_path"
          alt="프로그램 상세 이미지"
          class="detail-image"
        />
        <p v-if="attachments.length === 0" class="no-image-text">
          등록된 이미지가 없습니다.
        </p>
      </div>

      <div class="description-area" v-html="programDetail.description"></div>

      <hr class="section-divider" />

      <div class="button-area">
        <button
          class="sponsor-button"
          @click="goToPayment"
          :disabled="programDetail.status !== '진행중'"
        >
          {{
            programDetail.status === "진행중" ? "지금 후원하기" : "후원 종료"
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import dateFormat from "@/utils/dateFormat"; // 기존 유틸리티 사용 가정

// -------------------------------
// Props 정의 (라우터 파라미터: programCode를 받음)
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
const router = useRouter();
const programDetail = ref(null);
const attachments = ref([]); // 첨부 파일 (이미지) 목록
const isLoading = ref(true);
const error = ref(false);

// -------------------------------
// 상세 정보 조회
// -------------------------------
const getProgramDetail = async () => {
  isLoading.value = true;
  error.value = false;
  try {
    // API 호출 (목록 조회 시 사용했던 API와 동일)
    console.log(props.programCode);
    const res = await axios.get(`/api/sponsor/${props.programCode}`);
    programDetail.value = res.data.serviceSponsor.sponsorRows[0];
    attachments.value = res.data.serviceSponsor.attachments || []; // 첨부 파일 배열
  } catch (e) {
    console.error("후원 상세 정보 조회 실패:", e);
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

// -------------------------------
// 후원 결제 페이지로 이동
// -------------------------------
const goToPayment = () => {
  // 'SponsorPayment'는 이전에 제안했던 결제 페이지의 라우트 이름입니다.
  // 라우터 설정 시 'programCode' 파라미터를 그대로 전달합니다.
  router.push({
    name: "PaymentPage",
    params: { programCode: props.programCode },
  });
};

// -------------------------------
// 날짜 포맷 함수
// -------------------------------
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return dateFormat(dateStr, "yyyy.MM.dd");
};

// -------------------------------
// 컴포넌트 마운트 시 데이터 로드
// -------------------------------
onMounted(() => {
  getProgramDetail();
});
</script>

<style scoped>
.detail-container {
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 제목 및 요약 */
.program-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}

.summary-text {
  color: #555;
  font-size: 16px;
  margin-bottom: 20px;
}

.section-divider {
  border: none;
  height: 1px;
  background: #eee;
  margin: 25px 0;
}

/* 정보 테이블 */
.info-table {
  border-top: 2px solid #333;
  border-bottom: 1px solid #ddd;
}

.info-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.label {
  width: 120px;
  font-weight: 600;
  color: #333;
}

.value {
  flex: 1;
  color: #555;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
}

.status-badge.ongoing {
  background-color: #5cb85c; /* Green */
  color: white;
}

.status-badge.ended {
  background-color: #d9534f; /* Red */
  color: white;
}

/* 이미지 영역 */
.image-area {
  margin-bottom: 30px;
  text-align: center;
}

.detail-image {
  width: 100%;
  max-height: 450px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 15px;
}

.no-image-text {
  color: #999;
  font-style: italic;
  padding: 20px;
  border: 1px dashed #ccc;
  border-radius: 5px;
}

/* 설명 영역 (v-html 사용 시 기본 스타일) */
.description-area {
  line-height: 1.6;
  color: #444;
  min-height: 100px; /* 내용이 적을 때를 대비 */
}

/* 버튼 영역 */
.button-area {
  text-align: center;
  margin-top: 30px;
}

.sponsor-button {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  background-color: #007bff; /* Blue */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  max-width: 300px;
}

.sponsor-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.sponsor-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
