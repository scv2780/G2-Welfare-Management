<template>
  <section class="p-6">
    <div class="page-shell space-y-6">
      <!-- 상단 타이틀 -->
      <header class="page-header">
        <h2 class="page-title text-2xl md:text-3xl font-bold tracking-tight">
          상담서 작성
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

      <!-- 기본정보 카드 -->
      <div class="meta-card">
        <div class="meta-grid">
          <!-- 1. 지원자 -->
          <div class="meta-item">
            <span class="meta-label">지원자</span>
            <span class="meta-value">{{ submitInfo.childName || "본인" }}</span>
          </div>

          <!-- 2. 보호자 -->
          <div class="meta-item">
            <span class="meta-label">보호자</span>
            <span class="meta-value">{{ submitInfo.guardianName || "-" }}</span>
          </div>

          <!-- 3. 담당자 -->
          <div class="meta-item">
            <span class="meta-label">담당자</span>
            <span class="meta-value">{{ submitInfo.assigneeName || "-" }}</span>
          </div>

          <!-- 4. 장애유형 -->
          <div class="meta-item">
            <span class="meta-label">장애유형</span>
            <span class="meta-value">{{
              submitInfo.disabilityType || "-"
            }}</span>
          </div>

          <!-- 5. 조사지 제출일 (라벨 + 버튼 안엔 날짜만) -->
          <div class="meta-item">
            <span class="meta-label">조사지 제출일</span>
            <span class="meta-value">
              <MaterialButton
                color="dark"
                size="sm"
                @click="openSubmissionDetail"
              >
                {{ formattedSubmitAt }}
              </MaterialButton>
            </span>
          </div>

          <!-- 6. 상담일 (date input) -->
          <div class="meta-item">
            <span class="meta-label">상담일</span>
            <span class="meta-value">
              <input
                type="date"
                v-model="mainForm.counselDate"
                class="input"
                :min="formattedSubmitAt"
              />
            </span>
          </div>
        </div>
      </div>

      <!-- 메인 상담 카드 (제목 / 내용 / 첨부) -->
      <div class="card-block space-y-4">
        <!-- 상담 제목 -->
        <div>
          <label class="block text-sm mb-1 font-medium">상담 제목</label>
          <MaterialInput
            id="main-title"
            variant="static"
            size="default"
            v-model="mainForm.title"
            placeholder="상담 제목을 입력하세요"
          />
        </div>

        <!-- 상담 내용 -->
        <div>
          <label class="block text-sm mb-1 font-medium">상담 내용</label>
          <MaterialTextarea
            id="main-content"
            variant="outline"
            :rows="5"
            placeholder="상담 내용을 입력하세요..."
            :value="mainForm.content"
            @input="(e) => (mainForm.content = e.target.value)"
          />
        </div>

        <!-- 첨부 파일 영역 -->
        <div>
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

          <!-- 기존 첨부파일 목록 -->
          <ul
            v-if="existingFiles.length"
            class="mt-2 text-xs text-gray-700 space-y-1"
          >
            <li
              v-for="file in existingFiles"
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
                @click="removeExistingFile(file.attachCode)"
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

      <!-- 추가 상담 기록 카드들 -->
      <div
        v-for="record in records"
        :key="record.id"
        class="record-card space-y-4"
      >
        <div class="record-header">
          <h4 class="font-medium text-sm">추가 상담 기록</h4>

          <MaterialButton
            color="dark"
            size="sm"
            variant="outlined"
            @click="removeRecord(record.id)"
          >
            제거
          </MaterialButton>
        </div>

        <div>
          <label class="block text-sm mb-1 font-medium">상담일: </label>
          <input
            type="date"
            v-model="record.counselDate"
            class="input"
            :min="formattedSubmitAt"
          />
        </div>

        <div>
          <label class="block text-sm mb-1 font-medium">상담 제목</label>
          <MaterialInput
            :id="`record-title-${record.id}`"
            variant="static"
            size="default"
            v-model="record.title"
            placeholder="상담 제목을 입력하세요"
          />
        </div>

        <div>
          <label class="block text-sm mb-1 font-medium">상담 내용</label>
          <MaterialTextarea
            :id="`record-content-${record.id}`"
            variant="outline"
            :rows="3"
            placeholder="상담 내용을 입력하세요..."
            :value="record.content"
            @input="(e) => (record.content = e.target.value)"
          />
        </div>
      </div>

      <!-- 하단 액션 줄 -->
      <div class="action-bar">
        <div class="left-actions">
          <MaterialButton color="dark" size="sm" @click="goBack">
            작성 취소
          </MaterialButton>

          <MaterialButton color="dark" size="sm" @click="addRecord">
            + 상담 기록 추가
          </MaterialButton>
        </div>

        <div class="right-actions">
          <select v-model="priority" class="input priority-select">
            <option value="BB1">긴급</option>
            <option value="BB2">중점</option>
            <option value="BB3">계획</option>
          </select>

          <MaterialButton color="dark" size="sm" @click="submitAll">
            작성 완료
          </MaterialButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/authLogin";
import axios from "axios";

import MaterialButton from "@/components/MaterialButton.vue";
import MaterialTextarea from "@/components/MaterialTextarea.vue";
import MaterialInput from "@/components/MaterialInput.vue";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const submitCode = Number(route.params.submitCode);

// 기본 정보
const submitInfo = ref({
  name: "",
  ssnFront: "",
  submitAt: "",
});

const formattedSubmitAt = computed(() => {
  const v = submitInfo.value.submitAt;
  return v ? v.slice(0, 10) : "";
});

// 메인 폼
const mainForm = ref({
  counselDate: "",
  title: "",
  content: "",
});

// 메인 상담 첨부 파일들
const mainFiles = ref([]); // File[]
const fileInputRef = ref(null); // <input type="file">

// 기존 첨부파일 (임시저장/작성에서 이미 올라간 것들)
const existingFiles = ref([]);

// 삭제할 기존 첨부파일 코드들
const removedAttachmentCodes = ref([]);

// 추가 기록들
const records = ref([]);
const priority = ref("BB3");

const loading = ref(false);
const error = ref("");

// 기본정보 로딩
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await axios.get(`/api/counsel/${submitCode}`);

    if (!data?.success || !data.result) {
      throw new Error(data?.message || "상담 기본 정보를 찾을 수 없습니다.");
    }

    const res = data.result;

    if (res.submit_info) {
      submitInfo.value = res.submit_info;
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "상담 기본 정보 조회 중 오류";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  auth.reload(); // 새로고침 후에도 userCode 복구
  loadData();
});

// 파일 변경 핸들러
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

  if (e.target) {
    e.target.value = "";
  }
}

// 파일 개별 삭제
function removeMainFile(index) {
  mainFiles.value.splice(index, 1);
}

// 기존 첨부 삭제
function removeExistingFile(attachCode) {
  if (!removedAttachmentCodes.value.includes(attachCode)) {
    removedAttachmentCodes.value.push(attachCode);
  }
  existingFiles.value = existingFiles.value.filter(
    (f) => f.attachCode !== attachCode
  );
}

// 임시 저장
async function handleTempSave() {
  try {
    const formJson = {
      submitCode,
      priority: priority.value,
      mainForm: mainForm.value,
      records: records.value,
      removeAttachmentCodes: removedAttachmentCodes.value,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("mainFiles", file);
    });

    const res = await axios.post("/api/counsel/temp", formData, {
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

async function handleLoad() {
  try {
    const { data } = await axios.get(`/api/counsel/${submitCode}`);

    if (!data?.success || !data.result) {
      alert(data?.message || "불러올 상담 내용이 없습니다.");
      return;
    }

    const res = data.result;

    if (res.submit_info) {
      submitInfo.value = res.submit_info;
    }

    mainForm.value = {
      counselDate: res.main?.counsel_date || "",
      title: res.main?.title || "",
      content: res.main?.content || "",
    };

    priority.value = res.priority || "BB3";

    records.value =
      (res.details || []).map((d, idx) => ({
        id: d.detail_code || Date.now() + idx,
        counselDate: d.counsel_date || "",
        title: d.title || "",
        content: d.content || "",
      })) || [];

    existingFiles.value =
      (res.attachments || []).map((a) => ({
        attachCode: a.attachCode,
        originalFilename: a.originalFilename,
        url: a.url,
      })) || [];

    mainFiles.value = [];
    removedAttachmentCodes.value = [];

    alert("임시 저장된 내용을 불러왔습니다.");
  } catch (e) {
    console.error(e);
    alert(
      "상담 내용 불러오기 중 오류: " + (e.response?.data?.message || e.message)
    );
  }
}

function openSubmissionDetail() {
  window.open(`/survey/submission/${submitCode}`, "_blank");
}

function goBack() {
  router.push({ name: "counselList" });
}

function addRecord() {
  records.value.push({
    id: Date.now(),
    counselDate: "",
    title: "",
    content: "",
  });
}

function removeRecord(id) {
  records.value = records.value.filter((r) => r.id !== id);
}

// 유효성
function validate() {
  if (!mainForm.value.counselDate) return "상담일을 입력해주세요.";

  // 🔹 조사지 제출일보다 앞 날짜 방지 (메인 상담일)
  if (
    formattedSubmitAt.value &&
    mainForm.value.counselDate < formattedSubmitAt.value
  ) {
    return "상담일은 조사지 제출일보다 이전일 수 없습니다.";
  }

  if (!mainForm.value.title.trim()) return "상담 제목을 입력해주세요.";
  if (!mainForm.value.content.trim()) return "상담 내용을 입력해주세요.";

  for (const r of records.value) {
    if (!r.counselDate) return "추가 상담 기록의 상담일을 입력해주세요.";

    // 🔹 조사지 제출일보다 앞 날짜 방지 (추가 상담 기록)
    if (formattedSubmitAt.value && r.counselDate < formattedSubmitAt.value) {
      return "추가 상담 기록의 상담일은 조사지 제출일보다 이전일 수 없습니다.";
    }

    if (!r.title.trim()) return "추가 상담 기록의 제목을 입력해주세요.";
    if (!r.content.trim()) return "추가 상담 기록의 내용을 입력해주세요.";
  }
  return null;
}

// 작성 완료
async function submitAll() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  try {
    const formJson = {
      submitCode,
      priority: priority.value,
      mainForm: mainForm.value,
      records: records.value,
      removeAttachmentCodes: removedAttachmentCodes.value,
      modifier: auth.userCode,
      requesterCode: auth.userCode,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("mainFiles", file);
    });

    const res = await axios.post("/api/counsel/new", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data?.success) {
      alert("상담 저장 완료!");
      router.push({ name: "counselList" });
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

.meta-bottom {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.25rem;
}

/* 메인 상담 카드 */
.card-block {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  padding: 1.25rem 1.1rem;
}

/* 공통 인풋 스타일 (date, select) */
.input {
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.35rem 0.6rem;
  font-size: 0.875rem;
  outline: none;
  min-width: 8rem;
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

.file-link {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
  color: #1d4ed8;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* 작은 버튼 느낌 */
.chip-button {
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #f9fafb;
  font-size: 0.7rem;
  color: #4b5563;
  cursor: pointer;
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

.priority-select {
  min-width: 5.5rem;
}

/* 추가 상담 기록 카드 */
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
table th,
table td {
  font-family:
    "Noto Sans KR",
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
/* 파일 행: 텍스트 바로 옆에 삭제 버튼 */
.file-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-start;
}

/* 파일 텍스트(링크) 스타일: 회색, 밑줄 제거 */
.file-link {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.8rem;
  color: #374151; /* 무채색 회색 계열 */
  text-decoration: none; /* 기본 밑줄 제거 */
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 호버 시만 살짝만 표시해주고 싶으면 */
.file-link:hover {
  text-decoration: underline;
}

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
</style>
