const {
  childAdd,
  findInfo,
  pwUpdate,
  deleteUserService,
} = require('./services/userInfoService');
const { addOrg } = require('./services/signUserService');
const { decryptSsn } = require('./utils/ssnCrypto');

async function testUser() {
  console.log('----------------------------------------------------');
  const testUser = {
    userId: 'test123',
    userPw: 'songsil12!',
    agree: true,
    joinDate: '2025-11-27',
    name: 'test123',
    ssn: '111111-2222222',
    phone: '111-1111-1111',
    isPhoneVerified: true,
    address: 'addtest',
    email: 'seung01@test.com',
    org_name: '대구행복복지센터',
    department: 'test',
    role: 'AA4',
  };

  // const testUser = {
  //   user_code: 32,
  //   registered_date: '2025-11-25',
  //   child_name: 'test자녀01',
  //   ssn: '111111-2222222',
  //   gender: 'AC1',
  //   disability_type: '장애유형테스트',
  // };

  // const testUser = { userId: 'test01', role: 'AA1' };

  // const testUser = {
  //   user_code: 33,
  //   user_pw: '1234',
  //   newPw: '123',
  // };

  // const testUser = { user_id: 'test01', password: 'songsil12!' };

  const result = await addOrg(testUser);
  console.log(result);

  return;
}

testUser();
