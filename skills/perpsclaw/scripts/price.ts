const PYTH_URL = process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";
const SOL_FEED =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

async function main() {
  const res = await fetch(
    `${PYTH_URL}/v2/updates/price/latest?ids[]=${SOL_FEED}`
  );
  const data = await res.json();
  const parsed = data.parsed?.[0]?.price;
  if (!parsed) {
    console.log(JSON.stringify({ error: "No price data from Pyth" }));
    process.exit(1);
  }

  const price = Number(parsed.price) * Math.pow(10, parsed.expo);
  console.log(
    JSON.stringify({
      price: Math.round(price * 100) / 100,
      timestamp: new Date().toISOString(),
    })
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ error: e.message }));
  process.exit(1);
});
