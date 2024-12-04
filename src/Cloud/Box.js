export class Cloud {
  static data() {
    return {
      strText: 'xxxx',
      points: [0, 0, 0, 0],
      mark: [0, 0],
      color: 0xff0000,// 颜色 
      textHeight: 40, // 字高
      lineWidth: 6,
    }
  }
  /** @type {DOMRect} */
  rect
  index = 0
  constructor(data) {
    this.data = data
  }
  /** @param {CanvasRenderingContext2D} ctx */
  render(ctx) {
    const { data, rect } = this;
    if (!ctx || !rect) return;
    ctx.save();
    const canvas = ctx.canvas.getBoundingClientRect();
    const { width, height } = rect;
    const left = rect.left - canvas.left;
    const top = rect.top - canvas.top;
    const {
      points,
      textHeight,
      strText,
      color: colorNum,
      lineWidth,
      mark,
    } = data;
    const x1 = points[0] * width + left,
      y1 = points[1] * height + top,
      x2 = points[2] * width + left,
      y2 = points[3] * height + top,
      dMarkX = mark[0] * width + left,
      dMarkY = mark[1] * height + top;
    const isSetPoint = !points.every(v => v === 0)
    const isSetMark = !mark.every(v => v === 0)
    let isLeft = false
    if (isSetPoint) {
      const color = `#${colorNum.toString(16).padStart(6, "0")}`;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      if (isSetMark) {
        const cx = x1 + ((x2 - x1) >> 1);
        const cy = y1 + ((y2 - y1) >> 1);
        ctx.moveTo(cx, cy);
        ctx.lineTo(dMarkX, dMarkY);
        isLeft = cx > dMarkX
        ctx.stroke();
      }
      drawCloudRect(ctx, [x1, y1, x2, y2]);
    }
    ctx.font = `${textHeight}px Arial`;
    let textOffset = 0;
    if (isLeft)
      textOffset = -ctx.measureText(strText).width;

    ctx.fillText(strText, dMarkX + textOffset, dMarkY);
    ctx.restore();
  }
}

function drawCloudRect(ctx, points) {
  const list = getBoxCell(points);
  ctx.save();
  for (const ball of list) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r + 2, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "destination-out";
  for (const ball of list) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.clip();
  ctx.restore();
}

function getBoxCell(points) {
  const [x1, x2] = [points[0], points[2]].sort((a, b) => a - b);
  const [y1, y2] = [points[1], points[3]].sort((a, b) => a - b);
  const w = x2 - x1;
  const h = y2 - y1;
  const maxSize = Math.max(w, h);
  const l = Math.max(maxSize / 4, 8);
  const r = l >> 1;
  const axis = [[], []];
  const balls = [];
  let _w = x1 - r,
    _h = y1 - r;
  while (_w < x2) {
    _w += l;
    axis[0].push(_w - r);
  }
  while (_h < y2) {
    _h += l;
    axis[1].push(_h - r);
  }
  for (let i = 0; i < axis[0].length; i++) {
    for (let j = 0; j < axis[1].length; j++) {
      balls.push({ x: axis[0][i], y: axis[1][j], r: l });
    }
  }
  return balls;
}