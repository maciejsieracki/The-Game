# Niezależny Evaluator R2-I — integracja na `main`

**Werdykt: PASS-WITH-NOTES. Etap ewaluacji integracyjnej zakończony.** Oceniony
zakres: bieżące hunki `battleScene.ts`, świeży raport Operatora R2-I i zachowane
evidence w `evidence/operator-r2i-integrated/`. Nie zmieniałem produktu ani nie
wykonywałem commit/deploy/push.

## Potwierdzone

- Zapisane asercje w świeżym Chromium mają **15/15 PASS**, bez błędów przeglądarki
  ani konsoli. JSON ma wszystkie 15 wyników `true`; w runie są trace, wynik i
  zrzut ekranu. Budowa użyła bieżącego źródła integracyjnego (`main` w HEAD
  `c0724801` plus jawnie pokazane, niezatwierdzone hunki), 919 modułów.
- W 28v28 (20 jednostek dystansowych, 8 konnych/rydwanów po stronie gracza)
  pierwsza kolejka uruchomiła 28/28 aktywacji; 8 jednostek zmieniło pozycję, a
  `_queuedOrderUnitIds` spadło do zera. Ścieżka pointerowa w drugim cyklu wysłała
  bezpośredni rozkaz dla `atk27`, który nie został odfiltrowany jako oczekujący:
  jeden immediate perform zakończył się, pozycja zmieniła się `(30,72) → (31,71)`.
  Kliknięty heks `(31,72)` oraz zapisany offset `{dc:0,dr:-4}` zgadzają się z celem
  rozkazu `(31,68)`.
- Dodatkowy probe używa produkcyjnych `_activateNext` i `_activateUnit` z samym
  `_schedule` zastąpionym stubem. Martwy wpis został pominięty i usunięty z kolejki;
  żywy następny wpis został obsłużony, a kolejka na końcu była pusta. Pole JSON
  `deadActivated` jest myląco nazwane (`!dead.acted && dead.dead`); nie oznacza
  faktycznej aktywacji martwej jednostki. Warunek asercji testuje tę wartość oraz
  kolejkę i stan żywej jednostki.
- Follow-up obserwował kolejkę przez 60 s (wtedy `turnIdx=46`) i dodatkowo czekał
  na zakończenie ewentualnego perform. W zapisanym śladzie `atk27` ma jeden
  zakończony immediate perform, bez zwykłego `_activateUnit` i bez drugiego
  perform; pozycja w tym okresie się nie zmieniła. Overlap nie jest potwierdzony
  w tym przebiegu; test nie dowodzi, że nie może wystąpić w innych stanach.
- Niezależnie sprawdziłem `node --check`, `npx tsc --noEmit --pretty false` oraz
  `git diff --check` — PASS. Zmiana produktu w bieżącym worktree ogranicza się do
  dwóch oczekiwanych miejsc w `_activateNext`: czyszczenia ID pomijanej jednostki
  oraz ID po zakończeniu jej zwykłej aktywacji, z odświeżeniem podglądu przy zmianie
  zbioru.

## Uwagi i następny krok

Test pokrywa 28v28, pełny cykl kolejki oraz jeden pointerowy rozkaz podzbioru; nie
pokrywa wszystkich typów rozkazów ani limitu maksymalnego rosteru. `deadActivated`
warto w przyszłej kosmetycznej poprawce testu przemianować na `deadSkipped`, ale
aktualna wartość i asercja są jednoznaczne przy odczytaniu wyrażenia.

**Nie ma podstaw do osobnego błędu o podwójnym ruchu na podstawie tego runu.**
Powiązany temat `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1` pozostaje otwarty ze względu
na szerszy zakres ręcznego sterowania, nie z powodu potwierdzonego overlapu.

Następny etap: obrona/Final Control na dokładnym zintegrowanym worktree, po czym
commit selektywnych hunks i artefaktów do `main`, kontrola końcowa, deploy Roboczej
i push z odczytem zdalnym. Aktualny worktree nadal ma niezatwierdzone zmiany.
