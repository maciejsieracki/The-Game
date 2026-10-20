# P1.14 — Katalog mechanizmów gameplayu (podsystemy)

**Temat:** `R-RUSTPORT-P1-14-GAMEPLAY-CATALOG-Q1` · **Runda:** 2/5 (poprawka po zarzutach Evaluatora z rundy 1) · **Rola:** Operator (Haiku 5.5 medium)
**Pin web:** `main` = `edb8fb56` · **Wejście:** `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md` (751 plików, 6 katalogów `gra/src/{game,ui,map,units,battle,render}`).
**Metoda:** każdy z 751 wierszy P1.1 ma dokładnie jeden podsystem (sekcja 2). Przypisanie oparte na nagłówku pliku, nazwie, liczbie importów/eksportów (P1.1, `[importów: N, eksportów: M]`) oraz, dla kluczowych plików, na odczycie `git show edb8fb56:<ścieżka>` (nagłówki, `grep -n '^export'`, importy). Nie czytano linia po linii wszystkich 751 plików — klastry (`ui/icons/**`, `render/**`) przypisane po katalogu.
**Uzasadnienie wiersza (sekcja 2):** nazwa pliku + importy/eksporty z P1.1 + nagłówek, gdy istnieje (wymóg GOAL: nazwa/eksporty/importy). Dla SVG/JSON/CSS/PNG/MD (nie są modułami TS): typ zasobu i klaster katalogu.
**Dowody `plik:linia`:** ścieżki względem `gra/src/`, numer linii z blobu `edb8fb56` (wyszukiwanie `grep -nF` po nagłówku lub eksporcie). Eksporty w sekcji 1 policzone `grep -cE '^export'` na blobie.
**Legenda kodów:** EKO = ekonomia tury · MIA = miasta · JED = jednostki · WAL = walka · AI = AI · DYP = dyplomacja (w tym handel) · KUL = kultura/religia i tożsamość cywilizacji · CUD = cuda/technologie · PM = państwa-miasta · BAR = barbarzyńcy · HOT = hot-seat · SAV = save/load · INNE = mechanika poza 12 (w tym mnożniki cywilizacji) · INF-* = infrastruktura.
**Linie:** kolumna z P1.1 (`wc -l`); dla `ui` zawiera też SVG/JSON/PNG/CSS (zawyżenie, zob. P1.1).

## 1. Podsystemy — liczba plików, linie, streszczenie z dowodem

Linie: P1.1 (`wc -l`). Kolumna „w tym ui/ i render/” pokazuje część linii w prezentacji (`gra/src/ui/**`, `gra/src/render/**`); reszta to logika lub `battle/` (w tym 3D `battleScene.ts` i HUD bitwy, które liczono jako nie-ui). Dowody `plik:linia` — numer linii w blobie `edb8fb56`, ścieżki względem `gra/src/`.

| Kod | Podsystem | Pliki | Linie | w tym ui/ + render/ | Streszczenie (dowód: plik:linia) |
|---|---|---:|---:|---:|---|
| EKO | Ekonomia tury | 28 | 16242 | 5588 | Liczy ekonomię tury i zasila skarbiec oraz pulę nauki. Moduł `turn-economy.ts` (P1.1: tick ekonomii tury) eksportuje `game/turn-economy.ts:572`, `game/turn-economy.ts:786`, `game/turn-economy.ts:849`. Strumienie per tura bankuje `game/playerState.ts:5` (skarbiec i pula nauki). Utrzymanie liczy `game/economy-upkeep.ts:65` (67 eksportów), pulę rekrutów `game/manpower.ts:2`. |
| MIA | Miasta | 29 | 24613 | 14317 | Zakłada miasta i nadaje nazwy (`game/cities.ts:3`). Kolejkuje budynki i jednostki: `game/production.ts:3`, eksporty `game/production.ts:349` i `game/production.ts:378`. Automat wyboru pól: miasto o populacji N obrabia N najlepszych pól w okolicy (`game/okolica.ts:3`, 28 eksportów). Wzrost i racje żywności (Wyżywienie 0–6) liczy `game/population-growth-v85.ts:2`. Zarządca kolejki budowy miasta: `game/auto-manage.ts:395`. |
| JED | Jednostki | 38 | 12317 | 3870 | Trzyma stosy armii na mapie: widoczność, scalanie i rozdział (`game/armyMerge.ts:2`, 48 eksportów). Planuje marsz (`game/planned-march.ts:2`) i embarkację jednostek lądowych na wodę (`game/embarkation.ts:2`). Trwałe doświadczenie weteranów to osobny system (`game/veteran.ts:3`). |
| WAL | Walka | 39 | 35097 | 2487 | Rozstrzyga walkę deterministycznym resolverem (`game/combat.ts:24`; eksporty `game/combat.ts:440`, `game/combat.ts:453`). Oblężenie miasta: `game/siege.ts:3` (32 eksporty). Werdykt i straty auto-walki liczy game/auto-battle-power.ts; game/post-battle-map.ts stosuje skutki walki auto i ręcznej. Ręczna bitwa taktyczna: `battle/manualBattle.ts:3`; scena auto-bitwy 3D: `battle/battleScene.ts:3`. |
| AI | AI | 20 | 8981 | 0 | Podejmuje decyzje AI jako czyste funkcje: `game/ai.ts:3149` zwraca komendy ruchu, ataku i badań (eksporty AICmdMove, AICmdAttack, chooseAIResearch). Wojny wymuszone: wybór świeżej fali z wolnych jednostek w `game/forced-war-waves.ts:122`, wspólny mechanizm w `game/forced-war-common.ts:2`. Profil AI nacji czyta `game/civ-ai-data.ts:2`. Predykat major AI (`game/owner-utils.ts:12`) importuje main.ts (linia 1251). |
| DYP | Dyplomacja (w tym handel) | 46 | 23802 | 8513 | Ocenia propozycje dyplomatyczne (`game/diplomacy-proposals.ts:2`, 59 eksportów) i aktywne traktaty (game/diplomacy-treaties.ts). Model relacji: `game/diplomacy.ts:3` (Relacja = Zaufanie + Respekt; `game/diplomacy.ts:575`). Wiarygodność: game/diplomacy-credibility.ts (37 eksportów). Handel między miastami: `game/trade-routes.ts:2` (wykrywanie połączeń i dochód z tras; granica DYP/EKO, do decyzji P2.1). |
| KUL | Kultura/religia i tożsamość cywilizacji | 7 | 2286 | 499 | Kultura i religia miast: `game/culture-religion.ts:3` (PURE, własne typy wejściowe), eksport `game/culture-religion.ts:344`. Overlay Kultury i Religii imperium: `ui/empireOverlayHud.ts:2`. Pozostałe 5 plików to tożsamość i prezentacja cywilizacji, nie kultura ani religia: nazwy (`game/civ-names.ts:2`), kolory (`game/civ-visual.ts:2`), wyróżnik (`ui/civBrandDisplay.ts:2`), portrety (`ui/leaderPortraits.ts:2`), bannery (`ui/leaderBannersHud.ts:2`). Ich przynależność do KUL jest do decyzji P2.1. |
| CUD | Cuda/technologie | 22 | 7092 | 4947 | Bada technologie: `game/research.ts:3` z bramkami wymagań (`game/research.ts:234`, epochGateMet, AdvanceResult). Drzewko liniowe: `game/tech-tree.ts:2`. Cuda: dane z wonders.json (`game/wonders-data.ts:2`, 27 eksportów) i bramka budowy (`game/wonder-availability.ts:2`: epoka imperium, odkryte techUnlock). |
| PM | Państwa-miasta | 6 | 1172 | 255 | Miasta-państwa klastra: `game/city-state-difficulty.ts:56` ogranicza produkcję wojskową wg skali trudności wobec gracza, a `game/city-state-difficulty.ts:116` rozstrzyga wojnę klastra z graczem. AI major wybiera wobec miasta-państwa trybut, wasala, wojnę lub wchłonięcie (`game/ai-cs-absorption.ts:2`). Przejęcie ostatniego miasta rywala-miasta-państwa tego samego typu uruchamia dłuższy komunikat triumfu (`game/triumph-city-state.ts:2`; `game/triumph-city-state.ts:11` = 9500 ms). |
| BAR | Barbarzyńcy | 2 | 2729 | 0 | Barbarzyńcy jako neutralna, wroga frakcja (`game/barbarians.ts:3`): spawn obozów, limit jednostek na obóz, prosta agresja i ruch ku najbliższej jednostce lub miastu gracza; wszystko deterministyczne przez seed, a moduł zwraca komendy i nie mutuje stanu gry (`game/barbarians.ts:13`, `game/barbarians.ts:317`). Buntownicy mapowi od epoki Średniowiecze (`game/map-rebels.ts:2`) są w v0.1 nieaktywni (max era = 3). |
| HOT | Hot-seat | 3 | 469 | 398 | Hot-seat: wiele foteli ludzkich na jednej maszynie. Model foteli w `game/human-owners.ts:21`, `game/human-owners.ts:34`, `game/human-owners.ts:59`, `game/human-owners.ts:69`. Nagłówek pliku („Etap 0”, „brak konsumenta w main.ts”) jest nieaktualny: main.ts importuje moduł w linii 1252–1254 i wywołuje isAiOwner (15 miejsc) oraz isHotSeat/nextHumanSeat (3); render importuje HUMAN_OWNER_PRIMARY w cities.ts:25, units.ts:29, cityOkolicaOverlay.ts:15. Ekran przekazania fotela: `ui/hotSeatHandoff.ts:3` (import main.ts:1137). Skrzynka i propozycje między fotelami: `ui/interHumanDiplomacyHud.ts:4` (czysty DOM, dane w main.ts). Dojrzałość pełnej pętli hot-seat nie jest tu weryfikowana; do P1.18. |
| SAV | Save/load | 7 | 2914 | 940 | Zapis i odczyt stanu gry jako JSON: `game/save.ts:3` z `game/save.ts:520`, SaveGame, buildSaveSlotMeta i IncompatibleSaveFormatError. Sloty trzyma w IndexedDB (`game/idb-storage.ts:4`, cienki wrapper klucz→wartość). Autozapis rotacyjny zapisuje plik na dysku przez File System Access (`game/fsa-autosave.ts:3`, 24 eksporty). |
| INNE | INNE (mechanika poza 12: potęga, zwycięstwo, start, tempo, nagrody z wiosek, mnożniki cywilizacji) | 20 | 7187 | 3069 | Mechanika poza 12 podsystemami. Potęga: `game/power.ts:3` (składniki z miast i ekonomii), `game/power-objective.ts:2` (suma wg power-params.json; respekt liczy diplomacy.ts), `game/power-ranking.ts:2` (ranking widocznych cywilizacji). Zwycięstwo: `game/victory.ts:7` (Power >50% sumy w ostatniej epoce) i `game/victory.ts:11` (wszystkie technologie i rakieta). Start: `game/start-preview.ts:2` i `game/cluster-start.ts:2` składają plan startu klastra. Tempo: `game/ruch-swiata-tempo.ts:3` (mnożnik zasięgu ruchu tylko przy spawnie jednostki). Nagrody z wiosek: `game/villageRewards.ts:79` (losowanie kategorii z wag, złoto i postęp nauki skalowane erą). Mnożniki cywilizacji (przekrojowe, przeniesione z KUL): `game/civ-bonuses.ts:245`, `game/civ-matrix.ts:56`. |
| INF-MAPA | INNE/INFRA-MAPA-ŚWIAT (generator, teren, granice, widoczność; kandydat na 13. podsystem) | 18 | 20500 | 0 | 0 | 0 | `map/generator.ts`, `map/mapGenAsync.ts`, `map/territory.ts`, `map/road-network.ts` (generator i model terenu/granic/dróg; katalog `map/` 25 plików); `game/visibility.ts` (mgła wojny). Granica z GOAL: teren/świat nie ma osobnego podsystemu w 12. |
| INF-UI | INFRA-UI (HUD, panele, menu, tooltipy, CSS) | 43 | 12073 | 11690 | 11690 | 11690 | `ui/hud.ts` (górny pasek zasobów + minimapa + panel boczny), `ui/sidePanelHud.ts`, `ui/entityCards/renderer.ts` (jeden DOM-builder kart encji). Prezentacja, bez logiki domenowej. |
| INF-RENDER | INFRA-RENDER (scena 3D, modele, LOD) | 88 | 59319 | 59319 | 59319 | 59319 | `render/scene.ts`, `render/units.ts`, `render/cities.ts` i modele 3D (katalog `render/`, 88 plików). Warstwa renderu Three.js. |
| INF-DANE | INFRA-DANE (ikony, obrazy, rejestry ikon) | 326 | 16186 | 16186 | Ikony i obrazy interfejsu, bez logiki domenowej: 307 plików SVG w `ui/icons/**`, 8 JSON, 4 CSS (`ui/icons/brand/*.css`), 2 PNG hero (`ui/assets/hero/`) oraz 5 plików TS ikon i rejestru (`ui/icons/brandAssets.ts`, `iconRegistry.ts`, `scienceOwlIcon.ts`, `scienceProgressRing.ts`, `wikiBookIcon.ts`). Predykat `owner-utils.ts` przeniesiono do AI. |
| INF-NARZ | INFRA-NARZĘDZIA (playtest, perf, diagnostyka) | 9 | 2715 | 1204 | 1204 | 1204 | `game/playtest*.ts` (4 pliki, narzędzia playtestu), `game/ai-moc-diag.ts` (metryki diagnostyczne), `game/diag-log.ts` (pierścień zdarzeń diagnostycznych), `ui/perfReport.ts` / `ui/perfTestPanel.ts` / `ui/sceneTimingReport.ts`. |

Suma plików: 751 (= 751). Suma linii: 255694. Dla 12 podsystemów z GOAL: EKO 28, MIA 29, JED 38, WAL 39, AI 20, DYP 46, KUL 7, CUD 22, PM 6, BAR 2, HOT 3, SAV 7 — razem 247 plików.


## 2. Tabela plik → podsystem (751 wierszy)

| # | Ścieżka | Linie | Podsystem | Uzasadnienie (nazwa; importy/eksporty z P1.1; nagłówek, gdy jest) | Uwaga (granica) |
|---:|---|---:|---|---|---|
| 1 | `gra/src/game/braz-access.ts` | 53 | EKO | `braz-access.ts`: nagłówek „braz-access.ts — łańcuch brązu (ABC-12/13; Maciej 2026-07-09: brąz to STOP miedzi, NIE surowiec).”; importów 1, eksportów 5 |  |
| 2 | `gra/src/game/citizen-resource-upkeep.ts` | 353 | EKO | `citizen-resource-upkeep.ts`: nagłówek „citizen-resource-upkeep.ts — R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10, drenaż”; importów 1, eksportów 12 |  |
| 3 | `gra/src/game/converters.ts` | 360 | EKO | `converters.ts`: importów 0, eksportów 20 |  |
| 4 | `gra/src/game/cyna-access.ts` | 89 | EKO | `cyna-access.ts`: nagłówek „cyna-access.ts — dostęp do Rudy cyny (nowy surowiec, Maciej 2026-08-13). Wzorem”; importów 2, eksportów 6 |  |
| 5 | `gra/src/game/economy-upkeep.ts` | 1174 | EKO | `economy-upkeep.ts`: importów 5, eksportów 67 |  |
| 6 | `gra/src/game/economy.ts` | 1340 | EKO | `economy.ts`: nagłówek „City economy logic for The Game -- pure module, no DOM, no THREE.”; importów 6, eksportów 35 |  |
| 7 | `gra/src/game/empire-diplo-resource-flow.ts` | 37 | EKO | `empire-diplo-resource-flow.ts`: nagłówek „empire-diplo-resource-flow.ts — przepływy surowców z umów dyplomatycznych (per turę).”; importów 1, eksportów 2 |  |
| 8 | `gra/src/game/empire-food.ts` | 1074 | EKO | `empire-food.ts`: nagłówek „empire-food.ts — centralny magazyn żywności (PYTANIE-85).”; importów 9, eksportów 39 |  |
| 9 | `gra/src/game/empire-handel-split.ts` | 84 | EKO | `empire-handel-split.ts`: nagłówek „empire-handel-split.ts — globalny domyślny podział Daniny/Podatku (DYSPOZYCJA-85-SUWAK=C).”; importów 2, eksportów 4 |  |
| 10 | `gra/src/game/empire-hud-totals.ts` | 99 | EKO | `empire-hud-totals.ts`: nagłówek „empire-hud-totals.ts — R-HUD-MIASTO-STAN-CYWILIZACJI (2026-08-08, playtest Macieja).”; importów 0, eksportów 5 |  |
| 11 | `gra/src/game/gold-deficit.ts` | 250 | EKO | `gold-deficit.ts`: nagłówek „gold-deficit.ts — kara za deficyt Złota (R-DEFICYT-ZLOTA-KARA-Q1=A), próg”; importów 2, eksportów 17 |  |
| 12 | `gra/src/game/inca-llama-seed.ts` | 66 | EKO | `inca-llama-seed.ts`: nagłówek „inca-llama-seed.ts — POSIEW LAMY przy starcie Inków (decyzja 3a, Maciej 2026-07-09).”; importów 3, eksportów 3 | posiew zasobu przy starcie cywilizacji (granica EKO/AI); przypisano EKO |
| 13 | `gra/src/game/manpower.ts` | 877 | EKO | `manpower.ts`: nagłówek „manpower.ts — ludność absolutna i pula Manpower per miasto (EKONOMIA).”; importów 4, eksportów 52 |  |
| 14 | `gra/src/game/mennica-zloto-grace.ts` | 108 | EKO | `mennica-zloto-grace.ts`: nagłówek „mennica-zloto-grace.ts — 1 tura łaski Mennicy po utracie dostępu do złota.”; importów 0, eksportów 10 |  |
| 15 | `gra/src/game/playerState.ts` | 675 | EKO | `playerState.ts`: importów 8, eksportów 27 | EKO (skarbiec/nauka) + CUD (auto-badania); przypisano EKO |
| 16 | `gra/src/game/r-stawki-strojenie.ts` | 64 | EKO | `r-stawki-strojenie.ts`: nagłówek „R-STAWKI-STROJENIE 2026-08-03 — Maciej: ×2 koszty (nie dochody). Playtest → ustaw 1 aby cofnąć.”; importów 0, eksportów 9 |  |
| 17 | `gra/src/game/resource-access.ts` | 362 | EKO | `resource-access.ts`: nagłówek „resource-access.ts — surowce w zasięgu miasta (ABC-19: potencjał vs dostęp aktywny).”; importów 12, eksportów 10 |  |
| 18 | `gra/src/game/resource-usage-breakdown.ts` | 137 | EKO | `resource-usage-breakdown.ts`: nagłówek „resource-usage-breakdown.ts — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12,”; importów 0, eksportów 5 |  |
| 19 | `gra/src/game/turn-economy.ts` | 2967 | EKO | `turn-economy.ts`: importów 29, eksportów 47 |  |
| 20 | `gra/src/game/wealth.ts` | 251 | EKO | `wealth.ts`: nagłówek „System WEALTH (zamoznosc spoleczenstwa) -- czysty modul, bez DOM/THREE, ZERO importow.”; importów 0, eksportów 15 |  |
| 21 | `gra/src/game/zelazo-access.ts` | 89 | EKO | `zelazo-access.ts`: nagłówek „zelazo-access.ts — dostęp do żelaza (decyzja właściciela 2026-07-19, korekta 2026-07-30).”; importów 2, eksportów 8 |  |
| 22 | `gra/src/game/zloto-access.ts` | 145 | EKO | `zloto-access.ts`: nagłówek „zloto-access.ts — Złoto w magazynie państwa (PYTANIE-84-R9, U-13, Maciej 2026-07-27).”; importów 1, eksportów 14 |  |
| 23 | `gra/src/ui/empireBalance.ts` | 115 | EKO | `empireBalance.ts`: importów 1, eksportów 7 |  |
| 24 | `gra/src/ui/empireDetailPanel.ts` | 4433 | EKO | `empireDetailPanel.ts`: nagłówek „empireDetailPanel.ts — panel boczny imperium (HUD mapy): parametry + Moc + zasoby + kultura.”; importów 19, eksportów 25 | panel imperium (19 importów; EKO/KUL/MIA); przypisano EKO |
| 25 | `gra/src/ui/empireDetailTypes.ts` | 732 | EKO | `empireDetailTypes.ts`: nagłówek „empireDetailTypes.ts — snapshot panelu imperium (HUD mapy).”; importów 2, eksportów 30 |  |
| 26 | `gra/src/ui/empireMiastaTable.ts` | 144 | EKO | `empireMiastaTable.ts`: nagłówek „empireMiastaTable.ts — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA punkt 2 (Maciej 2026-08-12,”; importów 0, eksportów 8 |  |
| 27 | `gra/src/ui/empirePanelSectionMap.ts` | 151 | EKO | `empirePanelSectionMap.ts`: nagłówek „empirePanelSectionMap.ts — mapowanie żetonów HUD → blok panelu imperium (R-PANEL-SPLIT).”; importów 0, eksportów 5 |  |
| 28 | `gra/src/ui/treasuryBalanceFormat.ts` | 13 | EKO | `treasuryBalanceFormat.ts`: nagłówek „Formatowanie komórek bilansu skarbca (panel ZASOBY IMPERIUM).”; importów 1, eksportów 1 |  |
| 29 | `gra/src/game/building-cost-tempo.ts` | 39 | MIA | `building-cost-tempo.ts`: importów 0, eksportów 3 |  |
| 30 | `gra/src/game/building-resource-gate.ts` | 619 | MIA | `building-resource-gate.ts`: nagłówek „building-resource-gate.ts — bramka budynków: realne wymogi terenowe / budynkowe per budynek.”; importów 3, eksportów 32 |  |
| 31 | `gra/src/game/building-stock-cost.ts` | 420 | MIA | `building-stock-cost.ts`: nagłówek „Konsument magazynu surowców przetworzonych (TEMAT #6): opcjonalny koszt `koszt_surowce` budynku pobierany z magazynu …”; importów 1, eksportów 24 |  |
| 32 | `gra/src/game/building-upgrades.ts` | 248 | MIA | `building-upgrades.ts`: nagłówek „Upgrade budynków — kanon Maciej 2026-07-05 (UPG-LOC/PROD/BONUS, ABC-20…24).”; importów 2, eksportów 19 |  |
| 33 | `gra/src/game/cities.ts` | 1393 | MIA | `cities.ts`: nagłówek „City founding logic: validation, creation, and name generation.”; importów 9, eksportów 80 |  |
| 34 | `gra/src/game/city-founding.ts` | 163 | MIA | `city-founding.ts`: nagłówek „city-founding.ts — koszt założenia miasta z mapy (B1 Maciej 2026-06-29).”; importów 1, eksportów 11 |  |
| 35 | `gra/src/game/city-hex-clear.ts` | 74 | MIA | `city-hex-clear.ts`: nagłówek „F-CITY-HEX — heks centrum miasta wg MACIERZY B (Maciej 2026-07-09).”; importów 5, eksportów 4 |  |
| 36 | `gra/src/game/city-hex-movement.ts` | 85 | MIA | `city-hex-movement.ts`: nagłówek „city-hex-movement.ts — reguły zajmowania heksu miasta (garnizon vs obcy).”; importów 2, eksportów 6 |  |
| 37 | `gra/src/game/city-names-pool.ts` | 295 | MIA | `city-names-pool.ts`: nagłówek „city-names-pool.ts — pule nazw miast per cywilizacja (B-city-names-pools).”; importów 0, eksportów 23 |  |
| 38 | `gra/src/game/empire-city-defaults.ts` | 554 | MIA | `empire-city-defaults.ts`: nagłówek „empire-city-defaults.ts — R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE=A (Maciej 2026-08-09).”; importów 3, eksportów 24 |  |
| 39 | `gra/src/game/first-player-city.ts` | 49 | MIA | `first-player-city.ts`: nagłówek „R-PIERWSZE-MIASTO (decyzja B): gracz z 0 miast może wyłącznie założyć pierwsze”; importów 0, eksportów 5 |  |
| 40 | `gra/src/game/fort-territory.ts` | 214 | MIA | `fort-territory.ts`: nagłówek „game/fort-territory.ts”; importów 3, eksportów 9 | zasięg zakładania miast przez forty (granica MIA/MAPA); przypisano MIA |
| 41 | `gra/src/game/growth-happiness.ts` | 30 | MIA | `growth-happiness.ts`: nagłówek „Wspólny, jawnie ograniczony kontrakt kanałów Szczęścia używany przez”; importów 0, eksportów 1 |  |
| 42 | `gra/src/game/okolica.ts` | 815 | MIA | `okolica.ts`: nagłówek „Wybor obrabianych pol miasta -- czysta logika (bez DOM/THREE/I/O).”; importów 10, eksportów 27 |  |
| 43 | `gra/src/game/order.ts` | 567 | MIA | `order.ts`: nagłówek „City "Porządek" (Order) logic for The Game — pure module, no DOM, no THREE,”; importów 0, eksportów 19 |  |
| 44 | `gra/src/game/population-growth-tempo.ts` | 41 | MIA | `population-growth-tempo.ts`: importów 0, eksportów 3 |  |
| 45 | `gra/src/game/population-growth-v85.ts` | 580 | MIA | `population-growth-v85.ts`: nagłówek „population-growth-v85.ts — racje żywności (Wyżywienie 0–6, krok 0,5).”; importów 13, eksportów 35 |  |
| 46 | `gra/src/game/production.ts` | 2380 | MIA | `production.ts`: importów 12, eksportów 78 |  |
| 47 | `gra/src/game/society-breakdown.ts` | 1139 | MIA | `society-breakdown.ts`: importów 3, eksportów 53 | Szczęście+Prawo→Porządek (granica MIA/KUL); przypisano MIA |
| 48 | `gra/src/game/society-inputs.ts` | 122 | MIA | `society-inputs.ts`: nagłówek „society-inputs.ts — pomocnicze wejścia do evaluateOrderFromBreakdown (B2-Q8=2A).”; importów 4, eksportów 8 | wejścia do ocen porządku, używa religii (granica MIA/KUL); przypisano MIA |
| 49 | `gra/src/game/spich-auto-ration-notify.ts` | 31 | MIA | `spich-auto-ration-notify.ts`: nagłówek „spich-auto-ration-notify.ts — komunikaty SPICH-AUTO-Q1 (auto-obniżenie racji).”; importów 3, eksportów 3 |  |
| 50 | `gra/src/ui/buildModeHud.ts` | 963 | MIA | `buildModeHud.ts`: nagłówek „buildModeHud.ts — tryb 🔨 Budowa (A4-Q1=A, A4-D4-Q1=A).”; importów 7, eksportów 5 |  |
| 51 | `gra/src/ui/cityForeignPick.ts` | 244 | MIA | `cityForeignPick.ts`: nagłówek „cityForeignPick.ts — wybór przy kliknięciu obcego miasta: informacja o heksie/mieście”; importów 2, eksportów 4 |  |
| 52 | `gra/src/ui/cityListHud.ts` | 332 | MIA | `cityListHud.ts`: nagłówek „cityListHud.ts — lista miast gracza na mapie świata (po kliknięciu medalionu Miasta”; importów 5, eksportów 11 |  |
| 53 | `gra/src/ui/cityPanel.ts` | 11986 | MIA | `cityPanel.ts`: importów 66, eksportów 22 | panel miasta (66 importów; granica MIA/EKO/JED); przypisano MIA |
| 54 | `gra/src/ui/cityUnitPick.ts` | 265 | MIA | `cityUnitPick.ts`: nagłówek „cityUnitPick.ts — wybór: panel miasta vs zaznaczenie jednostki (ten sam heks).”; importów 3, eksportów 4 | wybór panel miasta vs jednostka (ten sam heks); przypisano MIA |
| 55 | `gra/src/ui/cityUxFrame.ts` | 296 | MIA | `cityUxFrame.ts`: nagłówek „cityUxFrame.ts — ramka panelu miasta (Civ V): lewo=produkcja, prawo=okolica, mapa centralna.”; importów 7, eksportów 6 |  |
| 56 | `gra/src/ui/orderPanel.ts` | 231 | MIA | `orderPanel.ts`: importów 3, eksportów 7 |  |
| 57 | `gra/src/game/army-concentration.ts` | 332 | JED | `army-concentration.ts`: nagłówek „Owner-agnostic concentration gate for active field armies.”; importów 3, eksportów 15 |  |
| 58 | `gra/src/game/army-cycle.ts` | 128 | JED | `army-cycle.ts`: nagłówek „army-cycle.ts — R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 (Evaluator, runda PASS-WITH-NOTES, N1,”; importów 2, eksportów 3 |  |
| 59 | `gra/src/game/army-starvation.ts` | 87 | JED | `army-starvation.ts`: nagłówek „army-starvation.ts — głód wojska (B5-Q1 / PYTANIE-85):”; importów 2, eksportów 4 |  |
| 60 | `gra/src/game/armyMerge.ts` | 1015 | JED | `armyMerge.ts`: nagłówek „armyMerge.ts — stosy armii na mapie: widoczność, merge, split (v1.0).”; importów 6, eksportów 48 |  |
| 61 | `gra/src/game/auto-improvements.ts` | 1049 | JED | `auto-improvements.ts`: importów 11, eksportów 15 |  |
| 62 | `gra/src/game/auto-manage.ts` | 438 | MIA | nagłówek „Zadanie 9A — Zarządca automatyczny: autoManageCity”; eksporty `autoManageCity` (linia 395), `pickAutoBuildItem` (340), `BudowaFocus` — decyzje kolejki produkcji miasta, nie ruch jednostek | granica MIA/JED; korekta własna rundy 2: była JED, przypisano MIA (zarządza budową w mieście) |
| 63 | `gra/src/game/embarkation.ts` | 133 | JED | `embarkation.ts`: nagłówek „embarkation.ts — TEMAT #15: embarkacja jednostek lądowych (gracz + AI + Ludy Morza).”; importów 7, eksportów 10 |  |
| 64 | `gra/src/game/improvement-tech.ts` | 181 | JED | `improvement-tech.ts`: nagłówek „improvement-tech.ts — tech gate ulepszeń terenu + logika wycinki lasu (wyrąb).”; importów 2, eksportów 14 | tech gate ulepszeń terenu (granica CUD/JED); przypisano JED |
| 65 | `gra/src/game/pending-improvements.ts` | 74 | JED | `pending-improvements.ts`: nagłówek „pending-improvements.ts — ulepszenia terenu w bieżącej turze (cofanie do endTurn).”; importów 2, eksportów 4 |  |
| 66 | `gra/src/game/planned-march.ts` | 479 | JED | `planned-march.ts`: nagłówek „planned-march.ts — A3 zaplanowany marsz (pure logic).”; importów 3, eksportów 18 |  |
| 67 | `gra/src/game/rally-point.ts` | 85 | JED | `rally-point.ts`: nagłówek „rally-point.ts — owner-wide rally point state.”; importów 2, eksportów 7 |  |
| 68 | `gra/src/game/relief-preserving-improvements.ts` | 44 | JED | `relief-preserving-improvements.ts`: nagłówek „relief-preserving-improvements.ts — ulepszenia terenu, które NIE spłaszczają wzgórza/góry”; importów 0, eksportów 2 |  |
| 69 | `gra/src/game/scout-auto-explore.ts` | 280 | JED | `scout-auto-explore.ts`: nagłówek „scout-auto-explore.ts — automatyczne zwiedzanie mapy przez zwiadowców.”; importów 3, eksportów 7 |  |
| 70 | `gra/src/game/terrain-improvements.ts` | 484 | JED | `terrain-improvements.ts`: importów 4, eksportów 35 |  |
| 71 | `gra/src/game/unit-building-bonuses.ts` | 526 | JED | `unit-building-bonuses.ts`: importów 0, eksportów 33 |  |
| 72 | `gra/src/game/unit-card-stats.ts` | 121 | JED | `unit-card-stats.ts`: nagłówek „unit-card-stats.ts — efektywne staty bojowe na karcie jednostki (C-UNIT-CARD-Q1–Q3).”; importów 3, eksportów 4 |  |
| 73 | `gra/src/game/unit-cost-tempo.ts` | 39 | JED | `unit-cost-tempo.ts`: importów 0, eksportów 3 |  |
| 74 | `gra/src/game/unit-replace-context.ts` | 63 | JED | `unit-replace-context.ts`: importów 1, eksportów 2 |  |
| 75 | `gra/src/game/veteran.ts` | 424 | JED | `veteran.ts`: nagłówek „TRZECI, NIEZALEŻNY system trwałych ulepszeń jednostek: doświadczenie bojowe”; importów 0, eksportów 40 |  |
| 76 | `gra/src/map/improvement-build.ts` | 1569 | JED | `improvement-build.ts`: nagłówek „map/improvement-build.ts (lane Grupa A / MAPA)”; importów 14, eksportów 41 | budowa ulepszeń na mapie; przypisano JED |
| 77 | `gra/src/map/road-movement.ts` | 84 | JED | `road-movement.ts`: nagłówek „map/road-movement.ts (lane Grupa A / MAPA)”; importów 3, eksportów 7 |  |
| 78 | `gra/src/map/road-network.ts` | 182 | JED | `road-network.ts`: nagłówek „map/road-network.ts — SIEĆ DRÓG: maska 6 bitów sąsiedztwa + porty na ściankach heksa.”; importów 0, eksportów 17 |  |
| 79 | `gra/src/ui/armyListHud.ts` | 368 | JED | `armyListHud.ts`: nagłówek „armyListHud.ts — lista armii gracza na mapie (po kliknięciu medalionu Armia w”; importów 5, eksportów 11 |  |
| 80 | `gra/src/ui/armyMergePanel.ts` | 221 | JED | `armyMergePanel.ts`: nagłówek „armyMergePanel.ts — makieta połączenia armii (v1.0).”; importów 3, eksportów 5 |  |
| 81 | `gra/src/ui/armyMergePickPanel.ts` | 183 | JED | `armyMergePickPanel.ts`: nagłówek „armyMergePickPanel.ts — wybór jednostek i sąsiedniego stosu do połączenia (v1.0).”; importów 3, eksportów 5 |  |
| 82 | `gra/src/ui/armySplitPanel.ts` | 185 | JED | `armySplitPanel.ts`: nagłówek „armySplitPanel.ts — rozdzielenie stosu armii na dwa heksy (v1.0).”; importów 3, eksportów 5 |  |
| 83 | `gra/src/ui/armyStackHud.ts` | 380 | JED | `armyStackHud.ts`: nagłówek „armyStackHud.ts — dolny pasek armii (A-06 · 1E).”; importów 6, eksportów 5 |  |
| 84 | `gra/src/ui/armyStackPrompt.ts` | 211 | JED | `armyStackPrompt.ts`: nagłówek „Okno „Zajęty heks”: pyta gracza o scalenie armii (Połącz / Nie łącz) przy wejściu jednostki na zajęty heks; DOM-only,…”; importów 1, eksportów 4 |  |
| 85 | `gra/src/ui/improvementBuildConfirm.ts` | 93 | JED | `improvementBuildConfirm.ts`: nagłówek „improvementBuildConfirm.ts — potwierdzenie zastąpienia ulepszeń / lasu przy budowie z mapy.”; importów 4, eksportów 1 |  |
| 86 | `gra/src/ui/unitActionBarHtml.ts` | 169 | JED | `unitActionBarHtml.ts`: nagłówek „Pasek ikon akcji jednostki (fortyfikuj, zastąp, czuwaj, pomiń, rozwiąż) —”; importów 1, eksportów 2 |  |
| 87 | `gra/src/ui/unitCardStatus.ts` | 394 | JED | `unitCardStatus.ts`: nagłówek „unitCardStatus.ts — wspólny wiersz statusów karty jednostki (C-OBCE-JEDN-KARTA).”; importów 5, eksportów 14 |  |
| 88 | `gra/src/ui/unitForeignPick.ts` | 245 | JED | `unitForeignPick.ts`: nagłówek „unitForeignPick.ts — wybór przy kliknięciu obcej jednostki: karta jednostki”; importów 2, eksportów 4 |  |
| 89 | `gra/src/ui/unitInfoCard.ts` | 419 | JED | `unitInfoCard.ts`: nagłówek „Karta informacyjna jednostki (mapa) — T4 MIGRACJA-KARTA-JEDNOSTKI-MAPA.”; importów 8, eksportów 6 |  |
| 90 | `gra/src/ui/unitInfographic.ts` | 171 | JED | `unitInfographic.ts`: nagłówek „unitInfographic.ts — kanon ikon jednostek 1E (jednostki-infografiki-1E.html).”; importów 2, eksportów 7 |  |
| 91 | `gra/src/ui/unitMiniPreview.ts` | 155 | JED | `unitMiniPreview.ts`: nagłówek „Miniatura 3D jednostki (buildUnitModel) — statyczny render z shared WebGL.”; importów 4, eksportów 2 |  |
| 92 | `gra/src/ui/unitPanelHud.ts` | 183 | JED | `unitPanelHud.ts`: nagłówek „unitPanelHud.ts — panel jednostki [H] (A-06 · 1E).”; importów 3, eksportów 5 |  |
| 93 | `gra/src/ui/unitRecruitCard.ts` | 286 | JED | `unitRecruitCard.ts`: nagłówek „Kompaktowe wiersze jednostek w katalogu rekrutacji (panel miasta).”; importów 6, eksportów 3 |  |
| 94 | `gra/src/ui/unitReplacePicker.ts` | 207 | JED | `unitReplacePicker.ts`: nagłówek „unitReplacePicker.ts — modal mechanizmu "Zastąp" (ZASTAP-JEDNOSTKI-PLAN.md).”; importów 3, eksportów 5 |  |
| 95 | `gra/src/units/setup.ts` | 1068 | JED | `setup.ts`: nagłówek „Unit placement and movement logic for the world map.”; importów 6, eksportów 21 |  |
| 96 | `gra/src/battle/README-manualBattle.md` | 121 | WAL | `README-manualBattle.md`: dokumentacja Markdown |  |
| 97 | `gra/src/battle/autoBatchPhase.ts` | 190 | WAL | `autoBatchPhase.ts`: nagłówek „Deterministic planning/arbitration primitives for one automatic battle phase.”; importów 0, eksportów 7 |  |
| 98 | `gra/src/battle/battle-terrain.ts` | 818 | WAL | `battle-terrain.ts`: importów 0, eksportów 10 |  |
| 99 | `gra/src/battle/battleHudTheme.ts` | 1758 | WAL | `battleHudTheme.ts`: nagłówek „battleHudTheme.ts — tokeny HUD bitwy 1E (Design Grupa C).”; importów 0, eksportów 130 |  |
| 100 | `gra/src/battle/battleMinimap.ts` | 110 | WAL | `battleMinimap.ts`: nagłówek „battleMinimap.ts — Q2 minimap data contract + canvas renderer (D5=B).”; importów 0, eksportów 8 |  |
| 101 | `gra/src/battle/battleScene.ts` | 19493 | WAL | `battleScene.ts`: importów 38, eksportów 12 |  |
| 102 | `gra/src/battle/battleSceneOpen.ts` | 35 | WAL | `battleSceneOpen.ts`: importów 0, eksportów 3 |  |
| 103 | `gra/src/battle/battleTerrainTooltip.ts` | 96 | WAL | `battleTerrainTooltip.ts`: nagłówek „C-TEREN-IMPL-3=B — składowe wiersza TEREN w tooltipie jednostki bitwy.”; importów 2, eksportów 5 |  |
| 104 | `gra/src/battle/endDetails1E.ts` | 337 | WAL | `endDetails1E.ts`: nagłówek „endDetails1E.ts — C-23 „Szczegóły bitwy" (Design TW v5, klatka 4).”; importów 1, eksportów 7 |  |
| 105 | `gra/src/battle/endScreen1E.ts` | 221 | WAL | `endScreen1E.ts`: nagłówek „endScreen1E.ts — C-12 „Koniec bitwy" (Design TW v5, klatka 5).”; importów 1, eksportów 4 |  |
| 106 | `gra/src/battle/manualBattle.ts` | 1433 | WAL | `manualBattle.ts`: importów 10, eksportów 5 |  |
| 107 | `gra/src/battle/mapFieldBattle.ts` | 581 | WAL | `mapFieldBattle.ts`: nagłówek „mapFieldBattle.ts — atak miasta bez muru z mapy (F-P1-01 / C1).”; importów 17, eksportów 7 |  |
| 108 | `gra/src/battle/siegeHud1E.ts` | 178 | WAL | `siegeHud1E.ts`: nagłówek „siegeHud1E.ts — HUD oblężenia C-04 (Design 1E, 2026-07-03).”; importów 1, eksportów 10 |  |
| 109 | `gra/src/battle/siegeWall.ts` | 1047 | WAL | `siegeWall.ts`: nagłówek „siegeWall.ts — proceduralny mur obronny dla 9 cywilizacji epoki brazu.”; importów 2, eksportów 3 |  |
| 110 | `gra/src/battle/testBattle.ts` | 449 | WAL | `testBattle.ts`: importów 1, eksportów 10 |  |
| 111 | `gra/src/game/auto-battle-params.ts` | 42 | WAL | `auto-battle-params.ts`: nagłówek „auto-battle-params.ts — parametry auto-walki (Panel-C → auto-battle-params.json).”; importów 1, eksportów 6 |  |
| 112 | `gra/src/game/auto-battle-power.ts` | 243 | WAL | `auto-battle-power.ts`: nagłówek „auto-battle-power.ts — werdykt i straty auto-walki na mocy M (kanon v2b).”; importów 3, eksportów 11 |  |
| 113 | `gra/src/game/battle-loot.ts` | 93 | WAL | `battle-loot.ts`: nagłówek „battle-loot.ts — łup po wygranej bitwie = koszt rekrutacji zniszczonych jednostek wroga.”; importów 5, eksportów 7 |  |
| 114 | `gra/src/game/battle-summary.ts` | 173 | WAL | `battle-summary.ts`: nagłówek „battle-summary.ts — dane podsumowania po bitwie (mapa / szturm).”; importów 0, eksportów 7 |  |
| 115 | `gra/src/game/capital-capture.ts` | 326 | WAL | `capital-capture.ts`: nagłówek „capital-capture.ts — RDZEŃ „przejęcie stolicy" (plunder + eliminacja).”; importów 1, eksportów 12 | przejęcie stolicy: plunder + eliminacja (granica WAL/PM); przypisano WAL |
| 116 | `gra/src/game/city-defense.ts` | 178 | WAL | `city-defense.ts`: importów 2, eksportów 7 |  |
| 117 | `gra/src/game/combat.ts` | 1426 | WAL | `combat.ts`: nagłówek „PURE, deterministyczny resolver walki (kanoniczny model SS5l): mnożniki statystyk, bonusy cywilizacji, budynków i wet…”; importów 12, eksportów 35 |  |
| 118 | `gra/src/game/conquest-stability.ts` | 191 | WAL | `conquest-stability.ts`: importów 4, eksportów 11 | stabilność po podboju (granica WAL/PM); przypisano WAL |
| 119 | `gra/src/game/defenseBreakdown.ts` | 322 | WAL | `defenseBreakdown.ts`: importów 2, eksportów 12 |  |
| 120 | `gra/src/game/mapSiegeDetect.ts` | 95 | WAL | `mapSiegeDetect.ts`: nagłówek „mapSiegeDetect.ts — klasyfikacja starcia przy ataku miasta z mapy (C1/C3).”; importów 3, eksportów 8 |  |
| 121 | `gra/src/game/post-battle-map.ts` | 561 | WAL | `post-battle-map.ts`: nagłówek „post-battle-map.ts — wspólne skutki walki na mapie (auto + ręczna 3D).”; importów 13, eksportów 14 |  |
| 122 | `gra/src/game/post-capture-law.ts` | 170 | WAL | `post-capture-law.ts`: nagłówek „post-capture-law.ts — bonus Prawa po zdobyciu miasta (B-LAW-Q1).”; importów 3, eksportów 15 |  |
| 123 | `gra/src/game/siege.ts` | 866 | WAL | `siege.ts`: nagłówek „PURE, deterministic, DOM-free city-siege logic for The Game (4X Civ-style).”; importów 3, eksportów 32 |  |
| 124 | `gra/src/game/siegeAi.ts` | 292 | WAL | `siegeAi.ts`: nagłówek „Pure, deterministic AI siege stance logic (C3-Q2=custom).”; importów 2, eksportów 18 | AI stance wobec oblężenia (granica AI/WAL); przypisano WAL |
| 125 | `gra/src/game/siegeDefenders.ts` | 162 | WAL | `siegeDefenders.ts`: nagłówek „siegeDefenders.ts — kto broni miasto przy szturmie / zdobyciu (C3-ST-1…3).”; importów 4, eksportów 13 |  |
| 126 | `gra/src/game/siegeMachines.ts` | 83 | WAL | `siegeMachines.ts`: nagłówek „siegeMachines.ts — kolejka machin oblężniczych (C3-Q8=C, OBL-S5).”; importów 0, eksportów 10 |  |
| 127 | `gra/src/game/unit-power.ts` | 207 | WAL | `unit-power.ts`: nagłówek „unit-power.ts — moc jednostki (pole vs oblężenie), TW v3.”; importów 1, eksportów 11 |  |
| 128 | `gra/src/map/map-attack-city.ts` | 155 | WAL | `map-attack-city.ts`: nagłówek „map-attack-city.ts — routing kliku wrogiego miasta z mapy (F-P1-01).”; importów 6, eksportów 4 | atak na miasto z mapy; przypisano WAL |
| 129 | `gra/src/ui/cityAttackChoice.ts` | 239 | WAL | `cityAttackChoice.ts`: nagłówek „cityAttackChoice.ts -- wybor akcji przy ataku miasta z murem (C3-Q1=A).”; importów 3, eksportów 4 |  |
| 130 | `gra/src/ui/cityCaptureNotice.ts` | 356 | WAL | `cityCaptureNotice.ts`: nagłówek „cityCaptureNotice.ts — tabliczka po zdobyciu miasta.”; importów 2, eksportów 6 | tabliczka po zdobyciu miasta (granica WAL/PM); przypisano WAL |
| 131 | `gra/src/ui/postBattleSummary.ts` | 603 | WAL | `postBattleSummary.ts`: nagłówek „postBattleSummary.ts — wynik po bitwie mapowej (layout TW jak preBattle C-01 v3).”; importów 6, eksportów 4 |  |
| 132 | `gra/src/ui/preBattle.ts` | 918 | WAL | `preBattle.ts`: importów 8, eksportów 15 |  |
| 133 | `gra/src/ui/siegeMapPanel.ts` | 371 | WAL | `siegeMapPanel.ts`: nagłówek „siegeMapPanel.ts — panel oblężenia na mapie (C3-Q7=A: boczny overlay, mapa widoczna).”; importów 6, eksportów 7 |  |
| 134 | `gra/src/units/battleRoster.ts` | 158 | WAL | `battleRoster.ts`: nagłówek „battleRoster.ts — skład armii na potyczkę (C1-Q4 / D8=A).”; importów 2, eksportów 8 |  |
| 135 | `gra/src/game/ai-city-capture-executor.ts` | 122 | AI | `ai-city-capture-executor.ts`: nagłówek „Egzekutor zwykłego ruchu AI z wąską ścieżką przejęcia pustego miasta.”; importów 1, eksportów 7 | egzekutor AI przejęcia miasta (granica AI/PM); przypisano AI |
| 136 | `gra/src/game/ai-difficulty-bonus.ts` | 209 | AI | `ai-difficulty-bonus.ts`: nagłówek „P-AI-MOC-BONUS=A — podpięcie martwych pól DifficultyParams dla major AI.”; importów 7, eksportów 14 |  |
| 137 | `gra/src/game/ai-expansion.ts` | 37 | AI | `ai-expansion.ts`: nagłówek „P-AI-006=C — ekspansywność AI per nacja (zakładanie miast).”; importów 0, eksportów 6 |  |
| 138 | `gra/src/game/ai-fog.ts` | 135 | AI | `ai-fog.ts`: nagłówek „P-AI-BRAK-POJECIA-MGLY-Q1 — trwała pamięć celów AI.”; importów 0, eksportów 10 | pamięć celów AI (granica AI/MAPA); przypisano AI |
| 139 | `gra/src/game/ai-major-absorb.ts` | 80 | AI | `ai-major-absorb.ts`: nagłówek „P-AI-MAJOR-ABSORB — czysta logika wchłaniania major AI → major AI.”; importów 1, eksportów 6 | AI wchłania major AI (granica DYP/AI); przypisano AI |
| 140 | `gra/src/game/ai-production-priorities.ts` | 28 | AI | `ai-production-priorities.ts`: nagłówek „P-AI-007=A — priorytety produkcji miasta AI z Panelu D (civ-ai.json).”; importów 0, eksportów 3 |  |
| 141 | `gra/src/game/ai-resource-needs.ts` | 152 | AI | `ai-resource-needs.ts`: nagłówek „ai-resource-needs.ts — wykrywanie deficytu surowców per owner (P-AI-011 / proaktywny handel).”; importów 4, eksportów 6 |  |
| 142 | `gra/src/game/ai-threat-mode.ts` | 50 | AI | `ai-threat-mode.ts`: nagłówek „P-AI-008 — tryb zagrożenia AI: jednostki + rozwój (major AI), nie mury.”; importów 0, eksportów 8 |  |
| 143 | `gra/src/game/ai.ts` | 6054 | AI | `ai.ts`: nagłówek „AI decision module for The Game -- pure functions, no DOM, no THREE.”; importów 38, eksportów 107 |  |
| 144 | `gra/src/game/civ-ai-allocation.ts` | 113 | AI | `civ-ai-allocation.ts`: nagłówek „Per-civilization AI allocation profiles.”; importów 0, eksportów 10 |  |
| 145 | `gra/src/game/civ-ai-data.ts` | 218 | AI | `civ-ai-data.ts`: nagłówek „civ-ai-data.ts — odczyt per-nacja z civ-ai.json / civ-params.json (Excel 5A).”; importów 6, eksportów 15 |  |
| 146 | `gra/src/game/civ-roster.ts` | 177 | AI | `civ-roster.ts`: nagłówek „civ-roster.ts — przypisanie typów cywilizacji AI przy starcie gry (E1-D-Q1=A).”; importów 0, eksportów 7 |  |
| 147 | `gra/src/game/difficulty-cost.ts` | 136 | AI | `difficulty-cost.ts`: importów 3, eksportów 9 |  |
| 148 | `gra/src/game/effective-difficulty-for-owner.ts` | 15 | AI | `effective-difficulty-for-owner.ts`: nagłówek „P-AI-PROD-GATE-Q1=A — trudność efektywna per owner (major vs miasto-państwo).”; importów 1, eksportów 1 |  |
| 149 | `gra/src/game/forced-war-bronze.ts` | 277 | AI | `forced-war-bronze.ts`: nagłówek „Wymuszona wojna epoki Brąz: główna cywilizacja AI bez aktywnej wojny wypowiada wojnę sąsiadowi; koniec po zdobyciu/ut…”; importów 1, eksportów 17 |  |
| 150 | `gra/src/game/forced-war-common.ts` | 413 | AI | `forced-war-common.ts`: nagłówek „Wspólny, czysty mechanizm wojen wymuszonych.”; importów 0, eksportów 17 |  |
| 151 | `gra/src/game/forced-war-iron.ts` | 292 | AI | `forced-war-iron.ts`: nagłówek „Wymuszona wojna epoki Żelazo (trzecia i ostatnia epoka): mechanizm naśladuje Brąz, wyzwalany awansem epoki (R-EPOKA-Z…”; importów 1, eksportów 17 |  |
| 152 | `gra/src/game/forced-war-stone.ts` | 163 | AI | `forced-war-stone.ts`: nagłówek „Wymuszona wojna epoki Kamień: stałe (start od tury 25, limity miast, odpoczynku, cooldownu, czasu trwania pary wojny)…”; importów 1, eksportów 17 |  |
| 153 | `gra/src/game/forced-war-waves.ts` | 293 | AI | `forced-war-waves.ts`: nagłówek „Fale wymuszonej wojny: wybór świeżej fali z wolnych jednostek (kierunek sektorowy od miasta celu) oraz typy stanu i h…”; importów 3, eksportów 12 |  |
| 154 | `gra/src/game/alliance-war-obligation.ts` | 57 | DYP | `alliance-war-obligation.ts`: nagłówek „alliance-war-obligation.ts — czysta heurystyka N4: czy sojusznik honoruje obowiązek wojny.”; importów 0, eksportów 2 |  |
| 155 | `gra/src/game/border-march-scan.ts` | 61 | DYP | `border-march-scan.ts`: nagłówek „border-march-scan.ts — P5: wykrycie par intruz→właściciel terytorium (koniec tury).”; importów 3, eksportów 4 | wykrywanie przemarszu na terytorium (granica DYP/WAL); przypisano DYP |
| 156 | `gra/src/game/danina-nazwa.ts` | 64 | DYP | `danina-nazwa.ts`: importów 0, eksportów 7 |  |
| 157 | `gra/src/game/diplomacy-acceptance-points.ts` | 715 | DYP | `diplomacy-acceptance-points.ts`: nagłówek „diplomacy-acceptance-points.ts — punkty akceptacji stołu negocjacji (Maciej 2026-07-29).”; importów 7, eksportów 16 |  |
| 158 | `gra/src/game/diplomacy-ai-balance.ts` | 639 | DYP | `diplomacy-ai-balance.ts`: nagłówek „diplomacy-ai-balance.ts — R-HANDEL-AI-FALA: AI trade proposals vs real resources.”; importów 4, eksportów 10 |  |
| 159 | `gra/src/game/diplomacy-ai-offer-balance.ts` | 686 | DYP | `diplomacy-ai-offer-balance.ts`: nagłówek „diplomacy-ai-offer-balance.ts — D-DYPLO-AI-OFERTA-ZERO (Maciej 2026-07-29).”; importów 6, eksportów 23 |  |
| 160 | `gra/src/game/diplomacy-audience-actions.ts` | 134 | DYP | `diplomacy-audience-actions.ts`: nagłówek „diplomacy-audience-actions.ts — budowa listy akcji audiencji z katalogu JSON”; importów 2, eksportów 8 |  |
| 161 | `gra/src/game/diplomacy-barbarian-cooperation.ts` | 82 | DYP | `diplomacy-barbarian-cooperation.ts`: nagłówek „R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1.”; importów 4, eksportów 7 | dyplomacja z barbarzyńcami (przemarsz/współwalka); przypisano DYP |
| 162 | `gra/src/game/diplomacy-basket-transfer.ts` | 289 | DYP | `diplomacy-basket-transfer.ts`: nagłówek „diplomacy-basket-transfer.ts — transfer tech + surowiec boolean z koszyka PN (P6).”; importów 3, eksportów 13 |  |
| 163 | `gra/src/game/diplomacy-border-march.ts` | 296 | DYP | `diplomacy-border-march.ts`: nagłówek „diplomacy-border-march.ts — kara za nieautoryzowany przemarsz (D3-BORD, P5).”; importów 5, eksportów 11 |  |
| 164 | `gra/src/game/diplomacy-credibility.ts` | 684 | DYP | `diplomacy-credibility.ts`: nagłówek „diplomacy-credibility.ts — Wiarygodność cywilizacji (Etap 1: rdzeń).”; importów 2, eksportów 37 |  |
| 165 | `gra/src/game/diplomacy-currency-trade.ts` | 39 | DYP | `diplomacy-currency-trade.ts`: nagłówek „diplomacy-currency-trade.ts — kurs wymiany ¤ ↔ Praca (handel dyplomatyczny v1).”; importów 1, eksportów 3 |  |
| 166 | `gra/src/game/diplomacy-deposit-trade.ts` | 67 | DYP | `diplomacy-deposit-trade.ts`: nagłówek „diplomacy-deposit-trade.ts — cennik dostępu do złoża (handel dyplomatyczny v1).”; importów 1, eksportów 5 |  |
| 167 | `gra/src/game/diplomacy-display.ts` | 731 | DYP | `diplomacy-display.ts`: nagłówek „diplomacy-display.ts — dane prezentacyjne dyplomacji (D3-UX BBBB, lane CYW).”; importów 11, eksportów 34 |  |
| 168 | `gra/src/game/diplomacy-economy.ts` | 325 | DYP | `diplomacy-economy.ts`: nagłówek „diplomacy-economy.ts — rozliczenia trybutu / handlu v1.1 (lane EKO).”; importów 1, eksportów 34 |  |
| 169 | `gra/src/game/diplomacy-factors.ts` | 204 | DYP | `diplomacy-factors.ts`: nagłówek „diplomacy-factors.ts — rejestr per-para czynników relacji + rozbicie”; importów 1, eksportów 10 |  |
| 170 | `gra/src/game/diplomacy-goods.ts` | 138 | DYP | `diplomacy-goods.ts`: nagłówek „diplomacy-goods.ts — indeks dóbr handlowych PER WŁAŚCICIEL (domknięcie zaległości #3,”; importów 0, eksportów 7 |  |
| 171 | `gra/src/game/diplomacy-layers.ts` | 374 | DYP | `diplomacy-layers.ts`: nagłówek „diplomacy-layers.ts — warstwy dyplomacji D-START-2B / 3A.”; importów 4, eksportów 25 |  |
| 172 | `gra/src/game/diplomacy-locks.ts` | 341 | DYP | `diplomacy-locks.ts`: nagłówek „diplomacy-locks.ts — logika blokad akcji dyplomatycznych (Makieta DYPLOMACJA”; importów 0, eksportów 6 |  |
| 173 | `gra/src/game/diplomacy-pair-summary.ts` | 113 | DYP | `diplomacy-pair-summary.ts`: nagłówek „diplomacy-pair-summary.ts — R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA.”; importów 3, eksportów 4 |  |
| 174 | `gra/src/game/diplomacy-peace-lock.ts` | 57 | DYP | `diplomacy-peace-lock.ts`: nagłówek „diplomacy-peace-lock.ts — karencja po zawarciu pokoju / rozejmu (Maciej 2026-08-01).”; importów 2, eksportów 4 |  |
| 175 | `gra/src/game/diplomacy-penalty-preview.ts` | 172 | DYP | `diplomacy-penalty-preview.ts`: nagłówek „diplomacy-penalty-preview.ts — podgląd kar Wiarygodności / Zaufania PRZED akcją gracza.”; importów 3, eksportów 7 |  |
| 176 | `gra/src/game/diplomacy-pn-engine.ts` | 476 | DYP | `diplomacy-pn-engine.ts`: nagłówek „diplomacy-pn-engine.ts — stan per para + logika PN→Zaufanie (D4-WYMIANA-PN).”; importów 6, eksportów 30 |  |
| 177 | `gra/src/game/diplomacy-proposals.ts` | 2734 | DYP | `diplomacy-proposals.ts`: nagłówek „diplomacy-proposals.ts — ocena propozycji dyplomatycznych v1.1 (lane CYW).”; importów 14, eksportów 61 |  |
| 178 | `gra/src/game/diplomacy-rejection-cooldown.ts` | 83 | DYP | `diplomacy-rejection-cooldown.ts`: nagłówek „diplomacy-rejection-cooldown.ts — D-DYPLO-AI-NO-NAG (Maciej 2026-07-29).”; importów 1, eksportów 7 |  |
| 179 | `gra/src/game/diplomacy-resource-trade-pick.ts` | 234 | DYP | `diplomacy-resource-trade-pick.ts`: nagłówek „diplomacy-resource-trade-pick.ts — wybór kierunku handlu surowcem między dwoma ownerami.”; importów 2, eksportów 10 |  |
| 180 | `gra/src/game/diplomacy-tech-trade.ts` | 236 | DYP | `diplomacy-tech-trade.ts`: nagłówek „diplomacy-tech-trade.ts — R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08, playtest Macieja).”; importów 2, eksportów 8 |  |
| 181 | `gra/src/game/diplomacy-trade-validation.ts` | 36 | DYP | `diplomacy-trade-validation.ts`: nagłówek „Walidacja stron koszyka wymiany — logika czysta (testowalna bez UI).”; importów 1, eksportów 3 |  |
| 182 | `gra/src/game/diplomacy-treaties.ts` | 448 | DYP | `diplomacy-treaties.ts`: nagłówek „diplomacy-treaties.ts — aktywne traktaty v1.1 (lane CYW).”; importów 2, eksportów 33 |  |
| 183 | `gra/src/game/diplomacy-unit-transfer.ts` | 74 | DYP | `diplomacy-unit-transfer.ts`: nagłówek „diplomacy-unit-transfer.ts — P6: spawn jednostki z koszyka wymiany PN.”; importów 3, eksportów 4 |  |
| 184 | `gra/src/game/diplomacy-value-catalog.ts` | 731 | DYP | `diplomacy-value-catalog.ts`: nagłówek „diplomacy-value-catalog.ts — wspólny katalog PN (handel, dar, przekupstwo).”; importów 10, eksportów 40 |  |
| 185 | `gra/src/game/diplomacy-war-gates.ts` | 54 | DYP | `diplomacy-war-gates.ts`: nagłówek „diplomacy-war-gates.ts — wspólne bramki wojny (Maciej 2026-08-01).”; importów 1, eksportów 6 |  |
| 186 | `gra/src/game/diplomacy.ts` | 1766 | DYP | `diplomacy.ts`: importów 10, eksportów 45 |  |
| 187 | `gra/src/game/trade-routes.ts` | 2091 | DYP | `trade-routes.ts`: nagłówek „trade-routes.ts — Handel E2/E3: wykrywanie połączeń miast + dochód z tras.”; importów 5, eksportów 49 | handel wewnętrzny (szlaki); GOAL wiąże handel z dyplomacją, P6.15 traktuje osobno; przypisano DYP |
| 188 | `gra/src/game/wiarygodnosc-types.ts` | 58 | DYP | `wiarygodnosc-types.ts`: nagłówek „wiarygodnosc-types.ts — Etap 0: typy i struktury Wiarygodności (bez logiki tick / bez Dźwigni 1).”; importów 0, eksportów 7 |  |
| 189 | `gra/src/ui/diploListHud.ts` | 502 | DYP | `diploListHud.ts`: nagłówek „diploListHud.ts — lista cywilizacji do dyplomacji (toolbar tb-diplomacy).”; importów 7, eksportów 16 |  |
| 190 | `gra/src/ui/diploUiSkin.ts` | 231 | DYP | `diploUiSkin.ts`: nagłówek „diploUiSkin.ts — wspólny skin 1E dla modułów dyplomacji (P1 reskin).”; importów 4, eksportów 14 |  |
| 191 | `gra/src/ui/diplomacyAcceptanceBalance.ts` | 911 | DYP | `diplomacyAcceptanceBalance.ts`: nagłówek „diplomacyAcceptanceBalance.ts — panel punktów wymiany (PW) na stole negocjacji.”; importów 5, eksportów 16 |  |
| 192 | `gra/src/ui/diplomacyAudience.ts` | 2443 | DYP | `diplomacyAudience.ts`: nagłówek „diplomacyAudience.ts — ekran audiencji dyplomatycznej (D3-Q1…Q4).”; importów 18, eksportów 32 |  |
| 193 | `gra/src/ui/diplomacyDealDisplay.ts` | 312 | DYP | `diplomacyDealDisplay.ts`: nagłówek „diplomacyDealDisplay.ts — czytelny HTML ofert handlowych (ikony surowców + rozpiska).”; importów 4, eksportów 9 |  |
| 194 | `gra/src/ui/diplomacyNegotiationModal.ts` | 562 | DYP | `diplomacyNegotiationModal.ts`: nagłówek „diplomacyNegotiationModal.ts — modale negocjacji audiencji v1.1 (lane UI).”; importów 6, eksportów 7 |  |
| 195 | `gra/src/ui/diplomacyPanel.ts` | 533 | DYP | `diplomacyPanel.ts`: importów 3, eksportów 19 |  |
| 196 | `gra/src/ui/diplomacyPendingHud.ts` | 87 | DYP | `diplomacyPendingHud.ts`: nagłówek „diplomacyPendingHud.ts — modal odpowiedzi na propozycję AI (A1-Q18 blocking).”; importów 1, eksportów 3 |  |
| 197 | `gra/src/ui/diplomacyProposalBanner.ts` | 55 | DYP | `diplomacyProposalBanner.ts`: nagłówek „diplomacyProposalBanner.ts — wynik negocjacji po evaluateProposal.”; importów 1, eksportów 2 |  |
| 198 | `gra/src/ui/diplomacyTradeBasket.ts` | 2851 | DYP | `diplomacyTradeBasket.ts`: nagłówek „diplomacyTradeBasket.ts — koszyk handlu / daru (PN) v1.0 (lane UI, P4).”; importów 24, eksportów 19 |  |
| 199 | `gra/src/ui/unitCtxDockDiploGate.ts` | 26 | DYP | `unitCtxDockDiploGate.ts`: nagłówek „unitCtxDockDiploGate.ts — ukrywanie docku karty jednostki przy otwartym UI dyplomacji”; importów 0, eksportów 4 | bramka dyplomatyczna kontekstu jednostki; przypisano DYP |
| 200 | `gra/src/game/civ-bonuses.ts` | 380 | INNE | nagłówek „bonusy cywilizacji z civs.json”; eksporty mnożników walki/ruchu/kosztu budowy (`civCombatStatMultipliers`, `civMovementMultiplier`, `civBuildingCostDiscount`) — nie kultura ani religia | przekrojowy (walka, ruch, koszt budowy); przeniesione z KUL; do decyzji P2.1 |
| 201 | `gra/src/game/civ-matrix-semantic.ts` | 636 | INNE | nagłówek „read-only semantic presentation of the civilization matrix” (klasyfikator statusu parametrów, bez zapisu stanu) | prezentacja macierzy z civ-matrix.ts; przeniesione z KUL razem z civ-matrix.ts; do decyzji P2.1 |
| 202 | `gra/src/game/civ-matrix.ts` | 142 | INNE | nagłówek „mnożniki cywilizacji z civ-matrix.json”; eksport `civMatrixParam`; 93 parametry w `paramDefs` (domeny: walka 41, ekonomia 10, społeczeństwo 9, dyplomacja 8, AI 8 i inne) | przekrojowy mnożnik cywilizacji; przeniesione z KUL; do decyzji P2.1 |
| 203 | `gra/src/game/civ-names.ts` | 195 | KUL | `civ-names.ts`: nagłówek „civ-names.ts — wspólna sekwencja nazw (civs.json + city-names-pools.json).”; importów 3, eksportów 15 |  |
| 204 | `gra/src/game/civ-visual.ts` | 113 | KUL | `civ-visual.ts`: nagłówek „civ-visual.ts — kolory wizualne cywilizacji (kolorHex z civs.json).”; importów 1, eksportów 11 |  |
| 205 | `gra/src/game/culture-religion.ts` | 1479 | KUL | `culture-religion.ts`: importów 1, eksportów 58 |  |
| 206 | `gra/src/ui/civBrandDisplay.ts` | 68 | KUL | `civBrandDisplay.ts`: nagłówek „civBrandDisplay.ts — krótka linia wyróżnika cywilizacji (styl + jednostka specjalna).”; importów 1, eksportów 4 |  |
| 207 | `gra/src/ui/empireOverlayHud.ts` | 138 | KUL | `empireOverlayHud.ts`: nagłówek „empireOverlayHud.ts — overlaye imperium: Kultura + Religia (A1-Q16=A).”; importów 2, eksportów 5 |  |
| 208 | `gra/src/ui/leaderBannersHud.ts` | 68 | KUL | `leaderBannersHud.ts`: nagłówek „leaderBannersHud.ts — banery liderów (strefa D mockupu HUD Mapy 1E).”; importów 3, eksportów 2 |  |
| 209 | `gra/src/ui/leaderPortraits.ts` | 225 | KUL | `leaderPortraits.ts`: nagłówek „leaderPortraits.ts — portrety władców w medalionach dowódców (bitwa/preBattle/dyplomacja).”; importów 2, eksportów 6 |  |
| 210 | `gra/src/game/civ-entry-epoch.ts` | 88 | CUD | `civ-entry-epoch.ts`: nagłówek „civ-entry-epoch.ts — epoka PIERWSZEGO wejścia cywilizacji (kaskada w górę).”; importów 0, eksportów 9 |  |
| 211 | `gra/src/game/era-change-notify.ts` | 49 | CUD | `era-change-notify.ts`: nagłówek „era-change-notify.ts — komunikat graczowi przy awansie epoki (ownerId 0).”; importów 0, eksportów 8 |  |
| 212 | `gra/src/game/era-gate-ui.ts` | 147 | CUD | `era-gate-ui.ts`: nagłówek „era-gate-ui.ts — R-EPOKA-CUD-ZAKRES-Q1=B: informacja UI "co brakuje do awansu epoki".”; importów 4, eksportów 7 |  |
| 213 | `gra/src/game/livestock-unlock.ts` | 175 | CUD | `livestock-unlock.ts`: nagłówek „livestock-unlock.ts — odblokowanie hodowli (Model B 2026-07-09).”; importów 3, eksportów 13 | odblokowanie hodowli przez model technologii (granica CUD/JED); przypisano CUD |
| 214 | `gra/src/game/owner-epoch.ts` | 128 | CUD | `owner-epoch.ts`: nagłówek „owner-epoch.ts — epoka imperium AI z badań (nie z etykiety Epoka w tech.json).”; importów 5, eksportów 6 |  |
| 215 | `gra/src/game/research.ts` | 627 | CUD | `research.ts`: nagłówek „Technology research logic for The Game -- pure module, no DOM, no THREE.”; importów 0, eksportów 30 |  |
| 216 | `gra/src/game/tech-tempo.ts` | 40 | CUD | `tech-tempo.ts`: importów 0, eksportów 3 |  |
| 217 | `gra/src/game/tech-tree.ts` | 161 | CUD | `tech-tree.ts`: nagłówek „tech-tree.ts — B1-Q3 drzewko liniowe (Maciej 2026-06-28, opcja B).”; importów 1, eksportów 8 |  |
| 218 | `gra/src/game/wonder-availability.ts` | 120 | CUD | `wonder-availability.ts`: nagłówek „wonder-availability.ts — bramka dostępności budowy cudu (pure logic).”; importów 3, eksportów 6 |  |
| 219 | `gra/src/game/wonder-civ-tech.ts` | 110 | CUD | `wonder-civ-tech.ts`: nagłówek „wonder-civ-tech.ts — reguła techUnlock cudów E vs epokaWejscia państwa.”; importów 1, eksportów 7 |  |
| 220 | `gra/src/game/wonder-map-build.ts` | 69 | CUD | `wonder-map-build.ts`: nagłówek „wonder-map-build.ts — budowa cudów na heksie mapy (nie kolejka miasta).”; importów 0, eksportów 4 |  |
| 221 | `gra/src/game/wonders-data.ts` | 312 | CUD | `wonders-data.ts`: nagłówek „wonders-data.ts — odczyt cudów świata (gra/data/wonders.json).”; importów 1, eksportów 27 |  |
| 222 | `gra/src/map/wonder-placement.ts` | 119 | CUD | `wonder-placement.ts`: nagłówek „wonder-placement.ts — wybór heksa na cud świata w terytorium miasta (MAPA).”; importów 5, eksportów 6 |  |
| 223 | `gra/src/ui/naukaLabel.ts` | 18 | CUD | `naukaLabel.ts`: nagłówek „Etykieta tekstowa zamiast mikroskopu (🔬) przy zasobie Nauka.”; importów 0, eksportów 4 |  |
| 224 | `gra/src/ui/scienceHubHud.ts` | 792 | CUD | `scienceHubHud.ts`: nagłówek „scienceHubHud.ts — hub badań (postęp + lista tech + wejście do drzewka).”; importów 11, eksportów 13 |  |
| 225 | `gra/src/ui/scienceHubSnapshotLogic.ts` | 142 | CUD | `scienceHubSnapshotLogic.ts`: nagłówek „scienceHubSnapshotLogic.ts — czysta logika listy „Możesz wybrać" (hub badań).”; importów 0, eksportów 6 |  |
| 226 | `gra/src/ui/sciencePicker.ts` | 1666 | CUD | `sciencePicker.ts`: importów 15, eksportów 16 |  |
| 227 | `gra/src/ui/techDiscoveryNotice.ts` | 946 | CUD | `techDiscoveryNotice.ts`: nagłówek „Karta odkrytej technologii, otwierana przy ukończeniu badań.”; importów 11, eksportów 4 |  |
| 228 | `gra/src/ui/techIcons.ts` | 77 | CUD | `techIcons.ts`: nagłówek „Ikony 32 technologii Antyku (Claude Design, Zlecenie 7 — TECH-IKONY-32).”; importów 0, eksportów 2 |  |
| 229 | `gra/src/ui/techTreeView.ts` | 1130 | CUD | `techTreeView.ts`: importów 11, eksportów 6 |  |
| 230 | `gra/src/ui/techUnlockParse.ts` | 52 | CUD | `techUnlockParse.ts`: importów 1, eksportów 3 |  |
| 231 | `gra/src/ui/wonderCompletedNotice.ts` | 124 | CUD | `wonderCompletedNotice.ts`: nagłówek „wonderCompletedNotice.ts — powiadomienie „Cud ukończony” (TEMAT #16, klatka C).”; importów 1, eksportów 3 |  |
| 232 | `gra/src/game/ai-cs-absorption.ts` | 289 | PM | `ai-cs-absorption.ts`: nagłówek „R-AI-MP-WASAL-WCHLONIECIE — czysta logika AI major → miasto-państwo (trybut/wasal/wojna/wchłonięcie).”; importów 1, eksportów 10 |  |
| 233 | `gra/src/game/city-state-difficulty.ts` | 237 | PM | `city-state-difficulty.ts`: nagłówek „Trudność państw-miast vs trudność gry + reguły konsolidacji klastra (AI-CS-CLUSTER-DIFF 2026-07-30).”; importów 0, eksportów 15 |  |
| 234 | `gra/src/game/display-names.ts` | 311 | PM | `display-names.ts`: nagłówek „display-names.ts — etykiety państw vs miast-państw klastra (Maciej 2026-07-07).”; importów 0, eksportów 19 |  |
| 235 | `gra/src/game/triumph-city-state.ts` | 80 | PM | `triumph-city-state.ts`: nagłówek „triumph-city-state.ts — triumf po zjednoczeniu miast-państw tej samej kultury (P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1=A).”; importów 1, eksportów 5 |  |
| 236 | `gra/src/ui/civElimNotice.ts` | 124 | PM | `civElimNotice.ts`: nagłówek „civElimNotice.ts — modal „ELIMINACJA!" dla wchłonięcia dyplomatycznego (miasto-państwo lub”; importów 1, eksportów 3 | modal eliminacji miasta-państwa/absorpcji; przypisano PM |
| 237 | `gra/src/ui/triumphCityStateNotice.ts` | 131 | PM | `triumphCityStateNotice.ts`: nagłówek „triumphCityStateNotice.ts — modal „TRIUMF!" po zjednoczeniu miast-państw tej”; importów 1, eksportów 4 |  |
| 238 | `gra/src/game/barbarians.ts` | 2638 | BAR | `barbarians.ts`: importów 9, eksportów 52 |  |
| 239 | `gra/src/game/map-rebels.ts` | 91 | BAR | `map-rebels.ts`: nagłówek „map-rebels.ts — buntownicy mapowi od epoki Średniowiecze (ABC 11=C*).”; importów 3, eksportów 5 |  |
| 240 | `gra/src/game/human-owners.ts` | 71 | HOT | `human-owners.ts`: importów 2, eksportów 7 |  |
| 241 | `gra/src/ui/hotSeatHandoff.ts` | 135 | HOT | `hotSeatHandoff.ts`: importów 2, eksportów 4 |  |
| 242 | `gra/src/ui/interHumanDiplomacyHud.ts` | 263 | HOT | `interHumanDiplomacyHud.ts`: nagłówek „interHumanDiplomacyHud.ts — R-HOTSEAT-ETAP8-DYPLOMACJA-UI-Q1 (Etap 8 część ii).”; importów 1, eksportów 7 | dyplomacja między ludźmi (hot-seat); przypisano HOT |
| 243 | `gra/src/game/fsa-autosave.ts` | 530 | SAV | `fsa-autosave.ts`: importów 1, eksportów 24 |  |
| 244 | `gra/src/game/idb-storage.ts` | 205 | SAV | `idb-storage.ts`: importów 0, eksportów 5 |  |
| 245 | `gra/src/game/load-map-source.ts` | 57 | SAV | `load-map-source.ts`: importów 3, eksportów 2 |  |
| 246 | `gra/src/game/save-label.ts` | 68 | SAV | `save-label.ts`: nagłówek „save-label.ts — domyślne nazwy zapisów (manual / szybki / autozapis).”; importów 1, eksportów 4 |  |
| 247 | `gra/src/game/save.ts` | 1114 | SAV | `save.ts`: nagłówek „SAVE / LOAD (task F1) -- serialize the live game state to a JSON string and”; importów 10, eksportów 29 |  |
| 248 | `gra/src/ui/gamePauseMenu.ts` | 317 | SAV | `gamePauseMenu.ts`: nagłówek „gamePauseMenu.ts — menu pomocnicze w trakcie gry (zapis / wczytaj / nowa / menu główne).”; importów 2, eksportów 7 | menu zapis/wczytaj/nowa/menu główne; przypisano SAV |
| 249 | `gra/src/ui/saveLoadDialog.ts` | 623 | SAV | `saveLoadDialog.ts`: nagłówek „saveLoadDialog.ts — wybór slotu zapisu / wczytywania (localStorage).”; importów 3, eksportów 14 |  |
| 250 | `gra/src/game/cluster-start.ts` | 395 | INNE | `cluster-start.ts`: nagłówek „cluster-start.ts — orchestracja startu klastra (SILNIK / handoff).”; importów 9, eksportów 5 |  |
| 251 | `gra/src/game/power-objective.ts` | 279 | INNE | `power-objective.ts`: nagłówek „power-objective.ts — obiektywny POWER imperium (Maciej 2026-06-26, kanon P-A).”; importów 1, eksportów 12 |  |
| 252 | `gra/src/game/power-options.ts` | 68 | INNE | `power-options.ts`: nagłówek „power-options.ts — opcje Moc/Power z power-params.json (Panel-B → Potega-opcje).”; importów 1, eksportów 4 |  |
| 253 | `gra/src/game/power-ranking.ts` | 72 | INNE | `power-ranking.ts`: nagłówek „power-ranking.ts — lista państw widocznych w rankingu Mocy (panel imperium + overlay).”; importów 1, eksportów 4 |  |
| 254 | `gra/src/game/power.ts` | 114 | INNE | `power.ts`: nagłówek „Składniki Potęgi z domeny miasto/ekonomia (B-Power-Q1=A, Q2=B, Q3=A).”; importów 0, eksportów 4 |  |
| 255 | `gra/src/game/ruch-swiata-tempo.ts` | 43 | INNE | `ruch-swiata-tempo.ts`: importów 0, eksportów 3 |  |
| 256 | `gra/src/game/start-preview.ts` | 129 | INNE | `start-preview.ts`: nagłówek „start-preview.ts — podgląd startu klastra (kreator nowej gry → SILNIK).”; importów 4, eksportów 4 |  |
| 257 | `gra/src/game/victory.ts` | 239 | INNE | `victory.ts`: nagłówek „Victory / defeat condition checks (warunki zwyciestwa).”; importów 2, eksportów 19 |  |
| 258 | `gra/src/game/villageRewards.ts` | 220 | INNE | `villageRewards.ts`: importów 4, eksportów 19 | nagrody z wiosek neutralnych (granica INNE/JED/MAPA); przypisano INNE |
| 259 | `gra/src/map/cluster-spawn.ts` | 516 | INNE | `cluster-spawn.ts`: nagłówek „cluster-spawn.ts — API spawnu miast z klastra (lane MAPA).”; importów 8, eksportów 11 |  |
| 260 | `gra/src/map/newGameMapDefaults.ts` | 743 | INNE | `newGameMapDefaults.ts`: importów 7, eksportów 65 |  |
| 261 | `gra/src/map/startScoring.ts` | 142 | INNE | `startScoring.ts`: nagłówek „startScoring.ts — wybór preferowanego hexu startu gracza (lane MAPA / SILNIK).”; importów 4, eksportów 4 |  |
| 262 | `gra/src/ui/aiCivPicker.ts` | 76 | INNE | `aiCivPicker.ts`: nagłówek „aiCivPicker.ts — logika multi-select cywilizacji przeciwnika w kreatorze (krok 4),”; importów 0, eksportów 4 | wybór cywilizacji przeciwnika w kreatorze; przypisano INNE |
| 263 | `gra/src/ui/newGameFlow.ts` | 2373 | INNE | `newGameFlow.ts`: importów 15, eksportów 10 |  |
| 264 | `gra/src/ui/power-labels.ts` | 36 | INNE | `power-labels.ts`: nagłówek „power-labels.ts — nazewnictwo Moc / Power (Maciej P-C3, 2026-06-26).”; importów 2, eksportów 5 | etykiety Mocy; przypisano INNE |
| 265 | `gra/src/ui/powerOverlayHud.ts` | 238 | INNE | `powerOverlayHud.ts`: nagłówek „powerOverlayHud.ts — overlay Moc (P-A, P-C3): składniki + ranking.”; importów 2, eksportów 9 | overlay Mocy; przypisano INNE |
| 266 | `gra/src/ui/victoryScreen.ts` | 346 | INNE | `victoryScreen.ts`: nagłówek „victoryScreen.ts — pełnoekranowy ekran końca gry (E-15 · 1E cinematic).”; importów 3, eksportów 10 |  |
| 267 | `gra/src/game/visibility.ts` | 328 | INF-MAPA | `visibility.ts`: importów 7, eksportów 21 | widoczność/mgła wojny (granica MAPA/JED); przypisano INF-MAPA |
| 268 | `gra/src/map/clusters.ts` | 4250 | INF-MAPA | `clusters.ts`: nagłówek „clusters.ts  (lane Grupa A / MAPA)”; importów 4, eksportów 78 |  |
| 269 | `gra/src/map/deposit-era.ts` | 46 | INF-MAPA | `deposit-era.ts`: nagłówek „deposit-era.ts — widoczność złóż metali per epoka (E-P0-04/05).”; importów 2, eksportów 7 | epoka złóż (mapa); przypisano INF-MAPA |
| 270 | `gra/src/map/earth-land-mask.generated.ts` | 417 | INF-MAPA | `earth-land-mask.generated.ts`: nagłówek „AUTO-GENERATED — nie edytuj ręcznie.”; importów 0, eksportów 4 |  |
| 271 | `gra/src/map/earth-land-mask.ts` | 170 | INF-MAPA | `earth-land-mask.ts`: nagłówek „Maska szablonu Ziemi (mockup Macieja, decyzja A 2026-07-04).”; importów 1, eksportów 8 |  |
| 272 | `gra/src/map/gen-helpers.ts` | 12561 | INF-MAPA | `gen-helpers.ts`: importów 6, eksportów 259 |  |
| 273 | `gra/src/map/genWorker.ts` | 45 | INF-MAPA | `genWorker.ts`: nagłówek „genWorker.ts — generacja mapy poza głównym wątkiem (DYSPOZYCJA-WYDAJNOSC C1).”; importów 4, eksportów 2 |  |
| 274 | `gra/src/map/generator.ts` | 848 | INF-MAPA | `generator.ts`: importów 11, eksportów 15 |  |
| 275 | `gra/src/map/mapGenAsync.ts` | 98 | INF-MAPA | `mapGenAsync.ts`: nagłówek „mapGenAsync.ts — generacja mapy w Web Workerze z fallbackiem na main thread.”; importów 6, eksportów 1 |  |
| 276 | `gra/src/map/mapGenProgress.ts` | 101 | INF-MAPA | `mapGenProgress.ts`: nagłówek „mapGenProgress.ts — wspólny raport postępu generacji mapy (UI overlay + worker).”; importów 0, eksportów 7 |  |
| 277 | `gra/src/map/mapSnapshot.ts` | 404 | INF-MAPA | `mapSnapshot.ts`: importów 2, eksportów 6 |  |
| 278 | `gra/src/map/minimap.ts` | 271 | INF-MAPA | `minimap.ts`: nagłówek „map/minimap.ts (Grupa A / lane MAPA)”; importów 3, eksportów 9 |  |
| 279 | `gra/src/map/range-hexes.ts` | 115 | INF-MAPA | `range-hexes.ts`: nagłówek „range-hexes.ts — heksy zasięgu kultury i religii (logika MAPA, bez Three.js).”; importów 4, eksportów 4 |  |
| 280 | `gra/src/map/riverGenSwitch.ts` | 83 | INF-MAPA | `riverGenSwitch.ts`: nagłówek „Kill-switch generowania rzek w mapgen.”; importów 0, eksportów 9 |  |
| 281 | `gra/src/map/territory-border.ts` | 238 | INF-MAPA | `territory-border.ts`: nagłówek „territory-border.ts — obwód terytorium państwa jako zamknięte pętle (logika MAPA, bez Three.js).”; importów 1, eksportów 6 |  |
| 282 | `gra/src/map/territory-work.ts` | 166 | INF-MAPA | `territory-work.ts`: nagłówek „territory-work.ts — filtrowanie pracy obywateli wg właściciela terytorium.”; importów 2, eksportów 7 |  |
| 283 | `gra/src/map/territory.ts` | 145 | INF-MAPA | `territory.ts`: nagłówek „map/territory.ts”; importów 1, eksportów 7 |  |
| 284 | `gra/src/map/villages.ts` | 214 | INF-MAPA | `villages.ts`: nagłówek „Neutralne WIOSKI (goodie huts) — rzadkie punkty na mapie świata, rozmieszczane”; importów 4, eksportów 10 |  |
| 285 | `gra/src/game/eot-event-defer.ts` | 260 | INF-UI | `eot-event-defer.ts`: nagłówek „R-EOT-EVENT-DEFER-Q1=A — skutki końca tury nie migają w overlay; czekają na start tury gracza.”; importów 1, eksportów 6 | odroczenie skutków końca tury w overlay (granica EKO/INF-UI); przypisano INF-UI |
| 286 | `gra/src/game/side-panel-event-link.ts` | 114 | INF-UI | `side-panel-event-link.ts`: nagłówek „side-panel-event-link.ts — P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1.”; importów 0, eksportów 5 |  |
| 287 | `gra/src/game/side-panel-event-priority.ts` | 9 | INF-UI | `side-panel-event-priority.ts`: nagłówek „Reguła blokującego zdarzenia panelu bocznego: tylko karty wymagające decyzji gracza (`blocking === true`) blokują kon…”; importów 1, eksportów 1 |  |
| 288 | `gra/src/ui/bottomBarHud.ts` | 335 | INF-UI | `bottomBarHud.ts`: nagłówek „bottomBarHud.ts — dolny pasek [I]/[I2]: WYKONAJ + Koniec tury (A1-Q9=A, A1-Q10).”; importów 3, eksportów 3 |  |
| 289 | `gra/src/ui/brandTokenVars.ts` | 118 | INF-UI | `brandTokenVars.ts`: nagłówek „Warstwa 1 — wspólne tokeny CSS (decyzje 1B, 2C, 4C, 5C).”; importów 2, eksportów 3 |  |
| 290 | `gra/src/ui/buildStampToggle.ts` | 100 | INF-UI | `buildStampToggle.ts`: nagłówek „buildStampToggle.ts — ukrywa pieczęć builda (inject-build-stamp.ps1) domyślnie;”; importów 0, eksportów 1 |  |
| 291 | `gra/src/ui/buildingHoverTooltip.ts` | 7 | INF-UI | `buildingHoverTooltip.ts`: nagłówek „@deprecated Użyj hoverDetailDock.ts — zachowane dla kompatybilności importów.”; importów 0, eksportów 0 |  |
| 292 | `gra/src/ui/contextPanelHud.ts` | 63 | INF-UI | `contextPanelHud.ts`: nagłówek „contextPanelHud.ts — panel kontekstowy (strefa C mockupu HUD Mapy 1E).”; importów 3, eksportów 3 |  |
| 293 | `gra/src/ui/entityCards/buildingAdapter.ts` | 340 | INF-UI | `buildingAdapter.ts`: nagłówek „entityCards/buildingAdapter.ts — `BuildingDef` (`buildings.json`) → `EntityCardData`”; importów 13, eksportów 2 |  |
| 294 | `gra/src/ui/entityCards/civpediaOpenGate.ts` | 60 | INF-UI | `civpediaOpenGate.ts`: nagłówek „entityCards/civpediaOpenGate.ts — szew (seam) między KARTĄ ENCJI a HUBEM CIVPEDII.”; importów 0, eksportów 4 |  |
| 295 | `gra/src/ui/entityCards/improvementAdapter.ts` | 249 | INF-UI | `improvementAdapter.ts`: nagłówek „entityCards/improvementAdapter.ts — pełne wypełnienie (T7b, KARTA-ULEPSZENIA-TERENU):”; importów 5, eksportów 1 |  |
| 296 | `gra/src/ui/entityCards/registry.ts` | 194 | INF-UI | `registry.ts`: nagłówek „entityCards/registry.ts — resolvery `id → surowy wiersz` per kind (plan §2).”; importów 9, eksportów 12 |  |
| 297 | `gra/src/ui/entityCards/renderer.ts` | 1212 | INF-UI | `renderer.ts`: nagłówek „entityCards/renderer.ts — jeden DOM-builder dla wszystkich 4 kinds (plan §1).”; importów 11, eksportów 4 |  |
| 298 | `gra/src/ui/entityCards/slug.ts` | 49 | INF-UI | `slug.ts`: nagłówek „entityCards/slug.ts — slugify NIEZALEŻNY od dwóch istniejących implementacji.”; importów 0, eksportów 1 |  |
| 299 | `gra/src/ui/entityCards/technologyAdapter.ts` | 386 | INF-UI | `technologyAdapter.ts`: nagłówek „entityCards/technologyAdapter.ts — `RawTech` (`tech.json`) → `EntityCardData` (T3).”; importów 10, eksportów 1 |  |
| 300 | `gra/src/ui/entityCards/types.ts` | 209 | INF-UI | `types.ts`: nagłówek „entityCards/types.ts — wspólny kontrakt karty encji (T1 KONTRAKT-KARTA-ENCJI).”; importów 0, eksportów 15 |  |
| 301 | `gra/src/ui/entityCards/unitAdapter.ts` | 291 | INF-UI | `unitAdapter.ts`: nagłówek „entityCards/unitAdapter.ts — `UnitDef` (`units.json`) → `EntityCardData` (T4, rozszerzone w T6).”; importów 6, eksportów 1 |  |
| 302 | `gra/src/ui/entityCards/wonderAdapter.ts` | 156 | INF-UI | `wonderAdapter.ts`: nagłówek „entityCards/wonderAdapter.ts — R-KARTY-HISTORIA-INFRA-CUDA-Q1: surowy wiersz”; importów 3, eksportów 1 |  |
| 303 | `gra/src/ui/escapeOverlayStack.ts` | 140 | INF-UI | `escapeOverlayStack.ts`: importów 0, eksportów 10 |  |
| 304 | `gra/src/ui/formatPl.ts` | 64 | INF-UI | `formatPl.ts`: nagłówek „Odmiana „jednostka" (1 / 2–4 / 5+).”; importów 0, eksportów 7 |  |
| 305 | `gra/src/ui/hexContextTooltip.ts` | 992 | INF-UI | `hexContextTooltip.ts`: nagłówek „hexContextTooltip.ts — treść panelu kontekstowego mapy (heks / jednostka, D17=A).”; importów 19, eksportów 6 | kontekst heksu/jednostki (19 importów); przypisano INF-UI |
| 306 | `gra/src/ui/hoverDetailDock.ts` | 412 | INF-UI | `hoverDetailDock.ts`: nagłówek „Panel szczegółów przy hover — wysuwa się obok kolumny UX (lewo / prawo).”; importów 0, eksportów 13 |  |
| 307 | `gra/src/ui/hud.ts` | 1861 | INF-UI | `hud.ts`: nagłówek „HUD w grze (UI plan pkt 3, D1=C) — gorny pasek zasobow + minimapa + panel boczny.”; importów 32, eksportów 11 |  |
| 308 | `gra/src/ui/hudChip6c.ts` | 76 | INF-UI | `hudChip6c.ts`: nagłówek „Chip HUD 6C (Design System 1E) — medalion + etykieta PL + wartość + przyrost.”; importów 5, eksportów 4 |  |
| 309 | `gra/src/ui/hudLayout.ts` | 84 | INF-UI | `hudLayout.ts`: nagłówek „hudLayout.ts — jedno źródło prawdy dla marginesów HUD mapy i miasta (mockup 1E, FALA 60).”; importów 0, eksportów 36 |  |
| 310 | `gra/src/ui/hudPanelDismiss.ts` | 29 | INF-UI | `hudPanelDismiss.ts`: nagłówek „Zamyka panel HUD po kliknięciu poza panelem (mapa, inne UI).”; importów 0, eksportów 1 |  |
| 311 | `gra/src/ui/hudTitleTooltip.ts` | 278 | INF-UI | `hudTitleTooltip.ts`: nagłówek „hudTitleTooltip.ts — większe podpisy hover (atrybut title) dla HUD / toolbar / ikon.”; importów 0, eksportów 1 |  |
| 312 | `gra/src/ui/mainMenu.ts` | 514 | INF-UI | `mainMenu.ts`: nagłówek „Main menu + global settings screen (UI task 4).”; importów 4, eksportów 9 |  |
| 313 | `gra/src/ui/mapLoadingOverlay.ts` | 260 | INF-UI | `mapLoadingOverlay.ts`: nagłówek „mapLoadingOverlay.ts — panel postępu generacji mapy (DYSPOZYCJA-WYDAJNOSC C2 + C2b).”; importów 2, eksportów 5 |  |
| 314 | `gra/src/ui/mapToolbarHud.ts` | 172 | INF-UI | `mapToolbarHud.ts`: nagłówek „mapToolbarHud.ts — lewy toolbar [C] mapy (mockup HUD Mapy layout 1E).”; importów 5, eksportów 6 |  |
| 315 | `gra/src/ui/mapUnitCursor.ts` | 116 | INF-UI | `mapUnitCursor.ts`: nagłówek „mapUnitCursor.ts — kontekstowe kursory mapy przy zaznaczonej jednostce.”; importów 0, eksportów 7 |  |
| 316 | `gra/src/ui/mapUnitHudSkin.ts` | 78 | INF-UI | `mapUnitHudSkin.ts`: nagłówek „mapUnitHudSkin.ts — wspólny skin 1E dla panelu jednostki / stosu armii (A-06).”; importów 2, eksportów 4 |  |
| 317 | `gra/src/ui/markdownLite.ts` | 92 | INF-UI | `markdownLite.ts`: nagłówek „markdownLite.ts — lekki renderer Markdown dla panelu Civpedia (bez zależności).”; importów 0, eksportów 1 |  |
| 318 | `gra/src/ui/minimapHud.ts` | 448 | INF-UI | `minimapHud.ts`: importów 4, eksportów 11 |  |
| 319 | `gra/src/ui/minimapLayout.ts` | 130 | INF-UI | `minimapLayout.ts`: nagłówek „minimapLayout.ts — wspólna geometria minimapy i docku karty jednostki (Maciej 2026-07-28).”; importów 2, eksportów 26 |  |
| 320 | `gra/src/ui/resourceColors.ts` | 128 | INF-UI | `resourceColors.ts`: nagłówek „resourceColors.ts — JEDNO ŹRÓDŁO PRAWDY koloru sześciu surowców.”; importów 0, eksportów 9 |  |
| 321 | `gra/src/ui/sideListHud.css.ts` | 146 | INF-UI | `sideListHud.css.ts`: nagłówek „sideListHud.css.ts — wspólny arkusz stylów + logika prezentacyjna dla list bocznych”; importów 1, eksportów 10 |  |
| 322 | `gra/src/ui/sidePanelEventFilter.ts` | 25 | INF-UI | `sidePanelEventFilter.ts`: importów 1, eksportów 1 |  |
| 323 | `gra/src/ui/sidePanelHud.ts` | 969 | INF-UI | `sidePanelHud.ts`: importów 8, eksportów 7 |  |
| 324 | `gra/src/ui/sidePanelLayout.ts` | 33 | INF-UI | `sidePanelLayout.ts`: nagłówek „sidePanelLayout.ts — JEDNO wspólne źródło prawdy dla pozycji paneli otwieranych”; importów 1, eksportów 4 |  |
| 325 | `gra/src/ui/turnTransitionOverlay.ts` | 132 | INF-UI | `turnTransitionOverlay.ts`: nagłówek „turnTransitionOverlay.ts — B5-A: pasek postępu + „Teraz gra: …” przy końcu tury.”; importów 1, eksportów 5 |  |
| 326 | `gra/src/ui/uiParams.ts` | 98 | INF-UI | `uiParams.ts`: nagłówek „Single typed entry point for the UI parameter panel (Civ-UI).”; importów 1, eksportów 8 |  |
| 327 | `gra/src/ui/wikiHubHud.ts` | 644 | INF-UI | `wikiHubHud.ts`: nagłówek „wikiHubHud.ts — Civpedia in-game: Poradnik + Encyklopedia (rev. E bundle).”; importów 9, eksportów 11 |  |
| 328 | `gra/src/render/braz-konnica-opus5.ts` | 934 | INF-RENDER | `braz-konnica-opus5.ts`: nagłówek „braz-konnica-opus5.ts — KONNICA (Horseman), epoka BRĄZU”; importów 2, eksportów 2 |  |
| 329 | `gra/src/render/braz-lucznik-nubijski-opus5.ts` | 775 | INF-RENDER | `braz-lucznik-nubijski-opus5.ts`: nagłówek „braz-lucznik-nubijski-opus5.ts — ŁUCZNIK NUBIJSKI (Nubian Archer), jednostka”; importów 2, eksportów 2 |  |
| 330 | `gra/src/render/braz-miecznik-opus5.ts` | 765 | INF-RENDER | `braz-miecznik-opus5.ts`: nagłówek „braz-miecznik-opus5.ts — MIECZNIK BRĄZOWY (Bronze Swordsman), bazowa piechota”; importów 2, eksportów 2 |  |
| 331 | `gra/src/render/braz-procarz-opus5.ts` | 766 | INF-RENDER | `braz-procarz-opus5.ts`: nagłówek „braz-procarz-opus5.ts — PROCARZ (Slinger), jednostka BAZOWA dystansowa”; importów 2, eksportów 2 |  |
| 332 | `gra/src/render/braz-rydwan-kapadokijski-opus5.ts` | 781 | INF-RENDER | `braz-rydwan-kapadokijski-opus5.ts`: nagłówek „braz-rydwan-kapadokijski-opus5.ts — RYDWAN KAPADOCKI / KAPADOKIJSKI”; importów 2, eksportów 2 |  |
| 333 | `gra/src/render/braz-rydwan-konny-opus5.ts` | 784 | INF-RENDER | `braz-rydwan-konny-opus5.ts`: nagłówek „braz-rydwan-konny-opus5.ts — RYDWAN KONNY (War Chariot), LEKKI DWUKOŁOWY”; importów 2, eksportów 2 |  |
| 334 | `gra/src/render/braz-rydwan-woly-opus5.ts` | 620 | INF-RENDER | `braz-rydwan-woly-opus5.ts`: nagłówek „braz-rydwan-woly-opus5.ts — RYDWAN NA WOŁACH (Ox-Drawn Battle Cart),”; importów 2, eksportów 2 |  |
| 335 | `gra/src/render/braz-taran-opus5.ts` | 492 | INF-RENDER | `braz-taran-opus5.ts`: nagłówek „braz-taran-opus5.ts — TARAN OKUTY (Bronze-Shod Ram), machina oblężnicza”; importów 2, eksportów 2 |  |
| 336 | `gra/src/render/braz-wlocznik-opus5.ts` | 711 | INF-RENDER | `braz-wlocznik-opus5.ts`: nagłówek „braz-wlocznik-opus5.ts — WŁÓCZNIK (Brąz), bazowa piechota epoki Brązu”; importów 2, eksportów 2 |  |
| 337 | `gra/src/render/bronzeCity.ts` | 464 | INF-RENDER | `bronzeCity.ts`: nagłówek „bronzeCity.ts (Grupa A / MAPA — render) — miasta EPOKI BRAZU per cywilizacja.”; importów 1, eksportów 4 |  |
| 338 | `gra/src/render/bronzeCityRoblox.ts` | 437 | INF-RENDER | `bronzeCityRoblox.ts`: nagłówek „bronzeCityRoblox.ts — miasta epoki brązu w stylu Roblox (klocki, flatShading).”; importów 3, eksportów 3 |  |
| 339 | `gra/src/render/camera.ts` | 309 | INF-RENDER | `camera.ts`: nagłówek „Ręczna obsługa kamery — pan (drag myszą / WASD) + zoom (kółko myszy).”; importów 1, eksportów 3 |  |
| 340 | `gra/src/render/cities.ts` | 946 | INF-RENDER | `cities.ts`: nagłówek „Renders settlement models on the hex map, one per City.”; importów 20, eksportów 3 |  |
| 341 | `gra/src/render/cityMapOutline.ts` | 85 | INF-RENDER | `cityMapOutline.ts`: nagłówek „cityMapOutline.ts — delikatna obwódka heksu miasta na mapie świata (MAPA).”; importów 3, eksportów 4 |  |
| 342 | `gra/src/render/cityMapStatChip.ts` | 1133 | INF-RENDER | `cityMapStatChip.ts`: nagłówek „cityMapStatChip.ts — etykieta miasta na mapie świata (MAPA).”; importów 4, eksportów 23 |  |
| 343 | `gra/src/render/cityOkolicaOverlay.ts` | 347 | INF-RENDER | `cityOkolicaOverlay.ts`: nagłówek „cityOkolicaOverlay.ts — nakładka okolicy miasta na mapie 3D (Civ V style).”; importów 11, eksportów 7 |  |
| 344 | `gra/src/render/countSceneOverlayCandidates.ts` | 124 | INF-RENDER | `countSceneOverlayCandidates.ts`: nagłówek „Offline licznik kandydatów styledOverlays (bez WebGL) — diagnostyka R-SCENA-PERF.”; importów 5, eksportów 4 |  |
| 345 | `gra/src/render/dekor-laki-rowniny.ts` | 463 | INF-RENDER | `dekor-laki-rowniny.ts`: nagłówek „dekor-laki-rowniny.ts — MIKRODEKORACJE pustych heksów ŁĄKA i RÓWNINA”; importów 1, eksportów 13 |  |
| 346 | `gra/src/render/djungla-modele.ts` | 218 | INF-RENDER | `djungla-modele.ts`: nagłówek „djungla-modele.ts — R-SCENA-PERF: kępy dżungli tropikalnej jako 5 InstancedMesh”; importów 1, eksportów 7 |  |
| 347 | `gra/src/render/droga-6-ramion.ts` | 190 | INF-RENDER | `droga-6-ramion.ts`: nagłówek „droga-6-ramion.ts — DROGA jako SZEŚCIORAMIENNA GWIAZDA (render, Opus 5).”; importów 2, eksportów 2 |  |
| 348 | `gra/src/render/fogDim.ts` | 44 | INF-RENDER | `fogDim.ts`: nagłówek „fogDim.ts — wspólne przyciemnianie dekoracji 3D (FoW explored).”; importów 2, eksportów 2 |  |
| 349 | `gra/src/render/galera-model.ts` | 273 | INF-RENDER | `galera-model.ts`: nagłówek „galera-model.ts — GALERA (jedyna jednostka morska, epoka brązu) — redesign ROBLOX”; importów 1, eksportów 2 |  |
| 350 | `gra/src/render/hastati-falangita.ts` | 694 | INF-RENDER | `hastati-falangita.ts`: nagłówek „hastati-falangita.ts — proceduralne modele piechoty, KOREKTA v2 (render-jednostki)”; importów 2, eksportów 2 |  |
| 351 | `gra/src/render/hastati-opus5.ts` | 993 | INF-RENDER | `hastati-opus5.ts`: nagłówek „hastati-opus5.ts — MODEL HASTATIEGO UZYWANY PRZEZ GRE”; importów 2, eksportów 2 |  |
| 352 | `gra/src/render/hexShape.ts` | 32 | INF-RENDER | `hexShape.ts`: nagłówek „hexShape.ts — wspólna geometria pointy-top (zgodna z units.ts / CylinderGeometry mapy).”; importów 1, eksportów 2 |  |
| 353 | `gra/src/render/hexutil.ts` | 71 | INF-RENDER | `hexutil.ts`: nagłówek „Konwersja współrzędnych aksjalnych (q, r) → pozycja świata Three.js.”; importów 0, eksportów 5 |  |
| 354 | `gra/src/render/improvements.ts` | 602 | INF-RENDER | `improvements.ts`: nagłówek „improvements.ts (Grupa A / MAPA — render) — wyglad ULEPSZEN TERENU na heksie.”; importów 8, eksportów 7 |  |
| 355 | `gra/src/render/jednostki-p1-rdzen.ts` | 833 | INF-RENDER | `jednostki-p1-rdzen.ts`: nagłówek „jednostki-p1-rdzen.ts — PACZKA 1/8: rdzen generyczny (7 jednostek)”; importów 2, eksportów 7 |  |
| 356 | `gra/src/render/jednostki-p2-inka.ts` | 685 | INF-RENDER | `jednostki-p2-inka.ts`: nagłówek „jednostki-p2-inka.ts — PACZKA 2/8: INKOWIE, proceduralne modele piechoty”; importów 2, eksportów 4 |  |
| 357 | `gra/src/render/jednostki-p3-dystans.ts` | 879 | INF-RENDER | `jednostki-p3-dystans.ts`: nagłówek „jednostki-p3-dystans.ts — proceduralne modele DYSTANSOWYCH per cywilizacja”; importów 2, eksportów 5 |  |
| 358 | `gra/src/render/jednostki-p4-melee.ts` | 866 | INF-RENDER | `jednostki-p4-melee.ts`: nagłówek „jednostki-p4-melee.ts — PACZKA 4/8: MELEE SPECIALS (6), epoka BRAZU”; importów 2, eksportów 6 |  |
| 359 | `gra/src/render/jednostki-p57-wlocznie-machiny.ts` | 840 | INF-RENDER | `jednostki-p57-wlocznie-machiny.ts`: nagłówek „jednostki-p57-wlocznie-machiny.ts — PACZKA 5+7/8: WLOCZNICY PER-CIV (2) + MACHINY (2)”; importów 2, eksportów 4 |  |
| 360 | `gra/src/render/jednostki-p6-super.ts` | 911 | INF-RENDER | `jednostki-p6-super.ts`: nagłówek „jednostki-p6-super.ts — PACZKA 6/8: SUPER-JEDNOSTKI (braz)”; importów 2, eksportów 2 |  |
| 361 | `gra/src/render/jednostki-p8a-bliskiwschod.ts` | 704 | INF-RENDER | `jednostki-p8a-bliskiwschod.ts`: nagłówek „jednostki-p8a-bliskiwschod.ts — PACZKA 8a/8: BLISKI WSCHOD (4), epoka BRAZU”; importów 2, eksportów 4 |  |
| 362 | `gra/src/render/jednostki-p8b-rozni.ts` | 794 | INF-RENDER | `jednostki-p8b-rozni.ts`: nagłówek „jednostki-p8b-rozni.ts — PACZKA 8b/8: 4 JEDNOSTKI BEZ WLASNEGO MODELU”; importów 2, eksportów 4 |  |
| 363 | `gra/src/render/jednostki-z1-mezopotamia.ts` | 1329 | INF-RENDER | `jednostki-z1-mezopotamia.ts`: nagłówek „jednostki-z1-mezopotamia.ts — ZELAZO P1: MEZOPOTAMIA / INDUS (4 jednostki)”; importów 2, eksportów 4 |  |
| 364 | `gra/src/render/jednostki-z2-srodziemne.ts` | 1604 | INF-RENDER | `jednostki-z2-srodziemne.ts`: nagłówek „jednostki-z2-srodziemne.ts — ZELAZO P2: SRODZIEMNOMORZE (render-jednostki)”; importów 2, eksportów 5 |  |
| 365 | `gra/src/render/jednostki-z3-plemiona.ts` | 1994 | INF-RENDER | `jednostki-z3-plemiona.ts`: nagłówek „jednostki-z3-plemiona.ts — SERIA Z3: PLEMIONA (5 jednostek, ZELAZO)”; importów 2, eksportów 5 |  |
| 366 | `gra/src/render/kamien-bazowe-opus5.ts` | 1190 | INF-RENDER | `kamien-bazowe-opus5.ts`: nagłówek „kamien-bazowe-opus5.ts — WARIANT PORÓWNAWCZY: 4 jednostki BAZOWE epoki KAMIENIA”; importów 2, eksportów 5 |  |
| 367 | `gra/src/render/kamien-inka-opus5.ts` | 928 | INF-RENDER | `kamien-inka-opus5.ts`: nagłówek „kamien-inka-opus5.ts — WARIANTY PORÓWNAWCZE (OPUS 5) dwóch jednostek”; importów 2, eksportów 3 |  |
| 368 | `gra/src/render/kamien-lucznicy-opus5.ts` | 986 | INF-RENDER | `kamien-lucznicy-opus5.ts`: nagłówek „kamien-lucznicy-opus5.ts — WARIANTY PORÓWNAWCZE cywilizacyjnych ŁUCZNIKÓW”; importów 2, eksportów 3 |  |
| 369 | `gra/src/render/kamien-zulu-taran-opus5.ts` | 1130 | INF-RENDER | `kamien-zulu-taran-opus5.ts`: nagłówek „kamien-zulu-taran-opus5.ts — WARIANTY PORÓWNAWCZE (OPUS 5) dwóch jednostek”; importów 2, eksportów 3 |  |
| 370 | `gra/src/render/kon-nowy-model.ts` | 342 | INF-RENDER | `kon-nowy-model.ts`: nagłówek „kon-nowy-model.ts — NOWY proceduralny model konia (koncept, render-kon)”; importów 2, eksportów 3 |  |
| 371 | `gra/src/render/kopalnia-cyny-opus5.ts` | 352 | INF-RENDER | `kopalnia-cyny-opus5.ts`: nagłówek „kopalnia-cyny-opus5.ts — ULEPSZENIE TERENU „Kopalnia cyny" (własny model 3D).”; importów 2, eksportów 2 |  |
| 372 | `gra/src/render/kopalnia-zlota-opus5.ts` | 350 | INF-RENDER | `kopalnia-zlota-opus5.ts`: nagłówek „kopalnia-zlota-opus5.ts — ULEPSZENIE TERENU „Kopalnia złota" (własny model 3D).”; importów 2, eksportów 2 |  |
| 373 | `gra/src/render/lasy-modele.ts` | 440 | INF-RENDER | `lasy-modele.ts`: nagłówek „lasy-modele.ts — TEREN: 5 wariantów KĘP LASU (nakładka Nakladka.Las)”; importów 1, eksportów 11 |  |
| 374 | `gra/src/render/mapRenderStyle.ts` | 1996 | INF-RENDER | `mapRenderStyle.ts`: nagłówek „mapRenderStyle.ts — palety i fabryki dekoracji mapy (Roblox / Minecraft).”; importów 6, eksportów 80 |  |
| 375 | `gra/src/render/mergeDecor.ts` | 175 | INF-RENDER | `mergeDecor.ts`: nagłówek „mergeDecor.ts — FPS: scalanie grupy dekoracji per-heks (dziesiątki/setki małych”; importów 1, eksportów 5 |  |
| 376 | `gra/src/render/miasto-braz.ts` | 905 | INF-RENDER | `miasto-braz.ts`: nagłówek „miasto-braz.ts — MIASTA EPOKI BRAZU per cywilizacja (GRECJA, RZYM) w stylu”; importów 2, eksportów 10 |  |
| 377 | `gra/src/render/miasto-kamien.ts` | 667 | INF-RENDER | `miasto-kamien.ts`: nagłówek „miasto-kamien.ts — MIASTO EPOKI KAMIENIA (paleolit/neolit) w stylu Roblox”; importów 1, eksportów 8 |  |
| 378 | `gra/src/render/minecraftScene.ts` | 11 | INF-RENDER | `minecraftScene.ts`: nagłówek „minecraftScene.ts — ten sam buildScene co mapa gry, styl dekoracji Minecraft.”; importów 2, eksportów 2 |  |
| 379 | `gra/src/render/oaza-pustynia.ts` | 578 | INF-RENDER | `oaza-pustynia.ts`: nagłówek „oaza-pustynia.ts — OAZA (feature pustyni) + MIKRODEKORACJE PUSTYNI”; importów 1, eksportów 17 |  |
| 380 | `gra/src/render/pastwisko-modele.ts` | 261 | INF-RENDER | `pastwisko-modele.ts`: nagłówek „pastwisko-modele.ts — zwierzeta terenowe pastwiska w stylu Roblox”; importów 1, eksportów 13 |  |
| 381 | `gra/src/render/perfDebugOverlay.ts` | 76 | INF-RENDER | `perfDebugOverlay.ts`: nagłówek „perfDebugOverlay.ts — overlay diagnostyczny F9 (BATCH 3 / A4).”; importów 0, eksportów 6 |  |
| 382 | `gra/src/render/rangeOverlay.ts` | 909 | INF-RENDER | `rangeOverlay.ts`: nagłówek „rangeOverlay.ts — wizualizacja zasięgu kultury / religii na mapie 3D (MAPA).”; importów 6, eksportów 15 |  |
| 383 | `gra/src/render/resources.ts` | 171 | INF-RENDER | `resources.ts`: nagłówek „resources.ts (Grupa A / MAPA — render)”; importów 2, eksportów 2 |  |
| 384 | `gra/src/render/riverLod.ts` | 413 | INF-RENDER | `riverLod.ts`: nagłówek „riverLod.ts — LOD + merge helperów wstęg rzek (Batch 3 remainder).”; importów 2, eksportów 22 |  |
| 385 | `gra/src/render/robloxCity.ts` | 294 | INF-RENDER | `robloxCity.ts`: nagłówek „robloxCity.ts — miasta na mapie w stylu Roblox (kolorowe klocki, wieże, mury).”; importów 1, eksportów 3 |  |
| 386 | `gra/src/render/robloxImprovements.ts` | 484 | INF-RENDER | `robloxImprovements.ts`: nagłówek „robloxImprovements.ts — ulepszenia terenu w stylu RoboProBlocks.”; importów 13, eksportów 3 |  |
| 387 | `gra/src/render/robloxScene.ts` | 12 | INF-RENDER | `robloxScene.ts`: nagłówek „robloxScene.ts — buildScene w stylu Roblox + eksport miast.”; importów 2, eksportów 4 |  |
| 388 | `gra/src/render/scene.ts` | 3760 | INF-RENDER | `scene.ts`: nagłówek „Buduje scenę Three.js dla mapy hex The Game.”; importów 21, eksportów 12 |  |
| 389 | `gra/src/render/settlementModel.ts` | 27 | INF-RENDER | `settlementModel.ts`: nagłówek „settlementModel.ts — fabryka modeli osady na mapie (classic / Roblox).”; importów 6, eksportów 1 |  |
| 390 | `gra/src/render/siegeCampModels.ts` | 160 | INF-RENDER | `siegeCampModels.ts`: nagłówek „siegeCampModels.ts — modele 3D obozu oblężniczego (OBL-S6, źródło: siegepreview).”; importów 2, eksportów 6 |  |
| 391 | `gra/src/render/siegeCampSync.ts` | 47 | INF-RENDER | `siegeCampSync.ts`: nagłówek „siegeCampSync.ts — pomocnik dla INTEGRATOR: mapowanie machin → heksy obozów (OBL-S6).”; importów 1, eksportów 3 |  |
| 392 | `gra/src/render/siegeMarker.ts` | 262 | INF-RENDER | `siegeMarker.ts`: nagłówek „siegeMarker.ts — wizualizacja oblężenia na mapie świata (MAPA/C3).”; importów 5, eksportów 2 |  |
| 393 | `gra/src/render/stoneCity.ts` | 387 | INF-RENDER | `stoneCity.ts`: nagłówek „stoneCity.ts — miasta EPOKI KAMIENIA per cywilizacja (10 typow jak bronzeCity).”; importów 2, eksportów 6 |  |
| 394 | `gra/src/render/stoneCityRoblox.ts` | 471 | INF-RENDER | `stoneCityRoblox.ts`: nagłówek „stoneCityRoblox.ts — epoka kamienia, styl Roblox (klocki, flatShading).”; importów 4, eksportów 3 |  |
| 395 | `gra/src/render/styleResources.ts` | 499 | INF-RENDER | `styleResources.ts`: nagłówek „styleResources.ts — surowce mapy w stylu Roblox / Minecraft.”; importów 8, eksportów 6 |  |
| 396 | `gra/src/render/swinia-trzoda.ts` | 187 | INF-RENDER | `swinia-trzoda.ts`: nagłówek „swinia-trzoda.ts — SWINIA (2 pozy x 2 warianty) + kompozycja TRZODA”; importów 2, eksportów 7 |  |
| 397 | `gra/src/render/tarasy-model.ts` | 403 | INF-RENDER | `tarasy-model.ts`: nagłówek „tarasy-model.ts — ULEPSZENIE „TARASY" na NOWYCH wzgórzach W0/W3”; importów 1, eksportów 5 |  |
| 398 | `gra/src/render/teren-gory-wzgorza.ts` | 509 | INF-RENDER | `teren-gory-wzgorza.ts`: nagłówek „teren-gory-wzgorza.ts — TEREN: 5 wariantów WZGÓRZ + 5 wariantów GÓR”; importów 1, eksportów 14 |  |
| 399 | `gra/src/render/tradeRoutesOverlay.ts` | 101 | INF-RENDER | `tradeRoutesOverlay.ts`: nagłówek „tradeRoutesOverlay.ts — E7 (epik Handel): wizualizacja aktywnych szlaków handlowych”; importów 5, eksportów 3 |  |
| 400 | `gra/src/render/ulepszenia-modele-p2.ts` | 345 | INF-RENDER | `ulepszenia-modele-p2.ts`: nagłówek „ulepszenia-modele-p2.ts — ULEPSZENIA TERENU, PARTIA 2: budynki gospodarcze”; importów 1, eksportów 7 |  |
| 401 | `gra/src/render/ulepszenia-modele-p3a.ts` | 510 | INF-RENDER | `ulepszenia-modele-p3a.ts`: nagłówek „ulepszenia-modele-p3a.ts — ULEPSZENIA TERENU, PARTIA 3A: osady produkcyjne”; importów 2, eksportów 7 |  |
| 402 | `gra/src/render/ulepszenia-modele-p3b.ts` | 571 | INF-RENDER | `ulepszenia-modele-p3b.ts`: nagłówek „ulepszenia-modele-p3b.ts — ULEPSZENIA TERENU, PARTIA 3B: irygacja, pole”; importów 1, eksportów 15 |  |
| 403 | `gra/src/render/unitOwnerEmblem.ts` | 516 | INF-RENDER | `unitOwnerEmblem.ts`: importów 2, eksportów 12 |  |
| 404 | `gra/src/render/unitStatPlate.ts` | 936 | INF-RENDER | `unitStatPlate.ts`: importów 4, eksportów 18 |  |
| 405 | `gra/src/render/unitUpgradeBadges.ts` | 459 | INF-RENDER | `unitUpgradeBadges.ts`: importów 6, eksportów 14 |  |
| 406 | `gra/src/render/unitVeteranBadges.ts` | 294 | INF-RENDER | `unitVeteranBadges.ts`: importów 4, eksportów 7 |  |
| 407 | `gra/src/render/unitVitalsPalette.ts` | 89 | INF-RENDER | `unitVitalsPalette.ts`: importów 0, eksportów 11 |  |
| 408 | `gra/src/render/units.ts` | 6779 | INF-RENDER | `units.ts`: nagłówek „Renders unit tokens and movement-range highlight discs on the hex map.”; importów 44, eksportów 3 |  |
| 409 | `gra/src/render/wioska-oboz.ts` | 342 | INF-RENDER | `wioska-oboz.ts`: nagłówek „wioska-oboz.ts — WIOSKA NEUTRALNA + OBOZ BARBARZYNCOW w stylu Roblox”; importów 1, eksportów 4 |  |
| 410 | `gra/src/render/wonderModels.ts` | 493 | INF-RENDER | `wonderModels.ts`: nagłówek „wonderModels.ts — modele 3D cudów świata na heksie mapy (MAPA, Roblox).”; importów 2, eksportów 3 |  |
| 411 | `gra/src/render/wonderRenderer.ts` | 143 | INF-RENDER | `wonderRenderer.ts`: nagłówek „wonderRenderer.ts — render cudów świata na heksach mapy (MAPA).”; importów 7, eksportów 3 |  |
| 412 | `gra/src/render/workerFieldOverlay.ts` | 211 | INF-RENDER | `workerFieldOverlay.ts`: nagłówek „workerFieldOverlay.ts — ikonki pracowników na mapie świata (pola z robotnikami).”; importów 6, eksportów 8 |  |
| 413 | `gra/src/render/zelazo-jezdziec-oszczepami-opus5.ts` | 1256 | INF-RENDER | `zelazo-jezdziec-oszczepami-opus5.ts`: nagłówek „zelazo-jezdziec-oszczepami-opus5.ts — JEŹDZIEC Z OSZCZEPAMI (Słowianie, ŻELAZO)”; importów 2, eksportów 2 |  |
| 414 | `gra/src/render/zelazo-konnica-asyryjska-opus5.ts` | 1180 | INF-RENDER | `zelazo-konnica-asyryjska-opus5.ts`: nagłówek „zelazo-konnica-asyryjska-opus5.ts — KONNICA ASYRYJSKA, epoka ŻELAZA”; importów 2, eksportów 3 |  |
| 415 | `gra/src/render/zoomLod.ts` | 220 | INF-RENDER | `zoomLod.ts`: nagłówek „zoomLod.ts — progi jakości renderu w zależności od oddalenia kamery (zoom out).”; importów 0, eksportów 14 |  |
| 416 | `gra/src/game/owner-utils.ts` | 17 | AI | nagłówek „Proste predykaty własności ownerów”; eksport `isMajorAiOwner` (reguła AI-MANAGE-Q1); import `isBarbarian` z barbarians.ts; w main.ts:1251 importowany jako `isMajorAiOwner` | granica AI/BAR (predykat major AI); przeniesione z INF-DANE — przypisano AI |
| 417 | `gra/src/ui/assets/hero/hero-intro.png` | 7342 | INF-DANE | `hero-intro.png`: obraz PNG (hero); klaster `ui/assets/**` przypisany po katalogu |  |
| 418 | `gra/src/ui/assets/hero/hero-menu.png` | 7733 | INF-DANE | `hero-menu.png`: obraz PNG (hero); klaster `ui/assets/**` przypisany po katalogu |  |
| 419 | `gra/src/ui/icons/brand/aquila-emblem.svg` | 1 | INF-DANE | `aquila-emblem.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 420 | `gra/src/ui/icons/brand/building-icon-map.json` | 46 | INF-DANE | `building-icon-map.json`: dane JSON; klaster `ui/icons/**` przypisany po katalogu |  |
| 421 | `gra/src/ui/icons/brand/buildings/bld-admin.svg` | 0 | INF-DANE | `bld-admin.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 422 | `gra/src/ui/icons/brand/buildings/bld-akademia.svg` | 0 | INF-DANE | `bld-akademia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 423 | `gra/src/ui/icons/brand/buildings/bld-akademia_wojskowa.svg` | 0 | INF-DANE | `bld-akademia_wojskowa.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 424 | `gra/src/ui/icons/brand/buildings/bld-akwedukt.svg` | 0 | INF-DANE | `bld-akwedukt.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 425 | `gra/src/ui/icons/brand/buildings/bld-biblioteka.svg` | 0 | INF-DANE | `bld-biblioteka.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 426 | `gra/src/ui/icons/brand/buildings/bld-cegielnia.svg` | 0 | INF-DANE | `bld-cegielnia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 427 | `gra/src/ui/icons/brand/buildings/bld-culture.svg` | 0 | INF-DANE | `bld-culture.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 428 | `gra/src/ui/icons/brand/buildings/bld-default.svg` | 0 | INF-DANE | `bld-default.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 429 | `gra/src/ui/icons/brand/buildings/bld-defense.svg` | 0 | INF-DANE | `bld-defense.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 430 | `gra/src/ui/icons/brand/buildings/bld-food.svg` | 0 | INF-DANE | `bld-food.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 431 | `gra/src/ui/icons/brand/buildings/bld-fort.svg` | 0 | INF-DANE | `bld-fort.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 432 | `gra/src/ui/icons/brand/buildings/bld-garncarnia.svg` | 0 | INF-DANE | `bld-garncarnia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 433 | `gra/src/ui/icons/brand/buildings/bld-garnizon.svg` | 0 | INF-DANE | `bld-garnizon.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 434 | `gra/src/ui/icons/brand/buildings/bld-health.svg` | 0 | INF-DANE | `bld-health.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 435 | `gra/src/ui/icons/brand/buildings/bld-kamieniarski.svg` | 0 | INF-DANE | `bld-kamieniarski.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 436 | `gra/src/ui/icons/brand/buildings/bld-kamienne_kregi.svg` | 0 | INF-DANE | `bld-kamienne_kregi.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 437 | `gra/src/ui/icons/brand/buildings/bld-karawanseraj.svg` | 0 | INF-DANE | `bld-karawanseraj.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 438 | `gra/src/ui/icons/brand/buildings/bld-koszary.svg` | 0 | INF-DANE | `bld-koszary.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 439 | `gra/src/ui/icons/brand/buildings/bld-kuznia.svg` | 0 | INF-DANE | `bld-kuznia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 440 | `gra/src/ui/icons/brand/buildings/bld-kuznia_zelaza.svg` | 0 | INF-DANE | `bld-kuznia_zelaza.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 441 | `gra/src/ui/icons/brand/buildings/bld-lazaret.svg` | 0 | INF-DANE | `bld-lazaret.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 442 | `gra/src/ui/icons/brand/buildings/bld-laznia_publiczna.svg` | 0 | INF-DANE | `bld-laznia_publiczna.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 443 | `gra/src/ui/icons/brand/buildings/bld-magazyn.svg` | 0 | INF-DANE | `bld-magazyn.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 444 | `gra/src/ui/icons/brand/buildings/bld-mennica.svg` | 0 | INF-DANE | `bld-mennica.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 445 | `gra/src/ui/icons/brand/buildings/bld-mielerz.svg` | 0 | INF-DANE | `bld-mielerz.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 446 | `gra/src/ui/icons/brand/buildings/bld-military.svg` | 0 | INF-DANE | `bld-military.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 447 | `gra/src/ui/icons/brand/buildings/bld-monument.svg` | 0 | INF-DANE | `bld-monument.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 448 | `gra/src/ui/icons/brand/buildings/bld-mury.svg` | 0 | INF-DANE | `bld-mury.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 449 | `gra/src/ui/icons/brand/buildings/bld-odlewnia_brazu.svg` | 0 | INF-DANE | `bld-odlewnia_brazu.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 450 | `gra/src/ui/icons/brand/buildings/bld-odlewnia_zelaza.svg` | 0 | INF-DANE | `bld-odlewnia_zelaza.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 451 | `gra/src/ui/icons/brand/buildings/bld-palac.svg` | 0 | INF-DANE | `bld-palac.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 452 | `gra/src/ui/icons/brand/buildings/bld-palisada.svg` | 1 | INF-DANE | `bld-palisada.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 453 | `gra/src/ui/icons/brand/buildings/bld-port.svg` | 0 | INF-DANE | `bld-port.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 454 | `gra/src/ui/icons/brand/buildings/bld-port_wielki.svg` | 0 | INF-DANE | `bld-port_wielki.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 455 | `gra/src/ui/icons/brand/buildings/bld-pretorium.svg` | 0 | INF-DANE | `bld-pretorium.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 456 | `gra/src/ui/icons/brand/buildings/bld-production.svg` | 0 | INF-DANE | `bld-production.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 457 | `gra/src/ui/icons/brand/buildings/bld-religion.svg` | 0 | INF-DANE | `bld-religion.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 458 | `gra/src/ui/icons/brand/buildings/bld-sad.svg` | 0 | INF-DANE | `bld-sad.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 459 | `gra/src/ui/icons/brand/buildings/bld-science.svg` | 0 | INF-DANE | `bld-science.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 460 | `gra/src/ui/icons/brand/buildings/bld-spichlerz.svg` | 0 | INF-DANE | `bld-spichlerz.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 461 | `gra/src/ui/icons/brand/buildings/bld-stela.svg` | 0 | INF-DANE | `bld-stela.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 462 | `gra/src/ui/icons/brand/buildings/bld-stolarnia.svg` | 0 | INF-DANE | `bld-stolarnia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 463 | `gra/src/ui/icons/brand/buildings/bld-storage.svg` | 0 | INF-DANE | `bld-storage.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 464 | `gra/src/ui/icons/brand/buildings/bld-studnia.svg` | 0 | INF-DANE | `bld-studnia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 465 | `gra/src/ui/icons/brand/buildings/bld-swiatynia.svg` | 0 | INF-DANE | `bld-swiatynia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 466 | `gra/src/ui/icons/brand/buildings/bld-targowisko.svg` | 0 | INF-DANE | `bld-targowisko.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 467 | `gra/src/ui/icons/brand/buildings/bld-teatr.svg` | 0 | INF-DANE | `bld-teatr.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 468 | `gra/src/ui/icons/brand/buildings/bld-trade.svg` | 0 | INF-DANE | `bld-trade.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 469 | `gra/src/ui/icons/brand/buildings/bld-warsztat_oblezniczy.svg` | 0 | INF-DANE | `bld-warsztat_oblezniczy.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 470 | `gra/src/ui/icons/brand/buildings/bld-wielka_kuznia.svg` | 0 | INF-DANE | `bld-wielka_kuznia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 471 | `gra/src/ui/icons/brand/chip-crate.svg` | 0 | INF-DANE | `chip-crate.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 472 | `gra/src/ui/icons/brand/chip-death.svg` | 0 | INF-DANE | `chip-death.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 473 | `gra/src/ui/icons/brand/chip-garrison.svg` | 0 | INF-DANE | `chip-garrison.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 474 | `gra/src/ui/icons/brand/chip-heart.svg` | 0 | INF-DANE | `chip-heart.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 475 | `gra/src/ui/icons/brand/chip-manpower.svg` | 0 | INF-DANE | `chip-manpower.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 476 | `gra/src/ui/icons/brand/chip-map.svg` | 0 | INF-DANE | `chip-map.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 477 | `gra/src/ui/icons/brand/chip-star.svg` | 0 | INF-DANE | `chip-star.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 478 | `gra/src/ui/icons/brand/chip-trend-up.svg` | 0 | INF-DANE | `chip-trend-up.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 479 | `gra/src/ui/icons/brand/chip-warning.svg` | 0 | INF-DANE | `chip-warning.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 480 | `gra/src/ui/icons/brand/civ-icon-map.json` | 20 | INF-DANE | `civ-icon-map.json`: dane JSON; klaster `ui/icons/**` przypisany po katalogu |  |
| 481 | `gra/src/ui/icons/brand/civilizations/civ-asyria.svg` | 0 | INF-DANE | `civ-asyria.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 482 | `gra/src/ui/icons/brand/civilizations/civ-babilonia.svg` | 0 | INF-DANE | `civ-babilonia.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 483 | `gra/src/ui/icons/brand/civilizations/civ-celtowie.svg` | 0 | INF-DANE | `civ-celtowie.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 484 | `gra/src/ui/icons/brand/civilizations/civ-chinczycy.svg` | 0 | INF-DANE | `civ-chinczycy.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 485 | `gra/src/ui/icons/brand/civilizations/civ-default.svg` | 0 | INF-DANE | `civ-default.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 486 | `gra/src/ui/icons/brand/civilizations/civ-egipt.svg` | 0 | INF-DANE | `civ-egipt.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 487 | `gra/src/ui/icons/brand/civilizations/civ-fenicjanie.svg` | 0 | INF-DANE | `civ-fenicjanie.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 488 | `gra/src/ui/icons/brand/civilizations/civ-germanie.svg` | 0 | INF-DANE | `civ-germanie.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 489 | `gra/src/ui/icons/brand/civilizations/civ-grecy.svg` | 0 | INF-DANE | `civ-grecy.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 490 | `gra/src/ui/icons/brand/civilizations/civ-harappa.svg` | 0 | INF-DANE | `civ-harappa.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 491 | `gra/src/ui/icons/brand/civilizations/civ-hetyci.svg` | 0 | INF-DANE | `civ-hetyci.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 492 | `gra/src/ui/icons/brand/civilizations/civ-inkowie.svg` | 0 | INF-DANE | `civ-inkowie.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 493 | `gra/src/ui/icons/brand/civilizations/civ-rzymianie.svg` | 0 | INF-DANE | `civ-rzymianie.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 494 | `gra/src/ui/icons/brand/civilizations/civ-slowianie.svg` | 0 | INF-DANE | `civ-slowianie.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 495 | `gra/src/ui/icons/brand/civilizations/civ-sumer.svg` | 0 | INF-DANE | `civ-sumer.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 496 | `gra/src/ui/icons/brand/civilizations/civ-zulusi.svg` | 0 | INF-DANE | `civ-zulusi.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 497 | `gra/src/ui/icons/brand/cp-health.svg` | 0 | INF-DANE | `cp-health.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 498 | `gra/src/ui/icons/brand/cp-order.svg` | 0 | INF-DANE | `cp-order.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 499 | `gra/src/ui/icons/brand/dip-gift.svg` | 1 | INF-DANE | `dip-gift.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 500 | `gra/src/ui/icons/brand/dip-peace.svg` | 0 | INF-DANE | `dip-peace.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 501 | `gra/src/ui/icons/brand/dip-vassal.svg` | 1 | INF-DANE | `dip-vassal.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 502 | `gra/src/ui/icons/brand/dip-war.svg` | 0 | INF-DANE | `dip-war.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 503 | `gra/src/ui/icons/brand/earth-emblem.svg` | 1 | INF-DANE | `earth-emblem.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 504 | `gra/src/ui/icons/brand/epoch-icon-map.json` | 9 | INF-DANE | `epoch-icon-map.json`: dane JSON; klaster `ui/icons/**` przypisany po katalogu |  |
| 505 | `gra/src/ui/icons/brand/epochs/epoch-braz.svg` | 0 | INF-DANE | `epoch-braz.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 506 | `gra/src/ui/icons/brand/epochs/epoch-kamien.svg` | 0 | INF-DANE | `epoch-kamien.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 507 | `gra/src/ui/icons/brand/epochs/epoch-zelazo.svg` | 0 | INF-DANE | `epoch-zelazo.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 508 | `gra/src/ui/icons/brand/icons-manifest.json` | 380 | INF-DANE | `icons-manifest.json`: dane JSON; klaster `ui/icons/**` przypisany po katalogu |  |
| 509 | `gra/src/ui/icons/brand/improvement-icon-map.json` | 30 | INF-DANE | `improvement-icon-map.json`: dane JSON; klaster `ui/icons/**` przypisany po katalogu |  |
| 510 | `gra/src/ui/icons/brand/improvements/imp-farm.svg` | 0 | INF-DANE | `imp-farm.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 511 | `gra/src/ui/icons/brand/improvements/imp-fishing.svg` | 0 | INF-DANE | `imp-fishing.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 512 | `gra/src/ui/icons/brand/improvements/imp-fort.svg` | 0 | INF-DANE | `imp-fort.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 513 | `gra/src/ui/icons/brand/improvements/imp-irrigation.svg` | 0 | INF-DANE | `imp-irrigation.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 514 | `gra/src/ui/icons/brand/improvements/imp-lumber.svg` | 0 | INF-DANE | `imp-lumber.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 515 | `gra/src/ui/icons/brand/improvements/imp-mine.svg` | 0 | INF-DANE | `imp-mine.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 516 | `gra/src/ui/icons/brand/improvements/imp-outpost.svg` | 0 | INF-DANE | `imp-outpost.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 517 | `gra/src/ui/icons/brand/improvements/imp-pasture.svg` | 0 | INF-DANE | `imp-pasture.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 518 | `gra/src/ui/icons/brand/improvements/imp-quarry.svg` | 0 | INF-DANE | `imp-quarry.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 519 | `gra/src/ui/icons/brand/improvements/imp-road.svg` | 0 | INF-DANE | `imp-road.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 520 | `gra/src/ui/icons/brand/menu-background.css` | 19 | INF-DANE | `menu-background.css`: arkusz stylów CSS; klaster `ui/icons/**` przypisany po katalogu |  |
| 521 | `gra/src/ui/icons/brand/menu-components.css` | 26 | INF-DANE | `menu-components.css`: arkusz stylów CSS; klaster `ui/icons/**` przypisany po katalogu |  |
| 522 | `gra/src/ui/icons/brand/menu-emblem.svg` | 0 | INF-DANE | `menu-emblem.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 523 | `gra/src/ui/icons/brand/menu/menu-achievements-24.svg` | 0 | INF-DANE | `menu-achievements-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 524 | `gra/src/ui/icons/brand/menu/menu-achievements-40.svg` | 0 | INF-DANE | `menu-achievements-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 525 | `gra/src/ui/icons/brand/menu/menu-audio-24.svg` | 0 | INF-DANE | `menu-audio-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 526 | `gra/src/ui/icons/brand/menu/menu-audio-40.svg` | 0 | INF-DANE | `menu-audio-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 527 | `gra/src/ui/icons/brand/menu/menu-campaign-24.svg` | 0 | INF-DANE | `menu-campaign-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 528 | `gra/src/ui/icons/brand/menu/menu-campaign-40.svg` | 0 | INF-DANE | `menu-campaign-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 529 | `gra/src/ui/icons/brand/menu/menu-controls-24.svg` | 0 | INF-DANE | `menu-controls-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 530 | `gra/src/ui/icons/brand/menu/menu-controls-40.svg` | 0 | INF-DANE | `menu-controls-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 531 | `gra/src/ui/icons/brand/menu/menu-credits-24.svg` | 0 | INF-DANE | `menu-credits-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 532 | `gra/src/ui/icons/brand/menu/menu-credits-40.svg` | 0 | INF-DANE | `menu-credits-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 533 | `gra/src/ui/icons/brand/menu/menu-emblem-mini-24.svg` | 0 | INF-DANE | `menu-emblem-mini-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 534 | `gra/src/ui/icons/brand/menu/menu-emblem-mini-40.svg` | 0 | INF-DANE | `menu-emblem-mini-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 535 | `gra/src/ui/icons/brand/menu/menu-exit-24.svg` | 0 | INF-DANE | `menu-exit-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 536 | `gra/src/ui/icons/brand/menu/menu-exit-40.svg` | 0 | INF-DANE | `menu-exit-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 537 | `gra/src/ui/icons/brand/menu/menu-info-24.svg` | 0 | INF-DANE | `menu-info-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 538 | `gra/src/ui/icons/brand/menu/menu-info-40.svg` | 0 | INF-DANE | `menu-info-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 539 | `gra/src/ui/icons/brand/menu/menu-language-24.svg` | 0 | INF-DANE | `menu-language-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 540 | `gra/src/ui/icons/brand/menu/menu-language-40.svg` | 0 | INF-DANE | `menu-language-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 541 | `gra/src/ui/icons/brand/menu/menu-load-24.svg` | 0 | INF-DANE | `menu-load-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 542 | `gra/src/ui/icons/brand/menu/menu-load-40.svg` | 0 | INF-DANE | `menu-load-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 543 | `gra/src/ui/icons/brand/menu/menu-more-24.svg` | 0 | INF-DANE | `menu-more-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 544 | `gra/src/ui/icons/brand/menu/menu-more-40.svg` | 0 | INF-DANE | `menu-more-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 545 | `gra/src/ui/icons/brand/menu/menu-multiplayer-24.svg` | 0 | INF-DANE | `menu-multiplayer-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 546 | `gra/src/ui/icons/brand/menu/menu-multiplayer-40.svg` | 0 | INF-DANE | `menu-multiplayer-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 547 | `gra/src/ui/icons/brand/menu/menu-play-24.svg` | 0 | INF-DANE | `menu-play-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 548 | `gra/src/ui/icons/brand/menu/menu-play-40.svg` | 0 | INF-DANE | `menu-play-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 549 | `gra/src/ui/icons/brand/menu/menu-save-24.svg` | 0 | INF-DANE | `menu-save-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 550 | `gra/src/ui/icons/brand/menu/menu-save-40.svg` | 0 | INF-DANE | `menu-save-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 551 | `gra/src/ui/icons/brand/menu/menu-settings-24.svg` | 0 | INF-DANE | `menu-settings-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 552 | `gra/src/ui/icons/brand/menu/menu-settings-40.svg` | 0 | INF-DANE | `menu-settings-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 553 | `gra/src/ui/icons/brand/motion.css` | 8 | INF-DANE | `motion.css`: arkusz stylów CSS; klaster `ui/icons/**` przypisany po katalogu |  |
| 554 | `gra/src/ui/icons/brand/res-cattle.svg` | 1 | INF-DANE | `res-cattle.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 555 | `gra/src/ui/icons/brand/res-clay.svg` | 1 | INF-DANE | `res-clay.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 556 | `gra/src/ui/icons/brand/res-culture.svg` | 0 | INF-DANE | `res-culture.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 557 | `gra/src/ui/icons/brand/res-food.svg` | 0 | INF-DANE | `res-food.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 558 | `gra/src/ui/icons/brand/res-horses.svg` | 1 | INF-DANE | `res-horses.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 559 | `gra/src/ui/icons/brand/res-influence.svg` | 0 | INF-DANE | `res-influence.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 560 | `gra/src/ui/icons/brand/res-population.svg` | 0 | INF-DANE | `res-population.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 561 | `gra/src/ui/icons/brand/res-religion.svg` | 0 | INF-DANE | `res-religion.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 562 | `gra/src/ui/icons/brand/res-salt.svg` | 1 | INF-DANE | `res-salt.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 563 | `gra/src/ui/icons/brand/res-science.svg` | 0 | INF-DANE | `res-science.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 564 | `gra/src/ui/icons/brand/res-settlements.svg` | 0 | INF-DANE | `res-settlements.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 565 | `gra/src/ui/icons/brand/res-treasury.svg` | 0 | INF-DANE | `res-treasury.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 566 | `gra/src/ui/icons/brand/res-work.svg` | 0 | INF-DANE | `res-work.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 567 | `gra/src/ui/icons/brand/resources-map-icon-map.json` | 44 | INF-DANE | `resources-map-icon-map.json`: dane JSON; klaster `ui/icons/**` przypisany po katalogu |  |
| 568 | `gra/src/ui/icons/brand/resources-map/res-brick.svg` | 0 | INF-DANE | `res-brick.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 569 | `gra/src/ui/icons/brand/resources-map/res-bronze.svg` | 0 | INF-DANE | `res-bronze.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 570 | `gra/src/ui/icons/brand/resources-map/res-cattle.svg` | 1 | INF-DANE | `res-cattle.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 571 | `gra/src/ui/icons/brand/resources-map/res-ceramics.svg` | 0 | INF-DANE | `res-ceramics.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 572 | `gra/src/ui/icons/brand/resources-map/res-clay.svg` | 0 | INF-DANE | `res-clay.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 573 | `gra/src/ui/icons/brand/resources-map/res-copper-ore.svg` | 0 | INF-DANE | `res-copper-ore.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 574 | `gra/src/ui/icons/brand/resources-map/res-gold.svg` | 0 | INF-DANE | `res-gold.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 575 | `gra/src/ui/icons/brand/resources-map/res-horse.svg` | 0 | INF-DANE | `res-horse.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 576 | `gra/src/ui/icons/brand/resources-map/res-horses.svg` | 0 | INF-DANE | `res-horses.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 577 | `gra/src/ui/icons/brand/resources-map/res-iron-ore.svg` | 0 | INF-DANE | `res-iron-ore.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 578 | `gra/src/ui/icons/brand/resources-map/res-iron.svg` | 0 | INF-DANE | `res-iron.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 579 | `gra/src/ui/icons/brand/resources-map/res-salt.svg` | 0 | INF-DANE | `res-salt.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 580 | `gra/src/ui/icons/brand/resources-map/res-steel.svg` | 0 | INF-DANE | `res-steel.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 581 | `gra/src/ui/icons/brand/resources-map/res-stone.svg` | 0 | INF-DANE | `res-stone.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 582 | `gra/src/ui/icons/brand/resources-map/res-tin-ore.svg` | 1 | INF-DANE | `res-tin-ore.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 583 | `gra/src/ui/icons/brand/resources-map/res-wood.svg` | 0 | INF-DANE | `res-wood.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 584 | `gra/src/ui/icons/brand/setting-icon-map.json` | 17 | INF-DANE | `setting-icon-map.json`: dane JSON; klaster `ui/icons/**` przypisany po katalogu |  |
| 585 | `gra/src/ui/icons/brand/settings/sett-city-states.svg` | 0 | INF-DANE | `sett-city-states.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 586 | `gra/src/ui/icons/brand/settings/sett-civ-types.svg` | 0 | INF-DANE | `sett-civ-types.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 587 | `gra/src/ui/icons/brand/settings/sett-difficulty.svg` | 0 | INF-DANE | `sett-difficulty.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 588 | `gra/src/ui/icons/brand/settings/sett-game-speed.svg` | 0 | INF-DANE | `sett-game-speed.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 589 | `gra/src/ui/icons/brand/settings/sett-map-size.svg` | 0 | INF-DANE | `sett-map-size.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 590 | `gra/src/ui/icons/brand/settings/sett-world-type.svg` | 0 | INF-DANE | `sett-world-type.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 591 | `gra/src/ui/icons/brand/tb-army.svg` | 0 | INF-DANE | `tb-army.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 592 | `gra/src/ui/icons/brand/tb-cities.svg` | 0 | INF-DANE | `tb-cities.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 593 | `gra/src/ui/icons/brand/tb-diplomacy.svg` | 0 | INF-DANE | `tb-diplomacy.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 594 | `gra/src/ui/icons/brand/tier1/res-culture-24.svg` | 0 | INF-DANE | `res-culture-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 595 | `gra/src/ui/icons/brand/tier1/res-culture-40.svg` | 0 | INF-DANE | `res-culture-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 596 | `gra/src/ui/icons/brand/tier1/res-food-24.svg` | 0 | INF-DANE | `res-food-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 597 | `gra/src/ui/icons/brand/tier1/res-food-40.svg` | 0 | INF-DANE | `res-food-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 598 | `gra/src/ui/icons/brand/tier1/res-influence-24.svg` | 0 | INF-DANE | `res-influence-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 599 | `gra/src/ui/icons/brand/tier1/res-influence-40.svg` | 0 | INF-DANE | `res-influence-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 600 | `gra/src/ui/icons/brand/tier1/res-population-24.svg` | 0 | INF-DANE | `res-population-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 601 | `gra/src/ui/icons/brand/tier1/res-population-40.svg` | 0 | INF-DANE | `res-population-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 602 | `gra/src/ui/icons/brand/tier1/res-religion-24.svg` | 0 | INF-DANE | `res-religion-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 603 | `gra/src/ui/icons/brand/tier1/res-religion-40.svg` | 0 | INF-DANE | `res-religion-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 604 | `gra/src/ui/icons/brand/tier1/res-science-24.svg` | 0 | INF-DANE | `res-science-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 605 | `gra/src/ui/icons/brand/tier1/res-science-40.svg` | 0 | INF-DANE | `res-science-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 606 | `gra/src/ui/icons/brand/tier1/res-settlements-24.svg` | 0 | INF-DANE | `res-settlements-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 607 | `gra/src/ui/icons/brand/tier1/res-settlements-40.svg` | 0 | INF-DANE | `res-settlements-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 608 | `gra/src/ui/icons/brand/tier1/res-treasury-24.svg` | 0 | INF-DANE | `res-treasury-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 609 | `gra/src/ui/icons/brand/tier1/res-treasury-40.svg` | 0 | INF-DANE | `res-treasury-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 610 | `gra/src/ui/icons/brand/tier1/res-work-24.svg` | 0 | INF-DANE | `res-work-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 611 | `gra/src/ui/icons/brand/tier1/res-work-40.svg` | 0 | INF-DANE | `res-work-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 612 | `gra/src/ui/icons/brand/tier2/tb-army-24.svg` | 0 | INF-DANE | `tb-army-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 613 | `gra/src/ui/icons/brand/tier2/tb-army-40.svg` | 0 | INF-DANE | `tb-army-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 614 | `gra/src/ui/icons/brand/tier2/tb-build-24.svg` | 0 | INF-DANE | `tb-build-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 615 | `gra/src/ui/icons/brand/tier2/tb-build-40.svg` | 0 | INF-DANE | `tb-build-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 616 | `gra/src/ui/icons/brand/tier2/tb-cities-24.svg` | 0 | INF-DANE | `tb-cities-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 617 | `gra/src/ui/icons/brand/tier2/tb-cities-40.svg` | 0 | INF-DANE | `tb-cities-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 618 | `gra/src/ui/icons/brand/tier2/tb-diplomacy-24.svg` | 0 | INF-DANE | `tb-diplomacy-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 619 | `gra/src/ui/icons/brand/tier2/tb-diplomacy-40.svg` | 0 | INF-DANE | `tb-diplomacy-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 620 | `gra/src/ui/icons/brand/tier2/tb-science-24.svg` | 0 | INF-DANE | `tb-science-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 621 | `gra/src/ui/icons/brand/tier2/tb-science-40.svg` | 0 | INF-DANE | `tb-science-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 622 | `gra/src/ui/icons/brand/tier3/cp-buildings-24.svg` | 0 | INF-DANE | `cp-buildings-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 623 | `gra/src/ui/icons/brand/tier3/cp-buildings-40.svg` | 0 | INF-DANE | `cp-buildings-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 624 | `gra/src/ui/icons/brand/tier3/cp-culture-24.svg` | 0 | INF-DANE | `cp-culture-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 625 | `gra/src/ui/icons/brand/tier3/cp-culture-40.svg` | 0 | INF-DANE | `cp-culture-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 626 | `gra/src/ui/icons/brand/tier3/cp-granary-24.svg` | 0 | INF-DANE | `cp-granary-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 627 | `gra/src/ui/icons/brand/tier3/cp-granary-40.svg` | 0 | INF-DANE | `cp-granary-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 628 | `gra/src/ui/icons/brand/tier3/cp-health-24.svg` | 0 | INF-DANE | `cp-health-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 629 | `gra/src/ui/icons/brand/tier3/cp-health-40.svg` | 0 | INF-DANE | `cp-health-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 630 | `gra/src/ui/icons/brand/tier3/cp-labor-24.svg` | 0 | INF-DANE | `cp-labor-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 631 | `gra/src/ui/icons/brand/tier3/cp-labor-40.svg` | 0 | INF-DANE | `cp-labor-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 632 | `gra/src/ui/icons/brand/tier3/cp-order-24.svg` | 0 | INF-DANE | `cp-order-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 633 | `gra/src/ui/icons/brand/tier3/cp-order-40.svg` | 0 | INF-DANE | `cp-order-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 634 | `gra/src/ui/icons/brand/tier3/cp-recruit-24.svg` | 0 | INF-DANE | `cp-recruit-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 635 | `gra/src/ui/icons/brand/tier3/cp-recruit-40.svg` | 0 | INF-DANE | `cp-recruit-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 636 | `gra/src/ui/icons/brand/tier3/cp-religion-24.svg` | 0 | INF-DANE | `cp-religion-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 637 | `gra/src/ui/icons/brand/tier3/cp-religion-40.svg` | 0 | INF-DANE | `cp-religion-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 638 | `gra/src/ui/icons/brand/tier3/cp-trade-24.svg` | 0 | INF-DANE | `cp-trade-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 639 | `gra/src/ui/icons/brand/tier3/cp-trade-40.svg` | 0 | INF-DANE | `cp-trade-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 640 | `gra/src/ui/icons/brand/tier4/chip-crate-24.svg` | 0 | INF-DANE | `chip-crate-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 641 | `gra/src/ui/icons/brand/tier4/chip-crate-40.svg` | 0 | INF-DANE | `chip-crate-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 642 | `gra/src/ui/icons/brand/tier4/chip-death-24.svg` | 0 | INF-DANE | `chip-death-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 643 | `gra/src/ui/icons/brand/tier4/chip-death-40.svg` | 0 | INF-DANE | `chip-death-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 644 | `gra/src/ui/icons/brand/tier4/chip-garrison-24.svg` | 0 | INF-DANE | `chip-garrison-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 645 | `gra/src/ui/icons/brand/tier4/chip-garrison-40.svg` | 0 | INF-DANE | `chip-garrison-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 646 | `gra/src/ui/icons/brand/tier4/chip-grain-24.svg` | 0 | INF-DANE | `chip-grain-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 647 | `gra/src/ui/icons/brand/tier4/chip-grain-40.svg` | 0 | INF-DANE | `chip-grain-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 648 | `gra/src/ui/icons/brand/tier4/chip-happiness-24.svg` | 0 | INF-DANE | `chip-happiness-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 649 | `gra/src/ui/icons/brand/tier4/chip-happiness-40.svg` | 0 | INF-DANE | `chip-happiness-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 650 | `gra/src/ui/icons/brand/tier4/chip-heart-24.svg` | 0 | INF-DANE | `chip-heart-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 651 | `gra/src/ui/icons/brand/tier4/chip-heart-40.svg` | 0 | INF-DANE | `chip-heart-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 652 | `gra/src/ui/icons/brand/tier4/chip-manpower-24.svg` | 0 | INF-DANE | `chip-manpower-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 653 | `gra/src/ui/icons/brand/tier4/chip-manpower-40.svg` | 0 | INF-DANE | `chip-manpower-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 654 | `gra/src/ui/icons/brand/tier4/chip-map-24.svg` | 0 | INF-DANE | `chip-map-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 655 | `gra/src/ui/icons/brand/tier4/chip-map-40.svg` | 0 | INF-DANE | `chip-map-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 656 | `gra/src/ui/icons/brand/tier4/chip-order-24.svg` | 0 | INF-DANE | `chip-order-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 657 | `gra/src/ui/icons/brand/tier4/chip-order-40.svg` | 0 | INF-DANE | `chip-order-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 658 | `gra/src/ui/icons/brand/tier4/chip-rebellion-24.svg` | 0 | INF-DANE | `chip-rebellion-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 659 | `gra/src/ui/icons/brand/tier4/chip-rebellion-40.svg` | 0 | INF-DANE | `chip-rebellion-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 660 | `gra/src/ui/icons/brand/tier4/chip-star-24.svg` | 0 | INF-DANE | `chip-star-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 661 | `gra/src/ui/icons/brand/tier4/chip-star-40.svg` | 0 | INF-DANE | `chip-star-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 662 | `gra/src/ui/icons/brand/tier4/chip-trend-up-24.svg` | 0 | INF-DANE | `chip-trend-up-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 663 | `gra/src/ui/icons/brand/tier4/chip-trend-up-40.svg` | 0 | INF-DANE | `chip-trend-up-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 664 | `gra/src/ui/icons/brand/tier4/chip-warning-24.svg` | 0 | INF-DANE | `chip-warning-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 665 | `gra/src/ui/icons/brand/tier4/chip-warning-40.svg` | 0 | INF-DANE | `chip-warning-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 666 | `gra/src/ui/icons/brand/tier5/dip-alliance-24.svg` | 0 | INF-DANE | `dip-alliance-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 667 | `gra/src/ui/icons/brand/tier5/dip-alliance-40.svg` | 0 | INF-DANE | `dip-alliance-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 668 | `gra/src/ui/icons/brand/tier5/dip-pact-24.svg` | 0 | INF-DANE | `dip-pact-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 669 | `gra/src/ui/icons/brand/tier5/dip-pact-40.svg` | 0 | INF-DANE | `dip-pact-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 670 | `gra/src/ui/icons/brand/tier5/dip-peace-24.svg` | 0 | INF-DANE | `dip-peace-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 671 | `gra/src/ui/icons/brand/tier5/dip-peace-40.svg` | 0 | INF-DANE | `dip-peace-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 672 | `gra/src/ui/icons/brand/tier5/dip-war-24.svg` | 0 | INF-DANE | `dip-war-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 673 | `gra/src/ui/icons/brand/tier5/dip-war-40.svg` | 0 | INF-DANE | `dip-war-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 674 | `gra/src/ui/icons/brand/tier5/dip-war-strip-24.svg` | 0 | INF-DANE | `dip-war-strip-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 675 | `gra/src/ui/icons/brand/tier5/dip-war-strip-40.svg` | 0 | INF-DANE | `dip-war-strip-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 676 | `gra/src/ui/icons/brand/tier5/ui-accepted-24.svg` | 0 | INF-DANE | `ui-accepted-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 677 | `gra/src/ui/icons/brand/tier5/ui-accepted-40.svg` | 0 | INF-DANE | `ui-accepted-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 678 | `gra/src/ui/icons/brand/tier5/ui-check-24.svg` | 0 | INF-DANE | `ui-check-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 679 | `gra/src/ui/icons/brand/tier5/ui-check-40.svg` | 0 | INF-DANE | `ui-check-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 680 | `gra/src/ui/icons/brand/tier5/ui-close-24.svg` | 0 | INF-DANE | `ui-close-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 681 | `gra/src/ui/icons/brand/tier5/ui-close-40.svg` | 0 | INF-DANE | `ui-close-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 682 | `gra/src/ui/icons/brand/tier5/ui-denied-24.svg` | 0 | INF-DANE | `ui-denied-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 683 | `gra/src/ui/icons/brand/tier5/ui-denied-40.svg` | 0 | INF-DANE | `ui-denied-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 684 | `gra/src/ui/icons/brand/tier5/ui-end-turn-24.svg` | 0 | INF-DANE | `ui-end-turn-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 685 | `gra/src/ui/icons/brand/tier5/ui-end-turn-40.svg` | 0 | INF-DANE | `ui-end-turn-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 686 | `gra/src/ui/icons/brand/tier5/ui-lock-24.svg` | 0 | INF-DANE | `ui-lock-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 687 | `gra/src/ui/icons/brand/tier5/ui-lock-40.svg` | 0 | INF-DANE | `ui-lock-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 688 | `gra/src/ui/icons/brand/tier5/ui-menu-24.svg` | 0 | INF-DANE | `ui-menu-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 689 | `gra/src/ui/icons/brand/tier5/ui-menu-40.svg` | 0 | INF-DANE | `ui-menu-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 690 | `gra/src/ui/icons/brand/tier5/ui-pause-24.svg` | 0 | INF-DANE | `ui-pause-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 691 | `gra/src/ui/icons/brand/tier5/ui-pause-40.svg` | 0 | INF-DANE | `ui-pause-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 692 | `gra/src/ui/icons/brand/tier5/ui-play-24.svg` | 0 | INF-DANE | `ui-play-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 693 | `gra/src/ui/icons/brand/tier5/ui-play-40.svg` | 0 | INF-DANE | `ui-play-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 694 | `gra/src/ui/icons/brand/tier5/ui-wiki-24.svg` | 1 | INF-DANE | `ui-wiki-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 695 | `gra/src/ui/icons/brand/tier5/ui-wiki-40.svg` | 1 | INF-DANE | `ui-wiki-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 696 | `gra/src/ui/icons/brand/tier6/field-balanced-24.svg` | 1 | INF-DANE | `field-balanced-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 697 | `gra/src/ui/icons/brand/tier6/field-balanced-40.svg` | 1 | INF-DANE | `field-balanced-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 698 | `gra/src/ui/icons/brand/tier6/field-food-24.svg` | 0 | INF-DANE | `field-food-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 699 | `gra/src/ui/icons/brand/tier6/field-food-40.svg` | 0 | INF-DANE | `field-food-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 700 | `gra/src/ui/icons/brand/tier6/field-production-24.svg` | 0 | INF-DANE | `field-production-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 701 | `gra/src/ui/icons/brand/tier6/field-production-40.svg` | 0 | INF-DANE | `field-production-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 702 | `gra/src/ui/icons/brand/tier6/field-tax-24.svg` | 0 | INF-DANE | `field-tax-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 703 | `gra/src/ui/icons/brand/tier6/field-tax-40.svg` | 0 | INF-DANE | `field-tax-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 704 | `gra/src/ui/icons/brand/tier7/terrain-desert-24.svg` | 0 | INF-DANE | `terrain-desert-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 705 | `gra/src/ui/icons/brand/tier7/terrain-desert-40.svg` | 0 | INF-DANE | `terrain-desert-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 706 | `gra/src/ui/icons/brand/tier7/terrain-hills-24.svg` | 0 | INF-DANE | `terrain-hills-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 707 | `gra/src/ui/icons/brand/tier7/terrain-hills-40.svg` | 0 | INF-DANE | `terrain-hills-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 708 | `gra/src/ui/icons/brand/tier7/terrain-mountains-24.svg` | 0 | INF-DANE | `terrain-mountains-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 709 | `gra/src/ui/icons/brand/tier7/terrain-mountains-40.svg` | 0 | INF-DANE | `terrain-mountains-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 710 | `gra/src/ui/icons/brand/tier7/terrain-plains-24.svg` | 0 | INF-DANE | `terrain-plains-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 711 | `gra/src/ui/icons/brand/tier7/terrain-plains-40.svg` | 0 | INF-DANE | `terrain-plains-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 712 | `gra/src/ui/icons/brand/tier7/terrain-water-24.svg` | 0 | INF-DANE | `terrain-water-24.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 713 | `gra/src/ui/icons/brand/tier7/terrain-water-40.svg` | 0 | INF-DANE | `terrain-water-40.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 714 | `gra/src/ui/icons/brand/tokens.css` | 74 | INF-DANE | `tokens.css`: arkusz stylów CSS; klaster `ui/icons/**` przypisany po katalogu |  |
| 715 | `gra/src/ui/icons/brand/ui-accepted.svg` | 0 | INF-DANE | `ui-accepted.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 716 | `gra/src/ui/icons/brand/ui-check.svg` | 0 | INF-DANE | `ui-check.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 717 | `gra/src/ui/icons/brand/ui-close.svg` | 0 | INF-DANE | `ui-close.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 718 | `gra/src/ui/icons/brand/ui-denied.svg` | 0 | INF-DANE | `ui-denied.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 719 | `gra/src/ui/icons/brand/ui-end-turn.svg` | 0 | INF-DANE | `ui-end-turn.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 720 | `gra/src/ui/icons/brand/ui-lock.svg` | 0 | INF-DANE | `ui-lock.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 721 | `gra/src/ui/icons/brand/ui-menu.svg` | 0 | INF-DANE | `ui-menu.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 722 | `gra/src/ui/icons/brand/ui-pause.svg` | 0 | INF-DANE | `ui-pause.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 723 | `gra/src/ui/icons/brand/ui-play.svg` | 0 | INF-DANE | `ui-play.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 724 | `gra/src/ui/icons/brand/ui/globe-continents.svg` | 0 | INF-DANE | `globe-continents.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 725 | `gra/src/ui/icons/brand/unit-icon-map.json` | 23 | INF-DANE | `unit-icon-map.json`: dane JSON; klaster `ui/icons/**` przypisany po katalogu |  |
| 726 | `gra/src/ui/icons/brand/units/unit-archer.svg` | 0 | INF-DANE | `unit-archer.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 727 | `gra/src/ui/icons/brand/units/unit-cavalry.svg` | 0 | INF-DANE | `unit-cavalry.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 728 | `gra/src/ui/icons/brand/units/unit-chariot.svg` | 0 | INF-DANE | `unit-chariot.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 729 | `gra/src/ui/icons/brand/units/unit-default.svg` | 0 | INF-DANE | `unit-default.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 730 | `gra/src/ui/icons/brand/units/unit-elite.svg` | 0 | INF-DANE | `unit-elite.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 731 | `gra/src/ui/icons/brand/units/unit-melee.svg` | 0 | INF-DANE | `unit-melee.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 732 | `gra/src/ui/icons/brand/units/unit-naval.svg` | 0 | INF-DANE | `unit-naval.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 733 | `gra/src/ui/icons/brand/units/unit-scout.svg` | 0 | INF-DANE | `unit-scout.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 734 | `gra/src/ui/icons/brand/units/unit-siege.svg` | 0 | INF-DANE | `unit-siege.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 735 | `gra/src/ui/icons/brand/units/unit-sling.svg` | 0 | INF-DANE | `unit-sling.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 736 | `gra/src/ui/icons/brand/units/unit-spear.svg` | 0 | INF-DANE | `unit-spear.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 737 | `gra/src/ui/icons/brand/units/unit-worker.svg` | 0 | INF-DANE | `unit-worker.svg`: wektorowa ikona/grafika SVG; klaster `ui/icons/**` przypisany po katalogu |  |
| 738 | `gra/src/ui/icons/brandAssets.ts` | 267 | INF-DANE | `brandAssets.ts`: nagłówek „Assety brand-book PACZKA FINAL — REALNA KOPIA W REPO: gra/src/ui/icons/brand/ (71 plikow).”; importów 14, eksportów 17 |  |
| 739 | `gra/src/ui/icons/iconRegistry.ts` | 49 | INF-DANE | `iconRegistry.ts`: nagłówek „Rejestr ikon Warstwa 1 (3C) — PACZKA FINAL brand-book.”; importów 2, eksportów 2 |  |
| 740 | `gra/src/ui/icons/scienceOwlIcon.ts` | 38 | INF-DANE | `scienceOwlIcon.ts`: nagłówek „Ikona badań — sowa z biretem (Design: res-science / tb-science).”; importów 1, eksportów 3 |  |
| 741 | `gra/src/ui/icons/scienceProgressRing.ts` | 27 | INF-DANE | `scienceProgressRing.ts`: nagłówek „Pierścień postępu badań na ikonie Nauki (HUD).”; importów 0, eksportów 1 |  |
| 742 | `gra/src/ui/icons/wikiBookIcon.ts` | 19 | INF-DANE | `wikiBookIcon.ts`: nagłówek „Ikona Wiki — Design ui-wiki.svg (brand-book szata-sync 2026-07-03).”; importów 1, eksportów 1 |  |
| 743 | `gra/src/game/ai-moc-diag.ts` | 90 | INF-NARZ | `ai-moc-diag.ts`: nagłówek „ai-moc-diag.ts — metryki diagnostyczne Mocy AI (AI-MOC-NEXT-Q1=B).”; importów 1, eksportów 4 |  |
| 744 | `gra/src/game/diag-log.ts` | 172 | INF-NARZ | `diag-log.ts`: nagłówek „diag-log.ts — pierścień zdarzeń diagnostycznych (błędy, load/save, sesja).”; importów 0, eksportów 11 |  |
| 745 | `gra/src/game/playtestMapaSwiata.ts` | 259 | INF-NARZ | `playtestMapaSwiata.ts`: importów 9, eksportów 7 |  |
| 746 | `gra/src/game/playtestMiastoEkonomia.ts` | 184 | INF-NARZ | `playtestMiastoEkonomia.ts`: importów 10, eksportów 5 |  |
| 747 | `gra/src/game/playtestOdskok3v3.ts` | 307 | INF-NARZ | `playtestOdskok3v3.ts`: importów 7, eksportów 8 |  |
| 748 | `gra/src/game/playtestWalkaMapy.ts` | 499 | INF-NARZ | `playtestWalkaMapy.ts`: importów 7, eksportów 17 |  |
| 749 | `gra/src/ui/perfReport.ts` | 315 | INF-NARZ | `perfReport.ts`: nagłówek „perfReport.ts — trwały raport czasów mapy: auto-download, localStorage, chip HUD (FALA 159).”; importów 5, eksportów 10 |  |
| 750 | `gra/src/ui/perfTestPanel.ts` | 677 | INF-NARZ | `perfTestPanel.ts`: nagłówek „perfTestPanel.ts — panel „Test wydajności" (Batch 7, pomysł Macieja 2026-07-05).”; importów 6, eksportów 3 |  |
| 751 | `gra/src/ui/sceneTimingReport.ts` | 212 | INF-NARZ | `sceneTimingReport.ts`: nagłówek „sceneTimingReport.ts — raport czasów mapy (FALA 159: plik + localStorage + chip HUD).”; importów 5, eksportów 2 |  |

## 3. Kontrola kompletności

- Wierszy w tabeli: 751; unikalnych ścieżek: 751; plików bez przypisania: 0; plików z >1 podsystemem: 0. Każdy z 751 plików istnieje na `edb8fb56` (sprawdzenie `git cat-file -e`).
- Suma podsystemów = 751. 12 podsystemów z GOAL: EKO 28, MIA 29, JED 38, WAL 39, AI 20, DYP 46, KUL 7, CUD 22, PM 6, BAR 2, HOT 3, SAV 7 — razem 247. Poza nimi: INNE 20, INF-MAPA 18, INF-UI 43, INF-RENDER 88, INF-DANE 326, INF-NARZ 9 (razem 504).
- Podsystemy z GOAL (12) mają streszczenie z dowodem `plik:linia` w sekcji 1: tak.
- Wiersze z niepustą kolumną „Uwaga” (granice): 39.

### Poprawki po zarzutach Evaluatora (runda 1 → runda 2)

| # | Zarzut | Decyzja | Zmiana / dowód |
|---|---|---|---|
| 1 | Uzasadnienie to samo rozszerzenie, brak nazwy/eksportów/importów. | PRZYJMUJE | Kolumna „Uzasadnienie” przepisana: dla 429 plików TS nazwa + importy/eksporty z P1.1 (+ nagłówek, gdy istnieje); dla 307 SVG, 8 JSON, 4 CSS, 2 PNG, 1 MD typ zasobu i klaster katalogu. |
| 2 | Wniosek „hot-seat w stanie fundamentu” oparty na nieaktualnym nagłówku `human-owners.ts`. | PRZYJMUJE | Zweryfikowane na `edb8fb56`: `main.ts:1252-1254` importuje `HUMAN_OWNER_PRIMARY, isAiOwner, isHotSeat, isHumanOwner, nextHumanSeat`; `isAiOwner(` wywoływane 15 razy, `isHotSeat(`/`nextHumanSeat(` 3 razy; `render/cities.ts:25`, `render/units.ts:29`, `render/cityOkolicaOverlay.ts:15` importują stałą; `main.ts:1137` importuje `ui/hotSeatHandoff.ts`. Wniosek „martwy/Etap 0” usunięty; dojrzałość pętli hot-seat (HUD, tura, zapis) do P1.18, nie rozstrzygnięta tutaj. |
| 3 | Brak numerów linii w dowodach. | PRZYJMUJE | Dodane `plik:linia` do streszczeń wszystkich 12 podsystemów (np. `game/turn-economy.ts:572`, `game/ai.ts:3149`, `game/victory.ts:11`, `game/triumph-city-state.ts:11`). |
| 4 | `owner-utils.ts` w INF-DANE to błąd. | PRZYJMUJE | Plik zawiera `isMajorAiOwner` (AI-MANAGE-Q1) i import `isBarbarian`; `main.ts:1251` importuje `isMajorAiOwner`. Przeniesiony do AI (granica AI/BAR). |
| 5 | `civ-bonuses.ts` i `civ-matrix.ts` w KUL bez związku z kulturą/religią. | PRZYJMUJE | Zweryfikowane: nagłówki mówią o bonusach/mnożnikach cywilizacji; eksporty to mnożniki walki (`civCombatStatMultipliers`, `:245`), ruchu, kosztu budowy (`civBuildingCostDiscount`, `:349`); `civ-matrix.json` ma 93 parametry, najwięcej w domenie walka (41). Przeniesione do INNE wraz z `civ-matrix-semantic.ts` (prezentacja tej samej macierzy). Zakres rozszerzony: 5 plików tożsamości (`civ-names`, `civ-visual`, `civBrandDisplay`, `leaderPortraits`, `leaderBannersHud`) też nie są kulturą; zostają w KUL jako „tożsamość cywilizacji” z oznaczeniem do decyzji P2.1, a nazwa podsystemu zmieniona. |
| 6 | Złe liczby eksportów: `okolica.ts` 27 (jest 28), `diplomacy-proposals.ts` 61 (jest 59). | PRZYJMUJE | Poprawione na 28 i 59. Pozostałe cytowane liczby zweryfikowane `grep -cE '^export'`: economy-upkeep 67, armyMerge 48, siege 32, diplomacy-credibility 37, wonders-data 27, fsa-autosave 24, victory 19 — zgodne. |
| 7 | Linie UI zawyżają „serce portu”; brak podziału. | PRZYJMUJE | Dodana kolumna „w tym ui/ + render/” w sekcji 1. Przykład: MIA 29 plików, 24 175 linii, z czego 14 317 w ui/render (głównie `ui/cityPanel.ts` 11 986). Logika portu jest mniejsza niż suma kolumny „Linie”. |
| 8 | BAR, PM, INNE to listy plików, nie opis zachowania. | PRZYJMUJE | Streszczenia BAR, PM, INNE (oraz HOT, KUL, SAV, DYP, AI, WAL, JED, CUD) przepisane jako opis zachowania z dowodem `plik:linia` na podstawie nagłówków i eksportów. |
| 9 | (korekta własna Operatora) | PRZYJMUJE | `game/auto-manage.ts` (`autoManageCity`, `pickAutoBuildItem`, `BudowaFocus`) to decyzje kolejki budowy miasta, nie ruch jednostek: przeniesione z JED do MIA (JED 39 → 38, MIA 28 → 29). |
| 10 | (korekta własna Operatora) | PRZYJMUJE | Streszczenie INF-DANE podawało „324 pliki SVG”; prawidłowo 307 SVG, 8 JSON, 4 CSS, 2 PNG, 5 TS (po przeniesieniu `owner-utils.ts`). |

Poza listą: w poprzedniej wersji kolumna „Uwaga” miała 34 wpisy; po przeniesieniach jest 39 (+5: `owner-utils.ts`, `civ-bonuses.ts`, `civ-matrix.ts`, `civ-matrix-semantic.ts`, `auto-manage.ts`).

Otwarte decyzje do P2.1 (bez zmiany w tabeli): (a) `trade-routes.ts` w DYP zgodnie z GOAL, P1.1/P6.15 traktują handel osobno; (b) INF-MAPA (18 plików) i INNE (20 plików, w tym mnożniki cywilizacji) mogą wymagać 13. podsystemu; (c) przynależność 5 plików tożsamości cywilizacji do KUL; (d) `game/battle/battleScene.ts` (19 493 linie) liczony jako logika, choć to scena 3D — do rozdzielenia w P2.1.
