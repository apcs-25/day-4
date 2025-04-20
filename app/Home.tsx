import {
  Address,
  applyDoubleCborEncoding,
  applyParamsToScript,
  Constr,
  Data,
  fromText,
  Koios,
  Lucid,
  LucidEvolution,
  MintingPolicy,
  mintingPolicyToId,
  toUnit,
  WalletApi,
} from "@lucid-evolution/lucid";
import { Button } from "@heroui/button";
import { useEffect, useState } from "react";

const script = applyDoubleCborEncoding(
  "590504010100229800aba4aba2aba1aba0aab9faab9eaab9dab9cab9a4888888888cc896600264653001300b00198059806000cdc3a4001300b0024888966002600460166ea800e264b300100589919912cc004c0180062b300130103754011002805a0228acc004c00c0062b300130103754011002805a022805a01a40342a6601866e592410a52656465656d65723a2000373264646644653001001805d22100400444464b30010038991919911980500119b8a48901280059800800c4cdc52441035b5d2900006899b8a489035b5f20009800800ccdc52441025d2900006914c00402a00530070014029229800805400a002805100920365980099b880014803a266e0120f2010018acc004cdc4000a41000513370066e01208014001480362c80a90151bac3018002375a602c0026466ec0dd4180b0009ba73017001375400713259800800c4cdc52441027b7d00003899b8a489037b5f20003232330010010032259800800c400e264b30010018994c00402a6036003337149101023a200098008054c07000600a805100a180f00144ca6002015301b00199b8a489023a200098008054c070006600e66008008004805100a180f0012038301e001406c66e29220102207d0000340606eac00e264b3001001899b8a489025b5d00003899b8a489035b5f20009800800ccdc52441015d00003914c00401e0053004001401d229800803c00a002803900620303758007133006375a0060051323371491102682700329800800ccdc01b8d0024800666e292210127000044004444b3001337100049000440062646645300100699b800054800666e2ccdc00012cc004cdc4001240291481822903720343371666e000056600266e2000520148a40c11481b901a002200c33706002901019b8600148080cdc7002001202e375c00680d8dc5245022c200022323300100100322598009805000c4cdc52450130000038acc004cdc4000a40011337149101012d0033002002337029000000c4cc014cdc2000a402866e2ccdc019b85001480512060003404480888888c8cc004004014896600200310058992cc004006266008603400400d133005301a002330030030014060603400280b8c0040048896600266e2400920008800c6600200733708004900a4cdc599b803370a004900a240c0002801900e0992cc004c014c038dd5003c4c9660020050018acc004c05000a2b30013003375a60206026005132330010013758602860226ea8018896600200314a115980099baf301530123754602a00203314a31330020023016001403c809a294100d4005011202214a1159800800c02e264b30013014002899b87375a60200029000c0310111809000a020403064b30013002300e375400314bd6f7b63044dd5980918079baa001403064660020026eacc048c04cc04cc04cc04cc03cdd5002112cc004006298103d87a8000899192cc004cdc8803000c56600266e3c018006266e9520003301430120024bd7045300103d87a8000403d1330040043016003403c6eb8c040004c04c00501118069baa006370e900140220110088042024375c601e60186ea800e2c80486016002600c6ea8032293454cc0112411856616c696461746f722072657475726e65642066616c73650013656400c2a6600492013f657870656374205b50616972285f61737365745f6e616d652c20717479295d203d20646963742e746f5f70616972732861737365745f7174795f6469637429001615330024911072656465656d65723a20416374696f6e001601"
);

export default function Home() {
  //#region Wallet
  type Wallet = {
    name: string;
    icon: string;
    apiVersion: string;
    enable(): Promise<WalletApi>;
    isEnabled(): Promise<boolean>;
  };

  function getWallets() {
    const wallets: Wallet[] = [];

    for (const c in window.cardano) {
      const wallet = window.cardano[c];

      if (wallet.apiVersion) {
        wallets.push(wallet);
      }
    }

    return wallets.sort((l, r) => {
      return l.name.toUpperCase() < r.name.toUpperCase() ? -1 : 1;
    });
  }

  const wallets = getWallets();
  //#endregion

  //#region Lucid
  const [lucid, setLucid] = useState<LucidEvolution>();

  useEffect(() => {
    Lucid(new Koios("/koios"), "Preview").then(setLucid).catch(console.error);
  }, []);

  async function connectWallet(wallet: Wallet) {
    if (!lucid) throw "Uninitialized Lucid";

    const api = await wallet.enable();

    lucid.selectWallet.fromAPI(api);

    const address = await lucid.wallet().address();

    setAddress(address);
  }
  //#endregion

  const [address, setAddress] = useState<Address>("");

  if (!lucid) return <span>Initializing Lucid</span>;

  //#region Transactions
  async function mint() {
    if (!lucid) throw "Uninitialized Lucid";

    const utxos = await lucid.wallet().getUtxos();

    if (!utxos.length) throw "Empty Wallet";

    const nonce = utxos[0];

    const outputReference = new Constr(0, [nonce.txHash, BigInt(nonce.outputIndex)]);
    const cbor = Data.to(outputReference);

    console.log(cbor);

    const mintingScript = applyParamsToScript(script, [outputReference]);
    const mintingPolicy: MintingPolicy = {
      type: "PlutusV3",
      script: mintingScript,
    };
    const policyID = mintingPolicyToId(mintingPolicy);

    const mintAction = new Constr(0, []);
    const redeemer = Data.to(mintAction);

    // Asset Unit = PolicyID + AssetName
    const tokenName = "Cardano Sandbox '25";
    const assetName = fromText(tokenName);
    const token = toUnit(policyID, assetName);

    const tx = await lucid
      .newTx()
      .mintAssets(
        {
          [token]: 1n,
        },
        redeemer
      )
      .attach.MintingPolicy(mintingPolicy)
      .attachMetadata(721, {
        [policyID]: {
          [tokenName]: {
            name: tokenName,
            image: "https://c.tenor.com/eO5qGaj-eUkAAAAM/cardano-crypto.gif",
          },
        },
      })
      .complete();

    const txSign = await tx.sign.withWallet().complete();
    const txHash = txSign.submit();

    console.log(txHash);
  }
  //#endregion

  return (
    <div className="flex flex-col gap-2">
      {/* Wallet Connector */}
      <div className="flex flex-wrap gap-2">
        {wallets.map((wallet, w) => (
          <Button
            key={`wallet.${w}`}
            className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg capitalize"
            radius="full"
            onPress={() => connectWallet(wallet)}
          >
            {wallet.name}
          </Button>
        ))}
      </div>

      {address && (
        <>
          {/* Address */}
          {address}

          {/* Transaction */}
          <Button className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg" radius="full" onPress={mint}>
            Mint
          </Button>
        </>
      )}
    </div>
  );
}
