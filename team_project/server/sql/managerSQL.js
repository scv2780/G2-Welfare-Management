// team_project/server/sql/managerSQL.js

// org_code 직접 받는 버전
const managerSimpleListByOrgCodeSql = `
  SELECT
    user_code,
    name
  FROM users
  WHERE org_code = ?
    AND role = 'AA2'     -- 기관 담당자
    AND is_active = 1    -- ✅ 활성 회원만
  ORDER BY name ASC
`;

// 로그인 아이디로 기관 코드 찾아서 그 기관 담당자 조회
const managerSimpleListByLoginIdSql = `
  SELECT
    u2.user_code,
    u2.name
  FROM users u2
  WHERE u2.org_code = (
    SELECT u.org_code
    FROM users u
    WHERE u.user_id = ?
    LIMIT 1
  )
    AND u2.role = 'AA2'   -- 기관 담당자
    AND u2.is_active = 1  -- ✅ 활성 회원만
  ORDER BY u2.name ASC
`;

module.exports = {
  managerSimpleListByOrgCodeSql,
  managerSimpleListByLoginIdSql,
};
