# MASTER → SILNIK: Podział pracy miasta — suwak balance (Budynki ↔ Ulepszenia)

**Data:** 2026-06-27 · **Priorytet:** P1 (playtest UX) · **Decydent:** Maciej (akceptacja układu)  
**Flaga:** **GOTOWE-do-wpiecia** — kod w repo (MASTER 2026-06-27); SILNIK: build ROBOCZA + meldunek.

---

## Kontekst (gameplay)

**Praca miasta** (yield `praca` z obrabianych pól) dzieli się na:

| Strona | % | Efekt w silniku |
|--------|---|-----------------|
| **Budynki** | `procentBudynki` | Kolejka produkcji budynków (`advanceProduction`, `splitPraca` → `doBudynkow`) |
| **Ulepszenia** | `100 − procentBudynki` | Praca w terenie — budowa ulepszeń heksów (`splitPraca` → `doPuli`) |

Model już istnieje w ekonomii; problem = **UI nie pokazuje obu stron naraz** — gracz widzi tylko „Budynki 80%” i mały „Teren: 20%” pod spodem, więc nie widać, że to jeden suwak 100%.

**Wzór UX (Maciej):** jak para podatki ↔ handel — po lewej i prawej **etykieta + %**, suwak między nimi, intuicyjnie „więcej tu = mniej tam”.

---

## Co SILNIK ma zrobić

### 1. Panel miasta — `gra/src/ui/cityPanel.ts`

Funkcja: `renderPodzialPracy()`.

**Wymagany układ:**

```
PODZIAŁ PRACY
Budynki                    Ulepszenia
 80%                           20%
|========●====================|
Praca miasta: kolejka budynków ↔ ulepszenia na polach (razem 100%)
```

| AC | Kryterium |
|----|-----------|
| AC-1 | Lewa kolumna: etykieta **Budynki** + **%** (kolor gold) |
| AC-2 | Prawa kolumna: etykieta **Ulepszenia** + **%** (kolor blue) — **nie** „Teren” w małym druku pod suwakiem |
| AC-3 | Oba % aktualizują się live przy ruchu suwaka; suma = 100% |
| AC-4 | Suwak `range` 0–100, step 5; wartość = `procentBudynki` |
| AC-5 | Hint pod suwakiem: że to **praca miasta**, oba cele, razem 100% |
| AC-6 | Miasto AI: tylko odczyt obu % (bez suwaka) |

**Callback (bez zmian kontraktu):**

```ts
cfg.onPodzialPracyChange?.(city.id, { procentBudynki: v });
```

### 2. Weryfikacja haka — `gra/src/main.ts`

Sprawdź / utrzymaj:

- `onPodzialPracyChange` zapisuje `city.podzialPracy.procentBudynki`
- `getPodzialPracy` zwraca stan do panelu
- Po zmianie: odśwież HUD; produkcja budynków w turze korzysta z `splitPraca` w `turn-economy.ts`

**Nie zmieniaj** logiki `splitPraca` / `advanceProduction` — tylko UI + ewentualnie `rerender` panelu jeśli brakuje.

### 3. Build playtest

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
Copy-Item $env:TEMP\civ-dist\index.html ..\Gra-podglad-ROBOCZA.html -Force
```

Meldunek md5 w `SILNIK-DO-MASTERA.md`.

---

## Pliki (wyłączna edycja batch)

| Plik | Rola |
|------|------|
| `gra/src/ui/cityPanel.ts` | UI suwaka (SILNIK może edytować w batch integracyjnym) |
| `gra/src/main.ts` | tylko jeśli brak haka / brak odświeżenia |

**NIE ruszać:** `economy.ts`, `turn-economy.ts`, `production.ts` (logika OK).

---

## DoD

- [ ] Playtest: panel miasta → oba % widoczne symetrycznie
- [ ] Przesunięcie suwaka: Budynki↑ = Ulepszenia↓ (i odwrotnie)
- [ ] `smoke.cjs` OK
- [ ] `Gra-podglad-ROBOCZA.html` zaktualizowany
- [ ] Wpis w `SILNIK-DO-MASTERA.md` (append-only)

---

## Po PASS

Opus review opcjonalny (tylko UI) → wpisanie do kanonu przy najbliższym batch SILNIK.
