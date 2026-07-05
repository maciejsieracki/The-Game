# Raport Figma — Grupa D

**Strona Figmy:** 06 Screens D  
**Plik:** [The Game — Design System v1](https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu)  
**fileKey:** `COVbTJUV5dx8MzMxfWlYeu`  
**Status:** 🟡 **CZĘŚCIOWE** — komponenty dip-* ✅ · frame'y D-02…D-06 ⏳ (limit MCP Starter)

**Decyzje stylu:** 1B · 2C · 3C · 4C · 5C · 6C → [`DECYZJE-WARSTWA1-MACIEJ.md`](../../DECYZJE-WARSTWA1-MACIEJ.md)  
**Meldunki (tylko Figma):** [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § Reguła meldunków · append poniżej

---

## Kolejka frame'ów

| Frame | Baseline | Status Figma |
|-------|----------|--------------|
| D-02 | `baseline/D/D-02_lista-dyplomacji.png` | ⏳ |
| D-03 | `baseline/D/D-03_audiencja.png` | ⏳ |
| D-04 | `baseline/D/D-04_karty-akcji.png` | ⏳ |
| D-05 | `baseline/D/D-05_modal-wojna.png` | ⏳ |
| D-06 | `baseline/D/D-06_modal-propozycja-ai.png` | ⏳ |

---

## Meldunki (append-only — dopisuj na dole)

- **Obowiązek:** każdy POSTĘP / STOP / GOTOWE → append tutaj (5–15 linii: co zrobione · frame’y X/Y · blokery).
- **Wyłącznie Figma Warstwa 1** — nie zastępuje `CYWILIZACJE-DO-MASTERA.md` ani innych lane’ów.
- **Skrót lane UI:** wpis **OD GRUPY D** w `dyspozycje/UI-DO-MASTERA.md` gdy ważne dla DS.
- **Czat:** jedna linia *„Zapisane w RAPORT-FIGMA.md § [data]”*.

### [2026-07-01] — START + częściowa realizacja

- **Co zrobione:**
  - Utworzono plik Figmy **„The Game — Design System v1”** (decyzja 7A — brak URL w repo).
  - Strona **`06 Screens D`** (jedyna edytowana przez Grupę D).
  - Komponenty **Tier 5 dip-*** na stronie:
    - `dip-alliance` (Sojusz · obrys złoty)
    - `dip-pact` (Pakt · obrys niebieski semantic)
    - `dip-war` (Wojna · obrys czerwony `color/semantic/red` #c84040)
  - Baseline PRZED: 5 PNG w `docs/ux/baseline/D/` ✅
  - Spec ikon + rejestr D-01…D-15 przeczytane ✅
- **Frame'y w Figmie:** **0/5** (limit wywołań Figma MCP Starter po setupie)
- **Baseline użyte:** import wizualny ręczny przy dokończeniu (PNG obok Figmy)
- **Komponenty z biblioteki 00–02:** **niedostępne** (lane UI ⏳) — tokeny zastosowane inline wg [`DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md`](../../DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md)
- **Font:** Georgia niedostępna w Figma cloud → **Lora Bold** jako serif (2C); UI = Inter
- **Blokery:**
  - 🔴 **Figma MCP rate limit** (plan Starter) — dokończyć frame'y ręcznie w pliku lub po odnowieniu limitu / upgrade
  - 🟡 **00–02 Tokens/Components/Icons** nadal ⏳ u lane UI — po GOTOWE podmienić hardcoded kolory na Variables
- **Eksport PNG:** `export/` — puste (README); po frame'ach: Export 2× z Figmy
- **Kontynuacja:** skrypt pomocniczy `FIGMA-RESUME-D02-D06.js` (szkielet)

### Definition of Done — checklist

- [x] Plik Figmy + strona 06 Screens D
- [x] Chipy dip-alliance / dip-pact / dip-war (komponenty)
- [ ] 5 frame'ów D-02…D-06
- [ ] Export PNG w `export/`
- [ ] **RAPORT: GOTOWE** ← po powyższym

---

## Wytyczne layoutu (dokończenie)

| ID | Layout 5C / uwagi |
|----|-------------------|
| **D-02** | Panel 300px lewo: nagłówek Georgia/Lora, wiersze cywilizacji, chip tier (Neutralny/Wrogi), instancja dip-pact/dip-war |
| **D-03** | Pełny ekran 1280×800: overlay + panel audiencji wyśrodkowany, portrety, pasek Zaufanie/Respekt |
| **D-04** | Siatka 12 kart (3×4): aktywne = obrys złoty 4C; locked = opacity 45% + ui-lock |
| **D-05** | Modal centrum: tytuł Lora, **Tak** = Btn outline + fill semantic/red; Anuluj = outline gold |
| **D-06** | Modal niebieski akcent (#5a9bd4): ui-accepted / ui-denied na przyciskach Akceptuj/Odrzuć |

**Modal wojny:** czerwony **tylko** z tokena `#c84040` — nie własny hex.

---

### [2026-07-01] — Odpowiedź na inbox lane UI (Grupa 0)

**Meldunek lane UI:** przyjęty ✅  
**Wybór Grupy D:** **A** — czekamy **GOTOWE 00–02**, potem dokończenie **5 frame’ów** na instancjach DS (**strona 3 · sekcja D**).

| Opcja | Decyzja |
|-------|---------|
| **A** | ✅ **TAK** — domyślna ścieżka; mniej refactoru (inline → Variables, strona `06 Screens D` → sekcja D) |
| **B** | ⏸ **na sygnał Macieja** — Share Can edit + jedna sesja w przeglądarce wg baseline `docs/ux/baseline/D/`; font **Lora Bold** (Georgia niedostępna w cloud) |

**Nie piszemy GOTOWE** — brakuje frame’ów (0/5) i exportu PNG.

**Po frame’ach (DoD Figma):**
1. Export PNG 2× → `figma/grupa-D/export/`
2. Aktualizacja tego raportu (status per frame)
3. Dopiero wtedy status **GOTOWE** w raporcie

**Stan tu i teraz:** dip-alliance / dip-pact / dip-war ✅ · D-02…D-06 ⏳ · export pusty · kolory inline do podmiany po Variables.

### [2026-07-01] — Reguła meldunków (Maciej · przyjęta)

- **Przyjęto:** protokół Figma redesign — append **Meldunki** w tym pliku; skrót w `UI-DO-MASTERA.md`; czat = jedna linia.
- **Zakres:** wyłącznie makiet Figmy DS v1 — walka/ekonomia/integrator → osobne `*-DO-MASTERA`.
- **Frame’y:** 0/5 · **STOP layout** (wybór A) do **GOTOWE 00–02**.
- **Blokery:** brak Variables/Panel 5C/Btn 4C · priorytet layoutu po sekcji E (Maciej 2026-07-01).
- **Następny krok:** czekamy sygnał lane UI → potem D-02…D-06 na str. 3 · sekcja D.
