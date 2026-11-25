# Pomiar po FALACH 891 i 896 — seed 4242 (2026-11-25)

TEMAT: R-WEB-MEASURE-WARS-4242-VERIFY-Q1 · baza origin/main 6fe46acef · runda 1/5 · Operator HAIKU 5.5
Bundle zbudowany poza repo (`/tmp/wars4242-dist`, wyjątek C-001). Zero zmian w `gra/src`, `gra/data`. Bez deployu.

## Tabela PRZED / PO

| Co | Przed | Po | Werdykt + powód |
|---|---|---|---|
| Wojny naturalne na AI (limit 1 na cywilizację) | 2 wojny u AI 28 w turach 60–67 (seed 4242, dane sprzed FALI 896) | max 1 na AI; 0 naruszeń w turach 2–67 (`turyNaruszenWojen` = []); w turach 60–67 liczba wojen (pary) 2–4, ale analizator liczy limit per cywilizację | DZIAŁA — brak naruszeń limitu 1 naturalnej na AI w pomiarze (66 wierszy, tury 2–67). Uwaga: łączna liczba par wojennych w turze 58 = 4, co przy limicie per cywilizacja nie łamie reguły. |
| Wojny naturalne wobec gracza | — | max 0 naturalnych; 1 wojna epoki (AI 4 → gracz, tura 40) | DZIAŁA (brak naturalnej wojny z graczem w biegu). |
| Sojusze AI↔AI (limit 2 na cywilizację) | Limit przekraczany do 6 (dane sprzed FALI 865; wg tematu #13) | max 3 na AI; naruszenie w turach 66 i 67 (AI 1 ma 3 sojusze z AI 10, 13, 19 wg pola `status`) | NIE DZIAŁA — limit 2 przekroczony w 2 turach (66–67). Pole `pokoj` dla pary 1–13 mówi „pokoj” przy `status: sojusz`; werdykt opiera się na analizatorze (`naruszeniaSojuszyAI` = 2). Do potwierdzenia przez Evaluatora. Minimalne odtworzenie: seed 4242, tura 66, AI 1. |
| Wojny epoki — parowanie (`pairing-unresolved`) | 24× / 68 tur (pending Brązu stał 68 tur) | 3× (tury 77, 80, 83; wszystkie z powodem „wszystkie pary zablokowane sojuszem”; bieg 86 tur) | CZĘŚCIOWO — liczba odrzuceń spadła 24→3, ale 3 nadal kończą się blokadą sojuszu, czyli reguła „sojusz nie blokuje” nie jest w pełni domknięta. |
| Czas oczekiwania pending Brązu | 68 tur | 37–50 tur na AI (zakres od wejścia w Brąz do wypowiedzenia lub końca biegu) | CZĘŚCIOWO — krócej, ale nadal długo. |
| Wypowiedzenia wojen Brązu | — | tura 80 (10→13), 81 (16→19), 84 (1→4); 4 AI pozostają z pending Brązu na turze 86 (AI 4, 7, 13, 19) | NIE ZMIERZONO w pełnym zakresie — bieg zatrzymany na turze 86 (wall-limit), plan 90 (wymóg 120 nieosiągalny w jednym odcinku). |
| Wojny epoki Kamienia | — | 2 wypowiedzenia tura 40 (AI 1→16, AI 4→gracz 0) | informacyjne |

## Metoda

- Bieg 1 (limity): `node tools/diplomacy-harder-measure-run.cjs --dist /tmp/wars4242-dist --seed 4242 --turns 67 --wall-limit 540` (flagi domyślne, bez `--all-flags`), ciągły, 542 s, endTurn 67, 66 wierszy. Analiza: `node tools/limits-measure.cjs`.
- Bieg 2 (wojny epoki): `node tools/era-war-measure-run.cjs --dist /tmp/wars4242-dist --seed 4242 --turns 90 --wall-limit 540`, ciągły, 552 s, endTurn 86, stop = wall-limit. Brak wznawiania (wznowienie daje SIGSEGV, temat #90).
- Gracz był na autopilocie AI (`--player-ai 1`), bypass 200 złota / 200 żywności.

## Dane

Katalog `dyspozycje/autobot/runs/R-WEB-MEASURE-WARS-4242-VERIFY-Q1/dane/`:
- `diplo-seed4242-harder0.jsonl.gz`, `diplo-seed4242-harder0.summary.json`
- `era-seed4242.jsonl.gz`, `era-seed4242.summary.json`
- `limits-measure-diplo-seed4242.json` (wyjście analizatora)
- `SHA256SUMS.txt`

SHA256 (surowe pliki, kolejność jak w SHA256SUMS):
- diplo-seed4242-harder0.jsonl.gz 78913cf9cef18af18a34baf78cfe4117a31ca6bb76cda596dbc3aef3e47321a6
- era-seed4242.jsonl.gz 5a80103ccb357bc9efc32b381b2970bb98ae0d3f81dfe6b62163d7cce3f2cb6a

## Bramki (liczby z surowego wyjścia)

- `npx tsc --noEmit` (gra/): exit 0
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`
- `node tools/ai-test.cjs`: `ai-test: 297 passed, 0 failed`

## Kandydaci R-WEB (nie naprawiane)

1. Limit 2 sojuszy AI↔AI przekroczony: seed 4242, tura 66–67, AI 1 z 3 sojuszami (partnerzy 10, 13, 19). Sprawdzić regułę w `ai-ai-alliance-limit.ts` przy wejściu trzeciego sojuszu w tej samej turze.
2. Wojny epoki: 3 odrzucenia `pairing-unresolved` z powodem „wszystkie pary zablokowane sojuszem” — sojusz wciąż blokuje część parowań.
3. Brąz pending 37–50 tur (AI 13 najdłużej: 37..86). Dokończyć pomiar do tury 120 w osobnym odcinku po rozwiązaniu problemu z wznawianiem (temat #90).

## Ograniczenia

- Wojny epoki: bieg zatrzymany na turze 86 (wall-limit 540 s), nie 120 ani 90 pełnych tur.
- Pomiar wykonany na jednym ziarnie (4242), jednym uruchomieniu; brak powtórzeń.
- Werdykt sojuszy oparty na polu `status` i analizatorze; pole `pokoj` dla pary 1–13 jest sprzeczne i wymaga weryfikacji.
