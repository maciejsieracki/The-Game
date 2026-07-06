# D-MAPA-BRZEg — Linia brzegowa (piasek + wybrzeże)

> **Status:** 🟢 **ZAMKNIĘTE** · Maciej **2026-07-03**  
> **Kontekst:** 6 iteracji A-COAST-SAND v2–v6 — testy OK, playtest wizualny FAIL (klif, cienki pasek)

---

## Pytanie

Jak ma wyglądać **styk lądu z morzem** (piasek / wybrzeże jasnoniebieskie)?

---

## Opcje

| ID | Opis |
|----|------|
| **A** | **Plaża na lądzie** — ostatni pierścień heksów lądu przy morzu: piaskowy kolor **górnej powierzchni** |
| **B** | **Szeroka plaża na Wybrzeżu** — cała góra heksa Wybrzeże = piasek; woda tylko od strony Morza |
| **C** | **Hybryda A+B** — piasek na lądzie **i** na Wybrzeżu + łagodniejszy profil (mniej „klifu” między heksami) |

---

## Decyzja Macieja

**C — Hybryda A+B**

---

## Implikacje dla lane MAPA

1. **Nowy batch architektury** — nie kolejny patch v7 na cienkich paskach krawędzi.
2. **Render:** nakładka piasku na **suchym lądzie** sąsiadującym z Wybrzeżem + pełna powierzchnia piasku na Wybrzeżu + obniżenie „schodka” profilu 3D.
3. **DoD:** akceptacja **screenshotem** z gry (nowa mapa), nie tylko `map-coast-buffer-test`.
4. **Handoff:** `dyspozycje/_handoff/MASTER-do-MAPA_brzeg-hybrid-C.md`

---

## Powiązane (osobna decyzja)

**D-MAPA-DELTA** — ujście rzeki / delta — **OTWARTE** (Maciej nie wskazał litery).
