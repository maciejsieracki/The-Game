# R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1 — DODATEK orkiestratora (runda 1, 2026-11-13)

PRZECZYTAJ dispatch z gałęzi: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1/00-dispatch.md` (na origin/main go nie ma). GOAL i ALLOWLISTA z niego obowiązują, z poprawkami niżej.

BAZA: origin/main f0853a6cc (dispatch podaje stary aeb52465e — nieaktualny). Operator HAIKU, runda 1/5.

## Korekta stanu (od czasu napisania dispatchu wdrożono administratora PAŃSTWA — FALA 677)
- Natywne okna nadal istnieją na main: gra/src/ui/administratorPanel.ts:315 (`window.confirm(administratorHireConfirmText(cur))`) i :324 (`window.confirm('Zwolnić administratora? …')`). CZĘŚĆ 1 (usunięcie natywnych okien) jest OBOWIĄZKOWA i aktualna.
- CZĘŚĆ 2 (rozdzielenie tekstów) mogła być w większości załatwiona przez FALĘ 677 (teksty gracza: „administrator państwa” i „administrator miasta”; wcześniej administrator ulepszeń). Sprawdź AKTUALNY kod: nazwy ról w city-administrator.ts i administratorPanel.ts. Wymagania zastosuj do dwóch faktycznie istniejących typów (administrator PAŃSTWA — auto-ulepszanie terenu dla całego państwa, koszt i utrzymanie ze skarbca; administrator MIASTA — budynek administracyjny + bonusy miasta); popraw TYLKO to, co nadal miesza tematy lub zawiera wspólny ogólny tekst; wypisz w raporcie każde miejsce (plik:linia) i werdykt „już OK / poprawione”. Nie przywracaj nazwy „administrator ulepszeń” w tekstach gracza (decyzja właściciela z FALI 677).
- Zwolnienie: potwierdzenie ma być w grze (istniejący komponent dialogu gry, np. ten używany gdzie indziej w panelach) albo wyłącznie przycisk „Zwolnij” z jednoznacznym tekstem; wybór z uzasadnieniem w raporcie. Koszt zatrudnienia i brak zwrotu po zwolnieniu musi być widoczny w panelu.

## Kryteria końca (binarne)
- Brak `window.confirm`/`alert`/`prompt` w przepływie zatrudnienia i zwolnienia administratora (grep po gra/src/ui/administratorPanel.ts i buildModeHud.ts/cityPanel.ts w sekcjach administratora = 0); nowy test gra/tools/admin-hire-no-native-dialog-test.cjs z mutacją (przywrócenie window.confirm czerwieni test).
- tsc 0; logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; istniejące testy administratora zielone (improvement-administrator-test, city-administrator-test, administrator-panel-real-render-test, improvement-admin-tooltip-real-render-test, admin-panstwo-*), oczekiwania tekstu zaktualizowane tylko tam, gdzie tekst się zmienił.
- Test Chromium (jak istniejące *-real-render-test): po kliknięciu „Zatrudnij” nie pojawia się natywne okno (nasłuch `dialog` w Playwright = 0 zdarzeń); jeśli się nie da, jawnie NIE_ZMIERZONO.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno; Chromium pre-instalowany (playwright), uruchamiaj w pierwszym planie ≤ 590 s. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.
