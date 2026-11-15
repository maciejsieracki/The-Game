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

### Rodzaje źródeł (pełna lista)

Każda linia w „Skąd zapasy” ma jeden z poniższych rodzajów (zgodnie z `LedgerSourceKind` w `gra/src/game/resource-ledger.ts`):

| Rodzaj | Co oznacza w karcie | Kierunek |
|---|---|---|
| Teren | plony z mapy i ulepszeń terenu trafiające do magazynu państwa | przyrost |
| Stolarnia | bonus Stolarni (drewno z mapy) | przyrost |
| Warzelnia | sól z Warzelni soli (plon ulepszenia terenu, per miasto) | przyrost |
| Wycinka | drewno z wycinki lasu | przyrost |
| Konwersja | wyjście receptury (Garncarnia, Cegielnia, odlewnie) | przyrost |
| Wejście receptury | surowce zużyte przez konwerter | ubytek |
| Spichlerz | drain Spichlerza (ceramika / sól) | ubytek |
| Utrzymanie budynków | koszt utrzymania budynków, po tiku | ubytek |
| Utrzymanie jednostek | koszt utrzymania jednostek, po tiku | ubytek |
| Obywatele | zużycie przez obywateli | ubytek |
| Budowa | start budowy pobrany z puli państwa poza tickiem | ubytek |
| Rekrutacja | rekrutacja jednostek pobrana z puli państwa poza tickiem | ubytek |
| Umowa wymiany | przeniesienie surowca w umowie wymiany (cykliczna lub jednorazowa) | przyrost lub ubytek |
| Mennica | drain Złota przez Mennicę (po plonach, w tiku) | ubytek |
| Limit magazynu | ścięcie nadwyżki ponad limit magazynu państwa (w tiku) | ubytek |
| Łup bitwy | łup z wygranej bitwy, dopisany do puli państwa zwycięzcy | przyrost |
| Zwrot | zwrot surowców: anulowana rekrutacja lub rozwiązana jednostka | przyrost |
| Przejęcie miasta | zdobycie, oddanie lub utrata miasta (zapasy miasta zmieniają właściciela) | przyrost lub ubytek |
| Dar | dar lub prezent surowców od innego właściciela | przyrost lub ubytek |

Kierunek (przyrost lub ubytek) wynika z tego, czy surowiec wpłynął do magazynu państwa, czy z niego wyszedł. Rodzaj „Przejęcie miasta” i „Dar” może wystąpić w obu kierunkach. Kolory przyrostu i ubytku nie są przypisane do rodzaju.

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
