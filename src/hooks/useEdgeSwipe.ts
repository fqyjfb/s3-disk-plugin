import { useRef, useState } from 'react';

export interface EdgeSwipeConfig {
    onSwipeComplete: () => void;
    threshold?: number; // 触发操作的距离（px）
    edgeZone?: number; // 边缘检测区域宽度（px）
    enabled?: boolean;
}

export const useEdgeSwipe = (config: EdgeSwipeConfig) => {
    const {
        onSwipeComplete,
        threshold = 100,
        edgeZone = 50,
        enabled = true
    } = config;

    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
    const [swipeProgress, setSwipeProgress] = useState(0);
    const [isEdgeSwipe, setIsEdgeSwipe] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!enabled) return;

        const touch = e.touches[0];

        // 检查触摸是否从边缘区域（左边缘）开始
        if (touch.clientX <= edgeZone) {
            setIsEdgeSwipe(true);
            touchStart.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!enabled || !isEdgeSwipe || !touchStart.current) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = Math.abs(touch.clientY - touchStart.current.y);

        // 仅跟踪从左边缘开始的水平滑动
        if (deltaX > 0 && deltaY < 50) {
            const progress = Math.min(deltaX / threshold, 1);
            setSwipeProgress(progress);

            // 如果正在主动滑动，则阻止默认行为
            if (deltaX > 10) {
                e.preventDefault();
            }
        } else if (deltaY > 50) {
            // 如果垂直移动过多，则重置
            setIsEdgeSwipe(false);
            setSwipeProgress(0);
            touchStart.current = null;
        }
    };

    const handleTouchEnd = () => {
        if (!enabled || !isEdgeSwipe) return;

        if (swipeProgress >= 1) {
            // 触发操作
            onSwipeComplete();

            // 如果可用，提供触觉反馈
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        }

        // 重置
        setIsEdgeSwipe(false);
        setSwipeProgress(0);
        touchStart.current = null;
    };

    return {
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        swipeProgress,
        isEdgeSwipe
    };
};
