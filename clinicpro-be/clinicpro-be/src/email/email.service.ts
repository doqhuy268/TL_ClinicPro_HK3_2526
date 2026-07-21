import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');
  }

  private isDryRun(): boolean {
    // If EMAIL_DRY_RUN is 'true', do not send emails; only log to console
    // Useful for local development/testing
    return String(process.env.EMAIL_DRY_RUN).toLowerCase() === 'true';
  }

  /**
   * Gá»­i OTP qua email
   * @param email - Äá»‹a chá»‰ email ngÆ°á»i nháº­n
   * @param otp - MÃ£ OTP
   * @param name - TÃªn ngÆ°á»i nháº­n (tÃ¹y chá»n)
   */
  async sendOtp(email: string, otp: string, name?: string): Promise<boolean> {
    try {
      if (this.isDryRun()) {
        console.log('[EMAIL_DRY_RUN] sendOtp', {
          to: email,
          subject: 'MÃ£ xÃ¡c thá»±c OTP - ClinicPro Healthcare',
          otp,
          name,
        });
        return true;
      }
      const { data, error } = await this.resend.emails.send({
        from: 'ClinicPro Healthcare <noreply@clinicpro.io.vn>',
        to: [email],
        subject: 'MÃ£ xÃ¡c thá»±c OTP - ClinicPro Healthcare',
        html: this.generateOtpEmailTemplate(otp, name),
      });

      if (error) {
        this.logger.error('Failed to send OTP email:', error);
        return false;
      }

      this.logger.log(
        `OTP email sent successfully to ${email}. Message ID: ${data?.id}`,
      );

      // Log OTP to console for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`ðŸ” OTP cho email ${email}: ${otp}`);
      }

      return true;
    } catch (error) {
      this.logger.error('Error sending OTP email:', error);
      return false;
    }
  }

  /**
   * Gá»­i email chÃ o má»«ng sau khi Ä‘Äƒng kÃ½ thÃ nh cÃ´ng
   * @param email - Äá»‹a chá»‰ email
   * @param name - TÃªn ngÆ°á»i dÃ¹ng
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      if (this.isDryRun()) {
        console.log('[EMAIL_DRY_RUN] sendWelcomeEmail', {
          to: email,
          subject: 'ChÃ o má»«ng báº¡n Ä‘áº¿n vá»›i ClinicPro Healthcare!',
          name,
        });
        return true;
      }
      const { data, error } = await this.resend.emails.send({
        from: 'ClinicPro Healthcare <noreply@clinicpro.io.vn>',
        to: [email],
        subject: 'ChÃ o má»«ng báº¡n Ä‘áº¿n vá»›i ClinicPro Healthcare!',
        html: this.generateWelcomeEmailTemplate(name),
      });

      if (error) {
        this.logger.error('Failed to send welcome email:', error);
        return false;
      }

      this.logger.log(
        `Welcome email sent successfully to ${email}. Message ID: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Gá»­i email thÃ´ng bÃ¡o há»§y lá»‹ch háº¹n
   */
  async sendAppointmentCancellationEmail(params: {
    to: string;
    patientName?: string;
    appointmentCode?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    doctorName?: string;
    reason?: string;
  }): Promise<boolean> {
    const {
      to,
      patientName,
      appointmentCode,
      date,
      startTime,
      endTime,
      doctorName,
      reason,
    } = params;
    const subject = 'ThÃ´ng bÃ¡o há»§y lá»‹ch háº¹n - ClinicPro Healthcare';
    const html = this.generateAppointmentCancellationTemplate({
      patientName,
      appointmentCode,
      date,
      startTime,
      endTime,
      doctorName,
      reason,
    });

    try {
      if (this.isDryRun()) {
        console.log('[EMAIL_DRY_RUN] sendAppointmentCancellationEmail', {
          to,
          subject,
          appointmentCode,
          date,
          startTime,
          endTime,
          doctorName,
        });
        return true;
      }

      const { data, error } = await this.resend.emails.send({
        from: 'ClinicPro Healthcare <noreply@clinicpro.io.vn>',
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(
          'Failed to send appointment cancellation email:',
          error,
        );
        return false;
      }

      this.logger.log(
        `Appointment cancellation email sent to ${to}. Message ID: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending appointment cancellation email:', error);
      return false;
    }
  }

  /**
   * Gá»­i email thÃ´ng bÃ¡o pháº£n há»“i cá»§a bÃ¡c sÄ© vá» feedback Ä‘Æ¡n thuá»‘c tá»›i bá»‡nh nhÃ¢n
   */
  async sendPrescriptionFeedbackResponseEmail(params: {
    to: string;
    patientName?: string;
    doctorName?: string;
    prescriptionCode?: string;
    originalMessage: string;
    responseNote: string;
    isUrgent?: boolean;
  }): Promise<boolean> {
    const {
      to,
      patientName,
      doctorName,
      prescriptionCode,
      originalMessage,
      responseNote,
      isUrgent,
    } = params;

    const subject = `${isUrgent ? '[KHáº¨N] ' : ''}Pháº£n há»“i tá»« bÃ¡c sÄ© vá» Ä‘Æ¡n thuá»‘c${
      prescriptionCode ? ` ${prescriptionCode}` : ''
    } - ClinicPro Healthcare`;
    const html = this.generatePrescriptionFeedbackResponseTemplate({
      patientName,
      doctorName,
      prescriptionCode,
      originalMessage,
      responseNote,
      isUrgent,
    });

    try {
      if (this.isDryRun()) {
        console.log('[EMAIL_DRY_RUN] sendPrescriptionFeedbackResponseEmail', {
          to,
          subject,
          prescriptionCode,
          isUrgent,
          patientName,
        });
        return true;
      }

      const { data, error } = await this.resend.emails.send({
        from: 'ClinicPro Healthcare <noreply@clinicpro.io.vn>',
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error(
          'Failed to send prescription feedback response email:',
          error,
        );
        return false;
      }

      this.logger.log(
        `Prescription feedback response email sent to ${to}. Message ID: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        'Error sending prescription feedback response email:',
        error,
      );
      return false;
    }
  }

  /**
   * Gá»­i email thÃ´ng bÃ¡o pháº£n há»“i Ä‘Æ¡n thuá»‘c tá»›i bÃ¡c sÄ©
   */
  async sendPrescriptionFeedbackEmail(params: {
    to: string;
    doctorName?: string;
    patientName?: string;
    prescriptionCode?: string;
    message: string;
    isUrgent?: boolean;
    createdDate?: string;
  }): Promise<boolean> {
    const {
      to,
      doctorName,
      patientName,
      prescriptionCode,
      message,
      isUrgent,
      createdDate,
    } = params;

    const subject = `${isUrgent ? '[KHáº¨N] ' : ''}Pháº£n há»“i vá» Ä‘Æ¡n thuá»‘c${
      prescriptionCode ? ` ${prescriptionCode}` : ''
    } - ClinicPro Healthcare`;
    const html = this.generatePrescriptionFeedbackTemplate({
      doctorName,
      patientName,
      prescriptionCode,
      message,
      isUrgent,
      createdDate,
    });

    try {
      if (this.isDryRun()) {
        console.log('[EMAIL_DRY_RUN] sendPrescriptionFeedbackEmail', {
          to,
          subject,
          prescriptionCode,
          isUrgent,
          patientName,
        });
        return true;
      }

      const { data, error } = await this.resend.emails.send({
        from: 'ClinicPro Healthcare <noreply@clinicpro.io.vn>',
        to: [to],
        subject,
        html,
      });

      if (error) {
        this.logger.error('Failed to send prescription feedback email:', error);
        return false;
      }

      this.logger.log(
        `Prescription feedback email sent to ${to}. Message ID: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending prescription feedback email:', error);
      return false;
    }
  }

  private generateAppointmentCancellationTemplate(params: {
    patientName?: string;
    appointmentCode?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    doctorName?: string;
    reason?: string;
  }): string {
    const {
      patientName,
      appointmentCode,
      date,
      startTime,
      endTime,
      doctorName,
      reason,
    } = params;

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ThÃ´ng bÃ¡o há»§y lá»‹ch háº¹n</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 640px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f6fb;
          }
          .container {
            background: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 22px;
          }
          .logo {
            font-size: 22px;
            font-weight: 700;
            color: #1d4ed8;
          }
          .badge {
            display: inline-block;
            padding: 8px 14px;
            border-radius: 999px;
            background: #fee2e2;
            color: #b91c1c;
            font-weight: 600;
            font-size: 12px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .hero {
            background: linear-gradient(135deg, #ef4444, #f97316);
            color: #fff;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 18px;
            text-align: center;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            margin: 16px 0;
          }
          .card h3 {
            margin: 0 0 10px 0;
            font-size: 15px;
            color: #0f172a;
          }
          ul {
            padding-left: 18px;
            margin: 0;
          }
          li {
            margin-bottom: 6px;
          }
          .reason {
            margin-top: 8px;
            padding: 12px 14px;
            border-left: 4px solid #ef4444;
            background: #fff7f7;
            border-radius: 8px;
            color: #991b1b;
          }
          .footer {
            margin-top: 20px;
            font-size: 13px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">Lá»‹ch háº¹n Ä‘Ã£ há»§y</div>
            <div class="logo">ðŸ¥ ClinicPro Healthcare</div>
          </div>
          <div class="hero">
            <h2 style="margin: 0;">Xin lá»—i vá» sá»± báº¥t tiá»‡n, ${
              patientName || 'QuÃ½ khÃ¡ch'
            }</h2>
            <p style="margin: 6px 0 0 0; font-size: 14px;">
              Lá»‹ch háº¹n cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c há»§y. Vui lÃ²ng xem chi tiáº¿t bÃªn dÆ°á»›i.
            </p>
          </div>

          <div class="card">
            <h3>Chi tiáº¿t lá»‹ch háº¹n</h3>
            <ul>
              ${
                appointmentCode
                  ? `<li><strong>MÃ£ lá»‹ch háº¹n:</strong> ${appointmentCode}</li>`
                  : ''
              }
              ${date ? `<li><strong>NgÃ y:</strong> ${date}</li>` : ''}
              ${
                startTime || endTime
                  ? `<li><strong>Thá»i gian:</strong> ${startTime || ''}${
                      startTime && endTime ? ' - ' : ''
                    }${endTime || ''}</li>`
                  : ''
              }
              ${
                doctorName
                  ? `<li><strong>BÃ¡c sÄ©:</strong> ${doctorName}</li>`
                  : ''
              }
            </ul>
            <div class="reason">
              <strong>LÃ½ do:</strong>
              <span>${
                reason ||
                'Lá»‹ch háº¹n Ä‘Æ°á»£c há»§y theo yÃªu cáº§u hoáº·c Ä‘iá»u chá»‰nh tá»« phÃ²ng khÃ¡m.'
              }</span>
            </div>
          </div>

          <p>
            ChÃºng tÃ´i ráº¥t tiáº¿c vá» sá»± báº¥t tiá»‡n nÃ y. Náº¿u cáº§n Ä‘áº·t láº¡i lá»‹ch hoáº·c há»— trá»£ thÃªm,
            vui lÃ²ng liÃªn há»‡ hotline hoáº·c pháº£n há»“i láº¡i email nÃ y.
          </p>
          <p>Cáº£m Æ¡n báº¡n Ä‘Ã£ tin tÆ°á»Ÿng ClinicPro Healthcare.</p>
          <div class="footer">
            ÄÃ¢y lÃ  email tá»± Ä‘á»™ng, vui lÃ²ng khÃ´ng tráº£ lá»i trá»±c tiáº¿p.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePrescriptionFeedbackResponseTemplate(params: {
    patientName?: string;
    doctorName?: string;
    prescriptionCode?: string;
    originalMessage: string;
    responseNote: string;
    isUrgent?: boolean;
  }): string {
    const {
      patientName,
      doctorName,
      prescriptionCode,
      originalMessage,
      responseNote,
      isUrgent,
    } = params;
    const urgency = isUrgent ? 'Kháº©n cáº¥p' : 'ThÃ´ng thÆ°á»ng';

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pháº£n há»“i tá»« bÃ¡c sÄ©</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 640px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f6fb;
          }
          .container {
            background: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo {
            font-size: 22px;
            font-weight: 700;
            color: #1d4ed8;
          }
          .badge {
            display: inline-block;
            padding: 8px 14px;
            border-radius: 999px;
            background: ${isUrgent ? '#fee2e2' : '#e0f2fe'};
            color: ${isUrgent ? '#b91c1c' : '#075985'};
            font-weight: 600;
            font-size: 12px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            margin: 16px 0;
          }
          ul { padding-left: 18px; margin: 0; }
          li { margin-bottom: 6px; }
          .message-box {
            margin-top: 10px;
            padding: 14px;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            white-space: pre-wrap;
          }
          .response-box {
            margin-top: 16px;
            padding: 16px;
            background: #f0fdf4;
            border: 2px solid #22c55e;
            border-radius: 10px;
            white-space: pre-wrap;
          }
          .response-box strong {
            color: #15803d;
            display: block;
            margin-bottom: 8px;
          }
          .footer {
            margin-top: 20px;
            font-size: 13px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">${urgency}</div>
            <div class="logo">ðŸ¥ ClinicPro Healthcare</div>
            <h2 style="margin: 8px 0 0 0;">Pháº£n há»“i tá»« bÃ¡c sÄ©</h2>
          </div>

          <div class="card">
            <ul>
              ${patientName ? `<li><strong>Bá»‡nh nhÃ¢n:</strong> ${patientName}</li>` : ''}
              ${doctorName ? `<li><strong>BÃ¡c sÄ©:</strong> ${doctorName}</li>` : ''}
              ${prescriptionCode ? `<li><strong>MÃ£ Ä‘Æ¡n thuá»‘c:</strong> ${prescriptionCode}</li>` : ''}
            </ul>
            <div class="message-box">
              <strong>Pháº£n há»“i cá»§a báº¡n:</strong><br/>
              ${originalMessage.replace(/\n/g, '<br/>')}
            </div>
            <div class="response-box">
              <strong>Pháº£n há»“i tá»« bÃ¡c sÄ©:</strong>
              ${responseNote.replace(/\n/g, '<br/>')}
            </div>
          </div>

          <p>BÃ¡c sÄ© Ä‘Ã£ xem xÃ©t vÃ  pháº£n há»“i vá» Ä‘Æ¡n thuá»‘c cá»§a báº¡n. Vui lÃ²ng kiá»ƒm tra vÃ  liÃªn há»‡ vá»›i phÃ²ng khÃ¡m náº¿u cáº§n há»— trá»£ thÃªm.</p>
          <div class="footer">
            ÄÃ¢y lÃ  email tá»± Ä‘á»™ng, vui lÃ²ng khÃ´ng tráº£ lá»i trá»±c tiáº¿p.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePrescriptionFeedbackTemplate(params: {
    doctorName?: string;
    patientName?: string;
    prescriptionCode?: string;
    message: string;
    isUrgent?: boolean;
    createdDate?: string;
  }): string {
    const {
      doctorName,
      patientName,
      prescriptionCode,
      message,
      isUrgent,
      createdDate,
    } = params;
    const urgency = isUrgent ? 'Kháº©n cáº¥p' : 'ThÃ´ng thÆ°á»ng';

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pháº£n há»“i Ä‘Æ¡n thuá»‘c</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 640px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f6fb;
          }
          .container {
            background: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo {
            font-size: 22px;
            font-weight: 700;
            color: #1d4ed8;
          }
          .badge {
            display: inline-block;
            padding: 8px 14px;
            border-radius: 999px;
            background: ${isUrgent ? '#fee2e2' : '#e0f2fe'};
            color: ${isUrgent ? '#b91c1c' : '#075985'};
            font-weight: 600;
            font-size: 12px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            margin: 16px 0;
          }
          ul { padding-left: 18px; margin: 0; }
          li { margin-bottom: 6px; }
          .message-box {
            margin-top: 10px;
            padding: 14px;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 20px;
            font-size: 13px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">${urgency}</div>
            <div class="logo">ðŸ¥ ClinicPro Healthcare</div>
            <h2 style="margin: 8px 0 0 0;">Pháº£n há»“i Ä‘Æ¡n thuá»‘c</h2>
          </div>

          <div class="card">
            <ul>
              ${doctorName ? `<li><strong>BÃ¡c sÄ© nháº­n:</strong> ${doctorName}</li>` : ''}
              ${patientName ? `<li><strong>Bá»‡nh nhÃ¢n:</strong> ${patientName}</li>` : ''}
              ${prescriptionCode ? `<li><strong>MÃ£ Ä‘Æ¡n thuá»‘c:</strong> ${prescriptionCode}</li>` : ''}
              ${createdDate ? `<li><strong>NgÃ y táº¡o Ä‘Æ¡n thuá»‘c:</strong> ${createdDate}</li>` : ''}
            </ul>
            <div class="message-box">
              <strong>Ná»™i dung pháº£n há»“i:</strong><br/>
              ${message.replace(/\n/g, '<br/>')}
            </div>
          </div>

          <p>Vui lÃ²ng kiá»ƒm tra vÃ  liÃªn há»‡ vá»›i bá»‡nh nhÃ¢n náº¿u cáº§n há»— trá»£ thÃªm.</p>
          <div class="footer">
            ÄÃ¢y lÃ  email tá»± Ä‘á»™ng, vui lÃ²ng khÃ´ng tráº£ lá»i trá»±c tiáº¿p.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Táº¡o template HTML cho email OTP
   * @param otp - MÃ£ OTP
   * @param name - TÃªn ngÆ°á»i nháº­n
   */
  private generateOtpEmailTemplate(otp: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MÃ£ xÃ¡c thá»±c OTP</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
          }
          .otp-code {
            background: #f8f9fa;
            border: 2px dashed #2c5aa0;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
          }
          .otp-number {
            font-size: 32px;
            font-weight: bold;
            color: #2c5aa0;
            letter-spacing: 5px;
            margin: 10px 0;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ðŸ¥ ClinicPro Healthcare</div>
            <h2>MÃ£ xÃ¡c thá»±c OTP</h2>
          </div>
          
          <p>Xin chÃ o${name ? ` ${name}` : ''},</p>
          
          <p>Báº¡n Ä‘Ã£ yÃªu cáº§u mÃ£ xÃ¡c thá»±c Ä‘á»ƒ hoÃ n táº¥t quÃ¡ trÃ¬nh Ä‘Äƒng kÃ½ tÃ i khoáº£n táº¡i ClinicPro Healthcare.</p>
          
          <div class="otp-code">
            <p><strong>MÃ£ xÃ¡c thá»±c cá»§a báº¡n lÃ :</strong></p>
            <div class="otp-number">${otp}</div>
            <p><em>MÃ£ nÃ y cÃ³ hiá»‡u lá»±c trong 5 phÃºt</em></p>
          </div>
          
          <div class="warning">
            <strong>âš ï¸ LÆ°u Ã½ báº£o máº­t:</strong>
            <ul>
              <li>KhÃ´ng chia sáº» mÃ£ nÃ y vá»›i báº¥t ká»³ ai</li>
              <li>ClinicPro Healthcare sáº½ khÃ´ng bao giá» yÃªu cáº§u mÃ£ OTP qua Ä‘iá»‡n thoáº¡i</li>
              <li>Náº¿u báº¡n khÃ´ng yÃªu cáº§u mÃ£ nÃ y, vui lÃ²ng bá» qua email</li>
            </ul>
          </div>
          
          <p>Náº¿u báº¡n cáº§n há»— trá»£, vui lÃ²ng liÃªn há»‡ vá»›i chÃºng tÃ´i qua:</p>
          <ul>
            <li>ðŸ“§ Email: support@clinicpro.io.vn</li>
            <li>ðŸ“ž Hotline: 1900-xxxx</li>
          </ul>
          
          <div class="footer">
            <p>TrÃ¢n trá»ng,<br><strong>Äá»™i ngÅ© ClinicPro Healthcare</strong></p>
            <p>Email nÃ y Ä‘Æ°á»£c gá»­i tá»± Ä‘á»™ng, vui lÃ²ng khÃ´ng tráº£ lá»i.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Táº¡o template HTML cho email chÃ o má»«ng
   * @param name - TÃªn ngÆ°á»i dÃ¹ng
   */
  private generateWelcomeEmailTemplate(name: string): string {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ChÃ o má»«ng Ä‘áº¿n vá»›i ClinicPro Healthcare</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2c5aa0;
            margin-bottom: 10px;
          }
          .welcome-box {
            background: linear-gradient(135deg, #2c5aa0, #4a90e2);
            color: white;
            padding: 25px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ðŸ¥ ClinicPro Healthcare</div>
          </div>
          
          <div class="welcome-box">
            <h2>ðŸŽ‰ ChÃ o má»«ng ${name}!</h2>
            <p>Cáº£m Æ¡n báº¡n Ä‘Ã£ Ä‘Äƒng kÃ½ tÃ i khoáº£n táº¡i ClinicPro Healthcare</p>
          </div>
          
          <p>ChÃºng tÃ´i ráº¥t vui má»«ng chÃ o Ä‘Ã³n báº¡n tham gia cá»™ng Ä‘á»“ng chÄƒm sÃ³c sá»©c khá»e cá»§a ClinicPro Healthcare!</p>
          
          <div class="footer">
            <p>TrÃ¢n trá»ng,<br><strong>Äá»™i ngÅ© ClinicPro Healthcare</strong></p>
            <p>Email nÃ y Ä‘Æ°á»£c gá»­i tá»± Ä‘á»™ng, vui lÃ²ng khÃ´ng tráº£ lá»i.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gá»­i thÃ´ng tin tÃ i khoáº£n cho nhÃ¢n viÃªn má»›i
   */
  async sendAccountCredentials(params: {
    email: string;
    name: string;
    username: string;
    password: string;
    role?: string;
  }): Promise<boolean> {
    const { email, name, username, password, role } = params;
    try {
      if (this.isDryRun()) {
        console.log('[EMAIL_DRY_RUN] sendAccountCredentials', {
          to: email,
          subject: 'ThÃ´ng tin tÃ i khoáº£n nhÃ¢n viÃªn - ClinicPro Healthcare',
          name,
          username,
          password,
          role,
        });
        return true;
      }
      const { data, error } = await this.resend.emails.send({
        from: 'ClinicPro Healthcare <noreply@clinicpro.io.vn>',
        to: [email],
        subject: 'ThÃ´ng tin tÃ i khoáº£n nhÃ¢n viÃªn - ClinicPro Healthcare',
        html: this.generateCredentialsTemplate({
          name,
          username,
          password,
          role,
        }),
      });
      if (error) {
        this.logger.error('Failed to send credentials email:', error);
        return false;
      }
      this.logger.log(`Credentials email sent to ${email}. ID: ${data?.id}`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`ðŸ” TÃ i khoáº£n: ${username} | Máº­t kháº©u: ${password}`);
      }
      return true;
    } catch (error) {
      this.logger.error('Error sending credentials email:', error);
      return false;
    }
  }

  private generateCredentialsTemplate(params: {
    name: string;
    username: string;
    password: string;
    role?: string;
  }): string {
    const { name, username, password, role } = params;
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ThÃ´ng tin tÃ i khoáº£n nhÃ¢n viÃªn</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: bold; color: #2c5aa0; }
          .box { background: #f8f9fa; border: 1px solid #e9ecef; padding: 16px; border-radius: 8px; }
          .label { color: #6c757d; font-size: 13px; }
          .value { font-weight: 600; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ðŸ¥ ClinicPro Healthcare</div>
            <h2>ThÃ´ng tin tÃ i khoáº£n nhÃ¢n viÃªn</h2>
          </div>
          <p>Xin chÃ o ${name},</p>
          <p>TÃ i khoáº£n lÃ m viá»‡c táº¡i ClinicPro Healthcare cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c táº¡o${role ? ` cho vai trÃ² <strong>${role}</strong>` : ''}.</p>
          <div class="box">
            <div class="label">TÃªn Ä‘Äƒng nháº­p</div>
            <div class="value">${username}</div>
            <div class="label" style="margin-top:10px;">Máº­t kháº©u táº¡m thá»i</div>
            <div class="value">${password}</div>
          </div>
          <p>Vui lÃ²ng Ä‘Äƒng nháº­p vÃ  Ä‘á»•i máº­t kháº©u ngay sau láº§n Ä‘Äƒng nháº­p Ä‘áº§u tiÃªn Ä‘á»ƒ báº£o máº­t tÃ i khoáº£n.</p>
          <p>TrÃ¢n trá»ng,<br/>Äá»™i ngÅ© ClinicPro Healthcare</p>
        </div>
      </body>
      </html>
    `;
  }
}

