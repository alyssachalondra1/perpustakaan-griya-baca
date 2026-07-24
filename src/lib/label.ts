// ============================================================================
//  Generator LABEL BUKU (nomor panggil) -> DOCX
//  Format mengikuti contoh label:
//    PERPUSTAKAAN / GRIYA BACA / <DDC> / <NM-PNGRNG> / <PRTM JDL>
//  Disusun grid 3 label per baris.
// ============================================================================
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle
} from 'docx'
import type { Book } from '@/types'

export interface LabelData { baris1: string; baris2: string; ddc: string; nm: string; jdl: string }

export function bookToLabel(b: Book, baris1 = 'PERPUSTAKAAN', baris2 = 'GRIYA BACA'): LabelData {
  return { baris1, baris2, ddc: b.nomor_klasifikasi || '', nm: b.nm_pngrng || '', jdl: b.prtm_jdl || '' }
}

function labelCell(l: LabelData): TableCell {
  const line = (text: string, size = 20) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new TextRun({ text, bold: true, size, font: 'Arial' })]
    })
  return new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    margins: { top: 120, bottom: 120, left: 80, right: 80 },
    children: [line(l.baris1, 20), line(l.baris2, 20), line(l.ddc, 24), line(l.nm, 24), line(l.jdl, 24)]
  })
}

function emptyCell(): TableCell {
  return new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [new Paragraph('')] })
}

export async function buildLabelDocx(books: Book[], baris1?: string, baris2?: string): Promise<Buffer> {
  const labels = books.map((b) => bookToLabel(b, baris1, baris2))
  const perRow = 3
  const rows: TableRow[] = []
  for (let i = 0; i < labels.length; i += perRow) {
    const cells = labels.slice(i, i + perRow).map(labelCell)
    while (cells.length < perRow) cells.push(emptyCell())
    rows.push(new TableRow({ children: cells }))
  }
  const b = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }
  })
  const doc = new Document({ sections: [{ children: [table] }] })
  return Packer.toBuffer(doc)
}
