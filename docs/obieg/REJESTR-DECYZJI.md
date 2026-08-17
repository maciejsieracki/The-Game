# 🧾 REJESTR DECYZJI MACIEJA — zamknięta pętla

> **Po co ten plik:** każda odpowiedź Macieja (ABC) i każde jego zaproponowane rozwiązanie **musi** tu trafić — natychmiast, zanim agent zacznie cokolwiek robić. Dzięki temu nic nie ginie, a Master widzi, co jest wdrożone, a co leży.
> **Właściciel/nadzorca:** Master. **Wpisują:** grupy A–E + Integrator (aktualizacja statusu).
> Zasady → `docs/obieg/_ZASADY.md` §7 · Cała gra → `docs/ROADMAP.md`

---

## [2026-07-05 wieczór] BROADCAST — nazwy plików (Maciej)

| Plik | Rola |
|------|------|
| `gra-robocza/Gra-ROBOCZA.html` | Robocza — F publish, Maciej gra |
| `gra-kanon/Gra-KANON.html` | Kanon — Master promocja |
| `Gra-FINALNA.html` | Finalna — Master promocja (root) |

**Kod:** wyłącznie `gra/src/`. **Dokument:** [`BROADCAST-NAZWY-PLIKOW-2026-07-05.md`](BROADCAST-NAZWY-PLIKOW-2026-07-05.md)

---

## Cykl życia decyzji (status)

| Status | Znaczenie | Kto ustawia |
|---|---|---|
| 🟡 **ZAPISANA** | Agent zapisał decyzję Macieja (z cytatem) — pierwsza czynność po jego wiadomości | Grupa A–E |
| 🔵 **W TRAKCIE** | Grupa implementuje w swoim module | Grupa A–E |
| 🟠 **U INTEGRATORA** | Moduł gotowy, w `INTEGRATOR-kolejka.md` | Grupa → Integrator |
| 🟢 **WDROŻONA** | Jest w `Gra-podglad-ROBOCZA.html` (+ dowód: plik/funkcja/md5) | Integrator |
| ✅ **ZWERYFIKOWANA** | Master sprawdził w ROBOCZA. „Gotowe do playtestu" osobno. | **tylko Master** |
| ⚪ **ZMIENIONA/ODRZUCONA** | Maciej zmienił zdanie lub decyzja nieaktualna (z notką dlaczego) | Master |

**Dowód wdrożenia** = konkret: nazwa pliku + funkcja **lub** test **lub** md5 wersji ROBOCZA. Bez dowodu status nie może być 🟢.

---

## ID decyzji

- Z paczki ABC → użyj ID pytania: `B1-Q3`, `C4-Q2`, `D3-Q4`.
- Z luźnej propozycji Macieja (poza ABC) → `DEC-RRRRMMDD-NN` (np. `DEC-20260628-01`).

---

## 📋 DECYZJE OTWARTE (nie 🟢/✅ — to pilnuje Master)

| ID | Data | Decyzja Macieja (skrót) | Grupa | Status | Dowód / gdzie | Notatki |
|---|---|---|---|---|---|---|
| **P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1** | 2026-08-17 | **C** — po odkryciu technologii awansu do Brązu modal pełnej karty technologii; bez anulowania tury/badań; nie popup miast-państw | B+E+F | 🔵 **W TRAKCIE** | `techDiscoveryNotice.ts` · `main.ts` · tsc + tech-tree 19/19 + research 33/33 + defer 7/7 | live build PASS, Chromium zablokowany brak executable; bez Designera/Civpedii/Wikipedii |
| **AI-BALANS-STEP6-Q1** | 2026-08-06 | **A** — kara score 2. zwiadowca −80 pkt w `chooseCityProduction` | D | 🟡 **ZAPISANA** | `docs/decyzje/AI-BALANS-STEP6-Q1.md` | czeka `działaj` · paczka ABC 2026-08-06 |
| **P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1** | 2026-08-17 | **B** — gracz, AI i miasta-państwa kupują jednostki wyłącznie za Skarbiec/Pieniądze; brak jednostek w kolejce Pracy budynków | B+D+F | **GOTOWE — Evaluator PASS-WITH-NOTES** | `docs/decyzje/P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1.md` · ECHO `bc200aee` · implementacja `914ce8da` · test `rekrutacja-skarbiec-only-test.cjs` **13/13** | pre-existing dług osobno: `unit-stock-cost-test.cjs` **41/58**, `ai-recruit-upkeep-gate-test.cjs` **18/27**; bez push/merge/deploy |
| **R-KAMIEN-RELIEF-FOLLOWUP-Q1** | 2026-08-06 | **A** + reguła — `kopalnia` legacy + wszystkie kopalnie teraz i przyszłe zachowują relief | A+F | 🟡 **ZAPISANA** | `docs/decyzje/R-KAMIEN-RELIEF-FOLLOWUP-Q1.md` | czeka `działaj` |
| **MAP-UX-CLUSTER-LABEL-Q1** | 2026-08-06 | **B+C** — stolica: nazwa cywilizacji + korona/obwódka; MP: nazwa + dopisek | A+E | 🟡 **ZAPISANA** | `docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md` | czeka `działaj` |
| **R-WIARYGODNOSC-S9-Q1** | 2026-08-06 | **A** — pełna paczka strojenia liczb §9 (JSON + testy) | D | 🟡 **ZAPISANA** | `docs/decyzje/R-WIARYGODNOSC-S9-Q1.md` | czeka `działaj` |
| **R-DESIGN-PANEL-MIASTA-V2-Q1** | 2026-08-06 | **C** — pilne zlecenie Design klatek v2; kod nie zamrożony | E+Design | 🟡 **ZAPISANA** | `docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md` | czeka `działaj` / Design |
| **R-OBRONA-MIASTA-MP-Q1** | 2026-08-06 | **A** — mechanika bez zmian; rozbicie bonusów w preBattle | C+E | 🟡 **ZAPISANA** | `docs/decyzje/R-OBRONA-MIASTA-MP.md` §ECHO | czeka `działaj` |
| **P-AI-BRAK-POJECIA-MGLY-Q1** | 2026-08-17 | **A+C** — własna mgła AI per owner; pamięć ostatniej pozycji; atak/akcja tylko po ponownym wykryciu | D | 🟡 **ZAPISANA** | `docs/decyzje/P-AI-BRAK-POJECIA-MGLY-Q1.md` §ECHO | kontrakt widoczności i pamięci zapisany; implementacja w toku |
| **MAP-SPAWN-Q2** | 2026-08-01 | **B** — quota proporcjonalna (largest remainder) + cap 1 typ na małą masę; preferencja hexów rozwoju; Pangea = wszystkie typy OK | A | 🟠 **U INTEGRATORA** | `allocateTypyToMasses` · `developmentSpaceScore` · `clusters.ts` · `cluster-start-test.cjs` | Maciej: „wdrażaj" · gotowe do batch F |
| **HANDEL-SPLIT-Q1** | 2026-07-29 | **B** — dwa traktaty: `umowa_szlakow` + `umowa_wymiany` | D+E | ✅ **ZDEPLOYOWANA** | FALA 80 `7d266143` · ROBOCZA `772bab7c` · `HANDEL-SPLIT-Q1.md` | Maciej: „b” · closes 2026-08-06 |
| **C-UNIT-CARD-Q2** | 2026-07-27 | **A** — max HP efektywne na karcie + pasek | E | 🔵 **W TRAKCIE** | j.w. | |
| **C-UNIT-CARD-Q3** | 2026-07-27 | **A** — osobny wiersz Pancerz efektywny (parytet AI) | E | 🔵 **W TRAKCIE** | j.w. | |
| **C-OBCE-JEDN-Q2** | 2026-07-27 | **TW** — medalion właściciela (lewo) + koszary/kuźnia przy gwiazdkach (brąz/srebro/złoto) | C | 🟢 **WDROŻONA** | FALA 43 `33c49486` · `unitOwnerMedallion.ts` · `unitPathFlankBadges.ts` |
| **C-UPGRADE-TRIGGER** | 2026-07-27 | **A** — bonus Kuźnia/Koszary przy **wejściu/przejściu** przez heks własnego miasta + toast graczowi (nie koniec tury) | C+F | 🟢 **WDROŻONA** | FALA 44 `95021308` · `unit-building-bonuses.ts` · `main.ts` · test 82/82 · `docs/decyzje/C-UPGRADE-TRIGGER.md` |
| **C-WIAR-N4-AI** | 2026-07-27 | **B** — AI rzadko odmawia pomocy sojuszniczej gdy osłabione; N4 −15 | D | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `alliance-war-obligation.ts` 14/14 |
| **C-WIAR-D4** | 2026-07-27 | **A** — Dźwignia 4: start Zaufania + `round(W/20)` per strona (dzielnik 20) | D | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `diplomacy-credibility.ts` · wiarygodnosc-test |
| **C-WIAR-N1-UX** | 2026-07-27 | **A** — modal 3 opcje: wypowiedz / atak bez ostrzeżenia / anuluj + podgląd kar | D+E | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `showWarConsentModal` |
| **WIAR-NAP-IMP** | 2026-08-05 | §9.1 — NAP **terminowy (10–20 tur)** lub **bezterminowy** przy zawieraniu | D | 🟢 **WDROŻONA** | `resolveNapDealExpiry` · `diplomacy-proposals.ts` · `diplomacyTradeBasket.ts` · `diplomacyNegotiationModal.ts` · `WIAR-NAP-IMP.md` · diplomacy-proposal-test §3b | bez deployu |
| **P-AI-006** | 2026-07-27 | **C** — ekspansywność per nacja + rozszerzenie w `ai-expansion.ts` | D | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `civ-ai.json` · `ai-war-gate-test` |
| **P-AI-007** | 2026-07-27 | **A** — priorytety Panel D na archetyp + Biblioteka/Akademia | D | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `ai-production-priorities.ts` |
| **P-AI-008** | 2026-07-27 | **C** — zasięg zagrożenia 7 hex + Mury tylko gdy #1 Mocy | D | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `ai-threat-mode.ts` |
| **R-MAPGEN-KOLEJNOSC-Q1** | 2026-07-27 | **B** — jeden moment lasu w pipeline (bez pośredniego w classifyTerrain) | A | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `generator.ts` |
| **R-MAPGEN-KOLEJNOSC-Q2** | 2026-07-27 | **C** — ~15% górzystości lądu (tier Średni relief) | A | 🔵 **KOD OK** | kod w `gra/src` · ⏸ deploy FALA 37 |
| **R-MAPGEN-KOLEJNOSC-Q3** | 2026-07-27 | **A** — wszystkie przebiegi floor reliefu; próg czasu testu 7 s | A | 🔵 **KOD OK** | kod w `gra/src` · ⏸ deploy FALA 37 |
| **C-TEREN-IMPL-1** | 2026-07-27 | **A** — jeden deploy etapów 1–3 terenu bitwy | C | 🟢 **WDROŻONA** | FALA 36 `a74c3797` |
| **C-TEREN-IMPL-2** | 2026-07-27 | **C** — obrona Gór +75% z JSON; koszt piechoty 2 | C | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `terrain-combat.json` |
| **C-TEREN-IMPL-3** | 2026-07-27 | **B** — pełny wiersz TEREN w tooltipie jednostki | C+E | 🟢 **WDROŻONA** | FALA 36 `a74c3797` · `battleTerrainTooltip.ts` |
| **R-BITWA-POWTORKA-I** | 2026-07-27 | **B** — po powtórce auto-grupa po typie (Konnica/Piechota/Łucznicy) | C | 🔵 **KOD OK** | `battleScene.ts` · ⏸ deploy FALA 37 (F36=stary snapshot) |
| **C-ARMY-HUNGER-Q1** | 2026-07-27 | **A** — pełny parytet suwak+głód armii (gracz i AI) | C | 🟢 **WDROŻONA** | `glod-wojska-karencja-test.cjs` 39/39 |
| **C-STRATY-HP-Q1** | 2026-07-27 | wyjaśnienie — nadreprezentacja siły AI; bez fixu | C | ZAMKNIĘTE | `C-STRATY-HP-Q1.md` |
| **PYTANIE-20** | 2026-07-27 | **A** — Targowisko: efekt w Pieniądz, bez martwego mnożnika | B | ZAMKNIĘTE | `PYTANIE-20.md` · `buildings.json` |
| **PYTANIE-84** | 2026-07-27 | **hybryda** — dostęp natychmiast / magazyn państwa dla surowców | B | 🟡 **ZAPISANA** | `PYTANIE-84.md` — czeka `działaj` |
| **P84-SPICHLERZ-2026-07-27** | 2026-07-27 | U-12: Zdrowie **i** % wzrostu równolegle (+5/+10 Zdrowia + +1/+2% wzrost). U-25B: koszt racji ×0,75 / ×0,50 (nie ½ żywności) | — | 🔵 **W TRAKCIE** | `building-resource-gate.ts` · `population-growth-v85.ts` · test 20/20 |
| **P84-R7C-GARN** | 2026-07-27 | Garncarnia: nadwyżka Ceramiki → +Zadowolenie (+1/szt.) zamiast +Zdrowie | — | 🔵 **W TRAKCIE** | `turn-economy.ts` · `main.ts` · `cityPanel.ts` |
| **B-PALAC-TIER** | 2026-07-24 | Pałac 3 tiery: I=drewno, II=drewno+kamień, III=drewno+kamień+cegła; bonus +50%/tier (×1,5) | B | 🟢 **WDROŻONA** | `buildings.json` · `cityHasPalacLine()` · robocza md5 `a85e7d3f…` | upgradeFrom łańcuch |
| **B-RESEARCH-COST-MODEL** | 2026-07-24 | JSON pochłania dawniejszy global ×2; `GLOBAL_RESEARCH_COST_MULT=1`; Obróbka drewna/Murarstwo JSON=5 → 5/10/20 PN wg tempa | B | 🟢 **WDROŻONA** | `tech.json` · `difficulty-cost.ts` · robocza md5 `c77d2bc9…` | dyplomacja: JSON×tempo only |
| **B-MP-Q1** | 2026-07-27 | **Q1a=B** % maxHP/turę (25/20/15) · **Q1b=A** częściowe leczenie · **Q1c** brak uzupełnienia w oblężonym mieście | B | 🟢 **WDROŻONA** | `manpower.ts` `tickManpowerUnitReplenishment` · `miasto-params.json` · `manpower-test.cjs` 62/62 · robocza md5 `f694dcba` (FALA 31) | garnizon przed polem — osobny temat |
| **B-LAW-Q1** | 2026-07-27 | Po podboju: **Prawo 100%** przez **5 tur** (świeży podbój) lub **10 tur** (odbicie po buncie); po czasie normalne mechaniki | B | 🟢 **WDROŻONA** | `post-capture-law.ts` · deploy FALA 33 `2c3804da` | Maciej: społeczeństwo pamięta podbój/odbicie |
| **C-MAP-Q3** | 2026-07-27 | **Q3a=B** pustynia środkowa 50/50 z równiną · **Q3b=B** polar 5%+5% → `polarny` · **Q3c=C** Ziemia bez Antarktydy, bufor oceanu N/S | A | 🟢 **WDROŻONA** | deploy FALA 33 `2c3804da` · `climate-band-test.cjs` | teren: `TerenBazowy.Polarny` = `'polarny'` · Nowa gra po deploy |
| **B-TECH-EARLY-COST** | 2026-07-24 | Koszt bazowy nauki **5 PN** dla **Obróbka drewna** i **Murarstwo** — szybszy dostęp do tartaku/kamieniołomu | B | 🟢 **WDROŻONA** (część B-RESEARCH-COST-MODEL) | `tech.json` koszt=5 | efektywnie 5/10/20 @ tempo |
| **E-START-CS-Q1** | 2026-07-21 | **C** — wybór stolicy gracza zostaje; państwa-miasta pakowane wokół FAKTYCZNEGO hexu gracza + backfill przy odrzuceniu; pre-plan mapgen = podgląd | E+F | 🟢 **WDROŻONA** | robocza md5 `35a07a49…` · `main.ts` spawnPendingSameTypeRivals · cluster-start-test | Maciej: „sprawdźmy C, jak nie zadziała → A" |
| **EKO-TECH-P1** | 2026-07-04 | Paczka 1/3 (patrz doc) | B+MASTER | 🟢 WDROŻONA | kanon md5 `afd8770d…` · test 9/9 | playtest Maciej |
| **EKO-TECH-P2** | 2026-07-04 | Paczka 2/3 ABC-10/11/14 = **A** | B+MAPA | 🟢 WDROŻONA | robocza md5 `395f12c3…` · test 9/9 | 2026-07-05 rebuild |
| **EKO-TECH-P3** | 2026-07-04 | Paczka 3/5 ABC-12/13/15 | B+EKONOMIA+F | 🟢 WDROŻONA | robocza md5 `395f12c3…` · test 10/10 | kanon czeka Opus |
| **EKO-TECH-P4** | 2026-07-05 | Paczka 4/5 ABC-16/17/18 = **A** | B+MAPA+EKONOMIA | 🟢 WDROŻONA | robocza md5 `395f12c3…` · food 26/26 | kanon czeka Opus |
| **EKO-TECH-P5** | 2026-07-05 | Paczka 5/5 **ABC-19 = A** | B+UI+EKONOMIA | 🟢 WDROŻONA | robocza md5 `395f12c3…` · test 11/11 | kanon czeka Opus |
| **UPGRADE-P1/P2/P3** | 2026-07-05 | Paczki 1–3 upgrade (UPG-LOC/UI/PROD/BONUS + ABC-20…24) | CYW+EK+UI | 🟢 WDROŻONA | robocza md5 **`eac24a66…`** · test **28/28** · handoff `EKONOMIA-do-MASTER_upgrade-2026-07-05.md` | playtest Maciej · commit GitHub czeka |
| **B2-D16** | 2026-07-01 | **A** — łagodny start (pakiet D16-A) | B+F | ✅ ZWERYFIKOWANA | kanon md5 `7edba9ca…` · society 21/21 | playtest Maciej |
| **B2-D17** | 2026-07-01 | **A** — cityHasWaterAccess | B+F | ✅ ZWERYFIKOWANA | wire 34/34 · `turn-economy.ts` | playtest Maciej |
| **B2-D18** | 2026-07-02 | **Paczka A** (formularz ABC) | B+F | 🟢 WDROŻONA | md5 `01490681…` · test 26+28+51 | playtest PT-Z05 **po kanonie** |
| **P7-G3-B** | 2026-06-30 | **B** — karta Prezent (akcja 13, Rel≥30) | D+MASTER | 🟢 WDROŻONA | md5 `01490681…` · diplo 143/143 | playtest **po kanonie** |
| **MACIEJ-ROLA-MIN** | 2026-06-26 | Przy minimalnym nakładzie: tylko **kierunek gameplay (ABC)** + **test finalnej wersji**; reszta = Master/grupy/Slack | Master | 🟡 ZAPISANA | `docs/obieg/MACIEJ-ROLA-MINIMAL.md` | Maciej nie odpala `start`, nie czyta Slack |
| **OBOWIAZ-PT** | 2026-07-02 | **Playtest tylko na prośbę Mastera** po F + weryfikacji + kanonie; grupy/F **ZAKAZ** prosić | A–F+Master | 🟢 WDROŻONA | `OBOWIAZ-PLAYTEST-GATE.md` · trigger **`obowiaż`** | Decyzja Macieja |
| **OBOWIAZ-ZAKRES** | 2026-07-02 | **Raport do Macieja = tylko własny lane** (ABC · wdrożenie · przekaz Master); **ZAKAZ** raportu całej gry | A–E | 🟢 WDROŻONA | `OBOWIAZ-ZAKRES-RAPORTU.md` · trigger **`zakres`** | Decyzja Macieja |
| **PLAYTEST-V1-BRAMA** | 2026-07-02 | Playtest dopiero ~100% gry · rejestr §1–§4 | Maciej+Master | 🟢 WDROŻONA | `REJESTR-PLAYTESTOW.md` | §0 ZAMKNIĘTA |
| **PLAYTEST-CISZA** | 2026-07-02 | Lane **zero** playtest w czacie · wpis REJESTR §2 | A–F | 🟢 WDROŻONA | `OBOWIAZ-PLAYTEST-REJESTR.md` | trigger **`rejestr`** |
| **PLAYTEST-MASTER-ONLY** | 2026-07-02 | **Informowanie o playtestach (w tym zaległych) = wyłącznie Master** | Master | 🟢 WDROŻONA | `REJESTR-PLAYTESTOW.md` · `komendy-raport.mdc` §4 | lane **ZAKAZ** |
| **MASTER-PT-01** | 2026-07-02 | **C** — otwarcie §0 playtestu dopiero po pełnej checklistie v1.0 (~60 pkt) | Master | 🟢 WDROŻONA | `REJESTR-PLAYTESTOW.md` §0 · cytat formularz ABC | Master informuje **tylko w hubie** |
| **D1-PLAYTEST-DRZWI** | 2026-07-05 | **A** — zawsze `gra-robocza/START.html`; kanon tylko po ogłoszeniu Mastera + md5 | Master | 🟢 WDROŻONA | `MACIEJ-PLAYTEST-JEDNO-DRZWI.md` · `START-GRA.html` | cytat: „D1A" |
| **D2-PIECZEC-HUD** | 2026-07-05 | **A** — overlay ROBOCZA/KANON + 8 znaków md5 w lewym dolnym rogu | Master+F | 🟢 WDROŻONA | `gra/tools/inject-build-stamp.ps1` · publish scripts | cytat: „D2A" |
| **D3-RETENCJA-KOPII** | 2026-07-05 | **A** — archiwum kanon 5 · `_backup` 3 · `.bak` 1/plik · kopia dzienna 7 dni | Master | 🟢 WDROŻONA | `gra/tools/cleanup-retention.ps1` | cytat: „D3A" |
| **OBOWIAZ-SCIEZKA** | 2026-07-05 | Kod **tylko `gra/src/`** · ZAKAZ snapshot src · broadcast A–F · trigger **`ścieżka`** | A–F+Master | 🟢 WDROŻONA | `OBOWIAZ-SCIEZKA-KODU.md` · `KOMUNIKAT-MACIEJ-SCIEZKA.md` | Maciej: potwierdzenie od każdej grupy |
| **B1-Q3-UI** | 2026-07-02 | **A** — zostaw obecne SVG gałęzie; model liniowy tylko w logice | B+UI | 🟢 WDROŻONA | `sciencePicker.ts` bez zmian layoutu · formularz ABC | backlog F/UI **zamknięty** |
| **C-BAL-Q1** | 2026-06-26 | Kolejność balansu Panel-C: **A → B → C** (macierz → Auto-walka → oblężenie) | C | 🔵 **W TRAKCIE** | `docs/decyzje/C-BAL-Q1-panel-c-kolejnosc.md` · handoff `MASTER-do-GRUPA-C_panel-c-balans-kolejnosc.md` | sesja 1 (P2a) aktywna · Maciej **Tak — wdrażaj** 2026-06-26 |
| **D-CUD2** | 2026-06-26 | **C** — utrzymanie wygasłego cudu = **50%** stawki (`floor/2`) | D+EKONOMIA | 🔵 **W TRAKCIE** | `docs/decyzje/D-CUD2-utrzymanie-wygasly.md` · handoff `MASTER-do-EKONOMIA_CUDA-G2-2026-07-04.md` | Maciej potwierdził 2026-07-04 w G1-ZAMK |
| **D-CUD-G1A** | 2026-07-04 | **Własny** — budowa cudu z **ulepszeń terenu** / hex w zasięgu; Praca/¤; nie kolejka miasta | SILNIK+UI+MAPA | 🟡 **ZAPISANA** | `docs/decyzje/D-CUD-G1A-G1D-ZAMK-2026-07-04.md` · handoff SILNIK | refaktor CUDA-G1 |
| **D-CUD-G1B** | 2026-07-04 | **B** — `wymagaTerenu` **twarda bramka** | SILNIK+MAPA | 🟡 **ZAPISANA** | j.w. | |
| **D-CUD-G1C** | 2026-07-04 | **A** — cud **R** = **100%** bonusów | EKONOMIA | 🟡 **ZAPISANA** | j.w. · faza 2 G2 | |
| **D-CUD-G1D** | 2026-07-04 | **A** — ×**3** wszystkie `bonusy.miasto` | EKONOMIA | 🟡 **ZAPISANA** | j.w. · faza 2 G2 | |
| **D-CUD-G1-ZAMK** | 2026-07-04 | Paczka cuda **domknięta**; G2 faza1=utrzymanie+absolut+turystyka | MASTER | 🟡 **ZAPISANA** | handoffy 2026-07-04 | ABC nr 5–30 → backlog |
| **ECHO-AKCJA** | 2026-06-26 | Po ABC: ECHO → **AskQuestion „wdrażam?"** → po **Tak** wdrożenie w tej samej sesji | A–E | 🟢 WDROŻONA | `.cursor/rules/decyzje-echo.mdc` §2–3 | Maciej **nie** pisze „start" — tylko klika |
| **ABC-FORMAT-5** | 2026-06-26 | Pytania: **Sytuacja → Dlaczego → Cel → Opcje A/B/C (pełne) → krótki Ask** — wszystkie grupy A–E + Master | A–E | 🟢 WDROŻONA | `.cursor/rules/abc-pelna-forma.mdc` · `SZABLON-PYTANIA-ABC.md` | Maciej: `format` gdy źle |
| **ABC-FORMAT-KANON** | 2026-06-26 | **Potwierdzenie Macieja:** opis sytuacyjny + **cel pytania** + pełne nazwy (bez skrótów) + każda opcja **Za/Przeciw** + **zawsze rekomendacja A/B/C** · Ask dopiero po pełnym tekście | A–E+Master | 🟢 WDROŻONA | `docs/decyzje/ABC-FORMAT-KANON-MACIEJ.md` · `abc-pelna-forma.mdc` | cytat Macieja w pliku kanonu |
| PANEL-EXEC | 2026-06-28 | Wykonanie paneli sterowania (Excel→eksport→gra) przez grupy | A,B,C,D,E | 🟡 W TOKU | dyspozycja w `docs/obieg/<grupa>.md` | **A = PANEL-2 komplet** (2026-07-02) · C ✅ · D hub OK |
| F-P1-01 | 2026-07-02 | Spec ataku wrogiego miasta z mapy · **Q1=A Q2=A** (Maciej) | A→C,F | 🟠 U INTEGRATORA | `docs/decyzje/F-P1-01-atak-miasta-z-mapy.md` | mur ✅ · bez muru: zdobycie+komunikat / preBattle · ruch=klik |
| PANEL-2-A | 2026-07-02 | Panel-A komplet + sync JSON→Excel (17 ulepszeń, 9 arkuszy, bez plantacja) | A | 🟢 HUB OK | `Panel-A.xlsx` · `export-a.py` · `test-panel-a-roundtrip.py` ✅ · dry-run 0 | Maciej kręci balans → **`eksportuj panel`** |
| PANEL-2-C | 2026-06-29 | Panel-C komplet (PANEL-AUDYT opcja A): 49 jedn., countery, teren, koszty, siege_ai JSON | C | 🟢 WDROŻONA | kanon md5 `de9b53e…` · KANON-BATCH-3 | 2026-07-02 |
| PANEL-2-D | 2026-06-30 | **Hub Panel-D OK** (Maciej) — struktura Excel+export; **balans ciągły później** przez „eksportuj panel" | D | 🟢 HUB OK | `Panel-D.xlsx` · `export-d.py` · `test-panel-d-roundtrip.py` ✅ | pierwszy pełny sync Excel→JSON (P0 ~76 zm.) **przy pierwszej sesji balansu**, nie blokuje akceptacji hubu |
| PANEL-MERGE | 2026-06-30 | **Jeden Excel/grupa (A–E)** — wchłonąć wszystkie stare panele; archiwum dopiero po weryfikacji 100%; workflow wyłącznie Panel-A…E + „eksportuj panel" | A,B,C,D,E,F | ✅ ZWERYFIKOWANA | 16 plików → `docs/archiwum/panele-legacy/` · DEPRECATED `gra/tools/export-*.py` | 2026-06-30 |
| PANEL-AUDYT | 2026-06-28 | "wszystkie grupy dorabiają panele do kompletu teraz" (Maciej, ABC opcja A) — po audycie subagenta (żaden panel nie spełnia DoD §6) | A,B,C,D,E | 🟡 ZAPISANA | sekcja „PANEL — UZUPEŁNIENIA (audyt)" w obiegu każdej grupy | **C ✅** · priorytet pozostałe: D największe braki; A/B/E drobne |
| MASTER-KOLEJKA | 2026-06-29 | "najpierw uporządkuj kanon — jedna aktualna wersja gry, potem reszta" (Maciej, ABC opcja A) | F→Master | 🟡 ZAPISANA | `INTEGRATOR-kolejka.md` § DEKLARACJA KANONU · `PANEL-MASTER.md` | Integrator deklaruje 1 aktualny md5 (kanon+ROBOCZA) + listę scalonych batchy; Master reconciliuje md5 w dokumentach, dopiero potem Opus/promocja |
| PANEL-P0-FIX | 2026-06-28 | "blokery paneli naprawia każda grupa u siebie" (Maciej, ABC opcja A) — po weryfikacji audytu przez Master | B,D,F | 🟢 WDROŻONA | B export-b OK · D export-d sync PASS · F E2 ~97% | sprint 2026-07-02 |
| ISO-1 | 2026-06-28 | "izolacja hybryda: własny podgląd /tmp; worktree dla dużych zmian" (A) | wszystkie | 🔵 W TRAKCIE | `.cursor/rules/zmiany-izolacja.mdc` | self-test przed handoffem |
| ISO-2 | 2026-06-28 | "3 warstwy zmian: izolowana/cross/duża" (A) | wszystkie | 🔵 W TRAKCIE | `.cursor/rules/zmiany-izolacja.mdc` | batch dla drobnych, kontrakt dla dużych |
| ISO-3 | 2026-06-28 | "Integrator prowadzi mapę połączeń i sprawdza handoffy" (A) | F | 🔵 W TRAKCIE | `docs/obieg/MAPA-POLACZEN.md` | świadomość couplingu |
| ISO-4 | 2026-06-28 | "bramka wizualna (render smoke) przed ROBOCZA" (A) | F | 🟡 ZAPISANA | zadanie w `INTEGRATOR-kolejka.md` | łapie regresje wizualne |
| ISO-5 | 2026-06-28 | "każdy czat ma WŁASNĄ wersję testową, sam testuje, dopiero potem zgłasza Integratorowi że może wpiąć" (cytat Macieja) | wszystkie | 🟢 WDROŻONA | `docs/obieg/WERSJE-TESTOWE.md` (zrewid. SIMP-1) | self-test → handoff z dowodem |
| SIMP-1 | 2026-06-28 | "uprość: grupa = lekki self-check testami przez agenta w czacie; pełny build+test wizualny = obowiązek Integratora zwykłymi komendami (bez skryptu); Maciej zero terminala" (A + pytanie o rolę) | wszystkie + F | 🟢 WDROŻONA | `.cursor/rules/zmiany-izolacja.mdc` + `WERSJE-TESTOWE.md`; skrypt `gra/tools/grupa-selftest.ps1` ISTNIEJE jako **opcjonalna wygoda** (grupa może go odpalić zamiast ręcznych komend) | Integrator właścicielem testu całości |
| B5-SPICH | 2026-06-29 | Spichlerz: bufor + zapasy + cap 100×Spichlerze + HUD `X/Y` | B+A+F | ✅ ZWERYFIKOWANA | kanon md5 `ad6112e0…` · empire-food 16/16 | Master promocja 2026-07-01 |
| **B5-SP** | 2026-07-01 | SP1–SP6: limit · overflow przepada · HUD mapy · panel bez 📦 | B+UI+F | ✅ ZWERYFIKOWANA | j.w. · `hud.ts` · `cityPanel.ts` | |
| AB-KOLEJNOSC | 2026-06-28 / **2026-06-29** | **P1 Panel-A → P2 FOOD-HODOWLA → P3 E2** (Maciej potwierdza) | A, B, F | 🟡 W TOKU | `A-mapa.md` · `MAPA.md` · `INTEGRATOR-kolejka.md` | Panel-A **TERAZ**; FOOD/E2 kod **CZEKA** |
| PANEL-E-FOOD | 2026-06-29 | **Panel-E (Grupa E) nie koliduje z FOOD-HODOWLA** — może iść równolegle | E, A, B | 🟡 ZAPISANA | `E-start.md` · `B-ekonomia.md` | AB-KOLEJNOSC dotyczy **Panel-A/B + kod FOOD**; Panel-E = osobny Excel (start/meta), bez blokady |
| E2-PARAMS | 2026-06-28 | gęstość świata (suwaki Mało/Dużo, kreator, generator) | A+E+F | ✅ ZWERYFIKOWANA | md5 `01490681…` · world-density **28/28** · Master bramka · Maciej **`działaj`** 2026-07-02 | |
| JEDN-KOSZT-v1 | 2026-06-29 | v1.0 jednostki = Civ-style (💰+ludność+tech); surowce w JSON tylko referencja | B+C | 🟢 WDROŻONA | `production.ts` | krok 1 roadmapy |
| JEDN-KOSZT-v2-gate | 2026-06-29 | v2.0 krok 2: produkcja jednostki wymaga **tech LUB dostępu do surowca** (bramka, bez pełnego odejmowania) | B+D+F | 🟡 ZAPISANA | `docs/decyzje/JEDN-KOSZT-roadmap-v1-v2.md` | po v1.0 grywalności |
| JEDN-KOSZT-v2-full | 2026-06-29 | v2.0 krok 3: koszty surowców (jedn.+budynki), produkcja surowców, magazynowanie | B+A+D+F | 🟡 ZAPISANA | j.w. | po kroku 2 |
| REMIND-SUROWCE-ULEPSZENIA-START | 2026-06-26 | **A** — złoże rezerwuje hex; brak ulepszenia gracza na złożu | A+B | 🟢 WDROŻONA | `improvement-build.ts` · kanon `de9b53e…` | w kanonie |
| UI-SPRINT-1 | 2026-06-26 | **Wstrzymanie** zmian UX / brand book w kodzie (bez A/B/C sprintu) | E+UI | ⚪ ODŁOŻONE | `MACIEJ-ABC-HUB-2026-06-26.md` | Warstwa 1 w docs; implementacja STOP |
| P-C2 | 2026-06-26 | **B** — pkt za bitwę = M pokonanego (P-C2-DEF A) | B+D+F | ✅ ZWERYFIKOWANA | kanon md5 `d5e0f62d…` · power 12/12 | Master promocja 2026-07-01 |
| P-ARMIA | 2026-06-26 | **B** — Armia w Mocy = suma M | B+D | 🟢 WDROŻONA | `unit-power.ts` · kanon `de9b53e…` | |
| D3-CONFIRM | 2026-06-26 | **A** — potwierdza pełny Wealth v1.0 (karta D3=A) | B+UI | 🟢 WDROŻONA | `wealth.ts` · `turn-economy.ts` WIRE3 · `cityPanel.ts` · `wire-ekonomia-test.cjs` | Maciej potwierdził 5a — nie minimalny tick |
| **P-C2-DEF** | 2026-07-01 | **A** — suma M_pole wroga przed walką; bez underdog | B+F | ✅ ZWERYFIKOWANA | `power-objective-test.cjs` 12/12 · kanon `d5e0f62d…` | |
| MACIEJ-ABC-2026-06-30 | 2026-06-30 | **D3 v1.1:** T1A · T2 dwa sojusze · T3A · T4B | D+EKO+UI+F | 🟢 WDROŻONA | `SILNIK-D-V11` · md5 `de9b53e4…` · treaties 9/9 · economy 6/6 · diplo 143/143 | playtest **PT-D3** otwarty |
| **D3-PROG-DIFF** | 2026-07-21 | Progi traktatów ±10 wg trudności; baza NAP 50 / handel 40 @ normal | D+F | 🟢 WDROŻONA | `diplomacy.ts` · `diplomacy-proposal-test.cjs` · `D3-PROG-DIFF-2026-07-21.md` | Maciej IMPLEMENT NOW |
| B1-tech-Q3 | 2026-06-26 | Posterunek = **Obróbka drewna AND Murarstwo** | B+A | 🟢 WDROŻONA | `improvement-tech.ts` | |
| A-R7-IMP | 2026-07-01 | **A** — wdrażaj B: łodzie tylko w terytorium (wybrzeże + morze) | A | ✅ ZWERYFIKOWANA | kanon md5 `ad6112e0…` | Master promocja 2026-07-01 |
| A5-S1 | 2026-07-01 | **A** — sign-off podglądu brązu v1.0 (D12) | A | ✅ ZWERYFIKOWANA | `A5-wyglad-miast-mapa.md` · Maciej sign-off | nie wymaga kodu |
| A5-S2 | 2026-07-01 | **A** — kamień: jeden wspólny styl dla wszystkich cyw v1.0 | A | 🟡 ZAPISANA | `stoneCity.ts` | per-cyw kamień → po v1.0 |
| **A5-Roblox-MURY** | 2026-07-02 | Mury Roblox: HEX ~70%, jednolita masa · materiały per cyw · Grecja niebiesko-biała | A+F | 🟢 WDROŻONA | md5 `01490681…` · ghost + miasta | playtest **po kanonie** |
| **P6-FIGMA** | 2026-07-02 | **Nie robimy** — pipeline Figma Warstwa 1 (00–02) | UI | ⚪ **ODRZUCONA** | cytat Maciej: „2 nie robimy" | **Nie cytować w kolejkach** · wygląd → brand book w kodzie |
| A-R7 | 2026-06-26 | Łodzie rybackie **tylko w terytorium miasta** | A | ✅ ZWERYFIKOWANA | kanon md5 `ad6112e0…` | |
| INK-Q1 | 2026-06-26 | Inkowie **bez Brązu** w kreatorze (Kamień + Żelazo) | D+E | ✅ ZWERYFIKOWANA | `civs.json` · kanon md5 `ad6112e0…` | |
| **B2-Q1-HANDEL** | 2026-07-07 | **B** — panel handlu: naprawa razem z B1 (duplikat surowców zakrywał suwaki Skarb/Nauka/Zamożność) | B | 🟢 **WDROŻONA** | `B2-panel-handlu.md` · fix via `B1-panel-surowce.md` · `cityPanel.ts` | Maciej: wdrożyć bez ABC, przejrzy w grze |
| **B-CITY-NAMES-IMPORT** | 2026-07-07 | Pipeline Excel→JSON nazw miast (bez ABC — implementacja autonomiczna) | B+D | 🟢 **WDROŻONA** | `import-city-names-from-xlsx.py` · `city-names-pool-test.cjs` | Maciej: „eksportuj nazwy miast" w czacie |
| **A3-P0-REDESIGN** | 2026-07-07 | Marsz **bez Shift**: ścieżka + markery tur; STOP przy przeszkodzie; przerwanie = nowy cel lub Stop na pasku | A→F | 🟢 **WDROŻONA** | `planned-march.ts` · robocza md5 `8fd0dbfc…` / `e2c5c711…` · test 11/11 | zastępuje A3-Q1 · spec: `A3-SPEC-WDROZENIA.md` |
| **A3-P0-2** | 2026-07-07 | **B** — marsz w save; po wczytaniu kontynuuje (`autoMarch` + `plannedMarches`) | A→F | 🟢 **WDROŻONA** | `docs/decyzje/A3-P0-2-save-marsz.md` · `save.ts` SAVE v2 | poddecyzja A3-P0-REDESIGN |
| **A3-P0-3** | 2026-07-07 | **A** — timing: cel planowany bez natychmiastowego ruchu; segment po end-turn lub przycisk Kontynuuj | A→F | 🟢 **WDROŻONA** | `docs/decyzje/A3-P0-3-timing-marszu.md` · `main.ts` | zamyka pytanie auto-kontynuacji |
| **E-WORKER-1** | 2026-07-07 | **A** — overlay robotników: wszystkie pola 👤 ze wszystkich miast gracza | E→F | 🟢 **WDROŻONA** | `workerFieldOverlay.ts` · robocza md5 `eead06d7…` | `docs/decyzje/E-map-worker-overlay-2026-07-07.md` |
| **D-DISPLAY-MIASTO** | 2026-07-07 | Dopisek `· miasto-państwo` dla państw klastra (nie imperium) | D | 🟢 **WDROŻONA** | `display-names.ts` · test 6/6 | `docs/decyzje/D-display-miasto-panstwo-2026-07-07.md` |
| **B-KOLORY-CYW** | 2026-07-07 | **B** — `kolorHex` per cywilizacja (mapa, jednostki, dyplomacja, HUD) | B→F | 🟢 **WDROŻONA** | `civ-visual.ts` · robocza md5 `ee4355af…` · test 54/54 | obwódki frakcji w `e2c5c711…` |
| **B-SPIC-Q1** | 2026-07-23 | **C** — Spichlerz II: cap 150 + bufor 70% + Zd/Sz lokalnie (wszystko naraz) | B | 🟡 **ZAPISANA** | `docs/decyzje/B-SPIC-2026-07-23.md` · `SUROWCE-KANON-2026-07-22.md` | **NIE** B-KULT-REL — korekta routingu |
| **C-AI-WOJNA-Q1** | 2026-07-26 | **A** — dyplomacja przed ruchem AI; wypowiedzenie w tej turze, atak od następnej (karencja N1) | D+F | 🟢 **WDROŻONA** | `ai.ts` · `main.ts` · `ai-war-gate-test.cjs` 11/11 | `docs/decyzje/C-AI-WOJNA-EKSPANSJA-2026-07-26.md` |
| **C-AI-EKSP-Q1** | 2026-07-26 | **A** — max 1 miasto/turę/cyw., gdy Praca+ludność i dobry hex (panel budowy, nie osadnik) | D+F | 🟢 **WDROŻONA** | `planCityFounding` · `foundCityAt` · ai-test T6/T7D | j.w. |
| **C-AI-EKSP-Q2** | 2026-07-26 | **A** — najpierw konsolidacja klastra (miasta-państwa), potem nowe miasta | D+F | 🟢 **WDROŻONA** | `clusterStateTargets` blokuje founding · T6d/T6f | j.w. |
| **C-AI-PAKIET-Q1** | 2026-07-26 | **C** — pełny pakiet: błędy + ekonomia + cel „być #1 w Mocy" | D+F | 🟢 **WDROŻONA** | `docs/decyzje/C-AI-ROZWOJ-PAKIET-2026-07-26.md` · ai-test 231/231 | bez zmiany bonusów liczbowych |
| **C-AI-PAKIET-Q2** | 2026-07-26 | **C** — eksploracja/agresja tylko przy wysokiej sklonnoscDoPodboju; spokojne = patrol | D+F | 🟢 **WDROŻONA** | `civAiProfile` · skip patrol 4e gdy ≥4 | z `civ-ai.json` |
| **C-AI-PAKIET-Q3** | 2026-07-26 | **C** — nie ruszać bonusów trudności w ai-params; tylko logika | D+F | 🟢 **WDROŻONA** | ai-params.json bez zmian | 0%/+10%/+25% zostaje |
| **C-AI-MOC-Q1** | 2026-07-26 | **B** — co 3 tury sprawdź Moc; nie #1 → miasta+ekonomia; sklonnoscDoPodboju≥4 → agresja | D+F | 🟢 **WDROŻONA** | `powerRank` · `chooseCityProduction` boost | power-ranking.ts |
| **C-AI-MOC-Q2** | 2026-07-26 | **A** — cel wojskowy: sąsiad ≤8 hex od terytorium, preferuj słabszego | D+F | 🟢 **WDROŻONA** | `isEnemyNearOwnTerritory` · `powerOfOwner` | |
| **C-AI-MOC-Q3** | 2026-07-26 | **A** — próg ulepszeń terenu AI zostaje 30 Pracy | D+F | 🟢 **WDROŻONA** | `AI_IMPROVEMENT_PRACA_SURPLUS=30` bez zmian | |
| **B-SPIC-Q2** | 2026-07-23 | **A** — bonus soli tylko miasto ze Spichlerzem II | B | 🟡 **ZAPISANA** | j.w. | |
| **B-SPIC-Q3** | 2026-07-23 | **A** — budynki lokalnie; surowce z aktywnego dostępu imperium | B | 🟡 **ZAPISANA** | j.w. | |
| **B-SPIC-Q4** | 2026-07-23 | **A** — upgrade Spichlerz II przez kolejkę produkcji | B | 🟡 **ZAPISANA** | j.w. · handoff `B-SPIC-do-INTEGRATOR_*` | |
| **B-SPIC-Q5** | 2026-07-23 | **B** — infrastruktura bez Sz/Zd; reszta z bonusami | B | 🟡 **ZAPISANA** | j.w. | |
| **B-KULT-REL-Q1** | 2026-07-22 | **A** — kultura poszerza terytorium (+0…+3 hex), nie hex-claim | B+F | 🔵 **W TRAKCIE** | `docs/decyzje/B-KULT-REL-2026-07-22.md` | ⚠️ hex-claim wdrożony **błędnie** (Q1C=Spichlerz) — revert |
| **B-KULT-REL-Q2** | 2026-07-22 | **A** — stopniowa konwersja religii po podboju; wire `convertViaTemple()` | B | 🔵 **W TRAKCIE** | j.w. | ✅ conquest-stability |
| **B-KULT-REL-Q3** | 2026-07-22 | **A** — wpiąć `cityTradeMultiplier()` (Waluta+Mennica + dominująca wiara) | B | 🔵 **W TRAKCIE** | j.w. | `turn-economy.ts` |
| **B-KULT-REL-Q4** | 2026-07-22 | **C** — kultura+religia → **Power**; bez zwycięstwa kulturowego v1 | B | 🔵 **W TRAKCIE** | j.w. | ⚠️ victory kultura wdrożone **błędnie** (Q4A=Spichlerz) — revert |
| **B-KULT-REL-Q5** | 2026-07-22 | **A** — podwoić bonusy/kary szczęścia kultura/religia w `society-params.json` | B | 🔵 **W TRAKCIE** | j.w. | ✅ society-params |
| **KULT-BUD-01** | 2026-07-23 | Balans budynków kulturalnych: plon + konwersja (Pałac, Bib, Stela, Garncarnia, Sąd, Łaźnia) | B | 🔵 **W TRAKCIE** | `docs/decyzje/B-KULT-REL-2026-07-22.md` §KULT-BUD-01 | buildings.json + society-params + culture-religion.ts |
| **KULT-BUD-02** | 2026-07-23 | Balans budynków religijnych: kręgi +2%/t, świątynia +4%/t (additive do bazy) | B | 🔵 **W TRAKCIE** | `docs/decyzje/B-KULT-REL-2026-07-22.md` §KULT-BUD-02 | society-params + culture-religion.ts FALLBACK |
| **KULT-PRESJA-01** | 2026-07-23 | **A** — siła kultury = suma skumulowanej kultury imperium (licznik HUD) | B | 🟡 **ZAPISANA** | `docs/decyzje/B-KULT-PRESJA-2026-07-23.md` | presja kultury paczka 1/2 |
| **KULT-PRESJA-02** | 2026-07-23 | **A** — zasięg presji = zasięg okolicy miasta (+ pierścienie 100/250/500) | B | 🟡 **ZAPISANA** | j.w. | reuse `citySightRadius` / okolica |
| **KULT-PRESJA-03** | 2026-07-23 | **Custom** — tempo presji: easy **7%** · normal **5%** · hard **3%** /turę | B | 🟡 **ZAPISANA** | j.w. · `society-params.json` `kultura_presja_proc_tura` | handoff Integrator · czeka `działaj` |
| **KULT-PRESJA-04** | 2026-07-23 | **A** — religia lustrzanie jak kultura (siła imperium · zasięg okolicy · tempo 7/5/3%) | B | 🟡 **ZAPISANA** | j.w. · `society-params.json` `religia_presja_proc_tura` | paczka 2/2 · cytat: „KULT-PRESJA-04 a" |
| **KULT-PRESJA-05** | 2026-07-23 | **A** — po podboju zachować aktualny % kultury/religii z presji | B | 🟡 **ZAPISANA** | j.w. · `conquest-stability.ts` (plan) | pre-konquest mix → capture |
| **KULT-PRESJA-06** | 2026-07-23 | **A** — symetria: wróg może obniżać nasz % u granicy (7/5/3%) | B | 🟡 **ZAPISANA** | j.w. | push+pull obustronnie kultura+religia |
| **KULT-04** | 2026-07-23 | **A** — kultura + religia jako składniki **Power** (`power-objective`); bez victory kultura | B+F | 🟢 **WDROŻONA** | `power-objective.ts` · `power-params.json` · `main.ts` · ROBOCZA `98c4ede1` | KULT-04 A |
| **KULT-DYP-01** | 2026-07-23 | **A mod.** — dyplomacja: bonus +0,5/t **tylko** gdy wspólna wiara **I** okręg kulturowy; **bez** kar obca wiara/kultura | B+D+F | 🟡 **ZAPISANA** | j.w. §KULT-DYP-01 · handoff `B-KULT-DYP-do-INTEGRATOR.md` | `wspolnaReligia` AND `sameCultureCircle`; `odmiennaReligia=false` |
| **B-SUROW-BUD** | 2026-07-23 | Bramki dostępu surowców wg epoki: Kamień→drewno · Brąz→drewno+kamień · **Żelazo→drewno+kamień+cegła** · **Klasyczna→stal (budynki + jednostki)** · Magazyn bez limitu | B | 🟡 **ZAPISANA** | `docs/decyzje/B-SUROW-BUD-2026-07-23.md` · handoff `B-SUROW-BUD-do-INTEGRATOR.md` | zaktualizowano po B-SUROW-BUD-03 · czeka `działaj` |
| **B-SUROW-BUD-03** | 2026-07-23 | **REMOVE-DESKI** — surowiec deski wycofany; Stolarnia = bonus Pracy only; bramki bez desek; Galera→drewno | B | 🟡 **ZAPISANA** | j.w. §B-SUROW-BUD-03 · `SUROWCE-KANON` korekta #9 | supersede deski w B-SUROW-BUD-01/03/05 · czeka `działaj` |

---

## 🟢 WDROŻONE (Integrator — czeka Master ✅ / Opus)

| ID | Data | Decyzja Macieja (skrót) | Grupa | Status | Dowód / gdzie | Notatki |
|---|---|---|---|---|---|---|
| **R-MP-HARD-WAVE** | 2026-08-04 | **A/A/A** — Hard PM: więcej wojska, fala ≥3, sync DOW klastra | D | 🟢 **WDROŻONE (kod)** | `ai.ts` · `city-state-difficulty.ts` · `main.ts` · testy alliance+cluster | Q1–Q3 |
| **P-SCOUT-EXPLORE-Q2** | 2026-08-03 | **B** — Zwiedzaj = flaga only; ruch EOT (`runScoutsAutoExplore`) | E+F | 🟢 **WDROŻONA** | `main.ts` `scout-explore` · `scout-auto-explore-test.cjs` 15/15 | Q1=A |
| **R-AUTO-ULEPSZENIA-Q1** | 2026-08-03 | **C** — profile + checkbox tylko 👤 (domyślnie off) | B | 🟢 **WDROŻONA** | `auto-improvements.ts` · cityPanel · EOT | R-AUTO-ULEPSZENIA |
| **P-TRIUMPH-CS-Q1** | 2026-08-03 | **B** — dłuższy hint triumfu po zjednoczeniu ostatniego MP tej samej cyw. | D+E | 🟢 **WDROŻONA** | `triumph-city-state.ts` · `runCapitalCapturePlunder` · test 10/10 | R-TRIUMPH-CS |
| **P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1** | 2026-08-17 | **A** — zachować warunek ostatniego aktywnego miasta-państwa tego samego klucza kultury co gracz; wyświetlić ceremonialny popup z kulturą i nazwą ostatniego miasta, bez przejścia do epoki Brązu | D+E | 🔵 **W TRAKCIE** | ECHO `94a70850`; implementacja `triumph-city-state.ts` / `triumphCityStateNotice.ts` + testy `13/13`, `16/16`; commit `ae5ef14b` | bez epoki Brązu i innych podbojów |
| E1-Q-BUNDLE | 2026-06-29 | Jeden suwak jakości mapy → bundled GPU+dekoracje; las parity gameplay-safe | F+A+E | 🟢 WDROŻONA | ROBOCZA/kanon md5 `611613f4…` *(stary — aktualny kanon: `4602e752…`)* · `bundledMapQualityPreset` | czeka Opus + ISO-4 Maciej |
| F-CITY-HEX | 2026-06-29 | Hex pod miastem czysty; plony centrum w snapshotcie | F+B | 🟢 WDROŻONA | `city-hex-clear.ts` · md5 `611613f4…` *(stary — aktualny kanon: `4602e752…`)* | sign-off Maciej ✅ · ISO-4 founding na lesie ⬜ |
| PANEL-1…4 | 2026-06-28 | Standard paneli sterowania (zakres A–E, Excel=źródło prawdy, struktura, lokalizacja) | Master | 🟢 WDROŻONA | `docs/obieg/PANEL-STEROWANIA-SPEC.md` + `panele-sterowania/` | standard gotowy; wykonanie paneli = PANEL-EXEC (otwarte) |

---

## ✅ DECYZJE ZWERYFIKOWANE (zamknięte — archiwum bieżące)

> Skrót; pełny rejestr zamkniętych obszarów → `docs/ROADMAP.md` §ZAMKNIĘTE DECYZJE.

| ID | Decyzja | Grupa | Dowód | Data ✅ |
|---|---|---|---|---|
| E2-PARAMS | Gęstość świata (Mało/Dużo smoke) | A+E+F | kanon `01490681…` · bramka 28/28 · **`działaj`** | 2026-07-02 |
| B2-D18 | Balans start × trudność (PT-Z05) | B+F | kanon `2fc96381…` · playtest OK | 2026-07-02 |
| P7-G3-B | Prezent / dar (akcja 13) | D+MASTER | kanon `2fc96381…` · playtest OK | 2026-07-02 |
| A5-Roblox | Miasta + ghost założenia Roblox | A+F | kanon `2fc96381…` · playtest OK | 2026-07-02 |
| OBIEG-2026-06-30 | Obieg operacyjny: Master hub · Grupa F · review subagent · Slack MCP | Master | `OBIEG-AKCEPTACJA-2026-06-30.md` | 2026-06-30 |
| DWIE-WERSJE-2026-07-01 | Przywrócić ROBOCZA (F) vs finalna (`Gra-podglad.html` + `gra-kanon/`); Master: przekaż do F → weryfikacja → promocja | Master/F | `DWIE-WERSJE-GRY.md` · `MASTER-ZADANIA.md` | 2026-07-01 |
| IZOL-KATALOGI-2026-07-01 | Pełna izolacja: **`gra-robocza/`** (A–E+F) vs **`gra-kanon/`** (tylko Master); kopia dzienna przy start; promocja = kopia całego katalogu | Master/F | `PLAN-DWIE-WERSJE-IZOLACJA.md` · skrypty `publish-robocza-snapshot.ps1` · `publish-kanon-snapshot.ps1` · `backup-grywalna-dzien.ps1` | 2026-07-01 |
| MASTER-DYSPO-WYKON | **Dyspozycja → wykonanie:** krok 1 przyjmij · krok 2 zrób w tej samej turze | Master | `MASTER-ZADANIA.md` § kanon · `_ZASADY.md` §4.3 | 2026-07-01 |
| NAZ-1…4 | Ujednolicenie nazw grup (A–F): UI shell→E, AI→D, HUD→A, słownik + porządki | wszystkie | `NAZEWNICTWO-GRUP.md` + 19 plików `docs/czaty/` (grep czysty) | 2026-06-28 |
| D1–D15 | Karta decyzji (HUD 6B, Wealth, UX bitwy, panel armii, posiłki, Katapulta, drzewko, miasta BRĄZU, minimapa…) | różne | w kanonie | hist. |
| B2/B3/B4 | Szczęście/porządek/bunt, suwaki, model Wealth | B | w kanonie | hist. |
| C1/C2/C3 | Wejście w walkę, UX bitwy 3D, oblężenie z mapy | C/A | w kanonie | hist. |
| D-START | Miasta AI = kopie typu, klastry, nazwy | D | w kanonie | hist. |
| A1/A2/A4 | HUD 6B, jednostka na mapie, część ulepszeń | A | w kanonie | hist. |
| E1-EPOKA-PRZED-CYW | Kreator: epoka przed cywilizacją | E | kanon md5 `95bbcd3f…` *(stary — aktualny kanon: `4602e752…`)* | 2026-06-29 |
| E1-PACZKA-1-12 | ABC menu/kreator/logika startu (pyt. 1–12: reset A, tech B*, Ziemia A, rywale A, menu 5=C, kampania 6=A, wideo 7=A, złoża 8=B*, fog 9=B, zwycięstwo 10=A*, barbarzyńcy 11=C*, mockup 12=A) | E | `docs/grupa-e/decyzje/PACZKA-ABC-BLOKERY.md` · `E1-nowa-gra.md` | 2026-06-27 · **Maciej ✅ potwierdza zamknięcie** 2026-06-26 |
| JEDN-KOSZT-v1 | Jednostki v1.0 = Civ-style (💰+ludność); surowce → v2.0 | B | `production.ts` | 2026-06-29 |
| **C2-FLOW** | 2026-07-03 | Start walki **RĘCZNY**; AUTO później; ATK pierwszy / DEF wróg pierwszy | C (UNITS) | 🟠 DECYZJA | `docs/decyzje/C2-FLOW-manual-start-tura.md` · wdrożenie C2v2 | Maciej 2026-07-03 |

---

## Jak agent wypełnia (wzór wiersza)

```
| B1-Q3 | 2026-06-28 | "wybieram B — drzewko liniowe" | B | 🟢 WDROŻONA | `tech-tree.ts` · `tech.json` · test 19/19 | **B1-Q3-UI=A** — layout SVG bez zmian (2026-07-02) |
```

Po wdrożeniu ten sam wiersz przechodzi w górę statusów aż do ✅ (Master). **Nie kasuj wiersza** — zmieniasz tylko kolumnę Status + Dowód.

---
🔗 Historia: `docs/archiwum/` · Pełna treść decyzji: `docs/decyzje/<ID>.md`

| **R-STAWKI-STROJENIE** | 2026-08-03 | **×2** badań + upkeep jedn. + budowa budynków + żywność ludność/wojsko; bez cięcia produkcji | B | 🟢 **WDROŻONA** | FALA 205 `f41c6550` · `r-stawki-strojenie.ts` | |
| **R-AI-MP-WASAL-WCHLONIECIE** | 2026-08-03 | **Q1=A** · **Q2=A(Ł/N)+C(Hard)** · Q3 odłożone | D+F | 🟢 **WDROŻONA** | FALA 205 `f41c6550` · `ai-cs-absorption.ts` · main.ts | sojusze sióstr vs gracz |
| **R-AUTO-BUDOWA-LISTA-Q2** | 2026-08-03 | **A** — Lista: pomiń zablokowane i wróć później (v2) | B | 🟡 **ZAPISANA** | v2 Lista | R-AUTO-BUDOWA-LISTA |
| **R-AUTO-BUDOWA-LISTA-Q3** | 2026-08-03 | **A** — v1 = tylko Priorytet typów; Lista nazwana później | B | 🟢 **WDROŻONE (kod)** | cities.ts · auto-manage.ts · cityPanel · main.ts | R-AUTO-BUDOWA-LISTA |
| **R-AUTO-BUDOWA-LISTA-Q1** | 2026-08-03 | **A** doprec. | B | 🟡 **ZAPISANA** | — | |
| **R-KOLEJKA-FALA207-Q1** | 2026-08-03 | **B** (korekta) — FALA 207 = handel AI + Połącz + Design Badania | CLOUD | 🟡 **ZAPISANA** | `docs/decyzje/R-KOLEJKA-FALA207-DESIGN.md` | czeka hasło **deploy** |
| **R-DESIGN-BADANIA-Q1** | 2026-08-03 | **B** (korekta) — Design Badania razem z Klatką D (#46) | E+Design | 🟢 **WDROŻONA (kod)** | PR #44+#46 · `scienceHubHud.ts` · `techTreeView.ts` | deploy w FALA 207 |
| **R-KOLEJKA-NASTEPNY-Q1** | 2026-08-03 | **A+C** (korekta) — kolonizacja AI teraz + Design w FALA 207 | CLOUD | 🔵 **W TRAKCIE** | `docs/decyzje/R-AI-KOLONIZACJA.md` | kod gotowy, czeka deploy |
| **R-AI-KOLONIZACJA-Q1** | 2026-08-03 | **A** — pop źródła ≥5 (5→4); foundCityAt bez osadnika | D | 🟢 **WDROŻONA (kod)** | `ai.ts` · `city-founding.ts` | R-AI-KOLONIZACJA |
| **R-AI-KOLONIZACJA-Q2** | 2026-08-03 | **A** — max 1 miasto/turę + surge 2 gdy brak wolnych MP | D | 🟢 **WDROŻONA (kod)** | `ai.ts` · `main.ts` | R-AI-KOLONIZACJA |
| **R-AI-KOLONIZACJA-Q3** | 2026-08-03 | **B** — agresja epok 1–3; potem founding poza zasięgiem | D | 🟢 **WDROŻONA (kod)** | `ai.ts` | R-AI-KOLONIZACJA |
| **R-AI-KOLONIZACJA-DYSTANS** | 2026-08-03 | **4 hex** — min_dystans_miast + ekspansja_min_dystans_miast | D | 🟢 **WDROŻONA (kod)** | `miasto-params.json` · `ai-params.json` | gracz + AI |
| **R-DESIGN-PANEL-MIASTA-Q1** | 2026-08-04 | ~~**A**~~ → **B prototyp** — Maciej autoryzuje kod bez makiety Design | Design+E | 🟢 **WDROŻONA (kod)** | `cityMapStatChip.ts` | Q1 superseded 2026-08-04 |
| **R-DESIGN-PANEL-MIASTA-Q2** | 2026-08-04 | **C** — MUST + hover (produkcja + ostrzeżenie surowców) | Design+E | 🟢 **WDROŻONE (kod)** | j.w. · MUST + hover Q4=B | always-on + hover kod |
| **R-DESIGN-PANEL-MIASTA-Q3** | 2026-08-04 | **A** — kod od razu; deploy osobno (nie blokuje FALA 207) | CLOUD | 🟢 **WDROŻONA (kod)** | j.w. | deploy czeka Macieja |
| **R-DESIGN-PANEL-MIASTA-Q4** | 2026-08-06 | **B** — hover/v2 bez makiety Design | E | 🟢 **WDROŻONE (kod)** | `cityMapStatChip.ts` · hover | Q2=C domknięte |
| **SPICH-AUTO-Q1** | 2026-08-04 | **B** — EOT auto-obniża racje do bilansu=0; wojsko głoduje osobno; EOT bez blokady; event nast. tura **czerwony** (negatywny) | B | 🟢 **WDROŻONA** | FALA 212 `e38ad116` · `empire-food.ts` · `spich-auto-ration-notify.ts` | `docs/decyzje/SPICH-AUTO-Q1.md` |
| **REL-MP-SAME-Q1** | 2026-08-04 | Start MP własnego typu: Zaufanie **+20** (nie −20); nadpisuje D-START §49 dla gracz↔MP; **bez** globalnej zmiany AI↔AI | D+F | 🟢 **WDROŻONA** | FALA 212 `e38ad116` · `startRelationForPlayerSameCivCityState` · `spawnPendingSameTypeRivals` | `docs/decyzje/REL-MP-SAME-Q1.md` |
| **FORTIFY-MP0-Q1** | 2026-08-04 | **C** — Ufortyfikuj / garnizon **bez wymogu MP** (miasto i pole) | C+F | 🟢 **WDROŻONA (kod)** | `docs/decyzje/FORTIFY-MP0-Q1.md` · `unitFortifyActionDisabled` · `armyMerge.ts` | wejście nadal zeruje ruchLeft |
| **ODFORT-Q1** | 2026-08-04 | **A** — po odfortyfikowaniu jednostka na **heksie miasta** (widoczna); brak limitu stosu | C+F | 🟢 **WDROŻONA (kod)** | `docs/decyzje/ODFORT-Q1-Q2.md` · `exitGarnizon` | bez fallbacku na sąsiada |
| **ODFORT-Q2** | 2026-08-04 | Doprecyz. — wybór jednostki + **snapshot `ruchLeft`** przy odfort.; anti-exploit (0 MP → nie pełna pula) | C+F | 🟢 **WDROŻONA (kod)** | `fortifyRuchSnapshot` · `armyMerge.ts` · `garnizon-exit-test.cjs` | restore ze snapshota, nie maxRuch |
| **P-PRACA-BUDYNKI-ULEPSZENIA-SPLIT-50-Q1** | 2026-08-17 | **Korekta zakresu** — 50% dotyczy całej puli Pracy imperium; pozostałe minimum 50% pozostaje dla budynków; parytet gracz/AI | B+D | 🔵 **W TRAKCIE** | `splitEmpirePracaBudget()` · `main.ts` · `ai.ts` · test produkcyjny | nie zmienia starych decyzji R-AUTO-PRACA-BUDZET-PROCENT-Q1/Q3 ani R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1 |
| **P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1** | 2026-08-17 | **Niepełne wdrożenie/regresja** — helper splitu nie został podłączony do całego routingu puli Pracy; kontrakt: 100% pula, ulepszenia maks. 50%, reszta budynki, parytet gracz/AI | B+D | 🔵 **W TRAKCIE** | `docs/decyzje/P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1.md` · recon F292 `90b6508d` | osobny case; historia poprzednich ID zachowana; bez bundla/deployu |
| **P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1** | 2026-08-17 | **A** — bazowa produkcja terenu: Łąka 0/0/5, Równina 5/2/0, Wzgórza 5/5/5, Góry 0/10/0 (Drewno/Kamień/Glina); rzeka osobno | B | **GOTOWE — Evaluator PASS-WITH-NOTES** | `gra/data/terrain-yields.json` · `tileYield()` · test bazowy 9/9, magazyn 14/14, konwertery 46/46, warstwy 24/24, parytet 101/101 · commit `3ee0c52f` | bez WERSJE/bundli/deployu; poprzednie propozycje zachowane jako historia |
