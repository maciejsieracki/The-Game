STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-ELIMINATED-RELATION-CLOSE-Q1
GOAL: Ustalić, czy para z wyeliminowanym właścicielem zostaje w relacji „wojna" i czy wpływa to na liczniki/limity wojen. Przy wpływie — naprawa z testem; bez wpływu — dokument z klasyfikacją.
ZMIANY/COMMIT: Brak zmiany kodu gry (gra/src nietknięte). Dokument dyspozycje/analizy/ELIMINACJA-RELACJA-WOJNY-2026-11-25.md (nowy) oraz ten raport. Czubek pracy: SHA commita z raportem (patrz pole sha w odpowiedzi). Baza: 76c0fbc6b55816399ccbe8d6ac5c3240b99e70ee.
TESTY: Nie uruchomiono bramek (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, war-rules-multiwar-main-guard, hotseat, bramki-tmpdir) — powód: brak zmian w gra/src, więc nie ma czego weryfikować bramkami. Weryfikacja była analizą statyczną ścieżek odczytu (plik:linia w dokumencie). Test behawioralny NIE ZMIERZONO.
BLOKADY: Brak.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator decyduje o dwóch zadaniach porządkowych z zastrzeżeń dokumentu (nie wpływają na wojny): (1) czyszczenie wpisów martwych par w eliminateOwner i w warWearinessByPairKey, (2) potwierdzenie, czy diploOwnerEligibleForBrake (gra/src/main.ts:12563) odfiltrowuje eliminowanych w tickDiploAiAiPairsWithBrake (12708). Klasyfikacja L5: bez wpływu na liczniki i limity wojen (porządkowe).
DEPLOY/PUSH: NIE WYKONANO

## Ustalenia w skrócie
- eliminateOwner (gra/src/main.ts:40221–40223) kasuje wpisy diplomacyRelations z ownerId. Odczyt brakującego klucza (getDiploRelation, 11181–11183) zwraca neutralną relację, nie wojnę. Premisa L5 („relacja zostaje wojna") jest nieprawdziwa.
- Liczniki i limity (countActiveWarsForOwner 26032, warTypesForOwner 26061, pendingPrincipalCounts, buildAllianceWarObligationCtx 26137), tickAiAiWarWeariness (40745), UI listy wojen (24303–24330) i wymuszenia epoki — nie widzą martwej pary jako wojny.
- Zastrzeżenia porządkowe: odtwarzanie neutralnych wpisów martwych par przez tickDiploAiAiPairsWithBrake (niepotwierdzone filtrowanie eliminowanych); warWearinessByPairKey nie czyszczony przy eliminacji.
