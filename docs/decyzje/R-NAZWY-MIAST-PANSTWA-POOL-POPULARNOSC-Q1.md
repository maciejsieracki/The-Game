# R-NAZWY-MIAST-PANSTWA-POOL-POPULARNOSC-Q1 — obecna zasada i future spec

**Data zapisu:** 2026-09-15
**Status:** `OWNER DECISION B REFINED — CURRENT RULE PRESERVED / FUTURE SPEC`
**Domena:** `GAME`
**Implementacja tej specyfikacji:** `NIE WYKONANO`
**Projekt/board:** `p_9ae9ac64` / `the-game-real24` / profil `default`

## Obowiązująca zasada gry

Na mapie nie można wybrać dwóch cywilizacji tego samego typu. Właściciel wyraźnie pozostawił tę zasadę bez zmian. Nie zmieniamy obecnego wyboru cywilizacji ani aktualnego spawnu.

## Zachowana przyszłościowa reguła nazw

Jeżeli w przyszłości zostanie dopuszczona druga cywilizacja tego samego typu, obowiązuje następująca intencja nazewnicza:

1. Jedno miasto ma jedną unikalną nazwę.
2. Nie tworzymy nazw typu `Ateny II`, `Ateny III` ani podobnych suffixów.
3. Pierwsza nazwa jest zarezerwowana dla cywilizacji.
4. Kolejna cywilizacja tego samego typu pobiera następną pozycję kolejki tej cywilizacji; następne instancje pobierają kolejne pozycje.
5. Ta reguła jest zachowana jako specyfikacja na przyszłość i nie zmienia obecnego limitu jednego typu cywilizacji na mapie.

## Stan potwierdzony przez recovery

Karta `t_c375f3d9`, run `317`, potwierdziła:

- obecny kontrakt danych `100` nazw founding + `10` nazw państw-miast;
- istniejące fallbacki;
- brak literalnego `no name` w skanowanych źródłach;
- poprawkę recovery dotyczącą indeksowania suffixu, która nie jest wdrażana, ponieważ właściciel odrzucił model suffixów `II/III`.

## Odłożone do przyszłej decyzji

Jeżeli właściciel otworzy kiedyś zmianę limitu cywilizacji tego samego typu, trzeba wtedy doprecyzować:

- czy kolejka obejmuje 100 nazw regularnych, czy wszystkie 110 nazw;
- czy 10 nazw państw-miast uczestniczy w tej samej kolejce;
- jak utrwalać i odtwarzać kursor kolejki w save/load;
- jaki fallback stosować po wyczerpaniu puli;
- jak chronić stolicę i rozróżniać nazwy państw-miast.

Do czasu takiej decyzji nie tworzyć Operatora, Evaluatora ani patcha produktu dla tej future spec. Nie wykonywać deployu names.

## Kanban / proweniencja

```text
Pierwotny Operator: t_7a01b0bf / run 308 — TIMEOUT
Recovery Operator:  t_c375f3d9 / run 317 — DECISION_REQUIRED
```

Raport recovery: `dyspozycje/autobot/runs/R-NAZWY-MIAST-PANSTWA-POOL-POPULARNOSC-Q1/recovery-r1/recovery-report.md`.
