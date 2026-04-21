<template>
  <ul class="navbar-nav">
    <li v-for="item in menuList" :key="item.text" class="nav-item">
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-text">{{ item.text }}</span>

      <!-- 하위 메뉴가 있으면 간단히 렌더링 -->
      <ul v-if="item.children" class="nav-sublist">
        <li v-for="child in item.children" :key="child.text">
          <span>{{ child.text }}</span>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  menuList: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
.navbar-nav {
  list-style: none;
  padding: 0;
}

.nav-item {
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.nav-icon {
  margin-right: 0.5rem;
}

.nav-sublist {
  padding-left: 1.5rem;
  margin-top: 0.25rem;
}
</style>
