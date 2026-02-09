import nodemailer from "nodemailer";

export const sendEmail = async (to, content, images = [], title) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // ✅ Always attach code
  const attachments = [
    {
      filename: "code.txt",
      content,
    },
  ];

  // ✅ Attach images ONLY if present
  if (Array.isArray(images) && images.length > 0) {
    images.forEach((base64, index) => {
      if (!base64) return;

      const matches = base64.match(/^data:(.+);base64,(.+)$/);
      if (!matches) return;

      attachments.push({
        filename: `image_${index + 1}.png`,
        content: matches[2],
        encoding: "base64",
        contentType: matches[1],
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
            <table width="100%" max-width="600px" style="background:#020617;border-radius:14px;padding:30px;color:#e5e7eb;">
              
              <!-- Header -->
              <tr>
                <td style="text-align:center;">
                  <h1 style="color:#38bdf8;margin-bottom:8px;">🚀 CodeSender</h1>
                  <p style="color:#94a3b8;margin-top:0;">
                    Secure code & file delivery
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding:20px 0;">
                  <hr style="border:none;border-top:1px solid #1e293b;" />
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td>
                  <h2 style="color:#f8fafc;">
                    ${title?.trim() || "Your Code is Ready"}
                  </h2>
                  <p style="color:#cbd5f5;line-height:1.6;">
                    Hi 👋,<br/><br/>
                    Your requested code has been securely attached as a file.
                    ${
                      images.length > 0
                        ? "Related images are also included for reference."
                        : ""
                    }
                  </p>

                  <div style="margin:25px 0;padding:16px;background:#020617;border:1px solid #1e293b;border-radius:10px;">
                    <p style="margin:0;color:#a5b4fc;">
                      📎 <strong>Attachments:</strong><br/>
                      • code.txt<br/>
                      ${
                        images.length > 0
                          ? `• ${images.length} image(s)`
                          : ""
                      }
                    </p>
                  </div>

                  <p style="color:#94a3b8;font-size:14px;">
                    If you didn’t request this email, you can safely ignore it.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
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
    text: "Your code is attached as a file.",
     html: htmlTemplate,

    attachments,
  });
};
