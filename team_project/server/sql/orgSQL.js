// orgSQL.js
const organizationList = `
  SELECT org_code
    ,org_name
    ,address
    ,org_phone
    ,start_date
    ,end_date
    ,status
  FROM organization
  ORDER BY org_code DESC
`;

const organizationUpdate = `
  UPDATE organization
    SET org_name = ?
      , address  = ?
      , org_phone= ?
      , start_date = ?
      , end_date   = ?
      , status   = ?
  WHERE org_code = ?
`;

const organizationDelete = `
  DELETE FROM organization WHERE org_code=?
`;

const organizationInsert = `
  INSERT INTO organization 
  (org_name
  ,org_phone
  ,address
  ,start_date
  ,end_date
  ,status)
  VALUES (?, ?, ?, ?, ?, ?)
`;

module.exports = {
  organizationList,
  organizationUpdate,
  organizationDelete,
  organizationInsert,
};
