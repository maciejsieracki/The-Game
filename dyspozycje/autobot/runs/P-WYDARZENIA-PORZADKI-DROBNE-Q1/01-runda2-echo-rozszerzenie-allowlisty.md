RUNDA:  2/5
DATA:   2026-09-12

## ECHO WŁAŚCICIELA (po BLOCK rundy 1, zgodne stanowisko Operator/Evaluator/Obrona)

Runda 1 (`7a95857c`, worktree `/home/user/wt-wydarzenia-porzadki-drobne`)
poprawnie naprawiła N1 (ternary `getEventLink`) i N2
(`tradeRouteEventPlayerCityIds.clear()`), zielone: `tsc`, 5 bramek
referencyjnych, `side-panel-event-link-test.cjs` 37/37. Jedyny problem: poprawny
fix N1 nieuchronnie usuwa dosłowny, przedfixowy fragment kodu, który
kotwica `(0b)` (linia 228-230) w `gra/tools/sidepanel-event-przekierowania-
real-render-test.cjs` sprawdza LITERALNYM regexem — plik był POZA allowlistą
rundy 1. Wszystkie trzy role (Operator, Evaluator, Obrona) zgodnie
potwierdziły: to nie jest regres zachowania (afordancje/klik/kontrole
negatywne w tym samym pliku nadal zielone), tylko kruchy test dopasowany do
tekstu źródła zamiast do zachowania.

**ECHO właściciela 2026-09-12: rozszerz allowlistę, popraw regex kotwicy
`(0b)` w rundzie 2.**

## ROZSZERZONA ALLOWLISTA (obowiązuje TYLKO od tej rundy)

- `gra/src/main.ts`, `gra/tools/side-panel-event-link-test.cjs` — jak
  dotychczas (bez zmian względem rundy 1).
- `gra/tools/sidepanel-event-przekierowania-real-render-test.cjs` —
  **ODBLOKOWANY dla tej rundy WYŁĄCZNIE w zakresie kotwicy `(0b)` (linia
  ok. 228-230)** — zaktualizuj wzorzec regex do nowego kształtu kodu
  `getEventLink` (ternary obejmujący cały łańcuch `??`, po fixie N1 z
  rundy 1), BEZ zmiany semantyki asercji (co test sprawdza ma pozostać
  identyczne — że karta blokująca nigdy nie dostaje linku z resolwera —
  zmienia się WYŁĄCZNIE dopasowanie źródła). ŻADNYCH innych zmian w tym
  pliku (sekcje A/B/C i pozostałe kotwice nietknięte).

## ZADANIE RUNDY 2

1. Zaktualizuj regex kotwicy `(0b)` tak, by dopasowywał NOWY kod
   `getEventLink` z rundy 1 (`ev.blocking === true ? null : (...)`), zamiast
   starego, usuniętego kształtu.
2. Dowiedź mutant-testingiem: kotwica nadal wykrywa regresję (np. tymczasowe
   cofnięcie fixu N1 powinno ją poczerwienić) — nie tylko dopasowuje nowy
   tekst bezmyślnie.
3. Uruchom CAŁY plik `sidepanel-event-przekierowania-real-render-test.cjs`
   od zera (sekcje A/B/C + kotwica 0b) — wszystko zielone, zero regresu.
4. Jeśli w rundzie 1 zgłoszono niestabilność (`Target page ... has been
   closed`, timeout przy `trade-lost-12-r9`) — zweryfikuj czy to się
   powtarza; jeśli tak, opisz w raporcie jako oddzielną obserwację
   (środowiskowe, nie związane z tym fixem), nie próbuj tego naprawiać w
   tej rundzie (poza allowlistą/zakresem).

## KRYTERIA KOŃCA RUNDY 2 — DODATKOWE, binarne PRAWDA/FAŁSZ

7. Kotwica `(0b)` w `sidepanel-event-przekierowania-real-render-test.cjs`
   zielona, dopasowana do aktualnego (po fixie N1) kodu `getEventLink`.
8. Cały plik testowy (`sidepanel-event-przekierowania-real-render-test.cjs`)
   zielony w całości, uruchomiony od zera.
9. Dowód mutant-testingu dla kotwicy `(0b)` (czerwona przy cofniętym fixie
   N1, zielona przy obecnym stanie).
10. Diff w tym pliku ograniczony WYŁĄCZNIE do kotwicy `(0b)` — zero innych
    zmian (zweryfikuj `git diff` linia po linii).

## Izolacja (bez zmian)

Ten sam worktree `/home/user/wt-wydarzenia-porzadki-drobne`, ta sama gałąź
`autobot/P-WYDARZENIA-PORZADKI-DROBNE-Q1`, kontynuacja od commitu `7a95857c`.

## Ograniczenia wyjścia

Maks. ok. 350 słów w raporcie. Zakaz `git add -A`. Nie integrujesz, nie
deployujesz, nie pushujesz.
