import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = "Full name is required";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(form.email)) {
      nextErrors.email = "Please enter a valid email";
    }
    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    return nextErrors;
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/register", form);
      const { user, token } = response.data.data;
      login(user, token);
      showToast("Account created successfully");
      navigate("/", { replace: true });
    } catch (err) {
      const message = err.response?.data?.error || "Registration failed";
      setErrors((prev) => ({ ...prev, form: message }));
      showToast("Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout page-enter">
      <div className="auth-brand-panel">
        <div className="auth-logo-row">
          <div className="auth-logo-mark" />
          <span className="auth-logo-text">TaskForge</span>
        </div>

        <div className="auth-hero">
          <h1 className="auth-tagline">Start your journey.<br />Scale your team.</h1>
          <p className="auth-subtitle">Everything you need to manage complex projects in one place.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Intuitive Kanban workflow</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Advanced role permissions</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Detailed task analytics</span>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          © 2026 TaskForge. Built for teams. Built by <span className="highlight-author">Taha Ansari</span>.
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-form-subtitle">Set up your profile to get started</p>

          {errors.form ? <div className="btn-danger btn-sm" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>{errors.form}</div> : null}

          <form onSubmit={onSubmit} className="auth-form">
            <div>
              <label htmlFor="name">Full Name</label>
              <input 
                id="name" 
                name="name" 
                placeholder="John Doe"
                value={form.name} 
                onChange={onChange} 
                required 
              />
              {errors.name ? <p className="badge badge-overdue" style={{ marginTop: '4px', textTransform: 'none' }}>{errors.name}</p> : null}
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={onChange}
                required
              />
              {errors.email ? <p className="badge badge-overdue" style={{ marginTop: '4px', textTransform: 'none' }}>{errors.email}</p> : null}
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={onChange}
                required
              />
              {errors.password ? <p className="badge badge-overdue" style={{ marginTop: '4px', textTransform: 'none' }}>{errors.password}</p> : null}
            </div>
            <div>
              <label htmlFor="role">Workspace Role</label>
              <select id="role" name="role" value={form.role} onChange={onChange}>
                <option value="member">Team Member</option>
                <option value="admin">Workspace Admin</option>
              </select>
              {form.role === "admin" && (
                <div
                  style={{
                    background: "rgba(240,164,41,0.08)",
                    border: "1px solid rgba(240,164,41,0.2)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    fontSize: "12px",
                    color: "var(--warning)",
                    marginTop: "6px",
                  }}
                >
                  ⚠️ Admin accounts have full access to create and manage projects,
                  tasks, and team members.
                </div>
              )}
            </div>
            <button className="btn btn-primary" style={{ height: '44px', fontSize: '15px', marginTop: '8px' }} type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Account"}
            </button>
          </form>

          <p className="auth-link-row">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
