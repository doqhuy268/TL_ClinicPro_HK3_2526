import { NextResponse } from 'next/server';
import { Resend } from 'resend';

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;

export async function POST(request: Request) {
  if (!resendApiKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_RESEND_API_KEY' },
      { status: 500 }
    );
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch (err) {
    console.error('Invalid JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, phone, subject, message } = payload;

  if (!name || !email || !subject || !message) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const resend = new Resend(resendApiKey);

  const html = `
<!doctype html>
<html lang="vi" dir="ltr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <!-- Độ rộng cố định cho mobile -->
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <!-- Preheader (ẩn) -->
    <style>
      .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; }
      /* Mobile tweak (đa số client hỗ trợ, Outlook Windows bỏ qua nhưng vẫn đẹp) */
      @media (max-width:600px){
        .container{ width:100% !important; }
        .px-24{ padding-left:16px !important; padding-right:16px !important; }
        .grid td{ display:block !important; width:100% !important; }
        .card{ border-radius:12px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;">
    <span class="preheader">Liên hệ mới từ ${escapeHtml(name)} — ${escapeHtml(subject)}</span>

    <!-- Wrapper -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f4f6;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <!-- Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" class="container" style="width:640px;max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.05);">
            <!-- Header -->
            <tr>
              <td style="padding:16px 20px;background:#0F766E;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td valign="middle" style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#fff;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" valign="middle" style="width:28px;height:28px;background:rgba(255,255,255,.18);border-radius:8px;font-weight:700;font-size:14px;line-height:28px;text-align:center;">R</td>
                          <td style="width:10px;"></td>
                          <td style="font-size:16px;font-weight:600;letter-spacing:.2px;">ClinicPro — Liên hệ mới</td>
                        </tr>
                      </table>
                    </td>
                    <!-- (tuỳ chọn) thêm logo bên phải -->
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="px-24" style="padding:22px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#111827;">
                <h2 style="margin:0 0 12px;font-size:18px;line-height:1.45;">Thông tin liên hệ</h2>

                <!-- Grid info -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="grid">
                  <tr>
                    <td style="padding:6px 0;vertical-align:top;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Họ và tên</div>
                      <div style="font-size:14px;font-weight:600;">${escapeHtml(name)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;vertical-align:top;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Email</div>
                      <div style="font-size:14px;"><a href="mailto:${escapeAttr(email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(email)}</a></div>
                    </td>
                  </tr>
                  ${phone ? `
                  <tr>
                    <td style="padding:6px 0;vertical-align:top;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Số điện thoại</div>
                      <div style="font-size:14px;"><a href="tel:${escapeAttr(phone)}" style="color:#111827;text-decoration:none;">${escapeHtml(phone)}</a></div>
                    </td>
                  </tr>` : ``}
                  <tr>
                    <td style="padding:6px 0;vertical-align:top;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Chủ đề</div>
                      <div style="font-size:14px;">${escapeHtml(subject)}</div>
                    </td>
                  </tr>
                </table>

                <!-- Message box -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;">
                  <tr>
                    <td style="border:1px solid #e5e7eb;background:#fafafa;border-radius:10px;padding:14px;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Nội dung tin nhắn</div>
                      <div style="font-size:14px;white-space:pre-wrap;color:#111827;line-height:1.6;">${escapeHtml(message)}</div>
                    </td>
                  </tr>
                </table>

                <!-- Meta -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px;padding-top:12px;border-top:1px solid #e5e7eb;">
                  <tr>
                    <td style="font-size:12px;color:#6b7280;line-height:1.5;">
                      Email này được gửi tự động từ form liên hệ trên website ClinicPro. Vui lòng trả lời trực tiếp email này để liên hệ lại người gửi.
                    </td>
                  </tr>
                </table>

                <!-- CTA (tuỳ chọn) -->
                <!--
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                  <tr>
                    <td align="center" bgcolor="#2563eb" style="border-radius:10px;">
                      <a href="\${escapeAttr(adminUrl)}" style="display:inline-block;padding:10px 14px;font-size:14px;color:#ffffff;text-decoration:none;border-radius:10px;">Mở trong trang quản trị</a>
                    </td>
                  </tr>
                </table>
                -->
              </td>
            </tr>
          </table>
          <!-- /Container -->
        </td>
      </tr>
    </table>
  </body>
</html>
`;

// helper escape – rất nên dùng khi chèn dữ liệu người dùng
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}
function escapeAttr(str = "") {
  // an toàn hơn cho href / attribute
  return escapeHtml(String(str)).replace(/"/g, "&quot;");
}


  try {
    const result = await resend.emails.send({
      from: 'ClinicPro Contact <onboarding@resend.dev>',
      to: ['bankienthanthien@gmail.com'],
      subject: `Liên hệ mới từ ClinicPro: ${subject}`,
      html,
    });

    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const messageErr = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: messageErr }, { status: 500 });
  }
}



