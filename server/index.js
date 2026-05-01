require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { fileURLToPath } = require("url");
const { pool, initDB, seedAdmin } = require("./db");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const userRoutes = require("./routes/users");

const app = express();

app.use(express.json());

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (_req, res) => {
  return res.json({ status: "ok", app: "TaskForge" });
});

if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(require.main.filename);
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    }
  });
}

const PORT = process.env.PORT || 5000;

initDB()
  .then(() => seedAdmin())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`TaskForge server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error.message);
    pool.end();
    process.exit(1);
  });
