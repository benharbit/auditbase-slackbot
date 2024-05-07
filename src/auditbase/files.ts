import { WebClient } from "@slack/web-api";
import axios from "axios";
import { fileUploads } from "../constants";

const AUDITBASE_API_SERVER = process.env.AUDITBASE_API_SERVER;

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

type FileInfo = {
  id: string;
  name: string;
  url_private_download: string;
  timestamp: number;
};

async function getFileList(): Promise<FileInfo[]> {
  try {
    let result = {
      files: [],
      paging: {
        page: 0,
        pages: 1,
        total: 0,
        per_page: 0,
      },
    };
    const files = [];
    let page = 0;
    while (page < 5 && result.paging?.page < result.paging?.pages) {
      ++page;
      const result = await client.files.list({
        channel: process.env.MAIN_CHANNEL,
        page,
      });
      if (result?.files) {
        files.push(...result.files);
      }
    }

    const rtnFiles = files.map((file: any) => {
      return {
        id: file.id,
        content: "",
        name: file.name,
        url_private_download: file.url_private_download,
        timestamp: file.timestamp,
      };
    });

    return !rtnFiles ? [] : rtnFiles;
  } catch (error) {
    console.error("Error fetching file list:", error);
    return [];
  }
}

async function getFileById(fileId: string): Promise<FileInfo | null> {
  try {
    const result = await client.files.info({ file: fileId });
    const fileInfo = result;
    if (!fileInfo || !fileInfo?.file || !fileInfo?.file?.id) {
      throw Error(`No file found with id ${fileId}`);
    }
    const file = fileInfo.file;
    return {
      id: file.id || "",
      name: file.name || "",
      url_private_download: file.url_private_download || "",
      timestamp: file.timestamp || 0,
    };
  } catch (error) {
    console.error(`Error fetching file ${fileId}:, ${error}`);
    return null;
  }
}

async function checkUploadFiles(
  searchFile: string,
  files: FileInfo[]
): Promise<FileInfo | null> {
  const now = Date.now() / 1000;
  const maxAge = 60 * 7; // 7 minutes
  const filesRecent = fileUploads.filter(
    (file) => now - file.timestamp < maxAge
  );
  const filesNotFound = fileUploads.filter(
    (fileUpload) => !files.some((file) => fileUpload.id === file.id)
  );
  console.log("filesNotFound len: ", filesNotFound.length);
  for (const file of filesNotFound) {
    console.log("fileid: ", file.id);
    const fileInfo = await getFileById(file.id);
    console.log("fileInfo: ", fileInfo);

    if (fileInfo?.name === searchFile) {
      return fileInfo;
    }
  }
  return null;
}

type FileData = {
  [key: string]: string;
};

export const getUploadedFiles = async (allFiles: FileInfo[]) => {};

export async function getFiles(fileNames: string[]): Promise<FileData> {
  try {
    console.log("here");
    const allFiles = await getFileList();
    if (!allFiles) {
      throw Error("No files found on slack");
    }

    console.log("here1");

    const rtnFiles: FileData = {};
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      if (!fileName) {
        throw Error("No file name provided");
      }
      let privateUrl = "";
      console.log("here2");
      const matched_files = allFiles.filter((x: any) => x.name === fileName);
      if (matched_files.length > 0 && matched_files.at(-1) !== undefined) {
        privateUrl = matched_files.at(-1)!.url_private_download!;
      } else {
        console.log("Did not find file in files.list; Now checking uploads");
        const file = await checkUploadFiles(fileName, allFiles);
        if (file) {
          privateUrl = file.url_private_download;
        }
      }
      console.log("here33");
      if (!privateUrl) {
        throw Error(`didn't find file ${fileName}`);
      }
      console.log("privateUrl: ", privateUrl);

      const results = await axios.get(privateUrl, {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        },
      });
      if (results.status !== 200) {
        throw Error(`Error downloading file ${fileName}`);
      }
      rtnFiles[fileName] = results.data;
    }
    return rtnFiles;
  } catch (error) {
    console.error("Error getFiles:", error);
    throw error;
  }
}
