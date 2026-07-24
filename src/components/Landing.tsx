
import React from 'react';
import {
    ArrowRight, Globe, Zap, UploadCloud, Eye,
    Database, CloudLightning, Search,
    Folder, Image as ImageIcon, FileCode, MoreHorizontal, ShieldCheck,
    LayoutGrid, ChevronRight, Command, Star, Clock, MoreVertical, List, Filter, Code2,
    Smartphone, WifiOff, Download, Heart, Settings, Upload, Link
} from 'lucide-react';
import { useSafeArea } from '../hooks/useSafeArea';

interface LandingProps {
    onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
    const safeArea = useSafeArea();
    return (
        <div className="min-h-screen w-full bg-background text-foreground font-sans flex flex-col relative overflow-y-auto overflow-x-hidden scroll-smooth selection:bg-blue-500/30 transition-colors duration-300">
            {/* Animation Styles */}
            <style>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 4rem 4rem; }
        }
        .animate-grid {
          animation: grid-move 60s linear infinite;
        }
        .perspective-container {
          perspective: 2000px;
        }
      `}</style>

            {/* Top Blur Gradient (Mobile Only) */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background to-transparent z-0"></div>

            {/* Decorative Grids with Animation - Adaptive */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)] md:[mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_60%,transparent_100%)] pointer-events-none animate-grid z-0"></div>

            {/* Top Ambient Light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-100"></div>

            <main
                className="flex-1 flex flex-col items-center justify-start text-center z-10 pt-20 pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                style={{ paddingTop: `${Math.max(80, 80 + safeArea.top)}px`, paddingBottom: `${Math.max(80, 80 + safeArea.bottom)}px` }}
            >

                {/* Header Section */}
                <div className="flex flex-col items-center gap-8 mb-16 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* ToolBox Plugin Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 hover:bg-secondary backdrop-blur-md text-[10px] uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground transition-all cursor-default shadow-sm"
                    >
                        <Database size={12} className="group-hover:text-foreground transition-colors" />
                        ToolBox 插件
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-foreground leading-[1.1] drop-shadow-sm dark:drop-shadow-2xl">
                        现代化的 <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground to-foreground/40">云存储管理界面。</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                        极速、纯客户端的 S3 文件浏览器。 <br className="hidden sm:block" />
                        支持 AWS S3、Cloudflare R2、MinIO 及所有兼容服务。 <br className="hidden sm:block" />
                        无服务器、无追踪，只管理您的数据。
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
                        <button
                            onClick={onGetStarted}
                            className="h-12 px-8 rounded-full bg-foreground text-background font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-lg"
                        >
                            开始使用 <ArrowRight size={18} />
                        </button>
                    </div>
                </div>

                {/* UI Illustration / Mockup */}
                <div className="w-full max-w-6xl mt-4 mb-8 md:mb-32 perspective-container group relative px-2 md:px-0 overflow-hidden">

                    {/* Desktop: Interactive HTML Mockup */}
                    <div className="hidden md:block relative rounded-xl bg-background dark:bg-[#0F1115] border border-border shadow-2xl overflow-hidden transition-all duration-500 ease-out group-hover:shadow-blue-500/20 ring-1 ring-border group-hover:ring-blue-500/30">

                        {/* Mockup Header */}
                        <div className="h-12 bg-secondary/30 dark:bg-[#16181D] border-b border-border flex items-center px-4 justify-between shrink-0 select-none">
                            {/* Window Controls */}
                            <div className="flex items-center gap-2 w-20 opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] hover:bg-[#FF5F57]/80 shadow-inner"></div>
                                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24] hover:bg-[#FEBC2E]/80 shadow-inner"></div>
                                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29] hover:bg-[#28C840]/80 shadow-inner"></div>
                            </div>

                            {/* Search Bar */}
                            <div className="flex-1 max-w-xl mx-4">
                                <div className="w-full bg-background dark:bg-[#0A0B0E] border border-border dark:border-white/5 rounded-md h-8 flex items-center px-3 gap-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all cursor-text group/search shadow-inner">
                                    <Search size={12} className="text-muted-foreground/70 group-hover/search:text-muted-foreground transition-colors" />
                                    <span className="flex-1">搜索文件...</span>
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground">
                                        <Command size={10} />K
                                    </div>
                                </div>
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-center gap-3 w-20 justify-end">
                                <div className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative">
                                    <MoreVertical size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Mockup Body */}
                        <div className="flex h-[350px] sm:h-[450px] md:h-[600px] bg-background dark:bg-[#0F1115] relative text-left">

                            {/* Sidebar */}
                            <div className="w-60 border-r border-border bg-secondary/10 dark:bg-[#121418] flex flex-col shrink-0">
                                <div className="p-4 space-y-6">
                                    {/* Favorites */}
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">收藏夹</div>
                                        <div className="space-y-0.5">
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer">
                                                <Clock size={14} className="group-hover/nav:text-blue-500 transition-colors" /> 最近访问
                                            </div>
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer">
                                                <Star size={14} className="group-hover/nav:text-yellow-500 transition-colors" /> 已收藏
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buckets */}
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex justify-between items-center">
                                            <span>存储桶</span>
                                            <span className="hover:bg-secondary p-0.5 rounded cursor-pointer"><CloudLightning size={10} /></span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="h-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-100 border border-blue-500/20 flex items-center justify-between px-2 text-xs font-medium cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                                <div className="flex items-center gap-2.5">
                                                    <Database size={14} className="text-blue-500" />
                                                    生产环境资源
                                                </div>
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></span>
                                            </div>
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer border border-transparent hover:border-border">
                                                <Database size={14} className="text-muted-foreground group-hover/nav:text-foreground" />
                                                备份归档
                                            </div>
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer border border-transparent hover:border-border">
                                                <Database size={14} className="text-muted-foreground group-hover/nav:text-foreground" />
                                                测试环境资源
                                            </div>
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer border border-transparent hover:border-border">
                                                <Globe size={14} className="text-muted-foreground group-hover/nav:text-foreground" />
                                                公开 CDN
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex flex-col min-w-0 bg-background dark:bg-[#0F1115]">

                                {/* Toolbar */}
                                <div className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 bg-background/50 dark:bg-[#0F1115]/50 backdrop-blur-sm z-10">
                                    <div className="flex items-center gap-2 text-sm">
                                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                            <ArrowRight size={16} className="rotate-180" />
                                        </button>
                                        <div className="h-4 w-px bg-border mx-1"></div>
                                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group/bread">
                                            <Database size={14} className="group-hover/bread:text-blue-500 transition-colors" />
                                            <span>生产环境资源</span>
                                        </div>
                                        <ChevronRight size={14} className="text-muted-foreground" />
                                        <span className="font-semibold text-foreground cursor-pointer hover:underline transition-colors">图片</span>
                                        <ChevronRight size={14} className="text-muted-foreground" />
                                        <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">营销素材</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-card dark:bg-[#0A0B0E] border border-border px-2 py-1 rounded">
                                            <Filter size={12} />
                                            <span>筛选...</span>
                                        </div>
                                        <div className="h-4 w-px bg-border mx-1 hidden sm:block"></div>
                                        <div className="flex bg-card dark:bg-[#0A0B0E] p-0.5 rounded-lg border border-border">
                                            <div className="p-1.5 rounded-md bg-secondary text-foreground shadow-sm cursor-pointer"><LayoutGrid size={14} /></div>
                                            <div className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"><List size={14} /></div>
                                        </div>
                                        <button className="bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm">
                                            <UploadCloud size={12} /> <span className="hidden sm:inline">上传</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Grid */}
                                <div className="p-4 md:p-6 overflow-hidden relative">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* Interactive Folder */}
                                        <div className="aspect-[4/3.2] bg-card dark:bg-[#16181D] border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-3 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-[0_4px_20px_-12px_rgba(59,130,246,0.5)] transition-all group/item cursor-pointer relative">
                                            <Folder size={48} className="text-blue-500 fill-blue-500/10 drop-shadow-lg transition-transform group-hover/item:scale-110 duration-300" />
                                            <div className="text-center w-full">
                                                <span className="text-xs text-foreground dark:text-zinc-300 font-medium block mb-0.5 truncate px-2">2024 营销活动</span>
                                                <span className="text-[10px] text-muted-foreground">12 项</span>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-secondary rounded text-muted-foreground">
                                                <MoreHorizontal size={14} />
                                            </div>
                                        </div>

                                        {/* Interactive Image (Selected) */}
                                        <div className="aspect-[4/3.2] bg-blue-500/10 border border-blue-500/50 rounded-xl p-3 flex flex-col items-center justify-center gap-3 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] transition-all group/item cursor-pointer relative ring-1 ring-blue-400/30">
                                            <ImageIcon size={48} className="text-purple-400 drop-shadow-lg transition-transform group-hover/item:scale-110 duration-300" />
                                            <div className="text-center w-full">
                                                <span className="text-xs text-blue-600 dark:text-blue-200 font-medium block mb-0.5 truncate px-2">主横幅_v2.jpg</span>
                                                <span className="text-[10px] text-blue-500/70 dark:text-blue-300/70">2.4 MB</span>
                                            </div>
                                            <div className="absolute top-2 right-2 p-1 hover:bg-blue-500/20 rounded text-blue-500 dark:text-blue-300">
                                                <MoreHorizontal size={14} />
                                            </div>
                                            <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,1)] ring-2 ring-blue-900"></div>
                                        </div>

                                        {/* Interactive Code File */}
                                        <div className="aspect-[4/3.2] bg-card dark:bg-[#16181D] border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-3 hover:border-yellow-500/40 hover:bg-yellow-500/5 hover:shadow-[0_4px_20px_-12px_rgba(234,179,8,0.5)] transition-all group/item cursor-pointer relative">
                                            <FileCode size={48} className="text-yellow-500 drop-shadow-lg transition-transform group-hover/item:scale-110 duration-300" />
                                            <div className="text-center w-full">
                                                <span className="text-xs text-foreground dark:text-zinc-300 font-medium block mb-0.5 truncate px-2">分析配置.json</span>
                                                <span className="text-[10px] text-muted-foreground">1 KB</span>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-secondary rounded text-muted-foreground">
                                                <MoreHorizontal size={14} />
                                            </div>
                                        </div>

                                        {/* Interactive Folder 2 */}
                                        <div className="aspect-[4/3.2] bg-card dark:bg-[#16181D] border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-3 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-[0_4px_20px_-12px_rgba(59,130,246,0.5)] transition-all group/item cursor-pointer relative">
                                            <Folder size={48} className="text-blue-500 fill-blue-500/10 drop-shadow-lg transition-transform group-hover/item:scale-110 duration-300" />
                                            <div className="text-center w-full">
                                                <span className="text-xs text-foreground dark:text-zinc-300 font-medium block mb-0.5 truncate px-2">原始素材</span>
                                                <span className="text-[10px] text-muted-foreground">48 项</span>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-secondary rounded text-muted-foreground">
                                                <MoreHorizontal size={14} />
                                            </div>
                                        </div>

                                        {/* Placeholders */}
                                        <div className="aspect-[4/3.2] bg-secondary/20 dark:bg-[#16181D]/40 border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-all cursor-pointer hover:bg-secondary/40 sm:hidden">
                                            <div className="w-12 h-12 rounded-lg bg-muted/50 skeleton-shimmer"></div>
                                            <div className="w-16 h-2 rounded bg-muted/50 mt-2"></div>
                                            <div className="w-8 h-1.5 rounded bg-muted/50"></div>
                                        </div>
                                        {[1, 2].map((i) => (
                                            <div key={i} className="aspect-[4/3.2] bg-secondary/20 dark:bg-[#16181D]/40 border border-border dark:border-white/5 rounded-xl p-3 flex-col items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-all cursor-pointer hover:bg-secondary/40 hidden sm:flex">
                                                <div className="w-12 h-12 rounded-lg bg-muted/50 skeleton-shimmer"></div>
                                                <div className="w-16 h-2 rounded bg-muted/50 mt-2"></div>
                                                <div className="w-8 h-1.5 rounded bg-muted/50"></div>
                                            </div>
                                        ))}
                                        <div className="aspect-[4/3.2] bg-secondary/20 dark:bg-[#16181D]/40 border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 opacity-40 hidden lg:flex hover:opacity-60 transition-all cursor-pointer hover:bg-secondary/40">
                                            <div className="w-12 h-12 rounded-lg bg-muted/50 skeleton-shimmer"></div>
                                            <div className="w-16 h-2 rounded bg-muted/50 mt-2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Screen Glare/Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none mix-blend-overlay opacity-50"></div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-20 text-left max-w-6xl mx-auto">
                    <FeatureCard
                        icon={<ShieldCheck className="text-green-500" />}
                        title="端到端加密"
                        description="您的凭据使用 AES-GCM 加密并存储在设备本地。永远不会发送到任何后端服务器。"
                        color="bg-green-500/10"
                    />
                    <FeatureCard
                        icon={<Globe className="text-blue-500" />}
                        title="多云支持"
                        description="一个工具搞定全部。在 AWS S3、Cloudflare R2、MinIO 及任意 S3 兼容服务之间无缝切换。"
                        color="bg-blue-500/10"
                    />
                    <FeatureCard
                        icon={<UploadCloud className="text-purple-500" />}
                        title="拖拽上传"
                        description="轻松上传大文件和文件夹。只需将它们拖入浏览器窗口，即可瞬间上传。"
                        color="bg-purple-500/10"
                    />
                    <FeatureCard
                        icon={<Folder className="text-orange-500" />}
                        title="完整文件管理"
                        description="重命名文件、创建文件夹、按名称/大小/日期排序，通过直观的上下文菜单和滑动操作组织存储。"
                        color="bg-orange-500/10"
                    />
                    <FeatureCard
                        icon={<Eye className="text-pink-500" />}
                        title="即时预览"
                        description="直接预览图片、视频、PDF、EPUB、Markdown、Office 文件、CSV 数据及二进制文件，无需下载。"
                        color="bg-pink-500/10"
                    />
                    <FeatureCard
                        icon={<ImageIcon className="text-indigo-500" />}
                        title="EXIF 与元数据"
                        description="查看详细的文件信息，包括大小、日期、存储类以及照片 EXIF 数据（相机、GPS、拍摄参数）。"
                        color="bg-indigo-500/10"
                    />
                    <FeatureCard
                        icon={<Code2 className="text-yellow-500" />}
                        title="纯客户端运行"
                        description="完全在浏览器中运行，无后端服务器、无数据库、无数据采集。您的文件永远不会经过我们的服务器。"
                        color="bg-yellow-500/10"
                    />
                    <FeatureCard
                        icon={<Link className="text-cyan-500" />}
                        title="共享链接生成"
                        description="为任何文件生成预签名 URL 分享链接，可自定义有效期，安全便捷地与同事共享文件。"
                        color="bg-cyan-500/10"
                    />
                </div>

                {/* How It Works Section */}
                <div className="w-full max-w-6xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">如何开始</h2>
                    <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">仅需三个简单步骤</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                                <Database size={32} className="text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold text-blue-500 mb-2">1. 连接</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                输入您的 S3 凭据（端点、访问密钥、秘密密钥）。凭据经过加密后安全存储在浏览器本地。
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                                <Folder size={32} className="text-purple-500" />
                            </div>
                            <div className="text-2xl font-bold text-purple-500 mb-2">2. 浏览</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                像文件管理器一样浏览存储桶和文件夹。预览文件、搜索内容、组织您的云存储。
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                                <UploadCloud size={32} className="text-green-500" />
                            </div>
                            <div className="text-2xl font-bold text-green-500 mb-2">3. 管理</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                上传、下载、删除和移动文件。创建文件夹、生成分享链接，轻松管理您的存储。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security & Privacy Section */}
                <div className="w-full max-w-6xl mx-auto mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">安全与隐私</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">您的数据安全是我们的首要任务</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/20 relative z-10">
                                <Database size={24} className="text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">100% 客户端运行</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                本插件完全在您的浏览器中运行。没有后端服务器、没有数据库、没有任何数据采集。您的文件和凭据永远不会触及我们的服务器，因为我们根本没有服务器。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 relative z-10">
                                <ShieldCheck size={24} className="text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">本地加密</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                连接配置使用 Web Crypto API 的 AES-GCM 256 位加密进行加密，并存储在浏览器本地存储中。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20 relative z-10">
                                <Zap size={24} className="text-purple-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">直连存储</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                所有 S3 操作都从您的浏览器直接连接到存储服务。您的访问密钥永远不会传输给任何第三方。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-yellow-500/20 relative z-10">
                                <Upload size={24} className="text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">大文件分块上传</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                使用分块上传（Multipart Upload）技术处理超大文件，支持断点续传，确保上传稳定可靠。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Native Experience Section */}
                <div className="w-full max-w-6xl mx-auto mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">原生级体验</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">在您的设备上获得最佳使用体验</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 relative z-10">
                                <Smartphone size={24} className="text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">全平台适配</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                在桌面、平板和手机上均可流畅使用。响应式界面自适应屏幕尺寸，随时随地管理云存储。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20 relative z-10">
                                <WifiOff size={24} className="text-purple-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">离线可用</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                应用壳层本地缓存，即使在无网络连接的情况下也能瞬间加载，体验闪电般的启动速度。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/20 relative z-10">
                                <Zap size={24} className="text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">原生级性能</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                流畅的动画、触屏手势和响应式界面，带来不亚于原生应用的流畅体验。
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="w-full max-w-6xl mx-auto mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">常见问题</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">关于 S3 Disk 插件您需要了解的一切</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <ShieldCheck size={20} className="text-green-500 shrink-0 mt-0.5" />
                                我的数据安全吗？
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                安全。本插件完全在客户端运行，您的凭据使用 AES-GCM 在本地加密，永远不会离开您的设备。没有任何后端服务器收集或存储您的数据。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <Globe size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                支持哪些存储提供商？
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                AWS S3、Cloudflare R2、MinIO 以及所有兼容 S3 API 的存储服务。只要支持 S3 协议，都可以使用本插件管理。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <Download size={20} className="text-purple-500 shrink-0 mt-0.5" />
                                如何下载文件夹？
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                直接点击文件夹，插件会自动将所有文件打包成 ZIP 文件供您下载，无需逐文件操作。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <Settings size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                                需要什么权限？
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                完整功能需要：ListBucket、GetObject、PutObject、DeleteObject。若仅需只读模式，ListBucket 和 GetObject 即可满足。
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm md:col-span-2">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <Globe size={20} className="text-orange-500 shrink-0 mt-0.5" />
                                需要配置 CORS 吗？
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10 mb-3">
                                是的，因为本插件在浏览器中运行，需要在您的 S3 存储桶上配置 CORS。添加以下策略以允许浏览器访问：
                            </p>
                            <pre className="text-xs font-mono bg-secondary p-3 rounded overflow-x-auto relative z-10">{`[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]`}</pre>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground pb-8 border-t border-border pt-8 w-full max-w-4xl flex flex-col sm:flex-row justify-center items-center gap-4">
                    <p className="flex items-center gap-1">
                        由 ToolBox 团队打造 <Heart size={12} className="text-red-500 fill-red-500" />
                    </p>
                </div>

            </main>
        </div>
    );
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => (
    <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-foreground/5 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700`}></div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-border relative z-10`}>
            {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">{description}</p>
    </div>
);

export default Landing;
