import { AUDITBASE_API_SERVER } from "../constants";
import { WebClient } from "@slack/web-api";
import axios from "axios";
import fs from "fs";

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

async function getFileList() {
  try {
    // Call the files.list API method
    /*
    const uploadResult = await client.files.upload({
      channels: "#auditbase-dev",
      file: fs.createReadStream("./README.md"),
    });
    
    console.log("uploadResult", JSON.stringify(uploadResult));
    */
    const result = await client.files.list({ channel: "D06RQD9064A" });
    console.log("result", JSON.stringify(result));
    if (result?.files) {
      result.files.forEach((x: any) => {
        console.log(`filezzz: ${JSON.stringify(x)}`);
      });
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

type FileData = {
  [key: string]: string;
};

async function getFiles(fileNames: string[]) {
  const allFiles = await getFileList();
  console.log(`fileNames: ${JSON.stringify(fileNames)}`);
  console.log(`allFiles: ${JSON.stringify(allFiles)}`);
  if (!allFiles) {
    throw Error("No files found on slack");
  }

  const rtnFiles: FileData = {};

  fileNames.forEach(async (fileName) => {
    if (!fileName) {
      throw Error("No file name provided");
    }
    const matched_files = allFiles.filter((x: any) => {
      x.name === fileName;
    });
    if (matched_files.length > 0 && matched_files.at(-1) !== undefined) {
      if (matched_files.at(-1)?.url_private_download === undefined) {
        throw Error(`found multiple files with name ${fileName}`);
      }

      const results = await axios.get(
        matched_files.at(-1)!.url_private_download!
      );
      if (results.status !== 200) {
        throw Error(`Error downloading file ${fileName}`);
      }
      rtnFiles[fileName] = results.data;
    } else {
      throw Error(`didn't find file ${fileName}`);
    }
  });
  return rtnFiles;
}

// Call the files.info API method with the fileId

/*
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
*/
export async function placeUploadScan(files: string[], apiKey: string) {
  const ROUTE = "scans/upload";
  const url = AUDITBASE_API_SERVER + ROUTE;

  try {
    const files_obj = await getFiles(files);
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
