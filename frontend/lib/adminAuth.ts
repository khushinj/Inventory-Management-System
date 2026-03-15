export const AUTH_COOKIE_NAME = "ims_admin_auth";
export const AUTH_ROLE_COOKIE_NAME = "ims_user_role";

export type UserRole = "admin" | "shop" | "domestic" | "ecommerce" | "inventoryPo" | "jobcard";

type PortalUser = {
  emailId: string;
  password: string;
  role: UserRole;
  defaultRoute: string;
};

const PORTAL_USERS: PortalUser[] = [
  {
    emailId: "Admin123@gmail.com",
    password: "admin#123",
    role: "admin",
    defaultRoute: "/analytics",
  },
  {
    emailId: "shop.owner@gmail.com",
    password: "shop#123",
    role: "shop",
    defaultRoute: "/retail",
  },
  {
    emailId: "domestic.owner@gmail.com",
    password: "domestic#123",
    role: "domestic",
    defaultRoute: "/domestic-homepage",
  },
  {
    emailId: "ecommerce.owner@gmail.com",
    password: "ecommerce#123",
    role: "ecommerce",
    defaultRoute: "/online-homepage",
  },
  {
    emailId: "inventory.po@gmail.com",
    password: "inventory#123",
    role: "inventoryPo",
    defaultRoute: "/inventory-po-access",
  },
  {
    emailId: "jobcard.user@gmail.com",
    password: "jobcard#123",
    role: "jobcard",
    defaultRoute: "/jobcard-access",
  },
];

const ROLE_ALLOWED_ROUTE_PREFIXES: Record<UserRole, string[]> = {
  admin: ["/analytics", "/shop-analytics", "/ecommerce-analytics", "/domestic-analytics"],
  shop: ["/retail", "/shop", "/shop-inventory", "/shop-stock-returned", "/daily-report", "/shop-analytics"],
  domestic: [
    "/domestic-homepage",
    "/domestic",
    "/domestic-inventory",
    "/domestic-online-sales",
    "/domestic-analytics",
    "/purchase-order-dashboard",
  ],
  ecommerce: ["/online-homepage", "/online", "/online-inventory", "/online-daily-report", "/ecommerce-analytics"],
  inventoryPo: [
    "/inventory-po-access",
    "/shop-inventory",
    "/domestic-inventory",
    "/online-inventory",
    "/domestic/purchase-order",
    "/purchase-order-dashboard",
  ],
  jobcard: [
    "/jobcard-access",
    "/jobcard",
    "/jobcard-dashboard",
    "/jobcard-forms",
  ],
};

export const ACCESS_CONTROLLED_ROUTE_PREFIXES = Array.from(
  new Set(Object.values(ROLE_ALLOWED_ROUTE_PREFIXES).flat()),
);

export function authenticateUser(emailId: string, password: string): PortalUser | null {
  const user = PORTAL_USERS.find(
    (item) => item.emailId === emailId && item.password === password,
  );
  return user ?? null;
}

export function getDefaultRouteForRole(role: UserRole): string {
  return PORTAL_USERS.find((item) => item.role === role)?.defaultRoute ?? "/login";
}

export function isRole(value: string): value is UserRole {
  return (
    value === "admin" ||
    value === "shop" ||
    value === "domestic" ||
    value === "ecommerce" ||
    value === "inventoryPo" ||
    value === "jobcard"
  );
}

export function isRouteAllowedForRole(pathname: string, role: UserRole): boolean {
  return ROLE_ALLOWED_ROUTE_PREFIXES[role].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}?`),
  );
}
