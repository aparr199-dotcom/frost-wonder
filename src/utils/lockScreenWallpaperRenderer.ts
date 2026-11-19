import { CountdownState, HolidayMilestone } from '../types/holiday';
import { getMilestoneDisplayStatus } from './holidayLogic';

export interface RenderLockScreenOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  countdown: CountdownState;
  milestones: HolidayMilestone[];
  now: Date;
  heroImage: HTMLImageElement | null;
  snowGlobeImage?: HTMLImageElement | null;
  /**
   * When true, previews the system Lock Screen clock in the top open space.
   * When false (default for actual exported wallpaper PNG), leaves the top space completely clear for the OS.
   */
  includeSimulatedMacClockOverlay: boolean;
  /**
   * Whether to include the snow globe in the wallpaper (default true).
   */
  includeSnowGlobe?: boolean;
}

export function renderLockScreenToCanvas(
  options: RenderLockScreenOptions
): void {
  const {
    canvas,
    width,
    height,
    countdown,
    milestones,
    now,
    heroImage,
    snowGlobeImage,
    includeSimulatedMacClockOverlay,
    includeSnowGlobe = true,
  } = options;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isPortrait = height > width;
  // Use responsive scale based on resolution
  const scale = isPortrait ? width / 1290 : width / 2560;

  ctx.save();

  // 1. FULL-BLEED VIBRANT WINTER BACKGROUND
  if (heroImage && heroImage.complete && heroImage.naturalWidth > 0) {
    ctx.drawImage(heroImage, 0, 0, width, height);
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#020718');
    bgGrad.addColorStop(0.35, '#06163a');
    bgGrad.addColorStop(0.7, '#082554');
    bgGrad.addColorStop(1, '#020817');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Atmospheric dark scrim with cyan and violet auroras
  const scrim = ctx.createLinearGradient(0, 0, 0, height);
  scrim.addColorStop(0, 'rgba(2, 7, 24, 0.55)');
  scrim.addColorStop(0.4, 'rgba(4, 14, 42, 0.35)');
  scrim.addColorStop(0.75, 'rgba(3, 10, 30, 0.65)');
  scrim.addColorStop(1, 'rgba(2, 6, 20, 0.92)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);

  // Vibrant Aurora Borealis glow across the sky
  const auroraGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.35,
    40 * scale,
    width * 0.5,
    height * 0.35,
    isPortrait ? width * 0.85 : 850 * scale
  );
  auroraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)'); // vivid cyan
  auroraGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.22)'); // electric violet
  auroraGrad.addColorStop(0.75, 'rgba(14, 165, 233, 0.12)');
  auroraGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = auroraGrad;
  ctx.fillRect(0, 0, width, height);

  // Delicate twinkling stars & snowflakes
  for (let i = 0; i < (isPortrait ? 80 : 120); i++) {
    const sx = ((i * 353 + 79) % width);
    const sy = ((i * 421 + 127) % height);
    const radius = ((i % 3) + 1.2) * scale;
    const alpha = (i % 5 === 0 ? 0.85 : 0.45);
    ctx.fillStyle =
      i % 4 === 0
        ? `rgba(254, 240, 138, ${alpha})`
        : `rgba(224, 242, 254, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. SIMULATED CLOCK OVERLAY (optional preview only)
  if (includeSimulatedMacClockOverlay) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(2, 6, 23, 0.8)';
    ctx.shadowBlur = 20 * scale;

    const clockY = isPortrait ? 280 * scale : 140 * scale;
    ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
    ctx.font = `600 ${Math.round((isPortrait ? 36 : 30) * scale)}px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif`;
    const dateLabel = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(dateLabel, width * 0.5, clockY);

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round((isPortrait ? 160 : 130) * scale)}px -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('9:41', width * 0.5, clockY + (isPortrait ? 150 : 120) * scale);
    ctx.restore();
  }

  // 3. LAYOUT LOGIC (Desktop Landscape vs Mobile Portrait)
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  if (!isPortrait) {
    // ---------------------------------------------------------------------------
    // DESKTOP TWO-COLUMN CINEMATIC LOCK SCREEN (Matches "xmas countdown.png")
    // Left: Snow Globe | Right: Christmas Countdown, 4-Box Grid & 4 Milestones
    // ---------------------------------------------------------------------------
    const leftColCenterX = width * 0.32;
    const rightColCenterX = width * 0.70;

    // Snow Globe on Left
    if (includeSnowGlobe) {
      const globeSize = 640 * scale;
      const globeY = height * 0.52 - globeSize / 2;
      const globeX = leftColCenterX - globeSize / 2;

      // Soft ambient glow behind globe
      const halo = ctx.createRadialGradient(
        leftColCenterX,
        globeY + globeSize * 0.48,
        globeSize * 0.15,
        leftColCenterX,
        globeY + globeSize * 0.48,
        globeSize * 0.75
      );
      halo.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      halo.addColorStop(0.5, 'rgba(192, 132, 252, 0.25)');
      halo.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(leftColCenterX, globeY + globeSize * 0.48, globeSize * 0.75, 0, Math.PI * 2);
      ctx.fill();

      if (snowGlobeImage && snowGlobeImage.complete && snowGlobeImage.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(leftColCenterX, globeY + globeSize * 0.5, globeSize * 0.48, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(snowGlobeImage, globeX, globeY, globeSize, globeSize);
        ctx.restore();

        // Delicate glass border ring
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.arc(leftColCenterX, globeY + globeSize * 0.5, globeSize * 0.48, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Right Column: Header, 4-box countdown, and 4 stacked milestones
    let currY = height * 0.22;

    // Small Top Title
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(253, 230, 138, 0.95)';
    ctx.font = `600 ${Math.round(20 * scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('✦   F R O S T   &   W O N D E R   ✦', rightColCenterX, currY);

    // Large Serif Heading
    currY += 56 * scale;
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(72 * scale)}px "Cormorant Garamond", Georgia, serif`;
    ctx.shadowColor = 'rgba(2, 6, 23, 0.9)';
    ctx.shadowBlur = 24 * scale;
    ctx.fillText('Christmas Countdown', rightColCenterX, currY);

    // Target Date Pill
    currY += 46 * scale;
    const pillW = 280 * scale;
    const pillH = 38 * scale;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.roundRect(rightColCenterX - pillW / 2, currY - 26 * scale, pillW, pillH, 19 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
    ctx.font = `700 ${Math.round(17 * scale)}px "JetBrains Mono", monospace`;
    ctx.fillText(`DECEMBER 25, ${countdown.targetYear}`, rightColCenterX, currY - 2 * scale);

    // 4-Box Countdown Grid: DAYS, HOURS, MIN, SEC
    currY += 60 * scale;
    const boxW = 150 * scale;
    const boxH = 110 * scale;
    const boxGap = 20 * scale;
    const totalBoxW = boxW * 4 + boxGap * 3;
    const startBoxX = rightColCenterX - totalBoxW / 2;

    const units = [
      { val: countdown.days, label: 'DAYS' },
      { val: countdown.hours, label: 'HOURS' },
      { val: countdown.minutes, label: 'MIN' },
      { val: countdown.seconds, label: 'SEC' },
    ];

    units.forEach((u, i) => {
      const bx = startBoxX + i * (boxW + boxGap);
      const by = currY;

      // Frosted card
      ctx.fillStyle = 'rgba(7, 18, 44, 0.65)';
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 20 * scale);
      ctx.fill();
      ctx.stroke();

      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(52 * scale)}px "JetBrains Mono", monospace`;
      ctx.fillText(String(u.val), bx + boxW / 2, by + 62 * scale);

      // Label
      ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
      ctx.font = `700 ${Math.round(14 * scale)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(u.label, bx + boxW / 2, by + 94 * scale);
    });

    // Milestone Section Divider: —— Your Christmas Milestones ——
    currY += boxH + 48 * scale;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.65)';
    ctx.font = `600 ${Math.round(18 * scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('——   Your Christmas Milestones   ——', rightColCenterX, currY);

    // 4 Stacked Milestone Cards
    currY += 28 * scale;
    const cardW = 660 * scale;
    const cardH = 58 * scale;
    const cardGap = 14 * scale;
    const cardX = rightColCenterX - cardW / 2;

    sortedMilestones.slice(0, 4).forEach((ms) => {
      const status = getMilestoneDisplayStatus(ms, now, sortedMilestones);
      const isHighlighted = status.isGlow;

      // Card Background
      if (isHighlighted) {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.28)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.2 * scale;
      } else if (status.state === 'completed') {
        ctx.fillStyle = 'rgba(6, 78, 59, 0.3)';
        ctx.strokeStyle = 'rgba(110, 231, 183, 0.4)';
        ctx.lineWidth = 1.4 * scale;
      } else if (status.state === 'past') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1.2 * scale;
      } else {
        ctx.fillStyle = 'rgba(7, 18, 44, 0.55)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.4 * scale;
      }

      ctx.beginPath();
      ctx.roundRect(cardX, currY, cardW, cardH, 22 * scale);
      ctx.fill();
      ctx.stroke();

      // Milestone text on Left
      ctx.textAlign = 'left';
      const textX = cardX + 28 * scale;
      const textY = currY + 36 * scale;

      // Date / T-minus tag
      ctx.fillStyle = isHighlighted
        ? '#fde047'
        : status.state === 'completed'
        ? '#6ee7b7'
        : status.state === 'past'
        ? '#94a3b8'
        : '#bae6fd';
      ctx.font = `700 ${Math.round(18 * scale)}px "JetBrains Mono", monospace`;
      const dateText = status.state === 'completed' ? `✓ ${status.tMinusText} · ${status.formattedDate}` : `${status.tMinusText} · ${status.formattedDate}`;
      ctx.fillText(dateText, textX, textY);

      // Title
      ctx.fillStyle = isHighlighted
        ? '#ffffff'
        : status.state === 'past'
        ? 'rgba(203, 213, 225, 0.6)'
        : '#f1f5f9';
      ctx.font = `600 ${Math.round(19 * scale)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(status.shortTitle, textX + 175 * scale, textY);

      // Next Up Badge on Right
      if (status.badgeText) {
        const badgeW = 92 * scale;
        const badgeH = 30 * scale;
        const badgeX = cardX + cardW - badgeW - 16 * scale;
        const badgeY = currY + (cardH - badgeH) / 2;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 15 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = `italic 700 ${Math.round(14 * scale)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(status.badgeText, badgeX + badgeW / 2, badgeY + 20 * scale);
      }

      currY += cardH + cardGap;
    });

  } else {
    // ---------------------------------------------------------------------------
    // MOBILE PORTRAIT CINEMATIC LOCK SCREEN (1290 × 2796)
    // Vertical Stack: Clearance for Clock -> Snow Globe -> Title -> 4-Box Grid -> 4 Milestones
    // ---------------------------------------------------------------------------
    const centerX = width * 0.5;
    let currY = 560 * scale; // Generous clearance for Phone Lock Screen Clock

    // Snow Globe
    if (includeSnowGlobe) {
      const globeSize = 560 * scale;
      const globeY = currY;
      const globeX = centerX - globeSize / 2;

      // Ambient halo
      const halo = ctx.createRadialGradient(
        centerX,
        globeY + globeSize * 0.5,
        globeSize * 0.15,
        centerX,
        globeY + globeSize * 0.5,
        globeSize * 0.72
      );
      halo.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
      halo.addColorStop(0.5, 'rgba(192, 132, 252, 0.22)');
      halo.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(centerX, globeY + globeSize * 0.5, globeSize * 0.72, 0, Math.PI * 2);
      ctx.fill();

      if (snowGlobeImage && snowGlobeImage.complete && snowGlobeImage.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, globeY + globeSize * 0.5, globeSize * 0.48, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(snowGlobeImage, globeX, globeY, globeSize, globeSize);
        ctx.restore();

        ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
        ctx.lineWidth = 5 * scale;
        ctx.beginPath();
        ctx.arc(centerX, globeY + globeSize * 0.5, globeSize * 0.48, 0, Math.PI * 2);
        ctx.stroke();
      }

      currY += globeSize + 60 * scale;
    }

    // Title & Countdown Heading
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(253, 230, 138, 0.95)';
    ctx.font = `700 ${Math.round(26 * scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('✦  FROST & WONDER  ✦', centerX, currY);

    currY += 70 * scale;
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(92 * scale)}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText('Christmas Countdown', centerX, currY);

    // Target Date Pill
    currY += 56 * scale;
    const pillW = 380 * scale;
    const pillH = 50 * scale;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.roundRect(centerX - pillW / 2, currY - 34 * scale, pillW, pillH, 25 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
    ctx.font = `700 ${Math.round(24 * scale)}px "JetBrains Mono", monospace`;
    ctx.fillText(`DECEMBER 25, ${countdown.targetYear}`, centerX, currY);

    // 4-Box Countdown Grid
    currY += 80 * scale;
    const boxW = 240 * scale;
    const boxH = 170 * scale;
    const boxGap = 26 * scale;
    const totalBoxW = boxW * 4 + boxGap * 3;
    const startBoxX = centerX - totalBoxW / 2;

    const units = [
      { val: countdown.days, label: 'DAYS' },
      { val: countdown.hours, label: 'HOURS' },
      { val: countdown.minutes, label: 'MIN' },
      { val: countdown.seconds, label: 'SEC' },
    ];

    units.forEach((u, i) => {
      const bx = startBoxX + i * (boxW + boxGap);
      const by = currY;

      ctx.fillStyle = 'rgba(7, 18, 44, 0.7)';
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 28 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(84 * scale)}px "JetBrains Mono", monospace`;
      ctx.fillText(String(u.val), bx + boxW / 2, by + 98 * scale);

      ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
      ctx.font = `700 ${Math.round(22 * scale)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(u.label, bx + boxW / 2, by + 145 * scale);
    });

    // Milestone Section Title
    currY += boxH + 80 * scale;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.75)';
    ctx.font = `700 ${Math.round(28 * scale)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('——  Your Christmas Milestones  ——', centerX, currY);

    // 4 Stacked Milestone Cards
    currY += 40 * scale;
    const cardW = 1040 * scale;
    const cardH = 92 * scale;
    const cardGap = 20 * scale;
    const cardX = centerX - cardW / 2;

    sortedMilestones.slice(0, 4).forEach((ms) => {
      const status = getMilestoneDisplayStatus(ms, now, sortedMilestones);
      const isHighlighted = status.isGlow;

      if (isHighlighted) {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.32)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3 * scale;
      } else if (status.state === 'completed') {
        ctx.fillStyle = 'rgba(6, 78, 59, 0.32)';
        ctx.strokeStyle = 'rgba(110, 231, 183, 0.45)';
        ctx.lineWidth = 2 * scale;
      } else if (status.state === 'past') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1.8 * scale;
      } else {
        ctx.fillStyle = 'rgba(7, 18, 44, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2 * scale;
      }

      ctx.beginPath();
      ctx.roundRect(cardX, currY, cardW, cardH, 32 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      const textX = cardX + 42 * scale;
      const textY = currY + 56 * scale;

      ctx.fillStyle = isHighlighted
        ? '#fde047'
        : status.state === 'completed'
        ? '#6ee7b7'
        : status.state === 'past'
        ? '#94a3b8'
        : '#bae6fd';
      ctx.font = `700 ${Math.round(28 * scale)}px "JetBrains Mono", monospace`;
      const dateText = status.state === 'completed' ? `✓ ${status.tMinusText} · ${status.formattedDate}` : `${status.tMinusText} · ${status.formattedDate}`;
      ctx.fillText(dateText, textX, textY);

      ctx.fillStyle = isHighlighted
        ? '#ffffff'
        : status.state === 'past'
        ? 'rgba(203, 213, 225, 0.6)'
        : '#f1f5f9';
      ctx.font = `600 ${Math.round(30 * scale)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(status.shortTitle, textX + 270 * scale, textY);

      if (status.badgeText) {
        const badgeW = 140 * scale;
        const badgeH = 46 * scale;
        const badgeX = cardX + cardW - badgeW - 24 * scale;
        const badgeY = currY + (cardH - badgeH) / 2;

        ctx.fillStyle = 'rgba(56, 189, 248, 0.38)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 23 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = `italic 700 ${Math.round(22 * scale)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillText(status.badgeText, badgeX + badgeW / 2, badgeY + 31 * scale);
      }

      currY += cardH + cardGap;
    });
  }

  ctx.restore();
}
