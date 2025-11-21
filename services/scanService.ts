
import { BoundingBox } from "../types";
import { httpClient } from "../utils/network";

/**
 * Private Helper: Load Image
 * Not exported as part of the API, just an internal util for the mock backend
 */
const loadImageInternal = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * 图像处理服务
 * 模拟后端 API 行为
 */
export const ScanService = {
  
  /**
   * 获取图片基础信息 (模拟轻量级接口)
   */
  getImageMeta: async (url: string) => {
    return httpClient.mockRequest(async () => {
      const img = await loadImageInternal(url);
      return { width: img.width, height: img.height };
    }, [100, 300]);
  },

  /**
   * 智能边界识别 API
   */
  detectBoundary: async (url: string, width: number, height: number) => {
    return httpClient.mockRequest(() => {
      // 模拟算法识别逻辑
      const marginX = width * (0.05 + Math.random() * 0.1);
      const marginY = height * (0.05 + Math.random() * 0.1);
      
      const boxWidth = width - (marginX * 2);
      const boxHeight = height - (marginY * 2);

      const box: BoundingBox = {
        x: marginX,
        y: marginY,
        width: boxWidth,
        height: boxHeight
      };
      return box;
    }, [800, 1500]); // 模拟较重的计算延迟
  },

  /**
   * 智能裁剪 API
   */
  cropImage: async (url: string, box: BoundingBox) => {
    return httpClient.mockRequest(async () => {
      const img = await loadImageInternal(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error("Canvas context initialization failed");

      canvas.width = box.width;
      canvas.height = box.height;

      ctx.drawImage(
        img,
        box.x, box.y, box.width, box.height, 
        0, 0, box.width, box.height
      );

      return canvas.toDataURL('image/jpeg', 0.9);
    }, [500, 1000]);
  }
};
