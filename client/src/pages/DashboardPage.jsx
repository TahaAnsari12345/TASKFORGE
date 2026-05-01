import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import { formatDate, isOverdue } from "../utils/helpers";

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2v12M4 6h8M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 4v4h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 5v4M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function DashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    todoCount: 0,
    inProgressCount: 0,
    doneCount: 0,
    overdueCount: 0,
    myTasks: [],
  });
  const [projects, setProjects] = useState([]);
  const [projectMap, setProjectMap] = useState({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, projectsRes] = await Promise.all([api.get("/tasks/stats"), api.get("/projects")]);
      const projectList = projectsRes.data.data || [];
      const map = projectList.reduce((acc, project) => {
        acc[project.id] = project.name;
        return acc;
      }, {});
      setProjectMap(map);
      setStats(statsRes.data.data);

      const recent = projectList.slice(0, 8);
      const enriched = await Promise.all(
        recent.map(async (project) => {
          try {
            const [detailRes, tasksRes] = await Promise.all([
              api.get(`/projects/${project.id}`),
              api.get("/tasks", { params: { projectId: project.id } }),
            ]);
            return {
              ...project,
              memberCount: detailRes.data.data.members?.length || 0,
              taskCount: tasksRes.data.data?.length || 0,
            };
          } catch (_error) {
            return { ...project, memberCount: 0, taskCount: 0 };
          }
        })
      );
      setProjects(enriched);
    } catch (_error) {
      showToast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statusBars = useMemo(() => {
    const total = Number(stats.totalTasks) || 0;
    const toPercent = (count) => (total === 0 ? 0 : Math.round((count / total) * 100));
    return [
      { label: "Todo", color: "var(--purple-core)", count: stats.todoCount, value: toPercent(stats.todoCount) },
      { label: "In Progress", color: "var(--amber)", count: stats.inProgressCount, value: toPercent(stats.inProgressCount) },
      { label: "Done", color: "var(--green)", count: stats.doneCount, value: toPercent(stats.doneCount) },
    ];
  }, [stats]);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <span className="spinner" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="dash-stats-grid">
        <div className="card stat-card-premium" style={{ borderLeft: '3px solid var(--purple-core)' }}>
          <div className="stat-label-row">
            <h4>Total Tasks</h4>
            <span style={{ color: 'var(--purple-core)' }}><PinIcon /></span>
          </div>
          <div className="stat-value-large">{stats.totalTasks}</div>
          <div className="stat-watermark">{stats.totalTasks}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>All workspace items</div>
        </div>

        <div className="card stat-card-premium" style={{ borderLeft: '3px solid var(--amber)' }}>
          <div className="stat-label-row">
            <h4>In Progress</h4>
            <span style={{ color: 'var(--amber)' }}><ClockIcon /></span>
          </div>
          <div className="stat-value-large">{stats.inProgressCount}</div>
          <div className="stat-watermark">{stats.inProgressCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Active operations</div>
        </div>

        <div className="card stat-card-premium" style={{ borderLeft: '3px solid var(--green)' }}>
          <div className="stat-label-row">
            <h4>Completed</h4>
            <span style={{ color: 'var(--green)' }}><CheckIcon /></span>
          </div>
          <div className="stat-value-large">{stats.doneCount}</div>
          <div className="stat-watermark">{stats.doneCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Successfully shipped</div>
        </div>

        <div className="card stat-card-premium" style={{ borderLeft: '3px solid var(--red)' }}>
          <div className="stat-label-row">
            <h4>Overdue</h4>
            <span style={{ color: 'var(--red)' }}><AlertIcon /></span>
          </div>
          <div className="stat-value-large">{stats.overdueCount}</div>
          <div className="stat-watermark">{stats.overdueCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
            {Number(stats.overdueCount) > 0 && <span className="pulse-dot" />}
            Critical attention needed
          </div>
        </div>
      </div>

      <div className="dash-mid-grid">
        <div className="card">
          <div className="stat-label-row" style={{ marginBottom: '20px' }}>
            <h3>My Tasks</h3>
            <span className="badge badge-todo">{stats.myTasks?.length || 0}</span>
          </div>
          <div className="dash-task-list">
            {stats.myTasks?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No tasks assigned to you.</p>
            ) : (
              stats.myTasks.map(task => (
                <div key={task.id} className="task-item-row" onClick={() => navigate("/tasks")}>
                  <div className="task-item-left">
                    <div className="status-dot" style={{ background: task.status === 'done' ? 'var(--green)' : task.status === 'in_progress' ? 'var(--amber)' : 'var(--purple-core)' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{task.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
                        {projectMap[task.project_id] || 'Unknown Project'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span style={{ fontSize: '12px', color: isOverdue(task.due_date, task.status) ? 'var(--red)' : 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3>Task Breakdown</h3>
          <div style={{ marginTop: '24px' }}>
            {statusBars.map(bar => (
              <div key={bar.label} className="progress-bar-row">
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '80px' }}>{bar.label}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${bar.value}%`, background: bar.color }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right', fontFamily: 'IBM Plex Mono' }}>
                  {bar.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="stat-label-row">
          <h3>Recent Projects</h3>
          <Link to="/projects" style={{ fontSize: '13px', color: 'var(--purple-bright)', textDecoration: 'none' }}>View all →</Link>
        </div>
        <div className="project-h-scroll">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="card-sm" 
              style={{ minWidth: '220px', cursor: 'pointer' }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: '700' }}>{project.name}</div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', height: '36px', overflow: 'hidden' }}>
                {project.description || 'No description provided.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>
                <span>{project.memberCount} MBR</span>
                <span>{project.taskCount} TSK</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default DashboardPage;
