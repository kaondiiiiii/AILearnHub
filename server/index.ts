import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { openai } from "./openai";
import path from "path";
import teacherAnalysisRoutes from "./routes/teacher-analysis";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup authentication
  setupAuth(app);
  
  // Register teacher analysis routes
  app.use('/api/teacher', teacherAnalysisRoutes);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error('Error:', err);
  });

  // Setup Vite in development only
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment variable or fallback to port 5000
  const port = parseInt(process.env.PORT || "5050", 10);

server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  log(`serving on port ${port}`);
});
}
)().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
}
);    