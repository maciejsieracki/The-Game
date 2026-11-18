STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar na żywo; bez zmian logiki gry)
TEMAT: R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1
GOAL: (a) żywy render wiersza D (dopłata traktatu) w oknie audiencji + zrzut + asercje + mutacja; (f-DOM) r z DOM okna.
ZMIERZONO tej rundy: (a) i (f-DOM). (d)/(f) z r2 bez zmian (nie przepisywane). (d-rozejm): NIE ZMIERZONO (nie ruszane w r3; kod r2 w bazie).

ZMIANY-COMMIT (baza 2b54ffd58; kod w commicie z polem sha):
- gra/tools/diplo-treaty-pay-window-live-verify-2-test.cjs (nowy, 26 asercji, 3 przypadki, osobny Chromium na przypadek).
- gra/src/main.ts: JEDEN hak (tylko stan testowy, pod ?civTest=1): `__truceTestDebug.pushNegotiationForTest(..., extraPayload)` — dodany opcjonalny 7. parametr dołączany do payloadu wpisu stołu (np. {borderMilitary:true}). Wpis powstaje realnym createNegotiation; zero zmian logiki. Ścieżka istniała (pushNegotiationForTest jest w main.ts; Obrona r2 go nie znalazła).
- dowody/: pay-window-D-case1.png, pay-window-D-case3.png (1400x900, DSF 1, ~400 KB każdy), logi pay-window-live-r3.log i pay-window-mutation-r3.log (lokalnie w dowody/, logi mogą być gitignorowane).

METODA: AI(silniejsza 1,3x; bonus=(r·gracz−ai)/2) proponuje przemarsz graczowi -> push wpisu -> openAudience -> `.da-pn-balance-bar[data-negot-id]` -> tooltip komórki bilansu zawiera wiersz D -> REALNY klik „Przyjmij" (accept-package) -> stan zasobów przed/po.

TESTY (surowe):
- Live: 26/26 OK. Wiersze D: W-A „606 złoto (pokrywa 606 PN…)"; W-B „100 złoto, 1700 brąz (pokrywa 606 PN…)"; W-C „technologia Obróbka drewna, 596 złoto (pokrywa 606 PN…)".
- (iii) przelew == wiersz: W-A złoto −606/+606; W-B złoto −100/+100, brąz −1700/+1700; W-C tech przeszła do AI, złoto −596/+596. Oferta zeszła ze stołu.
- (ii) brak surowych ID (City\d+, zloto, braz…, negot-) w wierszu; polskie nazwy ze słownika.
- (f-DOM) r z tooltipu okna = 1,3 (Ty 2847 · Oni 3702) w 3/3 — anomalia r z r1 wyjaśniona (nachylenie 2).
- Mutacja (kopia diplomacyAcceptanceBalance.ts, usunięta linia treatyPaymentRowHtml, bundle /tmp/lv3-mut): 1/4 passed, 3 FAIL (i, i2 dla każdego przypadku wykrywane) -> test czerwienieje. Źródło przywrócone z kopii, `cmp` zgodne, git status czysty.
- Bramki: tsc --noEmit 0; logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6.

BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA:
1. Wiersz D jest w natywnym `title` (zasada „najważniejsze na wierzchu"); headless Chromium nie rysuje go w zrzucie, więc zrzut pokazuje okno (Przyjmij aktywne, bilans 0), a treść wiersza jest dowodzona DOM-em.
2. Kosmetyka (nie naprawiano): w tooltipie wiersz D i wiersz podziału PW pojawiają się dwukrotnie, rozdzielone „ · " (plainTextWithTitles dubluje tekst z title zagnieżdżonego). Kandydat na osobny R-WEB-UI-*.
3. Procesy tła zakończone; ścieżki /tmp: /tmp/lv3-bundle, /tmp/lv3-mut, /tmp/lv3-shots, /tmp/lv3x; gra/node_modules w worktree.
RUNDY: 3/5. Operator SONNET (uzasadnienie w dispatchu).
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
