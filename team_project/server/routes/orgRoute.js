// routes/orgRoute.js
const express = require("express");
const router = express.Router();
const orgService = require("../services/orgService");

// 유틸: '' → null, 날짜 포맷 검증
const toNull = (v) => (v === "" || v === undefined ? null : v);
const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

// ★ 전화번호 정규화: 숫자만 남기고, 한국식 하이픈 붙이기
const normalizePhone = (raw) => {
  if (!raw) return null;

  const digits = String(raw).replace(/\D/g, ""); // 숫자만
  if (!digits) return null;

  // 1) 02로 시작하는 경우 (서울)
  if (digits.startsWith("02")) {
    if (digits.length === 9) {
      // 02-000-0000
      return digits.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    if (digits.length === 10) {
      // 02-0000-0000
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
    }
  }

  // 2) 그 외 (010, 053, 031 등)
  if (digits.length === 10) {
    // 000-000-0000 (지역번호/대표번호)
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  if (digits.length === 11) {
    // 000-0000-0000 (휴대폰 010-....)
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  // 3) 그 외 애매한 길이들 fallback
  if (digits.length > 7) {
    return digits.replace(/(\d{3})(\d{3,4})(\d+)/, "$1-$2-$3");
  }
  if (digits.length > 3) {
    return digits.replace(/(\d{3})(\d+)/, "$1-$2");
  }
  return digits;
};

// 공통코드: 기관 상태
const VALID_STATUS = ["AB1", "AB2", "AB3"]; // AB1:운영중, AB2:임시중단, AB3:종료

// 목록
router.get("/", async (req, res) => {
  try {
    const rows = await orgService.organizationList();
    console.log(
      "[GET /api/organization] count:",
      Array.isArray(rows) ? rows.length : 0
    );
    return res.status(200).json({ status: "success", data: rows }); // <-- 프론트가 기대하는 형태
  } catch (err) {
    console.error("[GET /api/organization] 실패:", err.stack || err);
    return res.status(500).json({ status: "error", message: "서버 오류" });
  }
});

// 수정
router.put("/:code", async (req, res) => {
  try {
    const org_code = req.params.code;
    const { org_name, address, org_phone, start_date, end_date, status } =
      req.body ?? {};
    if (!org_code)
      return res
        .status(400)
        .json({ status: "error", message: "org_code 누락" });
    if (!org_name)
      return res.status(400).json({ status: "error", message: "기관명 누락" });
    if (!VALID_STATUS.includes(status)) {
      return res
        .status(400)
        .json({ status: "error", message: "status 값 오류(AB1/AB2/AB3)" });
    }

    const fixedPhone = normalizePhone(org_phone);

    const result = await orgService.organizationUpdate({
      org_code,
      org_name,
      address,
      org_phone: fixedPhone,
      start_date,
      end_date,
      status,
    });

    if (!result || result.affectedRows === 0)
      return res.status(404).json({ status: "error", message: "대상 없음" });

    res.status(200).json({ status: "success", updated: result.affectedRows });
  } catch (err) {
    console.error("[PUT /api/organization/:code] 실패:", err.stack || err);
    res.status(500).json({ status: "error", message: "서버 오류" });
  }
});

//삭제
router.delete("/:code", async (req, res) => {
  try {
    const org_code = req.params.code;
    if (!org_code) {
      return res
        .status(400)
        .json({ status: "error", message: "org_code 누락" });
    }

    const result = await orgService.organizationDelete(org_code);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "대상 없음" });
    }

    return res
      .status(200)
      .json({ status: "success", deleted: result.affectedRows });
  } catch (err) {
    console.error("[DELETE /api/organization/:code] 실패:", err.stack || err);
    return res.status(500).json({ status: "error", message: "서버 오류" });
  }
});

//추가
// routes/orgRoute.js (POST /)
router.post("/", async (req, res) => {
  try {
    // 1) 입력 받기 + 빈문자 → null 치환
    const raw = req.body ?? {};
    const org_name = (raw.org_name || "").trim();
    const address = toNull(raw.address);
    const org_phone = normalizePhone(raw.org_phone);
    const start_date = toNull(raw.start_date);
    const end_date = toNull(raw.end_date);
    const status = raw.status;

    // 2) 검증 (500 대신 400으로 돌려서 문제를 바로 알 수 있게)
    if (!org_name) {
      return res.status(400).json({ status: "error", message: "기관명 누락" });
    }
    if (!VALID_STATUS.includes(status)) {
      return res
        .status(400)
        .json({ status: "error", message: "status 값 오류(AB1/AB2/AB3)" });
    }
    if (start_date && !isDate(start_date)) {
      return res
        .status(400)
        .json({ status: "error", message: "start_date는 YYYY-MM-DD 형식" });
    }
    if (end_date && !isDate(end_date)) {
      return res
        .status(400)
        .json({ status: "error", message: "end_date는 YYYY-MM-DD 형식" });
    }

    // 3) 서비스 호출
    const result = await orgService.organizationInsert({
      org_name,
      address,
      org_phone,
      start_date,
      end_date,
      status,
    });

    // 디버그 로그 (SQL 문제가 있으면 여기 도달 전 콘솔에 에러가 찍힘)
    console.log("[POST insert result]", result);

    if (!result || !result.affectedRows) {
      return res.status(500).json({ status: "error", message: "추가 실패" });
    }

    // 4) BigInt 안전 직렬화
    const safe = (x) =>
      JSON.parse(
        JSON.stringify(x, (k, v) => (typeof v === "bigint" ? v.toString() : v))
      );

    return res.status(201).json(
      safe({
        status: "success",
        inserted: result.affectedRows,
        id: result.insertId ?? null,
      })
    );
  } catch (err) {
    console.error("[POST /api/organization] 실패:", err.stack || err);
    return res.status(500).json({ status: "error", message: "서버 오류" });
  }
});

// 단순 목록 (코드+이름)
router.get("/simple", async (req, res) => {
  try {
    const rows = await orgService.organizationList();
    const simple = rows.map((o) => ({
      org_code: o.org_code,
      org_name: o.org_name,
    }));

    return res.status(200).json({
      status: "success",
      data: simple,
    });
  } catch (err) {
    console.error("[GET /organization/simple] 실패:", err.stack || err);
    return res.status(500).json({
      status: "error",
      message: "서버 오류",
    });
  }
});

module.exports = router;
