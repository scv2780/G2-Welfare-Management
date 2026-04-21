const express = require("express");
const router = express.Router();
const axios = require("axios");

// 카카오페이 결제 준비(ready)
router.post("/ready", async (req, res) => {
  try {
    const { program_code, userID, amount, item_name, origin } = req.body;

    const userOrigin = req.body.origin; // Vue에서 받은 URL
    let approvalBaseURL = userOrigin || req.headers.origin || "";

    // Vue dev mode (localhost:8080) → backend(3000)로 보정 필요
    if (
      approvalBaseURL.includes("localhost") &&
      approvalBaseURL.includes("8080")
    ) {
      approvalBaseURL = "http://localhost:8080";
    }

    // 배포 환경(domain 그대로 사용)
    if (approvalBaseURL.endsWith("/")) {
      approvalBaseURL = approvalBaseURL.slice(0, -1);
    }
    const body = {
      cid: "TC0ONETIME",
      partner_order_id: program_code,
      partner_user_id: userID,
      item_name: item_name || "후원 결제",
      quantity: 1,
      total_amount: amount,
      vat_amount: 0,
      tax_free_amount: 0,

      //  Vue 주소로 redirect
      approval_url: `${approvalBaseURL}/kakaopayapprove`,
      cancel_url: `${approvalBaseURL}/kakaopaycancel`,
      fail_url: `${approvalBaseURL}/kakaopayfail`,
    };

    const kakaoResponse = await axios.post(
      "https://open-api.kakaopay.com/online/v1/payment/ready",
      body,
      {
        headers: {
          Authorization: `SECRET_KEY ${process.env.KAKAO_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      next_redirect_pc_url: kakaoResponse.data.next_redirect_pc_url,
      tid: kakaoResponse.data.tid,
    });
  } catch (error) {
    console.error("READY ERROR:", error.response?.data || error);
    return res.status(500).json({ message: "결제 준비 실패", error });
  }
});

// 결제 승인(approve)
router.post("/approve", async (req, res) => {
  try {
    const { pg_token, tid, program_code, userID } = req.body;

    if (!pg_token || !tid) {
      return res.status(400).json({
        message: "pg_token 또는 tid 누락됨",
      });
    }

    // 카카오 승인 요청
    const body = {
      cid: "TC0ONETIME",
      tid,
      partner_order_id: program_code,
      partner_user_id: userID,
      pg_token,
    };

    const approveResponse = await axios.post(
      "https://open-api.kakaopay.com/online/v1/payment/approve",
      body,
      {
        headers: {
          Authorization: `SECRET_KEY ${process.env.KAKAO_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    //카카오 승인 금액
    const totalAmount = approveResponse.data.amount.total;

    // DB 저장 경로를 global.SERVER_URL로 요청
    await axios.post(
      `${global.SERVER_URL}/sponsor/${program_code}/${userID}/payments`,
      {
        userID: userID,
        transaction_amount: totalAmount,
        program_code: program_code,
      }
    );

    res.json({
      message: "success",
      data: approveResponse.data,
    });
  } catch (error) {
    console.error("approve 오류:", error.response?.data || error);
    res.status(500).json({
      message: "카카오페이 결제 승인 실패",
      error,
    });
  }
});

module.exports = router;
