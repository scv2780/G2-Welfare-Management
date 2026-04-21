// server/sql/surveySql.js
module.exports = {
  // 조사지 버전 목록
  listTemplates: `
    SELECT
      stv.template_ver_code,
      stv.template_code,
      stv.version_detail_no,
      stv.is_current,
      stv.effective_from,
      stv.effective_to,
      st.version_no,
      st.status,
      st.created_by,
      stv.created_at
    FROM survey_template_ver stv
    JOIN survey_template st
      ON st.template_code = stv.template_code
    ORDER BY stv.template_ver_code DESC
  `,

  // 현재 가장 높은 버전 조회
  getLatestVersionNo: `
    SELECT version_no
    FROM survey_template
    ORDER BY CAST(version_no AS DECIMAL(4,1)) DESC
    LIMIT 1
  `,

  // 조사지 등록
  insertTemplate: `
    INSERT INTO survey_template (
      version_no, status, created_by, created_at
    ) VALUES (?, ?, ?, ?)
  `,

  insertTemplateVer: `
    INSERT INTO survey_template_ver (
      template_code, version_detail_no, effective_from,
      effective_to, is_current, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,

  insertSection: `
    INSERT INTO survey_section (
      template_ver_code, section_title, section_desc
    ) VALUES (?, ?, ?)
  `,

  insertSubsection: `
    INSERT INTO survey_subsection (
      section_code, subsection_title, subsection_desc
    ) VALUES (?, ?, ?)
  `,

  insertItem: `
    INSERT INTO survey_item (
      subsection_code, question_type, question_text,
      is_required, option_values
    ) VALUES (?, ?, ?, ?, ?)
  `,

  //최근 조사지
  getLatestTemplateVer: `
    SELECT
      stv.template_ver_code,
      stv.template_code,
      stv.version_detail_no,
      st.version_no,
      st.status,
      st.created_at
    FROM survey_template_ver stv
    JOIN survey_template st
      ON st.template_code = stv.template_code
    WHERE stv.is_current = 'Y'
    ORDER BY stv.template_ver_code DESC
    LIMIT 1
  `,

  getSectionsByVer: `
    SELECT
      section_code,
      section_title,
      section_desc
    FROM survey_section
    WHERE template_ver_code = ?
    ORDER BY section_code
  `,

  getSubsectionsByVer: `
    SELECT
      subsection_code,
      section_code,
      subsection_title,
      subsection_desc
    FROM survey_subsection
    WHERE section_code IN (
      SELECT section_code FROM survey_section WHERE template_ver_code = ?
    )
    ORDER BY subsection_code
  `,

  getItemsByVer: `
    SELECT
      item_code,
      subsection_code,
      question_type,
      question_text,
      is_required,
      option_values
    FROM survey_item
    WHERE subsection_code IN (
      SELECT subsection_code FROM survey_subsection
      WHERE section_code IN (
        SELECT section_code FROM survey_section WHERE template_ver_code = ?
      )
    )
    ORDER BY item_code
  `,

  // 답변 저장
  insertSubmission: `
    INSERT INTO survey_submission (
      template_ver_code, submit_at, updated_at,
      written_by, status, app_at,
      child_code  
    ) VALUES (?, ?, ?, ?, ?, ?,?)
  `,

  insertAnswer: `
    INSERT INTO survey_answer (
      item_code, submit_code, answer_text, created_at
    ) VALUES (?, ?, ?, ?)
  `,

  // 세부버전 올리기
  getNextDetailVersion: `
    SELECT
      CASE
        WHEN MAX(CAST(stv.version_detail_no AS DECIMAL(5,1))) IS NULL
             OR MAX(CAST(stv.version_detail_no AS DECIMAL(5,1))) < CAST(st.version_no AS DECIMAL(5,1))
          THEN CAST(st.version_no AS DECIMAL(5,1)) + 0.1
        ELSE ROUND(MAX(CAST(stv.version_detail_no AS DECIMAL(5,1))) + 0.1, 1)
      END AS next_detail
    FROM survey_template st
    LEFT JOIN survey_template_ver stv
      ON st.template_code = stv.template_code
    WHERE st.template_code = ?
  `,
  // 제출본 - 일반
  listSubmissionsByWriter: `
  SELECT
    ss.submit_code,
    ss.template_ver_code,
    ss.submit_at,
    ss.updated_at,
    ss.written_by,
    w.name  AS writer_name,
    c.child_name AS child_name,     -- ⭐ 추가됨!!
    ss.assi_by,
    a.name  AS assignee_name,
    ss.app_by,
    ss.status,
    stv.template_code,
    stv.version_detail_no,
    st.version_no,
    org.org_name
  FROM survey_submission ss
  JOIN survey_template_ver stv ON stv.template_ver_code = ss.template_ver_code
  JOIN survey_template      st  ON st.template_code      = stv.template_code
  LEFT JOIN users           w   ON w.user_code           = ss.written_by
  LEFT JOIN users           a   ON a.user_code           = ss.assi_by
  LEFT JOIN organization    org ON org.org_code          = w.org_code
  LEFT JOIN child           c   ON c.child_code          = ss.child_code   -- ⭐ 추가!
  WHERE ss.written_by = ?
  ORDER BY ss.submit_at DESC, ss.submit_code DESC
`,

  // 제출본 - 담당
  listSubmissionsByAssignee: `
    SELECT
      ss.submit_code,
      ss.template_ver_code,
      ss.submit_at,
      ss.updated_at,
      ss.written_by,
      w.name  AS writer_name,
      c.child_name AS child_name,   -- ✅ 지원자(자녀) 이름
      ss.assi_by,
      a.name  AS assignee_name,
      ss.app_by,
      ss.status,
      stv.template_code,
      stv.version_detail_no,
      st.version_no,
      org.org_name
    FROM survey_submission ss
    JOIN survey_template_ver stv ON stv.template_ver_code = ss.template_ver_code
    JOIN survey_template      st  ON st.template_code      = stv.template_code
    LEFT JOIN users           w   ON w.user_code           = ss.written_by
    LEFT JOIN users           a   ON a.user_code           = ss.assi_by
    LEFT JOIN organization    org ON org.org_code          = w.org_code
    LEFT JOIN child           c   ON c.child_code          = ss.child_code   -- ✅ 추가
    WHERE ss.assi_by = ?
    ORDER BY ss.submit_at DESC, ss.submit_code DESC
  `,

  // 제출본 - 관리자
  listSubmissionsByOrg: `
    SELECT
      ss.submit_code,
      ss.template_ver_code,
      ss.submit_at,
      ss.updated_at,
      ss.written_by,
      w.name  AS writer_name,
      c.child_name AS child_name,   -- ✅ 지원자(자녀) 이름
      ss.assi_by,
      a.name  AS assignee_name,
      ss.app_by,
      ss.status,
      stv.template_code,
      stv.version_detail_no,
      st.version_no,
      org.org_name
    FROM survey_submission ss
    JOIN survey_template_ver stv ON stv.template_ver_code = ss.template_ver_code
    JOIN survey_template      st  ON st.template_code      = stv.template_code
    LEFT JOIN users           w   ON w.user_code           = ss.written_by
    LEFT JOIN users           a   ON a.user_code           = ss.assi_by
    LEFT JOIN organization    org ON org.org_code          = w.org_code
    LEFT JOIN child           c   ON c.child_code          = ss.child_code   -- ✅ 추가
    WHERE w.org_code = ?
    ORDER BY ss.submit_at DESC, ss.submit_code DESC
  `,

  // 시스템: 전체
  listAllSubmissions: `
    SELECT
      ss.submit_code,
      ss.template_ver_code,
      ss.submit_at,
      ss.updated_at,
      ss.written_by,
      w.name  AS writer_name,
      c.child_name AS child_name,   -- ✅ 지원자(자녀) 이름
      ss.assi_by,
      a.name  AS assignee_name,
      ss.app_by,
      ss.status,
      stv.template_code,
      stv.version_detail_no,
      st.version_no,
      org.org_name
    FROM survey_submission ss
    JOIN survey_template_ver stv ON stv.template_ver_code = ss.template_ver_code
    JOIN survey_template      st  ON st.template_code      = stv.template_code
    LEFT JOIN users           w   ON w.user_code           = ss.written_by
    LEFT JOIN users           a   ON a.user_code           = ss.assi_by
    LEFT JOIN organization    org ON org.org_code          = w.org_code
    LEFT JOIN child           c   ON c.child_code          = ss.child_code   -- ✅ 추가
    ORDER BY ss.submit_at DESC, ss.submit_code DESC
  `,

  // 🔹 관리자용 org_code 조회
  getUserOrgByUserCode: `
    SELECT org_code
    FROM users
    WHERE user_code = ?
    LIMIT 1
  `,

  // 제출본 헤더 (작성자/담당자/지원자 + 장애유형 포함)
  getSubmissionHeaderBySubmit: `
  SELECT
    ss.submit_code,
    ss.template_ver_code,
    ss.submit_at,
    ss.updated_at,
    ss.status,

    -- 보호자(작성자)
    ss.written_by,
    w.name AS written_by_name,

    -- 담당자
    ss.assi_by,
    a.name AS assignee_name,

    -- 지원자(자녀) + 장애유형
    ss.child_code,
    c.child_name,
    COALESCE(c.disability_type, w.disability_type) AS disability_type,

    -- 조사지/버전 정보
    stv.template_code,
    stv.version_detail_no,
    st.version_no,

    -- 기관명 
    org.org_name
  FROM survey_submission ss
  JOIN survey_template_ver stv
    ON stv.template_ver_code = ss.template_ver_code
  JOIN survey_template st
    ON st.template_code = stv.template_code
  LEFT JOIN users w
    ON w.user_code = ss.written_by
  LEFT JOIN users a
    ON a.user_code = ss.assi_by
  LEFT JOIN organization org
    ON org.org_code = w.org_code
  LEFT JOIN child c
    ON c.child_code = ss.child_code
  WHERE ss.submit_code = ?
`,

  // 제출본 답변
  getAnswersBySubmit: `
  SELECT item_code, answer_text
  FROM survey_answer
  WHERE submit_code = ?
`,

  // 제출본 답변 삭제
  deleteAnswersBySubmit: `
  DELETE FROM survey_answer WHERE submit_code = ?
`,

  // 제출본 수정시간 갱신
  updateSubmissionUpdatedAt: `
  UPDATE survey_submission SET updated_at = ? WHERE submit_code = ?
`,

  // 모든 현재버전 비활성화 (새 메이저 템플릿 생성 시 사용)
  deactivateAllCurrentVersions: `
  UPDATE survey_template_ver
  SET is_current = 'N', effective_to = NOW()
  WHERE is_current = 'Y'
`,

  // 특정 세부버전(template_ver_code)로 헤더 조회 (정확한 버전 고정)
  getTemplateVerByVerCode: `
  SELECT
    stv.template_ver_code,
    stv.template_code,
    stv.version_detail_no,
    st.version_no,
    st.status,
    st.created_at
  FROM survey_template_ver stv
  JOIN survey_template st
    ON st.template_code = stv.template_code
  WHERE stv.template_ver_code = ?
  LIMIT 1
`,
  // 자녀 연결
  listChildrenByUser: `
    SELECT
      child_code AS code,      -- 프론트에서 person.code 로 사용
      child_name AS name       -- 프론트에서 person.name 로 사용
    FROM child
    WHERE user_code = ?
    ORDER BY child_name
  `,

  // 사용자 장애 유형 업데이트
  updateUserDisabilityType: `
    UPDATE users
    SET disability_type = ?
    WHERE user_code = ?
  `,

  // 사용자 장애 유형 단건 조회
  getUserDisabilityType: `
    SELECT disability_type
    FROM users
    WHERE user_code = ?
    LIMIT 1
  `,
};
