# Landing page legale (Italia)

Landing page statica in italiano per acquisire lead di assistenza legale in casi di truffa.

## Cosa include
- Pagina principale con modulo lead
- Informativa privacy separata
- Validazione base lato client
- Honeypot anti-bot

## Come pubblicare con dominio gratuito
Puoi usare servizi con sottodominio gratuito, ad esempio:
- GitHub Pages
- Netlify
- Vercel

### Passi generali
1) Carica questi file su una piattaforma a scelta.
2) Seleziona la cartella principale come sorgente del sito.
3) Attiva il sottodominio gratuito offerto dalla piattaforma.

## Integrazioni (pronte per i token)
La raccolta lead invia i dati a un endpoint serverless:
- Endpoint: /api/lead (Netlify Functions)
- Configura le variabili d’ambiente usando [.env.example](.env.example)

### Variabili richieste
- CRM_API_URL
- CRM_API_KEY
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID

## Automazione annunci (Meta Ads)
Cartella: [automation/ads](automation/ads)
- Genera varianti con `node generate-ads.js`
- Pubblica con `node publish-meta.js` (default in DRY_RUN)
- Imposta LANDING_URL e token Meta prima dell’invio

## Tracking
Sostituisci gli ID nel file [index.html](index.html) per Meta Pixel e Google Tag.
Aggiorna il dominio in [sitemap.xml](sitemap.xml).

## Prossimi passi
- Integrazione CRM e Telegram
- Aggiunta tracciamento conversioni
- A/B test di contenuti
