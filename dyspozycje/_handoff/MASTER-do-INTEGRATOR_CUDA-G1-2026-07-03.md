# MASTER → INTEGRATOR F: CUDA-G1 wonder-availability (build + ROBOCZA)

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **START** |
| **Data** | 2026-07-03 |
| **Trigger** | Maciej `start` · handoff CYWILIZACJE GOTOWE |
| **Kanon bazowy** | md5 **`2a786b9f4f0ce934cd24eac5c434324a`** (W3-DIM + Wiki) |

---

## Zakres

**Handoff lane:** `CYWILIZACJE-do-MASTER_cuda-g1-wonder-availability.md`

Kod **już w `main.ts`** (CUDA-G1 wiring + picker `#civ-wonders-picker`). F **nie dodaje** logiki — tylko:

1. **Backup:** `cp gra/src/main.ts gra/src/main.ts.bak-CUDA-G1-2026-07-03`
2. **Weryfikacja** scope (brak regresji poza cudami)
3. **Bramka** (patrz niżej)
4. **Publish ROBOCZA:** `.\tools\bramka-test-publish.ps1`

**NIE** dotykać root `Gra-podglad.html` / `gra-kanon/` — tylko Master po review.

---

## Bramka (obowiązkowa)

```
node tools/wonder-availability-test.cjs    # 7/7
node tools/civ-entry-epoch-test.cjs        # jeśli istnieje
node tools/wonder-civ-tech-test.cjs        # jeśli istnieje
.\tools\bramka-test-publish.ps1
```

Oczekiwane: logic · smoke · battle-smoke PASS · **nowy md5 ≠ `2a786b9f…`**

---

## DoD bundle

- [ ] `Gra-podglad-ROBOCZA.html` / `gra-robocza/` zawiera `civ-wonders-picker` / `__wonder__`
- [ ] `completedWorldWonders` w save meta (grep bundle)
- [ ] `ROBOCZA-MANIFEST.json` zaktualizowany

---

## Meldunek

`dyspozycje/_handoff/F-do-MASTER_CUDA-G1-2026-07-03.md` → **GOTOWE-ROBOCZA**

**NIE** proś Macieja o playtest — kończ na meldunku.
