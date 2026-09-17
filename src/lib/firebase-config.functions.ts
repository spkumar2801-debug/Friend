import { createServerFn } from "@tanstack/react-start";

/** Firebase web API keys are publishable; we read it from the secret store at runtime. */
export const getFirebaseApiKey = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey =
    process.env["VITE_FIREBASE_API_KEY"] ??
    process.env["FIREBASE_API_KEY"] ??
    "AIzaSyAgG2mqGfET8eKY_TLLE1z3Ml5sWhNXwc0";
  return { apiKey };
});
