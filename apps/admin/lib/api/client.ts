import { API_BASE } from "@/lib/config";
import { endSession, getSession, updateTokens } from "@/lib/auth/session";
import type { ApiErrorBody, AuthTokens } from "./types";

/**
 * Small typed fetch wrapper for the Sofreh API.
 *
 * - Attaches `Authorization: Bearer <accessToken>` from the stored session.
 * - On a 401 it refreshes the token pair once (POST /auth/refresh) and
 *   retries the request. Refresh tokens rotate, so concurrent 401s share a
 *   single in-flight refresh, and a Web Lock keeps tabs from racing each other.
 * - If the refresh is rejected the session ends and the auth guard sends the
 *   user back to the login page.
 * - Errors are thrown as `ApiError` carrying the API's Persian `message`.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const NETWORK_ERROR = "ارتباط با سرور برقرار نشد. اتصال اینترنت یا وضعیت سرور را بررسی کنید.";

const FALLBACK_MESSAGES: Record<number, string> = {
  400: "درخواست نامعتبر است.",
  401: "نشست شما منقضی شده است؛ دوباره وارد شوید.",
  403: "دسترسی به این بخش مجاز نیست.",
  404: "مورد درخواستی پیدا نشد.",
  409: "این عملیات با وضعیت فعلی داده‌ها سازگار نیست.",
  413: "حجم فایل بیش از حد مجاز است.",
  429: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.",
};

/** Human-readable Persian message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "خطای غیرمنتظره‌ای رخ داد.";
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON-serialisable body, or FormData for uploads. */
  body?: unknown;
  query?: object;
  /** Send the bearer token (default true). */
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: object): string {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query as Record<string, QueryValue>)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function send(path: string, options: RequestOptions, token: string | undefined): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      signal: options.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, NETWORK_ERROR);
  }
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    const body = (data ?? {}) as Partial<ApiErrorBody>;
    const raw = Array.isArray(body.message) ? body.message[0] : body.message;
    const errors = body.errors ?? (Array.isArray(body.message) ? body.message : []);
    const message = raw || FALLBACK_MESSAGES[response.status] || `خطای سرور (${response.status})`;
    throw new ApiError(response.status, message, errors);
  }
  return data as T;
}

// ---------------------------------------------------------------- refresh

let inflightRefresh: Promise<string | null> | null = null;

/** Run `task` under a cross-tab lock when the browser supports Web Locks. */
async function withTabLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return await navigator.locks.request("sofreh-admin-token-refresh", task);
  }
  return task();
}

async function performRefresh(staleAccessToken?: string): Promise<string | null> {
  const session = getSession();
  if (!session) return null;
  // Another tab rotated the tokens while we waited for the lock.
  if (staleAccessToken && session.accessToken !== staleAccessToken) return session.accessToken;

  const response = await send("/auth/refresh", { method: "POST", body: { refreshToken: session.refreshToken }, auth: false }, undefined);
  if (!response.ok) {
    // A newer pair may have been stored meanwhile; only end *that* session.
    if (getSession()?.refreshToken === session.refreshToken) endSession("expired");
    return null;
  }
  const tokens = (await response.json()) as AuthTokens;
  updateTokens(tokens);
  return tokens.accessToken;
}

/**
 * Get a fresh access token. Pass the token that was rejected so a refresh
 * that already happened (in this tab or another) is reused, not repeated.
 * Resolves to null when the session is over.
 */
export function refreshAccessToken(staleAccessToken?: string): Promise<string | null> {
  const session = getSession();
  if (!session) return Promise.resolve(null);
  if (staleAccessToken && session.accessToken !== staleAccessToken) return Promise.resolve(session.accessToken);
  inflightRefresh ??= withTabLock(() => performRefresh(staleAccessToken)).finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}

// ---------------------------------------------------------------- request

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const useAuth = options.auth ?? true;
  const token = useAuth ? getSession()?.accessToken : undefined;
  let response = await send(path, options, token);

  if (response.status === 401 && useAuth && token) {
    const fresh = await refreshAccessToken(token);
    if (fresh) response = await send(path, options, fresh);
  }
  return parse<T>(response);
}
