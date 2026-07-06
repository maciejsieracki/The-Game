# CYWILIZACJE → MASTER (+ Grupa D): miasta = kopie typu

**Data:** 2026-06-27 · **Od:** Maciej (decyzja produktowa) · **Status:** **SPEC GOTOWY — implementacja CZEKA**

**Dokument kanon:** `docs/decyzje/D-START-miasta-kopie-typu.md`  
**Charter Grupa D:** `docs/grupa-d/MODELE-MIAST-TYPU.md`

---

## Co przekazujemy

Maciej doprecyzował **czym są miasta AI na mapie**:

1. **Kopie typu** — ten sam `ikonaId`, bonusy, gospodarka, religia co cywilizacja z `civs.json`.
2. **Symetria** — Chińczycy na mapie = klaster chińskich nazw, **tak samo** jak greccy rywale wokół gracza.
3. **Cel** — **zdobyć** (wojna/oblężenie); nie pełne imperium AI.
4. **AI** — **defensywne**, bez zakładania miast, bez ekspansji.

---

## Podział pracy

| Lane | Zadanie | Flaga |
|------|---------|-------|
| **CYWILIZACJE** | Profil AI `kopia_typu_obronna` w arkuszu + `ai.ts` gałąź defensywna; audyt `civBonusyForOwnerId` | **ROBIĄ** |
| **MAPA** | Spawn **wszystkich** miast klastra per obcy typ (nie tylko stolica) | **CZEKA** |
| **SILNIK** | Wpięcie rozszerzonego spawnu + flaga owner `isTypCityCopy` | **CZEKA handoff** |
| **UI** | Etykiety już OK (N-2A / pełna nacja) | **WPIĘTE** |

---

## Kontrakt techniczny (propozycja dla SILNIK)

```typescript
interface TypCityOwnerMeta {
  ownerId: number;
  typIkonaId: string;
  isSameTypeRival: boolean;  // klaster gracza
  isTypCityCopy: boolean;     // true = defensywny AI, brak ekspansji
  displayName: string;        // N-2A lub Cywilizacja
}
```

**DoD CYWILIZACJE → SILNIK:**
- [ ] `decideAITurn` pomija ekspansję gdy `isTypCityCopy`
- [ ] Test 20 tur: żadne miasto-kopia nie zakłada nowego miasta
- [ ] Obcy typ: ≥ pozycje klastra − 1 miast AI na starcie (po MAPA)

---

## Ryzyko

Obecny `cluster-start.ts` spawnuje **1 miasto** per obcy typ — **nie spełnia** pełnej wizji Macieja. Priorytet: MAPA rozszerzy `buildClusterSpawnPlan`, potem SILNIK.

**Flaga:** GOTOWE (spec) · CZEKA (kod pełny klaster + AI defensywne)
