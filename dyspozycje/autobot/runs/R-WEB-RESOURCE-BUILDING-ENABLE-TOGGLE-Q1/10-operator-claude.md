STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1
GOAL: per-miasto per-budynek przelacznik wlaczony/wylaczony dla budynkow produkujacych surowce (konwertery wielo-recepturowe + surowe +% doplywu); wylaczony = brak produkcji, brak zuzycia wejsc, brak utrzymania (zloto + surowce); stan w zapisie, stary zapis = wlaczone; lista miast z przelacznikami na dole panelu Miasta + agregaty per surowiec (faktyczna produkcja z ostatniej tury vs mozliwa przy wlaczonych vs mozliwa ze wszystkich zbudowanych).

## ALLOWLISTA (ustalona PRZED edycja kodu — wyliczone realne budynki produkujace surowce)

Zrodlo: `DEFAULT_CONVERTER_RECIPES` (converters.ts) + budynki surowego "+% doplywu" w `turn-economy.ts`/`main.ts` + grupa "Produkcja surowcow" w `buildings.json`.

W ZAKRESIE przelacznika (7 id):
- konwertery: `cegielnia` (glina+drewno -> cegla), `garncarnia` (-> ceramika), `odlewnia_brazu` (-> braz), `odlewnia_zelaza` (receptury: braz + zelazo), `wielka_odlewnia` (receptury: braz + zelazo + stal);
- surowe: `stolarnia` (+10%/szt. doplywu drewna), `kamieniarski` (+10%/szt. doplywu kamienia).
(`huta` to receptura bez budynku w buildings.json — nieszkodliwa pozycja w zbiorze.)

POZA zakresem (swiadomie): `kuznia`, `kuznia_zelaza`, `wielka_kuznia` (w grupie "Produkcja surowcow", ale dają tylko bonus Pancerza, nie surowiec), `mennica` (mnoznik podatku, zuzywa zloto), `spichlerz`/`spichlerz_ii`, `magazyn`, kopalnie/zloza (ulepszenia terenu, nie budynki miasta). Brak niezamawianego przelaczania budynkow cywilnych i brak przebalansowania.

Pliki zmienione/dodane (allowlista kodu):
- NOWY `gra/src/game/building-toggle.ts` (czysty modul: zakres, stan, sanityzacja, mapa operacyjna, migawka panelu)
- `gra/src/game/cities.ts` (pole `City.wylaczoneBudynki?: string[]` + sanityzacja w `ensureCitySaveDefaults`)
- `gra/src/game/turn-economy.ts` (3 punkty wejscia: `previewCityEconomy`, `previewOwnerUpkeep`, `advanceCityEconomy` pracuja na `operationalBuiltByCity`; nowe pole wyniku `converterProducedByOwner` = faktyczna produkcja konwerterow w ticku)
- `gra/src/main.ts` (HUD tempo konwerterow, liczniki Stolarni/Warsztatow kamieniarskich w 4 miejscach, utrzymanie per miasto / podglad utrzymania surowcowego, mapa `converterProducedLastTurnByOwner` + czyszczenie w 5 miejscach load/new-game, migawka `producers`, funkcja `setCityProductionBuildingEnabled`, podpiecie `configureEmpireProducerToggle`)
- `gra/src/ui/empireDetailPanel.ts`, `gra/src/ui/empireDetailTypes.ts` (sekcja na dole zakladki Miasta)
- testy: NOWE `gra/tools/resource-building-toggle-test.cjs`, NOWE `gra/tools/resource-building-toggle-ui-live.cjs`; poprawione `gra/tools/building-upkeep-resources-test.cjs` (D4: string zrodlowy z nowym wrapperem) i `gra/tools/hud-konwerter-dopasowanie-test.cjs` (dodatkowa zaleznosc `operationalBuiltIds` w atrapie domkniecia main.ts)
- dowody: `dyspozycje/autobot/runs/R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1/evidence/*.png`, ten raport

## ZALOZENIA (luki dispatchu rozstrzygniete w raporcie)
1. Domyslnie WLACZONE; brak pola w starym zapisie = wszystko wlaczone (bez bumpu SAVE_VERSION; pole serializuje sie razem z miastem).
2. Wylaczony budynek NIE jest zwracany ani usuwany: zostaje w `cityBuilt` / zapisie / prerekwizytach / odblokowaniach technologii / limitach (popcap, mury itd.) — przelacznik dziala wylacznie w warstwie ekonomii (`operationalBuiltByCity`).
3. W ekonomii wylaczony budynek jest traktowany jak nieobecny: brak produkcji i zuzycia wejsc konwertera, brak utrzymania zlota i surowcowego, brak bonusu +% doplywu (Stolarnia/Warsztat kamieniarski) oraz — konsekwentnie — brak plonow z samego budynku w `previewCityEconomy`/ticku (np. bonus Pracy Cegielni, bonus Zywnosci Garncarni, Praca z Stolarni), zeby wylaczenie nie dawalo darmowego utrzymania przy zachowaniu efektow. UWAGA dla ewaluatora: to najszersza interpretacja; ograniczona do 7 id.
4. Bramki "dostepu" liczone z `cityBuilt` (etykiety Cegla/Ceramika w `diplomacyActiveResourceLabelsForOwner`, `ownerHasNativeResourceAccess('cegla')`) NIE zmienione — dostep do surowca nadal wynika z faktu posiadania budynku (bez niezamawianych zmian bramek/tech).
5. AI nie wylacza budynkow samo; stan zapisywany i czytany tymi samymi funkcjami dla gracza i AI (zero galezi po ownerId), decyzje AI bez zmian.
6. Etykiety po polsku bez zargonu: "Włączony/Wyłączony", "OSTATNIA TURA", "MOŻLIWE (WŁĄCZONE)", "MOŻLIWE (WSZYSTKIE)".
7. Agregaty obejmuja surowce przetworzone z konwerterow (cegla, ceramika, braz, zelazo, stal). Stolarnia/Warsztat kamieniarski maja przelacznik w liscie miast, ale ich "+10% doplywu" nie jest pokazane jako osobny wiersz agregatu (opisane w stopce). NIE_ZMIERZONO: osobna prognoza nastepnej tury — panel pokazuje wylacznie historie ostatniej tury (faktyczna) i gorna granice (mozliwe), podpisane jako takie. Przelacznik w panelu miasta (cityPanel.ts) NIE dodany — dispatch: "if appropriate", centralna lista jest wymaganiem jawnym.
8. Cap: "mozliwe" = przepustowosc x wyjscie (te sama funkcja `converterProductionDisplayForBuilding` co panel miasta), przy nieograniczonych wejsciach i magazynie; zalezy od epoki wlasciciela i trudnosci. Foundry/steel dziela wejscia — odnotowane w stopce UI.

## TESTY (liczby z surowego wyjscia)
- `node ./node_modules/typescript/bin/tsc --noEmit`: 0 bledow (wyjscie puste).
- `node tools/resource-building-toggle-test.cjs`: **123 passed, 0 failed** — A zakres/stan/sanityzacja; B silnik (aktywny/wylaczony/wlaczony; konserwacja wejsc: wylaczony == scenariusz bez budynku dla glina/drewno/ruda*/utrzymanie zlota i surowcow; multi-receptura wielka odlewnia braz+zelazo+stal; garncarnia/odlewnia_brazu/odlewnia_zelaza; mieszane miasta gracz+AI z parytetem; Stolarnia; `converterProducedByOwner` == przyrost magazynu; `previewOwnerUpkeep` == tick); C zapis (roundtrip JSON, stary zapis = wlaczone, smieci odsiane, budynek nie usuniety); D migawka (potencjal wlaczony vs zainstalowany, `null` = brak danych); E UI jsdom (lista miast tylko z budynkami produkcyjnymi, klik przelacza, naglowki/stopka, brak zargonu).
- `node tools/resource-building-toggle-ui-live.cjs`: **16 passed, 0 failed** w prawdziwym Chromium (`/opt/pw-browsers/chromium-1194`): prawdziwy CSS i handlery panelu; klik Wylacz Cegielnie w Ostii -> stan "Wyłączony" po jednym kliknieciu, hook silnika wywolany raz, agregaty "MOŻLIWE (WŁĄCZONE)" spada 450->225 a "WSZYSTKIE" zostaje 450; tura 2: Ostia bez przyrostu cegly, faktyczna 450->225; ponowne wlaczenie -> tura 3 faktyczna 450. Zrzuty: `evidence/01..05-*.png`.
- Regresje: converters-test 49/0, converter-era-scaling-test 117/0, brick-cycles-75-100-test 46/0, brick-production-x2-test 69/0, foundry-throughput-x2-era-mult-test 159/0, stolarnia-r5-d2-test 9/0, building-upkeep-resources-test 48/0 (po aktualizacji D4), hud-konwerter-dopasowanie-test 20/0 (po dodaniu zaleznosci), hud-skarbiec-test 34/0, empire-skarbiec-bilans-test 11/0, ai-purchase-maintenance-reserve-test 56/0, upkeep-difficulty-per-owner-test 19/0, praca-pula-rate-parity-test 20/0, spichlerz-drain-pipeline-test 21/0.
- NIE URUCHOMIONO / pre-existing: `empire-miasta-table-test` (sekcja L) i `empire-panel-miasto-obywatele-content-test` (D4) padaja na bundlowaniu `...svg?raw` (`brandAssets.ts`, `scienceOwlIcon.ts`) niezaleznie od tej zmiany (te same bledy loadera; moja zmiana nie dotyka tych importow) — sekcje source-text przed bundlowaniem przechodza (D1-D3 83-91 pass). `cyna-surowiec-test` przekracza 120 s w tym srodowisku (nie ukonczono, NIE_ZMIERZONO). Pelnej gry w Chromium przez Vite HTTP nie uruchamiano (zakres UI zweryfikowany na prawdziwym panelu + prawdziwym silniku tury w Chromium, bez petli calej gry).
- Mutacje: formalnych mutacji kodu NIE przeprowadzono (NIE_ZMIERZONO). Asercje sa jednak zaprojektowane tak, by padly przy typowych mutacjach: test silnika porownuje wylaczony budynek ze scenariuszem BEZ budynku (rownosc glina/drewno/ruda/utrzymanie), a test UI/Chromium asertuje tekst stanu po kliknieciu.

## BLOKADY
Brak blokad technicznych. Uwagi do Evaluatora: (a) pkt 3 zalozen (szeroka interpretacja "nie dziala"), (b) brak przelacznika w panelu miasta, (c) brak osobnej prognozy nastepnej tury (tylko historia + gorna granica), (d) pre-existing padajace bundlowania testow panelu (svg ?raw).

## RUNDY
1/5

## NASTEPNY KROK
Evaluator (Sonnet) -> Obrona -> Final Control; po PASS integracja orkiestratora (sprawdzic `git merge-base --is-ancestor` i `git diff --stat`), potem decyzja o deployu.

## DEPLOY/PUSH
NIE WYKONANO
