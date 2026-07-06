> ⛔ NIEAKTUALNE OD 2026-07-06 — NIE STOSUJ TEGO PROCESU.
> Obowiązujący obieg: dyspozycje/START-TU.md → dyspozycje/OBIEG-KOMUNIKACJI-2026-07-06.md
> → dyspozycje/ROLE-I-ZAKRESY-2026-07-06.md. Kanał pracy: dyspozycje/_handoff/KANAL-PRACA.md.
> Wersje/md5 wyłącznie w dyspozycje/WERSJE.md. Roboczą publikuje tylko INTEGRATOR (Cowork);
> kanon/finalną tylko Grupa G (Cursor) z pakietu DO-KANONU. Zasada: TYLKO DO PRZODU (zero restore).
> Treść poniżej = HISTORIA (kontekst), nie instrukcja do wykonania.

# INTEGRATOR — STAN (≤12 linii)

**📢 Broadcast:** kod `gra/src/` · publish → `gra-robocza/Gra-ROBOCZA.html` · [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](../docs/obieg/BROADCAST-NAZWY-PLIKOW-2026-07-05.md)

**Aktywne:** **ZADANIE 2** — build łączony UI T4b (`1b169cfd`) + rzeki KROK 3
**Kanał:** `_handoff/KANAL-PRACA.md` wpis **[22:35] MASTER → INTEGRATOR**
**Trigger Macieja:** `start` 2026-07-05 ~22:35 · HOLD [04:20] zdjęty
**Merge:** `srcKopiaMaster/map/{gen-helpers,generator}.ts` → `gra/src/map/` (KROK 3 only)
**Bramka:** tsc=0 · weryfikacja-mapy małe+standard · stempel HOST-side verified
**Poprzedni bundle UI:** md5 skrót `1b169cfd` · stempel 22:08
**Maciej:** po meldunku Integratora → Ctrl+F5 START.html → playtest mapa+miasto
