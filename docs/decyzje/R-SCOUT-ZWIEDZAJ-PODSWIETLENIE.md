# R-SCOUT-ZWIEDZAJ-PODSWIETLENIE — Zwiedzaj bez złotej ramki (vs Uśpienie)

**Status:** ⚠️ Q1=A (2026-08-04) **ZASTĄPIONA** przez **Q2=A (2026-08-10)** — patrz sekcja
„R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2" niżej. Zapis Q1 poniżej zostaje jako HISTORYCZNY (nie
usunięty), zgodnie z konwencją tego katalogu — ale **NIE opisuje dzisiejszego zachowania gry**.  
**Zgłoszenie:** Maciej (powtórne, screenshot) — Uśpienie (księżyc) ma złote podświetlenie WŁ; Zwiedzaj po kliknięciu „nic się nie dzieje”.

**Powiązane:** `R-UNIT-MODE-TOGGLE-UI` · `R-SCOUT-ZWIEDZAJ-HIGHLIGHT` (FALA 221 — select nie kasuje `autoExplore`) · `R-SCOUT-ZWIEDZAJ-UX` (deselect + cykl — nadpisane Q1=A, **przywrócone** Q2=A)

## ECHO Q1 (HISTORYCZNY — zastąpiony Q2, patrz niżej)
**R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1 = A** — *„R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1 a”* (2026-08-04).  
Po WŁ Zwiedzaj: zostań na zwiadowcy + `refreshD1bHud` → złota ramka od razu. Bez odznaczania i bez cyklu.

## Dowód (Q1, historyczny)
- `gra/src/main.ts` — handler `scout-explore` (enable): usunięte `clearPlayerUnitSelection` + `cycleToAdjacentPlayerUnit`
- WYŁ bez zmian (zostaje zaznaczony, złoto gaśnie)

---

## R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 = A (2026-08-10) — COFA Q1

**Status:** ✅ Q2=A, 2026-08-10. **Ta decyzja cofa Q1=A (2026-08-04) wprost** — Maciej podjął Q1,
a Q2 zmienia dokładnie ten sam obszar (zachowanie zaznaczenia po WŁ Zwiedzaj) w przeciwnym
kierunku.

**Zgłoszenie:** Maciej — mylące podświetlenie ruchu (`reachable`) zostające na zwiadowcy po
włączeniu Zwiedzaj prowadziło do przypadkowych kliknięć na mapę, które po cichu kasowały
auto-eksplorację (odczytywane jako „gra sama wyłącza Zwiedzaj").

**Decyzja:** po WŁ Zwiedzaj jednostka **NIE zostaje zaznaczona** — odznacza się i przechodzi
(cykl) do kolejnej jednostki gracza z dostępnym ruchem (jak Spacja); brak takiej → pełne
odznaczenie. To dokładnie odwraca Q1 (które celowo zostawiało zaznaczenie dla złotej ramki).

**Dlaczego bezpiecznie odwrócić Q1 bez powrotu do problemu z Q1:** feedback wizualny, który Q1
miało zapewnić złotą ramką, dziś daje **toast** (`showHintMessage`, 2800 ms) — w sierpniu (Q1)
tego toastu jeszcze nie było, stąd Q1 sięgnęło po zaznaczenie jako jedyny dostępny kanał
feedbacku. Dziś toast pokrywa tę potrzebę bez efektu ubocznego (mylące podświetlenie ruchu).

### Runda Evaluatora (Opus 5, PASS-WITH-NOTES tego samego dnia) — 3 noty naprawione w tej samej fali
- **N1** — nowy test regex-only był ślepy na mutacje logiki cyklu (np. usunięcie
  `selectPlayerUnit(next.id)`, albo `if (true) return;` na wejściu funkcji cyklującej — obie
  mutacje przechodziły 10/10 PASS). Naprawa: rdzeń logiki (`isUnitActiveForCycle`,
  `cyclablePlayerArmyLeadsBase`, rozwiązywanie następnego id) wyniesiony do czystego modułu
  `gra/src/game/army-cycle.ts`, testowanego behawioralnie (sztuczne `RuntimeUnit`-y, asercje na
  wyniku) w `gra/tools/scout-explore-deselect-cycle-test.cjs`.
- **N2** — edge case: gdy panel oblężenia (lub inny blokujący panel, `!isWorldMapUnitMode()`)
  jest otwarty w chwili włączania Zwiedzaj, wewnętrzna wczesna bramka `cycleToAdjacentPlayerUnit`
  robiła cykl no-opem i stara jednostka zostawała zaznaczona z aktywnym podświetleniem ruchu —
  dokładnie zgłoszony bug, nienaprawiony w tym jednym scenariuszu. Naprawa: bramkowanie **w
  miejscu wywołania** w handlerze `scout-explore` (symetrycznie do call site'ów Spacji i auto-cyklu
  „bęben"): `isWorldMapUnitMode()` → cykl, w przeciwnym razie jawne `clearPlayerUnitSelection()`.
- **N3** — ten plik zaktualizowany (byłeś tu).

## Dowód (Q2)
- `gra/src/game/army-cycle.ts` — nowy, czysty moduł: `isUnitActiveForCycle`,
  `cyclablePlayerArmyLeadsBase`, `resolveAdjacentPlayerUnitCycle`.
- `gra/src/main.ts` — import z `./game/army-cycle`; `cycleToAdjacentPlayerUnit` jest dziś cienką
  warstwą efektów ubocznych nad `resolveAdjacentPlayerUnitCycle`; handler `scout-explore` (gałąź
  `enabling`) woła `isWorldMapUnitMode() ? cycleToAdjacentPlayerUnit(u.id, 1) : clearPlayerUnitSelection()`.
- `gra/tools/scout-explore-deselect-cycle-test.cjs` — przepisany na test behawioralny (Sekcja 1)
  + wąska bramka strukturalna nad okablowaniem main.ts (Sekcje 2–4).

---

## Diagnoza

CSS i flaga `active: autoExplore` są OK (`uc-act-btn--on`).  
`R-SCOUT-ZWIEDZAJ-HIGHLIGHT` naprawił kasowanie przy zaznaczeniu.

**Przyczyna UX:** przy **WŁ Zwiedzaj** kod robi:
1. `autoExplore = true`
2. `clearPlayerUnitSelection()` — panel znika z zwiadowcy
3. `cycleToAdjacentPlayerUnit` — skok na **inną** jednostkę

Czuwaj/Uśpienie: tylko odznacza (bez cyklu). Po ponownym kliknięciu widać złoty księżyc.  
Zwiedzaj: cykl **zabiera** panel z zwiadowcy w momencie kliknięcia → wygląda jak „kliknięte i nie działa”; złotej ramki nie widać od razu.

---

## [TEMAT: Podświetlenie Zwiedzaj] R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1

**Sytuacja:** Na pasku akcji Uśpienie po włączeniu ma złotą ramkę (po powrocie na jednostkę). Zwiedzaj u zwiadowcy po kliknięciu nie pokazuje tego podświetlenia — panel od razu skacze na inną jednostkę albo znika.

**Cel pytania:** Jak ma się zachować panel po włączeniu Zwiedzaj, żeby złota ramka była czytelna jak przy Uśpieniu.

**Dlaczego teraz:** Maciej zgłasza to wielokrotnie; poprzedni fix (select nie kasuje flagi) nie wystarczył, bo feedback jest ukryty przez odznaczenie + cykl.

### A — Zostań na zwiadowcy + złota ramka od razu *(rekomendacja)*
Po WŁ: `autoExplore=true`, **bez** odznaczania i **bez** cyklu → `refreshD1bHud` → przycisk Zwiedzaj od razu `uc-act-btn--on`.
- **Za:** dokładnie to, o co chodzi („podświetlenie się pojawia”); spójne z oczekiwaniem vs Uśpienie.
- **Za:** prosta zmiana w `main.ts` (ścieżka `scout-explore`).
- **Przeciw:** zmienia UX z `R-SCOUT-ZWIEDZAJ-UX` (deselect+cykl).
- **Przeciw:** zwiadowca zostaje zaznaczony (można od razu kliknąć mapę / wyłączyć).

### B — Jak Czuwaj: odznacz bez cyklu
Po WŁ: odznacz zwiadowcę, **bez** `cycleToAdjacent`. Złoto po ponownym kliknięciu w zwiadowcę.
- **Za:** 1:1 z Uśpieniem; nadal wychodzi z cyklu Spacji (`autoExplore` wyklucza z cyklu).
- **Za:** mniejsza zmiana względem Czuwaj.
- **Przeciw:** nadal nie ma podświetlenia w momencie kliknięcia (dopiero po powrocie).
- **Przeciw:** łatwo znów odczytać jako „nie działa”, jeśli nie wrócisz na zwiadowcę.

### C — Zostaw cykl; tylko dopracuj powrót
Zostaw deselect+cykl; upewnij się, że po ręcznym powrocie na zwiadowcę złoto zawsze widać (+ test).
- **Za:** nie rusza UX cyklu z `R-SCOUT-ZWIEDZAJ-UX`.
- **Za:** HIGHLIGHT już jest w FALA 221 — ewentualnie tylko regresja.
- **Przeciw:** nie rozwiązuje „w momencie kliknięcia nic nie widać”.
- **Przeciw:** Maciej już to zgłaszał mimo HIGHLIGHT.

**Rekomendacja: A.**

---

## Pliki (po decyzji)

- `gra/src/main.ts` — handler `scout-explore` (enable)
- ewent. test UX / `scout-auto-explore-test.cjs` (bez zmiany reguł ruchu)
- docs: ten plik + rejestr

**Deploy:** osobno, na hasło `deploy`.
