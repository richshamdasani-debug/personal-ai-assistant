/**
 * Personal AI Assistant — Express API
 *
 * Responsibilities:
 * - User auth (register / login / JWT)
 * - Stripe billing (checkout, webhooks, plan management)
 * - Agent lifecycle (provision / suspend / teardown containers)
 * - Webhook ingestion from Telegram & WhatsApp → route to user's agent
 */

import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { agentRouter } from "./routes/agents.js";
import { billingRouter } from "./routes/billing.js";
import { usersRouter } from "./routes/users.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { telegramRouter } from "./routes/telegram.js";

const app = express();
const PORT = process.env.API_PORT ?? 4000;

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    credentials: true,
  })
);

// ── Stripe webhook needs raw body — mount before json() ─────────────────────
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" })
);

// ── Telegram webhook — dedicated router with rich response logic ─────────────
app.use("/api/webhooks/telegram", telegramRouter);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Global rate limiting ─────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  })
);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/users", usersRouter);
app.use("/api/agents", agentRouter);
app.use("/api/billing", billingRouter);
app.use("/api/webhooks", webhooksRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[API error]", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`[API] Listening on http://localhost:${PORT}`);
});
