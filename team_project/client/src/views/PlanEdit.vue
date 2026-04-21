<template>
  <section class="p-6">
    <div class="page-shell space-y-6">
      <!-- 상단 타이틀 -->
      <header class="page-header">
        <h2 class="page-title text-2xl md:text-3xl font-bold tracking-tight">
          지원계획 수정
        </h2>
      </header>

      <!-- 로딩 / 에러 -->
      <p v-if="loading" class="text-sm text-gray-500">
        지원계획 정보를 불러오는 중입니다...
      </p>
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

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
              {{ submitInfo.name || "-" }}
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
              {{ priorityLabel(submitInfo.level) }}
            </span>
          </div>

          <!-- 5. 상담지 제출일 -->
          <div class="meta-item">
            <span class="meta-label">상담지 제출일</span>
            <span class="meta-value">
              <MaterialButton color="dark" size="sm" @click="openCounselDetail">
                {{ formattedCounselSubmitAt }}
              </MaterialButton>
            </span>
          </div>

          <!-- 6. 예상 진행기간 -->
          <div class="meta-item">
            <span class="meta-label">진행기간</span>
            <span class="meta-value period-value">
              <input
                type="month"
                v-model="mainForm.expectedStart"
                class="input-month"
              />
              ~
              <input
                type="month"
                v-model="mainForm.expectedEnd"
                class="input-month"
              />
            </span>
          </div>
        </div>
      </div>

      <!-- 메인 계획 카드 -->
      <div class="card-block space-y-4">
        <!-- 계획 목표 -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">계획 목표</label>
          <MaterialInput
            :id="`plan-goal-${planCode}`"
            variant="static"
            size="default"
            v-model="mainForm.goal"
            placeholder="지원계획의 목표를 입력하세요"
          />
        </div>

        <!-- 계획 내용 (일반용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            계획 내용 (일반용)
          </label>
          <MaterialTextarea
            id="plan-content-public"
            variant="outline"
            :rows="4"
            placeholder="대상자/일반용 계획 내용을 입력하세요..."
            :value="mainForm.publicContent"
            @input="(e) => (mainForm.publicContent = e.target.value)"
          />
        </div>

        <!-- 계획 내용 (관리자용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            계획 내용 (관리자용)
          </label>
          <MaterialTextarea
            id="plan-content-private"
            variant="outline"
            :rows="4"
            placeholder="관계자/관리자용 내부 계획 내용을 입력하세요..."
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

          <!-- 기존 첨부파일 -->
          <ul
            v-if="existingFiles.length"
            class="mt-2 text-xs text-gray-700 space-y-1"
          >
            <li
              v-for="(file, idx) in existingFiles"
              :key="file.attachCode"
              class="file-row"
            >
              <span class="file-link">
                {{ file.originalFilename }}
              </span>
              <button
                type="button"
                class="chip-button"
                @click="removeExistingFile(idx, file.attachCode)"
              >
                삭제
              </button>
            </li>
          </ul>

          <!-- 이번에 새로 선택한 파일 목록 -->
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

      <!-- 추가 계획 카드들 -->
      <div
        v-for="item in planItems"
        :key="item.id"
        class="record-card space-y-4"
      >
        <div class="record-header">
          <h4 class="font-medium text-sm">추가 계획</h4>

          <MaterialButton
            color="dark"
            size="sm"
            variant="outlined"
            @click="removePlanItem(item.id)"
          >
            제거
          </MaterialButton>
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">계획 목표</label>
          <MaterialInput
            :id="`plan-item-goal-${item.id}`"
            variant="outline"
            size="default"
            v-model="item.goal"
            placeholder="추가 계획의 목표를 입력하세요"
          />
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            계획 내용 (일반용)
          </label>
          <MaterialTextarea
            :id="`plan-item-public-${item.id}`"
            variant="outline"
            :rows="3"
            placeholder="대상자/일반용 내용을 입력하세요..."
            :value="item.publicContent"
            @input="(e) => (item.publicContent = e.target.value)"
          />
        </div>

        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            계획 내용 (관자용)
          </label>
          <MaterialTextarea
            :id="`plan-item-private-${item.id}`"
            variant="outline"
            :rows="3"
            placeholder="관계자/관리자용 내용을 입력하세요..."
            :value="item.privateContent"
            @input="(e) => (item.privateContent = e.target.value)"
          />
        </div>
      </div>

      <!-- 하단 버튼 라인 -->
      <div class="action-bar">
        <div class="left-actions">
          <MaterialButton color="dark" size="sm" @click="goBack">
            수정 취소
          </MaterialButton>

          <MaterialButton color="dark" size="sm" @click="addPlanItem">
            + 계획 추가
          </MaterialButton>
        </div>

        <div class="right-actions">
          <MaterialButton
            color="dark"
            size="sm"
            class="ml-auto shrink-0"
            @click="submitAll"
          >
            {{ isResubmit ? "재작성 완료" : "수정 완료" }}
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
import MaterialInput from "@/components/MaterialInput.vue";

const route = useRoute();
const router = useRouter();

// 라우터에서 받은 값들
const planCode = Number(route.params.planCode || 0);
const submitCode = Number(route.query.submitCode || 0);

// 기본 정보
const submitInfo = ref({
  name: "", // 보호자(작성자)
  childName: "", // 지원자
  guardianName: "", // 보호자 = name
  assigneeName: "", // 담당자
  disabilityType: "", // 장애 유형
  counselSubmitAt: "", // 상담지 제출일
  level: "",
});

const formattedCounselSubmitAt = computed(() => {
  const v = submitInfo.value.counselSubmitAt;
  return v ? String(v).slice(0, 10) : "-";
});

// 메인 계획 폼
const mainForm = ref({
  planDate: "", // 계획 작성일
  expectedStart: "",
  expectedEnd: "",
  goal: "",
  publicContent: "",
  privateContent: "",
});

// 첨부 파일들
const mainFiles = ref([]);
const fileInputRef = ref(null);

// 기존 첨부파일
const existingFiles = ref([]);
// 삭제 예정 첨부 코드
const removedAttachCodes = ref([]);

// 추가 계획 목록
const planItems = ref([]);

const loading = ref(false);
const error = ref("");
const status = ref("");

// 반려인 경우 재작성 모드
const isResubmit = computed(() => status.value === "CC7");

// 오늘 날짜 YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// 기본정보 + 계획 상세 로딩
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    if (!submitCode) {
      throw new Error("submitCode가 없습니다. (쿼리로 전달 필요)");
    }
    if (!planCode) {
      throw new Error("planCode가 없습니다. (params로 전달 필요)");
    }

    const [basicRes, detailRes] = await Promise.all([
      axios.get(`/api/plans/${submitCode}`),
      axios.get(`/api/plans/detail/${planCode}`),
    ]);

    // 1) 기본 정보
    if (!basicRes.data?.success || !basicRes.data.result) {
      throw new Error(
        basicRes.data?.message || "지원자 기본 정보를 찾을 수 없습니다."
      );
    }
    const basic = basicRes.data.result;

    submitInfo.value = {
      name: basic.name || "", // 보호자(작성자)
      childName: basic.childName || "",
      guardianName: basic.guardianName || basic.name || "",
      assigneeName: basic.assigneeName || "",
      disabilityType: basic.disabilityType || "",
      counselSubmitAt: basic.counselSubmitAt || "",
      level: basic.level || "",
    };

    // 2) 계획 상세 정보
    if (!detailRes.data?.success || !detailRes.data.result) {
      throw new Error(
        detailRes.data?.message || "지원계획 정보를 찾을 수 없습니다."
      );
    }
    const d = detailRes.data.result;

    mainForm.value = {
      planDate: d.main?.planDate
        ? String(d.main.planDate).slice(0, 10)
        : getTodayStr(),
      expectedStart: d.main?.expectedStart || "",
      expectedEnd: d.main?.expectedEnd || "",
      goal: d.main?.goal || "",
      publicContent: d.main?.publicContent || "",
      privateContent: d.main?.privateContent || "",
    };

    status.value = d.status || "";

    planItems.value =
      (d.items || []).map((it, idx) => ({
        id: it.planItemCode || Date.now() + idx,
        goal: it.goal || "",
        publicContent: it.publicContent || "",
        privateContent: it.privateContent || "",
      })) || [];

    existingFiles.value =
      (d.attachments || []).map((a) => ({
        attachCode: a.attachCode,
        originalFilename: a.originalFilename,
        url: a.url,
      })) || [];
  } catch (e) {
    console.error(e);
    error.value = e.message || "지원계획 정보 조회 중 오류";
  } finally {
    loading.value = false;
  }
}

function priorityLabel(code) {
  const c = (code || "").toString().toUpperCase();

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

// 새로 선택된 파일 삭제
function removeMainFile(index) {
  mainFiles.value.splice(index, 1);
}

// 기존 파일 삭제 (바로 UI에서 제거 + 코드만 모아두기)
function removeExistingFile(index, attachCode) {
  if (attachCode && !removedAttachCodes.value.includes(attachCode)) {
    removedAttachCodes.value.push(attachCode);
  }
  existingFiles.value.splice(index, 1);
}

// 상담지 상세 열기 (새 탭)
function openCounselDetail() {
  if (!submitCode) return;
  const url = `/counsel/detail/${submitCode}`;
  window.open(url, "_blank");
}

// 목록으로 돌아가기
function goBack() {
  router.push({ name: "planList" });
}

// 추가 계획 블록 추가
function addPlanItem() {
  planItems.value.push({
    id: Date.now(),
    goal: "",
    publicContent: "",
    privateContent: "",
  });
}

// 추가 계획 삭제
function removePlanItem(id) {
  planItems.value = planItems.value.filter((p) => p.id !== id);
}

// 유효성 체크
function validate() {
  if (!mainForm.value.goal.trim()) return "계획 목표를 입력해주세요.";
  if (!mainForm.value.publicContent.trim())
    return "계획 내용(일반용)을 입력해주세요.";
  if (!mainForm.value.privateContent.trim())
    return "계획 내용(관리자용)을 입력해주세요.";

  for (const p of planItems.value) {
    if (!p.goal.trim()) return "추가 계획의 목표를 입력해주세요.";
    if (!p.publicContent.trim())
      return "추가 계획의 내용(일반용)을 입력해주세요.";
    if (!p.privateContent.trim())
      return "추가 계획의 내용(관리자용)을 입력해주세요.";
  }

  return null;
}

const user = JSON.parse(localStorage.getItem("user") || "{}");
const modifier = Number(user.user_code || 0);

// 수정/재작성 완료
async function submitAll() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  try {
    const formJson = {
      planCode,
      submitCode,
      mainForm: mainForm.value,
      planItems: planItems.value,
      removedAttachCodes: removedAttachCodes.value,
      modifier,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("planFiles", file);
    });

    // 1) 내용/첨부 업데이트
    const res = await axios.put(`/api/plans/${planCode}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!res.data?.success) {
      alert(res.data.message || "수정 실패");
      return;
    }

    // 2) 반려(CC7) → 재승인요청(CC6) 전환
    if (isResubmit.value) {
      await axios.post(`/api/plans/${planCode}/resubmit`, {
        requesterCode: modifier, // TODO: 로그인 사용자 코드로 변경
      });
      alert("재작성된 지원계획이 재승인 요청 되었습니다.");
    } else {
      alert("지원계획이 수정되었습니다.");
    }

    router.push({ name: "planList" });
  } catch (e) {
    console.error(e);
    alert(
      "수정 처리 중 서버 오류: " + (e.response?.data?.message || e.message)
    );
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

/* ===== 기본정보 카드 ===== */
.meta-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem 1rem;
  font-size: 0.85rem;
}

/* meta grid (작성/수정 공용) */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem 1rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.78rem;
  color: #6b7280;
  margin-bottom: 0.15rem;
}

.meta-value {
  font-size: 0.9rem;
  color: #111827;
  font-weight: 500;
}

/* 기간 month input */
.period-value {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.input-month {
  width: 78px;
  min-width: 78px;
  max-width: 78px;
  padding: 0.2rem 0.35rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background: white;
}

/* ===== 메인 카드 ===== */
.card-block {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  padding: 1.25rem 1.1rem;
}

/* form group 간 간격 */
.form-group + .form-group {
  margin-top: 0.85rem;
}

/* 공통 input */
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

/* ===== 파일 인풋 ===== */
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
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-link:hover {
  text-decoration: underline;
  color: #111827;
}

/* 파일 삭제 chip 버튼 */
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

/* ===== 추가 계획 카드 ===== */
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

/* ===== 하단 버튼바 ===== */
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

/* ===== 공통 폰트 ===== */
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
</style>
