# R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1
GOAL: zatrudnienie i zwolnienie administratora bez natywnych okien przeglądarki (pełny ekran nieprzerwany); teksty administratora ulepszeń (państwa) i miasta rozdzielone, bez wspólnego ogólnego tekstu.
BAZA: origin/main f0853a6cc (kandydat z dodatku orkiestratora). Dispatch (00-dispatch.md) leży na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie na main.

## ZMIANY-COMMIT
Allowlista dodatku, zmienione pliki:
- gra/src/ui/administratorPanel.ts
  - lead administratora miasta (ok. :88–89): usunięto „Administrator to osoba przypisana do jednego miasta (maksymalnie jeden na miasto).”; zastąpiono tekstem miasta z wymogiem budynku administracyjnego („…wymaga budynku administracyjnego w tym mieście (bez niego go nie zatrudnisz).”).
  - bonusRows ulepszeń (ok. :104): „Bez dodatkowych bonusów do produkcji, podatków ani korupcji.” → „Nie daje żadnych dodatkowych bonusów.” (usunięte słowa miasta).
  - usunięto funkcję administratorHireConfirmText (było używane tylko przez window.confirm).
  - zatrudnienie (ok. :287–291): usunięto window.confirm; „Zatrudnij” w panelu jest potwierdzeniem, wywołuje hooks.onHire() bezpośrednio.
  - zwolnienie (ok. :296–300): usunięto window.confirm; wybór: WYŁĄCZNIE przycisk „Zwolnij” (klasa danger). Uzasadnienie: dispatch dopuszcza ten wariant; koszt i brak zwrotu są widoczne w panelu przed kliknięciem (efekt „Po zwolnieniu … koszt zatrudnienia nie wraca.” oraz ostrzeżenie w sekcji Skutek). Zwolnienie nie jest już chronione dodatkowym krokiem.
- gra/tools/admin-hire-no-native-dialog-test.cjs (NOWY): test statyczny źródła — brak window.confirm/alert/prompt w panelu; wymóg wywołań hooks.onHire()/hooks.onDismiss(); tekst ulepszeń bez produkcji/podatków/korupcji/budynków/bonusów miasta; lead miasta z wymogiem budynku i bez ulepszeń terenu; brak wspólnego tekstu „osoba przypisana”. Zawiera mutacje w pamięci (przywrócenie confirm przy zatrudnieniu, przy zwolnieniu, przywrócenie wspólnego tekstu, bonusy ulepszeń z produkcją, usunięcie wymogu budynku) — każda wykryta.
- gra/tools/administrator-panel-real-render-test.cjs: stub window.confirm zastąpiono nasłuchem Playwright `dialog` (licznik nativeDialogs, oczekiwane 0); asercje A3, A11b–A11d, A13b, A15 zaktualizowane; mutacje E8/E9 przepięte na przywrócenie window.confirm (zatrudnienie → A11d, zwolnienie → A15).
- gra/tools/city-administrator-test.cjs (1 asercja): zwolnienie bez window.confirm.
- gra/tools/admin-panstwo-panel-names-test.cjs (1 asercja): zatrudnienie bez window.confirm i bez pytania „w mieście X”.

Nie zmieniano: WERSJE.md, JSON balansu, rust-port, gra/ poza wymienionymi plikami, zakaz build/dev zachowany.

## Przegląd tekstów (plik:linia z kodu na f0853a6cc → werdykt)
- gra/src/ui/administratorPanel.ts lead państwa (:92) — już OK (tylko państwo / całe Państwo).
- gra/src/ui/administratorPanel.ts bonusRows miasta (:106–115) — OK (bonusy wyłącznie miejskie + budynek administracyjny).
- gra/src/ui/administratorPanel.ts effectRows (:146–163) — OK (osobne frazy „automatyczna budowa budynków” dla miasta, „automatyczne ulepszanie terenu” dla państwa).
- gra/src/ui/buildModeHud.ts:178, :183, :196, AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT (auto-build-gate.ts:112) — już OK (mówią o administratorze państwa / auto-ulepszeniach terenu, bez budynku miasta).
- gra/src/ui/cityPanel.ts ok. :10053–10061 (chipy „Administrator”/„Administrator państwa”) — już OK.
- gra/data/city-administrator-params.json:27 (opis państwa: tylko automatyczne ulepszanie terenu, bez bonusów, utrzymanie ze skarbca) — już OK.
- gra/data/city-administrator-params.json:29 (opis miasta: korupcja, produkcja, podatki, budowa budynków w mieście) — już OK.
- Poprawione w tym temacie: lead miasta (wspólny tekst usunięty), ulepszenia — bonusRows (słowa miasta usunięte).

## TESTY (surowe wyniki z tego uruchomienia)
- npx tsc --noEmit: exit 0 (bez błędów).
- logic-test: 213 PASS, 0 FAIL (exit 0).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- combat-test: All sanity checks passed.
- improvement-administrator-test: 59 passed, 0 failed.
- city-administrator-test: 119 passed, 0 failed.
- admin-panstwo-panel-names-test: 26 pass, 0 fail.
- admin-hire-no-native-dialog-test (nowy): WSZYSTKO ZIELONE (realny kod 0 naruszeń; 5/5 mutacji wykrytych).
- administrator-panel-real-render-test (Chromium): 49 PASS / 0 FAIL (w tym A11d/A15 = 0 natywnych okien; E8 i E9 mutacje czerwienią test).
- improvement-admin-tooltip-real-render-test: 14 pass, 0 fail.
- Uwaga: real-render i tooltip test nadpisują zrzuty w dyspozycje/.../evidence/*.png; zrzuty przywrócono do stanu z git (nie są częścią commita).

## BLOKADY
- Brak. (Chromium uruchomił się lokalnie; nasłuch `dialog` potwierdza brak natywnych okien w przepływie zatrudnienia i zwolnienia.)

## POZA ZAKRESEM (UWAGI-DLA-ORKIESTRATORA)
Nadal występują natywne okna w innych miejscach gry (nie ruszane, zgodnie z dispatchem):
- gra/src/ui/cityPanel.ts:12090 (window.prompt „Nazwa listy”), :12122 (prompt „Nowa nazwa listy”), :12135 (window.confirm „Usunąć listę”), :12608 (window.prompt „Nowa nazwa miasta”).
- gra/src/ui/saveLoadDialog.ts:346 (window.confirm).
- Z dispatchu do osobnego tematu po decyzji właściciela: gra/src/main.ts:9367, main.ts:25930, empireDetailPanel.ts:1529.
- Zwolnienie administratora jest teraz jednoetapowe (przycisk „Zwolnij”). Jeśli właściciel woli potwierdzenie w grze, trzeba osobnego tematu (komponent dialogu gry).

## RUNDY
1/5 — PASS-WITH-NOTES (jedna runda, bez FAIL).

## NASTĘPNY KROK
Evaluator: przegląd diffu (gra/src/ui/administratorPanel.ts, testy), potwierdzenie decyzji „zwolnienie tylko przyciskiem” z właścicielem w ABC (opcjonalnie).

## DEPLOY/PUSH: NIE WYKONANO
