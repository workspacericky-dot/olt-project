import React, { useEffect, useRef } from 'react';

const LyricsDisplay = ({ lyrics, currentIndex, onLyricClick }) => {
    const containerRef = useRef(null);
    const activeLineRef = useRef(null);

    // Auto-scroll to keep active line centered
    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentIndex]);

    if (!lyrics || lyrics.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-600 text-xl">No lyrics loaded</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-6 py-20 scrollbar-hide"
            style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
        >
            <div className="max-w-3xl mx-auto space-y-6 text-center">
                {lyrics.map((lyric, index) => {
                    const isActive = index === currentIndex;
                    const isPast = index < currentIndex;
                    const isUpcoming = index > currentIndex;

                    return (
                        <div
                            key={index}
                            ref={isActive ? activeLineRef : null}
                            onClick={() => onLyricClick?.(lyric.time)}
                            className={`transition-all duration-500 cursor-pointer select-none ${isActive
                                ? 'scale-105'
                                : 'scale-100 hover:scale-102'
                                }`}
                        >
                            <p
                                className={`leading-relaxed transition-all duration-500 font-serif italic tracking-wide ${isActive
                                    ? 'text-white text-3xl md:text-5xl font-bold drop-shadow-[0_0_30px_rgba(244,63,94,0.6)] scale-110'
                                    : isPast
                                        ? 'text-pink-200/40 text-xl md:text-2xl font-medium blur-[1px]'
                                        : 'text-pink-200/20 text-xl md:text-2xl font-medium hover:text-pink-200/60'
                                    }`}
                                style={{
                                    textShadow: isActive ? '0 0 40px rgba(244, 63, 94, 0.6)' : 'none',
                                }}
                            >
                                {lyric.text}
                            </p>
                        </div>
                    );
                })}

                {/* Bottom spacer for scroll */}
                <div className="h-40" />
            </div>
        </div>
    );
};

export default LyricsDisplay;
