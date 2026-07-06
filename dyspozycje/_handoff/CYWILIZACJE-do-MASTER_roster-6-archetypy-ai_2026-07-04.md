# HANDOFF CYWILIZACJE → MASTER: roster-6 archetypy AI + korekta Hetyci

**Data:** 2026-07-04  
**Od:** CYWILIZACJE  
**Do:** MASTER (SILNIK)  
**Decyzje:** D-ROSTER-Q7=A · korekta Macieja (Hetyci/Babilonia nauka)  
**Status:** **KANON ✅ 2026-07-04 ~22:03** · md5 `dafa21f48be84501ad74145e8d65f9f4`

---

## Review MASTER (zamiast Opus) — APPROVE 2026-07-04 ~22:00

| Check | Wynik |
|-------|--------|
| Scope | tylko `ai-params.json` + `ai.ts` + `ai-test.cjs` · **bez** `main.ts` · **bez** `units.json` |
| CIV_TO_ARCH | 6 roster-6 → własne klucze (nie fallback egipt/sumer/germanie) |
| Hetyci nauka +2 · Babilonia nauka +2 wojsko −1 | ✅ JSON |
| T3e–T3h | ✅ PASS |
| ai-test suite | 227 pass · 5× T2S baseline (poza batch) |
| vite build | ✅ |
| Promocja | `publish-robocza-snapshot.ps1` → `publish-kanon-snapshot.ps1` |

**Decyzja Macieja:** Opus **wycofany** — review = Master w hubie → od razu kanon.

---

## Co przesyłam

| Plik | Zmiana |
|------|--------|
| `gra/data/ai-params.json` | 24 klucze `archetype_{harappa,hetyci,slowianie,babilonia,asyria,fenicjanie}_*` · Hetyci `nauka=+2` |
| `gra/src/game/ai.ts` | `ArchKey` rozszerzony o 6 typów · `CIV_TO_ARCH` bez fallbacków na stare archetypy |
| `gra/tools/ai-test.cjs` | T3e–T3h (klucze JSON, Harappa/Asyria behawior, roundtrip 6 typów) |

**Backup:** `ai-params.json.bak-CYW-2026-07-04` · `ai.ts.bak-CYW-2026-07-04`

**Meldunki:** `dyspozycje/CYWILIZACJE-DO-MASTERA.md` (wpisy 2026-07-04)

---

## Co MASTER ma z tym zrobić

1. **Brak zmian `main.ts`** — moduł ładuje się przez istniejący loader (`ai-params.json` + bundle `ai.ts`).
2. **Bramka przed kanonem:**
   ```powershell
   cd gra
   node tools/ai-test.cjs    # T3e–T3h ZIELONE; baseline T2S 5× FAIL (znany, nie ten batch)
   npx tsc --noEmit
   npx vite build --outDir $env:TEMP\civ-dist
   ```
3. **Publikacja kanonu** po review Master (APPROVE): skopiować bundle → `gra-kanon/` · md5 checkpoint. **Opus wycofany** (Maciej 2026-07-04).
4. **NIE dotykać** `units.json` (Grupa C) · Panel-D bonusów (czeka Macieja).

---

## DoD (kryteria akceptacji)

- [ ] `CIV_TO_ARCH['harappa'] === 'harappa'` (nie `'egipt'`) — i analogicznie 5 pozostałych roster-6
- [ ] `ai-params.json` zawiera 24 nowe klucze archetype roster-6
- [ ] Hetyci `archetype_hetyci_nauka_priorytet.wartosc === 2`
- [ ] Babilonia: nauka +2, wojsko −1 (bez minusa na nauce)
- [ ] ai-test T3e–T3h: PASS
- [ ] build `/tmp/civ-dist` OK

---

## Poza zakresem tego handoffu (inne lane'y)

| Temat | Kto |
|-------|-----|
| Jednostki spec. roster-6 + Soldurii | Grupa C — `CYW-do-GRUPA-C_jednostki-spec-brief-2026-07-04.md` |
| Panel-D export bonusów % | CYW czeka edycji Macieja (D-ROSTER-Q4=B) |
| CUDA G1A refaktor budowy cudów | SILNIK + UI + MAPA |
| CUDA G2 utrzymanie cudów | EKONOMIA |

---

## Prompt dla MASTER (copy-paste)

```
Handoff CYW: roster-6 archetypy AI (D-ROSTER-Q7=A) GOTOWE.
Pliki: ai-params.json (+24 klucze), ai.ts (CIV_TO_ARCH 6 własnych), ai-test T3e–T3h.
Bez main.ts. Bramka: ai-test + tsc + vite build /tmp → kanon po Opus.
Handoff: dyspozycje/_handoff/CYWILIZACJE-do-MASTER_roster-6-archetypy-ai_2026-07-04.md
```
