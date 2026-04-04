/**
 * wheel.js – Canvas Lucky Wheel
 * Renders a spinning prize wheel and announces a winner.
 */

class LuckyWheel {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Array<string|{id:string,label:string,category?:string,weight?:number}>} segments
   */
  constructor(canvas, segments) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.colors = [
      '#006999', '#d44407', '#0f7e7c', '#9cbed9',
      '#2563eb', '#dc2626', '#16a34a', '#d97706',
      '#0b2e4f', '#f28b58', '#0369a1', '#065f46'
    ];
    this.segments = this._normalizeSegments(segments);
    this.angle   = 0;
    this.spinning = false;
    this.onWinner = null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const availableWidth = Math.max(canvas.parentElement?.clientWidth || 560, 320);
    const size = Math.min(availableWidth, 560);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.size = size;

    this._draw();
  }

  _normalizeSegments(segments) {
    const source = Array.isArray(segments) ? segments : [];
    const normalized = source.map((segment, index) => {
      if (typeof segment === 'string') {
        return {
          id: `segment-${index + 1}`,
          label: segment,
          category: '',
          note: '',
          weight: 1
        };
      }

      const rawWeight = Number(segment?.weight);
      return {
        id: segment?.id || `segment-${index + 1}`,
        label: String(segment?.label || segment?.name || segment?.text || `Feld ${index + 1}`).trim(),
        category: String(segment?.category || '').trim(),
        note: String(segment?.note || '').trim(),
        weight: Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1
      };
    }).filter(segment => segment.label);

    const fallback = normalized.length ? normalized : [{ id: 'segment-1', label: '???', category: '', note: '', weight: 1 }];
    const totalWeight = fallback.reduce((sum, segment) => sum + segment.weight, 0);
    let startAngle = 0;

    return fallback.map((segment, index) => {
      const arc = (segment.weight / totalWeight) * Math.PI * 2;
      const normalizedSegment = {
        ...segment,
        color: this.colors[index % this.colors.length],
        startAngle,
        endAngle: startAngle + arc,
        arc
      };
      startAngle += arc;
      return normalizedSegment;
    });
  }

  _draw() {
    const { ctx, segments, angle, size } = this;
    const cx = size / 2, cy = size / 2, r = size / 2 - 8;
    ctx.clearRect(0, 0, size, size);

    // Outer glow ring
    const grad = ctx.createRadialGradient(cx, cy, r-4, cx, cy, r+8);
    grad.addColorStop(0, 'rgba(0,105,153,.8)');
    grad.addColorStop(1, 'rgba(0,105,153,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r+6, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Segments
    segments.forEach(segment => {
      const startA = angle + segment.startAngle;
      const endA   = angle + segment.endAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startA, endA);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startA + segment.arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, Math.min(18, 9 + segment.arc * 10))}px Segoe UI, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,.5)';
      ctx.shadowBlur = 4;
      const label = segment.label.length > 16 ? segment.label.slice(0, 15) + '…' : segment.label;
      ctx.fillText(label, r - 12, 5);

      if (segment.category && segment.arc > 0.45) {
        ctx.font = `600 ${Math.max(8, Math.min(12, 7 + segment.arc * 6))}px Segoe UI, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,.78)';
        const category = segment.category.length > 18 ? segment.category.slice(0, 17) + '…' : segment.category;
        ctx.fillText(category, r - 12, 20);
      }
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI*2);
    const cg = ctx.createRadialGradient(cx-4, cy-4, 2, cx, cy, 28);
    cg.addColorStop(0, '#9cbed9');
    cg.addColorStop(1, '#006999');
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer (triangle at top)
    ctx.save();
    ctx.translate(cx, cy - r - 4);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-14, 14);
    ctx.lineTo(14, 14);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }

  spin(targetId) {
    if (this.spinning) return;
    this.spinning = true;

    const { segments } = this;
    const idx = targetId
      ? segments.findIndex(segment => segment.id === targetId || segment.label === targetId)
      : Math.floor(Math.random() * segments.length);
    const winner = segments[idx < 0 ? 0 : idx];

    // Calculate target angle so winner segment lands under pointer (top = -PI/2)
    const targetSegMid = winner.startAngle + winner.arc / 2;
    const targetAngle  = -Math.PI / 2 - targetSegMid;
    const extraSpins   = Math.PI * 2 * (6 + Math.floor(Math.random() * 4)); // 6-10 full spins
    const finalAngle   = targetAngle - this.angle % (Math.PI * 2);
    const totalDelta   = extraSpins + ((finalAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    const duration  = 5000 + Math.random() * 1500;
    const startTime = performance.now();
    const startAngle = this.angle;

    const ease = t => 1 - Math.pow(1 - t, 4); // ease out quart

    const animate = ts => {
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);
      this.angle = startAngle + totalDelta * ease(progress);
      this._draw();
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.spinning = false;
        this.onWinner && this.onWinner(winner);
      }
    };
    requestAnimationFrame(animate);
  }
}
