const FIND_ID = `
SELECT user_id
FROM users
WHERE user_id = ?`;

const AUTH_LOGIN = `
  SELECT 
    name
    , user_code
    , org_code
    , user_id
    , role
    , is_active
    , password_hash
    , delete_status
  FROM users
  WHERE user_id = ?`;

const INSERT_USER = `
  INSERT INTO users (
    org_code
    , user_id
    , password_hash
    , role
    , name
    , ssn
    , phone
    , address
    , email
    , department
    , is_active
    , login_fail_count
    , join_date
    , ssn_iv
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const FIND_ORG_LIST = `
SELECT org_name FROM organization`;

const REQUEST_USER = `
INSERT INTO request_approval(
	requester_code
  , approval_type
  , request_date
  , state
) VALUES(?, ?, ?, ?)`;

const FIND_ORG_CODE = `
  SELECT org_code
  FROM organization
  WHERE org_name = ?
`;

const SEARCH_ORG = `
  SELECT org_name
  FROM organization
  WHERE org_name LIKE CONCAT('%', ?, '%')
  LIMIT 10
`;

const FIND_USER_ID = `
SELECT user_id
FROM users
WHERE name = ?
AND phone = ?`;

const FIND_USER_PW = `
SELECT password_hash
FROM users
WHERE user_id = ?
AND name = ?
AND phone = ?`;

const FIND_RESET_PW = `
UPDATE users
SET password_hash = ?
WHERE user_id = ?`;

module.exports = {
  FIND_ID,
  AUTH_LOGIN,
  INSERT_USER,
  FIND_ORG_LIST,
  REQUEST_USER,
  FIND_ORG_CODE,
  SEARCH_ORG,
  FIND_USER_ID,
  FIND_USER_PW,
  FIND_RESET_PW,
};
