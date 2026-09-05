# R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A — Obrona Operatora (§3c pkt 2, runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A
GOAL: wyrównywanie WZROSTU między miastami przy twardym warunku braku głodu, z (B) miastem
na limicie i (C) skalowaniem tempa cywilizacji. Zgodny z `00-dispatch.md`.
MODEL+EFFORT: Opus 5, effort high. Baza `bec25312`; HEAD przed obroną `16d23a37`.

## OBRONA

**ZARZUT 1 → ODRZUCAM jako defekt pracy; DO DECYZJI CZŁOWIEKA co do zapisu dispatchu.**
Fakt jest bezsporny: nazwa `auto-wyzywienie-kosztarmii-kryterium-test.cjs` nie pasuje do wzorca
`empire-food*`. Dowód z wytworu, że to konflikt WEWNĄTRZ dispatchu, nie samowola: uruchomiłem
bazową wersję tego pliku (`git show bec25312:…`) na kodzie po naprawie — **exit 1**, trzy FAIL-e:
„Ateny obniżone z 5,0 do 4,0 (got 1)", „Milet obniżone z 0,5 do 0,0 (got 1)", „Nadwyżka finalna
= 23 (got 31)". Kryterium końca 6 („Jeśli któraś miała zaszyte wartości sprzed zmiany,
zaktualizuj") jest więc niespełnialne bez dotknięcia pliku, którego allowlista nie wymienia.
Zmiana jest wzmacniająca: istota testu (`kosztArmii` w kryterium, `Nadwyżka − kosztArmii ≥ 0`)
nietknięta, doszła asercja `atenyLvl === miletLvl`. Zgłoszenie C-054 zapisane w
`decision-abc.md` (rejestr/ledger — orkiestrator).

**ZARZUT 2 → ODRZUCAM jako defekt tego węzła; DO DECYZJI CZŁOWIEKA co do przypisania.**
Fakt bezsporny i zgłoszony przeze mnie w nocie 2 rundy 1. Dowód, że w tej allowliście nie ma
naprawy: mapa wymaga `cityPopulationCap(maAkwedukt, maSpichlerz, econParams)`, liczalnej tylko
u wołającego, a dispatch zakazuje `gra/src/main.ts` **bezwzględnie** („wejście tam = naruszenie
allowlisty"). Dowód, że nie pokrywa tego węzeł B: `runs/R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B/00-dispatch.md`
— GOAL „stan przełącznika czytelny bez klikania", allowlista = pliki UI + arkusz stylów + własna
bramka; ani `main.ts`, ani słowa o limicie ludności. Podpięcie nie należy więc do żadnego
otwartego węzła tej fali — to luka dekompozycji, której wytwór sam nie rozstrzyga.

**ZARZUT 3 → PRZYJMUJĘ. Poprawione w tej rundzie.**
Odtworzyłem pomiar niezależnie (sonda poza repo, 12 miast ze zrzutu, cap 5 → 5 miast na limicie,
kosztArmii 20, zapasy 279): produkcja ×0,25 → **BEZ mapy limitów 0,5 (−6%), Z mapą 0 (−10%)**.
Zarzut trafny: `WYZYWIENIE_POZIOM_NA_LIMICIE` był podłogą, nie sufitem. Przyczyna źródłowa,
której moja runda 1 nie zauważyła: `applyFractionalGrowthV85` (`population-growth-v85.ts:243-250`)
blokuje przy capie wyłącznie przyrost DODATNI — gałąź `growthPct < 0` działa mimo capu — więc
przyklepałem poziom na sztywno 1,5, żeby miasto na limicie się nie kurczyło, i tym samym dałem
mu pierwszeństwo przed miastami rosnącymi.
Poprawka (`empire-food.ts`): `cappedLevelFor = Math.min(WYZYWIENIE_POZIOM_NA_LIMICIE, level)`,
użyte w `applyCandidate`, w `levelByCityId` i lustrzanie w `maxSafePoziomRacjiForCity`.
Po poprawce ten sam scenariusz: **0,5 w obu wariantach**; oszczędność tam, gdzie realnie
istnieje, zachowana (×1: 4→6, ×0,5: 2→2,5). Skorygowałem też komentarz przy stałej — „NIE MOŻE
się kurczyć" było nieprawdą przy niedoborze.
Bramka: trzy nowe asercje kierunku niedoboru (B7a/B7b/B7c). **Dowód nietautologiczności:**
z cofniętym `Math.min` bramka schodzi do **58/60**, czerwienią się dokładnie B7b („bez limitów
0.5 → z limitami 0") i B7c („poziomy na limicie 1.5×5 vs wspólny 0").

## ZMIANY/COMMIT
- `gra/src/game/empire-food.ts` (+`cappedLevelFor`, 3 miejsca użycia, korekta komentarza)
- `gra/tools/autowyzywienie-rowny-wzrost-test.cjs` (+B7a/B7b/B7c)
- `dyspozycje/autobot/runs/R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A/decision-abc.md` (NOWY, C-054)
- `dyspozycje/autobot/runs/R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A/03-obrona.md`
- SHA: `04db1ac8` (kod + bramka + oba artefakty runu)

## TESTY (uruchomione po poprawce)
`tsc --noEmit` zielone (exit 0). Nowa bramka **60/60** (przed poprawką kodu: 58/60).
Zielone, exit 0: kosztarmii-kryterium, flow-balance, bilans-clamp, live-recalc,
population-growth-live-recalc, ai-major-economy, city-state-mp-growth, army-hunger-combat,
gold-deficit, magazyn-era-scaling, okolica-multi-city-overlap 55/55, spichlerz-deficyt-scalenie.
Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
Czerwone już na bazie (empire-food-b5, glod-wojska-karencja, grupa-b-lane,
population-growth-v85-bonus, spichlerz-wzrost): wyjścia **bit w bit identyczne** przed i po
tej poprawce (`diff` pusty dla wszystkich pięciu) — brak regresji. Zmiana jest aktywna wyłącznie
gdy podano `popCapByCityId`, a żadna z nich go nie podaje.
§9: bez `npm run build`/`dev`; commit po ścieżkach; `git diff --check` czysty; brak sekretów;
bez zmian w `main.ts`, `ui/**`, `WERSJE.md`, `playbook.json`, `docs/decyzje/**`.

BLOKADY: brak technicznych. Dwie pozycje do decyzji właściciela (zarzuty 1 i 2), opisane
w `decision-abc.md`.
RUNDY: 1/5 (obrona nie jest osobną rundą — §16b pkt 5)
NASTĘPNY KROK: Final Control (Sonnet 5, effort high) — werdykt per zarzut.
DEPLOY/PUSH: NIE WYKONANO
