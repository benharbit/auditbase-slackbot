import axios from "axios";
import { WebClient } from "@slack/web-api";
import { userRecords } from "./constants";
const API_SERVER = process.env.AUDITBASE_API_SERVER;

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function placeExplorerScan(
  chain_id: string,
  contract_address: string,
  apiKey: string
) {
  const ROUTE = "/scans/explorer";
  const url = API_SERVER + ROUTE;
  const data = {
    chain_id,
    contract_address,
    webhook_url: process.env.AUDITBASE_WEBHOOK_URL,
  };
  try {
    console.log("url: ", url);
    console.log("data: ", data);
    console.log("zzz: ", apiKey ? apiKey : process.env.AUDITBASE_API_KEY);

    let res = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          apiKey ? apiKey : process.env.AUDITBASE_API_KEY
        }`,
      },
    });
    const res_data = res.data;
    console.log("responseaa: ", res_data);
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
    console.log(`enter scan: scanId: ${scanId} apiKey${apiKey}`);
    const ROUTE = "scans";
    /*
    const files = await getFileList();
    for (const file_name in files) {
      console.log(`${JSON.stringify(file_name)}`);
    }
    if (files && files.length > 0) {
      console.log(`file: ${JSON.stringify(files[0])}`);

      if (files[0].url_private_download) {
        const res = await axios.get(files[0].url_private_download);
        if (res.status === 200) {
          console.log(`file_contents: ${JSON.stringify(res.data)}`);
        } else {
        }
      }
    }
    */

    let url = API_SERVER + "/" + ROUTE;
    if (scanId) {
      url = url + "/" + scanId.replace('"', "");
    }

    console.log(`url: ${url}`);
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${
        apiKey ? apiKey : process.env.AUDITBASE_API_KEY
      }`,
    };
    console.log(`headers: ${JSON.stringify(headers)}`);
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
