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
