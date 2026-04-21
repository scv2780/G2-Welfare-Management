function createUser(userData, list = {}) {
  const {
    orgCode = null,
    hashedPw = null,
    ssn = null,
    ssn_iv = null,
    isActive = 1,
    department = null,
  } = list;

  return {
    org_code: orgCode,
    userId: userData.userId,
    hashedPw,
    role: userData.role,
    name: userData.name,
    ssn,
    ssn_iv,
    phone: userData.phone,
    address: userData.address,
    email: userData.email,
    department,
    is_active: isActive,
    login_fail_count: 0,
    joinDate: userData.joinDate,
  };
}

function createChild(data, enc) {
  return {
    user_code: data.user_code,
    child_name: data.child_name,
    ssn: enc.ssn,
    gender: data.gender,
    disability_type: data.disability_type,
    registered_date: data.registered_date,
    ssn_iv: enc.ssn_iv,
  };
}

module.exports = { createUser, createChild };
