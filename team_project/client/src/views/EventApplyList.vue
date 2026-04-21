<template>
  <section class="apply-page">
    <h2 class="page-title">이벤트 신청 내역</h2>

    <div class="table-wrap">
      <table class="apply-table">
        <thead>
          <tr>
            <th>신청코드</th>
            <th>이벤트명</th>
            <th>세부 이벤트명</th>
            <th>신청일정</th>
            <th>신청인원 / 마감인원</th>
            <th>신청상태</th>
            <th>취소</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(apply, idx) in applies"
            :key="apply.apply_code || idx"
            class="click-row"
            @click="goMyApplyInfo(apply.apply_code, apply.event_code)"
          >
            <td class="text-center">{{ apply.apply_code }}</td>

            <!-- 왼쪽 정렬 -->
            <td class="text-left">{{ apply.event_name }}</td>
            <td class="text-left">{{ apply.sub_event_name || "-" }}</td>

            <!-- 중앙 정렬 -->
            <td class="text-center">{{ apply.apply_period }}</td>

            <!-- 중앙 정렬 -->
            <td class="text-center">
              {{ apply.current_count }} / {{ apply.max_count }}
            </td>

            <!-- 중앙 정렬 -->
            <td class="text-center">{{ apply.apply_status_name }}</td>

            <!-- 중앙 정렬 + 클릭 방지 -->
            <td class="text-center">
              <button
                class="cancel-btn"
                @click.stop="handleCancel(apply.apply_code)"
              >
                취소
              </button>
            </td>
          </tr>

          <tr v-if="!applies.length">
            <td colspan="7" class="empty-row">신청한 이벤트가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();

const applies = ref([]);
const user_code = JSON.parse(localStorage.getItem("user") || "{}").user_code;

// 신청 내역 조회
const fetchApplies = async () => {
  try {
    const res = await axios.get(`/api/event/applyList?user_code=${user_code}`);
    if (res.data.status === "success") {
      applies.value = res.data.data || [];
    }
  } catch (err) {
    console.error("이벤트 신청 내역 조회 실패:", err);
  }
};

// 취소 처리
const handleCancel = async (apply_code) => {
  if (!confirm("정말로 신청을 취소하시겠습니까?")) return;

  try {
    const res = await axios.delete(`/api/event/apply/${apply_code}`);
    if (res.data.status === "success") {
      await fetchApplies();
      alert("신청이 취소되었습니다.");
    }
  } catch (err) {
    console.error("신청 취소 실패:", err);
    alert("신청 취소 중 오류가 발생했습니다.");
  }
};

const goMyApplyInfo = (apply_code, event_code) => {
  router.push({
    name: "EventMyApplyInfo",
    params: { applyCode: apply_code, eventCode: event_code },
  });
};

onMounted(fetchApplies);
</script>

<style scoped>
/* 전체 페이지 설정 */
.apply-page {
  margin: 24px auto;
  padding: 0 16px 40px;
  width: 1600px; /* 🔥 폭 고정 */
}

/* 제목 */
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* 테이블 래퍼 */
.table-wrap {
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  border: 1px solid #e2e7eb;
}

/* 테이블 */
.apply-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px; /* 🔥 폰트 15px */
}

.apply-table th,
.apply-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #edf2f7;
  text-align: center;
}

.apply-table th {
  background: #f5f7fb;
  font-weight: 600;
  color: #4a5568;
  white-space: nowrap;
}

/* 정렬 규칙 */
.text-left {
  text-align: left !important;
}
.text-right {
  text-align: right !important;
}
.text-center {
  text-align: center !important;
}

/* hover 효과 */
.click-row {
  cursor: pointer;
}
.click-row:hover {
  background-color: #f9fbff;
}

/* 빈 값 표시 */
.empty-row {
  text-align: center;
  padding: 18px 0;
  color: #6b7280;
}

/* 취소 버튼 */
.cancel-btn {
  background: #c53030;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: 0.15s;
}

.cancel-btn:hover {
  background: #9b2c2c;
}
</style>
