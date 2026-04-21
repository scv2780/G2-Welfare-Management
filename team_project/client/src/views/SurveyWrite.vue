<template>
  <section class="p-6 max-w-5xl mx-auto">
    <!-- 헤더 -->
    <header class="mb-3 flex items-center justify-between header-row">
      <h2 class="text-2xl font-semibold">조사지 작성</h2>

      <div class="space-x-2">
        <MaterialButton
          color="dark"
          size="sm"
          variant="outlined"
          @click="goBack"
        >
          ← 목록
        </MaterialButton>
      </div>
    </header>

    <!-- 작성자 정보 -->
    <div class="writer-card">
      <h3 class="writer-title">지원자 정보</h3>
      <p class="writer-desc">지원을 신청하는 지원자를 선택해주세요.</p>

      <div class="space-y-3">
        <!-- 본인 작성 -->
        <label class="writer-row">
          <span class="writer-left">
            <input
              type="radio"
              value="SELF"
              v-model="writerType"
              class="writer-radio"
            />
            <span> 지원자 본인 입니다.</span>
          </span>

          <!-- 오른쪽 열: 첫 줄은 비워두기 (정렬용) -->
          <span class="writer-right">
            <input
              type="text"
              v-model="disabilityType"
              class="delegate-select"
              :disabled="writerType !== 'SELF'"
              placeholder="장애 유형을 입력하세요"
            />
          </span>
        </label>

        <!-- 대리인 작성 -->
        <label class="writer-row">
          <span class="writer-left">
            <input
              type="radio"
              value="DELEGATE"
              v-model="writerType"
              class="writer-radio"
            />
            <span> 대리인 입니다.</span>
          </span>

          <span class="writer-right">
            <select
              v-model="selectedPersonCode"
              class="delegate-select"
              :disabled="writerType !== 'DELEGATE'"
            >
              <option value="">지원자를 선택하세요</option>
              <option
                v-for="person in delegateOptions"
                :key="person.code"
                :value="person.code"
              >
                {{ person.name }}
              </option>
            </select>
          </span>
        </label>
      </div>
    </div>

    <div v-if="!survey" class="text-gray-500 mt-4">불러오는 중...</div>

    <div v-else class="space-y-6 mt-4">
      <!-- 섹션 카드 -->
      <div
        v-for="section in survey.sections"
        :key="section.section_code"
        class="section-card"
      >
        <div class="section-header">
          <h3 class="section-title">
            {{ section.section_title }}
          </h3>
          <p v-if="section.section_desc" class="section-desc">
            {{ section.section_desc }}
          </p>
        </div>

        <!-- 세부항목들 -->
        <div
          v-for="sub in section.subsections"
          :key="sub.subsection_code"
          class="subsection-card"
        >
          <div class="sub-header">
            <div class="font-medium text-sm text-gray-800 question-title">
              {{ sub.subsection_title }}
            </div>
            <p v-if="sub.subsection_desc" class="text-xs text-gray-500 mt-0.5">
              {{ sub.subsection_desc }}
            </p>
          </div>

          <!-- 질문들 -->
          <div class="space-y-4 mt-2">
            <div
              v-for="item in sub.items"
              :key="item.item_code"
              class="question-card"
            >
              <!-- 질문 헤더 -->
              <div class="flex items-center justify-between mb-2">
                <div class="question-title">
                  {{ item.question_text }}
                  <span
                    v-if="item.is_required === 'Y'"
                    class="text-red-500 text-xs ml-1"
                    >*</span
                  >
                </div>
              </div>

              <!-- TEXT: MaterialInput 사용 -->
              <div v-if="item.question_type === 'TEXT'">
                <MaterialInput
                  v-model="answers[item.item_code]"
                  :id="`item-${item.item_code}`"
                  label="답변"
                  variant="static"
                  size="default"
                />
              </div>

              <!-- TEXTAREA -->
              <div v-else-if="item.question_type === 'TEXTAREA'">
                <label
                  class="block text-xs font-medium text-gray-500 mb-1"
                  :for="`item-${item.item_code}`"
                >
                  내용
                </label>
                <MaterialTextarea
                  :id="`item-${item.item_code}`"
                  variant="outline"
                  :rows="5"
                  placeholder="내용을 입력하세요"
                  :value="answers[item.item_code]"
                  @input="(e) => (answers[item.item_code] = e.target.value)"
                />
              </div>

              <!-- RADIO (기본 input 사용) -->
              <div v-else-if="item.question_type === 'RADIO'" class="space-y-1">
                <div class="helper-text">보기 중 하나를 선택하세요</div>

                <label
                  v-for="opt in item.option_values"
                  :key="opt.value"
                  class="choice-basic"
                >
                  <input
                    type="radio"
                    :name="`item_${item.item_code}`"
                    :value="opt.value"
                    v-model="answers[item.item_code]"
                    class="basic-radio"
                  />
                  <span>{{ opt.label }}</span>
                </label>
              </div>

              <!-- CHECKBOX (기본 input 사용) -->
              <div
                v-else-if="item.question_type === 'CHECKBOX'"
                class="space-y-1"
              >
                <div class="helper-text">해당되는 항목을 모두 선택하세요</div>

                <label
                  v-for="opt in item.option_values"
                  :key="opt.value"
                  class="choice-basic"
                >
                  <input
                    type="checkbox"
                    :value="opt.value"
                    :checked="isChecked(item.item_code, opt.value)"
                    class="basic-checkbox"
                    @change="
                      toggleCheckbox(
                        item.item_code,
                        opt.value,
                        $event.target.checked
                      )
                    "
                  />
                  <span>{{ opt.label }}</span>
                </label>
              </div>

              <!-- 기타 타입 방어 -->
              <div v-else class="text-xs text-gray-400 italic">
                지원되지 않는 질문 타입입니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="form-actions">
        <MaterialButton
          color="dark"
          size="sm"
          class="px-5"
          @click="submitSurvey"
        >
          제출하기
        </MaterialButton>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

import MaterialButton from "@/components/MaterialButton.vue";
import MaterialInput from "@/components/MaterialInput.vue";
import MaterialTextarea from "@/components/MaterialTextarea.vue";

const router = useRouter();
const survey = ref(null);
const answers = ref({});

/** 작성자 선택 상태 */
const writerType = ref("SELF"); // SELF | DELEGATE
const selectedPersonCode = ref("");
// TODO: 실제 API 연결 시 axios로 교체
const delegateOptions = ref([]);

const disabilityType = ref("");

// 체크박스용 헬퍼: 현재 값에 포함되어 있는지
function isChecked(itemCode, value) {
  const arr = answers.value[itemCode];
  if (!Array.isArray(arr)) return false;
  return arr.includes(value);
}

// 체크박스 토글 → 배열로 저장
function toggleCheckbox(itemCode, value, checked) {
  const current = Array.isArray(answers.value[itemCode])
    ? [...answers.value[itemCode]]
    : [];

  if (checked) {
    if (!current.includes(value)) current.push(value);
  } else {
    const idx = current.indexOf(value);
    if (idx !== -1) current.splice(idx, 1);
  }

  answers.value[itemCode] = current;
}

onMounted(async () => {
  try {
    // 1) 최신 조사지
    const { data } = await axios.get("/api/survey/latest");
    const payload = data?.result ?? data;
    survey.value = payload;

    const initial = {};
    for (const section of payload?.sections ?? []) {
      for (const sub of section.subsections ?? []) {
        for (const item of sub.items ?? []) {
          const t = String(item.question_type).toUpperCase();
          initial[item.item_code] = t === "CHECKBOX" ? [] : "";
        }
      }
    }
    answers.value = initial;

    // 2) 로그인 사용자 정보에서 user_code 꺼내기
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      const userCode = u.user_code ?? null;

      if (userCode) {
        // 3) 자녀(지원자) 목록 조회
        const { data: childRes } = await axios.get("/api/survey/children", {
          params: { userId: userCode },
        });
        delegateOptions.value = childRes.result ?? [];

        const { data: meRes } = await axios.get("/api/survey/disability-type", {
          params: { user_code: userCode },
        });
        disabilityType.value = meRes.result?.disability_type ?? "";
      }
    }
  } catch (e) {
    alert("조사지 불러오기 실패: " + (e.response?.data?.message || e.message));
  }
});

// 제출하기
async function submitSurvey() {
  try {
    //  1) SELF 선택 시 장애유형 필수
    if (writerType.value === "SELF") {
      if (!disabilityType.value || disabilityType.value.trim() === "") {
        alert("장애 유형을 입력해주세요.");
        return;
      }
    }

    //  2) 필수 질문 유효성 검사
    for (const section of survey.value.sections) {
      for (const sub of section.subsections) {
        for (const item of sub.items) {
          if (item.is_required === "Y") {
            const val = answers.value[item.item_code];

            // TEXT / TEXTAREA
            if (
              item.question_type === "TEXT" ||
              item.question_type === "TEXTAREA"
            ) {
              if (!val || val.trim() === "") {
                alert(`필수 질문을 입력해주세요:\n"${item.question_text}"`);
                return;
              }
            }

            // RADIO (단일 선택)
            if (item.question_type === "RADIO") {
              if (!val || val === "") {
                alert(`필수 질문을 선택해주세요:\n"${item.question_text}"`);
                return;
              }
            }

            // CHECKBOX (복수 선택)
            if (item.question_type === "CHECKBOX") {
              if (!Array.isArray(val) || val.length === 0) {
                alert(
                  `필수 체크박스 항목을 선택해주세요:\n"${item.question_text}"`
                );
                return;
              }
            }
          }
        }
      }
    }

    // 대리인인데 대상자를 안 골랐을 때 간단 검증
    if (writerType.value === "DELEGATE" && !selectedPersonCode.value) {
      alert("대상자를 선택해주세요.");
      return;
    }

    // 🔹 로그인 정보 가져오기
    const stored = localStorage.getItem("user");
    let userCode = null;

    if (stored) {
      const u = JSON.parse(stored);
      userCode = u.user_code ?? u.userCode ?? u.id ?? null;
    }

    if (!userCode) {
      alert("로그인 정보를 찾을 수 없습니다. (user_code 없음)");
      return;
    }

    // 🔥 SELF일 경우 장애유형 저장
    if (writerType.value === "SELF" && disabilityType.value) {
      await axios.put("/api/survey/disability-type", {
        user_code: Number(userCode),
        disability_type: disabilityType.value,
      });
    }

    const payload = {
      template_ver_code: survey.value.template_ver_code,
      answers: answers.value,
      written_by: Number(userCode),
      writer_type: writerType.value,
      target_person_code:
        writerType.value === "DELEGATE" ? selectedPersonCode.value : null,
    };

    const res = await axios.post("/api/survey/submit", payload);

    if (res.data?.success !== false) {
      alert("응답이 저장되었습니다!");
      router.push("/survey-list");
    } else {
      alert("저장 실패: " + (res.data?.message || "알 수 없는 오류"));
    }
  } catch (e) {
    alert("저장 실패: " + (e.response?.data?.message || e.message));
  }
}

function goBack() {
  router.push("/survey-list");
}
</script>

<style scoped>
section {
  color: #111827;
}

/* 헤더 한 줄 유지 */
.header-row {
  flex-wrap: nowrap;
}

/* ---------- 작성자 카드 ---------- */
.writer-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
  margin-top: 0.5rem;
}

.writer-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.writer-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.writer-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
}

.writer-row-delegate {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* 라디오-텍스트-셀렉트 간격 */
  flex-wrap: nowrap; /* 줄바꿈 X */
}

.writer-radio {
  width: 14px;
  height: 14px;
}

.delegate-select {
  min-width: 180px;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 0.35rem 0.75rem;
  font-size: 0.875rem;
  background-color: #ffffff;
}

/* 섹션 카드 */
.section-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
}

.section-header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.section-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.2rem;
}

/* 서브섹션 카드 */
.subsection-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem;
  margin-top: 0.75rem;
}

.sub-header {
  margin-bottom: 0.25rem;
}

/* 질문 카드 */
.question-card {
  border-radius: 0.7rem;
  border: 1px dashed #d1d5db;
  padding: 0.8rem;
  background-color: #ffffff;
}

/* MaterialInput 위/아래 간격 줄이기 */
:deep(.input-group) {
  margin-top: 0.15rem;
  margin-bottom: 0.15rem;
}

/* TEXTAREA 스타일 */
.textarea-basic {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  resize: vertical;
  min-height: 80px;
  background-color: #ffffff;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.textarea-basic:focus {
  border-color: #111827;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.18);
}

/* 질문 제목: 더 크고 또렷하게 */
.question-title {
  font-size: 0.95rem; /* 기본 15px 정도 */
  font-weight: 600;
  color: #111827;
}

/* 보조 설명 텍스트: 더 작고 옅게 */
.helper-text {
  font-size: 0.7rem; /* 11px 정도 */
  color: #6b7280;
  margin-bottom: 0.25rem;
}

/* 라디오/체크박스 왼쪽 들여쓰기 통일 */
.choice-control {
  margin-left: 0;
  padding-left: 0;
}

.form-actions {
  margin-top: 10px;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
/* 기본 라디오/체크박스 + 라벨 정렬 */
.choice-basic {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #111827;
}

/* 라디오/체크박스 크기 */
.basic-radio,
.basic-checkbox {
  width: 15px;
  height: 15px;
}
</style>
