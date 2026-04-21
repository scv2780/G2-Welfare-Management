<template>
  <section class="p-6">
    <div class="page-shell space-y-6">
      <!-- 상단 타이틀 -->
      <header class="page-header">
        <div>
          <h2 class="page-title text-2xl md:text-3xl font-bold tracking-tight">
            상담서 수정
          </h2>
        </div>

        <div class="header-actions">
          <MaterialButton color="dark" size="sm" @click="goBack">
            ← 목록으로
          </MaterialButton>
        </div>
      </header>

      <!-- 로딩/에러 -->
      <div v-if="loading" class="text-sm text-gray-500">불러오는 중...</div>
      <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>

      <!-- 본문 -->
      <template v-else>
        <!-- 기본정보 카드 -->
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

            <!-- 5. 조사지 제출일 -->
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

            <!-- 6. 상담일 -->
            <div class="meta-item">
              <span class="meta-label">상담일</span>
              <span class="meta-value">
                <input
                  type="date"
                  v-model="mainForm.counselDate"
                  class="input"
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
              id="edit-title"
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
              id="edit-content"
              variant="outline"
              :rows="5"
              placeholder="상담 내용을 입력하세요..."
              :value="mainForm.content"
              @input="(e) => (mainForm.content = e.target.value)"
            />
          </div>

          <!-- 기존 첨부 파일 목록 -->
          <div>
            <span class="block text-sm font-medium mb-1">기존 첨부 파일</span>

            <div v-if="attachments.length">
              <ul class="mt-1 text-xs text-gray-700 space-y-1">
                <li
                  v-for="file in attachments"
                  :key="file.attachCode"
                  class="space-y-0.5"
                >
                  <!-- 파일 이름 + 버튼을 한 줄에 -->
                  <div class="flex items-center justify-between gap-2">
                    <a
                      :href="file.url"
                      target="_blank"
                      class="flex-1 min-w-0 truncate underline"
                      :class="{
                        'line-through text-gray-400':
                          removedAttachmentCodes.includes(file.attachCode),
                      }"
                    >
                      {{ file.originalFilename }}
                    </a>

                    <button
                      type="button"
                      class="shrink-0 px-2 py-0.5 border rounded text-[11px] text-gray-600 hover:bg-gray-100"
                      @click="toggleRemoveAttachment(file.attachCode)"
                    >
                      {{
                        removedAttachmentCodes.includes(file.attachCode)
                          ? "취소"
                          : "삭제"
                      }}
                    </button>
                  </div>

                  <!-- 삭제 예정 표시만 아래 줄에 작게 -->
                  <div
                    v-if="removedAttachmentCodes.includes(file.attachCode)"
                    class="text-[11px] text-red-500 pl-1"
                  >
                    삭제 예정
                  </div>
                </li>
              </ul>
            </div>

            <div v-else class="text-xs text-gray-400">
              기존에 첨부된 파일이 없습니다.
            </div>
          </div>

          <!-- 새로 추가할 첨부 파일 -->
          <div>
            <label class="block text-sm mb-1 font-medium">첨부 파일 추가</label>
            <input
              ref="fileInputRef"
              type="file"
              multiple
              @change="onNewFilesChange"
              class="file-input"
            />
            <p class="mt-1 text-xs text-gray-500">
              * 여러 개 파일을 한 번에 선택하거나, 나눠서 여러 번 선택할 수
              있습니다.
            </p>

            <!-- 새로 선택한 파일 목록 -->
            <ul
              v-if="newFiles.length"
              class="mt-2 text-xs text-gray-700 space-y-1"
            >
              <li
                v-for="(file, idx) in newFiles"
                :key="file.name + '_' + file.lastModified + '_' + idx"
                class="flex items-center justify-between gap-2"
              >
                <span class="truncate">
                  • {{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)
                </span>
                <button
                  type="button"
                  class="shrink-0 px-2 py-0.5 border rounded text-[11px] text-gray-600 hover:bg-gray-100"
                  @click="removeNewFile(idx)"
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
            <input type="date" v-model="record.counselDate" class="input" />
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

        <!-- 하단 액션 바 -->
        <div class="action-bar">
          <div class="left-actions">
            <MaterialButton color="dark" size="sm" @click="goBack">
              수정 취소
            </MaterialButton>

            <MaterialButton color="dark" size="sm" @click="addRecord">
              + 상담 기록 추가
            </MaterialButton>
          </div>

          <div class="right-actions">
            <!-- 우선순위 (코드 BB1/BB2/BB3 사용) -->
            <select v-model="priority" class="input priority-select">
              <option value="BB1">긴급</option>
              <option value="BB2">중점</option>
              <option value="BB3">계획</option>
            </select>

            <MaterialButton color="dark" size="sm" @click="submitAll">
              {{ isResubmit ? "재작성 완료" : "수정 완료" }}
            </MaterialButton>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

import MaterialButton from "@/components/MaterialButton.vue";
import MaterialTextarea from "@/components/MaterialTextarea.vue";
import MaterialInput from "@/components/MaterialInput.vue";

const route = useRoute();
const router = useRouter();
const submitCode = Number(route.params.submitCode);

const user = JSON.parse(localStorage.getItem("user") || "{}");
const modifier = Number(user.user_code || 0);

const loading = ref(false);
const error = ref("");

const status = ref(""); // 상담 상태 (CB2/CB3/CB4/CB5 ...)

// CB4(반려)인 경우 재작성 모드
const isResubmit = computed(() => status.value === "CB4");

// 기본 정보 / 메인 폼 / 기록 / 우선순위
const submitInfo = ref({
  name: "",
  ssnFront: "",
  submitAt: "",
});

const formattedSubmitAt = computed(() => {
  const v = submitInfo.value.submitAt;
  return v ? v.slice(0, 10) : "-";
});

const mainForm = ref({
  counselDate: "",
  title: "",
  content: "",
});

const records = ref([]);
// 🔹 우선순위: 코드 값 사용 (BB1/BB2/BB3)
const priority = ref("BB3");

// 기존 첨부파일 목록
const attachments = ref([]);

// 삭제 대상 attach_code 목록
const removedAttachmentCodes = ref([]);

// 새로 추가하는 파일들
const newFiles = ref([]);
const fileInputRef = ref(null);

// 상담 상세 불러오기
async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await axios.get(`/api/counsel/${submitCode}`);

    if (!data?.success || !data.result) {
      throw new Error(data?.message || "상담 정보를 찾을 수 없습니다.");
    }

    const res = data.result;

    submitInfo.value = res.submit_info || submitInfo.value;

    mainForm.value = {
      counselDate: res.main?.counsel_date || "",
      title: res.main?.title || "",
      content: res.main?.content || "",
    };

    // 🔹 백엔드에서 내려주는 priority 코드 그대로 사용 (없으면 BB3: 계획)
    priority.value = res.priority || "BB3";
    status.value = res.status || "";

    records.value =
      (res.details || []).map((d, idx) => ({
        id: Date.now() + idx,
        counselDate: d.counsel_date || "",
        title: d.title || "",
        content: d.content || "",
      })) || [];

    attachments.value = res.attachments || [];
  } catch (e) {
    console.error(e);
    error.value = e.message || "상담 정보 조회 중 오류";
  } finally {
    loading.value = false;
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

// 기존 첨부 삭제 토글
function toggleRemoveAttachment(attachCode) {
  const idx = removedAttachmentCodes.value.indexOf(attachCode);
  if (idx === -1) {
    removedAttachmentCodes.value.push(attachCode);
  } else {
    removedAttachmentCodes.value.splice(idx, 1);
  }
}

// 새 파일 선택 (누적)
function onNewFilesChange(e) {
  const files = Array.from(e.target.files || []);

  const newOnes = files.filter(
    (f) =>
      !newFiles.value.some(
        (ex) =>
          ex.name === f.name &&
          ex.size === f.size &&
          ex.lastModified === f.lastModified
      )
  );

  newFiles.value = [...newFiles.value, ...newOnes];

  if (e.target) {
    e.target.value = "";
  }
}

// 새 파일 개별 삭제
function removeNewFile(index) {
  newFiles.value.splice(index, 1);
}

// 유효성
function validate() {
  // 🔹 메인 상담일 필수
  if (!mainForm.value.counselDate) return "상담일을 입력해주세요.";
  if (!mainForm.value.title.trim()) return "상담 제목을 입력해주세요.";
  if (!mainForm.value.content.trim()) return "상담 내용을 입력해주세요.";

  // 🔹 추가 상담 기록들도 상담일/제목/내용 필수
  for (const r of records.value) {
    if (!r.counselDate) return "추가 상담 기록의 상담일을 입력해주세요.";
    if (!r.title.trim()) return "추가 상담 기록의 제목을 입력해주세요.";
    if (!r.content.trim()) return "추가 상담 기록의 내용을 입력해주세요.";
  }
  return null;
}

// 저장(수정 완료) → multipart로 전송
async function submitAll() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  try {
    const formJson = {
      submitCode,
      priority: priority.value, // 🔹 코드 그대로 전송 (BB1/BB2/BB3)
      mainForm: mainForm.value,
      records: records.value,
      removeAttachmentCodes: removedAttachmentCodes.value,
      modifier,
      requesterCode: modifier,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    newFiles.value.forEach((file) => {
      formData.append("mainFiles", file);
    });

    const res = await axios.post("/api/counsel/new", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.data?.success) {
      if (isResubmit.value) {
        alert("재작성이 완료되었습니다. 승인요청이 다시 올라갔습니다.");
      } else {
        alert("상담 수정이 완료되었습니다.");
      }
      router.push({ name: "counselList" });
    } else {
      alert(res.data.message || "수정 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

// 첫 로딩에 데이터 불러오기
loadData();
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
  margin-bottom: 0.8em;
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

/* 공통 인풋 (date, select) */
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
  border-radius: 0.8rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1.1rem 1rem;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.04);
  margin-top: 8px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style>
