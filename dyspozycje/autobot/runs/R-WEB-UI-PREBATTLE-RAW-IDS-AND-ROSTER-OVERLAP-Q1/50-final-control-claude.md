# Final Control r1 — R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, bledy web)
TEMAT: R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1
GOAL: (1) brak surowych ID w tekscie okna „Rozstawienie bitwy” dla gracza; (2) lista wojsk gracza przy 12 jednostkach w 1024x640/1280x800 nie zaslonieta przez okno rozstawienia.
ZMIANY/COMMIT: kandydat bf3b9bd15fd00c2c1be16f614852d2ebf055fb30 (potomek bazy b1eff89eef58 — `merge-base --is-ancestor` OK; commity f782b0a21, bf3b9bd15). Kod: gra/src/ui/preBattle.ts, gra/src/game/civ-matrix-semantic.ts, gra/src/game/civ-bonuses.ts, gra/src/game/defenseBreakdown.ts, gra/src/main.ts (terrainLabelPl -> TEREN_LABEL_PL); testy gra/tools/civ-bonusy-test.cjs, prebattle-rawids-roster-q1.cjs, prebattle-labels-q1.cjs; evidence. Do integracji: bf3b9bd15 (ten raport = osobny commit dokumentacyjny nad nim). UWAGA: origin/main w chwili FC = 46b845913 (FALA 743); baza b1eff89 NIE jest jego przodkiem wg `merge-base --is-ancestor` — integracja wymaga merge-tree z aktualnym main i ponownych bramek.

TESTY (ZMIERZONO w swoim worktree po `npm ci`):
- tsc --noEmit: exit 0
- logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33 ALL GREEN; unit-replace-test 21/21; combat-test 6/6 + sanity passed
- civ-bonusy-test 56/0; civ-matrix-semantic-labels-test PASS 490/FAIL 0; population-civ-matrix-wiring 122/0; prebattle-labels-q1 297/0
- istniejace testy okna: barbarzyncy-podwojny-atak-prebattle 18/0; pre-battle-defender-retreat OK; pre-battle-retreat-exhausted 33/0; pre-battle-save OK
- LIVE Chromium (vite build poza repo, ?civTest=1, playwright + /usr/bin/chromium), prebattle-rawids-roster-q1.cjs, 12 jednostek, 3 rozdzielczosci: `ASSERT fc OK []`. 1024x640: raw=[], 8 kart + „+4 więcej…”, brak nakladania, przyciski i „+N” w viewport, lista przewijalna, ostatnia karta po przewinieciu w viewport i w kontenerze; 1280x800 i 1920x1080: wszystkie 8 kart widoczne bez przewijania. Zrzuty 1024x640 (evidence Obrony) i 1920x1080 (moj) OBEJRZANE: tytul „Atakujesz: płytkie morze”, chip „Teren: Płytkie morze”, chipy „Walka · atak · piechoty”, brak „Matrix:”/„plytkie_morze”; okno rozstawienia nie zakrywa listy (lista po lewej, okno posrodku-dol).
- Mutacja na bazie (kopie civ-matrix-semantic.ts + preBattle.ts z b1eff89 na czas testu, potem przywrocone): prebattle-labels-q1 exit 1, FAIL m.in. „Walka · atak · obleczenie zawiera pozostalosc identyfikatora”. Test czerwony bez poprawki.
- NIE POWTARZANE przeze mnie (wg Obrony): git diff --check czysty; defense-breakdown-test exit 1 identycznie na bazie (dlug bazowy, TypeError grecy.bonusy) — nie wina kandydata.

ROZSTRZYGNIECIE ZARZUTOW:
1. Uklad 1024x640 (5,5/8 kart bez przewijania): ODDAL. Kryterium dispatchu (lista z wlasnym przewijaniem, widoczny koniec listy i przyciski) spelnione i zmierzone; zaslonienie nie odtworzone ani na bazie, ani na kandydacie; uklad nie zmieniony. Gestosc listy przy 640 px = DO DECYZJI CZLOWIEKA (niski priorytet, nie blokuje).
2. Testy bez asercji: ODDAL — obrona dodala asercje i exit 1 (live ASSERT, prebattle-labels-q1 z mutacja zrodla, civ-bonusy-test). Potwierdzone.
3. obleczenie -> „oskrzydlenia”: ODDAL — poprawione na „oblężniczych”.
4. Zakres globalnych etykiet: ODDAL z notatka — obrona cofnela zmiane laczenia i '%' (12/93 roznic zamiast 48); civ-matrix-semantic.ts jest zrodlem surowych ID. civ-bonuses.ts, defenseBreakdown.ts, main.ts to jednoliniowe wywolania etykiet/terenu poza literalna allowlista, ale konieczne dla GOAL (1); FC akceptuje.
5. Brak wartosci premii w chipach: DO DECYZJI CZLOWIEKA (poza zakresem; kolizji etykiet 0).
6. Dowod live: ODDAL — zrzuty 3 rozdzielczosci obejrzane; fallback terenu idzie przez TEREN_LABEL_PL/nazwaWyswietlana (kod + prebattle-labels-q1).
Zarzutow NAPRAW: 0.

BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA: (a) baza kandydata nie jest przodkiem origin/main — merge-tree + bramki po integracji; (b) wikiBundle nieruszany; (c) dlug Rust: REPIN etykiet civMatrixParameterLabelPl/terenu, jesli odpowiedniki w rust-port; (d) sprzatanie /tmp i gra/node_modules po integracji.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (merge-tree z main, bramki), READY_FOR_DEPLOY po jego decyzji.
DEPLOY/PUSH: NIE WYKONANO
