# AUDYT KODU — Civ „The Game” (2026-07-21, FINAL po pełnej weryfikacji 2026-07-22)

> **AUDYT ZAKOŃCZONY OD POCZĄTKU DO KOŃCA.** 13 obszarów kodu → 73 znaleziska → adwersaryjna weryfikacja KAŻDEGO (sceptycy Opus: 3 soczewki dla krytycznych/wysokich, 2 dla średnich, 1 dla niskich; 124 werdykty, 0 błędów w ostatnim biegu).
> Werdykty sceptyków z CYTATAMI z aktualnego kodu: `AUDYT-WERYFIKACJA-53-WERDYKTY.md` (tam AKTUALNE numery linii!).

**Bilans 73 znalezisk:** ✅ 20 NAPRAWIONE (commit 6adfb79, log: AUDYT-NAPRAWY-LOG.md) · 🔴 50 POTWIERDZONE DO NAPRAWY · 🟡 2 PRAWDOPODOBNE (głosy podzielone) · ⚪ 1 ODRZUCONE (już naprawione nocnym commitem b1a7a61)

---

## 1. [KRYTYCZNA → **WYSOKA** (korekta sceptyków)] Koszyk PN: oddanie 'jednostka' nic nie kosztuje dawcy — darmowy zakup zasobow AI

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 3437 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** transferBasketItems dla typu 'jednostka' wywoluje spawnTransferredUnit, ktory TWORZY nowa jednostke u odbiorcy, ale dawcy niczego nie odejmuje (ani jednostki, ani zlota). UI koszyka nie dostaje unitOptions z main.ts (openDiplomacyAudience, linia 6923), wiec defaultUnitOptions() podaje WSZYSTKIE typy z units.json — gracz moze 'oddac' jednostke, ktorej nie posiada. Pozycja liczy sie pelnym PN (Pieniadz koszt) w pnDealAcceptedByAi. Dodatkowo give-'zloto' bez pokrycia cicho no-opuje (applyOneShotGoldTransfer ok:false ignorowane, main.ts:3372), a receiveItems i tak sie wykonuja — transakcja nieatomowa. Rozne od zgloszonego 'Zaufanie za dar bez pokrycia' — to sciezka HANDLU i realnych dobr, nie zaufania.
- **Scenariusz:** Gracz z Relacja >= 100 otwiera koszyk handlu: 'Oddaje: Jednostka — Kusznik' (150 PN, nie posiada zadnego), 'Dostaje: Pieniadze 140¤'. fairMin = 140×100/Rel <= 140 <= 150 → AI akceptuje. executePnDealTransfer: u AI spawnuje sie darmowy Kusznik, gracz NIC nie traci i dostaje 140¤ z realnego skarbca AI. Powtarzalne co klik (limit 5 Zauf./ture nie ogranicza liczby transakcji) → wyssanie calego skarbca AI za nic.

## 2. [KRYTYCZNA] Auto-szturm kasuje CAŁĄ armię obu stron (survivors: [] = zerowi ocalali)

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 10188 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** doSiegeAutoResolve (linia 10188) i executeSilentSiegeStorm (linia 10055) przekazują do finishSiegeStormBattle wynik `{ winner, log: [], survivors: [] }`. finishSiegeStormBattle podaje res.survivors do applyMapBattleOutcome, gdzie warunek `survivors !== undefined` (main.ts:9453) zamienia PUSTĄ tablicę na manualSurvivors=[]. W applyPostBattleMap (post-battle-map.ts:273) zdefiniowane manualSurvivors wybiera gałąź applyManualSurvivors, która usuwa KAŻDĄ jednostkę z atkRoster i defRoster nieobecną w pustym zbiorze ocalałych — czyli wszystkie. Wyliczone lossAtkPct/lossDefPct z resolveAutoBattleByPower są całkowicie ignorowane. Strażnik survivorsLiveSet (siegeDefenders.ts:44), napisany dokładnie na ten przypadek ('Puste [] ≠ lista ocalałych'), nie ma ani jednego wywołania.
- **Scenariusz:** Gracz oblega miasto z murem, ma przewagę M 10:1, klika Szturm → Auto. resolveAutoBattleByPower zwraca winner=attacker z lossAtkPct≈5%, ale cała 10-jednostkowa armia gracza ORAZ garnizon znikają z mapy; miasto zostaje przejęte mimo braku żywego leada (applyCityCaptureToMap ustawia ownerId). Ten sam efekt przy każdym cichym szturmie AI (maybeAiAssaultAfterMachines → executeSilentSiegeStorm) — zwycięska armia oblężnicza AI wyparowuje po każdym szturmie.

## 3. [WYSOKA] Dupe ludnosci: rekrutacja przy pop=1 nie kosztuje ludka, disband zawsze oddaje +1

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/manpower.ts` (ok. linii 279 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** tryDeductUnitSpawnCosts zwraca population = Math.max(1, city.population - popCost), wiec w miescie o populacji 1 rekrutacja jednostki NIE zuzywa ludnosci (schodzi tylko manpower). Odwrotnosc — refundUnitSpawnToCity (wolane z main.ts:2209 disbandPlayerUnit) — bezwarunkowo dodaje +popCost ludnosci, bez sprawdzenia twardego capu populacji (akweduktProgLudnosci/akweduktMaxLudnosci; cap jest egzekwowany wylacznie w populationGrowth). Ten sam clamp jest tez w production.ts:1092 (advanceRecruitmentGated).
- **Scenariusz:** Miasto pop=1, pelna pula manpower (10 slotow kosztu): gracz rekrutuje 10 jednostek (pop caly czas 1, bo max(1, 0)=1), potem rozwiazuje je w tym samym miescie -> pop = 11, czyli +10 ludnosci wytworzonej z niczego, z pominieciem progow zywnosci (prog wzrostu 36+ jedzenia/ludka) i ponad cap 5 bez Akweduktu. Manpower wraca przy disbandzie, wiec petla jest ograniczona tylko cena zakupu jednostek.

## 4. [WYSOKA] Suwak zywnosci 0% = immunitet na glod: deficyt miasta znika z ksiag

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/turn-economy.ts` (ok. linii 1176 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** advanceCityEconomy liczy zywnoscDoRozwoju = yld.zywnosc * (pctRozwoj/100) rowniez dla UJEMNEGO yld.zywnosc, a advanceEmpireFood (empire-food.ts:131) agreguje do puli panstwa wylacznie Math.max(0, tick.zywnoscNetto). Ujemna zywnosc miasta jest wiec mnozona przez suwak (przy 0% znika calkowicie), a druga strona bilansu nigdy nie widzi deficytu — jedzenie znika z ksiag zamiast obciazyc miasto lub zapasy panstwa.
- **Scenariusz:** Miasto z netto -6 zywnosci/ture; gracz ustawia suwak rozwoju imperium na 0% (onEmpireFoodSplitChange, panel miasta): populationGrowth dostaje 0 -> magazyn nie maleje, brak ubytku ludnosci — miasto NIGDY nie glodzi mimo trwalego deficytu; zapasy panstwa tez nie sa pomniejszane o ten deficyt (brutto=0). Przy 50% deficyt jest sztucznie polowiony.

## 5. [WYSOKA] AI trwale przestaje badac technologie po dojsciu do techu awansu epoki

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/main.ts` (ok. linii 11545 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Petla badan AI pomija techy z awansDoEpoki: `if (!eraAdvance) { aiDone.add(...) }` bez zadnego fallbacku na drugi wybor. chooseAIResearch (ai.ts) to deterministyczny argmax, a scoreTech JAWNIE premiuje Brazownictwo (+50..90, komentarz 'key enabler... advances era'). Gdy Brazownictwo/Hutnictwo zelaza raz zostanie najlepszym wyborem, AI co ture dostaje ten sam wynik, nic nie jest dodawane do aiResearchDone i badania AI zamieraja NA ZAWSZE — takze techy wciaz osiagalne o nizszym score nigdy nie zostana wybrane. Skutki kaskadowe: syncOwnerEraFromResearch (main.ts:810) to martwa bramka (era AI nigdy nie rosnie z badan), jednostki/budynki brazu i zelaza oraz ulepszenia terenu (gate isImprovementTechUnlocked, main.ts:11852) pozostaja dla AI zablokowane do konca gry. Jedyny obejsciowy kanal to handel techem w dyplomacji (main.ts:3422).
- **Scenariusz:** Nowa gra od epoki Kamien. AI bada Garncarstwo/Murarstwo/Obrobke drewna (wysokie score za Spichlerz/Cegielnie). Gdy prereki Brazownictwa spelnione i spichlerzowe bonusy skonsumowane, argmax = Brazownictwo (score ~80-100 vs ~10-30 reszty) -> chooseAIResearch zwraca je co ture, blok `if (!eraAdvance)` nic nie robi -> log '[AI] Zbadano' znika do konca gry, AI do tury 300 stoi na jednostkach kamienia, gracz w Zelazie.

## 6. [WYSOKA] Zwyciestwo naukowe nieosiagalne: rakietaWystrzelona nigdy nie ustawiana, NAUKA_WYMAGA_RAKIETY martwe

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/victory.ts` (ok. linii 39 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** isNaukaVictory (victory.ts:147) wymaga wszystkieTechZbadane && rakietaWystrzelona. player.rakietaWystrzelona jest inicjalizowane na false (playerState.ts:134) i NIGDZIE w gra/src nie ma przypisania na true (jedyny odczyt: main.ts:12042). W v0.1 nie istnieje tez zaden projekt rakietowy do ukonczenia. Wentyl bezpieczenstwa zostal przygotowany — flaga konfiguracyjna zwyciestwo.nauka_wymaga_rakiety (e-start-params.json:55) i stala NAUKA_WYMAGA_RAKIETY (victory.ts:39) — ale stala nie jest uzyta w checkVictory/isNaukaVictory (0 referencji poza definicja). Martwa bramka, ktora miala dzialac: nawet po zbadaniu wszystkich techow w scope warunek 'nauka' nigdy nie przechodzi.
- **Scenariusz:** Gracz w kreatorze wybiera warunek zwyciestwa 'moc' (victoryModeAllowsDominacja=false). Bada wszystkie techy Kamien+Braz+Zelazo -> wszystkieTechZbadane=true, rakieta=false -> checkVictory zawsze zwraca null (poza przegrana). Gra nie do wygrania zadna sciezka.

## 7. [WYSOKA] Fair-play relief zamienia heksy Wybrzeża (wody) na Góry/Wzgórza — góra w morzu

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/map/gen-helpers.ts` (ok. linii 1601 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** pickReliefForceHex filtruje tylko Morze (linia 1601), a Wybrzeże jedynie karze score -= 0.15 (linia 1617); fallback w forceReliefTypeInCell (linie 1655-1666) też filtruje wyłącznie Morze. Do tego masy z groupLandMassKeys (linia 1180) i komórki landHexesByCoverageCell zawierają heksy Wybrzeża, więc trafiają one do rankingu. Po ZADANIU 1 (Wybrzeże = woda) forceIron/CopperInCell może ustawić terenBazowy=Gory/Wzgorza na wodzie. ensureReliefGridCoverage biegnie w generatorze PO finalizeLandMassAfterCoast (linia 353), a po niej nie ma już removeTinyLandIslands/purgeOpenOceanLandSpecks — wynik zostaje na finalnej mapie i łamie własny inwariant openOceanLandSpecks=0 (auditMapTerrainData).
- **Scenariusz:** Płaska komórka 25x25 bez 2 Gór; mtnNoise (pole gładkie) najwyższy na heksie pasa Wybrzeża (kara 0.15 za mała) -> heks wody staje się Górą: samotna góra/wysepka w morzu, potencjalnie domyka 1-heksową cieśninę lub skleja wyspy, a thickenCoastAndSmoothInlets dobudowuje wokół niej nowy ląd.

## 8. [WYSOKA] Odrzucone play() zostawia playing=true — fallback gestu intro martwy, menu startowe bez muzyki

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/audio/filePlayer.ts` (ok. linii 347 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** start() ustawia playing=true i wola el.play(), ktorego odrzucenie (polityka autoplay — brak gestu) jest polykane w catch bez cofniecia stanu (linie 255-259). Playlista uwaza, ze gra, choc jest niema. Fallback armIntroFallbackGesture() w main.ts (3821-3831) na pierwszy pointerdown/keydown wola startIntroMusic() -> introPlaylist.start(), ktory na guardzie 'if (!hasTracks() || playing) return' (linia 347) robi no-op, bo playing juz jest true. Mechanizm zbudowany DOKLADNIE na ten przypadek nigdy nie dziala. Stan naprawia sie dopiero, gdy startGameMusic() zawola stopIntroMusic() (reset playing) — czyli po wejsciu do gry. Ten sam korzen wycisza tez muzyke kamienia przy bootowych trybach playtest z URL (startMusic('bitwa') bez gestu, main.ts 13844-13845).
- **Scenariusz:** Swieze otwarcie strony (pierwsza wizyta / file://) -> boot() -> openStartupMainMenu() -> resumeIntroMusic() bez gestu -> play() odrzucone, playing=true. Uzytkownik klika cokolwiek w menu -> fallback wola start() -> early-return. Menu glowne pozostaje CALKOWICIE bez muzyki az do rozpoczecia i opuszczenia rozgrywki; dodatkowo monitorTimer tyka co 100 ms w martwej playliscie.

## 9. [WYSOKA] Awans epoki kamien(pliki)->braz: spawnEngine no-op bo ctx===null — trwala cisza zamiast nagrody

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/audio/muzyka-antyczna.ts` (ok. linii 1601 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Gdy muzyka kamienia gra z plikow, startMusic() wraca PRZED utworzeniem AudioContext (linie 1532-1541) — ctx pozostaje null przez cala rozgrywke. Awans epoki wola setEra(2) (main.ts:11087): galaz wasFilePlayer&&!nowFilePlayer robi kamienPlaylist.stop() i spawnEngine(2, mood, ERA_XFADE), ale spawnEngine (1517) ma guard 'if (!ctx || !graf) return' i po cichu nic nie tworzy. playing zostaje true, wiec kolejne setMood() tez wpada na guard '!ctx' (1579). Efekt: muzyka gasnie na stale w momencie, ktory mial byc 'slyszalna nagroda' (ERA_XFADE 6 s). Jedyny nieoczywisty ratunek: przelaczenie muzyki OFF->ON w menu pauzy (startMusic tworzy wtedy ctx i respawnuje).
- **Scenariusz:** Nowa gra w epoce kamienia (utwory/kamien/ ma 16 plikow -> tor plikowy, ctx nigdy nie powstaje) -> badania koncza awans do brazu -> setEra(2) -> playlista kamienia zatrzymana, silnik brazu NIE powstaje -> kompletna cisza muzyki do konca sesji (bitwy tez nieme).

## 10. [WYSOKA] 25 jednostek bez pol EN armor/piercing/chargeBonus — walcza z pancerzem 0

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/data/units.json` (ok. linii 2287 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Nowsza partia jednostek narodowych (Soldurii, Druzynnik, Thorakites, Evocati, Gwardia hetycka, Gwardia Ishtar, Mur tarcz, Miecznik galijski, konnice asyryjskie, jednostki Harappy/Fenicjan/Babilonii itd. — lacznie 25 z 73) ma wypelnione tylko polskie kolumny Pancerz/Przebicie/Uderzenie, ale NIE ma pol EN 'armor', 'piercing', 'chargeBonus'. Kanoniczny resolver walki combatUnitFromDef (gra/src/game/combat.ts:177-179) czyta WYLACZNIE klucze EN z fallbackiem 0 — bez fallbacku na kolumny PL. Starsze jednostki (np. Hastati armor=9) maja komplet EN. To inna luka niz znane 'categoryOf zwraca domyslny' — tamto dotyczy kategorii wizualnej, to dotyczy statystyk bojowych.
- **Scenariusz:** Bitwa taktyczna (BattleScene/mapa polowa): Gwardia hetycka (Pancerz=5 w PL, brak 'armor') dostaje armor=0 i piercing=0 -> przyjmuje pelne obrazenia weaponDamage kazdego przeciwnika i nie przebija pancerza starych jednostek; elitarna piechota zelaza pada szybciej niz Wojownik z mieczem (armor=4 EN). Wynik kazdej walki reczna z udzialem tych 25 jednostek jest systematycznie przeklamany.

## 11. [WYSOKA] Super-jednostki (koszt 0, 'max 1, bezplatna') masowo produkowalne za 10 Pracy

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/data/units.json` (ok. linii 619 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** 7 jednostek z Super-jednostka=TAK i 'Pieniadz (koszt)'=0 (Hieros Lochos, Hu Ben Wei, uThulwana, Krolewska Gwardia, Medzaj, Gwardia Krolewska Sumeru, Evocati) wg Uwag w danych ma byc 'max 1, bezplatna, stolica, respawn'. Kod nigdzie nie egzekwuje limitu max 1 (grep po calym src: Super-jednostka uzywane tylko do kategorii/ikon i blokady w dyplomacji). W availableProduction (gra/src/game/production.ts:684-734) przechodza normalne bramki, a unitCostFromDef (production.ts:230-241) traktuje koszt 0 jako 'brak' i podstawia fallback roli Wrecz = 10 — TANIEJ niz zwykle jednostki elitarne (16-18). Utrzymanie=0 (celowe dla super, economy-upkeep.ts:411) czyni spam darmowym w utrzymaniu. Ten sam fallback dziala w akcji Zastap (doplata = max(0, 10-18) = 0).
- **Scenariusz:** Egipt, epoka Brazu, Koszary w miescie: Medzaj (mA=10, wD=10, armor=6, hp=42) pojawia sie na liscie produkcji za 10 Pracy obok Wojownika z khopesh (mA=6, 18 Pracy, utrzymanie 2). Gracz rekrutuje dowolna liczbe Medzaj — armia najsilniejszych jednostek epoki taniej niz podstawowa piechota i bez kosztow utrzymania.

## 12. [WYSOKA] Klawisz N odblokowany podczas zawieszonej fazy AI (modalna bitwa) — podwojna tura

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 12082 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Gdy AI atakuje gracza, runAiPhase ustawia aiCmdResume, przerywa ownerLoop i czeka na modalny dialog bitwy (launchIncomingMapFieldBattle, callback wznawia runAiPhase). Jednak zewnetrzny async konczy sie normalnie: wykonuje sie tick barbarzyncow, victory check, executePlannedMarchesEndTurn, a w finally endTurnTransition() i endTurnInProgress=false (linia 12082) — MIMO wiszacej bitwy. Handler N (linia 10752) sprawdza tylko playtest/gallery/gameOver/endTurnInProgress, nie ma bramki na otwarta bitwe/preBattle.
- **Scenariusz:** Tura gracza -> AI atakuje jednostke gracza -> dialog 'Wrog atakuje twoje wojsko!' -> gracz wciska N (odruchowo 'nastepna tura'). Rusza PELNY drugi pipeline: turn++ drugi raz, ekonomia liczona drugi raz, a nowy runAiPhase KONSUMUJE aiCmdResume (komendy AI policzone dla poprzedniej tury wykonuja sie na nowym stanie). Po rozstrzygnieciu bitwy callback odpala runAiPhase trzeci raz z aiCmdResume=null -> wszystkie AI ruszaja sie DRUGI raz w tej samej turze. Korupcja stanu tury i podwojna ekonomia.

## 13. [WYSOKA] Wioski (goodie-huts) nie sa zapisywane — save/load wskrzesza zlupione wioski (exploit)

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 8081 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Stan zlupienia wioski zyje wylacznie na heksie mapy (hex.wioska.istnieje=false, linia 8081). Mapa jest przy wczytaniu regenerowana deterministycznie z seeda (map/generator.ts:428 stawia wioski od nowa), a buildSaveGameSnapshot (10526-10604) ani restoreGameFromSave nie przenosza zadnej listy zebranych wiosek. Dodatkowo load z pauzy bez rebuildu mapy (loadNeedsMapRebuild=false) zostawia stan wiosek z BIEZACEJ sesji — wczytanie wczesniejszego zapisu tej samej gry pokazuje wioski jako zlupione, choc w momencie zapisu istnialy.
- **Scenariusz:** Gracz wchodzi jednostka na wioske -> dostaje zloto/tech/jednostke -> Ctrl+S -> Ctrl+L (rebuild mapy z seeda) -> ta sama wioska stoi ponownie na tym samym heksie -> ponowne wejscie daje kolejna nagrode. Petla daje nieskonczone zloto/nauke/jednostki (save-scumming lamiacy ekonomie wczesnej gry).

## 14. [WYSOKA] battlePowerPtsByOwner bez resetu przy nowej grze — zombie-potega z poprzedniej rozgrywki

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 12759 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Mapa battlePowerPtsByOwner (punkty za wygrane bitwy; zapisywana/odtwarzana przy load: 10587/13648, kasowana per-owner przy eliminacji: 9744) NIE jest czyszczona w zadnej sciezce startu nowej gry: brak jej w bloku resetow doStartGame (12716-12772), w applyClusterStartPlan (3195-3224) ani w startach playtestow. Punkty wchodza do computeObjectivePower jako bitwyPktSum (linia 971), a potega napedza warunek zwyciestwa 'moc_i_dominacja' i computeRespekt w dyplomacji.
- **Scenariusz:** Gracz konczy dluga gre z wieloma wygranymi bitwami (battlePowerPtsByOwner[0] wysokie) -> menu glowne -> Nowa gra. Ownery 0 i 1..N koliduja z poprzednia rozgrywka, wiec nowa gra startuje z odziedziczonymi punktami bitew: potega gracza od tury 1 zawyzona -> przedwczesne zwyciestwo moca / znieksztalcony respekt i decyzje wojenne AI.

## 15. [WYSOKA] Profile miast-panstw (typCityCopyOwners i pokrewne zbiory) nie sa zapisywane ani odtwarzane

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 13670 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Zbiory typCityCopyOwners/simplifiedDiplomacyOwners/foreignTypeOwners (oraz clusterPlacement i clusterCapitalOwnerIds) sa wypelniane WYLACZNIE w applyClusterStartPlan/spawnPendingSameTypeRivals przy nowej grze (3197-3212, 3284-3285). buildSaveGameSnapshot ich nie zapisuje, a restoreGameFromSave/restoreAiRosterFromSave (13670) ani repairAiRosterFromMap ich nie odbudowuja (flaga c.startCityState JEST w zapisie, ale nikt z niej nie rekonstruuje zbiorow).
- **Scenariusz:** Zapis gry z miastami-panstwami -> zamkniecie przegladarki -> wczytanie: typCityCopyOwners puste, wiec kazde miasto-panstwo dostaje defensiveCopy=false w AITurnOpts (11457) i gra pelna tura AI (ekspansja, osadnicy, ataki zamiast profilu obronnego); simplifiedDiplomacyOwners puste -> pelna dyplomacja (propozycje sojuszy/handlu jak wielkie cywilizacje); posilki siostrzane i konsolidacja klastra martwe (clusterPlacement=null). Load innej gry w trakcie sesji: zbiory trzymaja STARE ownerIds -> zle profile w nowej grze.

## 16. [WYSOKA] Dyplomacja: Zaufanie za dar/handel bez pokrycia w zasobach (darmowy trust co ture)

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 6667 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** applyProposalOutcome po akceptacji oneShotTrade wywoluje executePnDealTransfer, a NASTEPNIE bezwarunkowo applyPnTrustForPair(givePn, receivePn) od ZADEKLAROWANEGO PN. Transfer nie waliduje posiadania: 'zloto' -> applyOneShotGoldTransfer zwraca {ok:false} przy braku srodkow, ale wynik jest ignorowany (main.ts:3372); 'praca' -> playerPracaPool = max(0, pool - praca) (main.ts:3378), czyli gracz bez Pracy nic nie traci, a AI i tak dostaje PELNA kwote do skarbca (main.ts:3384-3387); 'zywnosc' analogicznie clamp do 0 (main.ts:3393) przy pelnym kredycie odbiorcy. UI koszyka (diplomacyTradeBasket.ts:200,305-310) pozwala wpisac dowolna ilosc bez limitu posiadania. Efekt: +Zaufanie (do limitu/ture) + Dobra Wola (+1 Zauf./ture x3 przy nadwyzce >=100 PN) za darmo, powtarzalne kazda ture.
- **Scenariusz:** Gracz ma 0 zlota i 0 Pracy. Audiencja -> Prezent/dar -> pozycja 'Praca' ilosc 500 -> Zaproponuj. AI akceptuje dar: playerPracaPool = max(0,0-500) = 0 (zero kosztu), aiSkarbiec += 500, gracz dostaje max Zaufania za ture + Dobra Wola. Powtarzane co ture buduje sojusz-poziom relacji bez wydania czegokolwiek.

## 17. [WYSOKA] Panel miasta: Bilans plonow liczony bez efektow budynkow, Waluty, bonusow cyw. i Porzadku

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/ui/cityPanel.ts` (ok. linii 706 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** computeView wola cityYieldPerTurn z ctx, w ktorym flagi budynkow sa na sztywno false (linia 703), a hak getCityBuildingFlags z main.ts (7528-7530 i 12416-12418) dostarcza WYLACZNIE liczbaAktywnychTrasHandlowych. Silnik w ticku (turn-economy.ts:844-866) przekazuje maMlyn/maCegielnia/maTargowisko/maBiblioteka/maMennica, walutaOdkryta, walutaMnoznikOverride, civHandelMult/civNaukaMult oraz stosuje applyOrderYieldMults — UI nic z tego nie uwzglednia. Panel pokazuje wiec zanizona Prace (bez Mlyna/Cegielni), Handel/Pieniadz (bez Targowiska, Mennicy i x2 Waluty) i Nauke (bez Biblioteki i bonusu cywilizacji), a jednoczesnie karty detali (np. cityPanel.ts:6705) twierdza, ze bonusy sa wliczone. Pochodne (zywnoscDoWzrostu/doArmii, ETA wzrostu, suwaki podzialu) tez licza sie od zanizonych wartosci.
- **Scenariusz:** Miasto z Mlynem, Targowiskiem, Mennica i odkryta Waluta: silnik nalicza np. Pieniadz ~2x wyzszy (mnozniki Targowisko+Waluta+Mennica) i wyzsza Prace (Mlyn). Panel 'Bilans plonow' pokazuje wartosci bazowe bez tych mnoznikow — gracz widzi inne liczby niz faktyczny przyrost skarbca/produkcji co ture i podejmuje bledne decyzje (np. o suwakach handlu).

## 18. [WYSOKA] Pasek armii: pasek HP kart zawsze 100% — ranne jednostki wygladaja na zdrowe

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 6972 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** buildArmyStackHudState buduje karty stosu z hp: hpMax (linia 6972) zamiast u.hp — mimo ze RuntimeUnit.hp jest trwale aktualizowane po bitwie (post-battle-map.ts:108 run.hp = hp; performUnitReplace i podsumowania bitew czytaja u.hp). armyStackHud.ts renderuje pasek HP z c.hp/c.hpMax (linie 167,171), wiec zawsze pokazuje 100%. To samo w statach naglowka (main.ts:7016-7017: hp i hpMax = unitHealth(def)).
- **Scenariusz:** Jednostka wychodzi z recznej bitwy z 4/12 HP (silnik zapisuje u.hp=4). Gracz zaznacza ja na mapie swiata — dolny pasek armii pokazuje pelny zielony pasek HP dla kazdej karty. Gracz atakuje kolejna armie mysląc, ze stos jest zdrowy, i traci jednostki.

## 19. [WYSOKA] Odwrocona bramka wasalizacji: sprawdza Respekt respondenta zamiast proponenta

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/game/diplomacy-proposals.ts` (ok. linii 455 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Case 'wasal' odrzuca gdy ctx.responderRespekt < progWasalizacjaRespekt(70). Wg spec (DIPLOMACY_PARAMS: 'Respekt >= 70 required to demand Wasalizacja') to ZADAJACY musi miec Respekt >= 70 — czyli ctx.proposerRespekt (jak poprawnie w 'trybut_zadanie', linia 292). computeRespekt daje udzialy komplementarne (suma 100), wiec warunek responderRespekt >= 70 oznacza proposerRespekt <= 30: wasalizowac mozna WYLACZNIE partnera ~2.3× silniejszego, nigdy slabszego. Deal ustawia payer=responder → silniejszy respondent placi trybut slabemu proponentowi. Zadnej innej bramki (zaufanie/willingness) nie ma.
- **Scenariusz:** Gracz o sile 25% pary (proposerRespekt=25, responderRespekt=75) w pokoju z hegemonem klika 'Wasalizacja': 75 >= 70 → AI-hegemon zostaje wasalem i placi graczowi 10¤/ture bezterminowo. Odwrotnie: gracz-hegemon (respekt 80) nie moze wasalizowac nikogo — 20 < 70, komunikat 'Wasalizacja wymaga Respekt >= 70'.

## 20. [WYSOKA] Kurs Rel/100 dziala w kazdym dealu na korzysc proponenta — pompa zlota przy Relacji > 100

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/game/diplomacy-value-catalog.ts` (ok. linii 301 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** diplomacyFairGivePn = receive×100/Rel, a pnDealAcceptedByAi akceptuje kazdy deal z givePn >= fairMin. Rabat relacyjny przysluguje proponentowi w KAZDEJ transakcji i w OBIE strony wymiany, a koszyk (diplomacyTradeBasket.ts, typOpts) pozwala dodac 'zloto' po obu stronach naraz — brak guardu na ten sam zasob po obu stronach i brak limitu liczby transakcji na ture. Zamierzony kurs Macieja ('Rel 100 = 1:1, otrzymujesz = placisz × Rel/100') byl projektowany dla wymiany ¤↔Praca, nie dla arbitrazu ¤↔¤.
- **Scenariusz:** Przy Relacji 200 (zaufanie 100 + respekt 100): 'Oddaje: Pieniadze 100', 'Dostaje: Pieniadze 200' → fairMin = 200×100/200 = 100 → akceptacja; transfer: gracz −100¤, AI −200¤ → gracz netto +100¤ na klik. Powtarzalne az do wyzerowania skarbca AI. Nawet przy Rel 110 kazdy deal daje +10% za darmo.

## 21. [WYSOKA] Zadanie trybutu: brak limitu kwoty i brak guardu duplikatu — trybuty stackuja sie co ture

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/game/diplomacy-proposals.ts` (ok. linii 287 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Case 'trybut_zadanie' sprawdza tylko perTurn >= 10 i proposerRespekt > 70 — kwota z inputu gracza jest akceptowana BEZ gornego limitu i bez oceny wyplacalnosci/woli AI. W przeciwienstwie do 'nap' i sojuszy nie ma pairHasKind — a makeDealId zawiera nr tury, wiec kazda kolejna tura tworzy NOWY deal obok starego (addTreaty filtruje tylko identyczne id). activeDealsToPaymentDeals tickuje kazdy z osobna.
- **Scenariusz:** Gracz z Respekt 75 zada trybutu 10¤/ture w turze 10, 11, 12... — kazde zadanie akceptowane (a kazda akceptacja daje jeszcze +10 Respekt przez 'trybut_zaakceptowany'), deale wasalizacja-0-X-t10/t11/t12 wspolistnieja bezterminowo (payload.turns brak → wygasaTura null). Po 20 turach AI placi 200¤/ture z jednego 'przywileju'. Alternatywnie jedno zadanie 99999¤/ture tez przechodzi walidacje.

## 22. [WYSOKA → **NISKA** (korekta sceptyków)] Rozjazd kierunku Respektu: silnik trzyma udzial AI, UI liczy udzial gracza

- **Status:** ⚪ ODRZUCONE — JUŻ NAPRAWIONE (b1a7a61)
- **Plik:** `gra/src/main.ts` (ok. linii 11586 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Petla AI co ture nadpisuje respekt pary wartoscia computeRespekt(potAI, potPlr) — udzial SIL AI (11586-11589). Audiencja liczy i pokazuje computeRespekt(playerPower, otherPower) — udzial GRACZA (6879), i przekazuje relacjaTotal = zaufanie + udzial gracza do koszyka (6888, diplomacyAudience.ts:330). Silnik (evaluateProposal/relationScore, pnDealAcceptedByAi/relationTotal) czyta natomiast zapisany respekt = udzial AI. Obie wartosci sa komplementarne (suma 100), wiec przy asymetrii sil UI i silnik widza Relacje rozniace sie nawet o ~80 pkt.
- **Scenariusz:** Gracz 4× silniejszy (udzial 80/20), zaufanie 60: audiencja pokazuje Respekt 80 i Relacje 140, koszyk handlu otwiera sie (140 >= 100) i pokazuje fairMin wg Rel 140 — ale evaluateProposal liczy score = 60+20 = 80 < progHandelRelacja(100) i odrzuca: 'Relacja zbyt niska na handel'. Im silniejszy gracz, tym bardziej silnik go karze wzgledem tego, co widzi w UI (progi NAP/sojuszu tez licza sie od odwroconej wartosci).

## 23. [WYSOKA → **SREDNIA** (korekta sceptyków)] Atrycja garnizonu przy oblężeniu zmienia licznik pochodny — bez realnego efektu

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 11008 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Tick oblężenia (N3) zmniejsza `oblCity.garnizon` o 8%/turę (main.ts:11007-11008). Ale city.garnizon to licznik POCHODNY — syncCityGarnizon (5219-5221) i syncGarnizonForCity (8054-8056) wyliczają go z żywych jednostek inGarnizon na heksie miasta. Atrycja nie usuwa żadnej jednostki ani nie zdejmuje HP, więc: (a) każdy sync (wejście/wyjście jednostki z garnizonu — 7407, start oblężenia — 5382) przywraca wartość sprzed atrycji; (b) skład obrońców przy szturmie (collectSiegeDefRoster liczy realne jednostki dist≤1) jest identyczny niezależnie od liczby tur oblężenia. Mechanika 'atrycja garnizonu' jest fantomowa — log twierdzi, że garnizon topnieje, a obrona miasta nie słabnie ani o punkt.
- **Scenariusz:** Miasto AI z 5 jednostkami w garnizonie oblegane 10 tur: log pokazuje atrycję 5→0, ale szturm w turze 11 walczy z pełnymi 5 jednostkami na pełnym HP. Jeśli w międzyczasie obrońca przełączy jedną jednostkę garnizonu, licznik wraca do 5 i 'atrycja' zaczyna od nowa.

## 24. [WYSOKA] Miasto-panstwo atakuje posilki sojuszniczej siostry (filtr sojuszu tylko w detekcji zagrozenia)

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/game/ai.ts` (ok. linii 1364 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** W decideDefensiveCopyTurn wykluczenie sioster z pojecia 'wroga' zastosowano WYLACZNIE do detekcji zagrozenia (nonSisterEnemyUnits, linia 1345, uzyte tylko w underAttack linia 1407). Riposta (linia 1364: adjacentEnemy z pelnego enemyUnits => komenda attack) i marsz obronny ku 'zagrozeniu' przy wlasnym miescie (linia 1374, tez pelne enemyUnits) nadal traktuja jednostki siostry (i patrona klastra) jako wrogow. main.ts wykonuje komende attack bez zadnej kontroli dyplomacji (linia 11737+, auto-bitwa doAutoPowerMapBattle), wiec sojusz zawarty przez formSisterAlliancesIfThreatened niczego nie chroni.
- **Scenariusz:** Siostra A (sojusz aktywny) wysyla posilek do zagrozonej siostry B. Jednostka A po kilku turach staje obok miasta B (nie moze wejsc na heks miasta). W turze B jej garnizon znajduje adjacentEnemy = jednostka A i ja atakuje — auto-bitwa niszczy sojusznicze posilki, zanim dotknie prawdziwego wroga. Caly mechanizm posilkow w klastrze (D-START v2) w praktyce sam sie kanibalizuje.

## 25. [WYSOKA → **SREDNIA** (korekta sceptyków)] Odbicie miasta rebeliantow = falszywa ELIMINACJA frakcji -99 + powtarzalne Power-zdobycze (exploit)

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 9797 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Rebelia (linia 11243: city.ownerId = REBEL_FACTION_OWNER_ID = -99) zmienia wlasciciela miasta poza systemem stolic, a runCapitalCapturePlunder nie ma guardu na oldOwner < 0. Odbicie JEDYNEGO miasta rebeliantow (post-battle lub kapitulacja z glodu) przechodzi pelna sciezke: wasCapitalOfOldOwner=true (jedyne miasto -99), remaining=0 => 'eliminacja': zdobywca dostaje trwaly bonus zdobyczePower = buildObjectivePowerForOwner(-99) (jednostki rebeliantow w polu maja niezerowa moc), -99 laduje w eliminatedOwners (i w sejwie), a UI pokazuje falszywy komunikat 'ELIMINACJA!'. Dodatkowo gdy zbuntuje sie WYZNACZONA stolica gracza, wpis capitalCityIdByOwner(0) staje sie stale-em i pozniejsze przejecie faktycznej stolicy gracza przez AI nie odpala plunderu/sukcesji.
- **Scenariusz:** Gracz doprowadza (lub pozwala doprowadzic) miasto do buntu, po czym je odbija: +trwaly bonus Power (metryka zwyciestwa moc_i_dominacja) za 'eliminacje' rebeliantow. Kazde kolejne zbuntowane i odbite miasto (rebelState blokuje tylko ponowny bunt TEGO SAMEGO miasta) to kolejny darmowy przyrost Power — farmowalne, wplywa na powerShare i prog zwyciestwa.

## 26. [WYSOKA] Stan podsystemu miast-panstw/klastrow (typCityCopyOwners, clusterPlacement itd.) nie jest zapisywany

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 10562 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** buildSaveGameSnapshot nie zapisuje: typCityCopyOwners, simplifiedDiplomacyOwners, foreignTypeOwners, clusterCapitalOwnerIds ani clusterPlacement (ustawiane tylko w applyClusterStartPlan, linie 3190-3212). restoreGameFromSave niczego z tego nie odtwarza ani nie czysci. Po wczytaniu sejwu w swiezej sesji zbiory sa puste: miasta-panstwa dostaja defensiveCopy=false (normalna ekspansywna AI z osadnikami), pelna warstwe dyplomacji zamiast uproszczonej, formSisterAlliancesIfThreatened wraca natychmiast (typCityCopyOwners.size===0), a posilki w klastrze nigdy nie ruszaja (gate na linii 11489/11503). Odwrotnie: load starego sejwu po rozpoczeciu innej nowej gry w tej samej sesji uzywa STARYCH zbiorow i clusterPlacement z innej mapy (blednie sklasyfikowane ownerId).
- **Scenariusz:** Gracz zapisuje gre z klastrami miast-panstw, zamyka przegladarke, wczytuje sejw: wszystkie miasta-panstwa cicho zamieniaja sie w pelnoprawne cywilizacje (zakladaja miasta, prowadza pelna dyplomacje), sojusze siostrzane i posilki znikaja — caly system D-START przestaje istniec po kazdym cyklu zapis/odczyt.

## 27. [WYSOKA → **SREDNIA** (korekta sceptyków)] cityFogVisible: pelne currentVisible() liczone osobno dla kazdego obcego miasta przy kazdym sync

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 3610 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Callback isVisible w _cityRenderOpts (main.ts:1043-1046) woła cityFogVisible (main.ts:3610), ktory wykonuje PELNE currentVisible() — petla po wszystkich jednostkach i miastach gracza z computeVisibleAt (tysiace insertow do Set<string> + alokacje tymczasowych Setow per jednostka). CityRenderer.sync (render/cities.ts:369) i syncStatChips (render/cities.ts:454) wolaja isVisible per miasto, wiec widocznosc gracza jest przeliczana od zera N razy (N = liczba obcych miast). syncStatChips odpala sie na koncu KAZDEGO syncUnitsRender (main.ts:3912), a cityRenderer.sync przy kazdym refreshFog/endTurn. Praca jest w 100% redundantna — refreshFog juz policzyl `vis` i zaraz potem woła applyFogVisibility(vis) robiace to samo tanio. Dodatkowo getLevel/getWalls robia cities.find per miasto = O(miast^2). Po podwojeniu liczby panstw/miast (sufit 15) koszt rosnie liniowo z miastami razy koszt widocznosci.
- **Scenariusz:** Mapa duza/superogromna, srodek gry: 30 jednostek + 10 miast gracza (currentVisible ~4-5k operacji na wywolanie), 60 obcych miast. Kazdy ruch jednostki -> animacja -> refreshFog -> syncUnitsRender -> syncStatChips -> 60x pelne przeliczenie widocznosci = ~300k operacji na stringach + 60 alokacji duzych Setow NA KAZDY ruch. Marsz 10 jednostek = 10x ta praca w jednej turze; widoczne zacinanie i presja GC rosnaca wprost z x2 miast.

## 28. [WYSOKA] computePath bez limitu promienia: nieosiagalny cel = flood calego kontynentu, 2x per jednostka AI

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/units/setup.ts` (ok. linii 696 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** computePath nie ma zadnego ograniczenia promienia/kosztu ani heurystyki A*. Gdy cel jest nieosiagalny (wrogie miasto na innym kontynencie, cel obstawiony jednostkami), petla while (linia 696) rozlewa sie po CALYM osiagalnym ladzie (dziesiatki tysiecy heksow na duzych mapach, klucze stringowe + heap) zanim zwroci []. W turze AI jest wolany DWUKROTNIE na jednostke dla tego samego celu: raz w firstStep przy podejmowaniu decyzji (game/ai.ts:591), drugi raz przy wykonaniu komendy move (main.ts:11694). Kazde wywolanie dodatkowo buduje od zera Set wszystkich zajetych heksow (O(jednostki)). Po podwojeniu panstw (x2 jednostek AI) koszt konca tury rosnie ~liniowo z liczba jednostek razy rozmiar kontynentu.
- **Scenariusz:** Superogromna mapa (672x476, kontynent ~30-60k heksow), 15 panstw AI, ~200 jednostek wojskowych AI. Panstwo A na innym kontynencie niz najblizsze wrogie miasto: kazda jego jednostka co ture floduje caly wlasny kontynent (2x — decyzja + wykonanie). 200 jednostek x ~30k heksow x 2 = ~12M operacji heap/Map na KAZDY koniec tury -> wielosekundowe zamrozenie przy 'Tura przeciwnikow'.

## 29. [WYSOKA] findSettlerTarget: pelny skan mapy x allCities.some(hexDistance) per osadnik per tura

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/game/ai.ts` (ok. linii 1475 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** findSettlerTarget iteruje WSZYSTKIE heksy mapy (Object.keys(map.hexes), linia 1466) i dla kazdego ladowego heksa robi allCities.some(hexDistance < minCityDist) (linia 1475) po WSZYSTKICH miastach swiata, plus hexCityScore (find po terrain_types + 6x getAiParam) dla kandydatow. Brak ograniczenia skanu do otoczenia osadnika/klastra i brak cache miedzy osadnikami/turami. Koszt = O(heksy_mapy x miasta) na osadnika na ture — po podwojeniu miast (sufit 15 panstw) podwaja sie wprost, a wynik i tak jest potem goniony przez computePath (znalezisko wyzej).
- **Scenariusz:** Superogromna mapa = 319 872 heksow, 60 miast na swiecie, wczesna/srodkowa gra: 15 panstw AI x 1-2 osadnikow = ~20 osadnikow. Jeden osadnik = do ~19M wywolan hexDistance; 20 osadnikow = setki milionow operacji w jednej turze -> koniec tury trwa sekundy zamiast ulamkow. Nawet na mapie standardowej (20k heksow) to ~1.2M operacji na osadnika.

## 30. [WYSOKA → **SREDNIA** (korekta sceptyków)] mousemove: pelne currentVisible() przy kazdym zdarzeniu ruchu myszy z zaznaczona jednostka

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 8321 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Handler mousemove na canvasie (main.ts:8276) przy zaznaczonej jednostce gracza wola resolveMapUnitCursor z argumentem visibleHexes: currentVisible() (linia 8321) — pelne przeliczenie widocznosci imperium (jednostki x pole widzenia + miasta, tysiace insertow Set<string> + alokacje). Deduplikacja `k === hoverKey` (linia 8329) jest DOPIERO PO tym wywolaniu, wiec przesuwanie kursora w obrebie tego samego heksa tez placi pelna cene. Mousemove strzela z czestotliwoscia odswiezania (do ~120 Hz).
- **Scenariusz:** Srodek gry: 30 jednostek + 10 miast gracza (~4-5k operacji na currentVisible). Gracz zaznacza jednostke i prowadzi kursor przez mape: ~60-120 zdarzen mousemove/s x ~5k operacji = 300-600k operacji na stringach + duze alokacje Set co sekunde SAMEGO ruchu myszy -> spadek FPS i skoki GC dokladnie w momencie celowania ruchu; skaluje sie z rozmiarem imperium.

## 31. [WYSOKA] AI nigdy nie buduje budynków — komendy 'build' używają nazw, lookup idzie po id

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 11822 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Egzekucja AICmdBuild woła buildingProductionItem(cmd.buildingId), a cmd.buildingId to NAZWA z ai.ts (np. 'Mury', 'Koszary', 'Spichlerz', 'Targowisko' — ai.ts:705-764), podczas gdy findBuilding porównuje b.id ('mury', 'koszary', 'spichlerz', 'targowisko'). Wynik jest zawsze null → '[AI] Build no-op'. Dodatkowo 'Targowisko' nie przechodzi nawet bramki buildAllowed (nazwa w JSON to 'Targowisko (Rynek)'), 'Tartak'/'Huta' w ogóle nie istnieją w buildings.json, a jednostki 'Lucznik' (w danych 'Łucznik') i 'Osadnik' (brak takiej jednostki) też nie matchują — AI potrafi zakolejkować wyłącznie 'Wojownika'. Jedyna ścieżka zapisu do cityBuilt to applyProductionCompleted, a tryAutoEnqueueBuild wymaga budowaTryb='auto' ustawianego tylko z UI gracza — AI nie ma żadnej alternatywnej drogi.
- **Scenariusz:** Dowolna rozgrywka: miasta AI przez całą grę mają cityBuilt=[] (0 budynków w Power, brak Murów/maMur, brak Koszar → zero jednostek Brązu AI). Kaskada na handel E3: tradeRouteLimitForCity liczy budynki handlowe po obu stronach trasy, miasto obce bez Targowiska ma limit 0 → refreshTradeRoutes NIGDY nie utworzy żadnej trasy — cały system tras handlowych (dochód, +5% Handlu, overlay E7) jest martwy w realnej grze.

## 32. [WYSOKA] Upgrade Koszary→Akademia wojskowa odbiera miastu rekrutację jednostek Brązu

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/game/production.ts` (ok. linii 711 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Bramka 'jednostki epoki Brązu wymagają Koszar' sprawdza wyłącznie built.has('koszary') (to samo w availableReplacementsFor, linia 800). buildings.json:1320 definiuje akademia_wojskowa z upgradeFrom='koszary', a applyCompletedBuildingIds po ukończeniu upgrade USUWA 'koszary' z builtIds. Wzorzec z braz-access.cityHasPiecHutniczy (akceptuje odlewnia_zelaza jako upgrade odlewni brązu) i cityHasMurLine (mury||fort) nie został tu zastosowany — bramka nie zna następcy.
- **Scenariusz:** Gracz w epoce Żelaza bada 'Sztuka wojenna' i ulepsza Koszary do Akademii wojskowej (80 Pracy). Od następnego otwarcia panelu wszystkie jednostki epoki Brązu (Procarz, Topornik itd. — wciąż legalne w epoce Żelaza) znikają z listy rekrutacji tego miasta oraz z listy 'Zastąp', mimo że miasto ma budynek wojskowy wyższego rzędu. Drogie ulepszenie pogarsza możliwości miasta.

## 33. [WYSOKA] Bramki brązu/żelaza bez właściciela — kopalnia AI odblokowuje surowce gracza

- **Status:** 🔴 POTWIERDZONE 3/3 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 2293 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** placedImprovements to jedna globalna mapa dla wszystkich cywilizacji (AI dopisuje do niej swoje ulepszenia w egzekucji buildImprovement, main.ts:11865, a 'kopalnia' i 'kopalnia_miedzi' są w AI_IMPROVEMENT_PRIORITY, ai.ts:826-829). empireHasKopalniaMiedzi i empireHasKopalniaNaZlozuZelaza skanują całą tę mapę bez filtra właściciela/terytorium, wbrew dokumentacji zelazo-access.ts ('GDZIEKOLWIEK w imperium GRACZA') i braz-access.ts ('imperium — źródło miedzi'). Ten sam kontekst globalny trafia też do AI (main.ts:11333, 11806), więc przeciek działa w obie strony.
- **Scenariusz:** Gracz buduje tylko Piec hutniczy, nie stawiając żadnej kopalni miedzi. Dowolne AI stawia kopalnię miedzi na swoim terytorium (robi to rutynowo co turę z puli Pracy) → hasBrazAccess gracza zwraca true i miasto rekrutuje jednostki Brązu bez własnego źródła miedzi. Analogicznie kopalnia AI na złożu żelaza otwiera graczowi łańcuch żelaza — łamie decyzję właściciela o twardym AND (własna kopalnia + budynek).

## 34. [SREDNIA] buildEmpireFoodParams czyta klucze z top-level JSON zamiast z ekonomia_miasta

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/empire-food.ts` (ok. linii 61 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** buildEmpireFoodParams oczekuje raw.suwak_zywnosc_rozwoj_domyslnie / glod_wojska_hp_frac / armia_odklad_* / spichlerz_pojemnosc_zapasow_panstwa na najwyzszym poziomie obiektu, ale WSZYSTKIE call sites (main.ts:1877, 6065, 6071, 10884, 13216, 13411) przekazuja caly data.econParams (zagniezdzony JSON), a te klucze siedza w grupie ekonomia_miasta. Kazdy odczyt zwraca undefined -> zawsze fallbacki (0.08 / 0.5 / 1 / 100). Rozjazd kod<->dane: strojenie trudnosci w econ-params.json (easy 0.06/0.6/120, hard 0.10/0.4/80) nigdy nie dziala.
- **Scenariusz:** Gra na hard: atrycja glodu wojska powinna wynosic 10% maxHP/ture (glod_wojska_hp_frac.hard=0.1), odkladanie bez Spichlerza 40%, cap 80/Spichlerz — silnik uzywa 8% / 50% / 100, czyli wartosci ~normal. Analogicznie easy jest trudniejsze niz zaprojektowano.

## 35. [SREDNIA] Modyfikator zdrowia mnozy ujemna zywnosc; zdrowie <= -20 daje immunitet na glod

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/economy.ts` (ok. linii 767 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** populationGrowth liczy effectiveFlow = zywnoscNetto * max(0, 1 + zdrowie*0.05) bez rozroznienia znaku. Dla deficytu logika jest odwrocona: dodatnie zdrowie POWIEKSZA ubytek magazynu, ujemne zdrowie go zmniejsza, a przy zdrowie <= -20 modyfikator clampuje sie do 0 i deficyt jest calkowicie zerowany (miasto w glodzie nie traci ani magazynu, ani ludnosci).
- **Scenariusz:** Miasto A (zdrowie +6, modifier 1.3) z netto -10: magazyn spada o 13/ture. Miasto B (zdrowie -20, przeludnione) z tym samym netto -10: effectiveFlow = -10*0 = 0 -> magazyn i populacja nietkniete. Najbardziej chore miasto imperium jest jedynym odpornym na glod.

## 36. [SREDNIA] Utrzymanie budynkow nigdy nie naliczane: upkeepBalance zawsze dostaje pusta liste

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/turn-economy.ts` (ok. linii 1306 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** advanceCityEconomy wola upkeepBalance(income, [], ounits, ...) z komentarzem 'No buildings in runtime yet', ktory jest nieaktualny — ta sama funkcja dostaje builtByCity (cityBuilt z main.ts) i uzywa go do Spichlerza/Mennicy/konwerterow. W efekcie utrzymanieBudynki = 0 dla wszystkich wlascicieli na zawsze: parametr budynki.utrzymanie_budynek z econ-params.json oraz pola utrzymanie/przyrostUtrzymania w buildings.json to martwe dane, a saldo/deficyt (Spec s.6.4) liczy wylacznie jednostki. Zaden inny kod nie wola totalBuildingUpkeep.
- **Scenariusz:** Imperium z 5 miastami po ~8 budynkow (utrzymanie_budynek=1): powinno placic ~40 Pieniadza/ture utrzymania budynkow; skarbiec nie jest obciazany ani o 1 — budynki sa darmowe w utrzymaniu przez cala gre, co zawyza ekonomie kazdego wlasciciela i czyni flage deficyt niemiarodajna.

## 37. [SREDNIA] AI bada poza kolejnoscia: scoreTech nie stosuje Zasad 1/2 ani bramek budynku/ulepszenia

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/ai.ts` (ok. linii 404 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** scoreTech odrzuca tylko techy zbadane i z niespelnionymi prerekami (linie 410-414). Nie woła epochGateMet/epochTierGateMet (Zasada 1: cala epoka N przed N+1; Zasada 2: nizsze tiery epoki) ani researchGatesMet ('wymagany budynek'/'wymagane ulepszenie'). Gracz jest twardo gate'owany w playerState.availableTechs/setPlayerResearchTarget, AI nie — asymetria regul progresji, wprost wskazana w projekcie jako '3 zasady twardego gatingu'. allBuiltBuildings sluzy w scoreTech tylko do punktacji, nie do bramkowania.
- **Scenariusz:** AI ma zbadane tylko Obrobke drewna (1 tech epoki Kamien). chooseAIResearch moze zwrocic Zegluge (Braz, prereq tylko Obrobka drewna, bez Tartaku na mapie) albo Pismo bez wybudowanej Cegielni — AI dostaje Port/Galere/Biblioteke w 'epoce kamienia', podczas gdy gracz musi najpierw ukonczyc cala epoke Kamien i postawic budynki.

## 38. [SREDNIA] Cud świata może stanąć na Wybrzeżu (wodzie) — brak wykluczenia TerenBazowy.Wybrzeze

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/map/wonder-placement.ts` (ok. linii 33 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** isLandBuildable() odrzuca tylko Morze i Gory, a od ZADANIA 1 (2026-07-20, gen-helpers.ts ~2266) Wybrzeże jest konsekwentnie WODĄ (ruch/miasta/AI/wioski/złoża/render). pickWonderHexForCity sortuje kandydatów wyłącznie po (dist, q, r) — bez preferencji suchego lądu — więc heks Wybrzeża w dist=1 z mniejszym q wygrywa z lądem w tej samej odległości. Wywołanie w main.ts:1452 (completeWonderBuilt) nie dokłada żadnego filtra wody.
- **Scenariusz:** Miasto nadmorskie (typowe — pas Wybrzeża ma szerokość 2) kończy budowę cudu; wśród sąsiadów dist=1 heks Wybrzeża ma najmniejsze q -> model cudu zostaje postawiony na płytkiej wodzie i tak renderowany na mapie.

## 39. [SREDNIA] stopAmbience nie zatrzymuje zaplanowanych zrodel — toggle OFF->ON podwaja soundscape

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/audio/muzyka-antyczna.ts` (ok. linii 1782 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** stopAmbience() tylko wygasza gain busa i kasuje timer — AudioBufferSourceNode'y zaplanowane do LOOKAHEAD=2.6 s w przod (segmenty wiatru 11 s, liscie 9.5 s, wycie) graja dalej w wyciszony bus nawet ~13 s. startAmbience() natychmiast robi cancelScheduledValues + setValueAtTime(volCurve(ambVolume)) na TYM SAMYM busie (1767-1768) — resztki starej sceny wracaja na pelna glosnosc rownolegle z nowo zaplanowana scena (podwojny wiatr/ptaki do ~13 s). Ta sama dziura w druga strone: ambApplyBattleMute('mapa') (1848) rampuje gain w gore bez sprawdzenia ambPlaying — kanal WYLACZONY w trakcie bitwy staje sie znow slyszalny, jesli bitwa skonczy sie w oknie zycia resztek.
- **Scenariusz:** Menu pauzy: Odglosy natury OFF, po chwili ON -> przez kilkanascie sekund graja dwie nalozone warstwy wiatru/lisci na pelnej glosnosci. Wariant 2: OFF podczas bitwy, bitwa konczy sie <13 s pozniej -> setMood('mapa') podbija gain i 'wylaczone' odglosy slychac do wygasniecia resztek.

## 40. [SREDNIA → **NISKA** (korekta sceptyków)] Wyjscie do menu w trakcie bitwy nie resetuje ambBattleMuted — nowa gra z niema natura

- **Status:** 🟡 PRAWDOPODOBNE 1/2 — patrz werdykty
- **Plik:** `gra/src/main.ts` (ok. linii 7069 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** ambBattleMuted (muzyka-antyczna.ts:1710) jest zdejmowane WYLACZNIE przez setMood('mapa'). openStartupMainMenu() (7062-7071) oraz sciezka 'Rozpocznij nowa gre' z menu pauzy robia stopMusic()+stopAmbience()/startGameMusic() bez zadnego setMood — flaga przecieka do nastepnej sesji. startAmbience() celowo startuje wyciszony gdy ambBattleMuted (muzyka-antyczna.ts:1771), a pierwsze setMood('bitwa') w nowej grze trafia na guard idempotencji (shouldMute===ambBattleMuted -> return), wiec kanal odzywa dopiero po ZAKONCZENIU pierwszej bitwy nowej rozgrywki. Do tego czasu suwak/przelacznik w menu pauzy pokazuja WL., a natura milczy (setAmbienceVolume tez celowo nie rusza gain przy mute).
- **Scenariusz:** Bitwa polowa trwa (setMood('bitwa') -> ambBattleMuted=true) -> gracz otwiera menu pauzy z paska (onOpenMenu nie ma guardu bitwy) -> 'Przejdz do menu glownego' -> nowa gra -> startAmbience() startuje z gain 0.0001; wiatr/ptaki nieme przez caly poczatek rozgrywki mimo wlaczonego przelacznika, wracaja dopiero po pierwszej zakonczonej bitwie.

## 41. [SREDNIA] Wielka Kuznia (epokaWejscia=4) i Lazaret (epokaWejscia=5) niebudowalne — epoka konczy sie na 3

- **Status:** 🟡 PRAWDOPODOBNE 1/2 — patrz werdykty
- **Plik:** `gra/data/buildings.json` (ok. linii 933 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Awans epoki idzie wylacznie przez awansDoEpoki w tech.json (Brazownictwo->2, Hutnictwo zelaza->3); zadna technologia nie daje epoki 4+ (playerState.ts:418-422), wiec era gracza nigdy nie przekroczy 3. availableProduction odrzuca budynki epokaWejscia > epoka (production.ts:650). Tymczasem wielka_kuznia ma epokaWejscia=4 przy techUnlock='Obrobka zelaza' (aktywny tech tier 9), a lazaret (linia 1252-1255) epokaWejscia=5 przy techUnlock='Medycyna' (aktywny tech tier 8). Oba techy jawnie obiecuja te budynki w kolumnie 'Odblokowuje budynek' ('Wielka Kuznia; ...', 'Laznia publiczna; Lazaret'). W przeciwienstwie do cudow (wonders.json ma osobna sekcje parkowane_epoka4plus) buildings.json nie ma konwencji parkowania — to martwa bramka.
- **Scenariusz:** Gracz bada Obrobka zelaza — drzewko nauki pokazuje 'Odblokowuje: Wielka Kuznia'; posiada Kuznie zelaza (upgradeFrom spelnione). Wielka Kuznia nigdy nie pojawia sie na liscie produkcji, bo 4 > maksymalna era 3. Analogicznie Lazaret po Medycynie. Obiecany content nieosiagalny.

## 42. [SREDNIA] barbCamps nie jest ani zapisywane, ani resetowane przy wczytaniu zapisu

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 13576 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Tablica barbCamps (deklaracja 3498) jest zerowana w doStartGame (12760) i playtestach, ale restoreGameFromSave (13576-13805) ani sciezka loadGameFromSlot/regenerateWorldForLoad NIE dotykaja jej wcale; snapshot (10526-10604) nie ma pola obozow. Jednostki barbarzyncow (ownerId=-1) SA w zapisie (units), obozy nie.
- **Scenariusz:** (a) Swiezy boot -> wczytanie zapisu: wszystkie obozy znikaja (jednostki barbarzyncow zostaja bez obozow, tickCamps startuje od zera). (b) Gorsze: w trakcie gry A (obozy na mapie A) gracz wczytuje z pauzy zapis gry B o innym seedzie -> barbCamps trzyma wspolrzedne z mapy A; syncCampMeshes renderuje obozy na tych samych q,r nowej mapy (moze byc woda/terytorium gracza), a tickCamps spawnuje tam barbarzyncow.

## 43. [SREDNIA] cityRelig (religia miast) nigdy nie czyszczona i nie zapisywana — zombie przez kolizje id 'cityN'

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 1303 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Mapa cityRelig nie ma ani jednego wywolania clear() w calym pliku i nie jest w snapshotcie zapisu. Id miast to 'city'+cities.length (game/cities.ts:251), wiec koliduja miedzy rozgrywkami. resolvedCityReligion (1724-1726) uzywa domyslnego stanu TYLKO gdy brak wpisu. Analogicznie autoManageCities (3495) — czyszczone tylko w playtestach (13195/13387), nie w doStartGame ani przy load, i tez niezapisywane.
- **Scenariusz:** (a) Nowa gra po poprzedniej: miasto 'city2' nowej gry dziedziczy skumulowana wiare/wyznanie miasta 'city2' z poprzedniej rozgrywki -> zle haRel/porzadek od pierwszej tury; wlaczone auto-zarzadzanie z poprzedniej gry aplikuje sie do przypadkowego (nawet cudzego) miasta. (b) Zapis po wielu turach szerzenia religii -> restart przegladarki -> load: cala religia wraca do defaultow (utrata postepu, zmiana szczescia/porzadku miast).

## 44. [SREDNIA] aiSkarbiecByOwner czyszczone przy load bez odtworzenia — skarbce AI zeruja sie po wczytaniu

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 13741 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** restoreGameFromSave robi aiSkarbiecByOwner.clear() (13741), ale snapshot (10526-10604) nie zapisuje tej mapy — w przeciwienstwie do symetrycznej aiPracaPoolByOwner, ktora JEST zapisywana (10589) i odtwarzana (13658-13662). Skarbiec AI akumuluje sie co ture (11062-11067) i zasila handel walutowy/trybuty (6314-6317, 9559-9564).
- **Scenariusz:** AI po 50 turach ma np. 800 zlota w skarbcu -> gracz zapisuje i wczytuje -> skarbiec AI = 0. Oferty trybutu/handlu walutowego licza sie od zera; AI 'biednieje' przy kazdym wczytaniu — asymetria wzgledem gracza, ktorego skarbiec jest zapisywany i odtwarzany.

## 45. [SREDNIA] Koszyk dyplomacji: pozycja 'Zywnosc (spichlerz)' martwa — silnik nigdy nie podaje cityOptions

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/ui/diplomacyTradeBasket.ts` (ok. linii 176 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Formularz koszyka oferuje typ 'Zywnosc (spichlerz)', ale ctx.cityOptions nie jest nigdzie dostarczane przez silnik (jedyne zrodlo kontekstu: main.ts:6923-6929 getNegotiationContext — ustawia tylko rivalOptions/techOptions/oplaty granic). Select miast renderuje '— brak miast (SILNIK) —' z pusta wartoscia, a readItemFromForm (linia 314: !cityId -> null) zawsze zwraca null. Przycisk '+ Dodaj pozycje' po cichu nic nie robi — martwa bramka, ktora miala dzialac (transfer zywnosci jest zaimplementowany po stronie silnika w main.ts:3390-3399).
- **Scenariusz:** Gracz z kilkoma miastami otwiera Handel/Dar, wybiera typ 'Zywnosc (spichlerz)' — lista miast pokazuje '— brak miast (SILNIK) —', klik '+ Dodaj pozycje' nie dodaje nic i bez zadnego komunikatu. Funkcja handlu zywnoscia jest niedostepna mimo widocznej opcji w UI.

## 46. [SREDNIA] Prawo wojskowego przemarszu: odwrocona bramka Respektu (responder zamiast proponenta)

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/game/diplomacy-proposals.ts` (ok. linii 423 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Case 'granice' z borderMilitary odrzuca gdy ctx.responderRespekt < progGraniceWojskoweRespekt(55). Wg spec ('Respekt min dla prawa wojskowego przemarszu', wzorzec jak progWasalizacjaRespekt) to PROSZACY o przemarsz musi byc respektowany przez grantodawce — ctx.proposerRespekt. Ten sam wzorzec bledu co w 'wasal' (linia 455). Przez komplementarnosc udzialow: przemarsz dostaje tylko gracz SLABSZY (udzial <= 45), silny jest odrzucany.
- **Scenariusz:** Gracz z armia 2× wieksza (proposerRespekt ~67, responderRespekt ~33) prosi o prawo wojskowego przemarszu: 33 < 55 → 'Prawo wojskowe wymaga Respekt >= 55'. Slaby gracz (udzial 30) u silnego sasiada dostaje przemarsz od reki — dokladnie na odwrot niz zamierzona mechanika strachu.

## 47. [SREDNIA] Koszyk 'praca': AI nigdy nie traci pracy, a praca gracza trafia do skarbca zlota AI

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 3377 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** transferBasketItems dla typu 'praca' odejmuje pule tylko gdy fromOwnerId === 0 — gdy AI 'oddaje' prace (receiveItems gracza), nic nie jest debetowane (mint z powietrza), mimo ze istnieje dedykowana pula aiPracaPoolByOwner ('symetryczna do aiSkarbiecByOwner', komentarz linia 3068). Gdy gracz oddaje prace AI, kwota jest ksiegowana do aiSkarbiecByOwner (ZLOTO, linia 3386) zamiast do aiPracaPoolByOwner — konwersja praca→¤ 1:1 do zlego zasobu.
- **Scenariusz:** Gracz kupuje od AI 200 Pracy za 200¤ (Rel 100): AI dostaje realne 200¤, ale swojej puli pracy nie traci — 200 Pracy powstaje z niczego. W druga strone: gracz oddaje 200 Pracy → AI dostaje +200 do skarbca ZLOTA (finansuje z tego trybuty/oceny sily ekonomicznej), pula pracy AI nietknieta. W polaczeniu z kursem Rel/100 wzmacnia pompe ¤↔Praca↔¤.

## 48. [SREDNIA] Moc wyeliminowanej cywilizacji liczona podwojnie w mianowniku dominacji (jednostki-sieroty)

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 12012 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Przy eliminacji zwyciezca dostaje trwaly snapshot CALEGO Power pokonanego (zdobyczePower, 9820-9822) liczony gdy jednostki polowe pokonanego jeszcze zyja, a eliminateOwner celowo NIE usuwa jednostek z mapy (komentarz Q5=B, 9722). Victory check buduje allOwners z `units` (12012: kazdy ownerId>=0), wiec wyeliminowany owner z sierotami nadal wchodzi do potegiWszystkich z power = wartosc armii sierot — ta sama armia siedzi juz w zdobyczach zwyciezcy. Dodatkowo allPowerOwnerIds (5666-5671) trzyma wyeliminowanych przez niepruningowane aiStartHexes — martwa cywilizacja zostaje na zawsze w rankingu Mocy HUD (etykieta z fallbackiem 'grecy', bo aiOwnerCivMap wyczyszczone).
- **Scenariusz:** Gracz w epoce Zelaza eliminuje duzego rywala AI, ktory mial silna armie w polu. Suma potegiWszystkich zawiera te armie dwa razy (raz jako zdobycze gracza, raz jako power ownera-widma), przez co powerShare gracza spada ponizej progu 0.5 i zwyciestwo dominacyjne nie odpala, mimo ze wedlug decyzji Power-zdobycze ta moc nalezy juz do gracza.

## 49. [SREDNIA] Petla porzadku/szczescia liczy miasta AI epoka i technologiami GRACZA

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 11178 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** W petli `for (const city of cities)` (11111) dla KAZDEGO miasta — takze AI — poziom budynkow do zadowolenia liczy sie z `player.era` i `player.zbadane` (11178: buildingLevelForEpoch(..., player.era, ..., player.zbadane)), a evaluateOrderFromBreakdown dostaje `era: player.era` (11192). Infrastruktura per-owner istnieje i jest uzywana obok: advanceCityEconomy dostaje empireEpochForOwner i unlockedTechSetForOwner (10874), ownerEraByOwner/aiResearchDone sa prowadzone.
- **Scenariusz:** AI awansuje do Zelaza, gracz zostaje w Kamieniu: budynki w miastach AI (swiatynia, ratusz itd.) sa wyceniane na poziomie epoki gracza — zanizone zadowolenie/porzadek AI, zle mnozniki plonow (orderMultMap) i wzrostu (growthMultMap) zastosowane do ekonomii AI w nastepnej turze. Symetrycznie zawyzone, gdy to gracz jest w wyzszej epoce.

## 50. [SREDNIA] Machiny konsumowane PRZED potwierdzeniem szturmu — anulowanie preBattle je traci

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 10090 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** launchSiegeStormFromMap woła appendReadyMachinesToRoster (10090-10094) jeszcze przed pokazaniem okna preBattle; funkcja przez consumeReadyMachines (siegeMachines.ts:57-64) czyści city.siegeMachines.ready. Gałąź onCancel (10232-10236) wraca do panelu oblężenia, ale skonsumowanych machin nigdzie nie odkłada z powrotem. Machiny (Taran/Wieża) budowane przez kilka tur znikają bez walki.
- **Scenariusz:** Gracz w T2 czeka 3 tury na Taran, klika Szturm, w preBattle widzi złe szanse i wybiera Anuluj. Taran zniknął z 'gotowe' (panel pokazuje 'gotowe: —'); kolejny szturm idzie bez machiny, a kolejkowanie i czekanie trzeba zaczynać od zera.

## 51. [SREDNIA] Machiny wnoszą ZERO do mocy auto-szturmu (rola Oblężnicza → M=0); siegePower() martwe

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 10041 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Auto-szturm liczy mAtk przez rosterFieldPowerM → sumRosterFieldM → isFieldBattleUnit, które odrzuca jednostki z 'Rola (linia)' = 'Oblężnicza' (auto-battle-power.ts:41, unit-power.ts:85-87). Taran (Health 2800) i Wieża (3600) dołączone do rosteru w appendReadyMachinesToRoster (10022/10090) nie zmieniają mAtk ani o 0.1, a mDef dalej dostaje pełne ×3 za mur (structBonus 200%). Funkcja siegePower() (unit-power.ts:112) z wallAttack — jedyna uwzględniająca machiny przy umocnieniach — nie ma żadnego wywołania w kodzie. Logika AI T2 'buduj machiny, szturmuj gdy gotowe' (siegeAi.ts) opóźnia szturm o tury dla zerowej korzyści w cichym auto-rozstrzygnięciu.
- **Scenariusz:** AI w T2 czeka 3 tury na Taran, potem executeSilentSiegeStorm: resolveAutoBattleByPower dostaje identyczne mAtk/mDef jak w turze 1 bez machin — wynik szturmu ten sam, a czekanie tylko dało obrońcy czas. W bitwie ręcznej 3D machiny działają (2800 HP tank), więc auto i ręczna dają systematycznie sprzeczne wyniki dla tego samego składu.

## 52. [SREDNIA] AI ocenia siłę oblężenia na PEŁNYM HP — runtimeUnitToSiegeUnit ignoruje u.hp

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 5527 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** runtimeUnitToSiegeUnit ustawia `Health: unitHealth(def)` (max HP z units.json) zamiast bieżącego u.hp jednostki. estimateUnitCombatStrength (siegeAi.ts:81-89) jawnie deklaruje 'scaled by current HP fraction' i mnoży siłę przez Health/hpBase — z max HP skala jest zawsze pełna. decideAISiegeStance klasyfikuje więc tier T1/T2/T3/retreat tak, jakby obie strony były nietknięte.
- **Scenariusz:** Armia AI po krwawej bitwie ma jednostki na 10-20% HP i stoi pod miastem: ratio liczone z pełnych HP daje T1 (≥180%) → natychmiastowy szturm, choć realna siła to ułamek progu i decyzja powinna być retreat. Odwrotnie: wykrwawiony garnizon nie obniża defenderStrength, więc AI potrafi odstąpić (unsafe) od miasta bronionego przez niedobitki.

## 53. [SREDNIA] Szanse preBattle z Milicją liczone na fallbacku 'wojownika', wynik na realnej Milicji

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/battle/mapFieldBattle.ts` (ok. linii 219 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** planOpenCityFieldBattle liczy szanse (preBattleSzanseAtkPct, linia 219) używając deps.unitDefFor dla syntetycznego id 'militia-<city>' ZANIM launchFieldBattleFromMap zarejestruje militiaDefs (registerMilitiaDef, linie 295-299). unitDefFor bez wpisu w militiaDefOverrides spada na lookupUnitDef('Milicja') → syntetyczny rekord wojownika (meleeAttack 5, health 30; main.ts:8820-8837), a nie pulę Milicji o Health = 0.2·pop·17·0.5. Auto-rozstrzygnięcie (doAutoResolve) działa już PO rejestracji na realnych statach. Dodatkowo wpis 'militia-<city>' nigdy nie jest usuwany z militiaDefOverrides, więc kolejne bitwy o to samo miasto liczą plan na przestarzałej populacji.
- **Scenariusz:** Miasto bez muru, pop 100, bez wojska, z garnizonem: preBattle liczy mDef z rekordu 30 HP (M≈32) i pokazuje graczowi np. 85% szans, po czym Auto walczy z Milicją o Health 170 (M≈92) — realne szanse ~50%. Gracz podejmuje decyzję o ataku na podstawie zawyżonej prognozy.

## 54. [SREDNIA] Negacja szarży po substringu NAZWY zamiast pola Typ — elitarni włócznicy nie brakują

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/game/combat.ts` (ok. linii 539 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** negatesCharge sprawdza typNazwa (nazwę wyświetlaną) pod kątem 'wlocznik/falanga/impi', mimo że dane definiują typ przeciw-szarżowy w polu 'Typ' (Spearman/Falangite), używanym już w kontrach. Jednostki typu Spearman bez tych słów w nazwie — m.in. Triari, Wojownik szekelesz, Strażnik bram Harappy, Piechota hetycka, iButho z iklwa — nigdy nie negują Uderzenia atakującego w resolveCombat, choć to formacje włóczniane; dostają kontrę +50% vs Mount, ale bonus szarży kawalerii wchodzi im w hit i dmg R1 w całości.
- **Scenariusz:** Konnica (wysoki chargeBonus) szarżuje na stojących Triari: defBracing=false (nazwa nie zawiera 'wlocznik'), więc R1 dostaje pełny bonus szarży do trafienia i obrażeń — podczas gdy zwykły Włócznik o słabszych statach tę samą szarżę neguje. Odwrócona względem danych hierarchia jednostek przeciw-kawaleryjskich.

## 55. [SREDNIA] Odbite miasto rebeliantow na zawsze zachowuje rebelState=true (stan nigdy nie czyszczony)

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/game/post-battle-map.ts` (ok. linii 341 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** applyCityCaptureAfterBattle (linia 341) i resolveSiegeSurrender (main.ts 5260) ustawiaja tylko ownerId; pole city.rebelState nie jest NIGDZIE ustawiane na false (jedyny zapis to true w main.ts 11242). Po odbiciu miasta z rak rebeliantow: (a) panel porzadku na stale pokazuje stan rebelii (orderPanel czyta rebelState), (b) miasto ma wieczny immunitet na kolejny bunt (warunek !city.rebelState w main.ts 11241), (c) blokowana jest tez migracja buntownicza (warunek !city.rebelState w 11258) — trwala korupcja stanu spoleczenstwa miasta.
- **Scenariusz:** Miasto gracza buntuje sie, gracz je odbija. Od tej tury do konca gry panel miasta raportuje rebelie mimo normalnego porzadku, a mechanika buntu nigdy juz tego miasta nie dotknie, niezaleznie od porzadku/szczescia.

## 56. [SREDNIA] findNearestVillage: alokacja Object.keys(320k) + pelny skan mapy per jednostka wojskowa AI

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/game/ai.ts` (ok. linii 1521 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** findNearestVillage woła Object.keys(map.hexes) (alokacja tablicy ~320k stringow na superogromnej mapie) i skanuje kazdy heks szukajac wolnej wioski — per jednostka wojskowa, ktora dojdzie do priorytetu 4d (linia 1221), per panstwo AI, per tura. Do 4d wpadaja jednostki, ktorym firstStep zwrocil null (typowo: wrogie miasto nieosiagalne — patrz znalezisko computePath). Brak cache listy wiosek (mozna ja trzymac w Set aktualizowanym przy zajeciu wioski) i brak wczesnego wyjscia, gdy wolnych wiosek juz nie ma — w poznej grze skan ZAWSZE zwraca null i jest czystym marnotrawstwem.
- **Scenariusz:** Pozna gra na superogromnej mapie, wszystkie wioski zajete, panstwo AI odciete od wrogich miast (inny kontynent): kazda z jego np. 20 jednostek co ture alokuje tablice 320k stringow i skanuje 320k heksow na darmo = 6.4M iteracji + duze przelotne alokacje na panstwo na ture -> dlugi koniec tury + skoki GC. Po x2 jednostek koszt podwojony.

## 57. [SREDNIA] syncVillageMeshes: skan WSZYSTKICH heksow mapy przy kazdym refreshFog

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 1227 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** syncVillageMeshes robi for..in po calym map.hexes (linia 1227) przy KAZDYM wywolaniu refreshFog (wpiete jako 'centralny hook po kazdej zmianie stanu', main.ts:3651) — czyli po kazdym zakonczeniu animacji ruchu, zdobyciu miasta, koncu tury itd. Dla heksow z wioska dodatkowo cities.some O(miasta) per heks. Wioski powstaja tylko przy generacji mapy — zbior heksow z wioska mozna policzyc RAZ po wygenerowaniu mapy i iterowac tylko po nim (tak jak syncCampMeshes iteruje barbCamps), zamiast skanowac ~320k wpisow za kazdym razem.
- **Scenariusz:** Superogromna mapa (319 872 heksow): kazdy pojedynczy ruch jednostki gracza -> refreshFog -> 320k iteracji petli z odczytami wlasciwosci (~2-4 ms). Marsz wielosegmentowy 10 jednostek + refreshFogi konca tury = ~15-30 wywolan na ture = 5-10M zbednych iteracji, zauwazalne przyciecia przy kazdym ruchu na duzych mapach.

## 58. [SREDNIA] Spawn z produkcji/rekrutacji czyta pole 'Super' zamiast 'Super-jednostka'

- **Status:** 🔴 POTWIERDZONE 2/2 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 1532 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** applyProductionCompleted (linia 1532), spawn z wioski (8122) i spawn ukończonej rekrutacji (11391) liczą isSuper = normFieldVal(def['Super'], 0) === 1, ale w units.json pole nazywa się 'Super-jednostka' (wartość 'TAK'/'—') — def['Super'] jest zawsze undefined, więc isSuper jest zawsze false. Pozostałe ścieżki (units/setup.ts:164, performUnitReplace main.ts:2402, diplomacy-unit-transfer.ts:57) używają poprawnego pola — niespójność w obrębie tego samego runtime'u.
- **Scenariusz:** Gracz rekrutuje jednostkę super (Super-jednostka='TAK', np. zamiennik nacji klasy Super). Po zejściu z kolejki rekrutacji dostaje category z dopasowania nazwy zamiast 'super' — renderer nie użyje buildSuperUnit (generyczny model), a każda logika po category==='super' widzi ją inaczej niż identyczną jednostkę otrzymaną z transferu dyplomatycznego lub przez 'Zastąp'.

## 59. [NISKA] Efekt 2 (Praca->Pieniadz) liczy inne doPuli niz realna pula: brak kar Porzadku

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/economy.ts` (ok. linii 697 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** cityYieldPerTurn liczy pieniadzZPracy z wewnetrznego doPuli = floor(floor(pracaNetto)*(1-pct)), a realna pula w turn-economy powstaje ze splitPraca (production.ts:1193: doPuli = round(praca) - round(praca*u)) wolanego PO applyOrderYieldMults (turn-economy.ts:1076, 1104). Dwa rozjazdy: (a) kara produkcji z niepokojow (orderMult.productionMult < 1) obniza prace i pule, ale pieniadzZPracy pozostaje policzony od pelnej pracy sprzed kary; (b) floor vs round daje inne doPuli dla tych samych wejsc.
- **Scenariusz:** (a) Miasto z Targowiskiem+Waluta, praca 20, suwak 50%, niepokoje productionMult=0.5: pula dostaje 5 pracy, ale gracz inkasuje pieniadzZPracy = floor(10*2) = 20 — kara Porzadku nie dotyka konwersji Praca->Pieniadz. (b) praca 7, procentBudynki 30%: konwersja liczy doPuli=4 (floor 4.9), a do puli globalnej trafia 5 (round) — inna baza w panelu niz w zasileniu puli.

## 60. [NISKA] Awans epoki z nagrody wioski pomija setEra i rebuildResourceOverlays

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/main.ts` (ok. linii 8102 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Sciezka nagrody 'tech' z wioski (researchStep po player.nauka += amount) obsluguje tylko toast. Sciezka konca tury (main.ts:11083-11088) przy step.completed.some(awansEpoki) dodatkowo ustawia overlayDepositEra=player.era, wola rebuildResourceOverlays() i setEra(player.era) (muzyka/naklady zloz miedzi-zelaza). Jesli tech-kamien milowy dopnie sie wlasnie w evencie wioski, te efekty uboczne nie wykonuja sie ani wtedy, ani pozniej (kolejny awansEpoki to dopiero nastepny kamien milowy).
- **Scenariusz:** Gracz bada Brazownictwo (postep 40/45), wchodzi na heks wioski, losuje nagrode 'tech' (+15 nauki) -> researchStep konczy Brazownictwo, player.era=2, ale overlayDepositEra zostaje 1: zloza epoki Brazu niewidoczne na overlayach, muzyka/era-motyw bez zmiany — do wczytania zapisu albo nastepnego kamienia milowego (Hutnictwo).

## 61. [NISKA] Parytet prerekow: playerState akceptuje tylko em-dash, research.ts takze '-', '–', 'brak', 'none'

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/game/playerState.ts` (ok. linii 159 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Zdublowany parser prerekow rozjezdza sie: research.ts BRAK_PREREQ = {'', '-', '—', '–', 'brak', 'none'} (linie 133, 334-342, filtrowane tez per-czlon), playerState.parsePrereqs uznaje wylacznie '' i '—' (NO_PREREQ, linia 71), ai.ts parsePrereqs (linia 389) ma trzecia wariante ('-', '—', '–', 'brak', bez 'none'). Dane dzis uzywaja wylacznie '—', wiec bez zywego efektu — ale to dokladnie ta zdublowana logika, ktora 'MUSI pozostac zgodna' (komentarz playerState.ts:175); pierwszy wpis z '-' w tech.json przechodzi walidacje validateTechGraph i UI, a wywraca runtime gracza.
- **Scenariusz:** Edycja tech.json: nowy tech z 'Wymaga (prereq)': '-' -> validateTechGraph OK, research.ts traktuje jako brak prereq, ale playerState.prereqsMet szuka techu o nazwie '-' -> availableTechs/targetAllowed/setPlayerResearchTarget zwracaja false; tech na stale nieosiagalny dla gracza mimo poprawnego wygladu w drzewku.

## 62. [NISKA] Martwa bramka pangei: identyczne gałęzie if/else — jeziora śródlądowe zawsze kasowane

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/map/generator.ts` (ok. linii 283 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Linie 283-287: obie gałęzie (typ !== 'pangea' i else) wywołują to samo purgeInlandWaterForMultiLandTyp — funkcję opisaną jako 'kontynenty/wyspy (nie pangea)'. Późniejsze wywołania w liniach 315, 334, 363 są już bezwarunkowe, więc wyjątki dla pangei w liniach 295-297 i 301-303 też nic nie robią. Cała maszyneria zachowywania większych zbiorników (coastOpts maxInlandPoolSize=24 dla pangei, 8 dla kontynentów; removeSmallInlandWaterPools zostawia baseny > maxPoolSize; trimEnclosedOceanOnly w linii 248 od razu je kasuje) jest martwa — żadne jezioro/morze śródlądowe nie przetrwa generacji na żadnym typie mapy.
- **Scenariusz:** generujSwiat(seed, rozmiar, 'pangea') -> szum tworzy morze śródlądowe ~30 hexów, removeInlandSeaPools/purge zamieniają je w Łąkę mimo maxInlandPoolSize=24 -> finalna pangea nigdy nie ma jezior, choć parametry i komentarze pipeline'u wprost je chronią.

## 63. [NISKA] Scoring startu: góry w dystansie 4 nigdy nie punktowane (warunek dist<=4 martwy)

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/map/startScoring.ts` (ok. linii 80 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Docstring i komentarz (Maciej 2026-06-27) mówią o 'górach w dystansie 2-4', a warunek w linii 87 to dist >= 2 && dist <= 4. Jednak pętla iteruje tylko dq,dr w [-3,3] i linia 80 odrzuca dist > 3, więc gałąź dla dist=4 jest nieosiągalna — bonus +3 za Góry i +1.5 za Wzgórza działa realnie tylko w promieniu 2-3.
- **Scenariusz:** Dwa heksy kandydackie o identycznym score: jeden ma pasmo gór w odległości 4 (zamierzony bonus +3/górę), drugi nie -> oba dostają ten sam wynik i findBestPlayerStartHex może wybrać gorszy start wbrew udokumentowanej regule.

## 64. [NISKA] Martwe reguły złóż w JSON: owce/bydlo/lama/luksus nie istnieją w kodzie generatora

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/data/map-gen-params.json` (ok. linii 99 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** deposit_rules zawiera owce (0.14), bydlo (0.12), lama (0.06), luksus (0.06), ale BASE_DEPOSIT_RULES w gen-helpers.ts (linie 6265-6310) po decyzji Model B (Maciej 2026-07-09: hodowla = ulepszenie, nie złoże) nie ma tych reguł, a lama/luksus nigdy nie miały. mapGenAllDepositRarities() wczytuje te rarities, lecz DEPOSIT_RULES mapuje wyłącznie po istniejących regułach — wpisy są ignorowane po cichu. Rozjazd kod<->dane: panel Excel/JSON sugeruje strojenie parametrów, które nie mają żadnego efektu.
- **Scenariusz:** Właściciel zmienia rarity 'owce' 0.14 -> 0.30 w panelu Excel i eksportuje do map-gen-params.json -> generacja mapy identyczna (zero złóż owiec), bez ostrzeżenia, że reguła nie istnieje w kodzie.

## 65. [NISKA] onError ignoruje blad elementu wchodzacego podczas crossfade — playlista moze zamilknac na stale

- **Status:** ✅ NAPRAWIONE (6adfb79)
- **Plik:** `gra/src/audio/filePlayer.ts` (ok. linii 280 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Guard 'if (!playing || idx !== activeIdx) return' odrzuca zdarzenie 'error' elementu docelowego crossfade'u (idx===toIdx, a activeIdx to jeszcze fromIdx az do konca przenikania). Zepsuty utwor nie zostaje pominiety; crossfadeStep dobiega konca, pauzuje sprawny element, ustawia activeIdx=toIdx i crossfading=false. Aktywny element jest martwy: duration NaN/currentTime zamrozone -> monitorTick wiecznie wraca na Number.isFinite (338), 'ended' nigdy nie nadejdzie -> playlista cicha do stop()/start(). Sciezka onError istnieje wlasnie na wypadek uszkodzonego pliku, ale zawodzi dokladnie w oknie 1,5 s crossfade'u, w ktorym blad dekodowania najpewniej by wystapil (src ustawiany na starcie przenikania).
- **Scenariusz:** Jeden z mp3 w bundlu uszkodzony (bledny data: URI po buildzie) -> przy przejsciu NA ten utwor 'error' pada w trakcie crossfade -> selectNext nie zostaje wywolane -> po zakonczeniu przenikania muzyka kamienia/intro milknie na stale.

## 66. [NISKA] Tech-kamien milowy z handlu dyplomatycznego nie awansuje epoki gracza

- **Status:** 🔴 POTWIERDZONE 1/1 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 3417 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Case 'tech' koszyka transferu dla toOwnerId===0 robi wylacznie player.zbadane.add(t) — bez awansu ery. syncOwnerEraFromResearch jawnie pomija ownera 0 (main.ts:811 'if (ownerId === 0) return false'), a playerState.researchStep ustawia state.era tylko przy WLASNYM ukonczeniu techu (linia 422); tech juz obecny w zbadane nigdy nie zostanie ukonczony ponownie. Dla AI ten sam case robi syncOwnerEraFromResearch (3426) — dziala tylko w druga strone. Desync: zbadane mowi 'Braz', player.era mowi 'Kamien'.
- **Scenariusz:** Gracz w epoce Kamien kupuje od AI Brazownictwo w dyplomacji -> player.zbadane zawiera tech awansDoEpoki=2, ale player.era==1. Skutki: bramka epoki otwiera techy Brazu, ale zwyciestwo dominacji (graczEra<ostatniaEpoka), zamiana barbarzyncow na Ludy Morza (main.ts:11924 'player.era === 2'), overlayDepositEra i render miast dalej traktuja gracza jak epoke 1 — az do wlasnorecznego zbadania Hutnictwa zelaza (skok ery 1->3).

## 67. [NISKA] Procarz (Huaracoc) ma Typ=Distance, choc zastepuje Procarza o Typ=Slinger

- **Status:** 🔴 POTWIERDZONE 1/1 — DO NAPRAWY
- **Plik:** `gra/data/units.json` (ok. linii 1179 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Bazowy Procarz ma Typ='Slinger' (jedyna taka jednostka), a inkaski zamiennik Procarz (Huaracoc), ktory przez 'W zamian za'='Procarz' CHOWA jednostke bazowa dla Inkow, ma Typ='Distance'. W counters.json relacje 'Slinger -> Spearman +50% Atak' i 'Mount -> Slinger +50%' dzialaja po polu Typ (counterMultiplier, combat.ts:368-392). Zamiennik traci wiec caly profil counterowy procarza: nie dostaje +50% na wlocznikow.
- **Scenariusz:** Gracz Inkow atakuje Huaracokiem Wlocznika: mnoznik counter 1.0 zamiast 1.5, ktore mialby kazdy bazowy Procarz w tej samej sytuacji — jedyna nacja z procarzem-zamiennikiem gra nim gorzej ni bazowa jednostka, ktora jej zastapiono.

## 68. [NISKA] CameraController tworzony bez dispose() poprzedniego — akumulacja listenerow na canvas/window

- **Status:** 🔴 POTWIERDZONE 1/1 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 12699 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** CameraController ma metode dispose() zdejmujaca listenery mousedown/wheel z canvas oraz mousemove/mouseup/keydown/keyup z window (render/camera.ts:152-158), ale zaden z 5 punktow odtworzenia kontrolera (12616 rebuild przy load, 12699 doStartGame, 12926/13145/13330 playtesty) nie wola camCtrl.dispose() przed podmiana. Canvas jest wspoldzielony miedzy grami, wiec stare handlery zostaja aktywne.
- **Scenariusz:** Gracz w jednej sesji robi kilka razy 'Nowa gra'/wczytanie: po N restartach kazde krecenie kolkiem i kazdy keydown przechodzi przez N martwych kontrolerow (aktualizujacych osierocone kamery), stary graf obiektow trzymany przez domkniecia — narastajacy koszt CPU obslugi inputu i wyciek pamieci w dlugiej sesji.

## 69. [NISKA] Menu pauzy: 'Wczytaj gre' pozostaje zablokowane po pierwszym zapisie w tej sesji menu

- **Status:** 🔴 POTWIERDZONE 1/1 — DO NAPRAWY
- **Plik:** `gra/src/ui/gamePauseMenu.ts` (ok. linii 109 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** hasSave jest liczone raz przy showGamePauseMenu (linia 109) i wpieka disabled w przycisk 'Wczytaj gre' (linia 142) oraz w domkniecie handlera load (linia 191: if (!hasSave) return). Klik 'Zapisz gre' (onSave -> openSaveGameDialog w main.ts:7104) nie zamyka menu pauzy ani nie odswieza stanu — po udanym zapisie przycisk wczytywania dalej jest disabled z tooltipem 'Brak zapisu' az do zamkniecia i ponownego otwarcia menu.
- **Scenariusz:** Swieza gra bez zadnego sejwa: Esc -> menu pauzy ('Wczytaj gre' disabled) -> 'Zapisz gre' -> zapis OK (toast) -> dialog znika, menu pauzy nadal otwarte: 'Wczytaj gre' wciaz zablokowane mimo istniejacego zapisu.

## 70. [NISKA] Panel miasta pokazuje wplyw religii na szczescie bez bramki swiatyni — rozjazd z silnikiem

- **Status:** 🔴 POTWIERDZONE 1/1 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 2661 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** getReligionState (panel miasta) liczy `wplywSzczescie: religionHappiness(rel, ownRel, rp)` bez 4. argumentu hasSwiatynia, podczas gdy petla tury liczy z bramka (11133: religionHappiness(..., builtIds.includes('swiatynia'))). Wg decyzji D16/D18-2=A kara za brak dominujacej religii obowiazuje TYLKO ze swiatynia — panel tego nie odwzorowuje.
- **Scenariusz:** Miasto ze swiatynia i mieszanym skladem wyznaniowym (status 'mixed'): silnik co ture nalicza kare religia_kara_brak_religii (normal -1) do szczescia, a panel miasta pokazuje wplyw religii = 0 — gracz nie widzi zrodla spadku porzadku.

## 71. [NISKA] assignAiCivTypes: nadmiarowi AI dostaja identyczny typ spoza wylosowanej puli aktywnych

- **Status:** 🔴 POTWIERDZONE 1/1 — DO NAPRAWY
- **Plik:** `gra/src/game/civ-roster.ts` (ok. linii 102 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Gdy liczba AI przekracza liczbe typow w aktywnej puli, kazdy nadmiarowy owner dostaje ten sam fallback `allCivIds.find(id => id !== playerCivId)` — pierwsza cywilizacje wg kolejnosci pliku civs.json, ktora zwykle NIE nalezy do wylosowanej puli aktywnych typow (pula jest tasowana seedem). Lamie to cap unikalnych typow (aktywneTypy 3/5/7/9) i klonuje jeden typ na wszystkich nadmiarowych AI zamiast cyklicznie rozdac typy z puli (shuffledAi[idx % len]).
- **Scenariusz:** Naprawa rosteru po wczytaniu legacy sejwu (repairAiRosterFromMap / restoreAiRosterFromSave) z 6 brakujacymi ownerami przy aktywneTypy=3: AI #3-#6 wszyscy dostaja te sama pierwsza cywilizacje z pliku (typ 4. na mapie mimo capu 3), z jej bonusami macierzy i religia.

## 72. [NISKA] Śmierć z głodu usuwa jednostki bez sprzątania oblężenia i sync garnizonu

- **Status:** 🔴 POTWIERDZONE 1/1 — DO NAPRAWY
- **Plik:** `gra/src/main.ts` (ok. linii 10897 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** Pętla usuwająca jednostki zabite głodem (main.ts:10897-10900) robi gołe units.splice, podczas gdy disbandPlayerUnit (2214-2234) dla tej samej operacji sprawdza oblegaCityId → endMapSiege gdy padł ostatni oblegający, oraz syncGarnizonForCity gdy jednostka była w garnizonie. Po głodzie: city.garnizon zostaje zawyżony (martwe jednostki dalej wliczone do ostatniego syncu), a oblężenie prowadzone przez wygłodzoną armię wisi do najbliższego validateActiveSieges (wywoływane dopiero w skanie po turze AI).
- **Scenariusz:** Garnizon gracza (2 jednostki inGarnizon) umiera z głodu wojska: city.garnizon zostaje 2. Gdy AI szturmuje, hasCityDefenders zwraca true przez licznik, a collectSiegeDefRoster przy braku jednostek dist≤1 i garnizon>0 wystawia syntetyczną Milicję — miasto faktycznie bez garnizonu broni się Milicją, którą reguła C3-ST-1 ('populacja bez garnizonu ≠ obrońcy') miała wykluczyć.

## 73. [NISKA] _removeStatChip dispose'uje teksture wspoldzielona z statTexCache; cache serwuje martwe tekstury

- **Status:** 🔴 POTWIERDZONE 1/1 — DO NAPRAWY
- **Plik:** `gra/src/render/cities.ts` (ok. linii 585 — NIEAKTUALNE; aktualne linie w werdyktach)
- **Opis:** makeCityMapBadgeSprite (render/cityMapStatChip.ts:119-124) trzyma CanvasTexture w cache (statTexCache) i WSPOLDZIELI ja miedzy sprite'ami o tym samym kluczu nazwa|populacja. _removeStatChip (render/cities.ts:585) przy chowaniu chipa (miasto znika we mgle, zmiana populacji, panel miasta) woła map.dispose() na tej wspoldzielonej teksturze, ale NIE usuwa jej z cache. Kazde ponowne pokazanie chipa pobiera z cache dispose'owana teksture -> three.js musi ja ponownie wgrac na GPU (re-upload calego canvasa) przy kazdym cyklu schowaj/pokaz. Gdy dwa miasta maja ten sam klucz (miasta-siostry tego samego typu cywilizacji moga miec te sama nazwe i populacje), dispose tekstury uzywanej przez ZYWY sprite drugiego miasta wymusza re-upload takze u niego.
- **Scenariusz:** Fog on, 60 obcych miast wchodzacych/wychodzacych z pola widzenia podczas ruchow: kazde przejscie widoczne->ukryte->widoczne = dispose + pelny re-upload tekstury badge na GPU zamiast reuse z cache. Przy czestych refreshFog (kazdy ruch) staly churn transferow GPU; wizualnie samonaprawialne (three.js wgrywa ponownie), wiec latwe do przeoczenia, ale niweczy caly sens statTexCache.

