/**
 * unitOwnerEmblem.ts
 *
 * ZNAK WŁAŚCICIELA przy LEWEJ KRAWĘDZI żetonu jednostki na mapie 3D
 * (decyzja właściciela Maciej, C-OBCE-JEDN-Q2, 2026-07-29 — układ „Total War”).
 *
 * Medalion mówi jednym spojrzeniem, CZYJA jest ta jednostka, w trzech wariantach:
 *
 *   1. PEŁNA CYWILIZACJA (gracz oraz główne AI) → PORTRET WŁADCY (miniatura
 *      zdjęciowa z ui/leaderPortraits.ts, dobierana po civId + epoce).
 *   2. MIASTO-PAŃSTWO                            → SYGNET KULTURY, czyli ikona
 *      cywilizacji (ui/icons/brandAssets.ts::civIconSvg) — NIGDY portret, bo
 *      portret sugerowałby, że to główne państwo tej kultury.
 *   3. BARBARZYŃCY                               → SYGNET BARBARZYŃCÓW (czaszka,
 *      brandIconSvg('chip-death')) — ani portretu, ani ikony kultury.
 *
 * UWAGA: te trzy funkcje NIE są tu importowane — wstrzykuje je main.ts przez
 * `setUnitOwnerEmblemAssets()`. Powód (build, nie estetyka) opisany niżej przy
 * interfejsie UnitOwnerEmblemAssets.
 *
 * ── TA SAMA LOGIKA CO PANEL BITWY (wymóg twardy) ──────────────────────────
 * Kolejność rozstrzygania jest DOKŁADNIE taka jak w ui/preBattle.ts::commanderHtml:
 * najpierw `isBarbarian`, POTEM `isCityState`, dopiero na końcu portret; przy
 * braku portretu (nieznany civId lub brak pliku) spadamy na ikonę cywilizacji,
 * a gdy i tej nie ma — na neutralną tarczę rysowaną tu lokalnie.
 * Barbarzyńcy są sprawdzani PRZED miastem-państwem, bo w silniku ich `civId`
 * bywa fallbackiem 'grecy' (nie mają wpisu w aiOwnerCivMap) — gdyby kolejność
 * była odwrotna, żeton barbarzyńcy dostałby grecki sygnet, dokładnie ten sam
 * błąd, który naprawiał TEMAT 11 w panelu bitwy. Żeton na mapie i panel bitwy
 * MUSZĄ pokazywać ten sam znak dla tego samego właściciela.
 *
 * ── PARYTET AI ────────────────────────────────────────────────────────────
 * Żadna funkcja tego modułu nie pyta „czy to gracz”. Wroga jednostka pokazuje
 * swój portret dokładnie tak samo jak własna — zero ukrywania.
 *
 * ── BRAK DOSTĘPU DO STANU GRY ─────────────────────────────────────────────
 * Moduł nie importuje niczego ze stanu gry. Kontekst właściciela
 * (UnitOwnerEmblemContext) wstrzykuje UnitRenderer przez
 * `setOwnerEmblemResolver()`, a rezolwer buduje main.ts z istniejących już
 * funkcji (civTypeForOwner / empireEpochForOwner / isOwnerClusterCityState /
 * isBarbarian) — żadnego drugiego mapowania ownerId → cywilizacja.
 *
 * ── TECHNIKA: CanvasTexture + THREE.Sprite ────────────────────────────────
 * Konwencja jak w render/workerFieldOverlay.ts: rysunek 2D na <canvas>, z niego
 * THREE.CanvasTexture, na niej THREE.SpriteMaterial. Sprite zawsze zwrócony
 * przodem do kamery, więc medalion jest czytelny przy kącie gry 52° bez
 * jakiegokolwiek obracania płytki.
 *
 * ŁADOWANIE ASYNCHRONICZNE: portret to <img> (data-URI JPG), sygnety to SVG
 * rasteryzowane przez <img>. Obrazek nie jest gotowy w chwili tworzenia żetonu,
 * więc kanwa jest rysowana DWUFAZOWO — najpierw natychmiast tarcza medalionu
 * (tło + pierścień + zastępczy glif), a gdy obrazek się wczyta, ta sama kanwa
 * jest przerysowywana i tekstura dostaje `needsUpdate = true`. Ponieważ tekstura
 * jest współdzielona przez wszystkie żetony tego samego właściciela, jedno
 * przerysowanie aktualizuje je wszystkie naraz.
 *
 * ── ZASOBY: CO JEST SINGLETONEM, A CO PER ŻETON ───────────────────────────
 * Tekstura portretu NIE jest per żeton, tylko PER WARIANT ZNAKU (klucz =
 * `civ:<civId>:<era>` / `cs:<civId>` / `barb`). Dziesięć rzymskich legionistów
 * na mapie współdzieli JEDNĄ teksturę i JEDEN materiał — inaczej każdy żeton
 * trzymałby własną kopię 128×128 px.
 * Konsekwencja dla units.ts: per żeton powstaje WYŁĄCZNIE obiekt THREE.Sprite,
 * który nie posiada ani geometrii, ani materiału na własność. Dlatego — tak jak
 * w unitUpgradeBadges.ts / unitVeteranBadges.ts — NIC nie trafia do
 * group.userData['mats'] ani ['perTokenGeos']; te dwie tablice niszczy
 * UnitRenderer._disposeToken przy usuwaniu POJEDYNCZEGO żetonu, a wpisanie tam
 * współdzielonej tekstury skasowałoby emblematy wszystkich pozostałych
 * jednostek tej cywilizacji. Usunięcie żetonu zabiera sprite razem z żetonem
 * (zwykłe dziecko Object3D) i nie zostawia nic do zwolnienia.
 *
 * ── PROPORCJE (kamera 52°, HEX_R z render/hexutil.ts) ─────────────────────
 * Medalion: bok EMBLEM_SPRITE_SIZE = 0,36·HEX_R (połowa = 0,18), środek na
 * x = −0,50·HEX_R. Skrajny punkt: 0,50 + 0,18 = 0,68·HEX_R — pod limitem
 * roboczym 0,70·HEX_R i daleko od twardego limitu 0,866·HEX_R (= cos30°).
 * Figurka jednostki ma ~0,75·HEX_R wysokości i mieści się w |x| ≲ 0,20·HEX_R,
 * więc medalion (od −0,68 do −0,32) NIE zasłania modelu.
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';

// ---------------------------------------------------------------------------
// Kontrakt kontekstu właściciela (wstrzykiwany przez UnitRenderer)
// ---------------------------------------------------------------------------

/**
 * Wszystko, czego emblemat potrzebuje o właścicielu żetonu — i nic ponadto.
 * Pola odpowiadają 1:1 polom PreBattleSide używanym przez ui/preBattle.ts,
 * żeby oba miejsca rozstrzygały wariant znaku na tych samych danych.
 */
export interface UnitOwnerEmblemContext {
  /** ikonaId cywilizacji (civs.json) albo null, gdy nieznana / nie dotyczy. */
  civId: string | null;
  /** Epoka właściciela: 1 = kamień, 2 = brąz, 3 = żelazo (portret ma fallback wstecz). */
  era: number;
  /** Właściciel to miasto-państwo klastra (isOwnerClusterCityState). */
  isCityState: boolean;
  /** Właściciel to barbarzyńcy (BARBARIAN_OWNER_ID). Sprawdzane PRZED isCityState. */
  isBarbarian: boolean;
}

/** Rezolwer wstrzykiwany do UnitRenderer: ownerId → kontekst znaku (null = brak emblematu). */
export type UnitOwnerEmblemResolver = (ownerId: number) => UnitOwnerEmblemContext | null;

// ---------------------------------------------------------------------------
// Źródło assetów — WSTRZYKIWANE, nie importowane
//
// Portrety (ui/leaderPortraits.ts) i ikony brand-booka (ui/icons/brandAssets.ts)
// wciągają assety przez `import.meta.glob` i `?raw`, czyli mechanizmy DOSTĘPNE
// TYLKO w buildzie Vite. Katalog render/ jest bundlowany także esbuildem
// (samodzielne podglądy modeli w tools/build-*-preview.cjs), a esbuild na
// `import.meta.glob` wysypuje moduł już przy jego ewaluacji. Dlatego ten moduł
// NIE importuje ui/ bezpośrednio — dostaje trzy funkcje od kompozytora
// aplikacji (main.ts). Efekt uboczny jest pożądany: warstwa render/ nadal nie
// zależy od warstwy ui/, tak jak w całej reszcie repozytorium.
//
// Bez wstrzykniętego źródła medalion nadal działa — pokazuje samą tarczę
// z pierścieniem wariantu i neutralnym glifem (podglądy, galeria, testy).
// ---------------------------------------------------------------------------

export interface UnitOwnerEmblemAssets {
  /** ui/leaderPortraits.ts::leaderPortraitUrl — data-URI portretu albo null. */
  leaderPortraitUrl(civId: string, era: number): string | null;
  /** ui/icons/brandAssets.ts::civIconSvg — SVG sygnetu kultury (może być ''). */
  civSigilSvg(civId: string): string;
  /** ui/icons/brandAssets.ts::brandIconSvg('chip-death') — SVG czaszki barbarzyńców. */
  barbarianSigilSvg(): string;
}

let assets: UnitOwnerEmblemAssets | null = null;

/**
 * Podpina źródło assetów (main.ts woła to RAZ, przy starcie, zanim powstanie
 * pierwszy żeton). Cache jest przy tej okazji czyszczony, ale BEZ `dispose()` —
 * gdyby ktoś zawołał to później, sprite'y już stojące na mapie nadal trzymają
 * stare tekstury i muszą pozostać żywe; nowe medaliony powstaną z nowego źródła.
 */
export function setUnitOwnerEmblemAssets(src: UnitOwnerEmblemAssets | null): void {
  if (assets === src) return;
  assets = src;
  assetByKey.clear();
}

// ---------------------------------------------------------------------------
// Wymiary i paleta medalionu
// ---------------------------------------------------------------------------

/**
 * ⚠ AKTUALIZACJA R-ZETON-PASKI (Maciej, 2026-07-29, decyzja C-ZETON-PASKI-Q1 = A):
 * MEDALION NIE JEST JUŻ SAMODZIELNYM ELEMENTEM ŻETONU. Wszedł DO TABLICZKI
 * jednostki jako mała ikona przy jej lewej krawędzi — geometrię (rozmiar,
 * pozycję) ustawia teraz render/unitStatPlate.ts, a ten moduł odpowiada
 * wyłącznie za RYSUNEK i CACHE tekstury wariantu (portret / sygnet / czaszka).
 * `applyUnitOwnerEmblem()` niżej jest ZACHOWANY dla podglądów sprzed tej zmiany
 * (tools/.zeton-max) — GRA GO NIE WOŁA. Nowe wejście to `ownerEmblemMaterial()`.
 *
 * Bok samodzielnego (starego) sprite'a medalionu w jednostkach świata (HEX_R = 1.0).
 */
const EMBLEM_SPRITE_SIZE = 0.36 * HEX_R;
/** Środek medalionu — LEWA KRAWĘDŹ żetonu (−X). */
const EMBLEM_X = -0.50 * HEX_R;
/** Wysokość środka medalionu — na wysokości tułowia figurki, poniżej rządka odznak (0,92·HEX_R). */
const EMBLEM_Y = 0.42 * HEX_R;
/** Wysunięcie w stronę kamery (+Z przy pointy-top hex), żeby nie ginął w geometrii modelu. */
const EMBLEM_Z = 0.20 * HEX_R;
/**
 * Kolejność rysowania: WYŻEJ niż badge stosu (10), NIŻEJ niż czaszka głodu (15),
 * która musi zostać najbardziej krzyczącym elementem żetonu.
 */
const EMBLEM_RENDER_ORDER = 14;

/** Bok kanwy medalionu w pikselach (potęga dwójki — czysty mipmapping). */
const CANVAS_PX = 128;

/** Kolory pierścienia medalionu — trzeci sygnał wariantu, obok samej treści. */
const RING_COLOR = {
  /** Pełna cywilizacja — mosiądz brand-booka (ten sam co obwódki UI). */
  civ: '#e8d88a',
  /** Miasto-państwo — chłodne srebro: mniejszy „gracz”, inna ranga. */
  cityState: '#b9c8d8',
  /** Barbarzyńcy — krwista czerwień (ta sama rodzina co chip-death). */
  barbarian: '#c84040',
} as const;

/** Tło tarczy medalionu — ciemne, żeby jasne kreski sygnetu miały kontrast na każdym terenie. */
const DISC_FILL = 'rgba(12,17,26,0.92)';

/** Promień tarczy na kanwie 128 px. */
const DISC_R = 54;
/**
 * Grubość pierścienia wariantu na kanwie 128 px.
 *
 * ⚠ PODNIESIONA Z 7 NA 14 px przy R-ZETON-PASKI (2026-07-29). Powód wprost
 * z decyzji C-ZETON-PASKI-Q1 = A: medalion zjechał z boku heksu (bok
 * 0,36·HEX_R) do tabliczki (bok 0,19·HEX_R), czyli do ok. 13 px na ekranie
 * przy kamerze rozgrywki. Przy tym rozmiarze TWARZ WŁADCY PRZESTAJE BYĆ
 * ROZPOZNAWALNA i jedynym pewnym nośnikiem wariantu (państwo / miasto-państwo /
 * barbarzyńcy) zostaje KOLOR OBWÓDKI — mosiądz / srebro / czerwień. Pierścień
 * 7 px schodził wtedy poniżej jednego piksela ekranu i kolor ginął.
 */
const DISC_RING_W = 14;
/** Promień koła przycinającego portret (pod pierścieniem). */
const DISC_PORTRAIT_R = 48;
/** Bok rysunku sygnetu (SVG) wpisanego w tarczę. */
const DISC_SIGIL_SIDE = 76;

// ---------------------------------------------------------------------------
// Rasteryzacja SVG → <img>
// ---------------------------------------------------------------------------

/**
 * brandAssets.ts::normalizeSvg podmienia `stroke="#e8d88a"` na `currentColor`,
 * co w dokumencie SVG ładowanym jako <img> nie ma od czego dziedziczyć i
 * rozwiązuje się do CZERNI — na ciemnej tarczy medalionu sygnet byłby wtedy
 * niewidoczny. Podmieniamy więc na jawny kolor podany przez wołającego.
 * Dodatkowo POGRUBIAMY kreskę: ikony brand-booka są rysowane pod 24 px w UI,
 * a na żetonie schodzą do kilkunastu–czterdziestu pikseli pod kątem 52° —
 * oryginalna kreska (stroke-width 1,5) rozmyłaby się w plamę.
 *
 * Funkcja jest EKSPORTOWANA, bo używa jej także render/unitUpgradeBadges.ts
 * (ikony Koszar i Kuźni z brand-booka) — jeden wzór podmiany zamiast dwóch,
 * które mogłyby się rozjechać.
 */
export function prepareSvgForCanvas(svg: string, strokeColor: string, strokeBoost = 1.6): string {
  if (!svg) return '';
  return svg
    .replace(/currentColor/g, strokeColor)
    .replace(/stroke-width="([\d.]+)"/g, (_m, w: string) => `stroke-width="${(parseFloat(w) * strokeBoost).toFixed(2)}"`);
}

export function svgToDataUri(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// ---------------------------------------------------------------------------
// Rysowanie kanwy medalionu
// ---------------------------------------------------------------------------

type EmblemVariant = 'civ' | 'cityState' | 'barbarian';

/** Tarcza: ciemne koło + pierścień wariantu. Rysowana ZAWSZE, także przed wczytaniem obrazka. */
function drawDisc(ctx: CanvasRenderingContext2D, variant: EmblemVariant): void {
  const c = CANVAS_PX / 2;
  ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
  ctx.fillStyle = DISC_FILL;
  ctx.beginPath();
  ctx.arc(c, c, DISC_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = RING_COLOR[variant];
  ctx.lineWidth = DISC_RING_W;
  ctx.beginPath();
  ctx.arc(c, c, DISC_R, 0, Math.PI * 2);
  ctx.stroke();
}

/** Zastępczy glif na czas ładowania obrazka (i trwały fallback, gdy obrazka nie ma). */
function drawFallbackGlyph(ctx: CanvasRenderingContext2D, variant: EmblemVariant): void {
  const c = CANVAS_PX / 2;
  ctx.fillStyle = RING_COLOR[variant];
  ctx.font = 'bold 58px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(variant === 'barbarian' ? '☠' : '◆', c, c + 3);
}

/** Portret: obraz przycięty do koła (cover-fit), z lekkim przyciemnieniem krawędzi. */
function drawPortrait(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  const c = CANVAS_PX / 2;
  const r = DISC_PORTRAIT_R;
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.clip();
  const side = r * 2;
  const scale = Math.max(side / img.width, side / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  // Portrety są kadrowane na twarz w górnej połowie — kotwiczymy u góry kadru.
  ctx.drawImage(img, c - w / 2, c - r, w, h);
  ctx.restore();
}

/** Sygnet (SVG): wyśrodkowany, wpisany w koło tarczy. */
function drawSigil(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  const c = CANVAS_PX / 2;
  const side = DISC_SIGIL_SIDE;
  ctx.drawImage(img, c - side / 2, c - side / 2, side, side);
}

// ---------------------------------------------------------------------------
// Cache tekstur i materiałów — PER WARIANT ZNAKU, nie per żeton
// ---------------------------------------------------------------------------

interface EmblemAsset {
  texture: THREE.CanvasTexture;
  material: THREE.SpriteMaterial;
}

const assetByKey = new Map<string, EmblemAsset>();

/**
 * Klucz wariantu znaku. Barbarzyńcy mają JEDEN klucz na całą mapę; miasta-państwa
 * jeden na kulturę; pełne cywilizacje jeden na parę (kultura, epoka), bo portret
 * zmienia się wraz z epoką.
 */
function emblemKey(ctx: UnitOwnerEmblemContext): string {
  if (ctx.isBarbarian) return 'barb';
  const civ = (ctx.civId ?? '').trim().toLowerCase() || 'unknown';
  if (ctx.isCityState) return `cs:${civ}`;
  const era = Math.max(1, Math.round(ctx.era) || 1);
  return `civ:${civ}:${era}`;
}

/** Wczytuje obrazek (data-URI) i woła `onReady`. Eksportowana — używa jej też unitUpgradeBadges.ts. */
export function loadImageInto(url: string, onReady: (img: HTMLImageElement) => void): void {
  if (!url) return;
  const img = new Image();
  img.onload = () => onReady(img);
  img.decoding = 'sync';
  img.src = url;
}

/**
 * Zwraca (i cache'uje) teksturę + materiał medalionu dla danego wariantu.
 * Tarcza jest gotowa NATYCHMIAST; treść (portret / sygnet) dorysowuje się
 * asynchronicznie do tej samej kanwy i podnosi `needsUpdate`.
 */
function getEmblemAsset(octx: UnitOwnerEmblemContext): EmblemAsset | null {
  const key = emblemKey(octx);
  const cached = assetByKey.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_PX;
  canvas.height = CANVAS_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // KOLEJNOŚĆ ROZSTRZYGANIA — 1:1 z ui/preBattle.ts::commanderHtml.
  const variant: EmblemVariant = octx.isBarbarian
    ? 'barbarian'
    : octx.isCityState
      ? 'cityState'
      : 'civ';

  drawDisc(ctx, variant);
  drawFallbackGlyph(ctx, variant);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const asset: EmblemAsset = { texture, material };
  assetByKey.set(key, asset);

  // Bez wstrzykniętego źródła assetów zostaje sama tarcza z glifem zastępczym.
  if (!assets) return asset;

  const civ = (octx.civId ?? '').trim();
  if (variant === 'barbarian') {
    const svg = prepareSvgForCanvas(assets.barbarianSigilSvg(), RING_COLOR.barbarian);
    loadImageInto(svgToDataUri(svg), (img) => {
      drawDisc(ctx, variant);
      drawSigil(ctx, img);
      texture.needsUpdate = true;
    });
    return asset;
  }

  if (variant === 'cityState') {
    const svg = prepareSvgForCanvas(assets.civSigilSvg(civ), RING_COLOR.cityState);
    loadImageInto(svgToDataUri(svg), (img) => {
      drawDisc(ctx, variant);
      drawSigil(ctx, img);
      texture.needsUpdate = true;
    });
    return asset;
  }

  const portrait = assets.leaderPortraitUrl(civ, octx.era);
  if (portrait) {
    loadImageInto(portrait, (img) => {
      drawDisc(ctx, variant);
      drawPortrait(ctx, img);
      // Pierścień na wierzchu portretu — inaczej zdjęcie zjada mu wewnętrzną krawędź.
      const c = CANVAS_PX / 2;
      ctx.strokeStyle = RING_COLOR.civ;
      ctx.lineWidth = DISC_RING_W;
      ctx.beginPath();
      ctx.arc(c, c, DISC_R, 0, Math.PI * 2);
      ctx.stroke();
      texture.needsUpdate = true;
    });
    return asset;
  }

  // FALLBACK jak w panelu bitwy: brak portretu → ikona kultury (a gdy i jej brak,
  // zostaje narysowany wcześniej neutralny glif).
  const svg = prepareSvgForCanvas(assets.civSigilSvg(civ), RING_COLOR.civ);
  if (svg) {
    loadImageInto(svgToDataUri(svg), (img) => {
      drawDisc(ctx, variant);
      drawSigil(ctx, img);
      texture.needsUpdate = true;
    });
  }
  return asset;
}

// ---------------------------------------------------------------------------
// WEJŚCIE DLA TABLICZKI JEDNOSTKI (render/unitStatPlate.ts)
//
// Od R-ZETON-PASKI znak właściciela jest MAŁĄ IKONĄ wewnątrz tabliczki, a nie
// samodzielnym medalionem. Geometrię ustawia tabliczka; ten moduł oddaje jej
// tylko dwie rzeczy: klucz wariantu (do wczesnego wyjścia z sync()) i gotowy,
// WSPÓŁDZIELONY materiał. Nic tu nie powstaje per żeton.
// ---------------------------------------------------------------------------

/** Klucz wariantu znaku właściciela — stabilny string do porównań w sync(). */
export function ownerEmblemKey(octx: UnitOwnerEmblemContext): string {
  return emblemKey(octx);
}

/**
 * Współdzielony materiał sprite'a ze znakiem właściciela (portret / sygnet /
 * czaszka). `null` tylko wtedy, gdy nie da się utworzyć kanwy 2D.
 * Rysunek dociąga się asynchronicznie do tej samej tekstury — patrz nagłówek.
 */
export function ownerEmblemMaterial(octx: UnitOwnerEmblemContext): THREE.SpriteMaterial | null {
  return getEmblemAsset(octx)?.material ?? null;
}

// ---------------------------------------------------------------------------
// Budowa / synchronizacja emblematu na żetonie
// ---------------------------------------------------------------------------

/** Klucz w userData żetonu — aktualnie narysowany wariant (do wczesnego wyjścia). */
const UD_KEY = 'ownerEmblemKey';
/** Klucz w userData żetonu — sprite emblematu (do podmiany/usunięcia). */
const UD_SPRITE = 'ownerEmblemSprite';

/**
 * ⚠ LEGACY (patrz nagłówek przy EMBLEM_SPRITE_SIZE): samodzielny DUŻY medalion
 * przy lewej krawędzi heksu. GRA GO JUŻ NIE WOŁA — od R-ZETON-PASKI znak
 * właściciela rysuje render/unitStatPlate.ts wewnątrz tabliczki. Funkcja
 * zostaje dla podglądów zbudowanych przed tą zmianą (tools/.zeton-max).
 *
 * Doprowadza emblemat właściciela na żetonie do stanu odpowiadającego `octx`
 * (`null` = brak emblematu, np. gdy renderer nie ma wstrzykniętego rezolwera).
 *
 * IDEMPOTENTNA i tania — przy niezmienionym właścicielu kończy się porównaniem
 * jednego stringa (wołana z UnitRenderer.sync() dla każdej jednostki w każdej
 * klatce synchronizacji). Sprite nie posiada żadnych zasobów na własność —
 * tekstura i materiał są współdzielone i cache'owane w module.
 *
 * PARYTET AI: brak warunku „czy właściciel to gracz”.
 */
export function applyUnitOwnerEmblem(
  group: THREE.Object3D,
  octx: UnitOwnerEmblemContext | null,
): void {
  const key = octx ? emblemKey(octx) : '';
  if (group.userData[UD_KEY] === key) return;
  const old = group.userData[UD_SPRITE] as THREE.Sprite | undefined;
  if (old) {
    group.remove(old);
    delete group.userData[UD_SPRITE];
  }
  group.userData[UD_KEY] = key;
  if (!octx) return;

  const asset = getEmblemAsset(octx);
  if (!asset) return;
  const sprite = new THREE.Sprite(asset.material);
  sprite.center.set(0.5, 0.5);
  sprite.scale.set(EMBLEM_SPRITE_SIZE, EMBLEM_SPRITE_SIZE, 1);
  sprite.position.set(EMBLEM_X, EMBLEM_Y, EMBLEM_Z);
  sprite.renderOrder = EMBLEM_RENDER_ORDER;
  group.add(sprite);
  group.userData[UD_SPRITE] = sprite;
}

/**
 * Zwalnia współdzielone tekstury/materiały modułu — TYLKO dla podglądów i
 * testów, które niszczą cały kontekst WebGL. Gra nigdy tego nie woła
 * (zasoby żyją tyle co scena).
 */
export function disposeUnitOwnerEmblemResources(): void {
  for (const { texture, material } of assetByKey.values()) {
    texture.dispose();
    material.dispose();
  }
  assetByKey.clear();
}
