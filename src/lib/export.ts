import type { Expense, User, CustodyPlan, Child } from '@/types';
import { supabase } from './supabase';

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

/**
 * Opens a print dialog with a formatted custody plan.
 * GDPR: Does NOT include medications, allergies, or emergency contacts.
 */
export function exportCustodyPlanPDF(
  plan: CustodyPlan,
  child: Child,
  users: User[],
): void {
  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? 'Ukendt';

  const dayNames = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

  const patternLabels: Record<string, string> = {
    '7/7': '7/7-ordning',
    '10/4': '10/4-ordning',
    '14/0': '14/0-ordning',
    custom: 'Brugerdefineret',
    alternating: 'Skiftende uger',
    'weekday-weekend': 'Hverdag/weekend',
    supervised: 'Overvåget samvær',
    supervised_limited: 'Begrænset overvåget samvær',
  };

  const parent1Name = getUserName(child.parent1Id);
  const parent2Name = getUserName(child.parent2Id);

  // Build weekly schedule rows
  const scheduleRows = dayNames
    .map((dayName, i) => {
      const isParent1 = plan.parent1Days.includes(i);
      const isParent2 = plan.parent2Days.includes(i);
      const assignedTo = isParent1 ? parent1Name : isParent2 ? parent2Name : '—';
      const isSwapDay = plan.swapDay === i;
      return `<tr${isSwapDay ? ' style="background:#fff8f0"' : ''}>
        <td>${dayName}${isSwapDay ? ' ↔' : ''}</td>
        <td>${assignedTo}</td>
      </tr>`;
    })
    .join('');

  // Build holiday rows
  const holidayRows = (plan.holidays ?? [])
    .map(
      (h) => `<tr>
        <td>${h.name}</td>
        <td>${h.startDate} — ${h.endDate}</td>
        <td>${getUserName(h.parentId)}</td>
        <td>${h.alternateYears ? 'Ja' : 'Nej'}</td>
      </tr>`,
    )
    .join('');

  // Build supervised config section
  const supervisedSection = plan.supervisedConfig
    ? `<h2>Overvåget samvær</h2>
       <table>
         <tr><td><strong>Frekvens</strong></td><td>Hver ${plan.supervisedConfig.frequencyWeeks}. uge</td></tr>
         <tr><td><strong>Varighed</strong></td><td>${plan.supervisedConfig.durationHours} timer</td></tr>
         <tr><td><strong>Sted</strong></td><td>${plan.supervisedConfig.location}</td></tr>
         ${plan.supervisedConfig.supervisorRequired ? `<tr><td><strong>Tilsynsførende</strong></td><td>${plan.supervisedConfig.supervisorName ?? 'Påkrævet'}</td></tr>` : ''}
         ${plan.supervisedConfig.startTime ? `<tr><td><strong>Tidspunkt</strong></td><td>${plan.supervisedConfig.startTime}</td></tr>` : ''}
       </table>`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <title>Samværsplan — ${child.name}</title>
  <style>
    body { font-family: sans-serif; font-size: 12px; color: #222; margin: 2cm; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    p.meta { color: #666; font-size: 11px; margin-bottom: 16px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .info-item { font-size: 12px; }
    .info-label { font-weight: bold; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { text-align: left; border-bottom: 2px solid #333; padding: 6px 8px; font-size: 11px; }
    td { border-bottom: 1px solid #ddd; padding: 6px 8px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10px; color: #999; }
    @media print { body { margin: 1cm; } }
  </style>
</head>
<body>
  <h1>Samværsplan</h1>
  <p class="meta">Eksporteret ${new Date().toLocaleDateString('da-DK')}</p>

  <div class="info-grid">
    <div class="info-item"><span class="info-label">Barn:</span> ${child.name}</div>
    <div class="info-item"><span class="info-label">Fødselsdato:</span> ${child.birthDate}</div>
    <div class="info-item"><span class="info-label">Forælder 1:</span> ${parent1Name}</div>
    <div class="info-item"><span class="info-label">Forælder 2:</span> ${parent2Name}</div>
    <div class="info-item"><span class="info-label">Samværsmodel:</span> ${patternLabels[plan.pattern] ?? plan.pattern}</div>
    <div class="info-item"><span class="info-label">Startdato:</span> ${plan.startDate}</div>
    ${plan.swapTime ? `<div class="info-item"><span class="info-label">Skiftetidspunkt:</span> ${plan.swapTime}</div>` : ''}
    ${plan.swapDay !== undefined ? `<div class="info-item"><span class="info-label">Skiftedag:</span> ${dayNames[plan.swapDay]}</div>` : ''}
  </div>

  <h2>Ugentlig fordeling</h2>
  <table>
    <thead>
      <tr><th>Dag</th><th>Hos</th></tr>
    </thead>
    <tbody>${scheduleRows}</tbody>
  </table>

  ${holidayRows ? `
  <h2>Ferieaftaler</h2>
  <table>
    <thead>
      <tr><th>Ferie</th><th>Periode</th><th>Hos</th><th>Skifter årligt</th></tr>
    </thead>
    <tbody>${holidayRows}</tbody>
  </table>
  ` : ''}

  ${supervisedSection}

  ${plan.agreementDate ? `
  <h2>Aftale</h2>
  <div class="info-grid">
    <div class="info-item"><span class="info-label">Aftaledato:</span> ${plan.agreementDate}</div>
    ${plan.agreementValidUntil ? `<div class="info-item"><span class="info-label">Gyldig til:</span> ${plan.agreementValidUntil}</div>` : ''}
  </div>
  ${plan.agreementText ? `<p>${plan.agreementText}</p>` : ''}
  ` : ''}

  <div class="footer">
    Genereret fra Huska · ${new Date().toLocaleDateString('da-DK')}
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

/**
 * GDPR Data Export — henter alle brugerens data fra Supabase og downloader som JSON.
 */
export async function exportAllData(): Promise<void> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) throw new Error('Ikke logget ind');

  const tables = [
    'profiles',
    'children',
    'calendar_events',
    'tasks',
    'expenses',
    'documents',
    'meal_plans',
    'messages',
    'message_threads',
    'decision_logs',
    'key_dates',
    'diary_entries',
    'milestones',
    'household_members',
  ] as const;

  const results: Record<string, unknown[]> = {};

  // Hent alle tabeller parallelt — RLS filtrerer automatisk
  await Promise.all(
    tables.map(async (table) => {
      const { data } = await supabase.from(table).select('*');
      results[table] = data || [];
    }),
  );

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: authUser.id,
    email: authUser.email,
    data: results,
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mine-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
