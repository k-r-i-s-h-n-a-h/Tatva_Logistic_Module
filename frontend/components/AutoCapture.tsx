"use client";

import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (Ideally, move these to a lib/types.ts file later)
// ─────────────────────────────────────────────────────────────────────────────
export interface Detection {
  label: string;
  box_2d: number[];
  approx_pts?: number[][];
  dimensions?: { l: number; w: number; h: number };
  requires_manual_entry?: boolean;
}

export type DetectionStatus =
  | { type: "idle" }
  | { type: "analyzing" }
  | { type: "success"; bottleDetected: boolean; warning?: string }
  | { type: "manual_required"; message: string; reason: string };

// ─────────────────────────────────────────────────────────────────────────────
// SVG POLYGON OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function DetectionOverlay({ det, color }: { det: Detection; color: "blue" | "green" }) {
  const stroke = color === "blue" ? "#3b82f6" : "#22c55e";
  const fill   = color === "blue" ? "rgba(59,130,246,0.15)" : "rgba(34,197,94,0.15)";
  const pts    = det.approx_pts;

  if (pts && pts.length >= 3) {
    const pointsStr = pts.map(p => `${p[0]},${p[1]}`).join(" ");
    const topPt     = pts.reduce((a, b) => (b[1] < a[1] ? b : a), pts[0]);
    
    const labelX    = topPt[0];
    const labelY    = Math.max(topPt[1] - 40, 60); 
    const labelW    = det.label.length * 28 + 30;  

    return (
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <polygon points={pointsStr} fill={fill} stroke={stroke} strokeWidth="6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="10" fill={stroke} vectorEffect="non-scaling-stroke" />
        ))}
        <rect x={labelX} y={labelY - 50} width={labelW} height={60} fill={stroke} rx="8" />
        <text x={labelX + 15} y={labelY - 12} fill="white" fontSize="45" fontWeight="900" fontFamily="sans-serif">
          {det.label}
        </text>
      </svg>
    );
  }

  if (!det.box_2d || det.box_2d.every(v => v === 0)) return null;
  const [ymin, xmin, ymax, xmax] = det.box_2d;
  
  return (
    <div
      className="absolute rounded"
      style={{
        border: `3px solid ${stroke}`,
        backgroundColor: fill,
        top:    `${(ymin / 1000) * 100}%`,
        left:   `${(xmin / 1000) * 100}%`,
        height: `${((ymax - ymin) / 1000) * 100}%`,
        width:  `${((xmax - xmin) / 1000) * 100}%`,
      }}
    >
      <span 
        className="absolute -top-7 left-[-3px] text-white px-2 py-1 font-black whitespace-nowrap rounded-t-md tracking-wider"
        style={{ backgroundColor: stroke, fontSize: "11px" }}
      >
        {det.label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DetectionStatus }) {
  if (status.type === "idle") return null;
  if (status.type === "analyzing") return (
    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" /> Analyzing…
    </div>
  );
  if (status.type === "success") return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-600">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        {status.bottleDetected ? "Detected — dimensions auto-filled" : "Cargo detected"}
      </div>
      {status.warning && (
        <div className="flex items-start gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block mt-0.5 shrink-0" /> {status.warning}
        </div>
      )}
    </div>
  );
  if (status.type === "manual_required") {
    const isInfo   = status.reason === "no_bottle";
    const bgClass  = isInfo ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-600";
    const dotClass = isInfo ? "bg-amber-400" : "bg-red-400";
    return (
      <div className={`mt-2 flex items-start gap-2 p-2 rounded border text-[10px] font-bold uppercase tracking-wider ${bgClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} mt-0.5 shrink-0`} />
        <span>{status.message}</span>
      </div>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA CARD
// ─────────────────────────────────────────────────────────────────────────────
function CameraCard({
  title, previewUrl, detections, status, color, onUpload, onClear,
}: {
  title: string; previewUrl: string | null; detections: Detection[]; status: DetectionStatus; color: "blue" | "green";
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void;
}) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50">
      <label className="block text-xs font-bold uppercase text-gray-700 mb-2 tracking-wide">{title}</label>
      {!previewUrl ? (
        <label className="cursor-pointer block mt-2">
          <span className="bg-black text-white px-4 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-colors inline-block">
            📷 Upload
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      ) : (
        <div className="relative inline-block rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <img src={previewUrl} className="max-h-48 rounded-lg block" alt={title} />
          {detections.map((det, i) => <DetectionOverlay key={i} det={det} color={color} />)}
          <button onClick={onClear} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 text-xs z-10">✕</button>
        </div>
      )}
      <StatusBadge status={status} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN AUTOCAPTURE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface AutoCaptureProps {
  onDimensionsUpdate: (dims: { l?: string; w?: string; h?: string }) => void;
}

export default function AutoCapture({ onDimensionsUpdate }: AutoCaptureProps) {
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [sidePreviewUrl,  setSidePreviewUrl]  = useState<string | null>(null);
  const [frontDetections, setFrontDetections] = useState<Detection[]>([]);
  const [sideDetections,  setSideDetections]  = useState<Detection[]>([]);
  const [frontStatus,     setFrontStatus]     = useState<DetectionStatus>({ type: "idle" });
  const [sideStatus,      setSideStatus]      = useState<DetectionStatus>({ type: "idle" });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, viewType: "front" | "side") => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = ''; // Reset input to allow re-uploading the same file

    const url = URL.createObjectURL(file);
    const setPreview  = viewType === "front" ? setFrontPreviewUrl  : setSidePreviewUrl;
    const setStatus   = viewType === "front" ? setFrontStatus      : setSideStatus;
    const setDetects  = viewType === "front" ? setFrontDetections  : setSideDetections;

    setPreview(url);
    setStatus({ type: "analyzing" });
    setDetects([]);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("view_type", viewType);

    try {
      const response = await fetch("http://127.0.0.1:8001/cargo/analyze", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error(`Server ${response.status}`);
      const data = await response.json();

      if (data.status === "manual_required") {
        setStatus({ type: "manual_required", message: data.message, reason: data.reason ?? "unknown" });
        return;
      }

      if (data.status === "success" && data.detected_items?.length > 0) {
        const item = data.detected_items[0];
        setDetects(data.detected_items);
        setStatus({
          type: "success",
          bottleDetected: data.bottle_detected ?? true,
          warning: data.warning ?? undefined,
        });

        // Pass the extracted dimensions UP to the parent component
        if (viewType === "front") {
          onDimensionsUpdate({ 
            l: item.dimensions?.l ? String(item.dimensions.l) : undefined, 
            h: item.dimensions?.h ? String(item.dimensions.h) : undefined 
          });
        } else {
          onDimensionsUpdate({ 
            w: item.dimensions?.w ? String(item.dimensions.w) : undefined 
          });
        }
      } else {
        setStatus({ type: "manual_required", message: data.message ?? "Detection returned no items.", reason: "unknown" });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Analysis error:", err);
        setStatus({ type: "manual_required", message: "Connection error — please enter dimensions manually.", reason: "connection_error" });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CameraCard
        title="1. Front View (L & H)"
        previewUrl={frontPreviewUrl}
        detections={frontDetections}
        status={frontStatus}
        color="blue"
        onUpload={e => handleImageUpload(e, "front")}
        onClear={() => { setFrontPreviewUrl(null); setFrontDetections([]); setFrontStatus({ type: "idle" }); }}
      />
      <CameraCard
        title="2. Side View (Width)"
        previewUrl={sidePreviewUrl}
        detections={sideDetections}
        status={sideStatus}
        color="green"
        onUpload={e => handleImageUpload(e, "side")}
        onClear={() => { setSidePreviewUrl(null); setSideDetections([]); setSideStatus({ type: "idle" }); }}
      />
    </div>
  );
}