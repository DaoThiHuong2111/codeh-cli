/**
 * Base HTTP Client
 * Wrapper around node-fetch with common functionality
 */

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class HttpClient {
  private defaultTimeout: number = 30000;

  constructor(private defaultHeaders: Record<string, string> = {}) {}

  async request<T = any>(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const fetch = await import('node-fetch').then((m) => m.default);

    const headers = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...options.headers,
    };

    const requestOptions: any = {
      method: options.method || 'GET',
      headers,
      timeout: options.timeout || this.defaultTimeout,
    };

    if (options.body) {
      requestOptions.body =
        typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, requestOptions);

      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
        throw new Error(`Request timeout after ${requestOptions.timeout}ms`);
      }
      throw error;
    }
  }

  async get<T = any>(
    url: string,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(
    url: string,
    body: any,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  async put<T = any>(
    url: string,
    body: any,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  async delete<T = any>(
    url: string,
    options: Omit<HttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  private async parseResponse<T>(response: any): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return await response.json();
    } else if (contentType.includes('text/')) {
      return (await response.text()) as T;
    } else {
      return (await response.text()) as T;
    }
  }

  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeDefaultHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  setTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }
}
