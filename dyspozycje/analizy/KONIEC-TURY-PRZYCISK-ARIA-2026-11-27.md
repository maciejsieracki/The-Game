# KONIEC-TURY-PRZYCISK-ARIA-2026-11-27 — przycisk „Zakończ turę” przy canEnd=true (R-WEB-ENDTURN-BUTTON-ARIA-Q1, tag ENDARIA)

Baza: origin/main 32b3f1718 (REALDEF5). Pomiar na żywo w Chromium, poziom MAKSYMALNY
(Trudny, barbarzyńcy Trudny, dyplomacja i wojna Trudna, kultura i religia Trudna, koszty jednostek Wysoki ×4, mapa Mała, Kontynenty, 2 rywali). Ziarno 4242 (ziarno 7 NIE ZMIERZONO: zabrakło przebiegów).

## 1. Wynik pomiaru

Narzędzie: `gra/tools/endturn-aria-probe.cjs` (nowe, tylko odczyt haków + fizyczny klik myszą w `button[data-end]`).

Dwa niezależne biegi (seed 4242, 8 iteracji tury) dały zgodny obraz:

| tura | pre: canEnd (hak) | pre: aria-disabled (DOM) | klik myszą | skutek kliknięcia |
|---|---|---|---|---|
| 1 | true | false | tak | tura 1 → 2 |
| 2 (pierwsze odczytanie) | false | true | tak | brak — tura 2 bez zmian |
| 2 (ponowne odczytanie) | **true** | **true** | tak | tura 2 → 3 |
| 3 | false → true | true | tak | tura 3 → 4 |
| 4 | false → true | true | tak | tura 4 → 5 |
| 5..8 (bieg 3) | true | true | tak | tura kończy się |

Bieg 3 (`poll` co 500 ms po kliknięciu, kod: C/c = canEnd true/false, A/a = aria-disabled true/false):
- po KAŻDYM kliknięciu przez ok. 3 s stan `cA` (canEnd=false, aria=true), potem `CA` (canEnd=true, **aria nadal true**) do końca odczytu;
- po pierwszej tury aria-disabled NIE wraca do false w żadnej turze (tury 2–9 widzą `A`), mimo canEnd=true;
- klik na przycisku, który wizualnie jest zablokowany (klasa `is-disabled`, opacity .38), kończy turę, gdy canEnd=true.

Pomiar NIE ZMIERZONO: stan przycisku przy tury 1 w biegu 2 (raz aria=false po pierwszej turze, raz nie — niedeterminizm między biegami, przyczyna nieustalona); ziarno 7; skutek dla gracza po ręcznym zamknięciu modali (harness zamyka je sam: closeModals, clearBattles, rejectAwaitingAiOffers, acceptForcedPeace); czy zewnętrzna aktywność gracza (otwarcie paneli) odświeża przycisk — NIE ZMIERZONO.

## 2. Przyczyna (linie kodu, origin/main 32b3f1718)

- `gra/src/ui/bottomBarHud.ts:204` — `canEnd = !hideEnd && config.canEndTurn()`; `:218` — `endVisuallyDisabled = hideEnd || !canEnd`.
- `gra/src/ui/bottomBarHud.ts:257-259` — atrybut `aria-disabled` i klasa `is-disabled` są ZAPISYWANE tylko w `render()`.
- `gra/src/ui/bottomBarHud.ts:194-195` — `render()` nie rysuje, gdy trwa wciśnięcie przycisku (`activeEndTurnPointers`); odroczenie przez `schedulePendingRender` (`:306-312`).
- `gra/src/ui/hud.ts:2132-2133` — `refreshD1BModules()` jest JEDYNYM wywołaniem `bottomBarApi.update()`. Nie ma pętli per-klatka ani timera odświeżającego ten przycisk.
- `gra/src/main.ts:43607` `canPlayerInitiateEndTurn()` — bramka (modale, bitwy, galeria, endTurnInProgress itd.) i wywołuje `healStaleEndTurnBlockers()` (`:43375`), który może zmienić stan BEZ wywołania odświeżenia HUD.
- `gra/src/ui/bottomBarHud.ts:290-292` — handler kliknięcia sprawdza WYŁĄCZNIE `hideEndTurn()` i NIE sprawdza canEnd; prawdziwą bramką kliknięcia jest dopiero `advanceSeat()` (`gra/src/main.ts:49918`), które odrzuca klik przy canEnd=false.

Mechanizm: canEnd zmienia się w czasie (zakończenie pipeline'u tury, healStale, zamknięcie modala/oferty, upływ czasu) bez późniejszego `refreshD1BModules()`. Atrybut zostaje z ostatniego renderu, który był zrobiony przy canEnd=false (w szczególności w trakcie pipeline'u tury, gdy `endTurnInProgress` blokuje canEnd). Wizualnie przycisk jest więc zablokowany, a logika klikalności już go przepuszcza.

Rozstrzygnięcie: **BŁĄD UI (rozjazd synchronizacji), nie zamierzony stan.** Komentarze w `bottomBarHud.ts:6-8` deklarują, że klikalność ma pozostać zgodna z dotychczasową logiką (klik = `onEndTurn`); atrybut `aria-disabled` ma odzwierciedlać canEnd, czego nie robi po zmianie stanu bez renderu. Gracz widzi przycisk jako niedostępny, choć może zakończyć turę.

Odwrotny przypadek (aria=false przy canEnd=false, klik odrzucany) NIE zaobserwowany.

## 3. Poprawka — NIE WYKONANA w tej rundzie

Wymagana minimalna poprawka (runda 2): synchronizacja atrybutu z realnym warunkiem, bez zmiany logiki bramki i bez zmiany klikalności. Proponowany kierunek, do decyzji orkiestratora:
- (a) lekki sync w `bottomBarHud.ts`: po każdym tiku/sygnaturze (canEnd, hideEnd, blocking, turn) porównać z ostatnio wyrenderowaną i wywołać `render()` tylko przy zmianie (bez pełnego re-renderu co klatkę), albo
- (b) wywołanie `bottomBarApi?.update()` po zakończeniu pipeline'u tury i po `healStaleEndTurnBlockers()`, gdy zmienił stan.

Test czerwony→zielony: harness `gra/tools/endturn-aria-probe.cjs` (poll po kliknięciu) jako dowód; mutacja: usunięcie synchronizacji powinno przywrócić `cA`→`CA` z `A`. Bramki przy zmianie `gra/src`: tsc 0, logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, society-breakdown 56/0, ai-city-order-need-wiring-test 267/0 — NIE URUCHOMIONE w tej rundzie.

Nie wykonano poprawki z powodu zakresu rundy 1 (pomiar + diagnoza) i braku czasu na pełny zestaw bramek; decyzja: kolejna runda Operatora.

## 4. Dane

Surowe wiersze: `dyspozycje/autobot/runs/R-WEB-ENDTURN-BUTTON-ARIA-Q1/endaria-s4242-run3.jsonl` (bieg 3, pole `poll`).
