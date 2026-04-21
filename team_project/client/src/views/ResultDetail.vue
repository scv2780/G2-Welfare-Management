<template>
  <section class="p-6 max-w-5xl mx-auto">
    <!-- 상단 액션 라인 -->
    <div class="form-action">
      <!-- ← 목록으로 -->
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>

      <!-- 오른쪽: 상태에 따른 액션 버튼 묶음 -->
      <div class="flex items-center gap-2">
        <!-- 작성하기 (담당자만 / CD1, CD3) -->
        <MaterialButton
          v-if="role === 2 && (status === 'CD1' || status === 'CD3')"
          color="dark"
          size="sm"
          @click="goWrite"
        >
          작성하기
        </MaterialButton>

        <!-- 수정하기 (담당자만 / CD4) -->
        <MaterialButton
          v-else-if="role === 2 && status === 'CD4'"
          color="dark"
          size="sm"
          @click="goEdit"
        >
          수정하기
        </MaterialButton>

        <!-- 재수정하기 (담당자만 / CD7) -->
        <MaterialButton
          v-else-if="role === 2 && status === 'CD7'"
          color="dark"
          size="sm"
          @click="goEdit"
        >
          재수정하기
        </MaterialButton>
      </div>
    </div>

    <!-- 바깥 상세 카드 -->
    <div class="detail-card">
      <!-- 헤더 -->
      <header class="flex justify-between items-start detail-header">
        <div>
          <h2 class="text-2xl font-semibold">지원결과 상세</h2>
        </div>

        <!-- 상태 뱃지 -->
        <span class="status-pill" :class="statusClass(status)">
          {{ statusLabel(status) }}
        </span>
      </header>

      <!-- 로딩 / 에러 -->
      <div v-if="loading" class="text-sm text-gray-500 py-6">
        지원결과 정보를 불러오는 중입니다...
      </div>
      <div v-else-if="error" class="text-sm text-red-500 py-6">
        {{ error }}
      </div>

      <!-- 본문 -->
      <template v-else>
        <!-- 기본정보 카드 (그리드) -->
        <div class="meta-card">
          <div class="meta-grid">
            <!-- 1. 지원자 -->
            <div class="meta-item">
              <span class="meta-label">지원자</span>
              <span class="meta-value">
                {{ basicInfo.childName || "본인" }}
              </span>
            </div>

            <!-- 2. 보호자 -->
            <div class="meta-item">
              <span class="meta-label">보호자</span>
              <span class="meta-value">
                {{ basicInfo.guardianName || "-" }}
              </span>
            </div>

            <!-- 3. 담당자 -->
            <div class="meta-item">
              <span class="meta-label">담당자</span>
              <span class="meta-value">
                {{ basicInfo.assigneeName || "-" }}
              </span>
            </div>

            <!-- 4. 장애유형 -->
            <div class="meta-item">
              <span class="meta-label">장애유형</span>
              <span class="meta-value">
                {{ basicInfo.disabilityType || "-" }}
              </span>
            </div>

            <!-- 우선순위 -->
            <div class="meta-item">
              <span class="meta-label">우선순위</span>
              <span class="meta-value">
                {{ priorityLabel(basicInfo.level) || "-" }}
              </span>
            </div>

            <!-- 5. 계획작성일 (계획서 작성/제출일) -->
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
              <span class="meta-value">
                <span>{{ mainForm.actualStart || "미지정" }}</span>
                <span class="mx-1">~</span>
                <span>{{ mainForm.actualEnd || "미지정" }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- CD1 / CD3 : 안내만 노출 -->
        <div v-if="isTemp" class="info-card muted-info">
          <template v-if="status === 'CD1'">
            이 지원결과는 <strong>임시 저장</strong> 상태입니다.<br />
          </template>

          <template v-else>
            이 지원결과는 아직 <strong>작성 전</strong> 상태입니다.<br />
          </template>
        </div>

        <!-- 실제 내용 (임시/작성전이 아닐 때만) -->
        <template v-else>
          <!-- 메인 결과 카드 -->
          <div class="block-card">
            <h3 class="block-title">메인 결과</h3>

            <div class="field-block">
              <div class="field-label">계획했던 목표</div>
              <div class="field-value">
                {{ mainForm.goal || "-" }}
              </div>
            </div>

            <div class="field-block">
              <div class="field-label">결과 내용 (일반)</div>
              <div class="field-value whitespace-pre-line">
                {{ mainForm.publicContent || "-" }}
              </div>
            </div>

            <!-- 관리자용 내용: role !== 1 일 때만 -->
            <div v-if="role !== 1" class="field-block">
              <div class="field-label">결과 내용 (관리자)</div>
              <div class="field-value whitespace-pre-line">
                {{ mainForm.privateContent || "-" }}
              </div>
            </div>

            <!-- 첨부 파일: role !== 1 일 때만 -->
            <div v-if="role !== 1" class="field-block mt-3">
              <div class="field-label">첨부 파일</div>
              <div v-if="attachments.length">
                <ul class="mt-1 text-xs text-gray-700 space-y-1">
                  <li
                    v-for="file in attachments"
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
                  </li>
                </ul>
              </div>
              <div v-else class="text-xs text-gray-400">
                첨부된 파일이 없습니다.
              </div>
            </div>
          </div>

          <!-- 추가 결과 카드들 -->
          <div class="space-y-4 mt-4">
            <h3 class="font-semibold text-lg">추가 결과</h3>

            <template v-if="resultItems.length">
              <div
                v-for="(item, idx) in resultItems"
                :key="item.id || idx"
                class="block-card"
              >
                <div
                  class="flex justify-between items-center text-sm mb-2 border-b border-gray-200 pb-2"
                >
                  <div class="font-medium">결과 #{{ idx + 1 }}</div>
                </div>

                <div class="field-block">
                  <div class="field-label">계획했던 목표</div>
                  <div class="field-value">
                    {{ item.goal || "-" }}
                  </div>
                </div>

                <div class="field-block">
                  <div class="field-label">결과 내용 (일반)</div>
                  <div class="field-value whitespace-pre-line">
                    {{ item.publicContent || "-" }}
                  </div>
                </div>

                <div v-if="role !== 1" class="field-block">
                  <div class="field-label">결과 내용 (관리자)</div>
                  <div class="field-value whitespace-pre-line">
                    {{ item.privateContent || "-" }}
                  </div>
                </div>
              </div>
            </template>

            <p v-else class="text-sm text-gray-500">추가 결과가 없습니다.</p>
          </div>
        </template>
      </template>
    </div>

    <!-- ⛔ 마지막 반려 이력 (있을 때만 노출) -->
    <div
      v-if="
        role !== 1 &&
        rejectionInfo.reason &&
        (status === 'CD7' || status === 'CD6')
      "
      class="rejection-card"
    >
      <div class="font-semibold mb-1 text-sm">반려 이력</div>

      <div class="mb-1">
        반려일자:
        <span class="font-medium">
          {{ formattedRejectionDate }}
        </span>
      </div>

      <div>
        <div class="font-medium">사유:</div>
        <p class="whitespace-pre-line mt-1">
          {{ rejectionInfo.reason }}
        </p>
      </div>
    </div>

    <!-- 재수정하기 (반려 시 담당자 전용) -->
    <div class="right-wrap mt-2">
      <MaterialButton
        v-if="role === 2 && status === 'CD7'"
        color="dark"
        size="sm"
        @click="goEdit"
      >
        재수정하기
      </MaterialButton>
    </div>

    <!-- 🔥 관리자(3) 전용 영역: 반려 이력 + 승인/반려 버튼 -->
    <div
      v-if="role === 3 && (status === 'CD4' || status === 'CD6')"
      class="pt-4 border-t mt-2 space-y-3"
    >
      <!-- 승인/반려 버튼 -->
      <div class="approve-actions">
        <MaterialButton
          color="dark"
          size="sm"
          class="px-4"
          @click="handleApprove"
        >
          승인
        </MaterialButton>
        <MaterialButton
          color="dark"
          size="sm"
          class="px-4"
          @click="handleReject"
        >
          반려
        </MaterialButton>
      </div>
    </div>

    <!-- 🔻 반려 사유 입력 모달 -->
    <div v-if="rejectModalOpen" class="modal-overlay">
      <div class="modal-container">
        <h3 class="text-lg font-semibold mb-3">반려 사유 입력</h3>

        <MaterialTextarea
          id="result-reject-reason"
          variant="outline"
          :rows="4"
          placeholder="반려 사유를 입력하세요..."
          :value="rejectReason"
          @input="(e) => (rejectReason = e.target.value)"
        />

        <div class="modal-actions">
          <MaterialButton color="dark" size="sm" @click="closeRejectModal">
            취소
          </MaterialButton>
          <MaterialButton color="dark" size="sm" @click="confirmReject">
            반려
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
import { useAuthStore } from "@/store/authLogin";

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
authStore.reload();

// 라우터에서 받은 값들
const resultCode = Number(route.params.resultCode || 0);
const submitCode = Number(route.query.submitCode || 0);
const planCode = Number(route.query.planCode || 0);

// 쿼리로 넘어온 role (1: 일반, 2: 담당자, 3: 관리자, 4: 시스템)
const role = computed(() => Number(route.query.role || 0));

// 상태 저장
const status = ref("");
// CD1(임시), CD3(작성전) 둘 다 isTemp 로 처리
const isTemp = computed(() => status.value === "CD1" || status.value === "CD3");

// 기본 정보
const basicInfo = ref({
  childName: "",
  guardianName: "",
  assigneeName: "",
  disabilityType: "",
  planSubmitAt: "",
  level: "",
});

const formattedPlanSubmitAt = computed(() => {
  const v = basicInfo.value.planSubmitAt;
  return v ? String(v).slice(0, 10) : "-";
});

// 메인 결과 폼
const mainForm = ref({
  resultDate: "",
  actualStart: "",
  actualEnd: "",
  goal: "",
  publicContent: "",
  privateContent: "",
});

// 추가 결과
const resultItems = ref([]);

// 첨부파일
const attachments = ref([]);

const loading = ref(false);
const error = ref("");

// 🔻 반려 모달 상태
const rejectModalOpen = ref(false);
const rejectReason = ref("");

// 🔻 마지막 반려 이력
const rejectionInfo = ref({
  reason: "",
  date: "",
});

const formattedRejectionDate = computed(() => {
  const v = rejectionInfo.value?.date;
  return v ? String(v).slice(0, 10) : "-";
});

// 오늘 YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// 기본 정보 불러오기 (결과용 API)
async function loadBasicInfo() {
  if (!submitCode) return;

  const { data } = await axios.get(`/api/result/${submitCode}`);

  if (!data?.success || !data.result) {
    throw new Error(data?.message || "지원결과 기본 정보를 찾을 수 없습니다.");
  }

  const res = data.result;

  basicInfo.value = {
    childName: res.childName || "",
    guardianName: res.guardianName || "",
    assigneeName: res.assigneeName || "-",
    disabilityType: res.disabilityType || "-",
    planSubmitAt: res.planSubmitAt || "",
    level: res.level || "",
  };
}

// 결과 상세 불러오기
async function loadDetail() {
  const { data } = await axios.get(`/api/result/detail/${resultCode}`);

  if (!data?.success || !data.result) {
    throw new Error(data?.message || "지원결과 정보를 찾을 수 없습니다.");
  }

  const d = data.result;

  status.value = d.status || "";

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

  resultItems.value =
    (d.items || []).map((it, idx) => ({
      id: it.resultItemCode || Date.now() + idx,
      goal: it.goal || "",
      publicContent: it.publicContent || "",
      privateContent: it.privateContent || "",
    })) || [];

  attachments.value =
    (d.attachments || []).map((a) => ({
      attachCode: a.attachCode,
      originalFilename: a.originalFilename,
      url: a.url,
    })) || [];
}

// 🔹 마지막 반려 이력 조회 (관리자용 표시)
async function loadRejectionInfo() {
  try {
    const { data } = await axios.get(
      `/api/result/${resultCode}/rejection-reason`
    );

    if (data?.success && data.result) {
      const r = data.result;
      rejectionInfo.value = {
        reason: r.rejection_reason || "",
        date: r.rejection_date || r.approval_date || "",
      };
    } else {
      rejectionInfo.value = { reason: "", date: "" };
    }
  } catch (e) {
    console.error("[loadRejectionInfo]", e);
    rejectionInfo.value = { reason: "", date: "" };
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

onMounted(async () => {
  try {
    loading.value = true;

    if (!resultCode) {
      throw new Error("resultCode가 없습니다. (라우터 params 확인 필요)");
    }

    // 1) 상세 먼저 로드
    await loadDetail();

    // 2) 기본정보는 submitCode 있을 때만
    if (submitCode) {
      await loadBasicInfo();
    }

    // 3) 반려 이력도 같이 조회
    if (role.value !== 1) {
      await loadRejectionInfo();
    }
  } catch (e) {
    console.error(e);
    error.value = e.message || "지원결과 조회 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
});

/* ---------- 상태 라벨 / 스타일 ---------- */
function statusLabel(code) {
  const c = (code || "").toString().toUpperCase();
  switch (c) {
    case "CD1":
      return "작성전";
    case "CD3":
      return "작성전";
    case "CD4":
      return "검토전";
    case "CD5":
      return "검토완료";
    case "CD6":
      return "재승인요청";
    case "CD7":
      return "반려";
    default:
      return code || "-";
  }
}

function statusClass(code) {
  const c = (code || "").toString().toUpperCase();
  switch (c) {
    case "CD1":
    case "CD3":
      return "p-blue";
    case "CD4":
      return "p-yellow";
    case "CD5":
      return "p-green";
    case "CD6":
      return "p-orange";
    case "CD7":
      return "p-red";
    default:
      return "p-gray";
  }
}

// 계획 상세로 이동 (PlanDetail 라우트에 맞게 경로 필요시 수정)
function openPlanDetail() {
  if (!planCode) return;
  const roleParam = role.value || "";
  const url = `/plans/detail/${planCode}?submitCode=${submitCode}${
    roleParam ? `&role=${roleParam}` : ""
  }`;

  window.open(url, "_blank");
}

// 목록으로
function goBack() {
  router.back();
}

// 수정 화면으로 이동
function goEdit() {
  if (!resultCode) return;

  router.push({
    name: "result-edit",
    params: { resultCode },
    query: submitCode ? { submitCode, role: role.value } : { role: role.value },
  });
}

// 작성 화면으로 이동
function goWrite() {
  if (!submitCode) return;

  router.push({
    name: "result-write",
    params: { submitcode: submitCode },
    query: {
      role: role.value,
      planCode,
      submitCode,
    },
  });
}

// ✅ 승인
async function handleApprove() {
  try {
    const processorCode = authStore.userCode; // 🔹 로그인한 관리자 userCode

    if (!processorCode) {
      alert(
        "로그인 정보가 없어 승인자를 기록할 수 없습니다. 다시 로그인해주세요."
      );
      return;
    }

    const { data } = await axios.post(`/api/result/${resultCode}/approve`, {
      processorCode, // 🔹 서버로 같이 전달
    });

    if (data?.success) {
      alert("지원결과가 승인되었습니다.");
      await loadDetail();
    } else {
      alert(data.message || "승인 처리 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

// ✅ 반려 버튼 클릭 → 모달 열기
function handleReject() {
  rejectReason.value = "";
  rejectModalOpen.value = true;
}

// ✅ 모달 안에서 '반려' 확정
async function confirmReject() {
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력해주세요.");
    return;
  }

  try {
    const { data } = await axios.post(`/api/result/${resultCode}/reject`, {
      reason: rejectReason.value,
    });
    if (data?.success) {
      alert("지원결과가 반려되었습니다.");
      rejectModalOpen.value = false;
      await loadDetail();
    } else {
      alert(data.message || "반려 처리 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

function closeRejectModal() {
  rejectModalOpen.value = false;
}
</script>

<style scoped>
section {
  color: #111827;
}

/* 상단 액션 라인 */
.form-action {
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

/* 바깥 카드 */
.detail-card {
  background: #ffffff;
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}

/* 헤더 */
.detail-header {
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

/* 메타 정보 카드 */
.meta-card {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.9rem 1rem;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}

/* 기존 row 스타일 (다른 곳에서 쓸 수도 있으니 유지) */
.meta-row + .meta-row {
  margin-top: 0.35rem;
}
.meta-label {
  display: inline-block;
  width: 4.5rem;
  color: #6b7280;
}
.meta-value {
  color: #111827;
}

/* 버튼 들어가는 행 */
.meta-row-inline {
  display: flex;
  align-items: center;
}
.meta-value-inline {
  display: inline-flex;
  align-items: center;
}

.meta-card,
.info-card,
.block-card {
  width: 100%;
}

/* 안내 카드 */
.info-card {
  display: block;
  box-sizing: border-box;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 0.9rem 1rem;
  font-size: 0.85rem;
}
.muted-info {
  background-color: #f9fafb;
  color: #4b5563;
}

/* 블록 카드 (메인 결과 / 추가 결과) */
.block-card {
  border-radius: 0.85rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 1rem 1rem;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.block-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* 필드 블록 */
.field-block {
  margin-top: 0.6rem;
}
.field-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.15rem;
}
.field-value {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 0.5rem 0.7rem;
  font-size: 0.9rem;
  color: #111827;

  white-space: pre-line; /* \n → 실제 줄바꿈 */
  word-break: break-word;
}

/* 첨부 파일 텍스트 */
.file-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.file-link {
  flex: 1 1 auto;
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

/* 반려 카드 */
.rejection-card {
  border-radius: 0.75rem;
  border: 1px solid #fecaca;
  background-color: #fef2f2;
  padding: 0.9rem 1rem;
  font-size: 0.8rem;
  color: #b91c1c;
  margin-top: 10px;
}

/* 승인/반려 버튼 줄 */
.approve-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 0.4rem;
  width: 100%;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-container {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.35);
}

.modal-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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

.right-wrap {
  display: flex !important;
  justify-content: flex-end !important;
}
</style>
