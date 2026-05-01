import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, getProjectColor, getAvatarBg, getInitials } from "../utils/helpers";

const defaultProjectForm = { name: "", description: "" };

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

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

function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [projectForm, setProjectForm] = useState(defaultProjectForm);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/projects");
      const baseProjects = response.data.data || [];
      const enriched = await Promise.all(
        baseProjects.map(async (project) => {
          try {
            const [detailRes, tasksRes] = await Promise.all([
              api.get(`/projects/${project.id}`),
              api.get("/tasks", { params: { projectId: project.id } }),
            ]);
            return {
              ...project,
              members: detailRes.data.data.members || [],
              taskCount: tasksRes.data.data?.length || 0,
            };
          } catch (_error) {
            return { ...project, members: [], taskCount: 0 };
          }
        })
      );
      setProjects(enriched);
    } catch (_error) {
      showToast("Failed to fetch projects", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openCreate = () => {
    setSelectedProject(null);
    setProjectForm(defaultProjectForm);
    setIsModalOpen(true);
  };

  const openEdit = (project) => {
    setSelectedProject(project);
    setProjectForm({
      name: project.name || "",
      description: project.description || "",
    });
    setIsModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsDeleteOpen(false);
    setSelectedProject(null);
    setProjectForm(defaultProjectForm);
  };

  const submitProject = async (event) => {
    event.preventDefault();
    if (!projectForm.name.trim()) {
      showToast("Project name is required", "error");
      return;
    }
    setFormLoading(true);
    try {
      if (selectedProject) {
        await api.put(`/projects/${selectedProject.id}`, projectForm);
        showToast("Project updated");
      } else {
        await api.post("/projects", projectForm);
        showToast("Project created");
      }
      closeModals();
      fetchProjects();
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to save project", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const removeProject = async () => {
    if (!selectedProject) return;
    setFormLoading(true);
    try {
      await api.delete(`/projects/${selectedProject.id}`);
      showToast("Project deleted");
      closeModals();
      fetchProjects();
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to delete project", "error");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Layout
      title="Projects"
      action={
        user?.role === "admin" && (
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon />
            <span>New Project</span>
          </button>
        )
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <span className="spinner" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {user?.role === "admin"
              ? "No projects yet. Create your first project to start collaborating."
              : "You are not a member of any projects yet. Ask an admin to add you to a project."}
          </p>
          {user?.role === "admin" && (
            <button className="btn btn-primary" onClick={openCreate}>
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {projects.map((project) => {
            const isAdmin = user?.role === "admin";
            const accentColor = getProjectColor(project.name);
            return (
              <div 
                className="card" 
                key={project.id} 
                style={{ position: 'relative', padding: '24px', transition: 'transform 0.2s, border-color 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, right: 0, 
                  height: '3px', 
                  background: accentColor,
                  borderTopLeftRadius: 'var(--radius-xl)',
                  borderTopRightRadius: 'var(--radius-xl)'
                }} />
                
                <h3 style={{ marginTop: '16px', fontSize: '18px' }}>{project.name}</h3>
                <p style={{ 
                  fontSize: '13px', 
                  color: 'var(--text-secondary)', 
                  marginTop: '6px', 
                  minHeight: '38px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {project.description || "No description provided."}
                </p>

                <div className="divider" style={{ margin: '20px 0' }} />

                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '16px', color: 'var(--text-primary)' }}>{project.members.length}</div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Members</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '16px', color: 'var(--text-primary)' }}>{project.taskCount}</div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Tasks</div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex' }}>
                    {project.members.slice(0, 4).map((m, i) => {
                      const avatarStyle = getAvatarBg(m.name);
                      return (
                        <div 
                          key={m.id} 
                          className="avatar-circle"
                          style={{ 
                            background: avatarStyle.bg, 
                            color: avatarStyle.color,
                            width: '24px', height: '24px',
                            fontSize: '10px',
                            marginLeft: i === 0 ? 0 : '-8px',
                            border: '2px solid var(--bg-overlay)'
                          }}
                        >
                          {getInitials(m.name)}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isAdmin && (
                      <>
                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEdit(project); }}>
                          <EditIcon />
                        </button>
                        <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); setSelectedProject(project); setIsDeleteOpen(true); }}>
                          <TrashIcon />
                        </button>
                      </>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/projects/${project.id}`)}>
                      Open →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModals}
        title={selectedProject ? "Edit Project" : "Create Project"}
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={closeModals}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={submitProject} disabled={formLoading}>
              {formLoading ? <span className="spinner" /> : selectedProject ? "Save Changes" : "Create Project"}
            </button>
          </>
        }
      >
        <form className="auth-form" onSubmit={submitProject} style={{ marginTop: 0 }}>
          <div>
            <label htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              placeholder="e.g. Operation Violet"
              value={projectForm.name}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              rows={4}
              placeholder="Describe the workspace goals..."
              value={projectForm.description}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        onClose={closeModals}
        title="Delete Project"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={closeModals}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={removeProject} disabled={formLoading}>
              {formLoading ? <span className="spinner" /> : "Delete Project"}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Are you sure you want to delete <strong>{selectedProject?.name}</strong>? This action cannot be undone and all associated tasks will be lost.
        </p>
      </Modal>
    </Layout>
  );
}

export default ProjectsPage;
