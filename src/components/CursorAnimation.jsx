import React, { useEffect, useRef } from 'react';

const CursorAnimation = () => {
    const requestRef = useRef();
    const heartsRef = useRef([]);

    useEffect(() => {
        // Create container
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '9999';
        container.style.overflow = 'hidden';
        document.body.appendChild(container);

        const createHeart = (x, y) => {
            const heart = document.createElement('div');
            heart.innerHTML = '❤️'; // Or use SVG for better look
            heart.style.position = 'absolute';
            heart.style.left = x + 'px';
            heart.style.top = y + 'px';
            heart.style.fontSize = Math.random() * 10 + 10 + 'px';
            heart.style.opacity = '1';
            heart.style.transform = 'translate(-50%, -50%) scale(0.5)';
            heart.style.transition = 'transform 1s ease-out, opacity 1s ease-out';

            // Random movement
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 30 + 20;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            container.appendChild(heart);

            // Animate
            requestAnimationFrame(() => {
                heart.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.2)`;
                heart.style.opacity = '0';
            });

            // Cleanup
            setTimeout(() => {
                if (container.contains(heart)) {
                    container.removeChild(heart);
                }
            }, 1000);
        };

        const handleMouseMove = (e) => {
            if (Math.random() > 0.8) { // Don't create on every frame
                createHeart(e.clientX, e.clientY);
            }
        };

        const handleClick = (e) => {
            // Burst of hearts on click
            for (let i = 0; i < 8; i++) {
                createHeart(e.clientX, e.clientY);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('touchstart', (e) => handleClick(e.touches[0]));

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            document.body.removeChild(container);
        };
    }, []);

    return null;
};

export default CursorAnimation;
