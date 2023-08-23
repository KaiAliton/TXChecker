import {JsonRpcProvider, Log, TransactionResponse} from "ethers";
import {ethers, formatEther} from "ethers";
//import {google} from "googleapis";
import {addresses} from "./addresses.ts";

const provider: JsonRpcProvider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/7c3e9e09bd3f488e9df6ae9bfb6503d4');
//const spreadsheetId: string = '1fOEuc4xhIUN75LEg4cA6klz3cx95ktvECEuDdB3jOwA';
//const CREDENTIALS_PATH = './key.json';
//const SCOPES = "https://www.googleapis.com/auth/spreadsheets";


//const auth = new google.auth.GoogleAuth({
//  keyFile: CREDENTIALS_PATH,
//  scopes: SCOPES
//});

export default async function updateSheet(_collectionAddress: string, _tokenIds: number[], _startBlock: number, _endBlock: number): Promise<any[]> {
  //const client = await auth.getClient();
  //const googlesheets = google.sheets({ version: "v4", auth: client });
  let logs: any[] = [];
  for (const tokenId of _tokenIds) {
    logs = logs.concat(await getNftLogs(_startBlock, _endBlock, _collectionAddress, tokenId));
    //await googlesheets.spreadsheets.values.append({
    //  auth,
    //  spreadsheetId,
    //  range: "sheet1",
    //  valueInputOption: "USER_ENTERED",
    //  resource: {
    //    values: logs
    //  },
    //});
  }
  return logs;
}

async function getNftLogs(_startBlock: number, _endBlock: number, _collectionAddress: string, _tokenId: number) {
  const logs: Log[] = await provider.getLogs({
    address: _collectionAddress,
    fromBlock: _startBlock,
    toBlock: _endBlock,
    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', null, null, ethers.toBeHex(_tokenId, 32)]
  });

  const values: any[] = [];
  //values.push(['','','',''])

  for (const log of logs) {
    const tx = await log.getTransaction();
    const id: number = _tokenId;
    const type: string = checkType(tx, log.topics[1]);
    const marketPlace: string = checkMarketPlace(tx.to);
    const value: string = formatEther(tx.value);
    console.log({"hash": tx.hash,
    "data": log})

    values.push({"collection" : _collectionAddress,"id": id,"type": type,"marketPlace": marketPlace,"value": value,"from": tx.from,"to": tx.to,"txHash": tx.hash, "tx": tx});
  }

  return values;
}

function checkType(tx: TransactionResponse, topic: string) {
  if (topic === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return 'Mint';
  }

  if (formatEther(tx.value) === '0.0') {
    return 'Transfer';
  }

  return 'Sale';
}

function checkMarketPlace(to: string | null): string {
  for (const key in addresses) {
    if (addresses[key] === to) {
      return key;
    }
  }

  return 'other';
}