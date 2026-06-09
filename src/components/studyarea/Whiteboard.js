import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// ── Simple debounce ───────────────────────────────────────────────────────────
const useDebounce = (fn, delay) => {
  const timer = useRef(null);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay]
  );
};

// ── Constants ─────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'pen',       label: '✏️', title: 'Pen' },
  { id: 'highlight', label: '🖊️', title: 'Highlighter' },
  { id: 'eraser',    label: '⬜', title: 'Eraser' },
  { id: 'text',      label: 'T',  title: 'Text' },
  { id: 'sticky',    label: '📌', title: 'Sticky Note' },
  { id: 'image',     label: '🖼️', title: 'Insert Image' },
];

const COLORS = ['#1e293b', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
const SIZES  = [2, 4, 8, 16];

// ── Draw dot-grid background (white fill + visible dots) ─────────────────────
const drawBackground = (ctx, width, height) => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  const spacing = 24;
  ctx.fillStyle = '#b0b8c8'; // clearly visible cool-gray dots
  for (let x = spacing; x <= width; x += spacing) {
    for (let y = spacing; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// ── Compress / resize image file to ≤1000 px before storing ──────────────────
const compressImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 1000;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
          else       { w = Math.round((w * MAX) / h); h = MAX; }
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ src: c.toDataURL('image/jpeg', 0.75), naturalWidth: w, naturalHeight: h });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

// ── Component ─────────────────────────────────────────────────────────────────
const Whiteboard = ({ userId, onContentChange }) => {
  const canvasRef     = useRef(null);
  const containerRef  = useRef(null);
  const drawing       = useRef(false);
  const lastPos       = useRef(null);
  const historyRef    = useRef([]);
  const historyIdx    = useRef(-1);
  const stickiesRef   = useRef([]);
  const imagesRef     = useRef([]);
  const imageInputRef = useRef(null);
  const imgDragRef    = useRef(null);  // { id, offsetX, offsetY }
  const imgResizeRef  = useRef(null);  // { id, startX, startY, startW, startH }
  const didDragRef    = useRef(false); // prevents picker opening after a drag

  const [tool,            setTool]            = useState('pen');
  const [color,           setColor]           = useState('#1e293b');
  const [size,            setSize]            = useState(4);
  const [stickies,        setStickies]        = useState([]);
  const [images,          setImages]          = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [editSticky,      setEditSticky]      = useState(null);
  const [textInput,       setTextInput]       = useState({ visible: false, x: 0, y: 0, value: '' });
  const [saveState,       setSaveState]       = useState('saved');
  const [isDragOver,      setIsDragOver]      = useState(false);

  // ── Load from Firestore ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    getDoc(doc(db, 'whiteboards', userId)).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      if (data.canvasDataURL) {
        const img = new window.Image();
        img.onload = () => {
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) { ctx.drawImage(img, 0, 0); pushHistory(); }
        };
        img.src = data.canvasDataURL;
      }
      if (data.stickies) {
        stickiesRef.current = data.stickies;
        setStickies(data.stickies);
      }
      if (data.images) {
        imagesRef.current = data.images;
        setImages(data.images);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Resize canvas to fill container ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const { width, height } = parent.getBoundingClientRect();
    canvas.width  = width  || 800;
    canvas.height = height || 600;
    const ctx = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height);
    pushHistory();

    const onResize = () => {
      const saved = canvas.toDataURL();
      const { width: w, height: h } = parent.getBoundingClientRect();
      canvas.width  = w || 800;
      canvas.height = h || 600;
      const ctx2 = canvas.getContext('2d');
      drawBackground(ctx2, canvas.width, canvas.height);
      const img = new window.Image();
      img.onload = () => ctx2.drawImage(img, 0, 0);
      img.src = saved;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
    historyRef.current.push(snap);
    if (historyRef.current.length > 40) historyRef.current.shift();
    historyIdx.current = historyRef.current.length - 1;
  };

  // ── Save to Firestore (debounced 2 s) ────────────────────────────────────
  const persistWhiteboard = useDebounce(async () => {
    if (!userId) return;
    setSaveState('saving');
    try {
      const dataURL   = canvasRef.current?.toDataURL() || '';
      const textNodes = stickiesRef.current.map((s) => s.text).filter(Boolean);
      await setDoc(
        doc(db, 'whiteboards', userId),
        {
          canvasDataURL: dataURL,
          stickies:      stickiesRef.current,
          images:        imagesRef.current,
          textSummary:   textNodes.join(' ').substring(0, 1000),
          lastUpdated:   serverTimestamp(),
        },
        { merge: true }
      );
      setSaveState('saved');
      onContentChange?.({ textSummary: textNodes.join(' '), stickies: stickiesRef.current });
    } catch (e) {
      console.error('Whiteboard save error', e);
      setSaveState('unsaved');
    }
  }, 2000);

  const markUnsaved = () => { setSaveState('unsaved'); persistWhiteboard(); };

  // ── Canvas draw helpers ───────────────────────────────────────────────────
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const src  = e.touches?.[0] ?? e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDrawing = (e) => {
    if (['text', 'sticky', 'image'].includes(tool)) return;
    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth   = size * 4;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'highlight') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth   = size * 4;
      ctx.strokeStyle = color + '55';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth   = size;
      ctx.strokeStyle = color;
    }

    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    lastPos.current = pos;
    markUnsaved();
  };

  const stopDrawing = () => {
    if (!drawing.current) return;
    drawing.current = false;
    pushHistory();
  };

  // ── Text / sticky click on canvas ─────────────────────────────────────────
  const handleCanvasClick = (e) => {
    if (tool === 'text') {
      const rect = canvasRef.current.getBoundingClientRect();
      setTextInput({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, value: '' });
    } else if (tool === 'sticky') {
      const rect  = canvasRef.current.getBoundingClientRect();
      const id    = Date.now();
      const ns    = { id, x: e.clientX - rect.left, y: e.clientY - rect.top, text: 'New note…', color: '#FDE68A' };
      const upd   = [...stickiesRef.current, ns];
      stickiesRef.current = upd;
      setStickies(upd);
      setEditSticky(id);
      markUnsaved();
    }
  };

  const commitText = () => {
    if (!textInput.value.trim()) { setTextInput({ visible: false, x: 0, y: 0, value: '' }); return; }
    const ctx = canvasRef.current.getContext('2d');
    ctx.font      = `${size * 4 + 12}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textInput.value, textInput.x, textInput.y);
    pushHistory();
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
    markUnsaved();
  };

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  const undo = () => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    canvasRef.current.getContext('2d').putImageData(historyRef.current[historyIdx.current], 0, 0);
    markUnsaved();
  };

  const redo = () => {
    if (historyIdx.current >= historyRef.current.length - 1) return;
    historyIdx.current += 1;
    canvasRef.current.getContext('2d').putImageData(historyRef.current[historyIdx.current], 0, 0);
    markUnsaved();
  };

  // ── Clear board ───────────────────────────────────────────────────────────
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    drawBackground(ctx, canvas.width, canvas.height);
    stickiesRef.current = [];
    setStickies([]);
    imagesRef.current = [];
    setImages([]);
    setSelectedImageId(null);
    pushHistory();
    markUnsaved();
  };

  // ── Export — flatten images + canvas into one PNG ─────────────────────────
  const exportImage = async () => {
    const src = canvasRef.current;
    const out = document.createElement('canvas');
    out.width = src.width; out.height = src.height;
    const ctx = out.getContext('2d');

    // Images as bottom layer
    await Promise.all(
      imagesRef.current.map(
        (imgObj) =>
          new Promise((resolve) => {
            const img = new window.Image();
            img.onload  = () => { ctx.drawImage(img, imgObj.x, imgObj.y, imgObj.width, imgObj.height); resolve(); };
            img.onerror = resolve;
            img.src     = imgObj.src;
          })
      )
    );

    // Canvas annotations on top
    ctx.drawImage(src, 0, 0);

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href     = out.toDataURL();
    link.click();
  };

  // ── Sticky helpers ────────────────────────────────────────────────────────
  const updateSticky = (id, text) => {
    const upd = stickiesRef.current.map((s) => (s.id === id ? { ...s, text } : s));
    stickiesRef.current = upd; setStickies(upd); markUnsaved();
  };

  const deleteSticky = (id) => {
    const upd = stickiesRef.current.filter((s) => s.id !== id);
    stickiesRef.current = upd; setStickies(upd); setEditSticky(null); markUnsaved();
  };

  // ── Image helpers ─────────────────────────────────────────────────────────
  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const { src: compressed, naturalWidth, naturalHeight } = await compressImage(file);
    const canvas = canvasRef.current;
    const maxW   = Math.min(400, canvas.width  * 0.6);
    const maxH   = Math.min(400, canvas.height * 0.6);
    const scale  = Math.min(maxW / naturalWidth, maxH / naturalHeight, 1);
    const w      = Math.round(naturalWidth  * scale);
    const h      = Math.round(naturalHeight * scale);
    const x      = Math.round((canvas.width  - w) / 2);
    const y      = Math.round((canvas.height - h) / 2);

    const newImg = { id: Date.now(), x, y, width: w, height: h, src: compressed };
    const upd    = [...imagesRef.current, newImg];
    imagesRef.current = upd;
    setImages(upd);
    setSelectedImageId(newImg.id);
    setTool('image'); // stay in image mode to allow repositioning
    markUnsaved();
  };

  const deleteImage = (id) => {
    const upd = imagesRef.current.filter((img) => img.id !== id);
    imagesRef.current = upd; setImages(upd); setSelectedImageId(null); markUnsaved();
  };

  // ── Image drag / resize (on container) ───────────────────────────────────
  const handleContainerMouseMove = (e) => {
    if (imgDragRef.current) {
      didDragRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - imgDragRef.current.offsetX;
      const y = e.clientY - rect.top  - imgDragRef.current.offsetY;
      const upd = imagesRef.current.map((img) =>
        img.id === imgDragRef.current.id ? { ...img, x, y } : img
      );
      imagesRef.current = upd; setImages(upd);
    } else if (imgResizeRef.current) {
      didDragRef.current = true;
      const ref = imgResizeRef.current;
      const newW = Math.max(60, ref.startW + (e.clientX - ref.startX));
      const newH = Math.max(60, ref.startH + (e.clientY - ref.startY));
      const upd  = imagesRef.current.map((img) =>
        img.id === ref.id ? { ...img, width: newW, height: newH } : img
      );
      imagesRef.current = upd; setImages(upd);
    }
  };

  const handleContainerMouseUp = () => {
    if (imgDragRef.current || imgResizeRef.current) {
      imgDragRef.current   = null;
      imgResizeRef.current = null;
      markUnsaved();
    }
  };

  const isImageMode = tool === 'image';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 flex-wrap flex-shrink-0">

        {/* Tools */}
        <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              title={t.title}
              onClick={() => {
                setTool(t.id);
                if (t.id === 'image') imageInputRef.current?.click();
              }}
              className={`w-8 h-8 rounded text-sm font-bold transition ${
                tool === t.id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Color swatches — hidden for eraser and image modes */}
        {tool !== 'eraser' && tool !== 'image' && (
          <div className="flex gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  color === c ? 'border-blue-600 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Size — hidden for sticky and image modes */}
        {tool !== 'sticky' && tool !== 'image' && (
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`flex items-center justify-center w-6 h-6 rounded transition ${
                  size === s ? 'bg-blue-100' : 'hover:bg-gray-200'
                }`}
              >
                <div className="rounded-full bg-gray-700" style={{ width: s + 4, height: s + 4 }} />
              </button>
            ))}
          </div>
        )}

        {/* Undo / Redo */}
        <div className="flex gap-1">
          <button onClick={undo} title="Undo" className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">↩</button>
          <button onClick={redo} title="Redo" className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">↪</button>
        </div>

        <button onClick={clearBoard} className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50">
          Clear
        </button>
        <button onClick={exportImage} className="px-2 py-1 text-xs border border-gray-200 text-gray-600 rounded hover:bg-gray-100">
          📥 Export
        </button>

        {/* Image mode hint */}
        {isImageMode && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium hidden sm:inline">
            Drag to move · resize corner · switch tool to annotate
          </span>
        )}

        {/* Save indicator */}
        <span className={`ml-auto text-xs ${
          saveState === 'saved'   ? 'text-green-600'  :
          saveState === 'saving'  ? 'text-blue-500'   : 'text-amber-500'
        }`}>
          {saveState === 'saved' ? '✓ Saved' : saveState === 'saving' ? 'Saving…' : '● Unsaved'}
        </span>
      </div>

      {/* ── Canvas / overlay area ────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); }}
        onDragLeave={(e) => { if (!containerRef.current?.contains(e.relatedTarget)) setIsDragOver(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
          if (file) handleImageFile({ target: { files: [file], value: '' } });
        }}
      >
        {/* Drag-over drop indicator */}
        {isDragOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-50/70 border-4 border-dashed border-blue-400 rounded pointer-events-none">
            <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex flex-col items-center gap-2">
              <span className="text-4xl">🖼️</span>
              <p className="text-blue-600 font-bold text-lg">Drop image here</p>
              <p className="text-gray-400 text-sm">Releases to add to whiteboard</p>
            </div>
          </div>
        )}
        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            cursor: tool === 'eraser'   ? 'cell'      :
                    tool === 'text'     ? 'text'      :
                    tool === 'sticky'   ? 'crosshair' :
                    tool === 'image'    ? 'default'   : 'crosshair',
            // In image mode, let events fall through to the image overlays
            pointerEvents: isImageMode ? 'none' : 'auto',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onClick={handleCanvasClick}
        />

        {/* ── Image overlays ──────────────────────────────────────────── */}
        {images.map((img) => {
          const isSelected = selectedImageId === img.id;
          return (
            <div
              key={img.id}
              className={`absolute select-none ${
                isImageMode ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
              } ${isSelected ? 'outline outline-2 outline-blue-500 outline-offset-1' : ''}`}
              style={{ left: img.x, top: img.y, width: img.width, height: img.height, zIndex: 15 }}
              onMouseDown={(e) => {
                if (!isImageMode) return;
                e.stopPropagation();
                didDragRef.current = false;
                setSelectedImageId(img.id);
                const rect = containerRef.current.getBoundingClientRect();
                imgDragRef.current = {
                  id:      img.id,
                  offsetX: e.clientX - rect.left - img.x,
                  offsetY: e.clientY - rect.top  - img.y,
                };
              }}
            >
              {/* The image */}
              <img
                src={img.src}
                alt="board"
                className="w-full h-full block"
                style={{ objectFit: 'fill' }}
                draggable={false}
              />

              {/* Delete button (top-right, visible when selected in image mode) */}
              {isSelected && isImageMode && (
                <button
                  title="Delete image"
                  className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow-md z-20 transition"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                >
                  ✕
                </button>
              )}

              {/* Resize handle (bottom-right) */}
              {isSelected && isImageMode && (
                <div
                  title="Resize"
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full cursor-se-resize z-20 flex items-center justify-center shadow transition"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    didDragRef.current = false;
                    imgResizeRef.current = {
                      id:      img.id,
                      startX:  e.clientX,
                      startY:  e.clientY,
                      startW:  img.width,
                      startH:  img.height,
                    };
                  }}
                >
                  {/* Resize icon */}
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8 L8 2 M5 9 L9 5 M9 9 L9 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Sticky notes ────────────────────────────────────────────── */}
        {stickies.map((s) => (
          <div
            key={s.id}
            className="absolute w-36 min-h-[6rem] rounded-lg shadow-md p-2 flex flex-col"
            style={{ left: s.x, top: s.y, backgroundColor: s.color, zIndex: 10 }}
          >
            {editSticky === s.id ? (
              <>
                <textarea
                  autoFocus
                  value={s.text}
                  onChange={(e) => updateSticky(s.id, e.target.value)}
                  onBlur={() => setEditSticky(null)}
                  className="flex-1 bg-transparent text-xs resize-none outline-none text-gray-800"
                  rows={4}
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); deleteSticky(s.id); }}
                  className="self-end text-[10px] text-red-700 hover:underline"
                >
                  Delete
                </button>
              </>
            ) : (
              <p
                className="text-xs text-gray-800 whitespace-pre-wrap cursor-pointer select-none"
                onClick={() => setEditSticky(s.id)}
              >
                {s.text}
              </p>
            )}
          </div>
        ))}

        {/* ── Inline text input ────────────────────────────────────────── */}
        {textInput.visible && (
          <input
            autoFocus
            value={textInput.value}
            onChange={(e) => setTextInput((t) => ({ ...t, value: e.target.value }))}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitText();
              if (e.key === 'Escape') setTextInput({ visible: false, x: 0, y: 0, value: '' });
            }}
            className="absolute bg-transparent outline-none border-b-2 border-blue-500 text-gray-900 z-20"
            style={{
              left: textInput.x,
              top:  textInput.y - (size * 2 + 6),
              fontSize: size * 4 + 12,
              color,
              minWidth: 120,
            }}
            placeholder="Type here…"
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleImageFile}
      />
    </div>
  );
};

export default Whiteboard;
