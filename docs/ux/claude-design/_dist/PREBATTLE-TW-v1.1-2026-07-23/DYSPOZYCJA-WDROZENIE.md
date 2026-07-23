# DYSPOZYCJA — WDROŻENIE PACZKI „PREBATTLE-TW-v1.1" (2026-07-23)
Odpowiedź na paczkę **DO-DESIGN-2026-07-23** (Zlecenie 1 + Zlecenie 2).

## Co to jest
Kanoniczna makieta ekranów PRE-BATTLE jako kompaktowej nakładki nad mapą świata (adaptacja TW Troy/WH3, styl 1E).
Dopracowanie makiety v1 integratora → v1.1: panele ~75% + backdrop-blur (mapa czytelna), kanoniczne CTA i pasek
szans (spójne z POLE-BITWY TW-v5), znacznik hexa miasta (klatka B), pulsowanie znaczników bitwy, kbd-chipy skrótów.
BEZ zmian merytorycznych — akcje i dane 1:1 z preBattle.ts / cityAttackChoice.ts.
**+ Zlecenie 2 (zaległe):** folder `eksport/` (tokens + motion + ikony + icon-mapy) — w tej paczce.

## KROK 1 — Wgranie do repo (Maciej)
Rozpakuj ZIP i wgraj do `maciejsieracki/The-Game`, ścieżka docelowa (struktura w paczce = docelowa):
`docs/ux/claude-design/01-propozycje-z-design/brand-book/`

| Plik w paczce | Dokąd | Uwaga |
|---|---|---|
| `brand-book/KANON/mockupy/The Game - PreBattle nakladka v1.1 (1E).dc.html` | `.../brand-book/KANON/mockupy/` | NOWY KANON — 3 klatki |
| `brand-book/KANON/mockupy/support.js` | `.../brand-book/KANON/mockupy/` | tylko jeśli brak w repo |
| `brand-book/KANON/CANON.md` | `.../brand-book/KANON/` | NADPISZ (wiersz: Pre-battle nakładka) |
| `brand-book/KANON/START - KANON aktualny (1E).dc.html` | `.../brand-book/KANON/` | NADPISZ (karta ★, C-01 oznaczony „stare") |
| `brand-book/KANON/eksport/` (CAŁY folder) | `.../brand-book/KANON/eksport/` | **ZLECENIE 2** — tokens.css/json · motion.css · icons/* · *-icon-map.json · manifest |
| `WYMIANA-UI-DESIGN.md` | katalog statusu (jak dotychczas) | NADPISZ (odpowiedź na DO-DESIGN-2026-07-23) |

Commit: `PREBATTLE nakładka TW v1.1 → KANON + eksport/ (tokens+ikony) — odpowiedź na DO-DESIGN-2026-07-23`

## KROK 2 — Weryfikacja po wgraniu
Otwórz `KANON/START - KANON aktualny (1E).dc.html` → karta **„★ Pre-battle · nakładka na mapie v1.1"** →
makieta musi pokazać 3 klatki (mapa hex w tle rysowana skryptem — chwilę po załadowaniu).

## KROK 3 — Zlecenie dla integratora (logika stanów)
Źródło prawdy wizualnej: makieta v1.1. Stany ekranu pre-battle:

**KLATKA A — atak w polu** (`isCityAttack=false, canRetreat=true`)
- Panel dół-środek: kicker „ROZSTAWIENIE BITWY" · tytuł „Atakujesz: {miejsce}" · meta: Region · **Teren (ikona+nazwa — OBOWIĄZKOWE, plansza bitwy zależy od terenu)** · Tura.
- Pasek szans (momentum): niebieski #2f5aa8→#5a9bd4 vs czerwony, złoty marker #f4e6a8 na styku; podpis „Szansa zwycięstwa: X% Ty / Y% wróg · {ocena}".
- Pigułki modyfikatorów: pos (zielone ▲) / neg (czerwone ▼) / neu (szare).
- CTA: **WYCOFAJ** (czerwony outline) · **AUTO-ROZSTRZYGNIJ** · **DO ROZSTAWIENIA** (złoty primary). Kbd: Enter=deploy, Esc=wycofaj, Zapisz przed bitwą.
- Karty dowódców w górnych rogach (Ty lewy/niebieski, wróg prawy/czerwony): medalion + rola + wódz + liczebność + chipy bonusów.
- Rostery pionowe przy krawędziach: max ~8 kart + chip „+N więcej…"; u wroga karty wg wywiadu — nieznane jako „Nieznany oddział · wywiad: brak danych" (dashed, „?").
- Złoty hex-marker na miejscu bitwy (pulsuje).

**KLATKA B — atak na miasto z murem** (`cityAttackChoice`)
- Meta + tagi: **Mur miejski** (ceglasty) · Garnizon: N oddziały · Ludność N.
- Pasek „Szanse szturmu". Dwie karty opcji: **OBLEGAJ [1]** (ceglasty hover) / **SZTURM [2]** (niebieski hover) — badge klawisza w rogu karty; pod spodem WYCOFAJ. Kbd: 1/2/Esc.
- Wróg = karta „Garnizon miasta" (nazwa miasta zamiast wodza); roster „Garnizon {miasta}".
- Złoty hex-marker na hexie miasta.

**KLATKA C — obrona** (`canRetreat=false`)
- Strony ODWRÓCONE: wróg-atakujący lewy górny róg + lewy roster (wywiad), Ty-obrońca prawy.
- Kicker „WRÓG ATAKUJE" · „Broni się: {miasto/miejsce}".
- **BEZ przycisku Wycofaj** — zamiast: pasek „Wycofanie niedostępne — to wróg wybrał bitwę (obrońca nie może uciec)" (dashed czerwony).
- CTA: AUTO-ROZSTRZYGNIJ · **BROŃ SIĘ — ROZSTAWIENIE** (primary, Enter). Czerwony hex-marker (✕).

**Tokeny:** WYTYCZNE-DESIGN-POLE-BITWY-v5.md §5 (bez zmian). Panele: gradient rgba(22,28,40,.78)→rgba(8,10,16,.84) + blur(7px), obwódka rgba(232,216,138,.3–.45).

## KROK 4 — eksport/ (Zlecenie 2)
Zawartość `brand-book/KANON/eksport/`: `tokens.css` · `tokens.json` · `motion.css` · `icons-manifest.json` ·
icon-mapy (`unit/building/civ/epoch/improvement/setting/battle-class`) · `icons/` (ui, units, resources, buildings,
civilizations, epochs, improvements, menu, settings, tier1–7) + pliki podglądowe `*-preview.html`.
Integrator: tokeny CSS ≡ wartości w battleHudTheme.ts — w razie rozjazdu źródłem prawdy jest `tokens.css`.

## KROK 5 — Po wdrożeniu
Screenshot z gry → porównanie z makietą (odpowiem w WYMIANA-UI-DESIGN.md). Pytania → sekcja 5 „Dyspozycje przychodzące".
