<template>
  <!-- 공통 오버레이 -->
  <div class="modal-overlay">
    <div class="modal-box">
      <!-- ① 배정 확인 모달 -->
      <template v-if="confirmMode === 'confirm'">
        <h4 class="modal-title">담당자 배정 확인</h4>

        <p class="modal-text">
          <strong>{{
            pendingItem.childName
              ? pendingItem.childName
              : pendingItem.writerName
          }}</strong>
          님의 담당자를 배정하시겠습니까?

          <br />
        </p>

        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel" @click="$emit('close')">
            취소
          </button>

          <button class="modal-btn modal-btn-success" @click="$emit('confirm')">
            확인
          </button>
        </div>
      </template>

      <!-- ② 배정 완료 모달 -->
      <template v-else-if="confirmMode === 'done'">
        <h4 class="modal-title">배정 완료</h4>

        <p class="modal-text">
          <strong>{{
            pendingItem.childName
              ? pendingItem.childName
              : pendingItem.writerName
          }}</strong>
          님의 담당자가 배정이 완료되었습니다.
        </p>

        <div class="modal-actions">
          <button
            class="modal-btn modal-btn-success"
            @click="$emit('closeDone')"
          >
            확인
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmModal',
  props: {
    pendingItem: Object,
    selectedManager: String,
    confirmMode: {
      type: String,
      default: 'confirm', // "confirm" 또는 "done"
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.modal-box {
  width: 400px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.modal-title {
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 600;
}

.modal-text {
  font-size: 15px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  padding: 8px 18px;
  min-width: 90px;
  height: 36px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.modal-btn-cancel {
  background: #ffffff;
  border: 1px solid #dcdcdc;
  color: #495057;
}

.modal-btn-cancel:hover {
  background: #f3f3f3;
}

.modal-btn-success {
  background: #2dce89;
  color: white;
}

.modal-btn-success:hover {
  background: #25b577;
}

.modal-btn-primary {
  background: #5e72e4;
  color: white;
}

.modal-btn-primary:hover {
  background: #4c60c6;
}
</style>
