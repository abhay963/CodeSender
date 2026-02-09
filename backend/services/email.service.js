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

  await transporter.sendMail({
    from: `"CodeSender" <${process.env.EMAIL_USER}>`,
    to,
    subject: title?.trim() || "Your Code File",
    text: "Your code is attached as a file.",
    attachments,
  });
};
