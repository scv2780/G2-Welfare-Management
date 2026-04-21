// team_project/server/sql/historySQL.js

// 목록 조회용 기본 SELECT
const historyListBase = `
  SELECT
      h.record_code,
      h.table_name,
      h.change_item,
      h.before_change,
      h.after_change,
      h.revision_date,
      h.table_pk,
      h.modifier,            -- user_code
      u.user_id    AS modifier_id,
      u.name       AS modifier_name,
      u.role       AS modifier_role,   -- 🔹 추가: 수정자 권한 코드
      org.org_name AS org_name,
      h.history_type AS type_code      -- BD1~BD8 (이력 유형)
  FROM history h
  LEFT JOIN users u
    ON u.user_code = h.modifier
  LEFT JOIN organization org
    ON org.org_code = u.org_code
  WHERE 1=1
    -- 🔹 변경 전 값이 없는(= 생성만 기록된) 이력은 제외
    AND h.before_change IS NOT NULL
    AND h.before_change <> ''
`;

// 카운트용 기본 SELECT
const historyCountBase = `
  SELECT
      COUNT(*) AS totalCount
  FROM history h
  LEFT JOIN users u
    ON u.user_code = h.modifier      -- ✅ user_code 기준 FK
  LEFT JOIN organization org
    ON org.org_code = u.org_code
  WHERE 1=1
    -- 🔹 목록과 동일하게, 변경 전 값이 없는 이력은 카운트에서도 제외
    AND h.before_change IS NOT NULL
    AND h.before_change <> ''
`;

const historyOrderByLatest = `
  ORDER BY h.revision_date DESC, h.record_code DESC
  LIMIT ?, ?
`;

const historyOrderByOldest = `
  ORDER BY h.revision_date ASC, h.record_code ASC
  LIMIT ?, ?
`;

const insertHistory = `
    INSERT INTO history (
      table_name,
      change_item,
      before_change,
      after_change,
      revision_date,
      modifier,
      table_pk,
      history_type
    ) VALUES (
      ?, ?, ?, ?, NOW(), ?, ?, ?
    )
  `;

module.exports = {
  historyListBase,
  historyCountBase,
  historyOrderByLatest,
  historyOrderByOldest,
  insertHistory,
};
