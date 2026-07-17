import { jsPDF } from 'jspdf'

/**
 * Renders a simple paginated table into a PDF and triggers a download.
 * No autotable plugin installed, so columns are hand-laid-out at fixed
 * x-offsets sized to fit a portrait A4 page's usable width (~180mm).
 *
 * Split out of reportExport.ts so jsPDF (a large dependency) is only
 * fetched when a user actually exports a PDF, via a dynamic import at the
 * call site - previously reportExport.ts's static top-level `import
 * { jsPDF }` meant the chunk loaded for every visit to the Reports page,
 * including the CSV-only export path which doesn't need it at all.
 */
export function downloadReportPdf(filename: string, title: string, headers: string[], rows: (string | number)[][]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 10
  const usableWidth = pageWidth - marginX * 2
  const colWidth = usableWidth / headers.length
  const rowHeight = 7
  let y = 20

  doc.setFontSize(14)
  doc.text(title, marginX, 12)
  doc.setFontSize(8)
  doc.text(new Date().toLocaleString(), marginX, 17)

  const drawRow = (cells: (string | number)[], bold: boolean) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    cells.forEach((cell, i) => {
      const text = String(cell ?? '')
      doc.text(text.length > 28 ? `${text.slice(0, 27)}…` : text, marginX + i * colWidth, y)
    })
    y += rowHeight
  }

  drawRow(headers, true)
  doc.setLineWidth(0.1)
  doc.line(marginX, y - 5, pageWidth - marginX, y - 5)

  for (const row of rows) {
    if (y > pageHeight - 15) {
      doc.addPage()
      y = 20
      drawRow(headers, true)
      doc.line(marginX, y - 5, pageWidth - marginX, y - 5)
    }
    drawRow(row, false)
  }

  if (rows.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.text('No data for the selected date range.', marginX, y)
  }

  doc.save(filename)
}
