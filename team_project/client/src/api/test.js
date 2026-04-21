import axios from 'axios';

export const testBackend = async () => {
  try {
    const res = await axios.get('/api/test');
    console.log('[ test.js || testBackend 성공 ]', res.data);
  } catch (err) {
    console.error('[ test.js || testBackend 실패 ]', err);
  }
};
