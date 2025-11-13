const express = require('express');
const axios = require('axios');
const sdk = require('stellar-sdk');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

const server = new sdk.Horizon.Server('https://horizon-testnet.stellar.org');

// Demo endpoint: create a temporary funded source account via Friendbot
// and return an unsigned payment transaction XDR to the provided destination.
// WARNING: This endpoint returns the temporary source secret for demo purposes only.
app.get('/demo-payment', async (req, res) => {
  const { destination, amount = '1' } = req.query;
  if (!destination) return res.status(400).json({ error: 'destination query required (public key).' });

  try {
    // create a temporary source
    const source = sdk.Keypair.random();
    // fund via friendbot
    await axios.get(`https://friendbot.stellar.org?addr=${encodeURIComponent(source.publicKey())}`);

    // load account to get current sequence
    const account = await server.loadAccount(source.publicKey());

    const fee = await server.fetchBaseFee();
    const tx = new sdk.TransactionBuilder(account, {
      fee: fee.toString(),
      networkPassphrase: sdk.Networks.TESTNET,
    })
      .addOperation(sdk.Operation.payment({
        destination: destination,
        asset: sdk.Asset.native(),
        amount: amount,
      }))
      .setTimeout(180)
      .build();

    // Do NOT sign here. We return the unsigned base64 XDR so it can be signed by the manager/client.
    const xdr = tx.toEnvelope().toXDR('base64');

    // For safety we do NOT return the source secret in the public API response.
    // The source secret is logged to the server console for local debugging only.
    console.log('Temporary source secret (local-only):', source.secret());
    res.json({
      source_public: source.publicKey(),
      unsigned_xdr: xdr,
      network: 'TESTNET',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Stellar Asset Management demo API' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
