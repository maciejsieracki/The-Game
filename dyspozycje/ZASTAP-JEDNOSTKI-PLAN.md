# Mechanizm „ZASTĄP" jednostki — plan wdrożenia (recon 2026-07-11)

> Status: **RECON GOTOWY, IMPLEMENTACJA WSTRZYMANA do decyzji UX.** Nic nie zbudowane w kodzie —
> mechanizm ma realne pytania UX, których nie zgadywałem. Poniżej: gotowy punkt wpięcia + funkcja +
> brakujące dane + **8 pytań do rozstrzygnięcia**. Po odpowiedziach implementacja jest szybka (złożoność M).

## Cel (ustalony wcześniej z Maciejem)
Na jednostce gracz może ją **ZASTĄPIĆ** (nie „awans") dowolną **DOSTĘPNĄ** jednostką **TEGO SAMEGO `Typ`**
(nawet słabszą). Lista = SUMA: {wszystkie odblokowane teraz jednostki tego samego `Typ` — tech/epoka/nacja}
+ {jeśli jest — konkretna jednostka specjalna, NAWET innego typu, np. tyrreński→Evocati}.

## 1. Jak działa dziś (punkty w kodzie)
- **Katalog rekrutacji miasta:** `game/production.ts:1095` `purchasableUnits()` = `availableProduction()` (`:621-732`)
  przefiltrowane do jednostek. Filtruje epokę, tech, nację, koszary (Brąz), dostęp do brązu, civ-bonusy.
- **UI miasta:** `ui/cityPanel.ts:5296,5309` woła `purchasableUnits(...)` → karty `ui/unitRecruitCard.ts:146`.
- **Jednostka runtime = `RuntimeUnit`** (`units/setup.ts:52-70`: `id,ownerId,typeId,category,q,r,ruchLeft,hp?,inGarnizon?`).
  UWAGA: `types/unit.ts` (interfejs `Unit`, enumy `RolaJednostki`) to **martwy/legacy kod** — nie mylić.
- **Pasek akcji jednostki na mapie = `ArmyStackHud`** (nie `UnitPanelHud` — ten jest martwy):
  stan w `main.ts:6517-6604` (`buildArmyStackHudState`, dzisiejsze akcje: `fortify`/`skip`/`disband`/`march-stop`),
  obsługa w `main.ts:6914-6947` (`onAction`, switch po `actionId`).
- **Wzorzec „usuń jednostkę + zwrot zasobów":** `disbandPlayerUnit()` `main.ts:2140-2185`.
- **Wzorzec „stwórz jednostkę":** `units.push({id,ownerId,typeId,category,q,r,...})` `main.ts:1477-1489` / `:10499-10510`.
- **Brak jakiegokolwiek mechanizmu upgrade/awansu jednostek.** Jedyny wzorzec „upgrade z zastąpieniem
  poprzednika" istnieje dla BUDYNKÓW (`game/building-upgrades.ts`, `production.ts:508-538`). Brak systemu
  weterana/doświadczenia na `RuntimeUnit` (napis „Awans → Weteran" w `battleScene.ts:7592` to tylko tekst).

## 2. Punkt wpięcia (rekomendacja)
**UI:** pasek `ArmyStackHud` — dodać akcję `replace` obok `fortify`/`disband`:
- `main.ts:6517-6604` → `actions.push({ id:'replace', label:'Zastąp', disabled: <lista pusta> })`
- `main.ts:6914-6947` → `else if (actionId==='replace') openUnitReplacePicker(u)` (modal wzorowany na
  `ui/cityUnitPick.ts` lub karty `ui/unitRecruitCard.ts`).

**Logika (nowa, czysta funkcja w `production.ts`):**
```ts
availableReplacementsFor(currentUnitName, data, unlockedTechs, ctx): ProductionItem[]
```
**Nie da się reużyć `availableProduction` 1:1** — dwa powody:
1. `availableProduction` CHOWA bazową jednostkę gdy jest lepszy zamiennik (`production.ts:685-693`,
   `replacedBySpec`) — a „Zastąp" ma pokazać WSZYSTKIE warianty tego samego `Typ`, też słabsze.
   → skopiować pętlę po `data.units`, ale **pominąć krok chowania bazowej** + dodać filtr `u.Typ === typ(current)`.
2. Bramka koszary/braz-access jest **per-miasto** (`production.ts:701-708`), a jednostka w polu nie ma miasta.
   → propozycja: „ma dostęp" = którekolwiek miasto gracza spełnia warunek (OR po miastach) — zależne od pytania UX #3.

Reużywalne 1:1: filtr epoki (`epochNumber :151`), nacji (`unitAllowedForCivNation :480`), tech (`techs.has`),
tokeny specjalne (`civSpecialUnitNameTokens :563`, `unitMatchesSpecialName :589`). Dane wejściowe są kompletne.

**Wykonanie zamiany (runtime):** znajdź `RuntimeUnit` po `id` → podmień `typeId`/`category` (lub splice+push na tym
samym `q,r`) → zachowaj/wyzeruj `hp`/`ruchLeft` wg decyzji → `syncUnitsRender()` + `refreshFog()` + `refreshD1bHud()`.

## 3. BRAK DANYCH — potrzebne NOWE pole w `units.json`
Zweryfikowane realne dane par:

| Jednostka | Nacja | Epoka | Typ | → jednostka specjalna |
|---|---|---|---|---|
| Wojownik tyrreński | Rzym | Brąz | **Offensive** | Evocati (**Swordsman**) |
| Wojownik mykeński | Grecja | Brąz | Swordsman | Hieros Lochos (Święty Zastęp) (Swordsman) |

`tyrreński(Offensive) → Evocati(Swordsman)` to **para MIĘDZY różnymi `Typ`** — nieodtwarzalna z żadnej
kombinacji istniejących kolumn (Rzym ma DWIE jednostki Super: Triari+Evocati; Fenicjanie mają dwie Specjalna
o tym samym Typ+Epoka). `mykeński→Hieros` działa przypadkiem (oba Swordsman), ale to nie reguła.

**Rekomendacja:** nowe pole **„Zastąp specjalnie"** w `units.json` (`string|null`, dokładna nazwa `Jednostka`;
dopuścić listę przez `/`). Wypełnić kuratorsko (~10-18 par Specjalna/Super — wymaga przeglądu Macieja).
Porównywać **dokładnie** po pełnej nazwie (NIE fuzzy `unitMatchesSpecialName` — ryzyko fałszywych trafień).

⚠️ **UWAGA PROCESOWA (dług projektu):** `units.json` jest formalnie generowany z Excela
(`panele-sterowania/Panel-*.xlsx` → `export-*.py`), a panele są **niezsync** z ręcznie edytowanym JSON.
Dodanie pola tylko w JSON zostanie utracone przy eksporcie paneli. Przy wdrożeniu: albo najpierw
zsynchronizować panele Excel z JSON (zaległy temat), albo dodać pole i w JSON, i w źródłowym panelu.
(`tools/export-data.py` jest DEPRECATED + ma martwą ścieżkę — sam nie odpali, ale kanon `export-{a..e}.py` tak.)

## 4. PYTANIA UX — DO ROZSTRZYGNIĘCIA (format a/b/c, [R]=rekomendacja)

**1. Koszt zasobowy?**
a) darmowe (tylko decyzja) · b) Pieniądz jak rekrutacja (`unitPurchaseCost :1076`) · c) różnica kosztów (nowa−stara) [R] · d) Praca tury miasta.

**2. Zużywa ruch/turę jednostki?**
a) cały ruch tury (jak `fortify`) [R] · b) nie zużywa (zastąp i działaj dalej) · c) część ruchu.

**3. Gdzie działa?**
a) tylko w garnizonie własnego miasta (jak `fortify`, sprawdza `cityAtUnit`) [R — najprostsze, rozwiązuje bramkę koszary/braz] · b) w granicach terytorium · c) wszędzie w polu.
(Wpływ techniczny: bramka koszary/braz-access jest per-miasto — poza miastem trzeba zdefiniować, czyje budynki/zasoby liczyć.)

**4. HP po zastąpieniu?**
a) pełne (świeża jednostka) · b) zachowaj % HP (60% max starej → 60% max nowej) [R] · c) HP nominalnie (ryzyko przekroczenia max nowej przy słabszej).

**5. Jednorazowe czy wielokrotne?**
a) raz na jednostkę · b) raz na turę [R] (wymaga pola `replaceUsedThisTurn?` na `RuntimeUnit`, jak `defLossesThisTurn?`) · c) bez limitu.

**6. Doświadczenie/weteran?** — **nie dotyczy**, system nie istnieje w kodzie. Pominąć (albo osobny, większy temat).

**7. Zakres listy — tylko własna nacja?** [R: TAK] — `unitAllowedForCivNation` już to wymusza; zmiana byłaby świadoma.

**8. Cały stos czy jedna karta?** [R: jedna aktywna karta] — `ArmyStackHud` operuje na `selectedId` w stosie.

**Dodatkowo (downgrade):** stara/nowa mają różne Utrzymanie + Manpower per epoka — czy zwracać/dopłacać różnicę
Manpower (jak `disbandPlayerUnit` zwraca ludność+manpower)? [R: tak, dopłata/zwrot różnicy]

## 5. Złożoność i ryzyka
- **Złożoność: M.** Logika czysta = S, dane (nowe pole + ~10-18 par) = S/M, UI (przycisk+modal) = M, runtime = M (kompozycja istniejących cegiełek).
- **Ryzyko 1 (śr.):** bramka koszary/braz per-miasto vs jednostka w polu — bez decyzji #3 łatwo o niespójność.
- **Ryzyko 2 (śr.):** kopiując pętlę `availableProduction` nie zgubić filtra nacji/epoki przy usuwaniu kroku „hide superseded".
- **Ryzyko 3 (nis.):** nowe pole „Zastąp specjalnie" — porównywać dokładnie, nie fuzzy.
- **Ryzyko 4 (nis.):** nie wpiąć w martwy `ui/unitPanelHud.ts` (nieużywany) zamiast `ArmyStackHud`.
