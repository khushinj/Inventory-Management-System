import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_SECRET } from "../middleware/authenticateToken.js";
import { User } from "../models/User.js";

const DEFAULT_ROUTES = {
  shop: "/retail",
  domestic: "/domestic-homepage",
  ecommerce: "/online-homepage",
};

const PORTAL_USERS = [
  { emailId: "Admin123@gmail.com", password: "admin#123", role: "admin", defaultRoute: "/analytics" },
  { emailId: "shop.owner@gmail.com", password: "shop#123", role: "shop", defaultRoute: "/retail" },
  { emailId: "domestic.owner@gmail.com", password: "domestic#123", role: "domestic", defaultRoute: "/domestic-homepage" },
  { emailId: "ecommerce.owner@gmail.com", password: "ecommerce#123", role: "ecommerce", defaultRoute: "/online-homepage" },
  { emailId: "inventory.po@gmail.com", password: "inventory#123", role: "inventoryPo", defaultRoute: "/inventory-po-access" },
  { emailId: "jobcard.user@gmail.com", password: "jobcard#123", role: "jobcard", defaultRoute: "/jobcard-access" },
  { emailId: "exportfob.user@gmail.com", password: "expfob#2026", role: "exportFob", defaultRoute: "/export-fob" },
];

export async function login(req, res) {
  const emailId = String(req.body?.emailId || "").trim();
  const password = String(req.body?.password || "");
  const portalUser = PORTAL_USERS.find((item) => item.emailId === emailId && item.password === password);
  const registeredUser = portalUser ? null : await User.findOne({ emailId: emailId.toLowerCase() }).lean();
  const registeredPasswordMatches = registeredUser
    ? await bcrypt.compare(password, registeredUser.passwordHash)
    : false;
  const user = portalUser || (registeredUser && registeredPasswordMatches
    ? { ...registeredUser, defaultRoute: DEFAULT_ROUTES[registeredUser.role] }
    : null);

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid email ID or password" });
  }

  const token = jwt.sign({ emailId: user.emailId, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
  return res.json({
    success: true,
    token,
    user: { emailId: user.emailId, role: user.role, defaultRoute: user.defaultRoute },
  });
}

export async function signup(req, res) {
  const emailId = String(req.body?.emailId || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const role = String(req.body?.role || "shop");

  if (!emailId || !emailId.includes("@")) {
    return res.status(400).json({ success: false, message: "A valid email ID is required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }
  if (!Object.hasOwn(DEFAULT_ROUTES, role)) {
    return res.status(400).json({ success: false, message: "Invalid signup role" });
  }

  const existingPortalUser = PORTAL_USERS.some((item) => item.emailId.toLowerCase() === emailId);
  const existingUser = await User.exists({ emailId });
  if (existingPortalUser || existingUser) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ emailId, passwordHash, role });
  return res.status(201).json({ success: true, message: "Account created successfully" });
}