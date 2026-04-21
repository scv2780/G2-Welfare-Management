<template>
  <div class="p-6">
    <ProgramList v-show="showList" ref="programListRef" />
  </div>
</template>

<script setup>
import ProgramList from "@/components/Sponsor/Common/SponsorProgram.vue";

import { ref } from "vue";
let programListRef = ref(null);
let showList = ref(true); // 화면 상태 관리
</script>
