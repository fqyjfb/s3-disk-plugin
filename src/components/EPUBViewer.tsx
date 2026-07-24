import React, { useState, useEffect, useRef } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import { ChevronLeft, ChevronRight, Loader2, Book as BookIcon } from 'lucide-react';

interface EPUBViewerProps { url: string; fileName: string; data?: ArrayBuffer; }

const EPUBViewer: React.FC<EPUBViewerProps> = ({ url, fileName, data }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<string>('');
    const viewerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);

    useEffect(() => {
        if (!viewerRef.current) return;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let cancelled = false;

        const loadBook = async () => {
            try {
                setLoading(true); setError(null);
                timeoutId = setTimeout(() => { if (!cancelled) { setError('EPUB 加载超时。文件可能太大或已损坏。'); setLoading(false); } }, 30000);
                const book = data ? ePub(data) : ePub(url);
                bookRef.current = book;
                const maxWidth = window.innerWidth > 768 ? 800 : window.innerWidth - 32;
                const containerHeight = viewerRef.current!.clientHeight || 600;
                const rendition = book.renderTo(viewerRef.current!, { width: maxWidth, height: containerHeight, spread: 'none', flow: 'paginated' });
                renditionRef.current = rendition;
                rendition.themes.default({
                    'body': { 'color': '#2d2d2d !important', 'background': '#fdfdf8 !important', 'font-family': 'Georgia, "Times New Roman", serif !important', 'font-size': '18px !important', 'line-height': '1.6 !important', 'padding': '20px !important' },
                    'p': { 'margin-bottom': '1em !important', 'text-align': 'justify !important' },
                    'h1, h2, h3, h4, h5, h6': { 'color': '#1a1a1a !important', 'margin-top': '1.5em !important', 'margin-bottom': '0.5em !important' },
                    'a': { 'color': '#3b82f6 !important' }
                });
                if (document.documentElement.classList.contains('dark')) {
                    rendition.themes.default({ 'body': { 'color': '#e4e4e4 !important', 'background': '#1a1a1a !important' }, 'h1, h2, h3, h4, h5, h6': { 'color': '#f5f5f5 !important' }, 'a': { 'color': '#60a5fa !important' } });
                }
                rendition.hooks.content.register(() => { if (timeoutId && !cancelled) { clearTimeout(timeoutId); setLoading(false); } });
                try {
                    const spine = book.spine as any;
                    if (spine && spine.items && spine.items.length > 1) await rendition.display(spine.items[1].href);
                    else await rendition.display();
                } catch { await rendition.display(); }
                rendition.on('relocated', (location: any) => {
                    if (!book.locations) return;
                    const { start } = location;
                    if (start) {
                        try { const currentLoc = book.locations.locationFromCfi(start.cfi); const totalLocs = book.locations.length(); if (typeof currentLoc === 'number' && currentLoc > 0 && totalLocs > 0) setCurrentLocation(`${currentLoc} / ${totalLocs}`); } catch {}
                    }
                });
                book.locations.generate(1024).catch(() => {});
            } catch (err: any) { if (timeoutId) clearTimeout(timeoutId); if (cancelled) return; console.error('错误：加载 EPUB 失败', err); setError(err.message || '加载 EPUB 文件失败'); setLoading(false); }
        };
        loadBook();
        return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); if (renditionRef.current) renditionRef.current.destroy(); if (bookRef.current) bookRef.current.destroy(); };
    }, [url, data]);

    const goToPrevPage = () => { if (renditionRef.current) renditionRef.current.prev(); };
    const goToNextPage = () => { if (renditionRef.current) renditionRef.current.next(); };

    return (
        <div className="w-full h-full flex flex-col bg-secondary/10">
            <div className="flex items-center justify-between px-3 md:px-4 py-3 bg-background border-b border-border shrink-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <BookIcon size={18} className="text-primary shrink-0" />
                    <span className="text-sm font-medium truncate" title={fileName}>{fileName}</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <button onClick={goToPrevPage} disabled={loading} className="p-1.5 md:p-2 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0" title="上一页"><ChevronLeft size={18} /></button>
                    {currentLocation && <span className="text-[10px] md:text-xs text-muted-foreground font-mono tabular-nums min-w-[45px] md:min-w-[70px] text-center shrink-0">{currentLocation}</span>}
                    <button onClick={goToNextPage} disabled={loading} className="p-1.5 md:p-2 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0" title="下一页"><ChevronRight size={18} /></button>
                </div>
            </div>
            <div className="flex-1 relative overflow-hidden bg-[#fdfdf8] dark:bg-[#1a1a1a]">
                {loading && <div className="absolute inset-0 flex items-center justify-center"><div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" size={20} /><span className="text-sm">正在加载 EPUB...</span></div></div>}
                {error && <div className="absolute inset-0 flex items-center justify-center"><div className="text-center text-destructive"><p className="font-medium">加载 EPUB 失败</p><p className="text-xs text-muted-foreground mt-1">{error}</p></div></div>}
                <div ref={viewerRef} className="w-full h-full flex items-center justify-center" style={{ display: loading || error ? 'none' : 'flex' }} />
            </div>
        </div>
    );
};

export default EPUBViewer;
