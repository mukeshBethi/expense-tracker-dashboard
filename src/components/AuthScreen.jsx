import { useState } from "react";
import Input from "./ui/Input.jsx";
import Button from "./ui/Button.jsx";

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
    <div className="min-h-screen flex items-center justify-center bg-pr-page px-4">
      <div className="w-full max-w-sm bg-pr-card shadow-pr-sm rounded-pr-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <span className="inline-grid place-items-center w-12 h-12 rounded-pr-default bg-pr-accent text-white font-bold text-2xl mb-4">$</span>
          <h1 className="text-xl font-semibold text-pr-primary mb-1">Expense Tracker</h1>
          <p className="text-sm text-pr-secondary">Track spending. Stay on budget.</p>
        </div>

        <div className="inline-flex w-full bg-pr-subtle rounded-pr-pill p-1 mb-5">
          <button
            type="button"
            className={`flex-1 rounded-pr-pill px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${mode === "signin" ? "bg-pr-card text-pr-primary shadow-pr-sm" : "text-pr-secondary hover:text-pr-primary"}`}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-pr-pill px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${mode === "signup" ? "bg-pr-card text-pr-primary shadow-pr-sm" : "text-pr-secondary hover:text-pr-primary"}`}
            onClick={() => switchMode("signup")}
          >
            Create Account
          </button>
        </div>

        {authError && <p className="text-xs text-pr-danger bg-pr-danger-soft rounded-pr-default px-3 py-2 mb-4">{authError}</p>}

        <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
          <Input
            label="Email" id="auth-email" type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <Input
            label="Password" id="auth-password" type="password" required minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={submitting} className="w-full">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-pr-secondary mt-5">Your data is securely stored in the cloud.</p>
      </div>
    </div>
  );
}
