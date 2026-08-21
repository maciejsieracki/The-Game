# 00-dispatch — R-PROC-AUTOBOT-DOPISKI-PETLA-FINALCONTROL-Q1

**GOAL:** dopisać do `docs/decyzje/R-PROC-AUTOBOT.md` dwa doprecyzowania procesu,
w dokładnie wskazanych miejscach, bez zmiany żadnej istniejącej treści.

**Baza:** `origin/main` (`47cdca15`), branch `Work3`, worktree izolowany od
współdzielonego katalogu `Civ-clean-main-2026-08-20` (tam trwa równoległa,
niescommitowana praca innej sesji — zero interakcji z tamtym drzewem).

**Allowlista:** wyłącznie `docs/decyzje/R-PROC-AUTOBOT.md`. Zakaz dotykania
`gra/`, `playbook.md`, `playbook.json`, jakiegokolwiek pliku spoza tej allowlisty.

## Dopisek A — do §3 „Pętla domknięcia"

Wstawić jako nowy akapit bezpośrednio PO akapicie kończącym się „ABC pauzuje temat
i nie zużywa rundy." i PRZED nagłówkiem „## 4. Rejestry i artefakty":

> Przed rozpoczęciem rundy poprawkowej Operator potwierdza w swoim raporcie
> (`01-operator.md`), że: przeczytał raport Evaluatora w całości, rozumie każdą
> wymienioną blokadę z osobna, poprawia wyłącznie zakres tego tematu (bez czyszczenia
> ani resetowania zmian innych, równoległych tematów w tym samym drzewie). Brak tego
> potwierdzenia w raporcie jest samo w sobie podstawą do `FAIL` rundy — nie wystarczy
> sama poprawka bez wykazania, że blokada została zrozumiana, nie tylko obejściowo
> naprawiona.

## Dopisek B — do §1, tabela ról, wiersz „Final Control", kolumna „Zakaz"

Obecny tekst komórki: „Nie integruje i nie wystawia samodzielnie `READY_FOR_DEPLOY`”.
Rozszerzyć (nie zastępować) o:

> ; nie akceptuje braków tylko dlatego, że główna bramka testowa jest zielona —
> kompletność śladu (GOAL, allowlista, testy edge/parytetu/save-load, brak
> nieautoryzowanych zmian) sprawdza niezależnie od statusu Evaluatora, nie na
> jego podstawie.

## Kryteria końca

- Oba dopiski obecne dosłownie w treści pliku, we wskazanych miejscach.
- Żadna inna linia pliku nie zmieniona (diff = tylko te dwie wstawki).
- `node dyspozycje/autobot/tools/process-docs-audit.cjs` — zielony, bez nowych ostrzeżeń.
- Brak zmian poza allowlistą (`git status` czysty poza tym jednym plikiem).

## Plan testów

```bash
node dyspozycje/autobot/tools/process-docs-audit.cjs
git diff --stat
git diff --check
```
