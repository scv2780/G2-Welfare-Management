<template>
  <div class="event-list">
    <!-- 상단: 이벤트 목록 제목 + 이벤트 등록 버튼 -->
    <div class="top-bar">
      <h2>이벤트 목록</h2>
      <div v-if="isManager" class="add-event-wrapper">
        <MaterialButton
          color="dark"
          size="sm"
          class="px-4"
          @click="goToEventAdd()"
        >
          이벤트 등록
        </MaterialButton>
      </div>
    </div>

    <!-- 검색 조건 -->
    <div class="search-form">
      <!-- 모집기간 -->
      <div class="form-field">
        <label>모집기간</label>
        <div class="field-inputs">
          <input
            type="date"
            v-model="filters.recruit_start_date"
            placeholder="시작일"
          />
          <span>~</span>
          <input
            type="date"
            v-model="filters.recruit_end_date"
            placeholder="종료일"
          />
        </div>
      </div>

      <!-- 시행기간 -->
      <div class="form-field">
        <label>시행기간</label>
        <div class="field-inputs">
          <input
            type="date"
            v-model="filters.event_start_date"
            placeholder="시작일"
          />
          <span>~</span>
          <input
            type="date"
            v-model="filters.event_end_date"
            placeholder="종료일"
          />
        </div>
      </div>

      <div class="form-field">
        <label>이벤트명</label>
        <input
          type="text"
          v-model="filters.event_name"
          placeholder="이벤트명"
        />
      </div>

      <div class="form-actions">
        <MaterialButton
          color="dark"
          size="sm"
          class="material-button"
          @click="resetFilters"
        >
          초기화
        </MaterialButton>
      </div>
    </div>

    <!-- 카드 목록 -->
    <div class="cards">
      <div
        class="card"
        v-for="event in events"
        :key="event.event_code"
        @click="goToEventInfo(event.event_code)"
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
            모집기간: {{ formatDate(event.recruit_start_date) }} ~
            {{ formatDate(event.recruit_end_date) }}
          </p>
          <p>
            시행기간: {{ formatDate(event.event_start_date) }} ~
            {{ formatDate(event.event_end_date) }}
          </p>
          <p>
            신청인원/모집인원: {{ event.total_event_count }} /
            {{ event.max_participants }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import dateFormat from "@/utils/dateFormat";
import { useRouter } from "vue-router";
import MaterialButton from "@/components/MaterialButton.vue";

const router = useRouter();

const getLoginRole = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const data = JSON.parse(userStr);
    return data.role || null;
  } catch {
    return null;
  }
};
const loginRole = ref(getLoginRole());
const isManager = computed(() => loginRole.value === "AA2");

const getLoginOrgCode = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    const data = JSON.parse(userStr);
    return data.org_code || null;
  } catch {
    return null;
  }
};
const loginOrgCode = ref(getLoginOrgCode());

const goToEventAdd = () => {
  router.push({ name: "EventAdd" });
};

const goToEventInfo = (event_code) => {
  if (!event_code) return;
  router.push({
    name: "EventInfo",
    params: { eventCode: event_code },
  });
};

const events = ref([]);
const filters = ref({
  recruit_status: "",
  recruit_start_date: "",
  recruit_end_date: "",
  event_start_date: "",
  event_end_date: "",
  event_name: "",
});

const fetchEvents = async () => {
  try {
    const query = new URLSearchParams(filters.value).toString();
    const res = await axios.get(`/api/event/list?${query}`);
    events.value = res.data.data;

    // 로그인 역할이 AA4가 아니면 org_code 필터 적용
    if (loginRole.value !== "AA4") {
      events.value = events.value.filter(
        (event) => event.org_code === loginOrgCode.value
      );
    }

    // 각 이벤트별 신청인원 가져오기
    const promises = events.value.map(async (event) => {
      try {
        const applyRes = await axios.get(
          `/api/event/applyCount?event_code=${event.event_code}`
        );
        if (applyRes.data.status === "success") {
          // total_event_count 합치기
          const totalCount =
            applyRes.data.data.reduce(
              (sum, item) => sum + (item.current_count || 0),
              0
            ) || 0;
          return { ...event, total_event_count: totalCount };
        } else {
          return { ...event, total_event_count: 0 };
        }
      } catch {
        return { ...event, total_event_count: 0 };
      }
    });

    events.value = await Promise.all(promises);
  } catch (err) {
    console.error("이벤트 메인 조회 실패", err);
  }
};

const resetFilters = () => {
  filters.value = {
    recruit_status: "",
    recruit_start_date: "",
    recruit_end_date: "",
    event_start_date: "",
    event_end_date: "",
    event_name: "",
    register_status: "",
  };
  fetchEvents();
};

watch(filters, fetchEvents, { deep: true });

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return dateFormat(dateStr, "yyyy-MM-dd");
};

onMounted(() => {
  fetchEvents();
});
</script>

<style scoped>
.event-list {
  max-width: 1500px;
  margin: 30px auto;
  padding: 16px;
  font-family: "Noto Sans KR", sans-serif;
}

/* 상단 바: 제목 + 버튼 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.top-bar h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 이벤트 등록 버튼 */
.add-event-wrapper {
  display: flex;
  justify-content: flex-end;
}

/* 검색 폼 */
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 24px;
  background-color: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-field {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  flex: 1 1 200px;
}

.form-field label {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px;
}

.field-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-inputs input[type="date"],
.form-field input[type="text"] {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  outline: none;
  flex: 1;
}

.field-inputs span {
  white-space: nowrap;
}

/* 초기화 버튼 */
.form-actions .material-button {
  height: 42px;
  line-height: 42px;
  padding: 0 20px;
  font-size: 14px;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

/* 카드 레이아웃 */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.card {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-image {
  width: 100%;
  height: 160px;
  background-color: #f3f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: #9ca3af;
  font-size: 14px;
}

.card-content {
  padding: 16px;
}

.card-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-content p {
  margin: 4px 0;
  font-size: 14px;
  color: #4b5563;
}

/* 모바일 대응 */
@media (max-width: 640px) {
  .search-form {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .form-actions .material-button {
    height: 42px !important;
    line-height: 42px !important;
    padding: 0 16px !important;
    font-size: 14px !important;
    border-radius: 6px !important;
  }

  .card-content h3 {
    font-size: 16px;
  }
}
</style>
