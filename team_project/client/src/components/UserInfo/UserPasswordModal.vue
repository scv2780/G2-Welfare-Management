<template>
  <div class="pw-modal-overlay">
    <div class="pw-modal-box">
      <h5 class="pw-title">비밀번호 변경</h5>

      <!-- 현재 비밀번호 -->
      <div class="pw-input-block">
        <label class="pw-label">현재 비밀번호</label>
        <MaterialInput
          v-model="passwords.current"
          type="password"
          class="w-100"
        />
      </div>

      <!-- 새 비밀번호 -->
      <div class="pw-input-block">
        <label class="pw-label">새 비밀번호</label>
        <MaterialInput
          v-model="passwords.newPw"
          type="password"
          class="w-100"
        />
      </div>

      <!-- 새 비밀번호 확인 -->
      <div class="pw-input-block">
        <label class="pw-label">새 비밀번호 확인</label>
        <MaterialInput
          v-model="passwords.newPwCheck"
          type="password"
          class="w-100"
        />
      </div>

      <div class="pw-btn-area">
        <material-button color="success" size="sm" @click="confirmClick">
          변경
        </material-button>
        <material-button color="secondary" size="sm" @click="$emit('close')">
          취소
        </material-button>
      </div>
    </div>
  </div>
</template>

<script>
import MaterialInput from '@/components/MaterialInput.vue';
import MaterialButton from '@/components/MaterialButton.vue';

export default {
  name: 'UserPasswordModal',
  components: { MaterialInput, MaterialButton },
  data() {
    return {
      passwords: {
        current: '',
        newPw: '',
        newPwCheck: '',
      },
    };
  },
  methods: {
    confirmClick() {
      if (this.passwords.newPw.length > 15 || this.passwords.newPw.length < 9) {
        alert('비밀번호는 9자 이상 15자 이하로 입력해주세요.');
        return;
      }

      if (
        !this.passwords.current ||
        !this.passwords.newPw ||
        !this.passwords.newPwCheck
      ) {
        return alert('모든 항목을 입력해주세요');
      }
      if (this.passwords.newPw != this.passwords.newPwCheck) {
        return alert('비밀번호를 확인해주세요');
      }
      if (this.passwords.current == this.passwords.newPw) {
        return alert('같은 비밀번호는 사용하실 수 없습니다.');
      }
      const passwords = {
        user_pw: this.passwords.current,
        newPw: this.passwords.newPw,
      };
      this.$emit('confirm', passwords);
    },
  },
};
</script>

<style scoped>
/* 배경 오버레이 */
.pw-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.38);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2500;
}

/* 모달 */
.pw-modal-box {
  width: 360px;
  padding: 24px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

/* 제목 */
.pw-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 18px;
  color: #344767;
}

/* 입력 묶음 */
.pw-input-block {
  margin-bottom: 18px;
}

/* 라벨 */
.pw-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #8392ab;
  display: block;
  margin-bottom: 6px;
}

/* 버튼 영역 */
.pw-btn-area {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
</style>
