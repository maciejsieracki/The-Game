# Status Figma — The Game Design System v1

**Ostatnia aktualizacja:** 2026-07-01 (**Maciej DoD E-01** · review tylko MASTER/PNG · BLOCK 3C/4C/2C)  
**Decyzje Macieja:** [`DECYZJE-WARSTWA1-MACIEJ.md`](../DECYZJE-WARSTWA1-MACIEJ.md)

---

## 🔴 BLOCK review Macieja (2026-07-01) — redesign ≠ brand book

**Od Macieja (review w czacie MASTER):** praktycznie **nic się nie zmieniło** względem gry — co najwyżej **mocniejsze złote obramowania**. **Niezgodne** z brand bookiem (**1B–8A**, zwł. **3C** ikony minimal line + **6C** chipy z etykietą PL). Ikony i infografiki **takie jak były** (emoji / stare kształty).

**Werdykt:** obecne mockupy / prace Figma = **Warstwa 0.5** (kosmetyka tokenów), **nie** Warstwa 1. **Żaden ekran nie przechodzi review** do wdrożenia w tej formie.

**Referencja kanonu wizualnego (zatwierdzona):** [`UI/Warstwa1-Design-System-podglad.html`](../../UI/Warstwa1-Design-System-podglad.html) · [`FIGMA-SPEC-IKONY.md`](../FIGMA-SPEC-IKONY.md)

**Dyspozycja lane UI (Grupa 0) — przed dalszym layoutem ekranów:**

1. **Strona 02 Icons** — pełny zestaw Tier 1–5 jako **komponenty SVG 3C** (stroke, bez fill) — **DoD osobny**, Maciej review z PNG/SVG w repo.
2. **Chip 6C** — każdy zasób = **instancja ikony + wartość + etykieta PL** — **zakaz emoji** jako final.
3. **Layout ekranu** — baseline @ 35% to **szablon układu**, nie „gotowy redesign”. Warstwa wierzchnia musi **zastąpić** stare ikony/infografiki — nie tylko dokleić ramkę 5C.
4. **Infografiki** (pasek mocy, karty jednostek, wykresy) — uprościć do stylu brand book (line, czytelne, bez „gry HTML”).
5. **Eksport review:** PNG musi pokazywać **nowe ikony widoczne gołym okiem** — inaczej POSTĘP = odrzucony (jak E-01).

**Grupy A–E:** STOP uznawania pracy za GOTOWE bez spełnienia pkt 1–3. Pilot E-01 **reset oczekiwań** — pierwszy akceptowalny deliverable = menu z **nowymi ikonami menu 3C** + Btn 4C + Georgia 2C, baseline ledwo widoczny.

**→ lane UI:** odpowiedź w `UI-DO-MASTERA.md` · plan domknięcia **02 Icons pełne** + poprawiony DoD ekranów.

---

## MCP Figma — test na żywo (2026-07-01)

| Test | Wynik |
|------|--------|
| `whoami` | ✅ maciej.sieracki@gmail.com · Starter · Full seat |
| `get_metadata` (kanon) | ❌ **Rate limit Starter** wyczerpany |

**Nie brak tokena** — limit **odczytów MCP** (~6/mies.). Layout = **figma.com** + PNG → repo. Poll watch: `node gra/tools/poll-figma-review.mjs` (zamiast `.ps1` — unika blokady Auto-review).

---

## Priorytet layoutu po GOTOWE 00–02 (Maciej · 2026-07-01)

| Kolejność | Sekcja | Uwaga |
|-----------|--------|--------|
| **1** | **E** (meta/start · str. 3) | **Pierwsi w layoutcie Figma** · reszta grup **czeka za E** |
| 2 | A, B (str. 2) | Po sekcji E (8A: A → B) |
| 3 | C, D (str. 3) | Po E (8A: D przed C w grze — layout Figma wg dyspozycji lane UI) |

**Kolejność frame’ów Grupy E (obowiązkowa):**

1. **E-01 Menu** — priorytet wizualny · pierwsze wrażenie  
2. E-03 Ustawienia  
3. E-09 Epoka  
4. E-10 Cywilizacja  
5. E-11 Ustawienia gry  
6. E-15 Game over  

**Cel jakości (Grupa E):** **widoczna zmiana brand book** (ikony **3C**, chipy **6C**, Georgia **2C**, Btn **4C**, Panel **5C**) — baseline @ ~35% **tylko** jako szablon układu; **nie** jako „gotowy redesign”.

**Review Macieja:** **tylko czat MASTER** — PNG w czacie · [`CHECKLIST-REVIEW-MACIEJ.md`](grupa-E/CHECKLIST-REVIEW-MACIEJ.md) § 1 · **bez Figmy** · dopiero po `export/E-01_po.png` + POSTĘP (**export PO ✅** · **1/6**).

**MCP:** oszczędnie · baseline PNG → **Place image ręcznie** (MCP beta nie importuje obrazów).

Dyspozycja: `dyspozycje/UI-DO-MASTERA.md` § MASTER → Grupa E.

---

## Reguła meldunków — **Figma redesign / Warstwa 1 (grupy A–E + lane UI Grupa 0)**

**OBOWIĄZKOWE — nie tylko w czacie.**

**Zakres:** dotyczy **WYŁĄCZNIE** makiet Figmy w pliku **DS v1**. **NIE** zastępuje innych raportów projektu — walka, ekonomia, integrator, playtest itd. mają swoje pliki `*-DO-MASTERA` **jak dotąd**.

| Kto | Gdzie melduje | Kiedy |
|-----|---------------|--------|
| **Grupa A–E** | `docs/ux/figma/grupa-{X}/RAPORT-FIGMA.md` — sekcja **„Meldunki”**, **append-only** | każda odpowiedź · **POSTĘP** · **STOP** · **GOTOWE** · blocker |
| **Format wpisu** | `[YYYY-MM-DD] — tytuł` · **5–15 linii:** co zrobione · frame’y **X/Y** · blokery · następny krok | |
| **Grupa A–E** (skrót) | `dyspozycje/UI-DO-MASTERA.md` — wpis **OD GRUPY X** | gdy ważne dla **lane UI** |
| **Lane UI (Grupa 0)** | `STATUS-FIGMA.md` + `UI-DO-MASTERA.md` | domknięcie DS · sygnał **GOTOWE 00–02** |

**W czacie do Macieja:** jedna linia — *„Zapisane w RAPORT-FIGMA.md § [data]”* — **bez** streszczenia. Maciej **NIE przekleja** tych raportów do MASTER/Cursor — **czyta pliki w repo**.

Szablon do dyspozycji grup: [`KOMUNIKATY-FIGMA-GRUPY-A-E.md`](../KOMUNIKATY-FIGMA-GRUPY-A-E.md) § **WKLEJ — WSZYSTKIE GRUPY**.

---

## 🔴 BLOCKER globalny (stan bieżący)

| Element | Stan |
|---------|------|
| Plik „The Game — Design System v1” | ✅ **URL jest** (poniżej) |
| **Strona 1 · Design System (00–02)** | ✅ **GOTOWE 00–02 (min. pod E)** · **2026-07-01** |
| **Grupa E layout** | 🔴 **FAZA 1** — brak **`export/E-01_po.png`** · **0/6** · review Macieja **tylko PNG** |
| Grupy A–D layout Figma | 🔒 **czekają za E** (8A: potem A → B → D → C) |
| **Limit Figma Starter** | 🔴 **max 3 strony** + **limit MCP** — [`FIGMA-LIMIT-3-STRONY.md`](../FIGMA-LIMIT-3-STRONY.md) |
| **Token MCP / grupy** | 🟡 MCP tylko Cursor Macieja · grupy = **Figma w przeglądarce** po Share → [`FIGMA-KONTO-DOSTEP-MACIEJ.md`](../FIGMA-KONTO-DOSTEP-MACIEJ.md) |

**Lane UI:** sygnał **GOTOWE 00–02 (min. E)** wysłany · Grupa E start **E-01** · reszta DS (Chip 6C, rail Tier 3…) — przed A/B, nie blokuje pilota E.

---

## Link do pliku Figmy

| Pole | Wartość |
|------|---------|
| Nazwa pliku | The Game — Design System v1 |
| URL | https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu |
| fileKey | `COVbTJUV5dx8MzMxfWlYeu` |
| Edytor stron 00–02 | lane UI |
| Data gotowości 00–02 | ✅ **2026-07-01** (min. pod E — Btn 4C, Panel 5C, Variables, Georgia/Segoe, ikony 3C menu) |
| **06 Screens D** | 🟡 Grupa D — dip-* ✅ · frame'y ⏳ (2026-07-01) |

**Grupy startują layout na stronach 03–07 dopiero gdy 00–02 = GOTOWE** (lane UI melduje poniżej).

---

## Inbox — meldunki grup → lane UI (Grupa 0)

*Append-only. Grupy dopisują wpis; lane UI czyta i domyka DS / strukturę pliku.*

### [2026-07-01] OD GRUPY A → lane UI (HUD mapy · Figma redesign)

**Od:** Grupa A (lane Mapa / HUD)  
**Raport szczegółowy:** [`grupa-A/RAPORT-FIGMA.md`](grupa-A/RAPORT-FIGMA.md)

| Temat | Informacja dla lane UI |
|-------|------------------------|
| **Status** | ⏳ **START** — baseline **8/8** ✅ · rejestr UX **30 wpisów** ✅ · **0/8** frame’ów w pliku Figmy |
| **Plik kanon** | https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · fileKey `COVbTJUV5dx8MzMxfWlYeu` |
| **MCP Figma** | ✅ **działa** w Cursorze Macieja — serwer **`plugin-figma-figma`** (`whoami` → maciej.sieracki@gmail.com). W sesji agenta Grupy A wcześniej błędnie zgłoszono „brak MCP / brak URL” — **URL jest w tym pliku**; problem = brak sygnału **GOTOWE 00–02**, nie brak pluginu. |
| **Limit Starter** | 🟡 jak u C/D/E — `use_figma` oszczędnie; po **GOTOWE 00–02** Grupa A buduje frame’y **ręcznie w przeglądarce** **lub** MCP (jeśli limit pozwala). |
| **Gotowe lokalnie** | 8 PNG baseline → `docs/ux/baseline/A/` · skrypt powtórzenia → `gra/tools/baseline-screenshots-a.cjs` · rejestr → `REJEST-UX-MASTER.md` § Grupa A |
| **Styl (decyzje 1B–8A)** | **Zamknięte u Macieja** — chipy HUD **6C** (ikona + wartość + etykieta PL); ikony **3C** wg [`FIGMA-SPEC-IKONY.md`](../FIGMA-SPEC-IKONY.md) |
| **Docelowa lokalizacja** | Wg [`FIGMA-LIMIT-3-STRONY.md`](../FIGMA-LIMIT-3-STRONY.md): **strona 3 · sekcja A** (legacy: „03 Screens A”) |

**Prośby do lane UI (Grupa 0):**

1. **Strona 1 · Design System (priorytet):** domknąć Variables + Components + Icons → sygnał **GOTOWE 00–02** (Grupa A **nie układa** ekranów wcześniej).
2. **Po GOTOWE 00–02:** **czekajcie za Grupą E** w layoutcie Figma · potem Grupa A buduje **8 frame’ów** (baseline PNG ~35% lock + instancje Panel 5C / Chip 6C / Btn 4C / ikony 3C).
3. **Uwagi baseline (nie blokują DS):** **A-06** = panel stosu `.civ-army-stack` (nie mockup A2-Q4); **A-16** = PNG z mockupu HTML — opcjonalna podmiana z live gry przed layoutem.
4. **Kolejność wdrożenia w grze (8A):** po E — Grupa A = **drugi** batch wdrożenia (nie mylić z priorytetem lane UI DS).

**Frame’y obowiązkowe (8):** A-01 HUD · A-02 Toolbar · A-03 Dolny pasek · A-04 Side panel · A-06 Panel jednostki · A-08 Tryb budowy · A-11 Lista dyplo · A-16 Pre-bitwa

**→ lane UI (Grupa 0):** meldunek w `STATUS-FIGMA.md` § **Inbox** + skrót w `dyspozycje/UI-DO-MASTERA.md` ✅ · **odpowiedź lane UI: przyjęty ✅** · Grupa A = **STOP layout** do **GOTOWE 00–02**

---

### [2026-06-26] OD GRUPY B → lane UI (panel miasta / ekonomia · Figma redesign)

**Od:** Grupa B (lane UI miasto · panel po kliknięciu + hub nauki)  
**Raport szczegółowy:** [`grupa-B/RAPORT-FIGMA.md`](grupa-B/RAPORT-FIGMA.md)

| Temat | Informacja dla lane UI |
|-------|------------------------|
| **Status** | 🔒 **STOP layout** — inbox lane UI **przyjęty ✅** · baseline **8/8** ✅ · rejestr **37** ✅ · **0/8** frame’ów cloud |
| **Plik kanon** | https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · fileKey `COVbTJUV5dx8MzMxfWlYeu` |
| **Blocker** | 🔴 **Poprawnie czekamy** — layout **04 Screens B** (legacy) dopiero po sygnale **GOTOWE 00–02** (= strona **1 · Design System**) |
| **Gotowe lokalnie** | 8 PNG baseline PRZED → `docs/ux/baseline/B/` · folder export → `figma/grupa-B/export/` (pusty) · skrypt → `gra/tools/baseline-screenshots-grupa-b.mjs` |
| **Styl (decyzje 1B–6C)** | Ramka **5C** · chipy paska **6C** (etykiety PL!) · rail **Tier 3** (9 ikon) · przyciski **4C** · Georgia **2C** |
| **Docelowa lokalizacja** | Wg [`FIGMA-LIMIT-3-STRONY.md`](../FIGMA-LIMIT-3-STRONY.md): **strona 2 · sekcja B** (legacy: „04 Screens B”; współdzielona ze stroną A) |
| **Bez kodu** | Tylko Figma — **brak** lokalnych mockupów HTML (w odróżnieniu od Grupy C) |

**Prośby do lane UI (Grupa 0):**

1. **Strona 1 · Design System (priorytet):** domknąć Variables + **Panel 5C** + **Btn 4C** + **Chip 6C** + **02 Icons** — w tym **Tier 3 rail** (9 zakładek: kolumny, miecze, chleb, moneta, **młotek**, waga, kaduceusz, maski, świątynia) → sygnał **GOTOWE 00–02**.
2. **Po GOTOWE 00–02:** ogłosić sygnał grupom — Grupa B układa **8 frame’ów** (baseline @ 35% lock) na **stronie 2 · sekcja B**.
3. **Share Edit** na plik dla kont grup (wg [`FIGMA-KONTO-DOSTEP-MACIEJ.md`](../FIGMA-KONTO-DOSTEP-MACIEJ.md)) — praca w przeglądarce, nie MCP.
4. **Ikony krytyczne dla B:** `res-work` = **młotek** (Praca + toolbar Budowa) · `cp-health` = **kaduceusz** · chipy 6C z etykietą (nie samo emoji) — [`FIGMA-SPEC-IKONY.md`](../FIGMA-SPEC-IKONY.md) Tier 3 + Tier 4.

**Frame’y obowiązkowe (8):** B-01 Panel pełny · B-02 Pasek zasobów · B-15 Budowa · B-17 Rekrut · B-29 Dock budynek · B-30 Dock jednostka · B-33 Hub sowa · B-34 Drzewko tech  

**DoD Grupy B (po odblokowaniu):** min. **2 karty szczegółów** w Figmie (Ludność B-03 + Praca B-07) · rail zgodny ze spec · export PNG → `figma/grupa-B/export/`

**Playtest referencyjny (layout, nie grafika):** `Gra-podglad-OKOLICA-UX.html` · baseline z `Gra-podglad-PLAYTEST-MIASTO.html` / `PLAYTEST-MAPA.html`

**→ lane UI (Grupa 0):** meldunek w `STATUS-FIGMA.md` § **Inbox** ✅ · **odpowiedź lane UI: przyjęty ✅** · **GOTOWE 00–02 ✅** · Grupa B = **STOP layout** — czeka **za E** (potem A · **8A**)

---

### [2026-07-01] OD GRUPY E → lane UI (menu/kreator/meta · Figma redesign)

**Od:** Grupa E (lane UI meta · menu + kreator + game over)  
**Raport szczegółowy:** [`grupa-E/RAPORT-FIGMA.md`](grupa-E/RAPORT-FIGMA.md) · **Spec:** [`grupa-E/SPEC-FRAMES.md`](grupa-E/SPEC-FRAMES.md)

| Temat | Informacja dla lane UI |
|-------|------------------------|
| **Status** | 🔒 **STOP layout** — inbox lane UI **przyjęty ✅** · spec + baseline **6/6** ✅ · **0/6** frame’ów · **nie budować** w cloud przed **GOTOWE 00–02** |
| **Plik kanon** | https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · fileKey `COVbTJUV5dx8MzMxfWlYeu` |
| **MCP Figma** | ✅ **działa** w Cursorze Macieja — serwer **`plugin-figma-figma`** (`whoami` → maciej.sieracki@gmail.com). Wcześniejszy błąd „brak MCP” / „brak URL” = **zła nazwa serwera w sesji agenta**, nie brak pluginu ani pustego pliku. |
| **Limit Starter** | 🔴 `use_figma` — **limit wyczerpany** w sesji testowej (~6 wywołań/mies.). Frame’y E-01…E-15 w następnym przebiegu (**MCP oszczędnie** **lub** Figma w przeglądarce ręcznie). |
| **Duplikat pliku** | ⚠️ Sesja testowa utworzyła plik **`wlHvQljFFcf2BH9LE7sdOI`** (strony 00 Foundation / 07 Screens E) — **do usunięcia**; praca tylko na kanonie powyżej. |
| **Gotowe lokalnie** | 6 PNG baseline → `figma/grupa-E/export/` · spec wymiarów/komponentów → `SPEC-FRAMES.md` · baseline PRZED → `docs/ux/baseline/E/` |
| **Styl (decyzje 1B–8A)** | **Zamknięte u Macieja** — nie blokuje lane UI; review → [`CHECKLIST-REVIEW-MACIEJ.md`](grupa-E/CHECKLIST-REVIEW-MACIEJ.md) |
| **Docelowa lokalizacja** | Wg [`FIGMA-LIMIT-3-STRONY.md`](../FIGMA-LIMIT-3-STRONY.md): **strona 3 · sekcja E** (legacy: „07 Screens E”) |

**Prośby do lane UI (Grupa 0):**

1. **Strona 1 · Design System (priorytet):** domknąć Variables + Components + Icons → sygnał **GOTOWE 00–02** (grupy A–E czekają).
2. **Struktura Starter (3 strony):** sekcja E na **stronie 3** (nie osobna 4. strona); priorytet wdrożenia w grze **8A: E pierwsze**.
3. Po **GOTOWE 00–02:** Grupa E buduje 6 frame’ów wg spec (instancje Panel 5C / Btn 4C / Chip 6C / ikony 3C) — ręcznie **lub** MCP po odnowieniu limitu / upgrade Pro.
4. **Duplikat:** usuń plik testowy `wlHvQljFFcf2BH9LE7sdOI` jeśli widoczny w Drafts.
5. **MCP oszczędnie:** kolejne sync przez agenta dopiero po upgrade Pro **lub** reset limitu — patrz [`FIGMA-KONTO-DOSTEP-MACIEJ.md`](../FIGMA-KONTO-DOSTEP-MACIEJ.md).

**Frame’y obowiązkowe (6):** E-01 Menu · E-03 Ustawienia · E-09 Epoka · E-10 Cywilizacja · E-11 Ustawienia gry · E-15 Game over

**→ lane UI (Grupa 0):** meldunek w inbox ✅ · **odpowiedź Grupy E: przyjęty ✅** · Grupa E = **STOP layout** do **GOTOWE 00–02** · review Macieja po frame’ach

**→ MASTER → Grupa E (2026-07-01):** po sygnale **GOTOWE 00–02** startujecie **jako pierwsi** w layoutcie Figma · kolejność **E-01** (priorytet wizualny) → E-03 → E-09 → E-10 → E-11 → E-15 · cel: baseline **~35%** + **Panel 5C / Btn 4C / Chip 6C** z DS · **grupy A–D czekają za Wami**

---

### [2026-06-26] OD GRUPY C → lane UI (walka · Figma redesign)

**Od:** Grupa C (lane Walka / UNITS UX)  
**Raport szczegółowy:** [`grupa-C/RAPORT-FIGMA.md`](grupa-C/RAPORT-FIGMA.md)

| Temat | Informacja dla lane UI |
|-------|------------------------|
| **Status** | 🟡 **mockupy gotowe** — 7/7 frame’ów HTML+PNG · **0/7** w pliku Figmy (sync MCP STOP) |
| **Plik kanon** | https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu · fileKey `COVbTJUV5dx8MzMxfWlYeu` |
| **MCP Figma** | ✅ **działa** w Cursorze Macieja — serwer `plugin-figma-figma` (`whoami` → maciej.sieracki@gmail.com). Wcześniejszy błąd „brak MCP” = zła nazwa serwera w sesji agenta, **nie** brak pluginu. |
| **Limit Starter** | 🔴 `use_figma` / upload — **limit wyczerpany** w sesji testowej (~6 wywołań/mies.). Automatyczny sync frame’ów **niemożliwy** do odnowienia limitu / upgrade. |
| **Duplikat pliku** | ⚠️ Sesja testowa utworzyła **Drafts** `1AagleoxDbe0jWOMDsA0if` — **do usunięcia**; praca tylko na kanonie powyżej. |
| **Gotowe lokalnie** | 7 PNG redesign → `figma/grupa-C/export/` · layout edytowalny → `FIGMA-FRAMES-C.html` · baseline PRZED → `docs/ux/baseline/C/` |
| **Styl (decyzje 1B–5C)** | Panel **5C**, przyciski **outline 4C**, ikony **3C** (`tb-army`) — **lokalnie** w HTML; docelowo instancje ze strony 1 DS po **GOTOWE 00–02** |
| **Docelowa lokalizacja** | Wg [`FIGMA-LIMIT-3-STRONY.md`](../FIGMA-LIMIT-3-STRONY.md): **strona 3 · sekcja C** (legacy: „05 Screens C”) |

**Prośby do lane UI (Grupa 0):**

1. **Import ręczny (pilne):** Place image × 7 z `export/` na **stronę 3 · sekcja C** (1280×800, nazwy `C-01`…`C-21` jak w rejestrze).
2. **Strona 1 · DS:** po **GOTOWE 00–02** — podmiana lokalnych kolorów/fontów Grupy C na **Variables** + instancje Panel 5C / Btn 4C / ikony.
3. **Duplikat:** usuń plik Drafts `1AagleoxDbe0jWOMDsA0if` jeśli widoczny.
4. **MCP oszczędnie:** kolejne sync przez agenta dopiero po upgrade Pro **lub** reset limitu — do tego czasu grupy pracują w przeglądarce ([`FIGMA-KONTO-DOSTEP-MACIEJ.md`](../FIGMA-KONTO-DOSTEP-MACIEJ.md)).

**Frame’y obowiązkowe (7):** C-01 Pre-bitwa · C-06 Deployment · C-07 Pole bitwy · C-08 HUD góra · C-09 Pasek komend · C-19 Mur/brama · C-21 Koniec bitwy

---

### [2026-07-01] OD GRUPY D → lane UI (dyplomacja · Figma redesign)

**Od:** Grupa D (lane CYW / UI dyplomacja)  
**Raport szczegółowy:** [`grupa-D/RAPORT-FIGMA.md`](grupa-D/RAPORT-FIGMA.md)

| Temat | Informacja dla lane UI |
|-------|------------------------|
| **Status** | 🟡 **CZĘŚCIOWE** — DoD Grupy D **nie** domknięty (0/5 frame’ów + brak export PNG) |
| **Plik** | https://www.figma.com/design/COVbTJUV5dx8MzMxfWlYeu (ten sam kanon) |
| **Co jest w pliku** | Strona **`06 Screens D`** (legacy nazwa — wg [`FIGMA-LIMIT-3-STRONY.md`](../FIGMA-LIMIT-3-STRONY.md) docelowo **strona 3 · sekcja D**) |
| **Komponenty gotowe** | `dip-alliance`, `dip-pact`, `dip-war` (Tier 5 — obrysy złoto / niebieski / `#c84040`) |
| **Frame’y D-02…D-06** | ⏳ **0/5** — przerwane przez **limit MCP Figma Starter** |
| **Font** | Georgia **niedostępna** w Figma cloud → Grupa D użyła **Lora Bold** (tytuły); UI = Inter |
| **Tokeny** | Kolory **inline** (1B) — brak Variables ze strony 1 DS |

**Prośby do lane UI (Grupa 0):**

1. **Strona 1 · Design System:** oficjalnie dodać **dip-alliance / dip-pact / dip-war** (Icons Tier 5) + **Panel 5C**, **Btn 4C outline**, **semantic/red** — sygnał **GOTOWE 00–02**.
2. **Struktura Starter (3 strony):** przenieść / scalić zawartość strony `06 Screens D` → **strona 3 · sekcja D** (nie osobna 4. strona).
3. Po **GOTOWE 00–02:** Grupa D dokończy frame’y (ręcznie w Figmie **lub** MCP po odnowieniu limitu / upgrade).
4. **Georgia vs Lora:** uzgodnić w tokenie `font/title` (decyzja 2C).

**Baseline PRZED (referencja):** `docs/ux/baseline/D/` — 5 PNG ✅  
**Export redesign:** `figma/grupa-D/export/` — puste (czeka na frame’y)

**Odpowiedź Grupy D (lane UI → D, 2026-07-01):** meldunek **przyjęty ✅** · wybór **A** (STOP frame’ów do **GOTOWE 00–02**). Opcja **B** tylko na sygnał Macieja (Can edit). **Nie GOTOWE** (0/5 + brak export).

---

## Postęp stron

| Strona | Status | Odpowiedzialny | Data | Uwagi |
|--------|--------|----------------|------|-------|
| **1 · Design System** (00+01+02) | ✅ **GOTOWE min. E** | lane UI | 2026-07-01 | Variables · Btn 4C · Panel 5C · Text · ikony menu 3C |
| 03 Screens A | 🔒 | Grupa A | | **GOTOWE 00–02 ✅** · czeka **za E** · baseline 8/8 |
| 04 Screens B → **str. 2 sekcja B** | 🔒 STOP | Grupa B | | **GOTOWE 00–02 ✅** · czeka **za E** · 0/8 cloud |
| 05 Screens C | 🟡 mockupy gotowe | Grupa C | 2026-06-26 | 7 PNG lokalnie · czeka **za E** |
| 06 Screens D | 🟡 | Grupa D | 2026-07-01 | dip-* ✅ · czeka **za E** · frame'y ⏳ |
| 07 Screens E → **str. 3 sekcja E** | 🔴 FAZA 1 | Grupa E | 2026-07-01 | E-01 DoD otwarty · POSTĘP nieuznany · **0/6** |

Legenda: ⏳ w toku · ✅ gotowe · 🔒 zablokowane · 🔄 poprawki

---

## Raporty grup (skrót)

| Grupa | Raport | Status | Ostatni wpis |
|-------|--------|--------|--------------|
| A | [`grupa-A/RAPORT-FIGMA.md`](grupa-A/RAPORT-FIGMA.md) | 🔒 STOP layout | 2026-07-01 — **GOTOWE 00–02 ✅** · czeka **za E** |
| B | [`grupa-B/RAPORT-FIGMA.md`](grupa-B/RAPORT-FIGMA.md) | 🔒 STOP | 2026-07-01 — **GOTOWE 00–02 ✅** · czeka **za E** |
| C | [`grupa-C/RAPORT-FIGMA.md`](grupa-C/RAPORT-FIGMA.md) | 🟡 mockupy gotowe | 2026-06-26 — MCP ✅ · 7 PNG · sync 🔴 limit Starter |
| D | [`grupa-D/RAPORT-FIGMA.md`](grupa-D/RAPORT-FIGMA.md) | 🟡 CZĘŚCIOWE | 2026-07-01 — **→ lane UI:** dip-* ✅, frame'y ⏳, inbox STATUS-FIGMA |
| E | [`grupa-E/RAPORT-FIGMA.md`](grupa-E/RAPORT-FIGMA.md) | 🔴 FAZA 1 | 2026-07-01 — DoD: **`E-01_po.png`** + POSTĘP · review **tylko PNG** |

---

## Kolejność wdrożenia w grze (po Figmie)

Decyzja Macieja **8A:** E → A → B → D → C

---

*Append-only w raportach grup · ten plik aktualizuje lane UI*
