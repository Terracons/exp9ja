export function resolvePublicConfig(url: string, key: string) {
  let configured = false;
  try {
    const parsed = new URL(url);
    configured =
      ["http:", "https:"].includes(parsed.protocol) &&
      !!key &&
      !url.includes("your-project") &&
      !key.startsWith("your-") &&
      key !== "missing-anon-key";
  } catch {
    /* Missing configuration must not crash the public marketplace. */
  }
  return {
    configured,
    url: configured ? url : "http://localhost:54321",
    key: configured ? key : "missing-anon-key",
  };
}

export async function readAuthProviders(
  config: ReturnType<typeof resolvePublicConfig>,
  fetcher: typeof fetch = fetch,
) {
  if (!config.configured)
    throw new Error("Account services are not configured.");
  const response = await fetcher(
    `${config.url.replace(/\/$/, "")}/auth/v1/settings`,
    { headers: { apikey: config.key }, signal: AbortSignal.timeout(10000) },
  );
  if (!response.ok)
    throw new Error(
      "Unable to load sign-in options. Please try again shortly.",
    );
  const data = await response.json();
  return {
    google: data.external?.google === true,
    email: data.external?.email === true,
  };
}
