import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { fmtDate } from "./internDates";

/**
 * Intern ID card (CR80, portrait 54 × 85.6 mm) drawn on canvas at 300 dpi.
 * Front: photo, name, intern ID, programme, college, batch, validity.
 * Back: QR to the public /intern-id/<token> verification page, emergency
 * contact, return address and the authorised seal/signature.
 */
const W_MM = 54;
const H_MM = 85.6;
const PX = 300 / 25.4; // px per mm
const W = Math.round(W_MM * PX);
const H = Math.round(H_MM * PX);
const mm = (v) => v * PX;

const NAVY = "#112654";
const BLUE = "#2563eb";
const GOLD = "#b0892c";
const GREY = "#5a6473";
const FONT = "Helvetica, Arial, sans-serif";

const COMPANY = {
  name: "IVIS LABS Private Limited",
  short: "IVIS LABS",
  tagline: "Intelligent Vision Labs",
  address: "Mysuru, Karnataka, India",
  phone: "+91 6364411444",
  email: "contact@ivislabs.com",
  web: "www.ivislabs.in",
};

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw `img` to fill the box (object-fit: cover). */
function drawCover(ctx, img, x, y, w, h) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function drawContain(ctx, img, x, y, w, h) {
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Centered text, shrinking the font until it fits, wrapping to `maxLines`. */
function fitText(ctx, text, cx, y, maxW, { size, weight = "normal", color, maxLines = 1, minSize = size * 0.7, lineGap = 1.2 }) {
  let s = size;
  let lines;
  const wrap = () => {
    ctx.font = `${weight} ${mm(s)}px ${FONT}`;
    const words = String(text || "").split(/\s+/);
    lines = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width <= maxW || !cur) cur = t;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
  };
  wrap();
  while ((lines.length > maxLines || lines.some((l) => ctx.measureText(l).width > maxW)) && s > minSize) {
    s -= 0.1;
    wrap();
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxW && last.length > 1) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * mm(s) * lineGap));
  return y + (lines.length - 1) * mm(s) * lineGap + mm(s) * 0.35;
}

function newCanvas() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  return [c, ctx];
}

function drawFront({ intern, batchName, photo, logo }) {
  const [c, ctx] = newCanvas();
  const cx = W / 2;

  // Header band
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, mm(19));
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, mm(19), W, mm(0.8));
  if (logo) {
    ctx.save();
    roundRect(ctx, mm(4), mm(4.5), mm(10), mm(10), mm(2));
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
    drawContain(ctx, logo, mm(5), mm(5.5), mm(8), mm(8));
  }
  // Centre the wordmark (offset right of the logo when one is drawn).
  const tx = logo ? (mm(16) + W) / 2 : cx;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${mm(5)}px ${FONT}`;
  ctx.fillText(COMPANY.short, tx, mm(10.3));
  ctx.font = `${mm(2.3)}px ${FONT}`;
  ctx.fillStyle = "#c7d2fe";
  ctx.fillText(COMPANY.tagline, tx, mm(14));

  // "INTERN" tag
  ctx.fillStyle = BLUE;
  roundRect(ctx, cx - mm(9), mm(22), mm(18), mm(4.6), mm(2.3));
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${mm(2.6)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("INTERN", cx, mm(25.2));

  // Photo
  const pw = mm(24);
  const ph = mm(30);
  const px = cx - pw / 2;
  const py = mm(29);
  ctx.save();
  roundRect(ctx, px, py, pw, ph, mm(2));
  ctx.clip();
  if (photo) drawCover(ctx, photo, px, py, pw, ph);
  else {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(px, py, pw, ph);
  }
  ctx.restore();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = mm(0.5);
  roundRect(ctx, px, py, pw, ph, mm(2));
  ctx.stroke();

  // Name + details
  let y = fitText(ctx, intern.full_name.toUpperCase(), cx, mm(64), W - mm(6), { size: 3.6, weight: "bold", color: NAVY, maxLines: 2, minSize: 2.6 });
  y = fitText(ctx, intern.intern_code, cx, y + mm(3.6), W - mm(8), { size: 2.6, weight: "bold", color: BLUE });
  const spec = intern.specialization === "Others" ? intern.specialization_other : intern.specialization;
  y = fitText(ctx, `${intern.degree}${spec ? " · " + spec : ""}`, cx, y + mm(3.4), W - mm(6), { size: 2.2, color: GREY, maxLines: 1, minSize: 1.7 });
  y = fitText(ctx, intern.college, cx, y + mm(3), W - mm(6), { size: 2.2, color: GREY, maxLines: 2, minSize: 1.7 });
  if (batchName) fitText(ctx, `Batch: ${batchName}`, cx, y + mm(3), W - mm(8), { size: 2.1, weight: "bold", color: NAVY, minSize: 1.7 });

  // Validity footer
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, H - mm(7), W, mm(7));
  ctx.fillStyle = "#ffffff";
  ctx.font = `${mm(2.2)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(`Valid: ${fmtDate(intern.start_date)} – ${fmtDate(intern.end_date)}`, cx, H - mm(2.6));
  return c;
}

function drawBack({ intern, qr, seal, verifyUrl }) {
  const [c, ctx] = newCanvas();
  const cx = W / 2;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, mm(3));
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, mm(3), W, mm(0.6));

  fitText(ctx, "SCAN TO VERIFY", cx, mm(9.5), W - mm(6), { size: 2.6, weight: "bold", color: NAVY });
  const qs = mm(28);
  ctx.drawImage(qr, cx - qs / 2, mm(11.5), qs, qs);
  let y = fitText(ctx, verifyUrl.replace(/^https?:\/\//, ""), cx, mm(42.5), W - mm(5), { size: 1.6, color: BLUE, maxLines: 2, minSize: 1.2, lineGap: 1.15 });

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = mm(0.3);
  ctx.beginPath();
  ctx.moveTo(mm(5), y + mm(2));
  ctx.lineTo(W - mm(5), y + mm(2));
  ctx.stroke();

  y = fitText(ctx, "EMERGENCY CONTACT", cx, y + mm(5.5), W - mm(6), { size: 1.9, weight: "bold", color: GREY });
  y = fitText(ctx, `${intern.emergency_name || ""}  ·  ${intern.emergency_phone || ""}`, cx, y + mm(2.8), W - mm(6), { size: 2.2, weight: "bold", color: NAVY, minSize: 1.6 });

  y = fitText(
    ctx,
    `This card is the property of ${COMPANY.name}. If found, please return to ${COMPANY.address} · ${COMPANY.phone}`,
    cx,
    y + mm(4),
    W - mm(7),
    { size: 1.7, color: GREY, maxLines: 3, minSize: 1.4, lineGap: 1.25 }
  );

  // Seal + signature
  const sealBox = { w: mm(24), h: mm(12) };
  const sy = H - mm(8) - sealBox.h - mm(3.2);
  if (seal) drawContain(ctx, seal, cx - sealBox.w / 2, sy, sealBox.w, sealBox.h);
  ctx.strokeStyle = GREY;
  ctx.lineWidth = mm(0.2);
  ctx.beginPath();
  ctx.moveTo(cx - mm(12), sy + sealBox.h + mm(0.8));
  ctx.lineTo(cx + mm(12), sy + sealBox.h + mm(0.8));
  ctx.stroke();
  fitText(ctx, "Authorized Signatory", cx, sy + sealBox.h + mm(3.2), W, { size: 1.8, weight: "bold", color: NAVY });

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, H - mm(7), W, mm(7));
  ctx.fillStyle = "#ffffff";
  ctx.font = `${mm(2)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(`${COMPANY.web}  ·  ${COMPANY.email}`, cx, H - mm(2.6));
  return c;
}

/** Render both sides. `photoUrl` must be same-origin or a blob: URL. */
export async function renderIdCard({ intern, batchName, photoUrl, verifyUrl }) {
  const base = process.env.PUBLIC_URL || "";
  const [photo, logo, seal, qrUrl] = await Promise.all([
    loadImage(photoUrl),
    null, // no hi-res logo in /public yet; the wordmark is used instead
    loadImage(`${base}/seal.png`),
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 600, errorCorrectionLevel: "M", color: { dark: NAVY, light: "#ffffff" } }),
  ]);
  const qr = await loadImage(qrUrl);
  return {
    front: drawFront({ intern, batchName, photo, logo }),
    back: drawBack({ intern, qr, seal, verifyUrl }),
  };
}

export function downloadIdCardPdf({ front, back }, filename) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W_MM, H_MM], compress: true });
  doc.addImage(front.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, W_MM, H_MM);
  doc.addPage([W_MM, H_MM], "portrait");
  doc.addImage(back.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, W_MM, H_MM);
  doc.save(filename);
}

/**
 * Many cards in one PDF for printing: A4 portrait sheets, cards at actual
 * CR80 size in a 3×3 grid; each fronts page is followed by its backs page,
 * mirrored left↔right so double-sided printing lines up.
 */
export function downloadIdCardsSheetPdf(cardsList, filename) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const COLS = 3;
  const ROWS = 3;
  const GAP = 6;
  const left = (210 - (COLS * W_MM + (COLS - 1) * GAP)) / 2;
  const top = (297 - (ROWS * H_MM + (ROWS - 1) * GAP)) / 2;
  const place = (side, i, mirror) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const c = mirror ? COLS - 1 - col : col;
    const x = left + c * (W_MM + GAP);
    const y = top + row * (H_MM + GAP);
    doc.addImage(side.toDataURL("image/jpeg", 0.9), "JPEG", x, y, W_MM, H_MM);
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.rect(x, y, W_MM, H_MM);
  };
  const perPage = COLS * ROWS;
  for (let p = 0; p < cardsList.length; p += perPage) {
    const chunk = cardsList.slice(p, p + perPage);
    if (p > 0) doc.addPage("a4", "portrait");
    chunk.forEach((cards, i) => place(cards.front, i, false));
    doc.addPage("a4", "portrait");
    chunk.forEach((cards, i) => place(cards.back, i, true));
  }
  doc.save(filename);
}

export function downloadCanvasPng(canvas, filename) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Crop/resize a picked file to a 3:4 portrait JPEG data URL (max 600×800). */
export function preparePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Please choose a JPG or PNG photo."));
    if (file.size > 10 * 1024 * 1024) return reject(new Error("Photo is too large (max 10 MB)."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const tw = 600;
      const th = 800;
      const c = document.createElement("canvas");
      c.width = tw;
      c.height = th;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, tw, th);
      // Bias the crop toward the top so faces in tall photos aren't cut off.
      const s = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
      const sw = tw / s;
      const sh = th / s;
      const sx = (img.naturalWidth - sw) / 2;
      const sy = Math.max(0, (img.naturalHeight - sh) * 0.3);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}
