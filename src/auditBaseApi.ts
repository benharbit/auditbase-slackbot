import axios from "axios";
const API_SERVER = "https://api.auditbase.dev/v1/";

export async function sendExplorerScanRequest(
  chain_id: string,
  contract_address: string,
  apiKey: string
) {
  const ROUTE = "scans/explorer'";
  const url = API_SERVER + ROUTE;
  const data = {
    chain_id,
    contract_address,
    webhook_url: process.env.AUDITBASE_WEBHOOK_URL,
  };
  try {
    let res = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          apiKey ? apiKey : process.env.AUDITBASE_API_KEY
        }`,
      },
    });
    const res_data = res.data;
    console.log(res_data);
    return res_data;
  } catch (error: Error | any) {
    if (error.message) {
      console.error(error.message);
      return error.message;
    }
    console.log(error);

    return "unknown error";
  }
}

interface ScanResult {
  result: string;
  numIssues: number;
  statusCode: number;
}

function getNumIssues(issues: any) {
  return issues.length;
}

function truncate(data: object) {
  const str = JSON.stringify(data);
  if (str.length < 400) {
    return str;
  }

  return (
    str.slice(0, 400) + "........." + str.slice(str.length - 400, str.length)
  );
}

export async function getScan(
  scanId: string,
  apiKey: string,
  doTruncate: boolean
): Promise<ScanResult> {
  try {
    console.log(`enter scan: scanId: ${scanId} apiKey${apiKey}`);
    const ROUTE = "scans";
    let url = API_SERVER + ROUTE;
    if (scanId) {
      url = url + "/" + scanId;
    }
    console.log(`url: ${url}`);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${
        apiKey ? apiKey : process.env.AUDITBASE_API_KEY
      }`,
    };
    console.log(`headers: ${headers}`);
    let res = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          apiKey ? apiKey : process.env.AUDITBASE_API_KEY
        }`,
      },
    });
    if (res.status === 200) {
      return {
        result: doTruncate ? truncate(res.data) : res.data,
        statusCode: res.status,
        numIssues: getNumIssues(res.data),
      };
    } else {
      return {
        result: "error",
        numIssues: -99,
        statusCode: res.status,
      };
    }
    const res_data = res.data;
    console.log(res_data);
    return res_data;
  } catch (error: Error | any) {
    if (error.message) {
      console.error(error.message);
      return {
        result: error.message,
        numIssues: -99,
        statusCode: -99,
      };
    } else {
      return {
        result: "unknown error",
        numIssues: -99,
        statusCode: -99,
      };
    }
  }
}
