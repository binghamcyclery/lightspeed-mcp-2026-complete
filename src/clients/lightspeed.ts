import type {
  LightspeedConfig,
  OAuthTokenResponse,
  LightspeedError,
  PaginatedResponse,
} from '../types/index.js';

export class LightspeedClient {
  private config: LightspeedConfig;
  private baseUrl: string;
  private authBaseUrl: string;

  constructor(config: LightspeedConfig) {
    this.config = {
      environment: 'production',
      apiType: 'retail',
      ...config,
    };

    // Retail API base URLs
    if (this.config.apiType === 'retail') {
      this.baseUrl = 'https://api.lightspeedapp.com/API/V3';
      this.authBaseUrl = 'https://cloud.lightspeedapp.com/oauth';
    } else {
      // Restaurant K-Series API
      const env = this.config.environment === 'trial' ? 'trial.' : '';
      this.baseUrl = `https://api.${env}lsk.lightspeed.app`;
      this.authBaseUrl = `https://api.${env}lsk.lightspeed.app/oauth`;
    }
  }

  // OAuth2 Authentication
  async getAuthorizationUrl(redirectUri: string, scope: string, state?: string): Promise<string> {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope,
    });

    if (state) {
      params.append('state', state);
    }

    if (this.config.apiType === 'retail') {
      return `${this.authBaseUrl}/authorize.php?${params}`;
    } else {
      return `${this.authBaseUrl}/authorize?${params}`;
    }
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
    const tokenUrl = this.config.apiType === 'retail'
      ? `${this.authBaseUrl}/access_token.php`
      : `${this.authBaseUrl}/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Restaurant API uses Basic auth for token endpoint
    if (this.config.apiType === 'restaurant') {
      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    } else {
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: params,
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const data = await response.json();
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    return data;
  }

  async refreshAccessToken(): Promise<OAuthTokenResponse> {
    if (!this.config.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenUrl = this.config.apiType === 'retail'
      ? `${this.authBaseUrl}/access_token.php`
      : `${this.authBaseUrl}/token`;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.config.refreshToken,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (this.config.apiType === 'restaurant') {
      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    } else {
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: params,
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const data = await response.json();
    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    return data;
  }

  // Core HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>('PUT', endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  // Paginated requests
  async getPaginated<T>(
    endpoint: string,
    params: Record<string, any> = {},
    limit = 100
  ): Promise<T[]> {
    const results: T[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const pageParams = {
        ...params,
        limit,
        offset,
      };

      const response = await this.get<any>(endpoint, pageParams);
      
      // Handle Retail API pagination
      if (response['@attributes']) {
        const data = Array.isArray(response[Object.keys(response).find(k => k !== '@attributes')!])
          ? response[Object.keys(response).find(k => k !== '@attributes')!]
          : [response[Object.keys(response).find(k => k !== '@attributes')!]];
        
        results.push(...data);
        
        const count = parseInt(response['@attributes'].count);
        hasMore = offset + limit < count;
        offset += limit;
      } 
      // Handle Restaurant API pagination
      else if (Array.isArray(response)) {
        results.push(...response);
        hasMore = response.length === limit;
        offset += limit;
      } else {
        results.push(response);
        hasMore = false;
      }
    }

    return results;
  }

  // Core request method with retry logic
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<T> {
    if (!this.config.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    let url = this.config.apiType === 'retail'
      ? `${this.baseUrl}/Account/${this.config.accountId}${endpoint}.json`
      : `${this.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      url += `?${searchParams}`;
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    let response = await fetch(url, options);

    // Retry with token refresh if unauthorized
    if (response.status === 401 && this.config.refreshToken) {
      await this.refreshAccessToken();
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
      response = await fetch(url, options);
    }

    if (!response.ok) {
      throw await this.handleError(response);
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  }

  private async handleError(response: Response): Promise<LightspeedError> {
    let errorBody: any;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const error: LightspeedError = {
      message: typeof errorBody === 'string' ? errorBody : errorBody.message || response.statusText,
      statusCode: response.status,
      details: errorBody,
    };

    return error;
  }

  // Retail-specific helpers
  getRetailEndpoint(resource: string, id?: number | string): string {
    return id ? `/${resource}/${id}` : `/${resource}`;
  }

  // Restaurant-specific helpers
  getRestaurantEndpoint(resource: string, id?: string): string {
    return id ? `/${resource}/${id}` : `/${resource}`;
  }

  // Bulk operations
  async batchGet<T>(endpoint: string, ids: (number | string)[]): Promise<T[]> {
    const results = await Promise.all(
      ids.map(id => this.get<T>(`${endpoint}/${id}`))
    );
    return results;
  }

  async batchCreate<T>(endpoint: string, items: any[]): Promise<T[]> {
    const results = await Promise.all(
      items.map(item => this.post<T>(endpoint, item))
    );
    return results;
  }

  async batchUpdate<T>(endpoint: string, items: Array<{ id: number | string; data: any }>): Promise<T[]> {
    const results = await Promise.all(
      items.map(({ id, data }) => this.put<T>(`${endpoint}/${id}`, data))
    );
    return results;
  }

  async batchDelete(endpoint: string, ids: (number | string)[]): Promise<void> {
    await Promise.all(
      ids.map(id => this.delete(`${endpoint}/${id}`))
    );
  }

  // Search and filter helpers
  async search<T>(endpoint: string, query: Record<string, any>): Promise<T[]> {
    return this.getPaginated<T>(endpoint, query);
  }

  // Export current config for persistence
  getConfig(): LightspeedConfig {
    return { ...this.config };
  }

  // Update tokens
  setTokens(accessToken: string, refreshToken: string): void {
    this.config.accessToken = accessToken;
    this.config.refreshToken = refreshToken;
  }
}
