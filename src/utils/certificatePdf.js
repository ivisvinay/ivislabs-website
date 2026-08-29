import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/**
 * Generates IVIS LABS documents (offer letter / completion / performance award)
 * as PDFs with an embedded seal+signature image and a QR code that points to
 * the public verification page. PDF generation happens entirely in the browser.
 */

const COMPANY = {
  name: "IVIS LABS Private Limited",
  tagline: "Intelligent Vision Labs",
  location: "Mysuru, Karnataka, India",
  email: "contact@ivislabs.com",
  phone: "+91 6364411444",
  web: "www.ivislabs.in",
};

const NAVY = [17, 38, 84];
const BLUE = [37, 99, 235];
const GOLD = [176, 137, 44];
const GREY = [90, 100, 115];

export const DOC_TYPES = [
  { key: "offer", label: "Internship Offer Letter" },
  { key: "completion", label: "Internship Completion Certificate" },
  { key: "performance", label: "Performance Award Certificate" },
];

async function qrDataUrl(text) {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
    color: { dark: "#0f2654", light: "#ffffff" },
  });
}

/** Draw the "scan to verify" footer block (QR + id) shared by every document. */
function drawVerifyBlock(doc, { qr, id, verifyUrl, x, y, size }) {
  doc.addImage(qr, "PNG", x, y, size, size);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text("SCAN TO VERIFY", x + size + 4, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GREY);
  doc.text("This document is registered with IVIS LABS.", x + size + 4, y + 9.5);
  doc.text("Authenticity is confirmed only at the URL below.", x + size + 4, y + 13.5);
  doc.setTextColor(...BLUE);
  doc.text(verifyUrl, x + size + 4, y + 18);
  doc.setTextColor(...GREY);
  doc.text(`Verification ID: ${id}`, x + size + 4, y + 22);
}

function drawSeal(doc, sealDataUrl, sealAspect, x, y, w) {
  if (!sealDataUrl) return 0;
  const h = w / (sealAspect || 2);
  doc.addImage(sealDataUrl, "PNG", x, y, w, h);
  return h;
}

/* ------------------------------------------------------------------ */
/* Offer Letter (A4 portrait)                                          */
/* ------------------------------------------------------------------ */
function buildOffer(doc, { data, qr, id, verifyUrl, sealDataUrl, sealAspect }) {
  const W = 210;
  const M = 20;

  // Letterhead
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text(COMPANY.name, M, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...GREY);
  doc.text(COMPANY.tagline, M, 30);
  doc.text(
    `${COMPANY.location}  ·  ${COMPANY.email}  ·  ${COMPANY.phone}  ·  ${COMPANY.web}`,
    M,
    35
  );
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(M, 39, W - M, 39);

  // Ref + date
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`Ref: IVIS/INT/${id.slice(0, 8).toUpperCase()}`, M, 50);
  doc.text(`Date: ${data.issueDate || ""}`, W - M, 50, { align: "right" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text("INTERNSHIP OFFER LETTER", W / 2, 63, { align: "center" });

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 35, 45);
  let y = 78;
  const line = 6.4;
  doc.text(`Dear ${data.recipient || "Candidate"},`, M, y);
  y += line * 1.6;

  const dur =
    data.duration ||
    (data.startDate && data.endDate ? `${data.startDate} to ${data.endDate}` : "");
  const paras = [
    `We are pleased to offer you an internship at ${COMPANY.name} for the position of ${
      data.role || "Intern"
    }. Your internship will be based at ${data.location || COMPANY.location}${
      dur ? ` for the period ${dur}` : ""
    }.`,
    data.stipend
      ? `You will receive a monthly stipend of ${data.stipend} during the internship period, subject to the terms of your engagement.`
      : "",
    `During this internship you will work closely with our team, contribute to live projects, and be expected to maintain confidentiality and professional conduct at all times.`,
    `We are confident that this opportunity will be a valuable experience for you, and we look forward to your contributions.`,
  ].filter(Boolean);

  paras.forEach((p) => {
    const wrapped = doc.splitTextToSize(p, W - M * 2);
    doc.text(wrapped, M, y);
    y += wrapped.length * line + 3;
  });

  y += 4;
  doc.text("Warm regards,", M, y);

  // Signature + seal
  const sey = y + 6;
  const sh = drawSeal(doc, sealDataUrl, sealAspect, M, sey, 48);
  doc.setDrawColor(...GREY);
  doc.setLineWidth(0.3);
  doc.line(M, sey + sh + 3, M + 60, sey + sh + 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text("Authorized Signatory", M, sey + sh + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...GREY);
  doc.text(COMPANY.name, M, sey + sh + 14);

  drawVerifyBlock(doc, { qr, id, verifyUrl, x: M, y: 250, size: 26 });
}

/* ------------------------------------------------------------------ */
/* Certificate layout (A4 landscape) shared by completion + award     */
/* ------------------------------------------------------------------ */
function buildCertificate(doc, opts, variant) {
  const { data, qr, id, verifyUrl, sealDataUrl, sealAspect } = opts;
  const W = 297;
  const H = 210;
  const accent = variant === "award" ? GOLD : BLUE;

  // Decorative border
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.4);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setLineWidth(0.4);
  doc.rect(14, 14, W - 28, H - 28);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text(COMPANY.name, W / 2, 34, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`${COMPANY.tagline}  ·  ${COMPANY.location}`, W / 2, 41, { align: "center" });

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...accent);
  const title =
    variant === "award"
      ? "PERFORMANCE AWARD"
      : "CERTIFICATE OF INTERNSHIP COMPLETION";
  doc.text(title, W / 2, 62, { align: "center" });

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.6);
  doc.line(W / 2 - 45, 68, W / 2 + 45, 68);

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...GREY);
  doc.text(
    variant === "award" ? "This award is proudly presented to" : "This is to certify that",
    W / 2,
    84,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...NAVY);
  doc.text(data.recipient || "Recipient Name", W / 2, 101, { align: "center" });
  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 70, 106, W / 2 + 70, 106);

  const dur =
    data.duration ||
    (data.startDate && data.endDate ? `${data.startDate} to ${data.endDate}` : "");
  let body;
  if (variant === "award") {
    body = `in recognition of outstanding performance and exceptional contribution as ${
      data.role || "an intern"
    } at ${COMPANY.name}${data.award ? `, and is hereby honoured with the "${data.award}"` : ""}.${
      data.reason ? ` ${data.reason}` : ""
    }`;
  } else {
    body = `has successfully completed an internship in the role of ${
      data.role || "Intern"
    } at ${COMPANY.name}${dur ? `, during the period ${dur}` : ""}.${
      data.performance ? ` Overall performance was rated ${data.performance}.` : ""
    }`;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(40, 45, 55);
  const wrapped = doc.splitTextToSize(body, 190);
  doc.text(wrapped, W / 2, 118, { align: "center" });

  // Seal + signature (right)
  const sealW = 46;
  const sx = W - 30 - sealW;
  const sy = 150;
  const sh = drawSeal(doc, sealDataUrl, sealAspect, sx, sy, sealW);
  doc.setDrawColor(...GREY);
  doc.setLineWidth(0.3);
  doc.line(sx - 6, sy + sh + 3, sx + sealW + 6, sy + sh + 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text("Authorized Signatory", sx + sealW / 2, sy + sh + 9, { align: "center" });

  // Date (left)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`Date of issue: ${data.issueDate || ""}`, 30, 176);
  doc.text(COMPANY.web, 30, 182);

  drawVerifyBlock(doc, { qr, id, verifyUrl, x: 30, y: 186, size: 20 });
}

/**
 * Generate a document PDF.
 * @returns {Promise<{ blob: Blob, base64: string, filename: string }>}
 */
export async function generateDocument({ type, id, verifyUrl, data, sealDataUrl, sealAspect }) {
  const qr = await qrDataUrl(verifyUrl);
  const portrait = type === "offer";
  const doc = new jsPDF({
    orientation: portrait ? "portrait" : "landscape",
    unit: "mm",
    format: "a4",
  });

  const opts = { data, qr, id, verifyUrl, sealDataUrl, sealAspect };
  if (type === "offer") buildOffer(doc, opts);
  else if (type === "completion") buildCertificate(doc, opts, "completion");
  else if (type === "performance") buildCertificate(doc, opts, "award");
  else throw new Error("Unknown document type: " + type);

  const blob = doc.output("blob");
  const dataUri = doc.output("datauristring"); // data:application/pdf;base64,....
  const base64 = dataUri.substring(dataUri.indexOf(",") + 1);
  const safeName = (data.recipient || "document").replace(/[^a-z0-9]+/gi, "_");
  const filename = `${type}_${safeName}_${id.slice(0, 8)}.pdf`;
  return { blob, base64, filename };
}
