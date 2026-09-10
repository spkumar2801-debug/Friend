const MAP: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "We couldn't find an account with those details.",
  "auth/wrong-password": "That email and password don't match.",
  "auth/invalid-credential": "That email and password don't match.",
  "auth/email-already-in-use": "That email is already registered. Try signing in.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "You appear to be offline. Check your connection.",
  "auth/popup-closed-by-user": "The Google sign-in window was closed.",
  "auth/cancelled-popup-request": "The Google sign-in window was closed.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window.",
  "auth/unauthorized-domain":
    "This web address isn't approved for Google sign-in yet. Add it in your Firebase authentication settings.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled for the project yet.",
  "auth/invalid-api-key":
    "Sign-in isn't configured correctly yet: the app's Firebase key is invalid.",
  "auth/api-key-not-valid": "Sign-in isn't configured correctly yet: the app's Firebase key is invalid.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    "Sign-in isn't configured correctly yet: the app's Firebase key is invalid.",
  "auth/configuration-not-found":
    "Sign-in isn't set up in Firebase yet. Enable Email/Password and Google sign-in.",
  "permission-denied": "You don't have permission to do that.",
  unauthenticated: "Please sign in and try again.",
  unavailable: "The service is unreachable right now. Please try again.",
  "failed-precondition": "This action can't be completed right now.",
  "not-found": "That content no longer exists.",
  "resource-exhausted": "Too many requests. Please slow down a little.",
};

export function friendlyError(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code: string }).code);
    if (MAP[code]) return MAP[code];
    const short = code.replace(/^[a-z-]+\//, "");
    if (MAP[short]) return MAP[short];
  }
  if (error instanceof Error && error.message && !error.message.startsWith("Firebase")) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
