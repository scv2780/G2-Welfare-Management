// team_project/server/mappers/managerMapper.js

const pool = require("../configs/db");
const managerSQL = require("../sql/managerSQL");

function rowsFrom(ret) {
  if (Array.isArray(ret) && Array.isArray(ret[0])) return ret[0];
  return ret;
}

// 담당자 간단 목록
async function simpleManagerList({ orgCode, loginId }) {
  const conn = await pool.getConnection();
  try {
    let query = "";
    let params = [];

    if (orgCode) {
      query = managerSQL.managerSimpleListByOrgCodeSql;
      params = [orgCode];
    } else if (loginId) {
      query = managerSQL.managerSimpleListByLoginIdSql;
      params = [loginId];
    } else {
      // 둘 다 없으면 그냥 빈 배열 리턴
      return [];
    }

    const ret = await conn.query(query, params);
    return rowsFrom(ret);
  } finally {
    conn.release();
  }
}

module.exports = {
  simpleManagerList,
};
