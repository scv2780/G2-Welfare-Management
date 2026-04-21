<template>
  <div>
    <!-- <h5 class="font-weight-bolder mb-4">개인 회원 상세 정보</h5> -->

    <!-- 이름 -->
    <material-input
      id="name"
      type="text"
      label="이름"
      v-model="name"
      size="lg"
      class="mb-3"
    />

    <!-- 주민등록번호 (앞자리 + 뒷자리) -->
    <div class="d-flex align-items-end gap-2 mb-3">
      <material-input
        id="reg1"
        type="text"
        label="주민등록번호 앞자리"
        v-model="regFront"
        @input="regFront = regFront.replace(/[^0-9]/g, '').slice(0, 6)"
        size="lg"
        class="flex-grow-1"
      />
      <material-input
        id="reg2"
        type="password"
        label="주민등록번호 뒷자리"
        v-model="regBack"
        @input="regBack = regBack.replace(/[^0-9]/g, '').slice(0, 7)"
        size="lg"
        class="flex-grow-1"
      />
    </div>

    <!-- 연락처 -->
    <sms-verification
      v-model:phone="phone"
      v-model:isVerified="isPhoneVerified"
    />

    <!-- 이메일 -->
    <div class="d-flex align-items-end gap-2 mb-3">
      <material-input
        id="email"
        type="email"
        label="이메일"
        v-model="email"
        size="lg"
        class="flex-grow-1"
      />
    </div>

    <!-- 주소 -->
    <div class="d-flex align-items-end gap-2 mb-3">
      <material-input
        id="address"
        type="text"
        label="주소"
        v-model="address"
        size="lg"
        class="flex-grow-1"
      />
      <material-button
        variant="gradient"
        color="success"
        size="md"
        type="button"
        class="address-btn"
        @click="searchAddress"
      >
        주소검색
      </material-button>
    </div>

    <!-- 기관명 (select box) -->
    <div class="input-group input-group-outline my-3">
      <label class="form-label"></label>
      <select v-model="org_name" class="form-control">
        <option disabled value="">소속 기관(선택사항입니다.)</option>
        <option
          v-for="org in orgList"
          :key="org.org_name"
          :value="org.org_name"
        >
          {{ org.org_name }}
        </option>
      </select>
    </div>

    <!-- 하단 버튼 -->
    <div class="d-flex justify-content-between mt-4">
      <material-button type="button" @click="$emit('back')"
        >뒤로</material-button
      >
      <material-button type="button" color="success" @click="submitForm">
        회원가입 완료
      </material-button>
    </div>
  </div>
</template>

<script>
import MaterialInput from '@/components/MaterialInput.vue';
import MaterialButton from '@/components/MaterialButton.vue';
import SmsVerification from '../../components/SignUp/SmsVerification.vue';
import { findAllOrg } from '../../api/user';

export default {
  name: 'SignUpUserForm',
  components: {
    MaterialInput,
    MaterialButton,
    SmsVerification,
  },
  props: { base: Object },
  data() {
    return {
      // name: 'test12',
      // regFront: '111111',
      // regBack: '2222222',
      // phone: '010-1111-2222',
      // isPhoneVerified: true,
      // address: '123',
      // email: '123',
      // org_name: '',
      // orgList: [],
      // role: 'AA1',
      name: '',
      regFront: '',
      regBack: '',
      phone: '',
      isPhoneVerified: false,
      address: '',
      email: '',
      org_name: '',
      orgList: [],
      role: 'AA1',
    };
  },
  methods: {
    searchAddress() {
      new window.daum.Postcode({
        oncomplete: (data) => {
          let addr = data.address;
          if (data.buildingName != '') {
            addr += `(${data.buildingName})`;
          }
          this.address = addr;
        },
      }).open();
    },
    submitForm() {
      if (
        !this.name ||
        !this.regFront ||
        !this.regBack ||
        !this.phone ||
        !this.address ||
        !this.email
      ) {
        return alert('필수 정보들을 입력해주세요.');
      }

      if (!this.isPhoneVerified) {
        return alert('연락처를 확인해주세요.');
      }

      let formattedPhone = '';
      if (this.phone.length === 10) {
        formattedPhone = `${this.phone.slice(0, 3)}-${this.phone.slice(
          3,
          6
        )}-${this.phone.slice(6)}`;
      } else if (this.phone.length === 11) {
        formattedPhone = `${this.phone.slice(0, 3)}-${this.phone.slice(
          3,
          7
        )}-${this.phone.slice(7)}`;
      }

      this.$emit('submit', {
        name: this.name,
        ssn: `${this.regFront}-${this.regBack}`,
        phone: formattedPhone,
        address: this.address,
        email: this.email,
        role: this.role,
        org_name: this.org_name || null,
      });
    },
    async findOrgList() {
      const result = await findAllOrg();
      this.orgList = result;
    },
  },
  mounted() {
    this.findOrgList();
  },
};
</script>

<style scoped>
.address-btn {
  padding: 10px;
  width: 100px;
  height: 43px;
}
</style>
