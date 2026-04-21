// team_project/server/mappers/historyMapper.js

const pool = require("../configs/db.js");
const historySQL = require("../sql/historySQL");

function rowsFrom(ret) {
  if (Array.isArray(ret) && Array.isArray(ret[0])) return ret[0];
  return ret;
}

async function historyList({
  searchField,
  keyword,
  orderBy,
  typeCode,
  orgCode,
  managerCode,
  loginId,
  role,
  page,
  size,
}) {
  const conn = await pool.getConnection();
  try {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const sizeNum = Number(size) > 0 ? Number(size) : 20;
    const offset = (pageNum - 1) * sizeNum;

    const whereClauses = [];
    const params = [];

    // 🔹 이력 유형(BD1~BD8) 필터 - history.history_type 사용
    if (typeCode) {
      whereClauses.push(`h.history_type = ?`);
      params.push(typeCode);
    }
    // 🔹 권한별 기관/담당자 필터
    if (role === "AA4") {
      // 시스템 관리자 : orgCode 선택 시만 기관 필터
      if (orgCode) {
        whereClauses.push("org.org_code = ?");
        params.push(orgCode);
      }
    } else if (role === "AA3") {
      // 기관 관리자 : 본인 기관
      if (loginId) {
        whereClauses.push(`
          org.org_code = (
            SELECT u2.org_code
            FROM users u2
            WHERE u2.user_id = ?
            LIMIT 1
          )
        `);
        params.push(loginId);
      }

      // 담당자 필터: users.user_code 기준
      if (managerCode) {
        whereClauses.push("u.user_code = ?");
        params.push(managerCode);
        // ⚠️ 프론트에서 managerCode 를 user_code 로 내려줘야 함
      }
    }

    // 🔹 검색(검색조건 + keyword)
    if (keyword) {
      if (searchField === "revision_date") {
        // 예: 2025-11-20, 2025-11, 11-20 등 문자열로 검색
        whereClauses.push(`
      DATE_FORMAT(h.revision_date, '%Y-%m-%d %H:%i:%s')
      LIKE CONCAT('%', ?, '%')
    `);
        params.push(keyword);
      } else if (searchField === "modifier_name") {
        whereClauses.push("u.name LIKE CONCAT('%', ?, '%')");
        params.push(keyword);
      } else {
        // 전체: 수정일시 + 수정자 둘 다 대상으로 검색
        whereClauses.push(`
      (
        DATE_FORMAT(h.revision_date, '%Y-%m-%d %H:%i:%s') LIKE CONCAT('%', ?, '%')
        OR u.name LIKE CONCAT('%', ?, '%')
      )
    `);
        params.push(keyword, keyword);
      }
    }
    let whereSql = "";
    if (whereClauses.length > 0) {
      whereSql = " AND " + whereClauses.join(" AND ");
    }

    const orderSql =
      orderBy === "oldest"
        ? historySQL.historyOrderByOldest
        : historySQL.historyOrderByLatest;

    // 목록 조회
    const listSql = historySQL.historyListBase + whereSql + orderSql;
    const listParams = [...params, offset, sizeNum];

    const retRows = await conn.query(listSql, listParams);
    const rows = rowsFrom(retRows);

    // 총 개수 조회
    const countSql = historySQL.historyCountBase + whereSql;
    const retCount = await conn.query(countSql, params);
    const countRows = rowsFrom(retCount);
    const totalCount = countRows[0]?.totalCount || 0;

    console.log(
      "[historyMapper] historyList rows:",
      rows.length,
      "| searchField:",
      searchField,
      "| keyword:",
      keyword,
      "| typeCode:",
      typeCode,
      "| role:",
      role,
      "| loginId:",
      loginId,
      "| orgCode:",
      orgCode,
      "| managerCode:",
      managerCode,
      "| page:",
      pageNum,
      "| size:",
      sizeNum,
      "| totalCount:",
      totalCount
    );

    return {
      list: rows,
      totalCount,
      page: pageNum,
      size: sizeNum,
    };
  } finally {
    conn.release();
  }
}

module.exports = {
  historyList,
};
