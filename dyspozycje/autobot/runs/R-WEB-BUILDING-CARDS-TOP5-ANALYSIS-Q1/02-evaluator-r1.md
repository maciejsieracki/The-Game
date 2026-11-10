STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB). Analiza treści, bez zmian w kodzie gry.
TEMAT: R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1
GOAL: Etap 2/5 kart. TOP 5 dla 43 budynków z dowodem; ślepy turniej Evaluatora i macierz zgodności.

ZMIANY-COMMIT (worktree Evaluatora, baza origin/main d36f8b3b0):
- 6709e4509: ślepy TOP5 Evaluatora (`02-evaluator-r1-slepy-top5.tsv`), zapisany PRZED odczytem Top1–Top5 Operatora.
- ten plik: macierz zgodności i zarzuty.
Badana gałąź Operatora: `worktree-wf_9d690c14-e3b-1` (4886c8b5a, 1902ab85b), baza 397f84f29.

TESTY (= WERYFIKACJA, wykonane samodzielnie):
- Allowlista: `git diff --name-only 397f84f29 worktree-wf_9d690c14-e3b-1` → wyłącznie `dyspozycje/analizy/karty-budynkow/**` (48 plików) i `runs/<ID>/01-operator-r1.md`. Zmian w `gra/**`: 0.
- `git diff --check 397f84f29 worktree-wf_9d690c14-e3b-1`: czysto.
- CSV: BOM = tak, CR = 0, separator `;`, 43 wiersze, 16 kolumn zgodnych z dispatchem.
- Odtwarzalność: `gen.py` uruchomiony na kopii w scratchpad z `gra/` z origin/main d36f8b3b0 → CSV, 44 pliki turniejów i ANALIZA bajtowo identyczne z commitem (różnią się tylko nieśledzone `stats.json`, `tables.md`, `__pycache__`). Pliki `gra/data` i kluczowe moduły bez zmian między 397f84f29 a d36f8b3b0.
- Pomiar wstępny: `top3` 43/43 budynków, 129 pozycji (potwierdzone). Liczby 47/129 (regex) nie odtwarzałem: NIE_ZMIERZONO.
- Mennica: ×1,62/×1,50/×1,38 (`econ-params.json:585-591`), mnożnik na `handelNetto` (`economy.ts:952-955`), efekt w całym imperium i wymóg Złota (`turn-economy.ts:2048-2055`), 1 Złota/turę (`zloto-access.ts:31`). Potwierdzone.
- Wybrane tezy Operatora sprawdzone w kodzie: Katapulta bez bramki Warsztatu (`units.json` Katapulta: tylko Tech Oblężnictwo + Żelazo; brak warunku w `production.ts`); bramka Koszar (`production.ts:1068-1076`); premia morska Portu (`trade-routes.ts:1755-1772`); tryb oblężenia z Murem/Palisadą (`mapSiegeDetect.ts:56-57`); kara braku wody −2 (`society-params.json:116-119`, `turn-economy.ts:497`); warunki badań (`tech.json:200,214,340,369,383,425,439,453`); poziom = epoka (`production.ts:252-271`); konwersja kultury Pałacu II/III (`conquest-stability.ts:67-69`); Pałac II/III bez −30% korupcji (`economy.ts:1226`); Milicja (`combat-params.json:51-58`). Wszystkie się zgadzają.

MACIERZ ZGODNOŚCI (ślepy Evaluator vs Operator; efekty łączone przez Operatora w jedną pozycję liczone osobno)
| Budynek | pokrycie moich efektów | Top1 zgodny |
|---|---|---|
| stolarnia, kamieniarski, odlewnia_brazu, studnia, mennica, emporion, garnizon | 2/2 | tak |
| kuznia, garncarnia, cegielnia, kamienne_kregi, akwedukt, koszary, magazyn, stela, palac_ii, palac_iii, kuznia_zelaza, warsztat_oblezniczy, trybunal, akademia_wojskowa | 3/3 | tak |
| palisada, fort, baszta | 1/1 | tak |
| mury | 2/2 | tak |
| odlewnia_zelaza, port_wielki, dom_starszyzny, dwor_zarzadcy | 4/4 | tak |
| port | 4/4 | NIE (E: +5 pieniądza; O: +1 trasa) |
| spichlerz, biblioteka, palac, akademia, sad, laznia_publiczna | 5/5 | tak |
| pretorium | 5/5 | NIE (E: Prawo; O: −30% korupcji) |
| targowisko | 4/5 | NIE (E: +5 pieniądza; O: +50% z tras) |
| spichlerz_ii | 4/5 | tak |
| swiatynia | 3/4 | tak |
| wielka_odlewnia, wielka_kuznia, teatr | NIE_USTALONO = NIE_USTALONO | tak |
Suma: 127/130 moich efektów występuje w TOP Operatora (97,7%). Top1 zgodny w 37/40 budynków z TOP. Budynków ze zgodnością ≤ 2/5 (przy ≥ 5 realnych efektach): 0. Z kolei Operator ma pozycje, których ja nie miałem: warunki/rozbudowy (Q2), premia morska Portu, tryb oblężenia, konwersja kultury Pałacu II/III i Sądu. Sprawdziłem je w kodzie i są prawdziwe.

ZARZUTY:
1. Spichlerz Królewski: brak realnego efektu „po wzroście miasto zachowuje 70% zapasu żywności” (`economy.ts:1150-1152`: `maSpichlerzII ? 0.7`). Operator pominął go jako niezweryfikowany (§12). Efekt jest w kodzie i jest silniejszy niż 50% Spichlerza I. TOP ma 3 pozycje, więc jest miejsce.
2. Świątynia: brak efektu „+1 do szerzenia religii na sąsiednie miasta” (`society-params.json` `religia_swiatynia_bonus_szerzenia`, normal 1; `culture-religion.ts:1064`; wołane w turze z `main.ts:37718-37729`). Turniej podaje „dowód kompletności”, a TOP ma tylko 2 pozycje.
3. Targowisko: Top1 „+50% dochodu z tras” daje 0 bez aktywnej trasy, co kłóci się z decyzją (4), że Top1 ma być korzyścią od ręki. Do tego realny efekt „+2 zdrowia” (`turn-economy.ts:420,485`) przegrał z warunkiem „Warunek Mennicy i Emporionu”. Do rozstrzygnięcia przez Obronę i FC razem z Q2.
4. Plan etapu 4: „23 w terrain-improvements.json (bez _meta)” jest błędne. Ulepszeń jest 22: 24 klucze główne minus `_meta` i `_miasto_zasieg_ref`.

UWAGI (bez wpływu na kryteria binarne): Top1 Portu i Pretorium to spór o kolejność, oba warianty są realne. Generator sprawdza tylko istnienie linii `plik:linia`, nie jej treść; Operator to ujawnił.

KRYTERIA KOŃCA: 43/43 z TOP lub NIE_USTALONO: TAK. Mennica ze współczynnikiem i plik:linia: TAK. Zgodność policzona: TAK (powyżej). `git diff --check`: TAK. CSV LF: TAK. Allowlista: TAK.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona rozstrzyga zarzuty 1–4 (kolejność Top1 Targowisko/Port/Pretorium), potem Final Control dopisuje zarzuty 1–2 do FINALNEGO CSV i robi próbkę.
DEPLOY-PUSH: NIE WYKONANO
