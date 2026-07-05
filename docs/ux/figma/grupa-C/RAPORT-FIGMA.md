# Raport Figma — Grupa C

**Strona Figmy:** **strona 3 · sekcja C** (legacy: „05 Screens C”) · plik kanon poniżej  
**Status:** 🟡 **mockupy lokalne 7/7 · cloud 0/7 · czeka wybór A/B (Maciej)**  
**URL pliku (kanon):** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu  
**Decyzje stylu:** 1B · 2C · 3C · 4C · 5C · 6C — **zamknięte** → [`DECYZJE-WARSTWA1-MACIEJ.md`](../../DECYZJE-WARSTWA1-MACIEJ.md)  
**Meldunki (tylko Figma):** [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § Reguła meldunków · append poniżej

---

## Frame'y (7/7)

| Frame | Baseline | Eksport redesign | Panel 5C | Przyciski 4C | Ikony 3C |
|-------|----------|------------------|----------|--------------|----------|
| C-01 Pre-bitwa | `baseline/C/C-01_pre-bitwa.png` | `export/C-01_pre-bitwa.png` | ✅ modal pełny | ✅ Auto / Bitwa / Wycofaj | ✅ `tb-army` (miecze) |
| C-06 Deployment | `C-06_deployment.png` | `export/C-06_deployment.png` | ✅ overlay dół | ✅ F1–F3 + Start | — |
| C-07 Pole bitwy | `C-07_pole-bitwy.png` | `export/C-07_pole-bitwy.png` | ✅ HUD ramki | ✅ pasek komend | — |
| C-08 HUD góra | `C-08_hud-gora-bitwa.png` | `export/C-08_hud-gora-bitwa.png` | ✅ top bar 2px | ✅ Pomiń / Wyjście | — |
| C-09 Pasek komend | `C-09_pasek-komend.png` | `export/C-09_pasek-komend.png` | — | ✅ cmd outline | — |
| C-19 Mur/brama | `C-19_oblezenie-mur-hud.png` | `export/C-19_oblezenie-mur-hud.png` | ✅ siege HUD | — | — |
| C-21 Koniec bitwy | `C-21_ekran-konca-bitwy.png` | `export/C-21_ekran-konca-bitwy.png` | ✅ modal wynik | ✅ Szczegóły / Zakończ | — |

**Źródło layoutu (edytowalne):** [`FIGMA-FRAMES-C.html`](FIGMA-FRAMES-C.html)  
**Eksport ponownie:** `node gra/tools/export-figma-frames-c.mjs`

---

## Tokeny użyte (z dyspozycji 00 — lokalna implementacja)

| Token | Wartość | Gdzie |
|-------|---------|-------|
| `color/bg/deep` | `#080a12` | tło / HUD |
| `color/bg/panel` | `#121820` | panele |
| `color/gold/primary` | `#e8d88a` | obrys 5C, przyciski 4C, tytuły |
| `color/gold/dim` | `#a08030` | etykiety wtórne |
| `color/parchment/text` | `#e8e0c8` | tekst główny |
| `color/parchment/muted` | `#8a8070` | hinty |
| `color/semantic/red` | `#c84040` | ATK / Wycofaj |
| `color/semantic/blue` | `#5a9bd4` | OBR |
| `color/semantic/green` | `#50b070` | Auto / morale |
| `font/title` | Georgia | nagłówki paneli, zwycięzca |
| `font/ui` | Segoe UI | liczby, przyciski, log |

**Reguła:** baseline PNG @ 38% opacity — canvas 3D **bez zmian** (tylko ramki UI).

---

## Komponenty (odwzorowanie 01 Components — lokalnie)

| Komponent | Decyzja | Zastosowanie w C |
|-----------|---------|------------------|
| Panel heavy 5C | 5C | C-01, C-06, C-19, C-21 |
| Przycisk outline 4C | 4C | C-01 foot, C-06 Start, C-08 top, C-21 actions |
| Ikona `tb-army` | 3C | C-01 kolumny wojsk, Bitwa ręczna |
| Ikona miecze SVG | 3C | skrzyżowane miecze line 1.5px |

Po publikacji stron 00–02 w Figmie → **zamienić lokalne style na instancje** z biblioteki.

---

## Meldunki (append-only)

> **Reguła:** tylko zadanie Figma redesign — [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § Reguła meldunków · w czacie do Macieja: *„Zapisane w RAPORT-FIGMA.md § [data]”*.

### [2026-06-26] — reguła meldunków · przyjęcie protokołu

- **Obowiązuje:** meldunki **tylko** w tym pliku (+ skrót `UI-DO-MASTERA.md` dla lane UI) — **nie** zastępuje `UNITS-DO-MASTERA` / walki / integratora.
- **Format:** POSTĘP / STOP / GOTOWE · 5–15 linii · frame’y **N/M** · blokery.
- **Stan zadania:** mockupy lokalne **7/7** · cloud **0/7** · czeka wybór **A/B** (Maciej).

---

### [2026-06-26] — POSTĘP · odpowiedź lane UI (Grupa 0)

- **Inbox:** meldunek Grupy C **przyjęty ✅** (`STATUS-FIGMA.md` § Inbox).
- **Plik kanon:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu — **bez nowych duplikatów**.
- **MCP Starter:** sync zablokowany — **oczekiwane**, nie bloker na mockupach lokalnych.
- **Stan:** 7/7 PNG w `export/` · 0/7 frame’ów w cloud · HTML `FIGMA-FRAMES-C.html` ✅.
- **Wybór operacyjny (Maciej):**
  - **A** — czekamy **GOTOWE 00–02**, potem layout na instancjach DS (jak A/B/E).
  - **B** — Share **Can edit** → Place image × 7 na **str. 3 · sekcja C** (1280×800); później i tak podmiana na komponenty DS.
- **Grupa C:** **stan idle** do literki **A** lub **B** od Macieja.
- **Po frame’ach w cloud:** export `C-*_po.png` → `export/` + wpis POSTĘP tutaj.

---

### [2026-07-01] — RAPORT GOTOWE

- **Co zrobione:**
  - 7 frame’ów redesignu Warstwa 1 (1B 2C 3C 4C 5C).
  - C-01 i C-21 na **Panel 5C** (obwódka 2px gold, cień, Georgia w nagłówku).
  - Przyciski akcji **outline 4C** — bez wypełnionych „pill” z kanonu.
  - Baseline `docs/ux/baseline/C/` jako tło (38% opacity).
  - HTML źródłowy + PNG w `export/` (import do Figmy: Place image → trace / overlay).
- **Frame'y w Figmie (cloud):** ⏳ **brak URL** — lane UI nie opublikował jeszcze pliku · MCP Figma niedostępne w sesji agenta.
- **Baseline użyte:** wszystkie 7 PNG z `baseline/C/`.
- **Komponenty z biblioteki:** lokalne odwzorowanie tokenów — **docelowe instancje po GOTOWE 00–02**.
- **Blokery:**
  - 🔴 Brak linku do pliku Figmy (`STATUS-FIGMA.md` — 00–02 ⏳).
  - 🟡 Import do strony **05 Screens C** = ręcznie przez lane UI lub Macieja (PNG + HTML referencja).
- **Eksport PNG:** ✅ `docs/ux/figma/grupa-C/export/` (7 plików)

**Definition of Done — postęp:** 7/7 frame’ów · 7/7 eksport PNG · RAPORT GOTOWE

### Instrukcja importu do Figmy (lane UI / Maciej)

1. Otwórz stronę **05 Screens C** w pliku DS v1.
2. Dla każdego frame’u 1280×800: warstwa dolna = baseline @ 40% lock · warstwa górna = komponenty z 01.
3. Alternatywa szybka: **Import** PNG z `export/` jako warstwa „AFTER redesign” obok baseline.
4. Po 00–02: podmień kolory/fonty na **Variables** ze strony 00.

---

### [2026-06-26] — MCP Figma potwierdzone

- **MCP:** serwer `plugin-figma-figma` w Cursor — **działa** (`whoami` → maciej.sieracki@gmail.com).
- **Plik kanon:** już istnieje (lane UI) → https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · `STATUS-FIGMA.md`
- **Sync automatyczny:** 🔴 **STOP** — limit planu **Starter** (6 wywołań MCP/mies.; `use_figma` liczy się do limitu).
- **PNG odświeżone:** `docs/ux/figma/grupa-C/export/` (7 plików).
- **Import ręczny:** otwórz plik kanon → strona **05 Screens C** → Place image × 7 z `export/` (1280×800).
- **Uwaga:** sesja utworzyła **duplikat** w Drafts (`1AagleoxDbe0jWOMDsA0if`) — można usunąć; używamy pliku lane UI.
- **→ lane UI (Grupa 0):** meldunek w `STATUS-FIGMA.md` § **Inbox** + skrót w `dyspozycje/UI-DO-MASTERA.md` ✅

*Szablon · kolejne wpisy: POPRAWKI / SYNC z Figmą cloud*
