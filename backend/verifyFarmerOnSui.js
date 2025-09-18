require('dotenv').config();
const { SuiClient } = require('@mysten/sui.js/client');
const {fromHex} = require('@mysten/sui/utils');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { TransactionBlock } = require('@mysten/sui.js/transactions');

const PACKAGE_ID = '0x705348aba8553bea668a757ef1905248d83d0d27bd63a837df775ee6452643c3'; 
const SHARED_OBJECT_ID = '0x1509c91c9ea70fc81b30fb5819630693bc826ff4ba9804afe0aa5e95ad8b1c02';

const privateKey = process.env.SUI_PRIVATE_KEY || 'ANoPORmdS+6ZOARmfWBFS6JGxq2/CO6Djh3sXfRQ+VwN';

let keypair;
try {
  const decodedKey = Buffer.from(privateKey, 'base64');

  let keyBytes;
  if (decodedKey.length === 33 && decodedKey[0] === 0) {
    keyBytes = decodedKey.slice(1); 
  } else if (decodedKey.length === 32) {
    keyBytes = decodedKey;
  } else {
    throw new Error(`Invalid key length: ${decodedKey.length} bytes. Expected 32 or 33 bytes.`);
  }
  
  keypair = Ed25519Keypair.fromSecretKey(new Uint8Array(keyBytes));

} catch (error) {
  console.error('Error creating keypair:', error);
  console.error('\ncheck private key format.');
  process.exit(1);
}

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

const address = keypair.getPublicKey().toSuiAddress();

async function addFarmerId(hash) {
  hash = fromHex(hash)
  console.log(`Adding string: "${hash}"`);
  
  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${PACKAGE_ID}::isFarmerOnChain::addFarmerId`,
    arguments: [
      tx.object(SHARED_OBJECT_ID),
      tx.pure.string(hash) 
    ]
  });


  const result = await client.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
    options: { showEvents: true }
  });

  console.log('Transaction successful');
  console.log('Digest:', result.digest);

  return result;
}


async function verifyFarmerId(hash) {
  hash = fromHex(hash)
  console.log(`Attempting to verify string : "${hash}"`);
  
  const tx = new TransactionBlock();
  
  
  tx.moveCall({
    target: `${PACKAGE_ID}::isFarmerOnchain::verifyFarmerId`,
    arguments: [
      tx.object(SHARED_OBJECT_ID),
      tx.pure.string(hash) 
    ]
  });

  
  const result = await client.signAndExecuteTransactionBlock({
    signer: keypair,
    transactionBlock: tx,
    options: { showEvents: true }
  });

  console.log('Transaction successful');
  console.log('Digest:', result.digest);
  return result;
}


module.exports = { addFarmerId, verifyFarmerId };
