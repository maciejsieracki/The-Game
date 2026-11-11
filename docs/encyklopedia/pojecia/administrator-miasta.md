# Administrator miasta

## Metadane

| id | `administrator-miasta` |
| tytuł | Administrator miasta |
| kategoria | Miasto i społeczeństwo |
| json_ref | `city-administrator-params.json` |
| kod_ref | `gra/src/game/city-administrator.ts` |

---

## Wiki‑S

**{{ikona-administratora}} Administrator miasta** to osoba przypisana do jednego miasta (maksymalnie jeden na miasto), którą zatrudniasz w nagłówku miasta. Zmniejsza korupcję, podnosi produkcję i ściągalność podatków miasta, a jako jedyny pozwala na **automatyczną budowę budynków** w tym mieście. Zatrudnienie kosztuje **40 Pieniądza** jednorazowo, utrzymanie **2 / 3 / 4 Pieniądza na turę** płaci skarbiec państwa.

---

## Wiki‑M

**Gdzie zatrudnisz:** w mieście z budynkiem administracyjnym — **Pałac** (stolica, poziomy I/II/III) albo **Dom Starszyzny / Dwór Zarządcy / Pretorium** (miasta regionalne). Przycisk „Administrator +" stoi w nagłówku miasta, obok „Ustaw jako stolicę"; po zatrudnieniu zmienia się w „Administrator ✓" (z opcją zwolnienia).

**Efekty (poziom I):** korupcja **−10%**, produkcja miasta **+3%**, ściągalność podatków miasta **+3%**. Skalują się poziomem budynku administracyjnego jak łańcuch Pałacu: **×1 / ×1,5 / ×2,25** (Dom Starszyzny = I, Dwór Zarządcy = II, Pretorium = III; Pałac I/II/III analogicznie). Redukcja korupcji **sumuje się** z Sądem, Trybunałem i Pałacem, a łączny limit redukcji pozostaje bez zmian.

**Utrzymanie:** 2 / 3 / 4 Pieniądza na turę (poziom I / II / III), płacone **z budżetu państwa**, nie z zasobów miasta.

**Brak środków w skarbcu:** administrator **nie pracuje** — brak efektów, brak bonusów i brak automatycznej budowy w jego mieście. Pozostaje przypisany i wraca do pracy, gdy skarbiec znów pokryje utrzymanie. Stan widać w podpowiedzi przycisku i na ikonie (wyszarzona, z czerwonym wykrzyknikiem).

**Opcja „Administratorzy”:** administratorów (miast i ulepszeń terenu) włączasz pytaniem w kreatorze nowej gry („Administratorzy: włączone / wyłączone”, domyślnie wyłączone). Wybór obowiązuje przez całą grę i nie ma przełącznika w ustawieniach w trakcie rozgrywki. Przy wyłączonej opcji nie ma administratorów ani automatyzacji budowy i ulepszeń — budujesz wszystko ręcznie (automatyczna rekrutacja z generałem działa niezależnie). Zapisy sprzed tej opcji wczytują się z wyłączonymi administratorami; automatyzację odzyskasz w nowej grze z włączoną opcją.

**Autobudowa:** przy włączonej opcji automatyzacja budowy budynków działa w mieście tylko wtedy, gdy ma ono **działającego** administratora. Bez niego miasto buduje ręcznie.

**Utrata:** zburzenie lub utrata budynku administracyjnego oraz zdobycie czy zniszczenie miasta kończą służbę administratora. **Ulepszenie** Domu Starszyzny → Dworu Zarządcy → Pretorium (i Pałacu I → II → III) zachowuje administratora i zwiększa skalę efektów.

**AI:** przeciwnicy zatrudniają administratorów na tych samych zasadach, gdy stać ich na koszt i mają budynek administracyjny.

**Powiązane hasła:** [[Porządek]] · [[Suwak handlu (podatki)]] · [[Założenie miasta]]
