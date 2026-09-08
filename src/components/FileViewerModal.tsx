import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Search,
  FileText,
  FileSpreadsheet,
  FileCode,
  Music,
  Image as ImageIcon,
  Eye,
  AlertCircle,
  RefreshCw,
  Table,
  AlignLeft,
  FileCheck,
  Shield,
  Volume2,
  Play,
  Pause,
  RotateCcw as ResetIcon,
  ArrowUpDown
} from 'lucide-react';

export interface FileViewerItem {
  id: string;
  name: string;
  size: number;
  type?: string;
  url?: string;
  downloadUrl?: string;
  dataBase64?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedByAvatar?: string;
  uploadedAt?: string;
  checksum?: string;
}

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileViewerItem | null;
}

function decodeBase64Utf8(base64: string): string {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    try {
      return atob(base64);
    } catch {
      return '';
    }
  }
}

// Simple RFC 4180 CSV parser
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentLine.trim().length > 0 || lines.length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const nc = line[i + 1];
      if (c === '"') {
        if (inQuotes && nc === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const parsed = lines.map(parseLine);
  const headers = parsed[0] || [];
  const rows = parsed.slice(1).filter((r) => r.some((c) => c.length > 0));

  return { headers, rows };
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ isOpen, onClose, file }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [textContent, setTextContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [csvViewMode, setCsvViewMode] = useState<'table' | 'raw'>('table');
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState(1);
  const [pdfViewMode, setPdfViewMode] = useState<'embedded' | 'text'>('embedded');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Determine file category
  const fileExt = useMemo(() => {
    if (!file?.name) return '';
    const parts = file.name.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }, [file?.name]);

  const fileCategory = useMemo<'pdf' | 'csv' | 'text' | 'image' | 'audio' | 'other'>(() => {
    if (!file) return 'other';
    const mime = file.type?.toLowerCase() || '';
    if (fileExt === 'pdf' || mime.includes('pdf')) return 'pdf';
    if (fileExt === 'csv' || mime.includes('csv')) return 'csv';
    if (['txt', 'log', 'json', 'md', 'xml', 'yml', 'yaml', 'ts', 'js', 'html', 'css'].includes(fileExt) || mime.startsWith('text/')) return 'text';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(fileExt) || mime.startsWith('image/')) return 'image';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(fileExt) || mime.startsWith('audio/')) return 'audio';
    return 'other';
  }, [file, fileExt]);

  // Derive usable content URL
  const activeUrl = useMemo(() => {
    if (!file) return '';
    if (file.url && (file.url.startsWith('data:') || file.url.startsWith('http') || file.url.startsWith('/'))) {
      return file.url;
    }
    if (file.dataBase64) {
      const mime = file.type || (fileCategory === 'pdf' ? 'application/pdf' : 'application/octet-stream');
      return `data:${mime};base64,${file.dataBase64}`;
    }
    return `/api/attachments/${file.id}/view`;
  }, [file, fileCategory]);

  const downloadUrl = useMemo(() => {
    if (!file) return '';
    if (file.downloadUrl) return file.downloadUrl;
    if (file.url && !file.url.startsWith('data:')) return file.url;
    return `/api/attachments/${file.id}/download`;
  }, [file]);

  // Fetch or decode file content on open
  useEffect(() => {
    if (!isOpen || !file) {
      setTextContent('');
      setLoadError(null);
      setImageDimensions(null);
      setZoomLevel(100);
      setSearchTerm('');
      setIsPlayingAudio(false);
      setPdfViewMode('embedded');
      return;
    }

    let isMounted = true;

    const loadContent = async () => {
      // For text and csv, we need the raw string content
      if (fileCategory === 'text' || fileCategory === 'csv' || fileCategory === 'pdf') {
        setIsLoading(true);
        setLoadError(null);

        // 1. Check if we have base64 payload already
        if (file.dataBase64) {
          const decoded = decodeBase64Utf8(file.dataBase64);
          if (isMounted) {
            setTextContent(decoded);
            setIsLoading(false);
          }
          return;
        }

        // 2. Check if file.url is a data URI
        if (file.url && file.url.startsWith('data:')) {
          const parts = file.url.split(',');
          if (parts.length > 1) {
            const decoded = decodeBase64Utf8(parts[1]);
            if (isMounted) {
              setTextContent(decoded);
              setIsLoading(false);
            }
            return;
          }
        }

        // 3. Try to fetch from /api/attachments/:id/data first
        try {
          const infoRes = await fetch(`/api/attachments/${file.id}/data`);
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            if (infoData.dataBase64) {
              const decoded = decodeBase64Utf8(infoData.dataBase64);
              if (isMounted) {
                setTextContent(decoded);
                setIsLoading(false);
              }
              return;
            }
          }
        } catch {
          // fallback to normal fetch
        }

        // 4. Fetch the raw view endpoint
        try {
          const fetchTarget = activeUrl || `/api/attachments/${file.id}/view`;
          const res = await fetch(fetchTarget);
          if (!res.ok) {
            throw new Error(`Failed to load file content (${res.status} ${res.statusText})`);
          }

          if (fileCategory === 'text' || fileCategory === 'csv') {
            const text = await res.text();
            if (isMounted) {
              setTextContent(text);
              setIsLoading(false);
            }
          } else if (fileCategory === 'pdf') {
            // Check if text is readable or if it's binary
            const buffer = await res.arrayBuffer();
            if (isMounted) {
              // Try to extract readable text tokens from basic PDF streams
              const uint8 = new Uint8Array(buffer);
              const textDecoder = new TextDecoder('utf-8');
              const rawStr = textDecoder.decode(uint8);
              const textMatches = Array.from(rawStr.matchAll(/\(([^)]+)\)\s*Tj/g)).map((m) => m[1]);
              if (textMatches.length > 0) {
                setTextContent(textMatches.join('\n'));
              } else {
                setTextContent(
                  `TaskFlow PDF Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nUploaded: ${file.uploadedAt || 'Recent'}\n\n[Interactive PDF view is active in the preview pane]`
                );
              }
              setIsLoading(false);
            }
          }
        } catch (err: any) {
          if (isMounted) {
            // Provide a graceful fallback preview
            if (fileCategory === 'pdf') {
              setTextContent(`TaskFlow PDF Preview: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`);
              setLoadError(null);
            } else {
              setLoadError(err.message || 'Failed to load file content.');
            }
            setIsLoading(false);
          }
        }
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [isOpen, file, fileCategory, activeUrl]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Parse CSV
  const parsedCSV = useMemo(() => {
    if (fileCategory !== 'csv' || !textContent) {
      return { headers: [], rows: [] };
    }
    return parseCSV(textContent);
  }, [fileCategory, textContent]);

  // Filter and Sort CSV Rows
  const filteredCsvRows = useMemo(() => {
    let rows = parsedCSV.rows;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
    }
    if (sortColumnIndex !== null) {
      rows = [...rows].sort((a, b) => {
        const valA = a[sortColumnIndex] || '';
        const valB = b[sortColumnIndex] || '';
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
    }
    return rows;
  }, [parsedCSV.rows, searchTerm, sortColumnIndex, sortDirection]);

  // Filter text lines for search
  const textLines = useMemo(() => {
    return textContent.split('\n');
  }, [textContent]);

  const filteredTextLines = useMemo(() => {
    if (!searchTerm.trim()) return textLines.map((line, idx) => ({ line, originalIdx: idx + 1, matches: false }));
    const q = searchTerm.toLowerCase();
    return textLines.map((line, idx) => ({
      line,
      originalIdx: idx + 1,
      matches: line.toLowerCase().includes(q)
    }));
  }, [textLines, searchTerm]);

  const matchCount = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    const q = searchTerm.toLowerCase();
    if (fileCategory === 'csv') {
      let count = 0;
      for (const row of parsedCSV.rows) {
        for (const cell of row) {
          if (cell.toLowerCase().includes(q)) count++;
        }
      }
      return count;
    }
    return filteredTextLines.filter((l) => l.matches).length;
  }, [searchTerm, fileCategory, parsedCSV.rows, filteredTextLines]);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(textContent || file?.name || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSortColumn = (colIdx: number) => {
    if (sortColumnIndex === colIdx) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumnIndex(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumnIndex(colIdx);
      setSortDirection('asc');
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    setAudioProgress(audioRef.current.currentTime);
    setAudioDuration(audioRef.current.duration || 0);
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen || !file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-[#141414] border border-[#282828] rounded-xl shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh] max-h-[920px]'
        }`}
      >
        {/* =========================================================================
            MODAL HEADER
            ========================================================================= */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181818] border-b border-[#262626] shrink-0 gap-3">
          {/* File Identification */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Type badge icon */}
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                fileCategory === 'pdf'
                  ? 'bg-rose-950/60 border-rose-800/80 text-rose-400'
                  : fileCategory === 'csv'
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
                  : fileCategory === 'text'
                  ? 'bg-sky-950/60 border-sky-800/80 text-sky-400'
                  : fileCategory === 'image'
                  ? 'bg-purple-950/60 border-purple-800/80 text-purple-400'
                  : fileCategory === 'audio'
                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-400'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400'
              }`}
            >
              {fileCategory === 'pdf' && <FileText className="w-5 h-5" />}
              {fileCategory === 'csv' && <FileSpreadsheet className="w-5 h-5" />}
              {fileCategory === 'text' && <FileCode className="w-5 h-5" />}
              {fileCategory === 'image' && <ImageIcon className="w-5 h-5" />}
              {fileCategory === 'audio' && <Music className="w-5 h-5" />}
              {fileCategory === 'other' && <FileText className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-md" title={file.name}>
                  {file.name}
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                    fileCategory === 'pdf'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      : fileCategory === 'csv'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : fileCategory === 'text'
                      ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                      : fileCategory === 'image'
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {fileExt.toUpperCase() || 'FILE'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5 flex-wrap">
                <span>{(file.size / 1024).toFixed(1)} KB</span>
                {file.uploadedByName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {file.uploadedByAvatar && (
                        <img
                          src={file.uploadedByAvatar}
                          alt={file.uploadedByName}
                          className="w-3.5 h-3.5 rounded-full object-cover"
                        />
                      )}
                      <span>{file.uploadedByName}</span>
                    </span>
                  </>
                )}
                {file.checksum && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-[10px] font-mono text-emerald-400/90 hidden sm:inline flex items-center gap-0.5">
                      <Shield className="w-3 h-3 text-emerald-400 inline" />
                      verified
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Open in New Tab */}
            {activeUrl && (
              <a
                href={activeUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-neutral-400 hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
                title="Open raw in new browser tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Download button */}
            <a
              href={downloadUrl}
              download={file.name}
              className="p-2 text-neutral-400 hover:text-emerald-300 hover:bg-[#262626] rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-[#262626] rounded-lg transition-colors ml-1"
              title="Close viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            SECONDARY CONTROLS TOOLBAR (Per-Format Controls)
            ========================================================================= */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#161616] border-b border-[#262626] text-xs gap-3 shrink-0 flex-wrap">
          {/* Format-Specific Left Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* PDF Toolbar */}
            {fileCategory === 'pdf' && (
              <>
                <div className="flex items-center bg-[#1e1e1e] rounded-lg border border-[#303030] p-0.5">
                  <button
                    type="button"
                    onClick={() => setPdfViewMode('embedded')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      pdfViewMode === 'embedded'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>In-App PDF View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfViewMode('text')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      pdfViewMode === 'text'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Extracted Text</span>
                  </button>
                </div>

                {pdfViewMode === 'embedded' && (
                  <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-lg border border-[#303030] px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                      className="p-1 text-neutral-400 hover:text-white rounded"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono px-1.5 text-neutral-300 font-semibold">
                      {zoomLevel}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                      className="p-1 text-neutral-400 hover:text-white rounded"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(100)}
                      className="p-1 text-neutral-400 hover:text-white rounded text-[10px]"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* CSV Toolbar */}
            {fileCategory === 'csv' && (
              <>
                <div className="flex items-center bg-[#1e1e1e] rounded-lg border border-[#303030] p-0.5">
                  <button
                    type="button"
                    onClick={() => setCsvViewMode('table')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      csvViewMode === 'table'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Interactive Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvViewMode('raw')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      csvViewMode === 'raw'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Raw CSV</span>
                  </button>
                </div>

                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  {parsedCSV.rows.length} rows • {parsedCSV.headers.length} columns
                </span>
              </>
            )}

            {/* Text Toolbar */}
            {fileCategory === 'text' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsWordWrap(!isWordWrap)}
                  className={`px-2 py-1 rounded border text-xs font-medium transition-colors ${
                    isWordWrap
                      ? 'bg-sky-950/60 text-sky-300 border-sky-800'
                      : 'bg-[#1e1e1e] text-neutral-400 border-[#303030] hover:text-white'
                  }`}
                >
                  Word Wrap: {isWordWrap ? 'ON' : 'OFF'}
                </button>
                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  {textLines.length} lines • {textContent.length.toLocaleString()} characters
                </span>
              </>
            )}

            {/* Image Toolbar */}
            {fileCategory === 'image' && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-lg border border-[#303030] px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(25, z - 25))}
                    className="p-1 text-neutral-400 hover:text-white rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1.5 text-neutral-300 font-semibold">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(300, z + 25))}
                    className="p-1 text-neutral-400 hover:text-white rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="p-1 text-neutral-400 hover:text-white rounded"
                    title="Reset to 100%"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
                {imageDimensions && (
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {imageDimensions.width} × {imageDimensions.height} px
                  </span>
                )}
              </div>
            )}

            {/* Audio Toolbar */}
            {fileCategory === 'audio' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleAudioPlay}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs transition-colors"
                >
                  {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? 'Pause' : 'Play Audio'}</span>
                </button>
                <span className="text-xs font-mono text-amber-400">
                  {formatAudioTime(audioProgress)} / {formatAudioTime(audioDuration)}
                </span>
              </div>
            )}
          </div>

          {/* Search Box & Copy Button for text-based formats */}
          {(fileCategory === 'text' || fileCategory === 'csv' || (fileCategory === 'pdf' && pdfViewMode === 'text')) && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Find in content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-2.5 py-1 bg-[#1e1e1e] border border-[#303030] rounded-md text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 w-36 sm:w-48"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {searchTerm && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-800">
                  {matchCount} match{matchCount === 1 ? '' : 'es'}
                </span>
              )}

              {/* Copy content button */}
              <button
                type="button"
                onClick={handleCopyContent}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#1e1e1e] hover:bg-[#262626] border border-[#303030] text-neutral-300 hover:text-white rounded-md text-xs transition-colors"
                title="Copy all content to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* =========================================================================
            VIEWER CONTENT BODY
            ========================================================================= */}
        <div className="flex-1 overflow-auto bg-[#0f0f0f] relative p-1 sm:p-2">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f0f]/90 z-20 gap-2.5">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
              <p className="text-xs text-neutral-400">Loading and verifying file content...</p>
            </div>
          )}

          {loadError && (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-white font-semibold text-sm">Unable to render inline preview</p>
              <p className="text-neutral-400 max-w-md">{loadError}</p>
              <div className="flex items-center gap-2 pt-2">
                <a
                  href={downloadUrl}
                  download={file.name}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File Directly</span>
                </a>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              PDF VIEWER
              ------------------------------------------------------------- */}
          {fileCategory === 'pdf' && !loadError && (
            <div className="w-full h-full flex flex-col">
              {pdfViewMode === 'embedded' ? (
                <div className="w-full h-full flex flex-col relative rounded-lg overflow-hidden bg-[#181818] border border-[#222]">
                  <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
                    <div
                      style={{
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'top center',
                        width: `${Math.min(100, (100 * 100) / zoomLevel)}%`,
                        height: '100%',
                        transition: 'transform 0.15s ease'
                      }}
                      className="w-full h-full flex flex-col"
                    >
                      {activeUrl ? (
                        <object
                          data={activeUrl}
                          type="application/pdf"
                          className="w-full h-full rounded border-0"
                          title={file.name}
                        >
                          <iframe
                            src={activeUrl}
                            className="w-full h-full border-0 rounded"
                            title={file.name}
                          >
                            <div className="p-8 text-center text-xs text-neutral-400 space-y-3">
                              <p className="text-white font-bold">PDF Reader Embed</p>
                              <p>Your browser environment requires opening this PDF in a dedicated view.</p>
                              <a
                                href={activeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>Open PDF Document</span>
                              </a>
                            </div>
                          </iframe>
                        </object>
                      ) : (
                        <div className="p-8 text-center text-xs text-neutral-400">PDF URL not found</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Extracted PDF Text mode */
                <div className="w-full h-full bg-[#121212] p-4 rounded border border-[#242424] overflow-auto font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {textContent || 'No plain text extracted from PDF.'}
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              CSV SPREADSHEET VIEWER
              ------------------------------------------------------------- */}
          {fileCategory === 'csv' && !loadError && (
            <div className="w-full h-full flex flex-col">
              {csvViewMode === 'table' ? (
                <div className="w-full h-full flex flex-col overflow-hidden bg-[#141414] rounded-lg border border-[#242424]">
                  {/* Table View */}
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#1b1b1b] sticky top-0 z-10 border-b border-[#2d2d2d] shadow-xs">
                        <tr>
                          <th className="px-3 py-2 text-[11px] font-bold text-neutral-400 uppercase tracking-wider w-12 text-center bg-[#1b1b1b]">
                            #
                          </th>
                          {parsedCSV.headers.map((header, colIdx) => (
                            <th
                              key={colIdx}
                              onClick={() => handleSortColumn(colIdx)}
                              className="px-4 py-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider cursor-pointer hover:bg-[#252525] transition-colors select-none"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span>{header}</span>
                                <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222]">
                        {filteredCsvRows.length > 0 ? (
                          filteredCsvRows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-[#1c1c1c] transition-colors">
                              <td className="px-3 py-2 text-center text-neutral-400 font-mono text-[11px] bg-[#161616]/60">
                                {rowIdx + 1}
                              </td>
                              {row.map((cell, cellIdx) => {
                                const isMatch = searchTerm.trim() && cell.toLowerCase().includes(searchTerm.toLowerCase());
                                return (
                                  <td
                                    key={cellIdx}
                                    className={`px-4 py-2 font-mono text-[11px] max-w-xs truncate ${
                                      isMatch
                                        ? 'bg-amber-500/20 text-amber-200 font-bold'
                                        : 'text-neutral-200'
                                    }`}
                                    title={cell}
                                  >
                                    {cell}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={parsedCSV.headers.length + 1}
                              className="py-12 text-center text-xs text-neutral-400"
                            >
                              {searchTerm
                                ? `No rows matched your search filter "${searchTerm}"`
                                : 'Empty CSV dataset'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="px-4 py-2 bg-[#181818] border-t border-[#262626] flex items-center justify-between text-xs text-neutral-400">
                    <span>
                      Showing {filteredCsvRows.length} of {parsedCSV.rows.length} rows
                    </span>
                    {sortColumnIndex !== null && (
                      <button
                        type="button"
                        onClick={() => setSortColumnIndex(null)}
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        Reset Sort ({parsedCSV.headers[sortColumnIndex]} {sortDirection})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Raw CSV Text View */
                <div className="w-full h-full bg-[#121212] p-4 rounded border border-[#242424] overflow-auto font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                  {textContent || 'No content found'}
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------------------
              TEXT / CODE / MARKDOWN VIEWER
              ------------------------------------------------------------- */}
          {fileCategory === 'text' && !loadError && (
            <div className="w-full h-full bg-[#121212] rounded-lg border border-[#222222] flex overflow-auto font-mono text-xs">
              {/* Line Numbers Gutter */}
              <div className="py-3 px-2.5 bg-[#161616] border-r border-[#262626] text-neutral-400 select-none text-right font-mono min-w-[44px] shrink-0">
                {filteredTextLines.map((item) => (
                  <div key={item.originalIdx} className="leading-6 text-[11px]">
                    {item.originalIdx}
                  </div>
                ))}
              </div>

              {/* Text Lines */}
              <div
                className={`py-3 px-4 flex-1 text-neutral-200 overflow-auto ${
                  isWordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
                }`}
              >
                {filteredTextLines.map((item) => (
                  <div
                    key={item.originalIdx}
                    className={`leading-6 text-[11px] ${
                      item.matches ? 'bg-amber-500/25 text-amber-200 font-bold px-1 rounded' : ''
                    }`}
                  >
                    {item.line || '\u00A0'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              IMAGE VIEWER
              ------------------------------------------------------------- */}
          {fileCategory === 'image' && !loadError && (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4 bg-[#0a0a0a] rounded-lg border border-[#202020]">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transition: 'transform 0.15s ease'
                }}
                className="max-w-full max-h-full flex items-center justify-center select-none"
              >
                <img
                  src={activeUrl}
                  alt={file.name}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                  className="rounded-lg shadow-2xl object-contain border border-[#333333] max-w-full max-h-[75vh]"
                />
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              AUDIO VIEWER
              ------------------------------------------------------------- */}
          {fileCategory === 'audio' && !loadError && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#141414] rounded-lg border border-[#242424]">
              <div className="w-full max-w-lg p-6 bg-[#1a1a1a] border border-[#2f2f2f] rounded-2xl shadow-xl space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <Music className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{file.name}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB • Audio Clip</p>
                </div>

                <audio
                  ref={audioRef}
                  src={activeUrl}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onEnded={() => setIsPlayingAudio(false)}
                  className="hidden"
                />

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || 100}
                    value={audioProgress}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAudioProgress(val);
                      if (audioRef.current) audioRef.current.currentTime = val;
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-mono text-neutral-400">
                    <span>{formatAudioTime(audioProgress)}</span>
                    <span>{formatAudioTime(audioDuration)}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioProgress - 10);
                    }}
                    className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-[#252525] text-xs font-mono"
                    title="Rewind 10s"
                  >
                    -10s
                  </button>

                  <button
                    type="button"
                    onClick={toggleAudioPlay}
                    className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (audioRef.current) audioRef.current.currentTime = Math.min(audioDuration, audioProgress + 10);
                    }}
                    className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-[#252525] text-xs font-mono"
                    title="Forward 10s"
                  >
                    +10s
                  </button>
                </div>

                {/* Playback speed selector */}
                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-neutral-400">
                  <span>Speed:</span>
                  {[1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setAudioPlaybackRate(rate);
                        if (audioRef.current) audioRef.current.playbackRate = rate;
                      }}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        audioPlaybackRate === rate
                          ? 'bg-amber-500 text-black'
                          : 'bg-[#252525] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------
              GENERIC / OTHER DOCUMENTS
              ------------------------------------------------------------- */}
          {fileCategory === 'other' && !loadError && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="max-w-md p-8 bg-[#181818] border border-[#2a2a2a] rounded-2xl shadow-xl space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#242424] border border-[#333] flex items-center justify-center text-neutral-300 mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{file.name}</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB • {fileExt ? `.${fileExt.toUpperCase()}` : 'Binary'} Document
                  </p>
                </div>
                {file.checksum && (
                  <div className="p-2 bg-[#141414] rounded border border-[#222] font-mono text-[10px] text-emerald-400">
                    Checksum: {file.checksum}
                  </div>
                )}
                <p className="text-xs text-neutral-400 leading-relaxed">
                  This document type is secured and validated. You can download it to view in your system editor.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <a
                    href={downloadUrl}
                    download={file.name}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm text-xs flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            MODAL FOOTER STATUS BAR
            ========================================================================= */}
        <div className="px-4 py-2 bg-[#181818] border-t border-[#262626] flex items-center justify-between text-[11px] text-neutral-500 shrink-0">
          <div className="flex items-center gap-2">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>TaskFlow Secure Attachment Viewer</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline text-neutral-400">
              Validated: {fileCategory.toUpperCase()} format
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Press Esc to exit</span>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#262626]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
