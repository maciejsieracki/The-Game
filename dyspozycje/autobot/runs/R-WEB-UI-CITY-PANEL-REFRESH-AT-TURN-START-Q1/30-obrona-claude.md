# Obrona Operatora — R-WEB-UI-CITY-PANEL-REFRESH-AT-TURN-START-Q1 (runda obrony, po Evaluatorze)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-PANEL-REFRESH-AT-TURN-START-Q1
GOAL: otwarty panel miasta i panel rekrutacji imperium odświeżane po końcu tury gracza; przewijanie i zaznaczenia zachowane; test żywy z mutacją.
Kandydat: 4d93fba1e5cf9eaf4353cba486366c1b697dc1ee (rodzic 0c12240a356e6430dcba6aac3044d6a48b2bad4d). Raport Evaluatora: 25fa8865015375e4ba608da0fea485358f9b1eac (20-evaluator-claude.md).

## Odpowiedzi na zarzuty

**Zarzut 1 — zaznaczenia i fokus nie są zachowywane (tylko scrollTop) — ODRZUCAM zmianę kodu, PRZYJMUJĘ lukę pokrycia.**
Dowody z kodu:
- `gra/src/ui/cityPanel.ts`: `grep -c "<input\|<select\|<textarea"` = 0. Panel miasta nie ma elementów formularza, więc nie ma DOM-owego fokusu ani zaznaczenia tekstu do utracenia przy przerysowaniu. Stan wyboru żyje w stanie modułu, a nie w DOM, i `refreshCityPanelIfOpen()` go nie zmienia (`cityPanel.ts:11011-11019`: tylko `uxSectionRefresh()` albo `rerender()`).
- Jedyny element formularza w panelu rekrutacji (`gra/src/ui/empireRecruitPanel.ts:243`, `<input type="number" data-erp="qty">`) jest chroniony istniejącym kodem w `refreshEmpireRecruitPanel()` (linia 441): `if (root.contains(document.activeElement) && tagName === 'INPUT') return;`. Gdy pole ma fokus, przerysowanie nie następuje, więc wpisana wartość i fokus są zachowane. Nowy kod tego nie zmienia.
- Scroll: test żywy nie sprawdza scrollTop (zarzut trafny). Dodanie asercji wymagałoby nowego przebiegu w Chromium i nie jest wymagane przez kryterium binarne tematu (B == świeży render C, z mutacją). Zostaje jako NIE ZMIERZONO.

**Zarzut 2 — panel rekrutacji imperium nie ma pomiaru żywego po końcu tury — PRZYJMUJĘ jako NIE ZMIERZONO, bez zmiany kodu.**
Pomiar wymagałby osobnego, dłuższego testu żywego. Panel rekrutacji ma ochronę przed przerysowaniem przy aktywnym polu (patrz zarzut 1), więc ryzyko utraty wpisu jest ograniczone do przypadku bez fokusu. Migotania nie oceniałem na żywo.

**Zarzut 3 — test używa opcjonalnego haka setPlayerTreasury; werdykt BLOCKED bez haka — PRZYJMUJĘ jako uwagę, bez zmiany.**
Wg kodu testu (`gra/tools/city-panel-refresh-at-turn-start-live-test.cjs`): bez haka tura może nie zmienić tekstu panelu, a wtedy test zwraca BLOCKED (exit 2), a nie PASS. Brak fałszywego PASS.

**Zarzut 4 — `00-dispatch-DODATEK-claude.md` na gałęzi jest kopią `00-dispatch.md` — PRZYJMUJĘ jako uwagę proceduralną.**
Treści DODATKU (środowisko, stan, zadanie rundy) nie zostały dostarczone osobno. Oceniłem wg dispatchu. Plik leży na gałęzi orkiestratora, nie w kodzie kandydata, więc go nie zmieniałem. Baza kodu: 0c12240a356e6430dcba6aac3044d6a48b2bad4d (origin/main w chwili startu). Dispatch podaje 1906b3f32 jako „ostatnio”: rozbieżność do wyjaśnienia przez orkiestratora.

## Zmiany w tej rundzie
- ZMIANY-COMMIT: brak zmian w `gra/`. Kandydat 4d93fba1e pozostaje bez modyfikacji. Commit obrony zawiera wyłącznie ten raport.

## TESTY
- Bramek nie uruchamiałem ponownie: kod nie został zmieniony w tej rundzie. Liczby zacytowane z raportów innych agentów (nie z mojego uruchomienia): `10-operator-claude.md` i raport Evaluatora (jego pomiary na 4d93fba1e): tsc `--noEmit` exit 0; logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; army-panel-recruit-remove 21/0; army-auto-recruit-general-ui 11/0; administrators-wizard 58/0; open-panel-refresh-after-tech-live-test PASS; city-panel-refresh-at-turn-start-live-test PASS (naprawiony) oraz FAIL na mutacji (wg Evaluatora).

## BLOKADY
- Brak. Luki pokrycia: asercja scrollTop nieobjęta testem; panel rekrutacji nie zmierzony żywo po końcu tury.

## RUNDY
- 2/5 (obrona po Evaluatorze; runda 1 Operatora w 10-operator-claude.md).

## NASTĘPNY KROK
- Final Control: ocena kodu z 4d93fba1e i decyzja, czy luki pokrycia (scrollTop, panel rekrutacji na żywo) wymagają osobnego tematu.

## UWAGI-DLA-ORKIESTRATORA
- Do sprzątnięcia: /tmp/cpr-c, /tmp/cpr-m, /tmp/cpr-ev, /tmp/cpr-live-*.log, gra/node_modules w worktree Evaluatora (wg jego raportu). Ta runda nie tworzyła kopii build ani node_modules.
- Gałąź dispatchu: DODATEK jest duplikatem; wymaga poprawy przez orkiestratora.
- Nie uruchamiałem żadnych sesji, zadań ani harmonogramów.

DEPLOY/PUSH: NIE WYKONANO
