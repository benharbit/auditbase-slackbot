import axios from "axios";
import { WebClient } from "@slack/web-api";
import { userRecords } from "./constants";
const API_SERVER = process.env.AUDITBASE_API_SERVER;

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function placeExplorerScan(
  chain_id: string,
  contract_address: string,
  apiKey: string,
  webhook_url: string
) {
  const ROUTE = "/scans/explorer";
  const url = API_SERVER + ROUTE;
  const data = {
    chain_id,
    contract_address,
    webhook_url,
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
    return res_data;
  } catch (error: Error | any) {
    if (error.message) {
      console.error(error.message);
      return error.message;
    }
    console.log("response fialed2: ", error);

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

export function truncate(data: string | object) {
  const str = typeof data === "object" ? JSON.stringify(data) : data;
  if (str.length < 400) {
    return str;
  }

  return (
    str.slice(0, 400) + "........." + str.slice(str.length - 400, str.length)
  );
}

export async function getScan(
  scanId: string,
  apiKey: string
): Promise<ScanResult> {
  try {
    const ROUTE = "scans";
    let url = API_SERVER + "/" + ROUTE;
    if (scanId) {
      url = url + "/" + scanId.replace(/\"/g, "");
      console.log(`scanId: ${url} `);
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${
        apiKey ? apiKey : process.env.AUDITBASE_API_KEY
      }`,
    };
    let res = await axios.get(url, {
      headers,
    });
    if (res.status === 200) {
      return {
        result:
          typeof res.data === "string" ? res.data : JSON.stringify(res.data),
        statusCode: res.status,
        numIssues: getNumIssues(res.data),
      };
    } else {
      return {
        result: res.data,
        numIssues: -99,
        statusCode: res.status,
      };
    }
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
