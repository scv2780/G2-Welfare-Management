<template>
  <section class="p-6 max-w-5xl mx-auto">
    <!-- 헤더 -->
    <header class="mb-2 flex items-center justify-between header-row">
      <h2 class="text-2xl font-semibold">조사지 수정</h2>

      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록
      </MaterialButton>
    </header>

    <!-- 상태 -->
    <div v-if="loading">불러오는 중...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>

    <!-- 빈 상태 -->
    <div v-else-if="sections.length === 0" class="empty-state">
      <div class="text-gray-600 mb-2">아직 불러올 항목이 없습니다.</div>
      <p class="text-xs text-gray-400">
        템플릿 버전을 다시 선택해서 진입해 주세요.
      </p>
    </div>

    <!-- 수정 폼 -->
    <div v-else class="space-y-6">
      <!-- 섹션 -->
      <div v-for="(sec, sIndex) in sections" :key="sec.id" class="section-card">
        <!-- 섹션 헤더 -->
        <div class="section-header">
          <h3 class="section-title">항목 #{{ sIndex + 1 }}</h3>
          <div class="space-x-2">
            <MaterialButton
              color="dark"
              size="sm"
              variant="outlined"
              @click="addSubsection(sIndex)"
            >
              세부항목 추가
            </MaterialButton>
            <MaterialButton
              color="dark"
              size="sm"
              variant="outlined"
              @click="removeSection(sIndex)"
            >
              삭제
            </MaterialButton>
          </div>
        </div>

        <!-- 섹션 기본 정보 -->
        <div class="grid md:grid-cols-2 gap-3 mb-4">
          <div>
            <MaterialInput
              v-model="sec.title"
              id="sec-title-{{ sIndex }}"
              label="항목 제목"
              variant="static"
            />
          </div>
          <div>
            <MaterialInput
              v-model="sec.desc"
              id="sec-desc-{{ sIndex }}"
              label="항목 설명"
              variant="static"
            />
          </div>
        </div>

        <!-- 세부항목들 -->
        <div class="space-y-4">
          <div
            v-for="(sub, subIndex) in sec.subsections"
            :key="sub.id"
            class="subsection-card"
          >
            <!-- 서브 헤더 -->
            <div class="sub-header">
              <div class="font-medium text-sm">
                세부항목 #{{ subIndex + 1 }}
              </div>
              <div class="space-x-2">
                <MaterialButton
                  color="dark"
                  size="sm"
                  variant="outlined"
                  @click="addItem(sIndex, subIndex)"
                >
                  질문 추가
                </MaterialButton>
                <MaterialButton
                  color="dark"
                  size="sm"
                  variant="outlined"
                  @click="removeSubsection(sIndex, subIndex)"
                >
                  삭제
                </MaterialButton>
              </div>
            </div>

            <!-- 서브 기본 정보 -->
            <div class="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <MaterialInput
                  v-model="sub.title"
                  :id="`sub-title-${sec.id}-${sub.id}`"
                  label="세부항목 제목"
                  variant="static"
                />
              </div>
              <div>
                <MaterialInput
                  v-model="sub.desc"
                  :id="`sub-desc-${sec.id}-${sub.id}`"
                  label="세부항목 설명"
                  variant="static"
                />
              </div>
            </div>

            <!-- 질문들 -->
            <div class="space-y-3">
              <div
                v-for="(it, iIndex) in sub.items"
                :key="it.id"
                class="question-card"
              >
                <div class="question-header">
                  <div class="font-medium text-sm text-gray-800">
                    질문 #{{ iIndex + 1 }}
                  </div>
                  <MaterialButton
                    color="dark"
                    size="sm"
                    variant="outlined"
                    @click="removeItem(sIndex, subIndex, iIndex)"
                  >
                    삭제
                  </MaterialButton>
                </div>

                <div class="grid md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                      질문 타입
                    </label>
                    <select
                      v-model="it.type"
                      class="w-full input-basic"
                      @change="onChangeType(it)"
                    >
                      <option value="TEXT">단답형</option>
                      <option value="TEXTAREA">서술형</option>
                      <option value="RADIO">단일 선택</option>
                      <option value="CHECKBOX">다중 선택</option>
                    </select>
                  </div>

                  <div class="md:col-span-2">
                    <MaterialInput
                      v-model="it.text"
                      :id="`q-text-${it.id}`"
                      label="질문 내용"
                      variant="static"
                    />
                  </div>
                </div>

                <!-- 필수 여부: 스위치 -->
                <div class="mt-2">
                  <MaterialSwitch
                    :id="`required-${it.id}`"
                    name="required"
                    :checked="it.required"
                    labelClass="text-xs text-gray-700"
                    @change="toggleRequired(it, $event)"
                  >
                    필수 질문
                  </MaterialSwitch>
                </div>

                <!-- 옵션 (라벨만 사용) -->
                <div v-if="isChoiceType(it.type)" class="mt-4 border-t pt-3">
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-xs font-medium text-gray-700">
                      옵션 ({{ it.options.length }})
                    </div>
                    <MaterialButton
                      color="dark"
                      size="sm"
                      variant="outlined"
                      @click="addOption(sIndex, subIndex, iIndex)"
                    >
                      + 옵션 추가
                    </MaterialButton>
                  </div>

                  <div class="space-y-2">
                    <div
                      v-for="(op, oIndex) in it.options"
                      :key="op.id"
                      class="option-row"
                    >
                      <!-- 번호 -->
                      <div class="text-[11px] text-gray-500">
                        #{{ oIndex + 1 }}
                      </div>

                      <!-- 라벨 -->
                      <div>
                        <MaterialInput
                          v-model="op.label"
                          :id="`op-label-${it.id}-${op.id}`"
                          label="라벨"
                          variant="static"
                        />
                      </div>

                      <!-- 삭제 버튼 -->
                      <div class="text-right">
                        <MaterialButton
                          color="dark"
                          size="sm"
                          variant="outlined"
                          @click="
                            removeOption(sIndex, subIndex, iIndex, oIndex)
                          "
                        >
                          삭제
                        </MaterialButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- /question-card -->
            </div>
          </div>
          <!-- /subsection-card -->
        </div>
      </div>
      <!-- /section-card -->

      <!-- 하단 컨트롤 -->
      <div class="form-actions">
        <MaterialButton
          color="dark"
          size="sm"
          variant="outlined"
          @click="addSection"
        >
          + 항목 추가
        </MaterialButton>

        <MaterialButton
          color="dark"
          size="sm"
          :disabled="saving"
          @click="saveEdit"
        >
          {{ saving ? "저장 중..." : "수정 저장" }}
        </MaterialButton>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";
import MaterialInput from "@/components/MaterialInput.vue";
import MaterialSwitch from "@/components/MaterialSwitch.vue";

const router = useRouter();
const route = useRoute();

/** 라우트 파라미터: 신규 (:templateVerCode) 또는 구(:id) 둘 다 허용 */
const templateVerCode = computed(
  () => route.params.templateVerCode ?? route.params.id
);

const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const sections = ref([]);

/** 저장 시 사용할 메이저 템플릿 코드 (백엔드 응답에서 획득) */
const templateCodeForUpdate = ref(null);

/* ----------------- 유틸 ----------------- */
const newId = (() => {
  let id = 1;
  return () => id++;
})();

const isChoiceType = (t) =>
  ["RADIO", "CHECKBOX"].includes(String(t).toUpperCase());

/* ----------------- UI 조작 ----------------- */
function addSection() {
  sections.value.push({ id: newId(), title: "", desc: "", subsections: [] });
}

function removeSection(i) {
  sections.value.splice(i, 1);
}

function addSubsection(sIdx) {
  sections.value[sIdx].subsections.push({
    id: newId(),
    title: "",
    desc: "",
    items: [],
  });
}

function removeSubsection(sIdx, subIdx) {
  sections.value[sIdx].subsections.splice(subIdx, 1);
}

function addItem(sIdx, subIdx) {
  sections.value[sIdx].subsections[subIdx].items.push({
    id: newId(),
    type: "TEXT",
    text: "",
    required: false,
    options: [],
  });
}

function removeItem(sIdx, subIdx, iIdx) {
  sections.value[sIdx].subsections[subIdx].items.splice(iIdx, 1);
}

function onChangeType(item) {
  if (isChoiceType(item.type)) {
    if (!Array.isArray(item.options)) item.options = [];
    if (item.options.length === 0)
      item.options.push({ id: newId(), label: "" }); // 🔥 value 제거
  } else {
    item.options = [];
  }
}

function addOption(sIdx, subIdx, iIdx) {
  sections.value[sIdx].subsections[subIdx].items[iIdx].options.push({
    id: newId(),
    label: "",
  });
}

function removeOption(sIdx, subIdx, iIdx, oIdx) {
  sections.value[sIdx].subsections[subIdx].items[iIdx].options.splice(oIdx, 1);
}

// 스위치 토글 (change 이벤트는 안쪽 input에서 버블링됨)
function toggleRequired(item, event) {
  const checked = event?.target?.checked ?? !item.required;
  item.required = checked;
}

/* ----------------- 데이터 로드 ----------------- */
onMounted(async () => {
  loading.value = true;
  try {
    if (!templateVerCode.value)
      throw new Error("세부버전 코드(templateVerCode)가 없습니다.");

    const url = `/api/survey/detail/ver/${templateVerCode.value}`;
    const { data } = await axios.get(url);
    const payload = data?.result ?? data;

    // 저장 시 사용할 메이저 템플릿 코드 확보
    templateCodeForUpdate.value = payload?.template_code ?? null;

    const srcSections = payload.sections || [];
    sections.value = srcSections.map((s) => ({
      id: newId(),
      title: s.section_title ?? "",
      desc: s.section_desc ?? "",
      subsections: (s.subsections || []).map((sub) => ({
        id: newId(),
        title: sub.subsection_title ?? "",
        desc: sub.subsection_desc ?? "",
        items: (sub.items || []).map((it) => ({
          id: newId(),
          type: (it.question_type || "TEXT").toUpperCase(),
          text: it.question_text ?? "",
          required: it.is_required === "Y",
          // 🔥 기존 option_values에서 label만 가져옴 (value는 무시)
          options: (Array.isArray(it.option_values)
            ? it.option_values
            : []
          ).map((op, idx) => ({
            id: newId(),
            label: op.label ?? op.value ?? "",
            order: Number(op.order ?? idx + 1),
          })),
        })),
      })),
    }));
  } catch (e) {
    console.error(e);
    error.value = e?.response?.data?.message || e.message || "조사지 로드 실패";
  } finally {
    loading.value = false;
  }
});

/* ----------------- 저장(새 세부버전) ----------------- */
async function saveEdit() {
  if (saving.value) return;
  if (!templateCodeForUpdate.value) {
    alert("메이저 템플릿 코드가 없습니다. 화면을 새로고침해 주세요.");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      template: {
        created_by: 1,
        created_at: new Date().toISOString().slice(0, 10),
      },
      sections: sections.value.map((s, sIdx) => ({
        order: sIdx + 1,
        title: s.title,
        desc: s.desc,
        subsections: s.subsections.map((sub, subIdx) => ({
          order: subIdx + 1,
          title: sub.title,
          desc: sub.desc,
          items: sub.items.map((it, iIdx) => ({
            order: iIdx + 1,
            question_type: it.type,
            question_text: it.text,
            is_required: it.required ? "Y" : "N",
            option_values: isChoiceType(it.type)
              ? it.options.map((op, k) => {
                  const base = op.label || "";
                  return {
                    label: base,
                    value: base, // 🔥 value는 label과 동일하게 저장
                    order: k + 1,
                  };
                })
              : null,
          })),
        })),
      })),
    };

    const { data: res } = await axios.post(
      `/api/survey/update/${templateCodeForUpdate.value}`,
      payload
    );

    if (!res?.success) throw new Error(res?.message || "저장 실패");

    alert("새 버전으로 저장 완료!");
    router.push({ name: "surveyVersion" });
  } catch (e) {
    console.error("save error:", e);
    alert(e?.response?.data?.message || e.message || "저장 실패");
  } finally {
    saving.value = false;
  }
}

function goBack() {
  router.push({ name: "surveyVersion" });
}
</script>

<style scoped>
section {
  color: #111;
}

/* 헤더 한 줄 유지 */
.header-row {
  flex-wrap: nowrap;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
  background: #f9fafb;
  margin-bottom: 1.5rem;
}

/* 공통 select (MaterialInput이 아닌 애들) */
.input-basic {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background-color: #ffffff;
  width: 100%;
}

/* 섹션 카드 */
.section-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}

/* 섹션 헤더 줄 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-title {
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #4b5563;
}

/* 세부항목 카드 */
.subsection-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem;
}

/* 세부항목 헤더 */
.sub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

/* 질문 카드 */
.question-card {
  border-radius: 0.75rem;
  border: 1px dashed #d1d5db;
  padding: 0.9rem;
  background-color: #ffffff;
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

/* 옵션 행: 번호 + 라벨 + 삭제 버튼 */
.option-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1.5fr) 80px;
  gap: 0.5rem;
  align-items: center;
}

.form-actions {
  margin-top: 10px;
  padding-top: 0.5rem;
  border-top: 1px solid #d1d5db;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
</style>
