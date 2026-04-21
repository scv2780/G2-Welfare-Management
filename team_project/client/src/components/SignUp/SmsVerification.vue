<template>
  <div>
    <!-- 연락처 -->
    <div class="d-flex gap-2">
      <material-input
        id="phone"
        type="text"
        label="연락처 ( - 없이 입력 )"
        v-model="localPhone"
        :disabled="localIsVerified"
        size="lg"
        class="mb-3"
        @input="validatePhone"
      />
      <material-button
        color="success"
        class="sms-btn"
        :disabled="localIsVerified"
        @click="sendCode"
      >
        인증번호 전송
      </material-button>
    </div>
    <!-- 안내 메시지 -->
    <p
      v-if="sendMessage"
      :style="{
        color: sendMessage == '인증번호 전송 완료' ? '#2ecc71' : '#e74c3c',
        fontSize: '0.8rem',
        marginTop: '-10px',
        marginLeft: '4px',
      }"
    >
      {{ sendMessage }}
    </p>

    <!-- 인증번호 -->
    <div class="d-flex gap-2 mb-3">
      <material-input
        label="인증번호 6자리"
        v-model="smsCode"
        :disabled="localIsVerified"
        size="lg"
      />
      <material-button
        color="success"
        class="sms-btn"
        :disabled="localIsVerified"
        @click="verifyCode"
      >
        인증 확인
      </material-button>
    </div>

    <!-- 안내 메시지 -->
    <p
      v-if="message"
      :style="{
        color: localIsVerified == true ? '#2ecc71' : '#e74c3c',
        fontSize: '0.8rem',
        marginTop: '-10px',
        marginLeft: '4px',
      }"
    >
      {{ message }}
    </p>
  </div>
</template>

<script>
import MaterialInput from '@/components/MaterialInput.vue';
import MaterialButton from '@/components/MaterialButton.vue';
import { sendSMS, verifySMS } from '../../api/user';

export default {
  name: 'SmsVerification',
  components: {
    MaterialInput,
    MaterialButton,
  },
  props: {
    phone: String,
    isVerified: Boolean,
  },

  emits: ['update:phone', 'update:isVerified'],

  data() {
    return {
      localPhone: '',
      localIsVerified: false,
      smsCode: '',
      sendMessage: '',
      message: '',
    };
  },

  watch: {
    localPhone(v) {
      this.$emit('update:phone', v);
    },
    localIsVerified(v) {
      this.$emit('update:isVerified', v);
    },
  },

  methods: {
    validatePhone() {
      // 하이픈 감지
      if (this.localPhone.includes('-')) {
        alert('- 없이 입력하세요.');
        this.localPhone = this.localPhone.replace(/-/g, '');
        return;
      }

      // 숫자만
      this.localPhone = this.localPhone.replace(/[^0-9]/g, '');

      // 11자리 제한
      if (this.localPhone.length > 11) {
        this.localPhone = this.localPhone.slice(0, 11);
      }
    },
    async sendCode() {
      if (!this.localPhone) {
        return;
      }
      const result = await sendSMS(this.localPhone.replace(/-/g, ''));
      this.sendMessage = result.ok ? '인증번호 전송 완료' : result.message;
    },

    async verifyCode() {
      if (!this.smsCode) {
        return;
      }
      const result = await verifySMS(
        this.localPhone.replace(/-/g, ''),
        this.smsCode
      );
      if (!result.ok) {
        this.message = result.message;
        return;
      }
      this.localIsVerified = true;
      this.message = '연락처 인증 완료';
    },
  },
};
</script>

<style scoped>
.sms-btn {
  height: 44px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  white-space: nowrap !important;
  padding: 0 18px !important;
  width: auto !important;
  line-height: 1 !important;
}
</style>
