STATUS: PASS
DOMAIN: GAME (WEB), pomiar i diagnoza. Generator bez zmian.
TEMAT: R-WEB-CAPITAL-SPACING-MEASURE-Q1
GOAL: Wyjaśnić, dlaczego cywilizacje generują się „na kupie" mimo ogromu miejsca (obrona po Evaluatorze, runda 1).
ZMIANY/COMMIT: baza `f10cd4da1`. Rozszerzenie narzędzia `gra/tools/capital-spacing-measure.cjs` o klasyfikację par miast (stolica-MP, MP-MP, naruszenia bufora) + ten raport; SHA w odpowiedzi orkiestratora. Zero zmian w `gra/src`, `gra/data`, `WERSJE.md`.

ZARZUT 1 (uogólnienie H6): PRZYJMUJĘ. Pomiar Standard, 8 ziaren/komórkę (dane D-std, scratchpad):
| typ / ląd | centerMin | dryf med. | pula bramki | sufit | capMed | <25 |
|---|---|---|---|---|---|---|
| Kont. 30% | 35 | 7 | 568 | 28 | 17 | 8/8 |
| Kont. 60% | 60 | 42 | 3828 | 56 | 33 | 2/8 |
| Pangea 30% | 9 | 12 | 897 | 19 | 15 | 8/8 |
| Pangea 60% | 53 | 31 | 6875 | 47 | 17 | 6/8 |
| Wyspy 30% | 28 | 0 | 0 | brak | 28 | 2/8 |
| Wyspy 50% | 29 | 0 | 117 | 13 | 29 | 3/8 |
Mechanizmy per typ: (a) Pangea 50–60% i Kontynenty 50–60%: H6 (dryf 26–42 przy środkach 44–60, sufit 40–56). (b) Kontynenty 30%: dryf mały (mediana 7), przyczyna to wąska pula (10% lądu) i skrajne przypadki (dryf maks. 41), czyli H1/H3. (c) Pangea 30%: same ŚRODKI klastrów leżą blisko (centerMin 9 < sep 17), sufit 19, czyli H1 (mało lądu). (d) Wyspy: bramka pasa niewykonalna (pula 0/117), działa drabina rescue, dryf 0. Wniosek „mediana dryfu 31" dotyczy tylko Pangea 60%.

ZARZUT 2 (pominięte cityMinDiffCiv): PRZYJMUJĘ. Narzędzie klasyfikuje teraz pary. Bufor bryły ceil(S/2)=8 (`clusters.ts:1533`) dotyczy WYŁĄCZNIE miast-państw (MP) wokół obcej stolicy (`foreignBuffersForCluster` :2812). Pomiar Standard Kont./Pangea × 30/60%, 8 ziaren (32 mapy): min. odległość MP–obca stolica 10/8/7/8; naruszenia bufora: 1 na 32 map (Pangea 30%, 7 zamiast 8). Wartości 3–8 hex z `cityMinDiffCiv` to pary MP–MP różnych klastrów (min. 3–5), których bufor nie obejmuje; próg tam to tylko 3 (`cluster-start.ts` ~:178-200). Bufor działa, ale jest wąski: obce MP mogą sąsiadować (3–5 hex), co wizualnie daje „kupę" nawet przy stolicach 15+ hex od siebie. Dla wariantu B/C: rozważyć bufor MP–MP lub większy bufor.

ZARZUT 3 (długość): PRZYJMUJĘ, drobne. Ten raport jest zwięzły. Pierwotny raport nie zostaje rozszerzony.

ZARZUT 4 (pokrycie): PRZYJMUJĘ CZĘŚCIOWO, dopisano pomiary:
- Duży 240×168, 30% lądu, 5 ziaren: Kont. capMed 17, <25 u 4/5; Pangea capMed 16, <25 u 5/5; Wyspy capMed 35, <25 u 0/5. Brak naruszeń bufora.
- Super Huge 672×476, Pangea 30%, 1 ziarno (8 min generacji): capMin 23 przy sep 19 i suficie 95, centerMin 90, dryf 58 (maks. 93). Jedno ziarno, NIE reprezentatywne. Więcej niewykonalne w limicie czasu.
- Wariant A (kopia poza repo, odwrócone `clusters.ts:2262`), 30% lądu, 5 ziaren: Duży Kont. <25 spada z 4/5 do 1/5 (capMed 17→35); Duży Pangea 5/5→1/5 (16→27); Mały Kont. 5/5→0/5 (16→35); Mały Pangea nadal 5/5 (sufit 24, capMed 5→16). A skuteczny też poza Standardem, Pangea 30% wymaga B/C (sufit).
- Nadal NIE_ZMIERZONO: rzeki, Ogromny wariant A, Super Huge więcej niż 1 ziarno.

Regresja: bez zmian (brak regresji, `c799325c7^`, `6d37eb476^`).
TESTY: `node --check` OK. Pomiary jak wyżej. Bez `npm run build`/`dev`. esbuild poza repo.
BLOKADY: brak
RUNDY: 2/5 (obrona po Evaluatorze, wciąż runda 1 tematu: 1/5)
NASTĘPNY KROK: Evaluator weryfikuje; potem ABC właściciela (A+B, ewentualnie bufor MP–MP).
DEPLOY/PUSH: NIE WYKONANO
