import { useState } from "react";
import Modal from "./Modal";

export default function MemberStatusModal({
  isOpen,
  onClose,
  task,
  projectName,
  onUpdate,
}) {
  const [status, setStatus] = useState(task?.status || "todo");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await onUpdate(task.id, { status });
      setIsLoading(false);
      onClose();
    } catch {
      setIsLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Content>
        <Modal.Header>
          <h2>Update Task Status</h2>
          <button onClick={onClose} className="btn-icon">
            ✕
          </button>
        </Modal.Header>

        <Modal.Body>
          <div style={{ display: "grid", gap: "1rem" }}>
            {/* Task Title Display */}
            <div>
              <label className="form-label">Task</label>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  background: "var(--bg-raised)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  margin: "0.5rem 0 0 0",
                }}
              >
                {task.title}
              </p>
            </div>

            {/* Project Badge */}
            {projectName && (
              <div>
                <span
                  className="badge"
                  style={{
                    background: "var(--bg-raised)",
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    padding: "4px 8px",
                  }}
                >
                  📁 {projectName}
                </span>
              </div>
            )}

            {/* Status Select */}
            <div>
              <label className="form-label">Move to</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-input"
                style={{ marginTop: "0.5rem" }}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done ✓</option>
              </select>
            </div>

            {/* Info Box */}
            <div
              style={{
                background: "rgba(139,127,232,0.06)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                fontSize: "12px",
                color: "var(--text-muted)",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "14px", marginTop: "-2px" }}>ℹ️</span>
              <span>
                As a member, you can only update the status of tasks assigned to you.
              </span>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? "Updating..." : "Update Status"}
          </button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
