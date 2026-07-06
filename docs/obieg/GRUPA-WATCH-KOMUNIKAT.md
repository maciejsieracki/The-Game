# Grupa — auto-watch co 15 min (jeden komunikat dla A–E)

> **Ten sam tekst** wklejasz w każdy czat grupy. **Maciej nie podaje litery** — agent bierze ją z pliku dyspozycji onboarding tego czatu.

---

## Komunikat uniwersalny (copy-paste — wszystkie grupy A–E)

```
Obowiązuje WATCH co 15 min (obieg 2026-06-30) — ten sam tekst we wszystkich czatach grup:

1. Agent: wyznacz grupę z pliku dyspozycji TEGO czatu
   (docs/czaty/DYSPOZYCJA-GRUPA-*.md z onboarding — Maciej NIE podaje litery).

2. Co ~15 min: skrótowy „start grupy” — czytaj PLIKI (Slack tylko dodatek):
   • docs/obieg/<plik z dyspozycji> — tracker
   • dyspozycje/_handoff/MASTER-do-* i handoffy lane skierowane do nas
   • docs/obieg/REJESTR-DECYZJI.md — nowe ABC

3. Pliki = prawda. Gdy Slack nie dotrze — outbox w repo:
   docs/obieg/SLACK-OUTBOX-GRUPA-<litera>-<data>.md
   (literę agent bierze z dyspozycji, nie od Macieja)

4. Włącz watch w TYM czacie (agent):
   cd gra
   .\tools\grupa-watch-inbox.ps1 -Auto -Dyspozycja <ścieżka DYSPOZYCJA-GRUPA z onboarding>

5. Tick co 15 min: krótko Maciejowi tylko przy NOWEJ dyspozycji od Mastera — inaczej jedna linia OK.

5b. Gdy Maciej wpisze **`raport2`** — natychmiast 3 sekcje (patrz `RAPORT2-INSTRUKCJA.md`). NIE proś go o wklejkę do Mastera.

6. Stop: „stop watch”.

Potwierdź: „Watch włączony.” — **tylko po** uruchomieniu skryptu w tle (widać proces w terminalu).
```

---

## Co robi agent (Maciej tego nie wpisuje)

| Krok | Agent |
|------|--------|
| Litera grupy | z nazwy `DYSPOZYCJA-GRUPA-X.md` **tego czatu** |
| Komenda | `grupa-watch-inbox.ps1 -Auto -Dyspozycja docs/czaty/DYSPOZYCJA-GRUPA-X.md` |
| Fallback | `-Auto` bez `-Dyspozycja` → ostatnio zmieniony plik dyspozycji A–E (słabsze) |

**Grupa F** — **inny skrypt:** `integrator-watch-inbox.ps1` (nie `grupa-watch-inbox`).  
Komunikat → sekcja poniżej · też w `DYSPOZYCJA-GRUPA-F.md`.

---

## Komunikat Grupa F (Integrator)

```
Obowiązuje WATCH co 15 min — czat Integrator F:

1. Co ~15 min: start F — INTEGRATOR-kolejka.md sekcja DO WPIĘCIA.
2. Kolejka PUSTA = czekaj. Handoff w repo bez wpisu w DO WPIĘCIA = NIE koduj.
3. Włącz watch (agent MUSI uruchomić terminal w tle):
   cd gra
   .\tools\integrator-watch-inbox.ps1 -IntervalSeconds 900
4. Tick: krótko Maciejowi tylko przy NOWEJ dyspozycji w kolejce.
5. Stop: „stop watch”.

Potwierdź dopiero po starcie procesu: „Watch włączony — proces F.”
(NIE wystarczy napisać „włączony” bez skryptu.)
```

---

## Symetria z Masterem

| | Master hub | Grupa A–E | Grupa F |
|---|------------|-----------|---------|
| Skrypt | `master-watch-inbox.ps1` | `grupa-watch-inbox.ps1 -Auto` | `integrator-watch-inbox.ps1` |
| Interwał | 15 min | 15 min | 15 min |
| **Ten hub** | **proces działa** (tick #7+) | — | wklej komunikat F |

Powiązane: [`MASTER-START-AUTO.md`](MASTER-START-AUTO.md) · [`_DYSPOZYCJA-WSPOLNY-OBIEG.md`](../czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md)
