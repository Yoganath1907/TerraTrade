require('dotenv').config();
const { SuiClient } = require('@mysten/sui.js/client');
const { fromHex } = require('@mysten/sui/utils');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { TransactionBlock } = require('@mysten/sui.js/transactions');

const PACKAGE_ID = '0x365a757e592feee507bce2b25e36454a5a1c2db26ef503cd83504a27583d252f';
const SHARED_OBJECT_ID = '0xf0ed5cdb896e14c71477c49aff9c1cbab285b706a8d40eb9d294e34dd93919e2';

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

async function addProduceId(hash) {
    const vector = fromHex(hash);

    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${PACKAGE_ID}::isproduceonchain::addProduceId`,
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

    console.log('Produce added, digest:', result.digest);
    return result;
}

async function verifyProduceId(hash) {
    const vector = fromHex(hash);

    const tx = new TransactionBlock();
    tx.moveCall({
        target: `${PACKAGE_ID}::isproduceonchain::verifProduceId`,
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

    console.log('Produce verified, digest:', result.digest);
    return result;
}

module.exports = { addProduceId, verifyProduceId };
