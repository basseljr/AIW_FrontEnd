export interface WorkingHourEntry {
  dayOfWeek: number; // 0=Sun … 6=Sat
  openTime: string;  // "HH:mm"
  closeTime: string; // "HH:mm"
  isClosed: boolean;
}

export interface BranchListItem {
  id: string;
  tenantId: string;
  nameEn: string;
  nameAr: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  workingHoursJson: string | null;
}

export interface BranchDetail extends BranchListItem {}

export interface UpsertBranchRequest {
  nameEn: string;
  nameAr: string;
  address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  workingHoursJson?: string | null;
}
