<template>
  <div class="modal-overlay">
    <div class="modal-box">
      <h4 class="modal-title">담당자 선택</h4>

      <div class="manager-list">
        <label v-for="mgr in managers" :key="mgr.user_id" class="manager-row">
          <input
            type="radio"
            name="manager"
            :value="mgr.user_code"
            v-model="selected"
          />
          <span>{{ mgr.name }} ({{ mgr.user_id }})</span>
        </label>
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn-cancel" @click="$emit('close')">
          취소
        </button>

        <button
          class="modal-btn modal-btn-primary"
          :disabled="!selected"
          @click="confirmSelect"
        >
          선택 완료
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ManagerSelectModal',
  props: {
    managers: Array,
    pendingItem: Object,
  },
  data() {
    return {
      selected: '',
    };
  },
  methods: {
    confirmSelect() {
      this.$emit('select', this.selected);
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
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

.manager-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.manager-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
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

.modal-btn-primary {
  background: #2dce89;
  color: white;
}

.modal-btn-primary:hover {
  background: #25b577;
}

.modal-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #5fcf9f;
}
</style>
