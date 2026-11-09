STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TECH-IRON-GATING-IMPL-Q1
GOAL: Hutnictwo żelaza odkrywa surowiec żelazo + Kopalnię/Odlewnię/Kuźnię (bez jednostek epoki Żelaza); wszystkie jednostki epoki Żelaza rekrutuje dopiero Sztuka wojenna (prereq: Oblężnictwo + Obróbka żelaza + Hutnictwo żelaza).
ZMIANY/COMMIT: patrz SHA na końcu pliku (commit tej rundy na gałęzi worktree-wf_84207e30-c60-1, BAZA = origin/main 18b609dc3). Bez push, bez deployu.

## Zmiany (allowlista zachowana; gra/src poza wikiBundle.json NIETKNIĘTE)

1. gra/data/units.json: Tech = „Sztuka wojenna” dla 24 jednostek epoki Żelaza (19 z Hutnictwa, 4 z Obróbki: Gaesatae, Soldurii, Wojownik germański, Berserker germański, oraz Hieros Lochos z „—”). Katapulta zostaje na „Oblężnictwo”. Zmieniono wyłącznie pole Tech.
2. gra/data/tech.json:
   - Hutnictwo żelaza: „Odblokowuje budynek” = „Odlewnia żelaza; Kuźnia żelaza” (bez listy jednostek); surowiec żelazo i awansDoEpoki 3 bez zmian.
   - Obróbka żelaza: „Odblokowuje budynek” = „Wielka odlewnia; Wielka Kuźnia” (jednostki wycofane z opisu); epokaWejscia 4 tych budynków bez zmian.
   - Sztuka wojenna: „Wymaga (prereq)” = „Oblężnictwo + Obróbka żelaza + Hutnictwo żelaza” (jawnie, parsePrerequisites obsługuje 3 człony); „Odblokowuje budynek” = „Akademia wojskowa; Jednostki: <24 nazwy>”.
   - Kopalnia żelaza (terrain-improvements.json), Odlewnia i Kuźnia żelaza (buildings.json) NIETKNIĘTE (Hutnictwo żelaza) – brak cyklu Kuźnia/Obróbka.
3. Karty odkryć: źródło dyspozycje/autobot/runs/R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/odkrycia-top5.csv (3 wiersze: Hutnictwo – Top5 zamieniony z „19 jednostek” na „Kuźnia żelaza: +15% Pancerza” (kandydat „e” z turnieju) + CMZ „Zgromadź zapas żelaza…”; Obróbka – Top3 jednostki usunięty, CMZ skrócony; Sztuka wojenna – Top3 „24 jednostki epoki Żelaza, np. Falanga (Obrona 10)” + CMZ „Rekrutuj jednostki epoki Żelaza”), gra/tools/gen-tech-cards-top5.zdania.json (zdania), regeneracja gra/data/tech-cards-top5.json generatorem (`node tools/gen-tech-cards-top5.cjs`; `--check` OK).
4. Encyklopedia: docs/encyklopedia/technologie/{hutnictwo_zelaza,obrobka_zelaza,sztuka_wojenna}.md oraz 9 haseł jednostek (pole Tech) -> `node gra/tools/bundle-wiki-for-game.cjs` -> gra/src/data/wikiBundle.json (diff weryfikowany skryptem: dokładnie 12 haseł, wyłącznie intencjonalne).
5. Testy: nowy gra/tools/iron-gating-impl-test.cjs (121 asercji); dostosowane fixtury: super-unit-limit-one-test, unit-recruit-nazwa-test, unit-replace-test (lista techów + „Sztuka wojenna”), civpedia-caly-wiersz-przyciskiem-test, entity-card-cross-links-nested-overlay-test (Falanga: Tech = Sztuka wojenna), zelazo-mezopotamia-real-render-test, zelazo-srodziemnomorze-real-render-test (oczekiwany Tech).

## TESTY (uruchomione w worktree, `npm ci --ignore-scripts` w gra/)
- iron-gating-impl-test: 121 OK / 0 FAIL (24 jednostek Tech=Sztuka wojenna; Katapulta=Oblężnictwo; kopalnia/odlewnia/kuźnia na Hutnictwie; prereq Sztuki wojennej zawiera 3 techy; graf prereq+„wymagany budynek” bez cyklu; availableProduction: bez Sztuki wojennej żadna z 24 jednostek niedostępna (z Hutnictwem+Obróbką+Oblężnictwem), ze Sztuką dostępne; Katapulta z samym Oblężnictwem; po samym Hutnictwie lista rekrutacji NIE jest pusta – jednostki Brązu; canResearch Sztuki wojennej wymaga każdego z 3 prereq).
- Z listy audytu §8: tech-unlock-units 126/0, tech-cards-top5 594/0, building-tech-gate 91/0, unit-recruit-nazwa 17/0 (po poprawce fixtury), autoimprove-live-hooks 37/0, iron-native-access-fix 17/0, unit-epoch-cost 57/0, super-unit-limit-one 40/0 (po poprawce fixtury).
- Szerszy przegląd: 82 testy .cjs wspominające Hutnictwo/Sztukę wojenną/jednostki Żelaza. Regresje spowodowane zmianą: unit-replace-test (3 FAIL), civpedia-caly-wiersz (fixture), entity-card-cross-links-nested-overlay (fixture), zelazo-mezopotamia (4 FAIL) – wszystkie naprawione i zielone (unit-replace 15/15; civpedia 85/85; nested-overlay 24/0; mezopotamia 72/0; srodziemnomorze PASS).
- Niezwiązane, istniejące już na origin/main (zweryfikowane w osobnym worktree na 18b609dc3, te same wyniki): ai4-popyt-obywatele (17 FAIL), auto-fort-claim (2), defense-breakdown, ekonomia-5x-inwariant, weterani (1), resource-usage-breakdown (2), ruch-swiata-tempo, zelazo-celtowie-miecznik-rydwan (1, Pancerz rydwanu), tech-discovery-badge-diorama (2), entitycard-sufit-dwoch-kart (9). Nie ruszano.
- NIE_ZMIERZONO: 4 testy przekroczyły limit 120 s w pętli zbiorczej (autoimprove-irrigation-after-farms, autoimprove-stages-q1, hud-tooltip-body-mounted-panels, r-bitwa-etykieta-tozsamosc-strony-live-atak, sidepanel-hud-deadzone – te zależności od techów to tylko listy badań pod ulepszenia; brak związku z jednostkami); r-bitwa-etykieta-tozsamosc-strony-real-render: błąd TypeError w page.evaluate (nie związane). Chromium (puppeteer) był dostępny – testy real-render przebiegły. Pełne `vite build` NIE uruchamiano (zakaz dispatchu). Weryfikacja w pełnej grze (ręczna rozgrywka) NIE_ZMIERZONO.

## Analiza AI i skutki dla rozgrywki (bez zmian w gra/src – nie była konieczna)
- Grep gra/src: żaden plik AI (ai.ts, ai-production-priorities itd.) nie odwołuje się do nazw „Hutnictwo żelaza/Obróbka żelaza/Sztuka wojenna” (jedyne wystąpienia: ikony, komentarze, awansDoEpoki w loaderze). AI wybiera badania i jednostki generycznie (availableProduction / dostępne techy), więc nie ma twardych priorytetów do przestawienia.
- W oknie po Hutnictwie do Sztuki wojennej (epoka 3) availableProduction zwraca jednostki Brązu (okno epoka i epoka−1) + Katapultę po Oblężnictwie; test potwierdza niepustą listę rekrutacji (n>0). AI nie dostaje pustej listy. Ryzyko balansu: dłuższy okres bez jednostek Żelaza (Sztuka wojenna = Żelazo poz. 9, koszt 800, wymaga Drogi brukowane → Obróbka). Nie wykonano korekty priorytetu badań AI (nieoczywiście konieczna). Rekomendacja dla orkiestratora: ewentualnie później pomiar ERAWAR/okna wojen epoki w żywej grze.
- Zapisy: gracze z już zbadanym Hutnictwem, bez Sztuki wojennej – istniejące jednostki Żelaza zostają (jednostki w armiach nie są usuwane), natomiast rekrutacja i zamiana (Zastąp) tych jednostek są zablokowane do zbadania Sztuki wojennej (bramka Tech w production.ts). Brak migracji zapisu; w kolejce rekrutacji już dodane pozycje nie są usuwane przez ten temat.
- Hieros Lochos: Tech zmieniony z „—” na Sztukę wojenną (zgodnie z interpretacją dispatchu); Super-limit 1 bez zmian.

## Dług / do rejestru
- REPIN Rust: tech.json/units.json/tech-cards-top5.json (bramki Tech jednostek Żelaza; prereq Sztuki wojennej).
- docs/PORADNIK-GRACZA/57-katalog-jednostek.md i 09-nauka-epoki.md mogą wymieniać stare bramki (nie sprawdzano, poza allowlistą encyklopedii).
- Istniejące niespójności encyklopedii (koszt nauki 400 vs 800 w tech.json) nie zmieniane – poza zakresem.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ta sama gałąź/commit) -> Obrona -> Final Control -> integracja orkiestratora (sprawdzić merge-base --is-ancestor i diff --stat)
DEPLOY/PUSH: NIE WYKONANO

SHA-KOD: 9587c9201d774754fe3bbfdeb0fa64522c463ba6 (gałąź worktree-wf_84207e30-c60-1, rodzic 18b609dc3 = origin/main)
