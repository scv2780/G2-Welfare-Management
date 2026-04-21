const FIND_USER_INFO = `
SELECT 
   u.user_id,
   u.name,
   u.phone,
   u.address AS user_address,
   u.email,
   o.org_code,
   o.org_name,
   u.manager_code,
   o.org_phone,
   o.address AS org_address,
   c.child_code,
   c.child_name,
   c.ssn,
   c.gender,
   c.disability_type,
   c.ssn_iv
FROM users u
LEFT JOIN organization o
       ON u.org_code = o.org_code
LEFT JOIN child c
       ON u.user_code = c.user_code
WHERE u.user_id = ?
ORDER BY c.child_code ASC`;

const FIND_ORG_INFO = `
SELECT u.user_id
   , u.name
   , u.phone
   , u.address AS user_address
   , u.email
   , o.org_code
   , o.org_name
   , u.department
   , u.role
   , o.org_phone
   , o.address AS org_address
FROM users u
LEFT JOIN organization o
	   ON u.org_code = o.org_code
	WHERE u.user_id = ?`;

const USER_UPDATE = `
UPDATE users
SET 
	name = ?
   , phone = ?
   , address = ?
   , email = ?
WHERE user_id = ?`;

const FIND_USER_PW = `
SELECT
	password_hash
FROM users
WHERE user_code = ?`;

const FIND_USER_PW_FOR_ID = `
SELECT
	password_hash
FROM users
WHERE user_id = ?`;

const USER_UPDATE_PW = `
UPDATE users
SET password_hash = ?
WHERE user_code = ?`;

const ORG_UPDATE = `
UPDATE users u
INNER JOIN organization o ON o.org_name = ?
SET
	u.org_code = o.org_code
	, u.department = ?
WHERE u.user_id = ?`;

const CHILD_UPDATE = `
UPDATE child
SET 
   child_name = ?
	, ssn = ?
   , gender = ?
   , disability_type = ?
   , ssn_iv = ?
WHERE child_code = ?`;

const CHILD_ADD = `
INSERT INTO child(
   user_code
   , child_name
   , ssn
   , gender
   , disability_type
   , registered_date
   , ssn_iv
) VALUES(?, ?, ?, ?, ?, ?, ?)`;

const CHILD_DELETE = `
DELETE FROM child
WHERE child_code = ?;
`;

const DELETE_USER = `
UPDATE users
SET
   delete_status = 1
WHERE user_id = ?`;

module.exports = {
  FIND_USER_INFO,
  FIND_ORG_INFO,
  USER_UPDATE,
  FIND_USER_PW,
  FIND_USER_PW_FOR_ID,
  USER_UPDATE_PW,
  ORG_UPDATE,
  CHILD_UPDATE,
  CHILD_ADD,
  CHILD_DELETE,
  DELETE_USER,
};
