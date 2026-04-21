// team_project/server/utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: Number(process.env.MAIL_PORT) === 465, // 465면 true, 그 외는 false
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * 반려 메일 보내기
 * @param {Object} param0
 * @param {string} param0.to        수신자 메일
 * @param {string} param0.name      수신자 이름
 * @param {string} param0.approvalCode 승인코드
 * @param {string} param0.reason    반려 사유
 */
async function sendRejectMail({ to, name, approvalCode, reason }) {
  const subject = `[반려 안내] 기관 관리자 승인 요청 반려`;

  const text = `
${name}님,

요청하신 기관 관리자 승인 요청이 반려되었습니다.

승인코드: ${approvalCode}

반려 사유:
${reason || "(사유 미입력)"}
`;

  const html = `
<p>${name}님,</p>
<p>요청하신 <b>기관 관리자 승인 요청</b>이 <span style="color:#d00;">반려</span>되었습니다.</p>
<p><b>승인코드:</b> ${approvalCode}</p>
<p><b>반려 사유:</b></p>
<p style="white-space:pre-line;border:1px solid #ddd;padding:8px;border-radius:4px;">
${(reason || "(사유 미입력)").replace(/</g, "&lt;")}
</p>
<p>문의가 필요하신 경우 담당자에게 연락해 주세요.</p>
`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

/**
 * ✅ 승인 메일 보내기
 */
async function sendApproveMail({ to, name, approvalCode }) {
  const subject = `[승인 완료] 기관 관리자 승인 요청 승인`;

  const text = `
${name}님,

요청하신 기관 관리자 승인 요청이 승인되었습니다.

승인코드: ${approvalCode}

이제 기관 관리자 권한으로 시스템을 이용하실 수 있습니다.
`;

  const html = `
<p>${name}님,</p>
<p>요청하신 <b>기관 관리자 승인 요청</b>이 <span style="color:#0a0;">승인</span>되었습니다.</p>
<p><b>승인코드:</b> ${approvalCode}</p>
<p>이제 기관 관리자 권한으로 시스템을 이용하실 수 있습니다.</p>
<p>추가 문의사항이 있으시면 담당자에게 연락해 주세요.</p>
`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

/* =========================
   ✅ 기관 담당자용 메일 함수
   ========================= */

/**
 * 기관 담당자 승인 메일
 */
async function sendStaffApproveMail({ to, name, approvalCode }) {
  const subject = `[승인 완료] 기관 담당자 승인 완료`;

  const text = `
${name}님,

요청하신 기관 담당자 승인 요청이 승인되었습니다.

승인코드: ${approvalCode}

이제 기관 담당자 권한으로 시스템을 이용하실 수 있습니다.
`;

  const html = `
<p>${name}님,</p>
<p>요청하신 <b>기관 담당자 승인 요청</b>이 <span style="color:#0a0;">승인</span>되었습니다.</p>
<p><b>승인코드:</b> ${approvalCode}</p>
<p>이제 기관 담당자 권한으로 서비스를 이용하실 수 있습니다.</p>
`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

/**
 * 기관 담당자 반려 메일
 */
async function sendStaffRejectMail({ to, name, approvalCode, reason }) {
  const subject = `[반려 안내] 기관 담당자 승인 요청 반려`;

  const text = `
${name}님,

요청하신 기관 담당자 승인 요청이 반려되었습니다.

승인코드: ${approvalCode}

반려 사유:
${reason || "(사유 미입력)"}
`;

  const html = `
<p>${name}님,</p>
<p>요청하신 <b>기관 담당자 승인 요청</b>이 <span style="color:#d00;">반려</span>되었습니다.</p>
<p><b>승인코드:</b> ${approvalCode}</p>
<p><b>반려 사유:</b></p>
<p style="white-space:pre-line;border:1px solid #ddd;padding:8px;border-radius:4px;">
${(reason || "(사유 미입력)").replace(/</g, "&lt;")}
</p>
<p>문의가 필요하신 경우 담당자에게 연락해 주세요.</p>
`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendRejectMail,
  sendApproveMail,
  sendStaffApproveMail,
  sendStaffRejectMail,
};
