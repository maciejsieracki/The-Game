# SILNIK -> MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (krotko, z godzina),
ORAZ (2) to samo w CZACIE do uzytkownika (zeby wiedzial, co sie dzieje). Tresc identyczna.
Odpowiedzi/zadania od mastera czytaj w: dyspozycje/SILNIK.md (sekcja "DO ZROBIENIA TERAZ").
NIE edytuj innych plikow w dyspozycje/.

---
(brak wpisow -- dopisuj ponizej)

## 19:56 -- SILNIK: PUNKT 1 (KONSOLIDACJA) ZROBIONY -- kanon opublikowany
- units.ts zsynchronizowal sie (3905 linii) -> `vite build` OK (39 modulow, 1.9s).
- KANON Gra-podglad.html ZAKTUALIZOWANY: 753 KB (bylo 721), md5 2b29cec... (!= stary 04e57c) -> wciagnely sie HELMY/KOLORY/SUPER-JEDNOSTKI od Units.
- Bramka: smoke OK, battle-smoke OK, combat 6/6. logic 162/163 -- jedyny fail = ZNANY bug order.ts "loadOrderParams scales by difficulty" (krok 5, niewpiety, nie dotyka kanonu).
- Roznicowanie na mapie (typeId) wejdzie KOLEJNYM buildem, gdy Units doda 1 linie w units.ts.
- WAZNE dla buildow: OneDrive blokuje unlink gra/dist/ (EPERM) -> buduje `vite build --outDir /tmp/civ-dist --emptyOutDir`, potem `cp` do kanonu. Dziala.
- Gotowy na krok 2 (production). KOORDYNACJA: kolejka produkcji ma UI w src/ui/cityPanel.ts = lane Civ-UI. Podzial: ja=turn-loop (advanceProduction w handlerze "N") + ukonczenie w main.ts; Civ-UI=panel kolejki. Prosze potwierdzic podzial zanim ruszę krok 2.

## 22:09 -- SILNIK: rebuild po zmianach Units ZABLOKOWANY (re-dehydratacja mountu)
- Ruszylem rebuild (units.json atak dyst. x2). units.ts OK (3905), ale `src/game/turn-economy.ts` RE-DEHYDROWAL w sandboxie: mount pokazuje 277/296 linii (uciety na "ludnoscPo:"), build pada "Unexpected end of file".
- Chmura KOMPLETNA (Read: 296 linii, konczy sie `return result; }`). Probowalem: pelny Read (hydracja) + Grep calego src + 3x wait (18/30/22 s) -> mount dalej 277. NIE korupcja, NIE ruszam pliku (nie sklejam reczne core'a do kanonu).
- PROSBA (jak przy units.ts): "dotknij" pliku, by OneDrive go przesynchronizowal -> otworz `gra\src\game\turn-economy.ts` w edytorze i Ctrl+S (bez zmian), ALBO folder Civ raz jeszcze "Always keep on this device" (zielony ptaszek). Potem retry buildu = ~1 min.
- SYSTEMOWO: to bedzie WRACAC co build (pliki re-dehydruja sie idle w sandboxie). Dlugofalowo: cale gra/ trzymac jako "Always keep on this device".

## 23.06 (shadow-check ~22:50) -- SILNIK: KROK 2 (produkcja) ZIELONE od mastera, ale BUILD ZABLOKOWANY (re-dehydratacja OneDrive, 6 plikow)
- Master dal ZIELONE: sekcja START w SILNIK.md = "rusz KROK 2 (produkcja)" -- to odpowiedz na moje pytanie z 19:56 o podzial pracy. Podzial POTWIERDZONY: ja = turn-loop (advanceProduction + ukonczenie budynku/jednostki w main.ts), Civ-UI = panel kolejki w cityPanel.ts. Styk: jak MUSZE tknac production.ts/economy.ts (cudze lane) -> przez _handoff/, bez rownoleglej edycji.
- ZANIM tknalem main.ts -> sprawdzilem build (zasada: po kazdym kroku build+testy+kanon). `vite build --outDir /tmp/civ-dist` PADA: turn-economy.ts:278 "Unexpected end of file".
- Skan WSZYSTKICH 51 plikow src/: 6 UCIETYCH w sandbox-mount (chmura KOMPLETNA wg Read, mount zamrozony na wersji ucietej):
  1) game/turn-economy.ts (mount 277, ucina "ludnoscPo:")          <- import main.ts
  2) game/economy.ts      (mount 589, ucina w JSDoc "@param currentProgress")
  3) game/diplomacy.ts    (mount 592, ucina "Applies:")
  4) battle/battle-terrain.ts (mount 249, ucina "raised str")
  5) battle/battleScene.ts    (mount 2217, ucina "it is strik")    <- import main.ts
  6) ui/cityPanel.ts          (mount 172, ucina "const GO")        <- import main.ts
- 3 z 6 (turn-economy, battleScene, cityPanel) sa w grafie MAIN buildu -> kanon Gra-podglad.html SIE NIE SKOMPILUJE. 3 z 6 to CUDZE lane (battle/ui) -> nie tykam.
- Proba odblokowania: Read (hydracja) + wait(3-5s) + retry na turn-economy.ts oraz economy.ts -> mount DALEJ uciety (277/589). Nie chwyta (jak 22:09, tylko teraz 6 plikow zamiast 1).
- ZGODNIE Z REGULA SILNIK.md: NIE sklejam/nadpisuje plikow, NIE edytuje main.ts (bez buildu = bez weryfikacji), NIE publikuje niezweryfikowanego kanonu. Rekonstrukcja 6 plikow (w tym 3 cudze lane) do builda /tmp = za ryzykowna do autonomicznej publikacji kanonu.
- DECYZJA: zglaszam blokade. KROK 2 = WSTRZYMANY do czasu hydracji.
- PROSBA do Maciej: wlacz "Always keep on this device" na CALYM folderze gra/ (zielony ptaszek u gory), albo otworz+Ctrl+S te 6 plikow. Potem napisz "start" w SILNIK.md -> wepne KROK 2 od razu (edycja main.ts: advanceProduction w petli tury + ukonczenie; build /tmp/civ-dist; smoke+battle-smoke+logic+combat; publikacja kanonu). Szac. ~kilka min po odblokowaniu.

## 23.06 (shadow-check ~01:05 CEST) -- SILNIK: blokada re-dehydratacji UTRZYMUJE SIE; nic nowego od mastera
- Re-check dyspozycji: sekcja START w SILNIK.md bez zmian ("rusz KROK 2 produkcja") = NIC NOWEGO od mastera; KROK 2 dalej ZIELONY, ale WSTRZYMANY.
- Procedura hydracji wykonana: Read 6 plikow (chmura KOMPLETNA, kod dobrze sformowany) + wait 20s -> mount DALEJ zamrozony (turn-economy 277/economy 589/diplomacy 592/battle-terrain 249/battleScene 2198/cityPanel 172).
- Build /tmp/civ-dist PADA: tym razem cityPanel.ts:173 "const GO" (Unexpected end of file) -- inny z 3 plikow grafu MAIN, ta sama przyczyna (zamrozony mount).
- Zgodnie z regula SILNIK: NIE sklejam/nadpisuje plikow, NIE edytuje main.ts bez weryfikujacego buildu, NIE publikuje niezweryfikowanego kanonu. Kanon bez zmian (753 KB, md5 2b29cec).
- Prosba bez zmian: "Always keep on this device" na CALYM folderze gra/ (lub otworz+Ctrl+S 6 plikow) + napisz "start" -> wepne KROK 2 od razu.

## 23.06 (shadow-check ~01:18 CEST) -- SILNIK: blokada POTWIERDZONA buildem; nic nowego od mastera
- Re-check dyspozycji: sekcja START w SILNIK.md bez zmian ("rusz KROK 2 produkcja") = NIC NOWEGO; KROK 2 dalej ZIELONY, ale WSTRZYMANY.
- Hydracja: Read turn-economy.ts (chmura KOMPLETNA -- 296 linii, konczy `return result; }`) + Read cityPanel.ts (tresc jest za 172) + wait 20s -> mount DALEJ zamrozony (turn-economy 277, cityPanel 172).
- Tym razem URUCHOMILEM `vite build --outDir /tmp/civ-dist` (nie zalozenie -- realny build): PADA turn-economy.ts:278 "ludnoscPo:" (Unexpected end of file). Blokada IDENTYCZNA jak 01:05, inny z 6 plikow w komunikacie.
- Zgodnie z regula SILNIK: NIE sklejam/nadpisuje plikow, NIE edytuje main.ts bez weryfikujacego buildu, NIE publikuje niezweryfikowanego kanonu. Kanon bez zmian (753 KB, md5 2b29cec). WSTRZYMANE do hydracji.

## 23.06 (shadow-check ~01:27 CEST) -- SILNIK: re-check; nic nowego od mastera; blokada re-dehydratacji TRWA
- Sekcja START/DO ZROBIENIA w SILNIK.md bez zmian; DZIENNIK-MASTERA: "SILNIK -- bez self-check. Kolejka: production wiring" = NIC NOWEGO. KROK 2 dalej ZIELONY, WSTRZYMANY.
- Hydracja: Read turn-economy.ts / cityPanel.ts / battleScene.ts (chmura KOMPLETNA -- tresc za punktem uciecia mountu) + wait 22s -> mount DALEJ zamrozony (turn-economy 277, cityPanel 172, battleScene 2190).
- Realny `vite build --outDir /tmp/civ-dist` URUCHOMIONY: PADA turn-economy.ts:278 "ludnoscPo:" (Unexpected end of file) -- identycznie jak poprzednio. Kanon bez zmian (753 KB, md5 2b29cec).
- Wznowienie: "Always keep on this device" na CALYM gra/ (lub Ctrl+S 6 plikow) + "start".

## 23.06 (shadow-check ~01:33 CEST) -- SILNIK: nic nowego od mastera; blokada re-dehydratacji TRWA i ROZSZERZYLA sie na data/units.json
- Re-check dyspozycji: SILNIK.md START = "rusz KROK 2 (produkcja)" bez zmian; DZIENNIK-MASTERA "SILNIK -- production wiring" bez zmian = NIC NOWEGO. KROK 2 dalej ZIELONY, WSTRZYMANY.
- Realny `vite build --outDir /tmp/civ-dist` URUCHOMIONY: tym razem PADA WCZESNIEJ -- na data/units.json (mount 1116 linii/30941 B, ucina na "Kara obrony z tylu"; chmura KOMPLETNA: 1118 linii, konczy `}` + `]`). 8 modulow transformed, potem stop -- build nie dochodzi nawet do 6 plikow .ts (dalej zamrozone: turn-economy 277, economy 589, diplomacy 592, battle-terrain 249, battleScene 2190, cityPanel 172).
- Pozostale data/*.json OK (12/13 waliduje sie w mouncie). Read+hydracja NIE odmraza bash-mountu (po Read turn-economy.ts dalej 277). Kanon bez zmian (753 KB, md5 2b29cec).
- WAZNE (aktualizacja prosby): blokada dotyczy juz TEZ data/ -> "Always keep on this device" musi objac CALY folder gra/ (w tym data/*.json), nie tylko 6 plikow src/. Potem "start" -> wepne KROK 2 od razu.

## 23.06 (shadow-check ~01:47 CEST) -- SILNIK: re-check; NIC NOWEGO od mastera; blokada re-dehydratacji TRWA (potwierdzona realnym buildem)
- Sekcja START w SILNIK.md = "rusz KROK 2 (produkcja)" bez zmian = NIC NOWEGO. KROK 2 dalej ZIELONY, WSTRZYMANY.
- Realny `vite build --outDir /tmp/civ-dist` URUCHOMIONY: PADA turn-economy.ts:278:17 "ludnoscPo:" (Unexpected end of file) -- identycznie jak 01:18/01:27. Mount dalej zamrozony (turn-economy 277, economy 589, diplomacy 592, battle-terrain 249, battleScene 2190, cityPanel 172, units.json 1116).
- KANON zweryfikowany INTAKT: Gra-podglad.html 753272 B, md5 2b29cec1990e1aba737127b9a430405c (bez zmian od 19:56). Blokada jest WYLACZNIE sandbox-mountu -- chmura/dysk Maciej KOMPLETNE, gra buduje sie u Maciej normalnie.
- DECYZJA: zgodnie z regula SILNIK (stop przy blokadzie) + NIC NOWEGO -> NIE wymuszam ryzykownej autonomicznej rekonstrukcji 6 plikow (3 = cudze lane) i publikacji kanonu w nocy. KROK 2 gotowy do wpiecia (advanceProduction w petli tury main.ts) w ~kilka min PO hydracji.
- Wznowienie: "Always keep on this device" na CALYM gra/ (data/*.json + 6 plikow src) LUB Ctrl+S tych plikow, potem "start".

## 23.06 (shadow-check ~01:54 CEST) -- SILNIK: NIC NOWEGO od mastera; blokada re-dehydratacji TRWA (6. potwierdzenie realnym buildem)
- Re-check: SILNIK.md START = "rusz KROK 2 (produkcja)" bez zmian; DZIENNIK-MASTERA STATUS LANE = "SILNIK -- bez self-check. Kolejka: production wiring" bez zmian = NIC NOWEGO. KROK 2 dalej ZIELONY, WSTRZYMANY.
- Protokol hydracji wykonany: Read turn-economy.ts (chmura KOMPLETNA -- konczy `return result; }` w l.296) + cityPanel.ts + battleScene.ts + wait 18s -> mount DALEJ zamrozony (turn-economy 277, cityPanel 172, battleScene 2190, units.json 1116). Read NIE odmraza bash-mountu (jak 5x wczesniej).
- Realny `vite build --outDir /tmp/civ-dist` URUCHOMIONY: PADA turn-economy.ts:278:17 (Unexpected end of file), 8 modulow transformed. KANON INTAKT (753272 B, md5 2b29cec) -- gra dziala u Maciej; blokada jest WYLACZNIE sandbox-mountu.
- Zgodnie z regula (truncacja -> Read+wait+retry; jak nie chwyta -> zglos blokade, NIE sklejaj/nadpisuj): NIE rekonstruuje plikow, NIE edytuje main.ts bez weryfikujacego buildu, NIE publikuje niezweryfikowanego kanonu.
- Wznowienie (10 s u Maciej): "Always keep on this device" na CALYM folderze gra/ (data/*.json + src) LUB otworz+Ctrl+S; potem "start" -> wepne KROK 2 od razu.

## 23.06 (shadow-check ~02:03 CEST) -- SILNIK: NIC NOWEGO od mastera; blokada re-dehydratacji TRWA (7. potwierdzenie realnym buildem)
- Re-check dyspozycji: SILNIK.md sekcja START = "rusz KROK 2 (produkcja)" bez zmian; brak nowej ODPOWIEDZI MASTERA / DO ZROBIENIA TERAZ = NIC NOWEGO. KROK 2 dalej ZIELONY, WSTRZYMANY.
- Protokol hydracji wykonany: Read turn-economy.ts (chmura KOMPLETNA -- l.296 `return result; }`), cityPanel.ts (l.194+), battleScene.ts (l.2217+), units.json (l.1118 `]`) + wait 18s -> bash-mount DALEJ zamrozony (turn-economy 277 "ludnoscPo:", cityPanel 172, units.json 1116; battleScene oscyluje 2160-2186). Read NIE odmraza bash-mountu (7. potwierdzenie).
- Realny `vite build --outDir /tmp/civ-dist` URUCHOMIONY: PADA battleScene.ts:2161:36 "Unexpected end of file" (4 moduly transformed) -- inny z plikow grafu MAIN, ta sama przyczyna co poprzednio. KANON INTAKT (753272 B, md5 2b29cec1990e1aba737127b9a430405c -- bez zmian od 19:56).
- Zgodnie z regula SILNIK (truncacja -> Read+wait+retry; jak nie chwyta -> zglos blokade, NIE sklejaj/nadpisuj): NIE rekonstruuje plikow, NIE edytuje main.ts bez weryfikujacego buildu, NIE publikuje niezweryfikowanego kanonu.
- Wznowienie (10 s u Maciej): "Always keep on this device" na CALYM folderze gra/ (data/*.json + src) LUB otworz+Ctrl+S 6 plikow; potem "start" -> wepne KROK 2 od razu.

## 23.06 (shadow-check ~08:26 CEST) -- SILNIK: PRZELOM -- blokada re-dehydratacji LARGELY CLEARED (18/19 plikow hydrated); jedyny holdout = data/diplomacy.json
- Re-check dyspozycji: SILNIK.md START = "rusz KROK 2 (produkcja)" bez zmian. NOWE (info): [MASTER 2026-06-23T00:03Z] self-check 10min -> CO GODZINE, "nic nie musisz robic" -> BEZ AKCJI. Zadnej nowej dyspozycji wymagajacej dzialania.
- DUZA ZMIANA: mount sie ODMROZIL przez ~4h nocna przerwe. 6 plikow .ts KOMPLETNE: turn-economy 296, economy 641, diplomacy 637, battle-terrain 294, battleScene 3479, cityPanel 688. 12/13 data/*.json waliduje sie (units.json juz OK, 30946B).
- Realny `vite build --outDir /tmp/civ-dist` URUCHOMIONY: transformuje 25 modulow (bylo 4-8 przy poprzednich PADach) -> hydracja .ts/JSON SOLIDNA. PADA juz TYLKO na data/diplomacy.json:545:60 (Failed to parse JSON, pos 21298, "Unterminated string"). Mount: 21943B uciety; chmura KOMPLETNA (Read: l.545 pelna, plik leci do ~600+).
- Procedura: Read (hydracja) + cat read-through + cp-test (kopia tez ucieta) + wait 6/15/30s + retry build x3 -> mount DALEJ uciety na diplomacy.json. Within-session NIE chwyta (jak 7x wczesniej); 18 plikow odmrozilo sie dopiero przez przerwe miedzy runami.
- Zgodnie z regula (truncacja -> Read+wait+retry; jak nie chwyta -> zglos blokade, NIE sklejaj/nadpisuj): NIE rekonstruuje/nadpisuje diplomacy.json, NIE publikuje niezweryfikowanego kanonu. KANON INTAKT (753272 B, md5 2b29cec1990e1aba737127b9a430405c, Civ/Gra-podglad.html).
- BLOKADA ZREDUKOWANA z calego buildu do 1 PLIKU. Wznowienie (10 s u Maciej): "dotknij" gra/data/diplomacy.json -> otworz w edytorze + Ctrl+S, ALBO right-click -> "Always keep on this device" na gra/data/. ALBO nic nie rob -- nastepny self-check za godzine prawdopodobnie zlapie auto-hydracje (jak 18 pozostalych). Po hydracji: KROK 1 rebuild kanonu + KROK 2 wpiecie production -- wszystkie zrodla GOTOWE.

-- ostatnio przetworzone: SILNIK.md "START: rusz KROK 2 (produkcja)" (bez zmian) + [MASTER 2026-06-23T00:03Z] self-check co godzine (info, bez akcji). Status: blokada re-dehydratacji LARGELY CLEARED -- 18/19 plikow hydrated; jedyny holdout = data/diplomacy.json (bash-mount uciety 21943B, chmura KOMPLETNA). Ostatni re-check (shadow-check): 2026-06-23 ~08:26 CEST -- vite build transformuje 25 modulow, PADA TYLKO na data/diplomacy.json:545:60; KANON INTAKT (753272 B, md5 2b29cec). Wznowic: touch gra/data/diplomacy.json (Ctrl+S) lub poczekac na auto-hydracje -> potem KROK 1 rebuild + KROK 2 production.

## 2026-06-24 07:53 UTC -- SILNIK: utworzony katalog SILNIK/ (porzadkowanie dzialu)
- Na prosbe Maciej zebralem pliki dzialu SILNIK do jednego katalogu. Utworzono Civ/SILNIK/ i przeniesiono tam: SILNIK-ARCHITEKTURA-DEWELOPER.md (dokumentacja) + SILNIK-parametry.xlsx (panel parametrow) + README-SILNIK.md (indeks). Root odchudzony o 2 pliki.
- ZOSTAJE bez zmian (NIE przenosic - zlamaloby automatyzacje): dyspozycje/SILNIK.md + dyspozycje/SILNIK-DO-MASTERA.md (kanal - czyta scheduled task, master pisze pod stala sciezka). Jesli chcesz kanal tez w SILNIK/, trzeba skoordynowac (prompt scheduled taska + odwolania) - zrobie na sygnal.
- Przeglad pod katem historycznych plikow SILNIK: BRAK osieroconych dokumentow do archiwum. Backupy kanonu w _backup/ (Gra-podglad.html.bak-*) ZOSTAWIONE jako lifeline recovery - nie archiwizuje.
- Gra (kanon Gra-podglad.html, gra/, kod) NIE ruszane. Propozycja: jesli zatwierdzisz wzorzec, kazdy dzial dostaje wlasny katalog (odchudzenie roota z ~60 plikow).

## 2026-06-24 16:55 UTC -- SILNIK: PRZEKAZANIE SILNIK -> MASTER (sesja SILNIK usuwana)
- Sesja SILNIK konczona. PELNY HANDOVER: SILNIK/SILNIK-HANDOVER-DO-MASTERA.md (stan, dokladna procedura build+publikacja, kolejka KROK 2-8, pulapki, dokumenty).
- TOP-3 NATYCHMIAST:
  (1) KANON NIEAKTUALNY (gra/Gra-podglad.html, md5 2b29cec, 22.06 19:56) -> po zhydratowaniu data/diplomacy.json zrobic REBUILD: cd gra && ./node_modules/.bin/vite build --outDir /tmp/civ-dist --emptyOutDir + bramka (smoke/battle-smoke/logic/combat) + cp do ../Gra-podglad.html. NIGDY npm run build (prebuild kasuje JSON-y).
  (2) Dalej kolejka: KROK 2 production -> 3 ai+victory -> 4 walka z mapy+siege -> 5 diplomacy+culture-religion+order -> 6 save -> 7 nowa gra -> 8 higiena (usun orphany research.ts/player-economy.ts).
  (3) order.ts: JUZ OK (163/163, stara migawka). Orphany do usuniecia. Walka §5l + terrain yields ZASZYTE w kodzie (patrz arkusz ZASZYTE w SILNIK-parametry.xlsx).
- Scheduled task civ-silnik-self-check (co 10 min) DZIALA NIEZALEZNIE od tej sesji - pilnuje i dokonczy rebuild kanonu po hydracji diplomacy.json. Zostawic / przejac / wylaczyc = decyzja Master.
- Dokumenty dzialu: katalog SILNIK/ (architektura + parametry + handover). Kanal (ten plik + SILNIK.md) zostaje pod stala sciezka.
