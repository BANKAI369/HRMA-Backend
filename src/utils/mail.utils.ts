export async function sendSignupEmail(email: string, token: string) {
  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontend.replace(/\/$/, "")}/auth/confirm-trial/${token}`;

  // If SMTP is configured, real sending could be implemented here.
  // For now, log the link so it can be used in development.
  console.log(`Signup email for ${email}: ${link}`);

  return { previewLink: link };
}
