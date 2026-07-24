import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
  title: string;
  userName: string;
  filters: Record<string, string>;
  summary: { label: string; value: string }[];
  columns: string[];
  rows: any[][];
  totals?: string[];
}

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Blue header band
  doc.setFillColor(37, 99, 235); // bg-blue-600
  doc.rect(0, 0, 210, 36, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('ExpenseTracker', 15, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Personal Finance Portfolio Companion', 15, 21);

  // Metadata block (right-aligned)
  doc.setFontSize(9);
  doc.text(`Report: ${data.title}`, 195, 12, { align: 'right' });
  doc.text(`User: ${data.userName}`, 195, 17, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 195, 22, { align: 'right' });

  let currentY = 44;

  // Active Filters
  const filterEntries = Object.entries(data.filters).filter(([_, val]) => !!val);
  if (filterEntries.length > 0) {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Applied Filters:', 15, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const filterText = filterEntries.map(([k, v]) => `${k}: ${v}`).join('   |   ');
    doc.text(filterText, 15, currentY + 4.5);
    currentY += 12;
  }

  // Summary Metrics
  if (data.summary && data.summary.length > 0) {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(15, currentY, 180, 20, 2, 2, 'FD');

    const cardWidth = 180 / data.summary.length;
    data.summary.forEach((item, index) => {
      const x = 15 + index * cardWidth + cardWidth / 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, x, currentY + 6.5, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(item.value, x, currentY + 14, { align: 'center' });
    });
    currentY += 26;
  }

  // Data Table
  autoTable(doc, {
    startY: currentY,
    head: [data.columns],
    body: data.rows,
    foot: data.totals ? [data.totals] : undefined,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 9,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2.5,
    },
    didDrawPage: (pageData) => {
      // Bottom footer banner
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('ExpenseTracker - Personal Finance Companion', 15, 287);
      doc.text(
        `Page ${pageData.pageNumber} of ${doc.getNumberOfPages()}`,
        195,
        287,
        { align: 'right' }
      );
    },
  });

  const filename = `${data.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export function exportToCSV(filename: string, columns: string[], rows: any[][]) {
  const fileRows = [columns, ...rows];
  const csvContent = fileRows
    .map((r) =>
      r
        .map((cell) => {
          const stringVal = cell === null || cell === undefined ? '' : String(cell);
          return `"${stringVal.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
}

export function exportToExcel(filename: string, columns: string[], rows: any[][]) {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8"/>
      <style>
        table { border-collapse: collapse; font-family: sans-serif; }
        th { background-color: #2563eb; color: white; font-weight: bold; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 12px; text-align: left; }
        tr:nth-child(even) { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <table>
        <thead>
          <tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => `<td>${cell === null || cell === undefined ? '' : cell}</td>`)
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  a.click();
}

export function exportToPrint(title: string, columns: string[], rows: any[][], summary?: { label: string; value: string }[], userName?: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 30px; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
          .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; }
          .summary { display: flex; gap: 16px; margin-bottom: 24px; }
          .summary-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; background-color: #f8fafc; }
          .summary-card-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; }
          .summary-card-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background-color: #2563eb; color: white; font-weight: bold; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
          th, td { border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 12px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${title}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ExpenseTracker Financial Statement</div>
          </div>
          <div class="meta">
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
            <div><strong>User:</strong> ${userName || 'Yash Mehta'}</div>
          </div>
        </div>

        ${
          summary && summary.length > 0
            ? `
          <div class="summary">
            ${summary
              .map(
                (s) => `
              <div class="summary-card">
                <div class="summary-card-label">${s.label}</div>
                <div class="summary-card-value">${s.value}</div>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <table>
          <thead>
            <tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map((cell) => `<td>${cell === null || cell === undefined ? '' : cell}</td>`)
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
