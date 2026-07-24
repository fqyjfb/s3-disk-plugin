import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Folder, FileText, Image as ImageIcon, Music, Video, Code, Archive,
    MoreVertical, Download, Trash2, Share2, ChevronRight, Home,
    ArrowLeft, Search, X, Upload, Check, Loader2, Copy,
    ChevronLeft, ChevronRight as ChevronRightIcon, Edit2, Save,
    Database, FilePlus, Move, CheckSquare, Link, Eye,
    RefreshCw, List, Grid,
    AlertCircle, PenTool, BookOpen, UploadCloud,
    FolderPlus, ArrowUpDown, Info, FileJson, FileSpreadsheet, Binary, Tag,
    ArrowUp, ArrowDown
} from 'lucide-react';
import { S3Service, formatBytes } from '../services/s3Service';
import { FileObject, BucketObject, ViewMode } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import BottomSheet from './BottomSheet';
import SwipeableListItem from './SwipeableListItem';
import ImagePreview from './ImagePreview';
import PDFViewer from './PDFViewer';
import EPUBViewer from './EPUBViewer';
import CodeViewer from './CodeViewer';
import CodeEditor from './CodeEditor';
import CSVViewer from './CSVViewer';
import HexViewer from './HexViewer';
import DocxPreview from './DocxPreview';
import XlsxPreview from './XlsxPreview';
import { useIsMobile } from '../hooks/useIsMobile';
import exifr from 'exifr';
import { useEdgeSwipe } from '../hooks/useEdgeSwipe';
import { useSafeArea } from '../hooks/useSafeArea';
import { useDebounce } from '../hooks/useDebounce';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ExplorerProps {
    s3: S3Service;
    bucketName: string;
    onUpload: (file: File, prefix: string, onComplete: () => void) => void;
    onBackToBuckets?: () => void;
    readOnly?: boolean;
}

const getAwsErrorMessage = (err: any) => {
    if (!err) return { title: "未知错误", message: "发生未知错误。", details: "", docLink: "" };
    const code = err.name || err.Code || "错误";
    const message = err.message || "出错了。";
    if (message === 'Failed to fetch' || code === 'TypeError') {
        return { title: "连接失败 (CORS)", message: "浏览器被阻止连接到您的存储桶。", details: "这通常是因为您的存储桶缺少 CORS 配置。", docLink: "" };
    }
    if (code === 'AccessDenied' || err.$metadata?.httpStatusCode === 403) {
        return { title: "访问被拒绝", message: "您没有足够的权限执行此操作。", details: `错误代码: ${code}\n消息: ${message}`, docLink: "" };
    }
    return { title: code === '错误' ? '操作失败' : code, message, details: JSON.stringify(err, null, 2), docLink: "" };
};

const Explorer: React.FC<ExplorerProps> = ({ s3, bucketName, onUpload, onBackToBuckets, readOnly = false }) => {
    const [currentPrefix, setCurrentPrefix] = useState('');
    const [files, setFiles] = useState<FileObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewError, setViewError] = useState<{ title: string; message: string } | null>(null);
    const isMobile = useIsMobile();
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
    const [searchInput, setSearchInput] = useState('');
    const search = useDebounce(searchInput, 300);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const safeArea = useSafeArea();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview
    const [previewFile, setPreviewFile] = useState<{ file: FileObject; url: string; content?: string; data?: ArrayBuffer } | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [mdTab, setMdTab] = useState<'write' | 'preview'>('write');
    const [editorPreviewHtml, setEditorPreviewHtml] = useState('');

    // Selection
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    // Long-press context menu
    const [contextMenu, setContextMenu] = useState<{ show: boolean; file: FileObject | null; x: number; y: number }>({
        show: false, file: null, x: 0, y: 0
    });
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // Modals
    const [shareModal, setShareModal] = useState<{ show: boolean; file: FileObject | null; url: string | null; duration: number }>({
        show: false, file: null, url: null, duration: 3600
    });
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; isBulk?: boolean }>({ show: false });
    const [createFileModal, setCreateFileModal] = useState<{ show: boolean; filename: string; content: string }>({
        show: false, filename: '', content: ''
    });
    const [moveModal, setMoveModal] = useState<{ show: boolean; targetBucket: string; targetPrefix: string; bucketList: BucketObject[] }>({
        show: false, targetBucket: bucketName, targetPrefix: currentPrefix, bucketList: []
    });
    const [renameModal, setRenameModal] = useState<{ show: boolean; file: FileObject | null; newName: string }>({
        show: false, file: null, newName: ''
    });
    const [createFolderModal, setCreateFolderModal] = useState<{ show: boolean; folderName: string }>({
        show: false, folderName: ''
    });
    const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showMetadata, setShowMetadata] = useState(false);
    const [exifData, setExifData] = useState<any>(null);
    const [actionError, setActionError] = useState<{ show: boolean; title: string; message: string; details?: string } | null>(null);

    // Upload
    const folderInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [processingState, setProcessingState] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    // Pull to refresh
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartY = useRef(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Virtual scrolling
    const ROW_HEIGHT = 56;
    const virtualizer = useVirtualizer({
        count: filteredFiles.length,
        getScrollElement: () => listRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
        horizontal: false,
    });

    // Edge swipe for back navigation
    const { handlers: edgeSwipeHandlers } = useEdgeSwipe({
        onSwipeComplete: () => { if (currentPrefix) handleUp(); else if (onBackToBuckets) onBackToBuckets(); },
        enabled: isMobile
    });

    useEffect(() => { setCurrentPrefix(''); setSelectedKeys(new Set()); setSelectionMode(false); setViewError(null); }, [bucketName]);
    useEffect(() => { loadFiles(); }, [currentPrefix, refreshTrigger, bucketName]);
    useEffect(() => { if (notification) { const timer = setTimeout(() => setNotification(null), 3000); return () => clearTimeout(timer); } }, [notification]);

    // Listen for Command Palette Events
    useEffect(() => {
        const toggleViewHandler = () => setViewMode(v => v === ViewMode.LIST ? ViewMode.GRID : ViewMode.LIST);
        const triggerUploadHandler = () => fileInputRef.current?.click();
        const triggerCreateHandler = () => setCreateFileModal(prev => ({ ...prev, show: true }));
        window.addEventListener('s4:toggle-view', toggleViewHandler);
        window.addEventListener('s4:trigger-upload', triggerUploadHandler);
        window.addEventListener('s4:create-file', triggerCreateHandler);
        return () => { window.removeEventListener('s4:toggle-view', toggleViewHandler); window.removeEventListener('s4:trigger-upload', triggerUploadHandler); window.removeEventListener('s4:create-file', triggerCreateHandler); };
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' && !isMobile && !isEditing && !previewFile && !createFileModal.show && !actionError?.show && !moveModal.show) {
                e.preventDefault();
                if (selectedKeys.size === 1) { const selectedKey = Array.from(selectedKeys)[0]; const file = files.find(f => f.key === selectedKey); if (file && !file.isFolder) handlePreview(file); }
            }
            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedKeys.size > 0 && !readOnly && !isEditing && !previewFile && !createFileModal.show && !actionError?.show && !moveModal.show) {
                setDeleteConfirmation({ show: true, isBulk: true });
            }
            if (e.key === 'Escape') {
                if (actionError?.show) setActionError(null);
                else if (previewFile) closePreview();
                else if (createFileModal.show) setCreateFileModal(prev => ({ ...prev, show: false }));
                else if (moveModal.show) setMoveModal(prev => ({ ...prev, show: false }));
                else if (deleteConfirmation.show) setDeleteConfirmation({ show: false });
                else if (selectionMode) { setSelectionMode(false); setSelectedKeys(new Set()); }
                else if (selectedKeys.size > 0) setSelectedKeys(new Set());
            }
            if (previewFile && !isEditing) { if (e.key === 'ArrowRight') navigatePreview(1); if (e.key === 'ArrowLeft') navigatePreview(-1); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedKeys, readOnly, previewFile, isEditing, selectionMode, createFileModal.show, deleteConfirmation.show, actionError, moveModal.show, files, isMobile]);

    const loadFiles = async () => {
        setLoading(true); setViewError(null);
        try { const data = await s3.listFiles(currentPrefix); setFiles(data); setSelectedKeys(new Set()); }
        catch (err: any) { console.error(err); const errorInfo = getAwsErrorMessage(err); setViewError({ title: errorInfo.title, message: errorInfo.message }); }
        finally { setLoading(false); }
    };

    const handleNavigate = (prefix: string) => { setCurrentPrefix(prefix); setSearchInput(''); setSelectedKeys(new Set()); };
    const handleUp = () => {
        if (!currentPrefix) { if (onBackToBuckets) onBackToBuckets(); return; }
        const parts = currentPrefix.split('/').filter(Boolean); parts.pop();
        setCurrentPrefix(parts.length > 0 ? parts.join('/') + '/' : '');
    };

    const filteredFiles = files
        .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            let comparison = 0;
            if (sortBy === 'name') comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            else if (sortBy === 'size') comparison = a.size - b.size;
            else if (sortBy === 'date') comparison = a.lastModified.getTime() - b.lastModified.getTime();
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const toggleSelectionMode = () => { const newMode = !selectionMode; setSelectionMode(newMode); if (!newMode) setSelectedKeys(new Set()); };

    const handleSelectAll = () => { setSelectedKeys(new Set(filteredFiles.map(f => f.key))); };

    const handleContextMenu = (file: FileObject, e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ show: true, file, x: e.clientX, y: e.clientY });
    };

    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(prev => ({ ...prev, show: false }));
        };
        if (contextMenu.show) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu.show]);

    const handleLongPressStart = (file: FileObject, e: React.TouchEvent | React.MouseEvent) => {
        const touch = 'touches' in e ? e.touches[0] : e;
        longPressTimer.current = setTimeout(() => { setContextMenu({ show: true, file, x: touch.clientX, y: touch.clientY }); if ('vibrate' in navigator) navigator.vibrate(50); }, 500);
    };
    const handleLongPressEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

    const handleItemClick = (file: FileObject, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectionMode) {
            const newSelected = new Set(selectedKeys);
            if (newSelected.has(file.key)) newSelected.delete(file.key); else newSelected.add(file.key);
            setSelectedKeys(newSelected);
        } else {
            if (file.isFolder) handleNavigate(file.key); else handlePreview(file);
        }
    };

    // Desktop Drag and Drop
    const handleDragStart = (e: React.DragEvent, file: FileObject) => { if (isMobile) return; e.dataTransfer.setData('application/json', JSON.stringify(file)); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e: React.DragEvent, targetFolder: FileObject) => { if (isMobile) return; e.preventDefault(); if (!targetFolder.isFolder) return; e.dataTransfer.dropEffect = 'move'; };
    const handleDragLeave = (e: React.DragEvent) => { if (isMobile) return; };
    const handleDrop = async (e: React.DragEvent, targetFolder: FileObject) => {
        if (isMobile) return; e.preventDefault(); e.stopPropagation();
        if (!targetFolder.isFolder) return;
        try {
            const data = e.dataTransfer.getData('application/json'); if (!data) return;
            const sourceFile: FileObject = JSON.parse(data);
            if (sourceFile.key === targetFolder.key) return;
            setProcessingState(`正在移动 ${sourceFile.name}...`);
            const newKey = `${targetFolder.key}${sourceFile.name}`;
            if (sourceFile.isFolder) await s3.moveFolder(bucketName, sourceFile.key, bucketName, newKey);
            else await s3.moveObject(bucketName, sourceFile.key, bucketName, newKey);
            setRefreshTrigger(p => p + 1); setNotification(`已将 ${sourceFile.name} 移动到 ${targetFolder.name}`);
        } catch (err) { console.error('移动失败', err); setNotification('移动失败'); }
        finally { setProcessingState(null); }
    };

    // Bulk Actions
    const handleBulkDelete = async () => {
        setDeleteConfirmation({ show: false });
        if (readOnly || selectedKeys.size === 0) return;
        setProcessingState(`正在删除 ${selectedKeys.size} 项...`);
        try {
            for (const key of selectedKeys) { const file = files.find(f => f.key === key); if (file?.isFolder) await s3.deleteFolder(key); else await s3.deleteFile(key); }
            setRefreshTrigger(p => p + 1); setSelectionMode(false); setSelectedKeys(new Set());
        } catch (e: any) { const errInfo = getAwsErrorMessage(e); setActionError({ show: true, title: "删除失败", message: errInfo.message, details: errInfo.details }); }
        finally { setProcessingState(null); }
    };

    const handleBulkDownload = async () => {
        if (selectedKeys.size === 0) return;
        const filesToDownload = files.filter(f => selectedKeys.has(f.key) && !f.isFolder);
        if (filesToDownload.length === 1) { handleDownload(filesToDownload[0]); return; }
        setProcessingState("正在打包文件...");
        try {
            const blob = await s3.downloadFilesAsZip(filesToDownload);
            const url = URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = url; a.download = `files_archive.zip`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url); setSelectionMode(false); setSelectedKeys(new Set());
        } catch (e: any) { setActionError({ show: true, title: "下载失败", message: "无法生成 ZIP 文件。", details: getAwsErrorMessage(e).details }); }
        finally { setProcessingState(null); }
    };

    const handleDownload = async (file: FileObject) => {
        if (file.isFolder) {
            if (!confirm(`准备下载文件夹 "${file.name}"？这将获取所有文件。`)) return;
            setProcessingState("正在打包文件夹...");
            try {
                const blob = await s3.downloadFolderAsZip(file.key);
                const url = URL.createObjectURL(blob); const a = document.createElement('a');
                a.href = url; a.download = `${file.name.replace(/\/$/, '')}.zip`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            } catch (e: any) { setActionError({ show: true, title: "文件夹下载失败", message: getAwsErrorMessage(e).message, details: getAwsErrorMessage(e).details }); }
            finally { setProcessingState(null); }
        } else {
            setProcessingState("正在下载...");
            try {
                const url = await s3.getPresignedUrl(file.key, { download: true }); const a = document.createElement('a');
                a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            } catch (e: any) { setActionError({ show: true, title: "下载失败", message: getAwsErrorMessage(e).message, details: getAwsErrorMessage(e).details }); }
            finally { setProcessingState(null); }
        }
    };

    const handleCopyS3Path = async (file: FileObject) => {
        const path = `s3://${bucketName}/${file.key}`;
        try { await navigator.clipboard.writeText(path); setNotification("S3 URI 已复制到剪贴板"); }
        catch (e) { console.error("复制失败", e); }
    };

    const handleCopyFile = async (file: FileObject) => {
        const newKey = `${currentPrefix}副本_${file.name}${file.isFolder ? '/' : ''}`;
        setProcessingState(`正在复制 ${file.name}...`);
        try {
            if (file.isFolder) {
                await s3.moveFolder(bucketName, file.key, bucketName, newKey);
            } else {
                await s3.copyObject(bucketName, file.key, bucketName, newKey);
            }
            setRefreshTrigger(p => p + 1);
            setNotification(`已复制 ${file.name}`);
        } catch (e) {
            console.error("复制失败", e);
            setNotification("复制失败");
        } finally {
            setProcessingState(null);
        }
    };

    const handleBulkCopy = async () => {
        const selected = filteredFiles.filter(f => selectedKeys.has(f.key));
        if (selected.length === 0) return;
        setProcessingState(`正在复制 ${selected.length} 项...`);
        let success = 0;
        for (const file of selected) {
            try {
                const newKey = `${currentPrefix}副本_${file.name}${file.isFolder ? '/' : ''}`;
                if (file.isFolder) {
                    await s3.moveFolder(bucketName, file.key, bucketName, newKey);
                } else {
                    await s3.copyObject(bucketName, file.key, bucketName, newKey);
                }
                success++;
            } catch (e) {
                console.error("复制失败", file.name, e);
            }
        }
        setRefreshTrigger(p => p + 1);
        setNotification(`已复制 ${success}/${selected.length} 项`);
        setSelectionMode(false);
        setSelectedKeys(new Set());
        setProcessingState(null);
    };

    const openMoveModal = async () => {
        setProcessingState("正在获取存储桶...");
        try {
            const buckets = await s3.listBuckets();
            setMoveModal({ show: true, targetBucket: bucketName, targetPrefix: currentPrefix, bucketList: buckets });
        } catch (e) { setActionError({ show: true, title: "无法加载存储桶", message: "无法列出存储桶以供目标选择。", details: getAwsErrorMessage(e).details }); }
        finally { setProcessingState(null); }
    };

    const handleMoveSelected = async () => {
        const { targetBucket, targetPrefix } = moveModal; if (!targetBucket) return;
        setProcessingState(`正在移动 ${selectedKeys.size} 项...`);
        try {
            for (const key of selectedKeys) { const file = files.find(f => f.key === key); if (!file) continue;
                if (file.isFolder) await s3.moveFolder(bucketName, key, targetBucket, targetPrefix + file.name);
                else await s3.moveObject(bucketName, key, targetBucket, targetPrefix + file.name);
            }
            setMoveModal(prev => ({ ...prev, show: false })); setRefreshTrigger(p => p + 1); setSelectionMode(false); setSelectedKeys(new Set());
            setNotification(`成功移动 ${selectedKeys.size} 项。`);
        } catch (e: any) { setActionError({ show: true, title: "移动失败", message: getAwsErrorMessage(e).message, details: getAwsErrorMessage(e).details }); }
        finally { setProcessingState(null); }
    };

    const handleCreateFile = async () => {
        if (!createFileModal.filename.trim()) return;
        setProcessingState("正在创建文件...");
        try {
            const key = `${currentPrefix}${createFileModal.filename.trim()}`;
            const ext = createFileModal.filename.split('.').pop()?.toLowerCase();
            let mimeType = 'text/plain';
            if (ext === 'json') mimeType = 'application/json';
            else if (ext === 'js') mimeType = 'application/javascript';
            else if (ext === 'ts') mimeType = 'application/typescript';
            else if (ext === 'html') mimeType = 'text/html';
            else if (ext === 'css') mimeType = 'text/css';
            else if (ext === 'md') mimeType = 'text/markdown';
            else if (ext === 'xml') mimeType = 'application/xml';
            else if (ext === 'yml' || ext === 'yaml') mimeType = 'text/yaml';
            await s3.saveFileContent(key, createFileModal.content, mimeType);
            setCreateFileModal({ show: false, filename: '', content: '' }); setRefreshTrigger(p => p + 1);
        } catch (e: any) { setActionError({ show: true, title: "创建文件失败", message: getAwsErrorMessage(e).message, details: getAwsErrorMessage(e).details }); }
        finally { setProcessingState(null); }
    };

    const openRenameModal = (file: FileObject) => { setRenameModal({ show: true, file, newName: file.name }); };

    const handleRename = async () => {
        if (!renameModal.file || !renameModal.newName.trim()) return;
        const file = renameModal.file; const newName = renameModal.newName.trim();
        if (newName === file.name) { setRenameModal({ show: false, file: null, newName: '' }); return; }
        setProcessingState("正在重命名...");
        try {
            const oldKey = file.key; const keyParts = oldKey.split('/'); keyParts[keyParts.length - 1] = newName; const newKey = keyParts.join('/');
            if (file.isFolder) await s3.moveFolder(bucketName, oldKey, bucketName, newKey);
            else await s3.moveObject(bucketName, oldKey, bucketName, newKey);
            setNotification(`已重命名为 "${newName}"`); setRenameModal({ show: false, file: null, newName: '' }); setRefreshTrigger(p => p + 1);
        } catch (e: any) { setActionError({ show: true, title: "重命名失败", message: getAwsErrorMessage(e).message, details: getAwsErrorMessage(e).details }); }
        finally { setProcessingState(null); }
    };

    const handleCreateFolder = async () => {
        if (!createFolderModal.folderName.trim()) return;
        const folderName = createFolderModal.folderName.trim();
        const normalizedName = folderName.endsWith('/') ? folderName : folderName + '/';
        setProcessingState("正在创建文件夹...");
        try {
            const folderKey = `${currentPrefix}${normalizedName}`;
            await s3.saveFileContent(folderKey, '', 'application/x-directory');
            setNotification(`文件夹 "${folderName}" 已创建`); setCreateFolderModal({ show: false, folderName: '' }); setRefreshTrigger(p => p + 1);
        } catch (e: any) { setActionError({ show: true, title: "创建文件夹失败", message: getAwsErrorMessage(e).message, details: getAwsErrorMessage(e).details }); }
        finally { setProcessingState(null); }
    };

    useEffect(() => {
        const updatePreview = async () => {
            if (mdTab === 'preview' && isEditing) {
                try { const html = await marked.parse(editorContent); setEditorPreviewHtml(html); } catch (e) { console.error("解析 Markdown 失败", e); }
            }
        };
        updatePreview();
    }, [mdTab, isEditing, editorContent]);

    const handlePreview = async (file: FileObject) => {
        if (file.isFolder) return;
        setIsPreviewLoading(true); setIsEditing(false); setEditorContent(''); setMdTab('write');
        try {
            const url = await s3.getPresignedUrl(file.key);
            let content = undefined;
            if (file.name.endsWith('.md')) {
                try { const res = await fetch(url); if (res.ok) { const text = await res.text(); const html = await marked.parse(text); setPreviewFile({ file, url, content: html }); } }
                catch (e) { console.error("无法获取 Markdown 内容", e); }
            } else if (['.json', '.js', '.ts', '.tsx'].includes(file.name.slice(-file.name.split('.').length))) {
                try { const res = await fetch(url); if (res.ok) { content = await res.text(); setEditorContent(content); } }
                catch (e) { console.error("无法获取代码内容", e); }
                setPreviewFile({ file, url, content });
            } else if (file.mimeType?.match(/text|json|javascript|xml|sql|css|html/)) {
                try { const res = await fetch(url); if (res.ok) { content = await res.text(); setEditorContent(content); } }
                catch (e) { console.error("无法获取文本内容", e); }
                setPreviewFile({ file, url, content });
            } else if (file.mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
                try { const res = await fetch(url); if (res.ok) { const blob = await res.blob(); const blobUrl = URL.createObjectURL(blob); setPreviewFile({ file, url: blobUrl, content }); } else setPreviewFile({ file, url, content }); }
                catch (e) { setPreviewFile({ file, url, content }); }
            } else if (file.mimeType === 'application/epub+zip' || file.name.endsWith('.epub')) {
                try { const res = await fetch(url); if (res.ok) { const arrayBuffer = await res.arrayBuffer(); setPreviewFile({ file, url, content, data: arrayBuffer }); } else setPreviewFile({ file, url, content }); }
                catch (e) { setPreviewFile({ file, url, content }); }
            } else if (file.name.toLowerCase().endsWith('.csv')) setPreviewFile({ file, url, content: 'csv' });
            else if (file.name.toLowerCase().endsWith('.docx') || file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') setPreviewFile({ file, url, content: 'docx' });
            else if (file.name.toLowerCase().endsWith('.xlsx') || file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') setPreviewFile({ file, url, content: 'xlsx' });
            else if (file.mimeType?.startsWith('image/')) {
                try { const exif = await exifr.parse(url); setExifData(exif || null); } catch (e) { setExifData(null); }
                setPreviewFile({ file, url, content });
            } else {
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (ext && ['bin', 'dat', 'exe', 'dll', 'so', 'dylib', 'class', 'pyc'].includes(ext)) setPreviewFile({ file, url, content: 'binary' });
                else setPreviewFile({ file, url, content });
            }
        } catch (e) { const errInfo = getAwsErrorMessage(e); setActionError({ show: true, title: "预览不可用", message: errInfo.message, details: errInfo.details }); }
        finally { setIsPreviewLoading(false); }
    };

    const navigatePreview = (direction: number) => {
        if (!previewFile) return;
        const currentIndex = filteredFiles.findIndex(f => f.key === previewFile.file.key);
        let nextIndex = currentIndex + direction;
        while (nextIndex >= 0 && nextIndex < filteredFiles.length && filteredFiles[nextIndex].isFolder) nextIndex += direction;
        if (nextIndex >= 0 && nextIndex < filteredFiles.length) handlePreview(filteredFiles[nextIndex]);
    };

    const saveEditedContent = async () => {
        if (!previewFile || !editorContent) return;
        setProcessingState("正在保存更改...");
        try {
            await s3.saveFileContent(previewFile.file.key, editorContent, previewFile.file.mimeType);
            if (previewFile?.file.name.endsWith('.md')) { const html = await marked.parse(editorContent); setPreviewFile(prev => prev ? { ...prev, content: html } : null); }
            else setPreviewFile(prev => prev ? { ...prev, content: editorContent } : null);
            setIsEditing(false); setRefreshTrigger(p => p + 1);
        } catch (e: any) { setActionError({ show: true, title: "保存失败", message: getAwsErrorMessage(e).message, details: getAwsErrorMessage(e).details }); }
        finally { setProcessingState(null); }
    };

    const closePreview = () => { setPreviewFile(null); setIsEditing(false); setMdTab('write'); setShowMetadata(false); setExifData(null); };

    const openShareModal = (file: FileObject) => { setShareModal({ show: true, file, url: null, duration: 3600 }); };

    const generateShareLink = async () => {
        if (!shareModal.file) return;
        try { const url = await s3.getPresignedUrl(shareModal.file.key, { expiresIn: shareModal.duration }); setShareModal(prev => ({ ...prev, url })); }
        catch (e: any) { setActionError({ show: true, title: "分享失败", message: "无法生成公开链接。", details: getAwsErrorMessage(e).details }); }
    };

    const getIcon = (file: FileObject, size: number = 20, className: string = "") => {
        const c = (cls: string) => `${cls} ${className}`;
        if (file.isFolder) return <Folder className={c("text-blue-500 fill-blue-500/10 dark:text-blue-400 dark:fill-blue-400/20")} size={size} />;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const iconMap: Record<string, React.ReactNode> = {
            'png': <ImageIcon className={c("text-purple-500")} size={size} />,
            'jpg': <ImageIcon className={c("text-purple-500")} size={size} />, 'jpeg': <ImageIcon className={c("text-purple-500")} size={size} />,
            'gif': <ImageIcon className={c("text-purple-500")} size={size} />, 'svg': <ImageIcon className={c("text-purple-500")} size={size} />, 'webp': <ImageIcon className={c("text-purple-500")} size={size} />,
            'pdf': <FileText className={c("text-red-500")} size={size} />,
            'mp4': <Video className={c("text-pink-500")} size={size} />, 'mov': <Video className={c("text-pink-500")} size={size} />,
            'mp3': <Music className={c("text-green-500")} size={size} />, 'wav': <Music className={c("text-green-500")} size={size} />,
            'zip': <Archive className={c("text-yellow-500")} size={size} />, 'rar': <Archive className={c("text-yellow-500")} size={size} />, '7z': <Archive className={c("text-yellow-500")} size={size} />,
            'js': <Code className={c("text-yellow-500")} size={size} />, 'ts': <Code className={c("text-yellow-500")} size={size} />, 'tsx': <Code className={c("text-yellow-500")} size={size} />, 'jsx': <Code className={c("text-yellow-500")} size={size} />,
            'json': <FileJson className={c("text-yellow-500")} size={size} />,
            'csv': <FileSpreadsheet className={c("text-green-500")} size={size} />,
            'xlsx': <FileSpreadsheet className={c("text-green-500")} size={size} />,
            'docx': <FileText className={c("text-blue-500")} size={size} />,
            'md': <BookOpen className={c("text-blue-500")} size={size} />,
            'html': <Code className={c("text-orange-500")} size={size} />, 'css': <Code className={c("text-blue-500")} size={size} />,
            'py': <Code className={c("text-blue-500")} size={size} />, 'java': <Code className={c("text-orange-500")} size={size} />, 'go': <Code className={c("text-cyan-500")} size={size} />, 'rs': <Code className={c("text-red-500")} size={size} />, 'rb': <Code className={c("text-red-500")} size={size} />,
            'bin': <Binary className={c("text-gray-500")} size={size} />, 'dat': <Binary className={c("text-gray-500")} size={size} />, 'exe': <Binary className={c("text-gray-500")} size={size} />,
        };
        return iconMap[ext] || <FileText className={c("text-muted-foreground")} size={size} />;
    };

    const isEditable = (file: FileObject) => {
        if (file.isFolder) return false;
        const textExts = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.py', '.java', '.go', '.rs', '.rb', '.php', '.yml', '.yaml', '.xml', '.sql', '.sh', '.bash', '.env', '.config', '.toml', '.ini', '.cfg', '.log'];
        return textExts.includes(file.name.split('.').pop() as string);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        onUpload(file, currentPrefix, () => setRefreshTrigger(p => p + 1));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files; if (!files || files.length === 0) return;
        const taskId = Math.random().toString(36).substring(7);
        const totalFiles = files.length;
        const startTime = Date.now();

        setUploads(prev => ({ ...prev, [taskId]: { id: taskId, fileName: `文件夹 (${totalFiles} 文件)`, progress: 0, status: 'uploading', loaded: 0, total: Array.from(files).reduce((sum, f) => sum + f.size, 0) } }));
        setShowUploads(true);

        try {
            await s3.uploadFolder(files, currentPrefix, () => {});
            setUploads(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'completed', progress: 100 } }));
            setRefreshTrigger(p => p + 1);
            setNotification(`已上传 ${totalFiles} 个文件`);
            setTimeout(() => {
                setUploads(current => {
                    const allDone = (Object.values(current) as UploadTask[]).every(t => t.status !== 'uploading');
                    if (allDone) setShowUploads(false);
                    return current;
                });
            }, 3000);
        } catch (error: any) {
            setUploads(prev => ({ ...prev, [taskId]: { ...prev[taskId], status: 'error', error: error.message } }));
        }
        if (folderInputRef.current) folderInputRef.current.value = '';
    };

    const handleTouchStart = (e: React.TouchEvent) => { if (listRef.current && listRef.current.scrollTop === 0) pullStartY.current = e.touches[0].clientY; };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!listRef.current || listRef.current.scrollTop > 0 || pullStartY.current === 0) return;
        const currentY = e.touches[0].clientY; const diff = currentY - pullStartY.current;
        if (diff > 0) { setIsPulling(true); setPullDistance(Math.min(diff * 0.5, 80)); }
    };
    const handleTouchEnd = async () => {
        if (isPulling && pullDistance > 50) await loadFiles();
        setIsPulling(false); setPullDistance(0); pullStartY.current = 0;
    };

    // --- RENDER HELPERS ---
    const renderPreviewContent = () => {
        if (!previewFile) return null;
        const { file, url, content, data } = previewFile;

        if (isEditing && content) {
            return (
                <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
                    <div className="bg-[#1e1e1e] border-b border-[#3e3e3e] px-4 py-2 flex items-center justify-between shrink-0">
                        <span className="text-xs text-gray-400 font-mono">{file.name}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-green-400 font-semibold">编辑中</span>
                            <button onClick={saveEditedContent} className="p-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors" title="保存"><Save size={14} /></button>
                            <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-md hover:bg-secondary text-gray-400 hover:text-foreground transition-colors" title="取消"><X size={14} /></button>
                        </div>
                    </div>
                    <CodeEditor value={editorContent} language={file.name.split('.').pop() || 'txt'} onChange={setEditorContent} fileName={file.name} />
                </div>
            );
        }

        if (content === 'csv') return <CSVViewer url={url} fileName={file.name} />;
        if (content === 'docx') return <DocxPreview url={url} fileName={file.name} />;
        if (content === 'xlsx') return <XlsxPreview url={url} fileName={file.name} />;
        if (content === 'binary') return <HexViewer url={url} fileName={file.name} />;
        if (file.mimeType === 'application/pdf' || file.name.endsWith('.pdf')) return <PDFViewer url={url} fileName={file.name} />;
        if (file.mimeType === 'application/epub+zip' || file.name.endsWith('.epub')) return <EPUBViewer url={url} fileName={file.name} data={data} />;
        if (file.mimeType?.startsWith('image/')) return <ImagePreview src={url} alt={file.name} onSwipeLeft={() => navigatePreview(-1)} onSwipeRight={() => navigatePreview(1)} onClose={closePreview} />;
        if (file.name.endsWith('.md')) return (
            <div className="w-full h-full flex flex-col bg-background">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/20">
                    <button onClick={() => setMdTab('write')} className={`px-3 py-1 rounded text-xs ${mdTab === 'write' ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:bg-secondary'}`}>编辑</button>
                    <button onClick={() => setMdTab('preview')} className={`px-3 py-1 rounded text-xs ${mdTab === 'preview' ? 'bg-blue-500 text-white' : 'text-muted-foreground hover:bg-secondary'}`}>预览</button>
                </div>
                <div className="flex-1 overflow-auto">
                    {mdTab === 'write' ? (
                        <textarea className="w-full h-full p-4 font-mono text-sm resize-none bg-background border-none focus:outline-none" value={editorContent || ''} readOnly />
                    ) : (
                        <div className="prose prose-sm max-w-none p-4" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content || '') }} />
                    )}
                </div>
            </div>
        );
        if (content) return (
            <div className="w-full h-full flex flex-col bg-[#2d2d2d] overflow-auto">
                <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#3e3e3e] px-4 py-2 flex items-center justify-between z-10">
                    <span className="text-xs text-gray-400 font-mono">{file.name}</span>
                    <span className="text-xs text-gray-500 font-mono uppercase">{file.name.split('.').pop()}</span>
                </div>
                <pre className="!m-0 !bg-transparent p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap break-all">{content}</pre>
            </div>
        );
        return null;
    };

    return (
        <div className="flex flex-col h-full w-full bg-background" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border bg-background/50 backdrop-blur-sm shrink-0" style={{ paddingTop: `${Math.max(8, safeArea.top + 8)}px` }}>
                <div className="flex items-center gap-2 min-w-0">
                    <button onClick={handleUp} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="返回"><ArrowLeft size={16} /></button>
                    <div className="flex items-center gap-1 text-muted-foreground overflow-hidden min-w-0">
                        <Database size={14} className="shrink-0" />
                        <span className="font-semibold text-foreground cursor-pointer hover:underline truncate">{bucketName}</span>
                        {currentPrefix.split('/').filter(Boolean).map((part, idx) => (
                            <React.Fragment key={idx}>
                                <ChevronRight size={12} className="shrink-0" />
                                <span className="cursor-pointer hover:underline truncate" onClick={() => setCurrentPrefix(currentPrefix.split('/').filter(Boolean).slice(0, idx + 1).join('/') + '/')}>{part}</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setViewMode(v => v === ViewMode.LIST ? ViewMode.GRID : ViewMode.LIST)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title={viewMode === ViewMode.LIST ? '网格视图' : '列表视图'}>{viewMode === ViewMode.LIST ? <Grid size={14} /> : <List size={14} />}</button>
                    <div className="h-4 w-px bg-border mx-1 hidden sm:block"></div>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"><UploadCloud size={12} /><span className="hidden sm:inline">上传</span></button>
                </div>
            </div>

            {/* Search + Action Bar */}
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 border-b border-border bg-background shrink-0">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-muted-foreground w-4 h-4" />
                    <input type="text" placeholder="搜索文件..." className="w-full bg-secondary/50 border border-border/50 focus:border-border rounded-md pl-10 pr-3 py-2 text-sm outline-none transition-all" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                </div>
                <button onClick={toggleSelectionMode} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="选择模式"><CheckSquare size={16} /></button>
                <button onClick={() => setCreateFolderModal(prev => ({ ...prev, show: true }))} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="新建文件夹"><FolderPlus size={16} /></button>
                <button onClick={() => setCreateFileModal(prev => ({ ...prev, show: true }))} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="新建文件"><FilePlus size={16} /></button>
                <button onClick={loadFiles} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="刷新"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
            </div>

            {/* Sort Bar */}
            <div className="flex items-center gap-1 px-3 md:px-4 py-1.5 border-b border-border bg-background/50 shrink-0">
                <span className="text-xs text-muted-foreground mr-1">排序</span>
                <button onClick={() => { if (sortBy === 'name') { setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); } else { setSortBy('name'); setSortDirection('asc'); } }} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${sortBy === 'name' ? 'bg-blue-500/10 text-blue-500' : 'text-muted-foreground hover:bg-secondary'}`}>
                    名称 {sortBy === 'name' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                </button>
                <button onClick={() => { if (sortBy === 'size') { setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); } else { setSortBy('size'); setSortDirection('asc'); } }} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${sortBy === 'size' ? 'bg-blue-500/10 text-blue-500' : 'text-muted-foreground hover:bg-secondary'}`}>
                    大小 {sortBy === 'size' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                </button>
                <button onClick={() => { if (sortBy === 'date') { setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); } else { setSortBy('date'); setSortDirection('asc'); } }} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${sortBy === 'date' ? 'bg-blue-500/10 text-blue-500' : 'text-muted-foreground hover:bg-secondary'}`}>
                    日期 {sortBy === 'date' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                </button>
            </div>

            {/* Bulk Action Bar */}
            {selectionMode && (
                <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 shrink-0">
                    <span className="text-sm text-blue-500 font-medium">{selectedKeys.size > 0 ? `${selectedKeys.size} 项已选择` : '选择模式'}</span>
                    <div className="flex items-center gap-2">
                        {selectedKeys.size === 0 && <button onClick={handleSelectAll} className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors flex items-center gap-1"><Check size={12} /> 全选</button>}
                        {selectedKeys.size > 0 && <button onClick={handleBulkDownload} className="px-3 py-1.5 rounded-md bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"><Download size={12} /> 下载</button>}
                        {selectedKeys.size > 0 && <button onClick={handleBulkCopy} className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors flex items-center gap-1"><Copy size={12} /> 复制</button>}
                        {selectedKeys.size > 0 && <button onClick={openMoveModal} className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors flex items-center gap-1"><Move size={12} /> 移动</button>}
                        {selectedKeys.size > 0 && <button onClick={() => setDeleteConfirmation({ show: true, isBulk: true })} className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1"><Trash2 size={12} /> 删除</button>}
                        <button onClick={() => { setSelectionMode(false); setSelectedKeys(new Set()); }} className="px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">取消</button>
                    </div>
                </div>
            )}

            {/* Pull Refresh Spinner */}
            {isPulling && pullDistance > 50 && (
                <div className="absolute top-16 left-0 right-0 flex justify-center z-10"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
            )}

            {/* File List */}
            <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-background transition-transform duration-200 ease-out" style={{ transform: isPulling ? `translateY(${pullDistance}px)` : 'none' }}>
                {loading && files.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mb-2 opacity-50" /><span className="text-sm">正在加载文件...</span></div>
                )}
                {viewError && (
                    <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20 mx-3 mt-3">
                        <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-destructive" /><span className="text-sm text-destructive font-bold">{viewError.title}</span></div>
                        <p className="text-xs text-destructive/80 pl-6 mb-2">{viewError.message}</p>
                        <button onClick={loadFiles} className="w-full text-xs bg-background/50 hover:bg-background px-3 py-2 rounded text-destructive transition-colors border border-destructive/20">重试</button>
                    </div>
                )}
                {!loading && !viewError && filteredFiles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Folder size={32} className="opacity-50 mb-2" /><p className="text-sm">此文件夹为空</p></div>
                )}
                {!loading && !viewError && (
                    viewMode === ViewMode.LIST ? (
                        <div className="relative pb-4">
                            <div style={{ height: `${virtualizer.getTotalSize()}px` }} className="relative">
                                {virtualizer.getVirtualItems().map(virtualRow => {
                                    const file = filteredFiles[virtualRow.index];
                                    if (!file) return null;
                                    return (
                                        <div
                                            key={file.key}
                                            data-index={virtualRow.index}
                                            ref={virtualizer.measureElement}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }}
                                            draggable={true}
                                            onDragStart={(e) => handleDragStart(e, file)}
                                            onDragOver={(e) => handleDragOver(e, file)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, file)}
                                            onClick={(e) => handleItemClick(file, e)}
                                            onContextMenu={(e) => handleContextMenu(file, e)}
                                            onTouchStart={(e) => { if (!selectionMode) handleLongPressStart(file, e); }}
                                            onTouchEnd={handleLongPressEnd}
                                            onTouchCancel={handleLongPressEnd}
                                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm
                                                ${selectedKeys.has(file.key) ? 'bg-blue-500/10 text-blue-500' : 'text-foreground hover:bg-secondary/50'}
                                            `}
                                        >
                                            <div className="flex items-center justify-center shrink-0">{getIcon(file, 20)}</div>
                                            <div className="flex-1 min-w-0">
                                                <span className="truncate">{file.name}</span>
                                                {!file.isFolder && file.mimeType && <span className="text-[10px] text-muted-foreground ml-1">{file.mimeType}</span>}
                                            </div>
                                            {!file.isFolder && <span className="text-xs text-muted-foreground shrink-0">{formatBytes(file.size)}</span>}
                                            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">{new Date(file.lastModified).toLocaleDateString()}</span>
                                            <button className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-foreground hover:bg-secondary" title="更多操作"><MoreVertical size={14} /></button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 pb-4">
                            {filteredFiles.map(file => (
                                <div
                                    key={file.key}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, file)}
                                    onDragOver={(e) => handleDragOver(e, file)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, file)}
                                    onClick={(e) => handleItemClick(file, e)}
                                    onContextMenu={(e) => handleContextMenu(file, e)}
                                    onTouchStart={(e) => { if (!selectionMode) handleLongPressStart(file, e); }}
                                    onTouchEnd={handleLongPressEnd}
                                    onTouchCancel={handleLongPressEnd}
                                    className={`aspect-[4/3.2] rounded-xl border p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
                                        ${selectedKeys.has(file.key) ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]' : 'bg-card/50 border-border hover:border-foreground/20 hover:shadow-sm'}
                                    `}
                                >
                                    <div className="flex items-center justify-center">{getIcon(file, 32)}</div>
                                    <span className="text-xs text-foreground text-center truncate w-full">{file.name}</span>
                                    {!file.isFolder && <span className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</span>}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Processing State Overlay */}
            {processingState && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[300]"><div className="bg-card border border-border rounded-xl p-6 shadow-2xl flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /><span className="text-sm text-foreground">{processingState}</span></div></div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg shadow-xl text-sm font-medium z-[300] animate-in slide-in-from-bottom-4 fade-in">{notification}</div>
            )}

            {/* Context Menu */}
            {contextMenu.show && contextMenu.file && (
                <div className="fixed bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-[250] min-w-[160px]" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseLeave={() => setContextMenu(prev => ({ ...prev, show: false }))}>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); if (contextMenu.file?.isFolder) handleNavigate(contextMenu.file.key); else handlePreview(contextMenu.file); }}><Eye size={14} /> 打开</button>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); handleDownload(contextMenu.file!); }}><Download size={14} /> 下载</button>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); handleCopyS3Path(contextMenu.file!); }}><Copy size={14} /> 复制路径</button>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); handleCopyFile(contextMenu.file!); }}><Copy size={14} /> 复制文件</button>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); openShareModal(contextMenu.file!); }}><Share2 size={14} /> 分享</button>
                    {isEditable(contextMenu.file!) && (
                        <button className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); handlePreview(contextMenu.file!); setIsEditing(true); }}><Edit2 size={14} /> 编辑</button>
                    )}
                    <div className="h-px bg-border"></div>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); openRenameModal(contextMenu.file!); }}><PenTool size={14} /> 重命名</button>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); setMoveModal(prev => ({ ...prev, show: true })); setSelectedKeys(new Set([contextMenu.file!.key])); }}><Move size={14} /> 移动</button>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-destructive/10 text-destructive flex items-center gap-2" onClick={() => { setContextMenu(prev => ({ ...prev, show: false })); setDeleteConfirmation({ show: true }); }}><Trash2 size={14} /> 删除</button>
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]" onClick={closePreview}>
                    <div className="w-full h-full md:max-w-6xl md:max-h-[90vh] md:rounded-xl overflow-hidden bg-background relative flex" onClick={e => e.stopPropagation()}>
                        <div className="flex-1 relative overflow-hidden">
                            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                                {previewFile.file.name.endsWith('.md') && <button onClick={() => setMdTab(mdTab === 'write' ? 'preview' : 'write')} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" title="切换预览"><BookOpen size={16} /></button>}
                                {!previewFile.file.isFolder && <button onClick={() => handleDownload(previewFile.file)} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" title="下载"><Download size={16} /></button>}
                                <button onClick={closePreview} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" title="关闭"><X size={16} /></button>
                            </div>
                            {isPreviewLoading ? (
                                <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                            ) : renderPreviewContent()}
                        </div>
                        {/* EXIF Data Side Panel */}
                        {exifData && (
                            <div className="w-80 border-l border-border bg-background flex flex-col overflow-y-auto custom-scrollbar shrink-0">
                                <div className="p-4 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm text-foreground">EXIF 信息</h3>
                                        <button onClick={() => setShowMetadata(!showMetadata)} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Info size={14} /></button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{previewFile.file.name}</p>
                                </div>
                                <div className="p-4 space-y-4">
                                    {exifData.Make && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">相机品牌</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.Make}</p>
                                        </div>
                                    )}
                                    {exifData.Model && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">相机型号</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.Model}</p>
                                        </div>
                                    )}
                                    {exifData.DateTimeOriginal && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">拍摄时间</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.DateTimeOriginal}</p>
                                        </div>
                                    )}
                                    {exifData.ApertureValue && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">光圈</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.ApertureValue}</p>
                                        </div>
                                    )}
                                    {exifData.FocalLength && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">焦距</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.FocalLength}mm</p>
                                        </div>
                                    )}
                                    {exifData.ISOSpeedRatings && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ISO</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.ISOSpeedRatings}</p>
                                        </div>
                                    )}
                                    {exifData.ShutterSpeedValue && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">快门速度</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.ShutterSpeedValue}s</p>
                                        </div>
                                    )}
                                    {exifData.PixelXDimension && exifData.PixelYDimension && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">分辨率</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.PixelXDimension} × {exifData.PixelYDimension}</p>
                                        </div>
                                    )}
                                    {exifData.GPS && exifData.GPS.GPSLatitude && exifData.GPS.GPSLongitude && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">GPS 位置</span>
                                            <p className="text-xs text-foreground mt-0.5 break-all">{JSON.stringify(exifData.GPS)}</p>
                                        </div>
                                    )}
                                    {exifData.Orientation && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">方向</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.Orientation}</p>
                                        </div>
                                    )}
                                    {exifData.WhiteBalance && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">白平衡</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.WhiteBalance}</p>
                                        </div>
                                    )}
                                    {exifData.Flash && (
                                        <div>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">闪光灯</span>
                                            <p className="text-sm text-foreground mt-0.5">{exifData.Flash ? '开启' : '关闭'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Folder Modal */}
            {createFolderModal.show && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setCreateFolderModal(prev => ({ ...prev, show: false }))}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">新建文件夹</h3>
                        <input type="text" autoFocus placeholder="文件夹名称" className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" value={createFolderModal.folderName} onChange={(e) => setCreateFolderModal(prev => ({ ...prev, folderName: e.target.value }))} />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setCreateFolderModal(prev => ({ ...prev, show: false }))} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors">取消</button>
                            <button onClick={handleCreateFolder} disabled={!createFolderModal.folderName} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-70">创建</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create File Modal */}
            {createFileModal.show && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setCreateFileModal(prev => ({ ...prev, show: false }))}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">新建文件</h3>
                        <div className="space-y-3">
                            <input type="text" autoFocus placeholder="文件名（例如 hello.txt）" className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" value={createFileModal.filename} onChange={(e) => setCreateFileModal(prev => ({ ...prev, filename: e.target.value }))} />
                            <textarea placeholder="文件内容（可选）" rows={6} className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm font-mono focus:border-foreground outline-none transition-colors resize-none" value={createFileModal.content} onChange={(e) => setCreateFileModal(prev => ({ ...prev, content: e.target.value }))} />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setCreateFileModal(prev => ({ ...prev, show: false }))} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors">取消</button>
                            <button onClick={handleCreateFile} disabled={!createFileModal.filename} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-70">创建</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renameModal.show && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setRenameModal(prev => ({ ...prev, show: false }))}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">重命名</h3>
                        <input type="text" autoFocus className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" value={renameModal.newName} onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleRename()} />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setRenameModal(prev => ({ ...prev, show: false }))} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors">取消</button>
                            <button onClick={handleRename} disabled={!renameModal.newName} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-70">重命名</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {shareModal.show && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShareModal(prev => ({ ...prev, show: false }))}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">分享链接</h3><button onClick={() => setShareModal(prev => ({ ...prev, show: false }))} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
                        <p className="text-sm text-muted-foreground mb-3">为 <span className="font-medium text-foreground">{shareModal.file?.name}</span> 生成预签名 URL。</p>
                        <div className="mb-3"><label className="text-xs font-medium text-muted-foreground mb-1 block">链接有效期</label><select className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" value={shareModal.duration} onChange={(e) => setShareModal(prev => ({ ...prev, duration: parseInt(e.target.value) }))}><option value={3600}>1 小时</option><option value={86400}>1 天</option><option value={604800}>7 天</option></select></div>
                        <button onClick={generateShareLink} className="w-full bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors mb-3">生成链接</button>
                        {shareModal.url && (
                            <div className="space-y-2">
                                <input type="text" readOnly className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-xs font-mono text-muted-foreground" value={shareModal.url} />
                                <button onClick={() => navigator.clipboard.writeText(shareModal.url!)} className="w-full bg-secondary text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">复制链接</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.show && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDeleteConfirmation({ show: false })}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-destructive mb-3">确认删除</h3>
                        <p className="text-sm text-muted-foreground mb-4">{deleteConfirmation.isBulk ? `确定要删除 ${selectedKeys.size} 项吗？此操作无法撤销。` : '确定要删除此项吗？此操作无法撤销。'}</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteConfirmation({ show: false })} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors">取消</button>
                            <button onClick={handleBulkDelete} className="px-4 py-2 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">删除</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Error Modal */}
            {actionError?.show && (
                <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setActionError(null)}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-3"><AlertCircle className="w-6 h-6 text-destructive shrink-0" /><h3 className="text-lg font-semibold text-destructive">{actionError.title}</h3></div>
                        <p className="text-sm text-muted-foreground mb-4">{actionError.message}</p>
                        {actionError.details && <pre className="text-xs text-muted-foreground bg-secondary p-2 rounded overflow-auto max-h-32 mb-4">{actionError.details}</pre>}
                        <button onClick={() => setActionError(null)} className="w-full px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:bg-white/90 transition-colors">关闭</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Explorer;
