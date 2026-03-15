export const ADMIN_EMAIL = "Admin123@gmail.com";
export const ADMIN_PASSWORD = "admin#123";
export const AUTH_COOKIE_NAME = "ims_admin_auth";

export function isValidAdminCredentials(emailId: string, password: string): boolean {
  return emailId === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}
