# Rejestr globalnych parametrów cywilizacji (v1)

**Data:** 2026-07-01 · **Dla:** Maciej (decyzje ABC) · **Lane:** Grupa D  
**Cel:** zastąpić hasłowe opisy w Excelu **zamkniętą listą parametrów** z jednoznacznymi ID, jednostkami i miejscem w silniku.

**Powiązane:** `Panel-D.xlsx` · `civs.json` · `civ-ai.json` · `civ-params.json` · `diplomacy.json` (perNacja)

---

## 0. Zasada kanoniczna (jak to ma działać)

Każdy wpływ cywilizacji to **rekord maszynowy**, nie zdanie marketingowe:

| Pole | Wymagane | Przykład |
|------|----------|----------|
| `param_id` | tak | `walka_atak_proc` |
| `domena` | tak | `walka` / `ekonomia` / `dyplomacja` / … |
| `wartosc` | tak | `0.15` (= +15%) lub `2` (absolut) |
| `cel` | często | `piechota` · `handel` · `budynki` · `—` |
| `warunek` | opcjonalnie | `teren_las` · `terytorium_wlasne` · `runda_szarzy` |
| `opis_ui` | opcjonalnie | tekst w HUD — **nigdy nie steruje logiką** |

**Formuła ogólna:** `wynik = baza × (1 + suma bonusów pasujących)` albo `wynik = baza + wartość` (gdy absolut).

**Kto implementuje nowy `param_id`:** lane D (Composer) — jeden handler w odpowiednim pliku `.ts` + test w `civ-bonusy-test.cjs`. Maciej tylko ustawia liczby w Excelu.

---

## 1. Domeny (mapa gry)

```text
START/META ──► jednostka spec., epoka startu, klastry, mnożnik waluty
     │
     ├── WALKA ──► staty jednostki + modyfikatory % (mapa + bitwa)
     ├── EKONOMIA ──► plony miasta (praca, $, żywność, nauka, kultura, luksus)
     ├── PRODUKCJA ──► koszty budynków/jednostek, prędkość produkcji
     ├── LUDNOŚĆ ──► wzrost, zdrowie, zadowolenie (cyw. modulatory)
     ├── MANPOWER ──► pula rekrutów, odnowa, koszt werbunku
     ├── SPOŁECZEŃSTWO ──► Wealth, kultura/religia (modulatory cyw.)
     ├── OBLĘŻENIE ──► obrona miasta, machiny (modulatory cyw.)
     ├── DYPLOMACJA ──► per-nacja + archetyp
     ├── AI ──► priorytety decyzji AI
     └── POTĘGA ──► składowe Power (docelowo; dziś głównie globalne wagi)
```

---

## 2. WALKA — staty jednostki (jednostka specjalna)

**Źródło danych:** `units.json` (wiersz jednostki specjalnej), nie wiersz bonusu.  
**W grze:** produkcja zamienia jednostkę bazową (`W zamian za`) na wariant z własnymi statami.  
**Pliki:** `production.ts` · `combat.ts` · `battleScene.ts`

| param_id (kolumna units.json) | Jednostka | Co robi |
|-------------------------------|-----------|---------|
| `Atak` | pkt / % trafienia | szansa / siła uderzenia (macierz v2) |
| `Obrażenia` | pkt | baza obrażeń (macierz v2) |
| `Obrona` | pkt | unik / obrona |
| `Uderzenie` | pkt | bonus szarży (runda 1) |
| `Pancerz` | pkt | redukcja obrażeń |
| `Przebicie` | pkt | przebicie pancerza |
| `Health` | pkt HP | wytrzymałość |
| `Atak dystansowy` | pkt | atak dystansowy |
| `Zasięg ataku (hex)` | heksy | zasięg |
| `Ilość pocisków` | szt. | amunicja |
| `Ruch w bitwie (heksy)` | heksy | ruch w scenie bitwy |
| `Ruch` | heksy/tura | ruch na mapie strategicznej |
| `Widok pola` | heksy | zasięg wzroku |
| `Prog dezercji (% health)` | ułamek 0–1 | próg ucieczki |
| `Morale bazowe` | pkt | morale startowe |
| `Kara obrony z flanki (%)` | % | kara boczna |
| `Kara obrony z tylu (%)` | % | kara od tyłu |
| `Bonus vs * %` | % | kontra typ wroga |
| `Pieniądz (koszt)` | $ | koszt zakupu |
| `Utrzymanie (Pieniądz/turę)` | $/tura | upkeep |
| `żywność/turę` | żywność | utrzymanie wojska |

**Status:** ✅ wdrożone (przez `units.json`).  
**Decyzja Macieja:** balans jednostki spec. = edycja **Panel jednostek** (Grupa C), nie arkusz Bonusy.

---

## 3. WALKA — modyfikatory procentowe (%)

**Źródło:** `civs.json` → `bonusy[]` (docelowo: tabela `param_id` zamiast `typ`+hasło).  
**Plik:** `civ-bonuses.ts` → `combat.ts` / `battleScene.ts`

### 3.1 Parametry (param_id — propozycja v1)

| param_id | Efekt na stat | Wartość | Status kodu |
|----------|---------------|---------|-------------|
| `walka_atak_proc` | `Atak × (1+v)` | ułamek | ✅ częściowo (`bonus_walka`, mapowanie przez opis) |
| `walka_obrona_proc` | `Obrona × (1+v)` | ułamek | ✅ (`bonus_obrona`, tylko obrońca) |
| `walka_pancerz_proc` | `Pancerz × (1+v)` | ułamek | ⚠️ tylko gdy opis zawiera „pancerz” |
| `walka_uderzenie_proc` | `Uderzenie × (1+v)` | ułamek | ⚠️ heurystyka opisu |
| `walka_dystans_proc` | `Atak dystansowy × (1+v)` | ułamek | ⚠️ heurystyka opisu |
| `walka_hp_proc` | `Health × (1+v)` | ułamek | ⚠️ heurystyka opisu |
| `walka_ruch_bitwa_proc` | ruch w bitwie | ułamek | ❌ brak |
| `walka_zasieg_proc` | zasięg | ułamek / +hex | ❌ brak |
| `walka_oblezenie_proc` | skuteczność oblężenia | ułamek | ❌ brak (`cel: obleczenie` ignorowany) |
| `walka_koszt_rekrutacji_proc` | tańszy werbunek | ułamek | ✅ (`civRecruitmentDiscount`, opis „rekrutacji”) |

### 3.2 Cele (`cel`) — zamknięta lista

| cel | Dopasowanie |
|-----|-------------|
| `piechota` | piechota wręcz |
| `lukownicy` | dystans (łucznik, kusznik, procarz…) |
| `kawaleria` | konnica, husaria, stepowiec… |
| `rydwany` | nazwa zawiera „rydwan” |
| `obleczenie` | katapulta, taran, machiny obl. |
| `morska` | jednostki morskie |
| `wszystkie` | każda jednostka własna |

### 3.3 Warunki (`warunek`) — zamknięta lista (do wdrożenia)

| warunek | Znaczenie | Status |
|---------|-----------|--------|
| `brak` | zawsze | ✅ domyślny |
| `teren_las` | las / dżungla / góry | ⚠️ parsowanie **Opisu** |
| `teren_row` | równina / łąka | ❌ |
| `teren_wybrzeze` | wybrzeże / morze | ❌ |
| `terytorium_wlasne` | heks w granicy miasta gracza | ❌ |
| `w_murze` | obrońca w mieście z murem | ❌ (osobno: bonus muru z `miasto-params`) |
| `runda_szarzy` | pierwsza runda walki wręcz | ⚠️ parsowanie **Opisu** |
| `obrońca` | tylko broniący | ✅ (`bonus_obrona`) |
| `atak_frontalny` | pozycja front | ❌ (jest w `CombatUnit` pozycja, nie w bonusie cyw) |

**Rekomendacja:** w Excelu **osobna kolumna Warunek** z listy rozwijanej — zero parsowania polskiego tekstu.

---

## 4. EKONOMIA — plony miasta (co turę)

**Plik:** `economy.ts` → `turn-economy.ts` (`cityYieldPerTurn`)

### 4.1 Parametry plonów

| param_id | Pole w `CityYieldResult` | Wartość | Status |
|----------|--------------------------|---------|--------|
| `eko_praca_proc` | `praca` | ułamek | ❌ (jest `modEkonomii` w JSON, niepodpięte) |
| `eko_pieniadz_proc` | `pieniadz` / handel→$ | ułamek | ✅ częściowo (`bonus_zloto` + `cel: handel`) |
| `eko_pieniadz_port_proc` | tylko handel z wybrzeża/portu | ułamek | ❌ (opis „port” = flavor) |
| `eko_zywnosc_proc` | `zywnosc` | ułamek | ❌ |
| `eko_nauka_proc` | `nauka` | ułamek | ✅ (`bonus_nauka`) |
| `eko_kultura_proc` | `kultura` | ułamek | ❌ |
| `eko_luksus_proc` | `luksus` | ułamek | ❌ |
| `eko_zadowolenie_proc` | `zadowolenie` | pkt / ułamek | ❌ |
| `eko_handel_brutto_proc` | `handelBrutto` (przed sliderem) | ułamek | ✅ (= `bonus_zloto/hand`) |
| `eko_korupcja_proc` | `strataFraction` | ułamek | ❌ |
| `eko_waluta_mnoznik` | `mnoznikHandelPieniadz` (po tech Waluta) | absolut 1.7–2.4 | ✅ osobne pole w `civs.json`, nie w bonusy[] |

### 4.2 Źródło plonu (`cel` dla ekonomii)

| cel | Zakres |
|-----|--------|
| `handel` | strumień handlu (teren + budynki handlowe) |
| `praca` | produkcja / praca |
| `zywnosc` | żywność netto |
| `nauka` | nauka |
| `kultura` | kultura |
| `luksus` | luksus → Wealth |
| `budynki` | tylko output budynków |
| `teren` | tylko kafelki okolicy |

---

## 5. PRODUKCJA I KOSZTY

**Pliki:** `production.ts` · `civ-bonuses.ts`

| param_id | Efekt | Status |
|----------|-------|--------|
| `prod_koszt_budynku_proc` | −% kosztu pracy budynku | ✅ `koszt_redukcja` + `cel: budynki` |
| `prod_koszt_jednostki_proc` | −% kosztu jednostki ($/praca) | ⚠️ tylko gdy opis zawiera „rekrutacji” |
| `prod_szybkosc_budynku_proc` | +% pracy/turę na budynek | ❌ |
| `prod_szybkosc_jednostki_proc` | +% rekrutacji/turę | ❌ |
| `prod_rush_koszt_proc` | koszt przyspieszenia | ❌ |

---

## 6. LUDNOŚĆ, WZROST, ZDROWIE

**Pliki:** `economy.ts` (`populationGrowth`) · `turn-economy.ts` · `culture-religion.ts`

| param_id | Efekt | Status |
|----------|-------|--------|
| `lud_wzrost_proc` | szybkość wzrostu ludności | ❌ (`modWzrostu` w `civ-params.json` — **dane bez kodu**) |
| `lud_spadek_proc` | wolniejszy ubytek przy głodzie | ❌ |
| `lud_zdrowie_proc` | mod. zdrowia miasta | ❌ |
| `lud_zadowolenie_bazowe` | stały bonus zadowolenia | ❌ |
| `lud_limit_populacji` | max ludność | ❌ |

---

## 7. MANPOWER (pobór / rekruci)

**Plik:** `manpower.ts`

| param_id | Efekt | Status |
|----------|-------|--------|
| `mp_regen_proc` | odnowa puli rekrutów / turę | ✅ `bonus_pobor_regen` |
| `mp_max_proc` | max manpower per miasto | ❌ |
| `mp_koszt_jednostki_proc` | koszt MP na jednostkę | ❌ |

---

## 8. WEALTH I SPOŁECZEŃSTWO

**Pliki:** `wealth.ts` · `order.ts` · `culture-religion.ts`

| param_id | Efekt | Status |
|----------|-------|--------|
| `wealth_cap_proc` | sufit Wealth | ❌ per-cyw |
| `wealth_mnoznik_proc` | mnożnik podatku z Wealth | ❌ per-cyw |
| `kultura_naplyw_proc` | tempo kultury | ❌ |
| `religia_spread_proc` | tempo misji / konwersji | ❌ |
| `porzadek_*` | mnożniki Ład/Niepokój | ❌ per-cyw (dziś globalne `society-params`) |

---

## 9. OBLĘŻENIE

**Pliki:** `siege.ts` · `battleScene.ts` (obrona muru)

| param_id | Efekt | Status |
|----------|-------|--------|
| `obl_obrona_miasta_proc` | obrona garnizonu | ❌ per-cyw |
| `obl_mur_proc` | skuteczność muru | ❌ (globalne `bonus_obrona_mur_proc`) |
| `obl_machines_proc` | budowa machin | ❌ |

---

## 10. DYPLOMACIA (per typ cywilizacji)

**Źródło:** arkusz `Dyplomacja-per-nacja` → `diplomacy.json` · archetypy w `diplomacy.ts`  
**Skala:** większość pól **1–10** (normalizacja ÷10 w kodzie)

| param_id | Pole Excel | Efekt w grze | Status |
|----------|------------|--------------|--------|
| `dip_sklonnosc_sojusze` | sklonnoscSojusze | AI: chęć sojuszu | ✅ seed + archetyp |
| `dip_lojalnosc` | lojalnosc | trwałość paktów | ⚠️ częściowo (seed) |
| `dip_prog_wojny` | progWojny | próg wypowiedzenia wojny | ⚠️ seed |
| `dip_pamietliwosc` | pamietliwosc | długość urazów | ⚠️ seed |
| `dip_otwartosc_handel` | otwartoscHandel | `ARCHETYPE_TRADE` | ✅ |
| `dip_nastawienie_bazowe` | nastawienieBazowe | start Zaufanie | ✅ |
| `dip_agresja_archetyp` | (enum + civ-ai) | `ARCHETYPE_AGGRESSION` | ✅ |
| `dip_handlowosc_archetyp` | (enum) | `ARCHETYPE_TRADE` fallback | ✅ |

**Relacja / Respekt / Zaufanie** — liczone dynamicznie (`diplomacy.ts`); cyw. nie ustawia co turę, tylko **współczynniki i start**.

---

## 11. AI (decyzje rywala)

**Źródło:** `AI-per-nacja` → `civ-ai.json` · **Skala 1–10**

| param_id | Pole Excel | Efekt | Status |
|----------|------------|-------|--------|
| `ai_agresywnosc` | agresywnosc | wojna / ekspansja | ✅ |
| `ai_ekspansywnosc` | ekspansywnosc | tempo kolonizacji | ⚠️ dane, słabe wpięcie |
| `ai_priorytet_militarny` | priorytetMilitarny | budżet wojsko | ⚠️ |
| `ai_priorytet_ekonomia` | priorytetEkonomia | budżet ekonomia | ⚠️ |
| `ai_priorytet_nauka` | priorytetNauka | budżet nauka | ⚠️ |
| `ai_tolerancja_ryzyka` | tolerancjaRyzyka | ryzykowne akcje | ⚠️ |
| `ai_sklonnosc_podboju` | sklonnoscDoPodboju | wojny ofensywne | ⚠️ |
| `ai_profil_mapy` | profilMapy | kopia typu / obrona | ✅ (`isKopiaTypuObronna`) |
| `ai_preferowane_budynki` | preferowaneBudynki | lista tekstowa | ⚠️ hint AI, nie twardy bonus |
| `ai_preferowane_jednostki` | preferowaneJednostki | j.w. | ⚠️ |

**Globalne AI** (nie per-cyw): arkusze `AI-trudnosc`, `AI-zachowanie`, `Barbarzyńcy` → `ai-params.json`.

---

## 12. START GRY / META (tożsamość cywilizacji)

| param_id | Pole JSON | Efekt | Status |
|----------|-----------|-------|--------|
| `meta_epoki_startowe` | `epokiStartowe[]` | los epoki startu gracza | ✅ |
| `meta_jednostka_spec_id` | `jednostka_specjalna` + units | wariant jednostki | ✅ |
| `meta_klastry` | `nazwyKlastra[]` | nazwy miast AI | ✅ |
| `meta_mnoznik_waluta` | `mnoznikHandelPieniadz` | handel→$ po Walucie | ✅ |
| `meta_typ_cyw` | `typCywilizacji` | enum, dyplomacja, AI | ✅ |
| `meta_religia_start` | `Religia` | flavor / przyszłe mechaniki | ⚠️ tekst |

---

## 13. POTĘGA (Power) — docelowo per-cyw

**Plik:** `power-objective.ts` · `diplomacy.ts` (`computePotegaNacji`)

Składowe Power (wagi globalne dziś w `power-params.json`):

| składnik | param_id (propozycja) | Status per-cyw |
|----------|----------------------|----------------|
| wojsko | `power_wojsko_waga` | ❌ |
| miasta | `power_miasta_waga` | ❌ |
| terytorium | `power_terytorium_waga` | ❌ |
| ekonomia | `power_ekonomia_waga` | ❌ |
| nauka | `power_nauka_waga` | ❌ |
| epoka | `power_mnoznik_epoki` | globalne |

**Uwaga Macieja:** wzór Power → dyplomacja/Respekt — osobna decyzja po domknięciu modułu Power.

---

## 14. Mapowanie STARE → NOWE (migracja bonusy[])

| Stary `typ` | Nowy `param_id` | Uwagi |
|-------------|-----------------|-------|
| `bonus_walka` | `walka_atak_proc` (+ warunek) | rozbić na jawne param_id |
| `bonus_obrona` | `walka_obrona_proc` | + warunek `obrońca` |
| `bonus_zloto` | `eko_pieniadz_proc` lub `eko_handel_brutto_proc` | |
| `bonus_nauka` | `eko_nauka_proc` | |
| `bonus_pobor_regen` | `mp_regen_proc` | |
| `koszt_redukcja` | `prod_koszt_budynku_proc` | |
| `jednostka_specjalna` | `meta_jednostka_spec_id` | wartość = ID/nazwa z units.json |

---

## 15. Proponowany układ Excela (zamiast kolumny „Opis = logika”)

### Arkusz **`Cyw-parametry`** (1 wiersz = 1 efekt)

| Cywilizacja | param_id | cel | warunek | wartosc | opis_ui |
|-------------|----------|-----|---------|---------|---------|
| Harappa | eko_handel_brutto_proc | handel | brak | 0.15 | +15% handlu |
| Harappa | walka_obrona_proc | piechota | terytorium_wlasne | 0.15 | obrona u siebie |
| Hetyci | walka_atak_proc | rydwany | brak | 0.20 | rydwany |

**Eksport:** `export-d.py` → `civs.json` (`bonusy[]` z polami `param_id`, bez heurystyki opisu).

### Arkusze bez zmian (już numeryczne)

- `Dyplomacja-per-nacja` · `AI-per-nacja` · `Cywilizacje-roster` · `Parametry-cyw` (po podpięciu `modWzrostu`/`modEkonomii`)

---

## 16. Podsumowanie dla decyzji

| Pytanie ABC | Opcje |
|-------------|-------|
| **Q-REG-1:** Format bonusów | **A** — migracja do `param_id` + `warunek` (rekomend.) · **B** — zostawić `typ`+Opis · **C** — tylko jednostki spec. + dyplomacja, reszta globalna |
| **Q-REG-2:** Priorytet wdrożenia warunków | **A** — las/szarża/terytorium · **B** — tylko „gołe” % · **C** — odłożyć do v1.1 |
| **Q-REG-3:** `modWzrostu` / `modEkonomii` | **A** — podpiąć jako `lud_wzrost_proc` / `eko_praca_proc` · **B** — usunąć z Excela · **C** — zostawić rezerwę |

---

## 17. Liczby (stan 2026-07-01)

| Kategoria | Parametrów na liście | Wdrożonych w kodzie (szac.) |
|-----------|---------------------|----------------------------|
| Staty jednostki | 20 | 20 (przez units.json) |
| Walka % | 10 | 4–5 (reszta heurystyka/brak) |
| Ekonomia | 11 | 3 |
| Produkcja | 5 | 2 |
| Ludność | 5 | 0 |
| Manpower | 3 | 1 |
| Dyplomacja | 8 | 5–6 |
| AI | 10 | 3–4 twarde |
| Meta start | 6 | 5 |
| **Razem** | **~78 slotów** | **~35 aktywnych** |

---

*Append meldunków lane D:* `dyspozycje/CYWILIZACJE-DO-MASTERA.md`
