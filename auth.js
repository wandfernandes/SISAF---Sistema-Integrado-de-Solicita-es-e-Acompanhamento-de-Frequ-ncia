import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import express from 'express';
import { storage } from "./storage.js";
import { insertUserSchema } from "../shared/schema.js";
const scryptAsync = promisify(scrypt);
export async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64));
    return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64));
    return timingSafeEqual(hashedBuf, suppliedBuf);
}
export function setupAuth(app) {
    app.use(session({
        store: storage.sessionStore,
        secret: process.env.SESSION_SECRET || 'development_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            const user = await storage.getUserByUsername(username);
            if (!user || !(await comparePasswords(password, user.password))) {
                return done(null, false);
            }
            const authUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                active: user.active
            };
            return done(null, authUser);
        }
        catch (error) {
            return done(error);
        }
    }));
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await storage.getUser(id);
            if (!user) {
                return done(new Error('User not found'));
            }
            const authUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                active: user.active
            };
            done(null, authUser);
        }
        catch (error) {
            done(error);
        }
    });
    const router = express.Router();
    router.post("/register", async (req, res) => {
        try {
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
            const authUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                active: user.active
            };
            req.login(authUser, (err) => {
                if (err) {
                    return res.status(500).json({ message: "Error creating session" });
                }
                res.status(201).json({ user: { ...authUser } });
            });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    });
    router.post("/login", passport.authenticate("local"), (req, res) => {
        res.json({ user: req.user });
    });
    app.use("/api/auth", router);
}
//# sourceMappingURL=auth.js.map