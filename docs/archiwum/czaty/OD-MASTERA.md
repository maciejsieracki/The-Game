# Od Master Silnika → czaty tematyczne

> **Komenda Macieja w czacie Grupy A–F:** `master`  
> Agent **czyta ten plik** (swoją sekcję poniżej) i wykonuje / odpowiada w czacie.

**Append-only** — Master dopisuje na dole sekcji grupy. Agent nie kasuje.

---

## [2026-06-27] **REGUŁA PRZEPŁYWU (Maciej — WSZYSTKIE GRUPY)**

**Obowiązkowy dokument:** `docs/czaty/REGULA-PRZEPLYWU-2026-06-27.md`

| Kto | Co robi |
|-----|---------|
| **A–E** | Swój lane → `→ SILNIK: GOTOWE` + handoff. Poprawka = znowu ta grupa. |
| **F** | Wpina `main.ts` → **testuje** → `→ MASTER: GOTOWE-ROBOCZA`. |
| **Master** | **NIE koduje, NIE wpina.** Weryfikuje F. OK → Maciej. NIE OK → **grupa źródłowa**. |
| **Maciej** | Playtest `Gra-podglad.html` gdy Master da checklistę. |

**Zakaz:** Master nie patchuje lane’ów; poprawki nie idą „na skróty” do F.

---

**Plik:** `Status-projektu-The-Game.xlsx` (root Civ)  
**Instrukcja:** `docs/master/STATUS-TRACKER-EXCEL.md`

| Grupa | Arkusz | Obowiązek |
|-------|--------|-----------|
| A–F | `Grupa-A` … `Grupa-F` | Przy każdej zmianie: **Status** + **Data** + **Uwagi** |
| Master | `Dashboard`, `Master-Silnik`, **Status wg grup**, **POSTEP-%** | Sync: `python gra/tools/sync-status-tracker-xlsx.py` |

**Całość gry:** arkusz **Status wg grup** (~55 elementów: Zrobione / Niezrobione / Częściowo) + **Podsumowanie** (statystyki %).

**Statusy:** `NIE ROZPOCZĘTE` · `W TOKU` · `GOTOWE` · `→ SILNIK` · `ZAMKNIĘTE` · `CZEKA ABC` · `BLOK`

Po `master`: sprawdź swój arkusz — jeśli zadanie wisi, oznacz `W TOKU` lub `GOTOWE`.

---

## [2026-06-27] ABC — pełna forma pytań (GLOBALNE)

**Problem:** grupy wysyłają skrócone pytania mimo DYSPOZYCJA-STALA.

**Rozwiązanie (wdrożone):**
- Reguła Cursor **zawsze aktywna:** `.cursor/rules/abc-pelna-forma.mdc`
- Szablon:** `docs/decyzje/SZABLON-PYTANIA-ABC.md`
- Blok ABC w każdej `DYSPOZYCJA-GRUPA-*.md`

**Dyspozycja dla agentów A–E:** jeśli Maciej napisze „niepełne" / „skrócone" — **nie tłumacz** — otwórz szablon, przepisz **całą paczkę** od nowa. Nie odpowiadaj na skrót.

**Dyspozycja dla Macieja:** możesz odpowiadać jednym słowem: **`pełne`** — agent ma przepisać paczkę według szablonu bez dyskusji.

---

## Grupa A — Mapa świata

### [2026-06-26] Priorytet jutro

1. Nie pytaj o Q5–Q10 w A2 — to **A1-Q5…Q10**.
2. Pierwsza paczka ABC: **A1-Q5, Q6, Q7, Q8, Q9** (max 5) LUB akceptacja mockup **D1B**.
3. Potem **A2-Q4** (jednostka na heksie — `[EKRAN: Mapa świata]`).
4. Raport → `docs/czaty/DO-MASTERA.md` § Grupa A.

### [2026-06-27] Stan po `czaty` — Master (aktualizacja)

**ZAMKNIĘTE — nie pytaj ponownie:** A1-Q5…Q9, **Q11=A** (Kultura na pasku [A]), Q12, revA, mockup D1B (ABC1=A), **A2-Q4=A** (panel jednostki [H]), MAPA-F2-Q1 routing, **A4-D4-Q1=A**, **A4-Q1=A** (budowa tylko z mapy).

**OTWARTE ABC w tym czacie:** brak (chyba że Maciej nowa paczka).

Raport → `DO-MASTERA.md` § A po każdej paczce.

### [2026-06-27] Master → Grupa A: **P1 BLOKUJE Grupę F** (wykonaj TERAZ)

Grupa F **czeka na Was** — bez tego F-HUD-2 nie domknie się w `main.ts`:

| # | Zadanie | Handoff | Lane |
|---|---------|---------|------|
| **1** | **A1-Q9** — przycisk WYKONAJ + `blocking` + gate Końca tury | `UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md` | UI |
| **2** | **A2-Q4** — moduł panelu jednostki [H] (klik jednostka → karta na dole) | `UI-do-MASTER_A2-Q4-panel-jednostki.md` | UI |
| **3** | **B2-Q5=C część 1** — chip 🔥 `Bunt: [miasto]` w `sidePanelHud` | `UI-do-GRUPA-A_B2-Q5-bunt-chip.md` | UI |
| **4** | **MAPA B2-Q5 część 2** — ikona 🔥 na heksie miasta (`getRevolt` + overlay) | `MAPA-do-SILNIK_B2-Q5-bunt-hex.md` | MAPA |
| **5** | **MAPA A4-D4** — luki kwalifikacji placementu (pastwisko/plantacja/tarasy/warzelnia) | `A4-D4-przeglad-ulepszen-terenu.md` | MAPA |
| **6** | **UI A4-D4** — tryb 🔨 Budowa w toolbarze D1B (mockup → moduł) | `A4-D4` + `MAPA-do-MASTER_ulepszenia-D4A.md` | UI |

Po każdym gotowym: `→ SILNIK: GOTOWE` w `DO-MASTERA` § A + handoff jeśli cross-lane.

**F zrobiło już:** `kulturaRate`, `getEvents()` bunt (część SILNIK) — **nie duplikuj**.

**P2 (po P1):** MAPA-F2 toggles kultura/religia na mapie 3D.

### [2026-06-27] Master → Grupa A: **ABC1=A** (D1B) + zasada kanonu

**ZAMKNIĘTE — nie pytaj ponownie:**
- **Mockup HUD D1B** (P0+P1) — Maciej **ABC1=A**, 2026-06-27. Wpięcie `hud.ts` → **Grupa F** (F-HUD), nie Twój zakres `main.ts`.
- A1-Q5, Q7, Q8, Q9, **Q11=A**, **A2-Q4=A**, revA, A1-Q12a/b=A, MAPA-F2-Q1 routing.

**Twoja praca:** patrz tabela **P1** powyżej. Handoffy do SILNIK — **przekazane F**; nie czekaj na drugą akceptację.

**NIE:** sign-off D1B, „czy wpinamy hud", pytania Masterowi o kanon.

### [2026-06-27] Kontekst: Civ V „Gdzie i co budować” (Master — nie ABC)

Źródło: [gry-online.pl poradnik Civ5](https://www.gry-online.pl/poradniki/sid-meiers-civilization-v/gdzie-i-co-budowac/z2a59c) (część za paywallem). Porównanie z naszym spec — **materiał dla agentów**, nie nowe pytania do Macieja.

**Dla Grupy A (A4/A5 — UX mapy, placement):**
- Civ: ulepszenia stawia **robotnik** na terytorium; my: tryb **Budowa na mapie** (decyzja 2A) — ghost-preview w MAPA, **nie wpięte** w kanon.
- Civ: **łodzie rybackie w mieście**; u nas w spec = ulepszenie **heksu** (+2 żywn.) — potwierdzić przy A4/B1.1 (Grupa B), nie zmieniać samodzielnie.
- Render 15 ulepszeń + posterunek/fort gotowe (MAPA); **granica terytorium** (linia C) — wizual, osobno od ekonomii.

**Świadomie ≠ Civ (nie kopiować):** terytorium pop-radius zamiast „wszystkie sąsiednie heksy”; brak jednostki Robotnik.

**Quick wins po D4 (lane MAPA + F):** tryb Budowa → main.ts; bonus drogi do ruchu (`ulepszenie_droga_ruch` w parametrach).

## Grupa A — Mapa świata (strategia)

### [2026-06-27] Master → Grupa A: PLAYTEST start mapy (A-START-01…05) — **PRIORYTET**

**Od Macieja:** cały pakiet startu mapy = **Twoja grupa (MAPA)**.

| ID | Co |
|----|-----|
| A-START-01 | Auto tryb budowy + „Załóż miasto” przy pierwszym wejściu |
| A-START-02 | Kamera max zoom |
| A-START-03 | Rzeki pod fog |
| A-START-04 | Minimap + fog |
| A-START-05 | Panel 🔨: opcja założenia miasta |

Po fix: `→ SILNIK: GOTOWE` → F bramka. **Nie** eskaluj do E ani osobno do F przed GOTOWE.

Szczegóły: `DO-MASTERA.md` tabela PLAYTEST start mapy.

### [2026-06-27] Master → Grupa A: PLAYTEST start mapy (A-MAP + A4) — ARCHIWUM

*(Superseded przez A-START-01…05 powyżej — jeden owner Grupa A.)*

### [2026-06-27] Master → Grupa A: **P0 flow startu gry** (Menu → mapa → pierwsze miasto)

**Kontekst Macieja:** mockup S0→S1→S2 **gotowy** (`A1-FLOW-EKRANY-GRY.md`). W **kanonie** (`main.ts`) kreator działa, ale po „Generowanie świata" gra **nie przechodzi** poprawnie dalej.

**Twoje zadania (weryfikacja, nie main.ts):**
1. Po starcie z kreatora: czy widać **mapę 3D** + **HUD D1B** (`hud.ts`)? Raport PASS/FAIL.
2. Czy gracz ma **jednostkę** na mapie (miecznik po usunięciu osadnika)? Kamera na graczu?
3. **Pierwsze miasto = ręcznie** (decyzja 7B): klawisz **B** na heksie — czy hint na dole ekranu jest **czytelny** po nowej grze? Jeśli nie — zaproponuj Maciejowi **jedno ABC** w **tym czacie** (np. auto-miasto vs tutorial overlay). **Nie** decyduj sam.
4. MAPA: czy `startPositions` z generatora powinny karmić `placeStartingUnits`? Audyt + handoff do F jeśli gap.
5. Raport → `DO-MASTERA.md` § A · flaga `→ SILNIK: GOTOWE` tylko jeśli lane UI/MAPA coś poprawił.

**NIE:** edycja `main.ts` (→ Grupa F).

---

## Grupa B — Miasto i ekonomia

### [2026-06-27] Master → Grupa B: **A1-Q15 — wytyczne wyliczania Power**

Od Macieja (Grupa A): **A1-Q15=A** — Power pełny na HUD; **wyliczanie → Grupa B**.

**Zadanie:** `dyspozycje/_handoff/A1-do-GRUPA-B_power-wyliczanie.md`

- Spec składników **ludnosc (18%)**, **miasta (14%)**, **gospodarka (12%)**
- Kontrakt API dla silnika (propozycja w handoff)
- Wpływ na dyplomację — Grupa D konsumuje; B nie rusza UI mapy

**Flaga:** CZEKA Grupa B · raport → `DO-MASTERA.md` § B

---

### [2026-06-26] Priorytet jutro

1. Paczka **B2-Q1…B2-Q5** (społeczeństwo) — format ABC z DYSPOZYCJA-STALA · **WYSŁANE, czeka odpowiedź Macieja**.
2. Po ABC → KROK A–G (UI lane: orderPanel, happinessBreakdown, zdrowie linia, usuń specjaliści, handoff alert buntu → A1).
3. Nie pytaj o HUD mapy ani A2-Q4.
4. Raport → `docs/czaty/DO-MASTERA.md` § Grupa B.

### [2026-06-26] Po B2 — kolejność

1. **B1-Q1…** (budowa) — gdy B2 zamknięte
2. **B4.1–B4.2**, **B5.1–B5.2** — doprecyzowanie UI

### [2026-06-27] Stan po `czaty` — Master (aktualizacja)

**ZAMKNIĘTE B2 (Maciej w czacie):** Q1=A, Q2=B, Q3=A, Q4=C, **Q5=C** (chip + ikona hex), Q6 — **paczka zamknięta**.

**Wdrożenie:** lane EKONOMIA+UI **GOTOWE** · Grupa F **F-B2-porzadek WPIĘTE** w kodzie (czeka bramka).

**Twoje teraz:**
1. Po ROBOCZA od F — **smoke**: panel miasto po **B**, Porządek, Zdrowie, kary P po turze.
2. **Nie** pytaj ponownie B2-Q1…Q6.
3. **CZEKA MAPA** (ikona 🔥 hex) — lane w **Grupie A**, nie Ty; Ty tylko weryfikuj po ich GOTOWE.

**P1 po F-PROD-SPAWN:** produkcja jednostki z kolejki → jednostka na mapie (weryfikacja § B).

Raport → `DO-MASTERA.md` § B.

### [2026-06-27] Master → Grupa B: zasada kanonu + B2

**ZAMKNIĘTE w tym czacie (nie pytaj ponownie):** B2-Q1…Q6 — **cała paczka**.

**Wdrożenie haków B2 w `main.ts`:** → **Grupa F** (F-B2 + F-B2-porzadek w kodzie). Ty: raportuj `→ SILNIK: GOTOWE` tylko dla **nowej** pracy lane UI.

**NIE:** ponowna paczka B2; nie blokuj F sign-offem.

### [2026-06-27] Kontekst: Civ V „Gdzie i co budować” (Master — nie ABC)

Źródło: poradnik Civ5 (gry-online.pl, wycinek). **Materiał pod B1 / D4** — użyj przy pytaniach ABC, nie duplikuj jako nową paczkę.

| Civ V | U nas | Status |
|-------|-------|--------|
| Obywatel na polu, **2 żywności**/turę | **1 żywność**/os. (normal) | świadomie inne — ewent. doprecyzować w B (nie teraz) |
| Farma +1; tech Nawóz/Służba cywilna | Farma +1; irygacja +2 przy rzece; **brak** tech-stacku Civ | OK — nie kopiować |
| Luksus **+5 szczęścia** | Luksus → **Wealth (W)** (D3=A) | świadomie inne |
| Kopalnia +1 prod., wzgórza, luksusy | Kopalnia +2 Praca; luksus via **plantacja** | OK |
| Kamieniołom → marmur +5 | Kamieniołom → Praca+kamień | OK |

**Główna luka integracyjna (technika, po D4):**
- `terrain-improvements.json` + render **≠** `tileYield()` — bonusy ulepszeń **nie wpływają na turę** (`WorkedTile` bez pola `ulepszenie`).
- `assignWorkedTiles` w silniku OK; panel czasem używa starego radius — dopiąć przy B1.4.

**Priorytet po B2 ABC (kolejność bez zmian):**
1. **D4** — Maciej: Excel `Ulepszenia-terenu.xlsx` → GO wpięcia
2. **B1.1** — panel miasta vs mapa (Civ = robotnik; my = hybryda)
3. **B1.4** — auto vs ręczne pola pracy (Civ = dużo mikro)
4. Raport → `→ SILNIK: GOTOWE` → Grupa F (ROBOCZA)

**NIE proponować na v1.0:** specjaliści Civ5 (B2-Q4 odłożone), płaskie +5 luksusów, Fertilizer/Civil Service 1:1.

**Odłożone:** B2-Q4 specjaliści — po v1.0.

### [2026-06-27] Master → Grupa B: **P0 flow — pierwsze miasto**

**Po starcie gry** gracz **nie ma miasta** — zakłada je klawiszem **B** (silnik). Po założeniu:
1. Zweryfikuj: `configureCityPanel` / panel miasta otwiera się i działa na **pierwszym** mieście (B3 suwaki, Wealth).
2. Jeśli panel pusty lub crash — raport `DO-MASTERA` § B + `→ SILNIK: GOTOWE` z listą plików.
3. **Nie** zmieniaj reguły founding bez ABC Macieja w **tym** czacie.

### [2026-06-27] Master → Grupa B: **P1 produkcja jednostek**

Po **F-PROD-SPAWN** (Grupa F): zweryfikuj w grze — kolejka produkcji jednostki → po turach **jednostka na heksie miasta**. Raport PASS/FAIL w `DO-MASTERA` § B.

**Panel miasta:** produkcja budynków OK · suwaki B3 OK · **Kup jednostkę** instant OK.

---

## Grupa C — Walka

## [2026-06-27] KANON — granica A vs C (decyzja Macieja)

Diagram: `docs/grupa-c/GRANICA-C-vs-MAPA.md` — **obowiązuje wszystkie grupy**.

**Grupa A:** A2, A3, C3, C1 preBattle · **Grupa C:** C2, C4 od wyboru Auto/Ręczna.

### [2026-06-27] Maciej — deployment Z WALKI → NA MAPĘ

**Decyzja:** Rozstawianie przed walką = **mapa świata** (Grupa A), **nie** faza deploy w C2.

**Ty (Grupa C) — kolejność:**
1. **STOP** deployment w `battleScene` — nie rozwijaj, nie pytaj Macieja o rozstawianie na polu bitwy.
2. **Czekaj** ROBOCZA + playtest **C2** (walka po Auto/Ręczna).
3. **C4-Q1** balans w walce — jedyne otwarte ABC tutaj (pełny format).
4. Opcjonalny handoff: `C-do-MAPA_pozycje-przed-walka.md` (kontrakt wejścia z mapy).

**F:** `deploy: false` — po spec od A, nie teraz.

**Nie pytaj:** C1 layout, C3, deployment, ruch na mapie.

### [2026-06-27] Maciej — całe C3 → MAPA · Grupa C = od preBattle

1. **C2-Q2–Q7** (mapa bitwy) LUB Maciej: „akceptuję D5=B".
2. **NIE** pytaj o A2-Q4 (to mapa świata, Grupa A).
3. Raport → `docs/czaty/DO-MASTERA.md` § Grupa C.

### [2026-06-27] Maciej — całe C3 → MAPA

**Wszystkie C3-Q1…Q10** + oblężenie na mapie = **Ty (MAPA)**, nie Grupa C.  
Handoff: `dyspozycje/_handoff/C3-do-MAPA_paczka-ABC-Q1-Q10.md`  
Grupa C zaczyna od **preBattle (C1)**.

### [2026-06-27] Maciej — granica Grupa C vs MAPA

**C3-Q1** (start oblężenia) → **Ty (Grupa A / MAPA)** — handoff: `dyspozycje/_handoff/C3-Q1-do-MAPA_start-oblezenia.md`  
**Grupa C** = od **preBattle (C1)** wzwyż — nie pytają o C3-Q1.  
Granica: `docs/grupa-c/GRANICA-C-vs-MAPA.md`

**Ty (MAPA):** zadaj Maciejowi C3-Q1 (ABC w handoffie) + reszta C3 na mapie świata.

### [2026-06-27] Stan po `czaty` — Master (aktualizacja)

**ZAMKNIĘTE:** C1-Q1…Q5, **C2-Q2…Q7**, D5=B — **F-C1 WPIĘTE** w kodzie.

**Grupa F kolejka:** **F-C2** (bitwa TW UX w `battleScene`) — po bramce ROBOCZA; lane UNITS **GOTOWE DO WPIĘCIA**.

**Ty teraz:**
1. **Nie** blokuj F ponowną akceptacją C2.
2. **C3 oblężenie na mapie** → **Grupa A (MAPA)** — C3-Q1 handoff gotowy; **nie** pytaj w tym czacie.
3. Przygotuj / uzupełnij handoff `C3-do-SILNIK_atak-miasta.md` (atak miasta bez oblężenia — spec zamknięty C1).

Raport → `DO-MASTERA.md` § C.

### [2026-06-27] Master → Grupa C: zasada kanonu + C2/C1

**ZAMKNIĘTE (nie pytaj ponownie):** C2-Q2…Q7, D5=B. Wdrożenie `preBattle` / bitwa → **Grupa F** (F-C1, bramka).

**Ty:** tylko **nowe** ABC w **tym** czacie, jeśli OTWARTE i bez wcześniejszej odpowiedzi Macieja. **NIE** blokuj F drugą akceptacją.

### [2026-06-27] Master → Grupa C: flow startu

**Nie blokuj** P0 startu. C1/C2 — po Grupie F (bramka). Przy `master`: potwierdź tylko, że **preBattle nie psuje** pierwszej tury przed pierwszym miastem (smoke mentalny).

### [2026-06-27] Master → Grupa C: **P2 walka o miasta**

**Gotowe w silniku:** jednostka→jednostka → preBattle → BattleScene 3D → powrót na mapę (C1/C2 lane).

**Brakuje (→ Grupa F, nie Ty):**
- Atak **wrogiego miasta** (klik miasto + armia) — dziś otwiera panel jak własne
- **Oblężenie C3** — tick w silniku jest, ale `oblegane` nigdy nie startuje z UI; panel oblężenia **OTWARTE ABC**

**Ty:** przygotuj handoff `C3-do-SILNIK_atak-miasta.md` jeśli spec zamknięty; **jedno ABC** Maciejowi o panel oblężenia (C3) — **w tym czacie**, pełny opis.

---

### [2026-06-26] Routing D2 — korekta Maciej (MAPA vs Grupa A)

**MAPA (MAPA-F2-Q1):** obok minimapy — **toggle ON/OFF** zasięgu **kultury** i **naszej religii** na mapie 3D. Handoff: `MAPA-do-UI_kultura-religia-zasieg-minimapa.md`.

**Grupa A (A1-Q12):** **klik ikony** → co jest **w środku** (overlay/panel). **Nie** wygląd toggle — Grupa D/Nauka odpisana.

**Grupa D:** D2-Q1/Q2 **→ przeniesione na A1-Q12a/b** — nie pytać o treść panelu w czacie D.

---

### [2026-06-26] Routing D2 — ikony kultura/religia przy minimapie *(superseded powyżej)*

**Do Grupy A (MAPA/UI HUD):** przy minimapie tylko **toggle zasięgu kultury** i **toggle zasięgu religii** na mapie świata (wizualizacja heksów). **Nie** treść panelu — to Grupa D.

**Do Grupy D:** po kliknięciu ikon — **co jest „w środku"** (overlay/panel, dane, akcje). D2-Q1, D2-Q2 OTWARTE w `D2-kultura.md`.

---

### [2026-06-26] Priorytet jutro

1. **D2-Q1, D2-Q2** — treść panelu po kliknięciu ikon kultura/religia (nie toggle zasięgu — to A).
2. D1-Q1, D1-Q2, D3-Q1, D4-Q1 — doprecyzowania (paczka zaległa).
3. Raport → `docs/czaty/DO-MASTERA.md` § Grupa D.

### [2026-06-27] Korekta routing — Master

**D2-Q1/Q2 treść panelu → przeniesione na A1-Q12a/b (Grupa A).** W czacie D **nie pytaj** o overlay po kliku ikon.

**Grupa D robi:** D1 (drzewko), D3 (dyplomacja akcje), D4 (bonusy) — implementacja, decyzje zamknięte. Brak wpisu w `DO-MASTERA` — **zrób raport postępu** przy `master`.

### [2026-06-27] Sesja autonomiczna Master — raport wymagany

Przy następnym `master` w czacie D:
1. Stan lane vs handoffy (`UI-do-MASTER_drzewko-nauki-rewire.md`, bonusy RDY-01, dyplomacja panel).
2. Co gotowe do `→ SILNIK: GOTOWE` vs co czeka na HUD D1B / Grupa A.
3. **Nie pytaj** o treść panelu kultura/religia (→ A1-Q12a/b, **ZAMKNIĘTE**).

### [2026-06-27] Master → Grupa D: zasada kanonu

**D1–D4 decyzje ZAMKNIĘTE** w KARCIE — implementacja lane, **nie** ponowne ABC.

**HUD D1B:** **ABC1=A** (2026-06-27) — **nie** czekaj na sign-off; F-HUD w toku.

**Ty:** raport postępu + `→ SILNIK: GOTOWE` dla gotowych handoffów. **NIE** D2 overlay (→ Grupa A).

### [2026-06-27] Master → Grupa D: **E1 cywilizacje startowe** (priorytet)

**Od Macieja (Grupa E, ABC 4=A):** roster **9 typów**; na **małej mapie** nie może być 9 — **proporcjonalnie mniej**. Menu rywali **±1** — zamknięte, nie pytaj ponownie.

**Zadanie D:**
1. Przeczytaj `docs/grupa-e/handoff/E1-do-GRUPA-D_cywilizacje-startowe.md`
2. Audyt: `civs.json`, `newGameMapDefaults.ts`, `main.ts` `aiOwnerCivMap`, `placeStartingUnits`
3. Domknij regułę przypisania typów AI + test unikalności
4. Raport → `DO-MASTERA.md` § Grupa D · handoff do SILNIK jeśli potrzeba

**Nie Twój zakres:** Ziemia preset (3=A MAPA OK), ±1 UI (4=A OK).

### [2026-06-27] Master → Grupa D: **P2 bonusy + dyplomacja**

**Stan:** D1–D4 decyzje **ZAMKNIĘTE**. D4-RDY01 — lane częściowo (handoff hub gotowy).

| Zadanie | Kto | Status |
|---------|-----|--------|
| Export bonusów Excel→JSON | CYW lane | sprawdź `export-bonusy-cyw.py` |
| Bonusy w bitwie 3D | UNITS | moduł gotowy → **F-C2** / F-D4 |
| Bonusy w UI (newGame, preBattle) | UI | sprawdź handoff `…-do-UI_bonusy-wyswietlanie.md` |
| Wiązania ownerId→bonusy | **Grupa F** F-D4 | P2 po P0 bramce |

**Dyplomacja:** panel read-only w grze — **nie blokuj** P0. ABC akcji gracza — **odłożone** (nie pytaj Macieja teraz).

Raport → `DO-MASTERA` § D przy postępie lane.

---

## Grupa E — Meta / start / AI

### [2026-06-27] **P0 — INTEGRACJA GRYWALNA** (Maciej → Master → E → F)

**Problem:** mockupy (`UI/Makieta-*`) i silnik nie są zsynchronizowane; brak jednego dokumentu „co z czym połączyć”. Maciej testuje `Gra-podglad.html` — musi być **jeden** flow: menu → kreator → mapa.

**Dyspozycja (CZYTAJ NA START):** `dyspozycje/_handoff/MASTER-do-E_integracja-grywalna.md`

**Wykonaj (Grupa E):**
1. **E-P0-01** — fix E1-UX-01 (`newGameFlow.ts`, nawigacja kroków 2–4, etykieta krok 5 „Generowanie”).
2. **E-P0-02** — wypełnij handoff: `dyspozycje/_handoff/E-do-SILNIK_wpiecie-grywalne.md` (mapa callbacków → F).
3. **E-P0-03** — baner + link „Gra (kanon)” w `UI/Makieta-START.html`.
4. **E-P0-04** — raport `→ SILNIK: GOTOWE` w `DO-MASTERA.md` § E.

**NIE:** `main.ts`, `Gra-podglad.html` (build = Grupa F po Twoim handoffu).

**Po `→ SILNIK: GOTOWE`:** Grupa F wdraża wg handoffu + `F-KOLEJKA-P0.md` → jeden build kanonu.

---

### [2026-06-27] Maciej — playtest scenariusz WALKA na mapie (C1+C2)

**Zlecenie:** osobny podgląd — armia gracza (~15 jedn.) + miasto AI + słaba jednostka do ataku → preBattle → bitwa 3D → powrót na mapę.

**Status:** **ZROBIONE** (2026-06-27) — `Gra-podglad-PLAYTEST-WALKA.html` (dwuklik = mapa + armia + miasto AI + Oszczepnik)

**Nie wystarczy klawisz T** ani `Gra-podglad-BITWA.html` / `OBLEZENIE-BITWA` (omijają mapę). Spec: `docs/master/PLAYTEST-WALKA-MAPY-SPEC.md`  
Handoff: `dyspozycje/_handoff/MASTER-do-F_playtest-walka-mapa.md` · **P0**

**Wykonaj (Grupa F):**
1. `startPlaytestWalkaMapy()` + publish `Gra-podglad-PLAYTEST-WALKA.html`
2. Menu „Playtest walki” lub `?playtest=walka`
3. Scenariusz **A** (atak jednostki) + **B** (atak miasta — koordynacja z A jeśli C3)
4. Bramka → `→ MASTER: GOTOWE-ROBOCZA`

**Maciej:** czeka na plik — testuje tylko ten podgląd (nie Node).

### [2026-06-27] Master → Grupa F: PLAYTEST start mapy — **CZEKA Grupa A**

Batch A-START-01…05 = **Grupa A (MAPA)**. F **nie zaczyna** przed `→ SILNIK: GOTOWE` z § A.

Potem: bramka → `Gra-podglad-ROBOCZA.html`.

### [2026-06-27] Master → Grupa F: PLAYTEST start mapy (po lane A/E) — ARCHIWUM

### [2026-06-27] Master → Grupa E: PLAYTEST E1-UX-01 (kreator — nawigacja)

**Od Macieja (playtest ROBOCZA):** dolny pasek za daleko — potwierdzone: **krok 2, 3, 4 Ustawienia rozgrywki**. Kroki 1 INTRO OK. Nawigacja + `ROZPOCZNIJ GRĘ` tuż przy kartach wyboru (kroki 2–5).

**Wykonaj:** lane **UI** — `gra/src/ui/newGameFlow.ts` (layout/CSS, bez `main.ts`).  
**Po fix:** `→ SILNIK: GOTOWE` w `DO-MASTERA` § E → Grupa F bramka.

Szczegóły: `DO-MASTERA.md` § Grupa E · wpis PLAYTEST E1-UX-01.

### [2026-06-26] Priorytet jutro

1. Status E1/E3 (D13, D14) — pytania tylko o luki w KARCIE.
2. Raport → `docs/czaty/DO-MASTERA.md` § Grupa E.

### [2026-06-27] Master → Grupa E: zasada kanonu

**E1 defaulty:** lane UI+MAPA **GOTOWE**; wpięcie `main.ts` (**generujSwiat**, seed, typ) → **Grupa F** — **nie** pytaj Macieja o wdrożenie techniczne.

**Ty:** tylko **nowe** ABC (E1-Q6…Q8, E3) jeśli OTWARTE w KARCIE i bez odpowiedzi w **tym** czacie.

### [2026-06-26] Master → Grupa F + E: E1 pakiet od Grupy E

**Od Macieja:** decyzje **gameplay tylko ABC** — agent **nie** decyduje sam (reset gracza, Brąz+tech, Ziemia layout, zakres rywali).

**Przekaz `czaty` → F (P0/P1 po bramce):**

| Batch | Co | Handoff |
|-------|-----|---------|
| **F-E1** | E1 w `main.ts` już wpięte — **bramka ROBOCZA** | `_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md` |
| **F-E1-ABC** | Po literach Macieja Q9–Q12 | `docs/decyzje/E1-PYTANIA-DO-SILNIKA.md` |

**Master robi teraz:**
1. Czyta `DO-MASTERA.md` § Grupa E
2. **Nie** publikuje finalnej z interpretacją Q9–Q12
3. Opcjonalnie: przedstaw Maciejowi **E1-Q9…Q12** w czacie E (max 4 — jedna paczka)
4. **Grupa F:** bramka → `Gra-podglad-ROBOCZA.html` → `→ MASTER: GOTOWE-ROBOCZA` (Master **nie** odpala bramki)

**Grupa E:** nie wysyła więcej pytań gameplay poza charterem E1–E3; reszta → Master.

### [2026-06-27] Master → Grupa E: **P0 weryfikacja kreatora nowej gry**

**Stan:** `newGameFlow.ts` (5 kroków) + `mainMenu.ts` wpięte. `generujSwiat` w `doStartGame` — kod F-A2 (w źródle, nie w starym HTML).

**Zadania:**
1. Kreator krok 1→5: czy `onStart(params)` ma `civId`, `epochId`, `typSwiata`, `seed`, `mapSize`, `rivals`.
2. Krok 5 — czy UI znika i przekazuje sterowanie do silnika.
3. E1-Q9…Q12 — tylko jeśli Maciej nie odpowiedział **w tym czacie**.
4. Raport → `DO-MASTERA` § E.

**NIE:** `main.ts` → Grupa F (F-START-FIX).

### [2026-06-26] E1-Q9…Q12 — paczka u Macieja

Grupa E wysłała ABC Q9–Q12 w czacie. **Czeka litery** → F batch korekty (`F-E1-ABC`). Bramka F-E1 może iść **równolegle** z **provisional** defaultami (nie blokuj P0).

### [2026-06-27] Master → Grupa E: stan po skanie

**Zamknięte w KARCIE:** defaulty E1 (Rzym, Kamień, Normal, Standard, 6 AI, Kontynenty…).

**OTWARTE:** E1-Q9…Q12 — **tylko Ty** pytasz Macieja w **tym czacie** (max 4 litery, jedna paczka). Po odpowiedzi → `DO-MASTERA` § E → Master przekaże F-E1-ABC.

**Nie blokuj:** F-START-FIX, F-BRAMKA, F-E1 provisional.

---

## Grupa F — Silnik (implementacja main.ts)

### [2026-06-27] Grupa B → F: **F-B-PILNE** (P0 — wykonaj teraz)

**Od:** Grupa B (EKONOMIA + UI) · **Maciej:** nie wpiąć sam — przekazać silnikowi.

| Co | Gdzie |
|----|--------|
| **Handoff główny** | `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_PILNE-luki-2026-06-27.md` |
| **UNITS (głód HP)** | `dyspozycje/_handoff/UNITS-do-SILNIK_army-starvation-hp.md` |
| **Kolejka F** | `dyspozycje/F-KOLEJKA-P0.md` → wiersz **F-B-PILNE** |
| **Indeks B** | `dyspozycje/GRUPA-B-ZADANIA-PILNE.md` |

**5 kroków w main.ts:** (1) `getResourceAccess` (2) `getRevolt`+warning (3) 2A inputs (4) `applyArmyStarvationHpLoss` (5) rebuild ROBOCZA.

**Po PASS:** `→ MASTER: GOTOWE-ROBOCZA F-B-PILNE` w `SILNIK-DO-MASTERA.md` + `DO-MASTERA.md` § F.

---

### [2026-06-27] Master → Grupa F: **PT-C3-01** — 2. jednostka przy mieście (playtest oblężenia)

**Od Macieja (playtest ROBOCZA `6aedd5ce…`):** walka 1v1 **OK** (preBattle → bitwa). Do testu **oblężenia / ataku miasta** brakuje **drugiej jednostki gracza na heksie sąsiadującym z miastem AI**.

| Pole | Wartość |
|------|---------|
| **Plik kodu** | `gra/src/game/playtestWalkaMapy.ts` |
| **Dziś** | 1× Hastati + 1× Falanga + miasto Ateny w linii (gracz—wrog—miasto) |
| **DoD** | **+1 jednostka gracza** na wolnym heksie **sąsiadującym z miastem** (np. Lucznik), pełny ruch; hint zaktualizowany |
| **Publish** | bramka → `Gra-podglad-ROBOCZA.html` + `Gra-podglad-PLAYTEST-WALKA.html` → `→ MASTER: GOTOWE-ROBOCZA` |
| **Spec** | `docs/master/PLAYTEST-WALKA-MAPY-SPEC.md` § scenariusz B |

**Nie czekaj na C3 od Grupy A** — to tylko **układ jednostek** w presetcie. Logika oblężenia (C3) = lane A osobno.

**Priorytet:** P1 (po obecnym kanonie) — **nie blokuje** promocji `6aedd5ce` (walka PASS).

Szczegóły: `DO-MASTERA.md` wpis **PT-C3-01**.

### [2026-06-27] **P0 — OTWARTA KOLEJKA** (Maciej zablokowany — wykonaj TERAZ)

**Master przyznaje błąd:** kolejka była zamknięta jako „PUSTA” podczas gdy Maciej miał otwarte bugi playtestu. **Nie zamykaj P0 bez raportu.**

**Jedyny plik startowy:** `dyspozycje/F-KOLEJKA-P0.md`

| ID | Zadanie | Status |
|----|---------|--------|
| F-P0-01 | Bramka + ROBOCZA + PLAYTEST-WALKA + md5 | **DO ZROBIENIA** |
| F-P0-02 | A-START (0 jedn., Załóż miasto, fog, minimap, victory, diplo) | weryfikuj buildem |
| F-P0-03 | Playtest walki mapa C1+C2 | weryfikuj buildem |
| F-P0-04 | `→ MASTER: GOTOWE-ROBOCZA` | **BLOKUJE** |

Raport: `SILNIK-DO-MASTERA.md` + `DO-MASTERA.md` § F.

---

### [2026-06-27] STAN KODU — Master (po audycie F + `master`) — ARCHIWUM

| Batch | Status kodu | Czeka |
|-------|-------------|-------|
| F1/F2 save, B3, wealth | ✅ w main | bramka |
| F-A2 generujSwiat | ✅ w main | bramka |
| **F-START-FIX** | ✅ **DONE** (L3230 `szerokoscQ×wysokoscR`) | — |
| F-B2 hooks | ✅ w main | bramka |
| F-B2-porzadek | ✅ w main | bramka |
| F-C1 preBattle | ✅ w main | bramka |
| F-HUD część 1–2 | 🟡 w main (kulturaRate, chip buntu) | bramka |
| **F-HUD-2** (A2-Q4, A1-Q9, A4 budowa) | ✅ w main | bramka |
| B2-Q5 ikona hex 🔥 | ✅ w main + cities.ts | bramka |
| F-C2 battleScene | ✅ w main (deploy+survivors) | bramka |
| F-PROD-SPAWN | ❌ | Master P1 |
| advanceEmpireFood | ⛔ stub | B5 — nie wpinaj |

**Audyt F:** `docs/czaty/grupa-f/AUDYT-PELNY-2026-06-27.md` · hub `docs/czaty/grupa-f/`

**KOLEJNOŚĆ:**
1. ~~F-START-FIX~~ ✅ · ~~F-HUD-2~~ ✅ · ~~F-BRAMKA~~ ✅ (Master 2026-06-27, md5 `d813159b`)
2. **Opus review** → `Gra-podglad.html` — **TERAZ**
3. Playtest Macieja (checklista w czacie Master)
4. **F-PROD-SPAWN** · civ-bonusy 4 FAIL (lane D P2)

### [2026-06-27] Master — bramka + pełne testy WYKONANE

Od: Master Silnik  
Raport: `docs/master/WERYFIKACJA-SILNIK-2026-06-27.md`  
Opus: `docs/decyzje/OPUS-REVIEW-QUEUE.md` (wpis aktywny)  
→ **Opus 4.8 Ask** — review ROBOCZA · po APPROVE Master promuje finalną

### [2026-06-27] Master ← Grupa D: testy lane CYWILIZACJE w bramce (Maciej 7B)

**Priorytet:** w ramach **F-BRAMKA** (przed ROBOCZA) uruchom:

```powershell
cd gra
node tools/civ-bonusy-test.cjs
node tools/diplomacy-test.cjs
node tools/ai-test.cjs
```

Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_testy-grupa-d-bramka.md`  
Przy PASS → wpis `TESTY-GR-D: ZIELONE` w `DO-MASTERA` § D.  
Maciej **nie** testuje lokalnie (decyzja 7B).

**Po bramce — dyspozycje z Grupy D (Maciej 3A):**
- UNITS: bitwa 3D + jednostki spec. (`…-do-UNITS_bonusy-walka-bitwa-jednostki-spec.md`)
- UI: bonusy newGame/preBattle + modal wojny D3-Q1=A (`…-do-UI_dyplomacja-D3Q1-modal.md`, `…-do-UI_bonusy-wyswietlanie.md`)

**Cleanup (czeka Maciej):** `docs/czaty/grupa-f/PROPOZYCJA-ARCHIWUM.md` — 5 starych handoffów + `SILNIK.md`

---

### [2026-06-27] STAN KODU — Master (po skanie `DO-MASTERA` + `SILNIK-DO-MASTERA`) — ARCHIWUM

---

*(Poniżej: historia dyspozycji F — przy `master` obowiązuje tabela **STAN KODU** powyżej.)*

**Od Grupy F (automatyczny skan):**

1. **P0:** uruchom `gra/tools/bramka-test-publish.ps1` → ROBOCZA → Opus (agent F bez Node).
2. **Grupa A:** A1-Q9 WYKONAJ, A2-Q4 panel [H] — patrz `DO-MASTERA` § A „F → Grupa A”.
3. **MAPA:** B2-Q5 `getRevolt` w `cities.ts` — patrz `DO-MASTERA` § A „F → MAPA”.
4. **A4-D4:** nowy temat Grupy A — P2 po MAPA+UI GOTOWE; F nie rusza BLK-04 teraz.
5. **F kolejka:** F-C2 po ROBOCZA; E1-Q9–Q12 bez ABC Macieja.

---

**Maciej ABC1=A (2026-06-27):** mockup D1B zaakceptowany — **wykonaj F-HUD** (nie czekaj na sign-off).

**Zasada:** nie pytaj Macieja o test/kanon — bramka → `Gra-podglad-ROBOCZA.html` → `→ MASTER: GOTOWE-ROBOCZA`.

**Kolejność:** F-BRAMKA (cały dotychczasowy kod) → F-HUD → F-D4 audyt.

| Batch | Handoff |
|-------|---------|
| F-HUD | `UI-do-MASTER_hud-D1B-mockupy.md`, `UI-do-MASTER_hud-wojna-A1Q5.md`, `UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md`, `UI-do-MASTER_map-layers-minimap-A1Q6.md` |

---

**Spec:** `docs/czaty/SILNIK-MASTER-FLOW.md`

**Grupa F — AUTOMATYCZNIE po `master` / GOTOWE od zakładek:**
1. Patch `main.ts` (tylko elementy GOTOWE, respektuj BLOKADY)
2. Bramka: typecheck + suite + build `/tmp`
3. Publikuj **`Gra-podglad-ROBOCZA.html`**
4. Raport: `→ MASTER: GOTOWE-ROBOCZA` (SILNIK-DO-MASTERA + DO-MASTERA § F)
5. **NIE** `Gra-podglad.html` · **nie pytaj** Macieja

**Kolejka (czytaj `DO-MASTERA` § A–E co skończone):**
- F1 save/B3 — jeśli jeszcze bez TEST: wykonaj pipeline na obecnym main
- Kolejne batchy gdy lane zgłosi `→ SILNIK: GOTOWE`

**BLOKADY:** tylko `advanceEmpireFood` (stub B5). **HUD D1B** — **ABC1=A** (2026-06-27) → **F wpinaj F-HUD** po bramce (bez drugiej akceptacji Macieja).

### [2026-06-27] Kolejka po `czaty` — routing Master → F

**Spec routingu:** `docs/czaty/MASTER-ROUTING-2026-06-27.md`

**Wykonaj po `master` (kolejność):**

| Priorytet | Batch | Zadanie | Handoff |
|-----------|-------|---------|---------|
| **P0** | F-BRAMKA | Pipeline F1+F-A2 → `Gra-podglad-ROBOCZA.html` | `bramka-test-publish.ps1` |
| **P1** | **F-E1** | E1 start (seed, typSwiata, era) — bramka ROBOCZA; ABC Q9–Q12 **provisional** | `_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md` |
| **P1** | F-B2 | `getOrderState`, `getCityHealth` w obu `configureCityPanel` | `UI-do-MASTER_B2-spoleczenstwo.md` |
| **P1** | **F-C1 dokończenie** | Częściowo wdrożone — brakuje: `defaultAction:'manual'`, skład multi-unit D8=A, Q5 onCancel | **`C1-do-SILNIK_batch-test.md`** |
| **P1** | **F-HUD** | D1B `hud.ts` + A1-Q5/8/9 | `UI-do-MASTER_hud-D1B-mockupy.md` itd. (**ABC1=A**) |
| **P2** | F-D4 | Audyt wiązań `civBonusyForOwnerId` (bez nowej logiki) | `CYWILIZACJE-do-MASTER_bonusy-RDY01-delegacja.md` |

Po każdym P1/P2: **osobny** backup `main.ts.bak-SILNIK-YYYYMMDD-<id>` → bramka → ROBOCZA (nie kanon).

**NIE ruszaj:** `advanceEmpireFood` (stub). **HUD D1B** — w kolejce F po bramce batchu kodowego.

---

### [2026-06-27] BATCH AUTONOMOUS — Master (sesja 2h)

**Zlecenie Grupie F (wykonaj bez pytania Macieja):**

| # | Zadanie | AC |
|---|---------|-----|
| F-A1 | **F1 pipeline** | Bramka PASS → `Gra-podglad-ROBOCZA.html` → `→ MASTER: GOTOWE-ROBOCZA` |
| F-A2 | **generujSwiat** | W `doStartGame`: zamień `menuLabelToDims` na `generujSwiat(seed, rozmiar, typ)` z `newGameMapDefaults.ts` |
| F-A3 | Backup | `main.ts.bak-SILNIK-20260627-generujSwiat` |

**BLOKADY:** tylko `advanceEmpireFood` (stub B5).

**F-B2:** ✅ kod. **F-C1:** ⚠️ **częściowo** — dokończ wg `C1-do-SILNIK_batch-test.md` przed bramką. **F-HUD:** ✅ autoryzowane ABC1=A.

### [2026-06-27] Grupa C → Grupa F: C1 START (bez ABC Macieja)

**Wykonaj teraz** (handoff: `dyspozycje/_handoff/C1-do-SILNIK_batch-test.md`):

1. `showPreBattle(..., { defaultAction: 'manual' })` — oba wywołania (Q2b=B)
2. Skład multi-unit D8=A — heks + sąsiedzi w promieniu 1 → `PreBattleInfo` + `BattleScene`
3. `onCancel` — Wycofaj bez zużycia ruchu (Q5=A)
4. Bramka → `Gra-podglad-ROBOCZA.html` → raport `→ MASTER: GOTOWE-ROBOCZA`

Moduł UI **GOTOWY:** `gra/src/ui/preBattle.ts` · mockup: `UI/Makieta-preBattle.html`

**Master równolegle:** OPUS-REVIEW-QUEUE, STATUS, DZIENNIK.

**Bramka bez Node u agenta:** raportuj `→ MASTER: BLOK BRAMKA` — **nie** proś Macieja o terminal. Master rozwiązuje (subagent / własny shell).

### [2026-06-27] Master → Grupa F: **P0 F-START-FIX** (bloker flow Macieja)

**Diagnoza Master (kod `main.ts`, audyt 2026-06-27):**

| # | Problem | Lokalizacja | Naprawa |
|---|---------|-------------|---------|
| **1** | **`ReferenceError: newW is not defined`** — wywala `doStartGame` na końcu | `main.ts` ~3192 `console.log` | Użyj `map.szerokoscQ` × `map.wysokoscR` lub `rozmiarToDims(rozmiar)` |
| **2** | **Brak opublikowanego bundle** | `Gra-podglad-ROBOCZA.html` nie istnieje | **F-BRAMKA** — `bramka-test-publish.ps1` |
| **3** | Po starcie: **0 miast** — gracz musi **B** na heksie | zamierzone (7B) | Po fix #1: `showHintMessage('…najedź na heks i naciśnij B…', 8000)` na końcu `doStartGame` |
| **4** | Opcjonalnie: kamera na jednostkę gracza | `doStartGame` | `camCtrl` focus na `units.find(u=>u.ownerId===0)` |
| **5** | `renderLoop()` wołane ponownie | `doStartGame` | Upewnij się, że nie duplikujesz pętli rAF (flaga `loopStarted`) |

**Kolejność:** **F-START-FIX (#1+#3)** → **F-BRAMKA** → raport `→ MASTER: GOTOWE-ROBOCZA` → dopiero F-HUD.

**AC (Definition of Done):**
- Menu → Nowa gra → defaults → Generowanie → **mapa widoczna**, HUD, jednostka gracza, hint o **B**
- B na lądzie → miasto założone, panel miasta OK
- Bramka PASS + `Gra-podglad-ROBOCZA.html`

**Handoffy:** `_handoff/UI-MAPA-do-MASTER_E1-defaulty-startu.md` (E1) · generator: `gra/src/map/generator.ts` (`generujSwiat` **istnieje**)

### [2026-06-27] Master → Grupa F: **P1–P3 pełny flow gry** (kolejka po F-START-FIX)

| Priorytet | Batch | Co | Lane / handoff |
|-----------|-------|-----|----------------|
| **P1** | **F-PROD-SPAWN** | Po `advanceProduction` jednostka → `units.push()` + sync renderer | `production.ts` (caller spawns) |
| **P1** | **F-HUD** | D1B komplet (ABC1=A) | `UI-do-MASTER_hud-D1B-mockupy.md` itd. |
| **P1** | **F-GARNIZON** | `getUnitsAt` w `configureCityPanel` | `cityPanel.ts` |
| **P2** | **F-ATK-MIASTO** | Klik wrogie miasto + jednostka → preBattle (mury / bez) | C1/C3 spec zamknięte |
| **P2** | **F-PB-AI** | Atak AI na gracza → overlay preBattle (symetria C1-Q1) | `preBattle.ts` |
| **P2** | **F-ENDTURN-GATE** | A1-Q9 WYKONAJ + `canEndTurn` | `UI-do-MASTER_wykonaj-endTurn-gate-A1Q9.md` |
| **P2** | **F-EMPIRE-FOOD** | `advanceEmpireFood` + HUD (B5) | `EKONOMIA-do-UI_zywnosc-hud.md` |
| **P3** | **F-SIEGE-START** | `city.oblegane=true` z gameplayu + szturm→preBattle | C3 — **czeka ABC** na panel |
| **P3** | **F-MENU-RETURN** | `onOpenMenu` w HUD → `showMainMenu` | A1-FLOW |

Po każdym batchu: backup → bramka → ROBOCZA.

### [2026-06-27] Master → Grupa F: **OBL-MAP-01 ZAMKNIĘTE** — kolejka wolna

**Maciej PLAYTEST OK** · kanon `bf99e18b9f164dd1a734bbb5114755f1` · start: `START-GRA.html`.

**Nie ruszaj** OBL-MAP-01 — zamknięte.

**Czekaj dyspozycji** na jeden z batchy (Master wskaże w nowym wpisie):
- **F-START-UX** (z E): `mainMenu.ts` = menu 5=C · domyślny boot bez redirect na mockup HTML
- **F-A-START** (z A): onboarding po New Game (tryb budowy, kamera, hint B)
- Inny handoff z `OD-MASTERA`

**Po batchu:** `bramka-test-publish.ps1` → `→ MASTER: GOTOWE-ROBOCZA` → Master → Maciej.

---

## Wpisy globalne (wszystkie grupy)

### [2026-06-27] P0 — łańcuch startu gry (Master)

**Cel Macieja:** Menu → kreator → **auto-generacja mapy** → gra na mapie → **założenie miasta** → dalsza rozgrywka.

**Gotowe:** mockupy HTML (S0–S2) · `mainMenu.ts` + `newGameFlow.ts` · `generujSwiat()` w MAPA · wpięcie `doStartGame` (F-A2, **tylko w źródle**).

**Nie działa u Macieja bo:** (1) bug `newW/newH` w `doStartGame`, (2) stary `Gra-podglad.html` bez bramki, (3) brak tutorialu o klawiszu **B**.

**Właściciele:** F = fix + bramka · E = kreator · A = UX mapy/HUD · B = panel po founding.

### [2026-06-27] Roadmap flow E2E — przypisanie grup

| Faza | Grupa | Zadanie |
|------|-------|---------|
| 1–3 Start | **E** + **F** | Kreator OK · F-START-FIX + bramka |
| 4 Mapa/HUD | **A** + **F** | Mockup D1B · F-HUD · minimapa, Menu |
| 5–7 Miasto | **B** + **F** | Panel OK · F-PROD-SPAWN · garnizon |
| 8–9 Ruch | **A** | A2-Q4 karta jednostki [H] |
| 10–13 Walka | **C** + **F** | preBattle jednostka OK · F-ATK-MIASTO · C3 ABC |
| 14 Tura | **A** + **F** | F-ENDTURN-GATE |
| 15 Meta | **D** + **E** | Nauka OK · dyplomacja read-only |

---
### [2026-06-26] System komend `master` / `czaty`

**Od Master Silnika do wszystkich czatów tematycznych:**

1. Gdy Maciej napisze **`master`** → przeczytaj **tę sekcję swojej Grupy** w tym pliku + ewentualnie wpisy globalne.
2. Wykonaj to, co tu jest (pytania przygotowane, routing, poprawki) — **nie pytaj Macieja o tematy spoza charteru**.
3. Masz coś przekazać Masterowi → dopisz w `docs/czaty/DO-MASTERA.md` (sekcja swojej Grupy) **albo** standardowo w `dyspozycje/<LANE>-DO-MASTERA.md`.
4. Charter grupy: `docs/czaty/GRUPA-X-….md` · mapa pytań: `docs/decyzje/MAPA-PYTAN-OPEN.md`

### [2026-06-27] Schemat 2 wersje (obowiązuje wszystkie grupy)

**Czytaj:** `docs/czaty/SCHEMAT-DWIE-WERSJE.md`

| Wersja | Plik | Kto |
|--------|------|-----|
| **Robocza** | `Gra-podglad-ROBOCZA.html` | **Grupa F** po bramce — tu testujecie całą grę |
| **Finalna** | `Gra-podglad.html` | **Master** po Opus APPROVE |

**Wpięcie `main.ts`:** zakładka A–E kończy lane → `→ SILNIK: GOTOWE` w `DO-MASTERA` → **Grupa F** wpina, testuje, publikuje **ROBOCZA** → Master promuje **finalną**. Lane **nie** edytuje `main.ts`.

### [2026-06-27] Flow Silnik ↔ Master (stały)

**Pełna spec:** `docs/czaty/SILNIK-MASTER-FLOW.md`

| Etap | Grupa F | Master Silnik |
|------|---------|---------------|
| Wpięcie + testy | ✅ auto | — |
| `Gra-podglad-ROBOCZA.html` | ✅ | — |
| Opus 4.8 | — | ✅ auto kolejka |
| `Gra-podglad.html` (finalna) | — | ✅ po APPROVE |

**Nie pytaj Macieja** o test / TEST / kanon przy każdym `GOTOWE`.

### [2026-06-27] Zasada kanonu decyzji (Maciej — obowiązuje wszystkie grupy)

1. **ABC / decyzja w zakładce tematycznej = ŚWIĘTE.** Nie pytaj ponownie, nie proś o sign-off, nie „potwierdzaj prowizorkę”.
2. **Wdrożenie = Grupa F** (main.ts, bramka, `Gra-podglad-ROBOCZA.html`) → **Master Silnik** (Opus, kanon). **Nie** Master w czacie tematycznym.
3. **Pytaj Macieja tylko** o temat **OTWARTY** w `docs/decyzje/MAPA-PYTAN-OPEN.md` / swoim pliku decyzji — **jedno ABC na raz**, jeśli w tej zakładce **jeszcze nie było** odpowiedzi.
4. **Nie blokuj** F pytań o test, kanon, drugą akceptację — raportuj `→ SILNIK: GOTOWE` gdy lane skończył pracę.

### [2026-06-27] Decyzja przekazana z Master Silnik — **ABC1=A** (HUD D1B)

| Grupa | Co wynika |
|-------|-----------|
| **A** | Mockup D1B **ZAMKNIĘTY** — nie pytaj o akceptację mockupu. Handoffy SILNIK → **Grupa F** (F-HUD). Ty: tylko **A1-Q11** jeśli OTWARTE. |
| **F** | **Wykonaj F-HUD** po F-BRAMKA (kolejka § F). Handoffy: `UI-do-MASTER_hud-D1B-mockupy.md`, A1Q5/8/9. |
| **B, C, D, E** | Bez zmian w waszych decyzjach — **nie** wracaj do D1B / sign-off HUD. |

Szczegóły sign-off: `docs/MACIEJ-HUD-CHECKLIST-D1B.md` · data: **2026-06-27**.

### [2026-06-27] Zasada — Maciej NIE wykonuje bramki ani playtestu ROBOCZA

**Grupa F / briefing Master w czacie F:** **ZAKAZ** sekcji „Od Ciebie: uruchom bramkę”, „Playtest ROBOCZA”, „Ty: bramka P0”.

| Krok | Kto |
|------|-----|
| Bramka + `Gra-podglad-ROBOCZA.html` | **Grupa F** lub **Master** (shell z Node) — raport `→ MASTER: GOTOWE-ROBOCZA` / `BLOK BRAMKA` |
| Weryfikacja ROBOCZA | **Master** (`czaty`, Opus) |
| Playtest **finalnej** | **Maciej** — checklista **tylko w czacie Master Silnika** |

**Maciej opcjonalnie** (poza workflow): zgoda na archiwum handoffów („Archiwum OK: …”) — nie blokuje kodu.

*(Wpisy historyczne w DO-MASTERA z „Maciej lokalnie bramka” — **nieważne**.)*

**Grupa F:** wykonuje kod → raportuje **wyłącznie do Mastera** (`SILNIK-DO-MASTERA`, `DO-MASTERA` § F, flaga `→ MASTER: GOTOWE-ROBOCZA` / `BLOK`).

**Grupa F NIE:**
- prosi Macieja o weryfikację, bramkę, test, „czy działa”, sign-off techniczny
- daje Maciejowi checklistę playtestową
- eskaluje brak Node do Macieja (tylko `BLOK BRAMKA` → Master)

**Master Silnik:** czyta raporty F (`czaty`) → weryfikuje → Opus → finalna → **dopiero wtedy** playtest Maciejowi **w czacie Master** (pełna treść, bez odsyłania do plików).

**Maciej w czacie F:** może pisać `master` — **nie** jest testerem ani weryfikatorem silnika.

**Master:** weryfikacja Opus → kanon finalna. Charter: `docs/czaty/GRUPA-F-SILNIK.md` · rules: `.cursor/rules/civ-workflow.mdc` §10.1.
