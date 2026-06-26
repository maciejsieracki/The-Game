# 06 — Analiza: DYPLOMACJA / SPOŁECZEŃSTWO

*Wygenerowano autonomicznie: 2026-06-26 | Źródła: DYPLOMACJA-DO-MASTERA.md, Spoleczenstwo-parametry.xlsx, DZIENNIK-MASTERA.md*

---

## 1. Zakres lane'a

**DYPLOMACJA/SPOŁECZEŃSTWO** — relacje między nacjami, religie, systemy społeczne, tempo gry.

Pliki wyłączności:
- `gra/src/game/diplomacy.ts` (617 linii)
- `gra/data/society-params.json` + `Spoleczenstwo-parametry.xlsx`
- `gra/src/data/loader.ts` (`loadSocietyParams`)
- `gra/tools/diplomacy-test.cjs`, `society-test.cjs`
- Dokumentacja: `Civ-DYPLOMACJA/` (PROPOZYCJA-dyplomacja-AI-v0.1.md, PROPOZYCJA-religia-model.md, DOKUMENTACJA-DEV-DYPLOMACJA.md, README.md)

## 2. Stan obecny (~72%)

### ZROBIONE (WPIĘTE do kanonu)
- **Dyplomacja** (`diplomacy.ts`):
  - Model relacji dwuwymiarowy: **Zaufanie** (0..200) + **Respekt** (0..200), start=50
  - **5 tierów relacji**: Wojna(<15) / Wrogi(15..30) / Neutralny(30..60) / Przyjazny(60..120) / Sojusz(>=120) + `TIER_NAMES`
  - **`computeRespekt`** (T1=A ratio-share, zatwierdzone przez Macieja):
    - `50=parytet`; słabszy ulega, nie atakuje silniejszego
    - Wagi komponentów (ratios): POTĘGA 28% / JEDNOSTKI 20% / MIASTA 18% / TECHNOLOGIE 14% / EKONOMIA 12% / DYPLOMACJA 8%
  - **`computePotegaNacji`**: komponenty z UNITS (`liczbaJednostek`, `siła bojowa`), MIASTO (`liczbaMiast`, `populacja`, `poziomMiast`), EKONOMIA (`Złoto`, `Produkcja`, `Nauka`), TECHNOLOGIE (`techLevel`, `uniqueTechs`), DYPLOMACJA (`relacje sojusznicze`, `handlowi partnerzy`)
  - **`tickDiplomacy`** (tura dyplomacji) — cyklicznie recompute zaufanie/respekt/tier + event `zerwanie_handlu` (jeśli relacja wpadła w Wrogi/Wojna)
  - **`relationTier(rel)`** → 0..4 + `TIER_NAMES`
  - **`decideAIDiplomacy`** w `ai.ts` (T2=A): pełna dyplomacja AI + sojusz + handel (proponuje deklarację wojny / pakt / sojusz wg archetypu)
  - **`decideAIReaction`** (fight/flee) + **`decideAIReinforcements`** (posiłki ≤1 heks)
  - Eventy dyplomatyczne: `zerwanie_handlu`, `deklaracja_wojny`, `pakt`, `sojusz` (ostatnie dwa stub apply — czeka na UI/SILNIK)
- **Religie** (`Spoleczenstwo-parametry.xlsx` → "Religie cywilizacji"):
  - **9 religii** (źródło XLSX) — re-eksport do `society-params.json` JESZCZE WISI (json ma 7)
  - Każda religia: nazwa + 2-3 efekty (kwantyfikowalne)
  - Celtowie: Druidyzm (+10 Morale szarży, +2 Kultura ze świątyni/gaju, +1 Zadowolony na święta)
  - Germanie: Wotan/Odyn (+15% Atak w lesie, +2 jedność drużyny, +5 relacji z pokrewnymi)
  - Pozostałe 7 z DANE
- **Tempo gry** (współdzielone z CYWILIZACJE przez `tech-tempo.ts`):
  - `applyTempoKoszt` — mnożnik kosztu badań: szybka ×0.2 / standard ×1 / długa ×5
  - Test `tech-tempo-test.cjs` 9/9
- **`loadSocietyParams`** w `loader.ts` — czyta religie + tempo + parametry społeczne

### TESTY
- diplomacy-test: 78/0 → 90/0 → 98/0 → 119/0 → 133/0 (rośnie z tierami)
- society-test: green (9 religii źródło)
- `loader.ts` tsc EXIT=0 (izolowany)

## 3. Otwarte wątki

| # | Wątek | Status | Czeka na |
|---|-------|--------|----------|
| #society re-eksport | society-params.json religie 7→9 | **CZEKA** | master/silnik (export-data.py zakazany) |
| #applyDiplomaticEvent | Apply akcji dyplomatycznej (wojna/pakt/sojusz) | **BLOK** | UI/SILNIK wpięcie + spec akcji |
| #UI dyplomacja | Panel dyplomacji (PODGLĄD v0.1 — akcje PO applyDiplomaticEvent) | CZEKA | UI lane |
| #T3 bonusy | Mechanizacja religii jako `bonusy[]` w civs.json | DEFERRED | cross-lane handoff |
| #Handel | Model handlowy (T2=A zawiera handel) | ROBI | spec handlu (P0 Macieja) |

### Decyzje Macieja wymagane (OD DYPLOMACJA)
1. **D-1: Format/UX panelu dyplomacji** (akcje wojna/pakt/sojusz; w PIE dashboardzie u gracza, u AI tylko odczyt)
2. **D-2: Handel** — co jest handlowane? (rekom. surowce + złoto + technologie za Zaufanie/Respekt; T2=A)
3. **D-3: Sojusz** — czy wspólna obrona (wojna jednego = wojna wszystkich)? czy wspólne przejście jednostek przez terytorium?
4. **D-4: Religia** — model misjonarzy (propagacja przez miasta) czy pasywna (naród = religia)?
5. **D-5: Tempo gry** — szybka/standard/długa; czy zostawiamy 3档, czy dodajemy "epicka" ×10?

## 4. Decyzje Macieja zamknięte

- **T1=A** Respekt ratio-share (wagi 28/20/18/14/12/8) — ZATWIERDZONY
- **T2=A** Pełna dyplomacja AI + sojusz + handel — ZATWIERDZONY
- **T3=A** Bonusy strukturalne (religia jako bonusy[]) — ZATWIERDZONY (mechanizacja cross-lane)
- **T4=B** Spryt od trudności (agresjaMnoznik/dyplomacjaAktywnosc/celObranie wg poziomu) — ZATWIERDZONY (w AI)
- **Model dwuwymiarowy** Zaufanie + Respekt (0..200, start 50) — ZATWIERDZONY
- **5 tierów** + progi (<15/<30/<60/<120/>=120) — ZATWIERDZOWANE
- **9 religii** w Spoleczenstwo-parametry.xlsx (vs 7 json — re-eksport wiszący)
- **Tempo gry** = mnożnik kosztu badań (szybka ×0.2 / standard ×1 / długa ×5)
- **Rozdzielczość AI**: profil cywilizacji ZOSTAJE w panelu AI (ai-params.json), NIE w civs.json (decyzja 24.06)

## 5. Właściciele

| Rola | Model |
|------|-------|
| Spec dyplomacji, model religii ( GLM ) | `glm-5.2-max` subagent |
| Implementacja diplomacy.ts, society ( Composer ) | `composer-2.5-fast` subagent |
| Testy diplomacy-test 133+, society-test ( Opus ) | Opus 4.8 Ask/Agent |
| Decyzje D-1..D-5, akceptacja | Maciej |

## 6. Quick wins / next

| # | Co | Effort | Impact |
|---|-----|--------|--------|
| QW6 | Re-eksport society-params.json 7→9 religii | S | 🟢 Zgodność źródeł |
| #UI panel | Panel dyplomacji (PODGLĄD) po applyDiplomaticEvent | M | 🟢 Pierwsza interakcja gracza z AI |
| #Handel spec | Spec handlu (D-2) | S | 🟢 P0 Macieja |

## 7. Ryzyka / flagi

- **society-params.json vs XLSX** — 7 vs 9 religii (re-eksport = master/silnik; export-data.py ZAKAZANY)
- **applyDiplomaticEvent = stub** — akcje dyplomatyczne nie mają apply; UI/SILNIK musi wpiąć
- **Panel dyplomacji v0.1 = PODGLĄD** — akcje wojna/pakt/sojusz widoczne ale nie działają (bez applyDiplomaticEvent)
- **Religia mechanizacja** (T3=A) — czeka na cross-lane handoff (`CYWILIZACJE-do-MASTER_bonusy-mechanizacja.md`); do tego religia "efekty" niewidoczne w grze
- **decideAIDiplomacy bez aplikacji** — AI proponuje ale nic nie aplikuje (tożsame z applyDiplomaticEvent stub)
- **computePotegaNacji** zależny od cross-lane danych (UNITS/MIASTO/EKONOMIA/TECH) — wymaga kontraktów wejściowych

## 8. Diagram zależności (DYPLOMACJA)

```mermaid
flowchart LR
  UNITS[UNITS siła bojowa] --> POTEGA[computePotegaNacji]
  MIASTO[MIASTO miasta/pop] --> POTEGA
  EKONOMIA[EKONOMIA Złoto/Prod/Nauka] --> POTEGA
  TECH[TECH level/unique] --> POTEGA
  DYPLOMACJA_PROPRIA[relacje sojusze] --> POTEGA
  POTEGA --> RESPEKT[computeRespekt T1=A]
  RESPEKT --> REL[Relacja 0..200]
  ZAUFANIE[Zaufanie 0..200 tick] --> REL
  REL --> TIER[relationTier 5-tier]
  TIER --> AI[decideAIDiplomacy T2=A]
  TIER --> UI[Panel dyplomacji PODGLĄD]
  AI --> APPLY[applyDiplomaticEvent STUB]
  UI --> APPLY
  APPLY --> ZAUFANIE
  APPLY --> HANDEL[handel T2=A STUB]
  HANDEL --> EKONOMIA
  RELIGIA[Religia bonusy[]] --> BONUSY[T3 mechanizacja cross-lane DEFERRED]
```
