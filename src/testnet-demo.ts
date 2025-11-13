// Use CommonJS style imports to match package.json "type": "commonjs"
const sdk: any = require('stellar-sdk');
const axios: any = require('axios');

const Server = sdk.Horizon.Server;
const Keypair = sdk.Keypair;
const server = new Server('https://horizon-testnet.stellar.org');

async function main() {
  const pair = Keypair.random();
  console.log('Public Key:', pair.publicKey());
  console.log('Secret (keep this safe for demo only):', pair.secret());

  console.log('Requesting funds from friendbot...');
  try {
    await axios.get(`https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`);
  } catch (err: any) {
    console.error('Friendbot funding failed:', err?.response?.data || err.message || err);
    process.exit(1);
  }

  console.log('Funded. Loading account...');
  const account = await server.loadAccount(pair.publicKey());

  console.log('Balances:');
  (account.balances as any[]).forEach((b: any) => {
    console.log(`  ${b.asset_type}${b.asset_code ? `:${b.asset_code}` : ''} — ${b.balance}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
