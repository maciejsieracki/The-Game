# R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1 — obrona Operatora (runda 2/5)

STATUS: BLOCK (defekt NIE jest udowodniony; strażnik żywy zwraca BLOCKED, nie PASS ani FAIL; decyzja orkiestratora wymagana)
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1
GOAL: otwarty panel miasta ma pokazać nowo dostępną pozycję po odkryciu technologii bez ponownego otwierania; reguły dostępności bez zmian.
ZMIANY-COMMIT: kandydat 84ee3723d (baza 1dd3958be). Commit obrony (gałąź `autobot/R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1-r2`, SHA w polu sha): `gra/src/main.ts` (hak testowy `prepareNonEraCompletion(techName?)` — opcjonalna konkretna technologia; logika odświeżania bez zmian), `gra/tools/open-panel-refresh-after-tech-live-test.cjs` (przepisany), `dowody/` (4 pliki JSON). Reguły dostępności, `gra/data`, diplomacy*, war-weariness*, battleScene.ts nietknięte.

## Odpowiedzi na zarzuty Evaluatora

1. **Test nie izoluje odkrycia technologii — PRZYJMUJĘ.** Potwierdzone: wynik „FAIL na kandydacie bez techu” był artefaktem. Stałe okno 70 linii przesuwało granicę bloku przy każdej zmianie długości wcześniejszego wiersza, a skarbiec ustawiany był PO pierwszym odczycie A. Poprawka: skarbiec ustawiany przed A; koniec bloku = nagłówek „Jeszcze zablokowane” (zamiast stałego okna). Po poprawce kontrola bez techu i z techem NIE różnią się w bloku listy budowy (kontrola: `visibleChange=false`). Nowa niezależna prawda: w tym stanie gry technologia Murarstwo (odblokowuje „Mury kamienne”) NIE zmienia bloku „Dostępne do budowy” (już tam są) — test zwraca BLOCKED.
2. **Brak czerwonego testu na bazie dla ścieżki EOT — PRZYJMUJĘ częściowo.** Zbudowano bazę 1dd3958be z tym samym hakiem testowym (bez wywołań odświeżenia) — poza repo. Wynik ze starym oknem: FAIL; po poprawce bloku: BLOCKED (ta sama liczba wierszy, brak różnicy). Czerwień na bazie nie jest więc dowodem defektu — tylko artefaktu okna.
3. **Pokrycie paneli (rekrutacja, handel, wioska) — PRZYJMUJĘ jako lukę, NIE ZMIERZONO.** Nie dodano testów dla `refreshEmpireRecruitPanel`, handlu technologią ani nauki wioski.
4. **Scroll/zaznaczenie/wyszarzenie — PRZYJMUJĘ jako lukę, NIE ZMIERZONO.** Brak asercji; selektorów DOM dla przewijania nie zidentyfikowano w tej rundzie.
5. **Hak testowy w main.ts / zależność od haków NNS — PRZYJMUJĘ częściowo.** Hak `__eraTestDebug.*` jest istniejącym wzorcem test-only w main.ts (np. `__eraTestDebug.endTurn`, `getPlayerState`). Usunięto zależność od `setSpichlerzPanstwa` (zwracało false); zostaje tylko `__nnsMeasureDebug.setPlayerTreasury`. Hak nie zmienia reguł ani ścieżki odświeżania.
6. **Jakość testu — PRZYJMUJĘ częściowo.** Katalog dowodów zmieniony na `dowody` (konwencja repo). Karta odkrycia nadal nie jest zamykana (`popupClosed:false`): leży poza blokiem listy (linie ~240+ w pełnym tekście), więc nie wpływa na blok po poprawce. Powtarzalność: test z Murarstwo uruchomiony 3× na kandydacie (wyniki zgodne: BLOCKED/PASS zależnie od wersji okna — patrz dowody), NIE ZMIERZONO 2× pod rząd dla wersji po poprawce bloku.

## Wynik kluczowy (dowody w `dowody/`)

| Przebieg | Okno bloku | Wynik |
|---|---|---|
| Kandydat 84ee3723d, tech Murarstwo | stałe 70 linii | PASS (artefakt; `visibleChange=true` z przesunięcia okna) |
| Baza 1dd3958be + hak, tech Murarstwo | stałe 70 linii | FAIL (artefakt: jeden końcowy wiersz w oknie) |
| Kandydat, kontrola bez techu | stałe 70 linii | FAIL (ten sam artefakt bez techu) |
| Kandydat, tech Murarstwo | do „Jeszcze zablokowane” | BLOCKED: `visibleChange=false` |
| Baza + hak, tech Murarstwo | do „Jeszcze zablokowane” | BLOCKED: `visibleChange=false` |
| Kandydat, kontrola bez techu | do „Jeszcze zablokowane” | BLOCKED: `visibleChange=false` |

Wniosek: poprzednie FAIL/PASS nie odróżniały odświeżenia od przesunięcia okna. Nie udało się w tej rundzie znaleźć technologii, która faktycznie dopisuje nową pozycję do bloku „Dostępne do budowy” w ustawieniu testowym (kandydat: Obróbka drewna — brak nowego wiersza; Murarstwo — brak zmiany bloku).

## Bramki i testy (wyniki z surowego wyjścia, build w kopiach poza repo)
- `tsc --noEmit` (kopia gra/ z kodem commita obrony): exit 0.
- logic-test: `LOGIC OK (213/213)`; tech-tree-test: `20 pass, 0 fail`; research-test: `ALL GREEN`; unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test: `All sanity checks passed.` — wszystkie exit 0.
- army-panel-recruit-remove-test: `21 passed, 0 failed`; ai-rekrutacja-parytet-test: `7 passed, 0 failed`.

## BLOKADY
- Nie znaleziono technologii w ustawieniu testowym, która zmienia blok „Dostępne do budowy” — defekt z GOAL nieodtworzony, ale też nieobalony.
- Brak asercji dla rekrutacji imperium, handlu, wioski, przewijania i wyszarzeń (zarzuty 3–4).

## RUNDY
2/5 (runda 1: 84ee3723d; runda 2: ta obrona). Wynik rundy: BLOCK — bez zmiany werdyktu orkiestratora.

## NASTĘPNY KROK
Orkiestrator / Final Control do wyboru:
(a) wskazać tech lub scenariusz (np. miasto z innym zestawem wierszy), który faktycznie dopisuje pozycję do bloku, i powtórzyć test (oczekiwane: PASS na kandydacie, FAIL na bazie z hakiem);
(b) uznać defekt za nieodtworzony w tym stanie gry, zamknąć temat PASS „nie odtworzono” bez zmian kodu (kandydat 84ee3723d wycofać lub zostawić tylko test).
Dopóki nie ma (a) lub (b), kandydat 84ee3723d nie powinien przejść FC jako „naprawa”.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Stała lista ruchów: `refreshOpenPanelsAfterTechDiscovery()` w kandydacie wywołuje `refreshEmpireRecruitPanel()` — niezbadane w żywo.
- Zauważony poza zakresem: kontrola bez techu pokazuje, że otwarty panel miasta po samym EOT nie jest odświeżany (ten sam wzorzec co w zarzucie 1 Evaluatora) — osobny temat, jeśli to ma być poprawne.
- Zamknięcie karty odkrycia technologii: przycisk „Zamknij” zamyka też panel miasta (uwaga z 10-operator-claude.md) — poza zakresem.
