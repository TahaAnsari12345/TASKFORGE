import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import MemberStatusModal from "../components/MemberStatusModal";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, isOverdue, toInputDate, getAvatarBg, getInitials } from "../utils/helpers";

const emptyTaskForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assignedTo: "",
  dueDate: "",
};

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <rect x="2" y="4.5" width="6" height="5" rx="1" fill="currentColor" opacity="0.4"/>
    <path d="M3 4.5V3a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [memberStatusModal, setMemberStatusModal] = useState({ isOpen: false, task: null });

  const isAdmin = user?.role === "admin";

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, tasksRes, usersRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get("/tasks", { params: { projectId: id } }),
        api.get("/users"),
      ]);
      setProject(projectRes.data.data);
      setTasks(tasksRes.data.data || []);
      setAllUsers(usersRes.data.data || []);
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to load project details", "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const canManageProject = useMemo(() => {
    if (!project || !user) return false;
    return user.role === "admin" || project.owner_id === user.id;
  }, [project, user]);

  const availableUsers = useMemo(() => {
    const memberIds = new Set((project?.members || []).map((member) => member.id));
    return allUsers.filter((candidate) => !memberIds.has(candidate.id));
  }, [allUsers, project]);

  const groupedTasks = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo"),
      in_progress: tasks.filter((task) => task.status === "in_progress"),
      done: tasks.filter((task) => task.status === "done"),
    }),
    [tasks]
  );

  const openTaskModal = (task = null) => {
    setSelectedTask(task);
    if (task) {
      setTaskForm({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        assignedTo: task.assigned_to || "",
        dueDate: toInputDate(task.due_date),
      });
    } else {
      setTaskForm(emptyTaskForm);
    }
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setSelectedTask(null);
    setTaskForm(emptyTaskForm);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (!taskForm.title.trim()) {
      showToast("Task title is required", "error");
      return;
    }
    setModalLoading(true);
    const payload = {
      title: taskForm.title,
      description: taskForm.description || null,
      status: taskForm.status,
      priority: taskForm.priority,
      assignedTo: taskForm.assignedTo ? Number(taskForm.assignedTo) : null,
      dueDate: taskForm.dueDate || null,
    };
    try {
      if (selectedTask) {
        await api.put(`/tasks/${selectedTask.id}`, payload);
        showToast("Task updated");
      } else {
        await api.post("/tasks", {
          ...payload,
          projectId: Number(id),
        });
        showToast("Task created");
      }
      closeTaskModal();
      fetchProjectData();
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to save task", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const removeTask = async () => {
    if (!selectedTask) return;
    setModalLoading(true);
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      showToast("Task deleted");
      setDeleteModalOpen(false);
      setSelectedTask(null);
      fetchProjectData();
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to delete task", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, updates) => {
    try {
      await api.put(`/tasks/${taskId}`, updates);
      await fetchProjectData();
      showToast('Task updated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update task', 'error');
    }
  };

  const addMember = async () => {
    if (!selectedUserId) {
      showToast("Please select a user", "error");
      return;
    }
    setModalLoading(true);
    try {
      await api.post(`/projects/${id}/members`, { userId: Number(selectedUserId) });
      showToast("Member added");
      setMemberModalOpen(false);
      setSelectedUserId("");
      fetchProjectData();
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to add member", "error");
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Project">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <span className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout title="Project">
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Project not found or access denied.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={project.name}
      breadcrumb={`taskforge / projects / ${project.name.toLowerCase().replace(/\s+/g, '-')}`}
      action={
        isAdmin && (
          <button className="btn btn-ghost btn-sm" onClick={() => setMemberModalOpen(true)}>
            Add Member
          </button>
        )
      }
    >
      <div className="card" style={{ marginBottom: '32px', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px', 
          background: 'linear-gradient(90deg, var(--purple-core), var(--pink-core))',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0'
        }} />
        <h2 style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Syne' }}>{project.name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{project.description || "No description provided."}</p>
        
        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team</span>
          <div style={{ display: 'flex' }}>
            {(project.members || []).map((m, i) => {
              const avatarStyle = getAvatarBg(m.name);
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div 
                    className="avatar-circle"
                    style={{ 
                      background: avatarStyle.bg, color: avatarStyle.color,
                      width: '28px', height: '28px', fontSize: '11px',
                      marginLeft: i === 0 ? 0 : '-10px',
                      border: '2px solid var(--bg-overlay)'
                    }}
                    title={m.name}
                  >
                    {getInitials(m.name)}
                  </div>
                  {isAdmin && m.role === 'member' && (
                    <span title="Limited access — status updates only" style={{display: 'inline-flex', alignItems: 'center', marginLeft: '4px', color: 'var(--text-disabled)'}}>
                      <LockIcon />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="kanban-board-container">
        {[
          { key: "todo", label: "Todo", color: "var(--purple-core)" },
          { key: "in_progress", label: "In Progress", color: "var(--amber)" },
          { key: "done", label: "Done", color: "var(--green)" },
        ].map((column) => (
          <div className="kanban-column-premium" key={column.key}>
            <div className="kanban-column-header">
              <div className="kanban-title-row">
                <div className="kanban-dot" style={{ background: column.color }} />
                <span className="kanban-title">{column.label}</span>
              </div>
              <span className="badge" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                {groupedTasks[column.key].length}
              </span>
            </div>

            <div className="task-cards-stack">
              {groupedTasks[column.key].map((task) => {
                const avatarStyle = getAvatarBg(task.assigned_to_name);
                const canEdit = isAdmin || (user?.role === 'member' && task.assigned_to === user?.id);
                const canDelete = isAdmin;
                return (
                  <div className="task-card-premium" key={task.id} onClick={() => { if (canEdit) openTaskModal(task); }}>
                    <div className="task-card-top">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </div>
                    <div className="task-card-title">{task.title}</div>
                    <p className="task-card-desc">{task.description || "No description provided."}</p>
                    
                    <div className="task-card-footer">
                      <div className="task-assignee-row">
                        <div 
                          className="avatar-circle"
                          style={{ 
                            background: avatarStyle.bg, color: avatarStyle.color,
                            width: '24px', height: '24px', fontSize: '10px'
                          }}
                        >
                          {getInitials(task.assigned_to_name)}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.assigned_to_name || "Unassigned"}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="task-actions" style={{ display: 'flex', gap: '4px' }}>
                          {canEdit && (
                            <button 
                              className="btn-icon" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isAdmin) {
                                  openTaskModal(task);
                                } else {
                                  setMemberStatusModal({ isOpen: true, task });
                                }
                              }} 
                              style={{ padding: '4px' }}
                            >
                              <EditIcon />
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setDeleteModalOpen(true); }} style={{ padding: '4px' }}>
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                        <span className="task-due-date" style={{ color: isOverdue(task.due_date, task.status) ? 'var(--red)' : 'var(--text-muted)' }}>
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isAdmin && column.key === "todo" && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  style={{ borderStyle: 'dashed', width: '100%', marginTop: '8px', color: 'var(--text-muted)' }}
                  onClick={() => openTaskModal()}
                >
                  + Add task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <Modal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title="Add Member"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setMemberModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={addMember} disabled={modalLoading}>
              {modalLoading ? <span className="spinner" /> : "Add Member"}
            </button>
          </>
        }
      >
        <div className="auth-form" style={{ marginTop: 0 }}>
          <div>
            <label htmlFor="member-select">Select User</label>
            <select
              id="member-select"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value="">Select a user</option>
              {availableUsers.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} ({candidate.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={taskModalOpen}
        onClose={closeTaskModal}
        title={selectedTask ? "Edit Task" : "Add Task"}
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={closeTaskModal}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={saveTask} disabled={modalLoading}>
              {modalLoading ? <span className="spinner" /> : selectedTask ? "Save Task" : "Create Task"}
            </button>
          </>
        }
      >
        <form className="auth-form" onSubmit={saveTask} style={{ marginTop: 0 }}>
          <div>
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              placeholder="e.g. Implement auth flow"
              value={taskForm.title}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              rows={3}
              placeholder="Describe the task details..."
              value={taskForm.description}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={taskForm.status}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={taskForm.priority}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label htmlFor="task-assignee">Assign To</label>
              <select
                id="task-assignee"
                value={taskForm.assignedTo}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
              >
                <option value="">Unassigned</option>
                {(project.members || []).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                type="date"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
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
            <button className="btn btn-danger btn-sm" onClick={removeTask} disabled={modalLoading}>
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
        projectName={project?.name}
        onUpdate={handleUpdateTaskStatus}
      />
    </Layout>
  );
}

export default ProjectDetailPage;
