import { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

interface ScrollItemProps {
    className?: string;
    children: React.ReactNode;
    scrollId: string;
}

interface ScrollViewProps {
    children: React.ReactNode;
    intoScrollId: number | string;
    duration?: number;
    className?: string;
    forceUpdate?: boolean;
    scrollMarginTop?: number;
    onScroll?: (scrollTop: number) => void;
}

const Container = styled.div`
    height: 100%;
    overflow: auto;
    position: relative;
    -webkit-overflow-scrolling: touch;
`;

const easeInOut = (
    elapsed: number,
    initialValue: number,
    amountOfChange: number,
    duration: number,
) => {
    elapsed /= duration / 2;
    if (elapsed < 1) {
        return (amountOfChange / 2) * elapsed * elapsed + initialValue;
    }
    return (-amountOfChange / 2) * (--elapsed * (elapsed - 2) - 1) + initialValue;
};

export const ScrollItem = ({ className, children, scrollId }: ScrollItemProps) => {
    const divRef = useRef<HTMLDivElement>(null);
    return (
        <div ref={divRef} className={className} scroll-id={scrollId}>
            {children}
        </div>
    );
};

const ScrollView = ({
    children,
    intoScrollId,
    duration = 500,
    className,
    forceUpdate = false,
    scrollMarginTop = 0,
    onScroll,
}: ScrollViewProps) => {
    const scrollViewRef = useRef<HTMLDivElement>(null);
    const inTouchRef = useRef(false);

    const handleScroll = () => {
        onScroll && onScroll(scrollViewRef.current!.scrollTop);
    };

    const handleTouchMove = useCallback(() => {
        if (!inTouchRef.current) {
            inTouchRef.current = true;
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        inTouchRef.current = false;
    }, []);

    useEffect(() => {
        // 当前存在手势滚动行为 取消自动滚动
        if (inTouchRef.current) return;
        if (!intoScrollId) return;
        const intoEl = document.querySelector(`[scroll-id='${intoScrollId}']`);
        if (!intoEl) return;
        const { top } = intoEl.getBoundingClientRect();
        const { top: scrollViewOffsetTop } = scrollViewRef.current!.getBoundingClientRect();
        const totalScroll = top - scrollViewOffsetTop - scrollMarginTop;
        if (totalScroll === 0) return;
        let animationFrameId = -1;
        const { scrollTop, clientHeight, scrollHeight } = scrollViewRef.current!;
        const startTime = Date.now();
        const validHeight = scrollHeight - clientHeight;

        const onFrame = () => {
            if (inTouchRef.current) {
                cancelAnimationFrame(animationFrameId);
                return;
            }
            const elapsed = Date.now() - startTime;
            const currentScrollTop = easeInOut(elapsed, scrollTop, totalScroll, duration);
            scrollViewRef.current!.scrollTop = currentScrollTop;
            if (
                elapsed < duration &&
                Math.abs(currentScrollTop - totalScroll - scrollTop) > 1 &&
                !(Math.abs(currentScrollTop - scrollTop) > validHeight)
            ) {
                animationFrameId = requestAnimationFrame(onFrame);
            } else {
                scrollViewRef.current!.scrollTop = totalScroll + scrollTop;
                cancelAnimationFrame(animationFrameId);
            }
        };
        onFrame();
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [duration, intoScrollId, forceUpdate, scrollMarginTop]);

    return (
        <Container
            className={className}
            ref={scrollViewRef}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onScroll={handleScroll}
        >
            {children}
        </Container>
    );
};

export default ScrollView;
