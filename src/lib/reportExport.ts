import { jsPDF } from 'jspdf'

/** Escapes a cell value for CSV (RFC 4180: quote if it contains a comma, quote, or newline). */
function csvCell(value: unknown): string {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function downloadReportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers, ...rows].map(row => row.map(csvCell).join(','))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Renders a simple paginated table into a PDF and triggers a download.
 * No autotable plugin installed, so columns are hand-laid-out at fixed
 * x-offsets sized to fit a portrait A4 page's usable width (~180mm).
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
