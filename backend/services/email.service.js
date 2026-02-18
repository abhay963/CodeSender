import nodemailer from "nodemailer";

export const sendEmail = async (to, content, files = [], title) => {
  const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


  const attachments = [
    {
      filename: "code.txt",
      content,
    },
  ];

  // Attach uploaded files (PDF, DOCX, Images)
  if (Array.isArray(files) && files.length > 0) {
    files.forEach((file) => {
      if (!file?.data) return;

      const matches = file.data.match(/^data:(.+);base64,(.+)$/);
      if (!matches) return;

      attachments.push({
        filename: file.name,
        content: matches[2],
        encoding: "base64",
        contentType: file.type,
      });
    });
  }

  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${title || "Your Code File"}</title>
    </head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 15px;">
            <table width="100%" style="max-width:600px;background:#020617;border-radius:14px;padding:30px;color:#e5e7eb;">
              
              <tr>
                <td style="text-align:center;">
                  <h1 style="color:#38bdf8;margin-bottom:8px;">🚀 CodeSender</h1>
                  <p style="color:#94a3b8;margin-top:0;">
                    Secure code & file delivery
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 0;">
                  <hr style="border:none;border-top:1px solid #1e293b;" />
                </td>
              </tr>

              <tr>
                <td>
                  <h2 style="color:#f8fafc;">
                    ${title?.trim() || "Your Code is Ready"}
                  </h2>
                  <p style="color:#cbd5f5;line-height:1.6;">
                    Hi 👋,<br/><br/>
                    Your requested code has been securely attached as a file.
                    ${
                      files.length > 0
                        ? "Additional files are also attached."
                        : ""
                    }
                  </p>

                  <div style="margin:25px 0;padding:16px;background:#020617;border:1px solid #1e293b;border-radius:10px;">
                    <p style="margin:0;color:#a5b4fc;">
                      📎 <strong>Attachments:</strong><br/>
                      • code.txt<br/>
                      ${
                        files.length > 0
                          ? `• ${files.length} file(s)`
                          : ""
                      }
                    </p>
                  </div>

                  <p style="color:#94a3b8;font-size:14px;">
                    If you didn’t request this email, you can safely ignore it.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding-top:30px;text-align:center;">
                  <p style="color:#64748b;font-size:13px;">
                    © ${new Date().getFullYear()} CodeSender<br/>
                    Built with ❤️ for developers
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

  await transporter.sendMail({
    from: `"CodeSender" <${process.env.EMAIL_USER}>`,
    to,
    subject: title?.trim() || "Your Code File",
    text: "Your code is attached.",
    html: htmlTemplate,
    attachments,
  });
};
