<template>
  <div class="p-6">
    <ProgramList
      v-show="showList"
      ref="programListRef"
      @go-to-add="goToAdd"
      @select-program="selectProgramForEdit"
    />

    <ProgramAdd
      v-show="!showList"
      @goToList="goToList"
      :initialProgram="selectedProgram"
    />
  </div>
</template>

<script setup>
import ProgramList from "@/components/Sponsor/Common/ProgramList.vue";
import ProgramAdd from "@/components/Sponsor/Common/ProgramAdd.vue";
// import { useMenuStore } from "@/store/sidebar";
// import { useMenuStore } from "@/store/sidebar";
// import { sponsorMenu } from "@/config/menus";
import { ref } from "vue";
let programListRef = ref(null);
let showList = ref(true); // 화면 상태 관리
let selectedProgram = ref(null); //  선택된 프로그램 정보를 저장할 ref
// '후원 프로그램 등록' 버튼 클릭 시
const goToAdd = () => {
  selectedProgram.value = null; // 등록 시에는 초기화
  showList.value = false; // ProgramAdd 화면 표시
};

// 목록 화면으로 돌아갈 때
const goToList = async () => {
  selectedProgram.value = null; // 리스트 복귀 시 정보 초기화
  showList.value = true; // ProgramList 화면 표시
  if (programListRef.value && programListRef.value.getSponsorList) {
    await programListRef.value.getSponsorList();
    console.log("목록 전환 시 getSponsorList 재실행 완료");
  }
};

// ProgramList에서 항목 클릭 시 호출될 함수
const selectProgramForEdit = (programData) => {
  selectedProgram.value = programData; // 선택된 데이터 저장
  showList.value = false; // ProgramAdd 화면 표시 (수정 모드 진입)
};

// const menu = useMenuStore();
// onMounted(() => {
//   menu.setPageTitle("후원 관리자 페이지");
//   menu.setMenu(sponsorMenu);
// });
</script>
