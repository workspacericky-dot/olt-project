import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '../utils/lrcParser';

const PlayerControls = ({
    audioRef,
    isPlaying,
    onPlayPause,
    onReplay,
    currentTime,
    duration,
    onSeek,
    songTitle
}) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const progressRef = useRef(null);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleProgressClick = (e) => {
        if (!progressRef.current || duration === 0) return;

        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;

        onSeek(Math.max(0, Math.min(newTime, duration)));
    };

    const handleProgressDrag = (e) => {
        if (!isDragging || !progressRef.current || duration === 0) return;

        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
        const newTime = percentage * duration;

        onSeek(newTime);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        handleProgressClick(e);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleProgressDrag);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleProgressDrag);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 z-50">
            {/* Progress Bar */}
            <div
                ref={progressRef}
                onClick={handleProgressClick}
                onMouseDown={handleMouseDown}
                className="h-1.5 bg-zinc-800 cursor-pointer group relative"
            >
                {/* Progress Fill */}
                <div
                    className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />

                {/* Seek Handle */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${progress}% - 8px)` }}
                />
            </div>

            {/* Controls Container */}
            <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left: Song Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{songTitle || 'Unknown Track'}</p>
                        <p className="text-zinc-500 text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                    </div>

                    {/* Center: Main Controls */}
                    <div className="flex items-center space-x-4">
                        {/* Replay */}
                        <button
                            onClick={onReplay}
                            className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
                            title="Replay"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={onPlayPause}
                            className="w-14 h-14 bg-white hover:bg-zinc-100 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 text-zinc-900" fill="currentColor" />
                            ) : (
                                <Play className="w-6 h-6 text-zinc-900 ml-1" fill="currentColor" />
                            )}
                        </button>

                        {/* Volume */}
                        <button
                            onClick={toggleMute}
                            className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Right: Spacer for balance */}
                    <div className="flex-1" />
                </div>
            </div>
        </div>
    );
};

export default PlayerControls;
