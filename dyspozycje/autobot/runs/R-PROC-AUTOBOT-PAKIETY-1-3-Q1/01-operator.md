# 01 — OPERATOR

STATUS: PASS
TEMAT: `R-PROC-AUTOBOT-PAKIETY-1-3-Q1`
GOAL: Dokończyć pakiety dokumentacyjne 1–3 i domknąć routing AutoBot bez zmian w `gra/`.

## Wykonane

- Pakiet 1: indeks wskazuje `HANDOFF-AKTUALNY` i tabelę miejsc zapisu artefaktów.
- Pakiet 2: `CLAUDE.md`, aktywna reguła, skill i `R-PROC-AUTOBOT` są krótkie;
  historyczne snapshoty pozostają w `docs/archiwum-procesu/`.
- Pakiet 3: rejestr, ABC/ECHO, handoff i `runs/<ID>/00–04` opisują jeden obieg;
  statusy pakietów są w `HANDOFF-AKTUALNY.md`.
- Dodano powtarzalny audyt `dyspozycje/autobot/tools/process-docs-audit.cjs`.
- Zaktualizowano README runtime, aby nowe raporty trafiały do runów, nie tylko do logów.

ZMIANY/COMMIT: allowlista z `00-dispatch.md`; commit zostanie wpisany po integracji.
TESTY: wykonane po zapisie w fazie Evaluator/Final Control.
BLOKADY: brak merytorycznej; deploy/push poza zakresem.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO.
