STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) - AI zdobywanie miast / mgla wojny (diagnoza, kod gry bez zmian)
TEMAT: R-WEB-AI-ZDOBYCIE-FOG-DIAG-Q1
GOAL: Diagnoza kazdego FAIL z dlugu B (ai-zdobycie K1b i pokrewne, ai-fog); kod gry nietkniety.
ZMIANY/COMMIT: oceniany 492e688e2 (baza 247f1ef2a). Diff do bazy = 3 pliki, wszystkie w allowliscie:
  gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs, gra/tools/ai-fog-test.cjs,
  dyspozycje/autobot/runs/R-WEB-AI-ZDOBYCIE-FOG-DIAG-Q1/01-operator-r1.md.
  ai.ts, main.ts, gra/data nietkniete. `git diff --check` czysto. Ten plik dodany osobnym commitem FC.
TESTY (zmierzone przez FC samodzielnie na 492e688e2, po `npm ci --ignore-scripts` w gra/, node_modules usuniety):
  - ai-zdobycie-miasta-adiacencja-test: OK (96/96), exit 0
  - ai-fog-test: W1 OK, W2 FAIL (linia 83, ERR_ASSERTION actual:true expected:false), exit 1 (CELOWO, do decyzji wlasciciela)
  - ai-test: 289 passed, 0 failed
  - logic-test: LOGIC OK (213/213)
  - tsc --noEmit: exit 0 (odtworzone niezaleznie)
  Weryfikacja bisectu W2 (git archive, niezaleznie): 344e5b3fd^ -> W2 przechodzi (test pada dopiero na W3, linia 96,
  znana stara fixtura); 344e5b3fd -> pada na W2. `git blame` ai.ts:3448-3449 = 344e5b3fd. Sprawca potwierdzony.
  Numery linii: enemyUnits z aiCanEngageOwner/isField bez visibleHexes = src/game/ai.ts:3448-3449 (poprawne po korekcie).
OCENA ZARZUTOW:
  1. Naglowek ai-fog-test.cjs nieaktualny -> ODDAL (naprawione w 492e688e2, tresc zgodna z faktami).
  2. Bledne numery linii (3437-3439) -> ODDAL (poprawione na 3448-3449; opcja B ma wskazywac miejsce przyszlej zmiany).
  3. Brak dowodu bisectu -> ODDAL (dowod dostarczony i odtworzony przez FC, patrz wyzej).
  4. tsc nieodtworzone przez Evaluatora -> ODDAL (FC odtworzyl: exit 0).
  5. Oslabienie A5/A6f nieopisane -> ODDAL (opisane jawnie w raporcie; A6f usuwa tylko isMe(anchor.ownerId) z komunikatow gracza, main.ts:34694/34704).
  Brak zarzutow NAPRAW -> brak FAIL.
DO DECYZJI CZLOWIEKA: W2 (konflikt f32f1b3fb "AI zna wlasna ziemie" vs gate main.ts "Atak na niewidoczny cel").
  Opcje A/B/C z 01-operator-r1.md; rekomendacja Operatora B (filtr visibleHexes w ai.ts:3448-3449, nowy temat
  R-WEB-AI-HOME-WAR-FOG-Q1). Pytanie ABC zadaje ORKIESTRATOR.
BLOKADY: ai-fog-test exit 1 do czasu decyzji W2. Nie blokuje integracji tego tematu (zmiany tylko w testach/dokumentacji).
NIE_ZMIERZONO: bisect po commitach posrednich (niepotrzebny: 344e5b3fd^ vs 344e5b3fd sa sasiednie).
RUNDY: 2/5 (r1 operator, r1 obrona, FC r1)
NASTEPNY KROK: integracja orkiestratora. SHA do integracji: commit FC (bezposrednio nad 492e688e2; zawiera 499487c1a,
  492e688e2 i ten plik). Kolejnosc wzgledem origin/rust-port/parity-v2: temat jest webowy (main), niezalezny od Rust;
  merge-base z parity-v2 = a6133784413c, brak wspolnych plikow -> kolejnosc dowolna, po integracji w main.
  Potem ABC o W2 i ewentualnie R-WEB-AI-HOME-WAR-FOG-Q1.
DEPLOY/PUSH: NIE WYKONANO
