# MACIEJ → MASTER: B5-Spichlerz SP1–SP6 (playtest follow-up)

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE-do-dispatch** — decyzje ABC zamknięte |
| **Data** | 2026-07-01 |
| **Od** | Maciej (decydent) — **bez wklejania do czatu Master** |
| **Kanon źródłowy** | `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` |
| **Formularz** | `docs/decyzje/B5-spichlerz-FORMULARZ-SP1-SP6.md` |

---

## TL;DR dla Mastera

Maciej **zatwierdza model B5-SPICH** (SP1=A) i doprecyzowuje **UI + limit zapasów armii**. Wymaga **nowego batcha** (lane B + UI/A → potem F). **Nie blokuje** P5/P6 dyplomacji — może iść równolegle (inne pliki).

---

## Decyzje (pełny zapis)

```
SP1=A SP2=A SP3=A SP4=C SP5=A SP6=C
SP6-overflow=A  SP4-szczegoly=A  SP6-HUD=B
```

| ID | Litera | Ustalenie |
|----|--------|-----------|
| **SP1** | A | Sign-off modelu (bufor + Spichlerz + zapasy) |
| **SP2** | A | 50% bufora po wzroście (ze Spichlerzem w mieście) |
| **SP3** | A | ≥1 Spichlerz w imperium → kumulacja 📦 dla całej armii |
| **SP4** | C | **📦 Zapasy armii tylko na HUD mapy** (nie panel miasta) |
| **SP4-szczegóły** | A | Bez 📦 nawet w „Spichlerz — szczegóły”; panel = bufor 🍞 + suwak |
| **SP5** | A | Domyślny suwak **70/30** (pyt. 10A bez zmian) |
| **SP6** | C | Limit **100 🍞 × liczba Spichlerzy** w państwie (2→200) |
| **SP6-overflow** | A | Nadwyżka powyżej limitu **przepada** co turę |
| **SP6-HUD** | B | HUD mapy: **`142 / 200`** (zapis + max) |

**Odłożone:** upgrade poziomów Spichlerza (większa pojemność) — osobna decyzja przy batchu budynków.

---

## Co Master ma zrobić (krok 1–2, bez pytania Macieja)

1. **ACK** — wpis `DZIENNIK-MASTERA.md` + `MASTER-WATCH.md`
2. **Dyspozycje lane** (równolegle):
   - `MASTER-do-EKONOMIA_B5-spichlerz-SP-limit-2026-07-01.md`
   - `MASTER-do-UI_B5-spichlerz-SP-hud-2026-07-01.md`
3. Po **GOTOWE** B + UI → dyspozycja F:
   - `MASTER-do-INTEGRATOR_B5-spichlerz-SP-followup-2026-07-01.md`
4. Aktualizacja kanonu decyzji: sekcja w `B5-spichlerz-wzrost-ludnosci.md`
5. Slack: `docs/obieg/SLACK-OUTBOX-MASTER-2026-07-01.md` (wiadomość #master + #grupa-b + #grupa-a)

---

## AC Master (sign-off batchu po F)

- [ ] Limit 100×Spichlerze + overflow przepada (testy empire-food)
- [ ] HUD `zapasy / max`; panel bez chipa 📦
- [ ] Suwak 70/30 w panelu bez regresji (9A)
- [ ] Bramka zielona → review → promocja kanon

---

## Powiązania

| Batch | Relacja |
|-------|---------|
| P3 B-B5-SPICHLERZ | ✅ w kanonie `7db15616…` — **ten batch = amendement SP4/SP6** |
| P5/P6 dyplomacja | niezależne — nie czekać |

**Flaga:** `→ MASTER: DECYZJE-B5-SP` · Master czyta repo na `start` / `slack`
