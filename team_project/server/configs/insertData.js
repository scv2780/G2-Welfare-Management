const INSERT_DATA = [
  'org_code',
  'userId',
  'hashedPw',
  'role',
  'name',
  'ssn',
  'phone',
  'address',
  'email',
  'department',
  'is_active',
  'login_fail_count',
  'joinDate',
  'ssn_iv',
];

const INSERT_CHILD_DATA = [
  'user_code',
  'child_name',
  'ssn',
  'gender',
  'disability_type',
  'registered_date',
  'ssn_iv',
];

module.exports = { INSERT_DATA, INSERT_CHILD_DATA };
