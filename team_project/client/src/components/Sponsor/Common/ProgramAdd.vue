<template>
  <div class="p-6">
    <div id="container">
      <h2 v-show="!approval_mode" class="text-xl font-bold mb-2">
        후원 프로그램 {{ isEditMode ? "수정" : "등록" }}
      </h2>
      <h2 v-show="approval_mode">후원 프로그램 승인</h2>
      <hr />

      <div class="form-field-group">
        <label for="program_name">프로그램 명</label>
        <div class="field-container">
          <input
            type="text"
            id="program_name"
            name="program_name"
            v-model="formData.program_name"
            :disabled="isLocked"
          />
        </div>

        <label for="program_type">후원유형</label>
        <div class="field-container">
          <select
            id="program_type"
            name="program_type"
            v-model="formData.sponsor_type"
          >
            <option value="단기">단기</option>

            <option value="정기" disabled>정기</option>
          </select>
        </div>

        <label for="program_status">상태</label>
        <div class="field-container checkbox-group">
          <label>
            <input
              type="radio"
              value="진행전"
              v-model="formData.status"
              name="program_status"
              disabled
            />
            진행전
          </label>

          <template v-if="isEditMode">
            <label>
              <input
                type="radio"
                value="진행중"
                v-model="formData.status"
                name="program_status"
                disabled
              />
              진행중
            </label>

            <label>
              <input
                type="radio"
                value="완료"
                v-model="formData.status"
                name="program_status"
                disabled
              />
              완료
            </label>

            <label>
              <input
                type="radio"
                value="중단"
                v-model="formData.status"
                name="program_status"
                disabled
              />
              중단
            </label>
          </template>
        </div>

        <label for="startDate">시작일</label>
        <div class="field-container">
          <input
            type="date"
            id="startDate"
            v-model="formData.start_date"
            :disabled="isLocked"
          />
        </div>

        <label for="endDate">종료일</label>
        <div class="field-container">
          <input
            type="date"
            id="endDate"
            v-model="formData.end_date"
            :disabled="isLocked"
          />
        </div>

        <label for="amount_setting">금액 단위 설정</label>

        <div class="field-container checkbox-group">
          <button
            type="button"
            class="add-button"
            @click="addUnitInput"
            v-show="amountSettingType === '지정'"
            :disabled="isLocked"
          >
            단위 추가 +
          </button>
        </div>

        <template v-if="amountSettingType === '지정'">
          <template v-for="unit in amountUnits" :key="unit.id">
            <div class="field-container dynamic-unit-input">
              <input
                type="text"
                inputmode="numeric"
                :id="`unit-${unit.id}`"
                :value="numberFormat(unit.value)"
                @input="formatUnitInput(unit, $event)"
                placeholder="금액 단위를 입력하세요 (예: 10,000)"
                :disabled="isLocked"
              />

              <button
                type="button"
                class="remove-button"
                @click="removeUnitInput(unit.id)"
                :disabled="isLocked"
              >
                삭제
              </button>
            </div>
          </template>
        </template>

        <label for="amount">목표 금액</label>
        <div class="field-container">
          <input
            type="text"
            id="amount"
            name="amount"
            v-model="formattedGoalAmount"
            inputmode="numeric"
            :disabled="isLocked"
          />

          <div class="amount">원</div>
        </div>

        <label>승인</label>
        <div class="field-container checkbox-group">
          <label>
            <input
              type="radio"
              value="승인전"
              v-model="formData.approval_status"
              name="approval_status"
              disabled
            />
            승인전
          </label>

          <template v-if="isEditMode">
            <label>
              <input
                type="radio"
                value="승인대기중"
                v-model="formData.approval_status"
                name="approval_status"
                disabled
              />
              승인대기중
            </label>
            <label>
              <input
                type="radio"
                value="승인"
                v-model="formData.approval_status"
                name="approval_status"
                disabled
              />
              승인
            </label>

            <label>
              <input
                type="radio"
                value="반려"
                v-model="formData.approval_status"
                name="approval_status"
                disabled
              />
              반려
            </label>
          </template>
        </div>

        <label>포스터</label>
        <div class="field-container">
          <input
            v-if="!isEditMode"
            type="file"
            multiple
            @change="handleFileChange"
            class="file-input"
            :disabled="isLocked"
          />

          <ul class="file-list">
            <li
              v-for="file in formData.attachments"
              :key="file.server_filename || file.name"
            >
              <span
                :class="{
                  'file-name-clickable': isEditMode && file.isExisting,
                }"
                @click="
                  isEditMode && file.isExisting ? previewFile(file) : null
                "
              >
                {{ file.original_filename || file.name }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div v-show="!approval_mode" class="button-group-footer">
        <!-- <button
          class="primary-button"
          @click="programAdd()"
          :disabled="isLocked"
          v-show="canEditOrRegister"
        >
          {{ isEditMode ? "수정" : "등록" }}
        </button> -->
        <MaterialButton
          color="dark"
          size="sm"
          @click="programAdd()"
          :disabled="isLocked"
          v-show="canEditOrRegister"
        >
          {{ isEditMode ? "수정" : "등록" }}
        </MaterialButton>
        <MaterialButton color="dark" size="sm" @click="goList()">
          닫기
        </MaterialButton>

        <!-- <button class="secondary-button" @click="goList()">닫기</button> -->
      </div>
      <div v-show="approval_mode" class="button-group-footer">
        <!-- 승인 버튼 | AA4이면 숨김 -->
        <!-- <button
          class="primary-button"
          @click="approveProgram()"
          v-if="userRole !== 'AA4'"
        >
          승인
        </button> -->
        <MaterialButton
          color="dark"
          size="sm"
          @click="approveProgram()"
          v-if="userRole !== 'AA4'"
        >
          승인
        </MaterialButton>
        <!-- 반려 버튼 | AA4이면 숨김 -->
        <MaterialButton
          color="dark"
          size="sm"
          @click="openRejectModal()"
          v-if="userRole !== 'AA4'"
        >
          반려
        </MaterialButton>
        <!-- <button
          class="btn btn-danger"
          @click="openRejectModal()"
          v-if="userRole !== 'AA4'"
        >
          반려
        </button> -->
        <router-link to="/sponsorshipPlanApprovals">
          <MaterialButton color="dark" size="sm"> 닫기 </MaterialButton>
        </router-link>
      </div>
    </div>
    <div v-show="rejectModal" class="modal">
      <div class="modal-box">
        <h3>반려 사유 입력</h3>
        <textarea
          v-model="rejectReason"
          placeholder="반려 사유를 입력하세요"
        ></textarea>
        <MaterialButton color="dark" size="sm" @click="sendReject">
          반려
        </MaterialButton>
        <MaterialButton color="dark" size="sm" @click="rejectModal">
          취소
        </MaterialButton>
        <!-- <button @click="sendReject">반려</button>
        <button @click="rejectModal = false">취소</button> -->
      </div>
    </div>
    <div v-if="previewImage" class="preview-modal" @click="closePreview">
      <img :src="previewImage" class="preview-img" @click.stop />
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref, computed, watch, defineProps, defineEmits } from "vue";
import { useRouter } from "vue-router";
import MaterialButton from "@/components/MaterialButton.vue";

const router = useRouter();
const userDataString = localStorage.getItem("user");
const userData = JSON.parse(userDataString);
const userRole = userData.role;

const canEditOrRegister = computed(() => {
  // 1. 승인 모드 (approval_mode)가 아닐 때만 해당
  if (approval_mode.value) return false;

  // 2. 등록 모드 (isEditMode가 false)일 때는 항상 표시 (등록 가능)
  if (!isEditMode.value) return true;

  // 3. 수정 모드 (isEditMode가 true)일 때
  //  '승인전' 또는 '반려' 상태일 때만 true (수정 가능)
  const status = formData.value.approval_status;
  return status === "승인전" || status === "반려";
});

// isLocked 계산된 속성 정의
const isLocked = computed(() => {
  return isEditMode.value && formData.value.approval_status === "승인대기중";
});

//승인 반려
let approval_mode = ref(false);
let rejectModal = ref(false);
let rejectReason = ref("");
import { onMounted } from "vue";

onMounted(async () => {
  if (props.programCode) {
    const res = await axios.get(`/api/sponsor/${props.programCode}`);

    const detail = res.data.serviceSponsor.sponsorRows[0] || {};
    const files = res.data.serviceSponsor.attachments || [];

    Object.assign(formData.value, detail);

    formData.value.attachments = files.map((f) => ({
      ...f,
      isExisting: true,
    }));

    amountSettingType.value = detail.donation_type || "지정";

    amountUnits.value =
      amountSettingType.value === "지정" && detail.donation_unit
        ? parseDonationUnits(detail.donation_unit)
        : [];

    isEditMode.value = true;
  }

  approval_mode.value = props.approvalMode;
});

// ===================== Props ============================================ //
const props = defineProps({
  initialProgram: {
    type: Object,
    default: null,
  },
  approvalMode: {
    type: Boolean,
    default: false,
  },
  programCode: Number,
});
const emit = defineEmits(["goToList"]);

// ===================== 수정모드 관련 ============================================ //

const isEditMode = ref(false);
const amountSettingType = ref("지정");
const amountUnits = ref([]);
let nextUnitId = 1;

const formData = ref({
  program_name: "",
  sponsor_type: "단기",
  status: "진행전",
  start_date: null,
  end_date: null,
  goal_amount: 0,
  approval_status: "승인전",
  attachments: [],
});

// 이미지 미리보기 URL 추가
const previewImage = ref("");

const numberFormat = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "";
  return value.toLocaleString();
};

const goList = () => {
  emit("goToList");
};

const resetFormData = () => {
  formData.value = {
    program_name: "",
    sponsor_type: "단기",
    status: "진행전",
    start_date: null,
    end_date: null,
    goal_amount: null,
    approval_status: "승인전",
    attachments: [],
  };
  amountSettingType.value = "지정";
  amountUnits.value = [];
  nextUnitId = 1;
};

const parseDonationUnits = (unitStr) => {
  if (!unitStr) return [];
  return unitStr
    .split(",")
    .map((val) => {
      const value = Number(val.trim());
      return { id: nextUnitId++, value: isNaN(value) ? null : value };
    })
    .filter((unit) => unit.value !== null);
};

watch(
  () => props.initialProgram,
  (newVal) => {
    if (newVal && Object.keys(newVal).length > 0) {
      isEditMode.value = true;
      formData.value.program_name = newVal.program_name || "";
      formData.value.sponsor_type = newVal.sponsor_type || "단기";
      formData.value.status = newVal.status || "진행전";
      formData.value.approval_status = newVal.approval_status || "승인전";
      formData.value.start_date = newVal.start_date
        ? newVal.start_date.slice(0, 10)
        : null;
      formData.value.end_date = newVal.end_date
        ? newVal.end_date.slice(0, 10)
        : null;
      formData.value.goal_amount = newVal.goal_amount || 0;

      amountSettingType.value = newVal.donation_type || "지정";
      amountUnits.value =
        amountSettingType.value === "지정" && newVal.donation_unit
          ? parseDonationUnits(newVal.donation_unit)
          : [];

      formData.value.attachments =
        newVal.attachments?.map((file) => ({ ...file, isExisting: true })) ||
        [];
    } else {
      isEditMode.value = false;
      resetFormData();
    }
  },

  { immediate: true }
);
watch(
  () => props.approvalMode,
  (v) => {
    approval_mode.value = v;
  },
  { immediate: true }
);
const formattedGoalAmount = computed({
  get() {
    return numberFormat(formData.value.goal_amount);
  },
  set(newValue) {
    const cleanedValue = newValue.toString().replace(/[^0-9]/g, "");
    formData.value.goal_amount = cleanedValue ? Number(cleanedValue) : null;
  },
});

const formatUnitInput = (unit, event) => {
  const inputElement = event.target;
  const cleanedValue = inputElement.value.toString().replace(/[^0-9]/g, "");
  unit.value = cleanedValue ? Number(cleanedValue) : null;
  inputElement.value = numberFormat(unit.value);
};

const addUnitInput = () => {
  if (amountSettingType.value === "지정") {
    amountUnits.value.push({ id: nextUnitId++, value: null });
  }
};

const removeUnitInput = (id) => {
  amountUnits.value = amountUnits.value.filter((unit) => unit.id !== id);
};

const handleFileChange = (event) => {
  const existingFiles = formData.value.attachments.filter(
    (item) => item.isExisting
  );
  formData.value.attachments = [
    ...existingFiles,
    ...Array.from(event.target.files),
  ];
};
// ===================== 수정모드 관련 ============================================ //

// ===================== 첨부파일 관련 ============================================ //

// 파일 미리보기 함수 (추가)
const previewFile = (file) => {
  // file.file_path가 서버에서 반환한 파일 경로라고 가정
  const filePath = file.file_path;
  if (!filePath) {
    alert("파일 경로를 찾을 수 없습니다.");
    return;
  }

  const ext = file.original_filename.split(".").pop().toLowerCase(); // 이미지 파일 (.jpg, .jpeg, .png, .gif, .webp)

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    previewImage.value = filePath; // 모달 표시
    return;
  } // PDF 파일

  if (ext === "pdf") {
    window.open(filePath, "_blank"); // 새 창 미리보기
    return;
  } // 그 외 파일은 다운로드 (필요하다면)

  if (
    confirm(
      `'${file.original_filename}' 파일은 이미지 또는 PDF가 아닙니다. 다운로드하시겠습니까?`
    )
  ) {
    window.location.href = filePath;
  }
};

// 미리보기 모달 닫기 함수 (추가)
const closePreview = () => {
  previewImage.value = "";
};
// ===================== 첨부파일 관련 ============================================ //

// ===================== 프로그램 등록 ============================================ //

const programAdd = async () => {
  const actionText = isEditMode.value ? "수정" : "등록";
  let donationUnit = null;

  if (amountSettingType.value === "지정") {
    const validUnits = amountUnits.value
      .map((unit) => unit.value)
      .filter((value) => value !== null && value > 0);
    donationUnit = validUnits.length > 0 ? validUnits.join(",") : null;
  }

  const form = new FormData();
  form.append("program_name", formData.value.program_name);
  form.append("sponsor_type", formData.value.sponsor_type);
  form.append("status", formData.value.status);
  form.append("start_date", formData.value.start_date);
  form.append("end_date", formData.value.end_date);
  form.append("donation_type", amountSettingType.value);
  form.append("donation_unit", donationUnit);
  form.append("goal_amount", formData.value.goal_amount || 0);
  form.append("approval_status", formData.value.approval_status);

  if (isEditMode.value) {
    form.append("program_code", props.initialProgram?.program_code);
    form.append("current_amount", props.initialProgram?.current_amount || 0);
    form.append("writer", userData.user_id);
  } else {
    form.append("create_date", new Date().toISOString().slice(0, 10));
    form.append("writer", userData.user_id);
  }

  if (formData.value.attachments?.length > 0) {
    formData.value.attachments.forEach((item) => {
      if (item instanceof File) form.append("attachments", item);
    });
  }

  try {
    if (isEditMode.value) {
      await axios.put(
        `/api/sponsor/${props.initialProgram.program_code}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    } else {
      await axios.post("/api/sponsor", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    alert(`프로그램이 성공적으로 ${actionText}되었습니다.`);
    goList();
  } catch (error) {
    if (error.response) {
      alert(
        `${actionText} 실패: ${error.response.data.message || "서버 오류 발생"}`
      );
    } else {
      alert(`${actionText} 실패: 서버에 연결할 수 없습니다.`);
    }
  }
};
// ===================== 프로그램 등록 ============================================ //

// ===================== 승인 관련 ============================================ //

const approveProgram = async () => {
  if (formData.value.approval_status === "승인") {
    return;
  }
  const programCode = props.programCode;
  if (!confirm("승인 확정하시겠습니까?")) return;

  try {
    await axios.put(`/api/sponsor/${programCode}/request-approval`);
    alert("승인 완료되었습니다.");
    router.push("/sponsorshipPlanApprovals");
  } catch (e) {
    alert("승인 처리 중 오류 발생");
  }
};

// ===================== 반려 관련 ============================================ //

const openRejectModal = () => {
  if (formData.value.approval_status === "승인") {
    return;
  }
  rejectModal.value = true;
  console.log(rejectModal.value);
};

const sendReject = async () => {
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력하세요.");
    return;
  }

  const programCode = props.programCode;

  try {
    await axios.put(`/api/sponsor/${programCode}/reject`, {
      reason: rejectReason.value,
    });

    alert("반려되었습니다.");
    rejectModal.value = false;
    router.push("/sponsorshipPlanApprovals");
  } catch (e) {
    alert("반려 처리 중 오류 발생");
  }
};
</script>

<style scoped>
/* (스타일 시트 내용은 변경하지 않았습니다.) */
/* ============================================== */
/* 1. 컨테이너 & 기본 설정 */
/* ============================================== */
#container {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px;
  background-color: #f7f9fc;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 제목 및 구분선 */
h2 {
  color: #1f2937;
  padding-bottom: 5px;
}

hr {
  border: 0;
  height: 1px;
  background: #e5e7eb;
  margin: 15px 0 30px 0;
}

/* ============================================== */
/* 2. Grid 레이아웃 & 폼 요소 */
/* ============================================== */
.form-field-group {
  display: grid;
  /* 라벨(1fr) vs. 인풋 영역(3fr) 비율 */
  grid-template-columns: 1fr 3fr;
  gap: 15px 20px; /* 행 간격 15px, 열 간격 20px */
  align-items: center;
}

/* 라벨 스타일 */
label {
  font-weight: 500;
  color: #4b5563;
  grid-column: 1 / 2;
  margin: 0;
}

/* 인풋/셀렉트 영역 컨테이너 */
.field-container {
  grid-column: 2 / 3;
  display: flex;
  align-items: center;
}

/* 모든 입력 필드 (Input/Select) 기본 스타일 */
input:not([type="radio"]):not([type="file"]):not([type="submit"]):not(
    [type="button"]
  ),
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 15px;
  color: #374151;
  background-color: #ffffff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

/* 포커스 시 스타일 */
input:focus:not([type="checkbox"]):not([type="file"]):not([type="submit"]):not(
    [type="button"]
  ),
select:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* 체크박스 그룹 */
.checkbox-group {
  gap: 15px;
  font-size: 15px;
  color: #4b5563;
}
.checkbox-group label {
  /* 라벨을 인라인 블록으로 만들어 가로 배열 */
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 15px; /* 라디오 버튼 사이 간격 */
  grid-column: auto; /* Grid 배치 무시 */
}

.checkbox-group input[type="radio"] {
  transform: scale(1.1);
  margin-right: 5px; /* 라디오 버튼과 텍스트 사이 간격 */
  width: auto; /* 라디오 버튼 너비 고정 해제 */
}

.field-container .add-button:hover {
  background-color: #059669;
}
#amount_type {
  margin: 10px 0 10px 0;
}
#amount_type button {
  margin-left: 10px;
  width: 100px;
}

/* 첨부파일 */
input[type="file"] {
  border: none;
  padding: 10px 0 10px 0;
}
/* 동적 입력 필드 컨테이너의 상단 마진을 줄여 간격 조정 */
.dynamic-unit-input {
  margin-top: 5px;
  margin-bottom: 5px;
}
.dynamic-unit-input input {
  margin-right: 10px; /* 삭제 버튼과의 간격 확보 */
}

/* '+' 추가 버튼 */
.add-button {
  background-color: #10b981;
  color: white;
  margin-left: 10px;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: background-color 0.2s;
  flex-shrink: 0;
}
.add-button:hover {
  background-color: #059669;
}

/* 📌 삭제 버튼 */
.remove-button {
  background-color: #ef4444; /* Red color */
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: background-color 0.2s;
  flex-shrink: 0;
}
.remove-button:hover {
  background-color: #dc2626;
}
/* ============================================== */
/* 3. 최종 버튼 그룹 (등록/닫기) */
/* ============================================== */

/* 최종 버튼들을 감싸는 컨테이너 */
.button-group-footer {
  margin-top: 30px;
  padding-top: 20px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

/* 모든 최종 버튼의 공통 스타일 */
.button-group-footer button {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  border: none;
  transition: background-color 0.2s;
  margin: 0 5px; /* 버튼 간격 */
}

/* '등록' 버튼 (주요 액션) */
.primary-button {
  background-color: #3b82f6; /* 파란색 */
  color: white;
}
.primary-button:hover {
  background-color: #2563eb;
}

/* '닫기' 버튼 (보조 액션) */
.secondary-button {
  background-color: #9ca3af; /* 회색 */
  color: white;
}
.secondary-button:hover {
  background-color: #6b7280;
}

/* 파일 이름 스타일 추가 */
.file-list {
  padding-left: 0;
  list-style: none;
}
.file-name-clickable {
  cursor: pointer;
  color: #3b82f6; /* 파란색으로 표시 */
  font-weight: 500;
}
.file-name-clickable:hover {
  text-decoration: underline;
}

/* 이미지 미리보기 모달 (추가) */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 다른 요소 위에 표시 */
}

.preview-img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

/* ============================================== */
/* 4. 모바일 대응 */
/* ============================================== */
@media (max-width: 600px) {
  #container {
    padding: 20px;
  }
  .form-field-group {
    grid-template-columns: 1fr;
    gap: 0;
  }
  label {
    margin-top: 15px;
    margin-bottom: 5px;
    grid-column: 1 / 2;
  }
  .field-container {
    grid-column: 1 / 2;
  }

  /* 버튼 그룹 모바일에서는 세로로 쌓이도록 */
  .button-group-footer {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .button-group-footer button {
    margin: 0;
  }
}
.amount {
  float: right;
}
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-box {
  background: #fff;
  padding: 20px;
  width: 350px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
