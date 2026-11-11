/**
 * administratorIcon.ts — R-WEB-CITY-ADMINISTRATOR-Q1: wspólny komponent ikony ADMINISTRATORA.
 *
 * Okrągła pieczęć z laurem i literą „A" (plik `brand/chip-administrator.svg`, istniejący mechanizm
 * `brandIconSvg`, kolor akcentowy jak pastylka „Ustaw jako stolicę"), czytelna w 16–24 px.
 * Kolor pochodzi z CSS (`currentColor` -> `--civ-adm-ic`), więc wersja jasna/ciemna idzie za motywem panelu.
 *
 * Stany:
 *   - 'ok'   — pracuje (pełny kolor),
 *   - 'idle' — nie pracuje (brak środków): ikona wyszarzona + czerwony wykrzyknik,
 *   - 'off'  — brak administratora (przyciemniona).
 * Wariant 'improvements' (R-WEB-IMPROVEMENT-ADMINISTRATOR-Q1) — ta sama pieczęć „A" z małym kilofem.
 */

import { brandIconSvg } from './brandAssets';

export type AdministratorIconState = 'ok' | 'idle' | 'off';
export type AdministratorIconVariant = 'city' | 'improvements';

export interface AdministratorIconOptions {
  size?: number;
  state?: AdministratorIconState;
  variant?: AdministratorIconVariant;
}

/** Mały kilof (symbol ulepszeń) — rysowany w prawym dolnym rogu pieczęci. */
const IMPROVEMENT_PICK =
  '<g class="civ-adm-ic-pick" stroke-width="1.6"><path d="M14.5 19.5 20 14"></path><path d="M16.5 13.2c1.6-.4 3.2.2 4.3 1.4"></path></g>';

/** CSS ikony (doklejany do arkusza panelu miasta). */
export const ADMINISTRATOR_ICON_CSS =
  '.civ-adm-ic{display:inline-flex;position:relative;vertical-align:middle;color:var(--civ-adm-ic,#e8d88a);flex-shrink:0;line-height:0;}' +
  '.civ-adm-ic svg{display:block;}' +
  '.civ-adm-ic.is-idle svg{filter:grayscale(1);opacity:0.55;}' +
  '.civ-adm-ic.is-off svg{opacity:0.45;}' +
  '.civ-adm-ic-warn{position:absolute;right:-0.28em;top:-0.28em;width:1.05em;height:1.05em;border-radius:50%;' +
  'background:#c0392b;color:#fff;font:800 0.7em/1.45em system-ui,sans-serif;text-align:center;}' +
  '[data-theme="light"] .civ-adm-ic,.civ-light .civ-adm-ic{--civ-adm-ic:#7a5c10;}';

/** HTML ikony administratora (inline SVG w pieczęci). */
export function administratorIconHtml(opts: AdministratorIconOptions = {}): string {
  const size = opts.size ?? 18;
  const state = opts.state ?? 'ok';
  let svg = brandIconSvg('chip-administrator', size);
  if (!svg) return '';
  if (opts.variant === 'improvements') svg = svg.replace('</svg>', IMPROVEMENT_PICK + '</svg>');
  const warn = state === 'idle' ? '<span class="civ-adm-ic-warn" aria-hidden="true">!</span>' : '';
  return `<span class="civ-adm-ic is-${state}" data-adm-icon="${opts.variant ?? 'city'}">${svg}${warn}</span>`;
}
