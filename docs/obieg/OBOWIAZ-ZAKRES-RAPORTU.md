# OBOWIĄZ — zakres raportu do Macieja (KANON 2026-07-02)

> **Decyzja Macieja:** grupy informują go **tylko o swoim lane'u** — braki ABC, wdrożenie, przekaz do Mastera. **Bez** raportów „całej gry".
> **Trigger:** wpisz **`zakres`** w czacie grupy A–E — agent **natychmiast** stosuje ten plik.

---

## Co Maciej dostaje od grupy (TYLKO TO)

| # | Temat | Format |
|---|--------|--------|
| **1** | **Brak ABC** — pytania bez Twojej odpowiedzi A/B/C | Sekcja **`❓ PYTANIA DO MACIEJA`** · hasło **`pytania`** |
| **2** | **Twoje ABC tej grupy** — wdrożone / w toku / zaległe | Hasło **`raport2`** — **wyłącznie** wpisy z `REJESTR-DECYZJI.md` przypisane do tej grupy |
| **3** | **Przekaz do Mastera** — czy oddali moduł | Sekcja 3 w **`raport2`**: handoff · `→ MASTER: GOTOWE` · Slack |

**Reszta statusu projektu = Master (hub), hasło `raport`.** Maciej **nie** zbiera tego z 6 czatów.

---

## Zakres per grupa (filtr — nic poza tym)

| Grupa | Tylko tematy |
|-------|----------------|
| **A** | mapa, HUD, minimapa, mgła, ulepszenia terenu, ruch, preBattle C1, wejście oblężenia z mapy |
| **B** | miasto, ekonomia, produkcja, Wealth, Power, żywność, tech/nauka, panel miasta |
| **C** | walka 3D, oblężenie, combat, balans macierzy, preBattle walki |
| **D** | cywilizacje, bonusy nacji, dyplomacja, AI, barbarzyńcy, dane JSON cyw |
| **E** | menu, kreator, start gry, meta, shell UI (nie panel miasta, nie HUD mapy) |

Pełna mapa: [`NAZEWNICTWO-GRUP.md`](NAZEWNICTWO-GRUP.md)

---

## ZAKAZY (Grupy A–E — NIENEGOCJOWALNE)

- ❌ Raport „status całej gry" / „co się dzieje w projekcie"
- ❌ Wymienianie batchy, md5, kolejki **Integratora F** (chyba że **blokuje** handoff **tej** grupy — 1 linia)
- ❌ Status **innych grup** (B mówi o C, A o D…)
- ❌ Playtest, checklist PT-, „przetestuj", zaległy playtest — **tylko Master** ([`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md) · **`rejestr`**)
- ❌ Opus, promocja kanonu, ROADMAP — to **Master**
- ❌ **`master` / build / publish-kanon** w czacie grupy — to **hub Master** ([`LANE-NIE-MASTER.md`](LANE-NIE-MASTER.md))
- ❌ Sekcje `raport` Mastera (4 sekcje A·B·C·4) w odpowiedzi grupy
- ❌ Prośba do Macieja: „przekaż do Mastera" / wklejanie między czatami

**Dozwolone:**

- ✅ „Brakuje ABC **B2-Q3**" (Twoja grupa)
- ✅ „**D18** wdrożone · test 26/26 · handoff → MASTER: TAK"
- ✅ „Blokuje Integrator: brak wiringu **D18**" (1 linia, bez audytu F)

---

## Jak ma wyglądać odpowiedź grupy Maciejowi

**Domyślnie krótko.** Nie otwieraj sesji od „oto pełny obraz gry".

| Hasło Macieja | Odpowiedź grupy |
|---------------|-----------------|
| **`pytania`** | Tylko **otwarte ABC tej grupy** (0 = napisz „0 otwartych") |
| **`raport2`** | 3 sekcje **tylko lane tej grupy** ([`RAPORT2-INSTRUKCJA.md`](RAPORT2-INSTRUKCJA.md)) |
| **`status`** | Skrót z **tego** pliku obiegu — 🎯 TERAZ + otwarte ABC + handoff |
| **`co dalej`** | **1** priorytet **tej grupy** (+ dlaczego) |

**Integrator F:** **nie raportuje Maciejowi** — tylko Master (`F-do-MASTER*`).

---

## Trigger `zakres` — co robi agent

Gdy Maciej wpisze **`zakres`**:

1. Przeczytaj ten plik.
2. Odpowiedz **3 linie:** „Stosuję OBOWIĄZ-ZAKRES · raportuję tylko lane [A/B/C/D/E] · ABC + wdrożenie + przekaz Master."
3. Usuń z bieżącej odpowiedzi wszelkie sekcje o innych grupach / całej grze / playteście / kolejce F (poza 1-liniowym blokiem).
4. W pliku obiegu grupy dopisz: `POTWIERDZENIE OBOWIĄZ-ZAKRES: 2026-07-02`

---

## Powiązane

- [`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md) · trigger **`rejestr`** · **`obowiaż`**
- [`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md)
- [`MACIEJ-ROLA-MINIMAL.md`](MACIEJ-ROLA-MINIMAL.md)
- [`RAPORT2-INSTRUKCJA.md`](RAPORT2-INSTRUKCJA.md)
- `.cursor/rules/komendy-raport.mdc` · `.cursor/rules/decyzje-echo.mdc`
