const code = {};

function makeCode(phone, serverCode) {
  code[phone] = { serverCode, verified: false };
}

function verifiedCode(phone, inputCode) {
  const verified = code[phone];

  if (!verified) {
    return false;
  }
  if (verified.serverCode != inputCode) {
    return false;
  }

  verified.verified = true;
  return true;
}

function isVerified(phone) {
  return code[phone]?.verified == true;
}

module.exports = { makeCode, verifiedCode, isVerified };
