const anchor = require('@coral-xyz/anchor');
const { PublicKey } = require('@solana/web3.js');
const fs = require('fs');

// Load wallet
const walletData = JSON.parse(fs.readFileSync('./wallet.json'));
const wallet = anchor.web3.Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));

// Configure connection
const connection = new anchor.web3.Connection(
  'https://api.devnet.solana.com',
  'confirmed'
);

// Create provider
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {
  commitment: 'confirmed'
});
anchor.setProvider(provider);

console.log('Wallet:', wallet.publicKey.toString());
console.log('Balance:', await connection.getBalance(wallet.publicKey) / 1e9, 'SOL');

// Deploy function
async function deploy() {
  console.log('\nDeploying programs...');
  
  // This would deploy the programs using anchor deploy
  // For now, just log the setup
  console.log('Provider configured for devnet');
  console.log('Ready to deploy reputation and escrow programs');
}

deploy().catch(console.error);
