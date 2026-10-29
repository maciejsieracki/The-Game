# Operator report — R-BATTLE-MODE-SETTING-WIRING-Q1

## Zakres

Podłączono ustawienie `advanced.battleAlwaysManual` do wszystkich trzech wejść walki z udziałem aktywnego gracza: ataku na jednostkę, obrony przed atakiem AI oraz szturmu miasta.

- `Bitwa ręczna i automatyczna` (`true`) zachowuje modal pre-battle z wyborem Auto/Pole bitwy niezależnie od obecności wodza.
- `Bitwa automatyczna` (`false`) rozstrzyga walkę automatycznie bez otwierania modala wyboru.
- Gdy gracz wybierze tryb ręczny bez wodza/generała, modal nadal pozwala wejść na pole bitwy; istniejąca bramka BattleScene uruchamia tam tylko automatyczne rozstrzygnięcie i blokuje indywidualne rozkazy.
- Stary zapis bez tego pola zachowuje dotychczasowy wybór pre-battle. Wartość jest odczytywana z `newGameParams` zapisanych w metadanych sejwu.

## Weryfikacja

- `node tools/pre-battle-defender-retreat-test.cjs` — PASS; dodatkowy przypadek potwierdza callback Auto bez wyświetlenia overlay w trybie automatic-only.
- `node tools/battle-manual-choice-contract-test.cjs` — 12/12 PASS; trzy wejścia walki przekazują politykę ustawienia, a gate wodza pozostaje odrębny od wyboru pre-battle.
- `node tools/battle-mode-choice-labels-test.cjs` — PASS; UI wyboru i etykiety obu trybów pozostają poprawne.
- `npm run typecheck` — PASS.
- `npm run build` — PASS, Vite przetworzył 917 modułów.
- `git diff --check` — PASS.

## Etap i uwagi

Operator zakończył implementację i weryfikację; następny krok to niezależny Evaluator (etap 6/11). Nie wykonano merge, deployu ani pushu. Test UI ustawienia jest Chromium; logikę auto-only sprawdza JSDOM, natomiast osobny end-to-end save/reload test z oboma ustawieniami nie został wykonany.
