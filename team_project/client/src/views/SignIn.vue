<template>
  <navbar btnBackground="bg-gradient-success" />
  <div
    class="page-header align-items-start min-vh-100"
    style="
      background-image: url('https://images.unsplash.com/photo-1497294815431-9365093b7331?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80');
    "
  >
    <span class="mask bg-gradient-dark opacity-6"></span>
    <div class="container my-auto">
      <div class="row">
        <div class="col-lg-4 col-md-8 col-12 mx-auto">
          <div class="card z-index-0 fadeIn3 fadeInBottom">
            <!-- 로그인 헤더 -->
            <div class="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
              <div
                class="bg-gradient-success shadow-success border-radius-lg py-3 pe-1"
              >
                <h4 class="text-white font-weight-bolder text-center mt-2 mb-0">
                  장애 행복 복지 지원
                </h4>
              </div>
            </div>

            <!-- 로그인 바디 -->
            <div class="card-body">
              <!-- form -->
              <form role="form" class="text-start mt-3">
                <div class="mb-3">
                  <material-input
                    id="userId"
                    type="text"
                    label="아이디를 입력해주세요"
                    name="userId"
                    v-model="userId"
                  />
                </div>
                <div class="mb-3">
                  <material-input
                    id="userPw"
                    type="password"
                    label="비밀번호를 입력해주세요"
                    name="userPw"
                    v-model="userPw"
                  />
                </div>
                <!-- <material-switch id="rememberMe" name="rememberMe"
                  >Remember me</material-switch
                > -->
                <div class="text-center">
                  <material-button
                    class="my-4 mb-2"
                    variant="gradient"
                    color="success"
                    fullWidth
                    type="button"
                    @click="login"
                    >로그인</material-button
                  >
                </div>
                <p class="mt-4 text-sm text-center">
                  계정이 없으신가요?
                  <router-link
                    :to="{ name: 'SignUp' }"
                    class="text-success text-gradient font-weight-bold"
                  >
                    회원가입</router-link
                  >
                </p>

                <p class="mt-4 text-sm text-center">
                  <a
                    href="#"
                    @click.prevent="toggleIdModal"
                    class="text-success text-gradient font-weight-bold"
                  >
                    ID 찾기
                  </a>
                  <span> / </span>
                  <a
                    href="#"
                    @click.prevent="togglePwModal"
                    class="text-success text-gradient font-weight-bold"
                  >
                    PW 찾기
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- ID 찾기 모달 -->
      <div v-if="showFindIdModal" class="custom-modal-backdrop">
        <div class="custom-modal">
          <h5 class="font-weight-bolder mb-3">아이디 찾기</h5>

          <p class="text-sm text-secondary">아래의 항목을 모두 입력해주세요.</p>

          <material-input
            type="text"
            label="이름"
            class="mb-3"
            v-model="findIdName"
          />

          <material-input
            type="tel"
            label="연락처"
            class="mb-4"
            v-model="findIdPhone"
            @input="formatPhoneInput('findIdPhone')"
          />

          <div class="d-flex justify-content-end gap-2">
            <material-button color="secondary" @click="toggleIdModal">
              닫기
            </material-button>
            <material-button color="success" @click="findId">
              확인
            </material-button>
          </div>
        </div>
      </div>

      <!-- PW 찾기 모달 -->
      <div v-if="showFindPwModal" class="custom-modal-backdrop">
        <div class="custom-modal">
          <div v-if="findPwStep === 1">
            <h5 class="font-weight-bolder mb-3">비밀번호 찾기 (1/2)</h5>

            <p class="text-sm text-secondary">
              아래의 항목을 모두 입력해주세요.
            </p>

            <material-input
              type="text"
              label="아이디"
              class="mb-3"
              v-model="findPwUserId"
            />
            <material-input
              type="text"
              label="이름"
              class="mb-3"
              v-model="findPwName"
            />
            <material-input
              type="tel"
              label="연락처"
              class="mb-4"
              v-model="findPwPhone"
              @input="formatPhoneInput('findPwPhone')"
            />

            <div class="d-flex justify-content-end gap-2">
              <material-button color="secondary" @click="togglePwModal">
                닫기
              </material-button>
              <material-button color="success" @click="findPw">
                본인 확인
              </material-button>
            </div>
          </div>

          <div v-else-if="findPwStep === 2">
            <h5 class="font-weight-bolder mb-3">비밀번호 재설정 (2/2)</h5>

            <p class="text-sm text-secondary">
              새로 사용하실 비밀번호를 입력해주세요.
            </p>

            <material-input
              type="password"
              label="새 비밀번호"
              class="mb-3"
              v-model="findPwNewPw"
            />
            <material-input
              type="password"
              label="새 비밀번호 확인"
              class="mb-4"
              v-model="findPwNewPwCheck"
            />

            <div class="d-flex justify-content-end gap-2">
              <material-button color="secondary" @click="togglePwModal">
                취소
              </material-button>
              <material-button color="success" @click="resetPassword">
                비밀번호 재설정
              </material-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/examples/PageLayout/Navbar.vue';
import MaterialInput from '@/components/MaterialInput.vue';
import MaterialButton from '@/components/MaterialButton.vue';
import { mapMutations } from 'vuex';
import { useAuthStore } from '../store/authLogin';
import { useMenuStore } from '@/store/sidebar';
import { findIdPw } from '../api/user';

export default {
  name: 'sign-in',

  components: {
    Navbar,
    MaterialInput,
    // MaterialSwitch,
    MaterialButton,
  },
  data() {
    return {
      userId: '',
      userPw: '',
      showFindIdModal: false,
      showFindPwModal: false,
      findIdName: '',
      findIdPhone: '',
      findPwUserId: '',
      findPwName: '',
      findPwPhone: '',
      findPwNewPw: '',
      findPwNewPwCheck: '',
      findPwStep: 1, // 1: 본인 확인, 2: 재설정
    };
  },
  beforeMount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  beforeUnmount() {
    this.toggleEveryDisplay();
    this.toggleHideConfig();
  },
  methods: {
    async login() {
      if (!this.userId || !this.userPw) {
        alert('아이디 및 비밀번호를 입력해주세요');
        return;
      }

      const piniaLogin = useAuthStore();
      const menu = useMenuStore();
      // menu.loadUserRole();
      try {
        const result = await piniaLogin.login({
          userId: this.userId,
          userPw: this.userPw,
        });
        if (!result.ok) {
          alert(`로그인 실패 : ${result.message}`);
          return;
        }

        alert(`반갑습니다 ${result.user_id}(${result.role})님`);
        this.$router.push({ name: 'dashboard' });
        localStorage.setItem('user', JSON.stringify(result));
        menu.setRole(result.role);
      } catch (err) {
        alert('로그인 실패 err: ', err);
      }
    },

    formatPhoneInput(targetVariable) {
      let phone = this[targetVariable];
      if (!phone) return;

      const cleaned = phone.replace(/[^0-9]/g, '');
      let formatted = '';

      if (cleaned.length < 4) {
        formatted = cleaned;
      } else if (cleaned.length < 8) {
        formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
      } else if (cleaned.length < 11) {
        formatted =
          cleaned.slice(0, 3) +
          '-' +
          cleaned.slice(3, 7) +
          '-' +
          cleaned.slice(7);
      } else {
        formatted =
          cleaned.slice(0, 3) +
          '-' +
          cleaned.slice(3, 7) +
          '-' +
          cleaned.slice(7, 11);
      }

      this[targetVariable] = formatted;
    },

    async findId() {
      if (!this.findIdName || !this.findIdPhone) {
        alert('모든 항목을 입력해주세요');
        return;
      }
      const result = await findIdPw('findId', {
        name: this.findIdName,
        phone: this.findIdPhone,
      });
      console.log(result);
      if (!result.ok) {
        alert('조건에 맞는 값이 없습니다');
        return;
      }
      alert(`귀하의 아이디는 ${result.data.user_id} 입니다.`);
    },

    async findPw() {
      if (!this.findPwUserId || !this.findPwName || !this.findPwPhone) {
        return alert('모든 항목을 입력해주세요');
      }
      const result = await findIdPw('findPw', {
        user_id: this.findPwUserId,
        name: this.findPwName,
        phone: this.findPwPhone,
      });
      if (!result.ok) {
        alert('조건에 맞는 값이 없습니다');
        return;
      }
      this.findPwStep = 2;
    },

    async resetPassword() {
      if (this.findPwNewPw.length > 15 || this.findPwNewPw.length < 9) {
        return alert('비밀번호는 9자 이상 15자 이하로 입력해주세요.');
      }
      if (!this.findPwNewPw || !this.findPwNewPwCheck) {
        return alert('모든 항목을 입력해주세요');
      }
      if (this.findPwNewPw !== this.findPwNewPwCheck) {
        return alert('비밀번호가 일치하지 않습니다.');
      }
      const result = await findIdPw('findResetPw', {
        user_id: this.findPwUserId,
        newPw: this.findPwNewPw,
      });
      if (!result.ok) {
        alert('PW 변경 실패');
        return;
      }
      alert('비밀번호 변경 성공');
      this.togglePwModal();
      this.findPwStep = 1;
    },

    toggleIdModal() {
      this.findResetModal();
      this.showFindIdModal = !this.showFindIdModal;
    },
    togglePwModal() {
      this.findResetModal();
      this.showFindPwModal = !this.showFindPwModal;
    },

    findResetModal() {
      this.findIdName = '';
      this.findIdPhone = '';
      this.findPwUserId = '';
      this.findPwName = '';
      this.findPwPhone = '';
      this.findPwNewPw = '';
      this.findPwNewPwCheck = '';
      this.findPwStep = 1;
    },

    ...mapMutations(['toggleEveryDisplay', 'toggleHideConfig']),
  },
};
</script>

<style>
.custom-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.custom-modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
</style>
