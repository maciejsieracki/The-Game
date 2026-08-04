# R-SCOUT-ZWIEDZAJ-PODSWIETLENIE — Zwiedzaj bez złotej ramki (vs Uśpienie)

**Status:** 🟡 CZEKA-NA-DECYZJĘ · 2026-08-04  
**Zgłoszenie:** Maciej (powtórne, screenshot) — Uśpienie (księżyc) ma złote podświetlenie WŁ; Zwiedzaj po kliknięciu „nic się nie dzieje”.

**Powiązane:** `R-UNIT-MODE-TOGGLE-UI` · `R-SCOUT-ZWIEDZAJ-HIGHLIGHT` (FALA 221 — select nie kasuje `autoExplore`) · `R-SCOUT-ZWIEDZAJ-UX` (deselect + cykl)

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
