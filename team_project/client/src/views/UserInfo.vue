<template>
  <div class="container py-4">
    <div class="mb-3">
      <h3 class="fw-bold text-start text-dark">회원정보</h3>
    </div>

    <!-- 탭 -->
    <div class="tabs-container">
      <div>
        <material-button
          :color="[activeTab === 'user' ? 'success' : 'secondary']"
          size="sm"
          @click="
            (activeTab = 'user'), (editMode = false), (orgEditMode = false)
          "
        >
          사용자 정보
        </material-button>
      </div>

      <div>
        <material-button
          :color="[activeTab === 'org' ? 'success' : 'secondary']"
          size="sm"
          @click="
            (activeTab = 'org'), (editMode = false), (orgEditMode = false)
          "
        >
          소속기관 정보
        </material-button>
      </div>

      <div v-if="auth.role === 'AA1'">
        <material-button
          :color="[activeTab === 'child' ? 'success' : 'secondary']"
          size="sm"
          @click="activeTab = 'child'"
        >
          자녀 정보
        </material-button>
      </div>
    </div>

    <div class="info-wrapper">
      <material-card class="info-card">
        <material-card-content class="info-content">
          <!-- 사용자 정보 -->
          <div v-if="activeTab === 'user'">
            <UserBasicInfo
              :editMode="editMode"
              :userData="userData"
              @edit="editMode = true"
              @cancel="cancelUserEdit"
              @save="saveUserInfo"
              @openPwModal="showPwModal = true"
              @openDeleteModal="showDelete = true"
            />
          </div>

          <DeleteUserModal
            v-if="showDelete"
            @close="showDelete = false"
            @confirm="handleDelete"
          />

          <!-- 소속기관 정보 -->
          <div v-if="activeTab === 'org'">
            <UserOrgInfo
              :role="auth.role"
              :editMode="orgEditMode"
              :orgData="orgData"
              @edit="orgEditMode = true"
              @cancel="cancelOrgEdit"
              @save="saveOrgInfo"
            />
          </div>

          <!-- 자녀 정보 -->
          <div v-if="activeTab === 'child'">
            <UserChildInfo
              :childList="childList"
              @add-child="addChild"
              @update-child="updateChild"
              @delete-child="deleteChild"
            />
          </div>

          <UserPasswordModal
            v-if="showPwModal"
            @close="showPwModal = false"
            @confirm="submitPasswordChange"
          />
        </material-card-content>
      </material-card>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/store/authLogin';
import UserBasicInfo from '@/components/UserInfo/UserBasicInfo.vue';
import UserOrgInfo from '@/components/UserInfo/UserOrgInfo.vue';
import UserChildInfo from '@/components/UserInfo/UserChildInfo.vue';
import UserPasswordModal from '@/components/UserInfo/UserPasswordModal.vue';
import {
  findUserInfo,
  addChild,
  deleteChild,
  updateInfo,
  updatePw,
  deleteUser,
} from '@/api/user';
import dateFormat from '@/utils/dateFormat';
import { checkAuth } from '@/utils/guard';
import MaterialButton from '@/components/MaterialButton.vue';
import DeleteUserModal from '../components/UserInfo/DeleteUserModal.vue';

export default {
  name: 'UserInfo',

  components: {
    UserBasicInfo,
    UserOrgInfo,
    UserChildInfo,
    UserPasswordModal,
    MaterialButton,
    DeleteUserModal,
  },
  data() {
    return {
      activeTab: 'user',
      editMode: false,
      orgEditMode: false,
      showPwModal: false,
      showDelete: false,

      userData: {
        user_id: '',
        name: '',
        phone: '',
        address: '',
        email: '',
      },
      orgData: {
        orgCode: '',
        orgName: '',
        managerName: '',
        deptName: '',
        roleName: '',
        phone: '',
        address: '',
      },
      childList: [],
      showChildForm: false,
      originalUser: {},
      originalOrg: {},
      auth: null,
    };
  },

  created() {
    const auth = useAuthStore();
    this.auth = auth;

    this.userData.user_id = auth.userId;
    this.userData.name = '';
    this.userData.phone = '';
    this.userData.address = '';
    this.userData.email = '';
    this.originalUser = { ...this.userData };

    this.orgData.orgCode = '';
    this.orgData.orgName = '';
    this.orgData.managerName = '';
    this.orgData.deptName = '';
    this.orgData.roleName = auth.role;
    this.orgData.phone = '';
    this.orgData.address = '';
    this.originalOrg = { ...this.orgData };

    this.userFullInfo();

    this.childList = [];
  },

  methods: {
    cancelUserEdit() {
      this.userData = { ...this.originalUser };
      this.editMode = false;
    },

    cancelOrgEdit() {
      this.orgData = { ...this.originalOrg };
      this.orgEditMode = false;
    },

    async saveUserInfo(updated) {
      const result = await updateInfo('user', updated);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      await this.userFullInfo();
      this.editMode = false;
      alert('수정이 완료되었습니다.');
    },

    async submitPasswordChange(passwords) {
      const data = JSON.parse(localStorage.getItem('user'));
      const payload = {
        user_code: data.user_code,
        ...passwords,
      };

      const result = await updatePw(payload);
      if (!result.ok) {
        alert(`변경을 실패하였습니다.\n사유: ${result.message}`);
        return;
      }

      alert('변경을 성공하였습니다.');
      this.showPwModal = false;
    },

    async saveOrgInfo(updated) {
      const updateData = {
        user_id: this.auth.userId,
        org_name: updated.orgName,
        department: updated.deptName,
      };

      const result = await updateInfo('org', updateData);
      if (!result.ok) {
        alert(result.message);
        return;
      }

      // 1) DB 최신 정보 다시 불러오기
      await this.userFullInfo();

      // 2) 로그인 정보(authStore)에 orgCode 반영
      if (this.orgData.orgCode) {
        this.auth.updateOrgCode(this.orgData.orgCode);
      } else {
        console.warn('[saveOrgInfo] orgData.orgCode가 없습니다.', this.orgData);
      }

      // 3) 화면 상태 정리
      this.orgEditMode = false;
      alert('수정 완료');
    },

    async updateChild(childData) {
      const result = await updateInfo('child', childData);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      await this.userFullInfo();
    },

    // 자녀 추가
    async addChild(child) {
      try {
        const today = dateFormat(new Date(), 'yyyy-MM-dd');
        const childData = {
          user_code: this.auth.userCode,
          registered_date: today,
          ...child,
        };

        const result = await addChild(childData);
        if (!result.ok) {
          alert('자녀 등록을 실패했습니다.');
        }
        await this.userFullInfo();
      } catch (err) {
        console.error('[ addChild 오류 ]', err);
      }
    },

    // 자녀 정보 삭제
    async deleteChild(childCode) {
      const result = await deleteChild(childCode);
      if (!result.ok) {
        alert('삭제를 실패하였습니다.');
        return;
      }
      await this.userFullInfo();
      alert('삭제를 성공했습니다.');
    },

    async userFullInfo() {
      try {
        const res = await findUserInfo({
          userId: this.auth.userId,
          role: this.auth.role,
        });

        this.auth.userName = res[0].name;
        if (res.false) {
          console.log('값 없음');
          return;
        }

        this.userData = {
          user_id: res[0].user_id,
          name: res[0].name,
          phone: res[0].phone,
          address: res[0].user_address,
          email: res[0].email,
        };
        this.originalUser = { ...this.userData };

        this.orgData = {
          orgCode: res[0].org_code,
          orgName: res[0].org_name || '소속기관 없음',
          managerName: res[0].manager_name || '담당자 미정',
          deptName: res[0].department,
          roleName: this.auth.role,
          phone: res[0].org_phone,
          address: res[0].org_address,
        };
        this.originalOrg = { ...this.orgData };

        const childData = res;
        this.childList = childData
          .filter((item) => item.child_name != null)
          .map((item) => ({
            child_code: item.child_code,
            child_name: item.child_name,
            ssn: item.ssn,
            gender: item.gender,
            disability_type: item.disability_type,
          }));
      } catch (err) {
        console.error('[ loadUserFullInfo 오류 ]', err);
      }
    },

    async handleDelete({ user_id, password }) {
      try {
        console.log({ user_id, password });
        const res = await deleteUser({ user_id, password });

        if (res.ok) {
          alert('탈퇴가 완료되었습니다.');
          localStorage.clear();
          this.$router.push('/sign-in');
        } else {
          alert(res.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
        }
      } catch (err) {
        console.error(err);
        alert('서버 오류가 발생했습니다.');
      }
    },
  },
  mounted() {
    const { allowed, redirect } = checkAuth(['AA1', 'AA2', 'AA3', 'AA4']);
    if (!allowed) return this.$router.push(redirect);
  },
};
</script>

<style>
.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.info-wrapper {
  display: flex;
  justify-content: center;
}

.info-card {
  width: 460px;
  border-radius: 12px;
}

.info-content {
  padding: 24px !important;
}
</style>
