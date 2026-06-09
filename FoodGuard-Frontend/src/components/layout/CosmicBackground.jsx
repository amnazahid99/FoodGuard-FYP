import { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export function CosmicBackground() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Particle system
    const particles = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    let animationId;
    const animate = () => {
      // Background fill — subtle trail
      if (isDark) {
        ctx.fillStyle = 'rgba(13, 27, 42, 0.12)';
      } else {
        ctx.fillStyle = 'rgba(240, 247, 244, 0.12)';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

        if (isDark) {
          ctx.fillStyle = `rgba(26, 188, 156, ${particle.opacity})`;
          ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        } else {
          ctx.fillStyle = `rgba(14, 158, 130, ${particle.opacity * 0.5})`;
          ctx.shadowColor = 'rgba(14, 158, 130, 0.3)';
        }
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw connections
      particles.forEach((pA, iA) => {
        particles.slice(iA + 1).forEach((pB) => {
          const dx = pA.x - pB.x;
          const dy = pA.y - pB.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            const alpha = 0.2 * (1 - dist / 100);
            ctx.strokeStyle = isDark
              ? `rgba(26, 188, 156, ${alpha})`
              : `rgba(14, 158, 130, ${alpha * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
