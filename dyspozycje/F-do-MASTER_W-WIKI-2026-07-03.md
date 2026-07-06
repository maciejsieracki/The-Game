# F → MASTER: W-WIKI batch (2026-07-03)

**Trigger:** `start` · **Batch:** UI lane Wikipedia (W-WIKI-1 + W-WIKI-2 + fix kreatora)  
**main.ts:** **bez zmian** (tylko publish roboczej)

---

## Bramka

| Test | Wynik |
|------|--------|
| wire-ekonomia | ✅ |
| logic-test | ✅ |
| combat-test | ✅ |
| civ-bonusy | ✅ |
| diplomacy-test | ✅ |
| ai-test | ✅ |
| smoke | ✅ |
| battle-smoke | ✅ |
| typecheck | ⚠️ znane błędy TS (baseline) — build OK |

---

## Publikacja ROBOCZA

| Plik | MD5 |
|------|-----|
| `gra-robocza/Gra-podglad.html` | **`db1f508bee3080f199617b8e0420c0e9`** |
| `Gra-podglad-ROBOCZA.html` (legacy root) | ten sam |
| `gra-robocza/ROBOCZA-MANIFEST.json` | `publishedAt: 2026-07-03T13:45:10` |
| **KANON** `Gra-podglad.html` (root) | **bez zmian** `18258bbcc5909394e816afaa05945b16` |

**Start Macieja:** `gra-robocza/START.html` → Ctrl+F5

---

## Zawartość batchu

- **Wiki** — przycisk góra-prawo obok Menu, panel Poradnik/Encyklopedia
- **Ikona** — Design `ui-wiki.svg` (otwarta książka 2 strony) w bundle
- **W-WIKI-1** — polish panelu (złota ramka, PL meta, bez emoji)
- **Fix** — `civMinStartEpochIndex is not defined` w kreatorze (BOOT ERROR)

---

## Następny krok MASTER

1. Weryfikacja manifestu vs meldunek ✅
2. **Maciej playtest** `gra-robocza/START.html` (nie root kanon)
3. Opus review (Ask) — W-WIKI
4. Po APPROVE → `publish-kanon-snapshot.ps1` (Batch 3)

→ **MASTER:** weryfikacja + dyspozycja Opus · **NIE** promocja kanon bez Opus

*Integrator F · 2026-07-03*
