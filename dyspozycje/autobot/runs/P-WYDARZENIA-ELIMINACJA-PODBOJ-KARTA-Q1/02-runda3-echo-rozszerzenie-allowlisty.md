RUNDA:  3/5
DATA:   2026-09-12

## ECHO WŁAŚCICIELA (po Final Control rundy 2, DECISION_REQUIRED)

Final Control rundy 2 potwierdził: mechanizm karty/modala (Zarzut 1) poprawny
i naprawiony (ODDAL), ALE treść jest fałszywa dla ścieżki podboju — karta i
modal pokazują „Wchłonięta dyplomatycznie”/kicker „Dyplomacja” nawet gdy
cywilizacja padła w wyniku PODBOJU (Zarzut 2, DO DECYZJI CZŁOWIEKA — naprawa
wymaga dotknięcia `main.ts:8397` i `civElimNotice.ts`, oba POZA allowlistą
rund 1-2).

**ECHO właściciela 2026-09-12: rozszerz allowlistę TERAZ, napraw w rundzie 3.**

## ROZSZERZONA ALLOWLISTA (obowiązuje TYLKO od tej rundy)

- `gra/src/main.ts` — jak dotychczas (branch eliminacji-przez-podbój ok.
  28497-28546) **PLUS** funkcja `recordCivElimEvent()` (ok. main.ts:8397-8410).
- `gra/src/ui/civElimNotice.ts` — **ODBLOKOWANY dla tej rundy WYŁĄCZNIE** w
  zakresie: interfejs `CivElimNoticeOpts` (dodanie opcjonalnego pola) i
  literał `<div class="cen-kick">Dyplomacja</div>` (main.ts:98 w tym pliku) —
  ŻADNYCH innych zmian w tym pliku (layout, style, przyciski, zachowanie
  zamykania).
- Reszta allowlisty z `00-dispatch.md` bez zmian (nowa bramka w `gra/tools/`,
  `dowody/`).

## ZADANIE RUNDY 3

Sparametryzuj przyczynę eliminacji, żeby karta/modal pokazywały PRAWDZIWĄ
przyczynę (dyplomacja vs podbój) zamiast zawsze „Dyplomacja”:

1. `recordCivElimEvent(csOwnerId, civLabel, details, cause?: 'dyplomacja' |
   'podboj')` — nowy, OPCJONALNY 4. parametr, domyślnie `'dyplomacja'` (żeby
   ISTNIEJĄCY call site dyplomatyczny main.ts:28106-28125 mógł pozostać
   BEZ ZMIAN, jeśli tak wybierzesz — albo jawnie przekazać `'dyplomacja'`
   tam też, dla czytelności, Twój wybór, opisz w raporcie). Wewnątrz funkcji:
   `subtitle` warunkowy — dla `'dyplomacja'` zostaje dokładny dotychczasowy
   tekst „Wchłonięta dyplomatycznie — kliknij po szczegóły”; dla `'podboj'`
   nowy tekst, np. „Podbita — kliknij po szczegóły” (dobierz naturalne polskie
   sformułowanie, spójne z resztą UI, i uzasadnij wybór w raporcie). Pole
   `kind: 'diplo'` (main.ts:8405) **NIE ZMIENIAJ** w tej rundzie — to steruje
   filtrowaniem karty w panelu bocznym i jest poza zakresem tego ECHO
   (zmiana `kind` to osobna decyzja, nie proś o nią, po prostu zostaw jak
   jest, nawet jeśli semantycznie „diplo” dla podboju wygląda dziwnie —
   napisz to jako obserwację w BLOKADY, nie naprawiaj).
2. Call site main.ts ~28524 (branch `newOwner!==0 && oldOwner!==0`, ten sam,
   który runda 2 naprawiła) — przekaż `cause: 'podboj'`.
3. `civElimNotice.ts` — `CivElimNoticeOpts` dostaje opcjonalne pole
   `cause?: 'dyplomacja' | 'podboj'` (domyślnie `'dyplomacja'` w
   implementacji, np. `const cause = opts.cause ?? 'dyplomacja';`). Kicker
   (main.ts:98 w TYM pliku, linia z `<div class="cen-kick">Dyplomacja</div>`)
   staje się warunkowy: `${cause === 'podboj' ? 'Podbój' : 'Dyplomacja'}`.
   ŻADNYCH innych zmian w tym pliku.
4. Call site side-panelu, który woła `showCivElimNotice(...)` (znajdź go —
   prawdopodobnie w `openSidePanelEventLink()` case `'civ-elim'`, main.ts) —
   MUSI przekazać poprawny `cause` na podstawie tego, jak zapisano zdarzenie.
   Ponieważ `civElimEventDetails` (main.ts, mapa `id→{civLabel,details}`)
   dziś NIE przechowuje przyczyny, rozszerz TEN WPIS o `cause` (to jest
   WEWNĄTRZ `recordCivElimEvent`, już w allowliście) — zapisz `cause` razem
   z `civLabel`/`details` w `civElimEventDetails.set(evId, {civLabel,
   details, cause})`, i przekaż go dalej w miejscu wołania
   `showCivElimNotice({civLabel, details, cause})`. Sprawdź dokładnie typ
   mapy i miejsce odczytu — to może wymagać drobnej, ale koniecznej zmiany
   typu w tym samym pliku `main.ts` (dozwolone, to ten sam mechanizm co
   `recordCivElimEvent`).

## KRYTERIA KOŃCA RUNDY 3 — DODATKOWE, binarne PRAWDA/FAŁSZ

8. Karta side-panelu dla eliminacji PRZEZ PODBÓJ (AI-vs-AI, `newOwner!==0 &&
   oldOwner!==0`) pokazuje treść odzwierciedlającą PODBÓJ, nie dyplomację —
   zweryfikowane żywym Chromium (rozszerz istniejący scenariusz w
   `wydarzenia-eliminacja-podboj-karta-test.cjs`).
9. Modal po kliknięciu „Szczegóły →” dla tego samego zdarzenia pokazuje
   kicker „Podbój” (nie „Dyplomacja”).
10. Ścieżka dyplomatyczna (main.ts:28106-28125, `annexerId===0`) NADAL
    pokazuje dokładnie ten sam tekst/kicker co przed tą rundą — ZERO
    regresu wizualnego/tekstowego na tej ścieżce (zweryfikuj żywym Chromium
    lub istniejącym testem, jeśli pokrywa to wizualnie).
11. `civElimNotice.ts` — diff ograniczony WYŁĄCZNIE do interfejsu
    `CivElimNoticeOpts` i literału kickera; zero zmian w layoucie/stylach/
    przyciskach/zachowaniu zamykania (zweryfikuj `git diff` linia po linii).

## DOWÓD WIZUALNY (obowiązkowy, uzupełnienie)

Nowy/zaktualizowany zrzut modala pokazujący kicker „Podbój” dla scenariusza
AI-vs-AI (nadpisz lub dodaj obok istniejącego
`dowody/eliminacja-podboj-karta-i-modal-modal.png`) ORAZ zrzut modala dla
ISTNIEJĄCEGO scenariusza dyplomatycznego pokazujący że nadal mówi
„Dyplomacja” (dowód zero-regresu).

## Izolacja (bez zmian)

Ten sam worktree `/home/user/wt-wydarzenia-eliminacja-podboj-karta`, ta sama
gałąź `autobot/P-WYDARZENIA-ELIMINACJA-PODBOJ-KARTA-Q1`, kontynuacja od
commitu `68fad779`.

## Ograniczenia wyjścia

Maks. ok. 450 słów w raporcie. Zakaz `git add -A`. Nie integrujesz, nie
deployujesz, nie pushujesz.
