// =========================
// NEXPULSE DASHBOARD JS
// =========================

// Live ECG canvas
(function initECG() {
  const canvas = document.getElementById('ecgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', () => {
    canvas.width = 0;
    canvas.height = 0;
    resize();
  });

  const samples = [];
  const sampleSize = 600;
  let phase = 0;

  // Generate ECG-like waveform sample (P-Q-R-S-T)
  function ecgSample(t) {
    // Period of ~80 samples per beat
    const x = t % 80;
    let y = 0;
    // P wave
    if (x >= 6 && x <= 14) y = 4 * Math.sin((x - 6) * Math.PI / 8);
    // PR segment flat
    // Q
    else if (x >= 22 && x <= 25) y = -3;
    // R (big spike)
    else if (x >= 25 && x <= 28) y = 30 - Math.abs(x - 26.5) * 18;
    // S
    else if (x >= 28 && x <= 32) y = -8 + (x - 28) * 2;
    // T wave
    else if (x >= 40 && x <= 56) y = 6 * Math.sin((x - 40) * Math.PI / 16);
    return y + (Math.random() - 0.5) * 0.4;
  }

  // Pre-fill with samples
  for (let i = 0; i < sampleSize; i++) {
    samples.push(ecgSample(i));
    phase++;
  }

  function draw() {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    // advance
    samples.shift();
    samples.push(ecgSample(phase++));

    // Draw waveform
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(103, 214, 214, 0.6)';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#67D6D6';

    ctx.beginPath();
    const stepX = w / sampleSize;
    const midY = h / 2;
    samples.forEach((v, i) => {
      const x = i * stepX;
      const y = midY - v * 2.5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Bright leading edge
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#92E4E4';
    const lastIdx = samples.length - 1;
    const lastX = lastIdx * stepX;
    const lastY = midY - samples[lastIdx] * 2.5;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }
  draw();
})();

// Live vital number updates
function liveTick(id, base, range) {
  const el = document.getElementById(id);
  if (!el) return;
  setInterval(() => {
    const v = base + Math.round((Math.random() - 0.5) * range);
    el.textContent = v;
  }, 1500);
}
liveTick('hrMain', 72, 6);
liveTick('vHr', 72, 6);

// Trend chart (custom canvas)
(function trendChart() {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function size() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  size();

  const data = [
    { day: 'Mon', avg: 71, min: 58, max: 96 },
    { day: 'Tue', avg: 73, min: 60, max: 102 },
    { day: 'Wed', avg: 70, min: 57, max: 88 },
    { day: 'Thu', avg: 75, min: 62, max: 110 },
    { day: 'Fri', avg: 72, min: 59, max: 95 },
    { day: 'Sat', avg: 68, min: 55, max: 89 },
    { day: 'Sun', avg: 72, min: 60, max: 98 }
  ];

  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const padX = 40;
  const padY = 30;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;
  const minY = 50;
  const maxY = 120;
  const yScale = (v) => padY + chartH - ((v - minY) / (maxY - minY)) * chartH;
  const xScale = (i) => padX + (i / (data.length - 1)) * chartW;

  // Grid + labels
  ctx.strokeStyle = 'rgba(14, 42, 71, 0.06)';
  ctx.fillStyle = '#6b7d92';
  ctx.font = '11px Sora, sans-serif';
  ctx.lineWidth = 1;

  const yTicks = [60, 80, 100, 120];
  yTicks.forEach(t => {
    const y = yScale(t);
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(t, padX - 8, y + 4);
  });

  // X labels
  data.forEach((d, i) => {
    const x = xScale(i);
    ctx.textAlign = 'center';
    ctx.fillText(d.day, x, h - 10);
  });

  // Min/Max area
  const grad = ctx.createLinearGradient(0, padY, 0, padY + chartH);
  grad.addColorStop(0, 'rgba(103, 214, 214, 0.25)');
  grad.addColorStop(1, 'rgba(103, 214, 214, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = xScale(i);
    const y = yScale(d.max);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  for (let i = data.length - 1; i >= 0; i--) {
    ctx.lineTo(xScale(i), yScale(data[i].min));
  }
  ctx.closePath();
  ctx.fill();

  // Average line
  ctx.strokeStyle = '#0E2A47';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = xScale(i);
    const y = yScale(d.avg);
    if (i === 0) ctx.moveTo(x, y);
    else {
      const px = xScale(i - 1);
      const py = yScale(data[i - 1].avg);
      const cx = (px + x) / 2;
      ctx.bezierCurveTo(cx, py, cx, y, x, y);
    }
  });
  ctx.stroke();

  // Dots
  data.forEach((d, i) => {
    const x = xScale(i);
    const y = yScale(d.avg);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#0E2A47';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
})();
