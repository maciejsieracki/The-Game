# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Operator (Claude Sonnet 5.5), runda 2/5 (teksty UI i main.ts)

STATUS: PASS-WITH-NOTES (poprawki pewne wykonane; audyt NADAL CZĘŚCIOWY — lektura liniowa nie objęła wszystkich literałów; lista ABC niżej)
DOMAIN: GAME (TEKSTY)
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1
GOAL: Poprawki PEWNYCH błędów polszczyzny w literałach napisów dla gracza w gra/src/ui/** i gra/src/main.ts (bez entityCards/**, resourceAmountChip.ts, administratorIcon.ts, buildModeHud.ts), bez zmian logiki/kluczy/ID/liczb; wątpliwe -> ABC.
BAZA: origin/main 4ee2aba61 (detached worktree).

## Metoda (uczciwie)

Skrypt wyciągnął 3015 literałów napisów (cudzysłowy/backticki) zawierających polskie znaki lub heurystycznie polskie słowa (cityPanel 861, main 643, empireDetailPanel 351, ...). Zastosowano skany klas błędów: (a) ASCII-fikacja — słowa bez ogonków, dla których w korpusie istnieje wariant z ogonkami (automatyczna lista kandydatów + ręczna selekcja; odrzucono identyfikatory/klucze/logi konsoli), (b) liczebnik + rzeczownik w złej formie (`${n} tur`, `${n} jednostek`, `${n} miast`, `${n} obywateli`, `tur(y)`), (c) niezgodne cudzysłowy polskie („…" zamiast „…”), (d) podwójne spacje/interpunkcja. NIE czytano linia po linii wszystkich 3015 literałów — wyniki skanów (b)/(c) przejrzano w całości, reszta korpusu (składnia, styl, spójność terminów) została tylko częściowo przeczytana przy okazji. To NIE jest poświadczenie lektury całego korpusu UI. Komunikaty console.* / diagnostyczne (ASCII bez ogonków: „[Oblezenie]”, „Blad …”) pominięte — nie są widoczne dla gracza.

## Tabela poprawek (plik:miejsce, przed -> po, kategoria)

| Plik (miejsce) | Przed | Po | Kat. |
|---|---|---|---|
| newGameFlow.ts EPOCHS (648-650) | „Epoka Brazu”, „Epoka Zelaza”, „narzedzia”, „potezne”, „cale Kamien + caly Braz juz zbadane”, badge „Dostepna” | „Epoka Brązu”, „Epoka Żelaza”, „narzędzia”, „potężne”, „cały Kamień i cały Brąz już zbadane”, „Dostępna” | pisownia (ogonki), spójność nazw epok |
| newGameFlow.ts epochTechSummary (1607-1609) | „Brak wczesniejszych”, „Masz juz … Epoke Braz badasz”, „… Kamienia i Brazu. Epoke Zelaza” | „wcześniejszych”, „już”, „Epokę Brązu”, „Kamienia i Brązu. Epokę Żelaza” | pisownia + odmiana |
| newGameFlow.ts podsumowanie generowania (2229-2299) | „Trudnosc”, „Typ swiata”, „Miasta-panstwa”, „Predkosc”, „Jakosc grafiki”, „Barbarzyncy”, „Zwyciestwo”, „Koszty budynkow”, „Wzrost ludnosci”, „Zasieg ruchu”, „Trudnosc miast-panstw”, „Latwy”, „(jak glowna)” | Trudność, Typ świata, Miasta-państwa, Prędkość, Jakość grafiki, Barbarzyńcy, Zwycięstwo, Koszty budynków, Wzrost ludności, Zasięg ruchu, Trudność miast-państw, Łatwy, (jak główna) | pisownia |
| newGameFlow.ts (2255-2290) | „Normalny (x2 prog)”, „Niski (x1)” itd. | „Normalny (×2 próg)”, „Niski (×1)”, „Krótki (×1)” … (znak ×, spójnie z opisami; „próg” z ogonkiem) | pisownia/spójność |
| sciencePicker.ts:1453 | „Nie udalo sie odswiezyc drzewka. Zamknij i otworz ponownie.” | „Nie udało się odświeżyć drzewka. Zamknij je i otwórz ponownie.” | pisownia |
| cityPanel.ts:6524, 9013 | „Za malo zlota”, „Zaplac zlotem i ukoncz natychmiast” | „Za mało złota”, „Zapłać złotem i ukończ natychmiast” | pisownia |
| main.ts:44207 | „najedz na pole i nacisnij B” | „najedź na pole i naciśnij B” | pisownia |
| main.ts:37854,37930,37935,38400 | „Autozapis nieudany (blad zapisu)” | „(błąd zapisu)” | pisownia |
| main.ts:45583,45833,46057 | „sprobuj inny seed” | „spróbuj innego seeda” | pisownia + odmiana |
| cityPanel.ts:3504,3514,3594,3650; orderPanel.ts:188 | „N tur”, „N tur(y) na reakcję” | formatTurCount(N): „1 tura / 2 tury / 5 tur”, „… na reakcję” | gramatyka (liczebnik) |
| techTreeView.ts:716,726 | „N tur do końca”, „≈ N tur przy” | formatTurCount | gramatyka |
| empireDetailPanel.ts:4239 | „Głód wojska za N tur” | formatTurCountAcc (biernik: „za 1 turę / 2 tury / 5 tur”) | gramatyka |
| main.ts:21061,21085,21672,23657 | „na N tur”, „przez N tur” | formatTurCountAcc | gramatyka (biernik) |
| empireDetailPanel.ts:4174 | „N jednostek na mapie” | formatJednostkiCount („1 jednostka”, „2 jednostki”) | gramatyka |
| cityPanel.ts:10051 | „Odfortyfikuj wszystkie N jednostki” (błędne dla N≥5) | „Odfortyfikuj wszystkie (N jednostek/jednostki)” przez formatJednostkiCount | gramatyka |
| main.ts:9418,26144 | „N jednostek odfortyfikowano” (N>1) | formatJednostkiCount(N) | gramatyka |
| main.ts:38853,38855,39384,39387 | „utracono N jednostek”, „u N jednostek” | pluralPl: „utracono 1 jednostkę / 2 jednostki / 5 jednostek”, „u 1 jednostki” | gramatyka |
| hud.ts:1134, main.ts:19418,20192,47398-47420, saveLoadDialog.ts:48 | „N miast” (także dla N=1) | formatMiastaCount | gramatyka |
| empireDetailPanel.ts:2314 | „N budynków” | formatBudynkiCount | gramatyka |
| diplomacyAcceptanceBalance.ts:421 | „(N umów)” | formatUmowyCount („2 umowy”) | gramatyka |
| manpower.ts formatObywateleLabel; cityPanel.ts:11439; hud.ts:1144 | „2 obywateli”, „3 obywateli” | „2 obywatele”, „5 obywateli”, „22 obywatele” | gramatyka |
| ~28 literałów (cityPanel, empireDetailPanel, diplomacy*, hud, newGameFlow, perfTestPanel, scienceHubHud) | „Do skarbca", „Indywidualne", „Zobacz szczegóły zużycia", „Umowa wymiany", „Przekaż dar", „Co turę", „Dalej", „Karta", „Uruchom test” … z zamknięciem ASCII `"` | zamknięcie polskie ” (U+201D); komentarze deweloperskie NIE ruszane | interpunkcja |

Nowe pomocniki (formatPl.ts): pluralPl, formatTurCount, formatTurCountAcc, formatBudynkiCount, formatUmowyCount (istniejące formatJednostkiCount/formatMiastaCount reużyte). Zmieniona etykieta w game/manpower.ts (formatObywateleLabel) — czysta funkcja napisu, brak zmiany logiki. Test zsynchronizowany: tools/praca-auto-ulepszenia-koszt-split-test.cjs:268 (oczekiwany tekst „Do puli” z cudzysłowem ” — ta sama asercja, zmieniony tylko znak).

Nie zmieniano: kluczy/ID/liczb, nazw funkcji, entityCards/**, resourceAmountChip.ts, administratorIcon.ts, buildModeHud.ts, data/ui-params.json.

## Lista do ABC (wątpliwe/stylistyczne — NIE zmieniano)

1. Terminologia „złoto” vs „Pieniądz”: „Za mało złota”, „Zapłać złotem” (cityPanel.ts:6524,9013), „Kup natychmiast za N złota”, „Deficyt Złota” (main.ts:39384-39387) — konwencja właściciela to „Pieniądz”; zmiana to decyzja terminologiczna (dotyka testów).
2. data/ui-params.json: rozmiar mapy „Malenki” (brak ogonka; „Maleńki”) oraz „Super Huge” (anglicyzm) — wartości używane jako klucze w src/map/generator.ts, perf/hardwareProfile.ts, data/e-start-params-loader.ts; zmiana etykiety wymaga rozdzielenia klucza i etykiety.
3. Żargon deweloperski w tekstach gracza: cityPanel.ts:5088 „rownowaga(W) × pieniądz_miasta”, 5115 „rownowaga(W)”, 10264-10265 „wagi score”, „Posortuj malejąco po score; … klucz „q,r””, „Zrówn.” — do przepisania na język gracza; cityPanel.ts:6521 „Wymaga wpiecia onPurchaseBuilding przez silnik” (tooltip stanu awaryjnego).
4. „Odfortyfikuj wszystkie (N jednostek)” — wybrano nawias dla zachowania sensu; alternatywa: „Odfortyfikuj wszystkie jednostki (N)”.
5. „Wybierz czas umowy od 1 do N tur” (diplomacyTradeBasket.ts:1357,1385) — po „do” dopełniacz liczby mnogiej; poprawne dla N≥2, pominięto.
6. Mieszany zapis „×N” / „xN” / „N×” w UI — decyzja stylu.
7. Skróty telegraficzne „obyw./turę”, „szt./turę”, „j.” (saveLoadDialog.ts:48) — konwencja skrótów do potwierdzenia.
8. Komunikaty diagnostyczne w console.* i logach main.ts bez ogonków („[Oblezenie]”, „Blad …”) — niewidoczne dla gracza; ewentualnie osobny temat porządkowy.

## TESTY (surowe wyniki w worktree po poprawkach)

- tsc --noEmit: 0 błędów (jedna korekta typu w trakcie pracy: `?? 0`).
- logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- ids-leak-audit-test: 1648 ok, 0 FAIL. wonder-text-no-raw-ids-test: 132 ok, 0 FAIL. city-administrator-test: 117 passed, 0 failed.
- terminology-trade-vs-tax-test: 798 pass, 1 fail ([P] Mennica (karta odkrycia): oczekiwane „×1,50” vs dane po FALI 645) — NIE 799/0 jak w DODATKU; przyczyna po stronie main (gra/data/tech-cards-top5.json nietknięty, `git diff -- gra/data` pusty); nie naprawiano.
- polish-language-audit-q1-guard-test: 4477 ok, 0 fail (1674 z r1 + 2803 runda 2). Dowód mutacyjny: (1) każdy regex ma próbkę błędnego tekstu, którą MUSI złapać; (2) realna mutacja `Za mało złota` -> `Za malo zlota` w cityPanel.ts dała 1 FAIL, po cofnięciu 0 fail; test sprawdza też runtime odmiany helperów (esbuild transform formatPl.ts i formatObywateleLabel).
- Testy dotykające zmienionych napisów: praca-auto-ulepszenia-koszt-split-test 20/0 (po synchronizacji), autowyzywienie-stan-przycisku-test 90/0, sidepanel-event-tabs-classify-test PASS, load-game-regression-test 34/0, autosave-quota-fail-test 22/0, hud-obywatele-chip-test 20/20, praca-limit-50-test 34/0, praca-miasto-limit-50-cap-test 50/0, diplo-quick-actions-labels-test 38/0, diplomacy-infografiki-tooltipy-test 12/0.
- Czerwone z przyczyn środowiskowych (baseline NIE_ZMIERZONO na czystym main): panel-kolejka-pasek-postepu-test 80/2 (H2/H3 wymagają artefaktu `dist/` — brak builda, zakaz npm run build), empire-panel-miasto-obywatele-content-test (esbuild: brak loadera .svg przy bundlowaniu brandAssets).
- wikiBundle odtwarzalny: `node tools/bundle-wiki-for-game.cjs` -> brak zmian w gra/src/data/wikiBundle.json (docs/encyklopedia nie ruszane w tej rundzie).
- NIE uruchomiono: bramek wymagających builda/Chromium (zakaz npm run build/dev) ani pełnego zestawu testów UI real-render.

## BLOKADY

brak (jedna czerwona asercja terminology [P] i dwa testy środowiskowe opisane wyżej).

## RUNDY

2/5

## NASTĘPNY KROK

Evaluator: weryfikacja diffu (tylko literały + helpery odmiany), uruchomienie guarda i testów powyżej, decyzje ABC z listy.

## DEPLOY-PUSH: NIE WYKONANO

(Uwaga procesowa: zacommitowano pliki kodu zmienione w tej rundzie wraz z raportem, wyłącznie przez `git add <ścieżka>`, bo SHA ma nieść kod do Evaluatora; bez push.)

---

# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — Operator (Claude Sonnet 5.5), runda 1/5

STATUS: PASS-WITH-NOTES (poprawki pewne wykonane; audyt NADAL CZĘŚCIOWY; lista ABC poniżej)
DOMAIN: GAME (TEKSTY)
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1
GOAL: Poprawki PEWNYCH błędów polszczyzny (kat. 1–3 i 5) w plikach danych i dokumentach rundy 1; wątpliwe → ABC; bez zmian kluczy/ID/liczb/mechaniki.
BAZA: origin/main a8b063989 (detached worktree).

## Metoda (uczciwie)

Wyodrębniono 1555 łańcuchów tekstu z tech.json, buildings.json, wonders.json, tech-cards-top5.json, building-cards-top5.json (1435 pól widocznych dla gracza, reszta to uwagi/_meta deweloperskie, pominięte). Przeskanowano regexami (spacje, interpunkcja, cudzysłowy, nawiasy, powtórzenia, ASCII-fikacja, ID, angielskie słowa, liczba+mianownik) oraz PRZECZYTANO w całości: karty odkryć (zdania/tytuły/cmz), opisy i Top3 budynków, wymagania, nazwy poziomów, bonusy cudów, kolumny tech.json. NIE czytano linia po linii: pól `Historia` (tech/buildings/wonders — proza historyczna, tylko skan regexami), 177 plików docs/encyklopedia (skan regexami + punktowe grepy), poradników (skan regexami). To NIE jest poświadczenie lektury całego korpusu. Teksty gra/src/ui i main.ts — runda 2 (poza zakresem).
Materiał `origin/codex/polish-ui-q3` (3e90dd47f): zawiera wyłącznie raport + macierz pokrycia (0 poprawek tekstu) — nic do przeniesienia.

## Tabela poprawek (plik:pole → przed → po → kategoria)

| Plik:pole | Przed | Po | Kat. |
|---|---|---|---|
| dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv (źródło generatora) → data/tech-cards-top5.json Garncarstwo.top5 tytuł | „Cegielnia: cegła (2 glina + 1 drewno → 2 cegły)” | „… (2 gliny + 1 drewno → 2 cegły)” | gramatyka (odmiana) |
| odkrycia-top5.csv + tools/gen-tech-cards-top5.zdania.json → tech-cards-top5.json (Wojskowość tytuł i zdanie; Inżynieria tytuł) | „Brama narodów” (3 miejsca) | „Brama wszystkich narodów” (pełna nazwa cudu z wonders.json) | spójność nazw |
| wonders.json: parkowane_epoka4plus[].nazwa + _meta chinczycy_v1 | „Wielki dzwón” | „Wielki dzwon” | pisownia |
| wonders.json bonusy.specjalne[].opis (Piramidy) | „+3 Pieniądz/turę” | „+3 Pieniądza/turę” | gramatyka |
| wonders.json (Wiszące ogrody) | „+15% wzrost populacji…”; „+2 bazowe Zaufanie…” | „+15% wzrostu populacji…”; „+2 bazowego Zaufania…” | gramatyka |
| wonders.json (Wyrocznia) | „+3 Zaufanie — wyrocznia…” | „+3 Zaufania — …” | gramatyka |
| wonders.json (Stupa) / (Pałac Weiyang) | „+4 bazowe Zaufanie” (2×) | „+4 bazowego Zaufania” | gramatyka |
| wonders.json (Petra) | „+6 pojemność handlu/surowców” | „+6 pojemności handlu/surowców” | gramatyka |
| wonders.json (Kolos Rodyjski) | „+8 pojemność surowców / trade capacity” | „+8 pojemności surowców” | gramatyka + żargon (angielski) |
| wonders.json (Koloseum / Dur-Sharrukin / Brama / Yerkapı / Peruna) | „+3 Zaufanie wewnętrzne”; „−2 Zaufanie u sąsiadów”; „+3 Zaufanie u państw…”; „+2 Zaufanie u sojuszników”; „+3 Zaufanie wśród…” | „+3 Zaufania wewnętrznego”; „−2 Zaufania u sąsiadów”; „+3 Zaufania u państw…”; „+2 Zaufania u sojuszników”; „+3 Zaufania wśród…” | gramatyka |
| buildings.json: Teatr.opis | „…rozrywki mieszkańców, którego efekty zostały włączone do Akademii i nie jest budowany…” (błąd składni: niezgodny podmiot) | „…mieszkańców; jego efekty zostały włączone do Akademii, więc nie jest budowany…” | składnia |
| buildings.json: Cegielnia.opis | „…konstrukcji i otwierający drogę do pisma.” | „…konstrukcji oraz otwierając drogę do Pisma.” | składnia + nazwa własna (technologia Pismo) |
| buildings.json: Garncarnia.top3[1].tytul; Cegielnia.top3[1].tytul | „Wytapia ceramikę” / „Wytapia cegłę” (ceramikę/cegłę się wypala, nie wytapia; opisy obu budynków mówią „wypala”) | „Wypala ceramikę” / „Wypala cegłę” | leksyka/spójność |
| buildings.json: Kuźnia brązu.top3[1].tekst | „…z kuźnią żelaza i Wielką Kuźnią…” | „…z Kuźnią żelaza i Wielką Kuźnią…” | pisownia (nazwa własna) |
| buildings.json: Warsztat kamieniarski.opis | „u progu epoki kamienia” | „u progu epoki Kamienia” (jak w kartach: „epoka Kamienia”) | pisownia/spójność |
| buildings.json: nazwyPoziomow (Targowisko, Biblioteka, Pałac, Stolarnia) | „Gielda”, „Gielda papierow wartosciowych”, „Centrum badan”, „Wydzial nauki”, „Dwor”, „Wiezowiec z drewna” | „Giełda”, „Giełda papierów wartościowych”, „Centrum badań”, „Wydział nauki”, „Dwór”, „Wieżowiec z drewna” | pisownia (polskie znaki); wyświetlane w cityPanel/entityCards |
| docs/encyklopedia/budynki/swiatynia.md (tytuł, metadane, Wiki-S/M) + indeks.md | „Swiatynia” (4+1 miejsc; widoczne jako tytuł hasła Civpedii) | „Świątynia” | pisownia |
| docs/encyklopedia/budynki/teatr.md, palac.md (linia „Uwaga”) | „Glowne zrodlo … w epoce Zelaza”; „siedziba zarzadcy; glowne zrodlo” | „Główne źródło … w epoce Żelaza”; „siedziba zarządcy; główne źródło” | pisownia |
| docs/encyklopedia/ulepszenia/*.md (13 plików, 20 wystąpień) | „+3 żywność/t”, „+2 praca/t”, „+6 podatek/t” | „+3 żywności/t”, „+2 pracy/t”, „+6 podatku/t” | gramatyka (liczba + dopełniacz) |
| gra/src/data/wikiBundle.json | — | REGENEROWANY generatorem `node tools/bundle-wiki-for-game.cjs` (powtórne uruchomienie daje identyczny wynik = odtwarzalny) | — |

Zmienione pliki (allowlista wyliczona po audycie): dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv, gra/tools/gen-tech-cards-top5.zdania.json, gra/data/{tech-cards-top5,wonders,buildings}.json, gra/src/data/wikiBundle.json, docs/encyklopedia/{indeks.md, budynki/{swiatynia,teatr,palac}.md, ulepszenia/*.md (13)}. tech-cards-top5.json regenerowany generatorem (`gen-tech-cards-top5.cjs`, --check OK). building-cards-top5.json i jego generator NIE tknięte.

## Zgłoszenia do wejść generatora building-cards-top5 (temat R-WEB-TEST-DEBT-...-GENERATOR-Q1)

Nie wykryto błędów językowych wymagających zmian w `gen-building-cards-top5.korekty.json` na podstawie lektury 358 pól — brak zgłoszeń. (`--check` czerwony pre-istniejąco, bez zmian z mojej strony; terminology-trade-vs-tax 798 pass / 1 fail = ta sama jedna asercja [G].)

## Lista do ABC (wątpliwe/stylistyczne — NIE zmieniano)

1. Pisownia „Dur-Sharrukin” (nazwa cudu w wonders.json/kartach, zaszyta jako klucz w civs.json/city-names-pools/turn-economy) vs „Dur-Szarrukin” w tekstach historii i dur_sharrukin.md. Rekomendacja: zostawić klucz, ujednolicić wyświetlaną nazwę na „Dur-Szarrukin” (zmiana nazwy to decyzja właściciela).
2. Żargon „upgrade” w polu `wymagania` (10 budynków: „upgrade Pałac I”, „Upgrade ze Spichlerza I + Epoka 2 + …”) i w dokumentach; dodatkowo „upgrade Pałac I/II”, „upgrade Dwór Zarządcy” bez odmiany. Rekomendacja: „Rozbudowa Pałacu I” itd. — dotyka wiki, testów prereq i konwencji właściciela, więc ABC.
3. Emporion.top3[1] „Dzięki Emporionowi o jedną trasę więcej w mieście otrzymuje premię 5% …” — zdanie niegramatyczne i niejednoznaczne semantycznie (premia dla każdej trasy czy tylko dodatkowej?). Wymaga potwierdzenia mechaniki; sugestia: „Każda trasa handlowa miasta z Emporionem otrzymuje premię 5% do dochodu…”.
4. Emporion.top3[2] „Dodatkowa linia handlowa :: … dodatkowy slot linii wymiany” — anglicyzm „slot” i niespójność („linia handlowa”/„linia wymiany”/„trasa”); sugestia: „Dodatkowa trasa handlowa”. Pominięto, bo dotyka terminologii handel/wymiana (tom R-WEB-TERMINOLOGY).
5. Sprzeczność semantyczna: Wielka Kuźnia.top3[1] „nie kumulując się z Kuźnią żelaza” vs Kuźnia brązu/żelaza „kumuluje się z … Wielką Kuźnią, maks. +45%” — to nie język, lecz opis mechaniki; do rozstrzygnięcia przez właściciela.
6. „kamiennych Murów” / „Mury kamienne” (Palisada.top3, Cytadela) — pisownia nazwy budynku „Mury kamienne” rozbita na „kamienne Mury”; styl, ale wielka litera w środku frazy; sugestia „Murów kamiennych”.
7. Notacja tabelaryczna „+5 praca”, „+5 podatek” w docs/PORADNIK-GRACZA/45-katalog-budynkow.md i podobnych (telegraficzne etykiety w tabelach) — traktowane jako konwencja tabeli, nie zmieniano; ABC czy odmieniać.
8. Pola `Historia` (tech 32, buildings 44, wonders 19), docs/encyklopedia „Rys historyczny”: tylko skan regexami; lektura pełna wymaga osobnych paczek (runda 2+). Frazy „co niektórzy badacze…” uznane za poprawne.
9. Dev-notatki w `uwagi` (buildings.json), `_meta`/`_opis` (wonders/tech) zawierają ASCII-fikację i żargon deweloperski, ale NIE są widoczne dla gracza — poza zakresem; jeśli właściciel chce porządku w danych, osobny temat.
10. Etykiety „(cywilizacja)” doklejone do każdego opisu bonusu cudu (wonders.json) — znacznik zakresu, wygląda jak żargon; sugestia usunąć w warstwie prezentacji (runda 2).

## TESTY (surowe wyniki, uruchomione w worktree po poprawkach)

- ids-leak-audit-test: 1648 ok, 0 FAIL
- wonder-text-no-raw-ids-test: 132 ok, 0 FAIL
- terminology-trade-vs-tax-test: 798 pass, 1 fail (jedyna asercja [G] = `gen-building-cards-top5 --check`, pre-istniejąca; baza z dispatchu 795/1)
- city-administrator-test: 117 passed, 0 failed
- tech-cards-top5-test: 595 pass, 0 fail; `gen-tech-cards-top5.cjs --check` OK
- building-cards-top5-test: 1206 pass, 1 fail (pre-istniejące --check generatora; temat równoległy)
- prereq-budynkow-test: 62 pass, 0 fail
- building-detail-card-entitycard-migration-test: 54 pass, 1 fail — „dopełnia sekcję Uwagi (playerFacingNote)”; zweryfikowane: identyczny wynik 54/1 na niezmienionym buildings.json z origin/main (pre-istniejące, nie regresja)
- pr141-matrix-only-data-wiki-test: 15 civ rows, 9 bundled pages passed
- entity-card-contract-test: 75 pass, 0 fail
- Bramki referencyjne: logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6
- `npx tsc --noEmit`: 0 błędów (puste wyjście)
- wikiBundle odtwarzalny: `bundle-wiki-for-game.cjs` uruchomiony 3×, wynik identyczny (22 rozdz. + 174 haseł)
- Nie uruchamiano: map-gen-regression-test (wolny, bez związku z tekstami), build/dev (zakaz).

## BLOKADY: brak. Założenia: (a) poprawki Zaufanie→Zaufania/Pieniądza itp. w wonders.json uznane za pewne (gramatyka liczebnik+dopełniacz, spójne z kartami tech); (b) commit obejmuje pliki zmian wymienione w „Zmienione pliki” + ten raport (dispatch: raport zacommitowany; zmiany kodu/danych są przedmiotem rundy), dodane wyłącznie po jawnych ścieżkach.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (niezależna weryfikacja tabeli i testów) → Obrona → Final Control; runda 2: gra/src/ui + main.ts oraz pełna lektura pól Historia.
DEPLOY/PUSH: NIE WYKONANO
