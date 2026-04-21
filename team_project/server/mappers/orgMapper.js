// mappers/orgMapper.js
const pool = require("../configs/db.js");
const orgSQL = require("../sql/orgSQL.js");

// 반환형 안전 분기:
// - mysql2/promise: [rows:Array, fields:Array] => rows = ret[0]
// - mariadb: rows:Array (행 배열 자체)         => rows = ret
function getRows(ret) {
  if (Array.isArray(ret)) {
    // mysql2/promise인 경우 rows가 ret[0]에 "배열"로 들어옴
    if (Array.isArray(ret[0])) return ret[0];
    // mariadb인 경우 ret 자체가 행 배열
    return ret;
  }
  // 혹시 객체가 온 경우 (OK 패킷 등)
  return [];
}

// UPDATE 결과도 드라이버별로 다름:
// - mysql2/promise: [OkPacket, fields] => OkPacket = ret[0]
// - mariadb: result:Object             => result = ret
function getResult(ret) {
  if (Array.isArray(ret)) {
    return ret[0]; // OkPacket
  }
  return ret; // result object
}

//목록
async function organizationList() {
  const conn = await pool.getConnection();
  try {
    const ret = await conn.query(orgSQL.organizationList);
    const rows = getRows(ret);
    return rows; // 반드시 배열
  } finally {
    conn.release();
  }
}

//수정
async function organizationUpdate({
  org_name,
  address,
  org_phone,
  start_date,
  end_date,
  status,
  org_code,
}) {
  const conn = await pool.getConnection();
  try {
    const params = [
      org_name,
      address ?? null,
      org_phone ?? null,
      start_date ?? null,
      end_date ?? null,
      status,
      org_code,
    ];
    const ret = await conn.query(orgSQL.organizationUpdate, params);
    const result = Array.isArray(ret) ? ret[0] : ret;
    return result;
  } finally {
    conn.release();
  }
}

// 삭제
function getResult(ret) {
  if (Array.isArray(ret)) return ret[0];
  return ret;
}

async function organizationDelete(org_code) {
  const conn = await pool.getConnection();
  try {
    const ret = await conn.query(orgSQL.organizationDelete, [org_code]);
    const result = getResult(ret); // affectedRows 포함
    return result;
  } finally {
    conn.release();
  }
}

//추가
async function organizationInsert({
  org_name,
  org_phone,
  address,
  start_date,
  end_date,
  status,
}) {
  const conn = await pool.getConnection();
  try {
    const params = [
      org_name,
      org_phone ?? null,
      address ?? null,
      start_date ?? null,
      end_date ?? null,
      status,
    ];
    const ret = await conn.query(orgSQL.organizationInsert, params);
    const result = Array.isArray(ret) ? ret[0] : ret;
    return result;
  } finally {
    conn.release();
  }
}

module.exports = {
  organizationList,
  organizationUpdate,
  organizationDelete,
  organizationInsert,
};
