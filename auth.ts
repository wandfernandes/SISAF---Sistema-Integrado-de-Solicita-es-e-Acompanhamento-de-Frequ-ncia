import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import express from 'express';
import { storage } from "./storage.js";
import { type User, insertUserSchema } from "../shared/schema.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express): void {
  console.log('[Auth] Setting up authentication...');

  // Session setup
  app.use(session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  const router = express.Router();

  // Debug middleware for auth routes
  router.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Auth Debug] ${req.method} ${req.path}`);
    if (req.body) {
      console.log('[Auth Debug] Request body:', { ...req.body, password: '[REDACTED]' });
    }
    next();
  });

  // Registration endpoint
  router.post("/register", async (req, res) => {
    try {
      console.log('[Auth] Processing registration request');
      const validatedData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      console.log('[Auth] User created successfully:', { id: user.id, username: user.username });

      req.login(user, (err) => {
        if (err) {
          console.error('[Auth] Login error after registration:', err);
          return res.status(500).json({ message: "Error creating session" });
        }
        res.status(201).json({ user: { ...user, password: undefined } });
      });
    } catch (error: any) {
      console.error('[Auth] Registration error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Login endpoint
  router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ user: { ...user, password: undefined } });
      });
    })(req, res, next);
  });

  // Mount auth routes at /api/auth
  app.use("/api/auth", router);

  console.log('[Auth] Authentication setup completed');
  console.log('[Auth] Available routes:');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
}