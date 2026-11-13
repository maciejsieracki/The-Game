STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TECH-IRON-GATING-IMPL-Q1
GOAL: Hutnictwo żelaza odkrywa tylko surowiec żelazo, Kopalnię, Odlewnię i Kuźnię. Jednostki epoki Żelaza rekrutuje dopiero Sztuka wojenna (prereq: Oblężnictwo + Obróbka żelaza + Hutnictwo żelaza).
ZMIANY/COMMIT:
- Baza: origin/main b765e4994 (FALA 581). Stara baza 18b609dc3 i d1589b6c3 są nieaktualne.
- 233d1f47b — kod r1 po rebase (konflikty w generowanych plikach rozwiązane regeneracją, patrz niżej).
- b96045904 — raport operatora r1 (SHA w raporcie, bez zmian kodu).
- dc7094306 — korekta r2: kamień milowy AI dla Hutnictwa żelaza w gra/src/game/ai.ts (scoreTech) + sekcja 7 w gra/tools/iron-gating-impl-test.cjs.
- Pliki r2: gra/src/game/ai.ts, gra/tools/iron-gating-impl-test.cjs, ten raport.
- Rebase r2 (konflikty):
  - gra/data/tech-cards-top5.json, gra/src/data/wikiBundle.json: NIE scalane ręcznie; zregenerowane (gen-tech-cards-top5.cjs; bundle-wiki-for-game.cjs). --check OK; ponowne bundle daje identyczny plik.
  - dyspozycje/.../zrodlo/odkrycia-top5.csv: scalenie na poziomie pól (3-way; baza 18b609dc3, nasza wersja, main). Jedyny konflikt pól = Hutnictwo, pola 11 i 15: przyjęto wersję operatora (bez Falangi w tekście karty). Następnie: Falanga „Obrona 10” → „Obrona 12” (zgodnie z FALA 579) we wszystkich wierszach CSV; z wierszy „Realne efekty” usunięto listy jednostek z Hutnictwa (19) i Obróbki (4); w wierszu Sztuka wojenna dopisano „Jednostki (24): …” (lista z units.json, Tech = Sztuka wojenna).
- Poprawka błędnego twierdzenia z r1: „Korekta AI nie była konieczna” jest BŁĘDNE i wycofane. Patrz ODPOWIEDŹ NA ZARZUTY, pkt 1.
TESTY:
- iron-gating-impl-test (po rebase, na dc7094306): 130 OK, 0 FAIL (w tym nowa sekcja 7: 9 asercji AI).
- Negatywny dowód dla sekcji 7: z wyłączoną poprawką AI (if (false && ...)) → 4 FAIL (mid 130 vs 129, early 110 vs 109, zagrożenie 150, Hutnictwo bez tekstu). Poprawka przywrócona, przed commitem sprawdzone.
- Po rebase na b765e4994 (wynik na dc7094306):
  - tech-unlock-units-test 126/0; tech-cards-top5-test 594/0; gen-tech-cards-top5 --check OK
  - building-tech-gate-test 91/0; unit-recruit-nazwa-test 17/0; autoimprove-live-hooks-test 37/0
  - iron-native-access-fix-test 17/0; unit-epoch-cost-test 57/0; super-unit-limit-one-test 40/0; unit-replace-test 15/15
  - civpedia-caly-wiersz-przyciskiem-test 85/85; zelazo-mezopotamia-real-render 72/0; zelazo-srodziemnomorze-real-render 83/0
  - ai-difficulty-bonus-test 97/0; ai-threat-mode-test 12/0
- Pięć testów z r1, które przekroczyły 120 s (limit harnessu, nie błąd testu), uruchomione w całości na dc7094306 (lub na bazie tam, gdzie wskazano):
  - autoimprove-irrigation-after-farms-test: 42 OK / 0 FAIL (3 min 53 s)
  - autoimprove-stages-q1-test: 299 passed / 0 failed
  - hud-tooltip-body-mounted-panels-test: 16 pass / 0 fail
  - sidepanel-hud-deadzone-test: 43 pass / 0 fail
  - r-bitwa-etykieta-tozsamosc-strony-live-atak-test: NIE ZMIERZONO do końca — przekroczenie 580 s (rc=124) z 11 FAIL. Identyczne 11 FAIL (te same nazwy sprawdzeń) na bazie d1589b6c3 (rc=124). Błąd przed zmianą tematu, nie spowodowany przez ten temat.
  - r-bitwa-etykieta-tozsamosc-strony-real-render-test: TypeError „Cannot read properties of undefined (reading 'children')” w page.evaluate — IDENTYCZNY na bazie d1589b6c3 (sprawdzone, pre-existing).
- entity-card-cross-links-nested-overlay-test: NIEDETERMINISTYCZNY, także na czystym origin/main. Pomiary: main 24/0 i main 23/1 (FAIL [3] „Zastępuje”, ten sam komunikat, co na gałęzi); gałąź 23/1, 24/0 (wersja diagnostyczna), 17/7 (inne sprawdzenia). Nie jest to regresja tego tematu. Nie naprawiałem (poza zakresem); do osobnego tematu.
- Chromium: użyty (fallback /opt/pw-browsers/chromium-1194). Build vite dla testów live-atak/real-render działa.
BLOKADY: brak blokad kodu. Do zrobienia po deployu/integracji (poza tym tematem): REPIN Rust (tech.json, units.json, tech-cards-top5.json); poradnik gracza 57-katalog-jednostek.md / 09-nauka-epoki.md ze starymi bramkami (poza allowlistą); niedeterministyczny nested-overlay-test (pre-existing).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator na dc7094306 (po rebase na b765e4994), potem Final Control. Integracja: git merge-base --is-ancestor dc7094306 <SHA integracji> oraz git diff --stat; NIE ręcznie w generowanych plikach — regeneracja.
DEPLOY/PUSH: NIE WYKONANO
