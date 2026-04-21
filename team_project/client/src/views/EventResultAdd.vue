<template>
  <div class="result-form">
    <h2>결과보고서 {{ isUpdated ? "수정" : "등록" }}</h2>

    <form @submit.prevent="submitForm">
      <div class="card">
        <h3>기본 정보</h3>
        <div class="grid-2">
          <div>
            <label>연결 이벤트 선택</label>
            <select v-model="form.event_code" required>
              <option value="">이벤트 선택</option>
              <option
                v-for="ev in filteredMyEvents"
                :value="ev.event_code"
                :key="ev.event_code"
              >
                {{ ev.event_name }}
              </option>
            </select>
          </div>

          <div>
            <label>작성일</label>
            <input type="date" v-model="formattedReportDate" readonly />
          </div>

          <div>
            <label>결과 제목</label>
            <input type="text" v-model="form.result_subject" required />
          </div>

          <div>
            <label>매니저 코드</label>
            <input type="text" :value="userName || user_code" readonly />
          </div>
        </div>
      </div>

      <div class="card">
        <h3>내용</h3>
        <textarea v-model="form.result_content" rows="6" required></textarea>
      </div>

      <div class="card">
        <h3>첨부파일</h3>
        <input
          type="file"
          multiple
          @change="handleFileChange"
          class="file-input"
        />
        <ul>
          <li v-for="(f, idx) in existingAttachments" :key="'ex-' + idx">
            <a :href="f.file_path" target="_blank">{{ f.original_filename }}</a>
            <button
              type="button"
              class="btn-danger"
              @click="removeExistingAttachment(f, idx)"
            >
              삭제
            </button>
          </li>
          <li v-for="(f, idx) in newFiles" :key="'new-' + idx">
            {{ f.name }}
            <button
              type="button"
              class="btn-danger"
              @click="removeNewFile(idx)"
            >
              삭제
            </button>
          </li>
        </ul>
      </div>

      <!-- 등록 버튼 -->
      <div class="submit-wrapper">
        <button type="submit" class="btn-submit">
          {{ isUpdated ? "수정" : "등록" }}
        </button>

        <!-- 승인/반려 버튼 : 권한에 따라 보여주면 됩니다 (여기선 예시로 isAdmin 사용) -->
        <button
          v-if="isAdmin && isUpdated"
          type="button"
          class="btn-primary"
          @click="approve"
        >
          승인
        </button>
        <button
          v-if="isAdmin && isUpdated"
          type="button"
          class="btn-danger"
          @click="showRejectPrompt = true"
        >
          반려
        </button>

        <!-- 반려사유 보기 -->
        <button
          v-if="isUpdated"
          type="button"
          class="btn"
          @click="fetchRejectReason"
        >
          반려사유 조회
        </button>
      </div>
    </form>

    <!-- 반려사유 모달(간단한 프롬프트 형태) -->
    <div v-if="showRejectPrompt" class="modal">
      <div class="modal-content">
        <h4>반려 사유 입력</h4>
        <textarea
          v-model="rejectReason"
          rows="4"
          placeholder="반려 사유를 입력하세요"
        ></textarea>
        <div class="modal-actions">
          <button @click="submitReject" class="btn-danger">반려 처리</button>
          <button @click="showRejectPrompt = false" class="btn">취소</button>
        </div>
      </div>
    </div>

    <!-- 반려사유 표시 -->
    <div v-if="rejectionInfo" class="card">
      <h4>최근 반려 이력</h4>
      <p><strong>일자:</strong> {{ rejectionInfo.rejection_date }}</p>
      <p><strong>사유:</strong> {{ rejectionInfo.rejection_reason }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import dateFormat from "@/utils/dateFormat";

// 라우터
const route = useRoute();
const router = useRouter();

// 로그인 사용자 정보
const user = JSON.parse(localStorage.getItem("user") || "{}");
const user_code = user.user_code;
const userName = user.name || "";
const isAdmin = user.position === "ADMIN" || user.role === "admin"; // 권한 체크 샘플

const today = new Date();
today.setHours(0, 0, 0, 0);

// 상태
const isUpdated = ref(false);
const showRejectPrompt = ref(false);
const rejectReason = ref("");
const rejectionInfo = ref(null);

// 이벤트 목록
const myEvents = ref([]);

// DB 첨부파일 관리
const existingAttachments = ref([]); // DB에 저장된 첨부파일 목록
const newFiles = ref([]); // 업로드할 새 파일들
const attachmentDeleteList = ref([]);

// Form 데이터
const form = ref({
  event_result_code: "",
  event_code: "",
  result_status: "BA1",
  result_subject: "",
  result_content: "",
  report_register_date: new Date(),
  user_code: user_code,
});

// 이미 결과보고서 작성한 이벤트는 제외
const filteredMyEvents = computed(() => {
  return myEvents.value.filter((ev) => ev.event_result_code === null);
});

// 작성일 포맷
const formattedReportDate = computed(() =>
  dateFormat(form.value.report_register_date, "yyyy-MM-dd")
);

// --------------------
// 파일 핸들링
// --------------------
const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  newFiles.value.push(...files);
};
const removeNewFile = (idx) => newFiles.value.splice(idx, 1);
const removeExistingAttachment = (file, idx) => {
  // 프론트에서 바로 삭제 표시; 실제 삭제는 submit 시 서버에서 처리하도록 attachmentDeleteList에 저장
  attachmentDeleteList.value.push(file);
  existingAttachments.value.splice(idx, 1);
};

// --------------------
// 이벤트 목록 로드
// --------------------
const loadMyEvents = async () => {
  try {
    const res = await axios.get("/api/event/applyResult", {
      params: { user_code },
    });

    myEvents.value = res.data.data || [];
  } catch (err) {
    console.error("내 이벤트 목록 조회 실패", err);
  }
};

// --------------------
// 결과보고서 조회 (수정 모드)
// --------------------
const getResult = async (resultCode) => {
  try {
    const res = await axios.get(`/api/event/result/${resultCode}`);
    const data = res.data.data;
    if (!data) return;

    isUpdated.value = true;
    form.value = {
      ...form.value,
      event_result_code: data.event_result_code,
      event_code: data.event_code,
      result_status: data.result_status,
      result_subject: data.result_subject,
      result_content: data.result_content,
      report_register_date: new Date(data.report_register_date),
      user_code: data.user_code,
    };

    existingAttachments.value = data.attachments || [];
  } catch (e) {
    console.error(e);
  }
};

// --------------------
// 페이지 로드 시 실행
// --------------------
onBeforeMount(async () => {
  await loadMyEvents();

  const resultNo = route.query.resultNo;
  if (resultNo) {
    await getResult(resultNo);
  } else {
    form.value.report_register_date = new Date();
  }
});

// --------------------
// 등록/수정 제출
// --------------------
const submitForm = async () => {
  try {
    const formData = new FormData();
    const payload = {
      ...form.value,
      report_register_date: formattedReportDate.value,
      deletedAttachments: attachmentDeleteList.value.map(
        (a) => a.attachment_code || a.id || a.server_filename
      ),
    };
    formData.append("resultInfo", JSON.stringify(payload));
    newFiles.value.forEach((f) => formData.append("attachments", f));

    if (isUpdated.value) {
      await axios.put(
        `/api/event/result/${form.value.event_result_code}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("결과보고서 수정 완료");
    } else {
      await axios.post("/api/event/result", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("결과보고서 등록 완료");
    }
    router.push("/event/list"); // 목록으로 이동
  } catch (err) {
    console.error(err);
    alert(isUpdated.value ? "수정 실패" : "등록 실패");
  }
};

// --------------------
// 승인
// --------------------
const approve = async () => {
  try {
    const code = form.value.event_result_code;
    await axios.post(`/api/event/${code}/approve`);
    alert("승인 처리되었습니다.");
    // 상태 반영 위해 재조회 또는 상태 변경
    if (isUpdated.value) await getResult(code);
  } catch (e) {
    console.error(e);
    alert("승인 중 오류");
  }
};

// --------------------
// 반려
// --------------------
const submitReject = async () => {
  try {
    const code = form.value.event_result_code;
    await axios.post(`/api/event/${code}/reject`, {
      reason: rejectReason.value,
    });
    alert("반려 처리되었습니다.");
    showRejectPrompt.value = false;
    if (isUpdated.value) await getResult(code);
  } catch (e) {
    console.error(e);
    alert("반려 중 오류");
  }
};

// 반려 사유 조회
const fetchRejectReason = async () => {
  try {
    const code = form.value.event_result_code || route.query.resultNo;
    const res = await axios.get(`/api/event/${code}/rejection-reason`);
    rejectionInfo.value = res.data.result;
  } catch (e) {
    console.error(e);
    alert("반려사유 없음 또는 조회 오류");
  }
};
</script>

<style scoped>
/* 기존 디자인 유지 + 간단 모달 스타일 */
.result-form {
  max-width: 900px;
  margin: 20px auto;
  font-family: Arial, sans-serif;
}
.card {
  border: 1px solid #ccc;
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  background: #fafafa;
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
button {
  padding: 6px 12px;
  margin-top: 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary {
  background: #1976d2;
  color: #fff;
}
.btn-danger {
  background: #d32f2f;
  color: #fff;
}
.btn-submit {
  width: auto;
  background-color: #4caf50;
  color: white;
  font-size: 18px;
  padding: 10px 20px;
  margin-top: 10px;
}

.modal {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}
.modal-content {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}
.submit-wrapper {
  display: flex;
  justify-content: center; /* 수평 중앙 정렬 */
  margin-top: 20px; /* 버튼 위 여백 */
}
</style>
