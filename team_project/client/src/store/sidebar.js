// store/menu.js
import { defineStore } from "pinia";

export const useMenuStore = defineStore("menu", {
  state: () => ({
    pageTitle: "", // 상단 페이지 분류 이름
    role: "AA1", // 기본 권한
    rawMenu: [], // 페이지가 설정해주는 메뉴
  }),

  getters: {
    filteredMenu(state) {
      // role별 메뉴 필터링
      if (state.role === "AA4") return state.rawMenu; // 관리자 전체 허용
      return state.rawMenu.filter((item) => item.role.includes(state.role));
    },
  },

  actions: {
    setMenu(list) {
      this.rawMenu = list;
    },
    setPageTitle(title) {
      this.pageTitle = title;
    },
    setRole(role) {
      this.role = role;
    },
    loadUserRole() {
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        this.role = user.role || "AA1";
      }
    },
  },
});
