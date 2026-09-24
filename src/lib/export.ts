import { SITE } from '@/data/seed';
import { downloadBlob, toCsv } from '@/lib/utils';

export type ExportFormat = 'PDF' | 'Excel' | 'CSV';
type Cell = string | number | undefined;

/** A report as a table, plus optional headline figures shown above it. */
export interface ReportData {
  title: string;
  file: string;
  columns: string[];
  rows: Cell[][];
  summary?: [string, string][];
  /** Extra text sections (for example an incident timeline), printed after the table in PDFs. */
  sections?: { heading: string; lines: string[] }[];
}

const stamp = () => new Date().toISOString().slice(0, 10);
const generated = () => `Generated ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`;

/** Saves a report in the chosen format. PDF and Excel libraries load only when first used. */
export async function exportReport(r: ReportData, format: ExportFormat) {
  const name = `${r.file}-${stamp()}`;
  if (format === 'CSV') {
    const summary = r.summary?.length ? [...r.summary.map(([k, v]) => [k, v]), []] : [];
    downloadBlob(`${name}.csv`, new Blob([toCsv([...summary, r.columns, ...r.rows])], { type: 'text/csv;charset=utf-8' }));
    return;
  }
  if (format === 'Excel') {
    const { default: writeXlsxFile } = await import('write-excel-file/browser');
    const head = [[{ value: `${SITE.name} · ${r.title}`, fontWeight: 'bold' as const }], [generated()], []];
    const summary = r.summary?.length ? [...r.summary.map(([k, v]) => [k, v]), []] : [];
    const header = r.columns.map((c) => ({ value: c, fontWeight: 'bold' as const, backgroundColor: '#E8EEFF' }));
    const body = r.rows.map((row) => row.map((c) => (c === undefined || c === '' ? null : c)));
    const widths = r.columns.map((c, i) => ({ width: Math.min(48, Math.max(c.length, ...r.rows.map((row) => String(row[i] ?? '').length)) + 2) }));
    const blob = await writeXlsxFile([...head, ...summary, header, ...body], { sheet: r.title.slice(0, 31), columns: widths }).toBlob();
    downloadBlob(`${name}.xlsx`, blob);
    return;
  }
  const { jsPDF } = await import('jspdf');
  const { autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: r.columns.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(11, 22, 64);
  doc.rect(0, 0, w, 64, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(r.title, 40, 32);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`${SITE.name} · EzVision Condo Suite · ${generated()}`, 40, 50);
  doc.setTextColor(11, 22, 64);
  let y = 88;
  if (r.summary?.length) {
    autoTable(doc, { startY: y, body: r.summary, theme: 'plain', styles: { fontSize: 10, cellPadding: 3 }, columnStyles: { 0: { textColor: [91, 101, 133] }, 1: { fontStyle: 'bold' } }, margin: { left: 40, right: 40 } });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;
  }
  autoTable(doc, {
    startY: y, head: [r.columns], body: r.rows.map((row) => row.map((c) => (c === undefined ? '' : String(c)))),
    styles: { fontSize: 8.5, cellPadding: 4, overflow: 'linebreak' }, headStyles: { fillColor: [29, 79, 224], textColor: 255 }, alternateRowStyles: { fillColor: [243, 246, 252] },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8); doc.setTextColor(140, 149, 176);
      doc.text(`Page ${doc.getNumberOfPages()} · Confidential. Contains personal data under the PDPA 2010.`, 40, h - 20);
    },
  });
  for (const s of r.sections ?? []) {
    let sy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
    if (sy > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); sy = 50; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(11, 22, 64);
    doc.text(s.heading, 40, sy);
    autoTable(doc, { startY: sy + 8, body: s.lines.map((l) => [l]), theme: 'plain', styles: { fontSize: 9, cellPadding: 2.5 }, margin: { left: 40, right: 40 } });
  }
  downloadBlob(`${name}.pdf`, doc.output('blob'));
}
