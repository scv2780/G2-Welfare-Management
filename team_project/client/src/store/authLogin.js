// src/store/authLogin.js

import { defineStore } from 'pinia';
import { login as loginApi } from '../api/user';

export const useAuthStore = defineStore('authLogin', {
  state: () => ({
    userId: '',
    userName: '',
    role: 'AA0',
    userCode: '',
    orgCode: '',
    isLogin: false,
  }),
  getters: {
    isAA1: (state) => state.role == 'AA1',
    isAA2: (state) => state.role == 'AA2',
    isAA3: (state) => state.role == 'AA3',
  },
  actions: {
    reload() {
      // 헷갈릴까봐 주석 설명
      // 페이지 시작 시 reload 동작
      // localStorage에 값이 있으면 loginCheck -> true
      // loginCheck을 JSON으로 변환시켜 줌 -> loginData
      // loginData를 기반으로 pinia 객체에 값을 저장
      // 로그인 상태가 아닐 경우 생략
      // -> 새로고침해도 로그인 유지됨
      const loginCheck = localStorage.getItem('user');
      if (!loginCheck) {
        this.userId = '';
        this.userName = '';
        this.userCode = '';
        this.role = 'AA0';
        this.isLogin = false;
        return;
      }

      try {
        const loginData = JSON.parse(loginCheck);
        this.userId = loginData.user_id;
        this.userName = loginData.name || '';
        this.role = loginData.role;
        this.userCode = loginData.userCode || loginData.user_code || '';
        this.orgCode = loginData.org_code;
        this.isLogin = true;
      } catch (err) {
        console.error('[ pinia reload 오류 ] : ', err);
        // 오류나도 게스트로
        this.userId = '';
        this.userName = '';
        this.userCode = '';
        this.role = 'AA0';
        this.isLogin = false;
      }
    },

    // 로그인
    async login({ userId, userPw }) {
      const result = await loginApi({ userId, userPw });

      if (result.is_active == 0) return result;

      if (!result.ok) return result;

      this.userId = result.user_id;
      this.userName = result.name || '';
      this.role = result.role;
      this.userCode = result.user_code;
      this.orgCode = result.org_code;
      this.isLogin = true;

      localStorage.setItem(
        'user',
        JSON.stringify({
          userId: result.user_id,
          userName: result.name || '',
          role: result.role,
          userCode: result.user_code,
          orgCode: result.org_code,
        })
      );
      return result;
    },

    // 로그아웃
    logout() {
      this.userId = '';
      this.userName = '';
      this.role = 'AA0';
      this.userCode = '';
      this.orgCode = '';
      this.isLogin = false;
      localStorage.removeItem('user');
    },

    updateOrgCode(newOrgCode) {
      this.orgCode = newOrgCode;

      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          const obj = JSON.parse(saved);
          obj.orgCode = newOrgCode;
          obj.org_code = newOrgCode;
          localStorage.setItem('user', JSON.stringify(obj));
        } catch (e) {
          console.error('[updateOrgCode localStorage 오류]', e);
        }
      }
    },
  },
});
