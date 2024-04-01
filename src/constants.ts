type UserRecord = {
  username: string;
  scanid: string;
};

type FileUpload = {
  fileName: string;
  fileId: string;
  timestamp: number;
};
export const userRecords: UserRecord[] = [];
export const fileUploads: FileUpload[] = [];
