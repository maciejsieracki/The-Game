# R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1 — dispatch (2026-11-12, zgłoszenie właściciela)

ZGŁOSZENIE WŁAŚCICIELA (dwa punkty):
1. Po zatrudnieniu administratora pojawia się NATYWNE okno przeglądarki („Komunikat z bieżącej strony … OK / Anuluj”). Nie powinno go być w grze. Okno wychodzi z trybu pełnoekranowego (przeglądarka pokazuje pasek kart i zakładek). Źródło: gra/src/ui/administratorPanel.ts:306 (`window.confirm(administratorHireConfirmText(cur))`) — dubluje przycisk „Zatrudnij” w panelu; :315 (`window.confirm('Zwolnić administratora? …')`) — to samo dla zwolnienia.
2. Teksty administratora są uogólnione i mieszają tematy. Administrator ULEPSZEŃ ma mówić WYŁĄCZNIE o automatycznym ulepszaniu terenu w danym mieście (wycinka, farmy, trzoda, irygacja, drogi), koszcie i utrzymaniu. Administrator MIASTA ma mówić WYŁĄCZNIE o bonusach i elementach miasta (budynki, produkcja/podatki/korupcja miasta). Każde miejsce: dwa osobne, konkretne komunikaty, bez wspólnego ogólnego tekstu „Administrator to osoba przypisana…”. Miejsca do przeglądu: administratorPanel.ts ok. :82 i :120, buildModeHud.ts ok. :178, :183, :196, cityPanel.ts ok. :10053–10061.

GOAL (kryteria końca):
(a) przepływ zatrudnienia i zwolnienia administratora NIE wywołuje window.confirm/alert — zatrudnienie potwierdza przycisk „Zatrudnij” w panelu; zwolnienie ma potwierdzenie w grze (istniejący komponent dialogu gry) albo wyłącznie przycisk „Zwolnij” — wybór operatora z uzasadnieniem w raporcie;
(b) pełny ekran nie jest przerywany w tym przepływie (dowód: brak okna natywnego w teście Chromium po zatrudnieniu);
(c) tekst administratora ulepszeń nie wspomina bonusów miasta ani budynków; tekst administratora miasta nie wspomina ulepszeń terenu;
(d) brak wspólnego ogólnego tekstu w obu miejscach; teksty konkretne;
(e) test regresji z mutacją: przywrócenie window.confirm w administratorPanel.ts → test czerwienieje;
(f) bramki: tsc --noEmit; logic-test, tech-tree-test, research-test, unit-replace-test, combat-test; istniejące testy administratora (improvement-administrator-test, city-administrator-test, administrator-panel-real-render-test, improvement-admin-tooltip-real-render-test) zielone albo z jawnie zaktualizowanymi oczekiwaniami tekstu.

POZA ZAKRESEM (nie ruszać, zgłosić w raporcie): inne natywne okna gry — main.ts:9367, main.ts:25930, saveLoadDialog.ts:346, empireDetailPanel.ts:1529, cityPanel.ts:12135. Osobny temat po decyzji właściciela.

ALLOWLISTA: gra/src/ui/administratorPanel.ts, gra/src/ui/buildModeHud.ts, gra/src/ui/cityPanel.ts (tylko sekcje administratora), gra/src/game/city-administrator.ts (tylko teksty), gra/tools/*administrator*-test.cjs oraz nowy gra/tools/admin-hire-no-native-dialog-test.cjs, dyspozycje/autobot/runs/R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1/**.
ZAKAZ: WERSJE.md, JSON balansu, rust-port, push, deploy, npm run build/dev.
BAZA: origin/main aeb52465e (po FALI 668). MODEL: Operator HAIKU 5.5, round 1/5.

## KOREKTA ZAKRESU (właściciel 2026-11-12): DWAJ RÓŻNI ADMINISTRATORZY — nie mieszać
Fakty z kodu (sprawdzone na origin/main aeb52465e):
- ADMINISTRATOR MIASTA (role 'miasto', city-administrator.ts): WYMAGA budynku administracyjnego w mieście (przy jego braku: `ended_no_building`). Ma bonusy miasta (korupcja −10% × skala tieru, Praca +3%, ściągalność; cityPanel.ts ~1361, turn-economy.ts ~2148/~2812). Tekst: budynek, poziom/skala, bonusy i elementy MIASTA (budynki, produkcja, podatki, korupcja, praca miasta).
- ADMINISTRATOR ULEPSZEŃ (role 'ulepszenia', city-administrator.ts ~376–389): NIE wymaga żadnego budynku. NIE ma bonusów miasta ani produkcji/podatków/korupcji. Robi WYŁĄCZNIE automatyczne ulepszanie terenu w tym mieście (wycinka, farmy, trzoda, irygacja, drogi itd.) wg profilu z panelu budowy. Koszt zatrudnienia i utrzymanie płaci skarbiec państwa, nie miasto.

Wymagania dla operatora:
1. Tekst ADMINISTRATORA ULEPSZEŃ (buildModeHud.ts ok. :178/:183/:196, cityPanel.ts ok. :10053–10061, administratorPanel.ts gałąź 'ulepszenia'): ZERO wzmianek o budynku administracyjnym, o bonusach miasta, o produkcji/podatkach/korupcji/pracy miasta, o „robi to w mieście" jako funkcji miasta. Tylko: automatyczne ulepszanie terenu, koszt, utrzymanie, stan (pracuje / brak środków w skarbcu państwa).
2. Tekst ADMINISTRATORA MIASTA (administratorPanel.ts gałąź 'miasto'): wymaga budynku administracyjnego (podać, że bez niego nie zatrudnisz); bonusy i elementy miasta. Bez opisu ulepszeń terenu.
3. Każde miejsce ma DWA osobne komunikaty dotyczące tylko tej kwestii; usunąć wspólny tekst „Administrator to osoba przypisana do jednego miasta…” — zastąpić dwoma konkretnymi.
4. Nie zmieniać mechaniki (role, koszty, warunki) — tylko teksty i natywny dialog.
5. Test regresji dla każdego z dwóch tekstów: asercja „brak słowa budynek/bonus/produkcja w tekście ulepszeń” i „wymaga budynku w tekście miasta” — z mutacją, która je łamie.
