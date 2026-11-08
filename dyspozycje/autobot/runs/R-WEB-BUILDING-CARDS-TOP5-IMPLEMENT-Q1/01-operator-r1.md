STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — karty budynków (UI + dane treści)
TEMAT: R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1
GOAL: Karty budynków: Top 5 zaraz po Rysie historycznym, pod nim „Co możesz teraz zrobić”. Niedostępne budynki i efekty martwe ukryte. Trybunał i Pałace I–III: −30% korupcji (FALA 560).

ZMIANY-COMMIT (baza origin/main c7ee6ea15; kod b679ed33c; obrona r1: test [G] + ten raport, SHA w 02-obrona-r1.md):
- `gra/data/building-cards-top5.json` (nowy): 43 wpisy, 40 z treścią, 3 `ukryty`. Generator `gra/tools/gen-building-cards-top5.cjs` (`--check`), odstępstwa od CSV z powodem w `gen-building-cards-top5.korekty.json`. Kopia CSV: `runs/<ID>/zrodlo/`.
- `buildingAdapter.ts`: sekcja „Top 5” (indeks 2, po Rysie), po niej „Co możesz teraz zrobić”. `opisKarty` zastępuje opis tylko na karcie. Dawne `top3` zostaje jako zapas (użyte 0/43).
- `registry.ts`: `resolveBuildingRow` = null dla Wielkiej odlewni, Wielkiej Kuźni i Teatru. Mechanika bez zmian.
- `buildings.json`: tylko teksty `opis`/`uwagi`/`top3[1]` Trybunału oraz `opis`/`uwagi` Pałacu II i III. Zero liczb.
- Nowy test `gra/tools/building-cards-top5-test.cjs`. Istniejące asercje bez zmian.

POMIAR: `top3` ma poza kartą jednego konsumenta (`tools/emporion-building-test.cjs:82`), pole zostaje. Host karty `cityPanel.ts` `buildBuildingDetailCardViaEntityCard` dokleja kafelek „Technologie” (`appendTechDetailBlock`).

ZAŁOŻENIA (do potwierdzenia przez właściciela):
1. Trybunał: Top1 „−30% korupcji”, Top2 „+17 Prawa” (jak Sąd i Pretorium u FC).
2. Pałac II/III: Top2 „−30% korupcji w stolicy (jak Pałac I)”.
3. Zdania Sądu i Pretorium poprawione (sumują się, łącznie maks. −60%).
4. Q6-A: asymilacja z dopiskiem „(podbite miasta)”. Q7-A: zamiana Pracy na podatek „(tylko gracz)”.
5. Usunięte odwołania martwe w treści adaptera: Teatr (Akademia), Katapulta (Warsztat oblężniczy), „armię” (Spichlerz Królewski).

TESTY:
- `building-cards-top5-test.cjs`: **1179 pass / 0 fail** (43/43: Top 5 po Rysie, Top1 = efekt, CMZ 1–3 zdania, brak fraz zakazanych i martwych w wyniku adaptera; Mennica, Koszary, Akwedukt, Trybunał/Pałace, Garnizon; 3 ukryte bez karty). Sekcja [G] obejmuje kafelek hosta jako znany stan (niżej). Mutacja listy ZNANY_STAN_HOST → 1 FAIL (strażnik działa).
- `tsc --noEmit` 0, `logic-test` 213/213, `ai-test` 289/0 — na bazie identycznie.
- 31 testów kart zielonych przed i po.
- Czerwone już na bazie, identycznie po zmianie: building-detail-card-migration 54/1, entity-card-action-buttons 30/1, entitycard-sufit-dwoch-kart 58/9, sidepanel-blocking, civpedia-karty-nazwa-przyciskiem 25/2, tech-discovery-badge-diorama 61/2, budynek-garnizon (esbuild: podwójny eksport `renderBuildList`, cityPanel.ts:12336 — Evaluator potwierdził na bazie). civpedia-caly-wiersz niestabilny.

WERYFIKACJA WIZUALNA: Chromium 1194, harness esbuild, zrzuty `screens/` (Mennica, Koszary, Trybunał, Akwedukt, Garnizon, Warsztat oblężniczy). Po Rysie widać „Top 5”, pod nim „Co możesz teraz zrobić”. Żywej gry NIE_ZMIERZONO (zakaz `npm run build/dev`).

BLOKADY (poza allowlistą — decyzja orkiestratora: runda 2 z `cityPanel.ts` albo osobny temat R-WEB):
Kafelek „Technologie” (`cityPanel.ts` `appendTechDetailBlock`) pokazuje surowe pola `tech.json` i nadal zawiera efekty martwe na 3 kartach (5 wierszy, zmierzone testem [G] na 40 widocznych budynkach):
- Akademia (Filozofia): „Odblokowuje budynek: Akademia; Teatr” oraz „Uwagi tech: … Teatr = NOWY budynek (kultura++, zadowolenie++)”.
- Akademia wojskowa (Sztuka wojenna): „Uwagi tech: … prereq elitarnych jednostek żelaznych” (bramka elit, §8).
- Warsztat oblężniczy (Oblężnictwo): „Odblokowuje budynek: Warsztat oblężniczy; Jednostki: Katapulta” oraz „Uwagi tech: jednostki: Katapulta…”.
`playerFacingNote` tego nie wycina; `tech.json` jest zakazany. Decyzja (4) jest więc spełniona w treści adaptera, a na pełnej karcie hosta częściowo.

RUNDY: 1/5 (+ obrona)
NASTĘPNY KROK: Final Control; orkiestrator decyduje o blokadzie; właściciel potwierdza założenia 1–5.
DEPLOY/PUSH: NIE WYKONANO
