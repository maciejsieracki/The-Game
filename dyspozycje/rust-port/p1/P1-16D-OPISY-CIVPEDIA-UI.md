# P1.16d — Opisy CivPedii (reszta) i panele „ściąga" UI — status z dowodem

**Pin webowy:** `edb8fb56` (wszystkie odczyty przez `git show edb8fb56:...`; working tree nie użyty do oceny).
**Temat:** `R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1`, runda 1/5, Operator (Haiku 5.5 medium).
**Źródła:** `dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §3, §5; `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.3/§9.5 (zamknięte: Akademia, Karawanseraj, Targowisko, Lazaret).
**Zastrzeżenie:** kryterium „wszystkie hasła i wszystkie 17 paneli z dowodem" NIE jest spełnione w tej rundzie. Poniżej jawnie: ile sprawdzono z ilu.

## A. CivPedia — liczenie

Źródło: `gra/src/data/wikiBundle.json` (`encyklopedia`, 169 wpisów na pinie).

- Grupy §5 audytu łącznie: **137 wpisów** (audyt pisze 136). Rozbieżność: audytowe „Budynki (25)" vs **26** na pinie.
- Poza grupami §5 zostają 32 wpisy „Technologie" — audyt ich nie wymienia.
- Wyłączone (zamknięte w P1-16): Akademia, Targowisko (z grupy Budynki); Karawanseraj i Lazaret nie są w danych Budynki.

| Grupa §5 | Wpisów | Sprawdzono (mechanicznie) | Status |
|---|---:|---|---|
| Budynki | 26 (24 bez zamkniętych) | 24/24 — pola „maks. poziom" i „koszt pracy" porównane z `buildings.json` | Częściowo: 0 rozbieżności w polach, które wiki podaje (6 haseł ma oba pola zgodne); 17 haseł nie podaje maks. poziomu; pola surowcowe (×5, drewno/cegła) NIE sprawdzone |
| Jednostki + Jednostki i walka + Wojsko i miasto | 51 | 0/51 (parser kosztu nie zadziałał — brak dopasowania; nie dowodzi zgodności) | NIEROZSTRZYGNIĘTY |
| Cuda świata + Kultura i cuda | 20 | 0/20 | NIEROZSTRZYGNIĘTY |
| Ulepszenia terenu + Mapa i ekspansja | 18 | 0/18 | NIEROZSTRZYGNIĘTY |
| Cywilizacje + Cywilizacje i dyplomacja + Dyplomacja | 12 | 0/12 | NIEROZSTRZYGNIĘTY |
| Pojęcia + Miasto i społeczeństwo + Nauka i epoki + Ekonomia imperium | 10 | 0/10 | NIEROZSTRZYGNIĘTY |
| Technologie (poza §5) | 32 | 0/32 | NIEROZSTRZYGNIĘTY (poza zakresem audytu) |

**Razem: 137 wpisów w grupach §5 = 2 zamknięte (Akademia, Targowisko) + 24 sprawdzone mechanicznie + 111 NIEROZSTRZYGNIĘTYCH; plus 32 Technologie NIEROZSTRZYGNIĘTE.** Kryterium „wszystkie hasła z dowodem" NIESPEŁNIONE.

**Sprawdzenie zgłoszenia audytu „13/25 haseł: maksymalnie 10 poziomów":** w `wikiS`, `wikiM`, `full`, `historia` grupy Budynki NIE znaleziono frazy „maksymalnie 10 poziomów". Występuje 18 razy wyłącznie w zdaniach obalających mit („Ignorowanie utrzymania: N ¤/t × 10 poziomów…", „nie ma 10 poziomów"). Status: **NIE ODTWORZONO na pinie** (zgłoszenie audytu nieaktualne dla tego bundla; nie oznaczam jako NAPRAWIONY bez porównania ze stanem sprzed zmiany).

## B. Panele „ściąga" UI — 17 z listy „Skatalogowane"

Numery linii z audytu są przesunięte o ok. +300…+3000 (np. Zdrowie @3259 → @3582). Lokalizacje poniżej na `edb8fb56`.

| # | Panel | Lokalizacja (pin) | Status | Dowód |
|---|---|---|---|---|
| 1 | Zdrowie — szczegóły | `cityPanel.ts:3582` | PASS-WITH-NOTES | Wzór „floor(Zdrowie÷10) × 1 p.p." zgodny z `population-growth-v85.ts:259`. Pomija mnożnik cywilizacji `lud_zdrowie_proc` (`:260`). |
| 2 | Religia — wariant fallback (inline) | nie zlokalizowany w tej rundzie | NIEROZSTRZYGNIĘTY | — |
| 3 | Zamożność — wariant kompaktowy | `cityPanel.ts:4307` | **NIEAKTUALNY** | Linia „Szczęście … (co 10 poziomów W +1)". Pin: `wealth.ts:122,141` → `floor(poziom × zadowolenieMax / cap_epoki)`, cap = epoka×10. Stara formuła `floor(W/10)` usunięta. Ta sama stara fraza w pełnej karcie `:4874` (audyt ocenił ją „Poprawny" — ocena wymaga korekty). |
| 4 | Rekruci (pobór) | `cityPanel.ts:5652` | PASS | Max = 10% ludn. abs. (`epoka-ludnosc-manpower.json`: manpowerNaLudka = ludekNaLudka/10); regen domyślnie 2% (`manpower.ts:64`); blokada przy oblężeniu (`:65`). |
| 5 | Ludność — co to znaczy | `cityPanel.ts:5684` | PASS-WITH-NOTES | `WYZYWIENIE_MAX = 6` zgodne (`population-growth-v85.ts:28`). Układ „prawa kolumna" nie zweryfikowany wizualnie. |
| 6 | Praca — co to znaczy | `cityPanel.ts:5770` | PARTIAL | Treść ogólna spójna; formuły `doBudynkow = round(praca×%Budynki)` i układ kolumn NIE sprawdzone. |
| 7 | Pieniądz — co to znaczy | `cityPanel.ts:5824` | PARTIAL | Nie sprawdzono „Skarbiec += Σ pieniadzNetto" ani listy „Targowisko, Mennica" jako źródeł. |
| 8 | Nauka — co to znaczy | `cityPanel.ts:5904` | PARTIAL | Formuła `nauka += plony + budynki + % handlu` nie sprawdzona w kodzie. |
| 9 | Kultura — co to znaczy (chip) | `cityPanel.ts:5949` | PARTIAL | Treść ogólna; „fioletowe pierścienie" i układ nie zweryfikowane. |
| 10 | Religia — co to znaczy (chip) | `cityPanel.ts:5992` | PASS | „100% własnej +X, 50/50 = 0, 100% obcej −X" zgodne z `2·udział−1` i skalą epoki (`culture-religion.ts` `religionOwnShare`, `society-breakdown.ts`). |
| 11 | Rekrutacja — szczegóły (zakładka) | `cityPanel.ts:8861` | PASS-WITH-NOTES | Dane live. Zdanie „max 1 gotowa na turę (v0.1)" NIE potwierdzone na pinie (brak limitu rekrutacji w grep `gra/src/game`); oznaczenie „v0.1" wygląda na nieaktualne. |
| 12 | Skład bonusów — {budynek} | `cityPanel.ts:8979` | PASS-WITH-NOTES | Karta bez twardych liczb (dane z `def`, `formatBuildingYieldDetailValue`). Poprawność danych upgrade nie zweryfikowana. |
| 13 | Garnizon — szczegóły | `cityPanel.ts:9428` | **NIEAKTUALNY (3 pozycje)** | (a) „1 jednostka +20 pkt Prawa" — twardo; pin: `prawo_garnizon_per_jednostka` = easy 25 / normal 20 / hard 15 (`society-params.json`). (b) „5+ jednostek → PrawPct do 100% (cap)" — błędne: cap dotyczy liczby jednostek (5 normal / 4 hard, `society-breakdown.ts:827`), nie procentu. (c) „Duże miasto bez wojska: Kara Prawa (≥6 mieszk.)" — NIEAKTUALNE: kara `prawo_kara_brak_garnizonu` usunięta (R-PRAWO-PRZEBUDOWA-SKALI-Q1 D5, `society-breakdown.ts:161–172`). |
| 14 | [Budynek] — karta charakterystyki | `cityPanel.ts:7561` / `:7704` | PASS-WITH-NOTES | Liczby z danych (`maksPoziom`, `displayLevel`). Brak twardych wartości w treści. |
| 15 | Budynki w mieście (N) | `cityPanel.ts:7806` | PASS-WITH-NOTES | Lista z danych, brak twardych liczb. |
| 16 | [Jednostka] — karta jednostki | `cityPanel.ts:7885` | PASS-WITH-NOTES | Ścieżka live = `buildUnitDetailCardViaEntityCard`; fallback legacy bez twardych liczb. |
| 17 | Zobacz szczegóły zużycia | `empireDetailPanel.ts:3289` | PARTIAL | Opis klamrowania (budynki/wojsko pełne, obywatele klamrowane) nie zweryfikowany w silniku. |

**Podsumowanie B (17 paneli):** 2 PASS (#4, #10), 7 PASS-WITH-NOTES (#1, #5, #11, #12, #14, #15, #16 — część bez wgłębnej weryfikacji treści), 5 PARTIAL (#6, #7, #8, #9, #17), 2 NIEAKTUALNE (#3 Zamożność compact; #13 Garnizon — 3 błędne pozycje w środku panelu), 1 NIEROZSTRZYGNIĘTY (#2 Religia fallback — nie zlokalizowany).

**Dodatkowe ustalenie (poza listą 17):** pełna karta „Zamożność — ściąga" (`cityPanel.ts:4874`) zawiera tę samą nieaktualną frazę „bonus do szczęścia co 10 poziomów W". Audyt oznaczył tę kartę jako „Poprawny" — werdykt wymaga korekty.

## C. Co zostaje (dla następnej rundy / osobnych tematów)

1. CivPedia: 113 z 137 haseł + 32 Technologie nieprzeliczone; naprawić parser kosztu (`**16¤**` vs `16 ¤`) i przeliczyć Jednostki (51) jako pierwszą partię.
2. Panele: zlokalizować Religia fallback; dogłębnie sprawdzić formuły pozycji 6–9 i 17.
3. Zgłosić do P1-16c/osobnego tematu: Garnizon (3 pozycje), Zamożność compact + pełna karta (fraza „co 10 poziomów").
4. Nie wprowadzano zmian w `gra/**`; zapisy tylko w tym pliku i w katalogu runu.
