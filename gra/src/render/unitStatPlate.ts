/**
 * unitStatPlate.ts
 *
 * TABLICZKA JEDNOSTKI nad żetonem na mapie — układ „Total War”
 * (zgłoszenie właściciela Maciej, 2026-07-29, R-ZETON-PASKI; decyzja
 * C-ZETON-PASKI-Q1 = A: tabliczka widoczna ZAWSZE, a medalion właściciela
 * wchodzi DO niej jako mała ikona przy lewej krawędzi).
 *
 * Cytat zgłoszenia: „myślę też, żeby na jednostce umieścić pasek ruchu i pasek
 * HP, jako poziome paski krótkie, na których dopiero jest zbudowana ta nakładka
 * w postaci kuźni gwiazdek i koszar. […] Po lewej stronie jednostki malutka
 * ikona właściciela. U góry symbol generała — to akurat generałów nie mamy.
 * W środku poziom generała, to tam właśnie można umieścić te elementy związane
 * z ilością ruchu i HP. Generałów doprojektujemy sobie w przyszłości.”
 *
 * ── UKŁAD (jeden zwarty obiekt, czytany jako CAŁOŚĆ) ──────────────────────
 *
 *            [ GENERAL_SLOT — miejsce na przyszły symbol generała, DZIŚ PUSTE ]
 *   [ikona    ]   [Koszary]  ★ ★ ★  [Kuźnia]      ← rządek NAD paskami
 *   [właścic. ]   ▓▓▓▓▓▓▓▓░░░░                    ← pasek RUCHU  (NIEBIESKI)
 *   [ mała    ]   ▓▓▓▓▓▓▓▓▓▓▓░                    ← pasek ŻYCIA  (zieleń→bursztyn→czerwień)
 *
 * Rządek Koszary/gwiazdki/Kuźnia rysują OSOBNE moduły, które istniały wcześniej
 * (render/unitUpgradeBadges.ts + render/unitVeteranBadges.ts) — ten moduł jest
 * WŁAŚCICIELEM GEOMETRII CAŁEJ TABLICZKI i podaje im wysokość rządka
 * (BADGE_ROW_Y), żeby układ miał jedno źródło prawdy. Kierunek zależności jest
 * jednostronny: unitUpgradeBadges → unitStatPlate → unitOwnerEmblem. Cyklu nie ma.
 *
 * ── MEDALION WŁAŚCICIELA: BYŁ OSOBNY, TERAZ JEST CZĘŚCIĄ TABLICZKI ────────
 * Do FALI 97 render/unitOwnerEmblem.ts stawiał DUŻY medalion (bok 0,36·HEX_R)
 * przy lewej krawędzi heksu, niezależnie od rządka odznak. Decyzja
 * C-ZETON-PASKI-Q1 = A wciąga go do tabliczki jako małą ikonę (bok
 * PLATE_OWNER_ICON_SIZE = 0,20·HEX_R). ŚWIADOMY KOSZT, znany właścicielowi:
 * przy tym rozmiarze twarz władcy przestaje być rozpoznawalna, więc WARIANT
 * (państwo / miasto-państwo / barbarzyńcy) musi nieść KOLOR OBWÓDKI — dlatego
 * pierścień medalionu został pogrubiony (unitOwnerEmblem.ts::DISC_RING_W).
 * Sam rysunek (portret / sygnet kultury / czaszka) i jego cache zostają
 * w unitOwnerEmblem.ts — ten moduł bierze stamtąd gotowy materiał i tylko go
 * ustawia w nowym miejscu i rozmiarze.
 *
 * ── ⚠ PUŁAPKA WYDAJNOŚCIOWA: PASKI ZMIENIAJĄ SIĘ CO TURĘ ──────────────────
 * Odznaki i medalion wolno cache'ować jako tekstury per wariant, bo wariantów
 * jest kilka na CAŁĄ GRĘ. Paski Ruchu i HP zmieniają się po każdym ruchu i po
 * każdej walce — wypieczenie ich do tekstury kluczowanej wartością dałoby
 * nieograniczony wzrost cache'u i alokacje w pętli sync().
 *
 * ROZWIĄZANIE: wypełnienie paska to THREE.Sprite BEZ TEKSTURY (SpriteMaterial
 * z samym `color`), zakotwiczony do LEWEJ krawędzi (`center.set(0, 0.5)`)
 * i skalowany w osi X: `scale.x = BAR_W * frac`. Zmiana wartości = przypisanie
 * jednej liczby do `scale.x`. ZERO nowych tekstur, ZERO alokacji, cache
 * ograniczony z góry do 4 materiałów (1 × Ruch + 3 × progi HP) i 1 tekstury
 * tła tabliczki na całą grę, niezależnie od liczby jednostek.
 *
 * ── PARYTET AI ────────────────────────────────────────────────────────────
 * Żadna funkcja tego modułu nie zna pojęcia `ownerId`. Wroga jednostka dostaje
 * identyczną tabliczkę — gracz MA widzieć jej Ruch i HP.
 *
 * ── ZASOBY ────────────────────────────────────────────────────────────────
 * Per żeton powstają WYŁĄCZNIE obiekty THREE.Sprite, które nie posiadają ani
 * geometrii, ani materiału na własność. Dlatego NIC nie trafia do
 * group.userData['mats'] ani ['perTokenGeos'] — te dwie tablice niszczy
 * UnitRenderer._disposeToken przy usuwaniu POJEDYNCZEGO żetonu, a wpisanie tam
 * singletonu skasowałoby tabliczki WSZYSTKICH pozostałych jednostek na mapie.
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';
import {
  ownerEmblemKey,
  ownerEmblemMaterial,
  type UnitOwnerEmblemContext,
} from './unitOwnerEmblem';
import {
  VITALS_HP_FULL,
  VITALS_HP_LOW,
  VITALS_HP_LOW_FRAC,
  VITALS_HP_MID,
  VITALS_HP_MID_FRAC,
  VITALS_MOVE_FULL,
  VITALS_TROUGH_CSS,
} from './unitVitalsPalette';

// ---------------------------------------------------------------------------
// GEOMETRIA TABLICZKI — jedno źródło prawdy (wszystko w jednostkach HEX_R = 1,0)
//
// Punkt odniesienia: środek żetonu (0, 0, 0) na powierzchni heksu.
// Figurki jednostek mają ~0,75·HEX_R wysokości, więc CAŁA tabliczka stoi
// powyżej 0,78·HEX_R i nie zasłania modelu.
// ---------------------------------------------------------------------------

/** Długość paska (obu). „Krótki pasek” wprost ze zgłoszenia — 0,55·HEX_R to ~32% szerokości heksu. */
export const PLATE_BAR_W = 0.55 * HEX_R;
/** Wysokość jednego paska. */
export const PLATE_BAR_H = 0.056 * HEX_R;
/**
 * Odstęp pionowy między paskiem HP a paskiem Ruchu.
 * ⚠ Podniesiony z 0,018 na 0,028·HEX_R PO OGLĘDZINACH ZRZUTU z kamery
 * rozgrywki: przy 0,018 oba paski schodziły do ~2 px każdy z prześwitem
 * poniżej piksela i CZYTAŁY SIĘ JAKO JEDEN dwukolorowy pasek (niebieski
 * fragment + zielony fragment obok siebie), zamiast jako Ruch i Życie.
 * Z tego samego powodu podniesiona jest wysokość samego paska (0,046 → 0,056).
 */
const PLATE_BAR_GAP = 0.028 * HEX_R;

/** Wysokość osi paska ŻYCIA (dolny z pary). */
export const PLATE_HP_BAR_Y = 0.820 * HEX_R;
/** Wysokość osi paska RUCHU (górny z pary — bliżej rządka odznak). */
export const PLATE_MOVE_BAR_Y = PLATE_HP_BAR_Y + PLATE_BAR_H + PLATE_BAR_GAP; // 0,904·HEX_R

/** Margines ciemnego tła wokół pary pasków. */
const PLATE_PAD = 0.020 * HEX_R;
/** Szerokość ciemnego tła tabliczki. */
const PLATE_BG_W = PLATE_BAR_W + 2 * PLATE_PAD;                       // 0,590·HEX_R
/** Wysokość ciemnego tła tabliczki. */
const PLATE_BG_H = 2 * PLATE_BAR_H + PLATE_BAR_GAP + 2 * PLATE_PAD;   // 0,180·HEX_R
/** Środek pionowy tła (= środek pary pasków). */
const PLATE_BG_Y = (PLATE_HP_BAR_Y + PLATE_MOVE_BAR_Y) / 2;           // 0,862·HEX_R
/** Lewa krawędź obu pasków (kotwica wypełnienia). */
const PLATE_BAR_LEFT_X = -PLATE_BAR_W / 2;                            // −0,275·HEX_R

/**
 * Bok małej ikony właściciela. 0,20·HEX_R to nieco więcej niż wysokość całego
 * tła (0,180·HEX_R), więc medalion lekko wystaje ponad i pod tabliczkę i czyta
 * się jako „pieczęć” przypięta z lewej, a nie jako trzeci pasek.
 */
export const PLATE_OWNER_ICON_SIZE = 0.20 * HEX_R;
/**
 * Odstęp między ikoną właściciela a lewą krawędzią tła tabliczki. CELOWO
 * MINIMALNY (0,006·HEX_R) — przy 0,018 medalion czytał się na zrzucie jako
 * osobny obiekt obok tabliczki, a ma być jej „pieczęcią” przypiętą z lewej.
 */
const PLATE_OWNER_GAP = 0.006 * HEX_R;
/** Środek ikony właściciela w osi X. */
const PLATE_OWNER_X = -(PLATE_BG_W / 2 + PLATE_OWNER_GAP + PLATE_OWNER_ICON_SIZE / 2); // −0,401·HEX_R

/**
 * Wysokość rządka [Koszary] ★★★ [Kuźnia] NAD paskami.
 * Import tej stałej robi render/unitUpgradeBadges.ts (i przez nie
 * render/unitVeteranBadges.ts) — rządek MUSI stać dokładnie tu, inaczej
 * tabliczka rozpadnie się na dwa niezależne obiekty.
 *
 * ⚠⚠ UWAGA NA RACHUNEK — SPRITE NIE SKRACA SIĘ PERSPEKTYWICZNIE, A ODLEGŁOŚĆ
 * W ŚWIECIE TAK. Kamera gry patrzy pod 52° (render/camera.ts), więc przesunięcie
 * o Δy w świecie daje na ekranie tylko Δy·cos52° = Δy·0,6157 — natomiast sprite
 * (medalion, ikona ulepszenia, tło tabliczki, pole Mocy) jest zawsze zwrócony
 * przodem do kamery i zachowuje PEŁNĄ wysokość. Dlatego prześwit trzeba liczyć
 * NA EKRANIE, a nie w świecie. Pominięcie tego dało na pierwszym zrzucie
 * realną kolizję: przy BADGE_ROW_Y = 1,15 „światowy” prześwit wychodził
 * 0,068·HEX_R, a na ekranie było −0,043·HEX_R, czyli medalion NACHODZIŁ na
 * ikonę Koszar (a ikona Kuźni na pole Mocy).
 *
 * Kontrola pionowa NA EKRANIE (jednostki: ułamki HEX_R po projekcji):
 *   góra medalionu     = 0,862·0,6157 + 0,100 = 0,631
 *   góra pola Mocy     = 0,862·0,6157 + 0,095 = 0,626
 *   góra tła tabliczki = 0,862·0,6157 + 0,090 = 0,621
 *   dół ikony rządka   = 1,250·0,6157 − 0,120 = 0,650  → prześwit 0,019 ✔
 *   dół obwódki ★      = 1,250·0,6157 − 0,0936 = 0,676 ✔
 * (0,019 to prześwit GEOMETRYCZNY; rysunek płytki ikony ma jeszcze ~0,013
 *  własnego marginesu w kanwie, więc na oko prześwit jest ok. 0,03 — rządek
 *  ma stać BLISKO tabliczki, ma się z nią czytać jako jeden obiekt.)
 * (Gwiazdki są bryłami 3D odchylonymi o 52°, więc też stoją przodem do kamery
 * i ich wysokość na ekranie też jest pełna.)
 *
 * Poprzednia wartość (przed R-ZETON-PASKI) wynosiła 0,92·HEX_R — rządek
 * podniósł się o 0,33·HEX_R, żeby zrobić miejsce na paski, medalion i Moc.
 */
export const BADGE_ROW_Y = 1.25 * HEX_R;

/**
 * MIEJSCE NA PRZYSZŁY SYMBOL GENERAŁA — dziś PUSTE, nic się tu nie rysuje.
 * Generałów w grze NIE MA (właściciel: „to akurat generałów nie mamy […]
 * doprojektujemy sobie w przyszłości”), więc modul rezerwuje wyłącznie
 * przestrzeń i podaje jej wymiary, żeby przyszła implementacja nie musiała
 * przesuwać reszty tabliczki.
 *   środek: (0, GENERAL_SLOT_Y), bok: GENERAL_SLOT_SIZE
 *   NA EKRANIE: dół slotu = 1,63·0,6157 − 0,085 = 0,919, a góra ikon rządka
 *   = 1,25·0,6157 + 0,120 = 0,890 → prześwit 0,029 (ten sam rachunek co przy
 *   BADGE_ROW_Y: sprite nie skraca się perspektywicznie, odległość w świecie tak).
 */
export const GENERAL_SLOT_Y = 1.63 * HEX_R;
export const GENERAL_SLOT_SIZE = 0.17 * HEX_R;

/**
 * POLE MOCY ARMII przy PRAWEJ krawędzi tabliczki — symetryczne do ikony
 * właściciela po lewej (rozszerzenie zakresu, Maciej 2026-07-29: „mogłaby się
 * pojawić moc całej armii […] w prawej stronie […] w kolorowej obwódce”).
 * Szerokość dobrana pod TRZY cyfry (patrz POWER_DIGIT_*); przy 4 cyfrach
 * rozstaw sam się zacieśnia, więc układ się nie rozjeżdża.
 */
const PLATE_POWER_BOX_W = 0.24 * HEX_R;
const PLATE_POWER_BOX_H = 0.19 * HEX_R;
/** Odstęp między prawą krawędzią tła tabliczki a polem Mocy (jak przy medalionie: minimalny). */
const PLATE_POWER_GAP = 0.010 * HEX_R;
/** Środek pola Mocy w osi X. */
const PLATE_POWER_X = PLATE_BG_W / 2 + PLATE_POWER_GAP + PLATE_POWER_BOX_W / 2; // +0,425·HEX_R

/**
 * MAKSYMALNY PROMIEŃ POZIOMY tabliczki, w jednostkach HEX_R (twardy limit
 * obrysu heksu = cos30° = 0,866; limit roboczy zadania = 0,70):
 *   ikona właściciela (lewo):   0,401 + 0,100 = 0,501·HEX_R
 *   pole Mocy (prawo):          0,425 + 0,120 = 0,545·HEX_R  ← NAJSZERSZY PUNKT
 *   rządek odznak w najszerszym możliwym stanie (3 gwiazdki + obie ikony,
 *       liczony w unitUpgradeBadges.ts::iconCenterX):
 *                               0,4216 + 0,120 = 0,5415·HEX_R
 * → SKRAJNY PUNKT CAŁEJ TABLICZKI = 0,545·HEX_R. Zapas do limitu roboczego
 *   0,70·HEX_R wynosi 0,155·HEX_R, do twardego obrysu heksu 0,321·HEX_R;
 *   sąsiednie heksy w rzędzie dzieli √3·HEX_R = 1,732, więc między
 *   tabliczkami sąsiadów zostaje 0,642·HEX_R prześwitu.
 *
 * Kontrola pionowa pola Mocy: góra 0,862 + 0,095 = 0,957·HEX_R, a dół ikony
 * Kuźni w rządku to 1,030·HEX_R → prześwit 0,073·HEX_R ✔
 */
export const PLATE_MAX_HALF_WIDTH = 0.545 * HEX_R;

/** Wysunięcia w stronę kamery (+Z) — kolejność warstw tabliczki. */
const PLATE_BG_Z = 0.026 * HEX_R;
const PLATE_FILL_Z = 0.030 * HEX_R;
const PLATE_OWNER_Z = 0.034 * HEX_R;

/**
 * Kolejność rysowania. Rządek odznak ulepszeń ma 13, medalion (dawniej) 14,
 * czaszka głodu 15 — tabliczka wchodzi POD odznaki, żeby ikony Koszar/Kuźni
 * nigdy nie zniknęły pod tłem, a ikona właściciela zostaje na 14.
 */
const PLATE_BG_RENDER_ORDER = 11;
const PLATE_FILL_RENDER_ORDER = 12;
const PLATE_OWNER_RENDER_ORDER = 14;

// ---------------------------------------------------------------------------
// Tło tabliczki — JEDNA tekstura na całą grę
// ---------------------------------------------------------------------------

/**
 * Obwódka tabliczki — przygaszone złoto brand-booka (ta sama rodzina co ramki
 * w UI). Ciepły kontur jest DRUGIM (obok ciemnego koryta) zabezpieczeniem
 * czytelności: oddziela niebieski pasek Ruchu od chłodnych teł (woda, śnieg)
 * ORAZ od niebieskiej obwódki właściciela na ziemi (OWNER_COLORS w units.ts
 * zawiera błękit) — tamta leży płasko na heksie, ta stoi pionowo 0,85·HEX_R
 * wyżej i jest obrysowana złotem, więc nie da się ich pomylić.
 */
const PLATE_BORDER_CSS = 'rgba(212,175,90,0.70)';
/** Wypełnienie tabliczki — ciemne i prawie nieprzezroczyste (kontrast na każdym terenie). */
const PLATE_FILL_CSS = 'rgba(9,13,20,0.88)';

/** Szerokość kanwy tła; wysokość liczona z proporcji świata, żeby nic się nie rozciągnęło. */
const BG_CANVAS_W = 512;
const BG_CANVAS_H = Math.round((BG_CANVAS_W * PLATE_BG_H) / PLATE_BG_W); // 130

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

let bgAsset: { texture: THREE.CanvasTexture; material: THREE.SpriteMaterial } | null = null;

/**
 * Tło tabliczki: ciemna zaokrąglona płytka + złota obwódka + DWA ciemne koryta
 * w miejscach pasków. Koryto (a nie sam kolor wypełnienia) gwarantuje, że pasek
 * czyta się nad wodą i nad śniegiem. Jedna tekstura na całą grę — nie zależy od
 * żadnej wartości Ruchu ani HP.
 */
function getPlateBgAsset(): { texture: THREE.CanvasTexture; material: THREE.SpriteMaterial } | null {
  if (bgAsset) return bgAsset;
  const canvas = document.createElement('canvas');
  canvas.width = BG_CANVAS_W;
  canvas.height = BG_CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Przelicznik świat → piksel kanwy (ten sam w obu osiach — proporcja kanwy
  // jest wyprowadzona z proporcji tabliczki, patrz BG_CANVAS_H).
  const pxPerUnit = BG_CANVAS_W / PLATE_BG_W;
  const border = 5;

  ctx.clearRect(0, 0, BG_CANVAS_W, BG_CANVAS_H);
  roundedRectPath(ctx, border / 2, border / 2, BG_CANVAS_W - border, BG_CANVAS_H - border, 16);
  ctx.fillStyle = PLATE_FILL_CSS;
  ctx.fill();
  ctx.strokeStyle = PLATE_BORDER_CSS;
  ctx.lineWidth = border;
  ctx.stroke();

  // Koryta pasków — pozycje wyprowadzone z tych samych stałych świata,
  // żeby wypełnienie (osobny sprite) trafiało dokładnie w koryto.
  const barWpx = PLATE_BAR_W * pxPerUnit;
  const barHpx = PLATE_BAR_H * pxPerUnit;
  const xpx = PLATE_PAD * pxPerUnit;
  ctx.fillStyle = VITALS_TROUGH_CSS;
  for (const barY of [PLATE_MOVE_BAR_Y, PLATE_HP_BAR_Y]) {
    // Y kanwy rośnie w dół, świat rośnie w górę.
    const topWorld = PLATE_BG_Y + PLATE_BG_H / 2 - (barY + PLATE_BAR_H / 2);
    roundedRectPath(ctx, xpx, topWorld * pxPerUnit, barWpx, barHpx, barHpx * 0.32);
    ctx.fill();
  }

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
  bgAsset = { texture, material };
  return bgAsset;
}

// ---------------------------------------------------------------------------
// Materiały wypełnień — 4 sztuki na CAŁĄ GRĘ (1 × Ruch + 3 progi HP)
// ---------------------------------------------------------------------------

/** Pasmo koloru paska HP. 0 = zieleń (zdrowa), 1 = bursztyn, 2 = czerwień. */
type HpBand = 0 | 1 | 2;

function hpBandFor(frac: number): HpBand {
  if (frac <= VITALS_HP_LOW_FRAC) return 2;
  if (frac <= VITALS_HP_MID_FRAC) return 1;
  return 0;
}

const HP_BAND_COLOR: Readonly<Record<HpBand, number>> = {
  0: VITALS_HP_FULL,
  1: VITALS_HP_MID,
  2: VITALS_HP_LOW,
};

const fillMatByKey = new Map<string, THREE.SpriteMaterial>();

/** Materiał wypełnienia w danym kolorze — współdzielony singleton, nigdy per żeton. */
function getFillMaterial(key: string, color: number): THREE.SpriteMaterial {
  const cached = fillMatByKey.get(key);
  if (cached) return cached;
  const mat = new THREE.SpriteMaterial({
    color,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  fillMatByKey.set(key, mat);
  return mat;
}

function moveFillMaterial(): THREE.SpriteMaterial {
  return getFillMaterial('move', VITALS_MOVE_FULL);
}

function hpFillMaterial(band: HpBand): THREE.SpriteMaterial {
  return getFillMaterial('hp' + band, HP_BAND_COLOR[band]);
}

// ---------------------------------------------------------------------------
// POLE MOCY ARMII — ramka w barwie państwa + cyfry z ATLASU GLIFÓW
//
// ⚠ TA SAMA PUŁAPKA CO PRZY PASKACH: liczba Mocy zmienia się przy każdej
// stracie i każdej zmianie składu armii, więc NIE WOLNO wypiekać tekstury
// kluczowanej wartością („173” → tekstura) — cache rósłby bez ograniczenia.
// ROZWIĄZANIE: dziesięć tekstur, po jednej NA CYFRĘ (0–9), tworzonych leniwie
// i współdzielonych przez wszystkie żetony na mapie. Liczba jest składana
// z 1–4 sprite'ów cyfr, więc zbiór tekstur jest domknięty niezależnie od tego,
// ile różnych wartości Mocy pojawi się w rozgrywce.
// Ramka: JEDNA biała tekstura + materiał barwiony `SpriteMaterial.color`,
// cache'owany po kolorze właściciela — czyli tyle materiałów, ilu graczy,
// a nie ile żetonów.
// ---------------------------------------------------------------------------

/** Wysokość cyfry Mocy (jednostki świata). */
const POWER_DIGIT_H = 0.126 * HEX_R;
/** Szerokość cyfry Mocy. */
const POWER_DIGIT_W = 0.072 * HEX_R;
/** Domyślny rozstaw środków sąsiednich cyfr (lekki kerning: mniej niż szerokość). */
const POWER_DIGIT_ADVANCE = 0.066 * HEX_R;
/** Światło wewnętrzne ramki — poza nie cyfry nie mogą wyjść. */
const POWER_BOX_INNER_W = PLATE_POWER_BOX_W - 0.036 * HEX_R;
/** Wysunięcia w stronę kamery. */
const POWER_FRAME_Z = 0.028 * HEX_R;
const POWER_DIGIT_Z = 0.036 * HEX_R;
const POWER_RENDER_ORDER = 14;

/** Kanwa ramki i cyfry (potęgi dwójki nie wymagamy — minFilter = LinearFilter). */
const POWER_FRAME_CANVAS_W = 256;
const POWER_FRAME_CANVAS_H = Math.round((POWER_FRAME_CANVAS_W * PLATE_POWER_BOX_H) / PLATE_POWER_BOX_W);
const POWER_DIGIT_CANVAS_W = 72;
const POWER_DIGIT_CANVAS_H = Math.round((POWER_DIGIT_CANVAS_W * POWER_DIGIT_H) / POWER_DIGIT_W);

let powerFrameTex: THREE.CanvasTexture | null = null;
const powerFrameMatByColor = new Map<number, THREE.SpriteMaterial>();
const powerDigitMat: Array<THREE.SpriteMaterial | null> = new Array(10).fill(null);
const powerDigitTex: Array<THREE.CanvasTexture | null> = new Array(10).fill(null);

/**
 * Biała ramka pola Mocy (jedna tekstura na całą grę). Rysowana na biało, bo
 * barwę państwa nadaje dopiero `SpriteMaterial.color` — inaczej każdy kolor
 * gracza wymagałby własnej tekstury.
 * Wnętrze jest CIEMNE I GĘSTE (alfa 0,90): to ono, a nie kolor ramki, daje
 * cyfrze kontrast — kolor właściciela nie niesie tu żadnej informacji
 * (C-MOC-Q2 = A), więc całą treść niesie sama cyfra i musi być czytelna
 * niezależnie od tego, jak jasną barwę ma państwo.
 */
function getPowerFrameTexture(): THREE.CanvasTexture | null {
  if (powerFrameTex) return powerFrameTex;
  const canvas = document.createElement('canvas');
  canvas.width = POWER_FRAME_CANVAS_W;
  canvas.height = POWER_FRAME_CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const b = 12;
  ctx.clearRect(0, 0, POWER_FRAME_CANVAS_W, POWER_FRAME_CANVAS_H);
  roundedRectPath(ctx, b / 2, b / 2, POWER_FRAME_CANVAS_W - b, POWER_FRAME_CANVAS_H - b, 20);
  // Wnętrze celowo NIE jest białe — tint barwą państwa mnoży kolor tekstury,
  // więc prawie czarne wnętrze zostaje prawie czarne przy każdej barwie.
  ctx.fillStyle = 'rgba(6,9,14,0.90)';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = b;
  ctx.stroke();
  powerFrameTex = new THREE.CanvasTexture(canvas);
  powerFrameTex.minFilter = THREE.LinearFilter;
  powerFrameTex.colorSpace = THREE.SRGBColorSpace;
  return powerFrameTex;
}

/**
 * Materiał ramki w barwie państwa (C-MOC-Q2 = A: kolor właściciela, ten sam,
 * którego używa obwódka heksu — `_resolveOwnerColor` w render/units.ts).
 * Cache po kolorze: ile państw, tyle materiałów.
 */
function getPowerFrameMaterial(color: number): THREE.SpriteMaterial | null {
  const cached = powerFrameMatByColor.get(color);
  if (cached) return cached;
  const map = getPowerFrameTexture();
  if (!map) return null;
  const mat = new THREE.SpriteMaterial({
    map,
    color,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  powerFrameMatByColor.set(color, mat);
  return mat;
}

/**
 * Materiał JEDNEJ cyfry (0–9). Cyfra jest kremowo-biała z grubym, prawie
 * czarnym obrysem — obrys jest tu obowiązkowy, bo pole Mocy leży nad terenem
 * o nieprzewidywalnej jasności, a przy oddalonej kamerze cyfra schodzi do
 * kilku pikseli i sama biel by się rozmyła.
 */
function getPowerDigitMaterial(digit: number): THREE.SpriteMaterial | null {
  const cached = powerDigitMat[digit];
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = POWER_DIGIT_CANVAS_W;
  canvas.height = POWER_DIGIT_CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, POWER_DIGIT_CANVAS_W, POWER_DIGIT_CANVAS_H);
  ctx.font = `900 ${Math.round(POWER_DIGIT_CANVAS_H * 0.94)}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.round(POWER_DIGIT_CANVAS_H * 0.22);
  ctx.strokeStyle = '#05070b';
  ctx.strokeText(String(digit), POWER_DIGIT_CANVAS_W / 2, POWER_DIGIT_CANVAS_H / 2 + 1);
  ctx.fillStyle = '#fdf6e3';
  ctx.fillText(String(digit), POWER_DIGIT_CANVAS_W / 2, POWER_DIGIT_CANVAS_H / 2 + 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  powerDigitTex[digit] = tex;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  powerDigitMat[digit] = mat;
  return mat;
}

/**
 * Tekst Mocy do wyświetlenia. `sumRosterFieldM()` zwraca liczbę zaokrągloną do
 * 0,1 — na tabliczce pokazujemy pełne punkty (ułamek przy kilku pikselach
 * wysokości i tak byłby nieczytelny, a decyzję o starciu podejmuje się na
 * rzędzie wielkości). Zwraca `''`, gdy pola Mocy nie należy rysować.
 *
 * MOC 0 = BRAK POLA, nie „0”. `sumRosterFieldM()` wyklucza Zwiadowcę, Osadnika
 * i jednostki oblężnicze (isFieldBattleUnit), więc stos samych Zwiadowców ma
 * moc pola 0 — i to jest prawda o tej armii, a nie awaria. Gołe „0” gracz
 * odczytałby jako błąd, dlatego pole znika w całości, dokładnie tak jak ikona
 * Koszar nie pojawia się przy poziomie 0.
 */
function powerText(power: number | undefined | null): string {
  if (typeof power !== 'number' || !Number.isFinite(power)) return '';
  const n = Math.round(power);
  if (n <= 0) return '';
  return String(n);
}

/** Buduje podgrupę pola Mocy (ramka + cyfry). Pusty tekst = brak podgrupy (zwraca null). */
function buildPowerGroup(text: string, ownerColor: number): THREE.Group | null {
  if (!text) return null;
  const g = new THREE.Group();
  g.name = 'unitStatPlatePower';

  const frameMat = getPowerFrameMaterial(ownerColor);
  if (frameMat) {
    const frame = new THREE.Sprite(frameMat);
    frame.center.set(0.5, 0.5);
    frame.scale.set(PLATE_POWER_BOX_W, PLATE_POWER_BOX_H, 1);
    frame.position.set(PLATE_POWER_X, PLATE_BG_Y, POWER_FRAME_Z);
    frame.renderOrder = POWER_RENDER_ORDER;
    g.add(frame);
  }

  // Rozstaw cyfr: domyślny, a przy 4+ cyfrach zacieśniony do światła ramki,
  // żeby liczba nigdy nie wyszła poza obrys pola (wymóg: 1–3 cyfry bez
  // rozjeżdżania układu, więcej — nadal wewnątrz).
  const n = text.length;
  const advance = n <= 1
    ? 0
    : Math.min(POWER_DIGIT_ADVANCE, (POWER_BOX_INNER_W - POWER_DIGIT_W) / (n - 1));
  const startX = PLATE_POWER_X - ((n - 1) / 2) * advance;
  for (let i = 0; i < n; i++) {
    const d = text.charCodeAt(i) - 48;
    if (d < 0 || d > 9) continue;
    const mat = getPowerDigitMaterial(d);
    if (!mat) continue;
    const sprite = new THREE.Sprite(mat);
    sprite.center.set(0.5, 0.5);
    sprite.scale.set(POWER_DIGIT_W, POWER_DIGIT_H, 1);
    sprite.position.set(startX + i * advance, PLATE_BG_Y, POWER_DIGIT_Z);
    sprite.renderOrder = POWER_RENDER_ORDER + 1;
    g.add(sprite);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Odczyt wartości — ODPORNY NA STARE ZAPISY
// ---------------------------------------------------------------------------

/**
 * Ułamek wypełnienia paska (0…1) z pary „ile zostało / ile maksimum”.
 *
 * ZASADA PRZY BRAKU DANYCH: **zawsze PEŁNY pasek**, nigdy pusty.
 * Uzasadnienie: pusty pasek to na mapie sygnał „ta jednostka zaraz padnie /
 * nie ma czym się ruszyć” — czyli FAŁSZYWY ALARM, gdyby wziął się wyłącznie
 * z braku pola w starym zapisie. Pełny pasek w tej samej sytuacji jest stanem
 * neutralnym i zgodnym z kontraktem silnika: RuntimeUnit.hp ma udokumentowane
 * „undefined = pełne z definicji jednostki” (units/setup.ts).
 *
 * Obsłużone przypadki: brak pola (undefined/null), NaN, Infinity, wartość
 * ujemna, maksimum ≤ 0, wartość większa od maksimum (clamp do 1).
 */
function barFraction(value: number | undefined | null, max: number | undefined | null): number {
  const m = typeof max === 'number' && Number.isFinite(max) ? max : NaN;
  if (!Number.isFinite(m) || m <= 0) return 1;
  const v = typeof value === 'number' && Number.isFinite(value) ? value : NaN;
  if (!Number.isFinite(v)) return 1;
  if (v <= 0) return 0;
  return Math.min(1, v / m);
}

// ---------------------------------------------------------------------------
// Budowa / synchronizacja tabliczki na żetonie
// ---------------------------------------------------------------------------

/** Klucz w userData żetonu — wariant znaku właściciela (przebudowa tabliczki). */
const UD_OWNER_KEY = 'statPlateOwnerKey';
/** Klucz w userData żetonu — podgrupa tabliczki. */
const UD_GROUP = 'statPlateGroup';
/** Klucz w userData żetonu — spakowany stan pasków (tania aktualizacja bez przebudowy). */
const UD_BARS = 'statPlateBars';
/** Klucze w userData PODGRUPY — sprite'y wypełnień (aktualizowane w miejscu). */
const UD_MOVE_FILL = 'plateMoveFill';
const UD_HP_FILL = 'plateHpFill';
/** Klucz w userData żetonu — `"<tekst Mocy>|<kolor państwa>"`, do przebudowy SAMEGO pola Mocy. */
const UD_POWER_KEY = 'statPlatePowerKey';
/** Klucz w userData PODGRUPY — podgrupa pola Mocy. */
const UD_POWER_GROUP = 'platePowerGroup';

/**
 * Stan pasków spakowany w JEDNĄ liczbę: ułamek Ruchu (0–1000), ułamek HP
 * (0–1000) i pasmo koloru HP (0–2). Dzięki temu sync() przy niezmienionych
 * wartościach kończy się porównaniem jednej liczby.
 */
function packBars(moveFrac: number, hpFrac: number, band: HpBand): number {
  const m = Math.round(moveFrac * 1000);
  const h = Math.round(hpFrac * 1000);
  return m * 100000 + h * 10 + band;
}

/** Sprite wypełnienia zakotwiczony do LEWEJ krawędzi paska (skalowany, nie przetekstuowany). */
function makeFillSprite(material: THREE.SpriteMaterial, barY: number): THREE.Sprite {
  const s = new THREE.Sprite(material);
  s.center.set(0, 0.5); // kotwica: lewa krawędź, w połowie wysokości
  s.scale.set(PLATE_BAR_W, PLATE_BAR_H, 1);
  s.position.set(PLATE_BAR_LEFT_X, barY, PLATE_FILL_Z);
  s.renderOrder = PLATE_FILL_RENDER_ORDER;
  return s;
}

/**
 * Buduje podgrupę tabliczki: tło + dwa wypełnienia + (opcjonalnie) mała ikona
 * właściciela. Grupa NIE posiada NICZEGO na własność — wszystkie tekstury
 * i materiały są współdzielonymi singletonami modułu.
 */
function buildPlateGroup(octx: UnitOwnerEmblemContext | null): THREE.Group {
  const g = new THREE.Group();
  g.name = 'unitStatPlate';

  const bg = getPlateBgAsset();
  if (bg) {
    const sprite = new THREE.Sprite(bg.material);
    sprite.center.set(0.5, 0.5);
    sprite.scale.set(PLATE_BG_W, PLATE_BG_H, 1);
    sprite.position.set(0, PLATE_BG_Y, PLATE_BG_Z);
    sprite.renderOrder = PLATE_BG_RENDER_ORDER;
    g.add(sprite);
  }

  const moveFill = makeFillSprite(moveFillMaterial(), PLATE_MOVE_BAR_Y);
  g.add(moveFill);
  g.userData[UD_MOVE_FILL] = moveFill;

  const hpFill = makeFillSprite(hpFillMaterial(0), PLATE_HP_BAR_Y);
  g.add(hpFill);
  g.userData[UD_HP_FILL] = hpFill;

  // Mała ikona właściciela przy LEWEJ krawędzi tabliczki (C-ZETON-PASKI-Q1 = A).
  const emblem = octx ? ownerEmblemMaterial(octx) : null;
  if (emblem) {
    const sprite = new THREE.Sprite(emblem);
    sprite.center.set(0.5, 0.5);
    sprite.scale.set(PLATE_OWNER_ICON_SIZE, PLATE_OWNER_ICON_SIZE, 1);
    sprite.position.set(PLATE_OWNER_X, PLATE_BG_Y, PLATE_OWNER_Z);
    sprite.renderOrder = PLATE_OWNER_RENDER_ORDER;
    g.add(sprite);
  }
  return g;
}

/** Wartości pokazywane na tabliczce. Przy stosie są to wartości CAŁEJ armii — patrz game/armyMerge.ts. */
export interface UnitStatPlateVitals {
  /** Pozostałe punkty ruchu (pkt ruchu). Stos: minimum z członków (wspólny pul). */
  ruchLeft: number | undefined;
  /** Maksimum punktów ruchu (pkt ruchu). */
  ruchMax: number | undefined;
  /** Bieżące punkty życia (HP). Stos: Σ HP członków. `undefined` = pełne (kontrakt RuntimeUnit.hp). */
  hp: number | undefined;
  /** Maksimum punktów życia (HP). Stos: Σ maksimów. `undefined` = nieznane → pasek pełny. */
  hpMax: number | undefined;
  /**
   * Moc pola M (pkt Mocy) — NOMINALNA (C-MOC-Q1 = A), liczona przez
   * game/armyMerge.ts::stackFieldPowerM → game/auto-battle-power.ts::sumRosterFieldM.
   * 0 / brak = pole Mocy się NIE rysuje (patrz powerText()).
   */
  fieldPowerM?: number | undefined;
  /**
   * Barwa państwa właściciela (C-MOC-Q2 = A) — ta sama, którą render/units.ts
   * podaje obwódce heksu (`_resolveOwnerColor`). Niesie WYŁĄCZNIE „czyja to
   * armia”, zero informacji o sile: całą treść niesie sama cyfra.
   */
  ownerColor?: number | undefined;
}

/**
 * Doprowadza tabliczkę na żetonie do zadanego stanu.
 *
 * IDEMPOTENTNA i tania — wołana z UnitRenderer.sync() dla KAŻDEJ jednostki
 * w KAŻDEJ klatce synchronizacji:
 *   • niezmieniony właściciel  → zero przebudowy (porównanie jednego stringa),
 *   • niezmienione paski       → wyjście po porównaniu JEDNEJ liczby,
 *   • zmienione tylko paski    → dwa przypisania `scale.x` (+ ewentualna podmiana
 *     współdzielonego materiału HP na inne pasmo koloru). CAŁA tabliczka NIE
 *     jest przebudowywana — to jest wymóg z pułapki wydajnościowej w nagłówku.
 *
 * PARYTET AI: brak jakiegokolwiek warunku „czy właściciel to gracz”.
 */
export function applyUnitStatPlate(
  group: THREE.Object3D,
  octx: UnitOwnerEmblemContext | null,
  vitals: UnitStatPlateVitals,
): void {
  const key = octx ? ownerEmblemKey(octx) : 'none';
  let plate = group.userData[UD_GROUP] as THREE.Group | undefined;

  if (group.userData[UD_OWNER_KEY] !== key || !plate) {
    if (plate) group.remove(plate);
    plate = buildPlateGroup(octx);
    group.add(plate);
    group.userData[UD_GROUP] = plate;
    group.userData[UD_OWNER_KEY] = key;
    group.userData[UD_BARS] = -1;   // wymuś pierwsze wypełnienie
    delete group.userData[UD_POWER_KEY]; // …i przebudowę pola Mocy
  }

  // POLE MOCY — przebudowywane WYŁĄCZNIE gdy zmieni się cyfra albo barwa państwa
  // (przy stracie / zmianie składu armii), nigdy przy samej zmianie pasków.
  const ownerColor = typeof vitals.ownerColor === 'number' ? vitals.ownerColor : 0xffffff;
  const pText = powerText(vitals.fieldPowerM);
  const powerKey = pText + '|' + ownerColor;
  if (group.userData[UD_POWER_KEY] !== powerKey) {
    group.userData[UD_POWER_KEY] = powerKey;
    const oldPower = plate.userData[UD_POWER_GROUP] as THREE.Group | undefined;
    if (oldPower) {
      plate.remove(oldPower);
      delete plate.userData[UD_POWER_GROUP];
    }
    const powerGroup = buildPowerGroup(pText, ownerColor);
    if (powerGroup) {
      plate.add(powerGroup);
      plate.userData[UD_POWER_GROUP] = powerGroup;
    }
  }

  const moveFrac = barFraction(vitals.ruchLeft, vitals.ruchMax);
  const hpFrac = barFraction(vitals.hp, vitals.hpMax);
  const band = hpBandFor(hpFrac);
  const packed = packBars(moveFrac, hpFrac, band);
  if (group.userData[UD_BARS] === packed) return;
  group.userData[UD_BARS] = packed;

  const moveFill = plate.userData[UD_MOVE_FILL] as THREE.Sprite | undefined;
  if (moveFill) {
    moveFill.visible = moveFrac > 0.002;
    moveFill.scale.x = PLATE_BAR_W * moveFrac;
  }
  const hpFill = plate.userData[UD_HP_FILL] as THREE.Sprite | undefined;
  if (hpFill) {
    hpFill.visible = hpFrac > 0.002;
    hpFill.scale.x = PLATE_BAR_W * hpFrac;
    const mat = hpFillMaterial(band);
    if (hpFill.material !== mat) hpFill.material = mat;
  }
}

/**
 * Zwalnia współdzielone zasoby modułu — TYLKO dla podglądów i testów, które
 * niszczą cały kontekst WebGL. Gra nigdy tego nie woła (zasoby żyją tyle co scena).
 */
export function disposeUnitStatPlateResources(): void {
  bgAsset?.texture.dispose();
  bgAsset?.material.dispose();
  bgAsset = null;
  for (const mat of fillMatByKey.values()) mat.dispose();
  fillMatByKey.clear();
  for (const mat of powerFrameMatByColor.values()) mat.dispose();
  powerFrameMatByColor.clear();
  powerFrameTex?.dispose();
  powerFrameTex = null;
  for (let i = 0; i < 10; i++) {
    powerDigitMat[i]?.dispose();
    powerDigitMat[i] = null;
    powerDigitTex[i]?.dispose();
    powerDigitTex[i] = null;
  }
}
