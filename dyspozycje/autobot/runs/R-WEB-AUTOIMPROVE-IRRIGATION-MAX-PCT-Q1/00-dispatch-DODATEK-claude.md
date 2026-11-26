# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
AUTOIMPMASS/AUTOIMPTESTS (dyspozycje/analizy/ULEPSZENIA-MASOWO-PO-ODKRYCIU-2026-11-26.md, AUTOIMPTESTS-2026-11-26.md): harness syntetyczny (+120 Pracy/turę), limit puli automatu DEFAULT_ULEPSZENIA_PRACA_PERCENT=33 (domyślna wartość startowa); suwak gracza pracaAutoPercent 0–100% (MAX_ULEPSZENIA_PRACA_AUTO_PERCENT=100, gra/src/game/cities.ts) — to udział TEJ puli ulepszeń wydawany przez automat; pula całej pracy na ulepszenia ≤50% (pole procentUlepszenia). Testy: gra/tools/autoimprove-pasture-irrigation-q2-test.cjs (test (e): próg irygacji 55 tur po odkryciu — zmieniony w AUTOIMPTESTS z 46 przy 33%), gra/tools/autoimprove-owner-rules-test.cjs (7/0), autoimprove-stages-q1-test.cjs (299/0). Właściciel: „testuj zawsze maksymalny dopuszczalny poziom, nie domyślny/minimalny; innych poziomów nie trzeba”.
## Zadanie
1. Znajdź w harnessie pomiarowym (AUTOIMPMASS) i w teście (e) miejsce ustawiania udziału puli automatu; ustaw suwak na 100% (maksymalny dopuszczalny) — pula całej pracy na ulepszenia pozostaje wg domyślnej reguły harnessu, ale nie wyżej niż 50%.
2. Zmierz (ziarna 1–4 jak w AUTOIMPMASS; 14 ziaren jeśli czas pozwala): tura odkrycia → pierwsza farma, pierwsza trzoda, pierwsza irygacja, pełna irygacja pól kwalifikujących się; wyniki PRZED (33%, z dokumentu) vs PO (100%) — PO jest jedynym scenariuszem testowym.
3. Przemierz próg testu (e) do zmierzonego maksimum + mały margines (opisz uzasadnienie), asercje nie osłabiane; mutacja E4 (irygacja wyłączona lub kolejność E3/E4 odwrócona) musi dać test CZERWONY przy nowym progu; zmierz mutację (w AUTOIMPTESTS nie była mierzona).
4. Potwierdź test owner-rules (całość puli na jedzenie) przy 100%.
5. Dokument: dyspozycje/analizy/ULEPSZENIA-IRYGACJA-100PCT-2026-11-26.md (tabela, wnioski prostym językiem: jak szybko gracz z suwakiem na 100% dostaje irygację).
## Allowlista
gra/tools/autoimprove-pasture-irrigation-q2-test.cjs, gra/tools/autoimprove-owner-rules-test.cjs, harness pomiarowy AUTOIMPMASS (gra/tools/*autoimp*measure*), nowy gra/tools/autoimprove-max-pct-test.cjs, dyspozycje/analizy/ULEPSZENIA-IRYGACJA-100PCT-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-AUTOIMPROVE-IRRIGATION-MAX-PCT-Q1/**. Zero zmian gra/src, gra/data.
## Zakazy
gra/src/**, gra/data/**, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana kosztów/domyślnych 33%, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash, --no-gpg-sign. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; autoimprove-stages-q1 299/0; owner-rules 7/0; pasture-irrigation-q2 zielony po przemierzeniu. Zacommituj i zwróć SHA.
## Binarne kryterium
Pomiar przy 100% (ziarna 1–4+); próg testu (e) = zmierzone maksimum + margines; mutacja E4 czerwona; owner-rules zielone przy 100%; dokument; bramki zielone.
