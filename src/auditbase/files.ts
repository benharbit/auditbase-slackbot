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

export async function getFiles(fileNames: string[]) {
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
