<!-- src/views/AuthorityTransfer.vue -->
<template>
  <div class="at-page">
    <h2 class="at-title">담당자 권한(이용자) 이전</h2>

    <!-- 권한 없음 -->
    <div v-if="!isOrgManager" class="at-no-auth">
      <p>접근 권한이 없습니다. (기관 관리자 전용 페이지)</p>
    </div>

    <!-- 기관 관리자 전용 -->
    <div v-else>
      <!-- 상단 필터/선택 영역 -->
      <div class="at-toolbar">
        <!-- 1행: 담당자 선택 -->
        <div class="at-row">
          <div class="at-field-group">
            <label class="at-label">현재 담당자(From)</label>
            <select
              v-model="sourceManagerCode"
              class="at-select"
              @change="onSourceManagerChange"
            >
              <option value="">담당자 선택</option>
              <option
                v-for="m in managerOptions"
                :key="m.user_code"
                :value="m.user_code"
              >
                {{ m.name }}
              </option>
            </select>
          </div>

          <div class="at-field-group">
            <label class="at-label">이전받을 담당자(To)</label>
            <select
              v-model="targetManagerCode"
              class="at-select"
              @change="onTargetManagerChange"
            >
              <option value="">담당자 선택</option>
              <option
                v-for="m in managerOptions"
                :key="m.user_code"
                :value="m.user_code"
              >
                {{ m.name }}
              </option>
            </select>
          </div>

          <div class="at-field-group at-field-grow">
            <label class="at-label">이용자 검색(이름/ID 등)</label>
            <div class="at-inline">
              <input
                v-model.trim="keyword"
                class="at-input"
                placeholder="이용자 이름 또는 ID 검색"
                @keyup.enter="fetchSourceUsers"
              />
              <MaterialButton color="dark" size="sm" @click="fetchSourceUsers"
                >검색</MaterialButton
              >
            </div>
          </div>
        </div>

        <!-- 2행: 안내 문구 -->
        <div class="at-row at-row-hint">
          <p>
            • 왼쪽에서 <strong>이전할 이용자</strong>를 선택하고, 아래의
            <strong>권한 이전</strong> 버튼을 누르면 선택한 이용자의 담당자가
            <strong>{{ targetManagerName || "선택된 담당자" }}</strong
            >(으)로 변경됩니다.
          </p>
        </div>
      </div>

      <!-- 본문: 두 개의 패널 -->
      <div class="at-panels">
        <!-- 왼쪽: 현재 담당자 이용자 목록 -->
        <div class="at-panel">
          <div class="at-panel-header">
            <h3 class="at-panel-title">
              현재 담당자 이용자 목록
              <span v-if="sourceManagerName" class="at-tag">
                {{ sourceManagerName }}
              </span>
            </h3>
            <small class="at-panel-sub">
              전체 {{ sourceUsers.length }}명
            </small>
          </div>

          <div class="at-table-wrap">
            <table class="at-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      :checked="isAllSelected"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th>No</th>
                  <th>이용자명</th>
                  <th>식별자(ID 등)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingSource">
                  <td colspan="4" class="at-empty">로딩 중...</td>
                </tr>
                <tr v-else-if="sourceUsers.length === 0">
                  <td colspan="4" class="at-empty">
                    조회된 이용자가 없습니다.
                  </td>
                </tr>
                <tr v-for="(user, idx) in sourceUsers" :key="user.user_code">
                  <td>
                    <input
                      type="checkbox"
                      v-model="selectedUserCodes"
                      :value="user.user_code"
                    />
                  </td>
                  <td>{{ idx + 1 }}</td>
                  <td>{{ getUserName(user) }}</td>
                  <td>{{ getUserIdentifier(user) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 오른쪽: 대상 담당자 이용자 목록 -->
        <div class="at-panel">
          <div class="at-panel-header">
            <h3 class="at-panel-title">
              이전받을 담당자 이용자 목록
              <span v-if="targetManagerName" class="at-tag at-tag-secondary">
                {{ targetManagerName }}
              </span>
            </h3>
            <small class="at-panel-sub">
              전체 {{ targetUsers.length }}명
            </small>
          </div>

          <div class="at-table-wrap">
            <table class="at-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>이용자명</th>
                  <th>식별자(ID 등)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingTarget">
                  <td colspan="3" class="at-empty">로딩 중...</td>
                </tr>
                <tr v-else-if="targetUsers.length === 0">
                  <td colspan="3" class="at-empty">
                    조회된 이용자가 없습니다.
                  </td>
                </tr>
                <tr v-for="(user, idx) in targetUsers" :key="user.user_code">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ getUserName(user) }}</td>
                  <td>{{ getUserIdentifier(user) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 하단: 액션 버튼 -->
      <div class="at-actions">
        <MaterialButton
          color="dark"
          size="sm"
          :disabled="!canTransfer || transferring"
          @click="openConfirmModal"
        >
          {{ transferring ? "이전 처리 중..." : "선택한 이용자 권한 이전" }}
        </MaterialButton>
      </div>
    </div>

    <!-- 🔶 권한 이전 확인 모달 -->
    <Teleport to="body">
      <div v-if="showConfirm" class="at-modal-backdrop">
        <div class="at-modal">
          <h3 class="at-modal-title">권한 이전 확인</h3>

          <p class="at-modal-text">
            선택한 {{ selectedUserCodes.length }}명의 이용자를<br />
            <strong>{{ sourceManagerName }}</strong> →
            <strong>{{ targetManagerName }}</strong
            ><br />
            로 이전하시겠습니까?
          </p>

          <div class="at-modal-actions">
            <MaterialButton color="dark" size="sm" @click="cancelTransfer"
              >취소</MaterialButton
            >
            <MaterialButton color="dark" size="sm" @click="confirmTransfer">
              예, 이전하기
            </MaterialButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import axios from "axios";
import { useAuthStore } from "@/store/authLogin";
import MaterialButton from "@/components/MaterialButton.vue";

const auth = useAuthStore();

const sourcePage = ref(1);
const sourceTotalCount = ref(0);
const targetPage = ref(1);
const targetTotalCount = ref(0);

// 권한 체크: 기관 관리자만
const isOrgManager = computed(() => auth.role === "AA3");

// 담당자 목록 (같은 기관 AA2)
const managerOptions = ref([]);

// 선택된 담당자
const sourceManagerCode = ref("");
const targetManagerCode = ref("");

// 이용자 검색 키워드 (현재 담당자 쪽만)
const keyword = ref("");

// 이용자 목록
const sourceUsers = ref([]);
const targetUsers = ref([]);

// 선택된 이용자 (user_code 배열)
const selectedUserCodes = ref([]);

// 로딩 플래그
const loadingSource = ref(false);
const loadingTarget = ref(false);
const transferring = ref(false);

// 🔶 모달 ON/OFF
const showConfirm = ref(false);

// 담당자 이름 computed
const sourceManagerName = computed(() => {
  const m = managerOptions.value.find(
    (x) => String(x.user_code) === String(sourceManagerCode.value)
  );
  return m ? m.name : "";
});

const targetManagerName = computed(() => {
  const m = managerOptions.value.find(
    (x) => String(x.user_code) === String(targetManagerCode.value)
  );
  return m ? m.name : "";
});

// 전체 선택 체크박스 상태
const isAllSelected = computed(() => {
  return (
    sourceUsers.value.length > 0 &&
    selectedUserCodes.value.length === sourceUsers.value.length
  );
});

// 권한 이전 가능 여부
const canTransfer = computed(() => {
  return (
    sourceManagerCode.value &&
    targetManagerCode.value &&
    sourceManagerCode.value !== targetManagerCode.value &&
    selectedUserCodes.value.length > 0
  );
});

// 공통: 이용자 이름/식별자 표시 헬퍼
const getUserName = (user) =>
  user.user_name || user.child_name || user.name || "-";

const getUserIdentifier = (user) =>
  user.user_id || user.child_code || user.identifier || "";

// 담당자 목록 조회 (기관 관리자 로그인 기준)
const fetchManagerOptions = async () => {
  if (!isOrgManager.value) return;
  try {
    const res = await axios.get("/api/managers/simple", {
      params: { loginId: auth.userId }, // 로그인 아이디 기준
    });

    const raw = res.data?.data ?? [];
    managerOptions.value = raw.map((m) => ({
      user_code: m.user_code ?? m.manager_code,
      name: m.name ?? m.manager_name,
    }));
  } catch (err) {
    console.error("[AuthorityTransfer] 담당자 목록 조회 실패:", err);
  }
};

// 현재 담당자 이용자 목록
const fetchSourceUsers = async () => {
  if (!sourceManagerCode.value) {
    sourceUsers.value = [];
    selectedUserCodes.value = [];
    return;
  }

  loadingSource.value = true;
  try {
    const res = await axios.get("/api/authority-transfer/users", {
      params: {
        loginId: auth.userId,
        managerCode: sourceManagerCode.value,
        keyword: keyword.value || "",
        page: sourcePage.value,
        size: 20,
      },
    });

    const data = res.data?.data ?? {};
    sourceUsers.value = data.list ?? data; // 둘 중 뭐가 와도 대응
    sourceTotalCount.value = data.totalCount ?? sourceUsers.value.length;
  } catch (err) {
    console.error("[AuthorityTransfer] sourceUsers 조회 실패:", err);
  } finally {
    loadingSource.value = false;
  }
};

// 대상 담당자 이용자 목록
const fetchTargetUsers = async () => {
  if (!targetManagerCode.value) {
    targetUsers.value = [];
    return;
  }

  loadingTarget.value = true;
  try {
    const res = await axios.get("/api/authority-transfer/users", {
      params: {
        loginId: auth.userId,
        managerCode: targetManagerCode.value,
        page: targetPage.value,
        size: 20,
      },
    });

    const data = res.data?.data ?? {};
    targetUsers.value = data.list ?? data;
    targetTotalCount.value = data.totalCount ?? targetUsers.value.length;
  } catch (err) {
    console.error("[AuthorityTransfer] targetUsers 조회 실패:", err);
  } finally {
    loadingTarget.value = false;
  }
};

// 전체 선택 토글
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedUserCodes.value = [];
  } else {
    selectedUserCodes.value = sourceUsers.value.map((u) => u.user_code);
  }
};

// 담당자 변경 시 로딩
const onSourceManagerChange = () => {
  keyword.value = "";
  fetchSourceUsers();
};

const onTargetManagerChange = () => {
  fetchTargetUsers();
};

// 🔶 모달 열기
const openConfirmModal = () => {
  if (!canTransfer.value) return;
  showConfirm.value = true;
};

// 🔶 모달 닫기
const cancelTransfer = () => {
  showConfirm.value = false;
};

// 권한 이전 실행 (실제 처리)
const onTransfer = async () => {
  if (!canTransfer.value) return;

  transferring.value = true;
  try {
    await axios.post("/api/authority-transfer/transfer", {
      loginId: auth.userId,
      fromManagerCode: sourceManagerCode.value,
      toManagerCode: targetManagerCode.value,
      userCodes: selectedUserCodes.value,
    });

    alert("권한(담당자) 이전이 완료되었습니다.");

    // 목록 새로고침
    await fetchSourceUsers();
    await fetchTargetUsers();
    selectedUserCodes.value = [];
  } catch (err) {
    console.error("[AuthorityTransfer] 권한 이전 실패:", err);
    alert("권한 이전 처리 중 오류가 발생했습니다.");
  } finally {
    transferring.value = false;
  }
};

// 🔶 모달에서 “예, 이전하기” 버튼 클릭
const confirmTransfer = async () => {
  showConfirm.value = false;
  await onTransfer();
};

onMounted(async () => {
  if (!isOrgManager.value) return;
  await fetchManagerOptions();
});
</script>

<style scoped>
.at-page {
  padding: 24px;
}

.at-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
}

.at-no-auth {
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fafafa;
  text-align: center;
  font-size: 14px;
}

.at-toolbar {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.at-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.at-row-hint {
  font-size: 12px;
  color: #666;
}

.at-field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}

.at-field-grow {
  flex: 1;
}

.at-label {
  font-size: 12px;
  color: #555;
}

.at-select,
.at-input {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.at-inline {
  display: flex;
  gap: 6px;
}

.at-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

.at-btn-primary {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.at-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.at-panels {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.at-panel {
  flex: 1;
  min-width: 320px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}

.at-panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.at-panel-title {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.at-panel-sub {
  font-size: 12px;
  color: #777;
}

.at-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #ecf5ff;
  color: #409eff;
}

.at-tag-secondary {
  background: #f4f4ff;
  color: #6064ff;
}

.at-table-wrap {
  overflow-x: auto;
}

.at-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.at-table th,
.at-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
}

.at-table thead th {
  background: #fafafa;
}

.at-empty {
  text-align: center;
  padding: 12px 0;
  color: #777;
}

.at-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 🔶 모달 백그라운드 */
.at-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 🔶 모달 박스 */
.at-modal {
  width: 320px;
  background: #fff;
  border-radius: 10px;
  padding: 20px 22px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.at-modal-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.at-modal-text {
  font-size: 13px;
  color: #444;
  line-height: 1.5;
  margin-bottom: 18px;
  text-align: center;
}

.at-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
