<template>
  <section class="p-6 max-w-6xl mx-auto pb-0">
    <div class="page-inner">
      <h3 class="fw-bold text-start text-dark mb-4">담당자 배정 목록</h3>

      <div class="apv-toolbar">
        <div class="apv-filters">
          <select v-model="stateInput" class="apv-select">
            <option value="">전체</option>
            <option value="미배정">미배정</option>
            <option value="배정완료">배정완료</option>
          </select>

          <input
            v-model.trim="searchChildInput"
            class="apv-input"
            placeholder="신청자명"
            @keyup.enter="searchList"
          />

          <input
            v-model.trim="searchManagerInput"
            class="apv-input"
            placeholder="담당자명"
            @keyup.enter="searchList"
          />
        </div>
        <button class="apv-btn apv-btn-outline" @click="searchList">
          조회
        </button>
      </div>

      <div class="table-card">
        <table class="nice-table">
          <thead>
            <tr>
              <th class="th-cell text-center w-14" style="width: 150px">No</th>
              <th class="th-cell">이름</th>
              <th class="th-cell">신청일</th>
              <th class="th-cell">담당자</th>
              <th class="th-cell text-center">단계</th>
              <th class="th-cell" style="width: 100px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in list" :key="item.id">
              <td class="td-cell text-center">
                {{ (currentPage - 1) * pageSize + index + 1 }}
              </td>
              <td class="td-cell text-center">
                {{ item.childName ? item.childName : item.writerName }}
              </td>
              <td class="td-cell text-center">{{ item.submitAt }}</td>
              <td class="td-cell text-center">{{ item.managerName }}</td>
              <td class="apv-actions-cell">
                {{ item.status }}
              </td>
              <td class="status-change-btns">
                <span
                  v-if="item.status === '배정완료'"
                  class="apv-disabled-text"
                >
                  배정완료
                </span>
                <div v-else>
                  <template v-for="key in allStatusKeys" :key="key">
                    <button
                      v-if="item.status !== key"
                      :class="[
                        'apv-btn',
                        'apv-btn-sm',
                        { 'apv-btn-success': key == '담당자배정' },
                      ]"
                      @click="changeStatus(item, key)"
                    >
                      {{ key == '미배정' ? '미배정' : key }}
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="filteredList.length === 0">
              <td colspan="6" class="text-center">
                조회된 대기자 목록이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="pagination-wrap">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="setPage(currentPage - 1)"
      >
        &lt;
      </button>

      <button
        v-for="page in pageNumbers"
        :key="page"
        :class="['page-btn', { active: page === currentPage }]"
        @click="setPage(page)"
      >
        {{ page }}
      </button>

      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="setPage(currentPage + 1)"
      >
        &gt;
      </button>
    </div>
  </section>

  <!-- 모달 -->
  <!-- 매니저 선택 -->
  <ManagersModal
    v-if="showManagerModal"
    :managers="managers"
    :pendingItem="pendingItem"
    @close="showManagerModal = false"
    @select="openConfirmModal"
  />

  <!-- 최종 확인 -->
  <ConfirmModal
    v-if="showConfirmModal"
    :pendingItem="pendingItem"
    :selectedManager="selectedManager"
    confirmMode="confirm"
    @close="showConfirmModal = false"
    @confirm="finalApproval"
  />

  <!-- 배정 완료 -->
  <ConfirmModal
    v-if="showDoneModal"
    :pendingItem="pendingItem"
    confirmMode="done"
    @closeDone="showDoneModal = false"
  />
</template>

<script>
import {
  getPendingList,
  searchManagers,
  changeStatus as changeStatusApi,
} from '../api/pending';
import ManagersModal from './Pending/ManagerSelectModal.vue';
import ConfirmModal from './Pending/ConfirmModal.vue';
import { checkAuth } from '@/utils/guard';

export default {
  name: 'PendingApproval',
  data() {
    return {
      // input 바인딩되는 값(데이터만 변경, computed에 영향 X)
      stateInput: '',
      searchChildInput: '',
      searchManagerInput: '',

      // 실제 검색 값 (fetchList에서만 변경)
      stateActive: '',
      searchChildActive: '',
      searchManagerActive: '',

      // 페이징
      pageSize: 10,
      currentPage: 1,

      listRaw: [],

      statusMap: {
        담당자배정: { label: '승인완료', class: 'apv-state-CA3' },
      },
      allStatusKeys: ['담당자배정'],

      // 모달 관련
      // -> 담당자 리스트
      // -> 최종 확인
      // -> 완료
      showManagerModal: false,
      showConfirmModal: false,
      showDoneModal: false,

      confirmMode: 'confirm',

      managers: [],
      selectedManager: '',
      pendingItem: null,
    };
  },
  components: {
    ManagersModal,
    ConfirmModal,
  },
  computed: {
    filteredList() {
      return this.listRaw.filter((item) => {
        // 검색 기능
        const searchStatus =
          !this.stateActive || item.status === this.stateActive;
        const searchChild =
          !this.searchChildActive ||
          (item.childName || item.writerName || '').includes(
            this.searchChildActive.trim()
          );
        const searchManager =
          !this.searchManagerActive ||
          (item.managerName || '').includes(this.searchManagerActive.trim());

        return searchStatus && searchChild && searchManager;
      });
    },

    // 총 페이지 수 계산 (필터링된 목록 기준)
    totalPages() {
      return Math.ceil(this.filteredList.length / this.pageSize);
    },

    // 현재 페이지에 표시할 목록 계산 (페이징 적용)
    list() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;

      return this.filteredList.slice(start, end);
    },

    // 페이지네이션 컴포넌트에 표시할 페이지 번호 배열
    pageNumbers() {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    },
  },
  methods: {
    // 조회
    async fetchList() {
      // input -> Active -> computed
      this.stateActive = this.stateInput;
      this.searchChildActive = this.searchChildInput;
      this.searchManagerActive = this.searchManagerInput;

      const data = JSON.parse(localStorage.getItem('user'));
      const result = await getPendingList(data.org_code);

      this.listRaw = result.map((item) => ({
        submit_code: item.submit_code,
        childName: item.child_name,
        writerName: item.writer_name,
        submitAt: item.submit_at?.split(' ')[0],
        managerName: item.manager_name,
        status: this.changeCode('load', item.status),
      }));
      // 검색 후 1페이지로 이동
      this.currentPage = 1;
    },

    // 검색
    searchList() {
      // input → Active로 복사
      this.stateActive = this.stateInput;
      this.searchChildActive = this.searchChildInput;
      this.searchManagerActive = this.searchManagerInput;

      // 검색할 때마다 다시 1페이지부터
      this.currentPage = 1;
    },

    // 상태값 코드 <-> 텍스트 변경 함수
    changeCode(type, code) {
      if (type == 'change') {
        const result = code == '미배정' ? 'CA1' : 'CA3';
        return result;
      }
      const result = code == 'CA1' ? '미배정' : '배정완료';
      return result;
    },

    // 상태값, 모달창
    async changeStatus(item) {
      // org_code 추출
      // -> 모달창 출력
      const data = JSON.parse(localStorage.getItem('user'));
      const managers = await searchManagers(data.org_code);
      this.managers = managers;
      this.pendingItem = item;

      this.selectedManager = '';
      this.showManagerModal = true;
    },

    // 컨펌 모달창 출력
    // -> 선택한 담당자를 다음 모달로 넘김
    openConfirmModal(managerName) {
      this.selectedManager = managerName;

      this.showManagerModal = false;
      this.confirmMode = 'confirm';
      this.showConfirmModal = true;
    },

    // 최종
    // -> 자식에게 받아온 담당자를 서버에 전송
    async finalApproval() {
      const res = {
        submit_code: this.pendingItem.submit_code,
        status: 'CA3',
        assi_by: this.selectedManager,
      };

      const result = await changeStatusApi(res);

      this.showConfirmModal = false;

      if (!result.ok) {
        alert('배정 실패');
        return;
      }

      this.confirmMode = 'done';
      this.showDoneModal = true;
      this.fetchList();
    },

    setPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
  },

  mounted() {
    const { allowed, redirect } = checkAuth(['AA3', 'AA4']);
    if (!allowed) return this.$router.push(redirect);

    this.fetchList();
  },
};
</script>

<style scoped>
.page-inner {
  max-width: 1600px;
  height: 670px;
  margin: 0 auto;
}
.apv-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕',
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.apv-title {
  display: none !important;
}

.apv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.apv-filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.apv-input,
.apv-select {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
}

.apv-btn,
.apv-btn-outline {
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.apv-btn-outline {
  background: #ffffff;
  border: 1px solid #dcdcdc;
  padding: 8px 15px;
  height: 38px;
  line-height: 20px;
  color: #495057;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.apv-table th {
  background-color: #f8f9fa;
  font-weight: 700;
  color: #344767;
}

/* 단계 셀 정렬 및 버튼 스타일 */
.apv-actions-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.apv-state {
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  white-space: nowrap;
}

.status-change-btns {
  text-align: center;
}

/* 버튼 오버라이드 */
.apv-btn-sm {
  padding: 3px 6px;
  font-size: 12px;
  line-height: 1.5;
}
.apv-btn-info {
  background-color: #17a2b8;
  color: white;
}
.apv-btn-success {
  height: 30px;
  background-color: #28a745;
  color: white;
}
.apv-btn-danger {
  background-color: #dc3545;
  color: white;
}

/* 상태 색상 클래스 정의 */
.apv-state-CA1 {
  /* 미검토 (빨간색 계열) */
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.apv-state-CA1 {
  /* 승인완료 (초록색 계열) */
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.apv-disabled-text {
  font-size: 12px;
  color: #999;
  padding: 3px 6px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f5f5f5;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
}

.page-btn {
  padding: 8px 12px;
  font-size: 14px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #e9ecef;
}

.page-btn.active {
  background-color: #5e72e4;
  color: white;
  border-color: #5e72e4;
  font-weight: 700;
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.table-card {
  border-radius: 0.9rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  margin-top: 0.5rem;
}

/* nice-table */
.nice-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

/* th */
.th-cell {
  padding: 0.7rem 0.9rem;
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

/* td */
.td-cell {
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 행 stripe + hover */
.table-row-item:nth-child(even) {
  background-color: #f9fafb;
}
.table-row-item:hover {
  background-color: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}
</style>
