# UNITS → INTEGRATOR F — balans parametrów TW v3 (2026-06-30)

| Pole | Wartość |
|------|---------|
| **Status** | **WPIĘTE** — kanon md5 `3DAE1AA5C463CFD9E90F77C5D2DCFC76` (2026-06-30) |
| **Decydent** | Maciej — temat **ZAMKNIĘTY** (strojenie parametrów) |
| **Flaga** | GOTOWE |
| **Batch** | `TW-v3-BALANS-units-json` |

---

## 1. Co przesyłam

Pełny balans **50 jednostek** wpisany do kanonu danych. **Bez zmian w `main.ts`** — silnik już czyta pola EN z `units.json` (TW v3 F3). Integrator: **build + bramka testów + publikacja kanonu**.

| Plik | Zmiana |
|------|--------|
| `gra/data/units.json` | **186 pól** combat EN zaktualizowanych · marker `_tw_v3_balans: 2026-06-30` |
| `gra/data/units.json.bak-BALANS-2026-06-30` | backup przed apply |
| `gra/tools/gen-jednostki-excel-pelny.py` | źródło PROPOZYCJA + `--apply-json` + eksport Excel |
| `gra/tools/migrate-units-tw-v3.py` | OVERRIDES Hastati + Konnica (anty-regresja) |
| `gra/tools/Jednostki-parametry-TW-v3-STAN.xlsx` | Excel 3 zakładki (Atak/Obrona/Pozostałe) |
| `gra/tools/Jednostki-parametry-TW-v3-PROPOZYCJA.xlsx` | + zakładka Moc M (archiwum decyzji) |
| `gra/tools/unit_power.py` | wzory M pole / M_siege (narzędzia, nie w grze) |
| `docs/WALKA-TW-v3.md` | skróty AP/OBR/Obraż · wallAttack oblężnicze |
| `panele-sterowania/Panel-C.xlsx` | **zsynchronizowany** z JSON (gen-panel-c 2026-06-30) · wallAttack w Jednostki-staty |
| `panele-sterowania/TW-dystans-edycja.xlsx` | edycja dystansu + wallAttack oblężniczych |
| `panele-sterowania/gen-panel-c.py` | JSON → Panel-C · poprawione `is_combat_unit` (Oblężnicza, Dystans AP=0) |
| `panele-sterowania/import-dystans-edycja.py` | wallAttack dla Katapulta/Taran/Wieża (nie kasuje już Taran/Wieży) |

**Nie w scope tego batcha:** auto-walka na sumie M w `main.ts` · macierz ÷10 · zmiany `combat.ts` (już TW v3).

---

## 2. Co INTEGRATOR ma zrobić

### Krok 1 — Weryfikacja (read-only)

```powershell
cd gra
node tools/combat-test.cjs    # oczekiwane: 6/6
node tools/smoke.cjs
```

Opcjonalnie porównaj bundlowany JSON w kanonie vs `gra/data/units.json` (np. Hastati `meleeAttack=7`, Konnica `meleeAttack=8`).

### Krok 2 — Build kanonu

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
# skopiuj $env:TEMP\civ-dist\Gra-podglad.html → root projektu
```

**Backup przed publikacją:** `cp Gra-podglad.html Gra-podglad.html.bak-BALANS-2026-06-30`

### Krok 3 — Bramka + meldunek

- [ ] `combat-test.cjs` 6/6 · `smoke.cjs` OK
- [ ] md5 checkpoint w `SILNIK-DO-MASTERA.md`
- [ ] Opus review (jeśli gate aktywny) — diff głównie danych JSON w bundlu
- [ ] Meldunek: `→ MASTER: GOTOWE-KANON TW-v3-BALANS`

**NIE edytuj** statów w `units.json` — zamknięte przez Macieja.

---

## 3. Kluczowe decyzje gameplay (do smoke / playtest)

| Temat | Ustalenie |
|-------|-----------|
| **Hastati < Triari** | Hastati M=**50** (A=24.5) · Triari M=**51.5** (A=27) · pilum AD=**8** |
| **Konnica** | AP **8** (było 30 playtest) · M≈42 |
| **Kulturowe wręcz** | AP 5–8 (skala TW, nie ÷10) |
| **Rydwany top Brąz** | M **40–43** (HP 26–30, szarża 8–10) — Shang 43, Falanga 45 |
| **Super-y (7×)** | bez zmian · AP 8–10, Obraż 10 |
| **Oblężenie** | wallAttack: Katapulta 16, Taran 14, Wieża 6 |
| **Dystans** | słabe M na polu — **zamierzone** (moc z AD w walce, nie w rankingu M) |
| **Oblężnicze na polu** | nie wchodzą do sumy M armii (osobny M_siege — przyszła auto-walka) |

---

## 4. Top ranking M (pole) — po balansie

| M | Jednostka |
|--:|-----------|
| 55.5 | Medżaj |
| 52.5 | Gwardia Sumeru, Hieros Lochos |
| 52 | Królewska Gwardia |
| 51.5 | Triari |
| 51 | Hu Ben Wei |
| 50.5 | uThulwana |
| **50** | **Hastati** |
| 45 | Falanga |
| 43 | Rydwan Shang |
| 42 | Konnica |

Pełna tabela: Excel `Jednostki-parametry-TW-v3-STAN.xlsx` · zakładka M w PROPOZYCJA.

---

## 5. Pola JSON (EN) — co silnik konsumuje

| JSON | Skrót | Użycie |
|------|-------|--------|
| `meleeAttack` | AP | hit% wręcz |
| `meleeDefence` | OBR | obrona wręcz |
| `weaponDamage` | Obraż | dmg broni |
| `armor` | Panc | redukcja dmg |
| `piercing` | Przeb | vs pancerz |
| `chargeBonus` | Szarża | szarża r1 |
| `health` | HP | wytrzymałość |
| `missileAttack` | AD | dystans / pilum |
| `wallAttack` | — | oblężenie (Katapulta/Taran/Wieża) |

Mapowanie w grze: `combatUnitFromDef` · `unitDefFor` · `battleUnitToCombatUnit` · `runtimeUnitToSiegeUnit` (już EN).

---

## 6. DoD (Definition of Done)

- [ ] Kanon `Gra-podglad.html` zawiera nowy `units.json` (spot-check: Hastati AP=7, Konnica AP=8, Rydwan Shang HP=30)
- [ ] Testy 6/6 + smoke OK po buildzie
- [ ] md5 zapisany · stary kanon = backup `.bak-BALANS-2026-06-30`
- [ ] **Brak** zmian w `main.ts` poza ewentualnym fixem jeśli bundler nie ładuje JSON (nie oczekiwane)

---

## 7. Eskalacja

| Problem | Działanie |
|---------|-----------|
| Test combat fail po buildzie | Porównaj bundlowany JSON vs `gra/data/units.json` · NIE „naprawiaj” statów — eskalacja do UNITS/Maciej |
| Playtest: jedna jednostka off | Notatka Maciejowi · **nie** łataj JSON bez decyzji |
| Auto-walka M | **Osobny batch** — poza tym handoffem |

---

## 8. Panel sterowania (Grupa C) — workflow po balansie

**Kanon danych jednostek = `gra/data/units.json`.** Panel-C to lustro do edycji w Excelu.

| Kierunek | Komenda | Kiedy |
|----------|---------|-------|
| JSON → Excel | `python panele-sterowania/gen-panel-c.py` | Po apply balansu / migracji (wykonane 2026-06-30) |
| Excel → JSON | `python panele-sterowania/export-c.py` | Maciej edytuje kolumnę **Wartość** w Panel-C |
| Dystans/AD | `export-dystans-edycja.py` → edycja → `import-dystans-edycja.py` | Korekty zasięgu, pocisków, missileAttack, wallAttack |

**Roundtrip:** `export-c.py` po `gen-panel-c.py` → **0 zmian** (OK 2026-06-30).

**wallAttack** w arkuszu **Jednostki-staty** (kolumna „Atak vs Mur"): Katapulta 16, Taran 14, Wieża 6.

**NIE** używać legacy `export-data.py` / `Jednostki.xlsx` dla statów walki — tylko Panel-C + export-c.

---

