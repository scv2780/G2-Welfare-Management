<template>
  <p>test test test</p>
</template>

<script setup>
import { onMounted } from 'vue';
import { testBackend } from '../api/test.js';

onMounted(() => {
  testBackend();
});
</script>
