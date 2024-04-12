import { WebClient } from "@slack/web-api";
import { getFiles } from "./files";
import axios from "axios";
import fs from "fs";
const AUDITBASE_API_SERVER = process.env.AUDITBASE_API_SERVER;

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function placeUploadScan(
  files: string[],
  apiKey: string,
  webhookUrl: string
) {
  const ROUTE = "/scans/upload";
  const url = AUDITBASE_API_SERVER + ROUTE;

  try {
    const files_obj = await getFiles(files);
    console.log(`files_obj: ${JSON.stringify(files_obj)}`);

    const post_data = {
      params: {
        files: files_obj,
        webhook_url: webhookUrl,
      },
    };

    let res = await axios.post(url.toString(), post_data, {
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
    console.log(`error123 ${error}`);
    throw error;
  }
}
