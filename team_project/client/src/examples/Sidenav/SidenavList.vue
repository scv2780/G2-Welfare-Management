<template>
  <div class="w-auto h-auto collapse navbar-collapse max-height-vh-200 h-200">
    <ul class="navbar-nav">
      <li class="mt-3 nav-item">
        <h6 class="text-xs ps-4 text-uppercase font-weight-bolder text-white">
          {{ menuStore.pageTitle }}
        </h6>
      </li>

      <li
        class="nav-item"
        v-for="item in menuStore.filteredMenu"
        :key="item.path"
      >
        <sidenav-collapse
          :url="item.path"
          :collapse="false"
          :collapseRef="item.path"
          :navText="item.label"
        />
      </li>
    </ul>
  </div>
</template>

<script setup>
import SidenavCollapse from "./SidenavCollapse.vue";
import { useMenuStore } from "@/store/sidebar";

const menuStore = useMenuStore();
menuStore.loadUserRole(); // 로그인 상태에 따른 권한 반영
</script>
