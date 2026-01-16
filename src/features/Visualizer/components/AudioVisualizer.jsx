import React, { useEffect, useRef, useState } from 'react';

const AudioVisualizer = ({ analyser, isPlaying }) => {
    const [bassLevel, setBassLevel] = useState(0);
    const animationRef = useRef(null);
    const dataArrayRef = useRef(null);
    const canvasRef = useRef(null);
    const heartsRef = useRef([]);

    // Initialize hearts
    useEffect(() => {
        const heartCount = 20;
        heartsRef.current = Array(heartCount).fill().map(() => ({
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + Math.random() * 500,
            size: Math.random() * 20 + 10,
            speed: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.1,
            color: Math.random() > 0.5 ? '#ec4899' : '#f43f5e' // Pink or Rose
        }));
    }, []);

    useEffect(() => {
        if (!analyser) return;

        // Create data array for frequency data
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx = canvas ? canvas.getContext('2d') : null;

        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        const drawHeart = (ctx, x, y, size, color, opacity) => {
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = color;
            ctx.translate(x, y);

            // Draw heart shape
            ctx.beginPath();
            const topCurveHeight = size * 0.3;
            ctx.moveTo(0, topCurveHeight);
            ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
            ctx.bezierCurveTo(-size / 2, size / 2, 0, size * 0.8, 0, size);
            ctx.bezierCurveTo(0, size * 0.8, size / 2, size / 2, size / 2, topCurveHeight);
            ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
            ctx.fill();

            ctx.restore();
        };

        const updateVisualizer = () => {
            if (!analyser || !dataArrayRef.current) return;

            analyser.getByteFrequencyData(dataArrayRef.current);

            // Extract bass (first ~10%)
            const bassRange = Math.floor(bufferLength * 0.1);
            let bassSum = 0;
            for (let i = 0; i < bassRange; i++) {
                bassSum += dataArrayRef.current[i];
            }
            const averageBass = bassSum / bassRange / 255;

            // Apply smoothing
            setBassLevel(prev => {
                const smoothed = prev * 0.7 + averageBass * 0.3;
                return Math.min(smoothed * 1.5, 1);
            });

            // Draw Hearts Particle System
            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear only particles

                // Animate hearts
                const bassBoost = averageBass * 1.5; // Scaling factor from music

                heartsRef.current.forEach(heart => {
                    // Update position
                    heart.y -= heart.speed + (bassBoost * 2); // Move faster with bass
                    heart.wobble += heart.wobbleSpeed;
                    const wobbleX = Math.sin(heart.wobble) * 2;

                    // Wrap around
                    if (heart.y < -50) {
                        heart.y = canvas.height + 50;
                        heart.x = Math.random() * canvas.width;
                    }

                    // Draw
                    const currentSize = heart.size * (1 + bassBoost * 0.5); // Pulse size
                    drawHeart(
                        ctx,
                        heart.x + wobbleX,
                        heart.y,
                        currentSize,
                        heart.color,
                        heart.opacity + bassBoost * 0.3 // Pulse opacity
                    );
                });
            }

            animationRef.current = requestAnimationFrame(updateVisualizer);
        };

        updateVisualizer();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser]); // Removed isPlaying dependency to allow idle animation

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Dynamic styles based on bass level
    // Changed colors to romantic pinks/reds
    const glowOpacity = 0.2 + bassLevel * 0.5;
    const glowScale = 1 + bassLevel * 0.4;
    const pulseBlur = 80 + bassLevel * 40;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden bg-zinc-900">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a0a18] via-[#1a050f] to-[#0f0205]" />

            {/* Ambient Love Glow - Center */}
            <div
                className="absolute top-1/2 left-1/2 w-3/4 h-3/4 rounded-full transition-all duration-100 ease-out"
                style={{
                    background: `radial-gradient(circle, rgba(244, 63, 94, ${glowOpacity * 0.6}) 0%, transparent 60%)`,
                    transform: `translate(-50%, -50%) scale(${1 + bassLevel * 0.3})`,
                    filter: `blur(${pulseBlur}px)`,
                }}
            />

            {/* Floating Orbs (now warmer colors) */}
            <div
                className="absolute top-0 left-0 w-full h-full opacity-30 mix-blend-screen"
                style={{
                    background: `
                        radial-gradient(circle at 20% 30%, rgba(236, 72, 153, ${0.4 + bassLevel * 0.3}) 0%, transparent 40%),
                        radial-gradient(circle at 80% 70%, rgba(225, 29, 72, ${0.4 + bassLevel * 0.3}) 0%, transparent 40%)
                    `,
                    transform: `scale(${1 + bassLevel * 0.1})`,
                    transition: 'transform 0.1s ease-out'
                }}
            />

            {/* Heart Particles Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,rgba(0,0,0,0.6)_100%)]" />
        </div>
    );
};

export default AudioVisualizer;
