# Skąd zapasy

## Metadane

| id | `skad-zapasy` |
| tytuł | Skąd zapasy |
| kategoria | Ekonomia imperium |
| poradnik_ref | Część VIII (Ekonomia imperium) |
| json_ref | `econ-params.json` (`ekonomia_miasta.ksiega_zasobow_tury`), silnik `game/resource-ledger.ts`, karta `ui/resourceSourceLedgerHtml.ts` |

---

## Wiki‑S

**Skąd zapasy** to rozwijana sekcja na karcie surowca w panelu imperium. Pokazuje, **z czego** wzrósł i **na co** ubył magazyn państwa danego surowca w ostatnich **10 turach**: osobna linia dla każdego źródła (np. „+12 Warzelnia (Rzym)”, „+30 Umowa wymiany z <cywilizacja>”, „−20 Obywatele”).

---

## Wiki‑M

### Co pokazuje

- **Magazyn państwa** — zapas surowca wspólny dla całego imperium. Karta pokazuje sumę zmian w każdej turze; „Skąd zapasy” rozbija tę sumę na źródła.
- **Przyrosty** (kolor przyrostu) — wpływy do magazynu: plony z terenu, Stolarnia, Warzelnia soli, wycinka lasu, wyjście receptur (np. Garncarnia, odlewnie), umowy wymiany.
- **Ubytki** (kolor ubytku) — zużycie z magazynu: wejścia receptur, utrzymanie budynków i jednostek, zużycie przez obywateli, budowa i rekrutacja pobierane z puli państwa.
- Każda linia ma **etykietę po polsku** (nazwa źródła i, jeśli dotyczy, miasto lub cywilizacja). Linie o tej samej etykiecie są scalane; przyrosty i ubytki są sortowane po wielkości.

### Ile tur

Sekcja obejmuje **ostatnie 10 tur** (parametr `ksiega_zasobow_tury` w `econ-params.json`, taki sam dla każdego poziomu trudności). Starsze tury nie są pamiętane.

### Jak czytać

1. Najpierw spójrz na **sumę** na karcie surowca — czy magazyn rośnie, czy maleje.
2. Rozwiń „Skąd zapasy” i znajdź **największy ubytek**. Jeśli to „Obywatele” — zużycie żywności/surowców przez ludność; jeśli „Utrzymanie budynków” — koszt budynków, które stoją.
3. Jeśli **przyrost** jest mały, sprawdź źródła produkcji (Warzelnie, Stolarnie, wycinkę) i umowy wymiany.

### Ograniczenia

- Księga pokazuje zmiany **magazynu państwa** (per właściciel), a nie stan poszczególnych miast.

---

## Poradnik‑L

→ Przewodnik po gospodarce: `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md`

---

## Historia / decyzje (know‑how zespołu)

- R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (partie 1–4): struktura księgi, pamięć 10 tur, karta w panelu imperium, etykiety bez surowych ID.
- R-WEB-UI-RESOURCE-SOURCE-LEDGER-REALPATH-TESTS-Q1: ścieżka rzeczywista (realpath) i testy zgodności księgi z magazynem.
- R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1: hasło encyklopedii i wpis w poradniku (ten dokument); zrzuty i pomiar wydajności — patrz raport tematu.
