<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <h6 class="modal-title">회원탈퇴 확인</h6>

      <p class="modal-desc">아이디와 비밀번호를 입력해 주세요.</p>

      <!-- 아이디 -->
      <MaterialInput
        v-model="form.user_id"
        label="아이디"
        class="w-100 mb-3"
        type="text"
      />

      <!-- 비밀번호 -->
      <MaterialInput
        v-model="form.password"
        label="비밀번호"
        class="w-100 mb-4"
        type="password"
      />

      <div class="d-flex justify-content-end gap-2 mt-3">
        <material-button color="secondary" size="sm" @click="$emit('close')">
          취소
        </material-button>

        <material-button
          color="success"
          variant="gradient"
          size="sm"
          @click="confirmDelete"
        >
          회원탈퇴
        </material-button>
      </div>
    </div>
  </div>
</template>

<script>
import MaterialInput from '@/components/MaterialInput.vue';
import MaterialButton from '@/components/MaterialButton.vue';

export default {
  name: 'DeleteUserModal',
  components: { MaterialInput, MaterialButton },

  data() {
    return {
      form: {
        user_id: '',
        password: '',
      },
    };
  },

  methods: {
    confirmDelete() {
      this.$emit('confirm', { ...this.form });
    },
  },
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-card {
  width: 360px;
  padding: 24px 26px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #344767;
}

.modal-desc {
  font-size: 13px;
  margin-bottom: 18px;
  color: #6c757d;
}
</style>
