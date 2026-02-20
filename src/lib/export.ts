import type { Expense, User } from '@/types';

/**
 * Exports expenses as a UTF-8 BOM CSV file compatible with Excel/Numbers.
 */
export function exportExpensesCSV(expenses: Expense[], users: User[]): void {
  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? id;

  const header = [
    'Dato',
    'Titel',
    'Kategori',
    'Beløb (DKK)',
    'Betalt af',
    'Status',
    'Beskrivelse',
  ];

  const categoryLabels: Record<string, string> = {
    institution: 'Institution',
    medical: 'Medicin/Sundhed',
    clothing: 'Tøj',
    activities: 'Aktiviteter',
    school: 'Skole',
    food: 'Mad',
    transport: 'Transport',
    other: 'Andet',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Afventer',
    approved: 'Godkendt',
    paid: 'Betalt',
    disputed: 'Anfægtet',
  };

  const rows = expenses.map((e) => [
    e.date,
    e.title,
    categoryLabels[e.category] ?? e.category,
    e.amount.toFixed(2).replace('.', ','),
    getUserName(e.paidBy),
    statusLabels[e.status] ?? e.status,
    e.description ?? '',
  ]);

  const escapeCell = (cell: string) =>
    `"${cell.replace(/"/g, '""').replace(/\n/g, ' ')}"`;

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCell).join(';'))
    .join('\r\n');

  // BOM prefix makes Excel detect UTF-8 encoding correctly
  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `udgifter-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print dialog with a formatted expense summary.
 * The browser can save this as PDF via "Print to PDF".
 */
export function printExpenses(expenses: Expense[], users: User[]): void {
  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? id;

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const rows = expenses
    .map(
      (e) => `
    <tr>
      <td>${e.date}</td>
      <td>${e.title}</td>
      <td>${e.amount.toFixed(2).replace('.', ',')} kr.</td>
      <td>${getUserName(e.paidBy)}</td>
      <td>${e.status}</td>
    </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <title>Udgiftoversigt</title>
  <style>
    body { font-family: sans-serif; font-size: 12px; color: #222; margin: 2cm; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p.meta { color: #666; font-size: 11px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; border-bottom: 2px solid #333; padding: 6px 8px; font-size: 11px; }
    td { border-bottom: 1px solid #ddd; padding: 6px 8px; }
    tfoot td { font-weight: bold; border-top: 2px solid #333; }
    @media print { body { margin: 1cm; } }
  </style>
</head>
<body>
  <h1>Udgiftoversigt</h1>
  <p class="meta">Eksporteret ${new Date().toLocaleDateString('da-DK')} · ${expenses.length} udgifter</p>
  <table>
    <thead>
      <tr>
        <th>Dato</th>
        <th>Titel</th>
        <th>Beløb</th>
        <th>Betalt af</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2">Total</td>
        <td>${total.toFixed(2).replace('.', ',')} kr.</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
