# R-OBRONA-MIASTA-MP — audyt obrony miasta BEZ murów

**Status:** DIAGNOZA ZAMKNIĘTA (Operator AutoBot)  
**Data:** 2026-08-06  
**Branch audytu:** `cursor/audit-obrona-miasta-mp-63a1`  
**Zgłoszenie:** „Przeciwnicy mają niewiarygodne bonusy w obronie miasta bez muru, zwłaszcza państwa-miasta.”

---

## Werdykt

| Pytanie | Odpowiedź |
|---------|-----------|
| **Bug (podwójny mnożnik)?** | **NIE** — prześledzone 3 ścieżki walki; brak podwójnego liczenia tego samego składnika. |
| **`bonusWalka` / trudność cicho dokłada do MP?** | **NIE dla miast-państw** — `qualifiesForMajorAiDifficultyBonus` wyklucza MP (`P-AI-MOC-BONUS=A`). **TAK dla major AI** na Trudnym (+5% statów walki, niewidoczne w UI). |
| **Potrzeba ABC?** | **TAK (balans/UX)** — nie bug fix. Główna „tajemnica” siły: **+50% Obrony garnizonu bez murów** + ewentualna **palisada (+100%)** + **milicja** + **stos obrońców dist≤1**. |

**Rekomendacja:** ABC czy utrzymać +50% garnizon / czy pokazać rozbicie w preBattle, zamiast patcha kodowego.

---

## Definicja „bez murów” w kodzie

| Warstwa | Co liczy się jako „obrona budynku” | Źródło |
|---------|-----------------------------------|--------|
| **Kamienne mury** | `mury` w `cityBuilt` | +200% Obrony (`bonus_obrona_mur_proc`) |
| **Cytadela** | `fort` w `cityBuilt` | +100% dodatkowo (razem z murem do +300%) |
| **Baszta** | `baszta` w `cityBuilt` | +100% dodatkowo (do +400% z kompletem) |
| **Palisada** | `palisada` w `cityBuilt` | +100% Obrony; **zastępuje** palisadę gdy są Mury; ustawia `City.maMur=true` |
| **Żadnego z powyższych** | `cityWallDefenseBonusPercent(...) === 0` | Brak bonusu strukturalnego muru |

**Uwaga dla playtestu:** miasto „bez kamiennych murów” może mieć **palisadę** (+100%) — wizualnie nie wygląda jak mur, ale silnik traktuje to jak budynek obronny (`maMur`, bonus strukturalny).

Dane: `gra/data/miasto-params.json`, logika: `gra/src/game/city-defense.ts` → `cityWallDefenseBonusPercent`.

---

## Pełne rozbicie — miasto BEZ budynku obronnego (0% mur/palisada/baszta)

Składniki **addycyjne w punktach % Obrony** (miasto) lub **mnożniki na stat Obrona** (jednostka). Kolejność stosowania różni się per tryb, ale **ten sam składnik nie jest liczony dwa razy**.

### Wspólne dla obrońcy (MP i major AI)

| # | Składnik | Wartość | Jednostka | Kiedy | Plik / funkcja |
|---|----------|---------|-----------|-------|----------------|
| 1 | **Bazowa Obrona jednostki** | z `units.json` (`meleeDefence`) | pkt | zawsze | `unitDefFor` / `lookupUnitDef` — `main.ts` |
| 2 | **Premia weterana** | +10% / +20% Atak+Obrona+HP (nie Pancerz) | % statów | `veteranLevel` 2/3 | `veteran.ts` → `veteranScaledDefFor` / `veteranScaledDef` |
| 3 | **Garnizon „Ufortyfikuj”** | **+50% Obrony** | % Obrony | `inGarnizon===true` **i** brak palisady/murów/cytadeli/baszty | `combat-params.json` `fortify_obrona_proc=50` → `unitGetsFortifyDefenseBonus` → `fieldFortifyDefenseBonus` — `city-defense.ts`, `main.ts` `fortifyFieldScaledDefFor`, `battleScene.ts` `_singleBlow` |
| 4 | **Bonus cywilizacji `bonus_obrona`** | np. Grecja +20% Obrony piechoty | % statu | obrońca, dopasowany `cel`/`opis` | `civs.json` → `civ-bonuses.ts` `civCombatStatMultipliers` |
| 5 | **Bonus budynków jednostki** | do +15% parametrów / pancerz | % | najlepsze miasto odwiedzone przez jednostkę | `unit-building-bonuses.ts` → `mergeBuildingBonusIntoStatMultipliers` |
| 6 | **Bonus terenu (miasto bez muru)** | **0%** | — | `cityGatedTerrainMultiplier(hasMur=false)` → 1.0; wzgorze **nie** pomaga | `city-defense.ts`, `main.ts` `effectiveDefenderM` gałąź `isCity` |
| 7 | **Bonus strukturalny muru** | **0%** | — | brak budynku obronnego w `cityBuilt` | `structureDefenseBonusFor` → `cityWallDefenseBonusPercent` |
| 8 | **Flanka/tył** | −50% / −80% efektywnej Obrony | % | bitwa taktyczna / `resolveCombat` | `combat.ts` `flankRearDefensePenalty` |
| 9 | **Głód wojska** | ×0,75 statów (bez pancerza) | mnożnik | zapasy państwa < 0 | `armyHungerStatMult` — `main.ts` `armyHungerBattleOpts` |
| 10 | **Milicja (SS9c)** | ~20% pop × ½ statów Wojownika; HP zsumowane | syntetyczna jednostka | brak jednostek dist≤1, ale `city.garnizon > 0` | `siege.ts` `makeMilitia` → `siegeDefenders.ts` `collectCityDefRoster` |
| 11 | **Wielu obrońców** | suma M rostera | moc M | wszystkie jednostki właściciela w promieniu **1 heks** od miasta | `battleRoster.ts` `collectDefRosterNearCity` |

### Tylko major AI (pełna cywilizacja, `ownerId>0`, nie MP, nie barbarzyńca)

| # | Składnik | Wartość | Jednostka | Kiedy | Plik / funkcja |
|---|----------|---------|-----------|-------|----------------|
| 12 | **`bonusWalka` (trudność)** | **0 / 0 / +5%** (L1/L2/L3 gry) | mnożnik Atak+Obrona+ranged | `qualifiesForMajorAiDifficultyBonus` → `difficultyCombatMultForOwner` | `ai-difficulty-bonus.ts`, `ai-params.json` `trudnosc_poziom3_bonus_walka=0.05`, `main.ts` `combatPowerScaledDefFor` (Auto) + `difficultyBattleOpts` (taktyczna) |

### Tylko miasto-państwo (MP, `typCityCopyOwners`)

| # | Składnik | Wartość | Uwagi |
|---|----------|---------|--------|
| 12 | **`bonusWalka`** | **wyłączony (×1)** | `qualifiesForMajorAiDifficultyBonus(ownerId, isCityState=true)` → `false` — `ai-difficulty-bonus.ts` L17–22 |
| 13 | **Trudność MP (`_menuCityStateDifficulty`)** | wpływa na AI ekonomię/dyplomację | **nie** na staty walki obrony |
| 14 | **Wsparcie ofensywne PM (hard)** | więcej jednostek w polu | nie bonus obrony, ale większy roster obrońców |

---

## Trzy ścieżki walki — spójność (bez podwójnego liczenia)

### A) Auto-walka mocą M (`main.ts` `effectiveDefenderM`)

1. `combatPowerScaledDefFor(u)` = weteran → garnizon +50% (jeśli bez muru) → **`bonusWalka` tylko major AI**.
2. `sumRosterFieldMSplit` — rozdziela M na część ataku i obrony obrońcy.
3. Dla heksu miasta (`isCity=true`): `combinedDefPct = structBonusPct + (cityGatedTerrainMult−1)×100` — przy braku muru **= 0**.
4. Tylko **część obrony** M × `(1 + combinedDefPct/100)` — atak obrońcy bez bonusu terenu/muru.

**Fortyfikacja garnizonu:** wchodzi w krok 1 (w `meleeDefence`), **nie** powtórzona w kroku 3.

### B) Bitwa taktyczna (`battleScene.ts` `_singleBlow`)

1. Stat bazowy z `unitDefFor` (bez weterana w def — weteran w `toCombatUnit`).
2. Mody cyw + budynki jednostki.
3. `fieldFortifyDefenseBonus` jeśli `fortifiedInField` (+50%).
4. `defOwnerDiffMult` = `difficultyCombatMultForOwner` (major AI only).
5. `terrDefMult` — przy `isCityDefenseBattle` i bez muru: **1.0** (brak terenu/muru).

**`bonusWalka`:** tylko krok 4, **nie** w `combatPowerScaledDefFor` (taktyczna używa surowego def + mult osobno) — **jednokrotnie**.

### C) „Pomiń” (`computeInstantResult` → `resolveCombat`)

Jak B, z `structureDefBonusPct` = mur% + teren% (oba 0 bez muru) i `defenderDifficultyCombatMult`.

---

## Odpowiedzi na pytania AC

### 1. Czy mnożnik liczony dwa razy?

**NIE** — sprawdzone pary:

| Para | Werdykt |
|------|---------|
| `fortify_obrona_proc` + `structureDefBonusPct` | różne bramki (garnizon bez muru vs budynek obronny) — nie stackują się na „bez muru” |
| `bonusWalka` w Auto (`combatPowerScaledDefFor`) + `difficultyBattleOpts` w tej samej ścieżce | rozłączne ścieżki Auto vs taktyczna |
| Teren wzgorza + obrona miasta bez muru | teren **wyłączony** (`cityGatedTerrainMultiplier` → 1.0) |
| `siege.ts` `cityDefenseBonus` płaski mur | **wyzerowany** w danych (`wall_base_obrona=0`); nie używany w `main.ts` map battle |

Test regresji: `node tools/city-defense-terrain-gate-test.cjs` — **31/31 PASS** (2026-08-06).

### 2. Czy `bonusWalka` dokłada się cicho do MP?

**NIE.** MP jest wykluczone w `qualifiesForMajorAiDifficultyBonus` (`!isCityState`).  
Dla **major AI** na poziomie Trudnym gry: **+5%** do `meleeDefence` (i ataku) — **bez komunikatu w UI** — to zamierzone `P-AI-MOC-BONUS=A`, nie dotyczy MP.

---

## Dlaczego obrona „bez muru” może wydawać się zawyżona (hipoteza playtestu)

1. **+50% Obrony garnizonu** — największy ukryty składnik; działa gdy AI trzyma wojsko w koszarach miasta bez palisady/murów. Brak w preBattle rozbicia bonusów.
2. **Palisada (+100%)** — gracz widzi „brak kamiennego muru”, silnik widzi budynek obronny.
3. **Milicja** — przy `garnizon>0` i braku jednostek w zasięgu pojawia się syntetyczny obrońca z dużym HP (20% populacji × ½ Wojownika).
4. **Roster dist≤1** — kilka jednostek AI na sąsiednich heksach = suma M, każda z +50% jeśli w garnizonie.
5. **Bonusy cyw** — np. +20% Obrony piechoty (Grecja) na obrońcy w mieście.

To **nie jest podwójny bug**, tylko **stack zamierzonych mechanik** bez transparentności w UI.

---

## Różnice MP vs major AI (obrona bez muru)

| Aspekt | Miasto-państwo (MP) | Major AI |
|--------|---------------------|----------|
| `bonusWalka` | ×1 (brak) | ×1,05 na Trudnym (globalna trudność gry) |
| Garnizon +50% | tak | tak |
| Milicja | tak | tak |
| Trudność suwaka | `_menuCityStateDifficulty` (ekonomia/AI, nie walka) | `_menuDifficulty` |
| AI pod zagrożeniem (P-AI-008) | mury+garnizon | jednostki+rozwój (nie mury) |

---

## Dowód kodu (kluczowe punkty)

```17:22:gra/src/game/ai-difficulty-bonus.ts
export function qualifiesForMajorAiDifficultyBonus(
  ownerId: number,
  isCityState: boolean,
): boolean {
  return ownerId > 0 && !isBarbarian(ownerId) && !isCityState;
}
```

```131:136:gra/src/game/city-defense.ts
export function shouldApplyGarrisonFortifyBonus(
  builtBuildingIds: readonly string[] | null | undefined,
  params: CityDefenseBonusParams,
): boolean {
  return cityWallDefenseBonusPercent(builtBuildingIds, params) === 0;
}
```

```5493:5497:gra/src/main.ts
    function combatPowerScaledDefFor(u: RuntimeUnit): Record<string, unknown> {
      const def = fortifyFieldScaledDefFor(u);
      return applyDifficultyCombatToUnitDef(def, difficultyCombatMultForOwner(u.ownerId));
    }
```

---

## Propozycja ABC (do decyzji Macieja)

**[TEMAT: Obrona miasta bez murów — balans/UX]** `R-OBRONA-MIASTA-MP`

- **A)** Zostawić mechanikę; dodać w preBattle **rozbicie bonusów** (garnizon +50%, cyw, weteran, liczba obrońców).
- **B)** Obniżyć `fortify_obrona_proc` dla garnizonu bez muru (np. 50% → 25%) — tylko gdy `cityWallDefenseBonusPercent===0`.
- **C)** Wyłączyć milicję przy ataku z mapy (tylko realne jednostki) — większa zmiana gameplayu.

**Rekomendacja Operatora:** **A** najpierw (UX bez ryzyka regresji); **B** dopiero po playteście z widocznym rozbiciem.

---

## ECHO — R-OBRONA-MIASTA-MP-Q1 (2026-08-06)

**Status:** 🟡 **ZAPISANA** · **A**  
**Cytat Macieja:** „Zostawić mechanikę; dodać w preBattle **rozbicie bonusów** (garnizon +50%, cyw, weteran, liczba obrońców)"

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-OBRONA-MIASTA-MP-Q1** | **A** | Mechanika obrony bez murów **bez zmian** (`fortify_obrona_proc=50`, milicja, roster dist≤1). W ekranie przed bitwą (preBattle) dodać **widoczne rozbicie** składników: garnizon +50%, bonus cywilizacji, weteran, liczba obrońców. |

Gracz widzi, skąd bierze się siła obrony — bez obniżania bonusów ani wyłączania milicji. Czeka na hasło **`działaj`** → AutoBot Operator (🟡 cross — UI preBattle + logika walki).

---

## AutoBot — metryki audytu

| Metryka | Wynik |
|---------|-------|
| `city-defense-terrain-gate-test.cjs` | 31/31 PASS |
| Zmiany `gra/src` | 0 (tylko docs) |
| Deploy | NIE |
