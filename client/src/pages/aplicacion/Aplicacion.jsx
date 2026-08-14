import React, { useState, useRef, useEffect } from "react";

/* ════════════════════════════════════════════
   CONSTANTES
   ════════════════════════════════════════════ */
const FPS = 23.98;
const MIN_DISP_M = 2.0;

const DEFAULT_CONFIG = {
  projectName: "Drone Video Mapper",
  subtitle: "Heading GPS · Brújula · Multi-SRT",
  exportName: "registros_drone",
  numCats: 3,
  label1: "Tipo / objeto",
  label2: "Estado",
  label3: "Clase / tamaño",
  cats1: [
    { name: "— sin identificar —", alert: false },
    { name: "Objeto A", alert: false },
    { name: "Objeto B (alerta)", alert: true },
  ],
  cats2: [
    { name: "— no evaluado —", alert: false },
    { name: "Estado 1", alert: false },
    { name: "Estado 2", alert: false },
  ],
  cats3: [
    { name: "— no evaluado —", alert: false },
    { name: "Clase 1", alert: false },
    { name: "Clase 2", alert: false },
  ],
};

const DRONES = {
  mavic_pro: { fovH: 61, label: "Mavic Pro — FOV H 61°" },
  mavic_mini3: { fovH: 82.1, label: "Mini 3 Pro — FOV H 82.1°" },
  mavic_air2s: { fovH: 88, label: "Air 2S — FOV H 88°" },
  mavic_3: { fovH: 84, label: "Mavic 3 — FOV H 84°" },
  phantom4: { fovH: 84, label: "Phantom 4 Pro — FOV H 84°" },
};

function loadConfig() {
  try {
    const saved = localStorage.getItem("dvm_config_v5");
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

/* ════════════════════════════════════════════
   HELPERS PUROS (heading, SRT, geo)
   ════════════════════════════════════════════ */
function distMeters(a, b) {
  const dLat = (b.lat - a.lat) * 111320;
  const dLon = (b.lon - a.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function computeHeadings(data, N) {
  let lastH = 0;
  for (let i = 0; i < data.length; i++) {
    const ia = Math.max(0, i - N),
      ib = Math.min(data.length - 1, i + N);
    const a = data[ia],
      b = data[ib],
      dist = distMeters(a, b);
    if (dist < MIN_DISP_M) {
      data[i].heading = lastH;
    } else {
      const hdg =
        (Math.atan2((b.lon - a.lon) * Math.cos((a.lat * Math.PI) / 180), b.lat - a.lat) * 180) /
        Math.PI;
      data[i].heading = lastH = (hdg + 360) % 360;
    }
  }
}

function parseBlocks(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
}

function parseTS(line) {
  const m = line.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : null;
}

function detectFormat(text) {
  if (/GPS\([^)]+\)/.test(text) && /BAROMETER/.test(text)) return "litchi";
  if (/\[latitude\s*:/.test(text) && /\[longitude\s*:/.test(text)) return "dji_bracket";
  return "unknown";
}

function parseLitchi(text) {
  const entries = [];
  for (const block of parseBlocks(text)) {
    const lines = block.split("\n");
    if (lines.length < 3) continue;
    const t = parseTS(lines[1]);
    if (t === null) continue;
    const c = lines.slice(2).join(" ");
    const gps = c.match(/GPS\(([^,]+),([^,]+),([^)]+)\)/);
    const baro = c.match(/BAROMETER:([0-9.]+)/);
    const iso = c.match(/ISO:(\d+)/);
    const fnum = c.match(/Fnum:([0-9.]+)/);
    if (!gps) continue;
    entries.push({
      t,
      lon: parseFloat(gps[1]),
      lat: parseFloat(gps[2]),
      altGPS: parseFloat(gps[3]),
      altBaro: baro ? parseFloat(baro[1]) : null,
      iso: iso ? iso[1] : null,
      fnum: fnum ? fnum[1] : null,
    });
  }
  return entries;
}

function parseDJIBracket(text) {
  const entries = [];
  const gb = (s, k) => {
    const m = s.match(new RegExp("\\[" + k + "\\s*:\\s*([\\-0-9.]+)", "i"));
    return m ? parseFloat(m[1]) : null;
  };
  for (const block of parseBlocks(text)) {
    const lines = block.split("\n");
    if (lines.length < 3) continue;
    const t = parseTS(lines[1]);
    if (t === null) continue;
    const c = lines.slice(2).join(" ");
    const lat = gb(c, "latitude"),
      lon = gb(c, "longitude");
    if (lat === null || lon === null) continue;
    const relAlt = gb(c, "rel_alt"),
      absAlt = gb(c, "abs_alt");
    const iso = gb(c, "iso"),
      fnum = gb(c, "fnum");
    entries.push({
      t,
      lat,
      lon,
      altGPS: absAlt ?? Math.abs(relAlt ?? 0),
      altBaro: relAlt !== null ? Math.abs(relAlt) : null,
      iso: iso !== null ? String(Math.round(iso)) : null,
      fnum: fnum !== null ? String(fnum) : null,
    });
  }
  return entries;
}

function getTelemetryAt(srtData, timeSec, offset) {
  if (!srtData.length) return null;
  const t = timeSec + offset;
  let before = null,
    after = null;
  for (let i = 0; i < srtData.length; i++) {
    if (srtData[i].t <= t) before = srtData[i];
    if (srtData[i].t > t && !after) after = srtData[i];
  }
  if (!before) return { ...srtData[0], interpolated: false, alpha: 0 };
  if (!after) return { ...before, interpolated: false, alpha: 0 };
  const span = after.t - before.t,
    alpha = span > 0 ? (t - before.t) / span : 0;
  const lerp = (a, b) => a + (b - a) * alpha;
  return {
    t,
    lat: lerp(before.lat, after.lat),
    lon: lerp(before.lon, after.lon),
    altGPS: lerp(before.altGPS, after.altGPS),
    altBaro:
      before.altBaro !== null && after.altBaro !== null
        ? lerp(before.altBaro, after.altBaro)
        : before.altBaro ?? after.altBaro ?? null,
    iso: before.iso,
    fnum: before.fnum,
    interpolated: alpha > 0.005 && alpha < 0.995,
    alpha,
  };
}

function getHeadingAt(srtData, timeSec, offset) {
  if (!srtData.length) return 0;
  const t = timeSec + offset;
  let before = null,
    after = null;
  for (let i = 0; i < srtData.length; i++) {
    if (srtData[i].t <= t) before = srtData[i];
    if (srtData[i].t > t && !after) after = srtData[i];
  }
  if (!before) return srtData[0].heading || 0;
  if (!after) return before.heading || 0;
  const span = after.t - before.t,
    alpha = span > 0 ? (t - before.t) / span : 0;
  let h1 = before.heading || 0,
    h2 = after.heading || 0,
    diff = h2 - h1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (h1 + diff * alpha + 360) % 360;
}

function pixelToGPS(clickX, clickY, dispW, dispH, telem, headingDeg, fovHdeg, fovVdeg, resW, resH) {
  const fovH = (fovHdeg * Math.PI) / 180;
  const fovV = (fovVdeg * Math.PI) / 180;
  const alt = telem.altBaro !== null && telem.altBaro !== undefined ? telem.altBaro : telem.altGPS;
  const footW = 2 * alt * Math.tan(fovH / 2),
    footH = 2 * alt * Math.tan(fovV / 2);
  const realX = clickX * (resW / dispW),
    realY = clickY * (resH / dispH);
  const dxFrame = ((realX - resW / 2) / resW) * footW;
  const dyFrame = -((realY - resH / 2) / resH) * footH;
  const hdgRad = (headingDeg * Math.PI) / 180;
  const dEast = dxFrame * Math.cos(hdgRad) + dyFrame * Math.sin(hdgRad);
  const dNorth = -dxFrame * Math.sin(hdgRad) + dyFrame * Math.cos(hdgRad);
  return {
    lat: telem.lat + dNorth / 111320,
    lon: telem.lon + dEast / (111320 * Math.cos((telem.lat * Math.PI) / 180)),
    alt,
    droneLat: telem.lat,
    droneLon: telem.lon,
    interpolated: telem.interpolated,
    alpha: telem.alpha,
    heading: headingDeg,
  };
}

function computeFovV(fovHdeg, w, h) {
  if (!fovHdeg || !w || !h) return { fovV: 0, note: "" };
  const fovV = (2 * Math.atan(Math.tan((fovHdeg * Math.PI) / 360) * (h / w)) * 180) / Math.PI;
  return {
    fovV: parseFloat(fovV.toFixed(2)),
    note: `FOV V = ${fovV.toFixed(2)}°  (${w}×${h}, ratio ${(w / h).toFixed(3)})`,
  };
}

function formatTime(s) {
  if (isNaN(s)) return "00:00:00";
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), Math.floor(s % 60)]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function download(filename, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + content], { type }));
  a.download = filename;
  a.click();
}

/* ════════════════════════════════════════════
   ESTILO GLOBAL COMPARTIDO (scrollbar unificada
   con el FOV Calibrator — misma clase "fov-scroll")
   ════════════════════════════════════════════ */
function ScrollbarStyle() {
  return (
    <style>{`
      .fov-scroll::-webkit-scrollbar{width:4px;}
      .fov-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px;}
      .fov-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;}
    `}</style>
  );
}

/* ════════════════════════════════════════════
   SUB-COMPONENTES DE UI
   ════════════════════════════════════════════ */
function ParamRow({ label, tag, children }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <label className="text-[11px] text-[#8b90a8]">
        {label} {tag && <span className="text-[9px] text-[#4ade80] opacity-70">{tag}</span>}
      </label>
      {children}
    </div>
  );
}

function ChRow({ label, active, onClick }) {
  return (
    <div className="flex items-center justify-between mb-[5px]">
      <label className="text-[11px] text-[#8b90a8]">{label}</label>
      <div
        onClick={onClick}
        className={`select-none border rounded-md px-[10px] py-[2px] text-[10px] cursor-pointer transition-all ${
          active
            ? "border-[#4ade80] text-[#4ade80] bg-[#4ade80]/10"
            : "border-white/10 bg-[#22263a] text-[#8b90a8]"
        }`}
      >
        {active ? "ON" : "OFF"}
      </div>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="bg-[#22263a] border border-white/10 rounded-full px-[10px] py-[3px] text-[11px] text-[#8b90a8]">
      {label}: <span className="text-[#4ade80] font-bold">{value}</span>
    </div>
  );
}

function TelemItem({ label, value, unit, interpolated }) {
  return (
    <div className="flex gap-1 items-center">
      <span className="text-[#8b90a8]">{label}</span>
      <span className={`font-mono font-semibold ${interpolated ? "text-[#60a5fa]" : "text-[#4ade80]"}`}>
        {value}
      </span>
      {unit && <span>&nbsp;{unit}</span>}
    </div>
  );
}

/* ════════════════════════════════════════════
   APP
   ════════════════════════════════════════════ */
export default function App() {
  /* ---------- estado ---------- */
  const [cfg, setCfg] = useState(() => loadConfig());

  const [trees, setTrees] = useState([]);
  const [srtData, setSrtData] = useState([]);
  const [srtFormat, setSrtFormat] = useState("unknown");
  const [srtStatus, setSrtStatus] = useState("—");
  const [videoStatus, setVideoStatus] = useState("—");
  const [videoReady, setVideoReady] = useState(false);
  const [interpBadge, setInterpBadge] = useState(null); // {on, text}

  const [chCenter, setChCenter] = useState(false);
  const [chQuad, setChQuad] = useState(false);
  const [chScale, setChScale] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [allDots, setAllDots] = useState([]);

  const [smoothWindow, setSmoothWindow] = useState(5);
  const [smoothNote, setSmoothNote] = useState("Ventana: ±5 registros SRT");

  const [droneSelect, setDroneSelect] = useState("custom");
  const [fovH, setFovH] = useState(61);
  const [fovV, setFovV] = useState(36.7);
  const [resW, setResW] = useState(2720);
  const [resH, setResH] = useState(1530);
  const [resWAuto, setResWAuto] = useState(false);
  const [resHAuto, setResHAuto] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);
  const [fovNote, setFovNote] = useState("Editá FOV H → V se recalcula solo.");

  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [timeDisplay, setTimeDisplay] = useState("00:00:00 / 00:00:00");
  const [timeHeader, setTimeHeader] = useState("00:00:00");
  const [progressPct, setProgressPct] = useState(0);
  const [telem, setTelem] = useState({
    lat: "—",
    lon: "—",
    alt: "—",
    iso: "—",
    fnum: "—",
    interpText: "—",
    interpolated: false,
    footW: "—",
    heading: "—",
  });

  const [clickHintVisible, setClickHintVisible] = useState(false);
  const [toast, setToast] = useState({ msg: "", visible: false });

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTree, setPendingTree] = useState(null);
  const [cat1, setCat1] = useState("");
  const [cat2, setCat2] = useState("");
  const [cat3, setCat3] = useState("");
  const [notes, setNotes] = useState("");

  const [configOpen, setConfigOpen] = useState(false);
  const [cfgDraft, setCfgDraft] = useState(null);

  /* ---------- refs (espejo mutable para listeners nativos) ---------- */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const srtDataRef = useRef(srtData);
  const allDotsRef = useRef(allDots);
  const showDotsRef = useRef(showDots);
  const chCenterRef = useRef(chCenter);
  const chQuadRef = useRef(chQuad);
  const chScaleRef = useRef(chScale);
  const fovHRef = useRef(fovH);
  const fovVRef = useRef(fovV);
  const resWRef = useRef(resW);
  const resHRef = useRef(resH);
  const timeOffsetRef = useRef(timeOffset);
  const smoothWindowRef = useRef(smoothWindow);
  const videoReadyRef = useRef(videoReady);
  const cfgRef = useRef(cfg);

  // sincroniza refs en cada render (patrón "latest ref")
  srtDataRef.current = srtData;
  allDotsRef.current = allDots;
  showDotsRef.current = showDots;
  chCenterRef.current = chCenter;
  chQuadRef.current = chQuad;
  chScaleRef.current = chScale;
  fovHRef.current = fovH;
  fovVRef.current = fovV;
  resWRef.current = resW;
  resHRef.current = resH;
  timeOffsetRef.current = timeOffset;
  smoothWindowRef.current = smoothWindow;
  videoReadyRef.current = videoReady;
  cfgRef.current = cfg;

  /* ---------- título de la página ---------- */
  useEffect(() => {
    document.title = (cfg.projectName || "Drone Video Mapper") + " v5";
  }, [cfg.projectName]);

  /* ---------- toast / hint ---------- */
  function showToastMsg(msg) {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }
  function showHint() {
    setClickHintVisible(true);
    setTimeout(() => setClickHintVisible(false), 4000);
  }

  /* ---------- dibujo en canvas ---------- */
  function drawCH(ctx, x, y, size, color, label) {
    ctx.save();
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.93;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - 8, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + size, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (label) {
      ctx.shadowBlur = 7;
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.96;
      ctx.fillText(label, x + 10, y - 4);
    }
    ctx.restore();
  }

  function drawScaleBar(ctx, canvas) {
    const video = videoRef.current;
    if (!video) return;
    const t = getTelemetryAt(srtDataRef.current, video.currentTime, timeOffsetRef.current);
    if (!t) return;
    const alt = t.altBaro !== null && t.altBaro !== undefined ? t.altBaro : t.altGPS;
    const fovHrad = (fovHRef.current * Math.PI) / 180;
    const rW = resWRef.current;
    const footW = 2 * alt * Math.tan(fovHrad / 2);
    if (!footW || !rW) return;
    const pxPer10m = (10 / footW) * rW * (canvas.width / rW);
    if (pxPer10m < 4 || pxPer10m > canvas.width * 0.8) return;
    const H = canvas.height,
      barY = H - 22,
      barX = 16,
      tickH = 6;
    ctx.save();
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 5;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(barX, barY);
    ctx.lineTo(barX + pxPer10m, barY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(barX, barY - tickH);
    ctx.lineTo(barX, barY + tickH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(barX + pxPer10m, barY - tickH);
    ctx.lineTo(barX + pxPer10m, barY + tickH);
    ctx.stroke();
    const midX = barX + pxPer10m / 2;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(midX, barY - tickH * 0.6);
    ctx.lineTo(midX, barY + tickH * 0.6);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.92;
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("0", barX, barY - tickH - 1);
    ctx.fillText("5m", midX, barY - tickH - 1);
    ctx.fillText("10m", barX + pxPer10m, barY - tickH - 1);
    ctx.restore();
  }

  function drawCrosshairs(ctx, canvas) {
    const W = canvas.width,
      H = canvas.height;
    if (!W || !H) return;
    if (chCenterRef.current) drawCH(ctx, W / 2, H / 2, Math.min(W, H) * 0.08, "#ffffff", "Centro");
    if (chQuadRef.current) {
      const sz = Math.min(W, H) * 0.055;
      [
        { x: W / 4, y: H / 4 },
        { x: (W * 3) / 4, y: H / 4 },
        { x: W / 4, y: (H * 3) / 4 },
        { x: (W * 3) / 4, y: (H * 3) / 4 },
      ].forEach((p) => drawCH(ctx, p.x, p.y, sz, "#60a5fa", null));
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 5;
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "#60a5fa";
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (chScaleRef.current) drawScaleBar(ctx, canvas);
  }

  function drawCompass(ctx, canvas, headingDeg) {
    const W = canvas.width,
      R = 32,
      cx = W - R - 14,
      cy = R + 14;
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#0f1117";
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    [
      { a: 0, l: "N", c: "#f87171" },
      { a: 90, l: "E", c: "#8b90a8" },
      { a: 180, l: "S", c: "#8b90a8" },
      { a: 270, l: "O", c: "#8b90a8" },
    ].forEach(({ a, l, c }) => {
      const rad = ((a - headingDeg) * Math.PI) / 180;
      const tx = cx + Math.sin(rad) * (R - 5),
        ty = cy - Math.cos(rad) * (R - 5);
      ctx.fillStyle = c;
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(l, tx, ty);
    });
    const arrowLen = R * 0.62;
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#4ade80";
    ctx.fillStyle = "#4ade80";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - arrowLen);
    ctx.lineTo(cx - 5, cy - arrowLen + 10);
    ctx.lineTo(cx + 5, cy - arrowLen + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, cy - arrowLen + 10);
    ctx.lineTo(cx, cy + arrowLen * 0.4);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(headingDeg) + "°", cx, cy + R * 0.35);
    ctx.restore();
  }

  function drawDot(ctx, canvas, dot) {
    const sx = canvas.width / (dot.displayW || canvas.width),
      sy = canvas.height / (dot.displayH || canvas.height);
    const x = dot.x * sx,
      y = dot.y * sy;
    const col = dot.alert ? "#f87171" : "#4ade80";
    ctx.save();
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = dot.alert ? "rgba(248,113,113,0.55)" : "rgba(74,222,128,0.55)";
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    [
      [x - 14, y, x - 9, y],
      [x + 9, y, x + 14, y],
      [x, y - 14, x, y - 9],
      [x, y + 9, x, y + 14],
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    ctx.restore();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dot.id, x, y);
  }

  function drawLastDot(ctx, canvas) {
    if (showDotsRef.current) allDotsRef.current.forEach((d) => drawDot(ctx, canvas, d));
  }

  function redrawAll() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCrosshairs(ctx, canvas);
    const video = videoRef.current;
    const hdg =
      srtDataRef.current.length && video
        ? getHeadingAt(srtDataRef.current, video.currentTime, timeOffsetRef.current)
        : 0;
    drawCompass(ctx, canvas, hdg);
    drawLastDot(ctx, canvas);
  }

  function resizeCanvas() {
    const video = videoRef.current,
      canvas = canvasRef.current;
    if (!video || !canvas) return;
    const rect = video.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    const wr = video.parentElement.getBoundingClientRect();
    canvas.style.left = rect.left - wr.left + "px";
    canvas.style.top = rect.top - wr.top + "px";
    redrawAll();
  }

  /* ---------- displays derivados del video ---------- */
  function updateTimeDisplay() {
    const video = videoRef.current;
    if (!video) return;
    const cur = formatTime(video.currentTime);
    const dur = isNaN(video.duration) ? "00:00:00" : formatTime(video.duration);
    setTimeDisplay(`${cur} / ${dur}`);
    setTimeHeader(cur);
  }
  function updateProgress() {
    const video = videoRef.current;
    if (!video) return;
    if (!isNaN(video.duration) && video.duration > 0)
      setProgressPct((video.currentTime / video.duration) * 100);
  }
  function updateTelemetry() {
    const video = videoRef.current;
    if (!video) return;
    const t = getTelemetryAt(srtDataRef.current, video.currentTime, timeOffsetRef.current);
    if (!t) return;
    const alt = t.altBaro !== null && t.altBaro !== undefined ? t.altBaro : t.altGPS;
    const fovHrad = (fovHRef.current * Math.PI) / 180;
    const footW = 2 * alt * Math.tan(fovHrad / 2);
    const hdg = getHeadingAt(srtDataRef.current, video.currentTime, timeOffsetRef.current);
    setTelem({
      lat: t.lat.toFixed(6),
      lon: t.lon.toFixed(6),
      alt: alt.toFixed(1),
      iso: t.iso || "—",
      fnum: t.fnum || "—",
      interpText: t.interpolated ? t.alpha.toFixed(3) : "ok",
      interpolated: t.interpolated,
      footW: footW.toFixed(1),
      heading: hdg.toFixed(1) + "°",
    });
    if (video.paused) {
      redrawAll();
    } else {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCrosshairs(ctx, canvas);
      drawCompass(ctx, canvas, hdg);
    }
  }

  /* ---------- listeners nativos del <video> (montaje único) ---------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      updateTimeDisplay();
      updateTelemetry();
      updateProgress();
    };
    const onPlay = () => {
      setPlaying(true);
      showDotsRef.current = false;
      allDotsRef.current = [];
      setShowDots(false);
      setAllDots([]);
      resizeCanvas();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCrosshairs(ctx, canvas);
      const hdg = srtDataRef.current.length
        ? getHeadingAt(srtDataRef.current, video.currentTime, timeOffsetRef.current)
        : 0;
      drawCompass(ctx, canvas, hdg);
    };
    const onPause = () => {
      setPlaying(false);
      redrawAll();
    };
    const onClick = (e) => {
      if (!videoReadyRef.current || !srtDataRef.current.length) {
        showToastMsg("Cargá primero el video y el SRT");
        return;
      }
      video.pause();
      const rect = video.getBoundingClientRect();
      const t = getTelemetryAt(srtDataRef.current, video.currentTime, timeOffsetRef.current);
      if (!t) {
        showToastMsg("Sin telemetría en este instante");
        return;
      }
      const hdg = getHeadingAt(srtDataRef.current, video.currentTime, timeOffsetRef.current);
      const coords = pixelToGPS(
        e.clientX - rect.left,
        e.clientY - rect.top,
        rect.width,
        rect.height,
        t,
        hdg,
        fovHRef.current,
        fovVRef.current,
        resWRef.current,
        resHRef.current,
      );
      setPendingTree({
        coords,
        clickX: e.clientX - rect.left,
        clickY: e.clientY - rect.top,
        displayW: rect.width,
        displayH: rect.height,
        videoTime: video.currentTime,
      });
      setCat1(cfgRef.current.cats1?.[0]?.name || "");
      setCat2(cfgRef.current.cats2?.[0]?.name || "");
      setCat3(cfgRef.current.cats3?.[0]?.name || "");
      setNotes("");
      setModalOpen(true);
    };
    const onLoadedMeta = () => {
      const vw = video.videoWidth,
        vh = video.videoHeight;
      if (vw && vh) {
        setResW(vw);
        setResH(vh);
        resWRef.current = vw;
        resHRef.current = vh;
        setResWAuto(true);
        setResHAuto(true);
        const r = computeFovV(fovHRef.current, vw, vh);
        setFovV(r.fovV);
        fovVRef.current = r.fovV;
        setFovNote(r.note);
        setDroneSelect("custom");
        showToastMsg(`Resolución: ${vw}×${vh} px`);
      }
      updateTimeDisplay();
      resizeCanvas();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("click", onClick);
    video.addEventListener("loadedmetadata", onLoadedMeta);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("click", onClick);
      video.removeEventListener("loadedmetadata", onLoadedMeta);
      window.removeEventListener("resize", resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- redibuja cuando cambian toggles / registros ---------- */
  useEffect(() => {
    redrawAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trees, chCenter, chQuad, chScale, showDots]);

  /* ---------- handlers: cámara / FOV ---------- */
  function handleFovHChange(v) {
    setFovH(v);
    fovHRef.current = v;
    const r = computeFovV(v, resWRef.current, resHRef.current);
    setFovV(r.fovV);
    fovVRef.current = r.fovV;
    setFovNote(r.note);
    setDroneSelect("custom");
  }
  function handleResWChange(v) {
    setResW(v);
    resWRef.current = v;
    const r = computeFovV(fovHRef.current, v, resHRef.current);
    setFovV(r.fovV);
    fovVRef.current = r.fovV;
    setFovNote(r.note);
    setDroneSelect("custom");
  }
  function handleResHChange(v) {
    setResH(v);
    resHRef.current = v;
    const r = computeFovV(fovHRef.current, resWRef.current, v);
    setFovV(r.fovV);
    fovVRef.current = r.fovV;
    setFovNote(r.note);
    setDroneSelect("custom");
  }
  function handleDroneSelect(sel) {
    setDroneSelect(sel);
    if (sel === "custom") return;
    const d = DRONES[sel];
    if (!d) return;
    setFovH(d.fovH);
    fovHRef.current = d.fovH;
    const r = computeFovV(d.fovH, resWRef.current, resHRef.current);
    setFovV(r.fovV);
    fovVRef.current = r.fovV;
    setFovNote(d.label);
    showToastMsg(`${d.label} aplicado`);
  }
  function openFovCalibrator() {
    const w = window.open("fov_calibrator.html", "_blank");
    if (!w) showToastMsg("Abrí fov_calibrator.html en el navegador manualmente");
  }

  /* ---------- handlers: suavizado ---------- */
  function handleSmoothChange(v) {
    setSmoothWindow(v);
    smoothWindowRef.current = v;
    const data = srtDataRef.current;
    const avgInt = data.length > 1 ? (data[data.length - 1].t - data[0].t) / (data.length - 1) : 1;
    setSmoothNote(`Ventana: ±${v} registros · ≈ ±${(v * avgInt).toFixed(1)}s`);
    if (data.length > 1) {
      const newData = data.map((d) => ({ ...d }));
      computeHeadings(newData, v);
      srtDataRef.current = newData;
      setSrtData(newData);
    }
  }

  /* ---------- handlers: crosshair toggles ---------- */
  function toggleCH(type) {
    if (type === "center") {
      const n = !chCenter;
      setChCenter(n);
      chCenterRef.current = n;
    } else if (type === "quad") {
      const n = !chQuad;
      setChQuad(n);
      chQuadRef.current = n;
    } else {
      const n = !chScale;
      setChScale(n);
      chScaleRef.current = n;
    }
  }

  /* ---------- handlers: carga de archivos ---------- */
  function handleVideoFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const video = videoRef.current;
    video.src = URL.createObjectURL(f);
    setVideoStatus(f.name);
    setVideoReady(true);
    videoReadyRef.current = true;
    showHint();
  }

  function handleSrtFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const format = detectFormat(text);
      let data = [];
      if (format === "litchi") data = parseLitchi(text);
      else if (format === "dji_bracket") data = parseDJIBracket(text);
      setSrtFormat(format);
      if (!data.length) {
        showToastMsg("No se pudieron leer posiciones del SRT");
        return;
      }
      computeHeadings(data, smoothWindowRef.current);
      srtDataRef.current = data;
      setSrtData(data);
      let avgInt = 1;
      if (data.length > 1) avgInt = (data[data.length - 1].t - data[0].t) / (data.length - 1);
      setSrtStatus(`${f.name} · ${data.length} registros`);
      const lbl = avgInt < 0.1 ? (avgInt * 1000).toFixed(0) + "ms" : avgInt.toFixed(2) + "s";
      setInterpBadge({ on: avgInt <= 1.05, text: `Δt ≈ ${lbl} · ${data.length} pts` });
      showToastMsg(`SRT (${format}) · ${data.length} registros · Δt ≈ ${lbl}`);
    };
    reader.readAsText(f, "utf-8");
  }

  /* ---------- handlers: controles de video ---------- */
  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }
  function stepFrame(dir) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime += dir / FPS;
  }
  function handleSpeedChange(val) {
    setSpeed(val);
    if (videoRef.current) videoRef.current.playbackRate = parseFloat(val);
  }
  function handleProgressClick(e) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
  }

  /* ---------- modal de registro ---------- */
  function closeModal() {
    setModalOpen(false);
    setPendingTree(null);
  }
  function isAlertSelected(catNum, value) {
    const list = cfg[`cats${catNum}`] || [];
    const item = list.find((c) => c.name === value);
    return item ? item.alert : false;
  }
  function saveTree() {
    if (!pendingTree) return;
    const alert = isAlertSelected(1, cat1) || isAlertSelected(2, cat2) || isAlertSelected(3, cat3);
    setTrees((prev) => {
      const id = prev.length + 1;
      const rec = {
        id,
        lat: pendingTree.coords.lat,
        lon: pendingTree.coords.lon,
        alt: pendingTree.coords.alt,
        cat1,
        cat2,
        cat3,
        alert,
        notes: notes.trim(),
        videoTime: pendingTree.videoTime,
        heading: pendingTree.coords.heading,
        interpolated: pendingTree.coords.interpolated,
        alpha: pendingTree.coords.alpha,
        clickX: pendingTree.clickX,
        clickY: pendingTree.clickY,
        displayW: pendingTree.displayW,
        displayH: pendingTree.displayH,
        droneLat: pendingTree.coords.droneLat,
        droneLon: pendingTree.coords.droneLon,
      };
      const newDot = {
        x: rec.clickX,
        y: rec.clickY,
        id: rec.id,
        alert: rec.alert,
        displayW: rec.displayW,
        displayH: rec.displayH,
      };
      const newDots = [...allDotsRef.current, newDot];
      allDotsRef.current = newDots;
      setAllDots(newDots);
      showDotsRef.current = true;
      setShowDots(true);
      showToastMsg(`Registro #${rec.id} guardado${rec.interpolated ? " (interp.)" : ""}`);
      return [...prev, rec];
    });
    setModalOpen(false);
    setPendingTree(null);
  }

  /* ---------- tabla / borrado ---------- */
  function clearAllTrees() {
    if (!trees.length) {
      showToastMsg("No hay registros para borrar");
      return;
    }
    if (!window.confirm(`¿Borrar los ${trees.length} registros? Esta acción no se puede deshacer.`))
      return;
    setTrees([]);
    setAllDots([]);
    allDotsRef.current = [];
    setShowDots(false);
    showDotsRef.current = false;
    showToastMsg("Todos los registros borrados");
  }
  function deleteTree(id) {
    setTrees((prev) => prev.filter((t) => t.id !== id));
    setAllDots((prev) => {
      const nd = prev.filter((d) => d.id !== id);
      allDotsRef.current = nd;
      return nd;
    });
  }

  /* ---------- exportación ---------- */
  function exportCSV() {
    if (!trees.length) {
      showToastMsg("No hay registros aún");
      return;
    }
    const l1 = cfg.label1 || "cat1",
      l2 = cfg.label2 || "cat2",
      l3 = cfg.label3 || "cat3";
    const fname = (cfg.exportName || "registros_drone") + ".csv";
    const h = `id,latitud,longitud,altitud_drone_m,rumbo_deg,${l1},${l2},${l3},notas,alerta,interpolado,alpha_interp,tiempo_video_s,drone_lat,drone_lon\n`;
    const r = trees
      .map(
        (t) =>
          `${t.id},${t.lat.toFixed(7)},${t.lon.toFixed(7)},${t.alt.toFixed(1)},${t.heading.toFixed(1)},` +
          `"${t.cat1}","${t.cat2}","${t.cat3}","${t.notes.replace(/"/g, '""')}",${t.alert ? 1 : 0},` +
          `${t.interpolated ? 1 : 0},${t.alpha.toFixed(3)},${t.videoTime.toFixed(2)},${t.droneLat.toFixed(7)},${t.droneLon.toFixed(7)}`,
      )
      .join("\n");
    download(fname, h + r, "text/csv");
    showToastMsg(`${fname} descargado`);
  }
  function exportGeoJSON() {
    if (!trees.length) {
      showToastMsg("No hay registros aún");
      return;
    }
    const l1 = cfg.label1 || "cat1",
      l2 = cfg.label2 || "cat2",
      l3 = cfg.label3 || "cat3";
    const fname = (cfg.exportName || "registros_drone") + ".geojson";
    const gj = {
      type: "FeatureCollection",
      crs: { type: "name", properties: { name: "EPSG:4326" } },
      features: trees.map((t) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [parseFloat(t.lon.toFixed(7)), parseFloat(t.lat.toFixed(7))] },
        properties: {
          id: t.id,
          [l1]: t.cat1,
          [l2]: t.cat2,
          [l3]: t.cat3,
          notas: t.notes,
          alerta: t.alert ? 1 : 0,
          altitud_drone_m: parseFloat(t.alt.toFixed(1)),
          rumbo_deg: parseFloat(t.heading.toFixed(1)),
          interpolado: t.interpolated ? 1 : 0,
          alpha_interp: parseFloat(t.alpha.toFixed(3)),
          tiempo_video_s: parseFloat(t.videoTime.toFixed(2)),
          drone_lat: parseFloat(t.droneLat.toFixed(7)),
          drone_lon: parseFloat(t.droneLon.toFixed(7)),
        },
      })),
    };
    download(fname, JSON.stringify(gj, null, 2), "application/json");
    showToastMsg(`${fname} descargado`);
  }

  /* ---------- modal de configuración ---------- */
  function openConfig() {
    setCfgDraft({
      projectName: cfg.projectName || "",
      subtitle: cfg.subtitle || "",
      exportName: cfg.exportName || "",
      label1: cfg.label1 || "",
      label2: cfg.label2 || "",
      label3: cfg.label3 || "",
      numCats: cfg.numCats !== undefined ? cfg.numCats : 3,
      cats1: (cfg.cats1 || []).map((c) => ({ ...c })),
      cats2: (cfg.cats2 || []).map((c) => ({ ...c })),
      cats3: (cfg.cats3 || []).map((c) => ({ ...c })),
    });
    setConfigOpen(true);
  }
  function closeConfigModal() {
    setConfigOpen(false);
  }
  function saveConfigModal() {
    const newCfg = {
      ...cfg,
      numCats: cfgDraft.numCats,
      projectName: cfgDraft.projectName.trim() || "Drone Video Mapper",
      subtitle: cfgDraft.subtitle.trim(),
      exportName: cfgDraft.exportName.trim() || "registros_drone",
      label1: cfgDraft.label1.trim() || "Categoría 1",
      label2: cfgDraft.label2.trim() || "Categoría 2",
      label3: cfgDraft.label3.trim() || "Categoría 3",
      cats1: cfgDraft.cats1.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), alert: c.alert })),
      cats2: cfgDraft.cats2.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), alert: c.alert })),
      cats3: cfgDraft.cats3.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), alert: c.alert })),
    };
    setCfg(newCfg);
    cfgRef.current = newCfg;
    try {
      localStorage.setItem("dvm_config_v5", JSON.stringify(newCfg));
    } catch (e) {}
    setConfigOpen(false);
    showToastMsg("Configuración guardada");
  }
  function addCatItem(n) {
    setCfgDraft((d) => ({ ...d, [`cats${n}`]: [...d[`cats${n}`], { name: "", alert: false }] }));
  }
  function deleteCatItem(n, i) {
    setCfgDraft((d) => {
      const arr = [...d[`cats${n}`]];
      arr.splice(i, 1);
      return { ...d, [`cats${n}`]: arr };
    });
  }
  function updateCatName(n, i, val) {
    setCfgDraft((d) => ({
      ...d,
      [`cats${n}`]: d[`cats${n}`].map((c, idx) => (idx === i ? { ...c, name: val } : c)),
    }));
  }
  function toggleCatAlert(n, i) {
    setCfgDraft((d) => ({
      ...d,
      [`cats${n}`]: d[`cats${n}`].map((c, idx) => (idx === i ? { ...c, alert: !c.alert } : c)),
    }));
  }

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  const numCats = cfg.numCats !== undefined ? cfg.numCats : 3;

  return (
    <div className="h-screen w-full flex flex-col bg-[#0f1117] text-[#e8eaf0] text-sm overflow-hidden font-sans">
      <ScrollbarStyle />

      {/* HEADER */}
      <header className="bg-[#1a1d27] border-b border-white/10 px-[14px] py-[8px] flex items-center gap-[10px] flex-shrink-0">
        <div>
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#4ade80]">
            {cfg.projectName || "Drone Video Mapper"}
          </div>
          <div className="text-[15px] font-semibold">{cfg.projectName || "Drone Video Mapper"}</div>
          <div className="text-[10px] text-[#8b90a8] mt-[1px]">{cfg.subtitle}</div>
        </div>
        <div className="bg-[#60a5fa]/15 border border-[#60a5fa] rounded-full px-[9px] py-[2px] text-[10px] text-[#60a5fa] font-bold">
          v5
        </div>
        <div className="flex-1" />
        <button
          onClick={openConfig}
          className="bg-[#fbbf24]/10 border border-[#fbbf24]/40 rounded-full px-3 py-[3px] text-[11px] text-[#fbbf24] font-semibold hover:bg-[#fbbf24]/20 transition-colors"
        >
          ⚙ Configurar
        </button>
        <StatPill label="Registros" value={trees.length} />
        <StatPill label="Tiempo" value={timeHeader} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* PANEL IZQUIERDO */}
        <div className="w-[280px] flex-shrink-0 bg-[#1a1d27] border-r border-white/10 flex flex-col overflow-hidden">
          <div className="fov-scroll overflow-y-auto flex-shrink-0 max-h-[55vh]">
            {/* Archivos */}
            <div className="px-3 py-2 border-b border-white/10">
              <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-[7px]">
                Archivos
              </h3>
              <div className="flex flex-col gap-[3px] mb-[7px]">
                <div className="text-[11px] text-[#8b90a8]">Video (.mp4 / .mov)</div>
                <label className="relative bg-[#22263a] border border-dashed border-white/15 rounded-[10px] px-[10px] py-[5px] text-center text-[11px] cursor-pointer hover:border-[#4ade80] hover:bg-[#4ade80]/5 transition-colors overflow-hidden">
                  Seleccionar video
                  <input type="file" accept="video/*" onChange={handleVideoFile} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                </label>
                <div className="text-[10px] text-[#4ade80] mt-[1px] min-h-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {videoStatus}
                </div>
              </div>
              <div className="flex flex-col gap-[3px] mb-[7px]">
                <div className="text-[11px] text-[#8b90a8]">Telemetría (.srt)</div>
                <label className="relative bg-[#22263a] border border-dashed border-white/15 rounded-[10px] px-[10px] py-[5px] text-center text-[11px] cursor-pointer hover:border-[#4ade80] hover:bg-[#4ade80]/5 transition-colors overflow-hidden">
                  Seleccionar SRT
                  <input type="file" accept=".srt,.txt" onChange={handleSrtFile} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                </label>
                <div className="text-[10px] text-[#4ade80] mt-[1px] min-h-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {srtStatus}
                </div>
                {srtFormat !== "unknown" && srtData.length > 0 && (
                  <span
                    className={`inline-block text-[10px] px-2 py-[2px] rounded-lg mt-[3px] font-semibold w-fit ${
                      srtFormat === "litchi"
                        ? "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30"
                        : "bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/30"
                    }`}
                  >
                    {srtFormat === "litchi" ? "Litchi SRT" : "DJI SRT (bracket)"}
                  </span>
                )}
                {interpBadge && (
                  <div
                    className={`inline-flex items-center gap-[5px] text-[10px] px-2 py-[3px] rounded-[10px] mt-1 w-fit ${
                      interpBadge.on
                        ? "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30"
                        : "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30"
                    }`}
                  >
                    <div className="w-[6px] h-[6px] rounded-full bg-current" />
                    <span>{interpBadge.text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cámara */}
            <div className="px-3 py-2 border-b border-white/10">
              <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-[7px]">Cámara</h3>
              <ParamRow label="Modelo">
                <select
                  value={droneSelect}
                  onChange={(e) => handleDroneSelect(e.target.value)}
                  className="w-[160px] bg-[#22263a] border border-white/10 rounded-md px-[6px] py-[3px] text-[11px] text-[#e8eaf0]"
                >
                  <option value="custom">— manual —</option>
                  <option value="mavic_pro">Mavic Pro</option>
                  <option value="mavic_mini3">Mini 3 Pro</option>
                  <option value="mavic_air2s">Air 2S</option>
                  <option value="mavic_3">Mavic 3</option>
                  <option value="phantom4">Phantom 4 Pro</option>
                </select>
              </ParamRow>
              <ParamRow label="FOV horizontal (°)">
                <input
                  type="number"
                  step="0.1"
                  value={fovH}
                  onChange={(e) => handleFovHChange(parseFloat(e.target.value) || 0)}
                  className="w-[70px] bg-[#22263a] border border-white/10 rounded-md px-[6px] py-[3px] text-[11px] text-right focus:outline-none focus:border-[#4ade80]"
                />
              </ParamRow>
              <ParamRow label="FOV vertical (°)" tag="auto">
                <input
                  type="number"
                  step="0.1"
                  value={fovV}
                  onChange={(e) => {
                    setFovV(parseFloat(e.target.value) || 0);
                    fovVRef.current = parseFloat(e.target.value) || 0;
                  }}
                  className="w-[70px] bg-[#22263a] border border-white/10 rounded-md px-[6px] py-[3px] text-[11px] text-right focus:outline-none focus:border-[#4ade80]"
                />
              </ParamRow>
              <div className="text-[9px] text-[#8b90a8] mb-1 leading-[1.4] min-h-[18px]">{fovNote}</div>
              <ParamRow label="Res. ancho (px)" tag={resWAuto ? "auto" : "manual"}>
                <input
                  type="number"
                  value={resW}
                  onChange={(e) => handleResWChange(parseFloat(e.target.value) || 0)}
                  className="w-[70px] bg-[#22263a] border border-white/10 rounded-md px-[6px] py-[3px] text-[11px] text-right focus:outline-none focus:border-[#4ade80]"
                />
              </ParamRow>
              <ParamRow label="Res. alto (px)" tag={resHAuto ? "auto" : "manual"}>
                <input
                  type="number"
                  value={resH}
                  onChange={(e) => handleResHChange(parseFloat(e.target.value) || 0)}
                  className="w-[70px] bg-[#22263a] border border-white/10 rounded-md px-[6px] py-[3px] text-[11px] text-right focus:outline-none focus:border-[#4ade80]"
                />
              </ParamRow>
              <ParamRow label="Offset tiempo (s)">
                <input
                  type="number"
                  step="0.1"
                  value={timeOffset}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setTimeOffset(v);
                    timeOffsetRef.current = v;
                  }}
                  className="w-[70px] bg-[#22263a] border border-white/10 rounded-md px-[6px] py-[3px] text-[11px] text-right focus:outline-none focus:border-[#4ade80]"
                />
              </ParamRow>
              <span
                onClick={openFovCalibrator}
                className="block text-[10px] text-[#60a5fa] cursor-pointer underline mt-1 hover:text-[#4ade80]"
              >
                ↗ Abrir FOV Calibrator
              </span>
            </div>

            {/* Crosshair / Escala */}
            <div className="px-3 py-2 border-b border-white/10">
              <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-[7px]">
                Crosshair / Escala
              </h3>
              <ChRow label="Centro del frame" active={chCenter} onClick={() => toggleCH("center")} />
              <ChRow label="Centros de cuadrantes" active={chQuad} onClick={() => toggleCH("quad")} />
              <ChRow label="Escala gráfica 10 m" active={chScale} onClick={() => toggleCH("scale")} />
            </div>

            {/* Suavizado */}
            <div className="px-3 py-2 border-b border-white/10">
              <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8] mb-[7px]">
                Suavizado de rumbo
              </h3>
              <div className="flex items-center gap-2 mb-[5px]">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={smoothWindow}
                  onChange={(e) => handleSmoothChange(parseInt(e.target.value))}
                  className="flex-1 accent-[#4ade80] cursor-pointer"
                />
                <span className="font-mono text-[12px] text-[#4ade80] min-w-[18px] text-right">{smoothWindow}</span>
              </div>
              <div className="text-[10px] text-[#8b90a8] leading-[1.5]">{smoothNote}</div>
            </div>
          </div>

          {/* Registros */}
          <div className="px-3 pt-2 pb-[6px]">
            <h3 className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#8b90a8]">Registros</h3>
          </div>
          <div className="fov-scroll flex-1 overflow-y-auto min-h-[80px]">
            {!trees.length ? (
              <div className="px-4 py-6 text-center text-[#8b90a8] text-[12px] leading-[1.8]">
                Cargá el video y el SRT,
                <br />
                luego hacé clic sobre
                <br />
                el objeto de interés.
              </div>
            ) : (
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="bg-[#22263a] text-[#8b90a8] font-semibold px-2 py-[6px] text-left sticky top-0 border-b border-white/10 text-[10px] uppercase">
                      #
                    </th>
                    <th className="bg-[#22263a] text-[#8b90a8] font-semibold px-2 py-[6px] text-left sticky top-0 border-b border-white/10 text-[10px] uppercase">
                      Lat
                    </th>
                    <th className="bg-[#22263a] text-[#8b90a8] font-semibold px-2 py-[6px] text-left sticky top-0 border-b border-white/10 text-[10px] uppercase">
                      Lon
                    </th>
                    <th className="bg-[#22263a] text-[#8b90a8] font-semibold px-2 py-[6px] text-left sticky top-0 border-b border-white/10 text-[10px] uppercase">
                      Tipo
                    </th>
                    <th className="bg-[#22263a] sticky top-0 border-b border-white/10" />
                  </tr>
                </thead>
                <tbody>
                  {trees.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.03]">
                      <td className="px-2 py-[5px] border-b border-white/10 font-mono">
                        {t.id}
                        {t.interpolated && <span className="text-[#60a5fa] text-[9px]"> ~</span>}
                      </td>
                      <td className="px-2 py-[5px] border-b border-white/10 font-mono">{t.lat.toFixed(5)}</td>
                      <td className="px-2 py-[5px] border-b border-white/10 font-mono">{t.lon.toFixed(5)}</td>
                      <td
                        className="px-2 py-[5px] border-b border-white/10 font-sans text-[11px] max-w-[80px] whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ color: t.alert ? "#f87171" : undefined }}
                      >
                        {t.cat1 || "—"}
                      </td>
                      <td className="px-2 py-[5px] border-b border-white/10">
                        <button
                          onClick={() => deleteTree(t.id)}
                          className="bg-transparent border-none text-[#f87171] cursor-pointer px-1 py-[2px] text-[13px] rounded hover:bg-[#f87171]/15"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-3 py-[10px] border-t border-white/10 flex gap-2 flex-shrink-0">
            <button
              onClick={exportCSV}
              className="flex-1 py-[7px] px-2 rounded-[10px] border border-[#22c55e] bg-[#4ade80]/10 text-[#4ade80] text-[11px] font-semibold hover:bg-[#4ade80]/20 transition-colors"
            >
              CSV
            </button>
            <button
              onClick={exportGeoJSON}
              className="flex-1 py-[7px] px-2 rounded-[10px] border border-[#60a5fa] bg-[#60a5fa]/10 text-[#60a5fa] text-[11px] font-semibold hover:bg-[#60a5fa]/20 transition-colors"
            >
              GeoJSON
            </button>
            <button
              onClick={clearAllTrees}
              title="Borrar todos los registros"
              className="py-[7px] px-[10px] rounded-[10px] border border-[#f87171] bg-[#f87171]/[0.08] text-[#f87171] text-[11px] font-semibold hover:bg-[#f87171]/20 transition-colors"
            >
              🗑
            </button>
          </div>
        </div>

        {/* PANEL CENTRAL */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {!videoReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#8b90a8]">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-30">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                <p className="text-[13px]">Cargá un video para comenzar</p>
              </div>
            )}
            <video
              ref={videoRef}
              preload="auto"
              className={`max-w-full max-h-full block cursor-crosshair select-none ${videoReady ? "" : "hidden"}`}
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 pointer-events-none" />
            <div
              className={`absolute bottom-[60px] left-1/2 -translate-x-1/2 bg-black/75 border border-[#4ade80] rounded-full px-[14px] py-[5px] text-[12px] text-[#4ade80] pointer-events-none whitespace-nowrap transition-opacity duration-300 ${
                clickHintVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              Clic sobre el objeto para registrar su posición
            </div>
          </div>

          {/* controles de video */}
          <div className="bg-[#1a1d27] border-t border-white/10 px-[14px] py-2 flex flex-col gap-[7px] flex-shrink-0">
            <div onClick={handleProgressClick} className="relative h-[5px] bg-[#22263a] rounded-[3px] cursor-pointer">
              <div className="h-full bg-[#4ade80] rounded-[3px] pointer-events-none" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex items-center gap-[10px]">
              <button
                onClick={togglePlay}
                className="bg-[#4ade80] hover:bg-[#22c55e] border-none rounded-full w-[30px] h-[30px] cursor-pointer text-black text-[13px] flex items-center justify-center flex-shrink-0"
              >
                {playing ? "⏸" : "▶"}
              </button>
              <span className="font-mono text-[12px] text-[#e8eaf0] min-w-[100px]">{timeDisplay}</span>
              <button onClick={() => stepFrame(-1)} className="bg-[#22263a] border border-white/10 rounded-md px-2 py-[3px] text-[11px] hover:border-[#4ade80] hover:text-[#4ade80]">
                ◀ 1f
              </button>
              <button onClick={() => stepFrame(1)} className="bg-[#22263a] border border-white/10 rounded-md px-2 py-[3px] text-[11px] hover:border-[#4ade80] hover:text-[#4ade80]">
                1f ▶
              </button>
              <div className="flex-1" />
              <select
                value={speed}
                onChange={(e) => handleSpeedChange(e.target.value)}
                className="bg-[#22263a] border border-white/10 rounded-md text-[11px] px-[5px] py-[2px] cursor-pointer"
              >
                <option value="0.1">0.1×</option>
                <option value="0.25">0.25×</option>
                <option value="0.5">0.5×</option>
                <option value="1">1×</option>
                <option value="2">2×</option>
              </select>
            </div>
            <div className="flex gap-[10px] text-[11px] py-[2px] flex-wrap items-center">
              <TelemItem label="Lat" value={telem.lat} interpolated={telem.interpolated} />
              <TelemItem label="Lon" value={telem.lon} interpolated={telem.interpolated} />
              <TelemItem label="Alt" value={telem.alt} unit="m" interpolated={telem.interpolated} />
              <span className="text-white/15 text-[14px]">|</span>
              <TelemItem label="Ancho" value={telem.footW} unit="m" />
              <span className="text-white/15 text-[14px]">|</span>
              <TelemItem label="Rumbo" value={telem.heading} />
              <span className="text-white/15 text-[14px]">|</span>
              <TelemItem label="ISO" value={telem.iso} />
              <TelemItem label="f/" value={telem.fnum} />
              <TelemItem label="α" value={telem.interpText} interpolated={telem.interpolated} />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL REGISTRO */}
      {modalOpen && pendingTree && (
        <div className="fixed inset-0 bg-black/[0.78] z-50 flex items-center justify-center">
          <div className="fov-scroll bg-[#1a1d27] border border-white/15 rounded-[14px] p-5 w-[340px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-[14px] mb-[10px] flex items-center gap-2">Registrar objeto</h3>
            <div className="bg-[#22263a] rounded-lg px-3 py-2 font-mono text-[11px] text-[#60a5fa] mb-[2px] leading-[1.9]">
              Lat: <b>{pendingTree.coords.lat.toFixed(7)}</b>
              <br />
              Lon: <b>{pendingTree.coords.lon.toFixed(7)}</b>
              <br />
              Alt drone: {pendingTree.coords.alt.toFixed(1)} m · Rumbo: {pendingTree.coords.heading.toFixed(1)}°
            </div>
            <div className="text-[10px] text-[#60a5fa] opacity-80 mb-[2px]">
              {pendingTree.coords.interpolated
                ? `Posición interpolada (α=${pendingTree.coords.alpha.toFixed(3)})`
                : "Posición sobre registro SRT exacto"}
            </div>

            {numCats >= 1 && (
              <>
                <label className="text-[12px] text-[#8b90a8] block mt-[10px] mb-1">{cfg.label1 || "Categoría 1"}</label>
                <select
                  value={cat1}
                  onChange={(e) => setCat1(e.target.value)}
                  className="w-full bg-[#22263a] border border-white/10 rounded-lg px-[10px] py-[7px] text-[13px] text-[#e8eaf0]"
                >
                  {(cfg.cats1 || []).map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            {numCats >= 2 && (
              <>
                <label className="text-[12px] text-[#8b90a8] block mt-[10px] mb-1">{cfg.label2 || "Categoría 2"}</label>
                <select
                  value={cat2}
                  onChange={(e) => setCat2(e.target.value)}
                  className="w-full bg-[#22263a] border border-white/10 rounded-lg px-[10px] py-[7px] text-[13px] text-[#e8eaf0]"
                >
                  {(cfg.cats2 || []).map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            {numCats >= 3 && (
              <>
                <label className="text-[12px] text-[#8b90a8] block mt-[10px] mb-1">{cfg.label3 || "Categoría 3"}</label>
                <select
                  value={cat3}
                  onChange={(e) => setCat3(e.target.value)}
                  className="w-full bg-[#22263a] border border-white/10 rounded-lg px-[10px] py-[7px] text-[13px] text-[#e8eaf0]"
                >
                  {(cfg.cats3 || []).map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <label className="text-[12px] text-[#8b90a8] block mt-[10px] mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones adicionales..."
              className="w-full bg-[#22263a] border border-white/10 rounded-lg px-[10px] py-[7px] text-[13px] text-[#e8eaf0] resize-y min-h-[52px]"
            />
            <div className="flex gap-2 mt-[14px]">
              <button
                onClick={closeModal}
                className="flex-1 bg-[#22263a] border border-white/10 rounded-lg py-2 text-[#8b90a8] text-[13px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={saveTree}
                className="flex-[2] bg-[#4ade80] border-none rounded-lg py-2 text-black text-[13px] font-bold cursor-pointer"
              >
                Guardar registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN */}
      {configOpen && cfgDraft && (
        <div className="fixed inset-0 bg-black/[0.78] z-50 flex items-center justify-center">
          <div className="fov-scroll bg-[#1a1d27] border border-white/15 rounded-[14px] p-5 w-[520px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-[14px] mb-[10px] flex items-center gap-2">⚙ Configuración del proyecto</h3>

            <div className="mb-4">
              <h4 className="text-[11px] font-bold tracking-[1px] uppercase text-[#8b90a8] mb-2 pb-1 border-b border-white/10">
                Identidad
              </h4>
              <input
                type="text"
                value={cfgDraft.projectName}
                onChange={(e) => setCfgDraft((d) => ({ ...d, projectName: e.target.value }))}
                placeholder="Nombre del proyecto (ej: EcoFluvial · Caleufú)"
                className="w-full bg-[#22263a] border border-white/10 rounded-lg px-[10px] py-[7px] text-[13px] text-[#e8eaf0] mb-[6px]"
              />
              <input
                type="text"
                value={cfgDraft.subtitle}
                onChange={(e) => setCfgDraft((d) => ({ ...d, subtitle: e.target.value }))}
                placeholder="Subtítulo (ej: Inventario Salix · 2025)"
                className="w-full bg-[#22263a] border border-white/10 rounded-lg px-[10px] py-[7px] text-[13px] text-[#e8eaf0] mb-[6px]"
              />
              <input
                type="text"
                value={cfgDraft.exportName}
                onChange={(e) => setCfgDraft((d) => ({ ...d, exportName: e.target.value }))}
                placeholder="Nombre de archivo de exportación (ej: caleufú_2025)"
                className="w-full bg-[#22263a] border border-white/10 rounded-lg px-[10px] py-[7px] text-[13px] text-[#e8eaf0] mb-[6px]"
              />
            </div>

            <div className="mb-4">
              <h4 className="text-[11px] font-bold tracking-[1px] uppercase text-[#8b90a8] mb-2 pb-1 border-b border-white/10">
                Número de atributos en el registro
              </h4>
              <div className="flex gap-2 mb-[6px]">
                {[
                  { n: 0, label: "0 — solo notas" },
                  { n: 1, label: "1" },
                  { n: 2, label: "2" },
                  { n: 3, label: "3" },
                ].map(({ n, label }) => (
                  <button
                    key={n}
                    onClick={() => setCfgDraft((d) => ({ ...d, numCats: n }))}
                    className={`flex-1 border rounded-md py-[5px] px-1 text-[10px] text-center transition-all ${
                      cfgDraft.numCats === n
                        ? "border-[#4ade80] text-[#4ade80] bg-[#4ade80]/10 font-bold"
                        : "border-white/10 bg-[#22263a] text-[#8b90a8] hover:border-[#22c55e]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-[#8b90a8] mt-1 leading-[1.5]">
                Define cuántos selectores de categoría aparecen en el modal de registro. Siempre se muestra el campo
                de notas libre.
              </div>
            </div>

            {[1, 2, 3].map(
              (n) =>
                cfgDraft.numCats >= n && (
                  <div className="mb-4" key={n}>
                    <h4 className="text-[11px] font-bold tracking-[1px] uppercase text-[#8b90a8] mb-2 pb-1 border-b border-white/10">
                      Categoría {n} — {n === 1 ? "Tipo / objeto" : n === 2 ? "Estado" : "Clase / tamaño"}
                    </h4>
                    <input
                      type="text"
                      value={cfgDraft[`label${n}`]}
                      onChange={(e) => setCfgDraft((d) => ({ ...d, [`label${n}`]: e.target.value }))}
                      placeholder="Nombre de esta categoría"
                      className="w-full bg-[#22263a] border border-white/10 rounded-lg px-[10px] py-[7px] text-[13px] text-[#e8eaf0] mb-[6px]"
                    />
                    <ul className="list-none mb-[6px]">
                      {cfgDraft[`cats${n}`].map((it, i) => (
                        <li key={i} className="flex items-center gap-[6px] mb-1">
                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) => updateCatName(n, i, e.target.value)}
                            placeholder="Nombre del ítem"
                            className="flex-1 bg-[#22263a] border border-white/10 rounded-md px-2 py-1 text-[12px] text-[#e8eaf0]"
                          />
                          <button
                            onClick={() => toggleCatAlert(n, i)}
                            title="Marcar como alerta (dot rojo)"
                            className={`border rounded px-[6px] py-[2px] text-[10px] whitespace-nowrap ${
                              it.alert
                                ? "border-[#f87171] text-[#f87171] bg-[#f87171]/10"
                                : "border-white/10 text-[#8b90a8] bg-transparent"
                            }`}
                          >
                            {it.alert ? "⚠ alerta" : "alerta"}
                          </button>
                          <button
                            onClick={() => deleteCatItem(n, i)}
                            className="bg-transparent border-none text-[#f87171] cursor-pointer text-[14px] px-[2px]"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => addCatItem(n)}
                      className="bg-[#4ade80]/[0.08] border border-[#4ade80]/30 rounded-md px-3 py-1 text-[#4ade80] text-[11px] hover:bg-[#4ade80]/[0.16]"
                    >
                      + Agregar ítem
                    </button>
                    {n === 1 && (
                      <div className="text-[10px] text-[#8b90a8] mt-1 leading-[1.5]">
                        Los ítems marcados como "alerta" aparecen en rojo en el video.
                      </div>
                    )}
                  </div>
                ),
            )}

            <div className="flex gap-2 mt-[14px]">
              <button
                onClick={closeConfigModal}
                className="flex-1 bg-[#22263a] border border-white/10 rounded-lg py-2 text-[#8b90a8] text-[13px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={saveConfigModal}
                className="flex-[2] bg-[#4ade80] border-none rounded-lg py-2 text-black text-[13px] font-bold cursor-pointer"
              >
                Guardar configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div
        className={`fixed bottom-5 right-5 bg-[#22263a] border border-[#4ade80] rounded-[10px] px-4 py-[10px] text-[13px] text-[#4ade80] z-[200] max-w-[300px] pointer-events-none transition-opacity duration-300 ${
          toast.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {toast.msg}
      </div>
    </div>
  );
}