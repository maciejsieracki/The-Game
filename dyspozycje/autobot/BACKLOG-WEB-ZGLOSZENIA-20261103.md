# Backlog zgłoszeń webowych (stan 2026-11-03) — kolejka po decyzji „dokończ rozpoczęte, nie wystawiaj nowych”

Zasada właściciela (2026-11-03): DOKOŃCZYĆ rozpoczęte naprawy (IRON/HORSE/ERA/MERGE/REGEN wdrożone; w toku AI-WAR, PLAYER-MOVES, FROZEN-FORTIFIED); NOWYCH tematów webowych nie uruchamiać; zgłoszenia ZAPISAĆ tu i w rejestrze. Wolne sloty i limit → ciężkie prace graficzne portu Rust na Opus 5.5 (pętla AutoBot do wyczerpania limitu). Gotowe do deployu → deploy ROBOCZA + push + merge do main + sprzątanie piaskownicy (stała zgoda).

## Zapisane dispatche (nieuruchomione)
R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1, R-WEB-AI-MOVE-FULL-RANGE-Q1, R-WEB-AI-MARCH-AVOID-FOREIGN-TERRITORY-Q1, R-WEB-ARMY-TO-NEAREST-LEADER-Q1, R-WEB-SIEGE-TOWER-BREACH-EVERYWHERE-Q1, R-WEB-HUNTING-CAMP-HILL-NO-FLATTEN-Q1, R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1 (twarda zasada: żywność tylko przy obywatelach, gracz i AI), R-WEB-ANNEX-CITYSTATE-SPOILS-Q1.

## Nowe zgłoszenia (bez dispatchu — do rozpisania przy wznowieniu pracy webowej)
1. **R-WEB-AUTO-IMPROVE-IRRIGATION-FALLBACK-Q1** — po wyczerpaniu miejsc na farmy i trzodę przy obywatelach system zamiast budować farmy bez obywateli powinien budować IRYGACJĘ (dziś jej w ogóle nie buduje). Zbadać: dlaczego irygacja nie wchodzi do kolejki (warunki rzeki/farmy, priorytety w `auto-improvements.ts`, `ai.ts` `AI_IMPROVEMENT_PRIORITY`), gracz i AI. Powiązane z AI-FOOD-ONLY-WORKED-HEXES-Q1 (te same pliki — razem).
2. **R-WEB-ROSTER-SPACE-NEXT-ACTIVE-UNIT-Q1** — w rosterze spacja przechodzi do NASTĘPNEJ AKTYWNEJ jednostki; jednostka w trakcie oblężenia lub oblegana trafia też do kolejki (można na nią przeskoczyć). Zbadać obecny skrót Spacji w `main.ts` (~40101) i kolejkę „następna jednostka”.
3. **R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1 (CIĘŻKI, wiele testów)** — bitwa ręczna na oblężone miasto (np. 12 jednostek obrońców, atakujący 2× więcej, 2 tarany + 2 wieże oblężnicze, z palisadą/murem): jednostki chodzą po omacku, tarany idą po bokach murów zamiast do bramy, wieże idą nie tam, wszystkie stoją/„kombinują”. OCZEKIWANE: tarany idą do BRAMY; wieża oblężnicza po podstawieniu od razu daje dostęp na mury — piechota wchodzi na mur/do miasta i od razu atakuje; łucznicy po postawieniu wież (i po ataku piechoty) ostrzeliwują jednostki na murze; konnica i rydwany stoją z boku, dopóki brama nie zostanie rozwalona (wchodzą tylko przez bramę). Wymagane: kilkanaście–kilkadziesiąt scenariuszy testowych (symulacja w Chromium/harnessie bitwy), pomiar co nie działa PRZED, potem naprawa (sekwencyjnie z SIEGE-TOWER-BREACH-EVERYWHERE-Q1 i pozostałymi tematami reguł oblężenia — te same pliki).
4. **Dopisek do FROZEN-FORTIFIED (wdrożone do dispatchu)**: jednostka zamarła podczas WĘDRÓWKI DOWÓDCY (nagle stanęła i zamarła) — hipoteza współwystępowania z ruchem wodza/podążaniem za wodzem (`generalQuickFollow`, follow-leader, „Idź do wodza”).

## Dopisek do pkt 3 (R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1) — 2026-11-03: SZARŻA
Po komendzie „szarża” (charge) jednostki WRĘCZ atakują jednostki na murze BEZ machin oblężniczych — nie powinno tak być. Reguła oczekiwana: dopóki nie ma machin oblężniczych albo brama nie jest rozwalona (ani machiny nie podeszły do murów / wieże oblężnicze nie zostały podstawione), armia lądowa WRĘCZ ma podejść jak najbliżej, ale TRZYMAĆ SIĘ POZA ZASIĘGIEM OSTRZAŁU obrońców (wyjątek: inna wieża — wieże oblężnicze/machiny po podejściu), i NIE atakować obrońców na murze; szarża nie może omijać tej reguły (komenda charge/„atakuj marszem” dla jednostek wręcz wobec celów na koronie muru = zablokowana albo zamieniona na podejście do bezpiecznego dystansu). Jedynie ŁUCZNICY (jednostki dystansowe) mogą prowadzić ostrzał. Po rozwaleniu bramy/podstawieniu wieży — wg reguł z pkt 3 (piechota wchodzi i atakuje; konnica/rydwany dopiero przez bramę). Uwzględnić w testach (kilkadziesiąt scenariuszy z komendą szarży i bez, mur/palisada) i powiązać z R-WEB-PALISADE-BATTLE-WALL-RULES-Q1 (zdeployowane reguły R1–R4) — sprawdzić, dlaczego szarża je omija (ścieżki `battleScene.ts`: atakuj-marszem/charge, kolejka rozkazów).

## Dopisek 2 do pkt 3 — 2026-11-03: TE SAME ZASADY DLA „ATAKUJ” I „SZARŻY”
Reguła „bez machin oblężniczych / rozwalonej bramy jednostki wręcz podchodzą na bezpieczny dystans poza ostrzałem i NIE atakują obrońców na murze; ostrzał tylko łucznicy; wyjątek: wieże/machiny po podejściu do murów” obowiązuje JEDNAKOWO dla (a) rozkazu „Atakuj” (wybór ataku na cel), (b) „Szarży” (charge) i (c) „atakuj marszem”, przy ataku na miasto z MUREM lub z PALISADĄ (jedna wspólna bramka w kodzie rozkazów, nie osobne ścieżki; ten sam wynik dla gracza i AI, bitwa ręczna i „Pomiń”/Auto). Test: każda kombinacja rozkaz × (mur | palisada | brak) × (są machiny | brama zniszczona | brak).

## PLAN WYKONANIA (polecenie właściciela 2026-11-04): po zakończeniu WSZYSTKICH trwających prac (UI-2-B…G, Opus) — doprowadzić do końca wszystkie tematy webowe z listy
Kolejność i grupy (sekwencyjnie w obrębie grupy = te same pliki; grupy równolegle, gdy dysk pozwala; każdy temat: Operator→Evaluator→Obrona→FC, FAIL→ten sam ID, potem merge do main, testy, build, deploy ROBOCZEJ, push, MD5, WERSJE.md, sprzątanie):
- Grupa 1 (`auto-improvements.ts`, `ai.ts` ulepszenia): R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1 (twarda zasada „tylko pola z obywatelami” dla żywności, gracz i AI, bez wyjątków) → R-WEB-AUTO-IMPROVE-IRRIGATION-FALLBACK-Q1 (irygacja zamiast farm bez obywateli; do rozpisania dispatchu).
- Grupa 2 (`ai.ts`, ruch/armie AI): R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1 → R-WEB-AI-MOVE-FULL-RANGE-Q1 → R-WEB-AI-MARCH-AVOID-FOREIGN-TERRITORY-Q1 → R-WEB-ARMY-TO-NEAREST-LEADER-Q1.
- Grupa 3 (oblężenie/bitwa): R-WEB-SIEGE-TOWER-BREACH-EVERYWHERE-Q1 → R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1 (tarany do bramy, wieże dają wejście na mur, konnica czeka na bramę, szarża/atakuj bez machin poza ostrzałem; kilkadziesiąt testów; do rozpisania dispatchu) → potem REPIN w Rust (battle).
- Grupa 4 (osobne pliki): R-WEB-HUNTING-CAMP-HILL-NO-FLATTEN-Q1.
- Grupa 5 (`main.ts` aneksja): R-WEB-ANNEX-CITYSTATE-SPOILS-Q1.
- Drobne: R-WEB-ROSTER-SPACE-NEXT-ACTIVE-UNIT-Q1 (do rozpisania); poprawka epoki w trybie ręcznym (`population-growth-v85.ts:582`); zapisy z koniem pod lasem — DOMYŚLNIE (brak odpowiedzi właściciela): uznać `zloze==='konie'` za złoże konia w Stadninie (nie zmienia map ani zapisów); hot-seat atak z marszu — DOMYŚLNIE: zostaje (marsz dochodzi, atak w następnej turze gracza).
Wymóg globalny: tematy webowe nie ruszają się, dopóki nie skończą się trwające prace Opus (UI-2-B…G); wolne miejsce na dysku ≥ ~4 GB na workflow.

## POTWIERDZENIE PLANU (polecenie właściciela 2026-11-04): zrealizować w pętli do końca — lista obowiązkowa
0. R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1 (twarda zasada „tylko pola z obywatelami” dla żywności, gracz i AI, bez wyjątków; zrzut z farmami bez obywateli)
1. R-WEB-SIEGE-TOWER-BREACH-EVERYWHERE-Q1
2. R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1
3. R-WEB-AI-MOVE-FULL-RANGE-Q1
4. R-WEB-AI-MARCH-AVOID-FOREIGN-TERRITORY-Q1
5. R-WEB-ARMY-TO-NEAREST-LEADER-Q1
6. R-WEB-HUNTING-CAMP-HILL-NO-FLATTEN-Q1
7. R-WEB-ANNEX-CITYSTATE-SPOILS-Q1
Dodatkowo (z planu grup): irygacja zamiast farm bez obywateli, spacja w rosterze → następna aktywna jednostka, ręczna bitwa oblężnicza + szarża/atakuj (mur/palisada), poprawka epoki w trybie ręcznym, konie w starych zapisach (domyślnie: uznać `zloze==='konie'`).
Znalezione przez Operatora w raportach (do weryfikacji i ewentualnych dispatchów): R-WEB-AUTOIMPROVE-PRIORITY-Q1 (ostatni FC r4 = FAIL, nigdy niewdrożone — sprawdzić, czy pokryte przez późniejsze tematy AUTO-IMPROVE), R-WEB-AI-BONUS-CITY-POLAR-Q1, R-WEB-HEX-TOOLTIP-UNLOCK-LABEL-DEDUP-Q1, R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1, R-WEB-TEST-HOOK-DETERMINISM-Q1, R-WEB-TEST-HOOK-HEADLESS-GAME-Q1; pomiar pełnych gier dla AI-WAR (sim-harness poza limitem 590 s).
Kryterium końca pętli: każdy temat = deploy do ROBOCZEJ + wpis w WERSJE.md + rejestr; niezrealizowane = jawnie uzasadnione.

## NOWE ZGŁOSZENIE (2026-11-04): R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1 — górny panel: surowiec w niedoborze czerwoną czcionką (zamiast złotej). Dispatch zapisany. Grupa: HUD (`hud.ts`/`hudChip6c.ts`) — po UI-2-C/REPIN albo równolegle; dodane do listy obowiązkowej pętli webowej.

## 2026-11-04 (3 zrzuty z ROBOCZEJ): automat nadal buduje farmy bez obywateli, nie buduje irygacji ani trzody — gracz i AI, profile „żywność” i „zrównoważone”
Zakres włączony do R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1 (rozszerzony; obejmuje irygację zamiast osobnego tematu i otwarty FAIL R-WEB-AUTOIMPROVE-PRIORITY-Q1). PRIORYTET NAJWYŻSZY — pierwszy temat webowy po zwolnieniu dysku (grupa 1).
