// server/utils/historyUtil.js
const historySql = require("../sql/historySQL");

/**
 * 단일 컬럼 히스토리 한 줄 INSERT
 */
async function writeFieldHistory(
  conn,
  {
    tableName,
    tablePk,
    modifier,
    historyType = "UPDATE",
    field, // change_item
    beforeValue,
    afterValue,
  }
) {
  if (beforeValue == null && afterValue == null) return;

  const beforeStr = beforeValue == null ? "" : String(beforeValue);
  const afterStr = afterValue == null ? "" : String(afterValue);

  if (beforeStr === afterStr) return;

  await conn.query(historySql.insertHistory, [
    tableName,
    field,
    beforeStr,
    afterStr,
    modifier || null,
    tablePk,
    historyType,
  ]);
}

/**
 * 여러 컬럼 비교해서 바뀐 것만 히스토리에 INSERT
 *
 * @param {object} options
 *  - tableName: 'support_result' 등
 *  - tablePk: PK 값 (result_code, plan_code ...)
 *  - modifier: 수정한 사용자 코드
 *  - historyType: 'UPDATE' 등
 *  - beforeRow: 수정 전 값 객체
 *  - afterRow: 수정 후 값 객체
 *  - fields: ['actual_from', 'actual_to', 'goal', ...]
 */
async function logHistoryDiff(
  conn,
  {
    tableName,
    tablePk,
    modifier,
    historyType = "UPDATE",
    beforeRow = {},
    afterRow = {},
    fields = [],
  }
) {
  for (const f of fields) {
    await writeFieldHistory(conn, {
      conn,
      tableName,
      tablePk,
      modifier,
      historyType,
      field: f,
      beforeValue: beforeRow[f],
      afterValue: afterRow[f],
    });
  }
}

module.exports = {
  logHistoryDiff,
};
