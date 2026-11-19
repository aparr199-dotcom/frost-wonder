import { CountdownState, HolidayMilestone } from '../types/holiday';
import { getChronologicalLockScreenMilestones } from './holidayLogic';

export interface RenderLockScreenOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  countdown: CountdownState;
  milestones: HolidayMilestone[];
  now: Date;
  heroImage: HTMLImageElement | null;
  /**
   * When true, previews the macOS Lock Screen clock in the top open space.
   * When false (default for actual exported wallpaper PNG), leaves the top space completely clear for macOS.
   */
  includeSimulatedMacClockOverlay: boolean;
  /**
   * Whether to include the jewel-like Enchanted Snow Globe above the countdown (default true).
   */
  includeSnowGlobe?: boolean;
  /**
   * Number of small chronological milestones in the minimal bottom timeline (3 or 4, default 4).
   */
  milestoneCount?: 3 | 4 | 5;
}

function formatConciseTimelineTitle(rawTitle: string): string {
  const cleaned = rawTitle
    .replace(/\s+Evening$/i, '')
    .replace(/\s+Hearth\s*&\s*Magic$/i, '')
    .replace(/^Time to Decorate the\s+/i, '')
    .replace(/^Holiday\s+/i, '')
    .replace(/\s+&\s+Ribbon\s+/i, ' ')
    .trim();
  if (cleaned.length <= 22) return cleaned;
  return `${cleaned.slice(0, 20).trim()}…`;
}

function drawStarSnowflake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  color = '255, 255, 255'
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = `rgba(${color}, ${alpha})`;
  ctx.lineWidth = Math.max(1, radius * 0.22);
  ctx.lineCap = 'round';
  for (let arm = 0; arm < 3; arm++) {
    ctx.save();
    ctx.rotate((arm * Math.PI) / 3);
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, radius);
    ctx.stroke();

    const branchPos = radius * 0.52;
    const branchLen = radius * 0.32;
    ctx.beginPath();
    ctx.moveTo(-branchLen, -branchPos - branchLen * 0.45);
    ctx.lineTo(0, -branchPos);
    ctx.lineTo(branchLen, -branchPos - branchLen * 0.45);
    ctx.moveTo(-branchLen, branchPos + branchLen * 0.45);
    ctx.lineTo(0, branchPos);
    ctx.lineTo(branchLen, branchPos + branchLen * 0.45);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function renderLockScreenToCanvas(options: RenderLockScreenOptions): void {
  const {
    canvas,
    width,
    height,
    countdown,
    milestones,
    now,
    heroImage,
    includeSimulatedMacClockOverlay,
    includeSnowGlobe = true,
    milestoneCount = 4,
  } = options;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = width / 2560; // Base coordinate system designed at 2560x1440 (16:9)

  ctx.save();

  // 1. FULL-BLEED WINTER SCENE
  if (heroImage && heroImage.complete && heroImage.naturalWidth > 0) {
    ctx.drawImage(heroImage, 0, 0, width, height);
  } else {
    const fallbackGrad = ctx.createLinearGradient(0, 0, 0, height);
    fallbackGrad.addColorStop(0, '#04091a');
    fallbackGrad.addColorStop(0.48, '#0b1d3e');
    fallbackGrad.addColorStop(1, '#030714');
    ctx.fillStyle = fallbackGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle atmospheric shading: keeps the Ice Palace luminous while ensuring crisp typography
  const atmosphereScrim = ctx.createLinearGradient(0, 0, 0, height);
  atmosphereScrim.addColorStop(0, 'rgba(4, 9, 24, 0.38)');
  atmosphereScrim.addColorStop(0.32, 'rgba(6, 13, 31, 0.10)');
  atmosphereScrim.addColorStop(0.64, 'rgba(6, 14, 34, 0.24)');
  atmosphereScrim.addColorStop(0.80, 'rgba(4, 10, 26, 0.72)');
  atmosphereScrim.addColorStop(1, 'rgba(3, 7, 18, 0.92)');
  ctx.fillStyle = atmosphereScrim;
  ctx.fillRect(0, 0, width, height);

  // Soft icy-blue and lavender aurora glow
  const aurora = ctx.createRadialGradient(
    width * 0.5,
    height * 0.44,
    30 * scale,
    width * 0.5,
    height * 0.44,
    760 * scale
  );
  aurora.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
  aurora.addColorStop(0.5, 'rgba(167, 139, 250, 0.16)');
  aurora.addColorStop(1, 'rgba(6, 12, 28, 0)');
  ctx.fillStyle = aurora;
  ctx.fillRect(0, 0, width, height);

  // Gentle drifting snow across the sky
  for (let i = 0; i < 95; i++) {
    const fx = ((i * 257 + 91) % 2560) * scale;
    const fy = ((i * 311 + 59) % 1340) * scale;
    if (fy > 980 * scale && fx > 680 * scale && fx < 1880 * scale) continue;

    if (i % 12 === 0) {
      drawStarSnowflake(
        ctx,
        fx,
        fy,
        ((i % 3) + 5) * scale,
        0.42,
        '224, 242, 254'
      );
    } else {
      const fr = ((i % 3) + 1.3) * scale;
      ctx.fillStyle =
        i % 4 === 0
          ? 'rgba(186, 230, 253, 0.45)'
          : 'rgba(255, 255, 255, 0.34)';
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. TOP OPEN SPACE FOR MACOS SYSTEM CLOCK (Y = 0 to 380 * scale)
  if (includeSimulatedMacClockOverlay) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(2, 6, 23, 0.65)';
    ctx.shadowBlur = 18 * scale;

    ctx.fillStyle = 'rgba(226, 232, 240, 0.92)';
    ctx.font = `600 ${Math.round(32 * scale)}px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif`;
    const dateLabel = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(dateLabel, width * 0.5, 122 * scale);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.font = `700 ${Math.round(156 * scale)}px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('9:41', width * 0.5, 272 * scale);
    ctx.restore();
  }

  const centerX = width * 0.5;

  // 3. OPTIONAL ENCHANTED SNOW GLOBE CENTERPIECE
  if (includeSnowGlobe) {
    const globeCx = centerX;
    const globeCy = 635 * scale;
    const globeR = 220 * scale;

    const outerHalo = ctx.createRadialGradient(
      globeCx,
      globeCy,
      globeR * 0.5,
      globeCx,
      globeCy,
      globeR * 1.45
    );
    outerHalo.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
    outerHalo.addColorStop(0.55, 'rgba(167, 139, 250, 0.18)');
    outerHalo.addColorStop(1, 'rgba(6, 12, 28, 0)');
    ctx.fillStyle = outerHalo;
    ctx.beginPath();
    ctx.arc(globeCx, globeCy, globeR * 1.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
    ctx.clip();

    const domeSky = ctx.createRadialGradient(
      globeCx,
      globeCy - 30 * scale,
      16 * scale,
      globeCx,
      globeCy,
      globeR
    );
    domeSky.addColorStop(0, '#1e3a8a');
    domeSky.addColorStop(0.45, '#0369a1');
    domeSky.addColorStop(0.78, '#082f49');
    domeSky.addColorStop(1, '#020b1c');
    ctx.fillStyle = domeSky;
    ctx.fillRect(globeCx - globeR, globeCy - globeR, globeR * 2, globeR * 2);

    const horizonY = globeCy + 66 * scale;

    // Illuminated Ferris Wheel inside Globe
    const wheelCx = globeCx - 30 * scale;
    const wheelCy = horizonY - 102 * scale;
    const wheelR = 84 * scale;

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(wheelCx - 38 * scale, horizonY);
    ctx.lineTo(wheelCx, wheelCy);
    ctx.lineTo(wheelCx + 38 * scale, horizonY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(240, 249, 255, 0.9)';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.arc(wheelCx, wheelCy, wheelR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(wheelCx, wheelCy, wheelR * 0.76, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const gx = wheelCx + Math.cos(angle) * wheelR;
      const gy = wheelCy + Math.sin(angle) * wheelR;

      ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(wheelCx, wheelCy);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(gx, gy, 3.6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(wheelCx, wheelCy, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Snow-Laden Evergreens
    const drawSnowPine = (dx: number, treeW: number, treeH: number) => {
      const tx = globeCx + dx * scale;
      const baseY = horizonY + 5 * scale;
      const tw = treeW * scale;
      const th = treeH * scale;
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
      { dx: -152, w: 50, h: 94 },
      { dx: -120, w: 58, h: 114 },
      { dx: -90, w: 44, h: 84 },
      { dx: 104, w: 48, h: 92 },
      { dx: 132, w: 58, h: 116 },
      { dx: 158, w: 46, h: 86 },
    ].forEach((t) => drawSnowPine(t.dx, t.w, t.h));

    // Warm-Lit Alpine Castle Towers & Cottages
    const drawTower = (dx: number, w: number, h: number, roofH: number) => {
      const bx = globeCx + dx * scale;
      const bw = w * scale;
      const bh = h * scale;
      const br = roofH * scale;
      const topY = horizonY - bh;

      const wallGrad = ctx.createLinearGradient(bx - bw / 2, topY, bx + bw / 2, horizonY);
      wallGrad.addColorStop(0, '#f8fafc');
      wallGrad.addColorStop(0.5, '#fed7aa');
      wallGrad.addColorStop(1, '#f97316');
      ctx.fillStyle = wallGrad;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.rect(bx - bw / 2, topY, bw, bh);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2 - 4 * scale, topY);
      ctx.lineTo(bx, topY - br);
      ctx.lineTo(bx + bw / 2 + 4 * scale, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(
        bx - 5.5 * scale,
        horizonY - bh * 0.62,
        11 * scale,
        16 * scale,
        4 * scale
      );
      ctx.roundRect(
        bx - 6.5 * scale,
        horizonY - 24 * scale,
        13 * scale,
        22 * scale,
        5 * scale
      );
      ctx.fill();
    };

    drawTower(-68, 32, 38, 18);
    drawTower(-38, 30, 66, 26);
    drawTower(-6, 42, 58, 22);
    drawTower(30, 34, 98, 34);
    drawTower(66, 42, 122, 40);
    drawTower(98, 28, 58, 22);

    // Luminous Cyan-Blue Snowdrift Bowl
    const bowlGrad = ctx.createLinearGradient(
      globeCx,
      horizonY - 4 * scale,
      globeCx,
      globeCy + globeR
    );
    bowlGrad.addColorStop(0, '#ffffff');
    bowlGrad.addColorStop(0.2, '#bae6fd');
    bowlGrad.addColorStop(0.52, '#0ea5e9');
    bowlGrad.addColorStop(1, '#04132c');
    ctx.fillStyle = bowlGrad;
    ctx.fillRect(globeCx - globeR, horizonY, globeR * 2, globeR);

    for (let s = 0; s < 65; s++) {
      const angle = s * 1.65;
      const dist = ((s * 27) % 196) * scale;
      const sx = globeCx + Math.cos(angle) * dist;
      const sy = globeCy + Math.sin(angle * 1.25) * dist * 0.86;
      ctx.fillStyle =
        s % 5 === 0
          ? 'rgba(254, 240, 138, 0.85)'
          : 'rgba(255, 255, 255, 0.82)';
      ctx.beginPath();
      ctx.arc(sx, sy, ((s % 3) + 1.5) * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crescent Glass Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.56)';
    ctx.lineWidth = 7 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(globeCx, globeCy, globeR - 13 * scale, Math.PI * 1.05, Math.PI * 1.45);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(224, 242, 254, 0.82)';
    ctx.lineWidth = 2.8 * scale;
    ctx.beginPath();
    ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
    ctx.stroke();

    // Ornate Midnight-Blue Porcelain & Gold Filigree Base
    const neckY = globeCy + globeR - 16 * scale;
    const baseBottomY = neckY + 94 * scale;
    const topHalfW = 154 * scale;
    const bottomHalfW = 200 * scale;

    const pedGrad = ctx.createLinearGradient(
      globeCx - bottomHalfW,
      neckY,
      globeCx + bottomHalfW,
      baseBottomY
    );
    pedGrad.addColorStop(0, '#020714');
    pedGrad.addColorStop(0.28, '#0a1d42');
    pedGrad.addColorStop(0.5, '#1d4ed8');
    pedGrad.addColorStop(0.72, '#0a1d42');
    pedGrad.addColorStop(1, '#020612');

    ctx.fillStyle = pedGrad;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(globeCx - topHalfW, neckY);
    ctx.quadraticCurveTo(globeCx, neckY + 14 * scale, globeCx + topHalfW, neckY);
    ctx.lineTo(globeCx + bottomHalfW, baseBottomY);
    ctx.quadraticCurveTo(
      globeCx,
      baseBottomY + 18 * scale,
      globeCx - bottomHalfW,
      baseBottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Beaded gold trim
    ctx.fillStyle = '#fde047';
    for (let b = 0; b <= 34; b++) {
      const t = b / 34;
      const bx = globeCx - topHalfW * 0.95 + t * topHalfW * 1.9;
      const by = neckY + 12 * scale + Math.sin(t * Math.PI) * 9 * scale;
      ctx.beginPath();
      ctx.arc(bx, by, 2.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let b = 0; b <= 44; b++) {
      const t = b / 44;
      const bx = globeCx - bottomHalfW * 0.95 + t * bottomHalfW * 1.9;
      const by = baseBottomY - 3 * scale + Math.sin(t * Math.PI) * 12 * scale;
      ctx.beginPath();
      ctx.arc(bx, by, 2.4 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gold botanical filigree branch & leaves on pedestal
    [-1, 1].forEach((dir) => {
      ctx.save();
      ctx.translate(globeCx, neckY + 52 * scale);
      ctx.scale(dir, 1);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(16 * scale, 6 * scale);
      ctx.bezierCurveTo(
        56 * scale,
        -16 * scale,
        104 * scale,
        18 * scale,
        162 * scale,
        -5 * scale
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(62 * scale, -3 * scale);
      ctx.quadraticCurveTo(96 * scale, -22 * scale, 132 * scale, -15 * scale);
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      [
        { x: 38, y: -3, a: -0.45, rx: 8, ry: 3 },
        { x: 58, y: 7, a: 0.4, rx: 8.5, ry: 3.2 },
        { x: 86, y: -13, a: -0.5, rx: 7.5, ry: 2.8 },
        { x: 102, y: 5, a: 0.35, rx: 9, ry: 3.2 },
        { x: 126, y: -17, a: -0.3, rx: 7.5, ry: 2.8 },
        { x: 142, y: 2, a: 0.25, rx: 8.5, ry: 3 },
      ].forEach((lf) => {
        ctx.save();
        ctx.translate(lf.x * scale, lf.y * scale);
        ctx.rotate(lf.a);
        ctx.beginPath();
        ctx.ellipse(0, 0, lf.rx * scale, lf.ry * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    });

    // Central golden rosette on pedestal
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(globeCx, neckY + 54 * scale, 4.2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Soft foreground snowbanks nestling the bottom of the pedestal
    const snowbankGrad = ctx.createLinearGradient(
      globeCx,
      baseBottomY - 6 * scale,
      globeCx,
      baseBottomY + 28 * scale
    );
    snowbankGrad.addColorStop(0, '#ffffff');
    snowbankGrad.addColorStop(0.55, '#bae6fd');
    snowbankGrad.addColorStop(1, 'rgba(7, 18, 42, 0)');
    ctx.fillStyle = snowbankGrad;
    ctx.beginPath();
    ctx.ellipse(
      globeCx - 150 * scale,
      baseBottomY + 8 * scale,
      96 * scale,
      14 * scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.ellipse(
      globeCx + 150 * scale,
      baseBottomY + 8 * scale,
      96 * scale,
      14 * scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.ellipse(
      globeCx,
      baseBottomY + 12 * scale,
      180 * scale,
      12 * scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // 4. PROMINENT CHRISTMAS COUNTDOWN HEADLINE ("36 Days Until Christmas")
  const countdownY = (includeSnowGlobe ? 1085 : 960) * scale;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(2, 6, 23, 0.92)';
  ctx.shadowBlur = 26 * scale;

  // Subtle title & target date above the big countdown
  ctx.fillStyle = 'rgba(253, 230, 138, 0.92)';
  ctx.font = `600 ${Math.round(18 * scale)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(
    `✦   F R O S T   &   W O N D E R   ·   D E C E M B E R   2 5 ,   ${countdown.targetYear}   ✦`,
    centerX,
    countdownY - 76 * scale
  );

  if (countdown.isChristmasMorning) {
    ctx.fillStyle = '#fef08a';
    ctx.font = `700 ${Math.round(92 * scale)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText('Merry Christmas', centerX, countdownY);
  } else {
    const dayWord = countdown.days === 1 ? 'Day' : 'Days';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(94 * scale)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(
      `${countdown.days} ${dayWord} Until Christmas`,
      centerX,
      countdownY
    );
  }
  ctx.restore();

  // 5. THREE OR FOUR SMALL MILESTONES IN ONE MINIMAL TIMELINE UNDERNEATH
  const chronologicalMilestones = getChronologicalLockScreenMilestones(
    milestones,
    countdown.targetYear,
    milestoneCount
  );

  const count = Math.max(1, chronologicalMilestones.length);
  const timelineW = (count === 3 ? 1320 : 1620) * scale;
  const timelineH = 96 * scale;
  const timelineX = centerX - timelineW / 2;
  const timelineY = (includeSnowGlobe ? 1175 : 1070) * scale;

  ctx.save();
  ctx.fillStyle = 'rgba(4, 10, 25, 0.52)';
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.22)';
  ctx.lineWidth = 1.4 * scale;
  ctx.beginPath();
  ctx.roundRect(timelineX, timelineY, timelineW, timelineH, 48 * scale);
  ctx.fill();
  ctx.stroke();

  const nodeY = timelineY + 32 * scale;
  const firstNodeX = timelineX + 185 * scale;
  const lastNodeX = timelineX + timelineW - 185 * scale;
  const stepSpan = count > 1 ? (lastNodeX - firstNodeX) / (count - 1) : 0;

  if (count > 1) {
    const threadGrad = ctx.createLinearGradient(firstNodeX, nodeY, lastNodeX, nodeY);
    threadGrad.addColorStop(0, 'rgba(125, 211, 252, 0.3)');
    threadGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.5)');
    threadGrad.addColorStop(1, 'rgba(125, 211, 252, 0.3)');
    ctx.strokeStyle = threadGrad;
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(firstNodeX, nodeY);
    ctx.lineTo(lastNodeX, nodeY);
    ctx.stroke();
  }

  chronologicalMilestones.forEach((ms, idx) => {
    const nx = count > 1 ? firstNodeX + idx * stepSpan : centerX;
    const parsedDate = new Date(ms.targetDate);
    const shortDate = Number.isNaN(parsedDate.getTime())
      ? 'DEC'
      : parsedDate
          .toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
          .toUpperCase();
    const shortTitle = formatConciseTimelineTitle(ms.title);

    ctx.fillStyle = 'rgba(5, 12, 28, 0.9)';
    ctx.beginPath();
    ctx.roundRect(nx - 52 * scale, nodeY - 13 * scale, 104 * scale, 26 * scale, 13 * scale);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = ms.completed ? '#6ee7b7' : '#fde047';
    ctx.font = `700 ${Math.round(15 * scale)}px "JetBrains Mono", monospace`;
    ctx.fillText(
      ms.completed ? `✓ ${shortDate}` : `✦ ${shortDate}`,
      nx,
      nodeY + 5 * scale
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = `600 ${Math.round(22 * scale)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(shortTitle, nx, timelineY + 72 * scale);
  });

  ctx.restore();
  ctx.restore();
}
