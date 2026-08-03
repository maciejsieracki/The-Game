# R-AI-MP-WASAL-WCHLONIECIE — decyzje + parametry

**Status:** WDROŻONE (kod) · bez deploy  
**Data:** 2026-08-03

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **Q1** | **A** (potwierdzone) | Sojusze/posiłki sióstr **tylko gdy zagrożenie = gracz**. Vs AI major — **wyłączone**. Dla gracza MP bez zmian. |
| **Q2** | **A** na Łatwy+Normalny · **C** na Trudny | Ł/N: najpierw **wasal/trybut** (łatwy), wojna gdy odmowa. **Trudny:** praktycznie **od razu wchłania** MP (auto-absorb). |
| **Q3** | **A+B (przyszłość)** · **teraz bez zmian dla gracza** | Przyszły design gracza: **drogo** (A) + **zgoda** (B). **Teraz:** zero zmian UX/akcji gracza↔MP. |

**Zakres:** wyłącznie ułatwienia **AI → miasta-państwa**. Skala = **trudność gry** (`easy`/`normal`/`hard`), nie odwrócona trudność MP.

**Cytat:** *„Q1 już powiedziałem… gracza nic się nie zmienia… tylko ułatwienia przejęcia przez AI… stopniowane… trybut oraz wasal na bardzo ułatwionym poziomie… Q2 A na łatwy i normalny, C na trudny… Q3a+b”*

---

## Parametry (propozycja → kanon wdrożenia)

### 1. Sojusze sióstr (Q1=A) — wspólne na wszystkich poziomach

| Parametr | Wartość |
|----------|---------|
| `sister_alliance_threat_owners` | **tylko `ownerId === 0` (gracz)** |
| `sister_resup_vs_ai_major` | **wyłączone** (posiłki sióstr nie idą vs AI) |
| Sojusze vs gracz | **bez zmian** (jak dziś) |

### 2. Trybut + wasal AI → MP (Q2=A na Ł/N)

| Parametr | Łatwy | Normalny | Trudny |
|----------|-------|----------|--------|
| `ai_cs_diplomacy_enabled` | TAK | TAK | TAK* |
| `ai_cs_min_turn` | 28 | 18 | 8 |
| `ai_cs_military_ratio_min` (AI/MP) | 1,6 | 1,3 | 1,1 |
| `ai_cs_trybut_accept` | 0,70 | 0,85 | 0,98 |
| `ai_cs_wasal_accept` | 0,60 | 0,80 | 0,95 |
| `ai_cs_trybut_gold_per_turn` | 8 | 5 | 2 |
| `ai_cs_wasal_after_trybut_turns` | 12 | 8 | 3 |
| `ai_cs_vassal_fail_before_war` | 3 odmowy | 2 | 1 |
| `cluster_war_min_turn` (override) | 40 | 30 | 15 |
| `cluster_conquest_deadline` | 150 | 120 | 80 |

\*Na **Trudnym** ścieżka dyplomatyczna jest skrócona — patrz §3 (tryb C).

### 3. Wchłonięcie AI → MP

| Parametr | Łatwy (A) | Normalny (A) | **Trudny (C)** |
|----------|-----------|--------------|----------------|
| Tryb | Wasal → timer | Wasal → timer | **Auto-wchłonięcie** |
| `ai_cs_annex_after_vassal_turns` | 16 | 10 | **0–1** (prawie od razu) |
| `ai_cs_annex_cost` | 0 | 0 | 0 |
| `ai_cs_instant_annex_if_ratio` | — | — | **≥ 1,25** → wchłonięcie bez wojny (to samo cyw. / klaster) |
| `ai_cs_instant_annex_min_turn` | — | — | **10** |

**Trudny (C) — sens:** AI major tego samego typu co MP w klastrze, gdy `militaryRatio ≥ 1,25` i tura ≥ 10 → **bezpośrednie przejęcie miasta MP** (wchłonięcie), bez oblężenia całego klastra. Sojusze sióstr i tak wyłączone vs AI.

### 4. Ekspansja AI (wspomaganie celu „mapa pełna”)

| Parametr | Łatwy | Normalny | Trudny |
|----------|-------|----------|--------|
| `ai_local_phase_max_turn` | 40 | 28 | 18 |
| `ekspansja_klaster_bypass` | 3 | 2 | 1 |
| Blok founding przy żywych CS | TAK (łagodniej) | częściowy | **NIE** po 1. wchłonięciu / bypass |

### 5. Świadomie NIE ruszamy (gracz)

- Warstwa uproszczona MP dla **gracza** (akcje 8/12) — bez zmian  
- Sojusze sióstr vs **gracz** — bez zmian  
- Nowe UI wchłonięcia dla gracza — **odłożone**

---

## Kolejność wdrożenia

1. **P0** — filtr sojuszy sióstr (tylko gracz)  
2. **P1** — AI→MP trybut/wasal (łatwy accept) + timing wojny  
3. **P2** — wchłonięcie po wasalu (Ł/N) + instant annex (Hard)  
4. **P3** — tuning founding / deadline  

*Koniec · 2026-08-03.*
