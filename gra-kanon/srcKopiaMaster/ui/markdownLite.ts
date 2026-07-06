/**
 * markdownLite.ts — lekki renderer Markdown dla panelu Wikipedia (bez zależności).
 */

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFmt(s: string): string {
  let t = esc(s);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" data-wiki-link="$2">$1</a>');
  return t;
}

function parseTable(lines: string[], start: number): { html: string; next: number } {
  const rows: string[][] = [];
  let i = start;
  while (i < lines.length && lines[i]?.includes('|')) {
    const line = lines[i] ?? '';
    if (/^\|?\s*[-:| ]+\s*\|/.test(line)) { i++; continue; }
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length) rows.push(cells);
    i++;
  }
  if (rows.length === 0) return { html: '', next: start };
  let html = '<table><thead><tr>';
  const head = rows[0] ?? [];
  for (const c of head) html += `<th>${inlineFmt(c)}</th>`;
  html += '</tr></thead><tbody>';
  for (let r = 1; r < rows.length; r++) {
    html += '<tr>';
    for (const c of rows[r] ?? []) html += `<td>${inlineFmt(c)}</td>`;
    html += '</tr>';
  }
  html += '</tbody></table>';
  return { html, next: i };
}

/** Konwertuje Markdown na HTML (nagłówki, listy, tabele, akapity). */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.trim() === '') { i++; continue; }
    if (line.startsWith('---')) { out.push('<hr/>'); i++; continue; }
    const h = line.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      const lvl = h[1]?.length ?? 2;
      const tag = `h${Math.min(lvl + 1, 4)}`;
      out.push(`<${tag}>${inlineFmt(h[2] ?? '')}</${tag}>`);
      i++;
      continue;
    }
    if (line.startsWith('> ')) {
      const q: string[] = [];
      while (i < lines.length && (lines[i] ?? '').startsWith('> ')) {
        q.push((lines[i] ?? '').slice(2));
        i++;
      }
      out.push(`<blockquote>${markdownToHtml(q.join('\n'))}</blockquote>`);
      continue;
    }
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tbl = parseTable(lines, i);
      if (tbl.html) { out.push(`<div class="md-table-wrap">${tbl.html}</div>`); i = tbl.next; continue; }
    }
    if (/^[-*]\s+/.test(line)) {
      out.push('<ul>');
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? '')) {
        out.push(`<li>${inlineFmt((lines[i] ?? '').replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      out.push('</ul>');
      continue;
    }
    const para: string[] = [];
    while (i < lines.length) {
      const l = lines[i] ?? '';
      if (l.trim() === '' || l.startsWith('#') || l.startsWith('> ') || /^[-*]\s+/.test(l)
          || (l.includes('|') && l.trim().startsWith('|')) || l.startsWith('---')) break;
      para.push(l);
      i++;
    }
    if (para.length) out.push(`<p>${inlineFmt(para.join(' '))}</p>`);
  }
  return out.join('\n');
}
