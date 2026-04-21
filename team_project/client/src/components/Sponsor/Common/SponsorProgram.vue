<template>
  <div class="program-container">
    <!-- --------------------- -->
    <!-- 📌 상단 탭 영역 -->
    <!-- --------------------- -->
    <div class="tab-area">
      <span
        :class="['tab-item', activeTab === 'ongoing' ? 'active' : '']"
        @click="activeTab = 'ongoing'"
      >
        진행 중인 캠페인
      </span>

      <span
        :class="['tab-item', activeTab === 'ended' ? 'active' : '']"
        @click="activeTab = 'ended'"
      >
        종료 된 캠페인
      </span>
    </div>

    <hr class="divider" />

    <!-- --------------------- -->
    <!-- 📌 검색창 + 전체 개수 -->
    <!-- --------------------- -->
    <div class="search-area">
      <div class="total-count">전체 {{ finalList.length }}</div>

      <div class="search-box">
        <input type="text" placeholder="검색어 입력" v-model="searchKeyword" />
      </div>
    </div>

    <!-- --------------------- -->
    <!-- 카드형 리스트 -->
    <!-- --------------------- -->
    <div class="card-list">
      <div
        class="card-item"
        v-for="item in finalList"
        :key="item.program_code"
        @click="selectCampaign(item)"
      >
        <!-- 이미지 -->
        <img class="thumbnail" :src="getThumbnail(item)" alt="thumbnail" />

        <div class="card-content">
          <div class="badge">{{ item.status }}</div>

          <div class="title">{{ item.program_name }}</div>

          <div class="summary">
            {{ formatDate(item.start_date, "yyyy-MM-dd") }} ~
            {{ formatDate(item.end_date, "yyyy-MM-dd") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import dateFormat from "@/utils/dateFormat";
import { useRouter } from "vue-router";
// import NO_IMAGE from "@/assets/img/noimage.png";

const router = useRouter();
// -------------------------------
// 상태값
// -------------------------------
const activeTab = ref("ongoing"); // ongoing / ended
const searchKeyword = ref("");

// 전체 프로그램 목록
const campaignList = ref([]);

// 대표 이미지 저장 (program_code → file_path)
const thumbnailMap = ref({});
const NO_IMAGE = "/img/noimage.png";
// -------------------------------
// 단건 조회 → 상세 페이지로 이동
// -------------------------------
const selectCampaign = (program) => {
  // 1. 라우트 이름('SponsorDetail' 등)과 params를 이용한 이동 (권장)
  router.push({
    name: "SponsorDetail", // 라우터에 정의한 name
    params: { programCode: program.program_code },
  });

  // 2. 경로 문자열을 이용한 이동 (간단하지만 name 사용이 더 유연함)
  // router.push(`/sponsordetail/${program.program_code}`);
};
// -------------------------------
// 대표 이미지 로딩
// -------------------------------
const loadThumbnail = async (programCode) => {
  try {
    const res = await axios.get(`/api/sponsor/${programCode}`);

    const attachments = res.data.serviceSponsor.attachments;

    if (attachments && attachments.length > 0) {
      // 첫 번째 이미지를 대표 이미지로 사용
      thumbnailMap.value[programCode] = attachments[0].file_path;
    } else {
      thumbnailMap.value[programCode] = NO_IMAGE;
    }
  } catch (e) {
    console.error("대표 이미지 로딩 실패:", e);
    thumbnailMap.value[programCode] = NO_IMAGE;
  }
};

// 화면에 출력할 이미지 가져오기
const getThumbnail = (program) => {
  return thumbnailMap.value[program.program_code] || NO_IMAGE;
};

// -------------------------------
// 전체 리스트 조회
// -------------------------------
const getCampaignList = async () => {
  try {
    const result = await axios.get("/api/sponsor/");

    if (!result || !result.data) {
      campaignList.value = [];
      return;
    }

    campaignList.value = result.data.serviceSponsor;

    // 프로그램별 대표 이미지 로딩
    for (const program of campaignList.value) {
      loadThumbnail(program.program_code);
    }
  } catch (e) {
    console.error("캠페인 조회 실패:", e);
  }
};

// -------------------------------
// 탭 필터
// -------------------------------
const filteredListByTab = computed(() => {
  return campaignList.value.filter((item) => {
    if (activeTab.value === "ongoing") {
      return item.status === "진행중" || item.status === "진행중";
    } else {
      return item.status === "완료" || item.status === "중단";
    }
  });
});

// -------------------------------
// 검색 기능
// -------------------------------
const finalList = computed(() => {
  const kw = searchKeyword.value.trim();
  if (!kw) return filteredListByTab.value;

  return filteredListByTab.value.filter((item) =>
    item.program_name.includes(kw)
  );
});

// -------------------------------
// 단건 조회 → 상위 컴포넌트 전달
// -------------------------------
// const emit = defineEmits(["select-program"]);

// const selectCampaign = async (program) => {
//   try {
//     const res = await axios.get(`/api/sponsor/${program.program_code}`);

//     const programDetail = res.data.serviceSponsor.sponsorRows[0];
//     const attachments = res.data.serviceSponsor.attachments;

//     emit("select-program", {
//       ...programDetail,
//       attachments,
//     });
//   } catch (e) {
//     console.error("단건 조회 실패:", e);
//   }
// };

// -------------------------------
// 날짜 포맷
// -------------------------------
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return dateFormat(dateStr, "yyyy.MM.dd");
};

// -------------------------------
// mount 시 전체 목록 로드
// -------------------------------
onMounted(() => {
  getCampaignList();
});
</script>

<style scoped>
.program-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

/* ------------------- */
/* 탭 영역 */
/* ------------------- */
.tab-area {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.tab-item {
  font-size: 20px;
  font-weight: bold;
  color: #777;
  cursor: pointer;
}

.tab-item.active {
  color: #000;
  border-bottom: 3px solid #000;
}

.divider {
  margin: 10px 0 20px 0;
  border: none;
  height: 1px;
  background: #ddd;
}

/* ------------------- */
/* 검색 + 카운트 */
/* ------------------- */
.search-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-count {
  font-weight: bold;
}

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

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

/* ------------------- */
/* 카드 리스트 */
/* ------------------- */
.card-list {
  margin-top: 20px;
}

.card-item {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 15px 0;
  cursor: pointer;
}

.card-item:hover {
  background: #fafafa;
}

.thumbnail {
  width: 200px;
  height: 140px;
  object-fit: cover;
  border-radius: 10px;
}

.card-content {
  margin-left: 20px;
  flex: 1;
}

.badge {
  display: inline-block;
  background: #d9534f;
  color: white;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 13px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  margin-top: 8px;
}

.summary {
  color: #555;
  margin-top: 5px;
}
</style>
