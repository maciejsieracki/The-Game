# AutoBot Operator — diagnoza zatrzymania stres-testu

**WYNIK: przyczyna nieustalona; najmocniejszym potwierdzonym problemem jest brak bounded-observability w harnessie.** Bez ponownego browser runu i bez zmian produktu.

## Tożsamość źródeł i danych

- Stres run zakończony ręcznie: source `src/main.ts` przy buildzie `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d` (z raportu 41); bundle `/tmp/large-empire-stress-59664-patsfv/index.html`, SHA-256 `f2163b5821ee05afdbb4d2e25c4ed52701c74f3fa32e9b4c338111d7bf16741b`.
- Aktualny `src/main.ts`: SHA-256 `fdda285a80717e2c555d28b9068e92ad64b82558ba2226cd01343194e8d3211d` (zmienił się od testu).
- Aktualny `tools/perf-large-empire-stress-live-test.cjs`: SHA-256 `75bfa86a42c70ff284c0de99c13731bbb4e0406f5e26f4475a2400698d1bc739`.
- Wejściowy raport zatrzymania 41: SHA-256 `39db41ba03e355476f8f4a791dc0099112d91af9c7f5b9be9dd31775c0108ee1`.
- Build artifact z runu: 70 013 673 bajty; dokładna fixture i ostatni odczyt opisane w raporcie 41. Run nie pozostawił result JSON ani screenshotu.

## Co wynika z dowodów

Raport 41 mówi o trzech odrzuconych ofertach oznaczonych `turn:2`, po czym nie ma dalszego logu. To **nie dowodzi**, że świat utknął na turze 2: w `STRESS_COMPACT=1` harness emituje postęp EOT tylko co 10 ukończonych tur (`checkpointEvery=10`). Między tymi checkpointami po cichu może skończyć wiele tur. W runie nie zapisano `before`, `busy`, lifecycle EOT ani stopnia ukończenia, więc nie znamy ostatniej tury ani miejsca zatrzymania.

Usuwanie samych ofert przez UI wygląda na zakończone: każda z trzech decyzji zalogowała `ok:true` i usunięty ID; funkcja `rejectPendingAiOffers()` loguje decyzję dopiero po tym, jak `waitForFunction()` potwierdzi zniknięcie ID z pending, a następnie zamyka audience i sprawdza, czy pozostały oferty (`harness:68–81`). Dwa wcześniejsze, poprawnie zakończone przebiegi zapisały dokładnie te same trzy t2 offer IDs i ukończyły EOT `turnBefore=2 → turn=3` w 34,947 ms oraz 33,633 ms. Ich bundle (`70c9e1eb…a722e` / raportowany HEAD `99bb834…`) jest starszy niż bundle z runu 41, więc to dowód, że te oferty same w sobie nie tworzyły deterministycznego blokera w starszym kandydacie, nie dowód równoważności bieżącego produktu.

Istotna luka jest w samym harnessie: 60-sekundowy timer obejmuje dopiero `page.waitForFunction(...)` (`harness:676–690`). Wcześniejsze `page.evaluate()` — odczyt lifecycle, wywołanie `__eraTestDebug.endTurn()` i natychmiastowy snapshot stanu (`:671–675`) — nie mają limitu ani logów przed/po. Jeśli renderer main thread przestanie odpowiadać podczas uruchomienia EOT, sterowanie może nie dotrzeć do 60-sekundowego wait. Nawet jeśli timeout zadziała, gałąź catch wykonuje kolejne nieograniczone `page.evaluate()` po stan i modal **przed** próbą screenshotu (`:692–697`), więc ta sama blokada uniemożliwia zachowanie diagnostyki. Jest to potwierdzony harness/input-wait gap; nie wskazuje samodzielnie, czy przyczyną pierwotną jest synchroniczny koszt produkcyjny, oczekiwanie aplikacji czy deadlock.

W przebiegu brakuje JS error, screenshotu, finalnego `errors`, heap, `endTurnInProgress`, `activeWorldEndTurnPipeline`, liczby miast/jednostek po t0 ani logu `[EndTurn] START/DONE`. Nie można więc potwierdzić produkcyjnego deadlocka ani wskazać hotspotu konkretnego EOT. Poprzedni pełny run miał mierzone hotspoty AI, autosave, ekonomii i siege scan przy turze 39→40, ale to inny run/bundle i nie lokalizuje obecnego no-progress.

## Minimalny następny krok

Najpierw zmienić wyłącznie harness: logować monotoniczne timestampy przed i po (1) offer cleanup, (2) lifecycle read, (3) `endTurn()` evaluate, (4) natychmiastowym state read oraz (5) `waitForFunction`. Owinąć każde Playwright wywołanie w Node-side terminator; po terminie próbować screenshotu przed jakimkolwiek JS eval i ograniczyć także screenshot/state collection. W `waitForFunction` rozróżniać timeout z nadal responsywnym rendererem od samego braku odpowiedzi na CDP. Nie wywoływać ponownie EOT przy diagnozie.

Po tej zmianie wykonać **jedną ograniczoną reprodukcję do maksymalnie 3 EOT** na tym samym seedzie i fixture, z outer wall limitem obejmującym world generation oraz bez dłuższego stressu. Wynik powinien wskazać konkretny etap i zapisać ostatni responsywny `world.turn`, `busy`, `activeWorldEndTurnPipeline`, `aiCmdResume`, `isPreBattleOpen`, pending auto-prebattle, pending offers, errors, heap i screenshot. Jeśli marker zawiesi się wewnątrz EOT przy CPU zużywanym przez renderer, dopiero wtedy profilować produkcyjną fazę; jeśli `endTurn()` zwróci, a lifecycle nie domknie się, audytować asynchroniczny EOT/battle queue; jeśli blokada jest w cleanup, poprawić harness/UI wejście. Nie zmieniać produktu na podstawie raportu 41 samego.

**Zakres zakończony:** read-only inspekcja; bez runu, testu, produktu, push ani deploy.
