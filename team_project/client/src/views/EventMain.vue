<template>
  <div class="event-main">
    <h2>이벤트 메인페이지</h2>
    <button @click="goToEventAdd()" style="cursor: pointer">이벤트 등록</button>
    <div class="cards">
      <div
        class="card"
        v-for="event in events"
        :key="event.event_code"
        @click="goToEventInfo(event.event_code)"
        style="cursor: pointer"
      >
        <div class="card-image">
          <img
            v-if="event.file_path"
            :src="event.file_path"
            alt="이벤트 이미지"
          />
          <div v-else class="no-image">이미지 없음</div>
        </div>
        <div class="card-content">
          <h3>{{ event.event_name }}</h3>
          <p>
            시행기간: {{ formatDate(event.event_start_date) }} ~
            {{ formatDate(event.event_end_date) }}
          </p>
          <p>
            모집기간: {{ formatDate(event.recruit_start_date) }} ~
            {{ formatDate(event.recruit_end_date) }}
          </p>
          <p>
            신청인원/모집인원: {{ event.total_sub_recruit_count }} /
            {{ event.max_participants }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import { useRouter } from "vue-router";

const router = useRouter();

const goToEventAdd = () => {
  router.push({ name: "EventAdd" });
};

const goToEventInfo = (event_code) => {
  router.push({ name: "EventInfo", query: { code: event_code } });
};

const events = ref([]);

const fetchEvents = async () => {
  try {
    const res = await axios.get("/api/event"); // 백엔드에서 위 쿼리 결과 반환
    events.value = res.data.data;
  } catch (err) {
    console.error("이벤트 메인 조회 실패", err);
  }
};

// 날짜 포맷
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return dateFormat(dateStr, "yyyy-MM-dd");
};

onMounted(() => {
  fetchEvents();
});
</script>

<style scoped>
.event-main {
  max-width: 1200px;
  margin: 20px auto;
}
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.card {
  width: 280px;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.card-image {
  width: 100%;
  height: 180px;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.card-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}
.no-image {
  color: #888;
  font-size: 14px;
}
.card-content {
  padding: 12px;
}
.card-content h3 {
  margin: 0 0 8px;
  font-size: 18px;
}
.card-content p {
  margin: 4px 0;
  font-size: 14px;
}
</style>
