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
- Plus: wygrane bitwy i przewaga militarna podnoszą Respekt.
- Minus: słabszość militarna obniża Respekt (−10).
- Minus: wojna nie obniża Respektu, więc przeciągnięta wojna nie „kasuje” go tak jak Zaufania; Respekt zmienia się tylko przez siłę i zdarzenia.

**Dla AI**
- Plus i minus są takie same jak dla gracza: Respekt rośnie z siłą i spada przy słabości.

### Źródła zmian

| Źródło | Zmiana | Uwagi |
|--------|--------|-------|
| Przewaga militarna | +15 | jednorazowo, przy przewadze siły (próg w kodzie) |
| Słabszy militarnie | −10 | jednorazowo |
| Wygrana bitwa | +5 | za każdą wygraną |
| Trybut zapłacony | +10 | |
| Wspólny wróg zaakceptowany | +10 | |

Siła, z której liczony jest Respekt, to **Moc** (patrz hasło **Moc — podział na wojskowy i gospodarczy**). Respekt pary to udział mocy jednej nacji w sumie mocy obu.

### Progi zależne od Respektu

| Umowa | Respekt |
|-------|---------|
| Wasalizacja miasta‑państwa | ≥ 70 |
| Wchłonięcie wasala | ≥ 90 |
| Ultimatum | (wg siły, patrz Poradnik) |

### Wartość startowa

Start: **30**.

### Zasady zatwierdzone, jeszcze niewdrożone

> **DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku.** Ten blok NIE opisuje obecnego stanu gry.

- Siła militarna (armia + rekruci + wygrane bitwy z bieżącej wojny + czasowy bonus trybutu) służy do decyzji o wojnie i pokoju i nie wchodzi do niej gospodarka. Patrz hasło **Wypowiadanie wojny**.

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
| 15 | `diplomacy.json:params.przewagaMilitarna_respekt` |
| -10 | `diplomacy.json:params.slabszyMilitarnie_respekt` |
| 100 | `kod:respekt-wzor` (wzór Respektu: `Math.round(100 * potegaSelf / sum)`, skala 0–100, `diplomacy.ts`) |

Uwaga: limit składnika Respektu to 0–100 (`diplomacy.ts`, funkcja zdarzeń). Wojna nie zmienia Respektu.

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Zasady niewdrożone: DECYZJA WŁAŚCICIELA 2026-11-13.
