"use client";

import { useEffect, useRef } from "react";

export default function GradientBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!container || !cursor || !trail) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let trailX = 0;
    let trailY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      // Smooth follow for cursor
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;

      // Slower follow for trail
      trailX += (mouseX - trailX) * 0.08;
      trailY += (mouseY - trailY) * 0.08;

      cursor.style.transform = `translate(${cursorX - 125}px, ${cursorY - 125}px)`;
      trail.style.transform = `translate(${trailX - 175}px, ${trailY - 175}px)`;

      requestAnimationFrame(animate);
    };

    container.addEventListener("mousemove", handleMouseMove);
    const animationId = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-[#0c0a1a]"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1330] via-[#0c0a1a] to-[#110e24]" />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Purple orb */}
        <div
          ref={trailRef}
          className="absolute w-[350px] h-[350px] rounded-full opacity-30 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, rgba(139,105,20,0.6) 0%, rgba(192,38,211,0.3) 50%, transparent 70%)",
          }}
        />

        {/* Gold orb (follows cursor closely) */}
        <div
          ref={cursorRef}
          className="absolute w-[250px] h-[250px] rounded-full opacity-40 blur-[80px]"
          style={{
            background:
              "radial-gradient(circle, rgba(201,169,110,0.8) 0%, rgba(139,105,20,0.4) 40%, transparent 70%)",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
