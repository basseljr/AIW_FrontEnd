export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Reservation {
  id: string;
  branchId: string;
  branchNameEn?: string | null;
  customerId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests?: string | null;
  internalNotes?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
}

export interface ReservationListResult {
  items: Reservation[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ReservationFilters {
  status?: string;
  fromDate?: string;
  toDate?: string;
  branchId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateReservationRequest {
  branchId: string;
  customerId?: string | null;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  specialRequests?: string;
}

export interface UpdateReservationStatusRequest {
  status: string;
  cancellationReason?: string;
}

export interface RestaurantTable {
  id: string;
  branchId: string;
  label: string;
  status: string;
  capacity: number;
  sortOrder: number;
}
