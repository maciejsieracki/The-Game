# Master Silnik — katalog roboczy

> **Hub operacyjny Master Orkiestrator (2026-06-30):** plan, dyspozycje, weryfikacja — **bez kodu**.
> **Role:** [`../obieg/ROLE-2026-06-30.md`](../obieg/ROLE-2026-06-30.md) · **Status bieżący:** [`../obieg/MASTER-WATCH.md`](../obieg/MASTER-WATCH.md)
> **Nie edytuje** `main.ts` — to **Grupa F** (osobny czat). Kanon publikuje F; Master **ACK** po review subagentem.

**Data porządkowania:** 2026-06-27

---

## Start sesji (Maciej)

| Co | Gdzie |
|----|-------|
| **Obieg do akceptacji** | [`../obieg/OBIEG-AKCEPTACJA-2026-06-30.md`](../obieg/OBIEG-AKCEPTACJA-2026-06-30.md) |
| Slack (trigger) | [`../obieg/SLACK-OBIEG.md`](../obieg/SLACK-OBIEG.md) |
| Status Master | [`../obieg/MASTER-WATCH.md`](../obieg/MASTER-WATCH.md) |
| **Lista playtestów (kolejka)** | **`REJESTR-PLAYTESTOW.md`** (§1 Maciej · §2–§4 agenci) · szczegóły batchy: `LISTA-PLAYTESTS.md` |
| Odpowiedzi ABC (skrót) | `maciej/KARTA-DECYZJI.md` |
| Co czeka na Ciebie | `maciej/` + `../decyzje/B-OTWARTE-PYTANIA.md` |
| Panel Excel | `../../Status-projektu-The-Game.xlsx` — **instrukcja:** `STATUS-TRACKER-EXCEL.md` |
| Playtest | **REJESTR §1** — test dopiero po ~100% gry (§0) |

---

## Mapa katalogu `docs/master/`

```
docs/master/
├── README.md                 ← TEN PLIK (hub)
├── AUDYT-2026-06-27.md       ← pełny raport audytu
├── INDEX-PLIKOW.md             ← mapa wszystkich plików Master
├── KANDYDACI-USUNIECIE.md      ← propozycje archiwizacji (decyzja Macieja)
├── protokoly/
│   └── MASTER-SILNIK.md        ← procedury weryfikacji (checklist 6 kroków + subagent)
├── maciej/                     ← panele decyzji dla Macieja
│   ├── MACIEJ-PLAYTEST-CHECKLIST.md  ← pełna gra v1.0
│   └── …
├── LISTA-PLAYTESTS.md          ← scenariusze batchy (Master)
├── REJESTR-PLAYTESTOW.md       ← **JEDNO MIEJSCE** playtest (Maciej §1 · eksport §4)
└── _deprecated/                ← stub-y wycofane (nie kasować bez OK)
```

---

## Pliki na żywo (ścieżki stabilne dla agentów)

Te katalogi **zostają** w dotychczasowych lokalizacjach — agenci i reguły `.cursor` odwołują się do nich:

| Rola | Ścieżka |
|------|---------|
| Dyspozycje Master → czaty | `docs/czaty/OD-MASTERA.md` |
| Raporty czatów → Master | `docs/czaty/DO-MASTERA.md` |
| Chartery A–F | `docs/czaty/GRUPA-*.md`, `DYSPOZYCJA-*.md` |
| Decyzje tematyczne | `docs/decyzje/*.md` |
| Dashboard statusu | `docs/decyzje/STATUS.md` |
| Rejestr cross-lane | `dyspozycje/DZIENNIK-MASTERA.md` |
| Raporty F → Master | `dyspozycje/SILNIK-DO-MASTERA.md` |
| Handoffy wpięcia | `dyspozycje/_handoff/` |
| Archiwum czatów | `docs/archiwum-czatow/` |

---

## Model ról (skrót)

```
Maciej (ABC, playtest w czacie)
  ├─ Grupy A–E: lane + ABC (bez main.ts)
  ├─ Grupa F: main.ts + bramka → Gra-podglad-ROBOCZA.html
  └─ Master Orkiestrator: hub → review subagent → ACK (+ Slack)
```

**Wycofane:** Opus · Master GLM. **Obieg:** `docs/obieg/OBIEG-AKCEPTACJA-2026-06-30.md`

---

## Komendy

| Gdzie | Komenda | Efekt |
|-------|---------|-------|
| Grupa A–F | `master` | Czytaj `OD-MASTERA.md` § swoja grupa |
| Master Silnik | `czaty` | Czytaj `DO-MASTERA.md` + `*-DO-MASTERA.md` |
| Master Silnik | `status` | `docs/decyzje/STATUS.md` |
| Master Silnik | `weryfikuj` | `protokoly/MASTER-SILNIK.md` § procedura |

---

*Zastępuje rozproszone `docs/MASTER-SILNIK.md` (stub redirect).*
