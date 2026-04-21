<template>
  <aside class="sidenav navbar navbar-vertical">
    <SidenavList :menu-list="menuList" />
  </aside>
</template>

<script setup>
import SidenavList from "./SidenavList.vue";

defineProps({
  menuList: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.sidenav {
  width: 220px;
  background-color: #f8f9fa;
  height: 100vh;
  padding: 1rem;
}
</style>
