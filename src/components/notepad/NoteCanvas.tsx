import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Minus,
  MoveRight,
  Square,
  Circle,
  Type,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Maximize2,
  Minimize2,
  Grid,
  Check
} from 'lucide-react';

export type CanvasTool = 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'text';

export interface NoteCanvasProps {
  initialData?: string;
  onChange?: (dataUrl: string) => void;
  readOnly?: boolean;
  minHeight?: number;
  className?: string;
  onCloseFullscreen?: () => void;
}

const COLOR_PRESETS = [
  { label: 'White', value: '#FFFFFF', dotBg: 'bg-white' },
  { label: 'Sky Blue', value: '#38BDF8', dotBg: 'bg-sky-400' },
  { label: 'Emerald', value: '#34D399', dotBg: 'bg-emerald-400' },
  { label: 'Golden Amber', value: '#FBBF24', dotBg: 'bg-amber-400' },
  { label: 'Coral Red', value: '#F87171', dotBg: 'bg-rose-400' },
  { label: 'Royal Purple', value: '#C084FC', dotBg: 'bg-purple-400' },
  { label: 'Slate Gray', value: '#94A3B8', dotBg: 'bg-slate-400' },
  { label: 'Pitch Black', value: '#18181B', dotBg: 'bg-neutral-900 border border-neutral-600' }
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
  { label: 'Marker', value: 16 }
];

type CanvasBackground = 'dots' | 'grid' | 'blank';

export const NoteCanvas: React.FC<NoteCanvasProps> = ({
  initialData,
  onChange,
  readOnly = false,
  minHeight = 360,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<CanvasTool>('pen');
  const [color, setColor] = useState<string>('#38BDF8');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [bgStyle, setBgStyle] = useState<CanvasBackground>('dots');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Undo / Redo stacks stored as ImageData
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const isDrawing = useRef<boolean>(false);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const snapshotBeforeDrag = useRef<ImageData | null>(null);

  // Text tool state
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState<string>('');

  // Save state helper for undo history
  const pushUndoSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setUndoStack((prev) => [...prev.slice(-25), dataUrl]);
    setRedoStack([]);
  }, []);

  // Helper to notify change
  const triggerChange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onChange) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  }, [onChange]);

  // Redraw background grid onto canvas context if blank or load
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, style: CanvasBackground) => {
    ctx.save();
    // Fill dark canvas base
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, width, height);

    if (style === 'dots') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      const step = 24;
      for (let x = 12; x < width; x += step) {
        for (let y = 12; y < height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (style === 'grid') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const step = 28;
      ctx.beginPath();
      for (let x = 0; x < width; x += step) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y < height; y += step) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  // Initialize Canvas Dimensions & load initial image
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(300, Math.floor(rect.width || 700));
    const height = Math.max(minHeight, Math.floor(rect.height || minHeight));

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = initialData;
    } else {
      drawBackground(ctx, width, height, bgStyle);
    }
  }, [minHeight, isFullscreen]);

  // Handle switching background pattern
  const handleChangeBg = (newStyle: CanvasBackground) => {
    setBgStyle(newStyle);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save existing drawing on top
    const existing = new Image();
    existing.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      drawBackground(ctx, width, height, newStyle);
      ctx.drawImage(existing, 0, 0, width, height);
      triggerChange();
    };
    existing.src = canvas.toDataURL('image/png');
  };

  // Get pointer coordinates relative to canvas
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    // Text tool click placement
    if (tool === 'text') {
      setTextInputPos(coords);
      setTextInputValue('');
      return;
    }

    pushUndoSnapshot();

    isDrawing.current = true;
    startPos.current = coords;

    const dpr = window.devicePixelRatio || 1;
    snapshotBeforeDrag.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = strokeWidth * 3;
    } else if (tool === 'highlighter') {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth * 2.5;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 1.0;
    }

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x + 0.1, coords.y + 0.1);
      ctx.stroke();
    }

    // Capture pointer
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (snapshotBeforeDrag.current) {
      // Shape dragging preview: restore pre-drag state then draw shape preview
      ctx.putImageData(snapshotBeforeDrag.current, 0, 0);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const sx = startPos.current.x;
      const sy = startPos.current.y;
      const ex = coords.x;
      const ey = coords.y;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else if (tool === 'arrow') {
        // Line
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(ey - sy, ex - sx);
        const headlen = Math.max(10, strokeWidth * 3);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headlen * Math.cos(angle - Math.PI / 6), ey - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headlen * Math.cos(angle + Math.PI / 6), ey - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (tool === 'rect') {
        const x = Math.min(sx, ex);
        const y = Math.min(sy, ey);
        const w = Math.abs(ex - sx);
        const h = Math.abs(ey - sy);
        ctx.beginPath();
        ctx.strokeRect(x, y, w, h);
      } else if (tool === 'circle') {
        const radiusX = Math.abs(ex - sx) / 2;
        const radiusY = Math.abs(ey - sy) / 2;
        const centerX = Math.min(sx, ex) + radiusX;
        const centerY = Math.min(sy, ey) + radiusY;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    snapshotBeforeDrag.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.restore();
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    triggerChange();
  };

  // Submit typed text on canvas
  const handleCommitText = () => {
    if (!textInputPos || !textInputValue.trim()) {
      setTextInputPos(null);
      setTextInputValue('');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndoSnapshot();

    ctx.save();
    ctx.font = `${Math.max(14, strokeWidth * 4)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInputValue, textInputPos.x, textInputPos.y + 14);
    ctx.restore();

    setTextInputPos(null);
    setTextInputValue('');
    triggerChange();
  };

  // Undo Action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentSnapshot = canvas.toDataURL('image/png');
    const previousSnapshot = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [currentSnapshot, ...prev]);

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
      triggerChange();
    };
    img.src = previousSnapshot;
  };

  // Redo Action
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentSnapshot = canvas.toDataURL('image/png');
    const nextSnapshot = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setUndoStack((prev) => [...prev, currentSnapshot]);

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
      triggerChange();
    };
    img.src = nextSnapshot;
  };

  // Clear Canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pushUndoSnapshot();

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    drawBackground(ctx, w, h, bgStyle);
    triggerChange();
  };

  // Export / Download PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `note-sketch-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col rounded-xl border border-neutral-800 bg-[#141414] overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-[#141414] border-neutral-700' : ''
      } ${className}`}
    >
      {/* Canvas Interactive Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#1a1a1a] border-b border-neutral-800 text-xs">
          {/* Tool Selector */}
          <div className="flex items-center gap-1 bg-[#202020] p-1 rounded-lg border border-neutral-750">
            <button
              type="button"
              title="Pen / Freehand"
              onClick={() => setTool('pen')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === 'pen' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Pen className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Highlighter Marker"
              onClick={() => setTool('highlighter')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === 'highlighter' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Straight Line"
              onClick={() => setTool('line')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === 'line' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Arrow"
              onClick={() => setTool('arrow')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === 'arrow' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MoveRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Rectangle Box"
              onClick={() => setTool('rect')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === 'rect' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Circle / Ellipse"
              onClick={() => setTool('circle')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === 'circle' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Text Annotation"
              onClick={() => setTool('text')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === 'text' ? 'bg-purple-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-4 bg-neutral-700 mx-0.5" />
            <button
              type="button"
              title="Eraser"
              onClick={() => setTool('eraser')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                tool === 'eraser' ? 'bg-rose-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 bg-[#202020] p-1 rounded-lg border border-neutral-750">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w.value}
                type="button"
                title={`${w.label} Stroke (${w.value}px)`}
                onClick={() => setStrokeWidth(w.value)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  strokeWidth === w.value
                    ? 'bg-neutral-700 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 bg-[#202020] px-2 py-1 rounded-lg border border-neutral-750">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={`w-4 h-4 rounded-full ${c.dotBg} transition-all cursor-pointer flex items-center justify-center ${
                  color === c.value ? 'ring-2 ring-offset-1 ring-offset-[#202020] ring-white scale-110' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {color === c.value && <Check className={`w-2.5 h-2.5 ${c.value === '#FFFFFF' ? 'text-black' : 'text-white'} stroke-[3]`} />}
              </button>
            ))}
          </div>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Undo"
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Redo"
              disabled={redoStack.length === 0}
              onClick={handleRedo}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Grid Background"
              onClick={() => {
                const nextBg = bgStyle === 'dots' ? 'grid' : bgStyle === 'grid' ? 'blank' : 'dots';
                handleChangeBg(nextBg);
              }}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Download Sketch"
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Clear Canvas"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/70 hover:text-rose-300 text-neutral-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Canvas'}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Drawing Canvas Container */}
      <div className="relative flex-1 w-full h-full min-h-[300px] overflow-hidden bg-[#141414] cursor-crosshair">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          className="w-full h-full block"
        />

        {/* Text Tool Floating Inline Input */}
        {textInputPos && (
          <div
            className="absolute z-10 flex items-center gap-1.5 bg-[#1f1f1f] p-1.5 rounded-lg border border-blue-500 shadow-xl animate-fade-in"
            style={{
              left: `${Math.min(textInputPos.x, (canvasRef.current?.clientWidth || 400) - 220)}px`,
              top: `${Math.max(10, textInputPos.y - 15)}px`
            }}
          >
            <input
              type="text"
              autoFocus
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCommitText();
                } else if (e.key === 'Escape') {
                  setTextInputPos(null);
                }
              }}
              placeholder="Type label text..."
              className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none px-2 py-1 w-44 font-medium"
            />
            <button
              type="button"
              onClick={handleCommitText}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded cursor-pointer transition-colors"
            >
              Place
            </button>
          </div>
        )}

        {/* Read-Only Helper Badge */}
        {readOnly && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md border border-neutral-700/60 text-[10px] text-neutral-300 font-medium pointer-events-none flex items-center gap-1">
            <Pen className="w-3 h-3 text-blue-400" />
            <span>Canvas Sketch</span>
          </div>
        )}
      </div>
    </div>
  );
};
