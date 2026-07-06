# RAPORT: stan batchy i poprawek — 2026-07-06 ~03:15

Źródła: audyt kodu (subagent, 01:00), meldunek Cursora o gra/src (02:45),
bieżące wyniki integratora (03:00). Trzy statusy:
✅ W GRZE = w bundlu b04524f1, w który grasz teraz (stempel 2026-07-05 · d3b1aee7f5af)
🔧 W TRAKCIE = integrator robi to teraz, wejdzie z najbliższym publishem
⬜ DO ZROBIENIA / 🌲 = jest w drzewie gra/src (wg Cursora), ale nie w Twoim bundlu

| # | Element | Stan |
|---|---------|------|
| Batch 1 — A5 mgła (dirty-set) | ✅ W GRZE (lastFogSig, scene.ts) |
| Batch 1 — C1/C2 worker + pasek ładowania | ✅ W GRZE („Tworzenie świata" + generacja w tle) |
| Batch 1 — H1 powerPreference (GPU) | ✅ W GRZE |
| Batch 1 — C3 porcjowana budowa sceny | ⬜ DO ZROBIENIA (pliki async są, ale buildScene nadal jednym kawałkiem — nikt tego nie napisał) |
| Batch 2 — B1–B4 generacja Super Huge <60 s | 🌲 wg Cursora pełna wersja w gra/src; w Twoim bundlu tylko część (cache oceanu TAK, reszta NIE) — wymaga builda ze scalonego drzewa + pomiaru |
| Batch 3 — podgląd wydajności F9 | ✅ W GRZE (marker w bundlu) |
| Batch 3 — zoom LOD (A1+A4) | 🌲 w gra/src wg Cursora; w Twoim bundlu BRAK — do przeniesienia przy scaleniu drzew |
| Batch 4 — rzeki: sieć dopływów, junctiony, ciągłość biegów, zakaz pierścieni, delty tylko z ujściem, ujście nad wodą | ✅ W GRZE (rdzeń + poprawki I1/I2) |
| Batch 4 — rzeki: KAŻDA główna z ujściem, zero sierocych delt | 🔧 W TRAKCIE — małe mapy już 20/20 zielone (bezUjscia=0, sieroc=0, hash bez zmian), standard w toku + trop addTributariesForMainRiver; wejdzie z najbliższym publishem |
| Batch 5 — LOD/instancing dekoracji | ⬜ NIEROZPOCZĘTY (bramkowany na wyniki F9) |
| Batch 6 — workery AI/pathfinding | ⬜ NIEROZPOCZĘTY (bramkowany) |
| Batch 7 — panel „Test wydajności" + kalibracja progów (RTX = MOCNY) + limit workerów | ✅ W GRZE (menu → Więcej) |
| B0.1–B0.3 — ujścia/pipeline, Morse→Morze, odbudowa wybrzeży | ✅ W GRZE (stare fixy Cursora) |
| B0.6 — morze zalewające ląd (culling) | ✅ W GRZE (potwierdziłeś playtestem: „nie ma morza na lądzie") |
| B0.9 — plony w widoku miasta + tryby auto Żyw./Prod./Podat./Zrówn. | ✅ W GRZE |
| B0.4 — pustynne „plaże" (podwójny pierścień wybrzeża) | ⬜ DO DECYZJI projektowej (design, nie bug) |

## Jednym zdaniem
W grze masz już: wydajność (overlay, worker, mgła, GPU, panel testu), miasto (plony,
auto), rdzeń rzek i stare fixy mapy. W trakcie: domknięcie ujść rzek (za chwilę
publish). Największe braki: C3 (porcjowana scena), pełne B1–B4 w bundlu (Super Huge
<60 s), zoom LOD — wszystkie trzy czekają na scalenie drzew gra/src ↔ srcKopiaMaster
i następny build z jednego źródła. Batch 5 i 6 świadomie nieruszone (bramkowane).

STATUS: aktualny na 03:15; po publishu integratora pozycja „rzeki-ujścia" → ✅.
