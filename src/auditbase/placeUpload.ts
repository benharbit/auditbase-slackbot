import { WebClient } from "@slack/web-api";
import axios from "axios";
import fs from "fs";
const AUDITBASE_API_SERVER = process.env.AUDITBASE_API_SERVER;

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
    for (const x in result) {
      console.log(`file_fields: ${JSON.stringify(x)}`);
    }

    for (const x in result?.paging) {
      console.log(`paging: ${JSON.stringify(x)}: `);
    }

    console.log(`${JSON.stringify(result?.paging)}`);

    for (const x in result?.response_metadata) {
      console.log(`response_metadata: ${JSON.stringify(x)}`);
    }

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
  try {
    const allFiles = await getFileList();
    if (!allFiles) {
      throw Error("No files found on slack");
    }

    const rtnFiles: FileData = {};
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      if (!fileName) {
        throw Error("No file name provided");
      }
      const matched_files = allFiles.filter((x: any) => x.name === fileName);
      if (matched_files.length > 0 && matched_files.at(-1) !== undefined) {
        if (matched_files.at(-1)?.url_private_download === undefined) {
          throw Error(`found multiple files with name ${fileName}`);
        }
        console.log("fffffff");

        const results = await axios.get(
          matched_files.at(-1)!.url_private_download!
        );
        if (results.status !== 200) {
          throw Error(`Error downloading file ${fileName}`);
        }
        console.log("results.data", results.data);
        rtnFiles[fileName] = results.data;
      } else {
        throw Error(`didn't find file ${fileName}`);
      }
    }
    return rtnFiles;
  } catch (error) {
    console.error("Error fetching file list:");
    throw error;
  }
}

export async function placeUploadScan(files: string[], apiKey: string) {
  const ROUTE = "/scans/upload";
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
    console.log("error123");
    throw error;
    // console.log(error);

    // return "unknown error";
  }
}
