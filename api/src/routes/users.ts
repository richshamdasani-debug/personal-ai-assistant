import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabase } from "../services/supabase.js";
import { provisionAgent } from "../services/agentProvisioner.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const usersRouter = Router();

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

// POST /api/users/register
usersRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { name, email, password } = parsed.data;

  // Check for existing user
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from("users")
    .insert({ name, email, password_hash: passwordHash, plan: "trial" })
    .select("id, email, name, plan")
    .single();

  if (error || !user) {
    console.error("[Register]", error);
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  // Kick off agent provisioning asynchronously — don't block the response
  provisionAgent(user.id).catch(console.error);

  res.status(201).json({ id: user.id, email: user.email, name: user.name, plan: user.plan });
});

// POST /api/users/login (used by NextAuth CredentialsProvider)
usersRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, plan, password_hash")
    .eq("email", email)
    .single();

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.json({ id: user.id, email: user.email, name: user.name, plan: user.plan });
});

// GET /api/users/me
usersRouter.get("/me", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, plan, created_at")
    .eq("id", userId)
    .single();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});
