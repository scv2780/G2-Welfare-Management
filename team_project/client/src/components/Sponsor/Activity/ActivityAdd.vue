<template>
  <div class="at-page">
    <h2 class="at-title">후원 프로그램 활동 보고서</h2>

    <div class="at-toolbar">
      <div class="at-row">
        <div class="at-field-group at-field-grow">
          <label class="at-label">프로그램</label>
          <select
            class="at-select"
            v-model="programCode"
            :disabled="props.readOnly"
          >
            <option value="">-- 프로그램 선택 --</option>
            <option
              v-for="program in sponsorList"
              :key="program.program_code"
              :value="program.program_code"
            >
              {{ program.program_name }}
            </option>
          </select>
        </div>
      </div>

      <div class="at-row">
        <div class="at-field-group at-field-grow">
          <label class="at-label">제목</label>
          <material-input
            class="at-input"
            v-model="title"
            placeholder="제목을 입력해주세요"
            :disabled="props.readOnly"
          />
        </div>
      </div>

      <div class="at-field-group">
        <label class="at-label">내용</label>
        <div class="ck-wrapper">
          <MyEditor
            v-show="loadEditorFlag"
            v-model="content"
            :readOnly="props.readOnly"
          />
        </div>
      </div>

      <!-- 후원금 사용 용도 -->
      <div class="at-row at-expenditure-header">
        <div class="at-field-group at-field-grow">
          <label class="at-label">후원금 사용 용도</label>
        </div>

        <!-- 등록 모드에서만 보임 -->
        <material-button v-if="!props.readOnly" @click="addExpenditure">
          추가
        </material-button>
      </div>

      <!-- 동적 항목 -->
      <div
        v-for="item in expenditureList"
        :key="item.id"
        class="at-expenditure-item"
      >
        <div class="at-row at-expenditure-row">
          <div class="at-field-group at-field-half">
            <label class="at-label">사용 항목</label>
            <material-input
              class="at-input"
              v-model="item.usageItem"
              placeholder="예: 물품 구매"
              :disabled="props.readOnly"
            />
          </div>

          <div class="at-field-group at-field-half">
            <label class="at-label">사용처</label>
            <material-input
              class="at-input"
              v-model="item.recipient"
              placeholder="예: A 보육원"
              :disabled="props.readOnly"
            />
          </div>
        </div>

        <div class="at-row at-expenditure-row">
          <div class="at-field-group at-field-half">
            <label class="at-label">지급 금액 (원)</label>
            <material-input
              class="at-input"
              v-model="item.amountFormatted"
              :disabled="props.readOnly"
              @input="props.readOnly ? null : formatAmount(item)"
            />
          </div>

          <div class="at-field-group at-field-half at-date-field">
            <label class="at-label">사용일</label>
            <input
              class="at-select"
              type="date"
              v-model="item.usedAt"
              :disabled="props.readOnly"
            />
          </div>

          <!-- 등록 모드에서만 보임 -->
          <div class="at-delete-col">
            <material-button
              v-if="!props.readOnly"
              @click="removeExpenditure(item.id)"
            >
              삭제
            </material-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="at-actions">
      <!-- 등록 모드에서만 보임 -->
      <material-button color="dark" v-if="!props.readOnly" @click="activityAdd">
        제출
      </material-button>

      <!-- 닫기 버튼은 항상 보임 -->
      <material-button color="dark" size="md" variant="outline" @click="goList"
        >닫기</material-button
      >
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import MaterialInput from "@/components/MaterialInput.vue";
import MaterialButton from "@/components/MaterialButton.vue";
import MyEditor from "@/components/Sponsor/Common/CkEditor.vue";
import numberFormat from "@/utils/numberFormat";

import {
  ref,
  onBeforeMount,
  watch,
  defineEmits,
  defineProps,
  nextTick,
} from "vue";

const props = defineProps({
  initialProgram: { type: Object, default: null },
  readOnly: { type: Boolean, default: false },
});

const emit = defineEmits(["goToList"]);

let sponsorList = ref([]);
const programCode = ref("");
const title = ref("");
const content = ref("");

const loadEditorFlag = ref(false);
nextTick(() => (loadEditorFlag.value = true));

// 상세 보기 또는 등록 모드 데이터 세팅
watch(
  () => props.initialProgram,
  (v) => {
    if (v) {
      programCode.value = v.program_code;
      title.value = v.title;
      content.value = v.content;

      expenditureList.value = v.history.map((h) => ({
        id: h.id,
        usageItem: h.usage_item,
        recipient: h.recipient,
        amount: h.amount,
        amountFormatted: numberFormat(h.amount),
        usedAt: h.used_at,
      }));
    }
  },
  { immediate: true }
);

onBeforeMount(async () => {
  const result = await axios.get(`/api/sponsor`);
  sponsorList.value = result.data.serviceSponsor;
});

// 동적 사용 내역
const expenditureList = ref([
  {
    id: Date.now(),
    usageItem: "",
    recipient: "",
    amount: null,
    amountFormatted: "",
    usedAt: "",
  },
]);

const addExpenditure = () => {
  expenditureList.value.push({
    id: Date.now(),
    usageItem: "",
    recipient: "",
    amount: null,
    amountFormatted: "",
    usedAt: "",
  });
};

const removeExpenditure = (id) => {
  if (expenditureList.value.length === 1) {
    return alert("최소 1개 항목은 필요합니다.");
  }
  expenditureList.value = expenditureList.value.filter((x) => x.id !== id);
};

const formatAmount = (item) => {
  const raw = item.amountFormatted.replace(/[^0-9]/g, "");
  item.amount = raw ? Number(raw) : null;
  item.amountFormatted = raw ? numberFormat(raw) : "";
};

const goList = () => {
  // 내부 값 초기화
  programCode.value = "";
  title.value = "";
  content.value = "";
  expenditureList.value = [
    {
      id: Date.now(),
      usageItem: "",
      recipient: "",
      amount: null,
      amountFormatted: "",
      usedAt: "",
    },
  ];

  emit("goToList");
};

// 제출
const activityAdd = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const used_amount = expenditureList.value.reduce(
    (s, i) => s + (i.amount || 0),
    0
  );

  const payload = {
    writer: user.user_id,
    title: title.value,
    content: content.value,
    used_amount,
    program_code: programCode.value,
    history: expenditureList.value.map((item) => ({
      usage_item: item.usageItem,
      recipient: item.recipient,
      amount: item.amount,
      used_at: item.usedAt,
    })),
  };

  await axios.post(
    `/api/sponsor/${programCode.value}/${user.user_id}/activity`,
    payload
  );
  alert("작성 완료");
  goList();
};
</script>

<style scoped>
/* AuthorityTransfer.vue의 스타일 테마를 기반으로 재구성 */

.at-page {
  /* 컨테이너 역할을 하며, 기존 #container의 max-width를 유지 */
  max-width: 700px;
  margin: 0 auto;
  padding: 30px;
  background-color: #f7f9fc;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.at-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #1f2937;
  padding-bottom: 5px;
  border-bottom: 1px solid #e5e7eb;
}

.at-toolbar {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* 필드 그룹 간의 간격 */
}

.at-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
}

.at-field-group {
  /* 필드를 수직으로 배열 */
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%; /* 너비 전체 사용 */
}

.at-field-grow {
  flex: 1;
}

.at-label {
  font-size: 14px;
  color: #555;
  font-weight: 500; /* 라벨 강조 */
}

/* 일반 <select> 에만 스타일 적용 */
.at-select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
  font-size: 15px;
  color: #374151;
  background-color: #ffffff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.ck-wrapper {
  width: 100%;
  display: block;
}

/* 포커스 시 스타일 (select, textarea만) */
.at-select:focus,
.at-textarea:focus {
  border-color: #409eff; /* at-btn-primary 색상 */
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

/* 액션 버튼 그룹 */
.at-actions {
  margin-top: 30px;
  padding-top: 20px;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  gap: 10px; /* 버튼 간격 */
}

.at-btn {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  margin: 0 5px;
}

/* --------------------- [추가된 스타일] --------------------- */

/* '후원금 사용 용도' 헤더와 버튼 배치 */
.at-expenditure-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 수직 정렬 */
  margin-top: 25px;
  padding-bottom: 5px;
  border-bottom: 2px solid #e5e7eb; /* 구분을 위해 진한 선 */
}

/* 항목 추가 버튼 (색상 변경) */
.at-btn-add {
  background-color: #10b981; /* Green */
  color: white;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

/* 동적으로 생성되는 각 사용 내역 항목 컨테이너 */
.at-expenditure-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.at-expenditure-row {
  gap: 20px; /* 필드 간의 수평 간격 */
  margin-bottom: 15px;
  align-items: flex-end; /* 필드 높이 정렬 */
}

/* 2개의 필드가 한 줄에 들어가도록 너비 조정 */
.at-field-half {
  flex: 1; /* 남은 공간을 균등하게 분할 */
  min-width: 40%; /* 최소 너비 설정 (모바일 대응) */
}

/* 삭제 버튼 컨테이너 (오른쪽 정렬) */
.at-delete-col {
  display: flex;
  align-items: flex-end; /* 라벨과 입력 필드 높이에 맞춤 */
  padding-left: 10px;
}

/* 삭제 버튼 스타일 */
.at-btn-delete {
  background-color: #ef4444; /* Red */
  color: white;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap; /* 버튼 내용 줄바꿈 방지 */
}

/* 날짜 입력 필드 스타일 (일반 input[type=date]에 at-select 스타일 재사용) */
.at-date-field input[type="date"] {
  height: 38px; /* MaterialInput과 높이 맞추기 */
  line-height: 38px;
  /* at-select의 스타일을 상속받으면서 높이만 재조정 */
}

/* 모바일 대응 */
@media (max-width: 600px) {
  .at-page {
    padding: 20px;
  }
  .at-actions {
    flex-direction: column;
    gap: 10px;
  }
  .at-actions .at-btn {
    width: 100%;
    margin: 0;
  }

  /* 동적 항목 모바일 대응 */
  .at-expenditure-row {
    flex-direction: column;
    gap: 10px;
  }
  .at-field-half {
    min-width: 100%;
  }
  .at-delete-col {
    /* 모바일에서 삭제 버튼을 항목의 가장 아래에 위치 */
    padding-left: 0;
    width: 100%;
    margin-top: 10px;
  }
  .at-btn-delete {
    width: 100%;
  }
}
:deep(.ck-editor__editable) {
  min-height: 200px;
}
</style>
