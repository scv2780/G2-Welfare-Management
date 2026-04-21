<template>
  <section class="p-6 max-w-5xl mx-auto">
    <!-- 상단 액션 라인 -->
    <div class="form-action">
      <MaterialButton color="dark" size="sm" variant="outlined" @click="goBack">
        ← 목록으로
      </MaterialButton>

      <!-- 오른쪽: 상태에 따른 액션 버튼 묶음 -->
      <div class="flex items-center gap-2">
        <!-- 작성하기 (담당자만 / CB1, CB2) -->
        <MaterialButton
          v-if="role === 2 && (status === 'CB1' || status === 'CB2')"
          color="dark"
          size="sm"
          @click="goWrite"
        >
          작성하기
        </MaterialButton>

        <!-- CB3 → 수정하기 (담당자만) -->
        <MaterialButton
          v-else-if="role === 2 && status === 'CB3'"
          color="dark"
          size="sm"
          @click="goEdit"
        >
          수정하기
        </MaterialButton>
      </div>
    </div>

    <!-- 바깥 상세 카드 -->
    <div class="detail-card">
      <!-- 헤더 -->
      <header class="flex justify-between items-start detail-header">
        <div>
          <h2 class="text-2xl font-semibold mb-1">상담 상세</h2>
        </div>

        <!-- 상태 뱃지 -->
        <span class="status-pill" :class="statusClass(status)">
          {{ statusLabel(status) }}
        </span>
      </header>

      <!-- 로딩/에러 -->
      <div v-if="loading" class="text-sm text-gray-500 py-6">
        불러오는 중...
      </div>
      <div v-else-if="error" class="text-sm text-red-600 py-6">
        {{ error }}
      </div>

      <!-- 본문 -->
      <template v-else>
        <!-- 기본정보 (상태와 관계없이 항상 표시) -->
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

            <!-- 5. 우선순위 -->
            <div class="meta-item">
              <span class="meta-label">우선순위</span>
              <span class="meta-value">
                {{ priorityLabel }}
              </span>
            </div>

            <!-- 6. 조사지 제출일 (버튼) -->
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
          </div>
        </div>

        <!-- CB1 / CB2 일 때: 내용 숨기고 안내만 -->
        <div
          v-if="status === 'CB1' || status === 'CB2'"
          class="info-card muted-info"
        >
          <template v-if="status === 'CB1'">
            이 상담은 <strong>임시 저장</strong> 상태입니다.<br />
          </template>

          <template v-else>
            이 상담은 아직 <strong>작성 전</strong> 상태입니다.<br />
          </template>
        </div>

        <!-- CB1/CB2 가 아닐 때: 실제 상담 내용 / 기록 / 승인/반려 노출 -->
        <template v-else>
          <!-- 메인 상담 -->
          <div class="block-card">
            <h3 class="block-title">첫 상담</h3>

            <div class="text-sm text-gray-600 mb-2">
              상담일:
              <span class="font-medium">{{ mainForm.counselDate || "-" }}</span>
            </div>

            <div class="field-block">
              <div class="field-label">상담 제목</div>
              <div class="field-value">
                {{ mainForm.title || "-" }}
              </div>
            </div>

            <div class="field-block">
              <div class="field-label">상담 내용</div>
              <div class="field-value" v-html="formattedMainContent"></div>
            </div>

            <!-- 첨부 파일 영역 -->
            <div class="field-block mt-3">
              <div class="field-label">첨부 파일</div>

              <div v-if="attachments.length">
                <ul class="list-disc pl-4 text-sm">
                  <li
                    v-for="file in attachments"
                    :key="file.attachCode"
                    class="text-blue-600"
                  >
                    <a
                      :href="file.url"
                      target="_blank"
                      class="hover:underline break-all"
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

          <!-- 추가 상담 기록 -->
          <div class="space-y-4 mt-4">
            <h3 class="font-semibold text-lg">추가 상담 기록</h3>

            <template v-if="records.length">
              <div
                v-for="(record, idx) in records"
                :key="record.id || idx"
                class="block-card"
              >
                <div
                  class="flex justify-between items-center text-sm mb-2 border-b border-gray-200 pb-2"
                >
                  <div class="font-medium">기록 #{{ idx + 1 }}</div>
                  <div class="text-gray-500">
                    상담일:
                    <span class="font-medium">
                      {{ record.counselDate || "-" }}
                    </span>
                  </div>
                </div>

                <div class="field-block">
                  <div class="field-label">상담 내용</div>
                  <div
                    class="field-value"
                    v-html="formatRecordContent(record.content)"
                  ></div>
                </div>

                <div class="field-block">
                  <div class="field-label">상담 내용</div>
                  <div class="field-value whitespace-pre-line">
                    {{ record.content || "-" }}
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="text-sm text-gray-500">
              추가 상담 기록이 없습니다.
            </p>
          </div>
        </template>
      </template>
    </div>

    <!-- ⛔ 마지막 반려 이력 (있을 때만 노출) -->
    <div
      v-if="rejectionInfo.reason && (status === 'CB4' || status === 'CB6')"
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

    <!-- CB4 → 재수정하기 (반려 시 담당자 전용) -->
    <div class="right-wrap mt-2">
      <MaterialButton
        v-if="role === 2 && status === 'CB4'"
        color="dark"
        size="sm"
        @click="goEdit"
      >
        재수정하기
      </MaterialButton>
    </div>

    <!-- 🔥 관리자(3) 전용 영역: 반려 이력 + 승인/반려 버튼 -->
    <div
      v-if="role === 3 && (status === 'CB3' || status === 'CB6')"
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

    <!-- 반려 사유 입력 모달 -->
    <div v-if="rejectModalOpen" class="modal-overlay">
      <div class="modal-container">
        <h3 class="text-lg font-semibold mb-3">반려 사유 입력</h3>

        <MaterialTextarea
          id="reject-reason"
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
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";
import MaterialTextarea from "@/components/MaterialTextarea.vue";
import { useAuthStore } from "@/store/authLogin";

const route = useRoute();
const router = useRouter();

const auth = useAuthStore(); // 🔹 추가
auth.reload();

const submitCode = computed(() =>
  Number(route.params.submitCode || route.query.submitCode || 0)
);

const loading = ref(false);
const error = ref("");
const attachments = ref([]); // 첨부파일 목록

// 쿼리로 넘어온 role (2: 담당자, 3: 관리자, 4: 시스템)
const role = computed(() => Number(route.query.role || 0));

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
const priority = ref("BB3");
const status = ref("");

// 🔻 마지막 반려 이력 (reason + date)
const rejectionInfo = ref({
  reason: "",
  date: "",
});

// 메인 상담 내용 줄바꿈 처리
const formattedMainContent = computed(() => {
  const raw = mainForm.value.content || "";

  if (!raw) return "-";

  return raw
    .replace(/\r\n/g, "<br>") // 윈도우 줄바꿈
    .replace(/\n/g, "<br>") // 일반 줄바꿈
    .replace(/\\n/g, "<br>"); // 문자 그대로 "\n" 이 들어온 경우까지 처리
});

// 추가 상담 기록 줄바꿈 처리
function formatRecordContent(content) {
  const raw = content || "";

  if (!raw) return "-";

  return raw
    .replace(/\r\n/g, "<br>")
    .replace(/\n/g, "<br>")
    .replace(/\\n/g, "<br>");
}

const formattedRejectionDate = computed(() => {
  const v = rejectionInfo.value.date;
  return v ? String(v).slice(0, 10) : "-";
});

const priorityLabel = computed(() => {
  const code = (priority.value || "").toString().toUpperCase();
  switch (code) {
    case "BB1":
      return "긴급";
    case "BB2":
      return "중점";
    case "BB3":
      return "계획";
    default:
      return priority.value || "-";
  }
});

// 데이터 로딩
async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    const code = submitCode.value;
    const { data } = await axios.get(`/api/counsel/${code}`);

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

    // ✅ 우선순위 코드(BB1/BB2/BB3) 기준으로 받는다고 가정
    priority.value = res.priority || "BB3";
    status.value = res.status || "";

    records.value =
      (res.details || []).map((d, idx) => ({
        id: d.detail_code || Date.now() + idx,
        counselDate: d.counsel_date || "",
        title: d.title || "",
        content: d.content || "",
      })) || [];

    attachments.value = res.attachments || [];

    await loadRejectionInfo();
  } catch (e) {
    console.error(e);
    error.value = e.message || "상담 정보 조회 중 오류";
  } finally {
    loading.value = false;
  }
}

// 🔹 반려 이력 조회
async function loadRejectionInfo() {
  try {
    const code = submitCode.value;

    if (!Number.isInteger(code) || code <= 0) {
      console.warn("[loadRejectionInfo] invalid submitCode:", {
        params: route.params.submitCode,
        query: route.query.submitCode,
      });
      rejectionInfo.value = { reason: "", date: "" };
      return;
    }

    const { data } = await axios.get(`/api/counsel/${code}/rejection-reason`);

    if (data?.success && data.result) {
      const r = data.result;
      rejectionInfo.value = {
        reason: r.rejection_reason || "",
        // SQL에서 approval_date AS rejection_date 로 내려준다고 가정
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

/* ---------- 상태 라벨 / 스타일 ---------- */
function statusLabel(code) {
  const c = (code || "").toString().toUpperCase();
  switch (c) {
    case "CB1":
      return "상담전"; // 임시저장
    case "CB2":
      return "상담전";
    case "CB3":
      return "검토전";
    case "CB4":
      return "반려";
    case "CB5":
      return "검토완료";
    case "CB6":
      return "재승인요청";
    default:
      return code || "-";
  }
}

// 리스트 화면과 동일한 클래스명
function statusClass(code) {
  const c = (code || "").toString().toUpperCase();

  switch (c) {
    case "CB1": // 상담전 (임시)
    case "CB2": // 상담전
      return "p-gray"; // 회색

    case "CB3": // 검토전
      return "p-yellow"; // 노랑

    case "CB4": // 반려
      return "p-red"; // 빨강

    case "CB5": // 검토완료
      return "p-green"; // 초록

    case "CB6": // 재승인요청
      return "p-orange"; // 주황

    default:
      return "p-gray"; // 혹시 모르는 상태는 회색
  }
}

function openSubmissionDetail() {
  const code = submitCode.value;
  if (!code) return;
  window.open(`/survey/submission/${code}`, "_blank");
}
function goBack() {
  router.push({ name: "counselList" });
}
function goEdit() {
  router.push({
    name: "counsel-edit",
    params: { submitCode: submitCode.value },
  });
}
function goWrite() {
  router.push({
    name: "counsel-new",
    params: { submitCode: submitCode.value },
  });
}

const rejectModalOpen = ref(false);
const rejectReason = ref("");

// 승인
async function handleApprove() {
  try {
    const code = submitCode.value;
    const processorCode = auth.userCode; // 🔹 로그인한 관리자 userCode

    if (!processorCode) {
      alert(
        "로그인 정보가 없어 승인자를 기록할 수 없습니다. 다시 로그인해주세요."
      );
      return;
    }

    const { data } = await axios.post(`/api/counsel/${code}/approve`, {
      processorCode, // 🔹 백엔드로 전송
    });

    if (data?.success) {
      alert("승인되었습니다.");
      await loadData(); // 다시 조회
    } else {
      alert(data.message || "승인 처리 실패");
    }
  } catch (e) {
    console.error(e);
    alert("서버 오류: " + (e.response?.data?.message || e.message));
  }
}

// 반려 버튼 눌렀을 때 → 모달 열기
function handleReject() {
  rejectReason.value = "";
  rejectModalOpen.value = true;
}

// 모달 안에서 '반려' 확정
async function confirmReject() {
  if (!rejectReason.value.trim()) {
    alert("반려 사유를 입력해주세요.");
    return;
  }

  try {
    const code = submitCode.value;
    const { data } = await axios.post(`/api/counsel/${code}/reject`, {
      reason: rejectReason.value,
    });
    if (data?.success) {
      alert("반려되었습니다.");
      rejectModalOpen.value = false;
      await loadData();
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

loadData();
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

/* 상태 pill 공통 */
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.32rem 0.75rem;
  border-radius: 999px;
  font-size: 13px; /* 살짝 작게 */
  font-weight: 500;
  border: 1px solid transparent;
  min-width: auto; /* 길이 강제하지 않음 */
  line-height: 1.1; /* 더 콤팩트하게 */
  height: auto;
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

/* 조사지 버튼이 들어가는 행 정렬 */
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
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  padding: 0.9rem 1rem;
  font-size: 0.85rem;
  box-sizing: border-box;
}
.muted-info {
  background-color: #f9fafb;
  color: #4b5563;
}

/* 블록 카드 (메인 상담 / 기록) */
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

.approve-actions {
  display: flex;
  justify-content: center; /* 가운데 정렬 */
  align-items: center;
  gap: 1rem; /* 버튼 사이 간격 */
  margin-top: 0.4rem; /* 위와 약간 띄우기 (원하면 조절) */
  width: 100%; /* 부모 카드 기준 전체 폭 차지 */
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
.right-wrap {
  display: flex !important;
  justify-content: flex-end !important;
}
</style>
