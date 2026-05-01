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

const ALLOWED_STATUS = new Set(["todo", "in_progress", "done"]);
const ALLOWED_PRIORITY = new Set(["low", "medium", "high"]);

const getTaskWithMembership = async (taskId, userId) => {
  const result = await pool.query(
    `SELECT t.*, p.owner_id,
            EXISTS (
              SELECT 1
              FROM project_members pm
              WHERE pm.project_id = t.project_id AND pm.user_id = $2
            ) AS is_member
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     WHERE t.id = $1`,
    [taskId, userId]
  );
  return result.rows[0] || null;
};

const isProjectMember = async (projectId, userId) => {
  const result = await pool.query(
    `SELECT 1
     FROM project_members
     WHERE project_id = $1 AND user_id = $2
     LIMIT 1`,
    [projectId, userId]
  );
  return result.rowCount > 0;
};

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const { projectId, status, assignedTo } = req.query;
    const conditions = [
      `EXISTS (
         SELECT 1
         FROM project_members pm
         WHERE pm.project_id = t.project_id
           AND pm.user_id = $1
       )`,
    ];
    const values = [req.user.id];

    if (projectId) {
      values.push(Number(projectId));
      conditions.push(`t.project_id = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }
    if (assignedTo) {
      values.push(Number(assignedTo));
      conditions.push(`t.assigned_to = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT t.*,
              assignee.name AS assigned_to_name,
              creator.name AS created_by_name,
              (t.due_date < CURRENT_DATE AND t.status != 'done') AS overdue
       FROM tasks t
       LEFT JOIN users assignee ON assignee.id = t.assigned_to
       LEFT JOIN users creator ON creator.id = t.created_by
       WHERE ${conditions.join(" AND ")}
       ORDER BY t.created_at DESC`,
      values
    );

    return res.json({
      data: result.rows,
      message: "Tasks fetched successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.post("/", async (req, res) => {
  try {
    // Only admins can create tasks
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create tasks" });
    }

    const {
      title,
      description,
      status = "todo",
      priority = "medium",
      projectId,
      assignedTo,
      dueDate,
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ error: "Title and projectId are required" });
    }
    if (!ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    if (!ALLOWED_PRIORITY.has(priority)) {
      return res.status(400).json({ error: "Invalid priority value" });
    }

    const member = await isProjectMember(Number(projectId), req.user.id);
    if (!member) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    if (assignedTo !== undefined && assignedTo !== null) {
      const assigneeMember = await isProjectMember(Number(projectId), Number(assignedTo));
      if (!assigneeMember) {
        return res
          .status(400)
          .json({ error: "Assigned user must be a member of the project" });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, project_id, assigned_to, created_by, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description || null,
        status,
        priority,
        Number(projectId),
        assignedTo ?? null,
        req.user.id,
        dueDate || null,
      ]
    );

    return res.status(201).json({
      data: result.rows[0],
      message: "Task created successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to create task" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const statsResult = await pool.query(
      `SELECT
         COUNT(*)::int AS "totalTasks",
         COUNT(*) FILTER (WHERE t.status = 'todo')::int AS "todoCount",
         COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS "inProgressCount",
         COUNT(*) FILTER (WHERE t.status = 'done')::int AS "doneCount",
         COUNT(*) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'done')::int AS "overdueCount"
       FROM tasks t
       WHERE EXISTS (
         SELECT 1
         FROM project_members pm
         WHERE pm.project_id = t.project_id AND pm.user_id = $1
       )`,
      [req.user.id]
    );

    const myTasksResult = await pool.query(
      `SELECT t.*
       FROM tasks t
       WHERE t.assigned_to = $1
         AND t.status != 'done'
         AND EXISTS (
           SELECT 1
           FROM project_members pm
           WHERE pm.project_id = t.project_id AND pm.user_id = $1
         )
       ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    return res.json({
      data: {
        ...statsResult.rows[0],
        myTasks: myTasksResult.rows,
      },
      message: "Task stats fetched successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to fetch task stats" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const existingTask = await getTaskWithMembership(taskId, req.user.id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }
    if (!existingTask.is_member) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
    } = req.body;

    // RBAC: Role-based access control
    if (req.user.role === "admin") {
      // Admins can update any field
      if (status !== undefined && !ALLOWED_STATUS.has(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      if (priority !== undefined && !ALLOWED_PRIORITY.has(priority)) {
        return res.status(400).json({ error: "Invalid priority value" });
      }

      if (assignedTo !== undefined && assignedTo !== null) {
        const assigneeMember = await isProjectMember(existingTask.project_id, Number(assignedTo));
        if (!assigneeMember) {
          return res
            .status(400)
            .json({ error: "Assigned user must be a member of the project" });
        }
      }
    } else {
      // Members can ONLY update status if task is assigned to them
      if (existingTask.assigned_to !== req.user.id) {
        return res.status(403).json({
          error: "You can only update tasks assigned to you",
        });
      }

      // Members can only update status
      if (title !== undefined || description !== undefined || priority !== undefined ||
          assignedTo !== undefined || dueDate !== undefined) {
        return res.status(403).json({
          error: "You can only update the status of tasks assigned to you",
        });
      }

      if (status !== undefined && !ALLOWED_STATUS.has(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${values.length + 1}`);
      values.push(priority);
    }
    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${values.length + 1}`);
      values.push(assignedTo ?? null);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${values.length + 1}`);
      values.push(dueDate ?? null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    values.push(taskId);
    const result = await pool.query(
      `UPDATE tasks
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    return res.json({
      data: result.rows[0],
      message: "Task updated successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    // Only admins can delete tasks
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete tasks" });
    }

    const existingTask = await getTaskWithMembership(taskId, req.user.id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
    return res.json({
      data: { id: taskId },
      message: "Task deleted successfully",
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to delete task" });
  }
});

module.exports = router;
