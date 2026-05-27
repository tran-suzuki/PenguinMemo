import { useState, useEffect, useRef } from 'react';

/**
 * Gemini サイドバーの開閉・リサイズ・BrowserView との bounds 同期を管理するフック。
 * Electron 側の BrowserView は DOM 上のサイドバー領域に重ねて表示されるため、
 * サイドバーの矩形に合わせて resizeGemini を呼び続ける必要がある。
 *
 * @param isGeminiOpen サイドバー表示中かどうか
 * @param modalsOpen いずれかのモーダルが開いているか(開いている間は BrowserView を隠す)
 */
export function useGeminiSidebar(isGeminiOpen: boolean, modalsOpen: boolean) {
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle Gemini Sidebar Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = document.body.clientWidth - e.clientX;
      // Limit width between 300px and 800px (or 50% of screen)
      const clampedWidth = Math.max(300, Math.min(newWidth, window.innerWidth * 0.6));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

  // Lifecycle: Open/Close Gemini
  useEffect(() => {
    if (isGeminiOpen && window.electronAPI) {
      window.electronAPI.openGemini();
    }
    return () => {
      if (window.electronAPI) {
        window.electronAPI.closeGemini();
      }
    };
  }, [isGeminiOpen]);

  // Sync Layout: Resize Gemini
  useEffect(() => {
    if (!isGeminiOpen || !window.electronAPI) return;

    const updateGeminiBounds = () => {
      // If any modal is open, hide Gemini by setting size to 0
      if (modalsOpen) {
        window.electronAPI!.resizeGemini({ x: 0, y: 0, width: 0, height: 0 });
        return;
      }

      if (sidebarRef.current) {
        const rect = sidebarRef.current.getBoundingClientRect();
        window.electronAPI!.resizeGemini({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    };

    // Initial resize
    setTimeout(updateGeminiBounds, 50);

    // Update on resize
    const resizeObserver = new ResizeObserver(() => {
      updateGeminiBounds();
    });

    if (sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    window.addEventListener('resize', updateGeminiBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateGeminiBounds);
    };
  }, [isGeminiOpen, sidebarWidth, modalsOpen]);

  return {
    sidebarRef,
    sidebarWidth,
    startResize: () => setIsResizing(true),
  };
}
