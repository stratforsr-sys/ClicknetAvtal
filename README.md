# Avtalsgenerator – ClickneT

Webbaserad generator för anställningsavtal. Ingen inloggning, inget backend, ingen databas.
Allt körs i webbläsaren och sparade avtal ligger lokalt på din dator.

## Filer

| Fil | Innehåll |
|---|---|
| `index.html` | Formulärets markup och förhandsgranskningens container |
| `styles.css` | All styling, inklusive utskriftsreglerna för A4 |
| `app.js` | Fältlogik, provisionsrader, avtalstexten och PDF-utskriften |
| `favicon.svg` | Ikonen i webbläsarfliken |
| `vercel.json` | Cache- och säkerhetsheaders för statisk hosting |

## Viktigt när du ändrat `styles.css` eller `app.js`

Dessa filer cachas ett år hos besökaren (`immutable`). Länkarna i `index.html`
har därför en versionsquery:

```html
<link rel="stylesheet" href="styles.css?v=1">
<script src="app.js?v=1"></script>
```

**Höj siffran i båda länkarna när du ändrat filerna**, annars kan besökare som
varit inne tidigare fortsätta se den gamla versionen. `index.html` självt cachas
aldrig, så den nya länken slår igenom direkt vid nästa besök.

Avtalstexten ligger i `app.js` i funktionen `render()`. Varje avsnitt byggs med
hjälpfunktionen `cl(nummer, rubrik, brödtext)`. Ändrar du en paragraf där slår
det igenom direkt i förhandsgranskningen.

Standardvärdena för alla fält ligger i objektet `DEFAULTS` högst upp i `app.js`.

## Köra lokalt

Öppna `index.html` direkt i webbläsaren, eller starta en enkel server:

```bash
npx serve .
```

I VS Code fungerar även tillägget **Live Server** (högerklicka på `index.html`
→ *Open with Live Server*), vilket ger automatisk uppdatering när du sparar.

## Publicera på Vercel

```bash
npm i -g vercel
vercel
```

Välj *other* som framework när frågan kommer. Inget byggsteg behövs.
Alternativt: dra mappen till vercel.com/new.

## Skapa PDF

Fyll i formuläret och klicka **Skapa PDF**. Välj *Spara som PDF* i
utskriftsdialogen. Ställ in:

- Marginaler: **Inga**
- Bakgrundsgrafik: **på**

Webbläsaren kommer ihåg inställningarna efter första gången.

## Att kontrollera innan skarp användning

- Firmanamnet i `DEFAULTS.agNamn` – kontrollera mot Bolagsverket.
- Arbetsplatsens adress i `DEFAULTS.anArbetsplats`.
- Låt en arbetsrättsjurist läsa igenom ett genererat avtal en gång.
