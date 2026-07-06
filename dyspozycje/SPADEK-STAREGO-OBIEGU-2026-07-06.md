# SPADEK STAREGO OBIEGU → NOWY (2026-07-06)

Bannery „NIEAKTUALNE" na starych plikach (DZIENNIK-MASTERA, MASTER-PLAN, obieg Cursor/Grupy A–F)
dotyczą **procesu**, nie treści. Ta karta przenosi **DOROBEK** starego obiegu do nowego (Cowork:
MASTER + INTEGRATOR + UX). Decyzje projektowe i historia **nadal obowiązują** — nowe czaty nie
wymyślają ich od nowa. Źródło prawdy „na dziś" = `_handoff/KANAL-PRACA.md` (najświeższy stan) +
`REJESTR-DECYZJI` (prawo projektu). Mapa ról: `SCHEMAT-PRACY-COWORK-2026-07-05.md` §1.

## MAPA RÓL: stare → nowe (kto teraz robi to, co dawniej lane)
- **Grupa A (mapa/HUD)** → subagent MAPA (u INTEGRATORA). **B (ekonomia+MIASTO)** → EKONOMIA.
- **C/UNITS (walka)** → WALKA. **D (AI/dyplomacja)** → CYWILIZACJE. **E (meta/kreator)** → META-AI.
- **Grupa 0 / UI** → **UX** (tylko `src\ui\**`). **F / SILNIK + build/publish** → **INTEGRATOR** (jedyny publikujący).
- **MASTER** (dyspozycje+weryfikacja+kanon) bez zmian. **Cursor** → tylko promocje kanon→finalna (dziś: brak tokenów → wypadł).
- Skrzynki `*-DO-MASTERA.md` = historia lane; nowy kanał komunikacji to `_handoff/KANAL-PRACA.md`.

## 1. DECYZJE WIĄŻĄCE (prawo projektu — NIE wymyślać ponownie)
Pełny rejestr (statusy, dowody, md5): **`docs/obieg/REJESTR-DECYZJI.md`** (117 wierszy). Wybór stały:

| Temat | Decyzja (1 zdanie) | Źródło |
|---|---|---|
| Ekonomia rdzeń | Praca→Pieniądz (Waluta=×2); dostęp=boolean nie ilość; suwak dzieli Pracę | MEMORY: the-game / model-surowcow / praca-suwak |
| Koszt jednostek | ZAWSZE za skarbiec (Handel→Pieniądz) w każdej epoce, −1 ludność | MEMORY: jednostki-koszt · REJESTR JEDN-KOSZT-v1 |
| Awans budynków | 1 poziom/epokę; efekty+koszt+utrzymanie +10% składany (baza×1,10^(poz−1)) | MEMORY: building-upgrade-rule · REJESTR UPGRADE-P1/P2/P3 |
| Nauka (po scaleniu) | pula nauki + skarbiec = EKONOMIA/playerState; MIASTO wchłonięte w EKONOMIA | MEMORY: ekonomia-wchlonela-miasto |
| Zakładanie miasta | z mapy GLOBALNEJ w zasięgu terytorium lub po Strażnicy; okolica r10 | MEMORY: zakladanie-miasta |
| Zasięg miasta | dynamiczny: r5(<5) / r10(≥5) / r15(≥10 pop) | MEMORY: zasieg-dynamiczny |
| Epoki | 1Kamień 2Brąz 3Żelazo 4Klasyczna 5Średniowiecze…; v0.1 cap=3 | MEMORY: epoki-nazwy |
| Roster cyw | 9 TYPÓW głównych + klastry (10/typ); archetypy AI własne (D-ROSTER-Q7=A) | MEMORY: roster-typy · CYWILIZACJE-DO-MASTERA |
| Dyplomacja/AI | Respekt=potęga→ratio-share (armia28/bitwy20/ludn18/miasta14/gosp12/epoka8); D3 v1.1 T1A/T2/T3A/T4B | MEMORY: dyplomacja-ai · REJESTR MACIEJ-ABC-2026-06-30 |
| Walka/oblężenie | pkt bitwy=M pokonanego; mur per cyw + brama HP; posterunek+50%/fort+100%/miasto+200% | REJESTR P-C2/P-C2-DEF · MEMORY: oblezenie / bonusy-obronne |
| Start walki | RĘCZNY (auto później); ATK pierwszy / DEF wróg pierwszy | REJESTR C2-FLOW |
| EKO-TECH | Paczki 1–5 (ABC-10…19) WDROŻONE = A; dostęp przez ulepszenia+budynki | REJESTR EKO-TECH-P1..P5 |
| Cuda | budowa z ulepszeń terenu w zasięgu (Praca/¤, nie kolejka); R=100% bonusów, ×3 miasto; wygasły=50% utrzymania | REJESTR D-CUD-G1A..D, D-CUD2 |
| Format pytań | ABC pełny (Sytuacja→Cel→A/B/C Za/Przeciw→rekomendacja); **max 3/paczka**; nigdy popup | REJESTR ABC-FORMAT-KANON · MEMORY: pytania-bez-popupu |
| Playtest | tylko Maciej, dopiero ~100% gry; lane zero playtestu w czacie | REJESTR PLAYTEST-V1-BRAMA / PLAYTEST-CISZA |
| Wersje/pliki | Robocza(INTEGRATOR)→Kanon(MASTER, na hasło)→Finalna(Cursor); nigdy nie przeskakuj poziomu | SCHEMAT-PRACY §3 · REJESTR BROADCAST-NAZWY |
| ODRZUCONE | Figma-pipeline (P6-FIGMA) = nie robimy; wygląd → brand book w kodzie | REJESTR P6-FIGMA |

## 2. ODZIEDZICZONY BACKLOG (otwarte tematy — stan na koniec KANAL-PRACA 2026-07-06 ~12:00)

| Temat | Stan | Źródło | Właściciel (nowy) |
|---|---|---|---|
| **BUG-RZEKI-RENDER** — rzeki wizualnie nie wpływają do morza + za dużo odpływów | OTWARTE, priorytet; DANE OK (bezUjscia=0), rozjazd DANE↔RENDER | KANAL [11:25]+[11:45] | INTEGRATOR (fix wariant B „wodospad" + pomiar ujść) |
| **Regres UI** — emoji zamiast SVG (panel Ulepszenia terenu i in.); srcKopiaMaster starsze niż gra/src | OTWARTE — decyzja A/B (sync ui/ vs pisać od zera) | KANAL [11:55] | Maciej/MASTER decyzja → UX wykonuje sync |
| **Drzewo produkcyjne** — czy build z `srcKopiaMaster` czy `gra/src` (dehydratacja gra/src blokuje bash INTEGRATORA) | OTWARTE strukturalnie; dziś prod=srcKopiaMaster, ale gubi nowsze UI | KANAL [01:40]/[03:20]/[11:55] | decyzja Macieja |
| **Batch 5 / 6** (LOD terenu/dekoracji, AI+pathfinding na workerach) | ZAPARKOWANE do decyzji/pomiarów Macieja | MASTER-PLAN §BATCH5-6 · KANAL [02:05] | INTEGRATOR na „start" |
| **B3/B4 generator** (erozja wsadowa, aStar) — zmieniają hash mapy | ODŁOŻONE — czeka decyzji Macieja o nowym hashu wzorcowym | KANAL [09:40] · MASTER-PLAN BATCH2 | decyzja Macieja → INTEGRATOR |
| Promocja **kanon PAKIET #0** (rzeki+C3+B0.6+Test wydajności) | OTWARTY — czeka stempel+playtest, potem MASTER uzupełnia, Cursor promuje | `_handoff/DO-KANONU.md` | MASTER (+ Cursor gdy wróci) |
| P2 logika (podwójna szarża, wasalizacja, makeDealId, obozy barb. po load, ujemne zapasy, seed w save) | BLOCKED ABC — 6 pkt, bez kodu do decyzji | `BLEDY-DO-NAPRAWY-2026-07-05.md` §P2 | decyzja Macieja (ABC max 3/paczka) |
| UI blockery P0 (A-08 panel budowy, HEX-C1, Moc IMP-01 częśc., C23 bitwa, C12 koniec v3) | OTWARTE — brak mockupów Design / lane nie portował | `_handoff/UI-do-MASTER_blockery-otwarte-2026-07-05.md` | UX (po mockupach Design) |
| JEDN-KOSZT v2 (bramka tech/surowiec → pełne koszty surowców) | ZAPISANA — po v1.0 grywalności | REJESTR JEDN-KOSZT-v2-gate/full | EKONOMIA (później) |
| Miasta brązu per-cyw / kamień per-cyw | ZAPISANA — po v1.0 | MEMORY: miasta-braz-per-cyw · REJESTR A5-S2 | CYWILIZACJE/MAPA (później) |

Top 5 pilności: 1) BUG-RZEKI-RENDER · 2) Regres UI (decyzja A/B) · 3) Drzewo produkcyjne · 4) Promocja kanon #0 · 5) Batch 5/6 + B3/B4 (po decyzji).

## 3. MAPA HISTORII (co czytać przed pracą w domenie)

**INTEGRATOR (silnik/mapa/ekonomia/walka/build):**
- ZAWSZE najpierw: `_handoff/KANAL-PRACA.md` (cały) + `SCHEMAT-PRACY-COWORK-2026-07-05.md`.
- Mapa/wydajność: `DYSPOZYCJA-WYDAJNOSC-MAPA-2026-07-05.md`, `DESIGN-RZEKI-SIECI-DOPLYWOW-2026-07-05.md`, `BLEDY-DO-NAPRAWY-2026-07-05.md`, `MASTER-PLAN-GRYWALNOSC-SUPER-HUGE-2026-07-05.md`.
- Ekonomia/tech: skrzynka `EKONOMIA-DO-MASTERA.md` + handoffy `EKONOMIA-do-*` (EKO-TECH, upgrade).
- Walka/jednostki: `UNITS-DO-MASTERA.md`, `docs/obieg/C-walka.md`, handoffy `*preBattle*`, `*map-attack*`.
- Cywilizacje/AI: `CYWILIZACJE-DO-MASTERA.md` + `SILNIK-ROZDYSPONOWANIE-LANE-2026-06-29.md`.
- Build/dehydratacja: lekcje w KANAL-PRACA [00:30 KROK 0], [02:40], [03:20]; MEMORY: singlefile-build, sandbox-edit-dehydration, build-from-outputs.

**UX (interfejs):**
- `_handoff/ROLA-UX.md` (karta) + `KANAL-PRACA.md` + `UI-DO-MASTERA.md` + `UI-STAN.md` + `UI-INVENTORY-DESIGN-vs-GRA.md`.
- Mockupy/wklejki: `docs/ux/` (WKLEJKA-DESIGN-*, ODPOWIEDZ-DESIGN-*, claude-design) + handoffy `WYMIANA-UI-DESIGN*`, `BRIEF-UX_*`.
- Blockery i decyzje UI: `_handoff/UI-do-MASTER_blockery-otwarte-2026-07-05.md`; MEMORY: ux-lane-workflow (WYKONUJE nie audytuje).

**MASTER (dyspozycje/weryfikacja/kanon):**
- `REJESTR-DECYZJI.md` (prawo) + `KANAL-PRACA.md` (żywy stan) + `DZIENNIK-MASTERA.md` (historia przepływów, oznaczony NIEAKTUALNY procesowo — treść = kontekst).
- Wersje/promocje: `_handoff/DO-KANONU.md`, `WERSJE.md`, `SCHEMAT-PRACY §3`.
- Karta decyzji Macieja: `docs/master/maciej/MACIEJ-KARTA-DECYZJI.md` (+ MACIEJ-DECYZJE-*).

---
STATUS: żywy dokument; MASTER aktualizuje przy wchłanianiu tematów do kanału (KANAL-PRACA.md) — pozycja z §2 zamknięta = wykreśl lub oznacz ✅ z datą.
