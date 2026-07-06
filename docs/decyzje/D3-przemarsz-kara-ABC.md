# D3 — kara za nieautoryzowany przemarsz — ZAMKNIĘTE

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 ZAMKNIĘTE — Maciej 2026-06-30 |
| **Powiązane** | D3-PROG-G1 (próg umowy granic Rel ≥ 100), akcja 4 w `diplomacy.json` |
| **Zastępuje** | Opis Excela „−15 Relacja/tura” (nie było w kodzie) |

## Odpowiedzi Macieja

| ID | Wybór | Skutek |
|----|-------|--------|
| **D3-BORD-A** | **−5 Zaufanie / turę** | Kara dotyczy **tylko Zaufania** (bez dodatkowej Relacji ogólnej) |
| **D3-BORD-B** | **A** | Tylko −5 Zaufanie/turę (bez −5 Relacji) |
| **D3-BORD-C** | **A** | **Koniec tury:** jednostka na **cudzym terytorium** bez ważnego traktatu |

---

## Reguła produktowa (v1.0)

1. **Kiedy:** na **końcu tury** gracz (lub AI) ma co najmniej jedną jednostkę na heksie w **terytorium obcej cywilizacji** (neutralnej w sensie „nie moja”), **bez** uprawnienia do ruchu.
2. **Kara:** **−5 Zaufanie** u **właściciela terytorium** (para intruz → właściciel). **Raz na turę na parę** — wiele jednostek tego samego intruza u tego samego właściciela **nie** mnoży kary.
3. **Relacja ogólna** spada pośrednio (Zaufanie −5 → Relacja −5), **bez** osobnej kary na Relacji.
4. **Parametr JSON:** `karaPrzemarszNieautoryzowany_zaufanie_perTura: 5` w `diplomacy.json` → `params`.

### Wyjątki (brak kary)

| Sytuacja | Uzasadnienie |
|----------|--------------|
| **Wojna** aktywna między intruzem a właścicielem | Inwazja — nie „przemarsz dyplomatyczny” |
| Traktat **Otwarte granice** (`OtwartGranice`) | Jednostki **cywilne** (i wojsko, jeśli umowa obejmuje oba — patrz payload `borderMilitary`) |
| Traktat **Prawo wojskowego przemarszu** (`PrawoWojskowePrzemarszu`) | Wojsko |
| **Sojusz** wojskowy aktywny | Domyślnie jak prawo przemarszu (TW) |
| **Wasal** z prawem przemarszu u suzerena | Jak w efekcie akcji 12 |
| Heks **poza** terytorium żadnego miasta (dzicz, morze bez claimu) | Nie dotyczy |
| Własne terytorium / terytorium wasala pod kontrolą intruza | Nie dotyczy |

### Typ jednostek

- **Wojsko i cywile** — ta sama reguła; **rodzaj dostępu** rozróżnia wymagany traktat (cywilne = Otwarte granice; wojsko = Prawo przemarszu **lub** sojusz).
- Ruch **nie jest blokowany** w v1.0 — kara **tylko reputacyjna** (zgodnie z opisem akcji 4).

### Poza zakresem v1.0 (nie teraz)

- Eskalacja po N turach (casus belli / ultimatum AI)
- Komunikat modal przy pierwszym wejściu
- Blokada pathfindingu na obcym terytorium

---

## Implementacja (kolejka)

| Lane | Zadanie |
|------|---------|
| **UNITS** + **MAPA** | Wykrycie: heks ∈ terytorium ownerId ≠ moverId; koniec tury |
| **CYWILIZACJE** | Sprawdzenie traktatów / wojny; `applyRelationDelta` −5 Zauf. |
| **UI** | Opcjonalnie: wpis w logu tury / HUD (P2) |
| **Integrator F** | Hook w `endTurn` jeśli wymaga `main.ts` |

Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-UNITS_przemarsz-kara-zaufanie.md`

---

## Porównanie z Excel / stary opis

| Źródło | Wartość |
|--------|---------|
| Excel / opis akcji 4 (przed) | −15 **Relacja**/turę |
| **Decyzja Macieja** | −5 **Zaufanie**/turę, koniec tury, bez stacku jednostek |
