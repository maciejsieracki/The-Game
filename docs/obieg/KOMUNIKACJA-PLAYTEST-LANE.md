# Komunikacja lane — playtest (ZAKAZ w czacie Macieja)

> **Decyzja Macieja (2026-07-02):** informowanie o playtestach = **wyłącznie Master**.  
> **Ten plik:** lista zakazów + dozwolone zamienniki dla agentów A–F.

---

## Zasada

| Co | Kto |
|----|-----|
| **Zbiera kandydatów** | Lane → plik `REJESTR-PLAYTESTOW.md` **§2** |
| **Informuje Macieja** | **Tylko Master** (hub) |

---

## ❌ ZAKAZ w czacie z Maciejem (grupy A–E, F)

Nie używaj (ani synonimów):

- playtest · przetestuj · test w grze · sprawdź w grze
- zaległy / czeka / otwarty playtest · gotowe do testu
- checklist · scenariusz · PT-F01 · F-AC7 · PT-Z05
- „Maciej, kliknij…" · „odpal Gra-podglad…"
- sekcja **Playtest** w `start`, `raport2`, `status`, meldunku

---

## ✅ DOZWOLONE zamienniki

| Zamiast | Napisz |
|---------|--------|
| „czeka playtest Macieja" | _(nic — dopisz §2 rejestru)_ |
| „gotowe do playtestu" | **`→ MASTER: GOTOWE`** + handoff |
| Slack z checklistą | Slack **bez** playtestu — patrz szablon §2d `decyzje-echo.mdc` |

**Handoff (1 linia, Maciej nie czyta pliku):**

```
PLAYTEST-KANDYDAT: PT-XXX → REJESTR §2
```

---

## Slack po `przekaż do Mastera` — **bez** playtestu

```
[GRUPA-<X>] → MASTER: GOTOWE
Temat: <ID> — jedno zdanie
Handoff: dyspozycje/_handoff/<plik>.md
Testy lane: <np. 19/19 OK>
Playtest: → rejestr §2 (Master)
```

**ZAKAZ w Slacku:** „Maciej przetestuj…" · lista scenariuszy.

---

## Master — jedyny głośny kanał do Macieja

Szablon prośby: [`../master/SZABLON-PROŚBA-PLAYTEST.md`](../master/SZABLON-PROŚBA-PLAYTEST.md)

Maciej pyta sam: **`playtest lista`** → Master czyta REJESTR §1.

---

## Triggery w czacie grupy

| Hasło | Efekt |
|-------|--------|
| **`obowiaż`** | Stosuj ten plik + `OBOWIAZ-PLAYTEST-GATE.md` |
| **`rejestr`** | Dopisz §2 · potwierdź „playtest = Master, lane milczy" |

Powiązane: [`OBOWIAZ-PLAYTEST-REJESTR.md`](OBOWIAZ-PLAYTEST-REJESTR.md) · [`.cursor/rules/obowiaz-playtest-master-only.mdc`](../../.cursor/rules/obowiaz-playtest-master-only.mdc)
