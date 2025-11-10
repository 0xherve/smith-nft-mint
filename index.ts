import { create, mplCore } from '@metaplex-foundation/mpl-core'
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  sol,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import { Keypair } from '@solana/web3.js'
import { readFile } from 'fs/promises'
import metadata from './metadata.ts'
import { base58 } from '@metaplex-foundation/umi/serializers'


// wrapper function
const createNft = async () => {

    const umi = createUmi('https://api.devnet.solana.com')
        .use(mplCore())
        .use(
            irysUploader({
                address: 'https://devnet.irys.xyz',
            })
        )
 
    // Importing the wallet File 
    const walletFile = await readFile('/home/nika/.config/solana/id.json', 'utf-8')
    const walletKeypair = JSON.parse(walletFile)
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletKeypair))
    umi.use(keypairIdentity(keypair))
    console.log('Using wallet to:', umi.identity.publicKey)
  
    // Importing and Uploading the image
  const image = await readFile("./red_hammer.png")
  const file = createGenericFile(image, "red_hammer.png",{
   contentType: "image/png"
 } )
  const [my_uri] = await umi.uploader.upload([file])
  console.log("URI uploaded", my_uri)
  
  // Importing and uploading the Metadata of the NFT
    const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
        throw new Error(err)
    })
    console.log("Sent Metadata to:", metadataUri);

    // Creating the Mint Transaction
    const asset = generateSigner(umi)
    const tx = await create(umi, {
      asset,
      name: 'Red Hammer',
      uri: metadataUri,
    }).sendAndConfirm(umi)
    const signature = base58.deserialize(tx.signature)[0]
    
    // Logging out the Result 
    console.log("\nNFT Minted");
    console.log(`View the Transaction at: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
    console.log("\n")
    console.log(`View on Metaplex Explorer: https://core.metaplex.com/explorer/${asset.publicKey}?env=devnet`)
}

// run the wrapper function
createNft()