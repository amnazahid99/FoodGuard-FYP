import { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export function ParticleCanvas() {
  const canvasRef = useRef(null);
  const { isDark, c } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

const init = () => {
       particles = [];
       for (let i = 0; i < 68; i++) {
         particles.push({
           x: Math.random() * canvas.width,
           y: Math.random() * canvas.height,
           r: 1 + Math.random() * 2.5,
           vx: (Math.random() - 0.5) * 0.25,
           vy: (Math.random() - 0.5) * 0.25,
           opacity: isDark ? (0.3 + Math.random() * 0.5) : (0.02 + Math.random() * 0.03),
           isTeal: Math.random() > 0.38,
         });
       }
     };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const alpha = isDark ? 0.13 : 0.015;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(196,151,56,${alpha * (1 - dist / 150)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw & update particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (p.isTeal) {
          ctx.fillStyle = isDark 
            ? `rgba(26,188,156,${p.opacity})` 
            : `rgba(196,151,56,${p.opacity})`;
        } else {
          ctx.fillStyle = isDark 
            ? `rgba(255,255,255,${p.opacity * 0.35})` 
            : `rgba(0,0,0,${p.opacity})`;
        }
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5 || p.x > canvas.width + 5) p.vx *= -1;
        if (p.y < -5 || p.y > canvas.height + 5) p.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      resize();
      init();
    };

    resize();
    init();
    draw();

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none', zIndex: 1 }}
    />
  );
}
