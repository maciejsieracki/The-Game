STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; bez zmian w gra/src ani gra/data)
TEMAT: R-WEB-TEST-DEBT-Q10
GOAL: obrona rundy 1 (kandydat 7b69b7a55): odpowiedź na zarzuty 1-5 Evaluatora (c7751393f); naprawa kotwicy stadniny, poprawka liczby wywołań HUD; klasyfikacja a/b/c/d z dowodem dla pozostałych pozycji.
ZMIANY/COMMIT: gra/tools/stadnina-early-eras-deposit-only-test.cjs (b: kotwica `buildImprovementQualifier\(state\b`), gra/tools/hud-skarbiec-test.cjs (a: warunek liczby wywołań previewCityEconomy `>= 1`, kontrola poprawki każdego wywołania zostaje). Raport: ten plik. Brak zmian w gra/src, gra/data, WERSJE.md, manifeście.
TESTY (własne biegi, CHROME_PATH=/usr/bin/google-chrome, jeden Chromium naraz, stan kodu = OFF, patrz zarzut 3):
- stadnina-early-eras-deposit-only: PRZED 34 passed / 1 failed (FAIL "auto-improvements.ts: stan dla buildImprovementQualifier niesie playerEra"); PO 35 passed / 0 failed (exit 0).
- hud-skarbiec: PRZED 39 / 1 (FAIL "liczba wywolan=3"); PO 40 passed / 0 failed (exit 0).
- rekrutacja-koszty-polowa-all: 75 rekordów; cena w kosztach (Pieniądz/Surowiec/Utrzymanie surowiec, ceil połowa względem bazy) zgodna 225/225; FAIL "Wojownik: unrelated fields changed" (patrz zarzut 2).
- auto-fort-claim: 61 / 2 (bez zmian); wariant z samą farmą (bez bydła) 60 / 3 — nie naprawiono.
- tarasy-cywilizacje: 14 / 3 (bez zmian).
- zloto-test: 7 FAIL (bez zmian).
- hex-plony-magazyn: 10 / 4 (bez zmian).
- citypanel-konwerter-produkcja i hotseat-etap5-no-leak: nie ponawiane w tej rundzie (operator r1: 108/0 i PASS A+B 91 s; zmiany tych plików nie były dotykane).
- Mutacja kotwicy stadniny (node, ten sam regex co w teście): `buildImprovementQualifier(state, {...})` -> true; `buildImprovementQualifier(other, {...})` -> false; `buildImprovementQualifier(stateX, {})` -> false. Kontrola playerEra bez zmian.
- Mutacja HUD: nie wykonano osobnej mutacji poza wbudowaną mutacją (2) w teście (in-memory ucięcie argumentów pozycji 10/11), która nadal jest w teście i zależy od pętli assertFixApplied po KAŻDYM wywołaniu.
- tsc --noEmit / logic 213 / tech-tree 20 / research 33 / unit-replace 21 / combat 6: nie ponawiane (zmiany tylko w plikach .cjs testów, poza kompilacją TS).
- Zielone z 18 po tej rundzie: 4 (citypanel, hotseat, stadnina, hud-skarbiec); autoimprove (limit >=142 s) wg raportu operatora, nieponowiony.

BLOKADY: brak blokad technicznych. Pozycje wymagające decyzji lub osobnego tematu gry: patrz odpowiedzi poniżej.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJĘTE i NAPRAWIONE. stadnina: test :177 szukał `buildImprovementQualifier(state)`, kod ma `buildImprovementQualifier(state, { direktBruk: false })` (auto-improvements.ts:1418). Kotwica zmieniona na `\(state\b`. Potwierdzone: 35/0.
2. PRZYJĘTE (klasyfikacja a, naprawa NIEWYKONANA: wymaga decyzji o bazie testu). Przyczyna ustalona dowodem:
   - BAZA 329db81ff NIE jest przodkiem HEAD ani origin/main (`git merge-base --is-ancestor` = false); test porównuje z tym snapshotem.
   - Pola kosztowe (3 pola halved): zgodne z ceil(baza/2) dla 225/225 wartości.
   - Pola niekosztowe: różnią się od bazy w wielu rekordach po ŚWIADOMYCH zmianach danych innych tematów, m.in. Wojownik: "Health" 60 -> brak klucza, "Zastąp specjalnie" "—" -> "Włócznik"; Rydwan (woły): Atak 6->12, Obrona 2->4, Epoka Brąz->Kamień; Procarz fieldPower 12->14; Falanga Bonus vs Spearman 0->30; Konnica Tech Jeździectwo->Sztuka wojenna. Łącznie ~250 różnic pól niekosztowych w 75 rekordach (liczba z własnego skryptu porównania).
   - Wniosek: test sprawdza niezmienność pól niekosztowych względem snapshotu, którego main już nie odzwierciedla. Poprawka = nowa baza (re-baseline) albo wyłączenie kontroli pól — to decyzja o regule testu, nie naprawa kotwicy. Nie osłabiam asercji. Test ZOSTAJE CZERWONY. Do ABC.
3. PRZYJĘTE jako uwaga procesowa, ze sprostowaniem. Stan kodu w tym drzewie = OFF: gra/data/econ-era-rebalance-params.json eraRebalansAktywny=false w 04722f538 i ERA_REBALANCE_ENABLED_DEFAULT=false (src/game/econ-era-rebalance.ts:14-35); bieg operatora bez `setEraRebalanceEnabledForTest` był więc biegiem OFF (nie "NIE ZMIERZONO" w sensie pomiaru stanu, tylko brak jawnego ustawienia). Stan ON (eraRebalansAktywny=true) występuje dopiero w origin/main (527 commitów dalej; params z "ENABLE-Q1") — NIE ZMIERZONO w tej rundzie, bo wymaga innej bazy kodu. Zalecenie: osobny bieg ON na main.
4. PRZYJĘTE (klasyfikacja z dowodem; poza hud-skarbiec wszystkie pozostają czerwone):
   - hud-skarbiec: (a) NAPRAWIONE. Asercja liczby wywołań `===1`; w ciele refreshLiveEmpireRatesUnsafe (main.ts:23446-23889) są 3 wywołania: :23491 (główne), :23595 (zamknięcie previewDomyslny), :23702 (zamknięcie previewWithSplit), dodane przez funkcje prognozy NNS. Poprawka każdego wywołania (pozycje 10/11) nadal sprawdzana pętlą. 40/0.
   - auto-fort-claim: (d?) NIE USTALONO. Kontrola fixtury :292 (bez limitu fortu droga ma być budowana) zwraca got [] (bez bydła: got [bydlo], droga nadal nie). Przyczyna w logice kwalifikacji dróg dla tego heksu (auto-improvements.ts ~1290-1420), nie w liczbach. Zostaje czerwone; wymaga tematu gry.
   - tarasy-cywilizacje: dwie pozycje rozdzielone. (i) lama: test :108 oczekuje isImprovementAllowedForCiv('lama','rzymianie')===true, dane terrain-improvements.json:84 mają `"cywilizacje": ["inkowie"]` (klasa a? — zależy od decyzji, czy lama ma być tylko inkaska; NIE USTALONO intencji). (ii) AI Chińczycy/Inkowie: 2 buildImprovement, obie 'tarasy' na (15,15) i (14,15) (probe, tymczasowy log, cofnięty git checkout); test :184/:192 oczekuje 1 (d?: zachowanie AI albo zamierzona zmiana). Zostaje czerwone.
   - zloto-test: (d/decyzja ABC) konflikt reguł. Kod: building-resource-gate.ts:76 `mennica: [ZLOTO_LABEL]` z opisem PYTANIE-84-R9/U-13 + DOSTEP-SUROWCE-Q1 (Mennica wymaga Złota w magazynie). Test :201 i parytet AI oczekują Mennicy bez złota ("kanon magazyn"). Nie wiem, która reguła obowiązuje — pytanie ABC. Zostaje czerwone.
   - hex-plony-magazyn: (a + NIE USTALONO). Dane terrain-yields.json (modyfikator "Rzeka", Glina=5, uwagi R-EKONOMIA-SUROWCE-SKALA-5X-Q1 Runda 2 i P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1=A) nie zgadzają się z oczekiwaniem testu (+10 glina przy rzece, :159). Wynik 7 (nie 5 ani 10) nie jest wyjaśniony w tej rundzie. Zostaje czerwone; decyzja ABC o regule x5 + osobny temat gry.
   - zloto-test, rekrutacja-koszty: patrz wyżej (ABC / zarzut 2).
5. PRZYJĘTE. Zielone po tej rundzie: 4 z 18 (citypanel, hotseat, stadnina, hud-skarbiec), autoimprove z limitem czasu wg operatora. Dyspozycja wymagała mutacji dla 3 naprawionych testów — wykonana mutacja regexu dla stadnina (node, wynik powyżej); dla hud dotąd tylko wbudowana mutacja (2) w teście; dla citypanel/hotseat mutacje z r1 operatora.

NASTĘPNY KROK: orkiestrator (nie Operator): (1) ABC: reguła x5 i bazy surowców (ekonomia-5x, grupa-b, hex-plony, mennica); (2) ABC: Mennica bez/z Złotem (zloto-test vs PYTANIE-84-R9/U-13); (3) ABC: czy lama ma być tylko inkaska (tarasy) — dane vs test; (4) decyzja o bazie testu rekrutacja-koszty-polowa-all (re-baseline vs wyłączenie kontroli pól niekosztowych); (5) tematy gry: auto-fort-claim (kwalifikacja dróg), tarasy AI (2 tarasy w turze), hex-plony (rzeka 7 vs 15); (6) bieg ON (eraRebalansAktywny=true) na main dla wszystkich 18 testów.
DEPLOY/PUSH: NIE WYKONANO
