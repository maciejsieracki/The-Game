# Wspólny obieg — Grupy A–E (fragment do dyspozycji)

> Wklejany w każdym `DYSPOZYCJA-GRUPA-*.md` · **kanon 2026-06-30**

## Role

| Rola | Gdzie | Robi |
|------|-------|------|
| **Maciej** | ten czat | ABC · balans · **`działaj`** · **`przekaż do Mastera`** · playtest **tylko od Mastera** (hub) |
| **Master Orkiestrator** | osobny czat hub | dyspozycja · kolejka F · review subagent · ACK |
| **Integrator (F)** | osobny czat | `main.ts` · kanon · bramka |

**Wycofane (NIE cytuj w handoffie):** Opus · „wklej do Mastera" · `DO-MASTERA`/`OD-MASTERA` · `SCHEMAT-DWIE-WERSJE.md` (archiwum flow) · komenda Macieja **`start`**

## Przepływ

```
ABC → ECHO (REJESTR) → balans? → Maciej: działaj → kod/panel/testy lane
  → Maciej: przekaż do Mastera
  → agent: handoff + plik obiegu + Slack #master + #grupa-X
  → Master → Integrator F → kanon → Master ACK
  → lane: dopis REJESTR-PLAYTESTOW §2 (cisza w czacie) · Master informuje Macieja gdy trzeba
```

## Hasła Macieja (tylko te — reszta = agent/Master)

| Hasło | Agent robi |
|-------|------------|
| **A / B / C** | ECHO → AskQuestion wdrażaj? / doprecyzujmy |
| **działaj** | 🔵 W TRAKCIE · kod/eksport/testy (koniec dyskusji) |
| **przekaż do Mastera** | `→ MASTER: GOTOWE` + `_handoff/` · Slack §2d · 🟠 U MASTERA |
| **format** / **ABC** | Przepisz pytanie — **tylko** `docs/obieg/_ABC-JAK-PYTASZ.md` (stary „O co chodzi" **wycofany**) |
| **`ścieżka`** | **2026-07-05** — czytaj [`OBOWIAZ-SCIEZKA-KODU.md`](../obieg/OBOWIAZ-SCIEZKA-KODU.md) · potwierdź `POTWIERDZAM ŚCIEŻKĘ · Grupa X` · **ZAKAZ** `gra-robocza/src/`, `gra-kanon/src/` |

## ABC — JEDYNY wzór (przed każdą paczką)

Czytaj **wyłącznie:** `docs/obieg/_ABC-JAK-PYTASZ.md` · `ABC-FORMAT-KANON-MACIEJ.md` · `SZABLON-PYTANIA-ABC.md` · `abc-pelna-forma.mdc`  
**ZAKAZ:** sam `AskQuestion` · „O co chodzi i dlaczego" · skróty · brak rekomendacji A/B/C

**ZAKAZ:** prosić Macieja o wklejanie meldunku w czacie Mastera · czekać po balansie bez reakcji na **`działaj`** · **playtest w czacie grupy** ([`KOMUNIKACJA-PLAYTEST-LANE.md`](../obieg/KOMUNIKACJA-PLAYTEST-LANE.md) · trigger **`rejestr`**).

## Raportowanie (pliki = prawda)

- **CZYTAJ/PISZ:** `docs/obieg/<plik-grupy>.md` · `docs/obieg/REJESTR-DECYZJI.md`
- **Handoff:** `dyspozycje/_handoff/<GRUPA>-do-MASTER_<temat>.md`
- **Slack:** `docs/obieg/SLACK-OBIEG.md` · MCP po `przekaż do Mastera`
- **Historia (append-only, opcjonalnie):** `dyspozycje/*-DO-MASTERA.md` — nie główny kanał meldunku

## Self-check przed «przekaż do Mastera»

`typecheck` + testy lane PASS · warstwa 🟢/🟡/🔴 · `.cursor/rules/zmiany-izolacja.mdc`  
**NIE** edytuj `main.ts` · **NIE** buduj `Gra-podglad.html`

Pełna reguła: `.cursor/rules/decyzje-echo.mdc` §2c–2d · `docs/obieg/_ZASADY.md` §7.1c–d
