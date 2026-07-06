# OPUS REVIEW — batch epoka-wejscia-cuda (2026-07-03)

> **Tryb:** Ask (read-only) · **Decydent po review:** Maciej  
> **Kanon pod review:** `Gra-podglad.html` md5 `DB1F508BEE3080F199617B8E0420C0E9`

---

## Zakres diff

| Obszar | Pliki |
|--------|-------|
| Kaskada państw | `civs.json`, `civ-entry-epoch.ts`, `newGameFlow.ts` |
| AI roster | `main.ts` (`_menuEpochId`, `civIdsAvailableAtGameEpoch`) |
| Cuda dane | `wonders.json`, `wonder-civ-tech.ts` |
| Testy | `civ-entry-epoch-test`, `wonder-civ-tech-test`, `civ-roster-test` |

**Poza scope:** gameplay budowy cudów (CUDA-G1 — moduł gotowy, nie wpięty).

---

## AC do weryfikacji

1. **Kaskada:** Kamień 8 · Brąz 14 · Żelazo 15 typów w kreatorze.
2. **Fenicjanie** = wejście Brąz (nie Żelazo); Inkowie w Brązu i Żelazie.
3. **AI roster** nie losuje typów sprzed epoki startu gry.
4. **Tech cudów E:** brak tech sprzed `epokaWejscia` państwa (test 5/5).
5. **Kolos + Koloseum:** Inżynieria, epoka cudu 3.
6. **Brak regresji:** logic 203, smoke, battle-smoke.

---

## Pytania adversarial

- Czy `fillAiOwnerCivMap` przed `applyMenuParams` używa domyślnego `kamien` (OK przy cold start)?
- Czy `wonder-civ-tech` powinien być wywołany runtime (dziś tylko CI)?
- Czy publikacja kanonu bez CUDA-G1 jest akceptowalna (dane-only)?

---

## Sign-off

- [ ] **APPROVE** — kanon zostaje  
- [ ] **BLOCK** — lista blockerów
