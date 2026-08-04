# R-EOT-EVENT-DEFER — wydarzenia ze skutków końca tury → start następnej

**Status:** CZEKA-NA-DECYZJĘ  
**Data:** 2026-08-04  
**ID pytania:** `R-EOT-EVENT-DEFER-Q1`

## Cytat Macieja

> Jeżeli jakaś czynność czy zdarzenie wywołuje wydarzenie, było to następstwem już po zakończeniu tury, to powinno się to pojawić ponownie, to wydarzenie na początku kolejnej tury, ponieważ nie można sprawdzić, co się wydarzyło. A de facto na końcu tury się to nie powinno pojawiać. bo jak zakończyłem tury to i tak tego nie zobaczę. To tylko miga.

## Sytuacja (dziś)

Po **Zakończ turę** silnik liczy ekonomię, AI, auto-systemy. Część skutków wpada do panelu **Wydarzenia** / toastów **w trakcie przejścia tury** (overlay). Gracz patrzy na „Zakończenie ruchów… / Ekonomia… / Tura AI…” — chipy tylko **migają**, nie da się ich przeczytać ani kliknąć.

Wzór już jest dla Spichlerza (`SPICH-AUTO-Q1`): auto-obniżenie racji na EOT → wpis w Wydarzeniach **na początku następnej tury gracza** (`pendingAutoRationForNextTurn`). Reszta skutków EOT nie ma tej reguły.

## Cel

Skutki **po** decyzji „kończę turę” mają być czytelne na **starcie Twojej kolejnej tury**, a nie w trakcie migającego przejścia.

---

## R-EOT-EVENT-DEFER-Q1 — kiedy pokazywać skutki końca tury?

### A — Odłóż wszystkie skutki EOT na start następnej tury (rekomendacja)

Wszystko, co powstaje **po** kliknięciu „Zakończ turę” (ekonomia, auto-racje, AI, wojny, ukończenia z ticka, toasty z tych faz) → **kolejka** → pokaż w panelu Wydarzenia dopiero gdy wraca tura gracza („Tura N — twoja kolej”). W trakcie overlay: **zero** nowych chipów/toastów z tych faz.

- **Za:** dokładnie to, o czym mówisz — widać i da się sprawdzić.
- **Za:** jeden wzór jak Spichlerz; mniej migania przy przejściu.
- **Przeciw:** dłuższa lista chipów na starcie tury (kilka naraz).
- **Przeciw:** trzeba przeciąć wszystkie źródła EOT (łatwo coś pominąć w pierwszej fali).

### B — Odłóż tylko ważne / negatywne

Na start następnej tury: racje, głód, wojna, bunt, dyplomacja pilna. Drobne (np. szlak handlowy, chatka z auto-zwiedzania) mogą zostać jak dziś albo tylko w logu bez flasha.

- **Za:** krótsza lista na starcie tury.
- **Za:** mniej pracy przy wdrożeniu.
- **Przeciw:** nadal może migać „nieważne” — a Ty i tak tego nie czytasz na EOT.
- **Przeciw:** granica „ważne vs drobne” będzie się spierać przy każdym nowym evencie.

### C — Zatrzymaj przejście tury na wydarzeniach (modal / lista do OK)

Na końcu tury pokaż skutki **pełnym** UI i czekaj na potwierdzenie, zanim pójdzie AI / następna tura.

- **Za:** widzisz skutki od razu w kontekście tej tury.
- **Przeciw:** przeczy Twojej uwadze — na EOT i tak chcesz iść dalej, nie czytać.
- **Przeciw:** spowalnia rytm gry (każda tura = ekstra klik).

**Rekomendacja: A** — skutki po „Zakończ turę” = start następnej Twojej tury; zero mignięć na overlay.

---

## Po decyzji

`R-EOT-EVENT-DEFER-Q1 A|B|C` → implementacja + commit → **`deploy`** osobno.
