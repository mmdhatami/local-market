export const API_CONFIG = {
  development: {
    baseUrl: "http://localhost:8787"
  },

  production: {
    baseUrl: ""
  }
} as const;

export type ApiEnvironment = keyof typeof API_CONFIG;

export function getApiBaseUrl(
  environment: ApiEnvironment = "development"
): string {
  return API_CONFIG[environment].baseUrl;
}

export function apiUrl(
  path: string,
  environment: ApiEnvironment = "development"
): string {
  const baseUrl = getApiBaseUrl(environment);

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
