import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, site, role, start_date, manager, licence_type, file_name, file_base64, file_mime } = req.body;

  if (!name || !file_base64 || !file_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
    });

    const base64Data = file_base64.includes(',') ? file_base64.split(',')[1] : file_base64;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    await transporter.sendMail({
      from: `"Caswells Induction App" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `Induction Licence Upload — ${name} — ${site}`,
      html: `
        <div style="font-family: Calibri, sans-serif; max-width: 600px;">
          <h2 style="color: #08488D; border-bottom: 2px solid #EC1C24; padding-bottom: 8px;">
            Caswells Group — Induction Licence Upload
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; color: #555; width: 120px;">Name:</td><td style="padding: 6px 0; font-weight: bold;">${name}</td></tr>
            <tr><td style="padding: 6px 0; color: #555;">Site:</td><td style="padding: 6px 0;">${site}</td></tr>
            <tr><td style="padding: 6px 0; color: #555;">Role:</td><td style="padding: 6px 0;">${role}</td></tr>
            <tr><td style="padding: 6px 0; color: #555;">Start Date:</td><td style="padding: 6px 0;">${start_date}</td></tr>
            <tr><td style="padding: 6px 0; color: #555;">Manager:</td><td style="padding: 6px 0;">${manager}</td></tr>
            <tr><td style="padding: 6px 0; color: #555;">Licence type:</td><td style="padding: 6px 0;">${licence_type}</td></tr>
          </table>
          <p style="color: #555; font-size: 13px;">
            The licence document is attached to this email.<br>
            Please save it to the employee's personnel record and delete this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #aaa; font-size: 11px;">
            Generated automatically by the Caswells Group Safety Induction app.
          </p>
        </div>
      `,
      attachments: [{
        filename: `${name} — ${licence_type} — ${file_name}`,
        content: fileBuffer,
        contentType: file_mime || 'application/octet-stream',
      }],
    });

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Mail error:', error);
    return res.status(500).json({ error: 'Failed to send email', detail: error.message });
  }
}
