# MASTER → Grupa C (Walka) — jednostki Faza 1 fix + Faza 2 roster

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **AKTYWNA** — decyzja Macieja 2026-07-03 ~23:45 |
| **Flaga handoff** | **GOTOWE do implementacji** |
| **Trigger Macieja w czacie C** | **`działaj`** |
| **Pliki lane** | `gra/data/units.json` **TYLKO** · testy `tools/combat-test.cjs` jeśli regresja |
| **NIE ruszać** | `main.ts` · Kusznik (epoka Średniowiecze — zamknięte) · epoki Celtów (celowo Żelazo) |

---

## Decyzje Macieja (zatwierdzone w rozmowie MASTER)

### Faza 1 — jedna korekta istniejącego wpisu

| Jednostka | BYŁO | MA BYĆ |
|-----------|------|--------|
| **Wojownik germański** | Epoka **Żelazo** · Super **—** · Koszt **16** · Klasa Specjalna | Epoka **Brąz** · Super **TAK** · Koszt **0** · Surowiec **—** · Surowiec (ilość) **0** · Tech **—** · Klasa **Super** · W zamian za **—** · `Dostępna w epokach`: **Brąz** |

**Staty walki:** bez zmian (fieldPower **32**, melee/missile jak w pliku).

**Bez zmian:** Wojownik celtycki, Gaesatae, Rydwan celtycki (epoka **Żelazo** — celowe) · Kusznik · reszta istniejących wpisów.

---

### Faza 2 — nowe wpisy od zera

**Zasada statów:** macierz TW v3 (`meleeAttack`, `health`, `missileAttack`…) — **nie** wymyślać starych Atak 70–85.  
**Skala:** wzór `fieldPower` względem istniejących: Konnica std **42** · Jeździec chiński **34,5** · Rydwan egipski **41,5** · super piechota **~52–55,5**.

**Maciej doprecyzował (2026-07-03):**
- **Słowianie:** + **konnica z oszczepami (szczepnikami)**
- **Asyria** (= Maciej mówi „Syryjczycy"): **dwie bardzo mocne konnice ofensywne** — (1) z **lancą**, (2) **dystansowa z łukiem**
- **Referencja wizualna konnicy bliskowschodniej:** `assets/c__Users_macie_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-f4da73aa-b74f-48a1-943c-9c11ba742c45.png` (lancer + łucznik konny, zbroja łuskowa)

---

## Batch 0 — Faza 1 (najpierw)

- [ ] Wojownik germański — metadane jak wyżej
- [ ] Backup: `units.json.bak-UNITS-faza1-2026-07-03`
- [ ] `node tools/combat-test.cjs` — 6/6

---

## Batch 1 — priorytet Macieja: Asyria + Słowianie (konnica)

### Asyria (`Nacja`: **Asyria** · start Brąz · bonus +20% łucznicy, +15% oblężenie)

| # | Nazwa | Epoka | Super | Klasa | W zamian za | Typ | Rola | Broń / profil | fieldPower (cel) |
|---|-------|-------|-------|-------|-------------|-----|------|---------------|------------------|
| A1 | **Konnica lancowa asyryjska** | **Żelazo** | — | Specjalna | **Konnica** | Mount | Flanka / Offensive | Długa lanca + okrągła tarcza; **najmocniejsza konnica szturmowa** w grze; wysoki `chargeBonus`, `Uderzenie` | **~55–60** (>> Konnica 42) |
| A2 | **Konnica łucznicza asyryjska** | **Żelazo** | — | Specjalna | **Konnica** | Mount | Dystans (konno) | Łuk kompozytowy konny; `Zasięg ataku` **2–3** · `Ilość pocisków` **18–24** · `missileAttack` **silny** (wzór: Kusznik 8 + konno); słabsza wręcz | **~52–58** |
| A3 | **Łucznik asyryjski** | Brąz | — | Specjalna | **Łucznik** | Distance | Dystans | Piechota — nazwa z `civs.json`; bonus +20% łucznik | **~18–22** (nad Łucznik egipski 13,5) |
| A4 | **Gwardia pałacowa** | Brąz | **TAK** | Super | — | Swordsman | Wręcz | Super Brązu — elitarna piechota pałacu | **~52–55** (jak Medżaj 55,5) |
| A5 | **Łucznik królewski** *(opc. elita piesza Żelaza)* | Żelazo | — | Specjalna | **Łucznik** | Distance | Dystans | Silniejszy od A3 | **~22–26** |

**Uwaga projektowa:** A1 + A2 to **serce stylu Asyrii** — obie muszą być wyraźnie silniejsze od standardowej Konnicy i od Jeźdzca chińskiego. Konnica łucznicza = jednostka z **`missileAttack` > 0** na koniu (wzoruj na Rydwan egipski: zasięg 2, pociski — ale profil konny, nie rydwan).

---

### Słowianie (`Nacja`: **Słowianie** · start **tylko Żelazo** · Brąz pomijamy)

| # | Nazwa | Epoka | Super | Klasa | W zamian za | Typ | Rola | Broń / profil | fieldPower (cel) |
|---|-------|-------|-------|-------|-------------|-----|------|---------------|------------------|
| S1 | **Drużynnik** | Żelazo | — | Specjalna | **Włócznik** | Swordsman | Wręcz | Nazwa z `civs.json`; piechota leśna; bonus las +15% | **~40–44** |
| S2 | **Woj drużyny księcia** | Żelazo | **TAK** | Super | — | Swordsman | Wręcz | Elita księcia; topór/włócznia | **~50–54** |
| S3 | **Jeździec z szczepnikami** *(NOWY — Maciej)* | Żelazo | — | Specjalna | **Konnica** | Mount | Flanka | Oszczepy/szczepniki (rzut) + włócznia; lekka konnica leśna; `missileAttack` umiarkowany (**4–6**), `Ilość pocisków` **4–6**; po rzucie walka wręcz | **~44–48** |

---

## Batch 2 — roster-6 pozostałe (0 wpisów dziś)

### Harappa (start Kamień)

| Nazwa | Epoka | Super | W zamian za | fieldPower (cel) |
|-------|-------|-------|-------------|------------------|
| **Strażnik bram Harappy** | Brąz | TAK | — | ~52–55 |
| **Piechota induska** | Brąz | — | Włócznik | ~38–42 |
| **Garnizon Harappy** | Żelazo | — | Wojownik z mieczem i tarczą | ~48–50 |

### Hetyci (start Brąz)

| Nazwa | Epoka | Super | W zamian za | fieldPower (cel) |
|-------|-------|-------|-------------|------------------|
| **Rydwan Kapadokijski** | Brąz | TAK | — | ~43–46 |
| **Piechota hetycka** | Brąz | — | Włócznik | ~40–44 |
| **Gwardia hetycka** | Żelazo | — | Wojownik z mieczem i tarczą | ~50–52 |

### Babilonia (start Brąz)

| Nazwa | Epoka | Super | W zamian za | fieldPower (cel) |
|-------|-------|-------|-------------|------------------|
| **Gwardia Ishtar** | Brąz | TAK | — | ~52–55 |
| **Wojownik babiloński** | Brąz | — | Wojownik z khopesh | ~38–42 |
| **Piechota neobabilońska** | Żelazo | — | Wojownik z mieczem i tarczą | ~48–50 |

### Fenicjanie (start Brąz)

| Nazwa | Epoka | Super | W zamian za | fieldPower (cel) |
|-------|-------|-------|-------------|------------------|
| **Tyrski miecznik** | Brąz | TAK | — | ~48–52 |
| **Wojownik fenicki** | Brąz | — | Wojownik z mieczem i tarczą | ~36–40 |
| **Gwardia Tyr** | Żelazo | — | Wojownik z mieczem i tarczą | ~48–50 |

---

## Batch 3 — oryginalne 7 typów (luki Brąz/Żelazo)

| Nacja | Nazwa | Epoka | Super | W zamian za | fieldPower (cel) |
|-------|-------|-------|-------|-------------|------------------|
| Grecy | **Thorakites** | Żelazo | — | Wojownik z mieczem i tarczą | ~50 (profil defensywny) |
| Rzym | **Legionarius** | Brąz | — | Wojownik z mieczem i tarczą | ~42–46 |
| Rzym | **Evocati** | Brąz | TAK | — | ~52–55 |
| Zulusi | **iButho z iklwa** | Żelazo | — | Impi | ~38–42 |
| Inkowie | **Gwardzista z champi** | Brąz | — | Wojownik z toporem | ~48–52 |
| Egipt | **Wojownik z żelaznym khopesh** | Żelazo | — | Wojownik z khopesh | ~48–52 |
| Sumer | **Mur tarcz (Sargonid)** | Żelazo | — | Włócznik sumeryjski | ~50–54 |
| Celtowie | **Miecznik galijski** | **Żelazo** | — | Wojownik z mieczem i tarczą | ~48–52 (ofensywna szarża) |

**Triari / Hastati:** bez zmian metadanych. **Principes:** nie dodawać bez osobnej decyzji Macieja.

---

## Szablon pól JSON (każdy nowy wpis)

Skopiuj strukturę z **Falanga** lub **Jeździec chiński** (Mount) / **Łucznik egipski** (Distance).

Obowiązkowe:
- `Jednostka`, `Nacja`, `Kultura` (jak Nacja), `Epoka`, `Dostępna w epokach`
- `W zamian za`, `Super-jednostka`, `Klasa` (Super / Specjalna)
- `Typ`, `Rola (linia)`, `Tech`, koszty, `Uwagi` (krótki opis broni)
- Blok TW v3: `meleeAttack`, `meleeDefence`, `weaponDamage`, `armor`, `piercing`, `chargeBonus`, `health`, `missileAttack`
- Polskie v2: `Atak`, `Obrona`, `Obrażenia`, `Przebicie`, `Pancerz`, `Uderzenie`, `Health`
- `fieldPower`, `_tw_v3_migrated`, `_tw_v3_balans`
- Super: `_super_tw_v3`, koszt **0**, surowiec **—**

Dla konnicy z rzutem: `Zasięg ataku (hex)`, `Ilość pocisków`, `missileAttack` > 0.

---

## Kolejność implementacji (rekomendacja)

1. **Batch 0** — Wojownik germański (szybki fix)
2. **Batch 1** — Asyria A1–A4 + Słowianie S1–S3 (**priorytet Macieja**)
3. **Batch 2** — Harappa, Hetyci, Babilonia, Fenicjanie
4. **Batch 3** — oryginalne 7 + Miecznik galijski

Można meldować po batchu — nie czekać na całość.

---

## DoD (Grupa C → MASTER)

- [ ] Wszystkie wpisy z batchy 0–1 (min.) w `units.json`
- [ ] Każdy wpis: pełny blok TW v3 + `fieldPower` spójny z celem
- [ ] Asyria A1/A2: fieldPower **wyższy niż Konnica (42)** — weryfikacja w meldunku (podaj liczby)
- [ ] `node tools/combat-test.cjs` — 6/6
- [ ] Meldunek: `dyspozycje/_handoff/GRUPA-C-do-MASTER_jednostki-faza2-2026-07-03.md`
- [ ] Wpis w `docs/obieg/C-walka.md` § TERAZ
- [ ] **NIE** publikować kanonu — tylko MASTER po Opus

---

## Referencje

- `Civ-DANE/PACZKA-DLA-UNITS-od-DANE.md` §6
- `gra/data/civs.json` — nazwy specjalne, `epokiStartowe`
- Wzorce Mount: `Konnica`, `Jeździec chiński`, `Rydwan celtycki`
- Wzorce Distance konno: `Rydwan egipski` (zasięg + pociski)

**Flaga:** GOTOWE
