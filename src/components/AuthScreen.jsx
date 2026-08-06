import { useState } from "react";

export default function AuthScreen({ onSignIn, onSignUp, authError, clearAuthError }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(evt) {
    evt.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") await onSignIn(email, password);
      else await onSignUp(email, password);
    } catch {
      // authError is already set by useAuth
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    clearAuthError();
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-mark">$</span>
          <h1 className="auth-title">Expense Tracker</h1>
          <p className="auth-subtitle">Track spending. Stay on budget.</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${mode === "signin" ? "active" : ""}`} onClick={() => switchMode("signin")}>Sign In</button>
          <button type="button" className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>Create Account</button>
        </div>

        {authError && <p className="auth-error">{authError}</p>}

        <form className="auth-form" onSubmit={handleSubmit} autoComplete="on">
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" required autoComplete="email"
                   value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" type="password" required minLength={6}
                   autoComplete={mode === "signin" ? "current-password" : "new-password"}
                   value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={submitting}>
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="auth-footnote">Your data is securely stored in the cloud.</p>
      </div>
    </div>
  );
}
