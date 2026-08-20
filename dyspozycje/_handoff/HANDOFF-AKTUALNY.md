# HANDOFF AKTUALNY — PAKIET-3-STATUSY-REJESTRY-HANDOFFY-RAPORTY

## STATUS

Dokumentacja i struktura artefaktów przygotowane w izolowanym worktree; pakiet
został zacommitowany lokalnie.
Baza: `885011ce`; gałąź: `codex/pakiet-3-statusy-rejestry-handoffy-raporty`.

## TEMAT

Ujednolicenie nawigacji procesu AutoBot bez zmiany merytorycznych statusów bez
dowodu: kanoniczna lista statusów, indeks aktywnych ABC, odsyłacze zamkniętych
decyzji, jeden aktualny handoff i szablony runów.

## ZMIANY / COMMIT

- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — dodany indeks migracji i zamknięta lista
  statusów; stare wiersze pozostają historią append-only.
- `dyspozycje/PYTANIA-OTWARTE.md` — dodany indeks aktywnych ABC i zamkniętych
  odsyłaczy; pełne sekcje pozostają bez usuwania.
- `STAN-PRACY-HANDOFF.md` — skrócony do punktu wejścia; poprzednia treść w
  [`../../STAN-PRACY-HANDOFF-ARCHIWUM-2026-08-20.md`](../../STAN-PRACY-HANDOFF-ARCHIWUM-2026-08-20.md).
- `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` — ten plik; `KANAL-PRACA.md` i
  `WERSJE.md` dostały wyłącznie odnośniki procesu.
- `dyspozycje/autobot/runs/PAKIET-3-STATUSY-REJESTRY-HANDOFFY-RAPORTY/` — pięć
  szablonów etapów 00–04; historycznych raportów nie przenoszono.

Commit Pakietu 3 jest lokalny; identyfikator podaje raport wykonawczy tej sesji.

## TESTY

- audyt nowych odnośników: **35 celów / 0 nowych zerwań**;
- audyt pełnego zakresu zmienianych dokumentów: **62 cele / 7 starych zerwań**
  w zachowanych historycznych sekcjach `PYTANIA-OTWARTE.md` (nie wprowadzone przez
  Pakiet 3, nie naprawiane kosztem przepisywania historii);
- `git diff --check`: **PASS**;
- allowlista: **PASS** — poza nią nie ma plików merytorycznych.

## BLOKADY

Brak blokady merytorycznej. Pełny checkout wymagał sparse-worktree z powodu
historycznych nazw plików przekraczających limit Windows; nie wpływa to na zakres
ani na commit. Brak zmian w `CLAUDE.md`, `.cursor/rules`, `.claude/skills`,
`R-PROC-AUTOBOT`, `gra/`.

## NASTĘPNY KROK

Przekazać handoff do przeglądu właściciela. Ewentualny deploy/push wymaga osobnej
autoryzacji i nie wynika z tego commitu.

## DEPLOY / PUSH

Nie wykonywać. Pakiet 3 jest docs-only i kończy się lokalnym commitem w izolowanym
worktree; `READY_FOR_DEPLOY`, deploy oraz push nie są częścią tej paczki.

## PUNKT WEJŚCIA DLA NASTĘPNEJ SESJI

1. Otwórz ten plik.
2. Sprawdź indeks statusów w [`../REJESTR-PROSB-I-ZADAN.md`](../REJESTR-PROSB-I-ZADAN.md)
   i aktywne ABC w [`../PYTANIA-OTWARTE.md`](../PYTANIA-OTWARTE.md).
3. Dla nowej pracy skopiuj strukturę z
   [`../autobot/runs/PAKIET-3-STATUSY-REJESTRY-HANDOFFY-RAPORTY/`](../autobot/runs/PAKIET-3-STATUSY-REJESTRY-HANDOFFY-RAPORTY/).
4. Historyczne handoffy i raporty pozostaw na miejscu; dodawaj odsyłacze zamiast
   nadpisywać ich treść.
