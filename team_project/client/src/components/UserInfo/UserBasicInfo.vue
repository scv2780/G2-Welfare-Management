<template>
  <div>
    <!-- 읽기 모드 -->
    <div v-if="!editMode">
      <div v-for="item in fields" :key="item.key" class="view-block">
        <div class="view-header">
          <span class="view-label">{{ item.label }}</span>
        </div>
        <p class="view-value">{{ userData[item.key] }}</p>
      </div>

      <div class="text-end mt-4" style="cursor: pointer">
        <material-button color="success" size="sm" @click="$emit('edit')">
          회원정보 수정
        </material-button>
      </div>
    </div>

    <!-- 수정 모드 -->
    <div v-else>
      <div v-for="item in fields" :key="item.key" class="edit-block">
        <div class="edit-header">
          <span class="edit-label">{{ item.label }}</span>
        </div>

        <p v-if="item.key === 'user_id'" class="edit-static">
          {{ localUser[item.key] }}
        </p>

        <div v-else class="edit-input-box">
          <MaterialInput
            v-model="localUser[item.key]"
            class="w-100"
            :type="item.key === 'phone' ? 'tel' : 'text'"
            @input="item.key === 'phone' ? formatPhone() : null"
          />
        </div>
      </div>

      <div class="text-end mt-4 d-flex justify-content-end gap-2">
        <material-button
          color="success"
          size="sm"
          @click="$emit('save', localUser)"
        >
          저장
        </material-button>

        <material-button color="secondary" size="sm" @click="$emit('cancel')">
          취소
        </material-button>
      </div>

      <!-- 비밀번호 변경, 회원탈퇴 -->
      <div
        v-if="editMode"
        class="d-flex justify-content-between align-items-center mt-2"
      >
        <!-- 회원탈퇴 -->
        <material-button color="secondary" size="sm" @click="deleteModal">
          회원탈퇴
        </material-button>

        <!-- 비밀번호 변경 -->
        <material-button
          color="secondary"
          size="sm"
          class="pw-change-btn"
          @click="$emit('openPwModal')"
        >
          비밀번호 변경
        </material-button>
      </div>
    </div>
  </div>
</template>

<script>
import MaterialInput from '@/components/MaterialInput.vue';
import MaterialButton from '@/components/MaterialButton.vue';

export default {
  name: 'UserBasicInfo',

  components: { MaterialInput, MaterialButton },

  props: {
    editMode: Boolean,
    userData: Object,
  },

  data() {
    return {
      localUser: {},
      fields: [
        { key: 'user_id', label: '아이디' },
        { key: 'name', label: '이름' },
        { key: 'phone', label: '전화번호' },
        { key: 'address', label: '주소' },
        { key: 'email', label: '이메일' },
      ],
    };
  },

  watch: {
    userData: {
      immediate: true,
      handler(val) {
        this.localUser = { ...val };
      },
    },
  },
  methods: {
    formatPhone() {
      let phone = this.localUser.phone;
      if (!phone) return;

      // 1. 숫자만 남기기 (하이픈 등 비숫자 문자 제거)
      const cleaned = phone.replace(/[^0-9]/g, '');
      let formatted = '';

      // 2. 길이에 따라 하이픈 포맷 적용
      if (cleaned.length < 4) {
        formatted = cleaned;
      } else if (cleaned.length < 7) {
        // 010-123
        formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
      } else if (cleaned.length < 11) {
        // 010-1234-567 (10자리)
        formatted =
          cleaned.slice(0, 3) +
          '-' +
          cleaned.slice(3, 7) +
          '-' +
          cleaned.slice(7);
      } else {
        // 010-1234-5678 (11자리, 최대)
        formatted =
          cleaned.slice(0, 3) +
          '-' +
          cleaned.slice(3, 7) +
          '-' +
          cleaned.slice(7, 11);
      }

      // 3. localUser.phone에 포맷된 값 반영
      this.localUser.phone = formatted;
    },

    deleteModal() {
      this.$emit('openDeleteModal');
    },
  },
};
</script>

<style scoped>
.view-block {
  position: relative;
  margin-bottom: 16px;
  padding: 12px 16px 14px 18px;
  border-radius: 12px;
  background: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.view-block::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 6px;
  background: #5e72e4;
}

.view-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.view-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8392ab;
}

.view-value {
  margin: 0;
  color: #344767;
  font-size: 14px;
  font-weight: 500;
}

/* 수정 모드 */
.edit-block {
  position: relative;
  margin-bottom: 18px;
  padding: 16px 18px 20px 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.edit-block::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 6px;
  background: #5e72e4;
}

.edit-label {
  font-size: 11px;
  font-weight: 700;
  color: #8392ab;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.edit-static {
  margin: 0;
  font-size: 14px;
  color: #6c757d;
}

.edit-input-box {
  margin-top: 4px;
}
</style>
