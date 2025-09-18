require('dotenv').config();
const { SuiClient } = require('@mysten/sui.js/client');
const { fromHex } = require('@mysten/sui/utils');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { TransactionBlock } = require('@mysten/sui.js/transactions');

const PACKAGE_ID = '0x705348aba8553bea668a757ef1905248d83d0d27bd63a837df775ee6452643c3';
const SHARED_OBJECT_ID = '0x1509c91c9ea70fc81b30fb5819630693bc826ff4ba9804afe0aa5e95ad8b1c02';

const privateKey = process.env.SUI_PRIVATE_KEY;

let keypair;
try {
    const decodedKey = Buffer.from(privateKey, 'base64');
    const keyBytes = decodedKey.length === 33 && decodedKey[0] === 0 ? decodedKey.slice(1) : decodedKey;
    keypair = Ed25519Keypair.fromSecretKey(new Uint8Array(keyBytes));
} catch (error) {
    console.error('Error creating keypair:', error);
    process.exit(1);
}

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

async function addFarmerId(hash) {
    const vector = fromHex(hash);

    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${PACKAGE_ID}::isfarmeronchain::addFarmerId`,
        arguments: [
            tx.object(SHARED_OBJECT_ID),
            tx.pure(Array.from(vector), "vector<u8>")
        ]
    });

    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: { showEvents: true }
    });

    console.log('Farmer added, digest:', result.digest);
    return result;
}

async function verifyFarmerId(hash) {
    const vector = fromHex(hash);

    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${PACKAGE_ID}::isfarmeronchain::verifyFarmerId`,
        arguments: [
            tx.object(SHARED_OBJECT_ID),
            tx.pure(Array.from(vector), "vector<u8>")
        ]
    });

    const result = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: { showEvents: true }
    });

    console.log('Farmer verified, digest:', result.digest);
    return result;
}

module.exports = { addFarmerId, verifyFarmerId };
