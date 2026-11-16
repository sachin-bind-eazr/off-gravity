export type Role = "OWNER" | "MANAGER" | "SUPPORT";
export type Permission =
  | "overview" | "events" | "tickets" | "content"
  | "bookings.view" | "bookings.email" | "bookings.money"
  | "participants.view" | "participants.emergency" | "users"
  | "waitlist.view" | "waitlist.export";
const MATRIX: Record<Role, Permission[]> = {
  OWNER: ["overview", "events", "tickets", "content", "bookings.view", "bookings.email", "bookings.money", "participants.view", "participants.emergency", "users", "waitlist.view", "waitlist.export"],
  MANAGER: ["overview", "events", "tickets", "content", "bookings.view", "bookings.email", "bookings.money", "participants.view", "participants.emergency", "waitlist.view", "waitlist.export"],
  SUPPORT: ["bookings.view", "bookings.email", "participants.view", "waitlist.view"],
};
export const can = (r: Role, p: Permission) => MATRIX[r]?.includes(p) ?? false;
