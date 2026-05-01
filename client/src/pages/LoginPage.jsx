import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", form);
      const { user, token } = response.data.data;
      login(user, token);
      showToast("Welcome back!");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
      showToast("Login failed", "error");
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
          <h1 className="auth-tagline">Build together.<br />Ship faster.</h1>
          <p className="auth-subtitle">Manage projects, track tasks, and move as one team.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Role-based access control</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Real-time task tracking</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot" />
              <span>Kanban & list views</span>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          © 2026 TaskForge. Built for teams.
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-form-subtitle">Sign in to your workspace</p>

          {error ? <div className="btn-danger btn-sm" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>{error}</div> : null}

          <form onSubmit={onSubmit} className="auth-form">
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
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ height: '44px', fontSize: '15px', marginTop: '8px' }} type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In"}
            </button>
          </form>

          <p className="auth-link-row">
            Don't have an account? <Link to="/register">Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
