import { useEffect, useRef, useState } from "react";

export function CursorAura() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setEnabled(true);

    const onMove = (event: MouseEvent) => {
      target.current.x = event.clientX;
      target.current.y = event.clientY;

      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${event.clientX - 4}px, ${event.clientY - 4}px, 0)`;
      }
    };

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12;
      current.current.y += (target.current.y - current.current.y) * 0.12;

      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${current.current.x - 80}px, ${current.current.y - 80}px, 0)`;
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={outerRef} className="cursor-aura" aria-hidden="true" />
      <div ref={innerRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
