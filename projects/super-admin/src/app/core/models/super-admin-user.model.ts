export type SuperAdminRole = 'super_admin' | 'support_agent' | 'finance' | 'developer';

export interface SuperAdminUser {
  userId: string;
  email: string;
  name: string;
  role: SuperAdminRole;
  mfaEnabled: boolean;
}

export interface LoginCredentialsRequest {
  email: string;
  password: string;
  rememberDevice?: boolean;
}

export interface LoginCredentialsResponse {
  /** When true, the client must call /auth/login/mfa with the TOTP code. */
  mfaRequired: boolean;
  /** Short-lived token bound to this login attempt. Send with the MFA verification. */
  mfaChallengeToken: string | null;
  /** Populated only when MFA is bypassed via a trusted device. */
  session: AuthSession | null;
}

export interface VerifyMfaRequest {
  mfaChallengeToken: string;
  code: string;
  rememberDevice?: boolean;
}

export interface AuthSession {
  user: SuperAdminUser;
  accessToken: string;
  accessTokenExpiresAt: string;
}
