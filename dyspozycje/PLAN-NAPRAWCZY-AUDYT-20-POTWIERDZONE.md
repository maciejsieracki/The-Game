# PLAN NAPRAWCZY — audyt 20 POTWIERDZONE (do akceptacji Macieja)

> **Data:** 2026-07-21 · **Źródło:** `AUDYT-KODU-2026-07-21.md` (tylko status `POTWIERDZONE`, 2× sceptyk, 0 odrzuceń)  
> **Wykonawca po akceptacji:** sesja Cursor (lane’y + Integrator F przy `main.ts`)  
> **Dla Fable:** sekcja „POZA ZAKRESEM CURSOR” — **nie naprawiać ponownie** po akceptacji Macieja

---

## Jak zaakceptować

Napisz w czacie: **`OK plan audyt 20`** albo **`OK plan audyt 20 z wyjątkami: #6=B, #4=A`** (patrz ABC poniżej).

Po akceptacji: Cursor realizuje paczki P0→P3; Fable dostaje ten plik jako listę „już zlecone”.

---

## Zakres — TAK (20 pozycji)

| ID audytu | Waga | Plik (główny) | Skrót problemu |
|-----------|------|---------------|----------------|
| **#3** | WYSOKA | `manpower.ts` | Dupe ludności: rekrutacja przy pop=1 + disband oddaje +1 ponad cap |
| **#4** | WYSOKA | `turn-economy.ts` | Suwak żywności 0% kasuje deficyt miasta z ksiąg |
| **#5** | WYSOKA | `main.ts` + `ai.ts` | AI przestaje badać po techu awansu epoki (brak fallbacku) |
| **#6** | WYSOKA | `victory.ts` | Zwycięstwo naukowe nieosiągalne (`rakietaWystrzelona` nigdy true) |
| **#7** | WYSOKA | `gen-helpers.ts` | Relief fair-play stawia Góry na Wybrzeżu (woda) |
| **#8** | WYSOKA | `filePlayer.ts` | Odrzucone `play()` → `playing=true` → martwy fallback intro |
| **#9** | WYSOKA | `muzyka-antyczna.ts` | Awans kamień→brąz: cisza (ctx null przy torze plikowym) |
| **#34** | ŚREDNIA | `empire-food.ts` | Parametry głodu czytane ze złego poziomu JSON |
| **#35** | ŚREDNIA | `economy.ts` | Zdrowie mnoży ujemną żywność; zdrowie ≤−20 = immunitet głodu |
| **#36** | ŚREDNIA | `turn-economy.ts` | Utrzymanie budynków zawsze 0 (pusta lista do `upkeepBalance`) |
| **#37** | ŚREDNIA | `ai.ts` | AI omija tier-gating i bramki budynków w badaniach |
| **#38** | ŚREDNIA | `wonder-placement.ts` | Cud może stanąć na Wybrzeżu (woda) |
| **#39** | ŚREDNIA | `muzyka-antyczna.ts` | Toggle natury OFF→ON podwaja soundscape |
| **#59** | NISKA | `economy.ts` | Formuła Praca→Pieniądz bez kar Porządku / rozjazd floor vs round |
| **#60** | NISKA | `main.ts` | Awans epoki z wioski bez `setEra` / `rebuildResourceOverlays` |
| **#61** | NISKA | `playerState.ts` | Parser prereków ≠ `research.ts` (brak `'-'`, `'brak'`) |
| **#62** | NISKA | `generator.ts` | Martwa gałąź pangei — jeziora zawsze kasowane |
| **#63** | NISKA | scoring startu | Góry w dist=4 nigdy nie punktowane |
| **#64** | NISKA | `deposits.json` | Martwe reguły złóż (owce/bydło…) w JSON |
| **#65** | NISKA | `filePlayer.ts` | `onError` przy crossfade może uciszyć playlistę na stałe |

---

## Zakres — NIE (Cursor nie rusza — zostaje Fable / runda 2)

**53 pozycje** z `AUDYT-KODU-2026-07-21.md` **bez** statusu POTWIERDZONE, w tym m.in.:

| ID | Waga | Temat (skrót) |
|----|------|----------------|
| #1, #2 | KRYTYCZNA | Koszyk PN jednostka · auto-szturm `survivors:[]` |
| #10–#33 | WYSOKA | armor EN w units.json · super-jednostki · save/load wioski · dyplomacja · wydajność · AI build · handel… |
| #40–#58 | ŚREDNIA | ambBattleMuted · save barbCamps · panel miasta bilans · HP pasek armii… |
| #66–#73 | NISKA | UI listenery · religia panel · stat chip dispose… |

**6 obszarów** niezbadanych w rundzie 1 (walka pełna, dyplomacja moduły, handel, systemy strategiczne, wydajność zbiorczo, zwycięstwo save) — **Fable może dokończyć audyt**, Cursor **nie** implementuje z tego źródła bez POTWIERDZONE.

---

## Decyzje ABC przed naprawą (Maciej)

| ID | Pytanie | Propozycja Cursor (rekomendacja) |
|----|---------|----------------------------------|
| **#6** | Zwycięstwo naukowe bez rakiety w v0.1? | **A** — `isNaukaVictory` ignoruje rakietę, dopóki nie ma projektu rakietowego (użyć `NAUKA_WYMAGA_RAKIETY` / flaga JSON) |
| **#4** | Suwak rozwoju 0% — co z deficytem żywności? | **A** — 0% = zero **dodatniej** żywności do wzrostu; **ujemny** bilans miasta nadal obciąża magazyn / państwo |
| **#62** | Jeziora na pangei — włączyć? | **B** — naprawić gałąź `if/else` wg `maxInlandPoolSize` (bez zmiany innych typów map) |
| **#64** | Martwe reguły w `deposits.json` | **A** — usunąć martwe wpisy z JSON (bez nowych mechanik) |

Bez odpowiedzi: stosuję propozycje z kolumny „rekomendacja”.

---

## Paczki robocze (po akceptacji)

Jedna paczka = jeden subagent / jedna sesja lane · **bez kolizji plików** między paczkami równoległymi.

### PACZKA E1 — Ekonomia ludność i żywność (🟢 lane B)

**ID:** #3, #4, #35, #36, #59  
**Pliki:** `manpower.ts`, `turn-economy.ts`, `economy.ts`, `production.ts` (tylko jeśli potrzebne do spójności split)  
**Naprawa:** clamp populacji przy rekrutacji/disband; deficyt żywności niezależny od suwaka 0%; poprawka modyfikatora zdrowia przy ujemnym flow; przekazanie `builtByCity` do `upkeepBalance`; ujednolicenie doPuli Praca→¤  
**Bramka:** `npx tsc --noEmit` · testy ekonomii lane (jeśli są) · smoke  
**Warstwa:** 🟢 izolowana (bez `main.ts`)

### PACZKA E2 — Parametry imperium z JSON (🟢 lane B)

**ID:** #34  
**Pliki:** `empire-food.ts` (+ ewent. jeden call site jeśli trzeba przekazać `ekonomia_miasta`)  
**Naprawa:** czytanie `suwak_zywnosc_*`, `glod_*`, `spichlerz_*` z właściwej sekcji `econ-params.json`  
**Bramka:** tsc · ręczny smoke: trudność hard vs normal (atrycja wojska)  
**Warstwa:** 🟢

### PACZKA E3 — AI badania (🟡 lane D)

**ID:** #5, #37  
**Pliki:** `ai.ts` · handoff do **F** jeśli pętla w `main.ts:11545` wymaga zmiany  
**Naprawa:** po techu `awansDoEpoki` — wybór następnego techu; `scoreTech` + te same bramki co gracz (`epochGate`, `researchGates`)  
**Bramka:** tsc · `research-test.cjs` / `tech-tree-test.cjs` jeśli zielone  
**Warstwa:** 🟡 (może dotknąć `main.ts` przez F)

### PACZKA E4 — Zwycięstwo nauka (🟢 + ABC #6)

**ID:** #6  
**Pliki:** `victory.ts`, ewent. `e-start-params.json` (tylko odczyt flagi)  
**Naprawa:** wg decyzji ABC #6  
**Bramka:** tsc · test victory jeśli istnieje  
**Warstwa:** 🟢

### PACZKA E5 — Mapa generator (🟢 lane A)

**ID:** #7, #62, #63, #64  
**Pliki:** `gen-helpers.ts`, `generator.ts`, `deposits.json`, scoring startu (plik z `findSettler`/`start` — potwierdzi lane A)  
**Naprawa:** wykluczyć Wybrzeże z relief force; naprawić gałąź pangei; dist=4 dla gór; posprzątać martwy JSON  
**Bramka:** `map-gen-regression-test.cjs` · `weryfikacja-mapy.cjs` standard  
**Warstwa:** 🟢

### PACZKA E6 — Cudy (🟢 lane A / B)

**ID:** #38  
**Pliki:** `wonder-placement.ts`  
**Naprawa:** `isLandBuildable` odrzuca `TerenBazowy.Wybrzeze`  
**Bramka:** tsc · generator smoke  
**Warstwa:** 🟢

### PACZKA E7 — Audio (🟢 lane E / audio)

**ID:** #8, #9, #39, #65  
**Pliki:** `filePlayer.ts`, `muzyka-antyczna.ts` · ewent. minimalny hook w `main.ts` (tylko przez **F**)  
**Naprawa:** reset `playing` przy rejected play; lazy `AudioContext` przy awansie epoki z toru plikowego; `stopAmbience` zatrzymuje zaplanowane źródła; recovery `onError`  
**Bramka:** tsc · smoke audio (manual: menu intro + awans epoki + toggle natury)  
**Warstwa:** 🟡 jeśli `main.ts`

### PACZKA E8 — Research / wioski / start (🟡)

**ID:** #60, #61  
**Pliki:** `main.ts` (nagroda wioski — **F**), `playerState.ts` (parser — lane B/D)  
**Naprawa:** po tech z wioski — ten sam łańcuch co koniec tury (`setEra`, overlay); wspólna lista `BRAK_PREREQ` jak w `research.ts`  
**Bramka:** tsc · `research-test.cjs`  
**Warstwa:** 🟡 (`main.ts` = F)

---

## Kolejność wdrożenia (priorytet)

| Krok | Paczka | Dlaczego pierwsze |
|------|--------|-------------------|
| 1 | **E1** | exploity ekonomii / głód — wpływ na każdą turę |
| 2 | **E3** | AI stoi w epoce kamienia — rozgrywka vs komputer |
| 3 | **E7** | audio — pierwsze wrażenie + awans epoki |
| 4 | **E5 + E6** | mapa — regresja generatora |
| 5 | **E2, E4, E8** | parametry JSON, zwycięstwo, drobne research |

Paczki **E1–E6** można równolegle **po** akceptacji (różne pliki). **E8** po F (main).

---

## Czego NIE robi Cursor (nawet po akceptacji planu)

- Naprawy z listy „POZA ZAKRESEM” (#1–#2, #10–#33…) — czekają na Fable POTWIERDZONE lub Twoje osobne **`działaj #ID`**
- Promocja kanonu / publish `Gra-ROBOCZA.html` — tylko Integrator F po bramce
- Balans liczb w Excelu / Panel-C — osobny tor

---

## Meldunek po każdej paczce

- Append `dyspozycje/AUDYT-NAPRAWY-LOG.md` (utworzy Cursor przy starcie)
- `→ INTEGRATOR: GOTOWE` tylko dla paczek z `main.ts`
- Ten plik: checkbox przy ID po merge

---

## Dla Fable — kopia do wklejenia

```
ZLECONE CURSOR (Maciej OK plan audyt 20): #3 #4 #5 #6 #7 #8 #9 #34 #35 #36 #37 #38 #39 #59 #60 #61 #62 #63 #64 #65
Plik planu: dyspozycje/PLAN-NAPRAWCZY-AUDYT-20-POTWIERDZONE.md
NIE DUPLIKOWAĆ napraw powyżej. Kontynuować audyt: obszary 6 brakujących + weryfikacja #1 #2 #10–#33 #40–#58 #66–#73.
```

---

---

## Status wdrożenia

**✅ WDROŻONE** (2026-07-21) — Maciej: `OK plan audyt 20`  
Pełny raport wykonania: **`dyspozycje/AUDYT-NAPRAWY-LOG.md`**  
ROBOCZA: `gra-robocza/Gra-ROBOCZA.html` · pieczęć `aa380840` · `dyspozycje/WERSJE.md` AKTUALNA

*MASTER/Cursor · 2026-07-21 · wdrożone · log: AUDYT-NAPRAWY-LOG.md*
