# HANDOFF: UNITS → MASTER — rename Legionista→Hastati, Evocati→Triari (ref w main.ts)

**Data:** 2026-06-25 · **Od:** Grupa C · **Do:** MASTER (silnik/kanon)

Naster zmienił nazwy 2 jednostek rzymskich. Zmienione w `data/units.json` (pole „Jednostka" + „Nazwa EN"):
- „Legionista" → **„Hastati"**
- „Evocati (Gwardia Triarii)" → **„Triari"**

UNITS zaktualizował SWOJE pliki (units.ts dispatch z aliasami — stare nazwy nadal renderują; testBattle presety; battleScene isCannedSide). Ale w plikach SILNIKA/kanonu są twarde odwołania po starej nazwie „Legionista", które po renamie klucza NIE znajdą jednostki:

**`src/main.ts` — DO POPRAWY (Master):**
- L1138: `data.units.find(u => u['Jednostka'] === 'Legionista')` → zmień na `'Hastati'`.
- L1165: hardcoded fallback `'Jednostka': 'Legionista'` → `'Hastati'`.
- L1195: `nazwa: 'Legionista'` (BattleUnit) → `'Hastati'`.

Po poprawce: przebuduj KANON `Gra-podglad.html`. (units.json ma już 51 jednostek; „Hastati" Epoka=Żelazo, „Triari" Epoka=Żelazo.)

Uwaga: aliasy w units.ts (`legionista`/`legionary`→ ten sam model co `hastati`; `evocati`→ `triari`) zostawione, więc RENDER nie pęknie nawet przy starych nazwach; problem dotyczy tylko LOOKUPU po „Jednostka" w main.ts.

— Grupa C
