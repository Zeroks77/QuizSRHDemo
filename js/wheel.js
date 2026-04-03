/**
 * wheel.js – Canvas Lucky Wheel
 * Renders a spinning prize wheel and announces a winner.
 */

class LuckyWheel {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string[]} names  – player names for segments
   */
  constructor(canvas, names) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.names   = names.length ? names : ['???'];
    this.arc     = (Math.PI * 2) / this.names.length;
    this.angle   = 0;       // current rotation
    this.spinning = false;
    this.onWinner = null;   // callback(name)

    this.colors = [
      '#7c3aed','#db2777','#f59e0b','#0d9488',
      '#2563eb','#dc2626','#16a34a','#d97706',
      '#7e22ce','#be123c','#0369a1','#065f46'
    ];

    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(canvas.parentElement?.offsetWidth || 500, 500);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    this.ctx.scale(dpr, dpr);
    this.size = size;

    this._draw();
  }

  _draw() {
    const { ctx, names, arc, angle, size } = this;
    const cx = size / 2, cy = size / 2, r = size / 2 - 8;
    ctx.clearRect(0, 0, size, size);

    // Outer glow ring
    const grad = ctx.createRadialGradient(cx, cy, r-4, cx, cy, r+8);
    grad.addColorStop(0, 'rgba(124,58,237,.8)');
    grad.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r+6, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Segments
    names.forEach((name, i) => {
      const startA = angle + i * arc;
      const endA   = startA + arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startA, endA);
      ctx.closePath();
      ctx.fillStyle = this.colors[i % this.colors.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startA + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, Math.min(16, 220 / names.length))}px Segoe UI, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,.5)';
      ctx.shadowBlur = 4;
      const label = name.length > 14 ? name.slice(0, 13) + '…' : name;
      ctx.fillText(label, r - 12, 5);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI*2);
    const cg = ctx.createRadialGradient(cx-4, cy-4, 2, cx, cy, 28);
    cg.addColorStop(0, '#a78bfa');
    cg.addColorStop(1, '#7c3aed');
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

  spin(targetName) {
    if (this.spinning) return;
    this.spinning = true;

    const { names, arc } = this;
    const idx = targetName
      ? names.indexOf(targetName)
      : Math.floor(Math.random() * names.length);
    const winner = names[idx < 0 ? 0 : idx];

    // Calculate target angle so winner segment lands under pointer (top = -PI/2)
    const targetSegMid = (idx < 0 ? 0 : idx) * arc + arc / 2;
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
