import {
  Location,
  Restaurant,
  Table,
  TableAvailability,
  ReservationCreate,
  Reservation,
  TableBlockCreate,
  TableBlock,
  AdminToken,
  TableCreate,
  TableUpdate,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const { headers, ...rest } = options || {};
  const res = await fetch(`${API_BASE}${url}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// Public endpoints
export const api = {
  getLocations: () => request<Location[]>("/locations"),

  getRestaurants: (locationId?: number) =>
    request<Restaurant[]>(
      `/restaurants${locationId ? `?location_id=${locationId}` : ""}`
    ),

  getRestaurant: (id: number) => request<Restaurant>(`/restaurants/${id}`),

  getTables: (restaurantId: number) =>
    request<Table[]>(`/restaurants/${restaurantId}/tables`),

  getAvailability: (restaurantId: number, date: string) =>
    request<TableAvailability[]>(
      `/restaurants/${restaurantId}/availability?date=${date}`
    ),

  createReservation: (data: ReservationCreate) =>
    request<Reservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Admin endpoints
  adminLogin: (email: string, password: string) =>
    request<AdminToken>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  adminGetReservations: (token: string, restaurantId?: number) =>
    request<Reservation[]>(
      `/admin/reservations${restaurantId ? `?restaurant_id=${restaurantId}` : ""}`,
      { headers: authHeaders(token) }
    ),

  adminUpdateReservation: (token: string, id: number, status: string) =>
    request<Reservation>(`/admin/reservations/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),

  adminCreateTableBlock: (token: string, data: TableBlockCreate) =>
    request<TableBlock>("/admin/table-blocks", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  // Admin table CRUD
  adminCreateTable: (token: string, data: TableCreate) =>
    request<Table>("/admin/tables", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  adminUpdateTable: (token: string, tableId: number, data: TableUpdate) =>
    request<Table>(`/admin/tables/${tableId}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),

  adminDeleteTable: (token: string, tableId: number) =>
    request<void>(`/admin/tables/${tableId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }),

  adminSetTableStatus: (token: string, tableId: number, status: string, date: string) =>
    request<{ ok: boolean; table_id: number; status: string; date: string }>(
      `/admin/tables/${tableId}/status`,
      {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ status, date }),
      }
    ),

  // Admin restaurant floor shape
  adminUpdateRestaurant: (token: string, restaurantId: number, data: { floor_shape?: string }) =>
    request<Restaurant>(`/admin/restaurants/${restaurantId}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
};
