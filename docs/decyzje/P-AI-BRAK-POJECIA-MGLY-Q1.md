# P-AI-BRAK-POJECIA-MGLY-Q1 — mgła wojny AI

**Status:** ✅ GOTOWE / ZAMKNIĘTE — wdrożone w ROBOCZA FALA 292, zachowane w aktualnej FALI 294
**Decyzja właściciela:** **A+C**  
**Rejestry:** `dyspozycje/REJESTR-PROSB-I-ZADAN.md` · `docs/obieg/REJESTR-DECYZJI.md` · `dyspozycje/REJESTR-PROBLEMOW-AI.md`

**Dowód wdrożenia i weryfikacji:** ROBOCZA FALA 292 (`90b6508d`, pełny md5
`90b6508d06cc652f598addb8c2b3b266`), zachowana w aktualnej ROBOCZA FALI 294
(`a0f804d7593333e34c989dc3565cb0c6`, `VERIFY OK`). Evaluator: **PASS-WITH-NOTES**.
Testy powtórzone 2026-08-18: `ai-fog-test.cjs` **8/8** oraz
`bitwa-mapa-kamera-blokada-test.cjs` **24/24**; `npx tsc --noEmit` **PASS**.
Save/load obejmuje pusty default dla starego zapisu oraz round-trip pamięci celu
(W5 testu mgły AI).

## ECHO (cytat)

> „połączenie A+C:
> - AI ma własną mgłę wojny liczona per owner;
> - AI może pamiętać wcześniej poznane cele i planować do ich ostatniej znanej pozycji;
> - AI może wykonać atak/akcję przeciw celowi wyłącznie po ponownym wykryciu go w aktualnej widoczności;
> - brak pełnej informacji AI poza widocznością.”

## Precyzyjny kontrakt wdrożeniowy

1. **Widoczność per AI:** dla każdego ownera AI obliczana jest osobna widoczność z jego aktualnych jednostek i miast, według istniejących reguł zasięgu widoczności. Widoczność gracza nie jest używana jako widoczność AI.
2. **Pamięć celu:** AI przechowuje per owner i per cel ostatnią znaną pozycję celu (`q`, `r`) oraz typ celu (jednostka/miasto), gdy cel został wykryty. Pamięć może służyć wyłącznie do planowania i ruchu w kierunku ostatniej znanej pozycji.
3. **Warunek ponownego wykrycia:** przed wykonaniem ataku lub innej akcji wymierzonej w konkretny cel silnik wymaga, aby cel o tym samym identyfikatorze był obecny i widoczny w bieżącym snapshotcie widoczności atakującego ownera. Sama pamięć celu nigdy nie wystarcza do egzekucji ataku/akcji.
4. **Brak teleportu i zmiany zasięgu:** ruch do ostatniej znanej pozycji podlega obecnej ścieżce ruchu; zasięg ataku i istniejące bramki wojny pozostają bez zmian.
5. **Save/load:** pamięć jest częścią snapshotu zapisu i ma bezpieczny domyślny pusty stan dla starych zapisów (`??`), bez wyjątku przy migracji.
6. **Zakres:** tylko widoczność AI, pamięć celów, cele `enemyUnits`/`enemyCities`, save/load i testy. Bez zmian barbarzyńców i bez rozszerzania systemu mgły gracza.

## Kryteria akceptacji

- widoczny cel może zostać wybrany i zaatakowany zgodnie z dotychczasowym zasięgiem;
- niewidoczny cel nie jest wybierany do ataku ani atakowany;
- ostatnio znany cel może być celem planowania, ale nie ataku bez ponownego wykrycia;
- ownerzy AI zachowują parytet;
- stary save bez pamięci celu wczytuje się bez crasha;
- testy obejmują minimum dwa edge case’y i mutację.
