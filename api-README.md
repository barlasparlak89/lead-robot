# API lead (Netlify Functions)

La funzione `lead.js` riceve i dati del modulo e li inoltra al CRM + Telegram.

## Variabili richieste
- CRM_API_URL
- CRM_API_KEY
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID

## Endpoint
- POST /api/lead

## Note
Per Netlify, assicurati di impostare le variabili d’ambiente nel pannello del sito.
