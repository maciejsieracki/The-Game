# Status wdrożenia — dla innych agentów (2026-07-27)

> **Aktualna ROBOCZA:** FALA 36 · md5 `a74c3797` · commit `2632156` · wejście `gra-robocza/START.html`  
> **Źródło deploy:** `dyspozycje/WERSJE.md` · potwierdzenie: `dyspozycje/_handoff/KANAL-PRACA.md` [15:27]

## Legenda

| Symbol | Znaczenie |
|--------|-----------|
| ✅ GOTOWY | Kod w `gra/src/`, testy lane zielone |
| ✅ DEPLOY | W `gra-robocza/` w wskazanej FALI |
| ⏸ CZEKA DEPLOY | Kod gotowy, **nie** w aktualnej roboczej — kolejna FALA Integratora |
| ❌ BRAK KODU | Tylko decyzja zapisana — czeka `działaj` |
| 🔧 Czat ABC | Sesja Macieja z ABC — **nie publishuje** `gra-robocza/` |

**Zasada:** deploy robi **wyłącznie Integrator** po `git pull` + sprawdzeniu `WERSJE.md` / `ROBOCZA-MANIFEST.json`. Czat ABC edytuje `gra/src/` + `docs/decyzje/`.

---

## Tabela tematów (paczka ABC 2026-07-27)

| ID | Odpowiedź | Kod `gra/src` | Deploy `gra-robocza` | Właściciel | Uwagi |
|----|-----------|---------------|----------------------|------------|-------|
| **C-WIAR-N4-AI** | B | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | `alliance-war-obligation.ts` 14/14 |
| **C-WIAR-D4** | A | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | `diplomacy-credibility.ts` |
| **C-WIAR-N1-UX** | A | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | `showWarConsentModal` |
| **P-AI-006** | C | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | `civ-ai.json` · `ai-expansion.ts` |
| **P-AI-007** | A | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | `ai-production-priorities.ts` |
| **P-AI-008** | C | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | `ai-threat-mode.ts` zasięg 7 hex |
| **R-MAPGEN-KOLEJNOSC-Q1** | B | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | jeden moment lasu w pipeline |
| **R-MAPGEN-KOLEJNOSC-Q2** | C | ✅ GOTOWY | ⏸ **FALA 37** | 🔧 ABC | relief ~15% — kod w `gra/src`, poza F36 |
| **R-MAPGEN-KOLEJNOSC-Q3** | A | ✅ GOTOWY | ⏸ **FALA 37** | 🔧 ABC | floor relief bez skracania |
| **C-TEREN-IMPL-1** | A | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | jeden batch etapów 1–3 |
| **C-TEREN-IMPL-2** | C | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | obrona Gór +75% z JSON |
| **C-TEREN-IMPL-3** | B | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | `battleTerrainTooltip.ts` ETAP 4 |
| **R-BITWA-POWTORKA-I** | B | ✅ GOTOWY | ⏸ **FALA 37** | 🔧 ABC | F36 = stary snapshot; HEAD = auto-grupa |
| **C-ARMY-HUNGER-Q1** | A | ✅ GOTOWY | ✅ FALA 36 | 🔧 ABC + F36 | parytet suwak+głód · `glod-wojska-karencja` 39/39 |
| **PYTANIE-20** | A | ✅ (wcześniej) | ✅ wcześniej | — | zamknięte, bez nowej pracy |
| **PYTANIE-84** | hybryda | ❌ BRAK KODU | — | 👷 **subagent** | runtime gate dostęp/magazyn |
| **C-STRATY-HP-Q1** | zamknięte | — | — | — | wyjaśnienie Macieja, bez fixu |
| **C-OBCE-JEDN-Q1** | A | ❌ | — | 👷 **subagent** | pełny panel + karta |
| **C-OBCE-JEDN-Q2** | TW | ❌ | — | 👷 **subagent** | portret/sygnet lewo · Opus render |
| **C-OBCE-JEDN-Q3** | A+B+C | ❌ | — | 👷 **subagent** | dziennik+karta+tooltip |

---

## Własność sesji (żeby nie dublować pracy)

| Temat | Kto | Inni agenci |
|-------|-----|-------------|
| Paczka ABC 2026-07-27 (13 ID) | ✅ zamknięte w plikach | tylko Integrator → FALA 37 (3 delty) |
| **C-OBCE-JEDN** Q1–Q3 + KARTA | 👷 **subagent (inna sesja)** | **ten czat ABC = IDLE** — nie koduj |
| **PYTANIE-84** runtime · R-MUZYKA · R-FULLSCREEN · wdrożenia po decyzji | 👷 **subagent** | ten czat ABC = IDLE |
| Delta F37 (bitwa/mapgen) | 🔧 były czat ABC | tylko **Integrator** publishuje |

**Maciej 2026-07-27 ~17:07:** pozostałe pytania/wdrożenia → **inny subagent**.

---

## Kolejny deploy (Integrator — FALA 37)

Po sygnale Macieja **deploy** / dyspozycji Mastera:

1. `git pull --ff-only origin main`
2. Sprawdź `gra-robocza/ROBOCZA-MANIFEST.json` = `a74c3797`
3. Zbuduj paczkę z delty: **R-BITWA-POWTORKA-I=B**, **R-MAPGEN-KOLEJNOSC-Q2**, **Q3**
4. Dopisz `WERSJE.md` + wpis `KANAL-PRACA.md`

---

## Powiązane pliki

- Indeks ABC: `docs/decyzje/ABC-KOLEJKA-OTWARTE-2026-07-27.md`
- Standard zapisu: `docs/decyzje/ABC-ZAPIS-PLIKOWY.md`
- Rejestr decyzji: `docs/obieg/REJESTR-DECYZJI.md`
