STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1
GOAL: ustalić DLACZEGO Wojownik barbarzyńców wygrywa z Wojownikiem gracza (ufortyfikowanym i nie), w obu kierunkach ataku, i czy to defekt czy zamierzona reguła. Bez zmian kodu (zgodnie z dispatchem: zamierzone reguły -> DECISION_REQUIRED).
ZMIANY/COMMIT: tylko ten raport. Brak zmian w gra/src, gra/data, gra/tools. Baza: 52a13c39d (origin/main 3f9e7a1d7 ma ten sam stan dla tych plików; dispatch wskazuje 52a13c39d).

## Wniosek w skrócie
1. Przyczyna główna: ustawienie "Trafienia" = 'pewne' (domyślne dla NOWYCH gier, newGameFlow.ts:272 `hitMode: 'pewne'`, wprowadzone w ae600d5ed 2026-11-12). W trybie 'pewne' każde uderzenie trafia (battleScene.ts:9137-9142, combat.ts:1152/1174 `certainHits ? 100`), obrona NIE wpływa na trafienie, a pancerz jest taki sam (2 vs 2). Efekt: strona, która uderza pierwsza w wymianie, wygrywa 100% (zmierzone). Fortyfikacja +50% Obrony w tym trybie nie ma żadnego wpływu (zmierzone: 100/0 z fortem i bez).
2. Przy 'losowe' (tryb poprzedni, stary zapis): atakujący wygrywa ~54%, obrona ~40%, remis ~6%; fort obrońcy zmienia wynik o ~3-4 pp. Pierwsze uderzenie daje przewagę, fort prawie nic.
3. Nie znaleziono ukrytego bonusu barbarzyńców w silniku: Wojownik barbarzyński i Wojownik gracza mają identyczne statystyki po combatUnitFromDef (Atak 4 / Obrona 4 / Uderz 4 / Przeb 1 / Pancerz 2 / HP 22) — wynik z istniejącego narzędzia gra/tools/barb-warrior-audit-sim.cjs (prawdziwe combat.ts / auto-battle-power.ts / hit-mode.ts).
4. Owner pisze, że barbarzyńca wygrywa też gdy GRACZ atakuje. Symulacja pokazuje "wygrywa atakujący" w obu rolach (pewne: 100% atakujący, losowe: ~54%). Czyli w silniku to nie "barbarzyńca" wygrywa, tylko "atakujący". Dlaczego w grze wygląda inaczej przy ataku gracza — NIE_ZMIERZONO (brak zapisu/ziarna właściciela; nie odtworzono ścieżki w scenie).

## Tabela wariantów (sim, 1v1, Wojownik vs Wojownik, N=200, ziarna LCG 1000+k*7919, resolveCombat)
| tryb | atakujący fort | obrońca fort | atakujący wygrywa | obrońca wygrywa | remis |
|---|---|---|---|---|---|
| losowe | nie | nie | 54.0% | 39.5% | 6.5% |
| losowe | nie | tak (x1.5 Obrony) | 50.5% | 43.0% | 6.5% |
| losowe | tak | nie | 57.0% | 35.0% | 8.0% |
| pewne | nie | nie | 100.0% | 0.0% | 0.0% |
| pewne | nie | tak | 100.0% | 0.0% | 0.0% |
| pewne | tak | nie | 100.0% | 0.0% | 0.0% |

Dodatkowo z tools/barb-warrior-audit-sim.cjs (N=200): Kamień, Wojownik vs Wojownik 3v3: losowe 61.5% barb-atak, pewne 100%; AUTO (strict M, remis M = tie) 0% dla atakującego przy równym M. AUTO: winner = attacker tylko gdy mAtk > mDef (auto-battle-power.ts:175-176), inaczej defender, a równe M = 'tie'. Nie tłumaczy to "zawsze wygrywa barbarzyńca".

## Ścieżki (sprawdzone kodem)
- Fortyfikacja flaga: main.ts:34648 `fortifiedInField: unitGetsFortifyBonus(u)` (RuntimeUnit.ufortyfikowanyWPolu) -> battleScene.ts:9107-9111 fieldFortifyDefenseBonus -> tylko defFinalObrona -> tylko hitChanceTw. Flaga jest przekazywana (H4 nie potwierdzona jako błąd wpięcia). Czy fort jest aktywny już po turze rozkazu — NIE_ZMIERZONO.
- Pancerz obrony nie zależy od fortyfikacji (battleScene.ts:9124 defArmor = cuD.armor * pancerz).
- Kolejność uderzeń: resolveCombat melee zawsze ATK przed DEF w każdej rundzie (combat.ts ~1152-1174). Pierwsze uderzenie = zamierzona reguła silnika.
- Difficulty: qualifiesForMajorAiDifficultyBonus wyklucza barbarzyńców (ai-difficulty-bonus.ts:17-19) -> brak mnożnika trudności dla barbarzyńców (H1 odrzucone dla trudności).
- Civ bonusy: civBonusyForOwnerId (main.ts:10222) — dla właściciela barbarzyńskiego civKeyForOwnerId zwykle brak (wnioskowane z kodu, NIE_ZMIERZONO w sim).
- Flaga _attackerIsBarbarian (battleScene.ts:2803) używana tylko do sygnetu/podsumowania (battle-summary.ts), NIE do liczb walki (H1: odrzucone w kodzie walki).
- Regresja: ostatnie zmiany walki ręcznej (eb68e66d8, RNG z ziarna) nie zmieniają proporcji (tylko źródło rzutu, a w 'pewne' rzut nie jest losowany). Tryb 'pewne' jest jedyną zmianą, która daje 100/0. Bisectu commit-po-commicie NIE wykonano (brak czasu w rundzie 1) — NIE_ZMIERZONO dla pełnego bisectu, ale źródło wskazane: ae600d5ed.

## Dlaczego to DECISION_REQUIRED, a nie FAIL
Reguła 'pewne' (obrona działa tylko przez pancerz) jest zapisana jako zamierzona w hit-mode.ts i w dispatchu (R-WEB-BATTLE-HIT-MODE-SETTING-Q1, decyzja właściciela). To nie jest ukryty bonus. Sprzeczność z regułą +50% Obrony leży w tym, że w 'pewne' obrona nie działa wcale. Zmiana tego wymaga decyzji właściciela (balans / kolejność).

## Opcje dla właściciela (z liczbami)
A. Zostawić 'pewne' jako domyślne, ale dopisać, że fort/teren w 'pewne' nie działa (dokumentacja/Civpedia). Bez zmiany kodu. Wojownik zawsze wygrywa pierwszy uderzający.
B. W 'pewne' obrona zmniejsza OBRAŻENIA (np. redukcja proporcjonalna do Obrony po fortach), zachowując brak rzutu. Wymaga wzoru i liczb (balans) — decyzja właściciela; NIE zmieniano.
C. Domyślne 'pewne' zmienić na 'losowe' dla NOWYCH gier (wtedy fort daje tylko ~3-4 pp; pierwsze uderzenie ~54% — słabe odczucie fortu, też wymaga decyzji).
D. Zmienić kolejność uderzeń (np. obrońca pierwszy przy forcie) — NIE zalecane bez decyzji (dispatch zakazuje bez decyzji).

Rekomendacja Operatora: B, bo spełnia regułę +50% Obrony bez rzutu; wymaga liczb od właściciela.

## TESTY
- Narzędzie: tools/barb-warrior-audit-sim.cjs (N=200) — wyniki jak wyżej (surowe wyjście).
- Dodatkowy pomiar fort on/off w obu trybach: skrypt poza repo (scratchpad), resolveCombat z combatUnitFromDef, meleeDefence x1.5 dla fortu. Wyniki w tabeli.
- tsc --noEmit, 5 bramek referencyjnych, test regresji: NIE_WYKONANO (brak zmian kodu, nic do weryfikacji regresją).
- Test mutacyjny: NIE_WYKONANO (brak poprawki).

## BLOKADY
- Brak zapisu/ziarna właściciela: nie odtworzono scenariusza w grze (NIE_ZMIERZONO).
- Pełny bisect po commitach 2026-11-01..14: NIE_ZMIERZONO (wskazano ae600d5ed na podstawie kodu i zmierzonego efektu).
- Pomiar "barbarzyńca vs gracz atakuje" w scenie ręcznej/Pomiń: NIE_ZMIERZONO.

## RUNDY
1/5 (Operator HAIKU). Nie było rundy 2.

## NASTĘPNY KROK
Decyzja właściciela A/B/C/D (powyżej). Po decyzji: Operator r2 z wybraną opcją (B wymaga wzoru i liczb).

## UWAGI-DLA-ORKIESTRATORA
- Obserwacja poza zakresem: task-list w sesji (#286/#309 itp.) — nie tworzono zadań ani sesji zgodnie z zakazem.
- Worktree ma wpisany node_modules w gra/ (npm ci --ignore-scripts, tylko do esbuild/tsc); to ignorowane przez git, do sprzątnięcia po integracji.

DEPLOY/PUSH: NIE WYKONANO
