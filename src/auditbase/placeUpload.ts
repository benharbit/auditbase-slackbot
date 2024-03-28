import { AUDITBASE_API_SERVER } from "../constants";
import { WebClient } from "@slack/web-api";
import axios from "axios";

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

async function getFileList() {
  try {
    // Call the files.list API method
    const result = await client.files.list();
    console.log("result", JSON.stringify(result));
    if (result?.files) {
      for (const x of result.files) {
        console.log(`filezzz: ${JSON.stringify(x)}`);
      }
    }

    // Extract the files array from the response
    const files = result.files;

    // Return the list of files
    return files;
  } catch (error) {
    console.error("Error fetching file list:", error);
    return [];
  }
}

async function getFile(fileId: string) {
  try {
    // Call the files.info API method with the fileId
    const result = await client.files.info({ file: fileId });

    // Extract the file object from the response
    const file = result.file;

    // Return the file object
    return file;
  } catch (error) {
    console.error("Error fetching file:", error);
    return null;
  }
}

type FileData = {
  [key: string]: string;
};

async function buildFiles(files: string[]) {
  const fileList = await getFileList();
  for (const x in fileList) {
    console.log(`file ${JSON.stringify(x)}`);
  }

  const filesRtn: FileData = {};
  for (const file of files) {
    const file_data = await getFile(file);
    if (!file_data || !file_data.url_private_download) {
      throw new Error(`Error fetching file: ${file}`);
    }
    const res = await axios.get(file_data.url_private_download);
    if (res.status === 200) {
      filesRtn[file] = res.data;
    } else {
      throw new Error(
        `Error downloads file: ${file_data.url_private_download}`
      );
    }
  }
  return filesRtn;
}
export async function placeUploadScan(files: string[], apiKey: string) {
  const ROUTE = "scans/upload";
  const url = AUDITBASE_API_SERVER + ROUTE;

  try {
    const files_obj = await buildFiles(files);
    console.log(`files_obj: ${JSON.stringify(files_obj)}`);

    const post_data = {
      params: {
        files: files_obj,
        webhook_url: process.env.AUDITBASE_WEBHOOK_URL,
      },
    };

    let res = await axios.post(url, post_data, {
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
      throw new Error(error.message);
      //console.error(error.message);
      //return error.message;
    }
    throw new Error(JSON.stringify(error));
    // console.log(error);

    // return "unknown error";
  }
}
