<template>
  <div class="child-container">
    <!-- 상단 영역 -->
    <div class="header-row">
      <h6 class="title">자녀 정보</h6>
      <material-button color="success" size="sm" @click="enterAddMode">
        자녀 추가
      </material-button>
    </div>

    <!-- 목록 모드 -->
    <div v-if="mode === 'list'">
      <!-- 자녀 없음 -->
      <div v-if="childList.length === 0" class="no-child-box">
        <p class="no-child-text">등록된 자녀가 없습니다.</p>
      </div>
      <!-- 자녀 있음 -->
      <div class="child-scroll-area">
        <div
          v-for="(child, index) in childList"
          :key="index"
          class="child-card"
        >
          <div class="child-title">
            <span class="child-index">{{ index + 1 }}번</span>
            <span class="child-name">{{ child.child_name }}</span>
          </div>

          <div class="child-field">
            <span class="label">주민등록번호</span>
            <span class="value">{{ child.ssn }}</span>
          </div>

          <div class="child-field">
            <span class="label">성별</span>
            <span class="value">{{ genderLabel(child.gender) }}</span>
          </div>

          <div class="child-field">
            <span class="label">장애유형</span>
            <span class="value">{{ child.disability_type }}</span>
          </div>

          <div class="btn-row">
            <material-button
              color="success"
              size="sm"
              @click="enterEditMode(child, index)"
            >
              수정
            </material-button>

            <material-button
              color="secondary"
              size="sm"
              @click="$emit('delete-child', childList[index].child_code)"
            >
              삭제
            </material-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 추가/수정 모드 -->
    <div v-if="mode === 'form'" class="form-card">
      <h6 class="form-title">
        {{ editIndex !== null ? '자녀 정보 수정' : '자녀 추가' }}
      </h6>

      <div class="input-row">
        <MaterialInput
          v-model="localChild.child_name"
          label="자녀 이름"
          class="w-100"
        />
      </div>

      <div class="input-row">
        <MaterialInput
          v-model="localChild.ssn"
          label="주민등록번호(숫자만 입력)"
          @input="formatSSN"
          class="w-100"
        />
      </div>

      <div class="input-row">
        <select v-model="localChild.gender" class="child-select w-100">
          <option value="">성별을 선택해주세요</option>
          <option value="AC1">남자</option>
          <option value="AC2">여자</option>
        </select>
      </div>

      <div class="input-row">
        <MaterialInput
          v-model="localChild.disability_type"
          label="장애유형"
          class="w-100"
        />
      </div>

      <div class="form-btn-row">
        <material-button color="success" size="sm" @click="saveChild">
          {{ editIndex !== null ? '수정 완료' : '추가하기' }}
        </material-button>

        <material-button color="secondary" size="sm" @click="cancelForm">
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
  name: 'UserChildInfo',
  components: { MaterialInput, MaterialButton },

  props: {
    childList: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      mode: 'list',
      editIndex: null,
      localChild: {
        child_code: this.childList.child_code,
        child_name: '',
        ssn: '',
        gender: '',
        disability_type: '',
      },
    };
  },
  methods: {
    enterAddMode() {
      this.mode = 'form';
      this.editIndex = null;
      this.localChild = {
        child_code: this.childList.child_code,
        child_name: '',
        ssn: '',
        gender: '',
        disability_type: '',
      };
    },

    enterEditMode(child, index) {
      this.mode = 'form';
      this.editIndex = index;
      this.localChild = {
        child_code: child.child_code,
        child_name: child.child_name,
        disability_type: child.disability_type,
        gender: child.gender,
        ssn: '',
      };
    },

    cancelForm() {
      this.mode = 'list';
      this.editIndex = null;
    },

    saveChild() {
      if (
        this.localChild.child_name == '' ||
        this.localChild.ssn == '' ||
        this.localChild.ssn.length < 14 ||
        this.localChild.disability_type == ''
      ) {
        alert('모든 항목을 입력해주세요');
        return;
      }
      if (this.editIndex !== null) {
        this.$emit('update-child', {
          ...this.localChild,
        });
      } else {
        this.$emit('add-child', this.localChild);
      }
      this.cancelForm();
    },

    genderLabel(code) {
      if (code === 'AC1') return '남자';
      if (code === 'AC2') return '여자';
      return '';
    },
    formatSSN() {
      let digits = this.localChild.ssn.replace(/[^0-9]/g, '');
      digits = digits.slice(0, 13);
      if (digits.length > 6) {
        this.localChild.ssn = digits.slice(0, 6) + '-' + digits.slice(6);
      } else {
        this.localChild.ssn = digits;
      }
    },
  },
};
</script>

<style scoped>
.child-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.child-scroll-area {
  max-height: 330px;
  overflow-y: auto;
  padding-right: 6px;
}

.child-card {
  position: relative;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.child-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 6px;
  background: #5e72e4;
}

.child-title {
  display: flex;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}

.child-field {
  margin-bottom: 6px;
}

.label {
  font-size: 14px;
  color: #8392ab;
  font-weight: 700;
  margin-right: 6px;
}

.value {
  font-size: 14px;
  color: #344767;
  font-weight: 500;
}

.btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* form */
.form-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.form-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 16px;
  color: #344767;
}

.input-row {
  margin-bottom: 14px;
}

.child-select {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ced4da;
  font-size: 14px;
  color: #344767;
}
.child-select:focus {
  border-color: #5e72e4;
  outline: none;
}

.form-btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.no-child-box {
  background: #f8f9fa;
  border: 1px solid #ced4da;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
}

.no-child-text {
  font-size: 16px;
  font-weight: 600;
  color: #6c757d;
  margin: auto;
}
</style>
