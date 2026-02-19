import { useEffect, useRef, useState } from "react";
import { getUiConfig } from "@/lib/ui-config";

export function CursorAura() {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<Array<HTMLDivElement | null>>([]);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const hoverState = useRef(false);
  const trail = useRef(
    Array.from({ length: 6 }).map(() => ({
      x: 0,
      y: 0,
      scale: 1,
    }))
  );

  useEffect(() => {
    const cfg = getUiConfig();

    if (!cfg.cursorAura) return;
    if (cfg.motion === "reduced") return;
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setEnabled(true);

    const trailLength = trail.current.length;

    const updateHoverState = (event: Event) => {
      const targetEl = event.target as HTMLElement | null;
      if (!targetEl) return;
      hoverState.current = Boolean(targetEl.closest("a, button, [role='button'], input, textarea, select"));
    };

    const onMouseDown = () => {
      if (!ringRef.current) return;
      ringRef.current.classList.remove("cursor-ring-burst");
      // Force reflow so class re-add retriggers animation.
      void ringRef.current.offsetWidth;
      ringRef.current.classList.add("cursor-ring-burst");
    };

    const onMove = (event: MouseEvent) => {
      target.current.x = event.clientX;
      target.current.y = event.clientY;

      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${event.clientX - 4}px, ${event.clientY - 4}px, 0) scale(${
          hoverState.current ? 1.25 : 1
        })`;
      }
    };

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.17;
      current.current.y += (target.current.y - current.current.y) * 0.17;

      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${current.current.x - 80}px, ${current.current.y - 80}px, 0) scale(${
          hoverState.current ? 1.2 : 1
        })`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${current.current.x - 16}px, ${current.current.y - 16}px, 0) scale(${
          hoverState.current ? 1.15 : 1
        })`;
      }

      trail.current[0].x += (current.current.x - trail.current[0].x) * 0.38;
      trail.current[0].y += (current.current.y - trail.current[0].y) * 0.38;

      for (let i = 1; i < trailLength; i += 1) {
        trail.current[i].x += (trail.current[i - 1].x - trail.current[i].x) * 0.34;
        trail.current[i].y += (trail.current[i - 1].y - trail.current[i].y) * 0.34;
      }

      for (let i = 0; i < trailLength; i += 1) {
        const node = trailRefs.current[i];
        if (!node) continue;

        const scale = (trailLength - i) / trailLength;
        node.style.transform = `translate3d(${trail.current[i].x - 4}px, ${trail.current[i].y - 4}px, 0) scale(${scale})`;
        node.style.opacity = `${Math.max(0.08, scale * 0.42)}`;
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", updateHoverState, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", updateHoverState);
      window.removeEventListener("mousedown", onMouseDown);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={outerRef} className="cursor-aura" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      {trail.current.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          className="cursor-trail"
          aria-hidden="true"
        />
      ))}
      <div ref={innerRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
