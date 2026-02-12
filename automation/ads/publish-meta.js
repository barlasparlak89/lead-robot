const fs = require("fs");
const path = require("path");

const accessToken = process.env.META_ACCESS_TOKEN;
const adAccountId = process.env.META_AD_ACCOUNT_ID;
const pageId = process.env.META_PAGE_ID;
const pixelId = process.env.META_PIXEL_ID;
const dryRun = process.env.DRY_RUN !== "0";

if (!accessToken || !adAccountId || !pageId) {
  console.error("Missing META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, or META_PAGE_ID");
  process.exit(1);
}

const adsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "generated-ads.json"), "utf8")
);

const createAd = async (ad) => {
  const payload = {
    name: `${ad.headline}`,
    status: "PAUSED",
    creative: {
      object_story_spec: {
        page_id: pageId,
        link_data: {
          message: ad.description,
          link: process.env.LANDING_URL,
          call_to_action: {
            type: "LEARN_MORE",
            value: { link: process.env.LANDING_URL },
          },
        },
      },
    },
  };

  if (dryRun) {
    console.log("DRY RUN - payload", payload);
    return;
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/act_${adAccountId}/ads`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meta Ads error: ${response.status} ${text}`);
  }
};

(async () => {
  for (const ad of adsData.ads) {
    await createAd(ad);
  }
  console.log("Meta ads queued.");
})();
