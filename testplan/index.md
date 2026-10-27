# Testplan · Elkoll

Testfall för Elkoll som docs-as-code. Varje testfall har steg-för-steg-instruktioner så att det kan köras manuellt på telefonen.
Automatiserade testfall körs dessutom av Playwright vid varje commit och är kopplade via sitt ID.

| | |
|---|---|
| **Testfall** | 67 |
| **Automatiserade** | 60 (körs på iPhone/WebKit och Android/Chromium) |
| **Manuella** | 7 (kräver riktig iPhone eller riktig backend) |
| **Senaste testrapport** | [dennishoglund.github.io/elkoll/rapport/](https://dennishoglund.github.io/elkoll/rapport/) |
| **Krav** | [SPEC.md](../SPEC.md) |

**Typ:** 🤖 automatiserad · 🖐️ manuell  **Prioritet:** Hög = måste fungera ute på jobb, Medel = viktig, Låg = bekvämlighet

## Inloggning

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-INL-01](testfall/TC-INL-01.md) | [Inloggningen visas när man inte är inloggad](testfall/TC-INL-01.md) | Hög | 🤖 |
| [TC-INL-02](testfall/TC-INL-02.md) | [Fel lösenord ger tydligt felmeddelande](testfall/TC-INL-02.md) | Hög | 🤖 |
| [TC-INL-03](testfall/TC-INL-03.md) | [Ogiltig e-post stoppas innan något skickas](testfall/TC-INL-03.md) | Medel | 🤖 |
| [TC-INL-04](testfall/TC-INL-04.md) | [Rätt uppgifter loggar in och visar dagens uppdrag](testfall/TC-INL-04.md) | Hög | 🤖 |
| [TC-INL-05](testfall/TC-INL-05.md) | [Inloggningen finns kvar efter omstart](testfall/TC-INL-05.md) | Hög | 🤖 |
| [TC-INL-06](testfall/TC-INL-06.md) | [Logga ut](testfall/TC-INL-06.md) | Medel | 🤖 |
| [TC-INL-07](testfall/TC-INL-07.md) | [Ny kollega skapar konto](testfall/TC-INL-07.md) | Hög | 🤖 |

## Teamet

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-TEAM-01](testfall/TC-TEAM-01.md) | [Skapa nytt team](testfall/TC-TEAM-01.md) | Hög | 🤖 |
| [TC-TEAM-02](testfall/TC-TEAM-02.md) | [Medlemmar visas med telefon och ringknapp](testfall/TC-TEAM-02.md) | Hög | 🤖 |
| [TC-TEAM-03](testfall/TC-TEAM-03.md) | [Lägga till kollega](testfall/TC-TEAM-03.md) | Hög | 🤖 |
| [TC-TEAM-04](testfall/TC-TEAM-04.md) | [Samma e-post kan inte läggas till två gånger](testfall/TC-TEAM-04.md) | Medel | 🤖 |
| [TC-TEAM-05](testfall/TC-TEAM-05.md) | [Ta bort kollega](testfall/TC-TEAM-05.md) | Hög | 🤖 |
| [TC-TEAM-06](testfall/TC-TEAM-06.md) | [Inbjuden kollega kommer in i teamet](testfall/TC-TEAM-06.md) | Hög | 🖐️ |
| [TC-TEAM-07](testfall/TC-TEAM-07.md) | [Skicka inbjudan via sms](testfall/TC-TEAM-07.md) | Hög | 🤖 |

## Uppdrag

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-UPP-01](testfall/TC-UPP-01.md) | [Mina visar mina uppdrag idag i tidsordning](testfall/TC-UPP-01.md) | Hög | 🤖 |
| [TC-UPP-02](testfall/TC-UPP-02.md) | [Alla visar teamets uppdrag](testfall/TC-UPP-02.md) | Hög | 🤖 |
| [TC-UPP-03](testfall/TC-UPP-03.md) | [Byta dag](testfall/TC-UPP-03.md) | Hög | 🤖 |
| [TC-UPP-15](testfall/TC-UPP-15.md) | [Kollegors uppdrag dyker upp av sig själva](testfall/TC-UPP-15.md) | Hög | 🤖 |
| [TC-UPP-04](testfall/TC-UPP-04.md) | [Tolka fyller i fälten](testfall/TC-UPP-04.md) | Hög | 🤖 |
| [TC-UPP-05](testfall/TC-UPP-05.md) | [Spara uppdrag till kollega](testfall/TC-UPP-05.md) | Hög | 🤖 |
| [TC-UPP-06](testfall/TC-UPP-06.md) | [Adress och uppgift krävs](testfall/TC-UPP-06.md) | Medel | 🤖 |
| [TC-UPP-07](testfall/TC-UPP-07.md) | [Besked när tolkningen inte är igång](testfall/TC-UPP-07.md) | Medel | 🤖 |
| [TC-UPP-08](testfall/TC-UPP-08.md) | [Uppdragskort med navigera, ring och sms](testfall/TC-UPP-08.md) | Hög | 🤖 |
| [TC-UPP-09](testfall/TC-UPP-09.md) | [Markera uppdrag som klart](testfall/TC-UPP-09.md) | Hög | 🤖 |
| [TC-UPP-10](testfall/TC-UPP-10.md) | [Ändra uppdrag](testfall/TC-UPP-10.md) | Medel | 🤖 |
| [TC-UPP-11](testfall/TC-UPP-11.md) | [Ta bort uppdrag](testfall/TC-UPP-11.md) | Medel | 🤖 |
| [TC-UPP-12](testfall/TC-UPP-12.md) | [Diktera med tangentbordet](testfall/TC-UPP-12.md) | Hög | 🖐️ |
| [TC-UPP-13](testfall/TC-UPP-13.md) | [Riktig tolkning med Gemini](testfall/TC-UPP-13.md) | Hög | 🖐️ |
| [TC-UPP-14](testfall/TC-UPP-14.md) | [Tolkningen hänger aldrig](testfall/TC-UPP-14.md) | Hög | 🤖 |

## Tidrapport

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-TID-01](testfall/TC-TID-01.md) | [Starta och stoppa tid](testfall/TC-TID-01.md) | Hög | 🤖 |
| [TC-TID-02](testfall/TC-TID-02.md) | [Bara en pågående tid per person](testfall/TC-TID-02.md) | Hög | 🤖 |
| [TC-TID-03](testfall/TC-TID-03.md) | [Klar stoppar tiden](testfall/TC-TID-03.md) | Medel | 🤖 |
| [TC-TID-04](testfall/TC-TID-04.md) | [Tid i efterhand](testfall/TC-TID-04.md) | Medel | 🤖 |
| [TC-TID-05](testfall/TC-TID-05.md) | [Veckorapport](testfall/TC-TID-05.md) | Hög | 🤖 |
| [TC-TID-06](testfall/TC-TID-06.md) | [Tid utan täckning](testfall/TC-TID-06.md) | Medel | 🖐️ |

## Navigering

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-NAV-01](testfall/TC-NAV-01.md) | [Flikraden](testfall/TC-NAV-01.md) | Hög | 🤖 |
| [TC-NAV-02](testfall/TC-NAV-02.md) | [Bara ägare ser Fakturering](testfall/TC-NAV-02.md) | Hög | 🤖 |
| [TC-NAV-03](testfall/TC-NAV-03.md) | [Utse ägare](testfall/TC-NAV-03.md) | Medel | 🤖 |
| [TC-NAV-04](testfall/TC-NAV-04.md) | [Tid-fliken](testfall/TC-NAV-04.md) | Hög | 🤖 |
| [TC-NAV-05](testfall/TC-NAV-05.md) | [Ej klart sedan tidigare](testfall/TC-NAV-05.md) | Hög | 🤖 |

## Fakturering

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-FAK-01](testfall/TC-FAK-01.md) | [Fakturaunderlag per kund](testfall/TC-FAK-01.md) | Hög | 🤖 |
| [TC-FAK-02](testfall/TC-FAK-02.md) | [Markera fakturerad](testfall/TC-FAK-02.md) | Hög | 🤖 |
| [TC-FAK-03](testfall/TC-FAK-03.md) | [Debiteras inte](testfall/TC-FAK-03.md) | Medel | 🤖 |
| [TC-FAK-04](testfall/TC-FAK-04.md) | [Fakturerad syns på uppdraget](testfall/TC-FAK-04.md) | Låg | 🤖 |

## Kundregister

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-KUND-01](testfall/TC-KUND-01.md) | [Autofyll från kundnamn](testfall/TC-KUND-01.md) | Hög | 🤖 |
| [TC-KUND-02](testfall/TC-KUND-02.md) | [Autofyll från adress](testfall/TC-KUND-02.md) | Hög | 🤖 |
| [TC-KUND-03](testfall/TC-KUND-03.md) | [Inga felaktiga förslag](testfall/TC-KUND-03.md) | Låg | 🤖 |

## Platsminne

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-MIN-01](testfall/TC-MIN-01.md) | [Tidigare besök på adressen](testfall/TC-MIN-01.md) | Hög | 🤖 |
| [TC-MIN-02](testfall/TC-MIN-02.md) | [Öppna ett gammalt besök](testfall/TC-MIN-02.md) | Medel | 🤖 |
| [TC-MIN-03](testfall/TC-MIN-03.md) | [Första besöket](testfall/TC-MIN-03.md) | Låg | 🤖 |

## Karta

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-KAR-01](testfall/TC-KAR-01.md) | [Dagens uppdrag på kartan](testfall/TC-KAR-01.md) | Hög | 🤖 |
| [TC-KAR-02](testfall/TC-KAR-02.md) | [Mina/Alla och byta dag på kartan](testfall/TC-KAR-02.md) | Hög | 🤖 |
| [TC-KAR-03](testfall/TC-KAR-03.md) | [Tryck på nål](testfall/TC-KAR-03.md) | Hög | 🤖 |
| [TC-KAR-04](testfall/TC-KAR-04.md) | [Nytt uppdrag får plats](testfall/TC-KAR-04.md) | Hög | 🤖 |
| [TC-KAR-05](testfall/TC-KAR-05.md) | [Adress som inte hittas](testfall/TC-KAR-05.md) | Medel | 🤖 |
| [TC-KAR-06](testfall/TC-KAR-06.md) | [Egen position på riktig iPhone](testfall/TC-KAR-06.md) | Medel | 🖐️ |

## Dokumentation

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-DOK-01](testfall/TC-DOK-01.md) | [Ta foto före](testfall/TC-DOK-01.md) | Hög | 🤖 |
| [TC-DOK-02](testfall/TC-DOK-02.md) | [Teamet ser varandras foton](testfall/TC-DOK-02.md) | Hög | 🤖 |
| [TC-DOK-03](testfall/TC-DOK-03.md) | [Ta bort foto](testfall/TC-DOK-03.md) | Medel | 🤖 |
| [TC-DOK-04](testfall/TC-DOK-04.md) | [Foto utan täckning](testfall/TC-DOK-04.md) | Hög | 🤖 |
| [TC-DOK-05](testfall/TC-DOK-05.md) | [Spara anteckning](testfall/TC-DOK-05.md) | Hög | 🤖 |
| [TC-DOK-06](testfall/TC-DOK-06.md) | [Borttaget uppdrag tar med sina foton](testfall/TC-DOK-06.md) | Medel | 🤖 |
| [TC-DOK-07](testfall/TC-DOK-07.md) | [Kameran på iPhone](testfall/TC-DOK-07.md) | Hög | 🖐️ |

## Offline

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-OFF-01](testfall/TC-OFF-01.md) | [Spara uppdrag utan täckning](testfall/TC-OFF-01.md) | Hög | 🤖 |
| [TC-OFF-02](testfall/TC-OFF-02.md) | [Visa uppdrag utan täckning](testfall/TC-OFF-02.md) | Hög | 🤖 |

## Tema

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-TEM-01](testfall/TC-TEM-01.md) | [Byta tema](testfall/TC-TEM-01.md) | Låg | 🤖 |

## PWA

| ID | Testfall | Prio | Typ |
|---|---|---|---|
| [TC-PWA-01](testfall/TC-PWA-01.md) | [Installera på hemskärmen](testfall/TC-PWA-01.md) | Medel | 🖐️ |
