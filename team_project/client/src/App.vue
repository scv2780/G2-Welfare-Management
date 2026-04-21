<!--
=========================================================
* Vue Material Dashboard 2 - v3.1.0
=========================================================

* Product Page: https://creative-tim.com/product/vue-material-dashboard-2
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
-->
<template>
  <!-- <sidenav-list :menu="menu" /> -->
  <sidenav
    :custom_class="color"
    :class="[isRTL ? 'fixed-end' : 'fixed-start']"
    v-if="showSidenav && $route.path !== '/dashboard'"
  />
  <!-- :menu="sidebar.menuData" -->

  <main
    class="main-content position-relative max-height-vh-100 h-100 overflow-x-hidden"
  >
    <!-- nav -->
    <navbar
      :class="[isNavFixed ? navbarFixed : '', isAbsolute ? absolute : '']"
      :color="isAbsolute ? 'text-white opacity-8' : ''"
      :minNav="navbarMinimize"
      v-if="showNavbar"
    />
    <div class="content-wrapper">
      <router-view />
    </div>
    <app-footer v-show="showFooter" />
    <!-- <configurator
      :toggle="toggleConfigurator"
      :class="[showConfig ? 'show' : '', hideConfigButton ? 'd-none' : '']"
    /> -->
    <button class="scroll-top-btn" @click="scrollToTop">
      <i class="material-icons">arrow_upward</i>
    </button>
  </main>
</template>
<script>
import Sidenav from "./examples/Sidenav";
// import Configurator from "@/examples/Configurator.vue";
import Navbar from "@/examples/Navbars/Navbar.vue";
import AppFooter from "@/examples/Footer.vue";
import { mapMutations, mapState } from "vuex";

export default {
  name: "App",
  components: { Sidenav, Navbar, AppFooter },

  setup() {
    // const sidebar = useSidebarStore(); // ✔ setup 내부에서 Pinia 사용
    // // return { sidebar };
  },
  methods: {
    ...mapMutations(["navbarMinimize"]),

    scrollToTop() {
      // 1) 기본 window
      window.scrollTo({ top: 0, behavior: "smooth" });

      // 2) html, body
      if (document.documentElement) {
        document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (document.body) {
        document.body.scrollTo({ top: 0, behavior: "smooth" });
      }

      // 3) 대시보드에서 쓰는 메인 컨테이너들
      const main = document.querySelector(".main-content");
      if (main) {
        main.scrollTo({ top: 0, behavior: "smooth" });
      }

      const sidenavShow = document.querySelector(".g-sidenav-show");
      if (sidenavShow) {
        sidenavShow.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
  },
  computed: {
    ...mapState([
      "isRTL",
      "color",
      "isAbsolute",
      "isNavFixed",
      "navbarFixed",
      "absolute",
      "showSidenav",
      "showNavbar",
      "showFooter",
    ]),
  },
  beforeMount() {
    this.$store.state.isTransparent = "bg-transparent";

    const sidenav = document.getElementsByClassName("g-sidenav-show")[0];

    if (window.innerWidth > 16000) {
      sidenav.classList.add("g-sidenav-pinned");
    }
  },
};
</script>

<style>
html,
body {
  height: 100%;
}

.main-content {
  display: flex !important;
  flex-direction: column !important;
  min-height: 100vh !important;
}

.content-wrapper {
  flex-grow: 1 !important;
}
.scroll-top-btn {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  border: none;
  background: #ffffff;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1100;
}

.scroll-top-btn i.material-icons {
  font-size: 20px;
}
</style>
