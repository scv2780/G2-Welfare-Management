<template>
  <div class="event-form">
    <h2>이벤트 {{ isUpdated ? "수정" : "등록" }}</h2>
    <form @submit.prevent="submitForm">
      <!-- 기본 정보 -->
      <div class="card">
        <h3>기본 정보</h3>
        <div class="grid-2">
          <div>
            <label>이벤트 타입</label>
            <select v-model="eventInfo.event_type" required>
              <option value="DD1">신청제</option>
              <option value="DD2">예약제</option>
            </select>
          </div>
          <div>
            <label>이벤트 이름</label>
            <input type="text" v-model="eventInfo.event_name" required />
          </div>
          <div>
            <label>등록일</label>
            <input type="date" v-model="formattedRegisterDate" readonly />
          </div>
          <div>
            <label>이벤트 장소</label>
            <input type="text" v-model="eventInfo.event_location" required />
          </div>
          <div>
            <label>대상</label>
            <input type="text" v-model="eventInfo.target_audience" required />
          </div>
          <div>
            <label>최대 참여자</label>
            <input type="number" v-model="eventInfo.max_participants" />
          </div>

          <!-- 모집 기간 -->
          <div>
            <label>모집 시작일</label>
            <input
              type="date"
              v-model="eventInfo.recruit_start_date"
              :min="dateFormat(today, 'yyyy-MM-dd')"
              required
            />
          </div>
          <div>
            <label>모집 종료일</label>
            <input
              type="date"
              v-model="eventInfo.recruit_end_date"
              :min="eventInfo.recruit_start_date"
              required
            />
          </div>

          <!-- 이벤트 시행 기간 -->
          <!-- 신청제 -->
          <div v-if="eventInfo.event_type === 'DD1'">
            <label>이벤트 시작일</label>
            <input
              type="datetime-local"
              v-model="eventInfo.event_start_date"
              :min="getNextDayTime(eventInfo.recruit_end_date)"
              required
            />
          </div>
          <div v-if="eventInfo.event_type === 'DD1'">
            <label>이벤트 종료일</label>
            <input
              type="datetime-local"
              v-model="eventInfo.event_end_date"
              :min="eventInfo.event_start_date"
              required
            />
          </div>

          <!-- 예약제 -->
          <div v-if="eventInfo.event_type === 'DD2'">
            <label>이벤트 시작일</label>
            <input
              type="date"
              v-model="eventInfo.event_start_date"
              :min="getNextDay(eventInfo.recruit_end_date)"
              required
            />
          </div>
          <div v-if="eventInfo.event_type === 'DD2'">
            <label>이벤트 종료일</label>
            <input
              type="date"
              v-model="eventInfo.event_end_date"
              :min="eventInfo.event_start_date"
              required
            />
          </div>
        </div>
      </div>

      <!-- 내용 -->
      <div class="card">
        <h3>내용</h3>
        <textarea
          v-model="eventInfo.event_content"
          rows="5"
          required
        ></textarea>
      </div>

      <!-- 세부 예약 이벤트 -->
      <div v-if="eventInfo.event_type === 'DD2'" class="card">
        <h3>세부 예약 이벤트</h3>
        <div v-for="(item, index) in eventTimes" :key="index" class="time-item">
          <div class="grid-2">
            <div>
              <label>세부 이벤트명</label>
              <input
                type="text"
                v-model="item.name"
                placeholder="세부 이벤트명 입력"
                required
              />
            </div>
            <div>
              <label>최대 참여자</label>
              <input
                type="number"
                v-model="item.max_participants"
                placeholder="인원"
                required
              />
            </div>
            <div>
              <label>시작일 + 시간</label>
              <input
                type="datetime-local"
                v-model="item.start"
                :min="eventInfo.event_start_date + 'T00:00'"
                :max="eventInfo.event_end_date + 'T00:00'"
                required
              />
            </div>
            <div>
              <label>종료일 + 시간</label>
              <input
                type="datetime-local"
                v-model="item.end"
                :min="item.start"
                :max="eventInfo.event_end_date + 'T00:00'"
                required
              />
            </div>
          </div>
          <button type="button" class="btn-danger" @click="removeTime(index)">
            삭제
          </button>
        </div>
        <button type="button" class="btn-primary" @click="addTime">추가</button>
      </div>

      <!-- 첨부파일 -->
      <div class="card">
        <h3>첨부파일</h3>
        <input
          type="file"
          multiple
          @change="handleFileChange"
          class="file-input"
        />
        <ul>
          <li v-for="(file, index) in eventInfo.attachments" :key="index">
            {{ file.name }}
            <button type="button" class="btn-danger" @click="removeFile(index)">
              삭제
            </button>
          </li>
        </ul>
      </div>

      <!-- 서브 매니저 -->
      <div class="card">
        <div class="sub-manager-header">
          <h3>서브 매니저</h3>
          <button type="button" class="btn-primary" @click="addSubManager">
            추가
          </button>
        </div>
        <div
          v-for="(manager, index) in eventInfo.sub_managers"
          :key="index"
          class="sub-manager-item"
        >
          <select v-model="manager.user_code">
            <option disabled value="">매니저 선택</option>
            <option
              v-for="m in filteredManagerList"
              :key="m.user_code"
              :value="m.user_code"
            >
              {{ m.name }}
            </option>
          </select>

          <button
            type="button"
            class="btn-danger"
            @click="removeSubManager(index)"
          >
            삭제
          </button>
        </div>
      </div>

      <!-- 등록 버튼 -->
      <div class="submit-wrapper">
        <button type="submit" class="btn-submit">
          {{ isUpdated ? "수정" : "등록" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount, onMounted } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import dateFormat from "@/utils/dateFormat";

const user_code = JSON.parse(localStorage.getItem("user") || "{}").user_code;
const org_code = JSON.parse(localStorage.getItem("user") || "{}").org_code;

const route = useRoute();
const router = useRouter();

const today = new Date();
today.setHours(0, 0, 0, 0);

// 다음날 계산 함수
const getNextDay = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  d.setDate(d.getDate() + 1);
  return dateFormat(d, "yyyy-MM-dd");
};

// 다음날 + 시간 계산 함수
const getNextDayTime = (dateString) => {
  if (!dateString) return "";

  const d = new Date(dateString);
  d.setDate(d.getDate() + 1);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const eventInfo = ref({
  event_code: "",
  org_code: org_code,
  user_code: user_code,
  event_type: "DD1",
  event_name: "",
  event_content: "",
  event_register_date: new Date(),
  event_location: "",
  target_audience: "",
  max_participants: 0,
  recruit_start_date: "",
  recruit_end_date: "",
  event_start_date: "",
  event_end_date: "",
  recruit_status: "DC1",
  register_status: "BA1", // 요청
  attachments: [],
  sub_managers: [],
});

const eventTimes = ref([]);
const isUpdated = ref(false);
const formattedRegisterDate = computed(() =>
  dateFormat(eventInfo.value.event_register_date, "yyyy-MM-dd")
);

const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  eventInfo.value.attachments.push(...files);
};
const removeFile = (index) => eventInfo.value.attachments.splice(index, 1);

const addSubManager = () =>
  eventInfo.value.sub_managers.push({ user_code: "" });
const removeSubManager = (index) =>
  eventInfo.value.sub_managers.splice(index, 1);

const addTime = () => {
  eventTimes.value.push({
    name: "",
    max_participants: 0,
    start: "",
    end: "",
  });
};
const removeTime = (index) => eventTimes.value.splice(index, 1);

// 서브매니저 선택 조건
const filteredManagerList = computed(() => {
  return managerList.value.filter(
    (m) =>
      m.user_code !== user_code && // 본인 제외
      m.org_code === org_code // 같은 기관 매니저만
  );
});

// 세부 이벤트 총 참여자 합계 계산
const totalSubParticipants = computed(() =>
  eventTimes.value.reduce(
    (sum, e) => sum + (Number(e.max_participants) || 0),
    0
  )
);

// 등록/수정
const submitForm = async () => {
  // ✅ 최대 참여자 1명 이상 체크
  if (
    !eventInfo.value.max_participants ||
    Number(eventInfo.value.max_participants) < 1
  ) {
    alert("이벤트 최대 참여자는 최소 1명 이상이어야 합니다.");
    return;
  }

  // ✅ 예약제일 때 세부 이벤트 최소 1개 이상 체크
  if (eventInfo.value.event_type === "DD2") {
    if (eventTimes.value.length === 0) {
      alert("예약제 이벤트는 최소 1개의 세부 이벤트를 등록해야 합니다.");
      return;
    }

    // 각 세부 이벤트 필수 입력 체크
    for (const item of eventTimes.value) {
      if (!item.name || !item.start || !item.end) {
        alert(`세부 이벤트 모든 항목을 입력해야 합니다.`);
        return;
      }

      if (Number(item.max_participants) < 1) {
        alert(`세부 이벤트 최대 참여자는 최소 1명 이상이어야 합니다.`);
        return;
      }
    }

    // ✅ 세부 이벤트 인원 합계 체크
    if (totalSubParticipants.value > Number(eventInfo.value.max_participants)) {
      alert(
        `세부 이벤트 총 인원(${totalSubParticipants.value}명)이 이벤트 최대 인원(${eventInfo.value.max_participants}명)을 초과했습니다.`
      );
      return;
    }
  }
  try {
    const formData = new FormData();

    const eventData = {
      ...eventInfo.value,
      event_register_date: formattedRegisterDate.value,
      sub_events:
        eventInfo.value.event_type === "DD2"
          ? eventTimes.value.map((e) => ({
              sub_event_name: e.name,
              sub_recruit_count: e.max_participants,
              sub_event_start_date: e.start,
              sub_event_end_date: e.end,
            }))
          : [],
    };

    formData.append("eventInfo", JSON.stringify(eventData));
    eventInfo.value.attachments.forEach((file) =>
      formData.append("attachments", file)
    );
    formData.append(
      "sub_managers",
      JSON.stringify(eventInfo.value.sub_managers)
    );

    if (isUpdated.value) {
      await axios.put(`/api/event/${eventInfo.value.event_code}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("이벤트 수정 완료!");
    } else {
      await axios.post("/api/event", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("이벤트 등록 완료!");
    }

    router.push("/event/list");
  } catch (err) {
    console.error(err);
    alert(isUpdated.value ? "수정 실패" : "등록 실패");
  }
};

// 단건 조회
const getEvent = async (eno) => {
  try {
    const result = await axios.get(`/api/event/${eno}`);
    eventInfo.value = result.data.data;

    // DD2 세부 이벤트 처리
    if (eventInfo.value.event_type === "DD2" && eventInfo.value.times) {
      eventTimes.value = [...eventInfo.value.times];
    }
  } catch (err) {
    console.error(err);
  }
};

const managerList = ref([]);

// 매니저 조회
const getManager = async () => {
  try {
    const result = await axios.get(`/api/event/manager`);
    managerList.value = result.data.data;
  } catch (err) {
    console.error(err);
  }
};

onMounted(getManager);

onBeforeMount(async () => {
  const eno = route.query.no;
  if (eno) {
    isUpdated.value = true;
    await getEvent(eno);
  } else {
    eventInfo.value.event_register_date = new Date();
  }
});
</script>

<style scoped>
.event-form {
  max-width: 900px;
  margin: 20px auto;
  font-family: Arial, sans-serif;
}
.card {
  border: 1px solid #ccc;
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  background-color: #fafafa;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px 20px;
}
label {
  display: block;
  font-weight: bold;
  margin-bottom: 4px;
}
input,
select,
textarea {
  width: 100%;
  padding: 6px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}
textarea {
  resize: vertical;
}
.time-item,
.sub-manager-item {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px dashed #aaa;
  border-radius: 6px;
  background-color: #fff;
}
button {
  padding: 6px 12px;
  margin-top: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary {
  background-color: #1976d2;
  color: white;
}
.btn-danger {
  background-color: #d32f2f;
  color: white;
}
.btn-submit {
  width: auto;
  background-color: #4caf50;
  color: white;
  font-size: 18px;
  padding: 10px 20px;
  margin-top: 10px;
}
.file-input {
  margin-bottom: 10px;
}
.submit-wrapper {
  display: flex;
  justify-content: center; /* 수평 중앙 정렬 */
  margin-top: 20px; /* 버튼 위 여백 */
}

.sub-manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* h3와 버튼 사이 공간 확보 */
  margin-bottom: 10px;
}
.sub-manager-header h3 {
  margin: 0;
}
.sub-manager-header .btn-primary {
  margin: 0;
  padding: 6px 14px;
  font-size: 14px;
}
</style>
