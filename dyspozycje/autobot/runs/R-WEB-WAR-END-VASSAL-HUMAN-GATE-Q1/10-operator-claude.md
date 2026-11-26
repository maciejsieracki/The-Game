STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1
GOAL: Zbadać, czy wasalizacja kończy wojnę i czy propozycja pokoju między dwoma fotelami ludzkimi podlega bramce 10 tur wojny; klasyfikacja plik:linia.
ZMIANY/COMMIT: dyspozycje/analizy/WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-2026-11-26.md (nowy) + dyspozycje/autobot/runs/R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1/10-operator-claude.md (nowy). Zero zmian w gra/src, gra/data, WERSJE.md.
TESTY: Brak nowego testu i brak uruchomień testów (zakres: analiza kodu, odczyt grep/sed na 9c5344dd1). tsc nie uruchamiano (brak zmian kodu). git diff --check: czysty.
BLOKADY: brak blokad. NIE ZMIERZONO: modal negocjacji (czy wysyła goldPerTurn w wojnie), zachowanie na żywo w hotseat, cleanup wojen epoki z wasalem (L2).
RUNDY: 1/5 (ostatni werdykt: brak; wynik: PASS-WITH-NOTES)
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje plik:linia z analizy; FC; następnie kandydaci BŁĄD-GRY: (a) R-WEB-* bramka 10 tur dla pokoju hotseat (main.ts:23003, :23056, :23165; interHumanDiplomacyHud.ts:26,32); (b) niespójność trybut_oferta w wojnie (diplomacy-proposals.ts:2191, :3178 vs diplomacy-locks.ts:333). Pytanie ABC do właściciela: czy pokój hotseat ma mieć 10 tur ochrony (patrz analiza §5).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Wasalizacja (akcja 12) w wojnie jest zablokowana w silniku (diplomacy-proposals.ts:1589-1591) i w UI (diplomacy-locks.ts:372-373). Wasalizacja nie kończy wojny; brak zmiany status/licznika przy wasalizacji.
- Luka: pokój hotseat bez bramki 10 tur (proposeToHuman, respondToHumanProposal accept, UI HUD). Wszystkie wywołania peaceProposalIsTooEarly dotyczą par z AI.
- Kandydat niespójności: trybut_oferta z goldPerTurn w wojnie tworzy trwały traktat typu Wasalizacja (silnik), a UI opisuje w wojnie tylko reparacje jednorazowe. Do potwierdzenia w modalu negocjacji.
- Zgodnie z zakazem nie tworzono sesji ani zadań; brak run_in_background.
