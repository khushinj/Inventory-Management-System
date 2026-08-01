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
  category?: string;
  itemName?: string;
  hsn?: string;
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
  deliveredSizes?: any[];
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

function getSizesWithQty(item: PurchaseOrderPdfItem): string {
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
    .map(([label, qty]) => `${label}:${qty}`)
    .join(",");
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatRate(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getItemName(item: PurchaseOrderPdfItem): string {
  return item.itemName?.trim() || item.designNumber || "-";
}

function getItemCategory(item: PurchaseOrderPdfItem): string {
  return item.category?.trim() || "-";
}

function getHeaderLayoutMetrics() {
  const companySecondaryStartY = 20;
  const companyLineHeight = 3.2;
  const companySecondaryLines = COMPANY_BLOCK.length - 1;
  const companyBottomY =
    companySecondaryStartY + (companySecondaryLines * companyLineHeight);

  const consigneeY = companyBottomY + 4;
  const sectionHeight = 16;
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

  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(partyName || "VIRGO CLOTHING CULTURE PVT LTD ( DELHI", maxTextWidth);
  doc.text(nameLines, startX + 2, startY + 9);
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
    blockX,
    consigneeY,
    blockWidth,
    sectionHeight,
  );

  drawPartySection(
    doc,
    "Buyer (Bill to)",
    headerInfo.buyerName,
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

export function generatePurchaseOrderPdf({ headerInfo, items, deliveredSizes, summary }: GeneratePurchaseOrderPdfArgs): void {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { tableStartY } = getHeaderLayoutMetrics();

  const tableData = items.flatMap((item, index) => {
    const orderedQty =
      [item.s, item.m, item.l, item.xl, item.xxl, item.xxxl, item.xxxxl, item.xxxxxl, item.xxxxxxl]
        .reduce((t, n) => t + (Number(n) || 0), 0);

    const delivered = deliveredSizes?.[index] || {};

    const deliveredQty =
      [
        delivered.s,
        delivered.m,
        delivered.l,
        delivered.xl,
        delivered.xxl,
        delivered.xxxl,
        delivered.xxxxl,
        delivered.xxxxxl,
        delivered.xxxxxxl,
      ].reduce((t, n) => t + (Number(n) || 0), 0);

    return [
      // Ordered row
      [
        String(index + 1),
        getItemCategory(item),
        getItemName(item),
        item.color || "-",
        item.s > 0 ? String(item.s) : "",
        item.m > 0 ? String(item.m) : "",
        item.l > 0 ? String(item.l) : "",
        item.xl > 0 ? String(item.xl) : "",
        item.xxl > 0 ? String(item.xxl) : "",
        item.xxxl > 0 ? String(item.xxxl) : "",
        item.xxxxl > 0 ? String(item.xxxxl) : "",
        item.xxxxxl > 0 ? String(item.xxxxxl) : "",
        item.xxxxxxl > 0 ? String(item.xxxxxxl) : "",
        String(orderedQty),
        formatRate(item.mrp),
        formatRate(item.rate),
        formatAmount(item.amt),
      ],

      // Delivered row
      [
        "",
        "",
        "Delivered",
        "",
        delivered.s ? String(delivered.s) : "",
        delivered.m ? String(delivered.m) : "",
        delivered.l ? String(delivered.l) : "",
        delivered.xl ? String(delivered.xl) : "",
        delivered.xxl ? String(delivered.xxl) : "",
        delivered.xxxl ? String(delivered.xxxl) : "",
        delivered.xxxxl ? String(delivered.xxxxl) : "",
        delivered.xxxxxl ? String(delivered.xxxxxl) : "",
        delivered.xxxxxxl ? String(delivered.xxxxxxl) : "",
        String(deliveredQty),
        "",
        "",
        "",
      ],
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { top: tableStartY, left: 10, right: 10, bottom: 18 },
    head: [["SR", "CATEGORY", "ITEM NAME", "COLOR", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL", "QTY", "MRP", "RATE", "AMOUNT"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 6.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      cellPadding: 1,
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
      1: { cellWidth: 24 },
      2: { cellWidth: 54 },
      3: { cellWidth: 16 },
      4: { cellWidth: 9, halign: "center" },
      5: { cellWidth: 9, halign: "center" },
      6: { cellWidth: 9, halign: "center" },
      7: { cellWidth: 9, halign: "center" },
      8: { cellWidth: 9, halign: "center" },
      9: { cellWidth: 9, halign: "center" },
      10: { cellWidth: 9, halign: "center" },
      11: { cellWidth: 9, halign: "center" },
      12: { cellWidth: 14, halign: "center" },
      13: { cellWidth: 16, halign: "right" },
      14: { cellWidth: 16, halign: "right" },
      15: { cellWidth: 20, halign: "right" },
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
  doc.text(`${summary.totalQuantity.toFixed(3)} PCS`, 180, finalY, { align: "right" });
  doc.text(`Rs ${summary.grandTotal.toFixed(2)}`, 280, finalY, { align: "right" });

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