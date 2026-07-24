# S3 云存储管理器

![GitHub release](https://img.shields.io/github/v/release/fqyjfb/s3-disk-plugin)
![GitHub license](https://img.shields.io/github/license/fqyjfb/s3-disk-plugin)

现代 S3 对象存储浏览器，支持 AWS S3、Cloudflare R2、MinIO 等，拖拽上传、文件预览、代码编辑、批量操作。

## 功能特性

- **多云兼容**：支持 AWS S3、Cloudflare R2、MinIO、腾讯云 COS、数据胶囊等 S3 兼容服务
- **拖拽上传**：支持单文件、多文件、文件夹拖拽上传，带进度条
- **文件预览**：图片、PDF、EPUB、代码、CSV、Excel、DOCX、十六进制、Markdown 等多种格式
- **代码编辑**：内置 CodeMirror 编辑器，支持多种编程语言高亮和语法检查
- **批量操作**：多选文件进行批量下载（ZIP）、删除、移动
- **文件操作**：上传、下载、删除、重命名、复制、移动、新建文件夹/文件
- **分享链接**：生成预签名 URL，方便分享文件
- **虚拟滚动**：大目录高效渲染，流畅浏览
- **搜索与排序**：实时搜索文件，按名称/大小/日期排序
- **配置管理**：多配置文件加密存储，AES-GCM 安全加密
- **暗色模式**：完整主题适配，跟随系统主题
- **命令面板**：键盘快捷键快速操作
- **移动适配**：支持移动设备触摸操作、手势缩放、长按菜单

## 截图

（添加插件运行截图）

## 安装

1. 在 ToolBox 插件商店中搜索"S3 云存储管理器"
2. 点击安装并打开插件
3. 输入您的 S3 服务配置信息（Endpoint、AccessKey、SecretKey、Region）
4. 选择存储桶开始浏览

## 支持的 S3 服务

| 服务商 | Endpoint 示例 |
|--------|---------------|
| AWS S3 | `s3.amazonaws.com` |
| Cloudflare R2 | `https://xxx.r2.cloudflarestorage.com` |
| MinIO | `http://localhost:9000` 或自定义域名 |
| 腾讯云 COS | `cos.<region>.myqcloud.com` |
| 数据胶囊 | `s3.cstcloud.cn` |

## 技术栈

- React 19 + TypeScript
- Vite 5.x 构建（IIFE 格式）
- Tailwind CSS（CDN 加载）
- Lucide React 图标库
- AWS SDK v3（@aws-sdk/client-s3）
- CodeMirror 6（代码编辑器）
- react-pdf、docx-preview、epubjs（文件预览）

## 构建

```bash
npm install
npm run build
```

构建产物输出到 `dist/index.js`。

## 开发

本插件遵循 [ToolBox 插件开发规范](https://github.com/fqyjfb/toolbox-plugins-registry/blob/main/docs/plugin-development-guide.md)，可在 ToolBox 开发模式下进行本地调试。

## 许可证

MIT License
