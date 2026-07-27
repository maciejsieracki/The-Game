# Standard zapisu pytań ABC w plikach (Maciej 2026-07-27)

**Obowiązuje:** wszystkie czaty (koordynator, ABC, lane, Integrator).

## Zasada

Każde pytanie ABC (lub werdykt **BRAK ABC** z pełnym kontekstem) → **osobny plik**:

`docs/decyzje/<ID>.md`

Indeks kolejki: `docs/decyzje/ABC-KOLEJKA-OTWARTE-2026-07-27.md` (aktualizować przy nowych paczkach).

## Struktura pliku (pełna forma — jak w czacie)

```markdown
# <ID> — <tytuł jednym zdaniem>

**Status:** 🟡 ZAPISANA | 🔵 W TRAKCIE | 🟢 WDROŻONA | ⛔ BRAK ABC (tylko fix)
**Grupa:** A…F
**Ekran:** [EKRAN: …] lub [TEMAT: …]

## Sytuacja
(2–6 zdań, pełne nazwy, zero skrótów)

## Cel pytania
(1–2 zdania)

## Dlaczego teraz
(1–3 zdania)

## Opcja A — …
Opis: …
**Za:** … · …
**Przeciw:** … · …

## Opcja B — …
(jak wyżej)

## Opcja C — …
(jak wyżej)

## Rekomendacja
**Litera:** A | B | C — jedno zdanie dlaczego.

## Odpowiedź Macieja
> **<litera>** — cytat lub skrót (data)
(lub: **BRAK ABC** — decyzja produktowa już obowiązuje od …)

## Wdrożenie (po `działaj`)
- pliki · testy · warstwa 🟢/🟡
```

## Po odpowiedzi Macieja (ECHO)

### Kolejność obowiązkowa (Maciej 2026-07-27)

**Najpierw pliki — potem kod.** Inne sesje/czaty nie widzą historii rozmowy; **jedyną prawdą** dla odpowiedzi ABC są pliki w repo.

| Krok | Co | Kiedy |
|------|-----|--------|
| **1** | `docs/decyzje/<ID>.md` — sekcja **Odpowiedź Macieja** (litera + cytat/skrot + data) · status **🟡 ZAPISANA** | **natychmiast** po `ID: litera` — **przed** edycją `gra/` |
| **2** | `docs/decyzje/ABC-KOLEJKA-OTWARTE-*.md` — wiersz indeksu (litera + status) | ten sam krok |
| **3** | `docs/obieg/REJESTR-DECYZJI.md` — wiersz 🟡 ZAPISANA (jeśli dotyczy lane) | ten sam krok |
| **4** | Potwierdzenie w czacie: `Zapisałem <ID> → <litera> w pliku.` | przed kodem |
| **5** | Kod / testy w `gra/` | dopiero po krokach 1–4 (i po **`działaj`** jeśli wymagane) |
| **6** | Status **🔵 W TRAKCIE** → **🟢 WDROŻONA** + sekcja Wdrożenie w `<ID>.md` | po zakończeniu implementacji |

**ZAKAZ:** ruszać `gra/src/**` zanim **Odpowiedź Macieja** nie jest w `docs/decyzje/<ID>.md` — nawet gdy litera jest oczywista z kontekstu czatu.

**Wyjątek:** czysty fix techniczny oznaczony **BRAK ABC** — plik z werdyktem i opisem fixu **i tak** powstaje przed kodem.

## Format odpowiedzi Macieja w czacie

Wystarczy: `ID: litera` (np. `C-WIAR-D4: A`). Przy tabelach (P-AI-006 B) — poprawki w tej samej wiadomości.

## BRAK ABC

Gdy nie ma wyboru produktowego — plik **i tak powstaje** z pełnym Sytuacja/Cel/Dlaczego teraz + werdykt **BRAK ABC** + opis fixu technicznego + data wcześniejszej decyzji (jeśli jest).
