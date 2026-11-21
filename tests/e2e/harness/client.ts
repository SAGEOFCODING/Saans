import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string> | Headers;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  ip?: string;
}

export interface SSEMessage {
  event: string;
  data: unknown;
}

const BASE_URL = process.env.TEST_BASE_URL;

/**
 * Normalizes headers from plain object or Headers instance into standard Headers.
 */
function normalizeHeaders(input?: Record<string, string> | Headers): Headers {
  if (!input) return new Headers();
  if (input instanceof Headers) return new Headers(input);
  const headers = new Headers();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      headers.set(key, value);
    }
  }
  return headers;
}

/**
 * Builds standard Request or NextRequest for in-process testing.
 */
function buildDirectRequest(
  url: string,
  method: string,
  headers: Headers,
  bodyContent?: string
): NextRequest {
  try {
    return new NextRequest(url, {
      method,
      headers,
      body: bodyContent,
    });
  } catch {
    // Fallback to standard Request if NextRequest instantiation fails
    return new Request(url, {
      method,
      headers,
      body: bodyContent,
    }) as unknown as NextRequest;
  }
}

/**
 * Dual-mode API request dispatcher.
 * Dispatches to live server if TEST_BASE_URL is set, or invokes Next.js route handlers directly in-process.
 */
export async function apiRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const method = options.method || 'GET';
  const headers = normalizeHeaders(options.headers);

  if (options.ip) {
    headers.set('x-forwarded-for', options.ip);
  }

  // Format query string
  const queryParams = new URLSearchParams();
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) {
        queryParams.set(k, String(v));
      }
    }
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  // Mode 1: Live HTTP Fetch via TEST_BASE_URL
  if (BASE_URL) {
    const liveUrl = `${BASE_URL.replace(/\/$/, '')}${path}${queryString}`;
    let bodyPayload: BodyInit | undefined = undefined;
    if (options.body !== undefined && options.body !== null) {
      bodyPayload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    }
    return fetch(liveUrl, {
      method,
      headers,
      body: bodyPayload,
    });
  }

  // Mode 2: In-Process Route Dispatching
  const fullUrl = `http://localhost:3000${path}${queryString}`;
  let bodyContent: string | undefined = undefined;
  if (options.body !== undefined && options.body !== null) {
    bodyContent = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
  }

  const req = buildDirectRequest(fullUrl, method, headers, bodyContent);

  // Dynamic Route Module Resolver
  let routeModule: Record<string, unknown> | null = null;
  const cleanPath = path.split('?')[0];

  if (cleanPath === '/api/health') {
    // @ts-ignore
    routeModule = await import(/* @vite-ignore */ '@/app/api/health/route' as string)
      // @ts-ignore
      .catch(() => import(/* @vite-ignore */ '../../../src/app/api/health/route' as string))
      .catch(() => null);
  } else if (cleanPath === '/api/geocode') {
    // @ts-ignore
    routeModule = await import(/* @vite-ignore */ '@/app/api/geocode/route' as string)
      // @ts-ignore
      .catch(() => import(/* @vite-ignore */ '../../../src/app/api/geocode/route' as string))
      .catch(() => null);
  } else if (cleanPath === '/api/air') {
    // @ts-ignore
    routeModule = await import(/* @vite-ignore */ '@/app/api/air/route' as string)
      // @ts-ignore
      .catch(() => import(/* @vite-ignore */ '../../../src/app/api/air/route' as string))
      .catch(() => null);
  } else if (cleanPath === '/api/plan') {
    // @ts-ignore
    routeModule = await import(/* @vite-ignore */ '@/app/api/plan/route' as string)
      // @ts-ignore
      .catch(() => import(/* @vite-ignore */ '../../../src/app/api/plan/route' as string))
      .catch(() => null);
  } else if (cleanPath === '/api/chat') {
    // @ts-ignore
    routeModule = await import(/* @vite-ignore */ '@/app/api/chat/route' as string)
      // @ts-ignore
      .catch(() => import(/* @vite-ignore */ '../../../src/app/api/chat/route' as string))
      .catch(() => null);
  } else {
    // If not a recognized API route, try invoking middleware if testing security headers or root
    return invokeMiddleware(path, options);
  }

  if (!routeModule) {
    throw new Error(
      `Unable to resolve route module for path '${path}'. Route handler not found at src/app${cleanPath}/route.ts and no live server detected.`
    );
  }

  // Check method handler
  const handler = routeModule[method] as ((req: NextRequest) => Promise<Response> | Response) | undefined;
  if (typeof handler !== 'function') {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].filter(
      (m) => typeof routeModule?.[m] === 'function'
    );
    return new Response(
      JSON.stringify({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${method} not allowed on ${cleanPath}`,
        },
      }),
      {
        status: 405,
        headers: {
          'content-type': 'application/json',
          allow: allowedMethods.join(', '),
        },
      }
    );
  }

  return await handler(req);
}

/**
 * Invokes Next.js middleware for testing security headers and routing logic.
 */
export async function invokeMiddleware(
  path: string = '/',
  options: RequestOptions = {}
): Promise<Response> {
  const method = options.method || 'GET';
  const headers = normalizeHeaders(options.headers);

  if (options.ip) {
    headers.set('x-forwarded-for', options.ip);
  }

  const queryParams = new URLSearchParams();
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) {
        queryParams.set(k, String(v));
      }
    }
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  if (BASE_URL) {
    const liveUrl = `${BASE_URL.replace(/\/$/, '')}${path}${queryString}`;
    return fetch(liveUrl, { method, headers });
  }

  const fullUrl = `http://localhost:3000${path}${queryString}`;
  const req = buildDirectRequest(fullUrl, method, headers);

  const mwModule = (await import('@/middleware')
    .catch(() => import('../../../src/middleware'))
    .catch(() => null)) as { middleware?: (request: NextRequest) => Promise<Response> | Response } | null;

  if (mwModule && typeof mwModule.middleware === 'function') {
    return await mwModule.middleware(req);
  }

  throw new Error('Middleware function not found in @/middleware or src/middleware');
}

/**
 * Checks whether a given API route is currently implemented and ready for testing.
 * Returns true if TEST_BASE_URL is active or if the route file exists on disk.
 */
export function isRouteImplemented(routePath: string): boolean {
  if (BASE_URL) return true;
  const cleanPath = routePath.split('?')[0];
  const relativeFileTs = `src/app${cleanPath}/route.ts`;
  const relativeFileJs = `src/app${cleanPath}/route.js`;
  return (
    fs.existsSync(path.resolve(process.cwd(), relativeFileTs)) ||
    fs.existsSync(path.resolve(process.cwd(), relativeFileJs))
  );
}

/**
 * Checks whether a given domain module is currently implemented on disk.
 */
export function isDomainModuleImplemented(moduleName: string): boolean {
  const tsPath = path.resolve(process.cwd(), `src/domain/${moduleName}.ts`);
  const jsPath = path.resolve(process.cwd(), `src/domain/${moduleName}.js`);
  return fs.existsSync(tsPath) || fs.existsSync(jsPath);
}

/**
 * Consumes and parses a Server-Sent Events (SSE) ReadableStream into an array of typed events.
 */
export async function readSSEStream(response: Response): Promise<SSEMessage[]> {
  const body = response.body;
  if (!body) {
    throw new Error('Response body is null, cannot read SSE stream');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const messages: SSEMessage[] = [];
  let currentEvent = 'message';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          currentEvent = 'message';
          continue;
        }

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.slice(5).trim();
          let parsedData: unknown = rawData;
          try {
            parsedData = JSON.parse(rawData);
          } catch {
            parsedData = rawData;
          }
          messages.push({
            event: currentEvent,
            data: parsedData,
          });
          currentEvent = 'message';
        }
      }
    }

    if (buffer.trim()) {
      if (buffer.startsWith('event:')) {
        currentEvent = buffer.slice(6).trim();
      } else if (buffer.startsWith('data:')) {
        const rawData = buffer.slice(5).trim();
        let parsedData: unknown = rawData;
        try {
          parsedData = JSON.parse(rawData);
        } catch {
          parsedData = rawData;
        }
        messages.push({
          event: currentEvent,
          data: parsedData,
        });
        currentEvent = 'message';
      }
    }
  } finally {
    reader.releaseLock();
  }

  return messages;
}
