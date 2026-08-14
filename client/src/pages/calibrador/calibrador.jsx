import { useCallback, useEffect, useRef, useState } from "react";

const FPS = 23.98;

// ── SRT PARSER (detecta Litchi y DJI bracket) ──
function parseSRT(text) {
  const clean = text.replace(/<[^>]+>/g, "");
  const entries = [];
  const blocks = clean.trim().split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;
    const tm = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!tm) continue;
    const t = +tm[1] * 3600 + +tm[2] * 60 + +tm[3] + +tm[4] / 1000;
    const c = lines.slice(2).join(" ");
    // Litchi
    const gps = c.match(/GPS\(([^,]+),([^,]+),([^)]+)\)/);
    const baro = c.match(/BAROMETER:([0-9.]+)/);
    if (gps) {
      entries.push({ t, altBaro: baro ? parseFloat(baro[1]) : parseFloat(gps[3]) });
      continue;
    }
    // DJI bracket
    const rel = c.match(/\[rel_alt\s*:\s*([\-0-9.]+)/i);
    const abs = c.match(/\[abs_alt\s*:\s*([\-0-9.]+)/i);
    if (rel || abs) {
      entries.push({ t, altBaro: rel ? Math.abs(parseFloat(rel[1])) : parseFloat(abs[1]) });
    }
  }
  return entries;
}

function getAltitude(altManualStr, srtData, timeSec) {
  const manual = parseFloat(altManualStr);
  if (!isNaN(manual) && manual > 0) return manual;
  if (!srtData.length) return null;
  let best = srtData[0];
  for (const e of srtData) {
    if (e.t <= timeSec) best = e;
    else break;
  }
  return best.altBaro;
}

function formatTime(s) {
  if (isNaN(s)) return "00:00:00";
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), Math.floor(s % 60)]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

const STEPS_TEXT = [
  "Cargar un video estacionario del drone con el drone inmóvil sobre la marca. Cargar el SRT correspondiente.",
  "Pausar en el fotograma donde la marca se vea horizontal y completa.",
  "Ingresar el largo real de la marca en metros.",
  "Hacer clic en el extremo izquierdo de la marca.",
  "Hacer clic en el extremo derecho de la marca.",
  "El FOV H se calcula automáticamente.",
];

export default function FOVCalibrator() {
  // ── file / video state ──
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoFileName, setVideoFileName] = useState("—");
  const [videoRes, setVideoRes] = useState("—");

  // ── telemetry ──
  const [srtData, setSrtData] = useState([]);
  const [srtStatus, setSrtStatus] = useState("—");

  // ── params ──
  const [markLen, setMarkLen] = useState("10");
  const [resW, setResW] = useState(2720);
  const [resH, setResH] = useState(1530);
  const [resWTag, setResWTag] = useState("manual");
  const [resHTag, setResHTag] = useState("manual");
  const [altManual, setAltManual] = useState("");

  // ── measurement state ──
  const [clickState, setClickState] = useState(0); // 0 esperando pausa, 1 esperando clic1, 2 esperando clic2
  const [step, setStep] = useState(1);
  const [pt1, setPt1] = useState(null);
  const [pt2, setPt2] = useState(null);
  const [history, setHistory] = useState([]);
  const [resultEntry, setResultEntry] = useState(null);
  const [resultError, setResultError] = useState(null);

  // ── video controls ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(NaN);
  const [playbackRate, setPlaybackRate] = useState(1);

  // ── toast ──
  const [toast, setToast] = useState({ msg: "", show: false });
  const toastTimer = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  }, []);

  // ── canvas overlay drawing ──
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pt1 && !pt2) return;

    const sx = canvas.width / resW;
    const sy = canvas.height / resH;

    function dot(pt, color, label) {
      const x = pt.realX * sx,
        y = pt.realY * sy;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 5;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1;
      [
        [x - 18, y, x - 9, y],
        [x + 9, y, x + 18, y],
        [x, y - 18, x, y - 9],
        [x, y + 9, x, y + 18],
      ].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, y);
    }

    if (pt1) dot(pt1, "#fbbf24", "A");

    if (pt1 && pt2) {
      dot(pt2, "#fbbf24", "B");
      const x1 = pt1.realX * sx,
        y1 = pt1.realY * sy;
      const x2 = pt2.realX * sx,
        y2 = pt2.realY * sy;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 4;
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      const mx = (x1 + x2) / 2,
        my = (y1 + y2) / 2;
      const dxPx = Math.abs(pt2.realX - pt1.realX);
      const dyPx = Math.abs(pt2.realY - pt1.realY);
      const distPx = Math.sqrt(dxPx * dxPx + dyPx * dyPx).toFixed(0);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#000";
      ctx.fillRect(mx - 36, my - 11, 72, 18);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${distPx} px`, mx, my);
      ctx.restore();
    }
  }, [pt1, pt2, resW, resH]);

  const resizeCanvas = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!video || !canvas || !wrap) return;
    const rect = video.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    const wr = wrap.getBoundingClientRect();
    canvas.style.left = rect.left - wr.left + "px";
    canvas.style.top = rect.top - wr.top + "px";
    drawOverlay();
  }, [drawOverlay]);

  useEffect(() => {
    resizeCanvas();
  }, [pt1, pt2, resW, resH, videoUrl, resizeCanvas]);

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // ── file loaders ──
  function handleVideoFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setVideoUrl(url);
    setVideoFileName(f.name);
    setPt1(null);
    setPt2(null);
    setResultEntry(null);
    setResultError(null);
    setClickState(1);
    setStep(1);
  }

  function handleLoadedMetadata(e) {
    const video = e.target;
    const vw = video.videoWidth,
      vh = video.videoHeight;
    if (vw && vh) {
      setResW(vw);
      setResH(vh);
      setResWTag("auto");
      setResHTag("auto");
      setVideoRes(`${vw}×${vh}`);
    }
    setDuration(video.duration);
    resizeCanvas();
  }

  function handleSrtFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseSRT(ev.target.result);
      setSrtData(parsed);
      setSrtStatus(`${f.name} · ${parsed.length} pts`);
      showToast(`SRT cargado · ${parsed.length} registros`);
    };
    reader.readAsText(f, "utf-8");
  }

  // ── video controls ──
  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function stepFrame(dir) {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime += dir / FPS;
  }

  function handleSpeedChange(e) {
    const v = parseFloat(e.target.value);
    setPlaybackRate(v);
    if (videoRef.current) videoRef.current.playbackRate = v;
  }

  function handleProgressClick(e) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    video.currentTime = ((e.clientX - r.left) / r.width) * video.duration;
  }

  function handleTimeUpdate(e) {
    setCurrentTime(e.target.currentTime);
  }

  function handleVideoPause() {
    setIsPlaying(false);
    if (clickState === 0 && pt1 === null) {
      setClickState(1);
      setStep(4);
    }
  }

  function handleVideoPlay() {
    setIsPlaying(true);
    if (clickState === 1 && pt1 === null) {
      setStep(2);
    }
    setClickState(0);
    setPt1(null);
    setPt2(null);
  }

  function handleVideoClick(e) {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    if (clickState === 0) return;

    const rect = video.getBoundingClientRect();
    const dispX = e.clientX - rect.left;
    const dispY = e.clientY - rect.top;
    const realX = dispX * (resW / rect.width);
    const realY = dispY * (resH / rect.height);

    if (clickState === 1) {
      setPt1({ dispX, dispY, realX, realY });
      setClickState(2);
      setStep(5);
    } else if (clickState === 2) {
      const newPt2 = { dispX, dispY, realX, realY };
      setPt2(newPt2);
      setClickState(0);
      setStep(6);
      calculateFOV(pt1, newPt2);
    }
  }

  // ── FOV calculation ──
  function calculateFOV(p1, p2) {
    if (!p1 || !p2) return;
    const video = videoRef.current;
    const alt = getAltitude(altManual, srtData, video.currentTime);

    if (!alt || alt <= 0) {
      setResultEntry(null);
      setResultError("Sin altitud — ingresá la altitud manualmente");
      return;
    }
    const mLen = parseFloat(markLen);
    if (!mLen || mLen <= 0) {
      setResultEntry(null);
      setResultError("Ingresá el largo de la marca en metros");
      return;
    }

    const dxPx = Math.abs(p2.realX - p1.realX);
    const dyPx = Math.abs(p2.realY - p1.realY);
    const distPx = Math.sqrt(dxPx * dxPx + dyPx * dyPx);

    if (distPx < 5) {
      setResultEntry(null);
      setResultError("Los dos clics están muy cerca — repetir la medición");
      return;
    }

    const frameWidthM = mLen * (resW / distPx);
    const fovH = (2 * Math.atan(frameWidthM / (2 * alt)) * 180) / Math.PI;
    const fovV = (2 * Math.atan(Math.tan((fovH * Math.PI) / 360) * (resH / resW)) * 180) / Math.PI;

    const entry = {
      fovH: fovH.toFixed(2),
      fovV: fovV.toFixed(2),
      alt: alt.toFixed(1),
      markLen: mLen,
      distPx: distPx.toFixed(1),
      frameWidthM: frameWidthM.toFixed(2),
      time: video.currentTime.toFixed(1),
    };

    setHistory((h) => [...h, entry]);
    setResultEntry(entry);
    setResultError(null);
    showToast(`FOV H = ${fovH.toFixed(2)}°`);
  }

  function copyResult() {
    if (!history.length) return;
    const last = history[history.length - 1];
    navigator.clipboard.writeText(last.fovH).then(() => showToast(`FOV H ${last.fovH}° copiado al portapapeles`));
  }

  function resetMeasurement() {
    setPt1(null);
    setPt2(null);
    setResultEntry(null);
    setResultError(null);
    const video = videoRef.current;
    if (video && video.paused && videoUrl) {
      setClickState(1);
      setStep(4);
    } else {
      setClickState(0);
      setStep(2);
    }
  }

  // ── hint ──
  function getHint() {
    if (clickState === 0 && !videoUrl) return { text: "Cargá un video para comenzar", sub: "" };
    if (clickState === 0 && isPlaying)
      return { text: "Reproducí y pausá en el fotograma correcto", sub: "La marca debe verse horizontal y completa" };
    if (clickState === 0) return { text: "Presioná play para reproducir o usá los botones de frame", sub: "" };
    if (clickState === 1)
      return {
        text: "Clic 1 — extremo izquierdo de la marca (punto A)",
        sub: "La marca debe estar perpendicular a la trayectoria de vuelo",
      };
    if (clickState === 2)
      return {
        text: "Clic 2 — extremo derecho de la marca (punto B)",
        sub: pt1 ? `Punto A registrado en (${pt1.realX.toFixed(0)}, ${pt1.realY.toFixed(0)}) px` : "",
      };
    return { text: "Medición completada", sub: "Podés hacer nuevas mediciones sobre el mismo fotograma" };
  }
  const hint = getHint();

  const currentAlt = getAltitude(altManual, srtData, currentTime);
  const avgFov = history.length > 1 ? (history.reduce((s, h) => s + parseFloat(h.fovH), 0) / history.length).toFixed(2) : null;

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden bg-[#0f1117] text-[#e8eaf0] text-sm"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <style>{`
        .fov-scroll::-webkit-scrollbar{width:4px;}
        .fov-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px;}
        .fov-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;}
      `}</style>

      {/* HEADER */}
      <header className="bg-[#1a1d27] border-b border-[rgba(255,255,255,0.08)] px-4 py-[10px] flex items-center gap-3 flex-shrink-0">
        <div>
          <div className="text-[11px] font-bold tracking-[2px] uppercase text-[#4ade80]">EcoFluvial</div>
          <div className="text-[15px] font-semibold">FOV Calibrator</div>
          <div className="text-[11px] text-[#8b90a8] mt-[1px]">Calibración empírica del campo visual de la cámara</div>
        </div>
        <div className="bg-[rgba(251,191,36,0.15)] border border-[#fbbf24] rounded-[20px] px-[10px] py-[3px] text-[10px] text-[#fbbf24] font-bold tracking-[1px]">
          CALIBRACIÓN
        </div>
        <div className="flex-1" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="fov-scroll w-[280px] flex-shrink-0 bg-[#1a1d27] border-r border-[rgba(255,255,255,0.08)] flex flex-col overflow-y-auto">
          {/* Video de calibración */}
          <div className="p-[14px] border-b border-[rgba(255,255,255,0.08)]">
            <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-2">Video de calibración</h3>
            <label className="relative block bg-[#22263a] border border-dashed border-[rgba(255,255,255,0.15)] rounded-[10px] py-[7px] px-3 cursor-pointer text-center text-xs overflow-hidden mb-1 transition-colors hover:border-[#4ade80] hover:bg-[rgba(74,222,128,0.05)]">
              Seleccionar video
              <input type="file" accept="video/*" onChange={handleVideoFile} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
            </label>
            <div className="text-[10px] text-[#4ade80] min-h-[13px] whitespace-nowrap overflow-hidden text-ellipsis">{videoFileName}</div>
          </div>

          {/* Telemetría */}
          <div className="p-[14px] border-b border-[rgba(255,255,255,0.08)]">
            <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-2">Telemetría</h3>
            <label className="relative block bg-[#22263a] border border-dashed border-[rgba(255,255,255,0.15)] rounded-[10px] py-[7px] px-3 cursor-pointer text-center text-xs overflow-hidden mb-1 transition-colors hover:border-[#4ade80] hover:bg-[rgba(74,222,128,0.05)]">
              Seleccionar SRT
              <input type="file" accept=".srt,.txt" onChange={handleSrtFile} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
            </label>
            <div className="text-[10px] text-[#4ade80] min-h-[13px] whitespace-nowrap overflow-hidden text-ellipsis">{srtStatus}</div>
            <div className="flex gap-2.5 flex-wrap mt-1.5">
              <div className="flex gap-1 items-center text-[11px]">
                <span className="text-[#8b90a8]">Alt</span>
                <span className="text-[#4ade80] font-mono font-semibold">{currentAlt !== null ? currentAlt.toFixed(1) : "—"}</span> m
              </div>
              <div className="flex gap-1 items-center text-[11px]">
                <span className="text-[#8b90a8]">Res.</span>
                <span className="text-[#4ade80] font-mono font-semibold">{videoRes}</span>
              </div>
            </div>
          </div>

          {/* Parámetros */}
          <div className="p-[14px] border-b border-[rgba(255,255,255,0.08)]">
            <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-2">Parámetros</h3>
            <div className="flex items-center justify-between mb-[5px]">
              <label className="text-[11px] text-[#8b90a8]">Largo de marca (m)</label>
              <input
                type="number"
                value={markLen}
                step="0.1"
                min="0.1"
                onChange={(e) => setMarkLen(e.target.value)}
                className="w-20 bg-[#22263a] border border-[rgba(255,255,255,0.08)] rounded-md px-[6px] py-[3px] text-[#e8eaf0] text-xs text-right focus:outline-none focus:border-[#4ade80]"
              />
            </div>
            <div className="flex items-center justify-between mb-[5px]">
              <label className="text-[11px] text-[#8b90a8]">
                Res. ancho (px) <span className="text-[9px] text-[#4ade80] opacity-70">{resWTag}</span>
              </label>
              <input
                type="number"
                value={resW}
                onChange={(e) => setResW(parseFloat(e.target.value) || 0)}
                className="w-20 bg-[#22263a] border border-[rgba(255,255,255,0.08)] rounded-md px-[6px] py-[3px] text-[#e8eaf0] text-xs text-right focus:outline-none focus:border-[#4ade80]"
              />
            </div>
            <div className="flex items-center justify-between mb-[5px]">
              <label className="text-[11px] text-[#8b90a8]">
                Res. alto (px) <span className="text-[9px] text-[#4ade80] opacity-70">{resHTag}</span>
              </label>
              <input
                type="number"
                value={resH}
                onChange={(e) => setResH(parseFloat(e.target.value) || 0)}
                className="w-20 bg-[#22263a] border border-[rgba(255,255,255,0.08)] rounded-md px-[6px] py-[3px] text-[#e8eaf0] text-xs text-right focus:outline-none focus:border-[#4ade80]"
              />
            </div>
            <div className="flex items-center justify-between mb-[5px]">
              <label className="text-[11px] text-[#8b90a8]">
                Altitud manual (m) <span className="text-[9px] text-[#4ade80] opacity-70">desde SRT</span>
              </label>
              <input
                type="number"
                value={altManual}
                step="0.5"
                placeholder="auto"
                onChange={(e) => setAltManual(e.target.value)}
                className="w-20 bg-[#22263a] border border-[rgba(255,255,255,0.08)] rounded-md px-[6px] py-[3px] text-[#e8eaf0] text-xs text-right focus:outline-none focus:border-[#4ade80]"
              />
            </div>
          </div>

          {/* Instrucciones */}
          <div className="p-[14px] border-b border-[rgba(255,255,255,0.08)]">
            <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-2">Instrucciones</h3>
            {STEPS_TEXT.map((text, i) => {
              const n = i + 1;
              const state = n < step ? "done" : n === step ? "active" : "default";
              return (
                <div key={n} className="flex items-start gap-2.5 mb-2.5">
                  <div
                    className={
                      "rounded-full w-[22px] h-[22px] flex-shrink-0 flex items-center justify-center text-[11px] font-bold border " +
                      (state === "active"
                        ? "bg-[#4ade80] border-[#22c55e] text-black"
                        : state === "done"
                        ? "bg-[#60a5fa] border-[#60a5fa] text-black"
                        : "bg-[#22263a] border-[rgba(255,255,255,0.08)] text-[#8b90a8]")
                    }
                  >
                    {n}
                  </div>
                  <div className={"text-[11px] leading-[1.5] pt-[2px] " + (state === "active" ? "text-[#e8eaf0]" : "text-[#8b90a8]")}>
                    {text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resultado */}
          <div className="p-[14px] border-b border-[rgba(255,255,255,0.08)]">
            <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-2">Resultado</h3>
            <div className="bg-[#22263a] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-[14px] mt-1">
              <div className="text-[10px] text-[#8b90a8] uppercase tracking-[1px] mb-1">FOV Horizontal</div>
              <div className={"text-[28px] font-bold font-mono " + (resultError ? "text-[#fbbf24]" : "text-[#4ade80]")}>
                {resultError ? "!" : resultEntry ? `${resultEntry.fovH}°` : "—"}
              </div>
              <div className="text-[10px] text-[#8b90a8] mt-1 leading-[1.6]">
                {resultError ? (
                  resultError
                ) : resultEntry ? (
                  <>
                    FOV V: <b>{resultEntry.fovV}°</b>
                    <br />
                    Altitud: {resultEntry.alt} m<br />
                    Marca: {resultEntry.markLen} m = {resultEntry.distPx} px<br />
                    Ancho frame: {resultEntry.frameWidthM} m
                  </>
                ) : (
                  "Digitalizar la marca para calcular"
                )}
              </div>
            </div>
            {resultEntry && (
              <button
                onClick={copyResult}
                className="w-full bg-[rgba(74,222,128,0.1)] border border-[#22c55e] rounded-[10px] py-2 text-[#4ade80] text-xs font-semibold mt-1.5 transition-colors hover:bg-[rgba(74,222,128,0.2)]"
              >
                Copiar FOV H
              </button>
            )}
            <button
              onClick={resetMeasurement}
              className="w-full bg-[rgba(248,113,113,0.1)] border border-[#f87171] rounded-[10px] py-2 text-[#f87171] text-xs font-semibold mt-2 transition-colors hover:bg-[rgba(248,113,113,0.2)]"
            >
              Reiniciar medición
            </button>
          </div>

          {/* Historial */}
          <div className="p-[14px] border-b border-[rgba(255,255,255,0.08)]">
            <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-2">Historial de mediciones</h3>
            <div className="text-[10px] text-[#8b90a8] leading-[2]">
              {history.length === 0 ? (
                "Sin mediciones aún"
              ) : (
                <>
                  {history.map((h, i) => (
                    <div key={i}>
                      <span className="text-[#e8eaf0]">#{i + 1}</span>{" "}
                      <span className="text-[#4ade80] font-mono">{h.fovH}°</span>{" "}
                      <span className="text-[#8b90a8]">
                        @ {h.alt}m · {h.time}s
                      </span>
                    </div>
                  ))}
                  {avgFov && <div className="text-[#fbbf24]">Media: {avgFov}°</div>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* CENTER VIDEO */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          <div ref={wrapRef} className="flex-1 relative flex items-center justify-center overflow-hidden">
            {!videoUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#8b90a8]">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <p className="text-[13px]">Cargá un video estacionario para comenzar</p>
              </div>
            )}
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                preload="auto"
                onLoadedMetadata={handleLoadedMetadata}
                onDurationChange={(e) => setDuration(e.target.duration)}
                onTimeUpdate={handleTimeUpdate}
                onPause={handleVideoPause}
                onPlay={handleVideoPlay}
                onClick={handleVideoClick}
                className={"max-w-full max-h-full block select-none " + (clickState !== 0 ? "cursor-crosshair" : "cursor-pointer")}
              />
            )}
            <canvas ref={canvasRef} className="absolute top-0 left-0 pointer-events-none" />
          </div>

          <div className="bg-[#1a1d27] border-t border-[rgba(255,255,255,0.08)] px-[14px] py-2 flex flex-col gap-1.5 flex-shrink-0">
            <div onClick={handleProgressClick} className="relative h-[5px] bg-[#22263a] rounded-[3px] cursor-pointer">
              <div
                className="h-full bg-[#fbbf24] rounded-[3px] pointer-events-none"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={togglePlay}
                className="bg-[#fbbf24] border-none rounded-full w-[30px] h-[30px] cursor-pointer text-black text-[13px] flex items-center justify-center flex-shrink-0 hover:opacity-85"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <span className="font-mono text-xs text-[#e8eaf0] min-w-[100px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                onClick={() => stepFrame(-1)}
                className="bg-[#22263a] border border-[rgba(255,255,255,0.08)] rounded-md px-2 py-[3px] text-[#e8eaf0] text-[11px] cursor-pointer hover:border-[#fbbf24] hover:text-[#fbbf24]"
              >
                ◀ 1f
              </button>
              <button
                onClick={() => stepFrame(1)}
                className="bg-[#22263a] border border-[rgba(255,255,255,0.08)] rounded-md px-2 py-[3px] text-[#e8eaf0] text-[11px] cursor-pointer hover:border-[#fbbf24] hover:text-[#fbbf24]"
              >
                1f ▶
              </button>
              <div className="flex-1" />
              <select
                value={playbackRate}
                onChange={handleSpeedChange}
                className="bg-[#22263a] border border-[rgba(255,255,255,0.08)] rounded-md text-[#e8eaf0] text-[11px] px-[5px] py-[2px] cursor-pointer"
              >
                <option value="0.25">0.25×</option>
                <option value="0.5">0.5×</option>
                <option value="1">1×</option>
              </select>
            </div>
            <div className="flex gap-3.5 text-[11px] py-[2px] items-center">
              <span className="text-[#fbbf24] font-semibold">{hint.text}</span>
              <span className="text-[#8b90a8]">{hint.sub}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      <div
        className={
          "fixed bottom-5 right-5 bg-[#22263a] border border-[#4ade80] rounded-[10px] px-4 py-[10px] text-[13px] text-[#4ade80] z-[100] max-w-[280px] pointer-events-none transition-opacity " +
          (toast.show ? "opacity-100" : "opacity-0")
        }
      >
        {toast.msg}
      </div>
    </div>
  );
}