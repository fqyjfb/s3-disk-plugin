import { S3Config, FileObject, BucketObject } from '../types';

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export class S3Service {
  private config: S3Config | null = null;
  private useElectronProxy = typeof window !== 'undefined' && !!(window as any).electron?.s3;

  constructor(config?: S3Config) {
    if (config) {
      this.init(config);
    }
  }

  init(config: S3Config) {
    this.config = config;
  }

  updateConfig(newConfig: Partial<S3Config>) {
    if (this.config) {
      this.config = { ...this.config, ...newConfig };
    }
  }

  async listBuckets(): Promise<BucketObject[]> {
    if (!this.config) throw new Error("S3 Client not initialized");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.listBuckets(this.config);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Unknown error');
    }

    throw new Error('Electron S3 proxy not available');
  }

  async createBucket(bucketName: string): Promise<void> {
    if (!this.config) throw new Error("S3 Client not initialized");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.createBucket(this.config, bucketName);
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      return;
    }

    throw new Error('Electron S3 proxy not available');
  }

  async deleteBucket(bucketName: string): Promise<void> {
    if (!this.config) throw new Error("S3 Client not initialized");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.deleteBucket(this.config, bucketName);
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      return;
    }

    throw new Error('Electron S3 proxy not available');
  }

  async listFiles(prefix: string = ''): Promise<FileObject[]> {
    if (!this.config) throw new Error("S3 Client not initialized");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.listFiles(this.config, prefix);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Unknown error');
    }

    throw new Error('Electron S3 proxy not available');
  }

  private async listAllObjects(prefix: string): Promise<{ Key: string; Size: number }[]> {
    if (!this.config) throw new Error("Invalid state");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.listAllObjects(this.config, prefix);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Unknown error');
    }

    throw new Error('Electron S3 proxy not available');
  }

  async deleteFolder(prefix: string): Promise<void> {
    if (!this.config) throw new Error("Invalid state");

    const objects = await this.listAllObjects(prefix);
    if (objects.length === 0) return;

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.deleteObjects(this.config, objects.map(o => o.Key));
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      return;
    }

    throw new Error('Electron S3 proxy not available');
  }

  async getBucketSize(bucketName?: string, prefix: string = ''): Promise<number> {
    if (!this.config) throw new Error("S3 Client not initialized");

    const targetBucket = bucketName || this.config.bucketName;
    if (!targetBucket) throw new Error("No bucket specified");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.listAllObjects(this.config, prefix);
      if (result.success) {
        return result.data.reduce((total: number, obj: { Size: number }) => total + (obj.Size || 0), 0);
      }
      throw new Error(result.error || 'Unknown error');
    }

    throw new Error('Electron S3 proxy not available');
  }

  async downloadFolderAsZip(prefix: string): Promise<Blob> {
    if (!this.config) throw new Error("Invalid state");

    const JSZip = await import('jszip');
    const zip = new JSZip.default();
    const objects = await this.listAllObjects(prefix);

    await Promise.all(objects.map(async (obj) => {
      if (obj.Key.endsWith('/')) return;

      try {
        const result = await (window as any).electron.s3.getObject(this.config!, obj.Key);
        if (result.success && result.data) {
          const byteArray = new Uint8Array(result.data);
          const relativePath = obj.Key.startsWith(prefix)
            ? obj.Key.substring(prefix.length)
            : obj.Key;
          zip.file(relativePath, byteArray);
        }
      } catch (e) {
        console.error(`Failed to download ${obj.Key} for zip`, e);
      }
    }));

    return await zip.generateAsync({ type: "blob" });
  }

  async downloadFilesAsZip(files: FileObject[]): Promise<Blob> {
    if (!this.config) throw new Error("Invalid state");

    const JSZip = await import('jszip');
    const zip = new JSZip.default();

    for (const f of files) {
      try {
        const result = await (window as any).electron.s3.getObject(this.config!, f.key);
        if (result.success && result.data) {
          const byteArray = new Uint8Array(result.data);
          zip.file(f.name, byteArray);
        }
      } catch (e) {
        console.error("Failed to zip", f.key);
      }
    }

    return await zip.generateAsync({ type: "blob" });
  }

  async getPresignedUrl(key: string, options?: { download?: boolean, expiresIn?: number }): Promise<string> {
    if (!this.config) throw new Error("S3 Client invalid");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.getPresignedUrl(this.config, key, options);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Unknown error');
    }

    throw new Error('Electron S3 proxy not available');
  }

  async saveFileContent(key: string, content: string, mimeType: string = 'text/plain'): Promise<void> {
    if (!this.config) throw new Error("S3 Client invalid");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.putObject(this.config, key, content, mimeType);
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      return;
    }

    throw new Error('Electron S3 proxy not available');
  }

  async uploadFile(
    file: File,
    prefix: string,
    onProgress?: (progress: number, loaded: number, total: number) => void
  ): Promise<void> {
    if (!this.config) throw new Error("S3 Client invalid");

    const key = `${prefix}${file.name}`;

    if (this.useElectronProxy) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await (window as any).electron.s3.uploadFile(this.config, key, arrayBuffer, file.type);
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      if (onProgress) onProgress(100, file.size, file.size);
      return;
    }

    throw new Error('Electron S3 proxy not available');
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.config) throw new Error("S3 Client invalid");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.deleteObject(this.config, key);
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      return;
    }

    throw new Error('Electron S3 proxy not available');
  }

  async createFolder(folderName: string, prefix: string): Promise<void> {
    if (!this.config) throw new Error("S3 Client invalid");

    const sanitizedName = folderName.replace(/^\/+|\/+$/g, '');
    const key = `${prefix}${sanitizedName}/`;

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.putObject(this.config, key, '', '');
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      return;
    }

    throw new Error('Electron S3 proxy not available');
  }

  async moveObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    if (!this.config) throw new Error("S3 Client invalid");

    if (this.useElectronProxy) {
      const copyResult = await (window as any).electron.s3.copyObject(this.config, sourceKey, destKey);
      if (!copyResult.success) {
        throw new Error(copyResult.error || 'Copy failed');
      }

      const deleteResult = await (window as any).electron.s3.deleteObject(this.config, sourceKey);
      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Delete failed');
      }
      return;
    }

    throw new Error('Electron S3 proxy not available');
  }

  async moveFolder(sourceBucket: string, sourcePrefix: string, destBucket: string, destPrefix: string): Promise<void> {
    if (!this.config) throw new Error("S3 Client invalid");

    const objects = await this.listAllObjects(sourcePrefix);
    if (objects.length === 0) return;

    for (const obj of objects) {
      const relativePath = obj.Key.substring(sourcePrefix.length);
      const newKey = `${destPrefix}${relativePath}`;
      await this.moveObject(sourceBucket, obj.Key, destBucket, newKey);
    }
  }

  async getObject(key: string): Promise<{ data: Uint8Array; contentType: string }> {
    if (!this.config) throw new Error("S3 Client invalid");

    if (this.useElectronProxy) {
      const result = await (window as any).electron.s3.getObject(this.config, key);
      if (result.success && result.data) {
        return {
          data: new Uint8Array(result.data),
          contentType: result.contentType || 'application/octet-stream'
        };
      }
      throw new Error(result.error || 'Unknown error');
    }

    throw new Error('Electron S3 proxy not available');
  }
}