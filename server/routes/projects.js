const express = require("express");
const { pool } = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/*
  TASKFORGE RBAC SUMMARY
  ======================
  ADMIN:
    ✓ Create projects
    ✓ Edit / Delete projects
    ✓ Add / Remove members
    ✓ Create tasks
    ✓ Edit all task fields
    ✓ Delete tasks
    ✓ Assign tasks to members
    ✓ View team overview on dashboard

  MEMBER:
    ✓ View projects they are added to
    ✓ View all tasks in those projects
    ✓ Update STATUS of tasks assigned to them ONLY
    ✗ Cannot create tasks
    ✗ Cannot edit task details (title, priority, due date, assignee)
    ✗ Cannot delete tasks
    ✗ Cannot create, edit, or delete projects
    ✗ Cannot add or remove members
*/

const isUserProjectMember = async (projectId, userId) => {
  const result = await pool.query(
    `SELECT 1
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id
     WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
     LIMIT 1`,
    [projectId, userId]
  );
  return result.rowCount > 0;
};

const getProjectOwnerId = async (projectId) => {
  const result = await pool.query(
    "SELECT id, owner_id FROM projects WHERE id = $1",
    [projectId]
  );
  return result.rows[0] || null;
};

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT p.*, owner.name AS owner_name
       FROM projects p
       LEFT JOIN users owner ON owner.id = p.owner_id
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE p.owner_id = $1 OR pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      data: result.rows,
      message: "Projects fetched successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    // Only admins can create projects
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create projects" });
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    await client.query("BEGIN");
    const projectResult = await client.query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, req.user.id]
    );

    const project = projectResult.rows[0];
    await client.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [project.id, req.user.id]
    );
    await client.query("COMMIT");

    return res.status(201).json({
      data: project,
      message: "Project created successfully",
    });
  } catch (_error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "Failed to create project" });
  } finally {
    client.release();
  }
});

router.get("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }

    const hasAccess = await isUserProjectMember(projectId, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this project" });
    }

    const projectResult = await pool.query(
      `SELECT p.*, owner.name AS owner_name
       FROM projects p
       LEFT JOIN users owner ON owner.id = p.owner_id
       WHERE p.id = $1`,
      [projectId]
    );
    if (projectResult.rowCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY u.name ASC`,
      [projectId]
    );

    return res.json({
      data: { ...projectResult.rows[0], members: membersResult.rows },
      message: "Project fetched successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to fetch project" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }

    const existingProject = await getProjectOwnerId(projectId);
    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (req.user.role !== "admin" && existingProject.owner_id !== req.user.id) {
      return res.status(403).json({ error: "You are not allowed to update this project" });
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [name, description || null, projectId]
    );

    return res.json({
      data: result.rows[0],
      message: "Project updated successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to update project" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: "Invalid project id" });
    }

    const existingProject = await getProjectOwnerId(projectId);
    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (req.user.role !== "admin" && existingProject.owner_id !== req.user.id) {
      return res.status(403).json({ error: "You are not allowed to delete this project" });
    }

    await pool.query("DELETE FROM projects WHERE id = $1", [projectId]);
    return res.json({
      data: { id: projectId },
      message: "Project deleted successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to delete project" });
  }
});

router.post("/:id/members", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = Number(req.body.userId);
    if (!Number.isInteger(projectId) || !Number.isInteger(userId)) {
      return res.status(400).json({ error: "Valid project id and userId are required" });
    }

    const existingProject = await getProjectOwnerId(projectId);
    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (req.user.role !== "admin" && existingProject.owner_id !== req.user.id) {
      return res.status(403).json({ error: "You are not allowed to add members" });
    }

    const userExists = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (userExists.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const memberResult = await pool.query(
      `INSERT INTO project_members (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING
       RETURNING *`,
      [projectId, userId]
    );

    if (memberResult.rowCount === 0) {
      return res.status(400).json({ error: "User is already a project member" });
    }

    return res.status(201).json({
      data: memberResult.rows[0],
      message: "Member added successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to add project member" });
  }
});

router.delete("/:id/members/:userId", async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const userId = Number(req.params.userId);
    if (!Number.isInteger(projectId) || !Number.isInteger(userId)) {
      return res.status(400).json({ error: "Invalid project id or user id" });
    }

    const existingProject = await getProjectOwnerId(projectId);
    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (req.user.role !== "admin" && existingProject.owner_id !== req.user.id) {
      return res.status(403).json({ error: "You are not allowed to remove members" });
    }

    const result = await pool.query(
      "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id",
      [projectId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Member not found in this project" });
    }

    return res.json({
      data: { projectId, userId },
      message: "Member removed successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to remove project member" });
  }
});

module.exports = router;
