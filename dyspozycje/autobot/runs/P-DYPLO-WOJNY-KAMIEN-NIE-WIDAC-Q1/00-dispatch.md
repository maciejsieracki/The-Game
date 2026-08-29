# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`
GOAL: **Audyt pomiarowy, nie naprawa.** Odpowiedzieć liczbami na pytanie właściciela:
czy w epoce Kamienia wojny w ogóle wybuchają, ile ich jest, kiedy, i **dlaczego gracz
ich nie odczuwa**. Zero zmian w mechanice bez osobnej decyzji.

## Wyzwalacz — ECHO właściciela

> „Wydaje mi się, że cywilizacje w epoce kamienia nadal nie wypowiadają sobie wojen, chociaż
> po 20 turach miałyby je wypowiadać. Możliwe, że chodzi o to, że dłużej zajmuje im przejęcie
> własnych państw i miast, i dopiero po przejęciu mogą to robić, bo tak w sumie powinno być.
> Ale jakoś nie widzę efektu, żeby na przykład ktoś wypowiedział mi wojnę."

## USTALENIA RECONU — zweryfikuj, ale nie odkrywaj od nowa

**Mechanizm ISTNIEJE i jest kompletny.** `gra/src/game/forced-war-stone.ts`:
`WOJNA_KAMIEN_WYMUSZONA_START_TURY = 20`, `..._MAX_MIASTA_ZDOBYTE_LUB_STRACONE = 2`,
`..._ODPOCZYNEK_TUR`, `..._COOLDOWN_TA_SAMA_CYWILIZACJA_TUR`. Podpięty w `main.ts:1070-1080`
(import), `:28014-28030` (wpis pending po turze 20), `:28058-28092` (wybór celu),
`:28111`, `:28148`, `:28184` (konsumpcja). Decyzja: `docs/decyzje/R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1.md`.
Bramki **zielone**: `forced-war-stone-test` 32/0, `forced-war-stone-main-guard-test` 18/0.

**NAJWAŻNIEJSZE USTALENIE — prawdopodobna odpowiedź na pytanie właściciela:**
`main.ts:28063-28069` buduje listę kandydatów z filtrem **`oid > 0`**. Owner `0` to gracz.
**Wymuszona wojna Kamienia NIGDY nie może wycelować w gracza.** To jest zgodne z literą
decyzji („cel ma być najbliższą terytorialnie cywilizacją AI"), więc **nie jest to defekt
implementacji** — ale dokładnie tłumaczy zdanie „nie widzę efektu, żeby ktoś wypowiedział
mi wojnę". Operator MA to potwierdzić pomiarem, a nie przyjąć z dispatchu.

Osobna, druga ścieżka: zwykłe `wypowiedz_wojne` (`ai.ts:4075-4076`, `:4372-4374`) MOŻE
wycelować w gracza, ale wymaga jednocześnie: `!stanWojny`, wrogiej relacji,
`respektWzgledny >= PROG_WOJNA_SILA = 0.6` (AI co najmniej 1,5× silniejsza) oraz
`agresja >= PROG_WOJNA_AGRESJA = 0.5`. **W epoce Kamienia przewaga 1,5:1 nad graczem może
być rzadka** — to druga hipoteza do zmierzenia, nie do założenia.

## ZADANIE — wyłącznie pomiar i raport

1. **Czy wymuszona wojna Kamienia w ogóle wybucha?** Przebieg ~60 tur, kilka ziaren mapy.
   Podaj: ile razy, w której turze, między którymi cywilizacjami, ile trwała, jak się
   skończyła (2 miasta / odpoczynek / cooldown).
2. **Czy którykolwiek AI wypowiada wojnę GRACZOWI w Kamieniu?** Ten sam przebieg.
   Jeśli zero — rozłóż na czynniki: dla każdej pary (AI, gracz) i każdej tury podaj, **który
   warunek** był niespełniony (`stanWojny` / relacja / `respektWzgledny` / `agresja`).
   Rozkład wartości `respektWzgledny` AI-vs-gracz przez 60 tur (min/mediana/max) jest
   kluczową liczbą tego audytu.
3. **Zweryfikuj hipotezę właściciela** („dłużej zajmuje im przejęcie własnych państw-miast").
   Zmierz, kiedy AI kończy przejmowanie miast-państw w swoim klastrze i czy to koreluje
   z momentem pierwszej wojny. Właściciel sam napisał, że „tak w sumie powinno być" — więc
   jeśli korelacja jest, to **potwierdzenie projektu, nie defekt**; powiedz to wprost.
4. **Potwierdź lub obal ustalenie o `oid > 0`** — czy gracz jest strukturalnie wykluczony
   jako cel wymuszonej wojny Kamienia. Pomiarem, nie odczytem kodu.
5. Sprawdź, czy wojny między AI **są w ogóle widoczne dla gracza** (panel Wydarzeń,
   dyplomacja, mapa). Jeśli wybuchają, ale gracz nie dostaje o nich żadnego sygnału —
   to osobne znalezisko o realnym znaczeniu i ma trafić do rejestru.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

- **ZAKAZ zmieniania mechaniki w tym temacie.** To audyt. Jedyne dozwolone zmiany w `gra/src`
  to **zero**. Jeśli znajdziesz defekt — opisz go, nie naprawiaj. Naprawa = osobny temat
  po decyzji właściciela.
- **ZAKAZ odpowiadania „bramki są zielone, więc działa".** Bramki 32/0 i 18/0 pinują kontrakt
  jednostkowy; właściciel pyta o zachowanie w rozgrywce. To dwie różne rzeczy i mylenie ich
  jest dokładnie tym, przed czym ostrzega §13a.
- **ZAKAZ raportowania „zero wojen" bez rozbicia na powód.** „Nie wybuchły" bez wskazania
  blokującego warunku to brak dowodu, nie wynik.
- Pomiar ma iść przez **prawdziwą pętlę tury** (`decideAITurn` / ścieżka `main.ts`), nie przez
  ręczne wołanie predykatów w izolacji — inaczej mierzysz swój harness, nie grę.
- Podaj **ziarna i liczbę powtórzeń**. Jeden przebieg to anegdota; potrzeba kilku.

## Kryteria sukcesu

1. Tabela: przebieg × tura × zdarzenie wojenne (kto komu, z jakiego mechanizmu).
2. Liczba wojen wymuszonych Kamienia w ~60 turach, dla co najmniej 3 ziaren.
3. Liczba wypowiedzeń wojny **graczowi** + rozkład `respektWzgledny` AI-vs-gracz.
4. Jednoznaczna odpowiedź na pytanie 4 (gracz wykluczony jako cel: TAK/NIE, dowód).
5. Odpowiedź na pytanie 5 (czy gracz w ogóle widzi wojny AI-AI).
6. `tsc --noEmit` 0 błędów; 5 bramek referencyjnych zielonych; `git status` czysty
   w `gra/src` i `gra/data` (dowód, że audyt niczego nie zmienił).

## Izolacja

Gałąź `autobot/P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1` od `origin/main`, worktree per rola.

## Allowlista

`gra/tools/*` (wyłącznie nowy harness pomiarowy) · raporty runu.
**`gra/src/**` i `gra/data/**` — ZERO ZMIAN.** `git status` jest dowodem.

**DWA RÓWNOLEGŁE TEMATY (§2b):** `P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1`
(`techDiscoveryNotice.ts`, `entityCards/*`, `sidePanelHud.ts`, `main.ts` ~`:26185`) oraz
`R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1` (`improvement-build.ts`, `hexContextTooltip.ts`,
`auto-improvements.ts`, `terrain-improvements.json`). Ty i tak nie ruszasz `gra/src`,
więc kolizja jest niemożliwa — ale nie zakładaj tego, tylko trzymaj `git status` czysty.

## HIGIENA URUCHOMIEŃ

Każde wywołanie w `timeout`. NIE uruchamiać `map-gen-regression-test` — napisz własny,
wąski harness generujący mapę. 60 tur × kilka ziaren potrafi trwać: **commituj cząstkowe
wyniki W TRAKCIE**, żeby awaria nie skasowała pomiaru. C-001: zakaz `npm run build`/`dev`.
Zakaz `npx`, zakaz `git add -A`. Brak dowodu zgłaszaj jako brak dowodu (§13a).

## Pętla

Operator → Evaluator → Final Control → raport do właściciela. Limit 5 rund.
Model/effort: **Opus 5 High dla wszystkich trzech ról**. `opts.model` jawnie (C-062).
**Ten temat nie kończy się integracją kodu** — kończy się liczbami i decyzją właściciela.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–6 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
