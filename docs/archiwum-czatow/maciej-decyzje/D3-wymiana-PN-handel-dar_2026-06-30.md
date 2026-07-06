# LANE-D3 — Wymiana PN, handel, dar, Zaufanie

## Metadane

| Pole | Wartość |
|------|---------|
| **Rola** | MACIEJ (decyzje) + LANE-D / CYWILIZACJE (implementacja katalogu) |
| **Temat czatu** | Grupa D — dyplomacja, cennik wymiany, PN → Zaufanie |
| **Data sesji** | 2026-06-26 … 2026-06-30 |
| **Data archiwum** | 2026-06-30 |
| **Powiązane pliki** | `docs/decyzje/D3-dyplomacja.md`, `docs/decyzje/D3-wymiana-OTWARTE-ABC.md`, `gra/src/game/diplomacy-value-catalog.ts`, `gra/data/diplomacy.json` |
| **Handoffy** | `dyspozycje/_handoff/CYWILIZACJE-do-UI_handel-koszyk-pn.md`, `dyspozycje/_handoff/CYWILIZACJE-do-INTEGRATOR_wymiana-pn-zaufanie.md` |

---

## Podsumowanie sesji

- Ustalono **wspólny katalog punktów wartości (PN)** dla handlu, daru i przekupstwa — każda pozycja w koszyku ma cenę.
- **Handel** = główna ścieżka poprawy relacji; **dar** = rzadszy, ten sam cennik.
- **Nadmiar** ponad uczciwą wymianę (po kursie Relacji) podnosi **Zaufanie**; Respekt się nie zmienia.
- Kurs: **100 punktów wartości = +1 Zaufanie**; limit **+5 Zaufanie na turę** z handlu + darów łącznie (nie da się „kupić" relacji jednym przelewem).
- Zatwierdzono cennik: ulepszenie terenu, jednostka, budynek, dostęp boolean surowca (D3-KATALOG-PN).
- Zatwierdzono **żywność** w handlu: **1 PN = 4 żywności** ze spichlerza.
- Odrzucono na v1.0: punkty nauki, kultura, sprzedaż miasta, przetworzone dobra.
- Dostęp do złoża: **trwały**, ale **traci ważność w wojnie** — po pokoju trzeba **zawrzeć na nowo**.
- Kod katalogu PN + testy **41/41**; wpięcie UI + silnik — **delegowane** handoffem 2026-06-30.

---

## Decyzje Macieja (pełna lista)

| ID | Temat | Decyzja |
|----|--------|---------|
| D3-KATALOG-PN | Cennik pozycji | ulepszenie=koszt Pracy; jednostka=koszt Pieniądz; budynek=koszt budowy×1,10^L; surowiec=min ulepszenia |
| D3-PN-REL-ZASADA | Kierunek | dar głównie w handlu (nadmiar); czysty dar rzadki |
| D3-PN-ZAUFANIE | Kurs + limit | 100 PN = +1 Zauf.; max +5/turę |
| D3-W1 | Bonus przy handlu | **A** — tylko nadmiar, bez stałego +2 |
| D3-W2 | Dobra wola | **C** — +1/turę × 3 gdy nadmiar ≥ 100 PN |
| D3-W3 | Próg daru | **B** — Relacja ≥ 30 |
| D3-W4 | Fair deal | **A** — ścisłe sumy PN |
| D3-W5 | Próg tech | **A** — Relacja ≥ 100 |
| D3-W6 / W6b | Żywność | **Tak** — 1 PN = **4** żywności |
| D3-W7 | Punkty nauki | Nie v1.0 |
| D3-W8 | Kultura | Nie v1.0 |
| D3-W9 | Sprzedaż miasta | Nie v1.0 |
| D3-W10 | Dostęp złoża | **A+** — trwały; w wojnie utrata; po pokoju renegocjacja |
| D3-W11 | Przetworzone | Nie v1.0 |

**Pakiet:** `D3-W1=A, D3-W2=C, D3-W3=B, D3-W4=A, D3-W5=A, D3-W6b=C, D3-W10=A+, D3-W11=A`

---

## Następne kroki

1. **UI** — koszyk dwukolumnowy + podgląd PN/nadmiaru/Zaufania (`CYWILIZACJE-do-UI_handel-koszyk-pn.md`).
2. **Integrator F** — handler dealu, limit tur, dobra wola, wojna/złoże, zamiana flat +6 (`CYWILIZACJE-do-INTEGRATOR_wymiana-pn-zaufanie.md`).
3. Review subagent → kanon `Gra-podglad.html`.
4. Playtest Macieja: hojny handel, dar od Rel 30, utrata złoża w wojnie.

---

## Notatki techniczne

- Moduł: `gra/src/game/diplomacy-value-catalog.ts`
- Parametry: `diplomacy.json` → `pn_relacja`, `wartosc_katalog.pn_zywnosc`, `dostep_zloze_wojna`
- Test: `node gra/tools/diplomacy-value-catalog-test.cjs` → 41 pass
- Stary kod: `diplomacy.ts` case `'dar'` → flat +6 — **do usunięcia** przy wpięciu

---

## Eksport pełny (Cursor UI)

```
(wklej tutaj pełny eksport z Cursor — menu ⋯ → Export)
```
