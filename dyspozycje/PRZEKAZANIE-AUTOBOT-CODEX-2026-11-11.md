# Przekazanie AutoBot Codex — 2026-11-11

## NAJNOWSZA AKTUALIZACJA — nadrzędna wobec wcześniejszej migawki poniżej

FALA619 już opublikowana i wypchnięta: `186d0f03b`, MD5 `722419d02dcdf72408dffe4374bb1e73`. FreshGit readback bundle/manifest/START byte-identical PASS, audio HTTP present/absent PASS. Mury i wezwania sojusznicze zakończone11/11; receipts90-release-619.json w obu runach. Wcześniejsza sekcja „Budowana FALA619” jest historią i NIE oznacza trwającej publikacji.

Bieżące cztery aktywne tematy: (1) konnica/Żelazo,6/11, `codex/cavalry-iron` najnowszy `cdaac71277`, niezależny `cavalry_iron_evaluator`; (2) limity i podsumowanie rekrutacji,6/11, `codex/recruit-affordability` `0b6107782`, niezależny `recruit_affordability_evaluator`; (3) martwe jednostki Q2,1/11, `dead_unit_regression_operator`; (4) globalna zamiana typów piechoty,1/11, `melee_replacement_operator`. Nowi operatorzy mają natychmiast zapisywać postępy na swoich gałęziach.

Starszy zapasbrązu i bilansPracy są audytami bez potwierdzonego błędu/bez danych żywej partii, nie aktywnymi operatorami. Administrator nadal czeka na decyzję. Kolejka pozostałych zgłoszeń zachowana; poniższa lista oczekujących zawiera dwa właśnie uruchomione tematy, ich status nadrzędny jest w tym akapicie.


## Jak kontynuować

Źródło kodu: `gra/src` i `gra/data`. Repo bieżącej sesji `/workspace/The-Game`, lokalna gałąź `work` wypychana bez force na `origin/main`. Nie zakładać zachowania `/tmp` ani żywotności operatorów po zakończeniu sesji. Po wznowieniu pobrać main i gałęzie kandydatów, sprawdzić faktyczne commity i uruchomić brakujący następny etap. Nie uznawać raportu z czatu za nowy wynik testu.

Maksymalnie cztery aktywne tematy. Osobne role Codex `gpt-6-luna/high`: Operator → Evaluator → warunkowa Obrona → niezależny Final Control → merge main → deploy tylko Robocza → push/readback → cleanup. Raport nie zatrzymuje pracy. Brak wywoływalnego schedulera w tle; nie obiecywać samoczynnego budzenia. Numeracja etapów 1–11 w `docs/decyzje/R-PROC-AUTOBOT.md`. Kanban nieużywany. Każdy zakres i korekta właściciela: `dyspozycje/autobot/runs/<ID>/00-dispatch.md`; pełny rejestr `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.

## Opublikowane — nie robić ponownie

Robocza **FALA618**, publication `4919be9dc`, MD5 `14336eb5393bb01aef84047308564eb5`, SHA256 `e8bb03d0b7b05c447405333d4b21333a099a5fe55d0d3d72d7e03acc9a9e2b02`. Push i świeży odczyt trzech artefaktów z origin/main identyczny bajtowo. Receipt w runach Skip i brązu `90-release-618.json`. Audio HTTP present/absent PASS, trzy sidecary niezmienione. Nie twierdzić file-protocol acceptance ani pełnego testu dużego imperium.

- AUTO/Pomiń wspólny zegar i kolejka callbacków poprzedniej klatki: rzeczywisty duży siege seed1/speed8/round400, oba tryby te same straty26/7 i HP2651/807; 1ms różnicy zaokrąglenia zegara, stan walki identyczny. No-breach150, pole i manualny Skip regresje PASS.
- Brąz **50/t w Brązie,75/t od Żelaza**; zastępuje starsze25/50. Żelazo pozostaje100/t w Żelazie, surowce wejściowe bez zmian.
- Starsze589–617 jużwdrożone. Zwłaszcza614 machiny wyłącznie podczas aktywnego oblężenia,616 konnica front/flanki/tył,617 granica−2/−3/−4. Nie powtarzać ich bez konkretnej reprodukcji.

## Cztery aktywne tematy

| Temat / ID | Etap | Dowód i następny krok |
|---|---|---|
| Mury `R-WEB-WALL-TIERS-MASONRY-BRICK-Q1` | 9/11 | Final Control PASS, source branch `codex/walls-resume` `0cc1f1377`; scalone main `d55890ced`. Palisada100%, kamienny150% poMurarstwie, ceglany200% poBudownictwie. Legacy `mury`=ceglany200, nowe `mury_kamienne`=150. Czerwony wariant kamiennej geometrii. Karty, oba wiki, render/mutacje i save legacy sprawdzone. Naprawiony downgrade przez budowę kamienia po cegle. Deploy619 jeszcze niepotwierdzony. |
| Wezwanie sojusznicze `R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1` | 9/11 | Final Control PASS, branch `codex/alliance-resume` `b0f89adcc`; scalone main `1e48b8282`. Trwały inbox/history; dedup resolved; osobny requester/recipient; reload/IndexedDB/hotseat/legacy, accept/refuse raz−15 PASS. Przedsięwzięte wcześniejsze błędy zachowane w20/40, zamknięte41/50. Deploy619 jeszcze niepotwierdzony. |
| Konnica i wszystkie jednostki Żelaza `R-WEB-CAVALRY-IRON-ONLY-Q1` | 5/11, dokumentacja kończona | Wypchnięty kandydat `codex/cavalry-iron` `38d6ba0ec`, sprawdzić nowszy commit. Konnica iJeździecchiński przeniesione doŻelaza/Sztukiwojennej, Katapulta teżSztuka. Rydwany nie są automatycznie przesuwane. Nowe zamówienia zablokowane, istniejące opłacone kolejki zachowane. Testy153/119/28/137/17/40+typecheck/generatory PASS. Audyt znalazł stare opisy Koła i katalogu jednostek, operator je poprawia. Potem niezależny Evaluator iFC, nie mylić pobocznego read-only przeglądu z pełną oceną. |
| Panel rekrutacji `R-WEB-EMPIRE-RECRUIT-AFFORDABILITY-SUMMARY-Q1` | 5/11 w trakcie weryfikacji | WIP `codex/recruit-affordability` `c94668bc2`, jawnie niezatwierdzony. Koszyk ma wspólny budżet i czerwone braki; podsumowania queued iwybranych oddzielne. Typecheck/plan testPASS, nowy realDOM11/11. Starylive20/23 (3asercje kolejek) porównywany z czystą bazą; nie nazywać tych błędów istniejącymi wcześniej bez wyniku porównania. Potem Operator raport→Evaluator→FC. |

Pracują obecnie operatorzy konnicy i rekrutacji; root kończy publikację zatwierdzonych murów i sojuszy. Wywołania i procesy trzeba ponownie zweryfikować po wznowieniu.

## Budowana FALA619 — uwaga na niepełną publikację

Zintegrowane mury+sojusze. Root typecheck oraz upgrade/alliance-save/Skip regression po scaleniu PASS. Czysty archive/Vite build `/tmp/release619-out/index.html`, stempel MD5 `722419d02dcdf72408dffe4374bb1e73`; to ARTEFAKT KANDYDAT, nie opublikowana Robocza. SourceSHA `/tmp/release619-source-sha`, buildlog `/tmp/release619-build.txt`. Audio gate `/tmp/release619-audio.txt` może jeszcze działać — przed publikacją wymagany rzeczywisty PASS. `/tmp` może zniknąć, wtedy odbudować z zatwierdzonego kodu.

Publikacja: directVite poza repo (nie npm build/dev), inject-build-stamp.cjs, HTTP audio runtime present/absent, verify-robocza-bundle, manifest/START/WERSJE, commit, push main, fresh fetch i porównanie bajtów bundle/manifest/START. Trzy audio-pack MD5 mają pozostać takie jak manifest. Nie zmieniać KANON/FINALNA. Pomocniczy `/tmp/publish-resume-release.py` nie jest kanonem i może nie przetrwać; sprawdzić jego zakres przed użyciem. Pełne run receipts muszą być zapisane przed cleanup.

## Zgłoszenia czekające na operatora — nie deklarować aktywnych prac

Każde ma własny00-dispatch i wpis rejestru:

1. `R-WEB-SEA-PEOPLES-BRONZE-TURN20-TRIPLE-Q1`: komunikat raz od20.tury OD WEJŚCIA DANEJ NACJI W BRĄZ,3×liczba barbarzyńców na każdym aktywnym poziomie, doŻelaza tejnacji. Istniejący mechanizm LudówMorza rozszerzyć, nieduplikować. Wyłączeni barbarzyńcy pozostają wyłączeni.
2. `R-WEB-RECRUIT-FOLLOW-GENERAL-BY-ORIGIN-Q1`: Armia/Rekrutacja dziedziczą wspólneIdźdowodza; zamówienie bezpośrednie wmieście domyślnieOFF; indywidualnyprzełącznikpozostaje. Utrwalić pochodzenie/intencję kolejki.
3. `R-WEB-IRON-STUD-ADJACENCY-Q1`: stadnina beznaturalnegoKoń wŻelazie musi bezpośredniosąsiadować zistniejącąstadniną; wspólneAI/manual/autobudowa, niekasowaćstarych.
4. `R-WEB-BRICK-CYCLES-75-100-Q1`: cykle75Brąz/100Żelazo, NIE liczba cegieł. Zachować2glina1drewno/cykl oraz obecny mnożnik wyjścia: pełnyBrąz150gliny75drewna→225cegieł; Żelazo200gliny100drewna→400cegieł. Nie zmieniać innych konwerterów.
5. `R-WEB-RESOURCE-BUILDING-ENABLE-TOGGLE-Q1`: on/off budynków surowcowych; off=zeroprodukcji,wejść,kosztówutrzymania. SavelegacyON. Na końcu paneluMiasta lista wszystkichmiast tylkozbudynkamisurowcowymi+przełączniki. Globalneperresource faktycznaprodukcja vsprzeróbpotencjalny przy pełnymzaopatrzeniu, odróżnićwyłączonąmoc. Dokładneostatnievsprognozowanedaneopisaćuczciwie.
6. `R-WEB-MELEE-CROSS-TYPE-NEXT-ERA-REPLACEMENT-Q1`: OSTATECZNA decyzja globalna wszystkichnacji: piechotawręcz→dowolnapiechotawręcz niezależnieodbroni(Swordsman/Spearman/Falangiteetc); zachowaćdotychczasowebramkiepok/badań/nacji/kosztów/wyjątkowych. NieograniczaćdoGrekówaninastępnejepoki. Wojownikmykeński→Falanga/Thorakites przykłady. Właściciel WYCOFAŁdopisek normal↔wyjątkowa zakaz: istniejącylimit wyjątkowychdziałapoprawnie; nieimplementowaćwycofanegozakazu.
7. `R-BITWA-DEAD-UNIT-DISAPPEARS-Q2`: ponownezgłoszenie duchów zabitych. Q1dawnowdrożone, obecnyhelpertestPASSniezamykanowegoprzypadku; rzeczywisteścieżkizabicia/render/Skiprepro. Zabityznika,routowanyżywytoinnyprzypadek.
8. `R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1`: żywiocalaliprzegranejarmiimającofnąćsię2heksyodwroga,nietracićich. Audytfield/siege/AIplayer/manualauto/reserves; braklegalnejtrasyjestedgecasedoanalizy, nieautoryzacjadokasowaniajednostekaniwodnegoteleportu.

## Audyty z brakującymi danymi / decyzje

- `R-WEB-AI-BRONZE-STOCK-EXCESS-Q1`:24,818Inkowie niesamotnymdowodembłędu. StockUIczytawłaścicielamiast; nienależywymyślaćhistorii. Niepotwierdzonoinflacji, brakzapisu/turnhistory. Dawne25/50historiiistniejącychzapasówniekasować.
- `R-WEB-WORK-ALLOCATION-POOL-DOUBLE-CREDIT-Q1`: audyt90c485a1c naorigin/codex/work-pool.13295/t przy0/100 możelegalniedać+9857przezidle/completionreturns.38citywitnessniejestdowodemstanużytkownika. Saveplayer13/hotseat22PASS; staretesty635/2i23/4takżenabazie. Braksnapshotujednejturyzkolejkami/drainami, źródłaprodukcjiniezmienione. Nieoznajmiaćnaprawy.
- `R-WEB-ADMINISTRATOR-AUTOBUILD-GATE-Q1`: właścicielchceAdministratorawymaganegodoautomatycznejbudowy. Ratusz byłTYLKOpropozycjąasystenta, NIEzatwierdzony. Potrzebnadecyzjabudynkuizakresubudynki/ulepszenia. Nieimplementowaćsamowolnie.
- BarterAI→gracz `R-WEB-AI-TRADE-PROPOSALS-TO-PLAYER-Q1`: kandydatf20b81654 naorigin/codex/trade-resume, operator5/11, czekanaEvaluator. Fairnessprzed/poexactpayload; fairwood200/iron10testzamiastbłędnegolimitu30. NieuznawaćstaregoEvaluatorazazatwierdzenienowejodtworzonejwersji.

Dalszystarszybacklog: audytPLQ3 naorigin/codex/polish-ui-q3, AIgłównaarmia/decyzje, końcowytestdużegoimperium/Falanga/REPIN/#201, osobnydocelowymodelmuruceglanego(FUTURE). Niepowtarzaćrzeczyjużwydanychprzezinnegoagenta.

## Środowisko i zabezpieczenie

`/usr/bin/chromium` ISTNIEJE. Brak starego `/opt/pw-browsers/...` NIE znaczy brakChromium. Używać explicitexecutablePath iHTTP; file://blokowanyprzezpolitykęprzeglądarki. Maksymalnie2izolowaneChromium jednocześnie, pomiarwydajnościwyłącznie. Shareddeps `/workspace/The-Game/gra/node_modules` (`npm ci` wykonane). BuilddirectVite, nieexportdanych. Repo/main+gałęzieWIPwypychaćregularnie, takżeprzedukończeniemkandydata, wyraźnieoznaczaćniezatwierdzone. Nieczyścićaktywnychworktrees; ukończoneusunąćdopieropocommit/push/readbackipróbieodtworzenia.

## Sprzątanie po publikacji619
Po potwierdzeniu zdalnych SHA kandydatów i ich obecności w main usunięto WYŁĄCZNIE opublikowane worktrees Skip/brąz50-75/mury/sojusze oraz czyste buildy618/619 z/tmp. Ich kod i dowody są na main i gałęziach GitHub; ponowne wejście wymaga odtworzenia worktree zGit. Aktywne cztery worktrees konnicy/rekrutacji/martwychjednostek/zamianypiechoty zachowano. Lokalne skrypty pomocnicze mogą pozostać, ale nie są źródłem stanu wydania.

## NAJNOWSZA DYSPOZYCJA WŁAŚCICIELA — NIE OTWIERAĆ NOWYCH TEMATÓW
Dokończyć tylko rozpoczęte cztery: konnica/Żelazo, limity i podsumowanie rekrutacji, globalna zamiana piechoty, znikanie zabitych Q2. Kontynuować ich Operator/Evaluator/Obrona/FC/integracja/Robocza/push, ale po zakończeniu NIE uzupełniać slotów z kolejki. Pozostałe zgłoszenia są zarejestrowane i czekają na ponowne polecenie właściciela. Ta decyzja zastępuje wcześniejszą pętlę automatycznego dobierania kolejnych tematów.

### Bieżące poprawki w zamkniętej puli czterech — kontrola przed końcem limitu
- Konnica: niezależnyEvaluatorPASS zachowany w run/20 (commit12737d11c), FinalControl jeszcze trwa; nie integrować bez50PASS.
- Rekrutacja: pierwsze50FC=BLOCK (queued-only/zero-city draft wchodził do kosztu koszyka). Raporty20/50 zachowane w6ce76cb42; operator poprawia tę konkretną lukę UI/testu, potem followupEvaluator/FC. Nie ukrywać pierwszegoBLOCK.
- Zamiana piechoty: e42266cf1, niezależne21/45/36/typecheckPASS; pełnykoszt39/40identycznyzbazą (stareSiegeF0), raport20committed51e4c022e; FinalControl trwa.
- Duchy Q2: WIPfixture6301f890b naorigin/codex/dead-unit-regression, bez zmian koduprodukcji. Testy killmelee/missile/multitarget field dotądPASS; nowyfixturemiałbłądkonfiguracjibrakaktora, diagnozowany. NIE potwierdzono źródła zgłoszenia i NIE oznaczono naprawione/11. Dokończyć ograniczone testy/raport, nie wymyślać poprawki.
