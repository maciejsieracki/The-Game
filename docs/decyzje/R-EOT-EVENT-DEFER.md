# R-EOT-EVENT-DEFER — wydarzenia ze skutków końca tury → start następnej

**Status:** 🟢 WDROŻONE w kodzie (nie deploy)  
**Data:** 2026-08-04  
**ID pytania:** `R-EOT-EVENT-DEFER-Q1`  
**Decyzja Macieja:** **A** (ECHO 2026-08-04)

## Cytat Macieja

> Jeżeli jakaś czynność czy zdarzenie wywołuje wydarzenie, było to następstwem już po zakończeniu tury, to powinno się to pojawić ponownie, to wydarzenie na początku kolejnej tury, ponieważ nie można sprawdzić, co się wydarzyło. A de facto na końcu tury się to nie powinno pojawiać. bo jak zakończyłem tury to i tak tego nie zobaczę. To tylko miga.

## Sytuacja (dziś)

Po **Zakończ turę** silnik liczy ekonomię, AI, auto-systemy. Część skutków wpada do panelu **Wydarzenia** / toastów **w trakcie przejścia tury** (overlay). Gracz patrzy na „Zakończenie ruchów… / Ekonomia… / Tura AI…” — chipy tylko **migają**, nie da się ich przeczytać ani kliknąć.

Wzór już jest dla Spichlerza (`SPICH-AUTO-Q1`): auto-obniżenie racji na EOT → wpis w Wydarzeniach **na początku następnej tury gracza** (`pendingAutoRationForNextTurn`). Reszta skutków EOT nie ma tej reguły.

## Cel

Skutki **po** decyzji „kończę turę” mają być czytelne na **starcie Twojej kolejnej tury**, a nie w trakcie migającego przejścia.

---

## R-EOT-EVENT-DEFER-Q1 — kiedy pokazywać skutki końca tury?

### A — Odłóż wszystkie skutki EOT na start następnej tury ✅ WYBRANE

Wszystko, co powstaje **po** kliknięciu „Zakończ turę” (ekonomia, auto-racje, AI, wojny, ukończenia z ticka, toasty z tych faz) → **kolejka** → pokaż w panelu Wydarzenia dopiero gdy wraca tura gracza („Tura N — twoja kolej”). W trakcie overlay: **zero** nowych chipów/toastów z tych faz.

### B — Odłóż tylko ważne / negatywne
### C — Zatrzymaj przejście tury na wydarzeniach (modal / lista do OK)

**Rekomendacja była: A** — Maciej potwierdził **A**.

---

## Implementacja (AC)

1. Flaga / kolejka `pendingEotEventsForNextTurn` (wzór `pendingAutoRationForNextTurn`).
2. Od momentu startu EOT do powrotu tury gracza: `pushEvent` / toast z faz EOT **nie** idą na żywo do HUD — trafiają do kolejki.
3. Na starcie tury gracza: flush kolejki do panelu Wydarzenia (z zachowaniem `negative` / czerwony styl gdzie dotyczy).
4. Test: zdarzenie wygenerowane w EOT nie pojawia się w HUD w trakcie overlay; pojawia się po starcie następnej tury gracza.
