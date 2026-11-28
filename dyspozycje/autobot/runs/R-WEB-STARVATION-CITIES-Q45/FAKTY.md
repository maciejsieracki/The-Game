# FAKTY dla pytania R-WEB-STARVATION-CITIES-Q45 (jedyne źródło faktów turnieju; kopie z dokumentów na main)

STAN WIĄŻĄCY: Właściciel wybrał Q42=C (koniec tury nie blokowany z powodu żywności) i Q44=A (zostaje głód wojska bez utraty ludności). FALA 941 zdjęła blokadę. Pomiar silnika (NIE ZMIERZONO w żywej grze): miasto, którego WŁASNY bilans żywności jest ujemny, przy wyczerpanym zapasie państwa (0) jest nienakarmione i traci 1 mieszkańca na turę (pop 5→4 w turach 1–3 testu); wcześniej blokada końca tury zatrzymywała taką turę, więc ten stan nie występował przy kończeniu tury. Deficyt samego wojska (koszt utrzymania jednostek) odejmowany jest od zapasu PO nakarmieniu miast, więc sam deficyt wojska nie zabiera mieszkańców; to dotyczy miast, które same mają ujemny bilans.

## Z dokumentu wdrożenia (GLOD-WDROZENIE-Q44A)
## Pomiar ryzyka wobec Q44=A (miasta nienakarmione)

Zmierzono mechanizm (node, `advanceEmpireFood` + `applyHungerPenaltyV85`, bez jednostek, zapas 0, miasto z bilansem -2/turę):
- tury 1–3: `zapasyPo=0`, `fedByCityId(c1)=false` w każdej turze;
- `applyHungerPenaltyV85(pop 5, nienakarmione)` → 4 mieszkańców, `ubytek=true` (utrata 1 ludności za turę).

Wniosek: po zdjęciu blokady miasto z własnym deficytem żywności, przy wyczerpanym zapasie państwa, **traci ludność**. Wcześniej bramka blokowała taką turę, więc ten stan nie wystąpiał przy zakończeniu tury. Obecnie mechanizm jest aktywny. Nie jest to „utrata ludności z powodu deficytu wojska” w sensie inwentarza (przyczyną jest deficyt miasta), ale skutek dla gracza jest ten sam. **NIE ZMIERZONO**: czy w realnej grze (żywy przebieg) zdarza się ten stan i jak często. Rozstrzygnięcie zachowania to decyzja właściciela (pytanie ABC), nie decyzja operatora.

## NIE ZMIERZONO (lista jawna)

## Z dokumentu GLOD-ZAMIAST-BLOKADY (§2, I-16, I-17)
| I-16 | `gra/src/game/population-growth-v85.ts` l. 385–410 `applyHungerPenaltyV85`; wywołanie l. 572–580 | Miasto nienakarmione (`fed=false`) traci 1 ludność za turę (mnożnik `1 + lud_spadek_proc`, min. 1 ludność) |
| I-17 | `gra/src/game/empire-food.ts` l. 260–275 | Miasto jest „nienakarmione”, gdy jego bilans jest ujemny i centralny zapas nie pokrywa deficytu (`fedByCityId`) — przed odjęciem kosztu armii |
**Gracz (tura po zdjęciu blokady, wg kodu):**
- **Miasta:** miasto staje się „nienakarmione” tylko gdy jego własny bilans jest ujemny i centralny zapas nie pokrywa deficytu (`empire-food.ts` l. 260–275). Wtedy traci 1 ludność za turę (`applyHungerPenaltyV85`, l. 385–410), a wzrost zatrzymuje się. Przy deficycie wojskowym miasta są najpierw karmione z zapasu (odjęcie kosztu armii następuje później, l. 280), więc **sam deficyt armii nie zabiera ludności miastom** — stwierdzone w kodzie, NIE ZMIERZONO na żywo po t16.
- **Zapas:** clampowany do 0 po ticku (`central = Math.max(0, central)`, l. 294–297) — brak długu, brak spirali zapasu w samym silniku.
**Podsumowanie zachowania dziś:** gracz ma blokadę (nie ma głodu do czasu rozwiązania jednostek); AI ma automatyczne rozwiązanie jednostek; przy zdjęciu blokady oba przypadki wpadają w ten sam hak głodu armii, bez utraty ludności miast.
