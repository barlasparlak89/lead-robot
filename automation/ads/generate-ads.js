const fs = require("fs");
const path = require("path");

const templates = JSON.parse(
  fs.readFileSync(path.join(__dirname, "templates-it.json"), "utf8")
);

const pick = (items, count) => {
  const copy = [...items];
  const result = [];
  while (copy.length && result.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
};

const generateAds = (count = 5) => {
  const ads = [];
  for (let i = 0; i < count; i += 1) {
    ads.push({
      brand: templates.brandName,
      headline: pick(templates.headlines, 1)[0],
      description: pick(templates.descriptions, 1)[0],
      cta: pick(templates.ctas, 1)[0],
    });
  }
  return ads;
};

const output = {
  generatedAt: new Date().toISOString(),
  ads: generateAds(8),
};

const outPath = path.join(__dirname, "generated-ads.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`Generated ${output.ads.length} ads -> ${outPath}`);
