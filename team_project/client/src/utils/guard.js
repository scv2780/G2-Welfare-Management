import { useAuthStore } from '@/store/authLogin';

export function checkAuth(requiredRoles = []) {
  const auth = useAuthStore();

  // 로그인 확인
  if (!auth.isLogin) {
    alert('로그인이 필요한 페이지입니다.');
    return { allowed: false, redirect: '/sign-in' };
  }

  // 권한 확인
  if (requiredRoles.length > 0 && !requiredRoles.includes(auth.role)) {
    alert('접근 권한이 맞지 않습니다.');
    return { allowed: false, redirect: '/dashboard' };
  }

  return { allowed: true };
}
