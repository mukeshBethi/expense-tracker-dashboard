import { useAuth } from "./hooks/useAuth.js";
import AuthScreen from "./components/AuthScreen.jsx";

export default function App() {
  const { user, authLoading, signIn, signUp, signOutUser, authError, clearAuthError } = useAuth();

  if (authLoading) return null;

  if (!user) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        authError={authError}
        clearAuthError={clearAuthError}
      />
    );
  }

  return (
    <div>
      <p>Signed in as {user.email}</p>
      <button onClick={signOutUser}>Sign Out</button>
    </div>
  );
}
