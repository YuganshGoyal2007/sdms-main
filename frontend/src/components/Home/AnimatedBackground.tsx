import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size immediately and ensure it's correct
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Wait a frame to ensure canvas dimensions are set
    requestAnimationFrame(() => {
      // Particle colors matching the theme
      const colors = [
        'rgba(139, 92, 246, 0.4)',  // purple
        'rgba(59, 130, 246, 0.4)',  // blue
        'rgba(236, 72, 153, 0.4)',  // pink
        'rgba(6, 182, 212, 0.4)',   // cyan
        'rgba(168, 85, 247, 0.4)',  // violet
      ];

      // Create particles
      const particles: Particle[] = [];
      const particleCount = 50;

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }

      // Floating circles
      const circles = [
        { x: 0.15, y: 0.2, radius: 150, color: 'rgba(139, 92, 246, 0.05)', vx: 0.1, vy: 0.15 },
        { x: 0.7, y: 0.3, radius: 200, color: 'rgba(236, 72, 153, 0.04)', vx: -0.12, vy: 0.1 },
        { x: 0.3, y: 0.7, radius: 180, color: 'rgba(6, 182, 212, 0.04)', vx: 0.08, vy: -0.1 },
        { x: 0.85, y: 0.65, radius: 120, color: 'rgba(168, 85, 247, 0.05)', vx: -0.1, vy: -0.12 },
      ];

      let time = 0;

      // Animation loop
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        time += 0.01;

        // Draw floating circles with blur
        circles.forEach((circle, index) => {
          const centerX = canvas.width * circle.x + Math.sin(time + index) * 30;
          const centerY = canvas.height * circle.y + Math.cos(time + index) * 30;

          const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, circle.radius
          );
          gradient.addColorStop(0, circle.color);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, circle.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw and update particles
        particles.forEach((particle) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Bounce off edges
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

          // Draw particle
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw connections between nearby particles
        particles.forEach((p1, i) => {
          particles.slice(i + 1).forEach((p2) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
              ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 * (1 - distance / 150)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          });
        });

        requestAnimationFrame(animate);
      };

      animate();
    });

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}