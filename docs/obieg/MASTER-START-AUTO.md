# Master — auto START co 15 min

> **Cel:** Hub Master sam sprawdza meldunki, gdy Slack nie dowozi. **Pliki = prawda** · Slack = opcjonalny trigger.

---

## Uruchomienie (Maciej / Master w czacie hub)

**Kopia dzienna grywalnej (raz na start dnia — przed skanem):**

```powershell
cd gra
.\tools\backup-grywalna-dzien.ps1
.\tools\audyt-abc-handoff.ps1
```

**Jednorazowy skan (START teraz):**

```powershell
cd gra
.\tools\master-watch-inbox.ps1 -Once
```

**Pętla co 15 min (w tym czacie — agent nasłuchuje tick):**

```powershell
cd gra
.\tools\master-watch-inbox.ps1 -IntervalSeconds 900
```

**Reset stanu (baseline):**

```powershell
cd gra
.\tools\master-watch-inbox.ps1 -InitOnly
```

---

## Co jest skanowane

| Źródło | Po co |
|--------|--------|
| `dyspozycje/_handoff/*MASTER*` | `→ MASTER: GOTOWE` / `GOTOWE-KANON` |
| `dyspozycje/*-DO-MASTERA.md` | meldunki lane |
| `dyspozycje/SILNIK-DO-MASTERA.md` | F → Master |
| `docs/obieg/INTEGRATOR-kolejka.md` | md5 kanonu, kolejka F |
| `docs/obieg/MASTER-WATCH.md` | status orkiestracji |
| `docs/obieg/SLACK-OUTBOX-*.md` | gdy Slack nie dotarł — outbox w repo |
| `Gra-podglad.html` | md5 dysk vs dokumenty |
| `gra-robocza/ROBOCZA-MANIFEST.json` | md5 roboczej (źródło prawdy) |
| `gra-kanon/KANON-MANIFEST.json` | md5 finalnej |

Stan ostatniego skanu: `docs/master/MASTER-INBOX-WATCH.json`

---

## Zachowanie agenta na tick

**Zasada kanon:** dyspozycja (krok 1) → **wykonanie (krok 2)** w tej samej turze. [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md) § dyspozycja → wykonanie.

Sentinel w terminalu: `AGENT_LOOP_TICK_MASTER_INBOX` + JSON z polem `prompt`.

Agent wykonuje **`start`** (checklist powyżej) i **od razu wykonuje pracę Mastera** — nie czeka na kolejne pytanie Macieja.

### Auto-dispatch (KANON — od 2026-07-01)

| Wykryto | Master robi **natychmiast** (w tej samej turze) |
|---------|--------------------------------------------------|
| `→ MASTER: GOTOWE` w handoff lane | ACK + **dyspozycja F** |
| `→ MASTER: GOTOWE-ROBOCZA` od F | **Weryfikacja F** (§4 MASTER-ZADANIA) → review → promocja finalna → następny batch |
| `GOTOWE-KANON` od F (legacy) | Traktuj jak GOTOWE-ROBOCZA |
| Meldunek lane bez blokera ABC | **Dyspozycja F** + **delegacja wykonania** (Task subagent Grupa F lub czat F `działaj`) — nie zostawiaj „czeka u F” bez uruchomienia |
| Brak zmian | Jedna linia OK dla Macieja |

Pełna pętla: [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md)

**Zakaz:** raport „wisi u Mastera / czeka u F” bez **kroku 2** w tej samej turze.

**Maciej widzi:** krótki status (co zrobiono), nie prośbę „czy mam delegować”.

Powiązane: [`MASTER-WATCH.md`](MASTER-WATCH.md) · [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md) · [`DWIE-WERSJE-GRY.md`](DWIE-WERSJE-GRY.md) · [`_ZASADY.md`](_ZASADY.md) § Master auto-dispatch

---

## Zatrzymanie

W czacie hub: **`stop watch`** — Master zatrzymuje proces pętli w terminalu.

---

## Slack — znane ograniczenie

Grupy **muszą** zapisywać handoff w plikach. Slack MCP czasem nie synchronizuje (Cursor / workspace). Outbox `SLACK-OUTBOX-<grupa>-*.md` = backup gdy wiadomość nie weszła na kanał.

Powiązane: [`SLACK-OBIEG.md`](SLACK-OBIEG.md) · [`MASTER-WATCH.md`](MASTER-WATCH.md)
