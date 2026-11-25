STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/instrumentacja)
TEMAT: R-WEB-ALLIANCE-REMOVAL-PATH-Q1
GOAL: ustalić, którą ścieżką znikają sojusze AI↔AI (umowy 1–13 i 1–19 w turze 66, seed 4242); lista wszystkich ścieżek usuwania umowy w activeDeals z plik:linia; log utrat; klasyfikacja.
ZMIANY-COMMIT: tylko pliki pomiarowe i analityczne (bez zmian w gra/src ani gra/data). Pliki: dyspozycje/analizy/ZNIKANIE-SOJUSZY-AI-2026-11-25.md; dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/10-operator-claude.md; .../instrumentacja-AA-REMOVE.patch; .../dane/ (jsonl.gz, summary, logi, SHA256SUMS.txt). Baza kodu: 8f7b4981f (origin/main), SHA kodu bez zmian w repo. Commit: SHA w polu sha w StructuredOutput.
TESTY:
- tsc --noEmit (kopia czystej bazy 8f7b4981f poza repo): exit 0, brak wyjścia.
- Bieg instrumentowany seed 4242, --harder 1, tury 2–67, 66 wierszy jsonl (kopia poza repo, vite build poza repo, exit 0, 42,4 s): AI↔AI sojusz GAIN t38 1-4 i t38 1-16; LOSS: 0; pary 1-13 i 1-19 neutralne cały bieg.
- Wpisy [AA-REMOVE]: plik aa.log nie powstał (0 wpisów). NIE ZMIERZONO, czy przechwytywanie konsoli działa (patrz BLOKADY).
- logic 213 i ai-test 297/0: NIE URUCHOMIONO na tej rundzie (repo bez zmian kodu; bramki bazy nie zmieniły się przez ten temat). Powód: priorytet pomiaru ścieżek.
BLOKADY:
- Zdarzenie z ALLY66 (1–13 t40 i 1–19 t58 w activeDeals) nie odtworzyło się na bazie 8f7b4981f: pary nie zawarły sojuszu. Ścieżka usuwania dla tych umów: NIE ZMIERZONO (brak zdarzenia do zalogowania).
- Brak potwierdzenia, że hook konsoli działa (plik aa.log nie powstał). Brak wpisów nie dowodzi braku usunięć innych umów.
- Pytanie ABC #103 (status „sojusz” zostaje po zniknięciu umowy): opisane w dokumencie, NIE zadane (zgodnie z dispatchem).
RUNDY: 1/5
NASTĘPNY KROK: (a) decyzja orkiestratora, czy powtórzyć bieg na bazie ALLY66, czy zakończyć temat jako NIE ZMIERZONO; (b) przed powtórką potwierdzić działanie hooka konsoli (jeden wpis testowy, np. wymuszony sojusz w kopii). Pytanie ABC #103 — orkiestrator.
DEPLOY/PUSH: NIE WYKONANO

## Klasyfikacja ścieżek (skrót; szczegóły w dyspozycje/analizy/ZNIKANIE-SOJUSZY-AI-2026-11-25.md)
- Osiem ścieżek usuwania w grze (odmowa obowiązku x2, zerwanie dobrowolne, wojna, wygaśnięcie, płatność nie wykonana, wchłonięcie wasala, eliminacja właściciela) ma jawną regułę w kodzie. Żadna nie została zaobserwowana na 8f7b4981f przy utracie sojuszu AI↔AI, więc żadna nie jest klasyfikowana jako ŁAMIE REGUŁĘ.
- Status `sojusz` nie jest zdejmowany po zniknięciu umowy (gra/src/main.ts:24708, syncRelationFromDeals, brak gałęzi else). To jest pytanie #103, nie błąd do naprawy w tym temacie.

## Plik:linia usuwania umów w activeDeals (baza 8f7b4981f)
gra/src/main.ts: 22806 (resolveAllianceWarCall), 24644 (breakTreatyVoluntarily), 25662 (breakTreatiesOnWar), 26224 (finalizeAllianceObligationRefusals), 26615 (expireTreaties w runDiplomacyTurnTick), 26678 (płatności broken w runDiplomacyTurnTick), 27104 (applyProposalOutcomeImpl, wasal), 40244 (eliminateOwner); resety 11802, 50607, 52837; test 30637.
