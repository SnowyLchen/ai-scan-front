
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

class NetworkClient {
  private static instance: NetworkClient;
  
  private constructor() {}

  public static getInstance(): NetworkClient {
    if (!NetworkClient.instance) {
      NetworkClient.instance = new NetworkClient();
    }
    return NetworkClient.instance;
  }

  /**
   * 标准化成功响应
   */
  private success<T>(data: T): ApiResponse<T> {
    return {
      code: 200,
      message: 'success',
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * 标准化失败响应
   */
  private error(message: string, code: number = 500): ApiResponse<null> {
    return {
      code,
      message,
      data: null,
      timestamp: Date.now(),
    };
  }

  /**
   * 模拟网络请求 (Mock Backend)
   * @param handler 实际执行的业务逻辑函数
   * @param delayRange 延迟范围 [min, max] ms
   */
  public async mockRequest<T>(
    handler: () => Promise<T> | T,
    delayRange: [number, number] = [600, 1200]
  ): Promise<ApiResponse<T>> {
    const delay = Math.random() * (delayRange[1] - delayRange[0]) + delayRange[0];
    
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          // 模拟 2% 的随机网络失败率，用于测试健壮性
          if (Math.random() < 0.02) {
            throw new Error("Simulated network timeout");
          }

          const result = await handler();
          resolve(this.success(result));
        } catch (e: any) {
          console.error("Mock API Error:", e);
          // resolve 错误状态而不是 reject，模拟 HTTP 200 但业务 code 错误的情况，或者直接 reject
          // 这里为了简单，如果是 Error 对象，我们 reject 出去让 Service 层捕获
          reject(this.error(e.message || "Unknown Error"));
        }
      }, delay);
    });
  }

  /**
   * 真实的 GET 请求封装 (示例)
   */
  public async get<T>(url: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const query = new URLSearchParams(params).toString();
      const fullUrl = query ? `${url}?${query}` : url;
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const data = await response.json();
      return this.success(data);
    } catch (e: any) {
      throw this.error(e.message);
    }
  }
}

export const httpClient = NetworkClient.getInstance();
