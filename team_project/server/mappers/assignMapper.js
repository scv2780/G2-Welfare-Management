// server/mappers/assignMapper.js
const pool = require("../configs/db");
const sql = require("../sql/assignSql");

module.exports = {
  async assignManager(submitCode, assignee) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // assi_by + status = 'CA3'
      await conn.query(sql.updateAssignee, [assignee, submitCode]);

      // 기존처럼 상담 기록은 CB2로 남김
      await conn.query(sql.insertCounselNote, [submitCode, "CB2"]);

      await conn.commit();

      return { submitCode, assignee, status: "CA3" };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },
};
