STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, bez zmian logiki i balansu)
TEMAT: R-WEB-ECONOMY-LATE-GAME-RESOURCE-GROWTH-AUDIT-Q1
GOAL: Ustalić, skąd bierze się wzrost produkcji i zasobów w późnej grze, czy ma tak rosnąć, i przedstawić warianty optymalizacji z decyzjami dla właściciela.
ZMIANY/COMMIT: dyspozycje/analizy/EKONOMIA-POZNA-GRA-AUDYT.md; gra/tools/econ-growth-analyze.cjs; gra/tools/econ-growth-model.cjs; dyspozycje/autobot/runs/R-WEB-ECONOMY-LATE-GAME-RESOURCE-GROWTH-AUDIT-Q1/** (evidence/analiza-jsonl.txt, evidence/model-produkcji.txt). Baza 0c3fa0747abc9b9776c082259c2c4378dd2fd6a0. SHA commita: patrz pole sha w StructuredOutput.
TESTY: node --check obu skryptów: OK. Analiza: `node gra/tools/econ-growth-analyze.cjs` na seed4242 (t2–76), seed777 (t2–80), war-out/seed7 (t2–76). Model: `node gra/tools/econ-growth-model.cjs` (wynik w evidence). Bramki gry: nie dotyczą (brak zmian w gra/src, gra/data).
BLOKADY:
- Gracz NIE ZMIERZONO: harness mierzy tylko AI.
- Tury 100/125/150 NIEZMIERZONO: pliki kończą się na t76–80 (w tabeli użyto ostatniej dostępnej tury).
- jsonl nie zawiera przychodu/turę, Pracy, Nauki PN ani zapasów żelaza/brązu/cegły/drewna/kamienia/ceramiki (NIEZMIERZONO).
- Mnożnik epoki capu surowców NIEZMIERZONY; czy cap jest osiągany, nie wiadomo.
- Spichlerz max 85 000/95 000 zgodne z limitem, ale nie potwierdzone w kodzie.
RUNDY: 1/5
WYNIKI (skrót):
- Skarbiec AI (średnia, seed4242): t25 157; t50 1 437 (×9,1); t75 9 006 (×6,3). Wzrost wielomianowy (k ≈ 3,2 → 4,5), nie dowiedziono wykładniczego.
- Źródła: m(e) = 1+0,5(e−1) liniowo (citizen-consumption-era.ts:19,24); mnożnik wyjścia cegły 1+0,5(e−1) (converters.ts:171-194); cykle Cegielni 50/75/100; Garncarnia 30→110; civ-wide +10% addytywnie; Magazyn +20% addytywnie. Brak składania wykładniczego (converters.ts:127-136 odrzuca wariant compound).
- Wzrost żelaza na miasto e1→e4 ×2,5; imperium 4,3→16,3 miast ×3,8; razem ×9,5.
- Sinki: utrzymanie budynków/jednostek w Pieniądzu i Surowcach, racje ×m(e); brakuje sinka rosnącego z liczbą miast i epoką, inflacji cen i utrzymania skalowanego zasobami.
- Warianty (A spłaszczenie epok −30% żelaza/cegły e4; B utrzymanie rosnące z miastami; C cap państwa 50 000; D sink administracji; E bez zmian) opisane w dokumencie z parametrami JSON i ryzykiem. Liczby skarbca t100/t150 dla wariantów: NIEZMIERZONE.
- Pytania ABC: 5 (w dokumencie §5), rekomendacje pierwsze; decyzje liczbowe po stronie właściciela.
UWAGI-DLA-ORKIESTRATORA:
- Najpierw rozszerzyć harness pomiarowy o przychód/turę, Pracę, Naukę i zapasy surowców oraz o pomiar gracza (osobny temat, bez zmian gry).
- Dane /tmp/terr-out i /tmp/war-out nie były modyfikowane (tylko odczyt).
- Zrzut HUD (Skarbiec 157k, Żelazo w setkach tysięcy) przekracza bazę capu 50 000 z economy-upkeep.ts; wymaga weryfikacji, czy mnożnik epoki lub Magazyny to wyjaśniają.
NASTĘPNY KROK: decyzja właściciela w ABC (§5 dokumentu); potem ewentualny temat pomiaru przychodu i zapasów.
DEPLOY/PUSH: NIE WYKONANO
