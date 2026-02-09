const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate new wallet
const wallet = Keypair.generate();

console.log('Public Key:', wallet.publicKey.toString());
console.log('Secret Key:', Array.from(wallet.secretKey));

// Save to file
const walletData = {
  publicKey: wallet.publicKey.toString(),
  secretKey: Array.from(wallet.secretKey)
};

fs.writeFileSync('./wallet.json', JSON.stringify(walletData, null, 2));
console.log('\nWallet saved to wallet.json');
