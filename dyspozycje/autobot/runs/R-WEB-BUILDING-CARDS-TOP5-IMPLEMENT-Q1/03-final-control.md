STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — Final Control, runda 1 (po Obronie)
TEMAT: R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1
GOAL: Karty budynków: „Top 5” zaraz po Rysie historycznym, pod nim „Co możesz teraz zrobić”; 3 niedostępne budynki i efekty martwe ukryte (warstwa adaptera/karty); Trybunał i Pałace I–III pokazują −30% korupcji (FALA 560).

ZMIANY/COMMIT:
- Ocenione: 1d2e3334c (gałąź `obrona-r1-275-3`), liniowo nad origin/main c7ee6ea15: b679ed33c (kod) → d02d14896, a8688bdec (raport) → ed1383e9a (test [G], raport) → 1d2e3334c (raport obrony).
- `git merge-base --is-ancestor b679ed33c 1d2e3334c` = TAK. `git diff --check c7ee6ea15 1d2e3334c` czysty.
- 16 plików, wszystkie w allowliście: buildingAdapter.ts, registry.ts (ukrycie kart 3 budynków przez resolver, uzasadnione), building-cards-top5.json, gen-building-cards-top5.cjs + .korekty.json, building-cards-top5-test.cjs, buildings.json (tylko `opis`/`uwagi`/`top3[1]` Trybunału oraz `opis`/`uwagi` Pałacu II i III — bez liczb, sprawdzone diffem), runs/<ID>/**. Brak zmian w tech.json/units.json/terrain-improvements.json/cityPanel.ts, istniejące testy nietknięte.
- Ten commit FC dodaje wyłącznie ten plik.

ORZECZENIA:
1. Zarzut 1 (BLOKADY nieścisłe) — ODDAL. Obrona poprawiła BLOKADY w 01-operator-r1.md: 3 karty, 5 wierszy (Akademia ×2, Akademia wojskowa, Warsztat oblężniczy ×2). Potwierdzone wynikiem testu [G] („ZNANY STAN” ×5). Sam przeciek pochodzi z hosta `cityPanel.ts` (kafelek „Technologie”), który jest poza allowlistą — to blokada dla orkiestratora, nie wada pracy w zakresie.
2. Zarzut 2 (luka w teście) — ODDAL. Sekcja [G] liczy wiersze kafelka z prawdziwej `playerFacingNote` i pilnuje listy ZNANY_STAN_HOST w obie strony (nowe trafienie = FAIL, zniknięcie = FAIL „zaktualizuj listę”).
3. Zarzut 3 (raport > 600 słów) — ODDAL. `wc -w 01-operator-r1.md` = 492 (zmierzone przez FC).
Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA z zarzutów.

TESTY (FC, samodzielnie, na 1d2e3334c, świeże `npm ci`):
| Bramka | Wynik |
|---|---|
| tsc --noEmit | exit 0 |
| logic-test | 213/213 |
| ai-test | 289 passed / 0 failed |
| gen-building-cards-top5 --check | OK |
| building-cards-top5-test | 1179 pass / 0 fail (5 × ZNANY STAN) |
| emporion-building | 47/0 |
| tech-cards-top5 | 594/0 |
| entity-card-contract | 75/0 |
| civpedia-budynki-historia | 146/0 |
| building-card-overlap-real-render | 21/0 |
| building-queue-detail-card | 8/8 |
| entity-card-historia-section | 36/0 |
| entitycard-sufit-dwoch-kart | 58/9 — czerwony na bazie identycznie (dispatch: 58/9), nie regresja |

BLOKADY:
- Kafelek „Technologie” w karcie budynku w grze (`cityPanel.ts`, appendTechDetailBlock) wciąż pokazuje odwołania do efektów martwych: Akademia (Teatr ×2), Akademia wojskowa (elity), Warsztat oblężniczy (Katapulta ×2). Decyzja (4) spełniona w adapterze, częściowo w karcie hosta. Wymaga osobnego tematu R-WEB z allowlistą `cityPanel.ts` (rekomendacja FC: osobny temat; test [G] wymusi aktualizację listy znanego stanu).
- Do właściciela: założenia 1–5 Operatora; niespójność Trybunału (Top3 „+2 Szczęścia” vs „Zadowolenie +1 pkt/turę” w Plonach) — rewizja treści, poza zakresem.

INTEGRACJA: SHA do integracji = commit FC nad 1d2e3334c (podany w raporcie końcowym). Cel: `main` (baza c7ee6ea15 = origin/main). Względem origin/rust-port/parity-v2: niezależne — parity-v2 nie zawiera c7ee6ea15 i nie dotyka tych plików kart; NIE scalać do parity-v2, najpierw main/ROBOCZA, port do Rust później jako REPIN.
RUNDY: 1/5 (+ obrona)
NASTĘPNY KROK: integracja orkiestratora do main → READY_FOR_DEPLOY → ROBOCZA; osobny temat na kafelek „Technologie” w cityPanel.ts.
DEPLOY/PUSH: NIE WYKONANO
