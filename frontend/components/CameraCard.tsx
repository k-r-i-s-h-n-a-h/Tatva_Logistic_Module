"use client";

import React, { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CameraCardProps {
  title: string;
  previewUrl: string | null;
  detections: any[];
  dims: { l?: string; w?: string; h?: string };
  status: { type: "idle" | "analyzing" | "success"; bottleDetected?: boolean };
  color: "blue" | "green";
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export function CameraCard({
  title,
  previewUrl,
  detections,
  dims,
  status,
  color,
  onUpload,
  onClear,
}: CameraCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const themeColor = color === "blue" ? "#3b82f6" : "#22c55e";
  const bgColor = color === "blue" ? "bg-blue-50/50" : "bg-green-50/50";

  useEffect(() => {
    if (!previewUrl || !canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;

    const renderDetections = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Match canvas resolution to image natural size
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const scaleX = canvas.width / 1000;
      const scaleY = canvas.height / 1000;

      detections.forEach((det) => {
        ctx.beginPath();
        ctx.lineWidth = 6;
        ctx.strokeStyle = themeColor;
        ctx.fillStyle = color === "blue" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)";

        // 1. Draw Polygon (The SAM Boundary)
        if (det.approx_pts && det.approx_pts.length > 0) {
          det.approx_pts.forEach(([px, py]: [number, number], i: number) => {
            const x = px * scaleX;
            const y = py * scaleY;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } 
        // 2. Fallback to Bounding Box
        else if (det.box_2d) {
          const [ymin, xmin, ymax, xmax] = det.box_2d;
          ctx.strokeRect(xmin * scaleX, ymin * scaleY, (xmax - xmin) * scaleX, (ymax - ymin) * scaleY);
        }

        // 3. Draw Label Badge
        if (det.box_2d) {
          const [ymin, xmin] = det.box_2d;
          ctx.fillStyle = themeColor;
          ctx.font = "bold 32px sans-serif";
          const label = det.label?.toUpperCase() || "CARGO";
          const txtWidth = ctx.measureText(label).width;
          
          ctx.fillRect(xmin * scaleX, (ymin * scaleY) - 50, txtWidth + 20, 50);
          ctx.fillStyle = "white";
          ctx.fillText(label, (xmin * scaleX) + 10, (ymin * scaleY) - 12);
        }
      });
    };

    if (img.complete) renderDetections();
    else img.onload = renderDetections;
  }, [previewUrl, detections, themeColor, color]);

  return (
    <Card className={`border-2 ${color === "blue" ? "border-blue-200" : "border-green-200"} ${bgColor} p-4 overflow-hidden`}>
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</Label>

        <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden border border-slate-300">
          {!previewUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" id={`upload-${color}`} />
              <label htmlFor={`upload-${color}`} className="cursor-pointer bg-black text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
                Upload View
              </label>
            </div>
          ) : (
            <>
              <img ref={imgRef} src={previewUrl} className="hidden" alt="hidden-source" />
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
              <button onClick={onClear} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 text-xs backdrop-blur-sm">✕</button>
              
              {/* Floating Dimension Badge */}
              {dims && (dims.l || dims.w) && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-[9px] font-black tracking-tighter shadow-xl border border-white/20">
                  {dims.l && `L: ${dims.l}cm `} {dims.h && `H: ${dims.h}cm `} {dims.w && `W: ${dims.w}cm`}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          {status.type === "analyzing" ? (
            <Badge className="animate-pulse bg-slate-400 text-white text-[9px]">Analyzing View...</Badge>
          ) : status.type === "success" ? (
            <Badge className={`${color === "blue" ? "bg-blue-600" : "bg-green-600"} text-white text-[9px]`}>✓ AI Calibrated</Badge>
          ) : (
            <div className="h-4" />
          )}
        </div>
      </div>
    </Card>
  );
}

// Custom Label component for consistency
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}>{children}</label>;
}