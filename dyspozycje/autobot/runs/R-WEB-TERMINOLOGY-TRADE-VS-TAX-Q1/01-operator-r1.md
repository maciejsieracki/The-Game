STATUS: DECISION_REQUIRED (część C do ABC; reszta tematu gotowa do Evaluatora — PASS-WITH-NOTES po stronie A/J)
DOMAIN: GAME
TEMAT: R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1
GOAL: Ujednolicić terminologię w tekstach widocznych dla gracza: produkcja pola/budynku/ulepszenia/technologii/cudu = PODATEK; „handel” wyłącznie w wymianie (trasy, umowy, kosze, cła, port/szlak). Bez zmiany identyfikatorów, kluczy JSON, nazw pól, liczb ani logiki.
ZMIANY/COMMIT: kod+dane+test: 8d0ad983c (baza: origin/main 60a18c60d, `git merge-base --is-ancestor` OK; 40 plików, w tym 19 plików wiki cudów); ten raport + tabela audytu: commit raportowy po 8d0ad983c (HEAD gałęzi `worktree-wf_043d1f0c-3d2-1`). Pełna tabela audytu: `dyspozycje/autobot/runs/R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1/01-audyt-tabela.md`.
TESTY: patrz sekcja TESTY niżej.
BLOKADY: brak blokad technicznych; DECISION_REQUIRED dla klasy C (sekcja C).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ten sam ID) -> Obrona -> Final Control; orkiestrator zadaje ABC właścicielowi w sprawie klasy C.
DEPLOY/PUSH: NIE WYKONANO

## Ustalenie z kodu (podstawa klasyfikacji)

Pole `handel` w `TileYield` to **Podatek**: `economy.ts:396` czyta `row['Podatek'] ?? row['Handel']`, `danina-nazwa.ts` (decyzja 2026-07-27) nazywa ten strumień zawsze „Podatek”, `hexContextTooltip.ts:106` już pokazuje `{ key:'handel', label:'Podatek' }`. Handel z tras to osobny strumień „Handel ze szlaków” (`hud.ts`, `trade-routes.ts`), a chip HUD „Handel” liczy wyłącznie dochód z tras (`handelChipTitle`) — więc chip to klasa B, nie C. Błąd właściciela (karta Farmy: „+3 handlu na polu”) pochodził z CSV kart odkryć (źródło tytułów/CMZ) i ze zdań w `gen-tech-cards-top5.zdania.json`, a nie z silnika.

## Liczby (audyt)

- Stringi TS (parser AST, `handel|handl`): 363 literały w 51 plikach: **A = 5 literałów** (adaptery ×2, main.ts ×2, cityPanel ×1; wszystkie zmienione), **B = 146** (trasy, umowy, dyplomacja, panel imperium, HUD), **C = 24** (cityPanel: podział/suwak/formuły — patrz niżej), **T = 188** (identyfikatory, klucze, klasy CSS, import, „unhandledrejection” — poza zakresem).
- Zmienione teksty gracza (klasa A, źródła): 23 stringi kart odkryć (generator + zdania.json), 1 karta budynku (Mennica), 2 pola `warunek` ulepszeń (Droga, Droga brukowana), 2 opisy cudów (wonders.json), 2 etykiety adapterów kart, 2 komunikaty main.ts, 1 pasmo Ładu cityPanel.ts, 19+1+2+1 plików/stringów CIVPEDII (cuda ×19, cuda-swiata, droga ×2, poradnik 05), 2 stringi generatora wiki. Pochodny `wikiBundle.json`: 43 zmienione stringi (zweryfikowane programowo, tylko powyższe).
- Korekta językowa (Dodatek 1/3): 4 stringi (2 tytuły, 2 zdania) — tabela niżej.
- Klasa B zostaje: m.in. wszystkie „trasy handlowe”, Wymiana, Targowisko/Port/Emporion (trasy), „Port handlowy”, grupa „Handel i pieniądz”, chip HUD „Handel” i „Handel ze szlaków”, panel imperium „HANDEL — SZLAKI HANDLOWE”, bonusy % cudów do tras, dyplomacja (umowy, koszyk), „handel wewnętrzny” (trasy między własnymi miastami).

## Co sprawdziłem w silniku, żeby nie zgadywać po nazwie (Dodatek 2)

- Targowisko: `econ-params.json:278-283` — premia wyłącznie do dochodu z tras (+62/+50/+38%), NIE mnoży lokalnego podatku -> teksty Targowiska o „dochodzie z tras handlowych” = B (zostają).
- Mennica: `econ-params.json:590` — mnoży wyłącznie podatek miejski, trasy pomija -> „mnoży podatek” (A zmienione; „nie obejmuje tras” = B).
- Emporion „+5% handlu” (`buildings.json:1139`): premia 5% do dochodu TRASY -> B (zostaje).
- Cuda „+15% Handlu — dochodu z tras handlowych” (`wonders.json`) -> B (zostaje, tekst sam mówi o trasach).
- Cuda „+10 do handlu” po absolut (atrakcja turystyczna): `wonders-data.ts` -> yield pola (TileYield.handel) = podatek -> A.
- „Obóz łowiecki: +1 pieniądza, +2 handlu”: w `terrain-improvements.ts:162` „pieniadz z JSON -> handel” (TileYield nie ma osobnego pieniądza na polu) — liczby nie ruszane; tytuł brzmi teraz „+1 pieniądza, +2 podatku” (patrz uwagi).

## Co zmieniono (dokładnie)

Źródła treści kart odkryć (tytuły z CSV, CMZ z CSV, zdania ręczne):
- `gra/tools/terminology-trade-vs-tax.cjs` (NOWY) — wspólne reguły: `CSV_RULES` (A: `+N handlu` -> `+N podatku`; język: `— klucza do tras` -> `— klucz do tras`), `FORBIDDEN_A`, `FORBIDDEN_LANG`.
- `gra/tools/gen-tech-cards-top5.cjs` — tytuły i CMZ pochodzące z CSV przechodzą przez `normalizeCsvText` (CSV nie ruszane — leży poza allowlistą; poprawka u źródła generatora).
- `gra/tools/gen-tech-cards-top5.zdania.json` — 11 zdań/tytułów (A) + „bez której” -> „bez których” (×2).
- `gra/tools/gen-building-cards-top5.korekty.json` — wpis „Mennica” (zmiana Top1 zdania, z powodem).
- `gra/data/tech-cards-top5.json`, `gra/data/building-cards-top5.json` — regenerowane generatorami (`--check` zgodny).
- `gra/data/terrain-improvements.json` (`warunek` Drogi i Drogi brukowanej), `gra/data/wonders.json` (opis + legenda atrakcji turystycznej).
- `gra/src/ui/entityCards/improvementAdapter.ts`, `wonderAdapter.ts` — etykieta wiersza dla pola `handel`: „Handel” -> „Podatek” (karta ulepszenia pokazuje teraz „Podatek: +3” zamiast „Handel: +3”; klucz `handel` bez zmian).
- `gra/src/main.ts` (2 komunikaty o cudzie), `gra/src/ui/cityPanel.ts` (pasmo Ładu).
- CIVPEDIA: `docs/encyklopedia/cuda/*.md` (19), `pojecia/cuda-swiata.md`, `ulepszenia/droga.md`, `docs/PORADNIK-GRACZA/05-budowa-mapa.md`; generator `tools/generate-encyklopedia.cjs` (2 stringi, żeby regeneracja nie cofnęła zmiany); `gra/src/data/wikiBundle.json` przebudowany skryptem `bundle-wiki-for-game.cjs` (źródło -> bundle, 43 stringi).
- Testy: `gra/tools/tech-cards-top5-test.cjs` i `building-cards-top5-test.cjs` — jedna asercja każdy zaktualizowana do nowej terminologii (Mennica „podatek”, bez „handel”; asercje WZMOCNIONE, nie osłabione); NOWY strażnik `gra/tools/terminology-trade-vs-tax-test.cjs` (773 asercje).

## Korekty językowe (błąd językowy: plik:pole | było | jest)

| plik:pole | było | jest |
|---|---|---|
| tech-cards-top5.json: Rolnictwo.top5[2].tytul | Warunek Wymiany — klucza do tras handlowych | Warunek Wymiany — klucz do tras handlowych |
| tech-cards-top5.json: Rolnictwo.top5[2].zdanie | …jednym z trzech warunków Wymiany, bez której nie wyznaczysz… | …bez których nie wyznaczysz… |
| tech-cards-top5.json: Oswojenie zwierząt.top5[3].tytul | Warunek Wymiany — klucza do tras handlowych | Warunek Wymiany — klucz do tras handlowych |
| tech-cards-top5.json: Oswojenie zwierząt.top5[3].zdanie | …jednym z trzech warunków Wymiany, bez której nie wyznaczysz… | …bez których nie wyznaczysz… |

Uwaga do Dodatku 3 pkt 3: wzorzec „Warunek Wymiany — klucza” NIE powtarza się dla 22 ulepszeń — występuje wyłącznie w 2 kartach odkryć (Rolnictwo, Oswojenie zwierząt); sprawdzone przeszukaniem wszystkich 32 kart odkryć i 43 kart budynków. Pkt 4 (Lama/Inkowie): „Lama (Inkowie)… tylko dla Inków” + CMZ „(Inkowie)” — odmiana spójna, bez zmian (asercja w teście).

Przeczytałem w całości teksty 32 kart odkryć i 43 kart budynków (tytuł, zdanie, CMZ) i warunki 22 ulepszeń; poza wyżej wymienionymi nie znalazłem OCZYWISTYCH błędów gramatycznych.

Wątpliwe (styl, nie błąd) — POMINIĘTE, do decyzji właściciela:
- tech-cards: „Tarasy (Chiny, Inkowie)” w tytule vs „dla Chińczyków i Inków” w zdaniu (nazwa kraju vs nazwa ludu; ta sama konwencja „(Chiny)” w kartach cudów).
- tech-cards Garncarstwo: „Cegielnia: cegła (2 glina + 1 drewno → 2 cegły)” — „2 glina” bez odmiany (zapis skrótowy tytułu z liczbą).
- building-cards kamienne_kregi: „twojej religii” (małą literą) vs „Twojego państwa” w kartach odkryć — niespójna wielkość liter zaimka.
- building-cards kamienne_kregi: „Po 1 Kultury i zadowolenia więcej z każdą epoką.” — zdanie poprawne, ale kulawe szykiem.
- tech-cards Brązownictwo/Hutnictwo: „nowe budynki i wyższe ich poziomy” — szyk.
- Obóz łowiecki: „+1 pieniądza, +2 podatku” — dwie pozycje na tym samym polu (pieniądz na polu i tak wchodzi do podatku, `terrain-improvements.ts:162`), do decyzji, czy scalić (wymaga zmiany liczby/opisu, więc poza zakresem).

## C — niejednoznaczne, NIE ZMIENIONE (DECISION_REQUIRED, propozycje)

1. **cityPanel.ts: „Podział Handlu” / „suwak handlu” / „udział handlu” / „% handlu netto” / „z handlu (szac.)”** (3623-3624, 4865, 4987, 6038-6044 — 10 literałów). Co liczą w silniku: `handelNetto` = suma `handel` z pól i budynków (czyli podatek, po korupcji i mnożniku Mennicy) + premia tras z budynkiem (`premiaTrasHandlowych`); dzielone suwakiem Skarb/Nauka/Zamożność. Reszta panelu miasta już mówi „Podział podatku/podatku” (`daninaLblGen`, np. cityPanel.ts:4896, 11146), więc te literały to niespójne pozostałości. PROPOZYCJA: zamienić na „podatku” (np. „Podział podatku”, „suwak podatku”, „% podatku netto -> nauka”, „z podatku (szac.)”), a o premii tras mówić osobno. Nie zmieniono (wg dispatchu „podział handlu” = C).
2. **cityPanel.ts formuły** (5995, 11290-11313, 11326-11328 — 14 literałów): identyfikatory `handelBrutto`, `handelNetto`, `skarb_z_handlu`, `adjustHandelSplit`, `HANDEL_PCT_STEP` wyświetlane jako tekst formuły w tooltipie. PROPOZYCJA: wyświetlać `podatekBrutto/podatekNetto` (tylko napisy; identyfikatory w kodzie bez zmian). Zdania o „trasach handlowych z budynkiem” (11309-11310) to B — zostają.
3. **docs/encyklopedia/cywilizacje/*.md (9 plików): „Mnożnik handlu/waluty: 2.3 (meta macierzy)”** — odpowiada `mnoznikHandelPieniadz` z `civ-matrix.json`; nazwa mówi o „handlu/walucie”, a silnik mnoży handelBrutto (podatek) i/lub kurs waluty — nie rozstrzygnąłem bez kodu mnożnika. PROPOZYCJA: „Mnożnik podatku/waluty”.
4. **docs/PORADNIK-GRACZA/45-katalog-budynkow.md:6,107 i 07-miasto-budowa-rekrutacja.md:196: „Targowisko = Pieniądz/t, nie mnożnik handlu”** — nieaktualne względem silnika (Targowisko daje +50% do dochodu z tras); to rozbieżność merytoryczna, nie terminologiczna. PROPOZYCJA: osobny temat dokumentacyjny.
5. **buildings.json: grupa „Handel i pieniądz”** (Targowisko, Port, Emporion, Mennica, Magazyn) i `building-upgrades.ts:205` — nazwa grupy panelu miasta; Mennica mnoży podatek, reszta to trasy. Zostaje (B/C), do decyzji, czy zmienić na „Handel i podatek”.
6. **Opisy parametrów deweloperskich niewidoczne dla gracza** (nie zmieniano): `econ-params.json` (opis rzeka/las „Bonus Handlu…”, linie 439/453), `society-params.json` (707, 763 „premia do produkcji i handlu”, klucz `porzadek_bonus_handel_t2`), `terrain-improvements.json` `uwagi` (300, 319 — historia decyzji), `wonders.json` `profil` („wojna, handel imperium”). PROPOZYCJA: podatek w opisach parametrów przy okazji najbliższego tematu na te pliki.

## TESTY

Wszystkie z `gra/` na worktree (`npm ci --ignore-scripts` w worktree; Chromium: /opt/pw-browsers).
- `npx tsc --noEmit`: 0 błędów.
- `node tools/logic-test.cjs`: LOGIC OK (213/213). `tech-tree-test`: 19/19.
- `node tools/terminology-trade-vs-tax-test.cjs` (NOWY): 773 pass, 0 fail. Sprawdzona skuteczność wzorców na starych frazach (20 starych fraz A wykrywane, 8 fraz B bez fałszywych trafień, 2 stare błędy językowe wykrywane); zgodność generatorów `--check`.
- `tech-cards-top5-test`: 594/0 (1 asercja zaktualizowana). `building-cards-top5-test`: 1179/0 (1 asercja zaktualizowana). Oba renderują prawdziwy adapter+renderer w prawdziwym Chromium (Playwright) — to jest weryfikacja kart Farmy/Trzody/Owiec itd. w Chromium; zrzut ekranu z uruchomionej gry: NIE_ZMIERZONO.
- Bez regresji: entity-card-wonder-test 134/0, improvement-card-uklad-sekcji-test 12/0, improvement-adapter-resource-note-test 75/0, improvement-card-callsites-test 36/0, improvement-era-scaling-test 144/0, improvement-territory-gate-test 6/0, cuda-handel-test 26/0, wonder-yields-test 11/0, wonder-availability/civ-tech/map-build (7/6/6 bez porażek), danina-podatek-nazwa-test 15/0, heks-panel-tooltip-warstwa-test 22/0, plony-budynkow-test 68/0, hex-tooltip-improvement-production-text-test 19/0, map-road-movement-test 26/0, upgrade-budynki-test 49/0, civpedia-* (budynki 146/0, cuda 126/0, ulepszenia 116/0, jednostki j1 161/0 i j2 157/0, historia-infra 18/0, karty-spojnosc 24/0, technologie ALL GREEN, wikihubhud ALL GREEN, gra-id-mostek PASS), entitycard-civpedia-klik 71/0, entity-card-historia-section 36/0, entity-card-cross-links-nested-overlay 24/0, pr141-matrix-only-data-wiki 15 civ/9 stron, tech-discovery-card-click 13/0, technology-discovery-card-visual 48/0.
- Czerwone, ale IDENTYCZNE na czystym `HEAD` (60a18c60d, sprawdzone na kopii `git archive`) — nie regresja tego tematu, nie naprawiane: civpedia-karty-nazwa-przyciskiem-test 25/2, wonder-transfer-on-conquest-test (2 FAIL „owinięta migawkami”), tech-discovery-badge-diorama-test 61/2, entitycard-sufit-dwoch-kart-test 58/9. `civpedia-caly-wiersz-przyciskiem-test` jest niestabilny (raz 84/85, raz „All checks passed” — na obu wersjach, wynik zmienny między uruchomieniami). `entity-card-contract-test` nie wystartował (brak WebGL w tym środowisku) — jak na czystym HEAD.
- Nie uruchamiano (poza zakresem): `npm run build/dev` (zakaz), pozostałe ~1000 testów repo (zmiany dotyczą tekstów kart/CIVPEDII/jednego komunikatu UI).

## Ryzyka / uwagi dla Evaluatora

- Normalizacja w generatorze (`normalizeCsvText`) działa na tytuły i CMZ z CSV; zdania są redagowane ręcznie w `zdania.json`. CSV (`dyspozycje/autobot/runs/R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1/zrodlo/odkrycia-top5.csv`) pozostaje ze starym tekstem — celowo (poza allowlistą), `--check` jest zgodny.
- Nie zmieniano identyfikatorów (`handel` w TileYield, `handel_turystyka`, `handel_procent`, `empire-handel-split`, `podzialHandlu` itd.), liczb ani logiki.
- Zakaz `git add -A` zachowany (jawna lista plików); `WERSJE.md`, `gra-robocza/`, audio — nietknięte.
