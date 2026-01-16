import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

const BGMusic = ({ isPlaying }) => {
    const audioRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.3; // Subtle background volume

        if (isPlaying && hasInteracted) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Autoplay prevented:", error);
                    // UI could show a "Click to play music" if needed, 
                    // but our specific interaction listener handles the retry.
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, hasInteracted]);

    // Listener for first interaction to unlock audio context
    useEffect(() => {
        const handleInteraction = () => {
            setHasInteracted(true);
        };

        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    if (!isPlaying) return null;

    return (
        <div className="fixed bottom-4 left-4 z-40 animate-fade-in-up">
            <audio
                ref={audioRef}
                src="/bgm.mp3"
                loop
                muted={isMuted}
            />
            <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center space-x-2 p-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg border border-pink-200/20 ${isMuted
                        ? 'bg-slate-800/50 text-slate-400 hover:bg-slate-800/70'
                        : 'bg-pink-500/80 text-white hover:bg-pink-600/80 animate-pulse-slow'
                    }`}
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                {!isMuted && <span className="text-xs font-medium pr-1 hidden sm:inline">Our Song</span>}
            </button>
        </div>
    );
};

export default BGMusic;
