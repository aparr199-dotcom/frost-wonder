import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  Download,
  Eye,
  Sparkles,
  X,
} from 'lucide-react';
import {
  CountdownState,
  HolidayMilestone,
  WallpaperResolutionId,
} from './types/holiday';
import {
  calculateChristmasCountdown,
  generateMilestoneIcsContent,
  getChronologicalLockScreenMilestones,
  WALLPAPER_RESOLUTIONS,
} from './utils/holidayLogic';
import { GENERATED_ASSETS, getInitialMilestones } from './data/seedData';
import { SnowfallCanvas } from './components/SnowfallCanvas';
import { renderLockScreenToCanvas } from './utils/lockScreenWallpaperRenderer';

const STORAGE_KEYS = {
  milestones: 'frost_wonder_minimal_v3_milestones',
  milestoneCount: 'frost_wonder_minimal_v3_count',
  showSnowGlobe: 'frost_wonder_minimal_v3_globe',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatShortMilestoneTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\s+Evening$/i, '')
    .replace(/\s+Hearth\s*&\s*Magic$/i, '')
    .replace(/^Time to Decorate the\s+/i, '')
    .replace(/^Holiday\s+/i, '')
    .replace(/\s+&\s+Ribbon\s+/i, ' ')
    .trim();
}

export default function App() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [snowEnabled, setSnowEnabled] = useState<boolean>(true);
  const [showMacClock, setShowMacClock] = useState<boolean>(false);
  const [showSnowGlobe, setShowSnowGlobe] = useState<boolean>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.showSnowGlobe, true)
  );
  const [milestoneCount, setMilestoneCount] = useState<3 | 4>(() =>
    loadFromStorage<3 | 4>(STORAGE_KEYS.milestoneCount, 4)
  );
  const [milestones, setMilestones] = useState<HolidayMilestone[]>(() =>
    loadFromStorage<HolidayMilestone[]>(
      STORAGE_KEYS.milestones,
      getInitialMilestones(2026)
    )
  );
  const [selectedResolution, setSelectedResolution] =
    useState<WallpaperResolutionId>('qhd_2560x1440');

  // Lightweight modal states (only opened on user action)
  const [editingMilestone, setEditingMilestone] =
    useState<HolidayMilestone | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftDate, setDraftDate] = useState<string>('');
  const [exportedPngPreviewUrl, setExportedPngPreviewUrl] = useState<
    string | null
  >(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const heroImageRef = useRef<HTMLImageElement | null>(null);
  const [heroImageReady, setHeroImageReady] = useState<boolean>(false);
  const globeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      heroImageRef.current = img;
      setHeroImageReady(true);
    };
    img.src = GENERATED_ASSETS.heroIcePalace;
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.milestones,
        JSON.stringify(milestones)
      );
    } catch {}
  }, [milestones]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.milestoneCount,
        JSON.stringify(milestoneCount)
      );
    } catch {}
  }, [milestoneCount]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.showSnowGlobe,
        JSON.stringify(showSnowGlobe)
      );
    } catch {}
  }, [showSnowGlobe]);

  const countdown: CountdownState = useMemo(
    () =>
      calculateChristmasCountdown(now, {
        targetYearOverride: 2026,
      }),
    [now]
  );

  const visibleMilestones = useMemo(
    () =>
      getChronologicalLockScreenMilestones(
        milestones,
        countdown.targetYear,
        milestoneCount
      ),
    [milestones, countdown.targetYear, milestoneCount]
  );

  useEffect(() => {
    const dayWord = countdown.days === 1 ? 'Day' : 'Days';
    document.title = `Frost & Wonder — ${countdown.days} ${dayWord} Until Christmas`;
  }, [countdown.days]);

  // Draw the simple, jewel-like snow globe on the live lock screen when enabled
  useEffect(() => {
    if (!showSnowGlobe || !globeCanvasRef.current) return;
    const canvas = globeCanvasRef.current;
    const size = 520;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = size / 2;
    const cy = 228;
    const r = 178;

    ctx.clearRect(0, 0, size, size);

    // Soft outer icy-lavender glow
    const halo = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.38);
    halo.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
    halo.addColorStop(0.55, 'rgba(167, 139, 250, 0.18)');
    halo.addColorStop(1, 'rgba(6, 12, 28, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.38, 0, Math.PI * 2);
    ctx.fill();

    // Clip interior of crystal dome
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const domeSky = ctx.createRadialGradient(cx, cy - 22, 12, cx, cy, r);
    domeSky.addColorStop(0, '#1e3a8a');
    domeSky.addColorStop(0.45, '#0369a1');
    domeSky.addColorStop(0.8, '#082f49');
    domeSky.addColorStop(1, '#020b1c');
    ctx.fillStyle = domeSky;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    const horizonY = cy + 54;

    // Illuminated Ferris Wheel inside snow globe
    const wheelCx = cx - 24;
    const wheelCy = horizonY - 82;
    const wheelR = 68;

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(wheelCx - 30, horizonY);
    ctx.lineTo(wheelCx, wheelCy);
    ctx.lineTo(wheelCx + 30, horizonY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(240, 249, 255, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(wheelCx, wheelCy, wheelR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.72)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(wheelCx, wheelCy, wheelR * 0.76, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const gx = wheelCx + Math.cos(angle) * wheelR;
      const gy = wheelCy + Math.sin(angle) * wheelR;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wheelCx, wheelCy);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(gx, gy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(wheelCx, wheelCy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Snow-laden evergreens
    const drawPine = (dx: number, tw: number, th: number) => {
      const tx = cx + dx;
      const baseY = horizonY + 4;
      for (let tier = 0; tier < 3; tier++) {
        const p = tier / 3;
        const botY = baseY - p * (th * 0.58);
        const topY = baseY - (p + 0.45) * th * 0.95;
        const halfW = (tw * (1 - p * 0.25)) / 2;
        ctx.fillStyle = '#0a2e36';
        ctx.beginPath();
        ctx.moveTo(tx - halfW, botY);
        ctx.lineTo(tx, topY);
        ctx.lineTo(tx + halfW, botY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(tx - halfW * 0.76, botY - (botY - topY) * 0.34);
        ctx.lineTo(tx, topY);
        ctx.lineTo(tx + halfW * 0.76, botY - (botY - topY) * 0.34);
        ctx.closePath();
        ctx.fill();
      }
    };

    [
      { dx: -122, w: 40, h: 76 },
      { dx: -96, w: 46, h: 92 },
      { dx: -72, w: 36, h: 68 },
      { dx: 84, w: 38, h: 74 },
      { dx: 106, w: 46, h: 94 },
      { dx: 128, w: 36, h: 70 },
    ].forEach((t) => drawPine(t.dx, t.w, t.h));

    // Warm-lit alpine castle towers & cottages
    const drawTower = (dx: number, w: number, h: number, roofH: number) => {
      const bx = cx + dx;
      const topY = horizonY - h;
      const wallGrad = ctx.createLinearGradient(bx - w / 2, topY, bx + w / 2, horizonY);
      wallGrad.addColorStop(0, '#f8fafc');
      wallGrad.addColorStop(0.5, '#fed7aa');
      wallGrad.addColorStop(1, '#f97316');
      ctx.fillStyle = wallGrad;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.rect(bx - w / 2, topY, w, h);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(bx - w / 2 - 3, topY);
      ctx.lineTo(bx, topY - roofH);
      ctx.lineTo(bx + w / 2 + 3, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(bx - 4.5, horizonY - h * 0.62, 9, 13, 3);
      ctx.roundRect(bx - 5.5, horizonY - 20, 11, 18, 4);
      ctx.fill();
    };

    drawTower(-54, 26, 30, 14);
    drawTower(-30, 24, 54, 22);
    drawTower(-4, 34, 46, 18);
    drawTower(24, 28, 78, 28);
    drawTower(54, 34, 98, 32);
    drawTower(80, 22, 46, 18);

    // Luminous cyan-blue snowbowl base
    const bowlGrad = ctx.createLinearGradient(cx, horizonY - 3, cx, cy + r);
    bowlGrad.addColorStop(0, '#ffffff');
    bowlGrad.addColorStop(0.22, '#bae6fd');
    bowlGrad.addColorStop(0.55, '#0ea5e9');
    bowlGrad.addColorStop(1, '#04132c');
    ctx.fillStyle = bowlGrad;
    ctx.fillRect(cx - r, horizonY, r * 2, r);

    // Floating snowflakes inside dome
    for (let s = 0; s < 52; s++) {
      const angle = s * 1.65;
      const dist = (s * 23) % 158;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle * 1.25) * dist * 0.86;
      ctx.fillStyle =
        s % 5 === 0
          ? 'rgba(254, 240, 138, 0.85)'
          : 'rgba(255, 255, 255, 0.82)';
      ctx.beginPath();
      ctx.arc(sx, sy, (s % 3) + 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crescent glass highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 11, Math.PI * 1.05, Math.PI * 1.45);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(224, 242, 254, 0.82)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Midnight-blue porcelain & gold filigree pedestal
    const neckY = cy + r - 13;
    const baseBottomY = neckY + 76;
    const topHalfW = 124;
    const bottomHalfW = 162;

    const pedGrad = ctx.createLinearGradient(
      cx - bottomHalfW,
      neckY,
      cx + bottomHalfW,
      baseBottomY
    );
    pedGrad.addColorStop(0, '#020714');
    pedGrad.addColorStop(0.28, '#0a1d42');
    pedGrad.addColorStop(0.5, '#1d4ed8');
    pedGrad.addColorStop(0.72, '#0a1d42');
    pedGrad.addColorStop(1, '#020612');

    ctx.fillStyle = pedGrad;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - topHalfW, neckY);
    ctx.quadraticCurveTo(cx, neckY + 11, cx + topHalfW, neckY);
    ctx.lineTo(cx + bottomHalfW, baseBottomY);
    ctx.quadraticCurveTo(cx, baseBottomY + 14, cx - bottomHalfW, baseBottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    for (let b = 0; b <= 30; b++) {
      const t = b / 30;
      const bx = cx - topHalfW * 0.95 + t * topHalfW * 1.9;
      const by = neckY + 10 + Math.sin(t * Math.PI) * 7;
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let b = 0; b <= 38; b++) {
      const t = b / 38;
      const bx = cx - bottomHalfW * 0.95 + t * bottomHalfW * 1.9;
      const by = baseBottomY - 3 + Math.sin(t * Math.PI) * 10;
      ctx.beginPath();
      ctx.arc(bx, by, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    [-1, 1].forEach((dir) => {
      ctx.save();
      ctx.translate(cx, neckY + 42);
      ctx.scale(dir, 1);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(13, 5);
      ctx.bezierCurveTo(45, -13, 84, 15, 130, -4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(48, -2);
      ctx.quadraticCurveTo(76, -18, 104, -12);
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      [
        { x: 30, y: -2, a: -0.45, rx: 6.5, ry: 2.4 },
        { x: 46, y: 6, a: 0.4, rx: 7, ry: 2.5 },
        { x: 68, y: -10, a: -0.5, rx: 6, ry: 2.2 },
        { x: 82, y: 4, a: 0.35, rx: 7.2, ry: 2.5 },
        { x: 100, y: -13, a: -0.3, rx: 6, ry: 2.2 },
        { x: 114, y: 2, a: 0.25, rx: 6.8, ry: 2.4 },
      ].forEach((lf) => {
        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.a);
        ctx.beginPath();
        ctx.ellipse(0, 0, lf.rx, lf.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    });

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx, neckY + 44, 3.4, 0, Math.PI * 2);
    ctx.fill();

    const snowbankGrad = ctx.createLinearGradient(
      cx,
      baseBottomY - 5,
      cx,
      baseBottomY + 22
    );
    snowbankGrad.addColorStop(0, '#ffffff');
    snowbankGrad.addColorStop(0.55, '#bae6fd');
    snowbankGrad.addColorStop(1, 'rgba(7, 18, 42, 0)');
    ctx.fillStyle = snowbankGrad;
    ctx.beginPath();
    ctx.ellipse(cx - 120, baseBottomY + 6, 76, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 120, baseBottomY + 6, 76, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, baseBottomY + 9, 142, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }, [showSnowGlobe]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    window.setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 6500);
  };

  // Generate High-Resolution Wallpaper PNG Data URL
  const generateWallpaperDataUrl = (
    resId: WallpaperResolutionId = selectedResolution,
    withClockOverlay = false
  ): string => {
    const spec = WALLPAPER_RESOLUTIONS[resId];
    const exportCanvas = document.createElement('canvas');
    renderLockScreenToCanvas({
      canvas: exportCanvas,
      width: spec.width,
      height: spec.height,
      countdown,
      milestones,
      now,
      heroImage: heroImageRef.current,
      includeSimulatedMacClockOverlay: withClockOverlay,
      includeSnowGlobe: showSnowGlobe,
      milestoneCount,
    });
    return exportCanvas.toDataURL('image/png');
  };

  const handleDownloadWallpaperPng = () => {
    const spec = WALLPAPER_RESOLUTIONS[selectedResolution];
    const dataUrl = generateWallpaperDataUrl(selectedResolution, false);
    const link = document.createElement('a');
    const resTag =
      selectedResolution === 'uhd_3840x2160'
        ? '3840x2160-4K'
        : '2560x1440-QHD';
    link.download = `Frost-and-Wonder-Lock-Screen-${resTag}.png`;
    link.href = dataUrl;
    link.click();

    setExportedPngPreviewUrl(dataUrl);
    showToast(
      `Downloaded ${spec.shortLabel} Lock-Screen Wallpaper (.PNG). Static image snapshot—set as your macOS Lock Screen wallpaper.`
    );
  };

  const handleOpenExportedPngPreview = () => {
    const dataUrl = generateWallpaperDataUrl(selectedResolution, false);
    setExportedPngPreviewUrl(dataUrl);
  };

  // Honest Optional .ICS Calendar Reminder Export
  const handleExportIcsReminders = (targetList: HolidayMilestone[]) => {
    if (targetList.length === 0) return;
    const icsContent = generateMilestoneIcsContent(targetList, 24);
    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      targetList.length === 1
        ? `Frost-and-Wonder-${targetList[0].title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}.ics`
        : `Frost-and-Wonder-Christmas-Milestones.ics`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(
      `Downloaded .ICS calendar file (${targetList.length} milestone${
        targetList.length > 1 ? 's' : ''
      }). Note: Downloading an .ICS file does not schedule a reminder automatically—open and import the file in Apple Calendar to activate alerts.`
    );
  };

  const openEditMilestone = (ms: HolidayMilestone) => {
    setEditingMilestone(ms);
    setDraftTitle(ms.title);
    setDraftDate(ms.targetDate);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone || !draftTitle.trim()) return;
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === editingMilestone.id
          ? {
              ...m,
              title: draftTitle.trim(),
              targetDate: draftDate,
            }
          : m
      )
    );
    setEditingMilestone(null);
  };

  const handleToggleMilestoneDone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const formattedMacDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const dayWord = countdown.days === 1 ? 'Day' : 'Days';

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#040919] text-slate-100 select-none">
      {/* Full-Screen Winter Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <img
          src={GENERATED_ASSETS.heroIcePalace}
          alt="Enchanted Winter Ice Palace Background"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040918]/50 via-[#06122c]/20 to-[#030714]/90" />
        <div className="animate-aurora absolute left-1/4 top-1/4 h-96 w-1/2 rounded-full bg-gradient-to-r from-sky-400/20 via-indigo-400/15 to-amber-200/10 blur-3xl" />
      </div>

      {/* Optional Subtle Falling Snow */}
      <SnowfallCanvas
        intensity={countdown.magicIntensity}
        isChristmasMorning={countdown.isChristmasMorning}
        enabled={snowEnabled}
      />

      {/* Top Open Space Reserved for macOS System Clock */}
      <header className="relative z-20 flex min-h-[22vh] flex-col items-center justify-center px-6 pt-8 text-center">
        {showMacClock ? (
          <div data-testid="mac-clock-preview" className="animate-fade-in">
            <div className="text-sm font-semibold tracking-wide text-slate-200/90 drop-shadow">
              {formattedMacDate}
            </div>
            <div className="font-sans text-7xl font-bold tracking-tight text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)] sm:text-8xl">
              9:41
            </div>
          </div>
        ) : (
          <div
            data-testid="mac-clock-negative-space"
            className="h-24 w-full"
            aria-label="Open space reserved for macOS Lock Screen Clock"
          />
        )}
      </header>

      {/* Main Lock-Screen Centerpiece: Optional Snow Globe + Big Countdown + 4 Small Milestones */}
      <main className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-end px-6 pb-8 text-center">
        {/* Optional Simple Snow Globe Centerpiece */}
        {showSnowGlobe && (
          <div className="mb-2 flex justify-center">
            <canvas
              ref={globeCanvasRef}
              data-testid="minimal-snow-globe-canvas"
              aria-label="Enchanted Christmas Snow Globe"
              className="h-[230px] w-[230px] sm:h-[275px] sm:w-[275px]"
            />
          </div>
        )}

        {/* Title & December 25, 2026 Deadline */}
        <p className="text-xs font-semibold tracking-[0.28em] text-amber-200/90 uppercase sm:text-sm">
          ✦ Frost &amp; Wonder · December 25, {countdown.targetYear} ✦
        </p>

        {/* Main Countdown Text: "36 Days Until Christmas" */}
        <h1
          data-testid="main-days-countdown"
          className="font-serif-display mt-2 text-5xl font-bold tracking-tight text-white drop-shadow-[0_8px_32px_rgba(2,6,23,0.9)] sm:text-7xl"
        >
          {countdown.isChristmasMorning
            ? 'Merry Christmas'
            : `${countdown.days} ${dayWord} Until Christmas`}
        </h1>

        {/* Three or Four Small Milestone Dates in One Minimal Timeline Underneath */}
        <div
          data-testid="minimal-milestone-timeline"
          className="mt-7 w-full max-w-4xl rounded-full border border-sky-200/20 bg-[#040a1a]/60 px-6 py-4 shadow-2xl backdrop-blur-xl sm:px-10"
        >
          <div
            className={`grid grid-cols-2 gap-4 ${
              milestoneCount === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'
            }`}
          >
            {visibleMilestones.map((ms, index) => {
              const parsed = new Date(ms.targetDate);
              const shortDate = Number.isNaN(parsed.getTime())
                ? 'DEC'
                : parsed
                    .toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                    .toUpperCase();
              const shortTitle = formatShortMilestoneTitle(ms.title);

              return (
                <div
                  key={ms.id}
                  data-testid={`milestone-item-${index + 1}`}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleMilestoneDone(ms.id)}
                      title="Toggle completed"
                      className={`font-mono-tabular text-xs font-bold tracking-wider transition ${
                        ms.completed
                          ? 'text-emerald-300'
                          : 'text-amber-200 hover:text-white'
                      }`}
                    >
                      {ms.completed ? `✓ ${shortDate}` : `✦ ${shortDate}`}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditMilestone(ms)}
                    title="Click to edit milestone date or title"
                    className="font-serif-display mt-0.5 text-lg font-semibold text-white transition hover:text-sky-200 sm:text-xl"
                  >
                    {shortTitle}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Whisper-Quiet Bottom Control Pill (Wallpaper Export, Reminder Export & Subtle Toggles) */}
      <footer className="relative z-20 mx-auto w-full max-w-5xl px-4 pb-5">
        {statusToast && (
          <div
            role="status"
            data-testid="status-toast"
            className="mx-auto mb-3 max-w-2xl rounded-2xl border border-sky-200/25 bg-slate-950/90 px-4 py-2.5 text-center text-xs text-sky-100 shadow-xl backdrop-blur-xl"
          >
            {statusToast}
          </div>
        )}

        <div className="mx-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-2.5 text-xs backdrop-blur-xl">
          {/* Resolution Selector */}
          <select
            aria-label="Wallpaper resolution"
            value={selectedResolution}
            onChange={(e) =>
              setSelectedResolution(e.target.value as WallpaperResolutionId)
            }
            className="rounded-xl border border-white/15 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none"
          >
            <option value="qhd_2560x1440">2560 × 1440 (QHD / 1440p)</option>
            <option value="uhd_3840x2160">3840 × 2160 (True 4K UHD)</option>
          </select>

          {/* Primary Download High-Res Wallpaper PNG Button */}
          <button
            type="button"
            onClick={handleDownloadWallpaperPng}
            data-testid="download-wallpaper-btn"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-300 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-200"
          >
            <Download className="h-3.5 w-3.5" />
            Download Wallpaper (.PNG)
          </button>

          {/* View Actual Exported Wallpaper PNG */}
          <button
            type="button"
            onClick={handleOpenExportedPngPreview}
            data-testid="preview-exported-png-btn"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200/25 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-sky-100 transition hover:bg-slate-800"
          >
            <Eye className="h-3.5 w-3.5" />
            View Exported PNG
          </button>

          {/* Optional Reminder Export (.ICS) */}
          <button
            type="button"
            onClick={() => handleExportIcsReminders(visibleMilestones)}
            data-testid="export-ics-reminders-btn"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:text-white"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-300" />
            Download Reminders (.ICS)
          </button>

          <span aria-hidden="true" className="text-slate-600">
            |
          </span>

          {/* Subtle Lock-Screen View Toggles */}
          <button
            type="button"
            onClick={() => setShowSnowGlobe((g) => !g)}
            aria-pressed={showSnowGlobe}
            className={`rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
              showSnowGlobe
                ? 'border-sky-300/35 bg-sky-400/15 text-sky-100'
                : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            {showSnowGlobe ? 'Snow Globe: On' : 'Snow Globe: Off'}
          </button>

          <button
            type="button"
            onClick={() => setSnowEnabled((s) => !s)}
            aria-pressed={snowEnabled}
            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition ${
              snowEnabled
                ? 'border-sky-300/35 bg-sky-400/15 text-sky-100'
                : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            {snowEnabled ? 'Snow: On' : 'Snow: Off'}
          </button>

          <button
            type="button"
            onClick={() =>
              setMilestoneCount((c) => (c === 4 ? 3 : 4))
            }
            className="rounded-xl border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
          >
            {milestoneCount} Milestones
          </button>

          <button
            type="button"
            onClick={() => setShowMacClock((c) => !c)}
            aria-pressed={showMacClock}
            className="rounded-xl border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
          >
            {showMacClock ? 'Hide Mac Clock' : 'Preview Mac Clock'}
          </button>
        </div>
      </footer>

      {/* Minimal Milestone Edit Modal */}
      {editingMilestone && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Milestone"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
        >
          <form
            onSubmit={handleSaveMilestone}
            className="w-full max-w-sm space-y-4 rounded-3xl border border-sky-200/25 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif-display text-2xl font-semibold text-white">
                Edit Milestone
              </h2>
              <button
                type="button"
                onClick={() => setEditingMilestone(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label
                htmlFor="edit-ms-title"
                className="block text-xs font-medium text-slate-300"
              >
                Short Title
              </label>
              <input
                id="edit-ms-title"
                type="text"
                required
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label
                htmlFor="edit-ms-date"
                className="block text-xs font-medium text-slate-300"
              >
                Date
              </label>
              <input
                id="edit-ms-date"
                type="datetime-local"
                required
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleExportIcsReminders([
                    {
                      ...editingMilestone,
                      title: draftTitle,
                      targetDate: draftDate,
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-sky-200/25 bg-slate-950 px-3 py-2 text-xs font-medium text-sky-200 hover:text-white"
              >
                <Calendar className="h-3.5 w-3.5" />
                Download .ICS
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-200"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Actual Exported High-Resolution Wallpaper PNG Viewer Modal */}
      {exportedPngPreviewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Exported Mac Lock-Screen Wallpaper PNG"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xl"
        >
          <div className="max-w-5xl w-full space-y-3 rounded-3xl border border-sky-200/25 bg-slate-900/95 p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif-display text-2xl font-semibold text-white">
                  Actual Exported Mac Lock-Screen Wallpaper (.PNG)
                </h2>
                <p className="text-xs text-slate-400">
                  {WALLPAPER_RESOLUTIONS[selectedResolution].shortLabel} · Static lock-screen snapshot with open top space for the macOS clock
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={exportedPngPreviewUrl}
                  download={`Frost-and-Wonder-Lock-Screen-${
                    selectedResolution === 'uhd_3840x2160'
                      ? '3840x2160-4K'
                      : '2560x1440-QHD'
                  }.png`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  Save PNG File
                </a>
                <button
                  type="button"
                  onClick={() => setExportedPngPreviewUrl(null)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-sky-200/20 bg-slate-950">
              <img
                src={exportedPngPreviewUrl}
                alt="Actual Exported Frost & Wonder Mac Lock-Screen Wallpaper PNG"
                data-testid="actual-exported-wallpaper-img"
                className="aspect-video w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
