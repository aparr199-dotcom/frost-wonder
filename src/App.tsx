import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  Download,
  Eye,
  Gift,
  Info,
  Maximize2,
  Minimize2,
  ShoppingBag,
  Sparkles,
  Star,
  TreePine,
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
  getMilestoneDisplayStatus,
  WALLPAPER_RESOLUTIONS,
} from './utils/holidayLogic';
import { GENERATED_ASSETS, getInitialMilestones } from './data/seedData';
import { SnowfallCanvas } from './components/SnowfallCanvas';
import { renderLockScreenToCanvas } from './utils/lockScreenWallpaperRenderer';
import { usePWAInstall } from './hooks/usePWAInstall';

const STORAGE_KEYS = {
  milestones: 'frost_wonder_v4_milestones',
  snowEnabled: 'frost_wonder_v4_snow',
  widgetMode: 'frost_wonder_v4_widget',
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

export default function App() {
  // Live ticking date state (updated every 1 second)
  const [now, setNow] = useState<Date>(() => new Date());

  // Check URL param ?widget=true or stored preference
  const [widgetMode, setWidgetMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('widget') === 'true') return true;
    }
    return loadFromStorage<boolean>(STORAGE_KEYS.widgetMode, false);
  });

  const [snowEnabled, setSnowEnabled] = useState<boolean>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.snowEnabled, true)
  );

  const [showMacClock, setShowMacClock] = useState<boolean>(false);

  // 4 Preloaded T-Minus Milestones (stored in localStorage so manual completion survives reloads)
  const [milestones, setMilestones] = useState<HolidayMilestone[]>(() =>
    loadFromStorage<HolidayMilestone[]>(
      STORAGE_KEYS.milestones,
      getInitialMilestones(2026)
    )
  );

  const [selectedResolution, setSelectedResolution] =
    useState<WallpaperResolutionId>('qhd_2560x1440');

  // Modals
  const [showAiPlanModal, setShowAiPlanModal] = useState<boolean>(false);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [exportedPngPreviewUrl, setExportedPngPreviewUrl] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Images for wallpaper rendering
  const heroImageRef = useRef<HTMLImageElement | null>(null);
  const snowGlobeImageRef = useRef<HTMLImageElement | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);

  // Interactive swirling snow for the snow globe
  const [isSwirling, setIsSwirling] = useState<boolean>(false);
  const swirlTimeoutRef = useRef<number | null>(null);

  const { isInstallable, isInstalled, isIOS, isMacSafari, install } = usePWAInstall();

  // 1. Live countdown: Update every 1 second
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    // Recalculate immediately when device wakes from sleep or tab becomes active
    const handleVisibilityOrFocus = () => {
      setNow(new Date());
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  // Preload background & snow globe cottage images for rendering
  useEffect(() => {
    let loadedCount = 0;
    const checkReady = () => {
      loadedCount++;
      if (loadedCount >= 2) setImagesLoaded(true);
    };

    const heroImg = new Image();
    heroImg.crossOrigin = 'anonymous';
    heroImg.onload = checkReady;
    heroImg.onerror = checkReady;
    heroImg.src = GENERATED_ASSETS.heroIcePalace;
    heroImageRef.current = heroImg;

    const globeImg = new Image();
    globeImg.crossOrigin = 'anonymous';
    globeImg.onload = checkReady;
    globeImg.onerror = checkReady;
    globeImg.src = GENERATED_ASSETS.snowGlobeCottage;
    snowGlobeImageRef.current = globeImg;
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.milestones, JSON.stringify(milestones));
    } catch {}
  }, [milestones]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.snowEnabled, JSON.stringify(snowEnabled));
    } catch {}
  }, [snowEnabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.widgetMode, JSON.stringify(widgetMode));
    } catch {}
  }, [widgetMode]);

  // Calculate Christmas Countdown state targeting December 25, 2026 local time
  const countdown: CountdownState = useMemo(
    () =>
      calculateChristmasCountdown(now, {
        targetYearOverride: 2026,
      }),
    [now]
  );

  // Sorted 4 Milestones
  const sortedMilestones = useMemo(
    () =>
      [...milestones].sort(
        (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
      ),
    [milestones]
  );

  // Dynamic Browser Tab Title
  useEffect(() => {
    if (countdown.isChristmasMorning) {
      document.title = '✦ Merry Christmas! ✦ — Frost & Wonder';
    } else {
      document.title = `✦ ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s — Frost & Wonder`;
    }
  }, [countdown]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    window.setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 6000);
  };

  // Toggle manual completion of a milestone
  const handleToggleMilestoneDone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  // Trigger swirling snow inside the snow globe on interaction
  const triggerSnowSwirl = () => {
    setIsSwirling(true);
    if (swirlTimeoutRef.current) window.clearTimeout(swirlTimeoutRef.current);
    swirlTimeoutRef.current = window.setTimeout(() => {
      setIsSwirling(false);
    }, 2800);
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
      milestones: sortedMilestones,
      now,
      heroImage: heroImageRef.current,
      snowGlobeImage: snowGlobeImageRef.current,
      includeSimulatedMacClockOverlay: withClockOverlay,
      includeSnowGlobe: true,
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
        : selectedResolution === 'mobile_1290x2796'
        ? '1290x2796-Mobile'
        : '2560x1440-QHD';
    link.download = `Frost-and-Wonder-Lock-Screen-${resTag}.png`;
    link.href = dataUrl;
    link.click();

    setExportedPngPreviewUrl(dataUrl);
    showToast(
      `Downloaded ${spec.shortLabel} Lock-Screen Wallpaper (.PNG). Static image snapshot—set as your lock-screen wallpaper.`
    );
  };

  const handleOpenExportedPngPreview = () => {
    const dataUrl = generateWallpaperDataUrl(selectedResolution, false);
    setExportedPngPreviewUrl(dataUrl);
  };

  // Download .ICS Reminder File
  const handleExportIcsReminders = () => {
    const icsContent = generateMilestoneIcsContent(sortedMilestones, 24);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Frost-and-Wonder-Christmas-Milestones.ics';
    a.click();
    URL.revokeObjectURL(url);

    showToast(
      'Downloaded .ICS calendar file (4 milestones). Open and import the file in Apple Calendar or Google Calendar to activate reminders.'
    );
  };

  const formattedMacDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getMilestoneIcon = (icon: string) => {
    switch (icon) {
      case 'star':
        return <Star className="h-4 w-4 text-amber-300" />;
      case 'shopping':
        return <ShoppingBag className="h-4 w-4 text-sky-300" />;
      case 'gift':
        return <Gift className="h-4 w-4 text-indigo-300" />;
      case 'tree':
      default:
        return <TreePine className="h-4 w-4 text-emerald-300" />;
    }
  };

  return (
    <div
      className={`relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-[#020718] text-slate-100 select-none ${
        widgetMode ? 'p-2 sm:p-4' : ''
      }`}
    >
      {/* Full-Screen Winter Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <img
          src={GENERATED_ASSETS.heroIcePalace}
          alt="Enchanted Winter Ice Palace Background"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020718]/60 via-[#05143a]/40 to-[#020718]/95" />
        <div className="animate-aurora absolute left-1/4 top-1/4 h-96 w-1/2 rounded-full bg-gradient-to-r from-sky-400/25 via-purple-500/20 to-amber-200/10 blur-3xl" />
      </div>

      {/* Falling Snow Canvas */}
      <SnowfallCanvas
        intensity={countdown.magicIntensity}
        isChristmasMorning={countdown.isChristmasMorning}
        enabled={snowEnabled}
      />

      {/* Top Space for System Clock Preview or Native Clearance */}
      {!widgetMode && (
        <header className="relative z-20 flex min-h-[14vh] flex-col items-center justify-center px-4 pt-4 text-center">
          {showMacClock ? (
            <div data-testid="mac-clock-preview" className="animate-fade-in">
              <div className="text-xs font-semibold tracking-wide text-slate-200/90 drop-shadow sm:text-sm">
                {formattedMacDate}
              </div>
              <div className="font-sans text-6xl font-bold tracking-tight text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.7)] sm:text-7xl">
                9:41
              </div>
            </div>
          ) : (
            <div
              data-testid="mac-clock-negative-space"
              className="h-10 w-full"
              aria-label="Open space reserved for system Lock Screen Clock"
            />
          )}
        </header>
      )}

      {/* Main Experience: Split Two-Column on Desktop, Stacked on Mobile */}
      <main
        className={`relative z-20 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 ${
          widgetMode ? 'py-2' : 'py-4'
        }`}
      >
        <div className="grid w-full items-center gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: The Signature Enchanted Snow Globe */}
          <div className="flex flex-col items-center justify-center lg:col-span-5">
            <div
              onClick={triggerSnowSwirl}
              onMouseEnter={triggerSnowSwirl}
              role="button"
              tabIndex={0}
              aria-label="Enchanted Christmas Snow Globe. Click or hover to swirl magical snow."
              className="group relative cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
            >
              {/* Outer Ambient Glow */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-sky-400/30 via-indigo-500/20 to-amber-200/15 blur-2xl transition duration-500 group-hover:from-sky-400/45 group-hover:blur-3xl" />

              {/* Snow Globe Image Container */}
              <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-sky-200/70 shadow-[0_12px_45px_rgba(3,10,30,0.85)] sm:h-80 sm:w-80 lg:h-96 lg:w-96">
                <img
                  src={GENERATED_ASSETS.snowGlobeCottage}
                  alt="Enchanted Crystal Snow Globe with Cozy Winter Cottage"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Swirling particle overlay on interaction */}
                {isSwirling && (
                  <div className="pointer-events-none absolute inset-0 animate-spin bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-sky-300/10 to-transparent duration-1000" />
                )}

                {/* Crystal curved glass highlight */}
                <div className="pointer-events-none absolute -inset-full rotate-45 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
              </div>

              {/* Interactive Swirl Hint Pill */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-sky-200/80 drop-shadow">
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span>{isSwirling ? 'Swirling Christmas Magic…' : 'Tap or hover to swirl snow'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, 4-Box Countdown, and 4 Glowing Milestones */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Header / Brand */}
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.28em] text-amber-200/95 uppercase sm:text-sm">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Frost &amp; Wonder</span>
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>

            <h1
              data-testid="main-countdown-heading"
              className="font-serif-display mt-1 text-4xl font-bold tracking-tight text-white drop-shadow-[0_8px_32px_rgba(2,6,23,0.9)] sm:text-6xl lg:text-7xl"
            >
              Christmas Countdown
            </h1>

            {/* Target Date Pill */}
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-950/40 px-4 py-1 text-xs font-semibold tracking-wider text-sky-200 backdrop-blur-md">
              <Calendar className="h-3.5 w-3.5 text-sky-300" />
              <span>DECEMBER 25, {countdown.targetYear}</span>
            </div>

            {/* 4-Box Countdown Grid: DAYS, HOURS, MIN, SEC (Live ticking every second) */}
            <div
              data-testid="four-box-countdown"
              className="mt-5 grid grid-cols-4 gap-2.5 sm:gap-3.5"
            >
              {[
                { label: 'DAYS', val: countdown.days },
                { label: 'HOURS', val: countdown.hours },
                { label: 'MIN', val: countdown.minutes },
                { label: 'SEC', val: countdown.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="flex flex-col items-center justify-center rounded-2xl border border-sky-200/25 bg-slate-950/65 px-3 py-3 shadow-[0_8px_24px_rgba(2,6,23,0.6)] backdrop-blur-xl sm:px-5 sm:py-4"
                >
                  <span className="font-mono-tabular text-3xl font-bold text-white drop-shadow-[0_4px_16px_rgba(56,189,248,0.4)] sm:text-5xl">
                    {String(unit.val).padStart(2, '0')}
                  </span>
                  <span className="mt-1 text-[10px] font-bold tracking-wider text-sky-200/80 sm:text-xs">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Section Divider: —— Your Christmas Milestones —— */}
            <div className="mt-6 flex w-full items-center justify-center gap-3 lg:justify-start">
              <span className="h-px w-8 bg-sky-200/30 sm:w-16" />
              <span className="text-xs font-bold tracking-wider text-sky-100/90 uppercase sm:text-sm">
                Your Christmas Milestones
              </span>
              <span className="h-px w-8 bg-sky-200/30 sm:w-16" />
            </div>

            {/* Four Preloaded Milestones with Signature Glowing Highlight */}
            <div
              data-testid="milestone-stack-container"
              className="mt-3 flex w-full flex-col gap-2.5"
            >
              {sortedMilestones.map((ms) => {
                const status = getMilestoneDisplayStatus(ms, now, sortedMilestones);
                const isGlowingUpcoming = status.isGlow;

                return (
                  <div
                    key={ms.id}
                    data-testid={`milestone-item-${ms.id}`}
                    onClick={() => handleToggleMilestoneDone(ms.id)}
                    role="button"
                    tabIndex={0}
                    title="Click to toggle completed"
                    className={`group relative flex items-center justify-between rounded-2xl border px-4 py-2.5 text-left transition duration-300 sm:px-5 sm:py-3 cursor-pointer ${
                      isGlowingUpcoming
                        ? 'border-sky-300/90 bg-gradient-to-r from-sky-500/25 via-cyan-500/20 to-indigo-500/25 shadow-[0_0_24px_rgba(56,189,248,0.45)] ring-2 ring-sky-300/40 backdrop-blur-xl'
                        : status.state === 'completed'
                        ? 'border-emerald-400/40 bg-emerald-950/25 opacity-80 backdrop-blur-md'
                        : status.state === 'past'
                        ? 'border-white/5 bg-slate-950/40 opacity-60 backdrop-blur-md'
                        : 'border-white/10 bg-slate-900/50 backdrop-blur-md hover:border-white/20'
                    }`}
                  >
                    {/* Left: Icon, T-minus badge, and title */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                          isGlowingUpcoming
                            ? 'border-sky-300/60 bg-sky-400/20'
                            : status.state === 'completed'
                            ? 'border-emerald-300/40 bg-emerald-400/10'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        {status.state === 'completed' ? (
                          <Check className="h-4 w-4 text-emerald-300" />
                        ) : (
                          getMilestoneIcon(ms.icon)
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span
                          className={`font-mono-tabular text-xs font-bold tracking-wider sm:text-sm ${
                            isGlowingUpcoming
                              ? 'text-amber-200'
                              : status.state === 'completed'
                              ? 'text-emerald-300 line-through decoration-emerald-400/60'
                              : status.state === 'past'
                              ? 'text-slate-400'
                              : 'text-sky-200'
                          }`}
                        >
                          {status.tMinusText} · {status.formattedDate}
                        </span>

                        <span
                          className={`text-xs font-semibold sm:text-sm ${
                            isGlowingUpcoming
                              ? 'text-white'
                              : status.state === 'completed'
                              ? 'text-slate-300 line-through'
                              : status.state === 'past'
                              ? 'text-slate-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {status.shortTitle}
                        </span>
                      </div>
                    </div>

                    {/* Right: Next Up Badge or Completed Tag */}
                    <div className="flex items-center gap-2">
                      {status.badgeText && (
                        <span
                          data-testid="next-up-badge"
                          className="inline-flex items-center gap-1 rounded-full border border-sky-300/70 bg-sky-400/25 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                        >
                          <Sparkles className="h-3 w-3 text-sky-200" />
                          {status.badgeText}
                        </span>
                      )}

                      {status.state === 'completed' && (
                        <span className="text-[11px] font-bold text-emerald-300">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Discreet Widget Mode Toggle in Bottom-Right or Top-Right */}
      {widgetMode ? (
        <div className="fixed bottom-3 right-3 z-50">
          <button
            type="button"
            onClick={() => setWidgetMode(false)}
            title="Expand Controls & Wallpaper Exports"
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/25 bg-slate-950/80 px-3.5 py-1.5 text-xs font-medium text-sky-200 shadow-xl backdrop-blur-xl transition hover:bg-slate-900 hover:text-white"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Full View</span>
          </button>
        </div>
      ) : (
        /* Standard View Bottom Controls */
        <footer className="relative z-20 mx-auto w-full max-w-5xl px-4 pb-4">
          {statusToast && (
            <div
              role="status"
              data-testid="status-toast"
              className="mx-auto mb-3 max-w-2xl rounded-2xl border border-sky-200/25 bg-slate-950/90 px-4 py-2.5 text-center text-xs text-sky-100 shadow-xl backdrop-blur-xl animate-fade-in"
            >
              {statusToast}
            </div>
          )}

          <div className="mx-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-2 text-xs backdrop-blur-xl">
            {/* Resolution Selector */}
            <select
              aria-label="Wallpaper resolution"
              value={selectedResolution}
              onChange={(e) =>
                setSelectedResolution(e.target.value as WallpaperResolutionId)
              }
              className="rounded-xl border border-white/15 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none"
            >
              <option value="qhd_2560x1440">Desktop 2560 × 1440 (QHD)</option>
              <option value="uhd_3840x2160">Desktop 3840 × 2160 (True 4K)</option>
              <option value="mobile_1290x2796">Mobile 1290 × 2796 (Phone)</option>
            </select>

            {/* Download Wallpaper PNG Button */}
            <button
              type="button"
              onClick={handleDownloadWallpaperPng}
              data-testid="download-wallpaper-btn"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-300 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-200"
            >
              <Download className="h-3.5 w-3.5" />
              Download Wallpaper (.PNG)
            </button>

            {/* View Exported PNG */}
            <button
              type="button"
              onClick={handleOpenExportedPngPreview}
              data-testid="preview-exported-png-btn"
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200/25 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-sky-100 transition hover:bg-slate-800"
            >
              <Eye className="h-3.5 w-3.5" />
              View PNG
            </button>

            {/* Widget Mode Toggle */}
            <button
              type="button"
              onClick={() => setWidgetMode(true)}
              data-testid="widget-mode-toggle"
              title="Hide controls and display only the live ticking countdown, snow globe, and 4 milestones"
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-950/50 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-900/60"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              Widget Mode
            </button>

            {/* AI Architecture Plan Modal Button */}
            <button
              type="button"
              onClick={() => setShowAiPlanModal(true)}
              data-testid="ai-plan-btn"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-slate-800"
            >
              <Info className="h-3.5 w-3.5" />
              Gemini Milestone Plan
            </button>

            {/* Calendar Reminder (.ICS) */}
            <button
              type="button"
              onClick={handleExportIcsReminders}
              data-testid="export-ics-reminders-btn"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:text-white"
            >
              <Calendar className="h-3.5 w-3.5 text-sky-300" />
              Reminders (.ICS)
            </button>

            {/* Falling Snow Toggle */}
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

            {/* Clock Overlay Toggle */}
            <button
              type="button"
              onClick={() => setShowMacClock((c) => !c)}
              aria-pressed={showMacClock}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
            >
              {showMacClock ? 'Hide Clock' : 'Preview Clock'}
            </button>

            {/* PWA Install Button if available */}
            {isInstallable && (
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-sky-300"
              >
                Install App
              </button>
            )}

            {isIOS && !isInstalled && (
              <button
                type="button"
                onClick={() => setShowPwaModal(true)}
                className="rounded-xl border border-white/15 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
              >
                Install on iOS
              </button>
            )}
          </div>
        </footer>
      )}

      {/* AI Milestone Architecture Plan Modal */}
      {showAiPlanModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gemini Milestone Planning Architecture"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-lg space-y-4 rounded-3xl border border-sky-200/25 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <h2 className="font-serif-display text-2xl font-bold text-white">
                  Gemini Milestone Architecture
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPlanModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-300">
              For the Handshake <em>&quot;Your Deadline, Your Design&quot;</em> challenge,
              Gemini assisted in backward-planning the major December 25 deadline into four achievable, stress-free checkpoints:
            </p>

            <div className="space-y-2.5 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-mono-tabular font-bold text-amber-200">T–14 (Dec 11):</span>
                <span className="text-slate-200"><strong>Finalize gift lists</strong> — Locks wishlists before holiday order deadlines.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono-tabular font-bold text-sky-200">T–7 (Dec 18):</span>
                <span className="text-slate-200"><strong>Finish holiday shopping</strong> — Protects against shipping delays and rush fees.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono-tabular font-bold text-indigo-200">T–3 (Dec 22):</span>
                <span className="text-slate-200"><strong>Wrap gifts and prepare</strong> — Enjoy cozy ribbon tying and card writing.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono-tabular font-bold text-emerald-200">T–1 (Dec 24):</span>
                <span className="text-slate-200"><strong>Complete final preparations</strong> — Stage presents under the tree for Christmas morning.</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              As dates advance in local time, Frost &amp; Wonder automatically shifts the soft icy-blue glow to the next upcoming milestone.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAiPlanModal(false)}
                className="rounded-xl bg-amber-300 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-200"
              >
                Close Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Instructions Modal */}
      {showPwaModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install on iPhone / iPad"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-sky-200/25 bg-slate-900 p-6 shadow-2xl">
            <h3 className="font-serif-display text-2xl font-bold text-white">
              Install on iPhone or iPad
            </h3>
            <p className="text-xs leading-relaxed text-slate-300">
              To add Frost &amp; Wonder to your iOS Home Screen for instant offline access:
            </p>
            <ol className="list-decimal space-y-1.5 pl-5 text-xs text-slate-200">
              <li>Tap the <strong>Share</strong> button in Safari toolbar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in the top-right corner.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowPwaModal(false)}
              className="mt-4 w-full rounded-xl bg-sky-400 py-2 text-xs font-bold text-slate-950 hover:bg-sky-300"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Exported Wallpaper PNG Modal */}
      {exportedPngPreviewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Exported Lock-Screen Wallpaper PNG Preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xl"
        >
          <div className="w-full max-w-5xl space-y-3 rounded-3xl border border-sky-200/25 bg-slate-900/95 p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif-display text-2xl font-semibold text-white">
                  Exported Lock-Screen Wallpaper (.PNG)
                </h2>
                <p className="text-xs text-slate-400">
                  {WALLPAPER_RESOLUTIONS[selectedResolution].shortLabel} · Static wallpaper snapshot leaving open space for your device&apos;s system clock.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={exportedPngPreviewUrl}
                  download={`Frost-and-Wonder-Lock-Screen-${
                    selectedResolution === 'uhd_3840x2160'
                      ? '3840x2160-4K'
                      : selectedResolution === 'mobile_1290x2796'
                      ? '1290x2796-Mobile'
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
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-2xl border border-sky-200/20 bg-slate-950 p-2">
              <img
                src={exportedPngPreviewUrl}
                alt="Exported Frost & Wonder Lock-Screen Wallpaper PNG"
                data-testid="actual-exported-wallpaper-img"
                className="max-h-[66vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
