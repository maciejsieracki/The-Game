STATUS: FAIL
DOMAIN: GAME (WEB), wydajnosc render/HUD w koncu tury
TEMAT: R-WEB-PERF-ENDTURN-RENDER-HUD-Q1
GOAL: unia syncUnitsRender+renderLoop+syncStatChips >= -40% lacznie (3 konce tur, 137 miast / 321 jednostek), obraz bez zmian, logika bez zmian.
ZMIANY/COMMIT: oceniany kod 46f3c49ca2e7fe03fe29c15f3a5a430408781d0f (kod gry = R1 ed936904c); obrona 3d9802f99 (tylko 03-obrona-r2.md). Final Control: ten plik, bez zmian kodu.
TESTY: NIE odtworzono na zywo (brak gra/node_modules i duzej gry w tym worktree; NIE_ZMIERZONO). Zweryfikowano dowody w repo: evidence/r2/gate-*.txt wszystkie EXIT=0 (tsc, logic, capture-render-sync, unit-renderer-overlay-sync, city-badge-zoom-lod, geometry-pool, material-pool-pixel, deferral-regression). A/B z ab-aggregate-base-r1-r2.txt: unia 5133->3303 = -35,7% (EOT1 -47,2%, EOT2 -22,7%, EOT3 -31,6%). Diff gra/ vs baza 6a673c838 = tylko main.ts + gra/tools/perf-endturn-render-*.cjs (w allowlisccie); WERSJE.md, gra/data, rust-port nietkniete.
BLOKADY: patrz werdykty.

WERDYKTY ZARZUTOW
1. Kryterium -40% unii niespelnione (-35,7%): DO DECYZJI CZLOWIEKA (przyjac -35,7% w ECHO albo zlecic dalszy temat). Nie zmieniac miary na SUMA po fakcie. R2 dopuszcza PASS-WITH-NOTES, wiec samo to nie jest FAIL.
2. Memo growth / zamrozenie transformacji niewykonane: ODDAL (dispatch R2 dopuszczal PWN po uczciwym opisie, Operator wycenil, nie ukryl). Rekomendacja: osobny temat render (matrixAutoUpdate=false statycznych podgrup + test pikselowy).
3. Allowlista: ODDAL, brak naruszen (potwierdzone git diff --name-only).
4. HUD x1587: ODDAL. pixel-parity-base.txt (build bazy 6a673c838) pokazuje ten sam bbox [1584,838,1587,881], diff 137; szum istnieje na bazie, wyjatek opisu to x1584-1587.
5. Klatki posrednie fazy AI (zetony odroczone przez flushAiCityRenderBatch(false) i deferRefreshFogUnitSync): ODDAL jako ryzyko z warunkiem; NIE_ZMIERZONO (brak harnessu). Wymog dla Operatora R3: zmierzyc/uzasadnic klatke posrednia w fazie AI (zrzut w polowie fazy: zetony widocznych jednostek bez zmian vs baza) albo jawnie zapisac roznice jako wiadoma.
6. Hak i wznowienie po bitwie: NAPRAW (potwierdzone czytaniem kodu). Hak jest zerowany poprawnie (main.ts ~40871 po catch eAILoop; bitwa idzie przez break ownerLoop -> flush -> null), wiec zarzut o wycieku haka odpada. ALE wznowienie `() => { void runAiPhase(); }` (main.ts ~40445) uzywa tego samego domkniecia: odwiedziny miast w wznowionej fazie wolaja aiUnitRenderBatch.markDirty() (~40372), klatki postepu flushuja z withUnits=false (~38690), a jedyny flush koncowy (`flushAiCityRenderBatch()` ~40839) wykonuje sie tylko po pierwszym `await runAiPhase()`. Skutek: po wznowionej fazie AI zetony jednostek zostaja nieaktualne do nastepnego syncUnitsRender (regresja wzgledem bazy, gdzie sync byl natychmiastowy). Poprawka: po wznowieniu wolac flush (np. `void runAiPhase().finally(() => flushAiCityRenderBatch())`), dodac test (statyczny test okablowania jest slaby, nie pokrywa wznowienia; dodac asercje na flush w callbacku wznowienia, najlepiej test zachowania).
7. Brak ponownego A/B: ODDAL (dowody spojne wewnetrznie; mediana n=5 niska moc, szczegolnie EOT3 ze stallem GL SwiftShader obecnym tez na bazie).
8. Deklaracja sprzatania: ODDAL (poza zakresem dowodow; nie zweryfikowano).

Wynik: 1 x NAPRAW (pkt 6) => FAIL. Brak innych blokad.
RUNDY: 2/5 zuzyte; nastepna runda 3/5 (Operator, to samo ID, potem Evaluator i Final Control).
NASTEPNY KROK: Operator R3: (a) flush po wznowieniu fazy AI + test; (b) pomiar klatki posredniej fazy AI (pkt 5); (c) powtorzyc bramki tsc/logic/unit-renderer-overlay-sync/capture-render-sync; (d) opcjonalnie, jesli orkiestrator zdecyduje w ECHO, proba zamrozenia transformacji (pkt 1/2).
SHA DO INTEGRACJI: brak (FAIL). Po PASS integrowac R3 SHA na origin/main (= 6a673c838, kod gra/ nakłada sie czysto: tylko main.ts + tools). Kolejnosc wzgledem origin/rust-port/parity-v2 (b520768b0): najpierw main, parity-v2 pozniej przez REPIN/merge main; parity-v2 ma wlasna, rozbiezna linie gra/, wiec nie integrowac tego commita bezposrednio na parity-v2.
DEPLOY/PUSH: NIE WYKONANO
