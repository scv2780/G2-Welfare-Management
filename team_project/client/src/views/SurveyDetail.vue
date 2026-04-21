<template>
  <section class="p-6 max-w-5xl mx-auto">
    <!-- 헤더 -->
    <header class="mb-4 flex items-center justify-between header-row">
      <h2 class="text-2xl font-semibold">버전 상세</h2>

      <div class="space-x-2">
        <MaterialButton
          color="dark"
          size="sm"
          variant="outlined"
          @click="goBack"
        >
          ← 목록으로
        </MaterialButton>
      </div>
    </header>

    <!-- 상태 -->
    <div v-if="loading">불러오는 중...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <div v-else-if="!survey">조사지를 찾을 수 없습니다.</div>

    <!-- 실제 내용 -->
    <div v-else>
      <!-- 상단 메타 정보 카드 -->
      <div class="meta-card">
        <div class="meta-row">
          <div class="meta-label">템플릿 코드</div>
          <div class="meta-value">{{ survey.template_code }}</div>
        </div>
        <div class="meta-row">
          <div class="meta-label">템플릿 버전 코드</div>
          <div class="meta-value">{{ survey.template_ver_code }}</div>
        </div>
        <div class="meta-row">
          <div class="meta-label">메이저 버전</div>
          <div class="meta-value">{{ survey.version_no }}</div>
        </div>
        <div class="meta-row">
          <div class="meta-label">세부 버전</div>
          <div class="meta-value">{{ survey.version_detail_no }}</div>
        </div>
      </div>

      <!-- 섹션들 -->
      <div
        v-for="(section, sIdx) in survey.sections"
        :key="section.section_code"
        class="section-card"
      >
        <!-- 섹션 헤더 -->
        <div class="section-header">
          <div>
            <h4 class="section-title">
              항목 #{{ sIdx + 1 }} — {{ section.section_title || "제목 없음" }}
            </h4>
            <p class="section-desc">
              {{ section.section_desc || "설명 없음" }}
            </p>
          </div>
        </div>

        <!-- 세부항목들 -->
        <div
          v-for="(sub, subIdx) in section.subsections"
          :key="sub.subsection_code"
          class="subsection-card"
        >
          <div class="sub-header">
            <div>
              <h5 class="sub-title">
                세부항목 #{{ sIdx + 1 }}.{{ subIdx + 1 }} —
                {{ sub.subsection_title || "제목 없음" }}
              </h5>
              <p class="sub-desc">
                {{ sub.subsection_desc || "설명 없음" }}
              </p>
            </div>
          </div>

          <!-- 질문 리스트 -->
          <ul class="space-y-3">
            <li
              v-for="(item, iIdx) in sub.items"
              :key="item.item_code"
              class="question-card"
            >
              <div class="q-title-row">
                <div class="q-main">
                  <span class="q-index">
                    {{ sIdx + 1 }}.{{ subIdx + 1 }}.{{ iIdx + 1 }}
                  </span>
                  <span class="q-text">
                    {{ item.question_text || "질문 내용 없음" }}
                  </span>
                  <span
                    v-if="item.is_required === 'Y'"
                    class="q-required-badge"
                  >
                    필수
                  </span>
                </div>
              </div>

              <div class="q-meta">
                <div>
                  질문 유형:
                  <span class="q-type">
                    {{ questionTypeLabel(item.question_type) }}
                  </span>
                </div>

                <!-- 옵션 값 출력 -->
                <div v-if="normalizeOptions(item).length" class="q-options">
                  <span class="q-options-label">질문 내용:</span>
                  <ul class="q-options-list">
                    <li
                      v-for="(opt, oIdx) in normalizeOptions(item)"
                      :key="oIdx"
                      class="q-option-item"
                    >
                      {{ opt }}
                    </li>
                  </ul>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="form-actions">
        <MaterialButton color="dark" size="sm" @click="goEdit">
          수정하기
        </MaterialButton>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";

const route = useRoute();
const router = useRouter();

const templateVerCode = computed(() => route.params.templateVerCode);
const data = ref(null);
const survey = computed(() => data.value); // 템플릿에서 쓰는 별칭
const loading = ref(false);
const error = ref(null);

async function fetchDetail() {
  loading.value = true;
  error.value = null;
  try {
    if (!templateVerCode.value) {
      throw new Error("세부버전 코드가 없습니다.");
    }
    const res = await axios.get(
      `/api/survey/detail/ver/${templateVerCode.value}`
    );
    data.value = res.data?.result || null;
  } catch (e) {
    error.value = e?.message || "상세 조회 중 오류";
    data.value = null;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push({ name: "surveyVersion" });
}

function goEdit() {
  if (!survey.value) return;
  router.push({
    name: "survey-edit",
    params: { id: survey.value.template_ver_code },
  });
}

/** 질문 유형 → 한글 라벨 매핑 */
function questionTypeLabel(type) {
  const t = (type ?? "").toString().trim().toUpperCase();
  switch (t) {
    case "RADIO":
      return "단일선택";
    case "CHECKBOX":
      return "다중선택";
    case "TEXT":
      return "단답형";
    case "TEXTAREA":
      return "서술형";
    default:
      return type || "-";
  }
}

/**
 * option_values를 화면용 배열로 변환
 * - 배열이면 그대로(객체면 label/text 우선)
 * - 문자열이면 개행/쉼표 기준으로 분리
 */
function normalizeOptions(item) {
  const raw = item?.option_values;
  if (!raw) return [];

  // 배열 형태인 경우
  if (Array.isArray(raw)) {
    return raw
      .map((v) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object") {
          return v.label ?? v.text ?? "";
        }
        return "";
      })
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);
  }

  // 문자열 형태인 경우 (줄바꿈, 쉼표 기준 분리)
  if (typeof raw === "string") {
    return raw
      .split(/[\n,]/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  // 그 외는 표시 X
  return [];
}

onMounted(fetchDetail);
watch(templateVerCode, fetchDetail);
</script>

<style scoped>
section {
  color: #111827;
}

/* 헤더 한 줄 유지 */
.header-row {
  flex-wrap: nowrap;
}

/* 상단 메타 정보 카드 */
.meta-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem 1.5rem;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.meta-label {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
}

.meta-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: #111827;
}

/* 섹션 카드 */
.section-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}

/* 섹션 헤더 */
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.section-desc {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* 세부항목 카드 */
.subsection-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem 1rem;
  margin-top: 0.9rem;
}

.sub-header {
  margin-bottom: 0.5rem;
}

.sub-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
}

.sub-desc {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.15rem;
}

/* 질문 카드 */
.question-card {
  border-radius: 0.7rem;
  border: 1px dashed #d1d5db;
  padding: 0.75rem 0.9rem;
  background-color: #ffffff;
}

.q-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.q-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.q-index {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
}

.q-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #111827;
}

.q-required-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  background-color: #fee2e2;
  color: #b91c1c;
}

.q-meta {
  margin-top: 0.45rem;
  font-size: 0.78rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.q-type {
  font-weight: 500;
  color: #111827;
}

/* 옵션 영역 */
.q-options {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin-top: 0.1rem;
}

.q-options-label {
  flex: 0 0 auto;
  font-weight: 500;
  color: #4b5563;
}

.q-options-list {
  flex: 1 1 auto;
  list-style-type: disc;
  padding-left: 1.1rem;
  margin: 0;
}

.q-option-item {
  font-size: 0.78rem;
  color: #374151;
}

/* 하단 버튼 영역 */
.form-actions {
  padding-top: 0.9rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
