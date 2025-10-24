import nodemailer from 'nodemailer';

// SMTP Configuration from Brevo
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'support@yudhavro.com';
const FROM_NAME = process.env.FROM_NAME || 'Yudha dari APIVRO';
const APP_URL = process.env.VITE_APP_URL || 'https://api.yudhavro.com';

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // TLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using SMTP (Brevo)
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Payment Success Email Template
 */
export function getPaymentSuccessEmail(params: {
  customerName: string;
  planName: string;
  amount: number;
  invoiceUrl: string;
  invoiceNumber: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Payment Successful! 🎉</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hi <strong>${params.customerName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Terima kasih atas pembayaran Anda! Subscription Anda telah berhasil di-upgrade ke <strong>${params.planName}</strong>.
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Anda sekarang dapat menggunakan API VRO dengan limit pesan yang lebih besar. Invoice pembayaran Anda sudah tersedia untuk diunduh.
                  </p>
                  
                  <!-- Payment Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
                    <tr>
                      <td>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Plan:</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${params.planName}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Amount Paid:</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">Rp ${params.amount.toLocaleString('id-ID')}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Invoice Number:</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${params.invoiceNumber}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${params.invoiceUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Download Invoice
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Jika ada pertanyaan, silakan hubungi tim support kami di <a href="mailto:support@yudhavro.com" style="color: #667eea;">support@yudhavro.com</a>
                  </p>
                  
                  <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Atau kunjungi dashboard Anda di <a href="${APP_URL}" style="color: #667eea;">api.yudhavro.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} API VRO. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Subscription Expiry Reminder Email Template
 */
export function getExpiryReminderEmail(params: {
  customerName: string;
  planName: string;
  daysLeft: number;
  expiryDate: string;
  renewUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Expiring Soon</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Subscription Expiring Soon ⏰</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hi <strong>${params.customerName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Subscription <strong>${params.planName}</strong> Anda akan berakhir dalam <strong>${params.daysLeft} hari</strong> pada tanggal <strong>${params.expiryDate}</strong>.
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Untuk terus menikmati layanan tanpa gangguan, silakan perpanjang subscription Anda sebelum masa aktif berakhir.
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Setelah subscription berakhir, API Anda akan otomatis downgrade ke plan Free dengan limit 50 pesan per bulan.
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${params.renewUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Renew Subscription
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Butuh bantuan? Hubungi tim support kami di <a href="mailto:support@yudhavro.com" style="color: #f59e0b;">support@yudhavro.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} API VRO. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Device Disconnect Alert Email Template
 */
export function getDeviceDisconnectEmail(params: {
  customerName: string;
  deviceName: string;
  phoneNumber?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Device Disconnected</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Device Disconnected ⚠️</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hi <strong>${params.customerName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Device WhatsApp Anda <strong>${params.deviceName}</strong>${params.phoneNumber ? ` (${params.phoneNumber})` : ''} telah terputus dari server.
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Silakan reconnect device Anda untuk melanjutkan pengiriman pesan. API Anda tidak akan berfungsi sampai device terhubung kembali.
                  </p>
                  
                  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                      ⚠️ Penyebab umum disconnect:
                    </p>
                    <ul style="margin: 10px 0 0 20px; color: #991b1b; font-size: 14px;">
                      <li>WhatsApp logout dari device</li>
                      <li>Koneksi internet terputus</li>
                      <li>Device mati atau restart</li>
                    </ul>
                  </div>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${APP_URL}/devices" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Reconnect Device
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Butuh bantuan? Hubungi support di <a href="mailto:support@yudhavro.com" style="color: #ef4444;">support@yudhavro.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} API VRO. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Message Limit Reached Email Template
 */
export function getLimitReachedEmail(params: {
  customerName: string;
  planName: string;
  messageLimit: number;
  upgradeUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Message Limit Reached</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Message Limit Reached 📊</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Hi <strong>${params.customerName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    Anda telah mencapai limit pengiriman pesan bulanan sebesar <strong>${params.messageLimit.toLocaleString()}</strong> pesan pada plan <strong>${params.planName}</strong>.
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                    API Anda tidak dapat mengirim pesan lagi sampai bulan depan atau sampai Anda upgrade ke plan yang lebih tinggi.
                  </p>
                  
                  <div style="background-color: #faf5ff; border-left: 4px solid #8b5cf6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px; color: #6b21a8; font-size: 14px; font-weight: 600;">
                      💡 Pilihan untuk Anda:
                    </p>
                    <ul style="margin: 0 0 0 20px; color: #6b21a8; font-size: 14px;">
                      <li><strong>Tunggu reset otomatis</strong> - Limit akan reset otomatis awal bulan depan</li>
                      <li><strong>Upgrade sekarang</strong> - Dapatkan limit lebih besar dan langsung bisa kirim pesan</li>
                    </ul>
                  </div>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${params.upgradeUrl}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Upgrade Plan Sekarang
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    Lihat detail usage Anda di <a href="${APP_URL}/dashboard" style="color: #8b5cf6;">Dashboard</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} API VRO. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
