# PLAN — AI × miasta-państwa: wasalizacja + wchłonięcie + sojusze sióstr

**ID:** `R-AI-MP-WASAL-WCHLONIECIE`  
**Data:** 2026-08-03  
**Status:** plan do decyzji (bez implementacji)  
**Źródło:** Maciej — AI nie radzi sobie z MP; gra za łatwa (gracz ma wiele miast, AI utyka na klastrze); potrzeba szybkiego wchłaniania MP bez walki + wyłączenie sojuszy sióstr przy wojnie AI↔MP; gracz też ma wchłaniać słabszych trybutariuszy, ale drogo/trudno.

---

## 1. Diagnoza (stan dziś)

| Obszar | Co jest | Skutek |
|--------|---------|--------|
| Konsolidacja klastra | Od t.20 AI **wypowiada wojnę** MP tego samego typu; deadline ~t.100 | AI **musi** walczyć, nie dyplomatyzuje |
| Wasal / trybut | Działa między pełnymi cywilizacjami (Respekt ≥ ~70) | **MP wykluczone** z warstwy uproszczonej (brak akcji 8/12) |
| Wchłonięcie | Parametr `progWchloniecieRespekt=90` w danych | **Martwy** — brak UI i ścieżki w grze |
| Sojusze sióstr | Przy zagrożeniu **dowolnym** obcym (także AI) siostry zawierają sojusz + posiłki | AI walczy z **całym klastrem**, nie z jednym MP |
| Ekspansja AI | Faza lokalna ~45 tur + blok założenia miasta póki żyją cele klastra | Mapa wolno się zapełnia miastami AI |

---

## 2. Cel produktowy

1. **AI szybko „zbiera” miasta-państwa swojego typu** — głównie dyplomacją (wasal → wchłonięcie), walka jako zapas.
2. **Siostry nie dogpilują AI** — sojusze MP↔MP nie włączają się (lub są mocno ograniczone), gdy agresorem jest wielka cywilizacja AI (nie gracz).
3. **Gracz** może wchłaniać bardzo słabych trybutariuszy / wasali — ale **drogo i trudno** (zgoda / koszt).
4. Parametry **skalowane trudnością** (łatwy = AI łagodniejsze / wolniejsze; trudny = AI wchłania szybciej).
5. Efekt playtestu: mapa szybciej pełna miastami AI; gracz nie wyprzedza imperium o rząd wielkości tylko dlatego, że AI utknęło na MP.

---

## 3. Schemat rozwiązania (3 filary)

```
┌─────────────────────────────────────────────────────────────┐
│ F1. SOJUSZE SIÓSTR                                          │
│   Dziś: zagrożenie dowolnym ownerem → sojusz MP↔MP          │
│   Propozycja: sojusz/posiłki TYLKO gdy zagrożenie = gracz   │
│               (lub: wyłączone vs major AI tego samego typu) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ F2. AI → MP: WASAL (łatwy)                                  │
│   Zamiast (lub przed) forced DOW: zaproponuj wasalizację    │
│   Niskie progi Respekt / stosunek sił; MP prawie zawsze     │
│   akceptuje gdy AI silniejsze ×N                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ F3. WASAL → WCHŁONIĘCIE                                     │
│   AI↔MP: po T turach wasala — auto lub 1 klik AI (łatwo)    │
│   Gracz↔słaby wasal/trybutariusz: drogie (PN/złoto/Relacja) │
│   + wysoki próg zgody                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ F4. EKSPANSJA (wspomaganie celu „mapa pełna miast”)        │
│   Po wchłonięciu klastra: odblokuj founding wcześniej;      │
│   opcjonalnie skróć fazę lokalną / deadline konsolidacji    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Parametry (propozycja tabeli)

Wszystkie w `diplomacy.json` / `ai-params.json` / nowy blok `mp_wasal_wchloniecie` — strojenie per **trudność gry** (i osobno suwak trudności MP, jeśli zostaje).

### 4.1 Sojusze sióstr (F1)

| Parametr | Easy | Normal | Hard | Sens |
|----------|------|--------|------|------|
| `sister_alliance_vs_player` | TAK | TAK | TAK | Gracz nadal czuje opór klastra |
| `sister_alliance_vs_ai_major` | NIE | NIE | NIE* | AI nie walczy z całym klastrem (*hard: opcjonalnie rzadkie) |
| `sister_resup_vs_ai_major` | 0 | 0 | 0 | Posiłki tylko vs gracz |
| `sister_alliance_scale` (obecne) | 0,6 | 0,3 | 0,15 | Zostaje dla ścieżki vs gracz |

\*Hard: wariant „rzadkie sojusze sióstr vs AI” (np. 15% szansy) — do ABC.

### 4.2 Wasalizacja AI → MP (F2)

| Parametr | Easy | Normal | Hard | Sens |
|----------|------|--------|------|------|
| `ai_cs_vassal_enabled` | TAK | TAK | TAK | Nowa ścieżka |
| `ai_cs_vassal_min_turn` | 25 | 18 | 12 | Kiedy AI może zacząć |
| `ai_cs_vassal_military_ratio_min` | 1,8 | 1,4 | 1,2 | Siła AI vs to MP |
| `ai_cs_vassal_respekt_min` (AI) | 40 | 30 | 20 | Dużo niżej niż 70 gracza |
| `ai_cs_vassal_accept_chance` | 0,55 | 0,75 | 0,95 | „prawie zawsze” na hard |
| `ai_cs_prefer_vassal_before_war` | TAK | TAK | TAK | Forced DOW dopiero gdy wasal fail ×N tur |
| `cluster_war_min_turn` (obecne 20) | 35 | 28 | 20 | Późniejsza wojna = więcej czasu na wasal |
| `cluster_conquest_deadline` (obecne 100) | 140 | 120 | 90 | Hard: szybciej domyka |

### 4.3 Wchłonięcie (F3)

| Parametr | AI→MP | Gracz→wasal/trybutariusz | Sens |
|----------|-------|---------------------------|------|
| `annex_after_vassal_turns` | Easy 20 / Norm 12 / Hard **6** | — | Auto-timer AI |
| `annex_ai_cs_cost` | **0** (lub symboliczne 10 ¤) | — | „bardzo łatwe” |
| `annex_player_respekt_min` | — | **85–90** (jak martwy prog) | Trudna zgoda |
| `annex_player_power_ratio_min` | — | **2,5×** Power / armia | Tylko vs dużo słabszych |
| `annex_player_gold_cost` | — | `200 + 100×epoka` (placeholder) | Kosztowna zgoda |
| `annex_player_relacja_penalty` | — | −20 Relacja z innymi / −15 Wiarygodność | Konsekwencja |
| `annex_player_refuse_cooldown_tur` | — | 15 | Nie spam |

**Efekt wchłonięcia (wspólny):** miasta → owner zwycięzcy; jednostki wasala → disband lub przejęcie (do ABC); dyplomacja wasala znika; Power jak przy eliminacji (albo łagodniejszy bonus — do ABC).

### 4.4 Ekspansja AI (F4 — wspomaganie)

| Parametr | Easy | Normal | Hard | Sens |
|----------|------|--------|------|------|
| `ai_local_phase_max_turn` (dziś ~45) | 40 | 30 | 22 | Szybciej 2. miasto |
| `ekspansja_klaster_bypass` (dziś 4) | 3 | 2 | 1 | Founding mimo żywych MP |
| `trudnosc_startowe_miasta` | 0 | 0→**1** | 1→**2** | Więcej miast na starcie (opcjonalnie) |

---

## 5. Kolejność wdrożenia (po ABC)

| Faza | Zakres | Ryzyko | Efekt playtestu |
|------|--------|--------|-----------------|
| **P0** | F1: filtr sojuszy sióstr (tylko vs gracz) | Niski | AI wreszcie bije **jedno** MP, nie klaster |
| **P1** | F2: AI proponuje wasal MP + akceptacja łatwa | Średni | Mniej oblężeń, szybsza konsolidacja |
| **P2** | F3a: auto-wchłonięcie AI→MP po T turach | Średni | Miasta klastra w rękach AI |
| **P3** | F3b: gracz — akcja Wchłonięcie (droga) | Średni | Parytet narzędzia, ale trudne |
| **P4** | F4: tuning founding / deadline | Niski | Więcej miast AI na mapie |

Rekomendacja startu: **P0 → P1 → P2** w jednej fali playtestowej; P3/P4 osobno.

---

## 6. Ryzyka / uwagi

1. **Warstwa uproszczona MP** — dziś blokuje wasal/trybut; trzeba wyjątek **AI→MP** (i ewentualnie gracz→MP osobno — dziś celowo ograniczone).
2. **Jedna umowa `Wasalizacja`** = trybut i wasal — wchłonięcie powinno być **osobną akcją** / osobnym `RodzajTraktatu` albo flagą `wasal.moznaWchlonacOdTury`.
3. **Balans Power** — łatwe wchłanianie daje AI bonus Power; na hard OK, na easy może być za mocno → tabela 4.2/4.3.
4. **Sojusze vs gracz zostają** — żebym nie dostał „łupu bez oporu” przy ataku na MP.
5. **Nie mylić z R-STAWKI** — to ekspansja AI/MP, nie koszty ekonomii.

---

## 7. Pliki (gdy `działaj`)

- `gra/src/main.ts` — `formSisterAlliancesIfThreatened`
- `gra/src/game/ai.ts` — `decideAIDiplomacy` (wasal), founding gates
- `gra/src/game/diplomacy-proposals.ts` / `diplomacy-layers.ts` — akceptacja + wyjątek MP
- `gra/src/game/city-state-difficulty.ts` — timing wojny vs wasal
- `gra/data/diplomacy.json` + `ai-params.json` — progi
- Nowy: `gra/src/game/annexation.ts` (czysta logika wchłonięcia) + testy

---

## 8. ABC do decyzji (paczka poniżej w czacie)

Pytania: (Q1) sojusze sióstr · (Q2) ścieżka AI→MP · (Q3) wchłonięcie gracza.

*Koniec planu · 2026-08-03.*
