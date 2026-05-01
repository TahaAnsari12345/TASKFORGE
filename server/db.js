const { Pool } = require("pg");

const getConnectionConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    };
  }

  // Local development fallback
  return {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "taskforge",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: false,
  };
};

const pool = new Pool(getConnectionConfig());

const initDB = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(30) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
      priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      due_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await pool.query(query);
};

const seedAdmin = async () => {
  try {
    const bcrypt = require("bcryptjs");
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@taskforge.com"]
    );
    if (existing.rows.length === 0) {
      const hashed = await bcrypt.hash("Admin@123", 10);
      await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)`,
        ["TaskForge Admin", "admin@taskforge.com", hashed, "admin"]
      );
      console.log("✓ Default admin created: admin@taskforge.com / Admin@123");
    }
  } catch (err) {
    console.error("Seed error:", err.message);
  }
};

module.exports = { pool, initDB, seedAdmin };
