import QRCode from "qrcode";

// Renders the signed token as a scannable QR PNG, returned as a data URL so
// it can be stored directly on the Ticket doc and displayed with a plain
// <img> tag on the client with no extra endpoint round-trip.
export const generateQrDataUrl = async (token) => {
  return QRCode.toDataURL(token, { errorCorrectionLevel: "M", margin: 1, width: 240 });
};
