<!-- src/views/ResultWrite.vue -->
<template>
  <section class="p-6">
    <div class="page-shell space-y-6">
      <!-- 상단 타이틀 -->
      <header class="page-header">
        <h2 class="page-title text-2xl md:text-3xl font-bold tracking-tight">
          지원결과 작성
        </h2>

        <div class="header-actions">
          <MaterialButton color="dark" size="sm" @click="handleLoad">
            불러오기
          </MaterialButton>
          <MaterialButton color="dark" size="sm" @click="handleTempSave">
            임시 저장
          </MaterialButton>
        </div>
      </header>

      <!-- 로딩 / 에러 -->
      <p v-if="loading" class="text-sm text-gray-500">
        기본 정보를 불러오는 중입니다...
      </p>
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <!-- ✅ 기본정보 카드 (그리드) -->
      <div class="meta-card">
        <div class="meta-grid">
          <!-- 1. 지원자 -->
          <div class="meta-item">
            <span class="meta-label">지원자</span>
            <span class="meta-value">
              {{ submitInfo.childName || "본인" }}
            </span>
          </div>

          <!-- 2. 보호자 -->
          <div class="meta-item">
            <span class="meta-label">보호자</span>
            <span class="meta-value">
              {{ submitInfo.guardianName || "-" }}
            </span>
          </div>

          <!-- 3. 담당자 -->
          <div class="meta-item">
            <span class="meta-label">담당자</span>
            <span class="meta-value">
              {{ submitInfo.assigneeName || "-" }}
            </span>
          </div>

          <!-- 4. 장애유형 -->
          <div class="meta-item">
            <span class="meta-label">장애유형</span>
            <span class="meta-value">
              {{ submitInfo.disabilityType || "-" }}
            </span>
          </div>

          <!-- 우선순위 -->
          <div class="meta-item">
            <span class="meta-label">우선순위</span>
            <span class="meta-value">
              {{ priorityLabel(submitInfo.level) || "-" }}
            </span>
          </div>

          <!-- 5. 계획작성일 (계획서 작성/제출일) -->
          <div class="meta-item">
            <span class="meta-label">계획작성일</span>
            <span class="meta-value">
              <MaterialButton color="dark" size="sm" @click="openPlanDetail">
                {{ formattedPlanWrittenAt }}
              </MaterialButton>
            </span>
          </div>

          <!-- 6. 실제 진행기간 -->
          <div class="meta-item">
            <span class="meta-label">실제 진행기간</span>
            <span class="meta-value period-value">
              <input
                type="month"
                v-model="mainForm.actualStart"
                class="input input-month"
              />
              <span class="mx-1">~</span>
              <input
                type="month"
                v-model="mainForm.actualEnd"
                class="input input-month"
              />
            </span>
          </div>
        </div>
      </div>

      <!-- 메인 결과 카드 -->
      <div class="card-block space-y-4">
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">계획했던 목표</label>

          <select v-model="mainForm.goal" class="input goal-select">
            <option value="">계획서 목표 선택</option>
            <option v-for="goal in planGoals" :key="goal" :value="goal">
              {{ goal }}
            </option>
          </select>
        </div>

        <!-- 결과 내용 (일반용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (일반용)
          </label>
          <MaterialTextarea
            id="result-content-public"
            variant="outline"
            :rows="4"
            placeholder="대상자/일반용 결과 내용을 입력하세요..."
            :value="mainForm.publicContent"
            @input="(e) => (mainForm.publicContent = e.target.value)"
          />
        </div>

        <!-- 결과 내용 (관리자용 / 관리자용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (관리자용)
          </label>
          <MaterialTextarea
            id="result-content-private"
            variant="outline"
            :rows="4"
            placeholder="관계자/관리자용 결과 내용을 입력하세요..."
            :value="mainForm.privateContent"
            @input="(e) => (mainForm.privateContent = e.target.value)"
          />
        </div>

        <!-- 첨부 파일 -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">첨부 파일</label>
          <input
            ref="fileInputRef"
            type="file"
            multiple
            @change="onMainFilesChange"
            class="file-input"
          />
          <p class="mt-1 text-xs text-gray-500">
            * 여러 개 파일을 한 번에 선택하거나, 나눠서 여러 번 선택할 수
            있습니다.
          </p>

          <!-- 임시저장 첨부파일 목록 -->
          <ul
            v-if="existingFiles.length"
            class="mt-2 text-xs text-gray-700 space-y-1"
          >
            <li
              v-for="(file, idx) in existingFiles"
              :key="file.attachCode"
              class="file-row"
            >
              <a
                :href="file.url"
                target="_blank"
                rel="noopener noreferrer"
                class="file-link"
              >
                {{ file.originalFilename }}
              </a>
              <button
                type="button"
                class="chip-button"
                @click="removeExistingFile(idx, file.attachCode)"
              >
                삭제
              </button>
            </li>
          </ul>

          <!-- 새로 선택한 파일 목록 -->
          <ul
            v-if="mainFiles.length"
            class="mt-2 text-xs text-gray-700 space-y-1"
          >
            <li
              v-for="(file, idx) in mainFiles"
              :key="file.name + '_' + file.lastModified + '_' + idx"
              class="file-row"
            >
              <span class="file-link">
                {{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)
              </span>
              <button
                type="button"
                class="chip-button"
                @click="removeMainFile(idx)"
              >
                삭제
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 추가 결과 카드들 -->
      <div
        v-for="item in resultItems"
        :key="item.id"
        class="record-card space-y-4"
      >
        <div class="record-header">
          <h4 class="font-medium text-sm">추가 결과</h4>

          <MaterialButton
            color="dark"
            size="sm"
            variant="outlined"
            @click="removeResultItem(item.id)"
          >
            제거
          </MaterialButton>
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">계획했던 목표</label>

          <select v-model="item.goal" class="input goal-select">
            <option value="">계획서 목표 선택</option>
            <option v-for="goal in planGoals" :key="goal" :value="goal">
              {{ goal }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (일반용)
          </label>
          <MaterialTextarea
            :id="`result-item-public-${item.id}`"
            variant="outline"
            :rows="3"
            placeholder="대상자/일반용 결과 내용을 입력하세요..."
            :value="item.publicContent"
            @input="(e) => (item.publicContent = e.target.value)"
          />
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (관리자용)
          </label>
          <MaterialTextarea
            :id="`result-item-private-${item.id}`"
            variant="outline"
            :rows="3"
            placeholder="관계자/관리자용 결과 내용을 입력하세요..."
            :value="item.privateContent"
            @input="(e) => (item.privateContent = e.target.value)"
          />
        </div>
      </div>

      <!-- 하단 버튼 라인 -->
      <div class="action-bar">
        <div class="left-actions">
          <MaterialButton color="dark" size="sm" @click="goBack">
            작성 취소
          </MaterialButton>

          <MaterialButton color="dark" size="sm" @click="addResultItem">
            + 결과 추가
          </MaterialButton>
        </div>

        <div class="right-actions">
          <MaterialButton
            color="dark"
            size="sm"
            class="ml-auto shrink-0"
            @click="submitAll"
          >
            제출하기
          </MaterialButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

import MaterialButton from "@/components/MaterialButton.vue";
import MaterialTextarea from "@/components/MaterialTextarea.vue";

const route = useRoute();
const router = useRouter();

const planGoals = ref([]);

const submitCode = Number(route.params.submitcode || 0);
const planCode = Number(route.query.planCode || 0);

// ✅ 기본 정보 (상세 화면과 동일한 필드 구조)
const submitInfo = ref({
  childName: "",
  guardianName: "",
  assigneeName: "",
  disabilityType: "",
  planSubmitAt: "",
  level: "",
});

const formattedPlanWrittenAt = computed(() => {
  const v = submitInfo.value.planSubmitAt;
  return v ? String(v).slice(0, 10) : "-";
});

// 메인 결과 폼
const mainForm = ref({
  resultDate: "", // 결과 작성일 (오늘 날짜)
  actualStart: "", // 실제 진행기간 시작 (YYYY-MM)
  actualEnd: "", // 실제 진행기간 종료 (YYYY-MM)
  goal: "",
  publicContent: "",
  privateContent: "",
});

// 첨부 파일들
const mainFiles = ref([]); // File[]
const fileInputRef = ref(null);

// 임시저장된 파일
const existingFiles = ref([]);
// 삭제할 첨부
const removedAttachCodes = ref([]);

// 추가 결과 목록
const resultItems = ref([]); // { id, goal, publicContent, privateContent }[]

const loading = ref(false);
const error = ref("");

// 오늘 날짜 YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ✅ 기본정보 로딩 (지원자/보호자/담당자/장애유형/계획작성일)
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    // 백엔드 라우터: GET /api/result/:submitCode (결과 작성용 기본정보)
    const { data } = await axios.get(`/api/result/${submitCode}`, {
      params: {
        planCode: planCode || undefined, // 🔹 planCode가 있으면 같이 전송
      },
    });
    if (!data?.success || !data.result) {
      throw new Error(data?.message || "기본 정보를 찾을 수 없습니다.");
    }

    const res = data.result;

    submitInfo.value = {
      childName: res.childName || "",
      guardianName: res.guardianName || "",
      assigneeName: res.assigneeName || "",
      disabilityType: res.disabilityType || "",
      planSubmitAt: res.planSubmitAt || "",
      level: res.level || "",
    };

    // 결과 작성일 기본값이 없으면 오늘 날짜
    if (!mainForm.value.resultDate) {
      mainForm.value.resultDate = getTodayStr();
    }

    if (Array.isArray(res.planGoals)) {
      // null / 빈 문자열 제거
      const goals = res.planGoals.map((g) => (g || "").trim()).filter((g) => g);

      planGoals.value = [...new Set(goals)]; // 중복 제거
    } else {
      planGoals.value = [];
    }

    // ✅ 메인 목표 비어있으면 첫 번째 목표를 기본값으로
    if (!mainForm.value.goal && planGoals.value.length > 0) {
      mainForm.value.goal = planGoals.value[0];
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "기본 정보 조회 중 오류";
  } finally {
    loading.value = false;
  }
}

function priorityLabel(code) {
  const c = (code || "").toUpperCase();
  switch (c) {
    case "BB1":
      return "긴급";
    case "BB2":
      return "중점";
    case "BB3":
      return "계획";
    default:
      return "-";
  }
}

onMounted(() => {
  mainForm.value.resultDate = getTodayStr();
  loadData();
});

// 파일 변경 핸들러 (기존 + 새 파일 누적)
function onMainFilesChange(e) {
  const files = Array.from(e.target.files || []);

  const newOnes = files.filter(
    (f) =>
      !mainFiles.value.some(
        (ex) =>
          ex.name === f.name &&
          ex.size === f.size &&
          ex.lastModified === f.lastModified
      )
  );

  mainFiles.value = [...mainFiles.value, ...newOnes];

  // 같은 파일 다시 선택할 수 있도록 초기화
  if (e.target) {
    e.target.value = "";
  }
}

// 파일 개별 삭제
function removeMainFile(index) {
  mainFiles.value.splice(index, 1);
}

// 임시저장으로 있던 파일 삭제
function removeExistingFile(index, attachCode) {
  if (attachCode && !removedAttachCodes.value.includes(attachCode)) {
    removedAttachCodes.value.push(attachCode);
  }
  existingFiles.value.splice(index, 1);
}

// 결과 임시 저장
async function handleTempSave() {
  try {
    const formJson = {
      submitCode,
      planCode,
      mainForm: mainForm.value,
      resultItems: resultItems.value,
      removedAttachCodes: removedAttachCodes.value,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("resultFiles", file);
    });

    const res = await axios.post("/api/result/temp", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data?.success) {
      alert("임시 저장이 완료되었습니다.");
    } else {
      alert(res.data.message || "임시 저장 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

// 결과 임시 저장 불러오기
async function handleLoad() {
  try {
    const { data } = await axios.get(`/api/result/form/${submitCode}`, {
      // 🔹 이 화면이 어떤 계획(planCode)에 대한 작성 화면인지 같이 넘겨주기
      params: {
        planCode: planCode || undefined,
      },
    });

    if (!data?.success || !data.result) {
      alert(data?.message || "불러올 임시 저장 결과가 없습니다.");
      return;
    }

    const res = data.result;

    // 🔹 진짜 내용이 없으면 여기서 걸러주기
    if (!res.main) {
      alert("불러올 임시 저장 결과가 없습니다.");
      return;
    }

    // ✅ 메인 폼 채우기
    mainForm.value = {
      resultDate: res.main.resultDate
        ? String(res.main.resultDate).slice(0, 10)
        : getTodayStr(),
      actualStart: res.main.actualStart || "",
      actualEnd: res.main.actualEnd || "",
      goal: res.main.goal || "",
      publicContent: res.main.publicContent || "",
      privateContent: res.main.privateContent || "",
    };

    // ✅ 추가 결과들
    resultItems.value =
      (res.items || []).map((d, idx) => ({
        id: d.resultItemCode || Date.now() + idx,
        goal: d.goal || "",
        publicContent: d.publicContent || "",
        privateContent: d.privateContent || "",
      })) || [];

    // ✅ 첨부 파일
    existingFiles.value =
      (res.attachments || []).map((a) => ({
        attachCode: a.attachCode,
        originalFilename: a.originalFilename,
        url: a.url,
      })) || [];

    removedAttachCodes.value = [];

    alert("임시 저장된 지원결과를 불러왔습니다.");
  } catch (e) {
    console.error(e);
    alert(
      "지원결과 불러오기 중 오류: " + (e.response?.data?.message || e.message)
    );
  }
}

// 계획 상세로 연결
function openPlanDetail() {
  // planCode가 없으면 그냥 막 열지 말고 한번 체크
  if (!planCode) {
    alert("연결된 지원계획 정보를 찾을 수 없습니다.");
    return;
  }

  // (필요하면 role도 쿼리로 같이 넣을 수 있음)
  const roleParam = route.query.role || "";

  const url = `/plans/detail/${planCode}?submitCode=${submitCode}${
    roleParam ? `&role=${roleParam}` : ""
  }`;

  window.open(url, "_blank");
}

// 목록으로 돌아가기
function goBack() {
  router.push({ name: "resultList" });
}

// 추가 결과 한 블록 추가
function addResultItem() {
  resultItems.value.push({
    id: Date.now(),
    goal: "",
    publicContent: "",
    privateContent: "",
  });
}

// 추가 결과 삭제
function removeResultItem(id) {
  resultItems.value = resultItems.value.filter((p) => p.id !== id);
}

// 유효성 체크
function validate() {
  if (!mainForm.value.actualStart) {
    return "실제 진행기간 시작 월을 선택해주세요.";
  }
  if (!mainForm.value.actualEnd) {
    return "실제 진행기간 종료 월을 선택해주세요.";
  }
  if (mainForm.value.actualStart > mainForm.value.actualEnd) {
    return "실제 진행기간의 시작 월이 종료 월보다 늦을 수 없습니다.";
  }
  if (!mainForm.value.goal.trim()) return "계획했던 목표를 입력해주세요.";
  if (!mainForm.value.publicContent.trim())
    return "결과 내용(일반용)을 입력해주세요.";
  if (!mainForm.value.privateContent.trim())
    return "결과 내용(관리자용)을 입력해주세요.";

  for (const p of resultItems.value) {
    if (!p.goal.trim()) return "추가 결과의 계획 목표를 입력해주세요.";
    if (!p.publicContent.trim())
      return "추가 결과의 내용(일반용)을 입력해주세요.";
    if (!p.privateContent.trim())
      return "추가 결과의 내용(관리자용)을 입력해주세요.";
  }

  return null;
}

// 제출하기
async function submitAll() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  try {
    const formJson = {
      submitCode,
      planCode,
      mainForm: mainForm.value,
      resultItems: resultItems.value,
      removedAttachCodes: removedAttachCodes.value,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("resultFiles", file);
    });

    const res = await axios.post("/api/result/new", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data?.success) {
      alert("지원결과가 저장되었습니다.");
      router.push({ name: "resultList" });
    } else {
      alert(res.data.message || "저장 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}
</script>

<style scoped>
section {
  color: #111827;
}

/* 페이지 폭 통일 */
.page-shell {
  max-width: 960px;
  margin: 0 auto;
}

/* 헤더 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  letter-spacing: -0.02em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 기본정보 카드 */
.meta-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem 1rem;
  font-size: 0.85rem;
}

/* 결과 작성일 줄 */
.meta-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.1rem;
  margin-top: 0.75rem;
}

/* ===== 기본정보 그리드 ===== */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem 1rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-item .meta-label {
  font-size: 0.78rem;
  color: #6b7280;
  margin-bottom: 0.15rem;
}

.meta-item .meta-value {
  font-size: 0.9rem;
  color: #111827;
  font-weight: 500;
}

/* 메인 카드 (지원결과 내용) */
.card-block {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  padding: 1.25rem 1.1rem;
}

/* 그룹 간 간격 (label + input/textarea 묶음) */
.form-group + .form-group {
  margin-top: 0.85rem;
}

/* 공통 인풋 스타일 (date, month, select 등) */
.input {
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.35rem 0.6rem;
  font-size: 0.875rem;
  outline: none;
  min-width: 8rem;
  background-color: #ffffff;
}

.input:focus {
  border-color: #111827;
}

/* 파일 인풋 */
.file-input {
  display: block;
  width: 100%;
  font-size: 0.8rem;
}

/* 파일 리스트 */
.file-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}

.file-link {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.8rem;
  color: #374151;
  text-decoration: none;
  text-underline-offset: 2px;
  word-break: break-all;
}

.file-link:hover {
  text-decoration: underline;
  color: #111827;
}

/* 작은 칩 버튼 */
.chip-button {
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  font-size: 0.7rem;
  color: #4b5563;
  cursor: pointer;
  white-space: nowrap;
}

.chip-button:hover {
  background-color: #e5e7eb;
}

/* 하단 액션 바 */
.action-bar {
  margin-top: 10px;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 추가 결과 카드 */
.record-card {
  margin-top: 10px;
  border-radius: 0.8rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.1rem 1rem;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 공통 폰트 */
section,
label,
input,
textarea {
  font-family:
    "Noto Sans KR",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
/* 기간 인풋 정렬 */
.period-value {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.input-month {
  width: 95px;
  min-width: 80px;
  max-width: 110px;
  padding: 0.2rem 0.35rem;
  font-size: 0.75rem;
}
/* 목표 셀렉트 전용 스타일 */
.goal-select {
  width: 100%;
  max-width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #fff;
  font-size: 0.875rem;
  cursor: pointer;

  /* 기본 화살표 제거 */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* 커스텀 화살표 */
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><polyline points='2,4 6,8 10,4' stroke='%239CA3AF' stroke-width='2' fill='none' stroke-linecap='round'/></svg>");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px;
}

.goal-select:focus {
  border-color: #111827;
  box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.1);
}

/* 옵션 텍스트 가독성 */
.goal-select option {
  font-size: 0.875rem;
}
</style>
