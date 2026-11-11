STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-ANALYSIS-Q1
GOAL: Łańcuch Palisada -> Mury kamienne -> Mury ceglane: w mieście najwyżej jedna fortyfikacja, awans przez „Ulepsz” zastępuje poprzednika, zero podwójnego/potrójnego kosztu i utrzymania. Ten temat = analiza + test odtwarzający, bez zmian kodu gry.
ZMIANY/COMMIT: gra/tools/fortifications-stack-repro-test.cjs (nowy), ten raport, evidence/ (surowe wyjścia). Brak zmian w gra/src/**, JSON danych, WERSJE.md, rust-port. Baza: origin/main 6ade0f0ec.
TESTY: fortifications-stack-repro-test 22 OK / 0 FAIL; tsc --noEmit exit 0 (0 błędów); logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6. Surowe wyjścia: evidence/*.txt.
BLOKADY: brak technicznych; wymagana decyzja ABC właściciela (sekcja 5). Chromium nie użyty: problem leży w silniku (koszt/kolejka/utrzymanie), UI tylko wyświetla. NIE_ZMIERZONO w żywej grze.
RUNDY: 1/5
NASTĘPNY KROK: odpowiedzi ABC właściciela, potem dispatch implementacji (osobny temat).
DEPLOY/PUSH: NIE WYKONANO

## 0. Wniosek
Częściowo już jest tak, jak chce właściciel: po UKOŃCZENIU wyższego etapu niższy znika z listy budynków miasta (`applyCompletedBuildingIds`, production.ts ~l.883-897), więc w stanie ustalonym stoi jedna fortyfikacja i utrzymanie jest za jedną. Problem jest gdzie indziej:
1. (O2) KAŻDY etap kupuje się jako NOWY budynek za PEŁNY koszt (Praca + surowce), bez odliczenia za zastępowany. Ścieżka palisada->kamienne->ceglane kosztuje łącznie 127 Pracy i 600 drewna / 480 kamienia / 480 cegły, czyli prawie dwa razy więcej niż same mury ceglane (70 Pracy, 320/320/320).
2. (O2) W danych NIE MA `upgradeFrom` dla tych trzech, więc w UI są w sekcji „Buduj”, nie „Ulepsz”.
3. (O4) W kolejce można zamówić wszystkie trzy naraz (blokada działa tylko „wyższy blokuje niższy”) i zapłacić trzy razy.
4. (O3) W trakcie budowy wyższego etapu stary stoi i płaci utrzymanie.
5. (O5) Stare zapisy z kilkoma id w `cityBuilt` płacą utrzymanie za wszystkie (bonus obrony się nie sumuje, utrzymanie TAK).

## 1. Stan danych (buildings.json, miasto-params.json; wartości efektywne z funkcji silnika)
| id | nazwa | epoka | tech | praca (efekt.) | surowce (efekt.) | utrzymanie zł L1 (efekt.) | utrzymanie surowców L1 | maks poz. | upgradeFrom | bonus obrony |
|---|---|---|---|---|---|---|---|---|---|---|
| palisada | Palisada drewniana | 1 | Obróbka drewna | 22 | drewno 120 | 2 (baza 1) | drewno 1 | 1 | brak | +100% |
| mury_kamienne | Mury kamienne | 1 | Murarstwo | 35 | drewno 160, kamień 160, cegła 160 | 4 (baza 2, +1/poz.) | po 2 każdego | 2 | brak | +150% |
| mury | Mury ceglane | 2 | Budownictwo | 70 | drewno 320, kamień 320, cegła 320 | 8 (baza 2, mnożnik epoki 2) | po 2 każdego | 2 | brak | +200% |

Wszystkie trzy mają `odblokowuje: maMur`. Flagi blokującej kolejny budynek brak w danych; blokadę realizuje kod: `isWallTierBlockedByStrongerWall` (production.ts ~l.849) w `availableProduction` (wspólne dla gracza i AI): palisada niedostępna gdy stoi/jest w kolejce mury_kamienne|mury|fort; mury_kamienne niedostępne gdy stoi/jest w kolejce mury|fort. Cytadela (fort) i Baszta są niezależne (wymagają mury/mury_kamienne), poza zakresem.
Uwaga poboczna (nie ruszana): zł utrzymania muru ceglanego (8) = 2x kamiennego (4) mimo tej samej bazy 2 (efekt mnożnika epoki 2).

## 2. Reprodukcja (surowe wyjście: evidence/fortifications-stack-repro.txt)
| krok | built | kolejka | utrzymanie zł | utrzymanie surowców/tura | bonus obrony |
|---|---|---|---|---|---|
| T0 start | - | - | 0 | - | 0 |
| T1 palisada zamówiona (koszt pobrany) | - | palisada | 0 | - | 0 |
| T2 palisada gotowa | palisada | - | 2 | drewno 1 | +100% |
| T3 mury kamienne zamówione | palisada | mury_kamienne | 2 | drewno 1 | +100% |
| T4 mury kamienne gotowe | mury_kamienne | - | 4 | drewno 2, kamień 2, cegła 2 | +150% |
| T5 mury ceglane zamówione | mury_kamienne | mury | 4 | j.w. | +150% |
| T6 mury ceglane gotowe | mury | - | 8 | drewno 2, kamień 2, cegła 2 | +200% |

Pytanie „czy stoją RÓWNOCZEŚNIE i czy utrzymanie się SUMUJE”: po ukończeniu NIE stoją równocześnie (O1), ale stoją razem w oknie budowy (O3) i sumują się w starych zapisach (O5). Główna dolegliwość to PEŁNA płatność za każdy etap (O2) i możliwość zamówienia kilku naraz (O4).

- Koszt łączny ścieżki: 127 Pracy, drewno 600, kamień 480, cegła 480 (vs same mury ceglane: 70 Pracy, 320/320/320).
- Kolejka (O4): palisada w kolejce -> oferowane mury_kamienne i mury; palisada+mury_kamienne w kolejce -> oferowane mury. Ukończenie w odwrotnej kolejności (mury, palisada, mury_kamienne) zostawia najwyższy etap, ale zapłacono za wszystkie trzy.
- Legacy zapis [palisada, mury_kamienne, mury]: utrzymanie 14 zł (vs 8), drewno 5 / kamień 4 / cegła 4 (vs 2/2/2): nadpłata +6 zł, +3 drewna, +2 kamienia, +2 cegły na turę; bonus obrony nadal tylko +200%.
- Parytet gracz/AI: ten sam wynik. Blokada w `availableProduction` jest wspólna, jedyna ścieżka ukończenia budynku w main.ts l.4448 obsługuje wszystkich właścicieli, AI ma dodatkową bramkę w ai.ts ~l.2259. Potwierdzone pinezkami źródła w teście (P1-P3), nie na żywej grze.

## 3. Mechanizm „Ulepsz” dziś
- Sekcja „Ulepsz” w cityPanel.ts (~l.9340) i fallback auto-budowy (`buildUpgradeCandidates`, auto-manage.ts ~l.271) to WYŁĄCZNIE awans POZIOMU tego samego id (maksPoziom > 1, poziom z epoki/tech gate). Koszt: `buildingProductionItem(id, level)` = kosztBudowy + przyrostKosztu*(poziom-1) oraz pełny `buildingStockCost` ponownie (brak różnicy, brak zwrotu).
- Awans między RÓŻNYMI id (`upgradeFrom`, np. odlewnia_brazu->odlewnia_zelaza) to w UI zwykły wiersz „Buduj”: wymaga, że poprzednik stoi w mieście; pobiera PEŁNY koszt nowego (Praca + surowce); po ukończeniu usuwa poprzednika z `cityBuilt`. Kolejka pokazuje etykietę „Rozbuduj X -> Y” (`upgradeProductionDisplayName`). Zwrotu za poprzednika brak.
- Wpisanie `upgradeFrom` dla łańcucha daje od ręki: wymóg poprzednika, zastępowanie, etykietę „Rozbuduj”, ukrycie niższych etapów (`isBuildingSupersededByUpgrade`) i brak możliwości zamówienia dwóch etapów naraz. Koszt zostaje pełny, jeśli go nie zmienimy.
- Skutek uboczny `upgradeFrom`: Mury ceglane wymagałyby wcześniej wybudowanych Murów kamiennych (brak budowy wprost w epoce 2); patrz pytanie 2.

## 4. Opcje implementacji
Koszt awansu (Praca / drewno / kamień / cegła, wartości efektywne z silnika):
| wariant kosztu | palisada->kamienne | kamienne->ceglane | RAZEM ścieżka (z palisadą) |
|---|---|---|---|
| A. różnica kosztów (nowy minus stary) | 13 / 40 / 160 / 160 | 35 / 160 / 160 / 160 | 70 / 320 / 320 / 320 (= koszt samych ceglanych) |
| B. pełny koszt nowego (dziś; zmienia się tylko mechanika) | 35 / 160 / 160 / 160 | 70 / 320 / 320 / 320 | 127 / 600 / 480 / 480 |
| C. pełny minus zwrot 50% starego | ok. 24 / 100 / 160 / 160 | ok. 52 / 240 / 240 / 240 | ok. 98 / 460 / 400 / 400 |
(C: Praca zaokrąglona; zwrot od kosztów efektywnych zapłaconych za zastępowany budynek; inny procent X przeliczalny wprost.)

Utrzymanie 1 miasta (zł/tura; surowce/tura), przed i po. Wariant kosztu A/B/C nie zmienia utrzymania, zmienia tylko koszt budowy:
| stan | przed | po |
|---|---|---|
| palisada | 2 zł; drewno 1 | bez zmian |
| mury kamienne | 4 zł; 2/2/2 | bez zmian |
| mury ceglane | 8 zł; 2/2/2 | bez zmian |
| legacy trzy naraz | 14 zł; drewno 5, kamień 4, cegła 4 | 8 zł; 2/2/2 (po migracji, opcja c) |
| okno budowy wyższego etapu | stary płaci do ukończenia | zależnie od pytania 4 |

(a) Łańcuch przez `upgradeFrom`. Pliki: gra/data/buildings.json (mury_kamienne.upgradeFrom=palisada, mury.upgradeFrom=mury_kamienne), regeneracja wikiBundle, teksty uwagi/top3; cityPanel.ts (etykieta „Ulepsz” zamiast „Buduj” dla wierszy z `upgradeFrom` jeśli właściciel chce dosłownie sekcję „Ulepsz”); redundantne gałęzie w `applyCompletedBuildingIds` i `isWallTierBlockedByStrongerWall` zostają jako straż. Ryzyko: Mury ceglane nie do zbudowania wprost (patrz pyt. 2); `cumulativeMnoznikForBuildingId` i tooltipy „Łańcuch:” zaczną się pokazywać; AI (ai.ts ~l.1702 filtr upgradeFrom, ~l.2259 palisada) wymaga testu. Balans: zero zmian jeśli koszt = pełny.
(b) Blokada niższego/równego poziomu, także w kolejce: rozszerzyć `isWallTierBlockedByStrongerWall` tak, by nie dało się dołożyć wyższego etapu, gdy niższy czeka w kolejce, i odwrotnie (jedna fortyfikacja w kolejce). Pliki: production.ts + test. Ryzyko niskie; nie zmienia kosztu etapu.
(c) Migracja zapisów z kilkoma fortyfikacjami: przy wczytaniu zapisu (main.ts ~l.46657, przywracanie `cityBuilt`) zostawić najwyższy etap (mury > mury_kamienne > palisada; fort/baszta nietknięte), usunąć niższe; zwrot: brak / surowce za usuwane (Praca bez zwrotu) / procent. Ryzyko: stare zapisy zmieniają saldo surowców. Balans: gracze z „stackiem” oszczędzają 6 zł + 3 drewna + 2 kamienia + 2 cegły na turę.
(d) AI i Rust: AI używa tych samych funkcji dostępności i ukończenia, więc (a)/(b)/(c) obejmą je automatycznie; do sprawdzenia testem ai-buduje-budynki. Dług Rust-parity (tylko wskazany, nie ruszany): REPIN danych buildings (upgradeFrom, koszt awansu) i logiki zastępowania/kosztu/migracji w rust-port.
Rekomendacja operatora: (a)+(b)+(c) razem; koszt wg odpowiedzi na pytanie 1.

## 5. Pytania ABC do właściciela (rekomendacja pierwsza)
1. Koszt awansu na wyższy etap fortyfikacji?
   A (rekomendacja) różnica kosztów: kamienne za 13 Pracy + 40 drewna + 160 kamienia + 160 cegły, ceglane za 35 Pracy + 160/160/160 (cała ścieżka = koszt samych ceglanych, bez podwójnej opłaty);
   B pełny koszt nowego (jak dziś: 127 Pracy / 600 / 480 / 480);
   C pełny koszt minus zwrot 50% zastępowanego.
2. Czy Mury ceglane mają być dostępne WPROST, bez wcześniejszych kamiennych?
   A (rekomendacja) tak: gdy niższy etap stoi, budowa jest awansem za różnicę; gdy nie stoi, buduje się od zera za pełny koszt; w mieście i tak najwyżej jedna fortyfikacja;
   B nie: wymuszony łańcuch palisada->kamienne->ceglane, bez przeskoku.
3. Co z istniejącymi zapisami, gdzie stoi kilka fortyfikacji naraz?
   A (rekomendacja) zostaw najwyższą, usuń niższe, bez zwrotu;
   B zostaw najwyższą, zwróć surowce za usuwane (Praca bez zwrotu);
   C nie migruj (tylko nowa blokada od teraz).
4. Co z utrzymaniem i kolejką, gdy wyższy etap jest w budowie?
   A (rekomendacja) stary budynek stoi i płaci utrzymanie do ukończenia (jak dziś), potem znika; w kolejce tylko jeden etap fortyfikacji naraz;
   B stary budynek przestaje płacić utrzymanie od startu awansu (bonus obrony starego działa do ukończenia);
   C zostaw jak dziś (kilka etapów w kolejce naraz możliwe).
