import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type PurchaseOrderPdfHeader = {
  dealerName: string;
  buyerName: string;
  poc: string;
  date: string;
  deadline: string;
  city: string;
};

export type PurchaseOrderPdfItem = {
  designNumber: string;
  color: string;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  xxxl: number;
  xxxxl: number;
  xxxxxl: number;
  xxxxxxl: number;
  qty: number;
  mrp: number;
  dis: number;
  rate: number;
  amount: number;
  tgst: number;
  tax: number;
  amt: number;
};

export type PurchaseOrderPdfSummary = {
  totalQuantity: number;
  grossTotal: number;
  purchaseOrderValueWords: string;
  gstOutput: number;
  grandTotal: number;
  termsCondition: string;
};

type GeneratePurchaseOrderPdfArgs = {
  headerInfo: PurchaseOrderPdfHeader;
  items: PurchaseOrderPdfItem[];
  summary: PurchaseOrderPdfSummary;
};

const COMPANY_BLOCK = [
  "VIRGO CLOTHING CULTURE PVT. LTD.",
  "396, EPIP PHASE-3, HSIIDC",
  "KUNDLI, SONIPAT HARYANA",
  "Haryana - 131028, India",
  "GSTIN/UIN: 06AACCV6406A1ZT",
  "State Name : Haryana, Code : 06",
  "CIN: U17291DL2007PTC169637",
  "Contact : 9667006955",
  "E-Mail : VCCPL127@GMAIL.COM",
];

function formatDate(date: string): string {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function getSizeSummary(item: PurchaseOrderPdfItem): string {
  const sizes: Array<[string, number]> = [
    ["S", item.s],
    ["M", item.m],
    ["L", item.l],
    ["XL", item.xl],
    ["2XL", item.xxl],
    ["3XL", item.xxxl],
    ["4XL", item.xxxxl],
    ["5XL", item.xxxxxl],
    ["6XL", item.xxxxxxl],
  ];

  return sizes
    .filter(([, qty]) => qty > 0)
    .map(([label]) => label)
    .join(", ");
}

const DEFAULT_PARTY_ADDRESS_LINES = [
  "UNIT NO-210, PEARLS CORPORATE",
  "PLOT NO-09, MANGLAM PLACE,",
  "DISTRICT CENTRE SEC-03 ROHINI",
];

const DEFAULT_GSTIN = "07AACCV6406A1ZR";
const DEFAULT_STATE_LINE = "Delhi, Code : 07";

function getHeaderLayoutMetrics() {
  const companySecondaryStartY = 20;
  const companyLineHeight = 3.2;
  const companySecondaryLines = COMPANY_BLOCK.length - 1;
  const companyBottomY =
    companySecondaryStartY + (companySecondaryLines * companyLineHeight);

  const consigneeY = companyBottomY + 4;
  const sectionHeight = 36;
  const buyerY = consigneeY + sectionHeight;
  const dividerY = buyerY + sectionHeight + 2;
  const tableStartY = dividerY + 3;

  return {
    consigneeY,
    sectionHeight,
    buyerY,
    dividerY,
    tableStartY,
  };
}

function drawPartySection(
  doc: jsPDF,
  sectionTitle: string,
  partyName: string,
  city: string,
  startX: number,
  startY: number,
  width: number,
  height: number,
): void {
  doc.rect(startX, startY, width, height);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(sectionTitle, startX + 2, startY + 4);

  const maxTextWidth = width - 4;
  let textY = startY + 8.5;

  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(partyName || "VIRGO CLOTHING CULTURE PVT LTD ( DELHI", maxTextWidth);
  doc.text(nameLines, startX + 2, textY);
  textY += nameLines.length * 3.8;

  doc.setFont("helvetica", "normal");
  const partyLines = [
    ...DEFAULT_PARTY_ADDRESS_LINES,
    `${city || "Delhi"} - 110085, India`,
    `GSTIN/UIN        : ${DEFAULT_GSTIN}`,
    `State Name     : ${DEFAULT_STATE_LINE}`,
  ];

  partyLines.forEach((line) => {
    doc.text(line, startX + 2, textY);
    textY += 3.8;
  });
}

function drawHeader(doc: jsPDF, pageNumber: number, headerInfo: PurchaseOrderPdfHeader): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { consigneeY, sectionHeight, buyerY, dividerY } = getHeaderLayoutMetrics();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const title = pageNumber === 1 ? "PURCHASE ORDER" : `PURCHASE ORDER (Page ${pageNumber})`;
  doc.text(title, pageWidth / 2, 10, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(COMPANY_BLOCK[0], 10, 16);
  doc.setFont("helvetica", "normal");
  let lineY = 20;
  COMPANY_BLOCK.slice(1).forEach((line) => {
    doc.text(line, 10, lineY);
    lineY += 3.2;
  });

  const blockX = 10;
  const blockWidth = pageWidth - 20;

  drawPartySection(
    doc,
    "Consignee (Ship to)",
    headerInfo.dealerName,
    headerInfo.city,
    blockX,
    consigneeY,
    blockWidth,
    sectionHeight,
  );

  drawPartySection(
    doc,
    "Buyer (Bill to)",
    headerInfo.buyerName,
    headerInfo.city,
    blockX,
    buyerY,
    blockWidth,
    sectionHeight,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Voucher No.: PO-${headerInfo.date ? headerInfo.date.replace(/-/g, "") : ""}`, pageWidth - 72, 15);
  doc.text(`Dated: ${formatDate(headerInfo.date)}`, pageWidth - 72, 19);
  doc.text(`Due on: ${formatDate(headerInfo.deadline || headerInfo.date)}`, pageWidth - 72, 23);

  doc.setDrawColor(80, 80, 80);
  doc.line(10, dividerY, pageWidth - 10, dividerY);
}

function drawFooter(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text("This is a Computer Generated Document", pageWidth / 2, pageHeight - 6, { align: "center" });
}

export function generatePurchaseOrderPdf({ headerInfo, items, summary }: GeneratePurchaseOrderPdfArgs): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { tableStartY } = getHeaderLayoutMetrics();

  const tableData = items.map((item, index) => {
    const sizeSummary = getSizeSummary(item);
    const description = `${item.designNumber}${item.color ? ` (${item.color})` : ""}${sizeSummary ? ` ${sizeSummary}` : ""}`;

    return [
      String(index + 1),
      description || "-",
      item.qty.toFixed(3),
      item.rate.toFixed(2),
      "PCS",
      `${item.dis || 0}`,
      item.amt.toFixed(2),
      formatDate(headerInfo.deadline || headerInfo.date),
      "-",
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { top: tableStartY, left: 10, right: 10, bottom: 18 },
    head: [["Sl No.", "Description of Goods", "Quantity", "Rate", "per", "Disc. %", "Amount", "Due on", "HSN/SAC"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      cellPadding: 1.5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 64 },
      2: { cellWidth: 18, halign: "right" },
      3: { cellWidth: 18, halign: "right" },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 14, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
      7: { cellWidth: 16, halign: "center" },
      8: { cellWidth: 18, halign: "center" },
    },
    showHead: "everyPage",
    didDrawPage: (data) => {
      drawHeader(doc, data.pageNumber, headerInfo);
      drawFooter(doc);
    },
  });

  let finalY = (doc as any).lastAutoTable?.finalY || 80;
  if (finalY + 36 > pageHeight - 18) {
    doc.addPage();
    drawHeader(doc, doc.getNumberOfPages(), headerInfo);
    drawFooter(doc);
    finalY = 82;
  }

  finalY += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Total", 10, finalY);
  doc.text(`${summary.totalQuantity.toFixed(3)} PCS`, 100, finalY, { align: "right" });
  doc.text(`Rs ${summary.grandTotal.toFixed(2)}`, 198, finalY, { align: "right" });

  finalY += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Amount Chargeable (in words)", 10, finalY);
  finalY += 4;
  const amountLines = doc.splitTextToSize(
    `Indian Rupees ${summary.purchaseOrderValueWords}`,
    pageWidth - 20,
  );
  doc.text(amountLines, 10, finalY);

  finalY += amountLines.length * 4 + 4;
  doc.text("Company's PAN : AACCV6406A", 10, finalY);
  doc.text("E. & O.E", pageWidth - 42, finalY);

  finalY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("for VIRGO CLOTHING CULTURE PVT. LTD.", pageWidth - 10, finalY, { align: "right" });
  finalY += 8;
  doc.text("Authorised Signatory", pageWidth - 10, finalY, { align: "right" });

  const fileDate = headerInfo.date || new Date().toISOString().split("T")[0];
  doc.save(`purchase_order_${fileDate}.pdf`);
}