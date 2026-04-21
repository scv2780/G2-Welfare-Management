<!-- src/views/organization.vue -->
<template>
  <div class="org-page">
    <!-- 상단 툴바 -->
    <div class="org-toolbar">
      <div class="org-filters">
        <select v-model="searchType" class="org-select">
          <option value="name">기관명</option>
          <option value="code">기관번호</option>
          <option value="address">주소</option>
          <option value="phone">연락처</option>
        </select>

        <input
          v-model.trim="keyword"
          class="org-input"
          type="text"
          placeholder="검색어를 입력하세요"
          @keyup.enter="onSearch"
        />

        <select v-model="sortType" class="org-select">
          <option value="recent">최근 등록순</option>
          <option value="nameAsc">이름(가나다)</option>
          <option value="startDesc">시작일 최신</option>
          <option value="endDesc">종료일 최신</option>
        </select>

        <select v-model="statusType" class="org-select">
          <option value="ALL">전체</option>
          <option value="AB1">운영중</option>
          <option value="AB2">임시중단</option>
          <option value="AB3">종료</option>
        </select>
      </div>

      <MaterialButton color="dark" size="sm" @click="openAdd"
        >추가</MaterialButton
      >
    </div>

    <!-- 목록 -->
    <div v-if="paged.length === 0" class="org-empty">데이터가 없습니다.</div>
    <ul v-else class="org-list">
      <li v-for="org in paged" :key="org.id" class="org-item">
        <div class="org-main">
          <div class="org-title">
            <strong class="org-code">{{ org.code }}</strong>
            <span class="org-sep">|</span>
            <strong>{{ org.name }}</strong>
            <span class="org-badge" :class="getStatusMeta(org.status).class">
              {{ getStatusMeta(org.status).label }}
            </span>
          </div>
          <div class="org-sub">
            {{ org.address }} · {{ org.phone }} ·
            {{ fmtDate(org.startDate) }} 시작 ·
            {{ org.endDate ? fmtDate(org.endDate) : "-" }} 종료
          </div>
        </div>

        <div class="org-actions">
          <MaterialButton color="dark" size="sm" @click.stop="openEdit(org)">
            수정
          </MaterialButton>
          <MaterialButton color="dark" size="sm" @click="remove(org)">
            삭제
          </MaterialButton>
        </div>
      </li>
    </ul>

    <!-- 수정 모달 -->
    <teleport to="body">
      <div
        v-if="isModalOpen"
        class="org-modal-backdrop"
        @click.self="closeModal"
      >
        <div class="org-modal" @click.stop>
          <h3 class="org-modal-title">기관 정보 수정</h3>

          <div class="org-form-grid">
            <label>기관명</label>
            <input
              class="org-input"
              v-model.trim="form.name"
              placeholder="기관명"
            />

            <label>주소</label>
            <div style="display: flex; gap: 6px">
              <input
                class="org-input"
                v-model="form.address"
                placeholder="주소"
                style="flex: 1"
              />
              <MaterialButton
                color="dark"
                size="sm"
                @click="openPostcode('edit')"
              >
                찾기
              </MaterialButton>
            </div>

            <label>연락처</label>
            <input
              class="org-input"
              v-model="form.phone"
              placeholder="연락처"
              @input="onEditPhoneInput"
            />

            <label>시작일자</label>
            <input class="org-input" type="date" v-model="form.startDate" />

            <label>종료일자</label>
            <input class="org-input" type="date" v-model="form.endDate" />

            <label>운영여부</label>
            <select class="org-select" v-model="form.status">
              <option value="AB1">운영중</option>
              <option value="AB2">임시중단</option>
              <option value="AB3">종료</option>
            </select>
          </div>

          <div class="org-modal-actions">
            <MaterialButton color="dark" size="sm" @click="closeModal"
              >취소</MaterialButton
            >
            <MaterialButton color="dark" size="sm" @click="onModalSave">
              저장
            </MaterialButton>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 추가 모달 -->
    <teleport to="body">
      <div v-if="isAddOpen" class="org-modal-backdrop" @click.self="closeAdd">
        <div class="org-modal" @click.stop>
          <h3 class="org-modal-title">기관 추가</h3>

          <div class="org-form-grid">
            <label>기관명</label>
            <input
              class="org-input"
              v-model.trim="addForm.name"
              placeholder="기관명"
            />

            <label>주소</label>
            <div style="display: flex; gap: 6px">
              <input
                class="org-input"
                v-model="addForm.address"
                placeholder="주소"
                style="flex: 1"
              />
              <MaterialButton
                color="dark"
                size="sm"
                @click="openPostcode('add')"
              >
                찾기
              </MaterialButton>
            </div>

            <label>연락처</label>
            <input
              class="org-input"
              v-model="addForm.phone"
              placeholder="연락처"
              @input="onAddPhoneInput"
            />

            <label>시작일자</label>
            <input class="org-input" type="date" v-model="addForm.startDate" />

            <label>종료일자</label>
            <input class="org-input" type="date" v-model="addForm.endDate" />

            <label>운영여부</label>
            <select class="org-select" v-model="addForm.status">
              <option value="AB1">운영중</option>
              <option value="AB2">임시중단</option>
              <option value="AB3">종료</option>
            </select>
          </div>

          <div class="org-modal-actions">
            <MaterialButton color="dark" size="sm" @click="closeAdd"
              >취소</MaterialButton
            >
            <MaterialButton color="dark" size="sm" @click="onAddSave">
              추가
            </MaterialButton>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { useAuthStore } from "../store/authLogin"; // 권한 체크용
import { useRouter } from "vue-router";
import MaterialButton from "../components/MaterialButton.vue";

// ★ 권한 체크
const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  auth.reload(); // 새로고침 대비

  if (auth.role !== "AA4") {
    alert("접근 권한이 없습니다.");
    router.push("/"); // 홈이나 대시보드 등 적절한 곳
  }
});

// DB/서버에서 온 어떤 날짜든 input[type=date]에 맞게 'YYYY-MM-DD'로 변환
function toDateInput(val) {
  if (!val) return "";
  if (typeof val === "string") {
    const s = val.replace(/\./g, "-");
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  }
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ===== 상태 ===== */
const searchType = ref("name");
const keyword = ref("");
const sortType = ref("recent");
const statusType = ref("ALL");
const list = ref([]);

/* 상태 메타 정보 */
const STATUS_META = {
  AB1: { label: "운영중", class: "org-badge-green" },
  AB2: { label: "임시중단", class: "org-badge-gray" }, // 새로 하나 만들자
  AB3: { label: "종료", class: "org-badge-red" },
};

function getStatusMeta(code) {
  return STATUS_META[code] || { label: "-", class: "org-badge-gray" };
}

/* 모달 상태 */
const isModalOpen = ref(false);
const form = ref({
  code: "",
  name: "",
  address: "",
  phone: "",
  startDate: "",
  endDate: "",
  status: "AB1",
});

let editingCode = "";

function openPostcode(target) {
  // 혹시 스크립트 안 불려왔을 때 방어 코드
  if (!window.daum || !window.daum.Postcode) {
    alert("주소 검색 서비스를 불러오지 못했습니다.");
    return;
  }

  new window.daum.Postcode({
    oncomplete: (data) => {
      const fullAddress = data.address; // 기본 주소
      // const zonecode = data.zonecode; // 필요하면 사용

      if (target === "add") {
        addForm.value.address = fullAddress;
      } else if (target === "edit") {
        form.value.address = fullAddress;
      }
    },
  }).open();
}

// ★ 프론트용 전화번호 포맷 (입력창에 보여줄 용도)
function formatPhoneForView(raw) {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, ""); // 숫자만 남기기
  if (!digits) return "";

  // 1) 02로 시작하는 경우 (서울)
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits; // "02"
    if (digits.length <= 5)
      // 02-XXX
      return digits.replace(/(\d{2})(\d{0,3})/, "$1-$2");
    if (digits.length <= 9)
      // 02-XXX-XXXX
      return digits.replace(/(\d{2})(\d{3})(\d{0,4})/, "$1-$2-$3");
    // 그 이상은 잘려서 들어왔다고 보고
    return digits.slice(0, 10).replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  // 2) 그 외 (010, 053, 031 등)
  if (digits.length <= 3) return digits; // 010, 053 ...
  if (digits.length <= 7)
    // 000-XXXX
    return digits.replace(/(\d{3})(\d{0,4})/, "$1-$2");
  if (digits.length <= 11)
    // 000-XXXX-XXXX 또는 000-XXX-XXXX
    return digits.replace(/(\d{3})(\d{3,4})(\d{0,4})/, "$1-$2-$3");

  // 너무 길면 잘라서
  const cut = digits.slice(0, 11);
  return cut.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
}

// ★ 수정 모달: 전화번호 입력 이벤트 핸들러
function onEditPhoneInput(e) {
  form.value.phone = formatPhoneForView(e.target.value);
}

// ★ 추가 모달: 전화번호 입력 이벤트 핸들러
function onAddPhoneInput(e) {
  addForm.value.phone = formatPhoneForView(e.target.value);
}

/* ===== 유틸 ===== */
function fmtDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ===== 데이터 로드 ===== */
async function load() {
  const res = await axios.get("/api/organization");
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];
  list.value = rows.map((r) => ({
    id: r.org_code,
    code: r.org_code,
    name: r.org_name,
    address: r.address,
    phone: r.org_phone,
    startDate: toDateInput(r.start_date),
    endDate: toDateInput(r.end_date),
    status: r.status,
  }));
}

/* ===== 수정 모달 ===== */
function openEdit(org) {
  editingCode = org.code;
  form.value = {
    code: org.code,
    name: org.name ?? "",
    address: org.address ?? "",
    phone: org.phone ?? "",
    startDate: org.startDate ?? "",
    endDate: org.endDate ?? "",
    status: org.status ?? "RUNNING",
  };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}

// 저장(업데이트) 시 날짜 포함해서 전달
async function onModalSave() {
  if (!form.value.name.trim()) return alert("기관명을 입력하세요.");
  if (!["AB1", "AB2", "AB3"].includes(form.value.status))
    return alert("운영여부가 올바르지 않습니다.");

  const payload = {
    org_name: form.value.name,
    address: form.value.address,
    org_phone: form.value.phone,
    start_date: form.value.startDate || null,
    end_date: form.value.endDate || null,
    status: form.value.status,
  };

  await axios.put(
    `/api/organization/${encodeURIComponent(editingCode)}`,
    payload
  );

  const i = list.value.findIndex((x) => x.code === editingCode);
  if (i !== -1) {
    list.value[i] = {
      ...list.value[i],
      name: form.value.name,
      address: form.value.address,
      phone: form.value.phone,
      startDate: form.value.startDate || null,
      endDate: form.value.endDate || null,
      status: form.value.status,
    };
  }
  closeModal();
}

// 삭제
async function remove(org) {
  if (!confirm(`[${org.code}] ${org.name} 을(를) 삭제할까요?`)) return;
  await axios.delete(`/api/organization/${encodeURIComponent(org.code)}`);
  list.value = list.value.filter((x) => x.code !== org.code);
}

/* 추가 모달 상태 */
const isAddOpen = ref(false);
const addForm = ref({
  name: "",
  address: "",
  phone: "",
  startDate: "",
  endDate: "",
  status: "AB1",
});

function openAdd() {
  addForm.value = {
    name: "",
    address: "",
    phone: "",
    startDate: "",
    endDate: "",
    status: "AB1",
  };
  isAddOpen.value = true;
}
function closeAdd() {
  isAddOpen.value = false;
}

// 추가 저장
async function onAddSave() {
  if (!addForm.value.name.trim()) return alert("기관명을 입력하세요.");
  if (!["AB1", "AB2", "AB3"].includes(addForm.value.status))
    return alert("운영여부가 올바르지 않습니다.");

  const payload = {
    org_name: addForm.value.name,
    address: addForm.value.address,
    org_phone: addForm.value.phone,
    start_date: addForm.value.startDate || null,
    end_date: addForm.value.endDate || null,
    status: addForm.value.status,
  };

  await axios.post("/api/organization", payload);
  await load();
  closeAdd();
}

/* 더미 핸들러 */
function onSearch() {}

/* ===== 필터/정렬 ===== */
const filtered = computed(() => {
  let data = [...list.value];

  if (statusType.value !== "ALL") {
    data = data.filter((d) => d.status === statusType.value);
  }

  const kw = keyword.value.trim().toLowerCase();
  if (kw) {
    data = data.filter((d) => {
      const map = {
        name: d.name ?? "",
        code: d.code ?? "",
        address: d.address ?? "",
        phone: d.phone ?? "",
      };
      return String(map[searchType.value] || "")
        .toLowerCase()
        .includes(kw);
    });
  }

  switch (sortType.value) {
    case "nameAsc":
      data.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ko"));
      break;
    case "startDesc":
      data.sort(
        (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)
      );
      break;
    case "endDesc":
      data.sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0));
      break;
  }

  return data;
});

const paged = computed(() => filtered.value);

/* 모달 열릴 때 스크롤 잠금 */
watch(isModalOpen, (v) => {
  document.documentElement.style.overflow = v ? "hidden" : "";
});
watch(isAddOpen, (v) => {
  // 추가 모달도 잠금
  document.documentElement.style.overflow = v ? "hidden" : "";
});

onMounted(load);
</script>

<style scoped>
* {
  font-size: 15px;
}

.org-page {
  max-width: 1600px;
  margin: 24px auto 40px;
  padding: 0 16px;
}

/* 상단 툴바 */
.org-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.org-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.org-input,
.org-select {
  min-width: 170px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #d7dce5;
  font-size: 13px;
  background: #ffffff;
  outline: none;
}

.org-input:focus,
.org-select:focus {
  border-color: #7ea6f6;
  box-shadow: 0 0 0 1px rgba(126, 166, 246, 0.2);
}

/* 버튼 공통 */
.org-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid #d2d6e0;
  background: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition: 0.12s ease-in-out;
  white-space: nowrap;
}

.org-btn:hover {
  filter: brightness(0.98);
}

.org-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 작은 버튼 */
.org-btn-xs {
  padding: 4px 9px;
  font-size: 11px;
}

/* 버튼 색상 */
.org-btn-primary {
  background: #7ea6f6;
  border-color: #7ea6f6;
  color: #ffffff;
}

.org-btn-primary:hover {
  filter: brightness(0.96);
}

.org-btn-danger {
  background: #f76c6c;
  border-color: #f76c6c;
  color: #ffffff;
}

/* 목록 영역 */
.org-empty {
  text-align: center;
  color: #6b7280;
  padding: 28px 0;
  font-size: 13px;
}

.org-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.org-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e2e7f0;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
}

.org-main {
  flex: 1;
  min-width: 0;
}

.org-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

.org-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

.org-sep {
  opacity: 0.35;
}

.org-sub {
  margin-top: 5px;
  font-size: 12px;
  color: #6b7280;
}

/* 상태 뱃지 */
.org-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid transparent;
}

.org-badge-green {
  background-color: #deeec8 !important;
  color: #3f7a3a !important;
  border: 1px solid #bedca0 !important;
}

.org-badge-gray {
  background-color: #e4e6e1 !important;
  color: #4b5563 !important;
  border: 1px solid #d0d3cd !important;
}

.org-badge-red {
  background-color: #fab39f !important;
  color: #8a2e2e !important;
  border: 1px solid #e28f7f !important;
}

/* 우측 버튼 영역 */
.org-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  justify-content: center;
}

/* 모달 */
.org-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  z-index: 9999;
}

.org-modal {
  width: min(640px, 92vw);
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 18px 16px;
  border: 1px solid #e2e7f0;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.35);
}

.org-modal-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

/* 폼 그리드 */
.org-form-grid {
  margin-top: 6px;
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px 14px;
  align-items: center;
}

.org-form-grid label {
  font-size: 13px;
  color: #4b5563;
}

/* 모달 버튼 영역 */
.org-modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
