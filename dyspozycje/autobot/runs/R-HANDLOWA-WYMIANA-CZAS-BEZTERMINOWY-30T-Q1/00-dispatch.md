# 00 — Dispatch

- ID: `R-HANDLOWA-WYMIANA-CZAS-BEZTERMINOWY-30T-Q1`
- Zgłoszenie: zwiększyć limit wymiany z 20 do 30 tur; zastąpić mylące `+100` opcją `Bezterminowo`.
- Zakres: wyłącznie cykliczna wymiana ilościowego surowca (`resourceTradeMode=per_turn`). Traktaty zachowują własne `treatyTurns`.
- Semantyka: `exchangeDurationTurns` nieobecne = starsza oferta i dotychczasowy finite fallback do `turns`; liczba = 1–30 tur; `null` = bezterminowo. `turns` pozostaje ograniczonym horyzontem wyceny, nie sentinel-em.
- Trwałe aktywne umowy już używają `wygasaTura:number|null`; stare zapisy liczbowe nie wymagają migracji. Ogólny zapis/odczyt `activeDeals` zachowuje `null`.
- Operator: `autobot/trade-duration-indefinite-q1`, branch `autobot/trade-duration-indefinite-q1`.
- Baza: `9f6f77711260d9c76abfce8578a49e2f8b4e98af`.
- Brak upoważnienia w tym zadaniu do deploy/push; nie wykonywać tych kroków.
