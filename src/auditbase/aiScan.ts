import { WebClient } from "@slack/web-api";
import axios from "axios";
import { getFiles } from "./files";
const AUDITBASE_API_SERVER = process.env.AUDITBASE_API_SERVER;

export async function placeAiScan(file_1: string, apiKey: string) {
  const ROUTE = "/v1/ai-scan";
  const url = AUDITBASE_API_SERVER + ROUTE;

  try {
    if (!file_1) throw Error("No file name provided");
    const files_obj = await getFiles([file_1]);

    const post_data = {
      params: {
        source: Object.values(files_obj).at(0),
        webhook_url: process.env.AUDITBASE_WEBHOOK_URL,
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
    console.log("error aiScan: ", error);
    throw error;
    // console.log(error);

    // return "unknown error";
  }
}
