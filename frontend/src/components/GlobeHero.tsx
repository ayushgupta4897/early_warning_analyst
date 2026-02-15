"use client";
import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

interface GlobeHeroProps {
  selectedCountry?: { lat: number; lng: number } | null;
}

export default function GlobeHero({ selectedCountry }: GlobeHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);
  const thetaRef = useRef(0.3);
  const targetPhiRef = useRef<number | null>(null);
  const targetThetaRef = useRef<number | null>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const widthRef = useRef(0);

  const focusOnCountry = useCallback((lat: number, lng: number) => {
    // Convert lat/lng to phi/theta for COBE
    // phi = longitude rotation, theta = latitude tilt
    targetPhiRef.current = (-lng * Math.PI) / 180 + Math.PI / 2;
    targetThetaRef.current = (lat * Math.PI) / 180;
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      focusOnCountry(selectedCountry.lat, selectedCountry.lng);
    }
  }, [selectedCountry, focusOnCountry]);

  useEffect(() => {
    let width = 0;
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
        widthRef.current = width;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;

    const markers = selectedCountry
      ? [{ location: [selectedCountry.lat, selectedCountry.lng] as [number, number], size: 0.08 }]
      : [];

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: 2.5,
      baseColor: [0.15, 0.1, 0.25],
      markerColor: [0.49, 0.23, 0.93],
      glowColor: [0.2, 0.1, 0.35],
      markers,
      scale: 1.05,
      offset: [0, 0],
      onRender: (state) => {
        // Smooth rotation to target (when country selected)
        if (targetPhiRef.current !== null) {
          const dphi = targetPhiRef.current - phiRef.current;
          phiRef.current += dphi * 0.08;
          if (Math.abs(dphi) < 0.001) {
            targetPhiRef.current = null;
          }
        } else if (pointerInteracting.current === null) {
          // Auto-rotate when not interacting and no target
          phiRef.current += 0.003;
        }

        if (targetThetaRef.current !== null) {
          const dtheta = targetThetaRef.current - thetaRef.current;
          thetaRef.current += dtheta * 0.08;
          if (Math.abs(dtheta) < 0.001) {
            targetThetaRef.current = null;
          }
        }

        state.phi = phiRef.current + pointerInteractionMovement.current;
        state.theta = thetaRef.current;
        state.width = widthRef.current * 2;
        state.height = widthRef.current * 2;
      },
    });

    globeRef.current = globe;

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
    // Re-create globe when markers change
  }, [selectedCountry]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-square">
      {/* Glow backdrop */}
      <div className="absolute inset-0 rounded-full bg-accent/5 blur-3xl scale-110" />
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ contain: "layout paint size" }}
        onPointerDown={(e) => {
          pointerInteracting.current =
            e.clientX - pointerInteractionMovement.current;
          canvasRef.current!.style.cursor = "grabbing";
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          canvasRef.current!.style.cursor = "grab";
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta / 200;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta / 200;
          }
        }}
      />
    </div>
  );
}
