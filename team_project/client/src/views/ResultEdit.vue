<template>
  <section class="p-6">
    <div class="page-shell space-y-6">
      <!-- 상단 타이틀 -->
      <header class="page-header">
        <h2 class="page-title text-2xl md:text-3xl font-bold tracking-tight">
          지원결과 수정
        </h2>
      </header>

      <!-- 로딩 / 에러 -->
      <p v-if="loading" class="text-sm text-gray-500">
        지원결과 정보를 불러오는 중입니다...
      </p>
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <!-- ✅ 기본정보 카드 (작성 화면과 동일 형태) -->
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

          <!-- 5. 계획작성일 -->
          <div class="meta-item">
            <span class="meta-label">계획작성일</span>
            <span class="meta-value">
              <MaterialButton color="dark" size="sm" @click="openPlanDetail">
                {{ formattedPlanSubmitAt }}
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
        <!-- 결과 목표 -->
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

        <!-- 결과 내용 (관리자용) -->
        <div class="form-group">
          <label class="block text-sm mb-1 font-medium">
            결과 내용 (관리자용)
          </label>
          <MaterialTextarea
            id="result-content-private"
            variant="outline"
            :rows="4"
            placeholder="관계자/관리자용 내부 결과 내용을 입력하세요..."
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
              v-for="file in existingFiles"
              :key="file.attachCode"
              class="file-row"
            >
              <div class="file-main">
                <a
                  :href="file.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="file-link"
                >
                  {{ file.originalFilename }}
                </a>

                <!-- 삭제 예정 표시 -->
                <span
                  v-if="removedAttachCodes.includes(file.attachCode)"
                  class="file-tag-removed"
                >
                  삭제 예정
                </span>
              </div>

              <!-- 삭제 버튼 -->
              <button
                v-if="!removedAttachCodes.includes(file.attachCode)"
                type="button"
                class="chip-button"
                @click="markFileForDelete(file.attachCode)"
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
            <option value="">추가 결과의 계획 목표 선택</option>
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
            수정 취소
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

const route = useRoute();
const router = useRouter();

const user = JSON.parse(localStorage.getItem("user") || "{}");
const modifier = Number(user.user_code || 0);

const planGoals = ref([]);

// 라우터에서 받은 값들
const resultCode = Number(route.params.resultCode || 0);
const planCode = ref(Number(route.query.planCode || 0));
const submitCode = Number(route.query.submitCode || 0);

// ✅ 기본 정보 (작성 화면과 동일 구조)
const submitInfo = ref({
  childName: "",
  guardianName: "",
  assigneeName: "",
  disabilityType: "",
  planSubmitAt: "",
  level: "",
});

const formattedPlanSubmitAt = computed(() => {
  const v = submitInfo.value.planSubmitAt;
  return v ? String(v).slice(0, 10) : "-";
});

// 메인 결과 폼
const mainForm = ref({
  resultDate: "", // 결과 작성일
  actualStart: "",
  actualEnd: "",
  goal: "",
  publicContent: "",
  privateContent: "",
});

// 첨부 파일들
const mainFiles = ref([]);
const fileInputRef = ref(null);

// 기존 첨부파일
const existingFiles = ref([]);
// 삭제 예정 첨부코드
const removedAttachCodes = ref([]);

// 추가 결과 목록
const resultItems = ref([]);

const loading = ref(false);
const error = ref("");
const status = ref("");

// 반려인 경우 재작성 모드
const isResubmit = computed(() => status.value === "CD7");

// 오늘 날짜 YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// 데이터 로딩
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    if (!submitCode) {
      throw new Error("submitCode가 없습니다. (쿼리로 전달 필요)");
    }
    if (!resultCode) {
      throw new Error("resultCode가 없습니다. (params로 전달 필요)");
    }

    // 기본 정보 + 결과 상세를 동시에 요청
    const [basicRes, detailRes] = await Promise.all([
      axios.get(`/api/result/${submitCode}`), // 기본 정보 API (그대로 유지)
      axios.get(`/api/result/detail/${resultCode}`), // 이 응답에서 planCode + planGoals 사용
    ]);

    // 1) 지원자 기본 정보
    const basic = basicRes.data;
    if (!basic?.success || !basic.result) {
      throw new Error(basic?.message || "지원자 기본 정보를 찾을 수 없습니다.");
    }
    const basicResData = basic.result;

    submitInfo.value = {
      childName: basicResData.childName || "",
      guardianName: basicResData.guardianName || "",
      assigneeName: basicResData.assigneeName || "",
      disabilityType: basicResData.disabilityType || "",
      planSubmitAt: basicResData.planSubmitAt || "",
      level: basicResData.level || "",
    };

    // 2) 결과 상세 정보
    const detail = detailRes.data;
    if (!detail?.success || !detail.result) {
      throw new Error(detail?.message || "지원결과 정보를 찾을 수 없습니다.");
    }
    const d = detail.result;

    // 👉 resultCode 기준으로 내려주는 planCode 사용
    planCode.value = Number(d.planCode ?? d.plan_code ?? planCode.value ?? 0);

    mainForm.value = {
      resultDate: d.main?.resultDate
        ? String(d.main.resultDate).slice(0, 10)
        : getTodayStr(),
      actualStart: d.main?.actualStart || "",
      actualEnd: d.main?.actualEnd || "",
      goal: d.main?.goal || "",
      publicContent: d.main?.publicContent || "",
      privateContent: d.main?.privateContent || "",
    };

    status.value = d.status || "";

    resultItems.value =
      (d.items || []).map((it, idx) => ({
        id: it.resultItemCode || Date.now() + idx,
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

    // 🔹 계획 목표 목록 세팅: 이제는 "결과에 연결된 planCode" 기준으로 내려온 planGoals 사용
    if (Array.isArray(d.planGoals)) {
      const goals = d.planGoals.map((g) => (g || "").trim()).filter((g) => g);

      let uniq = [...new Set(goals)];

      // 수정 화면에서 기존 저장된 goal이 목록에 없으면 포함시켜주기
      if (mainForm.value.goal && !uniq.includes(mainForm.value.goal)) {
        uniq = [mainForm.value.goal, ...uniq];
      }

      planGoals.value = uniq;
    } else {
      // planGoals가 아예 안 내려오는데 기존 goal이 있으면 그거라도 보여주기
      planGoals.value = mainForm.value.goal ? [mainForm.value.goal] : [];
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "지원결과 정보 조회 중 오류";
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
  if (!mainForm.value.resultDate) {
    mainForm.value.resultDate = getTodayStr();
  }
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

// 기존 첨부 삭제 표시
function markFileForDelete(attachCode) {
  if (!removedAttachCodes.value.includes(attachCode)) {
    removedAttachCodes.value.push(attachCode);
  }
}

// 계획 상세로 이동
function openPlanDetail() {
  if (!planCode.value) {
    alert(
      "planCode가 없습니다. (결과 상세 응답에서 planCode를 내려주는지 확인 필요)"
    );
    return;
  }
  let url = `/plans/detail/${planCode.value}`;
  if (submitCode) {
    url += `?submitCode=${submitCode}`;
  }
  window.open(url, "_blank");
}

// 목록으로 돌아가기
function goBack() {
  router.push({ name: "resultList" });
}

// 추가 결과 블록 추가
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

// ✅ 유효성 체크 (작성 화면과 동일하게 실제 진행기간 포함)
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

  if (!mainForm.value.goal.trim()) return "결과 목표를 입력해주세요.";
  if (!mainForm.value.publicContent.trim())
    return "결과 내용(일반용)을 입력해주세요.";
  if (!mainForm.value.privateContent.trim())
    return "결과 내용(관리자용)을 입력해주세요.";

  for (const p of resultItems.value) {
    if (!p.goal.trim()) return "추가 결과의 목표를 입력해주세요.";
    if (!p.publicContent.trim())
      return "추가 결과의 내용(일반용)을 입력해주세요.";
    if (!p.privateContent.trim())
      return "추가 결과의 내용(관리자용)을 입력해주세요.";
  }

  return null;
}

// 수정 완료
async function submitAll() {
  const err = validate();
  if (err) {
    alert(err);
    return;
  }

  try {
    const formJson = {
      resultCode,
      planCode: planCode.value,
      submitCode,
      mainForm: mainForm.value,
      resultItems: resultItems.value,
      removedAttachCodes: removedAttachCodes.value,
      modifier,
    };

    const formData = new FormData();
    formData.append("formJson", JSON.stringify(formJson));

    mainFiles.value.forEach((file) => {
      formData.append("resultFiles", file);
    });

    const res = await axios.put(`/api/result/${resultCode}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!res.data?.success) {
      alert(res.data.message || "수정 실패");
      return;
    }

    // CD7(반려)에서 재작성 완료인 경우 → 재승인요청
    if (isResubmit.value) {
      await axios.post(`/api/result/${resultCode}/resubmit`, {
        requesterCode: modifier,
      });
      alert("재작성된 지원결과가 재승인 요청으로 올라갔습니다.");
    } else {
      alert("지원결과가 수정되었습니다.");
    }

    router.push({ name: "resultList" });
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

/* 공통 페이지 래퍼 */
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

/* 기본정보 카드 */
.meta-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem 1rem;
  font-size: 0.85rem;
}

/* ===== 기본정보 그리드 (작성 화면과 동일) ===== */
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

/* 결과 작성일 pill */
.date-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  font-size: 0.8rem;
}

/* ✅ 기간 인풋 정렬 + 크기 (작성 화면과 동일) */
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

/* 수정 화면에서만: 좀 더 강제 */
.meta-card .period-value {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-card .input-month {
  box-sizing: border-box;
  width: 95px;
  min-width: 80px;
  max-width: 110px;
  height: 1.8rem;
  padding: 0.05rem 0.35rem;
  font-size: 0.75rem;
  line-height: 1.2;
}

/* 메인 카드 (지원결과 내용) */
.card-block {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  padding: 1.25rem 1.1rem;
}

/* 그룹 간 간격 */
.form-group + .form-group {
  margin-top: 0.85rem;
}

/* 공통 인풋 스타일 */
.input {
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.35rem 0.6rem;
  font-size: 0.875rem;
  outline: none;
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
  justify-content: space-between;
  gap: 0.5rem;
}

.file-main {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.file-link {
  flex: 1 1 auto;
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

.file-tag-removed {
  font-size: 0.7rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  border: 1px solid #fecaca;
  background-color: #fef2f2;
  color: #b91c1c;
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

/* 옵션 텍스트 */
.goal-select option {
  font-size: 0.875rem;
}
</style>
