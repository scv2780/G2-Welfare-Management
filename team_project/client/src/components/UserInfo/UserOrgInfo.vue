<template>
  <div>
    <!-- 읽기 -->
    <div v-if="!editMode">
      <div v-for="item in fields" :key="item.key" class="view-block">
        <div class="view-header">
          <span class="view-label">{{ item.label }}</span>
        </div>
        <p class="view-value">{{ orgData[item.key] }}</p>
      </div>

      <div class="text-end mt-4">
        <material-button color="success" size="sm" @click="$emit('edit')">
          소속기관 수정
        </material-button>
      </div>
    </div>

    <!-- 수정 -->
    <div v-else>
      <div v-for="item in fields" :key="item.key" class="edit-block">
        <div class="edit-header">
          <span class="edit-label">{{ item.label }}</span>
        </div>

        <div
          v-if="['roleName', 'phone', 'address'].includes(item.key)"
          class="edit-input-box"
        >
          <p class="view-value" style="font-size: 14px; padding-top: 5px">
            {{ localOrg[item.key] }}
          </p>
        </div>

        <div v-else class="edit-input-box">
          <MaterialInput v-model="localOrg[item.key]" class="w-100" />
        </div>
      </div>

      <div class="text-end mt-4 d-flex justify-content-end gap-2">
        <material-button
          color="success"
          size="sm"
          @click="$emit('save', localOrg)"
        >
          저장
        </material-button>

        <material-button color="secondary" size="sm" @click="$emit('cancel')">
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
  name: 'UserOrgInfo',

  components: { MaterialInput, MaterialButton },

  props: {
    role: String,
    editMode: Boolean,
    orgData: Object,
  },

  data() {
    return {
      localOrg: {},
      orgFields: {
        AA1: [
          { key: 'orgName', label: '기관명' },
          { key: 'managerName', label: '담당자명' },
          { key: 'phone', label: '전화번호' },
          { key: 'address', label: '주소' },
        ],
        AA2: [
          { key: 'orgName', label: '기관명' },
          { key: 'deptName', label: '부서명' },
          { key: 'roleName', label: '권한' },
          { key: 'phone', label: '전화번호' },
          { key: 'address', label: '주소' },
        ],
        AA3: [
          { key: 'orgName', label: '기관명' },
          { key: 'deptName', label: '부서명' },
          { key: 'roleName', label: '권한' },
          { key: 'phone', label: '전화번호' },
          { key: 'address', label: '주소' },
        ],
        AA4: [
          { key: 'orgName', label: '기관명' },
          { key: 'deptName', label: '부서명' },
          { key: 'roleName', label: '권한' },
          { key: 'phone', label: '전화번호' },
          { key: 'address', label: '주소' },
        ],
      },
    };
  },

  computed: {
    fields() {
      return this.orgFields[this.role];
    },
  },

  watch: {
    orgData: {
      immediate: true,
      handler(v) {
        this.localOrg = { ...v };
      },
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
  text-transform: uppercase;
  color: #8392ab;
}

.view-value {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #344767;
}

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

.edit-input-box {
  margin-top: 4px;
}
</style>
