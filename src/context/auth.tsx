import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateAuthProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";
import {
  createProfile,
  generateUsername,
  getProfile,
  isUsernameAvailable,
} from "@/lib/services";
import type { UserProfile } from "@/types";

interface AuthValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  }) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, async (next) => {
        setUser(next);
        if (next) {
          try {
            let loaded = await getProfile(next.uid);
            if (!loaded) {
              // First Google sign-in: build a Friend profile automatically.
              const username = await generateUsername(
                next.email?.split("@")[0] ?? next.displayName ?? "friend",
              );
              await createProfile({
                uid: next.uid,
                username,
                displayName: next.displayName || username,
                photoURL: next.photoURL ?? null,
              });
              loaded = await getProfile(next.uid);
            }
            setProfile(loaded);
          } catch (e) {
            console.error("Error loading user profile:", e);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    } catch (err) {
      console.error("Firebase auth initialization error:", err);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfile(await getProfile(user.uid));
  }, [user]);

  const signUpWithEmail = useCallback<AuthValue["signUpWithEmail"]>(async (input) => {
    const username = input.username.toLowerCase();
    if (!(await isUsernameAvailable(username))) {
      throw new Error("That username is already taken.");
    }
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    await updateAuthProfile(cred.user, { displayName: input.displayName });
    await createProfile({
      uid: cred.user.uid,
      username,
      displayName: input.displayName.trim() || username,
      photoURL: null,
    });
    setProfile(await getProfile(cred.user.uid));
  }, []);

  const signInWithEmail = useCallback<AuthValue["signInWithEmail"]>(async (email, password) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(getFirebaseAuth(), googleProvider());
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  }, []);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
    setProfile(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: Boolean(user),
      refreshProfile,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      resetPassword,
      logout,
    }),
    [
      user,
      profile,
      loading,
      refreshProfile,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      resetPassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
