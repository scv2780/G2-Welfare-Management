async function fakeSendSms(to, text) {
  console.log(`[fakeSendSms: ${to}, ${text}]`);
  return { ok: true, to, text };
}

// 테스트
let sendSms;
const TEST_SMS = false;

if (TEST_SMS) {
  sendSms = fakeSendSms;
} else {
  const { SolapiMessageService } = require('solapi');
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const client = new SolapiMessageService(apiKey, apiSecret);

  sendSms = async (to, text) => {
    try {
      const result = await client.sendOne({
        to,
        from: process.env.SOLAPI_FROM,
        text,
      });

      return { ok: true, result };
    } catch (error) {
      console.error('[ Solapi v5 Error ]', error);
      return { ok: false, error };
    }
  };
}

module.exports = { sendSms };
