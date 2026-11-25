# POMIAR-FORTRING-ROUNDTRIP-2026-11-25 — round-trip zapisu ON/OFF (pierścień fortów), wynik częściowy

Temat: R-WEB-MEASURE-FORTRING-ROUNDTRIP-Q1 (runda 2/5). Baza: origin/main bb3a824ca (FALA 902). Bez zmian gry i bez zmian `gra/src`. Narzędzie: istniejący `gra/tools/fortring-measure.cjs` z bundlem `fr-dist` (poza repo), `--seed 4242 --turns 8`. Round-trip wykonywany przez hak `__settingsLive.saveRoundTrip()` (persistSaveToSlot + loadGameFromSlot) po turze N=8.

## 1. Round-trip (zadanie 1), t8, seed 4242

Mierzone: skrót stanu (`__detHarness.snapshotJson()`, SHA256) PRZED i PO saveRoundTrip; liczba fortów przed/po.

| Wariant | Powtórzenie | Wynik | shaBefore = shaAfter | forty przed/po | Różnice pól |
|---|---|---|---|---|---|
| ON | 1 | NIE ZMIERZONO: przeglądarka zamknięta po turze 8 (`browserContext.close: Target closed`), brak pliku stanu | — | — | — |
| ON | 2 | zmierzono | TAK (a604d6388715…) | 0 / 0 | brak |
| ON | 3 | zmierzono | TAK (a604d6388715…) | 0 / 0 | brak |
| OFF | 1 | zmierzono | TAK (a604d6388715…) | 0 / 0 | brak |
| OFF | 2 | zmierzono (ponowiony przebieg w nowym katalogu; pierwszy przebieg nie zapisał logu) | TAK (a604d6388715…) | 0 / 0 | brak |
| OFF | 3 | zmierzono | TAK (a604d6388715…) | 0 / 0 | brak |

Wniosek: przy t8 round-trip jest tożsamy w ON i OFF (5 zmierzonych powtórzeń), bez różnicy cityProd. Powtarzalność różnicy cityProd NIE ZMIERZONA: rozbieżność z dispatchu pojawiała się przy t59/t60 (miasta 105/106, firstDiffAt 9182), a w tym pomiarze nie odtworzono warunków t60 (zob. §3). Brak minimalnego odtworzenia; NIE zgłaszam kandydata BŁĄD-GRY na podstawie tego pomiaru.

Uwaga o stabilności: w wariancie ON jedno powtórzenie (ON-1) zakończyło się zamknięciem przeglądarki po turze 8. Przyczyna NIE ZMIERZONO (pierwszy przebieg nie zapisał pliku stanu, więc nie wiadomo, czy zamknięcie nastąpiło w saveRoundTrip czy w finalizacji). Wcześniejszy bieg ON (katalog rt-on-a) zamknął się po turze 9. Zgodne z obserwacją z dispatchu (SIGSEGV Chromium przy turach ok. 9–16).

Uwaga: powtórzenia są niezależnymi przebiegami od nowej gry (nie wznowieniami ze slotu); round-trip wykonano raz na przebieg.

## 2. Bieg ciągły ON seed 4242 do t60

NIE ZMIERZONO w tej rundzie. Proces ON do t60 (PID 11723, katalog worktree wf_60985f36, katalog scratch fr-on2) został uruchomiony przez inną sesję i nie był przejmowany ani zabijany. Ten Operator nie uruchomił biegu OFF do t60 (wykonanie wymagałoby ok. 35 min w jednym przebiegu i ryzyka zamknięcia Chromium; czas nie pozwolił w tej rundzie).

## 3. Gate i hak stawiający fort

NIE ZMIERZONO. Nie dodano haka stawiającego fort; w biegach ON i OFF do t8 liczba fortów wynosiła 0 (stan jak w poprzedniej rundzie: wpływ pierścienia nadal NIE ZMIERZONO). Test gate (30 tur, porównanie z bazą) nie był wykonany.

## 4. Ograniczenia

- Próbka: 2 powtórzenia ON + 3 OFF przy t8; brak round-trip przy t60.
- Chromium (headless) kończy się w połowie biegów (trzy niepowodzenia w mojej serii 8 przebiegów: rt-on-a, rt-on-1, rt-off-2; przebieg rt-off-2 nie zostawił logu, ponowiony jako rt-off-2b).
- Round-trip przy t60 i czas tury z fortem: NIE ZMIERZONO.
