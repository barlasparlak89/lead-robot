# Automazione annunci (Meta Ads)

Questa cartella genera varianti di annunci e li prepara per la pubblicazione su Meta Ads.

## 1) Genera annunci
- Esegui `node generate-ads.js`
- Output: `generated-ads.json`

## 2) Pubblica su Meta (opzionale)
Imposta le variabili d’ambiente:
- META_ACCESS_TOKEN
- META_AD_ACCOUNT_ID
- META_PAGE_ID
- LANDING_URL
- META_PIXEL_ID (opzionale per tracking lato Meta)
- DRY_RUN=0 per inviare davvero (default è simulazione)

Poi esegui `node publish-meta.js`

## Note
- Tutti gli annunci partono in stato PAUSED.
- Verifica conformità alle policy di Meta prima di attivare.
