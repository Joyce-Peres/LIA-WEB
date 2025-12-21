export function getRequiredEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${String(key)}. ` +
        `Create a .env file (or .env.local) based on .env.example.`,
    )
  }
  return value
}


