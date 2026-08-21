# 00-dispatch — P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1

**Data:** 2026-08-21
**Zgłoszone przez:** właściciela, w czacie (zrzut ekranu panelu bocznego wydarzeń)
**Rejestr:** `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, sekcja „NOWE ZGŁOSZENIA GRA 2026-08-20"
**Izolacja:** osobny branch `autobot/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1` (NIE `main`) — właściciel
robi w tym samym czasie deploy z innego agenta i push na `main`; ten temat ma zerowy kontakt
z `main` do czasu wyraźnej autoryzacji integracji. Bez push na żadnym etapie.

## GOAL

Karty informacyjne „Koniec tury" w panelu bocznym wydarzeń (`SidePanelEvent`, `kind:'info'`)
powielają się — jeśli w tej samej turze kilka niezależnych źródeł (np. kilka równoległych
wyrębów lasu, `main.ts` ~linia 25635, pętla po `hexClearingStates`) wygeneruje IDENTYCZNY
tekst („Wyrąb: +25 Drewna (pozostało 0 tury)"), dziś każde wystąpienie dostaje własną, osobną
kartę w panelu — zrzut właściciela pokazywał 6+ identycznych kart w rzędzie. Cel: zdarzenia
`kind:'info'` o identycznej treści (title + subtitle po stripie HTML) w obrębie JEDNEJ tury
mają się łączyć w JEDNĄ kartę z widoczną liczbą wystąpień, zamiast zaśmiecać panel powtórzeniami.

## Zakres (NARROW, świadomie ograniczony)

- Punkt scalania: `deferredHintsToSidePanelEvents()` w `gra/src/game/eot-event-defer.ts` —
  jedyne miejsce, które zamienia `DeferredEotHint[]` na `SidePanelEvent[]` z etykietą „Koniec
  tury". Scalanie PRZED przydzieleniem id/kind, nie w warstwie renderowania.
- Dotyczy WYŁĄCZNIE wpisów `kind:'info'` (czyli NIE dyplomacji — `isDiplomacy` gałąź zostaje
  bez zmian, każdy wpis dyplomatyczny zostaje osobną kartą, nawet identyczny tekstowo —
  ryzyko: zlanie dwóch osobnych negocjacji w jedną kartę byłoby mylące; brak dowodu, że to
  w ogóle występuje w praktyce, więc nie rozszerzać zakresu bez potrzeby).
- Klucz scalania: dokładne dopasowanie `title` + `subtitle` (po stripie HTML, jak dziś).
  Kolejność wynikowej listy: pozycja PIERWSZEGO wystąpienia w grupie (nie przesuwać scalonej
  karty na koniec).
- Scalona karta pokazuje liczbę wystąpień w sposób czytelny dla gracza (np. dopisek do
  `subtitle`, forma dowolna, ale MUSI być jednoznaczna — nie samo „×4" bez kontekstu).
  Odmiana polska liczby mnogiej (patrz istniejący wzorzec `pluralPl` w `sidePanelHud.ts`,
  można zaimportować albo zduplikować lokalnie — decyzja Operatora, uzasadnić w raporcie).
- id wynikowych kart: zachować format `eot-hint-${turn}-${i}`, `i` = indeks W SCALONEJ liście
  (nie oryginalny indeks przed scaleniem) — inaczej możliwe kolizje/dziury w numeracji.
- NIE dotykać: `sidePanelHud.ts` (renderowanie już iteruje po dowolnej liczbie `SidePanelEvent`,
  nie wymaga zmian), `main.ts` (punkty wywołania `showHintMessage` zostają bez zmian — scalanie
  ma być defensywne na wyjściu kolejki, nie wymagać zmiany KAŻDEGO miejsca, które coś tam wrzuca).

## Allowlista

- `gra/src/game/eot-event-defer.ts` (jedyna zmiana produkcyjna)
- `gra/tools/eot-event-defer-test.cjs` (rozszerzenie testu o nowe przypadki)
- `dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/` (artefakty etapów)

Nic poza tym. Zero zmian w `main.ts`, `sidePanelHud.ts`, `tokens.css`, innych plikach `gra/`.

## Kryteria końca / testy

1. `gra/tools/eot-event-defer-test.cjs` PASS z NOWYMI asercjami:
   a. 3 identyczne hinty (ten sam `msg`) → 1 `SidePanelEvent`, z widocznym licznikiem
      wystąpień w treści.
   b. 2 różne hinty → 2 osobne `SidePanelEvent`, bez zmian względem dziś.
   c. Kolejność: grupa zajmuje pozycję pierwszego wystąpienia, nie ostatniego.
   d. Wpisy dyplomatyczne (marker „ handluje z " / prefiks „Dyplomacja:") NIE są scalane
      z niczym, nawet identyczne z innymi wpisami dyplomatycznymi — zachowanie 1:1 jak dziś.
   e. id wynikowych kart bez kolizji, format `eot-hint-${turn}-${i}` z `i` = indeks po scaleniu.
2. Istniejące testy zależne od tego modułu bez regresji: `era-change-toast-defer-test.cjs`,
   `dyplo-karta-duplikat-komunikat-test.cjs`, `eot-diplomacy-header-test.cjs`,
   `sidepanel-events-toolbar-test.cjs` — uruchomić i potwierdzić PASS w raporcie (liczby przed/po).
3. `tsc` bez nowych błędów w zmienionych plikach.

## Model / effort (Claude Code, kanon R-PROC-AUTOBOT.md §5a)

Operator → Sonnet 5, effort Medium. Evaluator → Sonnet 5, effort High. Final Control → Sonnet 5,
effort High, OSOBNY subagent (nigdy główny agent) — zgodnie z `R-AUTOBOT-FINALCONTROL-SUBAGENT-Q1`.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora NA BRANCHU
`autobot/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1`. Limit 5 rund (`R-AUTOBOT-LIMIT-5-RUND-Q1`) — po
przekroczeniu zgłoszenie do właściciela zamiast dalszego dispatchu. Bez integracji do `main`,
bez push, do czasu wyraźnej autoryzacji właściciela.
