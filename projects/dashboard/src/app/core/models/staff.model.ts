// ── Staff Member ───────────────────────────────────────────────────────────────

export type StaffRole = 'owner' | 'manager' | 'staff' | 'driver' | 'kitchen' | 'accountant';

export interface StaffMember {
  userId: string;
  fullName: string;
  email: string;
  roleKey: StaffRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

// ── Invite Staff Request ───────────────────────────────────────────────────────

export interface InviteStaffRequest {
  fullName: string;
  email: string;
  password: string;
  roleKey: StaffRole;
}

// ── Update Status Request ──────────────────────────────────────────────────────

export interface UpdateStaffStatusRequest {
  isActive: boolean;
}
