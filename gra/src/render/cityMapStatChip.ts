/**
 * cityMapStatChip.ts — etykieta miasta na mapie świata (MAPA).
 * Always-on MUST: nazwa + populacja + obrona (3 stany) + medalion cywu + glif produkcji (lite).
 * Hover (R-DESIGN-PANEL-MIASTA-Q4=B): drugi wiersz — kategoria produkcji + ostrzeżenie surowców.
 */
import * as THREE from 'three';
import type { ProductionKind } from '../game/production';
import { loadImageInto, prepareSvgForCanvas, svgToDataUri } from './unitOwnerEmblem';

/** 0 = brak tarczy · 1 = palisada (szara) · 2 = mury lub cytadela (złota). */
export type CityMapDefenseTier = 0 | 1 | 2;

/** Rodzaj obwodu obronnego — ten sam union co CityWallKind w cities.ts. */
export type CityMapWallKind = 'none' | 'palisada' | 'stone';

export interface CityMapBadgeInput {
  cityName: string;
  population: number;
  defenseTier: CityMapDefenseTier;
  /** ikonaId cywilizacji (civs.json) — do klucza cache i litery na medalionie. */
  civIconId: string;
  /** Kolor właściciela (hex 0xRRGGBB) — tło medalionu cywu. */
  ownerColor?: number;
  /** Czy w kolejce jest aktywna produkcja (pierwszy element). */
  prodActive?: boolean;
  prodKind?: ProductionKind | null;
  /** id frontu kolejki (budynek.id lub jednostka Jednostka) — ikona kanoniczna z brandAssets. */
  prodId?: string | null;
  /**
   * R-ETYKIETA-MIASTA-WZROST-PROCENT — WZROST% miasta: procent przyrostu ludności NA TURĘ
   * (nie poziom Wyżywienia, nie numer, nie tura do przyrostu). Wartość ma być tą samą liczbą,
   * którą pokazuje wiersz „WZROST%" w panelu TEGO miasta, czyli sumą SZEŚCIU składników
   * (`computeGrowthPercentV85().total`: racje + małe miasto + spichlerz + zdrowie + szczęście
   * + cywilizacja) przeliczoną na żywo — patrz `CityRenderOptions.getCityGrowth`.
   * `null`/brak = segment nie jest rysowany (miasto nie należy do gracza albo brak danych).
   */
  growthPercent?: number | null;
  /**
   * true = miasto nienakarmione (głód) → segment pokazuje „—" zamiast liczby, dokładnie jak
   * wiersz „WZROST%" w panelu miasta (`fed ? `${wzrostProcent}%` : '—'`). Bez tej flagi
   * plakietka obiecywałaby wzrost miastu, które w tej turze traci ludność z głodu.
   */
  growthStarving?: boolean;
  /** Ostrzeżenie surowców (hover: brak w magazynie państwa). */
  resourceWarning?: boolean;
  /** true = rozszerzona pigułka (hover na mapie). */
  hoverExpanded?: boolean;
  /** „Budynek" / „Jednostka" — hover, front kolejki. */
  prodCategoryLabel?: string | null;
  /** Nazwa frontu kolejki (hover). */
  prodItemName?: string | null;
  /** Kolejka wstrzymana (hover). */
  prodPaused?: boolean;
  /** true = miasto-państwo → medalion tylko sygnet kultury (bez portretu władcy). */
  isCityState?: boolean;
  /** Epoka właściciela — portret władcy na medalionie (gracz + major AI). */
  era?: number;
  /**
   * MAP-UX-MARKER-Q1 = C — to miasto jest stolicą swojego państwa.
   * Marker = OBA naraz: grubsza/jaśniejsza złota obwódka pigułki + ikona korony przy nazwie.
   * PARYTET AI: identycznie dla stolicy gracza i każdej stolicy AI.
   */
  isCapital?: boolean;
}

const DEFENSE_COLORS: Record<1 | 2, { fill: string; stroke: string }> = {
  1: { fill: '#9a9aa8', stroke: '#c8c8d4' },
  2: { fill: '#e8d88a', stroke: '#fff4c8' },
};

const CIV_SIGIL_STROKE = '#e8d88a';
const CIV_MEDALLION_R = 16;
const CIV_SLOT_W = 38;
const PROD_SLOT_W = 20;
/**
 * R-ETYKIETA-MIASTA-WZROST-PROCENT — font segmentu WZROST%. Slot NIE ma już stałej szerokości
 * (dawne `GROWTH_SLOT_W = 30` starczało na „W5", ale nie na „−10,5%"): szerokość liczy się
 * z `measureText` dokładnie tym fontem, więc długi zapis nie wchodzi na glif produkcji.
 */
const GROWTH_FONT = '700 13px Arial, Helvetica, sans-serif';
const HOVER_ROW_H = 22;

/**
 * BUG-ETYKIETA-MIASTA-ROZMYTA — gęstość pikseli tekstury pigułki.
 * Cała geometria niżej liczona jest w px CSS; kanwa dostaje `dpr`× tyle pikseli fizycznych,
 * a kontekst jest przeskalowany, więc sprite ma tę samą wielkość w świecie (aspect bez zmian),
 * a tekstura — `dpr`× więcej pikseli, więc nie rozmywa się przy przybliżeniu kamery.
 * Cap 3 chroni przed patologicznymi rozmiarami tekstur na ekranach o bardzo wysokim DPI.
 */
const BADGE_MAX_DPR = 3;

function badgePixelRatio(): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  return Math.min(Math.max(Number.isFinite(dpr) && dpr > 0 ? dpr : 1, 1), BADGE_MAX_DPR);
}

// --- MAP-UX-MARKER-Q1 = C — marker stolicy (obwódka + korona) --------------------
/** Grubość obwódki pigułki ZWYKŁEGO miasta: 2 px na kanwie pigułki. */
const PILL_RING_LINE_W = 2;
/** Grubość obwódki pigułki STOLICY: 3,5 px na kanwie pigułki (1,75× zwykłej). */
const CAPITAL_RING_LINE_W = 3.5;
/** Kolor obwódki pigułki stolicy — jaśniejsze złoto niż tło/medalion (#e8d88a). */
const CAPITAL_RING_COLOR = 'rgba(255, 233, 168, 0.98)';
/** Wewnętrzny pierścień stolicy: odsunięcie 6 px od krawędzi kanwy, grubość 1,2 px. */
const CAPITAL_INNER_RING_INSET = 6;
const CAPITAL_INNER_RING_LINE_W = 1.2;
const CAPITAL_INNER_RING_COLOR = 'rgba(232, 216, 138, 0.42)';
/** Slot korony w układzie pigułki: szerokość 19 px (między medalionem a nazwą). */
const CAPITAL_CROWN_SLOT_W = 19;
/**
 * Rysowana korona: 17 px szerokości × 13 px wysokości na kanwie pigułki.
 * Odniesienie skali: glif produkcji 16 px, tarcza obrony 14×16 px, medalion cywu 32 px średnicy,
 * wysokość pigułki 48 px — korona jest najmniejszym elementem, nie konkuruje z medalionem.
 */
const CAPITAL_CROWN_W = 17;
const CAPITAL_CROWN_H = 13;

let civSigilSvgFn: ((civIconId: string) => string) | null = null;
const civSigilImageById = new Map<string, HTMLImageElement | 'loading'>();
/**
 * BUG-IKONA-KULTURY-PLACEHOLDER — kolejka `onReady` dla sygnetu, który jest właśnie w locie.
 * Bez niej drugi (i każdy kolejny) zamawiający ten sam sygnet gubił callback, a że tekstura
 * plakietki powstaje jednorazowo (`if (!tex)`), zostawał na niej romb-placeholder aż do najazdu
 * kursorem (hover zmienia klucz cache → świeża tekstura trafiała już w gotowy obrazek).
 */
const civSigilPendingById = new Map<string, Array<(img: HTMLImageElement) => void>>();

let leaderPortraitUrlFn: ((civIconId: string, era: number) => string | null) | null = null;
const leaderPortraitImageByKey = new Map<string, HTMLImageElement | 'loading'>();
/**
 * R-PORTRET-PRODIKONA-DROPPED-CALLBACK — kolejka `onReady` dla portretu, który jest w locie.
 * Ten sam mechanizm co `civSigilPendingById`. Bez niej drugi (i każdy kolejny) zamawiający ten
 * sam portret gubił callback: `_syncStatChip` (render/cities.ts) tworzy plakietkę osobno dla
 * KAŻDEGO miasta, więc dwa miasta tej samej cywilizacji i epoki zamawiają ten sam portret w tej
 * samej klatce. Przegrany wyścigu zostawał na fallbacku medalionu (sygnet kultury zamiast
 * portretu władcy) aż do najbliższej zmiany klucza tekstury (hover / populacja / epoka).
 */
const leaderPortraitPendingByKey = new Map<string, Array<(img: HTMLImageElement) => void>>();

let prodIconSvgFn: ((kind: ProductionKind, id: string) => string) | null = null;
const prodIconImageByKey = new Map<string, HTMLImageElement | 'loading'>();
/**
 * R-PORTRET-PRODIKONA-DROPPED-CALLBACK — kolejka `onReady` dla ikony produkcji w locie.
 * Ten sam mechanizm co wyżej: dwa miasta produkujące TO SAMO (np. dwie osady stawiające
 * koszary) zamawiają tę samą ikonę w jednej klatce, a przegrany wyścigu tracił callback
 * i jego pigułka zostawała BEZ glifu produkcji do najbliższej zmiany klucza tekstury.
 */
const prodIconPendingByKey = new Map<string, Array<(img: HTMLImageElement) => void>>();

/**
 * Wstrzykuje SVG sygnetu cywilizacji (main.ts → civIconSvg).
 * render/ nie importuje ui/icons/brandAssets — ten sam wzorzec co unitOwnerEmblem.
 */
export function setCityMapBadgeCivSigil(fn: (civIconId: string) => string): void {
  civSigilSvgFn = fn;
  civSigilImageById.clear();
  // UWAGA: `civSigilPendingById` celowo NIE jest czyszczone. Ta funkcja jest wołana z ciała
  // `wireUnitRendererRingStance()` (main.ts:6217), a ono z 9 miejsc — także przy wypowiedzeniu
  // wojny i zobowiązaniach sojuszniczych. Wyczyszczenie kolejki zgubiłoby callbacki żądań
  // będących akurat w locie i plakietka zostałaby z rombem NA STAŁE — czyli dokładnie ten bug,
  // który kolejka naprawia, tylko wyzwalany zdarzeniem dyplomatycznym.
}

/**
 * Wstrzykuje URL portretu władcy (main.ts → leaderPortraitUrl).
 * Major AI + gracz: medalion pigułki; MP → tylko sygnet kultury (isCityState).
 */
export function setCityMapBadgeLeaderPortrait(
  fn: (civIconId: string, era: number) => string | null,
): void {
  leaderPortraitUrlFn = fn;
  leaderPortraitImageByKey.clear();
  // UWAGA: `leaderPortraitPendingByKey` celowo NIE jest czyszczone — z tego samego powodu co
  // kolejka sygnetu wyżej. Ta funkcja leci z `wireUnitRendererRingStance()` (9 wywołań, m.in.
  // wypowiedzenie wojny), a wyczyszczenie kolejki zgubiłoby callbacki żądań w locie i medalion
  // zostałby bez portretu NA STAŁE.
}

/**
 * Wstrzykuje SVG ikony produkcji (main.ts → buildingIconSvg / unitIconSvg).
 * render/ nie importuje ui/icons/brandAssets — ten sam wzorzec co sygnet cywu.
 */
export function setCityMapBadgeProdIcon(fn: (kind: ProductionKind, id: string) => string): void {
  prodIconSvgFn = fn;
  prodIconImageByKey.clear();
  // UWAGA: `prodIconPendingByKey` celowo NIE jest czyszczone — patrz komentarz przy sygnecie.
}

const CIV_INITIALS: Record<string, string> = {
  grecy: 'G', grecja: 'G', rzym: 'R', rzymianie: 'R', egipt: 'E', egipcjanie: 'E',
  chiny: 'C', chinczycy: 'C', persja: 'P', persowie: 'P', zulusi: 'Z', celtowie: 'K',
  germanie: 'D', hunowie: 'H', japonia: 'J', japonczycy: 'J', inkowie: 'I',
  majowie: 'M', mongolowie: 'O', arabowie: 'A', bizancjum: 'B',
};

/**
 * wallKind z listy zbudowanych budynków — ta sama logika co getWallKind w main.ts.
 */
export function wallKindFromBuilt(
  builtBuildingIds: readonly string[] | null | undefined,
): CityMapWallKind {
  const built = builtBuildingIds ?? [];
  if (built.includes('mury') || built.includes('fort')) return 'stone';
  if (built.includes('palisada')) return 'palisada';
  return 'none';
}

/** Mapowanie wallKind → tier tarczy na pigułce (Q1=A: wyłącznie z wallKind, bez maMur). */
export function defenseTierFromWallKind(kind: CityMapWallKind): CityMapDefenseTier {
  if (kind === 'stone') return 2;
  if (kind === 'palisada') return 1;
  return 0;
}

/**
 * Trzy stany obrony na pigułce.
 * tier 0 = brak tarczy · tier 1 = palisada (szara) · tier 2 = mury lub fort (złota).
 * Q1=A: wyłącznie z wallKind (lista budynków); parametr maMur jest ignorowany.
 */
export function defenseTierFromCity(
  builtBuildingIds: readonly string[] | null | undefined,
  _maMur?: boolean,
): CityMapDefenseTier {
  return defenseTierFromWallKind(wallKindFromBuilt(builtBuildingIds));
}

export function civInitialForIconId(ikonaId: string): string {
  const key = (ikonaId || '').trim().toLowerCase();
  if (!key) return '?';
  if (CIV_INITIALS[key]) return CIV_INITIALS[key]!;
  const letter = key.charAt(0).toUpperCase();
  return /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(letter) ? letter : '?';
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Mała tarcza obrony — lewy segment pigułki (tier 0 = nie wywoływać). */
function drawDefenseShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tier: 1 | 2,
): void {
  const pal = DEFENSE_COLORS[tier];
  const w = 14;
  const h = 16;
  const x = cx - w * 0.5;
  const y = cy - h * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(x + w, y + h * 0.22);
  ctx.lineTo(x + w, y + h * 0.62);
  ctx.quadraticCurveTo(cx, y + h + 2, x, y + h * 0.62);
  ctx.lineTo(x, y + h * 0.22);
  ctx.closePath();
  ctx.fillStyle = pal.fill;
  ctx.fill();
  ctx.strokeStyle = pal.stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (tier === 2) {
    ctx.beginPath();
    ctx.moveTo(cx, y + 3);
    ctx.lineTo(cx, y + h - 4);
    ctx.strokeStyle = 'rgba(42, 34, 8, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/**
 * Korona stolicy — rysowana wprost na kanwie (render/ NIE importuje ui/icons/brandAssets;
 * `import.meta.glob` żyje tylko w Vite, a ten moduł jest bundlowany też esbuildem
 * w harnessach podglądu — patrz nagłówek unitOwnerEmblem.ts).
 * Geometria: 3 szpice + 2 wcięcia nad obręczą; domyślnie 17 px szerokości × 13 px wysokości
 * na kanwie pigułki (CAPITAL_CROWN_W / CAPITAL_CROWN_H).
 */
function drawCapitalCrown(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number = CAPITAL_CROWN_W,
  h: number = CAPITAL_CROWN_H,
): void {
  const x = cx - w * 0.5;
  const y = cy - h * 0.5;
  const bandH = h * 0.26;
  const bandY = y + h - bandH;

  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#fff6d2');
  grad.addColorStop(0.55, '#f2df9a');
  grad.addColorStop(1, '#d8c069');

  // Zęby korony: lewy szpic — wcięcie — środkowy (najwyższy) — wcięcie — prawy szpic.
  // Wcięcia schodzą do 62% wysokości, żeby sylwetka przetrwała pomniejszenie do skali mapy.
  ctx.beginPath();
  ctx.moveTo(x, bandY + 0.5);
  ctx.lineTo(x, y + h * 0.16);
  ctx.lineTo(x + w * 0.26, y + h * 0.62);
  ctx.lineTo(cx, y);
  ctx.lineTo(x + w * 0.74, y + h * 0.62);
  ctx.lineTo(x + w, y + h * 0.16);
  ctx.lineTo(x + w, bandY + 0.5);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Obręcz korony — ta sama bryła koloru, spięta cienką jasną krawędzią.
  roundedRect(ctx, x, bandY, w, bandH, bandH * 0.4);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 244, 200, 0.85)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Klejnoty na szpicach — ciemne kropki, ten sam kontrast co liczba populacji na złotym kole.
  ctx.fillStyle = 'rgba(42, 34, 8, 0.55)';
  for (const [gx, gy] of [
    [x + w * 0.10, y + h * 0.28],
    [cx, y + h * 0.16],
    [x + w * 0.90, y + h * 0.28],
  ] as ReadonlyArray<[number, number]>) {
    ctx.beginPath();
    ctx.arc(gx, gy, 0.95, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCivMedallionDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  ownerColor?: number,
): void {
  const r = CIV_MEDALLION_R;
  const col = ownerColor ?? 0xffd54a;
  const rr = (col >> 16) & 0xff;
  const gg = (col >> 8) & 0xff;
  const bb = col & 0xff;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${Math.round(rr * 0.55)}, ${Math.round(gg * 0.55)}, ${Math.round(bb * 0.55)})`;
  ctx.fill();
  ctx.strokeStyle = '#e8d88a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

interface CivMedallionContent {
  sigilImg?: HTMLImageElement;
  portraitImg?: HTMLImageElement;
  isCityState?: boolean;
}

/** Medalion — major: portret władcy (fallback sygnet); MP: tylko sygnet kultury. */
function drawCivMedallion(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  _civIconId: string,
  ownerColor?: number,
  content?: CivMedallionContent,
): void {
  drawCivMedallionDisc(ctx, cx, cy, ownerColor);
  const r = CIV_MEDALLION_R;
  const usePortrait = !content?.isCityState && content?.portraitImg;
  const img = usePortrait ? content!.portraitImg! : content?.sigilImg;
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.clip();
    if (usePortrait) {
      const side = (r - 1.5) * 2;
      const scale = Math.max(side / img.width, side / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, cx - w / 2, cy - (r - 1.5), w, h);
    } else {
      const side = r * 1.55;
      ctx.drawImage(img, cx - side / 2, cy - side / 2, side, side);
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = CIV_SIGIL_STROKE;
  ctx.font = 'bold 20px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◆', cx, cy + 1);
}

function civSigilCacheKey(civIconId: string): string {
  return (civIconId || '').trim().toLowerCase() || 'unknown';
}

/** Dopisuje callback do kolejki oczekujących na sygnet o danym kluczu (nigdy nie nadpisuje). */
function queueCivSigilCallback(key: string, onReady: (img: HTMLImageElement) => void): void {
  const queue = civSigilPendingById.get(key);
  if (queue) queue.push(onReady);
  else civSigilPendingById.set(key, [onReady]);
}

function requestCivSigilImage(
  civIconId: string,
  onReady: (img: HTMLImageElement) => void,
): void {
  if (!civSigilSvgFn) return;
  const key = civSigilCacheKey(civIconId);
  const cached = civSigilImageById.get(key);
  if (cached instanceof HTMLImageElement) {
    onReady(cached);
    return;
  }
  // BUG-IKONA-KULTURY-PLACEHOLDER: żądanie w locie → dopisz callback do kolejki zamiast go zgubić.
  if (cached === 'loading') {
    queueCivSigilCallback(key, onReady);
    return;
  }
  const raw = civSigilSvgFn(civIconId);
  const svg = prepareSvgForCanvas(raw, CIV_SIGIL_STROKE);
  if (!svg) return;
  civSigilImageById.set(key, 'loading');
  // Dopisanie (nie nadpisanie) jest tu istotne: `setCityMapBadgeCivSigil` czyści
  // `civSigilImageById` przy każdym przewiązaniu, więc znacznik 'loading' może zniknąć,
  // gdy poprzednie ładowanie wciąż trwa. Kolejka przeżywa taki reset i zostaje domknięta
  // przez to ładowanie, które skończy się pierwsze.
  queueCivSigilCallback(key, onReady);
  loadImageInto(svgToDataUri(svg), (img) => {
    civSigilImageById.set(key, img);
    const queue = civSigilPendingById.get(key) ?? [];
    civSigilPendingById.delete(key);
    for (const cb of queue) cb(img);
  });
}

function leaderPortraitCacheKey(civIconId: string, era: number): string {
  const e = Math.max(1, Math.round(era) || 1);
  return `${civSigilCacheKey(civIconId)}:${e}`;
}

/** Dopisuje callback do kolejki oczekujących na portret o danym kluczu (nigdy nie nadpisuje). */
function queueLeaderPortraitCallback(
  key: string,
  onReady: (img: HTMLImageElement) => void,
): void {
  const queue = leaderPortraitPendingByKey.get(key);
  if (queue) queue.push(onReady);
  else leaderPortraitPendingByKey.set(key, [onReady]);
}

function requestLeaderPortraitImage(
  civIconId: string,
  era: number,
  onReady: (img: HTMLImageElement) => void,
): void {
  if (!leaderPortraitUrlFn) return;
  const key = leaderPortraitCacheKey(civIconId, era);
  const cached = leaderPortraitImageByKey.get(key);
  if (cached instanceof HTMLImageElement) {
    onReady(cached);
    return;
  }
  // R-PORTRET-PRODIKONA-DROPPED-CALLBACK: żądanie w locie → dopisz callback do kolejki
  // zamiast go zgubić (wzorzec 1:1 z `requestCivSigilImage`).
  if (cached === 'loading') {
    queueLeaderPortraitCallback(key, onReady);
    return;
  }
  const url = leaderPortraitUrlFn(civIconId, era);
  if (!url) return;
  leaderPortraitImageByKey.set(key, 'loading');
  // Dopisanie (nie nadpisanie) jest tu istotne: `setCityMapBadgeLeaderPortrait` czyści
  // `leaderPortraitImageByKey` przy każdym przewiązaniu, więc znacznik 'loading' może zniknąć,
  // gdy poprzednie ładowanie wciąż trwa. Kolejka przeżywa taki reset i zostaje domknięta
  // przez to ładowanie, które skończy się pierwsze.
  queueLeaderPortraitCallback(key, onReady);
  loadImageInto(url, (img) => {
    leaderPortraitImageByKey.set(key, img);
    const queue = leaderPortraitPendingByKey.get(key) ?? [];
    leaderPortraitPendingByKey.delete(key);
    for (const cb of queue) cb(img);
  });
}

function prodIconCacheKey(kind: ProductionKind, id: string): string {
  return `${kind}:${(id || '').trim()}`;
}

/** Dopisuje callback do kolejki oczekujących na ikonę produkcji (nigdy nie nadpisuje). */
function queueProdIconCallback(key: string, onReady: (img: HTMLImageElement) => void): void {
  const queue = prodIconPendingByKey.get(key);
  if (queue) queue.push(onReady);
  else prodIconPendingByKey.set(key, [onReady]);
}

function requestProdIconImage(
  kind: ProductionKind,
  id: string,
  onReady: (img: HTMLImageElement) => void,
): void {
  if (!prodIconSvgFn) return;
  const key = prodIconCacheKey(kind, id);
  const cached = prodIconImageByKey.get(key);
  if (cached instanceof HTMLImageElement) {
    onReady(cached);
    return;
  }
  // R-PORTRET-PRODIKONA-DROPPED-CALLBACK: żądanie w locie → dopisz callback do kolejki
  // zamiast go zgubić (wzorzec 1:1 z `requestCivSigilImage`).
  if (cached === 'loading') {
    queueProdIconCallback(key, onReady);
    return;
  }
  const raw = prodIconSvgFn(kind, id);
  const svg = prepareSvgForCanvas(raw, '#e8d88a', 1.2);
  if (!svg) return;
  prodIconImageByKey.set(key, 'loading');
  // Dopisanie (nie nadpisanie): `setCityMapBadgeProdIcon` czyści `prodIconImageByKey` przy
  // każdym przewiązaniu, więc znacznik 'loading' może zniknąć w trakcie ładowania.
  queueProdIconCallback(key, onReady);
  loadImageInto(svgToDataUri(svg), (img) => {
    prodIconImageByKey.set(key, img);
    const queue = prodIconPendingByKey.get(key) ?? [];
    prodIconPendingByKey.delete(key);
    for (const cb of queue) cb(img);
  });
}

/** Ikona frontu kolejki (SVG z brandAssets) — bez generycznego trójkąta/prostokąta. */
function drawProdIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  img?: HTMLImageElement,
): void {
  const side = 16;
  if (!img) return;
  ctx.drawImage(img, cx - side * 0.5, cy - side * 0.5, side, side);
}

/** Mała ikona ostrzeżenia (brak surowców). */
function drawResourceWarningIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
): void {
  const r = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#8a4a10';
  ctx.fill();
  ctx.strokeStyle = '#e8a040';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#ffd090';
  ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', cx, cy + 0.5);
}

/** Drugi wiersz pigułki — kategoria produkcji + ostrzeżenie. */
function drawHoverProdRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  input: CityMapBadgeInput,
): void {
  const warnW = input.resourceWarning ? 20 : 0;
  const maxTextW = w - x - warnW - 6;
  const cat = (input.prodCategoryLabel || '').trim();
  const name = (input.prodItemName || '').trim();
  let line = cat && name ? `${cat} · ${name}` : cat || name;
  if (input.prodPaused && line) line += ' · wstrzymana';
  else if (input.prodPaused) line = 'Produkcja wstrzymana';
  if (!line && input.resourceWarning) line = 'Brak surowców w magazynie';

  const font = '600 11px Arial, Helvetica, sans-serif';
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (ctx.measureText(line).width > maxTextW && line.length > 1) {
    let s = line;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxTextW) s = s.slice(0, -1);
    line = s + '…';
  }
  ctx.fillStyle = '#c8b888';
  ctx.fillText(line, x, y);
  if (input.resourceWarning) {
    drawResourceWarningIcon(ctx, x + maxTextW + warnW * 0.5, y);
  }
}

/**
 * R-ETYKIETA-MIASTA-WZROST-PROCENT — tekst segmentu WZROST% na plakietce miasta.
 * Zastąpił skrót „W5" (poziom Wyżywienia), o który prosił właściciel: *„procentowy wzrost,
 * czyli na przykład 5 i pół procent, o ile wyrośnie populacja, a nie W5"*.
 *
 * Reguły zapisu (wybór domyślny — do potwierdzenia przez właściciela):
 * - **część ułamkowa tylko gdy istnieje**: `5` → `5%`, `5,5` → `5,5%` (nie `5,0%`), bo obie
 *   formy padły w jego zdaniu („5 i pół procent albo 5 procent”);
 * - **przecinek**, nie kropka — zapis polski, ta sama konwencja co `formatWyzwienieLabel`;
 * - **1 miejsce po przecinku** (wartość zaokrąglana) — suma sześciu składników ma krok 0,5,
 *   więc jedno miejsce wystarcza i nie gubi nic z liczby pokazywanej w panelu;
 * - **wzrost zerowy → `0%`** (nie puste, nie `—`) — miasto stoi w miejscu, to informacja;
 * - **wzrost ujemny → znak minus U+2212** (`−2,1%`), a nie ukryte zero: przy Wyżywieniu
 *   poniżej 1,5 miasto realnie się kurczy i gracz ma to widzieć;
 * - **głód (miasto nienakarmione) → `—`**, dokładnie ten sam symbol co wiersz „WZROST%”
 *   w panelu miasta (`fed ? `${wzrostProcent}%` : '—'`). Bez tego mapa obiecywałaby wzrost
 *   miastu, które w tej turze traci ludność.
 *
 * `−0` nie powstaje: wartości z przedziału (−0,05; 0) zaokrąglają się do `-0`, a warunek
 * `rounded < 0` jest dla `-0` fałszywy, więc wychodzi `0%`.
 */
export function formatCityGrowthPercentLabel(pct: number, starving = false): string {
  if (starving) return '—';
  const rounded = Math.round((Number.isFinite(pct) ? pct : 0) * 10) / 10;
  const abs = Math.abs(rounded);
  const digits = Number.isInteger(abs) ? String(abs) : abs.toFixed(1).replace('.', ',');
  return `${rounded < 0 ? '−' : ''}${digits}%`;
}

/** Kompaktowa etykieta WZROST% (procent przyrostu ludności / turę) — tylko miasta gracza. */
function drawGrowthLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  label: string,
): void {
  ctx.font = GROWTH_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d4c48a';
  ctx.fillText(label, x, cy);
}

function truncateName(
  ctx: CanvasRenderingContext2D,
  name: string,
  maxW: number,
  font: string,
): string {
  ctx.font = font;
  if (ctx.measureText(name).width <= maxW) return name;
  let s = name;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) {
    s = s.slice(0, -1);
  }
  return s + '…';
}

/** Rysuje pigułkę na istniejącej kanwie (async sygnet/portret — ta sama kanwa + needsUpdate). */
function paintCityMapBadgeOntoCanvas(
  canvas: HTMLCanvasElement,
  input: CityMapBadgeInput,
  medallion?: CivMedallionContent,
  prodIconImg?: HTMLImageElement,
): void {
  const pop = Math.max(1, Math.floor(input.population) || 1);
  const name = (input.cityName || 'Miasto').trim().toUpperCase();
  const popStr = String(pop);

  const padX = 10;
  const padY = 8;
  const circleD = 30;
  const gap = 8;
  const hasDefense = input.defenseTier !== 0;
  const defenseW = hasDefense ? 22 : 0;
  const civW = CIV_SLOT_W;
  const prodW = input.prodActive ? PROD_SLOT_W : 0;
  const isCapital = input.isCapital === true;
  const crownW = isCapital ? CAPITAL_CROWN_SLOT_W : 0;
  const nameFont = '700 22px Georgia, "Times New Roman", serif';
  const popFont = '700 16px Arial, Helvetica, sans-serif';

  const measure = document.createElement('canvas').getContext('2d')!;
  // R-ETYKIETA-MIASTA-WZROST-PROCENT: slot WZROST% mierzony, nie stały — „−10,5%" jest
  // ~1,5× szersze od dawnego „W5" i przy stałej szerokości wchodziłoby na glif produkcji.
  const growthLabel = input.growthPercent != null
    ? formatCityGrowthPercentLabel(input.growthPercent, input.growthStarving === true)
    : null;
  let growthW = 0;
  if (growthLabel !== null) {
    measure.font = GROWTH_FONT;
    growthW = Math.ceil(measure.measureText(growthLabel).width);
  }
  measure.font = nameFont;
  let displayName = name;
  // Budżet nazwy: 200 px kanwy minus sloty glifu produkcji / WZROST% / korony stolicy.
  const maxNameW = 200 - prodW - growthW - crownW;
  if (measure.measureText(name).width > maxNameW) {
    displayName = truncateName(measure, name, maxNameW, nameFont);
  }
  const nameW = measure.measureText(displayName).width;

  const leftIconsW = (hasDefense ? defenseW + gap : 0) + civW + gap
    + (crownW ? crownW + gap : 0);
  const midExtraW = (growthW ? gap + growthW : 0) + (prodW ? gap + prodW : 0);
  const W = Math.ceil(padX + leftIconsW + nameW + midExtraW + gap + circleD + padX);
  const baseH = Math.max(48, circleD + padY * 2);
  const hasHoverDetail = input.hoverExpanded && (
    input.prodCategoryLabel || input.prodItemName || input.prodPaused || input.resourceWarning
  );
  const H = baseH + (hasHoverDetail ? HOVER_ROW_H : 0);

  // BUG-ETYKIETA-MIASTA-ROZMYTA: kanwa w pikselach fizycznych (W×dpr, H×dpr), rysowanie
  // dalej w px CSS dzięki przeskalowaniu kontekstu. Sprite liczy aspect z img.width/img.height,
  // a oba wymiary rosną tym samym mnożnikiem → wielkość plakietki w świecie bez zmian.
  const dpr = badgePixelRatio();
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, W, H);
  const pillR = Math.min(H * 0.45, baseH * 0.45);
  roundedRect(ctx, 2, 2, W - 4, H - 4, pillR);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(16, 22, 34, 0.96)');
  grad.addColorStop(1, 'rgba(8, 10, 16, 0.94)');
  ctx.fillStyle = grad;
  ctx.fill();
  // MAP-UX-MARKER-Q1 = C: stolica → obwódka 3,5 px w jaśniejszym złocie (zwykłe miasto 2 px)
  // + wewnętrzny cienki pierścień 1,2 px, żeby ramka czytała się jako „bogatsza”, a nie tylko grubsza.
  ctx.strokeStyle = isCapital ? CAPITAL_RING_COLOR : 'rgba(232, 216, 138, 0.72)';
  ctx.lineWidth = isCapital ? CAPITAL_RING_LINE_W : PILL_RING_LINE_W;
  ctx.stroke();
  if (isCapital) {
    const innerR = Math.max(2, pillR - CAPITAL_INNER_RING_INSET + 2);
    roundedRect(
      ctx,
      CAPITAL_INNER_RING_INSET,
      CAPITAL_INNER_RING_INSET,
      W - CAPITAL_INNER_RING_INSET * 2,
      H - CAPITAL_INNER_RING_INSET * 2,
      innerR,
    );
    ctx.strokeStyle = CAPITAL_INNER_RING_COLOR;
    ctx.lineWidth = CAPITAL_INNER_RING_LINE_W;
    ctx.stroke();
  }

  const cy = baseH * 0.5;
  const civCx = padX + (hasDefense ? defenseW + gap : 0) + civW * 0.5;
  if (hasDefense) {
    const shieldCx = padX + defenseW * 0.5;
    drawDefenseShield(ctx, shieldCx, cy, input.defenseTier as 1 | 2);
  }
  drawCivMedallion(ctx, civCx, cy, input.civIconId, input.ownerColor, {
  sigilImg: medallion?.sigilImg,
  portraitImg: medallion?.portraitImg,
  isCityState: input.isCityState,
});
  if (crownW) {
    const crownCx = padX + (hasDefense ? defenseW + gap : 0) + civW + gap + crownW * 0.5;
    drawCapitalCrown(ctx, crownCx, cy);
  }

  const nameX = padX + leftIconsW;
  ctx.font = nameFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4f0e8';
  ctx.fillText(displayName, nameX, cy);

  let afterNameX = nameX + nameW;
  if (growthLabel !== null) {
    drawGrowthLabel(ctx, afterNameX + gap, cy, growthLabel);
    afterNameX += gap + growthW;
  }
  if (input.prodActive) {
    const prodCx = afterNameX + gap + prodW * 0.5;
    drawProdIcon(ctx, prodCx, cy, prodIconImg);
    afterNameX += gap + prodW;
  }

  const cx = W - padX - circleD * 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, circleD * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e8d88a';
  ctx.fill();

  ctx.font = popFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a2208';
  ctx.fillText(popStr, cx, cy + 1);

  if (hasHoverDetail) {
    const sepY = baseH - 1;
    ctx.beginPath();
    ctx.moveTo(padX, sepY);
    ctx.lineTo(W - padX, sepY);
    ctx.strokeStyle = 'rgba(232, 216, 138, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
    drawHoverProdRow(ctx, padX, baseH + HOVER_ROW_H * 0.5, W - padX * 2, input);
  }
}

/** Canvas: [tarcza?][cyw] NAZWA [prod?] + (pop). */
export function drawCityMapBadgeCanvas(
  input: CityMapBadgeInput,
  medallion?: CivMedallionContent,
  prodIconImg?: HTMLImageElement,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  paintCityMapBadgeOntoCanvas(canvas, input, medallion, prodIconImg);
  return canvas;
}

/** @deprecated — użyj drawCityMapBadgeCanvas(CityMapBadgeInput) */
export function drawCityMapBadgeCanvasLegacy(cityName: string, population: number): HTMLCanvasElement {
  return drawCityMapBadgeCanvas({
    cityName,
    population,
    defenseTier: 0,
    civIconId: 'grecy',
  });
}

export function cityMapBadgeKey(input: CityMapBadgeInput): string;
export function cityMapBadgeKey(cityName: string, population: number): string;
export function cityMapBadgeKey(
  a: CityMapBadgeInput | string,
  population?: number,
): string {
  if (typeof a === 'string') {
    const pop = Math.max(1, Math.floor(population ?? 1) || 1);
    return `${(a || '').trim()}|${pop}`;
  }
  const pop = Math.max(1, Math.floor(a.population) || 1);
  const prod = a.prodActive
    ? `${a.prodKind ?? 'b'}:${(a.prodId || '').trim()}`
    : '-';
  // R-ETYKIETA-MIASTA-WZROST-PROCENT: do klucza idzie GOTOWA etykieta (a nie surowa liczba),
  // więc klucz zmienia się dokładnie wtedy, gdy zmienia się narysowany tekst — i tylko wtedy.
  // Bez tego segmentu zmiana WZROST% (suwak Wyżywienia, przydział robotników, koniec tury)
  // trafiałaby w starą teksturę z cache i plakietka pokazywałaby liczbę sprzed zmiany.
  const growth = a.growthPercent != null
    ? `g${formatCityGrowthPercentLabel(a.growthPercent, a.growthStarving === true)}`
    : 'g-';
  const cs = a.isCityState ? 'cs1' : 'cs0';
  // MAP-UX-MARKER-Q1 = C — bez tego segmentu przejście stolica↔nie-stolica (przeniesienie
  // stolicy, zdobycie miasta) trafiłoby w starą teksturę z cache i marker by się nie przerysował.
  // Segment dopisany na KOŃCU klucza, żeby nie rozerwać istniejących par (…|cs0|e2|…).
  const cap = a.isCapital ? 'k1' : 'k0';
  const era = a.era != null
    ? `e${Math.max(1, Math.round(a.era) || 1)}`
    : 'e-';
  return [
    (a.cityName || '').trim(),
    pop,
    `d${a.defenseTier}`,
    `c${(a.civIconId || '').trim().toLowerCase()}`,
    `p${prod}`,
    growth,
    `w${a.resourceWarning ? 1 : 0}`,
    `h${a.hoverExpanded ? 1 : 0}`,
    cs,
    era,
    cap,
  ].join('|');
}

/** @deprecated alias — używaj cityMapBadgeKey */
export const cityStatChipKey = cityMapBadgeKey;

export function makeCityMapBadgeSprite(
  input: CityMapBadgeInput,
  texCache: Map<string, THREE.CanvasTexture>,
): THREE.Sprite;
export function makeCityMapBadgeSprite(
  cityName: string,
  population: number,
  texCache: Map<string, THREE.CanvasTexture>,
): THREE.Sprite;
export function makeCityMapBadgeSprite(
  a: CityMapBadgeInput | string,
  b: Map<string, THREE.CanvasTexture> | number,
  c?: Map<string, THREE.CanvasTexture>,
): THREE.Sprite {
  const input: CityMapBadgeInput = typeof a === 'string'
    ? { cityName: a, population: b as number, defenseTier: 0, civIconId: 'grecy' }
    : a;
  const texCache = (typeof a === 'string' ? c : b) as Map<string, THREE.CanvasTexture>;

  const key = cityMapBadgeKey(input);
  let tex = texCache.get(key);
  if (!tex) {
    const canvas = document.createElement('canvas');
    paintCityMapBadgeOntoCanvas(canvas, input);
    tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, tex);
    const repaint = (medallion?: CivMedallionContent, prodImg?: HTMLImageElement) => {
      paintCityMapBadgeOntoCanvas(tex!.image as HTMLCanvasElement, input, medallion, prodImg);
      tex!.needsUpdate = true;
    };
    let civImg: HTMLImageElement | undefined;
    let portraitImg: HTMLImageElement | undefined;
    let prodImg: HTMLImageElement | undefined;
    const medallionContent = (): CivMedallionContent => ({
      sigilImg: civImg,
      portraitImg,
      isCityState: input.isCityState,
    });
    const refreshMedallion = () => repaint(medallionContent(), prodImg);
    requestCivSigilImage(input.civIconId, (img) => {
      civImg = img;
      refreshMedallion();
    });
    if (!input.isCityState) {
      const era = input.era ?? 1;
      requestLeaderPortraitImage(input.civIconId, era, (img) => {
        portraitImg = img;
        refreshMedallion();
      });
    }
    if (input.prodActive && input.prodKind && input.prodId) {
      requestProdIconImage(input.prodKind, input.prodId, (img) => {
        prodImg = img;
        refreshMedallion();
      });
    }
  }
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(mat);
  const img = tex.image as HTMLCanvasElement;
  const aspect = img.width / img.height;
  const worldH = 0.52;
  sprite.scale.set(worldH * aspect, worldH, 1);
  sprite.position.set(0, 0.92, 0);
  sprite.renderOrder = 12;
  return sprite;
}

/** @deprecated alias — używaj makeCityMapBadgeSprite */
export const makeCityStatChipSprite = makeCityMapBadgeSprite;

export function disposeCityStatChipTextures(cache: Map<string, THREE.CanvasTexture>): void {
  for (const tex of cache.values()) tex.dispose();
  cache.clear();
}
