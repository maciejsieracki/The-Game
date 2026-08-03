# R-AUTO-V2 — domknięcie automatyzacji (budowa + ulepszenia)

**Status:** wdrożone (kod) · Q1–Q9  
**Data:** 2026-08-03  
**Powiązane:** `R-AUTO-BUDOWA-LISTA` · `R-AUTO-ULEPSZENIA` (Q1–Q5)

## Paczka 1

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AUTO-V2-Q1** | **B** | Lista/szablon: bieżące miasto **+** „Wgraj do wszystkich moich miast” (z potwierdzeniem). |
| **R-AUTO-V2-Q2** | **A** | Lista budowy = **tylko budynki**; jednostki poza Listą. |
| **R-AUTO-V2-Q3** | **C** | Auto-ulepszenia: **domyślna polityka państwa** + opcjonalny **wyjątek per miasto**. |

## Paczka 2 (Q4–Q9)

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AUTO-V2-Q4** | **B** | Limit 1/2/3 **+** twarda rezerwa Pracy (nie zjadać całej puli cudom / innym wydatkom z puli państwa). |
| **R-AUTO-V2-Q5** | **DOPREC.** → **C*** | Ulepszenia **nigdy w mieście** — tylko 🔨 na mapie. Zarządca ⚙ ≠ ulepszenia. Budowa (Ręczny/Priorytet/Lista) zostaje w mieście; Okolica/Zarządca osobno; **bez scalania** ulepszeń do Zarządcy. |
| **R-AUTO-V2-Q6** | **A** | Lista wyczerpana → **stop** + komunikat „Lista ukończona” (bez auto-przełączania trybu). |
| **R-AUTO-V2-Q7** | **A** | Upgrade na Liście = **osobne pozycje** (Pałac I, Pałac II…). |
| **R-AUTO-V2-Q8** | **A** | Szablony = **tylko A/B/C gracza** (bez gotowego JSON w danych). |
| **R-AUTO-V2-Q9** | **A** | Wyższa epoka na Liście = **szare / kłódka**, widać, pomijane do odblokowania. |

\*Q5: pytanie o „scalenie z Zarządcą” było źle ustawione względem Q5 ulepszeń (UI mapy). Maciej: *„w mieście nie robimy żadnych ulepszeń, tylko na mapie świata w budowie ulepszeń”* → domknięte jako **osobno / bez ulepszeń w mieście**.

**Cytat Q4–Q9:** *„R-AUTO-V2-Q4 b / … Q5 nie rozumiem… ulepszenia tylko na mapie… Q6a / Q7 a / Q8 a / Q9a”*

## Do wdrożenia (skrót)

1. Wgraj Listę do wszystkich miast (Q1=B)
2. Polityka ulepszeń: global + wyjątek per miasto (Q3=C); UI tylko w `buildModeHud`
3. Rezerwa Pracy przy auto-ulepszeniach (Q4=B) — wartość liczbowa: placeholder do strojenia (patrz niżej)
4. Koniec Listy → stop + komunikat (Q6=A)
5. Lista: osobne ID upgrade’ów (Q7=A); szare pozycje wyższej epoki (Q9=A)
6. Bez JSON szablonów (Q8=A); bez jednostek na Liście (Q2=A)

## Placeholder (bez ABC — strojenie)

- **Rezerwa Pracy (Q4=B):** startowo **30 Pracy** (nie ruszaj auto-ulepszeniami, gdy `playerPracaPool − koszt < 30`). Do zmiany po playteście / panelu.

*Koniec.*
