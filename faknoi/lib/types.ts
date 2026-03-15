export type UserRole = "buyer" | "shopper";

export interface Profile {
  id: string;
  username: string;
  email: string;
  student_id?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export type TripStatus = "open" | "shopping" | "delivering" | "completed" | "cancelled";

export interface Trip {
  id: string;
  shopper_id: string;
  shopper?: Profile;
  origin_zone: string;
  destination_zone: string;
  cutoff_time: string;
  max_orders: number;
  current_orders: number;
  status: TripStatus;
  note?: string;
  created_at: string;
  closed_at?: string;
}

export type OrderStatus = "pending" | "accepted" | "shopping" | "bought" | "delivering" | "completed" | "cancelled";

export interface OrderItem {
  shop_name: string;
  item_name: string;
  quantity: number;
  note?: string;
  image_url?: string;
  fallback_option?: string;
}

export interface Order {
  id: string;
  trip_id: string;
  trip?: Trip;
  buyer_id: string;
  buyer?: Profile;
  items: OrderItem[];
  estimated_price: number;
  final_price?: number;
  adjustment_reason?: string;
  status: OrderStatus;
  payment_slip_url?: string;
  payment_confirmed: boolean;
  created_at: string;
  updated_at: string;
}
