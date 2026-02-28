export interface Location {
  id: number;
  name: string;
}

export interface Restaurant {
  id: number;
  name: string;
  location_id: number;
  address: string | null;
  phone: string | null;
  floor_shape: string | null;
}

export interface Table {
  id: number;
  restaurant_id: number;
  name: string;
  capacity: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  shape: string;
  zone: string | null;
}

export interface TableAvailability extends Table {
  status: "available" | "reserved" | "blocked" | "pending";
}

export interface TableCreate {
  restaurant_id: number;
  name: string;
  capacity?: number;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  shape?: string;
  zone?: string;
}

export interface TableUpdate {
  name?: string;
  capacity?: number;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  shape?: string;
  zone?: string;
}

export interface ReservationCreate {
  table_id: number;
  restaurant_id: number;
  date: string;
  start_time: string;
  end_time: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  preorder_note?: string;
}

export interface Reservation {
  id: number;
  table_id: number;
  restaurant_id: number;
  date: string;
  start_time: string;
  end_time: string;
  user_name: string;
  user_phone: string | null;
  user_email: string | null;
  preorder_note: string | null;
  status: string;
}

export interface TableBlockCreate {
  table_id: number;
  restaurant_id: number;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export interface TableBlock {
  id: number;
  table_id: number;
  restaurant_id: number;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export interface AdminToken {
  access_token: string;
  token_type: string;
  restaurant_id: number | null;
  restaurant_name: string | null;
  is_super_admin: boolean;
}
