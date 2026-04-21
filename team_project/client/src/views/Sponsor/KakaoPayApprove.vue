<template>
  <div class="approve-wrap">
    <h2>결제 승인 중입니다. 잠시만 기다려 주세요...</h2>
  </div>
</template>

<script setup>
import axios from "axios";
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  // ----------------------------------------------------
  // ⭐ [수정 1] TID 정보 누락 방어 및 추출
  // ----------------------------------------------------
  const pg_token = route.query.pg_token;
  const localtid = localStorage.getItem("kakao_tid");

  // localtid이 null일 경우, TypeError를 내지 않고 안전하게 실행을 중단합니다.
  if (!localtid) {
    console.error("결제 승인 오류: TID 정보가 로컬 스토리지에 없습니다.");
    alert("결제 정보가 유효하지 않습니다. 다시 시도해 주세요.");
    router.push("/SponsorProgramList");
    return; // ⬅️ 이 줄이 오류를 해결합니다.
  }

  let tid = null;
  let code = null;
  let kakaoObject = null;

  try {
    kakaoObject = JSON.parse(localtid);

    if (!kakaoObject || !kakaoObject.tid || !kakaoObject.code) {
      throw new Error("TID 객체 형식이 잘못되었습니다.");
    }

    tid = String(kakaoObject.tid);
    code = kakaoObject.code;
  } catch (e) {
    console.error("TID 파싱 오류:", e);
    alert("저장된 결제 정보가 손상되었습니다. 다시 시도해 주세요.");
    router.push("/SponsorProgramList");
    return;
  }

  if (!pg_token || !tid) {
    alert("결제 승인 정보가 올바르지 않습니다.");
    router.push("/SponsorProgramList");
    return;
  }

  try {
    // ----------------------------------------------------
    // ⭐ [수정 2] 사용자 정보 누락 방어 및 추출
    // ----------------------------------------------------
    const userJsonString = localStorage.getItem("user");
    let userId = null;
    let userObject = null;

    if (!userJsonString) {
      console.error(
        "결제 승인 오류: 사용자 로그인 정보가 로컬 스토리지에 없습니다."
      );
      alert("로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.");
      router.push("/sign-in");
      return;
    }

    userObject = JSON.parse(userJsonString);
    if (!userObject || !userObject.user_id) {
      console.error("결제 승인 오류: 사용자 ID를 찾을 수 없습니다.");
      alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.");
      router.push("/sign-in");
      return;
    }

    userId = String(userObject.user_id);

    // ----------------------------
    // 서버에 approve 요청 (로직 유지)
    // ----------------------------
    const res = await axios.post(`/api/pay/kakao/approve`, {
      pg_token,
      tid,
      program_code: code,
      userID: userId,
    });

    console.log("최종 승인 성공:", res.data);

    alert("프로그램이 성공적으로 후원되었습니다!");

    // 결제정보 삭제
    localStorage.removeItem("kakao_tid");
    localStorage.removeItem("program_code");
    localStorage.removeItem("userID");

    router.push("/SponsorProgramList");
  } catch (error) {
    console.error(
      "approve 오류:",
      error.response?.data || error.message || error
    );
    alert("결제 승인 중 오류가 발생했습니다.");
    localStorage.removeItem("kakao_tid"); // 실패 시에도 TID 삭제 (재시도 용이)
    router.push("/SponsorProgramList");
  }
});
</script>

<style scoped>
/* 스타일 유지 */
.approve-wrap {
  padding: 40px;
  text-align: center;
}
</style>
