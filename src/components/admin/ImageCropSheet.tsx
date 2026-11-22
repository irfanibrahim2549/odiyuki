"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Crop, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropSheetProps {
  file: File | null;
  queuePosition?: { current: number; total: number };
  onCancelAll: () => void;
  onSkipCurrent?: () => void;
  onConfirmCrop: (croppedFile: File) => Promise<void> | void;
}

export function ImageCropSheet({
  file,
  queuePosition,
  onCancelAll,
  onSkipCurrent,
  onConfirmCrop,
}: ImageCropSheetProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origOffsetX: number;
    origOffsetY: number;
  } | null>(null);

  const [frameSize, setFrameSize] = useState<number>(280);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null
  );
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const objectUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    if (!file) return;
    const el = frameRef.current;
    if (!el) return;

    const updateSize = () => {
      if (el.clientWidth > 0) setFrameSize(el.clientWidth);
    };
    updateSize();

    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(updateSize);
    obs.observe(el);
    return () => obs.disconnect();
  }, [file]);

  const baseScale = useMemo(() => {
    if (!naturalSize || naturalSize.w === 0 || naturalSize.h === 0) return 1;
    return Math.max(frameSize / naturalSize.w, frameSize / naturalSize.h);
  }, [naturalSize, frameSize]);

  const displaySize = useMemo(() => {
    if (!naturalSize) return { w: frameSize, h: frameSize };
    const totalScale = baseScale * zoom;
    return {
      w: naturalSize.w * totalScale,
      h: naturalSize.h * totalScale,
    };
  }, [naturalSize, baseScale, zoom, frameSize]);

  const clampOffset = (
    nextX: number,
    nextY: number,
    dispW: number,
    dispH: number,
    size: number
  ) => {
    const maxX = Math.max(0, (dispW - size) / 2);
    const maxY = Math.max(0, (dispH - size) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nextX)),
      y: Math.min(maxY, Math.max(-maxY, nextY)),
    };
  };

  const clampedOffset = useMemo(
    () =>
      clampOffset(offset.x, offset.y, displaySize.w, displaySize.h, frameSize),
    [offset.x, offset.y, displaySize.w, displaySize.h, frameSize]
  );

  if (!file || !objectUrl) return null;

  const handleZoomChange = (nextZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(1, Number(nextZoom.toFixed(2))));
    setZoom(clampedZoom);
    if (naturalSize) {
      const nextScale = baseScale * clampedZoom;
      const nextW = naturalSize.w * nextScale;
      const nextH = naturalSize.h * nextScale;
      setOffset((prev) => clampOffset(prev.x, prev.y, nextW, nextH, frameSize));
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize || isApplying) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origOffsetX: clampedOffset.x,
      origOffsetY: clampedOffset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setOffset(
      clampOffset(
        drag.origOffsetX + dx,
        drag.origOffsetY + dy,
        displaySize.w,
        displaySize.h,
        frameSize
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current?.pointerId === e.pointerId) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      dragStartRef.current = null;
    }
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !naturalSize || isApplying) return;
    setErrorMsg(null);
    setIsApplying(true);

    try {
      const totalScale = baseScale * zoom;
      const imgLeft = frameSize / 2 + clampedOffset.x - displaySize.w / 2;
      const imgTop = frameSize / 2 + clampedOffset.y - displaySize.h / 2;

      const srcX = Math.max(0, -imgLeft / totalScale);
      const srcY = Math.max(0, -imgTop / totalScale);
      const srcSize = Math.min(
        naturalSize.w - srcX,
        naturalSize.h - srcY,
        frameSize / totalScale
      );

      const outputSize = Math.min(
        900,
        Math.max(320, Math.round(srcSize))
      );

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak didukung browser.");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputSize, outputSize);
      ctx.drawImage(
        imgRef.current,
        srcX,
        srcY,
        srcSize,
        srcSize,
        0,
        0,
        outputSize,
        outputSize
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", 0.92)
      );

      if (!blob) {
        throw new Error("Gagal memotong gambar.");
      }

      const baseName = file.name.replace(/\.[^.]+$/, "") || "product";
      const croppedFile = new File([blob], `${baseName}-1x1.webp`, {
        type: "image/webp",
      });

      await onConfirmCrop(croppedFile);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memproses crop foto."
      );
    } finally {
      setIsApplying(false);
    }
  };

  const imgLeft = frameSize / 2 + clampedOffset.x - displaySize.w / 2;
  const imgTop = frameSize / 2 + clampedOffset.y - displaySize.h / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#121726]/70">
      <div className="w-full max-w-[480px] bg-white rounded-t-[24px] sm:rounded-[24px] px-[16px] pt-[12px] pb-[20px] shadow-[0px_-8px_32px_rgba(0,0,0,0.2)] flex flex-col gap-[14px]">
        <div className="w-[40px] h-[4px] bg-[#e5e7eb] rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <div className="w-[34px] h-[34px] rounded-full bg-[#fce7f3] text-[#ec4899] flex items-center justify-center shrink-0">
              <Crop className="w-[17px] h-[17px]" />
            </div>
            <div>
              <h2 className="font-bold text-[16px] leading-[22px] text-[#1f2937]">
                Crop Foto 1:1
                {queuePosition && queuePosition.total > 1
                  ? ` (${queuePosition.current}/${queuePosition.total})`
                  : ""}
              </h2>
              <p className="text-[11px] text-[#9ca3af]">
                Geser &amp; perbesar foto agar pas di frame persegi
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isApplying}
            onClick={onCancelAll}
            aria-label="Tutup crop"
            className="w-[34px] h-[34px] rounded-full bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center cursor-pointer"
          >
            <X className="w-[18px] h-[18px] text-[#1f2937]" />
          </button>
        </div>

        {/* 1:1 Square Interactive Crop Frame */}
        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative aspect-square w-full max-w-[300px] mx-auto rounded-[20px] overflow-hidden bg-[#111827] border-2 border-[#ec4899] touch-none select-none cursor-grab active:cursor-grabbing"
        >
          <img
            ref={imgRef}
            src={objectUrl}
            alt="Preview crop"
            draggable={false}
            onLoad={(e) => {
              const target = e.currentTarget;
              setNaturalSize({
                w: target.naturalWidth || 1,
                h: target.naturalHeight || 1,
              });
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            style={{
              width: `${displaySize.w}px`,
              height: `${displaySize.h}px`,
              left: `${imgLeft}px`,
              top: `${imgTop}px`,
            }}
            className="absolute max-w-none pointer-events-none select-none"
          />

          {/* 3x3 Rule-of-Thirds Grid Guide */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="border border-white/20" />
            ))}
          </div>

          {/* Ratio Badge */}
          <span className="pointer-events-none absolute top-[10px] left-[10px] bg-[#111827]/70 text-white text-[10px] font-bold px-[8px] py-[3px] rounded-full">
            1:1 Persegi
          </span>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-[10px] max-w-[320px] w-full mx-auto">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.2)}
            aria-label="Perkecil"
            className="w-[32px] h-[32px] rounded-full bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center text-[#1f2937] cursor-pointer shrink-0"
          >
            <ZoomOut className="w-[15px] h-[15px]" />
          </button>

          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            aria-label="Zoom foto"
            onChange={(e) => handleZoomChange(Number.parseFloat(e.target.value))}
            className="flex-1 accent-[#ec4899] cursor-pointer"
          />

          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.2)}
            aria-label="Perbesar"
            className="w-[32px] h-[32px] rounded-full bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center text-[#1f2937] cursor-pointer shrink-0"
          >
            <ZoomIn className="w-[15px] h-[15px]" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset posisi"
            aria-label="Reset posisi"
            className="w-[32px] h-[32px] rounded-full bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center text-[#1f2937] cursor-pointer shrink-0"
          >
            <RotateCcw className="w-[14px] h-[14px]" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-[12px] px-[12px] py-[8px] text-[12px] font-medium">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-[10px]">
          {onSkipCurrent && queuePosition && queuePosition.total > 1 ? (
            <button
              type="button"
              disabled={isApplying}
              onClick={onSkipCurrent}
              className="h-[46px] px-[16px] rounded-[16px] bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#1f2937] font-bold text-[13px] cursor-pointer"
            >
              Lewati
            </button>
          ) : (
            <button
              type="button"
              disabled={isApplying}
              onClick={onCancelAll}
              className="h-[46px] px-[16px] rounded-[16px] bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#1f2937] font-bold text-[13px] cursor-pointer"
            >
              Batal
            </button>
          )}

          <button
            type="button"
            disabled={isApplying || !naturalSize}
            onClick={handleConfirm}
            className="flex-1 h-[46px] bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-70 text-white font-bold text-[14px] rounded-[16px] flex items-center justify-center gap-[6px] cursor-pointer transition-colors"
          >
            {isApplying ? (
              <>
                <span className="w-[16px] h-[16px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <Check className="w-[17px] h-[17px]" />
                <span>Gunakan Foto 1:1</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
