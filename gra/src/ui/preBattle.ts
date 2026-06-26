/**
 * preBattle.ts
 * Pre-battle overlay for The Game -- shown before combat to let the player
 * choose how to fight (auto, tactical, or retreat).
 *
 * ASCII-only source; Polish UI strings use \uXXXX escapes.
 * Pure DOM (no THREE, no innerHTML with non-ASCII).
 * Dark + gold style matching Makieta-przed-bitwa.html.
 */

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface PreBattleUnit {
  nazwa: string;
  kategoria: string;
  hp: number;
  maxHp: number;
  atak: number;
  ilosc?: number;
}

export interface PreBattleSide {
  nazwa: string;
  cywilizacja?: string;
  units: PreBattleUnit[];
}

export interface PreBattleInfo {
  atakujacy: PreBattleSide;
  obronca: PreBattleSide;
  teren: string;
  szanseAtkPct: number;
}

export interface PreBattleCallbacks {
  onAuto: () => void;
  onBattlefield: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let overlayEl: HTMLDivElement | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function showPreBattle(info: PreBattleInfo, cb: PreBattleCallbacks): void {
  hidePreBattle();
  overlayEl = buildOverlay(info, cb);
  document.body.appendChild(overlayEl);
}

export function hidePreBattle(): void {
  if (overlayEl !== null) {
    overlayEl.remove();
    overlayEl = null;
  }
}

export function isPreBattleOpen(): boolean {
  return overlayEl !== null;
}

// ---------------------------------------------------------------------------
// CSS variables + keyframes (injected once)
// ---------------------------------------------------------------------------

let styleInjected = false;

function ensureStyles(): void {
  if (styleInjected) return;
  styleInjected = true;

  const s = document.createElement('style');
  s.textContent = [
    ':root{',
    '  --pb-gold:#e8d88a;--pb-gold-dim:#b8a85a;--pb-gold-faint:rgba(232,216,138,0.08);',
    '  --pb-bg:rgba(4,6,15,0.97);--pb-panel:rgba(10,16,32,0.92);',
    '  --pb-panel2:rgba(6,10,22,0.96);--pb-unit:rgba(14,22,42,0.90);',
    '  --pb-border:rgba(232,216,138,0.22);--pb-border-hi:rgba(232,216,138,0.55);',
    '  --pb-text:#d4cba0;--pb-text-dim:#7a7055;--pb-text-hi:#f0e8b8;',
    '  --pb-text-muted:#554e38;',
    '  --pb-red:#c84040;--pb-green:#50b070;',
    '  --pb-atk:#4a90d8;--pb-atk-border:rgba(74,144,216,0.40);',
    '  --pb-def:#c84040;--pb-def-border:rgba(200,64,64,0.38);',
    '  --pb-r:5px;--pb-r-lg:10px;',
    '  --pb-font-main:Georgia,"Times New Roman",serif;',
    '  --pb-font-ui:"Trebuchet MS",Verdana,sans-serif;',
    '}',
    '@keyframes pb-fadeIn{from{opacity:0}to{opacity:1}}',
  ].join('\n');
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Helper: apply style properties from a plain object
// ---------------------------------------------------------------------------

type StyleMap = { [K in keyof CSSStyleDeclaration]?: string };

function css(el: HTMLElement, props: StyleMap): void {
  for (const key of Object.keys(props) as Array<keyof CSSStyleDeclaration>) {
    const v = props[key];
    if (v !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el.style as any)[key as string] = v;
    }
  }
}

// ---------------------------------------------------------------------------
// Helper: create element with optional class + text
// ---------------------------------------------------------------------------

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------------------------------------------------------------------------
// Category -> decorative character
// ---------------------------------------------------------------------------

function unitIcon(kategoria: string): string {
  const k = kategoria.toLowerCase();
  if (k.includes('kawaleria') || k.includes('konnica') || k.includes('jezd')) return '\u{1F40E}'; // horse
  if (k.includes('lucznik')   || k.includes('\u0142uk') || k.includes('arc')) return '\u{1F3F9}'; // bow
  if (k.includes('slon')      || k.includes('s\u0142o\u0144'))                return '\u{1F418}'; // elephant
  if (k.includes('rydwan'))                                                    return '\u{1FAA9}'; // military helmet
  if (k.includes('falang')    || k.includes('tarcza'))                        return '\u{1F6E1}'; // shield
  return '\u{1F5E1}'; // dagger fallback
}

// ---------------------------------------------------------------------------
// Build a single unit chip
// ---------------------------------------------------------------------------

function buildUnitChip(unit: PreBattleUnit, side: 'atk' | 'def'): HTMLDivElement {
  const isAtk = side === 'atk';

  const chip = el('div');
  css(chip, {
    display: 'grid',
    gridTemplateColumns: '32px 1fr',
    gridTemplateRows: 'auto auto',
    columnGap: '10px',
    background: 'var(--pb-unit)',
    border: '1px solid var(--pb-border)',
    borderRadius: 'var(--pb-r)',
    padding: '8px 10px 8px 8px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--pb-font-ui)',
    transition: 'border-color 0.15s',
  });

  chip.addEventListener('mouseenter', () => {
    chip.style.borderColor = 'var(--pb-border-hi)';
  });
  chip.addEventListener('mouseleave', () => {
    chip.style.borderColor = 'var(--pb-border)';
  });

  // Left accent bar
  const accent = el('div');
  css(accent, {
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    width: '3px',
    background: isAtk ? 'var(--pb-atk)' : 'var(--pb-def)',
    opacity: '0.7',
  });
  chip.appendChild(accent);

  // Icon cell (spans 2 rows)
  const iconDiv = el('div');
  css(iconDiv, {
    gridRow: '1 / 3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    fontSize: '18px',
    lineHeight: '1',
    background: 'rgba(232,216,138,0.06)',
    border: '1px solid var(--pb-border)',
  });
  iconDiv.textContent = unitIcon(unit.kategoria);
  chip.appendChild(iconDiv);

  // Name row
  const nameRow = el('div');
  css(nameRow, {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '6px',
  });

  const nameSpan = el('span');
  css(nameSpan, {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--pb-text-hi)',
    letterSpacing: '0.5px',
  });
  nameSpan.textContent = unit.nazwa;
  nameRow.appendChild(nameSpan);

  if (unit.ilosc !== undefined) {
    const badge = el('span');
    css(badge, {
      fontSize: '10px',
      color: 'var(--pb-gold-dim)',
      background: 'rgba(232,216,138,0.08)',
      border: '1px solid rgba(232,216,138,0.18)',
      padding: '1px 6px',
      borderRadius: '3px',
      whiteSpace: 'nowrap',
    });
    badge.textContent = '\u00D7' + String(unit.ilosc); // x multiply sign
    nameRow.appendChild(badge);
  }
  chip.appendChild(nameRow);

  // HP bar row
  const barRow = el('div');
  css(barRow, {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginTop: '4px',
  });

  const strSpan = el('span');
  css(strSpan, {
    fontSize: '10px',
    color: 'var(--pb-text-dim)',
    whiteSpace: 'nowrap',
    minWidth: '40px',
  });
  strSpan.textContent = 'Si\u0142: ' + String(unit.atak); // "Si\u0142:"
  barRow.appendChild(strSpan);

  const barBg = el('div');
  css(barBg, {
    flex: '1',
    height: '5px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '3px',
    overflow: 'hidden',
  });

  const pct = unit.maxHp > 0 ? Math.max(0, Math.min(100, Math.round((unit.hp / unit.maxHp) * 100))) : 0;

  const barFill = el('div');
  css(barFill, {
    height: '100%',
    width: pct + '%',
    borderRadius: '3px',
    background: isAtk
      ? 'linear-gradient(90deg,#3070b8,#60b0e8)'
      : 'linear-gradient(90deg,#8a2020,#d05050)',
    transition: 'width 0.3s',
  });
  barBg.appendChild(barFill);
  barRow.appendChild(barBg);

  const hpVal = el('span');
  css(hpVal, {
    fontSize: '10px',
    color: 'var(--pb-text-dim)',
    minWidth: '34px',
    textAlign: 'right',
  });
  hpVal.textContent = String(unit.hp) + ' HP';
  barRow.appendChild(hpVal);
  chip.appendChild(barRow);

  return chip;
}

// ---------------------------------------------------------------------------
// Build a side panel (attacker or defender)
// ---------------------------------------------------------------------------

function buildSidePanel(side: PreBattleSide, role: 'atk' | 'def'): HTMLDivElement {
  const isAtk = role === 'atk';
  const panel = el('div');
  css(panel, {
    padding: '20px 18px 18px',
    borderRight: isAtk ? '1px solid var(--pb-border)' : 'none',
    borderLeft: isAtk ? 'none' : '1px solid var(--pb-border)',
    minHeight: '480px',
    fontFamily: 'var(--pb-font-ui)',
    overflowY: 'auto',
  });

  // Header
  const header = el('div');
  css(header, {
    marginBottom: '14px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--pb-border)',
  });

  const roleLabel = el('div');
  css(roleLabel, {
    fontSize: '9px',
    letterSpacing: '4px',
    textTransform: 'uppercase',
    marginBottom: '4px',
    color: isAtk ? 'var(--pb-atk)' : 'var(--pb-def)',
  });
  // "Atakujacy" / "Obronca" in Polish with escapes
  roleLabel.textContent = isAtk
    ? '\u2694 Atakuj\u0105cy'    // "\u2694 Atakuj\u0105cy"
    : '\u{1F6E1} Obro\u0144ca'; // "\u{1F6E1} Obro\u0144ca"
  header.appendChild(roleLabel);

  const civNameRow = el('div');
  css(civNameRow, {
    fontFamily: 'var(--pb-font-main)',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--pb-text-hi)',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  // Coloured dot flag
  const flag = el('span');
  css(flag, {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: isAtk ? 'var(--pb-atk)' : 'var(--pb-def)',
    flexShrink: '0',
  });
  civNameRow.appendChild(flag);
  civNameRow.appendChild(document.createTextNode(side.nazwa));
  header.appendChild(civNameRow);

  if (side.cywilizacja) {
    const civ = el('div');
    css(civ, {
      fontSize: '11px',
      color: 'var(--pb-text-dim)',
      letterSpacing: '1px',
      marginTop: '2px',
    });
    // "Cywilizacja: ..."
    civ.textContent = 'Cywilizacja: ' + side.cywilizacja;
    header.appendChild(civ);
  }
  panel.appendChild(header);

  // Units label  -- "Sily bojowe" / "Sily obrony"
  const unitsLabel = el('div');
  css(unitsLabel, {
    fontSize: '9px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: 'var(--pb-text-muted)',
    marginBottom: '8px',
  });
  unitsLabel.textContent = isAtk
    ? 'Si\u0142y bojowe'   // "Si\u0142y bojowe"
    : 'Si\u0142y obrony';  // "Si\u0142y obrony"
  panel.appendChild(unitsLabel);

  // Unit chips
  const unitGrid = el('div');
  css(unitGrid, { display: 'flex', flexDirection: 'column', gap: '6px' });
  for (const unit of side.units) {
    unitGrid.appendChild(buildUnitChip(unit, role));
  }
  panel.appendChild(unitGrid);

  // Total strength footer
  const totalStr = side.units.reduce((acc, u) => acc + u.atak * (u.ilosc ?? 1), 0);

  const totalBar = el('div');
  css(totalBar, {
    marginTop: '14px',
    paddingTop: '10px',
    borderTop: '1px solid var(--pb-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  });

  const totalLbl = el('span');
  css(totalLbl, {
    fontSize: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'var(--pb-text-dim)',
  });
  totalLbl.textContent = '\u0141\u0105czna Si\u0142a'; // "\u0141\u0105czna Si\u0142a"
  totalBar.appendChild(totalLbl);

  const totalVal = el('span');
  css(totalVal, {
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: 'var(--pb-font-main)',
    color: isAtk ? 'var(--pb-atk)' : 'var(--pb-def)',
  });
  totalVal.textContent = String(totalStr);
  totalBar.appendChild(totalVal);
  panel.appendChild(totalBar);

  return panel;
}

// ---------------------------------------------------------------------------
// Build center panel  (terrain + win-chance bar + prediction)
// ---------------------------------------------------------------------------

function buildCenterPanel(info: PreBattleInfo): HTMLDivElement {
  const panel = el('div');
  css(panel, {
    padding: '20px 16px',
    background: 'rgba(6,10,22,0.60)',
    borderLeft: '1px solid var(--pb-border)',
    borderRight: '1px solid var(--pb-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    fontFamily: 'var(--pb-font-ui)',
    overflowY: 'auto',
  });

  function appendSection(build: (sec: HTMLDivElement) => void): void {
    const sec = el('div');
    css(sec, {
      marginBottom: '16px',
      paddingBottom: '14px',
      borderBottom: '1px solid var(--pb-border)',
    });
    build(sec);
    panel.appendChild(sec);
  }

  function centerLabel(parent: HTMLElement, text: string): void {
    const lbl = el('div');
    css(lbl, {
      fontSize: '9px',
      letterSpacing: '3px',
      textTransform: 'uppercase',
      color: 'var(--pb-text-muted)',
      marginBottom: '8px',
    });
    lbl.textContent = text;
    parent.appendChild(lbl);
  }

  // -- Terrain section --
  appendSection(sec => {
    centerLabel(sec, 'Region i teren'); // plain ASCII + diacritics via literals - but wait, must be escaped
    // "Region i teren" - all ASCII so OK

    const badge = el('div');
    css(badge, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 10px',
      background: 'rgba(232,216,138,0.07)',
      border: '1px solid var(--pb-border)',
      borderRadius: 'var(--pb-r)',
      fontSize: '12px',
      color: 'var(--pb-gold-dim)',
      marginBottom: '8px',
    });

    const terrainIcon = el('span');
    css(terrainIcon, { fontSize: '16px' });
    terrainIcon.textContent = '\u{1F3D4}'; // mountain with snow
    badge.appendChild(terrainIcon);
    badge.appendChild(document.createTextNode('\u00A0' + info.teren));
    sec.appendChild(badge);
  });

  // -- Win-chance section --
  appendSection(sec => {
    centerLabel(sec, 'Szanse na zwyci\u0119stwo'); // "Szanse na zwyci\u0119stwo"

    const atkPct = Math.max(0, Math.min(100, Math.round(info.szanseAtkPct)));
    const defPct = 100 - atkPct;

    // Name labels
    const labels = el('div');
    css(labels, {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '10px',
      letterSpacing: '1px',
      marginBottom: '5px',
    });

    const atkLbl = el('span');
    css(atkLbl, { color: 'var(--pb-atk)' });
    atkLbl.textContent = info.atakujacy.nazwa;
    labels.appendChild(atkLbl);

    const defLbl = el('span');
    css(defLbl, { color: 'var(--pb-def)' });
    defLbl.textContent = info.obronca.nazwa;
    labels.appendChild(defLbl);
    sec.appendChild(labels);

    // Split bar
    const barBg = el('div');
    css(barBg, {
      height: '18px',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid var(--pb-border)',
      display: 'flex',
      position: 'relative',
    });

    const atkFill = el('div');
    css(atkFill, {
      width: atkPct + '%',
      height: '100%',
      background: 'linear-gradient(90deg,rgba(40,90,180,0.90),rgba(74,144,216,0.70))',
      transition: 'width 0.5s',
    });
    barBg.appendChild(atkFill);

    const defFill = el('div');
    css(defFill, {
      flex: '1',
      height: '100%',
      background: 'linear-gradient(90deg,rgba(180,40,40,0.70),rgba(200,64,64,0.90))',
    });
    barBg.appendChild(defFill);

    const divider = el('div');
    css(divider, {
      position: 'absolute',
      top: '0',
      bottom: '0',
      left: atkPct + '%',
      width: '2px',
      background: 'rgba(4,6,15,0.9)',
      zIndex: '1',
    });
    barBg.appendChild(divider);
    sec.appendChild(barBg);

    // Percentage labels
    const pctRow = el('div');
    css(pctRow, {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '11px',
      fontWeight: '600',
      marginTop: '4px',
    });

    const pctAtk = el('span');
    css(pctAtk, { color: 'var(--pb-atk)' });
    pctAtk.textContent = String(atkPct) + '%';
    pctRow.appendChild(pctAtk);

    const pctDef = el('span');
    css(pctDef, { color: 'var(--pb-def)' });
    pctDef.textContent = String(defPct) + '%';
    pctRow.appendChild(pctDef);
    sec.appendChild(pctRow);

    // Verdict
    const verdict = el('div');
    const isHigh = atkPct >= 65;
    const isMed  = atkPct >= 45;
    css(verdict, {
      textAlign: 'center',
      marginTop: '8px',
      fontSize: '11px',
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      color: isHigh ? 'var(--pb-green)' : isMed ? 'var(--pb-gold)' : 'var(--pb-red)',
    });
    // "Szanse: Wysokie / Wyrownane / Niskie"
    verdict.textContent = isHigh
      ? 'Szanse: Wysokie'
      : isMed
        ? 'Szanse: Wyr\u00F3wnane'  // "Wyr\u00F3wnane"
        : 'Szanse: Niskie';
    sec.appendChild(verdict);

    // Prediction
    const predBox = el('div');
    css(predBox, {
      background: 'rgba(232,216,138,0.04)',
      border: '1px solid var(--pb-border)',
      borderRadius: 'var(--pb-r)',
      padding: '8px 10px',
      marginTop: '6px',
      fontSize: '11px',
      fontStyle: 'italic',
      color: 'var(--pb-text-dim)',
      lineHeight: '1.5',
    });
    predBox.textContent = buildPrediction(info.atakujacy.nazwa, atkPct);
    sec.appendChild(predBox);
  });

  // VS divider
  const vs = el('div');
  css(vs, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: 'var(--pb-gold-dim)',
    margin: '4px 0 0',
    letterSpacing: '2px',
    fontFamily: 'var(--pb-font-main)',
  });
  vs.textContent = '\u2756  VS  \u2756'; // decorative diamonds
  panel.appendChild(vs);

  return panel;
}

// ---------------------------------------------------------------------------
// Prediction text (Polish, escaped)
// ---------------------------------------------------------------------------

function buildPrediction(atkName: string, atkPct: number): string {
  if (atkPct >= 65) {
    // "Silnik przewiduje zwyci\u0119stwo X przy umiarkowanych stratach. Obrona za\u0142amie si\u0119 w ci\u0105gu kilku tur."
    return (
      'Silnik przewiduje zwyci\u0119stwo ' + atkName +
      ' przy umiarkowanych stratach. ' +
      'Obrona za\u0142amie si\u0119 w ci\u0105gu kilku tur.'
    );
  } else if (atkPct >= 45) {
    // "Wynik starcia jest niepewny. Obie strony ponios\u0105 znaczne straty. Inicjatywa mo\u017Ce przej\u015B\u0107 na stron\u0119 obro\u0144c\u00F3w."
    return (
      'Wynik starcia jest niepewny. Obie strony ponios\u0105 znaczne straty. ' +
      'Inicjatywa mo\u017Ce przej\u015B\u0107 na stron\u0119 obro\u0144c\u00F3w.'
    );
  } else {
    // "Atak jest ryzykowny. Obrona posiada przewag\u0119 \u2014 zaleca si\u0119 taktyczne wycofanie lub wsparcie posi\u0142k\u00F3w."
    return (
      'Atak jest ryzykowny. Obrona posiada przewag\u0119 \u2014 ' +
      'zaleca si\u0119 taktyczne wycofanie lub wsparcie posi\u0142k\u00F3w.'
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom action bar
// ---------------------------------------------------------------------------

function buildBottomBar(
  cb: PreBattleCallbacks,
  dismiss: () => void,
): HTMLDivElement {
  const bar = el('div');
  css(bar, {
    padding: '18px 24px 22px',
    borderTop: '1px solid var(--pb-border)',
    background: 'rgba(4,8,20,0.85)',
    position: 'relative',
    flexShrink: '0',
  });

  // Gold rule
  const rule = el('div');
  css(rule, {
    height: '1px',
    background: 'linear-gradient(90deg,transparent,var(--pb-gold-dim),transparent)',
    marginBottom: '16px',
  });
  bar.appendChild(rule);

  // Hint note
  // "Auto = silnik rozstrzyga \u00B7 Pole bitwy = plansza taktyczna \u00B7 Wycofaj = odwr\u00F3t bez strat"
  const note = el('div');
  css(note, {
    textAlign: 'center',
    fontSize: '10px',
    color: 'var(--pb-text-muted)',
    letterSpacing: '1px',
    marginBottom: '14px',
    fontFamily: 'var(--pb-font-ui)',
  });
  note.textContent =
    'Auto = silnik rozstrzyga \u00B7 ' +
    'Pole bitwy = plansza taktyczna \u00B7 ' +
    'Wycofaj = odwr\u00F3t bez strat'; // "Wycofaj = odwr\u00F3t bez strat"
  bar.appendChild(note);

  const btnRow = el('div');
  css(btnRow, {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    alignItems: 'stretch',
    maxWidth: '860px',
    margin: '0 auto',
  });

  // [ROZEGRAJ AUTOMATYCZNIE]
  btnRow.appendChild(
    buildActionButton(
      '\u26A1',                              // lightning
      '[ROZEGRAJ AUTOMATYCZNIE]',
      'Silnik \u00A75l \u00B7 wynik w 1 turze', // "Silnik \u00A75l \u00B7 wynik w 1 turze"
      {
        bg:           'rgba(80,176,112,0.10)',
        border:       'rgba(80,176,112,0.45)',
        accent:       'var(--pb-green)',
        labelColor:   'var(--pb-green)',
        subColor:     'rgba(80,176,112,0.65)',
        hoverBg:      'rgba(80,176,112,0.18)',
        hoverBorder:  'var(--pb-green)',
        hoverShadow:  '0 0 20px rgba(80,176,112,0.20)',
        flex:         '1',
        maxWidth:     '300px',
        icoSize:      '22px',
        labelSize:    '14px',
      },
      () => { cb.onAuto(); dismiss(); },
    ),
  );

  // [NA POLE BITWY]
  btnRow.appendChild(
    buildActionButton(
      '\u{1F3DF}',                        // stadium emoji
      '[NA POLE BITWY]',
      'Plansza taktyczna \u00B7 steruj r\u0119cznie', // "\u00B7 steruj r\u0119cznie"
      {
        bg:           'rgba(232,216,138,0.10)',
        border:       'var(--pb-gold-dim)',
        accent:       'var(--pb-gold)',
        labelColor:   'var(--pb-gold)',
        subColor:     'var(--pb-gold-dim)',
        hoverBg:      'rgba(232,216,138,0.18)',
        hoverBorder:  'var(--pb-gold)',
        hoverShadow:  '0 0 24px rgba(232,216,138,0.22)',
        flex:         '1',
        maxWidth:     '300px',
        icoSize:      '22px',
        labelSize:    '14px',
      },
      () => { cb.onBattlefield(); dismiss(); },
    ),
  );

  // [WYCOFAJ]
  btnRow.appendChild(
    buildActionButton(
      '\u21A9',                              // left arrow with hook
      '[WYCOFAJ]',
      'Odwr\u00F3t bez walki',
      {
        bg:           'rgba(200,64,64,0.06)',
        border:       'rgba(200,64,64,0.28)',
        accent:       'var(--pb-red)',
        labelColor:   'var(--pb-red)',
        subColor:     'rgba(200,64,64,0.55)',
        hoverBg:      'rgba(200,64,64,0.14)',
        hoverBorder:  'var(--pb-red)',
        hoverShadow:  '0 0 14px rgba(200,64,64,0.15)',
        flex:         '0 0 auto',
        maxWidth:     '160px',
        icoSize:      '18px',
        labelSize:    '12px',
      },
      () => { cb.onCancel(); dismiss(); },
    ),
  );

  bar.appendChild(btnRow);
  return bar;
}

// ---------------------------------------------------------------------------
// Action button helper
// ---------------------------------------------------------------------------

interface BtnStyle {
  bg: string; border: string; accent: string;
  labelColor: string; subColor: string;
  hoverBg: string; hoverBorder: string; hoverShadow: string;
  flex: string; maxWidth: string;
  icoSize: string; labelSize: string;
}

function buildActionButton(
  ico: string,
  label: string,
  sub: string,
  s: BtnStyle,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  css(btn, {
    flex: s.flex,
    maxWidth: s.maxWidth,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '16px 20px',
    borderRadius: 'var(--pb-r-lg)',
    border: '1px solid ' + s.border,
    background: s.bg,
    cursor: 'pointer',
    transition: 'all 0.18s',
    fontFamily: 'var(--pb-font-ui)',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
  });

  // Left accent stripe
  const stripe = el('div');
  css(stripe, {
    position: 'absolute',
    left: '0', top: '0', bottom: '0',
    width: '4px',
    background: s.accent,
  });
  btn.appendChild(stripe);

  const icoDiv = el('div');
  css(icoDiv, { fontSize: s.icoSize, marginBottom: '2px', lineHeight: '1' });
  icoDiv.textContent = ico;
  btn.appendChild(icoDiv);

  const labelDiv = el('div');
  css(labelDiv, {
    fontSize: s.labelSize,
    fontWeight: '700',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: s.labelColor,
  });
  labelDiv.textContent = label;
  btn.appendChild(labelDiv);

  const subDiv = el('div');
  css(subDiv, { fontSize: '10px', letterSpacing: '1px', color: s.subColor, marginTop: '1px' });
  subDiv.textContent = sub;
  btn.appendChild(subDiv);

  // Hover + active
  btn.addEventListener('mouseenter', () => {
    btn.style.background   = s.hoverBg;
    btn.style.borderColor  = s.hoverBorder;
    btn.style.boxShadow    = s.hoverShadow;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background   = s.bg;
    btn.style.borderColor  = s.border;
    btn.style.boxShadow    = '';
  });
  btn.addEventListener('mousedown', () => { btn.style.transform = 'scale(0.98)'; });
  btn.addEventListener('mouseup',   () => { btn.style.transform = ''; });
  btn.addEventListener('click', onClick);

  return btn;
}

// ---------------------------------------------------------------------------
// Top title bar
// ---------------------------------------------------------------------------

function buildTopbar(info: PreBattleInfo): HTMLElement {
  const bar = document.createElement('header');
  css(bar, {
    textAlign: 'center',
    padding: '18px 24px 12px',
    borderBottom: '1px solid var(--pb-border)',
    background: 'rgba(4,8,20,0.70)',
    backdropFilter: 'blur(4px)',
    position: 'relative',
    flexShrink: '0',
  });

  // kicker line
  const kicker = el('div');
  css(kicker, {
    fontSize: '10px',
    letterSpacing: '4px',
    textTransform: 'uppercase',
    color: 'var(--pb-text-dim)',
    marginBottom: '6px',
    fontFamily: 'var(--pb-font-ui)',
  });
  kicker.textContent = 'The Game \u00B7 Starcie'; // "\u00B7 Starcie"
  bar.appendChild(kicker);

  // Main title
  const title = el('div');
  css(title, {
    fontFamily: 'var(--pb-font-main)',
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '8px',
    color: 'var(--pb-gold)',
    textShadow: '0 0 20px rgba(232,216,138,0.50),0 0 40px rgba(232,216,138,0.20)',
  });
  // "UWARUNKOWANIA BITWY"
  title.textContent = 'UWARUNKOWANIA BITWY';
  bar.appendChild(title);

  // Subtitle
  const subtitle = el('div');
  css(subtitle, {
    fontSize: '10px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: 'var(--pb-text-dim)',
    marginTop: '6px',
    fontFamily: 'var(--pb-font-ui)',
  });
  // "Rozstrzygniecie starcia - wybierz tryb walki"
  subtitle.textContent =
    'Rozstrzygni\u0119cie starcia \u2014 wybierz tryb walki';
  bar.appendChild(subtitle);

  // Terrain location line
  const loc = el('div');
  css(loc, {
    fontSize: '11px',
    color: 'var(--pb-gold-dim)',
    marginTop: '4px',
    letterSpacing: '1px',
    fontFamily: 'var(--pb-font-ui)',
  });
  // "\u{1F4CD} Teren: X"
  loc.textContent = '\u{1F4CD} Teren: ' + info.teren;
  bar.appendChild(loc);

  // Gold rule
  const rule = el('div');
  css(rule, {
    height: '1px',
    background: 'linear-gradient(90deg,transparent,var(--pb-gold-dim),transparent)',
    marginTop: '12px',
  });
  bar.appendChild(rule);

  return bar;
}

// ---------------------------------------------------------------------------
// Build the full overlay
// ---------------------------------------------------------------------------

function buildOverlay(info: PreBattleInfo, cb: PreBattleCallbacks): HTMLDivElement {
  ensureStyles();

  const overlay = document.createElement('div');
  css(overlay, {
    position: 'fixed',
    top: '0', right: '0', bottom: '0', left: '0',
    zIndex: '9900',
    background: 'rgba(4,6,15,0.97)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--pb-font-ui)',
    color: 'var(--pb-text)',
    userSelect: 'none',
    animation: 'pb-fadeIn 0.2s ease',
    overflowY: 'auto',
  });

  // Radial background blobs (decorative)
  const bgBlobs = el('div');
  css(bgBlobs, {
    position: 'fixed',
    top: '0', right: '0', bottom: '0', left: '0',
    pointerEvents: 'none',
    zIndex: '0',
    background: [
      'radial-gradient(ellipse 70% 50% at 50% 20%,rgba(20,40,90,0.45) 0%,transparent 70%)',
      'radial-gradient(ellipse 40% 30% at 15% 80%,rgba(74,144,216,0.10) 0%,transparent 60%)',
      'radial-gradient(ellipse 40% 30% at 85% 80%,rgba(200,64,64,0.10) 0%,transparent 60%)',
    ].join(','),
  });
  overlay.appendChild(bgBlobs);

  // Content wrapper (above blobs)
  const inner = el('div');
  css(inner, {
    position: 'relative',
    zIndex: '1',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    minHeight: '100%',
    flex: '1',
  });

  inner.appendChild(buildTopbar(info));

  // Three-column main area
  const mainCols = el('div');
  css(mainCols, {
    display: 'grid',
    gridTemplateColumns: '1fr 260px 1fr',
    alignItems: 'start',
  });
  mainCols.appendChild(buildSidePanel(info.atakujacy, 'atk'));
  mainCols.appendChild(buildCenterPanel(info));
  mainCols.appendChild(buildSidePanel(info.obronca, 'def'));
  inner.appendChild(mainCols);

  inner.appendChild(buildBottomBar(cb, () => hidePreBattle()));

  overlay.appendChild(inner);
  return overlay;
}
