<template>
  <section class="p-6 max-w-5xl mx-auto">
    <!-- 헤더 -->
    <header class="mb-4 flex items-center justify-between header-row">
      <div>
        <h2 class="text-2xl font-semibold">제출본 수정</h2>
      </div>
      <MaterialButton color="dark" size="sm" @click="goBack">
        ← 상세로
      </MaterialButton>
    </header>

    <!-- 상태 -->
    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>

    <!-- 권한 가드 -->
    <div v-else-if="!canEdit" class="guard-card">
      수정 권한이 없습니다. (작성자: {{ submission?.written_by }}, 현재 사용자:
      {{ userId }})
    </div>

    <div v-else>
      <form @submit.prevent="save">
        <!-- 섹션 카드 -->
        <div
          v-for="(section, sIdx) in submission.sections"
          :key="section.section_code"
          class="section-card"
        >
          <div class="section-header">
            <h3 class="section-title">
              {{ sIdx + 1 }}. {{ section.section_title }}
            </h3>
            <p v-if="section.section_desc" class="section-desc">
              {{ section.section_desc }}
            </p>
          </div>

          <!-- 서브섹션 -->
          <div
            v-for="(sub, subIdx) in section.subsections"
            :key="sub.subsection_code"
            class="subsection-card"
          >
            <div class="sub-header">
              <h4 class="sub-title">
                {{ sIdx + 1 }}.{{ subIdx + 1 }} {{ sub.subsection_title }}
              </h4>
              <p v-if="sub.subsection_desc" class="sub-desc">
                {{ sub.subsection_desc }}
              </p>
            </div>

            <!-- 질문들 -->
            <div
              v-for="(item, iIdx) in sub.items"
              :key="item.item_code"
              class="question-card"
            >
              <label class="question-title block mb-2">
                {{ sIdx + 1 }}.{{ subIdx + 1 }}.{{ iIdx + 1 }}
                {{ item.question_text }}
                <span v-if="item.is_required === 'Y'" class="required-mark">
                  *
                </span>
              </label>

              <!-- TEXT → MaterialInput -->
              <MaterialInput
                v-if="isText(item)"
                v-model="answers[item.item_code]"
                :id="`item-${item.item_code}`"
                :name="`item-${item.item_code}`"
                variant="outline"
                size="default"
                :placeholder="item.placeholder || ''"
                :isRequired="item.is_required === 'Y'"
              />

              <!-- TEXTAREA -->
              <textarea
                v-else-if="isTextarea(item)"
                v-model="answers[item.item_code]"
                rows="4"
                class="textarea-basic"
              />

              <!-- RADIO -->
              <div v-else-if="isRadio(item)" class="choice-group">
                <label
                  v-for="opt in item.option_values"
                  :key="opt.value ?? opt.label"
                  class="choice-row"
                >
                  <input
                    type="radio"
                    :name="`r-${item.item_code}`"
                    :value="opt.value ?? opt.label"
                    v-model="answers[item.item_code]"
                  />
                  <span class="choice-label">
                    {{ opt.label ?? opt.value }}
                  </span>
                </label>
              </div>

              <!-- CHECKBOX -->
              <div v-else-if="isCheckbox(item)" class="choice-group">
                <label
                  v-for="opt in item.option_values"
                  :key="opt.value ?? opt.label"
                  class="choice-row"
                >
                  <input
                    type="checkbox"
                    :value="opt.value ?? opt.label"
                    v-model="answers[item.item_code]"
                  />
                  <span class="choice-label">
                    {{ opt.label ?? opt.value }}
                  </span>
                </label>
              </div>

              <div v-else class="unsupported">
                지원하지 않는 타입입니다. ({{ item.question_type }})
              </div>
            </div>
          </div>
        </div>

        <!-- 하단 버튼 -->
        <div class="form-actions">
          <MaterialButton
            type="button"
            color="dark"
            size="sm"
            variant="outlined"
            @click="goBack"
          >
            취소
          </MaterialButton>
          <MaterialButton type="submit" color="dark" size="sm">
            수정 완료
          </MaterialButton>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";
import MaterialInput from "@/components/MaterialInput.vue";

const route = useRoute();
const router = useRouter();
const submitCode = route.params.submitCode;

const user = JSON.parse(localStorage.getItem("user") || "{}");
const modifier = Number(user.user_code || 0);

// 쿼리로 넘어온 현재 사용자/역할 (로그인 없이 테스트용)
const role = computed(() => Number(route.query.role || 1));
const userId = computed(() => Number(route.query.userId || 1));

// ⚠️ ref 이름 충돌 방지: data → submissionRef
const submissionRef = ref(null);
const submission = computed(() => submissionRef.value);

const loading = ref(false);
const error = ref("");

// v-model 답변 상태: { [item_code]: string | string[] }
const answers = ref({});

// 권한: 일반 사용자 + 본인 작성건 (둘 다 숫자로 강제 비교)
const canEdit = computed(() => {
  if (!submission.value) return false;
  return (
    role.value === 1 &&
    Number(submission.value.written_by) === Number(userId.value)
  );
});

onMounted(async () => {
  await fetchDetail();
  if (submission.value) initAnswersFromDetail();
});

// ✅ fetchDetail (응답 변수명은 res로! shadowing 금지)
async function fetchDetail() {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get(`/api/survey/submission/${submitCode}`);
    if (res.data?.success === false)
      throw new Error(res.data.message || "조회 실패");

    const payload = res.data?.result ?? res.data;
    submissionRef.value = normalizePayload(payload);
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || "조회 실패";
  } finally {
    loading.value = false;
  }
}

function initAnswersFromDetail() {
  const map = {};
  submission.value.sections?.forEach((sec) => {
    sec.subsections?.forEach((sub) => {
      sub.items?.forEach((it) => {
        const parsed = parseAnswerText(it.answer_text);
        if (isCheckbox(it)) {
          map[it.item_code] = Array.isArray(parsed)
            ? parsed
            : parsed
            ? [String(parsed)]
            : [];
        } else {
          map[it.item_code] = Array.isArray(parsed)
            ? parsed[0] ?? ""
            : parsed ?? "";
        }
      });
    });
  });
  answers.value = map;
}

function goBack() {
  router.push({
    path: `/survey/submission/${submitCode}`,
    query: { role: role.value, userId: userId.value },
  });
}

// ✅ save (서버 에러 래핑 대응)
async function save() {
  try {
    // 필수 문항 검증
    const missing = [];
    submission.value.sections?.forEach((sec) => {
      sec.subsections?.forEach((sub) => {
        sub.items?.forEach((it) => {
          if (it.is_required === "Y") {
            const v = answers.value[it.item_code];
            if (isCheckbox(it)) {
              if (!Array.isArray(v) || v.length === 0)
                missing.push(it.question_text);
            } else {
              if (v == null || String(v).trim() === "")
                missing.push(it.question_text);
            }
          }
        });
      });
    });
    if (missing.length) {
      alert(`필수 문항을 입력해주세요:\n- ${missing.join("\n- ")}`);
      return;
    }

    const payload = {
      answers: answers.value,
      modifier,
    };
    const res = await axios.put(
      `/api/survey/submission/${submitCode}`,
      payload
    );
    if (res.data?.success === false)
      throw new Error(res.data.message || "수정 실패");

    alert("수정 완료!");
    goBack();
  } catch (e) {
    alert(e?.response?.data?.message || e.message || "수정 실패");
  }
}

/* ---------- 타입/유틸 ---------- */
function isRadio(it) {
  return String(it.question_type).toUpperCase() === "RADIO";
}
function isCheckbox(it) {
  return String(it.question_type).toUpperCase() === "CHECKBOX";
}
function isText(it) {
  return String(it.question_type).toUpperCase() === "TEXT";
}
function isTextarea(it) {
  return String(it.question_type).toUpperCase() === "TEXTAREA";
}

function normalizeOptions(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return [];
    try {
      return JSON.parse(s);
    } catch {
      return [];
    }
  }
  return [];
}
function normalizePayload(payload) {
  if (!payload) return payload;
  const copy = JSON.parse(JSON.stringify(payload));
  copy.sections?.forEach((sec) => {
    sec.subsections?.forEach((sub) => {
      sub.items?.forEach((it) => {
        it.option_values = normalizeOptions(it.option_values);
      });
    });
  });
  return copy;
}
function parseAnswerText(answer_text) {
  if (answer_text == null) return null;
  if (Array.isArray(answer_text)) return answer_text;
  if (typeof answer_text === "object") return answer_text;
  if (typeof answer_text === "string") {
    const s = answer_text.trim();
    if (!s) return "";
    if (
      (s.startsWith("[") && s.endsWith("]")) ||
      (s.startsWith("{") && s.endsWith("}"))
    ) {
      try {
        return JSON.parse(s);
      } catch {
        return s;
      }
    }
    return s;
  }
  return String(answer_text);
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

/* 권한 가드 메시지 카드 */
.guard-card {
  margin-top: 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  border: 1px dashed #fecaca;
  background-color: #fef2f2;
  font-size: 0.85rem;
  color: #b91c1c;
}

/* 섹션 카드 */
.section-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.25rem 1.3rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  margin-bottom: 1.25rem;
}

/* 섹션 헤더 */
.section-header {
  padding-bottom: 0.6rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.section-desc {
  margin-top: 0.2rem;
  font-size: 0.8rem;
  color: #6b7280;
}

/* 서브섹션 */
.subsection-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem;
  margin-top: 0.75rem;
}

.sub-header {
  margin-bottom: 0.6rem;
}

.sub-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.sub-desc {
  margin-top: 0.15rem;
  font-size: 0.78rem;
  color: #6b7280;
}

/* 질문 카드 */
.question-card {
  border-radius: 0.7rem;
  border: 1px dashed #d1d5db;
  background-color: #ffffff;
  padding: 0.8rem 0.85rem;
  margin-bottom: 0.6rem;
}

.question-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}

.required-mark {
  margin-left: 0.2rem;
  font-size: 0.8rem;
  color: #dc2626;
}

/* TEXTAREA 스타일 */
.textarea-basic {
  width: 100%;
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
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.16);
}

/* 라디오 / 체크박스 그룹 */
.choice-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.choice-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #111827;
}

.choice-row input[type="radio"],
.choice-row input[type="checkbox"] {
  width: 14px;
  height: 14px;
}

.choice-label {
  line-height: 1.3;
}

/* 지원 안 되는 타입 */
.unsupported {
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
}

/* 폼 하단 버튼 영역 */
.form-actions {
  margin-top: 1.2rem;
  padding-top: 0.9rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
</style>
