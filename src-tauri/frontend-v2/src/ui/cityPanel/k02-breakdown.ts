// P5.8 K02 (kawalek K02, runda 2): bloki rozpiski breakdown z
// gra/src/ui/cityPanel.ts @ edb8fb56, linie 4378-4516 (appendBreakdownLines,
// appendPctBreakdownBlock, appendSignedBreakdownSections, appendW4SignedBreakdownSections).
// Kopia 1:1 tresci funkcji; zmiany: eksport, import typu BreakdownLine z ./types
// (ZALOZENIE P5.8-K02-Z3) oraz lokalny `el` bez parametru `html` (ZALOZENIE P5.8-K02-Z4).
// Wszystkie wywolania el() w tych blokach maja tag i klase, bez html, wiec pin:863 i
// wersja lokalna daja identyczny DOM. Pin przy `html` uzywa cpInlineIcons z K01 (nieuzywane tu).
// P5.8 SCAL: typ BreakdownLine i `el` z kawalkow K01 (./k01a-fundament, ./k01b-dom) zamiast lokalnych kopii.
import type { BreakdownLine } from './k01a-fundament';
import { el } from './k01b-dom';

export function appendBreakdownLines(
  mount: HTMLElement,
  lines: BreakdownLine[] | undefined,
  emptyHint: string,
): void {
  const box = el('div', 'or-lines');
  if (!lines || lines.length === 0) {
    const none = el('div', 'muted-line');
    none.textContent = emptyHint;
    box.appendChild(none);
  } else {
    for (const l of lines) {
      const isNeg = l.neg === true || l.value < 0;
      const row = el('div', isNeg ? 'neg' : 'pos');
      // P-PORZADEK-PANEL-CZYTELNOSC (Evaluator, komit 3b851610 dot. koloru): wiersz
      // NEGATYWNY (isNeg) z wartością -0 (np. citizenUpkeepDisplayLines: -qty gdy
      // qty===0, populacja 1-4) nie może pokazać „+0" — mylące w czerwonym wierszu, bo
      // sugeruje przyrost mimo statusu "brak". `Math.abs(l.value) === 0` łapie zarówno
      // 0, jak i -0. Dla zwykłych wartości (dodatnich, i ujemnych różnych od zera)
      // zachowanie identyczne jak dawniej.
      // EN: a NEGATIVE row (isNeg) with value -0 (e.g. citizenUpkeepDisplayLines: -qty
      // when qty===0, population 1-4) must not read "+0" -- misleading in a red row,
      // implies a gain despite the "missing" status. `Math.abs(l.value) === 0` catches
      // both 0 and -0. Ordinary values (positive, and negative non-zero) keep today's
      // behavior unchanged.
      const showAsZero = isNeg && Math.abs(l.value) === 0;
      row.textContent = `${l.label}: ${showAsZero ? '0' : `${l.value >= 0 ? '+' : ''}${l.value}`}`;
      box.appendChild(row);
    }
  }
  mount.appendChild(box);
}

export function appendPctBreakdownBlock(
  mount: HTMLElement,
  title: string,
  pct: number | undefined,
  barColor: string,
  lines: BreakdownLine[] | undefined,
  emptyHint: string,
): void {
  const block = el('div', 'civ-breakdown-block');
  const sub = el('div', 'subhd');
  if (title.includes('<')) sub.innerHTML = title;
  else sub.textContent = title;
  block.appendChild(sub);
  if (pct != null) {
    const row = el('div', 'or-r');
    row.innerHTML = `<span class="or-l">Stan</span><span><b>${Math.round(pct)}%</b></span>`;
    block.appendChild(row);
    const barWrap = el('div', 'or-bar');
    const fill = el('div', 'or-fill');
    fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    fill.style.background = barColor;
    barWrap.appendChild(fill);
    block.appendChild(barWrap);
  }
  appendBreakdownLines(block, lines, emptyHint);
  mount.appendChild(block);
}

export function appendSignedBreakdownSections(
  mount: HTMLElement,
  title: string,
  lines: BreakdownLine[],
  emptyHint: string,
): void {
  const pos = lines.filter(l => l.value > 0);
  const neg = lines.filter(l => l.value < 0);
  const zero = lines.filter(l => l.value === 0);
  const block = el('div', 'civ-breakdown-block');
  const sub = el('div', 'subhd');
  if (title.includes('<')) sub.innerHTML = title;
  else sub.textContent = title;
  block.appendChild(sub);
  if (lines.length === 0) {
    appendBreakdownLines(block, undefined, emptyHint);
  } else {
    if (pos.length > 0) {
      const plusHd = el('div', 'muted');
      plusHd.style.cssText = 'font-size:0.68em;margin:0.08em 0 0.1em;text-transform:uppercase;letter-spacing:0.04em;';
      plusHd.textContent = 'Na plus';
      block.appendChild(plusHd);
      appendBreakdownLines(block, pos, '');
    }
    if (neg.length > 0) {
      const minusHd = el('div', 'muted');
      minusHd.style.cssText = 'font-size:0.68em;margin:0.22em 0 0.1em;text-transform:uppercase;letter-spacing:0.04em;';
      minusHd.textContent = 'Na minus';
      block.appendChild(minusHd);
      appendBreakdownLines(block, neg, '');
    }
    if (zero.length > 0) {
      appendBreakdownLines(block, zero, '');
    }
  }
  mount.appendChild(block);
}

/** Rozpiska +/- w stylu W4 v2 (Zdrowie · Kultura · Religia). */
export function appendW4SignedBreakdownSections(
  mount: HTMLElement,
  titleHtml: string,
  lines: BreakdownLine[],
  emptyHint: string,
): void {
  const pos = lines.filter(l => l.value > 0);
  const neg = lines.filter(l => l.value < 0);
  const zero = lines.filter(l => l.value === 0);
  const block = el('div', 'civ-breakdown-block');
  const sub = el('div', 'civ-w4-subhd');
  if (titleHtml.includes('<')) sub.innerHTML = titleHtml;
  else sub.textContent = titleHtml;
  block.appendChild(sub);
  if (lines.length === 0) {
    const empty = el('div', 'civ-w4-inline-breakdown');
    empty.innerHTML = `<span class="muted">${emptyHint}</span>`;
    block.appendChild(empty);
  } else {
    if (pos.length > 0) {
      const plusHd = el('div', 'muted');
      plusHd.style.cssText = 'font-size:0.68em;margin:0.08em 0 0.1em;text-transform:uppercase;letter-spacing:0.1em;';
      plusHd.textContent = 'Na plus';
      block.appendChild(plusHd);
      appendBreakdownLines(block, pos, '');
    }
    if (neg.length > 0) {
      const minusHd = el('div', 'muted');
      minusHd.style.cssText = 'font-size:0.68em;margin:0.22em 0 0.1em;text-transform:uppercase;letter-spacing:0.1em;';
      minusHd.textContent = 'Na minus';
      block.appendChild(minusHd);
      appendBreakdownLines(block, neg, '');
    }
    if (zero.length > 0) {
      appendBreakdownLines(block, zero, '');
    }
  }
  mount.appendChild(block);
}
