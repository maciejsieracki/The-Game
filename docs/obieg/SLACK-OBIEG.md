# Slack — obieg komunikacji (trigger)

> **Status:** 🟢 **Faza 2 — Slack MCP podpięty** (2026-06-26) · obieg **✅ akceptacja Maciej 2026-06-30** · [`OBIEG-AKCEPTACJA-2026-06-30.md`](OBIEG-AKCEPTACJA-2026-06-30.md)
> **Zasada:** Slack = sygnał START · pliki = prawda · Cursor = wykonanie

**Workspace:** [The Game — invite](https://join.slack.com/t/thegame-jbl3744/shared_invite/zt-42j2jkjfl-VnRIogsDtt03yEfGkk9XRw)

---

## Slack MCP (Faza 2 — aktywna)

**Serwer Cursor:** `plugin-slack-slack` · autoryzacja: OK (2026-06-26).

Gdy Maciej wpisze **`slack`** lub **`start slack`** w czacie Master (lub grupy):

1. Agent wywołuje MCP **`slack_search_channels`** — znajdź kanał grupy / `#master`
2. **`slack_read_channel`** — ostatnie wiadomości (limit 20–50, newest first)
3. Opcjonalnie **`slack_search_public`** — szukaj `[GRUPA-`, `[MASTER]`, `GOTOWE`, `md5`
4. **Potem** pliki: `MASTER-WATCH.md`, `_handoff/`, plik obiegu lane

**Master może wysłać ACK/BLOCK** przez **`slack_send_message`** (channel_id z kroku 1).

| Narzędzie MCP | Kiedy |
|---------------|-------|
| `slack_search_channels` | start `slack` — mapowanie nazwa → ID |
| `slack_read_channel` | odczyt triggerów na kanale |
| `slack_search_public` | cross-kanał: „co nowe od wczoraj" |
| `slack_send_message` | ACK/BLOCK/dyspozycja skrót (link do pliku w repo) |
| `slack_create_conversation` | **tylko na prośbę Macieja** — zakładanie kanałów |

**Mapowanie kanał → grupa (kanon):**

| Kanał | ID | Grupa | Domena |
|-------|-----|-------|--------|
| `#master` | `C0BE1FDVAMB` | Master + Maciej | dyspozycje, ACK, BLOCK |
| `#grupa-a` | `C0BDYGW02JF` | **A** | mapa, HUD, ulepszenia |
| `#grupa-b` | `C0BEZ5S0U6L` | **B** | miasto, ekonomia, tech |
| `#grupa-c` | `C0BE6NGSYG1` | **C** | walka, oblężenie |
| `#grupa-d` | `C0BE6NGFKKK` | **D** | cywilizacje, AI, dyplomacja |
| `#grupa-e` | `C0BDPD5R5JB` | **E** | start, meta, menu |
| `#grupa-f` | `C0BE8GG2EHJ` | **F** | integrator, kanon, md5 |
| `#decyzje` | `C0BEZ5T29HN` | wszystkie | skrót ABC |
| `#all-the-game` | `C0BE8E100MS` | ogólny | ogłoszenia workspace |

**Stan:** ✅ wszystkie kanały workflow utworzone 2026-06-26 · wiadomości powitalne + szablony wysłane.

---

## Kanały (docelowy układ)

| Kanał | Subskrybenci | Cel |
|-------|--------------|-----|
| `#master` | Maciej, Master | dyspozycje, ACK, BLOCK, `co dalej` |
| `#grupa-a` … `#grupa-e` | lane + Master | GOTOWE → INTEGRATOR, postęp lane |
| `#grupa-f` | F + Master | wpięcia, bramka, md5 kanonu |
| `#decyzje` | Maciej + wszystkie lane | skrót ABC (pełna forma nadal w czacie Cursor) |

---

## Gdzie Slack wpinamy w proces (mapa)

```
[Lane skończyła moduł / Maciej: przekaż do Mastera]
    → plik: handoff + docs/obieg/<X>.md flaga → MASTER: GOTOWE
    → Slack: #grupa-<X> + #master  ←── TRIGGER (OBOWIĄZKOWY — agent grupy, nie Maciej)

[Master dyspozycjonuje]
    → plik: MASTER-WATCH + ewent. nowy handoff
    → Slack: #master  ←── TRIGGER dla F / lane (Maciej: „slack" w czacie)

[Maciej odpala grupę]
    → Cursor: slack / start slack
    → agent: najpierw Slack (co nowe), potem pliki 🎯 TERAZ

[Grupa F wpięła batch]
    → plik: SILNIK-DO-MASTERA + INTEGRATOR-kolejka md5
    → Slack: #grupa-f  ←── TRIGGER review u Mastera

[Master review subagent APPROVE]
    → plik: MASTER-WATCH ACK + DZIENNIK
    → Slack: #master  ←── TRIGGER opcjonalnego playtestu Macieja

[Master review BLOCK]
    → Slack: #master + #grupa-<źródło>  ←── TRIGGER poprawki lane
```

---

## Szablon wiadomości (kopiuj-wklej)

### Po **`przekaż do Mastera`** (Maciej w czacie grupy — agent wysyła OBIE wiadomości)

**Kanały:** `#grupa-<X>` + `#master` · ID: tabela powyżej · narzędzie: MCP `slack_send_message`

```
[GRUPA-C] → MASTER: GOTOWE
Temat: C4-balans — skrót jednym zdaniem
Handoff: dyspozycje/_handoff/C-do-MASTER_….md
Plik: docs/obieg/C-walka.md
Testy: combat 6/6 · smoke OK
Maciej: przekaż do Mastera (2026-06-26)
```

*(Zamień C / kanał / nazwy plików na swoją grupę A–E.)*

**Kolejność agenta:** (1) pliki + handoff → (2) Slack #master → (3) Slack #grupa-X → (4) potwierdzenie Maciejowi jedną linią.

---

### Inne szablony (archiwum / F / starszy flow)

```
[GRUPA-D] → INTEGRATOR: GOTOWE
Handoff: dyspozycje/_handoff/NAZWA.md
TERAZ: krótki opis jednym zdaniem
Plik: docs/obieg/D-cywilizacje.md
```

```
[GRUPA-F] → MASTER: GOTOWE-KANON
Batch: NAZWA-BATCH
md5: XXXXXXXXX…
Bramka: combat 6/6 · smoke OK · …
```

```
[MASTER] ACK
Batch: …
md5: …
Review subagent: APPROVE
Playtest Maciej: opcjonalny
```

```
[MASTER] BLOCK → GRUPA-C
Powód: …
Handoff: … (co poprawić)
```

---

## Fazy wdrożenia

| Faza | Co | Status |
|------|-----|--------|
| **1** | Kanały + szablony + hasło `slack` w docs | ✅ szablony + komendy w [`KOMENDY-MACIEJA.md`](KOMENDY-MACIEJA.md) |
| **2 — MCP** | Cursor czyta/pisze Slack po `slack` | ✅ **GOTOWE** — MCP + 8 kanałów workflow |
| **3** | Obowiązek Slack po `przekaż do Mastera` (grupy A–E) | ✅ reguła `decyzje-echo.mdc` §2d · `_ZASADY` §7.1d |

**Jak używać (Maciej):** wpisz `slack` w dowolnym czacie Cursor → agent czyta Twój kanał grupy + `#master`, potem pliki.

---

## Czego Slack NIE robi

- Nie trzyma pełnych speców ani md5 jako jedynej kopii
- Nie zastępuje `_handoff/` ani testów bramki
- Bez wpisu w pliku **GOTOWE nie liczy się** — Slack sam w sobie nie zamyka batcha

---

## Powiązane

- [`ROLE-2026-06-30.md`](ROLE-2026-06-30.md) — role i przepływ
- [`KOMENDY-MACIEJA.md`](KOMENDY-MACIEJA.md) — `slack`, `start slack`
- [`MASTER-WATCH.md`](MASTER-WATCH.md) — status po Slack ACK
