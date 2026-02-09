export const validateRequest = ({ content, email }) => {
  if (!content || content.trim() === "") {
    return "Code content is required";
  }

  if (!email || email.trim() === "") {
    return "Email is required";
  }

  return null;
};
