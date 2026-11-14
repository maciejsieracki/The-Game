# Respekt (dyplomacja)

## Metadane

| Pole | Wartość |
|------|---------|
| id | `respekt` |
| tytuł | Respekt |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §74 |
| json_ref | `diplomacy.json` (params), `power-params.json` (wzór Power) |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Respekt** pokazuje, jak bardzo rozmówca liczy się z twoją siłą. Zaczyna się od **30** i rośnie, gdy jesteś silniejszy, płacisz trybut albo wygrywasz bitwy. Wojna **nie** obcina Respektu, w przeciwieństwie do Zaufania.

---

## Wiki‑M

### Czym jest Respekt

Respekt jest **osobny dla każdej pary** cywilizacji. Składa się z Zaufaniem (patrz hasło **Zaufanie**) w **Relację** (0–200). Respekt odpowiada za progi, które wymagają „siły”: wasalizację miasta‑państwa (od 70) i wchłonięcie go (od 90).

### Plusy i minusy

**Dla gracza**
- Plus: wysoki Respekt pozwala narzucać trybut i wasalizować miasta‑państwa.
- Plus: wygrane bitwy podnoszą Respekt (+5 za każdą wygraną).
- Minus: Respekt nie spada z samej słabości militarnej — w grze nie działa jeszcze kara za słabość (patrz sekcja niżej).
- Minus: wojna nie obniża Respektu, więc przeciągnięta wojna nie „kasuje” go tak jak Zaufania; Respekt zmienia się tylko przez siłę i zdarzenia.

**Dla AI**
- Respekt AI wobec gracza rośnie wraz z udziałem mocy AI w sumie mocy obu stron (wzór, patrz Wiki-M) i wygranymi bitwami oraz trybutem; brak kary za słabość w grze.

### Źródła zmian

| Źródło | Zmiana | Uwagi |
|--------|--------|-------|
| Wygrana bitwa | +5 | za każdą wygraną (wywoływane przez grę) |
| Trybut zapłacony | +10 | (wywoływane przez grę) |
| Wspólny wróg zaakceptowany | +10 | zdefiniowane w kodzie; w grze nie jest jeszcze wywoływane |

Zdarzenia „Przewaga militarna” (+15) i „Słabszy militarnie” (−10) są zapisane w kodzie (`diplomacy.ts`), ale gra ich nigdzie nie wywołuje: nie działają jako źródło Respektu i nie są podane w tabeli jako obowiązujące. Ta zmiana jest zgodna z decyzją właściciela o przepisaniu przewagi militarnej (wdrożenie w toku).

Siła, z której liczony jest Respekt, to **Moc** (patrz hasło **Moc — podział na wojskowy i gospodarczy**). Respekt pary to udział mocy jednej nacji w sumie mocy obu.

### Progi zależne od Respektu

| Umowa | Respekt |
|-------|---------|
| Wasalizacja miasta‑państwa | ≥ 70 |
| Wchłonięcie wasala | ≥ 90 |
| Ultimatum | (wg siły, patrz Poradnik) |

### Wartość startowa

Start: **30**.

### Siła militarna a Respekt

- Siła militarna (armia + rekruci + wygrane bitwy z bieżącej wojny + czasowy bonus trybutu) służy do decyzji o wojnie i pokoju. Respekt pary liczy się z Mocy, nie z siły militarnej; gospodarka do siły militarnej nie wchodzi (wdrożone, patrz **Moc (Power) i jej podział na wojskowy i gospodarczy**, sekcja **Siła militarna**).

---

## Przykład liczbowy

Moc A = 600, Moc B = 400. Respekt A wobec B = round(100 × 600 / 1000) = **60**. Respekt B wobec A = **40**. Gdy B wygra bitwę (+5 Respektu u B), jego Moc rośnie, a Respekt liczony z mocy obu stron zmienia się zgodnie z nowym stosunkiem.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §74

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 30 | `diplomacy.json:params.startRespekt` |
| 70 | `diplomacy.json:params.progWasalizacjaRespekt` |
| 90 | `diplomacy.json:params.progWchloniecieRespekt` |
| 10 | `diplomacy.json:params.trybut_respekt` |
| 10 | `diplomacy.json:params.wspolnyWrogAkceptacja_respekt` |
| 5 | `diplomacy.json:params.wygraBitwa_respekt` |
| 100 | `kod:respekt-wzor` (wzór Respektu: `Math.round(100 * potegaSelf / sum)`, skala 0–100, `diplomacy.ts`) |

Uwaga: wartości `przewagaMilitarna_respekt` (+15) i `slabszyMilitarnie_respekt` (−10) są w `diplomacy.ts` i `diplomacy.json`, ale nie są wywoływane w grze, więc nie są tu obowiązującymi parametrami.

Uwaga: limit składnika Respektu to 0–100 (`diplomacy.ts`, funkcja zdarzeń). Wojna nie zmienia Respektu.

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Runda 2 (obrona, zarzut 4): źródła „Przewaga militarna” i „Słabszy militarnie” usunięte z obowiązujących (brak wywołań w `main.ts`; grep: tylko definicja i `case` w `diplomacy.ts`). Zasady niewdrożone: DECYZJA WŁAŚCICIELA 2026-11-13.
