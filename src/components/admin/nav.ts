import type { Permission } from "@/lib/auth/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission: Permission;
}

/** SVG path data (24×24, stroke) per module — first-party marks, no icon library. */
export const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", permission: "dashboard:view", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/admin/products", label: "Products", permission: "products:read", icon: "M4 7l8-4 8 4-8 4-8-4zm0 0v10l8 4 8-4V7M12 11v10" },
  { href: "/admin/collections", label: "Collections", permission: "products:read", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/admin/categories", label: "Categories", permission: "products:read", icon: "M4 6h16M4 12h10M4 18h6" },
  { href: "/admin/orders", label: "Orders", permission: "orders:read", icon: "M6 4h12l1 4H5l1-4zM5 8h14v12H5zM9 12h6" },
  { href: "/admin/customers", label: "Customers", permission: "customers:read", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" },
  { href: "/admin/inventory", label: "Inventory", permission: "inventory:read", icon: "M3 7h18v13H3zM3 7l3-4h12l3 4M9 11h6" },
  { href: "/admin/payments", label: "Payments", permission: "payments:read", icon: "M3 6h18v12H3zM3 10h18M7 15h3" },
  { href: "/admin/refunds", label: "Refunds", permission: "payments:read", icon: "M9 14l-4-4 4-4M5 10h9a5 5 0 010 10h-2" },
  { href: "/admin/discounts", label: "Discounts", permission: "discounts:read", icon: "M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01" },
  { href: "/admin/shipping", label: "Shipping", permission: "shipping:read", icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z" },
  { href: "/admin/marketing", label: "Marketing", permission: "marketing:read", icon: "M3 11v2l13 5V6L3 11zM16 9a3 3 0 010 6M6 13l1 6h3l-1-5" },
  { href: "/admin/analytics", label: "Analytics", permission: "analytics:read", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { href: "/admin/staff", label: "Staff & permissions", permission: "staff:read", icon: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" },
  { href: "/admin/notifications", label: "Notifications", permission: "notifications:read", icon: "M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0" },
  { href: "/admin/settings", label: "Settings", permission: "settings:read", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-2.9-1.2l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 003 15H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1A1.7 1.7 0 009 3.1V3a2 2 0 114 0v.1a1.7 1.7 0 002.9 1.2l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" },
];
