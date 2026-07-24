
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import JSZip from 'jszip';
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
  private client: S3Client | null = null;
  private config: S3Config | null = null;

  constructor(config?: S3Config) {
    if (config) {
      this.init(config);
    }
  }

  // 标准化 endpoint：确保包含协议头
  private normalizeEndpoint(endpoint: string): string {
    if (!endpoint) return '';
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      return `https://${endpoint}`;
    }
    return endpoint;
  }

  init(config: S3Config) {
    this.config = config;
    const normalizedEndpoint = this.normalizeEndpoint(config.endpoint);
    this.client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: normalizedEndpoint || undefined,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
      tls: normalizedEndpoint?.includes('localhost') && normalizedEndpoint?.startsWith('http:') ? false : true,
    });
  }

  updateConfig(newConfig: Partial<S3Config>) {
    if (this.config) {
      this.config = { ...this.config, ...newConfig };
    }
  }

  async listBuckets(): Promise<BucketObject[]> {
    if (!this.client) throw new Error("S3 客户端未初始化");
    try {
      const command = new ListBucketsCommand({});
      const response = await this.client.send(command);
      return (response.Buckets || []).map(b => ({
        name: b.Name || 'Unknown',
        creationDate: b.CreationDate
      }));
    } catch (error) {
      console.error("错误：列出存储桶失败", error);
      throw error;
    }
  }

  async createBucket(bucketName: string): Promise<void> {
    if (!this.client) throw new Error("S3 客户端未初始化");
    try {
      const command = new CreateBucketCommand({
        Bucket: bucketName,
      });
      await this.client.send(command);
    } catch (error) {
      console.error("错误：创建存储桶失败", error);
      throw error;
    }
  }

  async deleteBucket(bucketName: string): Promise<void> {
    if (!this.client) throw new Error("S3 客户端未初始化");
    try {
      const command = new DeleteBucketCommand({
        Bucket: bucketName
      });
      await this.client.send(command);
    } catch (error) {
      console.error("错误：删除存储桶失败", error);
      throw error;
    }
  }

  async listFiles(prefix: string = ''): Promise<FileObject[]> {
    if (!this.client || !this.config) throw new Error("S3 客户端未初始化");
    if (!this.config.bucketName) throw new Error("未选择存储桶");

    try {
      let isTruncated = true;
      let continuationToken: string | undefined = undefined;
      const allFiles: FileObject[] = [];

      while (isTruncated) {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: this.config.bucketName,
          Prefix: prefix,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        });

        const response = await this.client.send(command);

        if (response.CommonPrefixes) {
          response.CommonPrefixes.forEach((p) => {
            if (p.Prefix) {
              const exists = allFiles.some(f => f.key === p.Prefix);
              if (!exists) {
                allFiles.push({
                  key: p.Prefix,
                  name: p.Prefix.replace(prefix, '').replace('/', ''),
                  size: 0,
                  lastModified: new Date(),
                  isFolder: true,
                });
              }
            }
          });
        }

        if (response.Contents) {
          response.Contents.forEach((c) => {
            if (c.Key && c.Key !== prefix) {
              allFiles.push({
                key: c.Key,
                name: c.Key.replace(prefix, ''),
                size: c.Size || 0,
                lastModified: c.LastModified || new Date(),
                isFolder: false,
                mimeType: this.getMimeType(c.Key),
              });
            }
          });
        }

        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
      }

      return allFiles.sort((a, b) => {
        if (a.isFolder === b.isFolder) {
          return a.name.localeCompare(b.name);
        }
        return a.isFolder ? -1 : 1;
      });

    } catch (error) {
      console.error("错误：列出文件失败", error);
      throw error;
    }
  }

  private async listAllObjects(prefix: string): Promise<{ Key: string; Size: number }[]> {
    if (!this.client || !this.config?.bucketName) throw new Error("无效状态");

    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
    const objects: { Key: string; Size: number }[] = [];

    while (isTruncated) {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.client.send(command);

      if (response.Contents) {
        response.Contents.forEach(c => {
          if (c.Key) objects.push({ Key: c.Key, Size: c.Size || 0 });
        });
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }

    return objects;
  }

  async deleteFolder(prefix: string): Promise<void> {
    if (!this.client || !this.config?.bucketName) throw new Error("无效状态");

    const objects = await this.listAllObjects(prefix);

    if (objects.length === 0) return;

    const batchSize = 1000;
    for (let i = 0; i < objects.length; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      const command = new DeleteObjectsCommand({
        Bucket: this.config.bucketName,
        Delete: {
          Objects: batch.map(o => ({ Key: o.Key })),
          Quiet: true
        }
      });
      await this.client.send(command);
    }
  }

  async getBucketSize(bucketName?: string, prefix: string = ''): Promise<number> {
    if (!this.client) throw new Error("S3 客户端未初始化");

    const targetBucket = bucketName || this.config?.bucketName;
    if (!targetBucket) throw new Error("未指定存储桶");

    try {
      let isTruncated = true;
      let continuationToken: string | undefined = undefined;
      let totalSize = 0;

      while (isTruncated) {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: targetBucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const response = await this.client.send(command);

        if (response.Contents) {
          response.Contents.forEach(c => {
            totalSize += c.Size || 0;
          });
        }

        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
      }

      return totalSize;
    } catch (error) {
      console.error(`错误：计算存储桶大小失败 ${targetBucket}`, error);
      throw error;
    }
  }

  async downloadFolderAsZip(prefix: string): Promise<Blob> {
    if (!this.client || !this.config?.bucketName) throw new Error("无效状态");

    const zip = new JSZip();
    const objects = await this.listAllObjects(prefix);

    await Promise.all(objects.map(async (obj) => {
      if (obj.Key.endsWith('/')) return;

      try {
        const command = new GetObjectCommand({
          Bucket: this.config!.bucketName,
          Key: obj.Key
        });

        const response = await this.client!.send(command);
        if (response.Body) {
          const byteArray = await response.Body.transformToByteArray();

          const relativePath = obj.Key.startsWith(prefix)
            ? obj.Key.substring(prefix.length)
            : obj.Key;

          zip.file(relativePath, byteArray);
        }
      } catch (e) {
        console.error(`下载文件 ${obj.Key} 到 ZIP 失败`, e);
      }
    }));

    return await zip.generateAsync({ type: "blob" });
  }

  async downloadFilesAsZip(files: FileObject[]): Promise<Blob> {
    if (!this.client || !this.config?.bucketName) throw new Error("无效状态");
    const zip = new JSZip();

    for (const f of files) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.config!.bucketName,
          Key: f.key
        });
        const response = await this.client!.send(command);
        if (response.Body) {
          const byteArray = await response.Body.transformToByteArray();
          zip.file(f.name, byteArray);
        }
      } catch (e) {
        console.error("压缩失败", f.key);
      }
    }

    return await zip.generateAsync({ type: "blob" });
  }

  async getPresignedUrl(key: string, options?: { download?: boolean; expiresIn?: number }): Promise<string> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 客户端无效");

    const commandInput: any = {
      Bucket: this.config.bucketName,
      Key: key,
    };

    if (options?.download) {
      const filename = key.split('/').pop() || 'file';
      commandInput.ResponseContentDisposition = `attachment; filename="${filename}"`;
    }

    const command = new GetObjectCommand(commandInput);

    return getSignedUrl(this.client, command, { expiresIn: options?.expiresIn || 3600 });
  }

  async saveFileContent(key: string, content: string, mimeType: string = 'text/plain'): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 客户端无效");
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: content,
      ContentType: mimeType
    });
    await this.client.send(command);
  }

  async uploadFile(
    file: File,
    prefix: string,
    onProgress?: (progress: number, loaded: number, total: number) => void
  ): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 客户端无效");

    const key = `${prefix}${file.name}`;

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucketName,
          Key: key,
          Body: file,
          ContentType: file.type,
        },
      });

      upload.on("httpUploadProgress", (progress) => {
        if (progress.loaded !== undefined && progress.total !== undefined && onProgress) {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percentage, progress.loaded, progress.total);
        }
      });

      await upload.done();
    } catch (error: any) {
      console.error("标准上传失败", error);

      const isMiddlewareError = error.message && (
        error.message.includes("middleware") ||
        error.message.includes("serializerMiddleware") ||
        error.message.includes("is not a function")
      );

      if (isMiddlewareError) {
        console.warn("由于 SDK 中间件问题，回退到简单的 PutObjectCommand");

        const command = new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
          Body: file,
          ContentType: file.type,
        });

        await this.client.send(command);

        if (onProgress) onProgress(100, file.size, file.size);
        return;
      }

      throw error;
    }
  }

  async uploadFolder(files: FileList, prefix: string): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 客户端无效");

    const entries = Array.from(files);
    await Promise.all(entries.map(async (file) => {
      // webkitRelativePath contains the relative path within the folder
      const relativePath = (file as any).webkitRelativePath || file.name;
      const key = `${prefix}${relativePath}`;

      try {
        const upload = new Upload({
          client: this.client,
          params: {
            Bucket: this.config.bucketName,
            Key: key,
            Body: file,
            ContentType: file.type,
          },
        });

        await upload.done();
      } catch (error: any) {
        console.error("上传文件失败", error);

        const isMiddlewareError = error.message && (
          error.message.includes("middleware") ||
          error.message.includes("serializerMiddleware") ||
          error.message.includes("is not a function")
        );

        if (isMiddlewareError) {
          await this.client.send(new PutObjectCommand({
            Bucket: this.config.bucketName,
            Key: key,
            Body: file,
            ContentType: file.type,
          }));
        } else {
          throw error;
        }
      }
    }));
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 客户端无效");

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  async createFolder(folderName: string, prefix: string): Promise<void> {
    if (!this.client || !this.config || !this.config.bucketName) throw new Error("S3 客户端无效");

    const sanitizedName = folderName.replace(/^\/+|\/+$/g, '');
    const key = `${prefix}${sanitizedName}/`;

    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: '',
    });

    await this.client.send(command);
  }

  async moveObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    if (!this.client) throw new Error("S3 客户端无效");

    const copySource = `${sourceBucket}/${encodeURIComponent(sourceKey)}`;

    await this.client.send(new CopyObjectCommand({
      Bucket: destBucket,
      Key: destKey,
      CopySource: copySource
    }));

    await this.client.send(new DeleteObjectCommand({
      Bucket: sourceBucket,
      Key: sourceKey
    }));
  }

  async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    if (!this.client) throw new Error("S3 客户端无效");

    const copySource = `${sourceBucket}/${encodeURIComponent(sourceKey)}`;

    await this.client.send(new CopyObjectCommand({
      Bucket: destBucket,
      Key: destKey,
      CopySource: copySource
    }));
  }

  async moveFolder(sourceBucket: string, sourcePrefix: string, destBucket: string, destPrefix: string): Promise<void> {
    if (!this.client) throw new Error("S3 客户端无效");

    const objects = await this.listAllObjects(sourcePrefix);
    if (objects.length === 0) return;

    for (const obj of objects) {
      const relativePath = obj.Key.substring(sourcePrefix.length);
      const newKey = `${destPrefix}${relativePath}`;
      await this.moveObject(sourceBucket, obj.Key, destBucket, newKey);
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      case 'webp': return 'image/webp';
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'json': return 'application/json';
      case 'js': return 'application/javascript';
      case 'ts': return 'text/plain';
      case 'tsx': return 'text/plain';
      case 'jsx': return 'text/plain';
      case 'css': return 'text/css';
      case 'html': return 'text/html';
      case 'zip':
      case 'rar':
      case '7z': return 'application/zip';
      case 'mp4':
      case 'mov': return 'video/mp4';
      case 'mp3':
      case 'wav': return 'audio/mpeg';
      default: return 'application/octet-stream';
    }
  }
}
