import React, { useEffect, useRef } from 'react';

interface YoutubePlayerProps {
  videoId: string;
  startTime?: number;
  endTime?: number;
  onReady?: () => void;
  onClipEnd?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const YoutubePlayer: React.FC<YoutubePlayerProps> = ({
  videoId,
  startTime,
  endTime,
  onReady,
  onClipEnd,
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearWatchInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startWatchInterval = () => {
    clearWatchInterval();
    if (typeof endTime !== 'number' || !playerRef.current?.getCurrentTime) return;

    intervalRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      const currentTime = playerRef.current.getCurrentTime();
      if (currentTime >= endTime) {
        playerRef.current.pauseVideo();
        clearWatchInterval();
        if (onClipEnd) onClipEnd();
      }
    }, 250);
  };

  useEffect(() => {
    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            if (onReady) onReady();
          },
        },
      });
    }

    return () => {
      clearWatchInterval();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (playerRef.current && typeof startTime === 'number' && playerRef.current.seekTo) {
      playerRef.current.seekTo(startTime, true);
      playerRef.current.playVideo();
      startWatchInterval();
    }
  }, [startTime, endTime]);

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <div ref={containerRef} />
    </div>
  );
};
