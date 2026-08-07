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
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm bg-surface shadow-soft rounded-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <span className="inline-grid place-items-center w-12 h-12 rounded-input bg-primary text-white font-bold text-2xl mb-4">$</span>
          <h1 className="text-xl font-semibold text-text mb-1">Expense Tracker</h1>
          <p className="text-sm text-muted">Track spending. Stay on budget.</p>
        </div>

        <div className="inline-flex w-full bg-surface-2 rounded-pill p-1 mb-5">
          <button
            type="button"
            className={`flex-1 rounded-pill px-4 py-2 text-sm font-medium transition-colors ${mode === "signin" ? "bg-surface text-text shadow-soft" : "text-muted hover:text-text"}`}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-pill px-4 py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-surface text-text shadow-soft" : "text-muted hover:text-text"}`}
            onClick={() => switchMode("signup")}
          >
            Create Account
          </button>
        </div>

        {authError && <p className="text-xs text-danger bg-danger/10 rounded-input px-3 py-2 mb-4">{authError}</p>}

        <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Email</label>
            <input id="auth-email" type="email" required autoComplete="email"
                   value={email} onChange={e => setEmail(e.target.value)}
                   className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <div>
            <label htmlFor="auth-password" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Password</label>
            <input id="auth-password" type="password" required minLength={6}
                   autoComplete={mode === "signin" ? "current-password" : "new-password"}
                   value={password} onChange={e => setPassword(e.target.value)}
                   className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          <button type="submit" disabled={submitting}
                  className="w-full bg-primary text-white hover:bg-primary-text transition-colors rounded-pill px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-5">Your data is securely stored in the cloud.</p>
      </div>
    </div>
  );
}
