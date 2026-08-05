# R-WIARYGODNOSC — przegląd Dźwigni 2–4 (kod vs spec) — 2026-08-05

**Decyzja:** WIAR-START=B — przegląd przed strumieniem D1.  
**Spec:** `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` §5, §5a.  
**Bez nowego ABC** — rekomendacje do akceptacji po powrocie Macieja.

## Tabela: spec vs kod dziś

| Dźwignia | Spec (obowiązujący) | Kod dziś (2026-08-05) | Gdzie | Ryzyko podwójnej kary |
|----------|---------------------|------------------------|-------|------------------------|
| **1 — W→Zaufanie (strumień / tempo)** | ΔZ/turę z W; WIAR-Q3=C: mnożnik tempa wzrost/spadek; REL-WIARYG-DRIFT: pasywny dryf | **✅ Wdrożone (R1)** | `computeTickZaufanieDelta`: dryf + `applyWiarygodnoscTempoDoDelty` (`diplomacy.ts`). Strumień S1–S4: `wiarygodnoscStrumienByOwner` w `main.ts` | **Średnie** — dryf + mnożnik tempa + dar/handel PN mogą nakładać się na ten sam ΔZ; jedna ścieżka integracji |
| **2 — sufit Zaufania od W** | **WYCOFANE** (R-WIARYGODNOSC-DZWIGNIA2-Q1=A, 2026-08-03) | **Brak** — flat `max_zaufanie_na_ture=5` (`diplomacyClampTrustGainNaTure`) | `diplomacy-value-catalog.ts`, `diplomacy-pn-engine.ts` | **Niskie** — świadomie usunięte; nie dublować przy D1 |
| **3 — twarde progi traktatów** | Sojusz W≥0, NAP W≥−40; przed progami Zaufania/Relacji; **§9.10=A:** druga twarda bramka = **NAP** (nie Wasal/Trybut) | **✅ Wdrożone** (D3, 2026-08-03) · **R3 ZAMKNIĘTE** (2026-08-05) | `evaluateProposal`: W-gate tylko `nap` / `sojusz_*`; `wasal` / `trybut_*` **bez** bramki W | **Niskie** — binarna bramka, nie sumuje się z karami N1–N7 |
| **4 — pierwszy kontakt** | Startowe Zaufanie pary z globalnej W obu stron | **✅ Wdrożone** (C-WIAR-D4=A) | `zaufaniePierwszyKontaktZD4`, `applyWiarygodnoscD4ToRelation` (`diplomacy-layers.ts`); wołane przy lazy init relacji w `main.ts` | **Średnie** — D4 modyfikuje **start** Zaufania; D1 dryf modyfikuje **co turę** — to zamierzone, ale suma efektów przy W=−60 może być ostra |

## Dźwignia 1 — szczegół (najważniejsza przed D1)

| Mechanizm | Spec | Kod | Status |
|-----------|------|-----|--------|
| Pasywny dryf ΔZ = W×0,03/turę | REL-WIARYG-DRIFT-Q1 | `zaufanieDryfOdWiarygodnosci` w `computeTickZaufanieDelta` | ✅ Wpięte |
| Mnożnik tempa wzrost/spadek ΔZ | WIAR-Q3=C | `applyWiarygodnoscTempoDoDelty` w `computeTickZaufanieDelta` + `applyDiplomaticEvent` | ✅ **WDROŻONE (R1 + R1b, 2026-08-05)** |
| Strumień S1–S4 (zobowiązania) | §3 | `wiarygodnoscStrumienByOwner`, `tickCredibilityStreamEntry` | ✅ W main.ts |
| Legacy W/20 strumień | Zastąpiony | `strumienWiarygodnoscDoZaufania` @deprecated | Nie używać |

## Ryzyka podwójnej kary / nakładania

1. **N1+N2 przy wojnie na sojusznika** — spec: suma −35 max; kod: `appendWiarygodnoscEvent` per typ — **OK jeśli** każdy hak woła osobno (weryfikacja przy pełnym D1).
2. **D4 start + D1 dryf** — nowy sąsiad z W=−60: start Zaufania −6 pkt (round(−60/20)×2) + dryf −1,8/turę — **zamierzone**. **UI rozbicie W (FALA 236):** audiencja pokazuje „życiorys · bieżące” + tooltip (`rozbicieWiarygodnosci`) — gracz widzi składowe reputacji (nie mylić z D4 start Zaufania, które jest per-relacja).
3. **D3 bramka + niska Zaufanie** — odmowa sojuszu z powodu W<0 **nie** nakłada kary N* — **OK**.
4. **Dźwignia 2** — nie reintrodukować bez nowej decyzji; dublowałaby D1.

## Rekomendacje (do akceptacji Macieja)

| # | Rekomendacja | Priorytet |
|---|--------------|-----------|
| R1 | **D1:** wpiąć `applyWiarygodnoscTempoDoDelty` w `tickDiplomacy` **albo** oficjalnie wycofać mnożnik — jedna ścieżka, nie oba dryf + mnożnik bez decyzji | ✅ **WDROŻONE** (2026-08-05, branch `cursor/fix-wiar-r1-tempo-63a1`) |
| R1b | **D1 one-shot:** ten sam mnożnik w `applyDiplomaticEvent` + `applyDiploEventTracked` | ✅ **WDROŻONE** (2026-08-05, branch `cursor/fix-wiar-tempo-oneshot-63a1`) |
| R2 | **D2:** utrzymać WYCOFANE — dokumentacja OK, kod czysty | Zamknięte |
| R3 | **D3:** §9.10=A — Wasal/Trybut **bez** bramki W; tylko NAP/Sojusz mają W-gate | ✅ **ZAMKNIĘTE** (2026-08-05) — **ZAKAZ** dodawać W-gate na `wasal`/`trybut_*` |
| R4 | **D4+D1:** harness scenariuszowy w `wiarygodnosc-test.cjs` (start D4 + N tur dryf×tempo) | ✅ **WDROŻONE** (harness, 2026-08-05, branch `cursor/fix-wiar-r3-r4-63a1`) |
| R5 | Test regresji: `node tools/wiarygodnosc-test.cjs` przed każdym batchiem WIAR | Obowiązkowe |

## R3 — potwierdzenie bramek Wasal/Trybut (ZAMKNIĘTE)

**Decyzja spec:** `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` §9.10 = **A** — druga twarda bramka Dźwigni 3 dotyczy **paktu o nieagresji**, nie Wasalizacji ani Trybutu.

**Kod (2026-08-05):** `evaluateProposal` sprawdza `proposerWiarygodnosc` wyłącznie w case `'nap'` i `'sojusz_defensywny'` / `'sojusz_pelny'`. Gałęzie `'wasal'`, `'trybut_zadanie'`, `'trybut_oferta'` używają progów Respektu/Relacji/Zaufania — **bez** `wiarygodnoscProgNapMin` / `wiarygodnoscProgSojuszMin`.

**Zamknięcie R3:** Wasal/Trybut pozostają **bez** bramki W. **ZAKAZ** dodawania W-gate na wasal/trybut bez nowego ABC.

## Powiązane decyzje

- `docs/decyzje/R-WIARYGODNOSC-DZWIGNIA2-USUNIECIE-2026-08-03.md`
- `docs/decyzje/R-WIARYGODNOSC-D3-PROGI-2026-08-03.md`
- `docs/decyzje/R-WIARYGODNOSC-ETAP0.md`
