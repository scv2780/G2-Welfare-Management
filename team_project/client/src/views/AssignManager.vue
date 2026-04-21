<template>
  <section class="p-8 text-center">
    <h2 class="text-2xl font-semibold mb-4">담당자 배정 페이지</h2>

    <p class="text-gray-600 mb-6">
      해당 제출번호: <strong>{{ submitCode }}</strong>
    </p>

    <MaterialButton
      color="dark"
      size="md"
      @click="assignManager"
      :disabled="loading"
    >
      {{ loading ? "처리중..." : "담당자 배정하기" }}
    </MaterialButton>

    <p v-if="error" class="mt-4 text-red-600 text-sm">
      {{ error }}
    </p>

    <p v-if="success" class="mt-4 text-green-600 text-sm">
      배정이 완료되었습니다!
    </p>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import MaterialButton from "@/components/MaterialButton.vue";

const route = useRoute();
// const router = useRouter();

const submitCode = route.params.submitCode;

const loading = ref(false);
const error = ref("");
const success = ref(false);

async function assignManager() {
  loading.value = true;
  error.value = "";
  success.value = false;

  try {
    const { data } = await axios.post(`/api/assign/${submitCode}`, {
      assignee: 13, // 담당자 user_code = 2
    });

    if (!data.success) throw new Error(data.message);

    success.value = true;

    // 옵션: 자동 이동
    // router.push({ name: "counsel-list" });
  } catch (e) {
    error.value = e.message || "배정 처리 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
}
</script>
