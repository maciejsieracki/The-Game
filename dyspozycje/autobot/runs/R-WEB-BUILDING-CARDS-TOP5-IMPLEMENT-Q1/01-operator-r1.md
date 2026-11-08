STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — karty budynków (UI + dane treści)
TEMAT: R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1
GOAL: Etap 2 kart: budynki mają Top 5 zaraz po Rysie historycznym, potem „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ). 3 niedostępne budynki i efekty martwe są ukryte. Trybunał i Pałace pokazują −30% korupcji (FALA 560).

ZMIANY-COMMIT (baza origin/main c7ee6ea15; kod b679ed33c, raport w commicie tego pliku):
- `gra/data/building-cards-top5.json` (nowy, 43 wpisy: 40 z treścią, 3 `ukryty`) z `gra/tools/gen-building-cards-top5.cjs` (odtwarzalny, `--check`). Każde odstępstwo od CSV ma powód w `gen-building-cards-top5.korekty.json`. Kopia CSV: `runs/<ID>/zrodlo/budynki-top5.csv` (sha256 b81c7b65…).
- `buildingAdapter.ts`: sekcja `top5` („Top 5”, indeks 2, czyli zaraz po Rysie; renderer bez zmian). Sekcja `actions` („Co możesz teraz zrobić”) zaraz po niej, ten sam wygląd co na karcie odkrycia. `opisKarty` nadpisuje opis tylko na karcie. Dawne `top3` zostaje jako fallback, dziś użyte 0/43.
- `registry.ts`: `resolveBuildingRow` zwraca null dla Wielkiej odlewni, Wielkiej Kuźni i Teatru. Karta i linki do nich nie powstają. Mechanika bez zmian.
- `buildings.json`: zmienione tylko `opis`, `uwagi` i `top3[1]` Trybunału oraz `opis` i `uwagi` Pałacu II i III (−30% korupcji). Zero zmian liczb.
- `gra/tools/building-cards-top5-test.cjs` (nowy). Istniejące testy bez zmian asercji.

POMIAR (A): kolejność sekcji jest w `buildingAdapter.ts`, Rys wstawia `renderer.ts:461-495` (indeks 2), CSS Top5 jest już w `renderer.ts:1098-1101`. Pole `top3` ma jednego konsumenta poza kartą: `tools/emporion-building-test.cjs:82`. Pole zostaje. cityPanel, buildModeHud, wikiBundle i civpedia nie kopiują `top3` (grep). Host karty `cityPanel.ts:7647-7669` dokleja tylko sekcję „Technologie”.

ZAŁOŻENIA (do potwierdzenia przez właściciela):
1. Trybunał: Top1 = „−30% korupcji w mieście”, Top2 = +17 Prawa. Tak samo jak FC rozstrzygnął dla Sądu i Pretorium. CMZ: „…obniżyć korupcję w mieście o 30% i dodać mu 17 pkt Prawa”.
2. Pałac II i III mają nową pozycję Top2 „−30% korupcji w stolicy (jak Pałac I)”. W zdaniu Pałacu I dopisano, że redukcja zostaje po rozbudowie.
3. Zdania Sądu i Pretorium poprawione. Zdanie „Jedyny — obok Sądu…” przestało być prawdą po FALI 560. Teraz: sumuje się, łącznie maks. −60%.
4. Q6-A: tytuły asymilacji mają dopisek „(podbite miasta)”. Q7-A: zamiana Pracy na podatek jest pokazana jako „(tylko gracz)”.
5. Odwołania do efektów martwych ukryte. Akademia: usunięte zdanie o Teatrze. Opis karty Warsztatu oblężniczego bez Katapulty. Opis karty Spichlerza Królewskiego bez „armię”. Pozycja „Otwiera Spichlerz…” (Garncarnia) ma rodzaj `warunek`.

TESTY:
- `building-cards-top5-test.cjs`: **1175 pass / 0 fail**. Sprawdza 43/43: Top 5 bezpośrednio po Rysie, 1–5 pozycji zgodnych z danymi, Top1 zawsze `efekt`, CMZ 1–3 zdania złożone z danych, brak fraz zakazanych i martwych, kolejność pozostałych sekcji nietknięta. Przypadki szczególne: Mennica ×1,5 + handel→pieniądz, Koszary (bramka Brązu i Żelaza), Akwedukt 20, Trybunał i Pałace −30%, Garnizon (Milicja). 3 ukryte: resolver i `buildEntityCardData` zwracają null. Generator `--check` OK.
- `tsc --noEmit` 0. `logic-test` 213/213. `ai-test` 289/0. Wszystkie zmierzone także na bazie, wyniki identyczne.
- Testy kart zielone przed i po: entity-card-contract 75/0, historia-section 36/0, diorama 45/0, single-dialog 25/0, wonder 134/0, cross-links-nested 24/0, cross-links-style 34/0, civpedia-klik 71/0, civpedia-* (budynki-historia 146/0, spojnosc 24/0, infra 18/0, cross-link-style 20/0, mostek, rys GREEN), tech-cards-top5 594/0, karta-technologia-uklad 11/0, building-card-overlap 21/0, hover-layout 11/0, queue-detail 8/0, emporion 47/0 i 13/0, uwagi 44/0 i 12/0, owned-building 17/0, scrollbar (xvfb) 29/0, improvement-card 12/0 i 36/0, pr141-f04 20/0 i 64/0.
- Czerwone już na bazie, wynik identyczny po zmianie (nie regresja): building-detail-card-migration 54/1, entity-card-action-buttons 30/1, entitycard-sufit-dwoch-kart 58/9, sidepanel-blocking 46/1 (C3), civpedia-karty-nazwa-przyciskiem 25/2, tech-discovery-badge-diorama 61/2. civpedia-caly-wiersz na bazie dał 1 FAIL [6], po zmianie jest zielony (niestabilny). budynek-garnizon-test: FAIL [AI1] (kotwica w ai.ts) i błąd esbuild „duplicate export renderBuildList” w cityPanel.ts:12336. Obu plików temat nie dotyka.

WERYFIKACJA WIZUALNA (E): Chromium 1194 (Playwright) z harnessu esbuild: prawdziwy adapter i renderer, ikony zastąpione stubem. Zrzuty: `screens/{mennica,koszary,trybunal,akwedukt,garnizon,warsztat_oblezniczy}.png`. Na każdym zrzucie po Rysie jest „Top 5” z wyróżnioną pozycją 1, a pod nim ramka „Co możesz teraz zrobić”. Mennica: „×1,5 podatku w każdym mieście państwa”. Trybunał: 1 „−30% korupcji w mieście”, 2 „+17 pkt Prawa”. Warsztat oblężniczy: brak Katapulty. Żywej gry NIE_ZMIERZONO, bo dispatch zabrania `npm run build/dev`.

BLOKADY (poza allowlistą, do decyzji orkiestratora): host `cityPanel.ts:7537-7539` (sekcja „Technologie”) pokazuje surowe pole `tech.json` „Odblokowuje budynek”. Zmierzone na 40 widocznych budynkach: jedyny przypadek to karta Akademii, gdzie widać „Akademia; Teatr” (Filozofia). Ukrycie wymaga zmiany `cityPanel.ts`. Do rundy 2 z rozszerzoną allowlistą albo do osobnego tematu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator. Właściciel potwierdza założenia 1–5.
DEPLOY/PUSH: NIE WYKONANO
