import React, { useState, useRef, useCallback } from 'react';
import { FileObject } from '../types';

interface LongPressDragConfig {
    onDragStart?: (file: FileObject) => void;
    onDragEnd?: (file: FileObject, targetFolder: FileObject | null) => void;
    longPressDelay?: number;
}

interface DragState {
    isDragging: boolean;
    draggedFile: FileObject | null;
    dragPosition: { x: number; y: number };
    dropTarget: FileObject | null;
}

export const useLongPressDrag = (config: LongPressDragConfig = {}) => {
    const { onDragStart, onDragEnd, longPressDelay = 500 } = config;

    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        draggedFile: null,
        dragPosition: { x: 0, y: 0 },
        dropTarget: null
    });

    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const hasMoved = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent, file: FileObject) => {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        hasMoved.current = false;

        // 开始长按计时
        longPressTimer.current = setTimeout(() => {
            // 触发拖拽开始
            setDragState({
                isDragging: true,
                draggedFile: file,
                dragPosition: { x: touch.clientX, y: touch.clientY },
                dropTarget: null
            });

            onDragStart?.(file);

            // 触觉反馈
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 30, 50]); // 模式：震动-暂停-震动
            }
        }, longPressDelay);
    }, [onDragStart, longPressDelay]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!touchStartPos.current) return;

        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

        // 如果在计时器完成前移动过多，则取消长按
        if (!dragState.isDragging && (deltaX > 10 || deltaY > 10)) {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            hasMoved.current = true;
        }

        // 如果正在拖拽，更新位置
        if (dragState.isDragging) {
            e.preventDefault();
            setDragState(prev => ({
                ...prev,
                dragPosition: { x: touch.clientX, y: touch.clientY }
            }));
        }
    }, [dragState.isDragging]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        // 清除计时器
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        // 如果正在拖拽，处理放下
        if (dragState.isDragging && dragState.draggedFile) {
            onDragEnd?.(dragState.draggedFile, dragState.dropTarget);

            // 放下时的触觉反馈
            if ('vibrate' in navigator) {
                navigator.vibrate(30);
            }
        }

        // 重置状态
        setDragState({
            isDragging: false,
            draggedFile: null,
            dragPosition: { x: 0, y: 0 },
            dropTarget: null
        });
        touchStartPos.current = null;
        hasMoved.current = false;
    }, [dragState, onDragEnd]);

    const setDropTarget = useCallback((folder: FileObject | null) => {
        setDragState(prev => ({ ...prev, dropTarget: folder }));
    }, []);

    return {
        dragState,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        setDropTarget
    };
};

export default useLongPressDrag;
