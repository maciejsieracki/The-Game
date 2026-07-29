## [00:30] ✅ Gotowe — deploy ROBOCZA FALA 114 (c7f15cb3)

**FALA 114** | md5 `c7f15cb3f47c60dba04ec98c689daaee` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**Wyżywienie (panel miasta → Wyżywienie i wzrost):**
- Suwak **Wyżywienie** 0–6 co 0,5 — koszt żywności na mieszkańca = wartość suwaka.
- Tabela wzrostu: od −10% (0) do +7% (6); domyślnie 4 (≈ dawna racja środkowa).
- Stare zapisy: racje 1|2|3 migrują do 2|4|6 przy pierwszym wczytaniu.

**Poza Wyżywieniem:** palisada styl Biskupin w renderze miasta (epoka Kamień).

**Bramki:** tsc 0 · population-growth-v85 47/47 · population-growth-v85-bonus 20/20 · VERIFY OK · POLE-BITWY `dd399c4b`.

## [00:05] ✅ Gotowe — deploy ROBOCZA FALA 113 (9ae07906)

**FALA 113** | md5 `9ae07906dc7215050b3cde635d50a5ee` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**DEPLOY ALL sesji (dyplo + HUD + mapa + palisada):**
- Duplikat umów na stole dyplo · koszyk handlu UX · AI oferta zero + trim cykliczny · cooldown 3t po odrzuceniu (no-nag).
- Zoom −/100%/+ i pełny ekran pod minimapą · tooltipy HUD ×2 · skarbiec bilans (kwoty zamiast „—").
- Palisada epoka Kamień (Obróbka drewna) + chip +100% Obrony · rzeki `ensureRiverOutlets`.
- tsc 0 · dip-ai-offer 23/23 · reject-cooldown 14/14 · negot 48/48 · skarbiec 11/11 · koszty 128/128 · POLE-BITWY `dd399c4b`.
- map-gen dopływy: TIMEOUT w teście (>10 min) — do weryfikacji wizualnej rzek.
- Bez ikony palisady z preview (nie w brand).

## [23:13] ✅ Gotowe — deploy ROBOCZA FALA 112 (8d5813ea)

**FALA 112** | md5 `8d5813ea025a603d23e04cc923c65b94` | `gra-robocza/START.html` (Ctrl+F5, Nowa gra).

**DEPLOY ALL sesji (dyplo + UI + mapa):**
- Koszyk dyplo od razu na stół (handel/szlaki) · PW nazwy + fix NAP/traktaty PW · AI oferta: Easy vs Normal/Hard (zero/tolerancja).
- Tooltip HUD/toolbar ×2 · mapa: 👤 + granice + ⛏ domyślnie ON · surowce widoczne · glina nie chowa overlay.
- tsc 0 · dip-accept 142/142 · dip-ai-offer 18/18 · hex-plony 9/9 · qualify 94/94 · dip-treaties 12/12 · POLE-BITWY `dd399c4b`.
- Rzeki dopływy: nie w bundlu (bez zmian kodu rzek).
