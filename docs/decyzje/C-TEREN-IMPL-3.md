# C-TEREN-IMPL-3 — Widoczność modyfikatorów terenu w UI bitwy

**Status:** 🟢 **WDROŻONA** — FALA 36 `a74c3797` (2026-07-27)  
**Grupa:** C (walka / bitwa ręczna 3D) + E (UI tooltip)  
**Ekran:** [EKRAN: Bitwa ręczna 3D — tooltip heksa TEREN]

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — temat obsługujemy tutaj; **nie** publishuj `gra-robocza/` |
| **Kod `gra/src`** | ✅ **GOTOWY** — `battleTerrainTooltip.ts` · ETAP 4 test |
| **Deploy `gra-robocza`** | ✅ **FALA 36** `a74c3797` (commit `2632156`) |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Sytuacja

Efekty terenu w bitwie ręcznej działają w silniku: bonus obrony (np. +75% na Górach), zmiana zasięgu (Δ zasięg), blokada przejścia przez góry, koszt ruchu. Gracz **nie widzi** tych modyfikatorów w interfejsie — tooltip wiersza TEREN pokazuje informacje głównie dla **brodu** (koszt/ruch przez wodę). Weryfikacja R-TEREN-BITWA-WERYF wskazuje problem UX: mechanika „działa po cichu".

## Cel pytania

Ustalić, czy i w jaki sposób pokazać modyfikatory terenu w interfejsie bitwy ręcznej (tooltip, panel, inne).

## Dlaczego teraz

Deploy terenu (C-TEREN-IMPL-1) bez decyzji UI zostawia gracza bez informacji zwrotnej — trudniej ocenić, czy etapy 1–3 działają poprawnie. Spójność z brodem (już widocznym) sugeruje rozszerzenie tooltipa.

## Opcja A — Po cichu (tylko silnik)

Opis: Bez zmian w UI — modyfikatory terenu działają wyłącznie w obliczeniach silnika; gracz uczy się przez obserwację.

**Za:** Zero pracy UI · szybsze domknięcie deployu terenu · mniej tekstu na tooltipie · zgodne z wieloma grami 4X (teren „czuje się" przez gameplay).

**Przeciw:** Niespójne z brodem (brod już ma wiersz TEREN) · ukryty bonus +75% / −1 zasięg frustruje w nauce · R-TEREN-BITWA-WERYF explicite flaguje problem · trudniejszy playtest dla Mastera (brak widocznego potwierdzenia).

## Opcja B — Wiersz TEREN w tooltipie dla wszystkich efektów

Opis: Rozszerzyć istniejący wzorzec tooltipa TEREN (jak przy brodzie) o wszystkie aktywne modyfikatory: obrona %, Δ zasięg, koszt ruchu, blokada gór — per heks i per jednostka (jeśli dotyczy).

**Za:** Spójny wzorzec z brodem — jeden wiersz TEREN, wiele efektów · gracz widzi, dlaczego strzał nie dosięga lub obrona jest wysoka · ułatwia playtest i edukację · domyka R-TEREN-BITWA-WERYF.

**Przeciw:** Więcej pracy UI (Grupa C + E) · dłuższy tooltip na złożonych heksach · trzeba sformułować teksty po polsku z nazwanymi parametrami (Kultura/Obrażenia — tu: Obrona %, Zasięg hex).

## Opcja C — Tylko blokady i koszty ruchu w UI; obrona i zasięg po cichu

Opis: W tooltipie pokazać koszt ruchu i blokady (nieprzechodzialność); bonus obrony i Δ zasięg pozostają niewidoczne w UI.

**Za:** Szybsze niż pełne B — mniej przypadków w tooltipie · koszt ruchu i blokada są „mechaniczne" i łatwe do pokazania · obrona/zasięg odkrywane w walce.

**Przeciw:** Ukryty bonus +75% obrony i −1 zasięg — główne źródło frustracji w playteście · niespózność (brod pokazuje koszt, Góry nie pokazują obrony) · połowa problemu R-TEREN-BITWA-WERYF zostaje.

## Rekomendacja

**Litera:** B — spójny wzorzec z brodem i pełna informacja zwrotna; bez tego deploy terenu jest technicznie kompletny, ale produktowo nieczytelny.

## Odpowiedź Macieja

> **B** (2026-07-27) — wiersz TEREN w tooltipie dla wszystkich efektów (obrona %, Δ zasięg, koszt ruchu, blokada gór).  
> *Zapis w pliku przed wdrożeniem kodu — standard od 2026-07-27 (`ABC-ZAPIS-PLIKOWY.md`).*

## Wdrożenie

- `gra/src/battle/battleTerrainTooltip.ts` — `buildTerrainTerenTooltipParts()` (czysta logika, testowalna)
- `gra/src/battle/battleScene.ts` — `_unitTooltipHtml()` wpięty helper (jeden wiersz TEREN, efekty połączone „ · ")
- Test: `gra/tools/teren-walki-etapy-test.cjs` ETAP 4
- Warstwa: 🟡 (tooltip bitwy + silnik terenu)
- **Deploy:** FALA 36 `a74c3797` (commit `2632156`)
