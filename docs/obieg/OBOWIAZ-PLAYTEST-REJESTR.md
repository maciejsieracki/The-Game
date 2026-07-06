# OBOWIAZ — rejestr playtestów (jedno miejsce · cisza w czacie Macieja)

> **Decyzja Macieja (2026-07-02):** informowanie o playtestach (**w tym zaległych**) = **wyłącznie Master**.  
> **Lane A–F:** cichy wpis **REJESTR §2** — **zero** słów o playtest w czacie z Maciejem.  
> **Plik:** [`../master/REJESTR-PLAYTESTOW.md`](../master/REJESTR-PLAYTESTOW.md)  
> **Trigger:** **`rejestr`** · **`obowiaż`**  
> **Reguła Cursor:** `.cursor/rules/obowiaz-playtest-master-only.mdc`  
> **Komunikacja lane:** [`KOMUNIKACJA-PLAYTEST-LANE.md`](KOMUNIKACJA-PLAYTEST-LANE.md) · **Master → Maciej:** [`SZABLON-PROŚBA-PLAYTEST.md`](../master/SZABLON-PROŚBA-PLAYTEST.md)

---

## Zasada w jednym zdaniu

**Playtest u Macieja = tylko Master mówi. Lane = tylko wpis w pliku §2.**

---

## Kto co robi

| Rola | Playtest w czacie z Maciejem | W plikach |
|------|------------------------------|-----------|
| **Maciej** | Słyszy o playtest **tylko od Mastera** (hub) · `playtest OK`/`BUG:` po prośbie Mastera | — |
| **Grupy A–E** | **ZAKAZ** — także „zaległe playtesty", PT-*, checklisty, „czeka test" | Dopisz **REJESTR §2** po kanonie |
| **Integrator F** | **ZAKAZ** — meldunek techniczny bez playtestu | Dopisz **REJESTR §2** |
| **Master** | **Jedyny** informuje o kolejce / zaległościach / prośbie o test | Utrzymuje §0–§4 · otwiera §0 przy ~100% gry |

---

## Co dopisać w §2 (lane — kandydat)

```
| RRRR-MM-DD | PT-XXX | temat | Lane X | md5… | skrót scenariuszy | handoff.md | ⏸ KOLEJKA |
```

Handoff do Mastera (Maciej nie czyta): `PLAYTEST-KANDYDAT: PT-XXX → REJESTR §2`

**Nie:** Slack z checklistą · sekcja playtest w `raport2` · „Maciej, masz zaległy playtest".

---

## Master — kiedy informuje Macieja

| Kiedy | Jak |
|-------|-----|
| **Przed v1.0** | **Nie** informuje (§0 ZAMKNIĘTA) — tylko zbiera §2 |
| **Po ~100% gry** | Otwiera §0 · **`playtest lista`** / hub · jedna prośba o test |
| **Po teście** | Dopis §3 · `PLAYTEST: PT-… → OK/BUG` w dzienniku |

**`start` / `raport` dla Macieja:** **bez** sekcji playtest (chyba że sam zapyta).

---

## ZAKAZY (grupy A–E + F)

- ❌ Jakakolwiek wzmianka o playtest w odpowiedzi do Macieja
- ❌ „Zaległy playtest" · „czeka na Ciebie test" · checklist PT-*
- ❌ Sekcja Playtest w `start`, `raport2`, `status`, meldunku GOTOWE

**Dozwolone u grupy:** ABC · wdrożenie · **`przekaż do Mastera`** · **`raport2`** (3 sekcje, bez playtestu)

---

## Powiązane

- [`OBOWIAZ-PLAYTEST-GATE.md`](OBOWIAZ-PLAYTEST-GATE.md) · [`../master/LISTA-PLAYTESTS.md`](../master/LISTA-PLAYTESTS.md)
