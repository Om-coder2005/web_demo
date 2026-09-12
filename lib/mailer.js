import nodemailer from "nodemailer";

// Create reusable transporter using Gmail App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send a 6-digit OTP email to the given address.
 */
export async function sendOTPEmail({ to, otp, outletName = "Khandoli Nitin's Canteen" }) {
  const mailOptions = {
    from: `"${outletName} POS" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Your Khandoli POS Login OTP: ${otp}`,
    html: `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 2px solid #000000; border-radius: 12px; overflow: hidden;">
        <div style="background: #FCC500; padding: 1.5rem 2rem; border-bottom: 2px solid #000000;">
          <h1 style="margin: 0; font-size: 1.4rem; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.04em;">
            🍳 Khandoli POS System
          </h1>
          <p style="margin: 0.25rem 0 0; font-size: 0.8rem; font-weight: 700; color: #000000; text-transform: uppercase;">
            Staff & Management Portal
          </p>
        </div>

        <div style="padding: 2rem;">
          <p style="font-size: 1rem; color: #000000; font-weight: 600; margin-top: 0;">
            Your one-time login code is:
          </p>
          <div style="font-size: 2.8rem; font-weight: 900; color: #000000; letter-spacing: 0.5rem; background: #FCC500; border: 2px solid #000000; border-radius: 10px; padding: 1rem 2rem; text-align: center; margin: 1rem 0;">
            ${otp}
          </div>
          <p style="font-size: 0.85rem; color: #333333;">
            This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
          </p>
          <p style="font-size: 0.75rem; color: #666666; margin-top: 1.5rem; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
            If you did not request this login, please contact your Outlet Manager immediately.
            <br />
            <strong>Khandoli Nitin's Canteen</strong> · Shivaji Udyam Nagar, Kolhapur
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Send machine credentials to the Hotel Owner email.
 */
export async function sendMachineCredentialsEmail({ to, outletName, machineEmail, machinePassword }) {
  const mailOptions = {
    from: `"Khandoli POS Admin" <${process.env.GMAIL_USER}>`,
    to,
    subject: `POS Machine Credentials – ${outletName}`,
    html: `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 2px solid #000000; border-radius: 12px; overflow: hidden;">
        <div style="background: #000000; padding: 1.5rem 2rem;">
          <h1 style="margin: 0; font-size: 1.4rem; font-weight: 900; color: #FCC500; text-transform: uppercase; letter-spacing: 0.04em;">
            🖥️ Machine POS Credentials
          </h1>
          <p style="margin: 0.25rem 0 0; font-size: 0.8rem; font-weight: 700; color: #ffffff; text-transform: uppercase;">
            ${outletName}
          </p>
        </div>

        <div style="padding: 2rem;">
          <p style="font-size: 0.95rem; color: #000000; font-weight: 600;">
            Your main POS counter machine login credentials have been generated:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
            <tr>
              <td style="padding: 0.75rem; background: #f9f9f9; border: 2px solid #000000; font-weight: 700; font-size: 0.85rem;">Machine Email:</td>
              <td style="padding: 0.75rem; background: #FCC500; border: 2px solid #000000; font-weight: 900; font-size: 0.85rem; letter-spacing: 0.02em;">${machineEmail}</td>
            </tr>
            <tr>
              <td style="padding: 0.75rem; background: #f9f9f9; border: 2px solid #000000; border-top: none; font-weight: 700; font-size: 0.85rem;">Password:</td>
              <td style="padding: 0.75rem; background: #ffffff; border: 2px solid #000000; border-top: none; font-weight: 900; font-size: 0.85rem; letter-spacing: 0.1em; font-family: monospace;">${machinePassword}</td>
            </tr>
          </table>
          <p style="font-size: 0.8rem; color: #ef4444; font-weight: 700;">
            ⚠️ Store these credentials securely. These are used to log into your main POS counter hardware. You can regenerate them from your Owner Dashboard at any time.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
