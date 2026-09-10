import { createServerFn } from "@tanstack/react-start";

/** Firebase web API keys are publishable; we read it from the secret store at runtime. */
export const getFirebaseApiKey = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env["GOOGLE_API_KEY"] ?? process.env["VITE_FIREBASE_API_KEY"] ?? "";
  return { apiKey };
});
