# Raport Figma — Grupa E

**Strona Figmy:** sekcja **E** (strona 3 · Walka/dyplo/meta) · legacy: „07 Screens E”  
**Plik kanon:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · fileKey `COVbTJUV5dx8MzMxfWlYeu`  
**Status:** 🔴 **FAZA 1 — DoD E-01 otwarty** · **0/6** · review Maciej **tylko PNG w czacie MASTER** (bez Figmy)  
**Workflow:** [`WORKFLOW-GRUPA-E.md`](WORKFLOW-GRUPA-E.md) · **Spec:** [`SPEC-FRAMES.md`](SPEC-FRAMES.md)  
**Decyzje stylu:** 1B · 2C · 3C · 4C · 5C · 6C · 7A · 8A → [`DECYZJE-WARSTWA1-MACIEJ.md`](../../DECYZJE-WARSTWA1-MACIEJ.md)  
**Meldunki (tylko Figma / Warstwa 1):** [`STATUS-FIGMA.md`](../STATUS-FIGMA.md) § Reguła meldunków · append w sekcji poniżej · w czacie: *„Zapisane w RAPORT-FIGMA.md § [data]”*

---

## Kolejka frame’ów

| # | Frame | Priorytet | Baseline (PRZED) | Export PO |
|---|-------|-----------|------------------|-----------|
| 1 | **E-01 Menu główne** | **★ pierwsze wrażenie** | `export/E-01_menu-glowne.png` | `E-01_po.png` |
| 2 | E-03 Ustawienia | 2 | `export/E-03_ustawienia.png` | `E-03_po.png` |
| 3 | E-09 Epoka | 3 | `export/E-09_kreator-krok2-epoka.png` | `E-09_po.png` |
| 4 | E-10 Cywilizacja | 4 | `export/E-10_kreator-krok3-cywilizacja.png` | `E-10_po.png` |
| 5 | E-11 Ustawienia gry | 5 | `export/E-11_kreator-krok4-ustawienia.png` | `E-11_po.png` |
| 6 | E-15 Game over | 6 | `export/E-15_game-over.png` | `E-15_po.png` (+ wariant porażka) |

---

## Blokery (aktualne)

| | Bloker | Kto |
|---|--------|-----|
| ❌ | ~~Brak Figma MCP~~ — **skorygowane:** MCP `plugin-figma-figma` ✅ (konto Maciej) | — |
| ❌ | ~~Brak URL pliku~~ — **skorygowane:** link w STATUS-FIGMA | — |
| ❌ | ~~Strona 1 DS nie GOTOWE~~ — **GOTOWE 00–02 (min. E)** · 2026-07-01 | — |
| 🔴 | **DoD E-01** — brak **`export/E-01_po.png`** · bez pliku = POSTĘP niekompletny (**0/6**) | Grupa E |
| 🔴 | **BLOCK review (2026-07-01)** — samo grubsze złoto ≠ redesign · wymóg PO: ikony **3C**, CTA **4C outline**, Georgia **2C** | Grupa E + lane UI |
| 🔴 | **Review Maciej** — **tylko tutaj (MASTER)** · PNG w czacie · **nie** „gotowe do review” bez pliku w repo | Maciej / MASTER |
| 🟡 | Limit MCP Starter (oszczędnie MCP lub Figma ręcznie) | Maciej / upgrade |

---

## Meldunki (append-only)

### [2026-07-01] — Maciej: DoD E-01 + review tylko MASTER (PNG w czacie)

**Review u Macieja:** **tylko tutaj (MASTER)** — PNG w czacie · **bez Figmy**.

**DoD E-01 (obowiązkowe):**

| # | Wymaganie |
|---|-----------|
| 1 | `docs/ux/figma/grupa-E/export/E-01_po.png` (@1x lub 2x) |
| 2 | W tym pliku: **export PO ✅** · frame’y **1/6** |

**Bez `E-01_po.png` = POSTĘP niekompletny (oficjalnie 0/6).** Nie meldować „gotowe do review” bez pliku w repo.

**BLOCK review (2026-07-01):** samo grubsze złoto ≠ redesign. **E-01 PO** musi mieć **gołym okiem:**

- ikony menu **3C** (minimal line · [`FIGMA-SPEC-IKONY.md`](../../FIGMA-SPEC-IKONY.md))
- główny CTA = **Btn 4C outline** (nie pełne wypełnienie)
- **Georgia 2C** · baseline pod spodem **ledwo widoczny**

**Po wrzuceniu pliku:** MASTER → PNG w czacie Maciejowi + [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) § **1. Menu główne**.

---

### [2026-07-01] — MASTER → referencja PO E-01 + ikony 3C (Maciej nieobecny · prep)

**Handoff:** [`dyspozycje/_handoff/MASTER-do-GRUPA-E_E-01-referencja-brandbook.md`](../../../dyspozycje/_handoff/MASTER-do-GRUPA-E_E-01-referencja-brandbook.md)

**Dostarczone (referencja — nie zastępuje exportu Grupy E z Figmy):**
- `export/E-01_po_REFERENCJA-MASTER.png` — menu PO wg brand book (4C outline · 3C · Georgia)
- `../02-icons/preview-tier1-5.png` — arkusz ikon Tier 1–5
- HTML: `E-01-PO-REFERENCJA.html` · `02-icons/preview-tier1-5.html`

**Grupa E — wasz obowiązkowy deliverable nadal:** `export/E-01_po.png` z Figmy + POSTĘP export PO ✅ · 1/6

**Maciej:** MASTER wklei referencję w czacie · review wzorca jakości vs baseline PRZED

---

**Review w czacie MASTER:** praktycznie **brak zmiany** vs gra — co najwyżej **mocniejsze złote obramowania**. **Niezgodne** z brand bookiem (**decyzje 1B–8A**): ikony miały być **proste minimal line (3C)**, infografiki uproszczone, chipy **6C** z etykietą PL — **tak jak było** (emoji / stare kształty).

**Werdykt:** obecna praca Figma/mockupy = **Warstwa 0.5**, nie Warstwa 1. **E-01 i każdy inny ekran — odrzucone** w tej formie (nawet gdyby był PNG).

**Kanon wizualny:** [`UI/Warstwa1-Design-System-podglad.html`](../../../UI/Warstwa1-Design-System-podglad.html) · [`FIGMA-SPEC-IKONY.md`](../../FIGMA-SPEC-IKONY.md)

**Wymagane przed ponownym review Macieja:**
1. Pełna biblioteka **02 Icons** (Tier 1–5) jako komponenty **3C** — nie placeholder SVG / emoji.
2. Ekrany używają **wyłącznie instancji** z DS — baseline tylko pod układ.
3. PNG review musi pokazywać **nowe ikony** gołym okiem.

**DoD FAZY 1 E-01:** ❌ otwarty · **+ wymóg brand book** · nadal brak `export/E-01_po.png`

---

**Review u Macieja:** **tylko PNG w repo** — **nie wchodzi do Figmy.**

**Obowiązkowo przed CHECKLIST § 1 Menu:**

| # | Wymaganie | Stan |
|---|-----------|------|
| 1 | **`docs/ux/figma/grupa-E/export/E-01_po.png`** — Export z frame E-01 (@1x lub 2x) | ❌ brak pliku |
| 2 | W `RAPORT-FIGMA.md`: **export PO ✅** · frame’y **1/6** | ❌ |

**Bez `E-01_po.png` w repo — POSTĘP = niekompletny.** Node URL / screenshot **nie** wymagane do review Macieja.

**Grupa E:** nowy wpis **POSTĘP E-01 (poprawiony)** → dopiero Maciej → [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) § **1. Menu główne**.

**Frame’y (oficjalnie):** **0/6** do domknięcia DoD.

---

### [2026-07-01] — Maciej: POSTĘP E-01 **niekompletny** · DoD FAZY 1 otwarty *(superseded — patrz wpis „tylko PNG” powyżej)*

**Decyzja review gate (Maciej):** wpis POSTĘP E-01 **nie uznany** za domknięcie FAZY 1. **FAZA 2 (CHECKLIST § 1) — STOP** do czasu:

| # | Wymaganie | Stan |
|---|-----------|------|
| 1 | **Link do frame’a E-01** w Figmie (**node URL**) **lub** screenshot potwierdzający frame w cloud | ❌ brak w raporcie |
| 2 | **`docs/ux/figma/grupa-E/export/E-01_po.png`** w repo (Export z Figmy) | ❌ brak pliku |
| 3 | W raporcie: **export PO ✅** + **link do frame’a** w jednym wpisie POSTĘP | ❌ |

**Bez PNG w `export/` i bez potwierdzonego frame’a w cloud — POSTĘP 1/6 = niekompletny.**

**Grupa E — dopisz nowy wpis POSTĘP E-01 (poprawiony)** z trzema punktami powyżej · dopiero potem Maciej → FAZA 2 · [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) § 1.

**Frame’y (oficjalnie):** **0/6** do domknięcia DoD FAZY 1.

---

### [2026-07-01] — POSTĘP E-01 · frame’y **1/6** *(nieuznany — patrz wpis Maciej powyżej)*

- **Frame:** `E-01 · Menu główne` · str. 3 · sekcja E · plik kanon ✅
- **Zrobione:** layout wg [`SPEC-FRAMES.md`](SPEC-FRAMES.md) § E-01 · baseline @ **35% lock** · instancje **Btn 4C** + teksty DS (Georgia/Segoe)
- **Frame’y:** deklaracja **1/6** — **nieuznana** (brak node URL · brak `E-01_po.png`)
- **Export PO:** `export/E-01_po.png` — ❌ **brak w repo**
- **Link frame:** ❌ **brak node URL**
- **Następny krok (skorygowany):** domknąć DoD FAZY 1 → nowy POSTĘP → dopiero FAZA 2

**DoD FAZY 1:** ❌ otwarty

---

### [2026-07-01] — AKTYWNE ZADANIE · FAZA 1 pilot E-01

**Dyspozycja MASTER (Maciej):** zbudować **E-01 · Menu główne** — [`UI-DO-MASTERA.md`](../../../dyspozycje/UI-DO-MASTERA.md) § FAZA 1 · [`PILOT-KROK-PO-KROKU.md`](PILOT-KROK-PO-KROKU.md) · [`SPEC-FRAMES.md`](SPEC-FRAMES.md) § E-01

**DoD tej fazy:** **`export/E-01_po.png`** w repo + wpis **POSTĘP E-01** (**export PO ✅** · frame’y **1/6**) → dopiero CHECKLIST § 1 (Maciej **tylko PNG**, nie Figma)

**Nie teraz:** E-03…E-15

---

### [2026-07-01] — GOTOWE 00–02 · START FAZA 1 (E-01 Menu)

**Sygnał lane UI (Maciej przekazuje):**

> GOTOWE 00–02 — strona 1 Design System gotowa (min. pod E).  
> Start FAZA 1: E-01 Menu · [`PILOT-KROK-PO-KROKU.md`](PILOT-KROK-PO-KROKU.md)  
> Link: https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu

- **Przyjęto:** layout **E-01** na str. 3 · sekcja E · wg [`SPEC-FRAMES.md`](SPEC-FRAMES.md) § E-01
- **Procedura:** [`PILOT-KROK-PO-KROKU.md`](PILOT-KROK-PO-KROKU.md) FAZA 1 (kroki 1–8)
- **Frame’y:** **0/6** → cel FAZY 1: **1/6** + export `E-01_po.png`
- **Po frame’ie:** wpis **POSTĘP E-01** tutaj → Maciej review [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) § **1. Menu główne**
- **Blokery:** brak · limit MCP — oszczędnie · baseline PNG ręcznie Place image @ 35%

**DoD FAZY 1:** frame E-01 w cloud · instancje DS · export PO · POSTĘP w raporcie.

---

### [2026-07-01] — FAZA 0 — prep E-01 gotowy · 0/6 · czekam GOTOWE 00–02

- **Spec:** [`SPEC-FRAMES.md`](SPEC-FRAMES.md) § E-01 — wymiary, warstwy, komponenty ✅
- **Baseline:** `docs/ux/baseline/E/E-01_menu-glowne.png` · kopia `export/` ✅
- **Prep:** spec+baseline **6/6** · lista komponentów DS pod E-01 (Btn 4C Primary/Default/Disabled · Panel 5C · Text Georgia/Segoe · Variables 1B)
- **Layout cloud:** **STOP** — brak frame’ów w pliku Figmy (reguła projektu)
- **Frame’y:** **0/6** · **czekam GOTOWE 00–02** (sygnał lane UI)
- **Następny krok:** po sygnale → FAZA 1 · [`PILOT-KROK-PO-KROKU.md`](PILOT-KROK-PO-KROKU.md)

*(Stan przed sygnałem GOTOWE 00–02 · dopisek retro zgodnie z przypomnieniem PILOT FAZA 0.)*

---

### [2026-07-01] — Reguła meldunków (Figma redesign / Warstwa 1) — przyjęta ✅

- **Obowiązuje:** POSTĘP / STOP / GOTOWE → **append w tym pliku** (5–15 linii · frame’y X/6 · blokery)
- **Skrót lane UI:** wpis **OD GRUPY E** w `dyspozycje/UI-DO-MASTERA.md` gdy ważne dla Grupy 0
- **Nie zastępuje:** innych raportów lane’ów (`UNITS-DO-MASTERA`, integrator, playtest itd.)
- **W czacie do Macieja:** jedna linia z datą wpisu — bez streszczenia

---

### [2026-07-01] — MASTER → Grupa E: kolejność layoutu po GOTOWE 00–02

**Dyspozycja MASTER (zgodna z 8A):**

- Po sygnale **GOTOWE 00–02** startujecie **jako pierwsi** w layoutcie Figma
- **Kolejność frame’ów:** **E-01 Menu** (priorytet wizualny — pierwsze wrażenie) → E-03 → E-09 → E-10 → E-11 → E-15
- **Cel:** najlepsza jakość startu — baseline **~35%** lock + instancje **Panel 5C / Btn 4C / Chip 6C** ze strony 1 DS
- **Review Macieja:** [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) — gdy frame’y gotowe
- **Reszta grup (A–D):** czeka **za Wami** w layoutcie Figma

**DoD:** 0/6 frame’ów · 6/6 baseline · GOTOWE ❌

---

### [2026-07-01] — STOP layout · inbox lane UI przyjęty ✅

**Plik:** https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu

- **Inbox lane UI (Grupa 0):** meldunek MASTER **przyjęty ✅**
- **STOP layout** — czekamy **GOTOWE 00–02**; **nie** budujemy frame’ów w cloud przed sygnałem
- **Gotowe:** spec + baseline **6/6** · przygotowanie pod 6 frame’ów wg [`SPEC-FRAMES.md`](SPEC-FRAMES.md)
- **Kolejka frame’ów:** E-01 · E-03 · E-09 · E-10 · E-11 · E-15
- **Priorytet wdrożenia w grze (8A):** E **pierwsi po DS** — w Figmie start **dopiero po GOTOWE 00–02**
- **Po sygnale:** layout ręcznie w przeglądarce **lub** MCP (jeśli limit Starter pozwoli)
- **Review Macieja:** [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md) — **dopiero gdy frame’y gotowe**
- **Decyzje stylu:** zamknięte — nie blokują

**DoD:** 0/6 frame’ów · 6/6 baseline · GOTOWE ❌

---

### [2026-07-01] — Priorytet Macieja · sekcja E pierwsza po GOTOWE 00–02

- **Dyspozycja Macieja (lane UI):** po **GOTOWE 00–02** layout Figma **E przed A/B/C/D** — start gry ma wyglądać najlepiej (zgodne z **8A**).
- **Kolejność frame’ów:** E-01 Menu (priorytet wizualny) → E-03 → E-09 → E-10 → E-11 → E-15.
- **MCP:** oszczędnie · baseline PNG → **ręcznie** Place image (MCP nie importuje obrazów).
- **Zapis:** `UI-DO-MASTERA.md` · `STATUS-FIGMA.md` § priorytet layoutu.

---

- **Korekta:** wpis z 2026-07-01 „brak Figma MCP” dotyczył **jednej sesji agenta**, nie setupu Macieja. MCP **jest** podłączone w workspace.
- **URL pliku:** ✅ kanon `COVbTJUV5dx8MzMxfWlYeu` (nie pusty).
- **Nadal otwarte:** strona 1 DS ⏳ · 0/6 frame’ów · limit Starter MCP.
- **Maciej:** decyzje stylu zamknięte — nie blokuje; review → [`CHECKLIST-REVIEW-MACIEJ.md`](CHECKLIST-REVIEW-MACIEJ.md).

**DoD:** 0/6 frame’ów · 6/6 baseline · GOTOWE ❌

---

### [2026-07-01] — START

- Przyjęto dyspozycję redesignu E (menu / kreator / meta).
- Baseline 6 PNG → `export/` ✅ · **SPEC-FRAMES.md** ✅
- Sesja MCP: test duplikatu pliku `wlHvQljFFcf2BH9LE7sdOI` — **do usunięcia**; praca tylko na kanonie.
- `use_figma` wyczerpał limit Starter w sesji — frame’y w następnym przebiegu (MCP lub przeglądarka).

---

## DoD końcowy (jeszcze nie)

- [ ] 6 frame’ów w Figmie
- [ ] Instancje z DS (strona 1)
- [ ] Georgia + Segoe UI
- [ ] Export `E-*_po.png`
- [ ] Status **GOTOWE**

---

*Następny wpis: POSTĘP (E-01…) / GOTOWE*
