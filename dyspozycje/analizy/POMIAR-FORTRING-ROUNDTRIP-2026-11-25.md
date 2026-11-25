# POMIAR-FORTRING-ROUNDTRIP-2026-11-25 — round-trip zapisu ON/OFF (pierścień fortów), wynik CZĘŚCIOWY (kryterium binarne NIESPEŁNIONE)

Temat: R-WEB-MEASURE-FORTRING-ROUNDTRIP-Q1 (obrona, runda 2/5). Baza: origin/main bb3a824ca (FALA 902). Bez zmian gry i bez zmian `gra/src`. Narzędzie: istniejący `gra/tools/fortring-measure.cjs` z bundlem `fr-dist` (poza repo), `--seed 4242`. Round-trip wykonywany przez hak `__settingsLive.saveRoundTrip()` (persistSaveToSlot + loadGameFromSlot) po turze N=8.

Wniosek w jednym zdaniu: round-trip w t8 jest tożsamy w ON i OFF (5 pomiarów), ale różnica cityProd z t59/t60 NIE została odtworzona ani zbadana, bieg ciągły do t60 NIE został zakończony, test gate NIE został wykonany, a wpływ pierścienia fortów NIE ZOSTAŁ ZMIERZONY (0 fortów we wszystkich biegach).

## 1. Round-trip (zadanie 1), t8, seed 4242

Mierzone: skrót stanu (SHA256 z `__detHarness.snapshotJson()`) PRZED i PO saveRoundTrip; liczba fortów przed/po. Źródło: `state.json` każdego katalogu w scratchpadzie (`roundTrip.identical`, `shaBefore`, `shaAfter`, `fortsBefore`, `fortsAfter`).

| Wariant | Powtórzenie (katalog) | Wynik | shaBefore = shaAfter | forty przed/po | Różnice pól |
|---|---|---|---|---|---|
| ON | 1 (rt-on-1) | NIE ZMIERZONO: przeglądarka zamknięta po turze 8, brak pliku stanu | — | — | — |
| ON | 2 (rt-on-2) | zmierzono | TAK (a604d6388715…) | 0 / 0 | `diff: []` |
| ON | 3 (rt-on-3) | zmierzono | TAK (a604d6388715…) | 0 / 0 | `diff: []` |
| OFF | 1 (rt-off-1) | zmierzono | TAK (a604d6388715…) | 0 / 0 | `diff: []` |
| OFF | 2 (rt-off-2) | NIE ZMIERZONO: brak pliku stanu i logu (przebieg przerwany) | — | — | — |
| OFF | 2b (rt-off-2b) | zmierzono (ponowienie w nowym katalogu) | TAK (a604d6388715…) | 0 / 0 | `diff: []` |
| OFF | 3 (rt-off-3) | zmierzono | TAK (a604d6388715…) | 0 / 0 | `diff: []` |

Zmierzonych round-trip: 5 (ON 2, OFF 3). Wszystkie 5 ma ten sam skrót stanu przed i po zapisie. Zgodnie z dispatchem nie było to 3 powtórzenia na wariant w tej samej sesji i tej samej turze, o którą pytano, i nie było ono wykonane przy t59/t60.

Ocena (PRZYJĘTE zarzut Evaluatora nr 1): pięć tożsamych skrótów przy t8 to kontrola poprawności mechanizmu zapisu w tym konkretnym punkcie gry, a NIE dowód braku różnicy cityProd. Rozbieżność z dispatchu (miasta 105/106, firstDiffAt 9182) pojawiała się przy t59/t60, a pomiar nie odtwarzał tych warunków. Powtarzalność różnicy cityProd: NIE ZMIERZONO. Minimalne odtworzenie (który element kolejki produkcji, związany z fortem czy z cudem): NIE ZMIERZONO. Nie zgłaszam kandydata BŁĄD-GRY na podstawie tego pomiaru.

Uwaga o stabilności: przebiegi ON-1, OFF-2 i wcześniejszy ON (rt-on-a, zamknięty po t9) zakończyły się zamknięciem Chromium. Przyczyna NIE ZMIERZONO (nie wiadomo, czy w saveRoundTrip, czy w finalizacji). Zgodne z obserwacją z dispatchu (SIGSEGV Chromium przy turach ok. 9–18).

Uwaga o liczniku `turnsDone` (zarzut nr 5): wartość 7 przy `lastTurn` 8 nie jest niespójnością. Wiersz 1 w `*.rows.jsonl` to `kind: "start"` bez pola `ms`, a `turnsDone` liczy wyłącznie wiersze `kind: "turn"` z `ms` (gra/tools/fortring-measure.cjs, linia 293). Tury 2–8 to 7 zmierzonych tur. Skrót z tury 8 (stateSha256) występuje w `rows.jsonl`.

## 2. Bieg ciągły ON seed 4242 do t60

NIE ZMIERZONO. Korekta poprzedniej wersji tego dokumentu (zarzut nr 2): wcześniejsze zdanie, że proces PID 11723 trwa, było BŁĘDNE. Przy weryfikacji `ps` nie pokazuje żadnego procesu `fortring-measure`. Log `scratchpad/fr-on2/run.log` kończy się na turze 18: `page.evaluate: Target page, context or browser has been closed`, `sec=1145`, `chunk: lastTurn=0 partial=false done=false`. Bieg nie dotarł do t60, a jego wynik nie jest pełnym biegiem.

Czasy tur (z tego samego logu, tury 2–18, 17 pomiarów): od 32,2 s (tura 2) do 47,2 s (tura 15), mediana ok. 40 s. Tury 1 nie mierzono (wiersz startowy). Czasu tury z fortem(ami) vs bez: NIE ZMIERZONO (forty = 0 przez cały bieg).

Bieg OFF do t60: NIE ZMIERZONO (nie uruchomiono, ponieważ bieg ON nie został ukończony, a wykonanie obu biegów w tej rundzie nie mieściło się w budżecie).

## 3. Test gate i hak stawiający fort

NIE ZMIERZONO. Nie dodano haka stawiającego fort (dispatch warunkował go na tym, że forty nadal się nie pojawiają; w tej rundzie nie zbadano, czy pojawiają się przy t60). Test gate (30 tur, liczba fortów i skrót stanu względem bazy) nie został wykonany. Diff tej gałęzi względem bb3a824ca dotyczy wyłącznie dokumentów (2 pliki, `gra/` bez zmian), więc gate nie mógł zostać wykonany bez dodatkowej pracy.

Wpływ pierścienia fortów na rozgrywkę: NIE ZMIERZONO (0 fortów we wszystkich biegach ON i OFF).

## 4. Ograniczenia i to, czego nie wolno z tego wyciągać

- Próbka: 2 powtórzenia ON + 3 OFF przy t8; zero round-trip przy t59/t60; zero biegów ON/OFF do t60 zakończonych.
- Chromium (headless) przerwał 4 z 9 przebiegów w tej serii (rt-on-a, rt-on-1, rt-off-2, fr-on2).
- Brak powtórzeń w tej samej sesji i tym samym stanie, dla których można by ocenić powtarzalność różnicy cityProd.
- Wniosek dla FC: wynik jest CZĘŚCIOWY. Potwierdza tylko, że przy t8 round-trip jest tożsamy w obu wariantach. Nie potwierdza braku różnicy przy t60 i nie mierzy wpływu fortów.
