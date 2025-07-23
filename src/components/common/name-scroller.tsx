"use client";
import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface Donation {
  name: string;
  amount: number;
}

interface Props {
  donations: Donation[];
  canvasStyle?: React.CSSProperties;
}

const NameScroller: React.FC<Props> = ({ donations, canvasStyle = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizeDonations = (donations: Donation[]): [string, string][] => {
    if (donations.length === 0) return [];

    const amounts = donations.map((d) => d.amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);

    return donations.map((d) => {
      const level =
        max === min ? 0 : Math.floor(((d.amount - min) / (max - min)) * 20);
      return [String(level), d.name];
    });
  };

  useGSAP(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const normalized = normalizeDonations(donations);
    const shuffled = [...normalized].sort(() => Math.random() - 0.5);

    shuffled.slice(0, 60).forEach(([level, name]) => {
      const span = document.createElement("span");
      const maxFontSize = 80;
      const minFontSize = 18;
      const fontSize =
        (maxFontSize - minFontSize) * (parseInt(level) / 20) + minFontSize;
      const speed = Math.random() * (5 - 2) + 2;
      const y = Math.random() * container.clientHeight;

      span.textContent = name;
      span.style.position = "absolute";
      span.style.top = `${y}px`;
      span.style.whiteSpace = "nowrap";
      span.style.fontSize = `${fontSize}px`;

      span.style.color = "black";
      span.style.fontFamily = "roboto, sans-serif";
      span.style.opacity = "0";

      container.appendChild(span);

      // Wait for next tick to get accurate width
      requestAnimationFrame(() => {
        const width = span.clientWidth;
        span.style.left = `-${width + 100}px`;
        span.style.opacity = "1";

        gsap.to(span, {
          x: window.innerWidth + width + 200,
          duration: 40 / speed,
          ease: "linear",
          repeat: -1,
          onRepeat: () => {
            const newY = Math.random() * container.clientHeight;
            span.style.top = `${newY}px`;
          },
          modifiers: {
            x: gsap.utils.unitize(
              (x) => parseFloat(x) % (window.innerWidth + width + 200)
            ),
          },
        });
      });
    });
  }, [donations]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
        ...canvasStyle,
      }}
    />
  );
};

export default NameScroller;
