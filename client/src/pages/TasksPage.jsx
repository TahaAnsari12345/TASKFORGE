import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import MemberStatusModal from "../components/MemberStatusModal";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, isOverdue, toInputDate, getAvatarBg, getInitials } from "../utils/helpers";

const initialFilters = {
  status: "",
  priority: "",
  search: "",
};

const emptyEditForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assignedTo: "",
  dueDate: "",
};

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function TasksPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [modalLoading, setModalLoading] = useState(false);
  const [memberStatusModal, setMemberStatusModal] = useState({ isOpen: false, task: null });

  const isAdmin = user?.role === "admin";

  const projectNameById = useMemo(
    () =>
      projects.reduce((acc, project) => {
        acc[project.id] = project.name;
        return acc;
      }, {}),
    [projects]
  );

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, usersRes, projectsRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/users"),
        api.get("/projects"),
      ]);
      setTasks(tasksRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setProjects(projectsRes.data.data || []);
    } catch (_error) {
      showToast("Failed to fetch tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusPass = !filters.status || task.status === filters.status;
      const priorityPass = !filters.priority || task.priority === filters.priority;
      const searchPass =
        !filters.search || task.title.toLowerCase().includes(filters.search.toLowerCase().trim());
      return statusPass && priorityPass && searchPass;
    });
  }, [tasks, filters]);

  const openEditModal = (task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      assignedTo: task.assigned_to || "",
      dueDate: toInputDate(task.due_date),
    });
    setTaskModalOpen(true);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (!selectedTask) return;
    setModalLoading(true);
    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        title: editForm.title,
        description: editForm.description || null,
        status: editForm.status,
        priority: editForm.priority,
        assignedTo: editForm.assignedTo ? Number(editForm.assignedTo) : null,
        dueDate: editForm.dueDate || null,
      });
      showToast("Task updated");
      setTaskModalOpen(false);
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to update task", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const deleteTask = async () => {
    if (!selectedTask) return;
    setModalLoading(true);
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      showToast("Task deleted");
      setDeleteModalOpen(false);
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to delete task", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, updates) => {
    try {
      await api.put(`/tasks/${taskId}`, updates);
      await loadTasks();
      showToast('Task updated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update task', 'error');
    }
  };

  return (
    <Layout
      title="Tasks"
      action={
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            style={{ width: '140px' }}
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select 
            style={{ width: '140px' }}
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input 
          style={{ maxWidth: '300px', fontFamily: 'IBM Plex Mono' }}
          placeholder="SEARCH_TASKS..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <span className="spinner" />
        </div>
      ) : (
        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Title & Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const avatarStyle = getAvatarBg(task.assigned_to_name);
                  const canEdit = isAdmin || (user?.role === 'member' && task.assigned_to === user?.id);
                  const canDelete = isAdmin;
                  const isViewOnly = !isAdmin && task.assigned_to !== user?.id;
                  return (
                    <tr key={task.id} style={{ opacity: isViewOnly ? 0.6 : 1, cursor: isViewOnly ? 'default' : 'pointer' }}>
                      <td>
                        <div className="title-cell">
                          <span style={{ fontWeight: '500' }}>{task.title}</span>
                          <span className="project-tag">{projectNameById[task.project_id] || "Unknown"}</span>
                          {isViewOnly && (
                            <span className="badge" style={{background: 'var(--bg-raised)', color: 'var(--text-disabled)', fontSize: '10px', padding: '2px 6px', marginLeft: '8px'}}>
                              View only
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div 
                            className="avatar-circle"
                            style={{ 
                              background: avatarStyle.bg, color: avatarStyle.color,
                              width: '24px', height: '24px', fontSize: '10px'
                            }}
                          >
                            {getInitials(task.assigned_to_name)}
                          </div>
                          <span>{task.assigned_to_name || "Unassigned"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${task.status.replace('_', '')}`}>{task.status.replace('_', ' ')}</span>
                      </td>
                      <td>
                        <span style={{ 
                          fontFamily: 'IBM Plex Mono', fontSize: '12px',
                          color: isOverdue(task.due_date, task.status) ? 'var(--red)' : 'var(--text-muted)'
                        }}>
                          {formatDate(task.due_date)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions" style={{ display: 'inline-flex', gap: '8px' }}>
                          {canEdit && (
                            <button 
                              className="btn-icon" 
                              onClick={() => {
                                if (isAdmin) {
                                  setSelectedTask(task);
                                  openEditModal(task);
                                } else {
                                  setMemberStatusModal({ isOpen: true, task });
                                }
                              }}
                            >
                              <EditIcon />
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn-icon danger" onClick={() => { setSelectedTask(task); setDeleteModalOpen(true); }}>
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Edit Task"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setTaskModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={saveTask} disabled={modalLoading}>
              {modalLoading ? <span className="spinner" /> : "Save Changes"}
            </button>
          </>
        }
      >
        <form className="auth-form" onSubmit={saveTask} style={{ marginTop: 0 }}>
          <div>
            <label htmlFor="et-title">Title</label>
            <input
              id="et-title"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="et-desc">Description</label>
            <textarea
              id="et-desc"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="et-status">Status</label>
              <select
                id="et-status"
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label htmlFor="et-priority">Priority</label>
              <select
                id="et-priority"
                value={editForm.priority}
                onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="et-assignee">Assign To</label>
              <select
                id="et-assignee"
                value={editForm.assignedTo}
                onChange={(e) => setEditForm(prev => ({ ...prev, assignedTo: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {users.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="et-date">Due Date</label>
              <input
                id="et-date"
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Task"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={deleteTask} disabled={modalLoading}>
              {modalLoading ? <span className="spinner" /> : "Delete Task"}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Are you sure you want to delete <strong>{selectedTask?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>

      <MemberStatusModal
        isOpen={memberStatusModal.isOpen}
        onClose={() => setMemberStatusModal({ isOpen: false, task: null })}
        task={memberStatusModal.task}
        projectName={projects.find(p => p.id === selectedTask?.project_id)?.name}
        onUpdate={handleUpdateTaskStatus}
      />
    </Layout>
  );
}

export default TasksPage;
