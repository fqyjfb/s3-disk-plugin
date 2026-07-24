import React, { useEffect, useState } from 'react';
import { S3Service } from '../services/s3Service';
import { BucketObject } from '../types';
import { Database, Loader2, Search, RefreshCw, Plus, Trash2, X, AlertTriangle, Cloud, CloudLightning, Server, Globe, AlertCircle } from 'lucide-react';

interface BucketListProps {
    s3: S3Service;
    selectedBucket: string | null;
    onSelectBucket: (name: string) => void;
    provider?: string;
}

const BucketList: React.FC<BucketListProps> = ({ s3, selectedBucket, onSelectBucket, provider }) => {
    const [buckets, setBuckets] = useState<BucketObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<{ message: string; detail?: string } | null>(null);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newBucketName, setNewBucketName] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; name: string | null }>({ show: false, name: null });
    const [actionLoading, setActionLoading] = useState(false);

    // Pull-to-refresh state
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartY = React.useRef(0);
    const listRef = React.useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (listRef.current && listRef.current.scrollTop === 0) {
            pullStartY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!listRef.current || listRef.current.scrollTop > 0 || pullStartY.current === 0) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - pullStartY.current;
        if (diff > 0) {
            setIsPulling(true);
            setPullDistance(Math.min(diff * 0.5, 80));
        }
    };

    const handleTouchEnd = async () => {
        if (isPulling && pullDistance > 50) {
            await loadBuckets();
        }
        setIsPulling(false);
        setPullDistance(0);
        pullStartY.current = 0;
    };

    const loadBuckets = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await s3.listBuckets();
            setBuckets(data);
        } catch (err: any) {
            console.error("错误：列出存储桶失败", err);
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                setError({ message: "连接失败", detail: "CORS 或网络错误。请检查浏览器控制台。" });
            } else if (err.name === 'AccessDenied') {
                setError({ message: "访问被拒绝", detail: "缺少 s3:ListAllMyBuckets 权限。" });
            } else {
                setError({ message: "加载存储桶失败" });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadBuckets(); }, []);

    const handleCreateBucket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBucketName.trim()) return;
        setActionLoading(true);
        try {
            await s3.createBucket(newBucketName);
            setNewBucketName('');
            setIsCreateModalOpen(false);
            loadBuckets();
        } catch (err: any) {
            alert("创建存储桶失败：" + (err.message || "未知错误"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteRequest = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        setDeleteConfirmation({ show: true, name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.name) return;
        setActionLoading(true);
        try {
            await s3.deleteBucket(deleteConfirmation.name);
            setDeleteConfirmation({ show: false, name: null });
            if (selectedBucket === deleteConfirmation.name) onSelectBucket('');
            loadBuckets();
        } catch (err: any) {
            if (err.name === 'BucketNotEmpty') alert("无法删除存储桶：该存储桶不为空。");
            else if (err.name === 'AccessDenied') alert("访问被拒绝：您没有删除此存储桶的权限。");
            else alert("删除存储桶失败：" + (err.message || "未知错误"));
        } finally { setActionLoading(false); }
    };

    const getProviderIcon = () => {
        switch (provider) {
            case 'aws': return Cloud;
            case 'cloudflare': return CloudLightning;
            case 'minio': return Server;
            case 'other': return Globe;
            default: return Database;
        }
    };

    const ProviderIcon = getProviderIcon();
    const filteredBuckets = buckets.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col h-full w-full bg-background relative">
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">创建存储桶</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateBucket} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">存储桶名称</label>
                                <input type="text" autoFocus placeholder="my-new-bucket" className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" value={newBucketName} onChange={(e) => setNewBucketName(e.target.value)} />
                                <p className="text-[10px] text-muted-foreground mt-1">存储桶名称必须唯一且为小写。</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors">取消</button>
                                <button type="submit" disabled={actionLoading || !newBucketName} className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:bg-white/90 transition-colors disabled:opacity-70 flex items-center gap-2">
                                    {actionLoading && <Loader2 size={14} className="animate-spin" />} 创建
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {deleteConfirmation.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setDeleteConfirmation({ show: false, name: null })}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="text-destructive w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">删除存储桶</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                            确定要删除 <span className="font-medium text-foreground bg-secondary px-1.5 py-0.5 rounded text-xs">{deleteConfirmation.name}</span> 吗？此操作无法撤销，且存储桶必须为空。
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteConfirmation({ show: false, name: null })} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors border border-transparent hover:border-border">取消</button>
                            <button onClick={confirmDelete} disabled={actionLoading} className="px-4 py-2 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2">
                                {actionLoading && <Loader2 size={14} className="animate-spin" />} 删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-4 border-b border-border bg-background/50 sticky top-0 z10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ProviderIcon size={14} className="text-foreground/70" /> 存储桶
                    </h2>
                    <div className="flex gap-1">
                        <button onClick={() => setIsCreateModalOpen(true)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" title="新建存储桶"><Plus size={16} /></button>
                        <button onClick={loadBuckets} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" title="刷新"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
                    </div>
                </div>
                <div className="relative group">
                    <Search className="absolute left-2.5 top-2 text-muted-foreground w-3.5 h-3.5 group-focus-within:text-foreground transition-colors" />
                    <input type="text" placeholder="筛选存储桶..." className="w-full bg-secondary/50 border border-border/50 focus:border-border rounded-md pl-8 pr-3 py-1.5 text-xs outline-none transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-2 custom-scrollbar relative z-10 bg-background transition-transform duration-200 ease-out" style={{ transform: isPulling ? `translateY(${pullDistance}px)` : 'none' }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                {isPulling && pullDistance > 50 && (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                )}
                {loading && buckets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mb-2 opacity-50" /><span className="text-xs">加载中...</span></div>
                )}
                {error && (
                    <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20 mx-2 mt-2">
                        <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-destructive" /><span className="text-xs text-destructive font-bold">{error.message}</span></div>
                        {error.detail && <p className="text-[10px] text-destructive/80 pl-6 mb-2">{error.detail}</p>}
                        <button onClick={loadBuckets} className="w-full text-[10px] bg-background/50 hover:bg-background px-2 py-1.5 rounded text-destructive transition-colors border border-destructive/20">重试连接</button>
                    </div>
                )}
                {!loading && !error && (
                    <div className="space-y-0.5">
                        {filteredBuckets.map(bucket => (
                            <div key={bucket.name} onClick={() => onSelectBucket(bucket.name)} className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all text-sm ${selectedBucket === bucket.name ? 'bg-foreground text-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <Database size={16} className={selectedBucket === bucket.name ? 'text-background' : 'text-muted-foreground group-hover:text-foreground'} />
                                    <span className="truncate">{bucket.name}</span>
                                </div>
                                <button onClick={(e) => handleDeleteRequest(e, bucket.name)} className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ${selectedBucket === bucket.name ? 'hover:bg-black/20 text-background' : 'hover:bg-destructive/10 hover:text-destructive text-muted-foreground'}`} title="删除存储桶"><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                )}
                {!loading && !error && filteredBuckets.length === 0 && (
                    <div className="text-center py-8 px-4"><p className="text-xs text-muted-foreground mb-2">未找到存储桶</p></div>
                )}
            </div>
        </div>
    );
};

export default BucketList;
