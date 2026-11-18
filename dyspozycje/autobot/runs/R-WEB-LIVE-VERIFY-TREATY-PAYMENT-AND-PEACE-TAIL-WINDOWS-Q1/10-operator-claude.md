STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar na żywo; zero zmian logiki gry, zero zmian w main.ts)
TEMAT: R-WEB-LIVE-VERIFY-TREATY-PAYMENT-AND-PEACE-TAIL-WINDOWS-Q1
GOAL: żywy pomiar (Chromium, bundle Vite z /tmp/rwl-bundle, ?playtest=mapa) ścieżek (a)–(e) z rejestru FALA 830/833.
ZMIANY-COMMIT: nowy gra/tools/diplo-treaty-pay-ladder-live-verify-test.cjs (test drabiny, c) + raport i dowody w runs/R-WEB-LIVE-VERIFY-TREATY-PAYMENT-AND-PEACE-TAIL-WINDOWS-Q1/. Brak hooków w main.ts. SHA: patrz sekcja DEPLOY-PUSH (commit w gałęzi roboczej, nie na main).
TESTY:
- live-treaty-payment (istniejący, bez zmian): 149/149, 0 pageerror, zrzut brak.
- ladder (nowy): 16/16 PASS; mutant (kolejność drabiny odwrócona w KOPII źródła, przebudowa /tmp/rwl-mut): 12/16, czerwono.
- forced-peace-pending-live: exit 0, zrzut dowody/s4-okno-pokoju.png (417 KB).
- peace-tail-integration (node): 42/0, mutanty M1–M8 wykryte.
- bramki: tsc --noEmit 0; logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6.
BLOKADY: (1) przemarsz/wasał gracz→AI przy płatniku-AI (gracz silniejszy): akceptacja przechodzi, nośnik null, przelewu brak (ZNANA LUKA, czeka na ABC #538 pkt 1). (2) moc w oknie: przy zadanym stosunku 1,3 okno pokazało r 2,3–2,5 (przyczyna nieustalona, możliwy cache Mocy po setAiPowerBonusForTest; NIE ZMIERZONO).
RUNDY: 1/5
NASTĘPNY KROK: (i) hak civTest na płatności ogona pokoju (cena > 0 w mapie), żeby zmierzyć (d); (ii) render wiersza/tooltipu okna (a) i zrzuty PRZED/PO; (iii) ABC do właściciela o płatnika-AI.

Tabela (a)–(e):
| Ścieżka | Wynik | Dowód |
|---|---|---|
| (a) render wiersza/tooltipu D w oknie | NIE ZMIERZONO (render); dane okna zgodne z zapasami | live-ladder log, windowReason |
| (b) przemarsz/wasal gracz→AI i AI→gracz, bramki Respektu | AI→gracz PASS (przelew zweryfikowany); gracz→AI przy płatniku-AI: ZNANA LUKA (carrier null) | live-treaty-payment-existing.log |
| (c) drabina brąz/żelazo/rudy | PASS 16/16 (A: złoto→brąz 7700; B: żelazo 2000→ruda 13350; C: ruda 21350), mutant czerwony | live-ladder-*.log |
| (d) ogon pokoju w żywej grze | NIE ZMIERZONO: w mapie plan pokoju ma cenę 0, brak haka do ceny > 0; test węzłowy node 42/0 | node-peace-tail-integration.log |
| (e) okno pokoju wymuszonego | CZĘŚCIOWO: na wierzchu, Esc/tło nie zamyka, bez surowych ID w próbce 400 znaków, wariant „Oddajesz: miasta” NIE ZMIERZONO | s4-okno-pokoju.png, live-forced-peace-pending.log |

Zasada anty-samooszukiwania: każdy PASS stanu w (b)/(c) to zmiana zapasów zmierzona przed i po akceptacji; okno (e) z zrzutem i nie-zamykaniem; mutant (c) potwierdza, że test widzi czerwień.

Nowe ustalenia dla orkiestratora: brak. Stałe pliki: `runs/.../dowody/` (logi, zrzut). Procesy w tle: brak (wszystko w pierwszym planie). Ścieżki /tmp do wglądu: /tmp/rwl-bundle (build bieżący), /tmp/rwl-mut (build mutanta; kod źródłowy przywrócony bajt w bajt, git status czysty dla źródeł).
DEPLOY-PUSH: NIE WYKONANO
