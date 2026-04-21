<template>
  <div class="card dashboard-table-card">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0">{{ title }}</h6>
        <i v-if="icon" class="material-icons text-muted small">{{ icon }}</i>
      </div>

      <!-- 데이터 없을 때 -->
      <div v-if="displayedRows.length === 0" class="empty-text flex-fill">
        {{ emptyMessage }}
      </div>

      <!-- 데이터 있을 때 -->
      <div v-else class="table-responsive flex-fill">
        <table class="table mb-0 align-middle dashboard-table">
          <thead>
            <tr>
              <th
                v-for="col in columns"
                :key="col.field"
                :class="[
                  'py-2 small text-secondary fw-semibold',
                  alignClass(col.align),
                ]"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in displayedRows"
              :key="idx"
              class="clickable-row"
              @click="onRowClick(row, idx)"
            >
              <td
                v-for="col in columns"
                :key="col.field"
                :class="['py-2 small', alignClass(col.align)]"
              >
                {{ row[col.field] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DashboardTableCard",
  props: {
    title: String,
    icon: String,
    color: {
      type: String,
      default: "primary",
    },
    columns: {
      type: Array,
      default: () => [],
    },
    rows: {
      type: Array,
      default: () => [],
    },
    maxRows: {
      type: Number,
      default: 0, // 0이면 제한 없음
    },
    // ✅ 로그인한 사용자 권한 코드 (AA0~AA4)
    userRole: {
      type: String,
      default: null,
    },
    // ✅ 카드마다 빈 문구를 직접 넣고 싶을 때 사용 (이벤트용 등)
    emptyMessageOverride: {
      type: String,
      default: null,
    },
  },
  computed: {
    displayedRows() {
      if (!Array.isArray(this.rows)) return [];
      if (this.maxRows && this.maxRows > 0) {
        return this.rows.slice(0, this.maxRows);
      }
      return this.rows;
    },
    // ✅ 권한 / override 에 따른 빈 데이터 메시지
    emptyMessage() {
      // 1) 우선순위: 부모에서 직접 넣어준 문구가 있으면 그걸 사용
      if (this.emptyMessageOverride) {
        return this.emptyMessageOverride;
      }

      // 2) 없으면 신청현황용 권한별 문구
      switch (this.userRole) {
        case "AA0":
        case null:
          return "로그인 해주세요.";
        case "AA1":
          return "조사지 작성하여 신청해주세요.";
        case "AA2":
          return "배정받은 지원자가 없습니다.";
        case "AA3":
        case "AA4":
          return "신청된 지원자가 없습니다.";
        default:
          return "데이터가 없습니다.";
      }
    },
  },
  methods: {
    alignClass(align) {
      if (align === "right") return "text-end";
      if (align === "center") return "text-center";
      return "text-start";
    },
    onRowClick(row, idx) {
      this.$emit("row-click", { row, index: idx });
    },
  },
};
</script>

<style scoped>
.dashboard-table-card {
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
  border: none;
  display: flex;
  flex-direction: column;
}

/* card-body도 세로로 늘어나게 */
.card-body {
  display: flex;
  flex-direction: column;
}

/* 테이블 영역이 남는 높이를 채우도록 */
.table-responsive {
  flex: 1; /* 높이만 채우고, 가로는 기본(block)으로 */
}

/* 데이터 없을 때 메시지도 가운데쯤 오게 */
.empty-text {
  font-size: 0.875rem;
  color: #9ca3af;
  text-align: center;
  margin-top: 20px;
}

/* 🔹 큰 화면(2열 레이아웃)에서만 일정 높이 유지 */
@media (min-width: 768px) {
  .dashboard-table-card {
    min-height: 260px;
  }
}

/* 테이블 기본 스타일 */
.dashboard-table {
  width: 100%;
  table-layout: fixed; /* 열 폭 균등 분배 */
}

/* 셀 텍스트 중앙정렬 + 너무 길면 ... 처리 */
.dashboard-table th,
.dashboard-table td {
  white-space: nowrap;
  text-align: center !important;
  overflow: hidden; /* 셀 밖으로 못 나가게 */
  text-overflow: ellipsis; /* 길면 ... */
}

/* 행 클릭 가능 시 */
.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background-color: #f9fafb;
}
</style>
