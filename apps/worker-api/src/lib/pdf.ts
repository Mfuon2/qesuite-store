import { PDFDocument, StandardFonts, rgb, type RGB } from 'pdf-lib'

export type PdfLineItem = { description: string; quantity: number; unitPrice: number; lineTotal: number }

export type PdfDocumentInput = {
  documentTitle: string
  documentNumber: string
  issuedDate: string
  dueDate?: string | null
  store: { name: string; phone?: string | null; address?: string | null; primaryColorHex?: string | null }
  billTo?: { name: string; phone?: string | null; pin?: string | null } | null
  items: PdfLineItem[]
  subtotal: number
  discount?: number
  taxAmount?: number
  total: number
  amountPaid?: number
  currency?: string
  notes?: string | null
  footerNote?: string
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48

function hexToRgb(hex?: string | null): RGB {
  const fallback = rgb(0.06, 0.6, 0.42)
  if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(hex)) return fallback
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return rgb(r, g, b)
}

function money(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-KE')}`
}

/**
 * Renders a single-page A4 receipt/invoice-style document. Used for both
 * customer invoicing (invoice/quotation/proforma/recurring) and POS sale
 * receipts — one layout engine instead of duplicating table/totals drawing
 * logic per document kind.
 */
export async function buildDocumentPdf(input: PdfDocumentInput): Promise<Uint8Array> {
  const currency = input.currency ?? 'KES'
  const accent = hexToRgb(input.store.primaryColorHex)
  const black = rgb(0.06, 0.09, 0.16)
  const gray = rgb(0.45, 0.48, 0.55)
  const lightGray = rgb(0.9, 0.91, 0.93)

  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let y = PAGE_HEIGHT - MARGIN

  // Header: store identity on the left, document title/number/date on the right
  page.drawText(input.store.name, { x: MARGIN, y, size: 18, font: bold, color: accent })
  page.drawText(input.documentTitle, { x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(input.documentTitle, 16), y, size: 16, font: bold, color: black })
  y -= 20

  if (input.store.address) {
    page.drawText(input.store.address, { x: MARGIN, y, size: 9, font, color: gray })
  }
  const numberLabel = `#${input.documentNumber}`
  page.drawText(numberLabel, { x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(numberLabel, 10), y, size: 10, font, color: gray })
  y -= 13

  if (input.store.phone) {
    page.drawText(input.store.phone, { x: MARGIN, y, size: 9, font, color: gray })
  }
  const dateLabel = `Date: ${input.issuedDate}`
  page.drawText(dateLabel, { x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(dateLabel, 10), y, size: 10, font, color: gray })
  y -= 13

  if (input.dueDate) {
    const dueLabel = `Due: ${input.dueDate}`
    page.drawText(dueLabel, { x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(dueLabel, 10), y, size: 10, font, color: gray })
    y -= 13
  }

  y -= 8
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1.2, color: accent })
  y -= 24

  if (input.billTo) {
    page.drawText('BILL TO', { x: MARGIN, y, size: 8, font: bold, color: gray })
    y -= 14
    page.drawText(input.billTo.name, { x: MARGIN, y, size: 11, font: bold, color: black })
    y -= 14
    if (input.billTo.phone) { page.drawText(input.billTo.phone, { x: MARGIN, y, size: 9, font, color: gray }); y -= 12 }
    if (input.billTo.pin) { page.drawText(`PIN: ${input.billTo.pin}`, { x: MARGIN, y, size: 9, font, color: gray }); y -= 12 }
    y -= 12
  }

  // Line items table
  const colDesc = MARGIN
  const colQty = PAGE_WIDTH - MARGIN - 210
  const colPrice = PAGE_WIDTH - MARGIN - 140
  const colTotal = PAGE_WIDTH - MARGIN - 60

  page.drawRectangle({ x: MARGIN, y: y - 6, width: PAGE_WIDTH - MARGIN * 2, height: 22, color: lightGray })
  page.drawText('DESCRIPTION', { x: colDesc + 4, y: y, size: 8, font: bold, color: gray })
  page.drawText('QTY', { x: colQty, y, size: 8, font: bold, color: gray })
  page.drawText('PRICE', { x: colPrice, y, size: 8, font: bold, color: gray })
  page.drawText('TOTAL', { x: colTotal, y, size: 8, font: bold, color: gray })
  y -= 26

  for (const item of input.items) {
    const desc = item.description.length > 48 ? `${item.description.slice(0, 45)}...` : item.description
    page.drawText(desc, { x: colDesc + 4, y, size: 10, font, color: black })
    page.drawText(String(item.quantity), { x: colQty, y, size: 10, font, color: black })
    page.drawText(item.unitPrice.toLocaleString('en-KE'), { x: colPrice, y, size: 10, font, color: black })
    page.drawText(item.lineTotal.toLocaleString('en-KE'), { x: colTotal, y, size: 10, font, color: black })
    y -= 20
  }

  y -= 6
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.75, color: lightGray })
  y -= 22

  const totalsRow = (label: string, value: string, emphasize = false) => {
    const size = emphasize ? 12 : 10
    const usedFont = emphasize ? bold : font
    page.drawText(label, { x: PAGE_WIDTH - MARGIN - 200, y, size, font: usedFont, color: emphasize ? black : gray })
    page.drawText(value, { x: PAGE_WIDTH - MARGIN - usedFont.widthOfTextAtSize(value, size), y, size, font: usedFont, color: emphasize ? accent : black })
    y -= emphasize ? 20 : 16
  }

  totalsRow('Subtotal', money(input.subtotal, currency))
  if (input.discount) totalsRow('Discount', `-${money(input.discount, currency)}`)
  if (input.taxAmount) totalsRow('Tax', money(input.taxAmount, currency))
  totalsRow('TOTAL', money(input.total, currency), true)
  if (input.amountPaid !== undefined && input.amountPaid > 0) {
    totalsRow('Paid', money(input.amountPaid, currency))
    totalsRow('Balance due', money(Math.max(0, input.total - input.amountPaid), currency))
  }

  if (input.notes) {
    y -= 16
    page.drawText('NOTES', { x: MARGIN, y, size: 8, font: bold, color: gray })
    y -= 14
    page.drawText(input.notes.length > 110 ? `${input.notes.slice(0, 107)}...` : input.notes, { x: MARGIN, y, size: 9, font, color: black })
  }

  const footer = input.footerNote ?? 'Thank you for your business.'
  page.drawText(footer, {
    x: (PAGE_WIDTH - font.widthOfTextAtSize(footer, 9)) / 2,
    y: MARGIN - 12, size: 9, font, color: gray,
  })

  return doc.save()
}
