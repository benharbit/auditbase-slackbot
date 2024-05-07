type UserRecord = {
  username: string;
  scanid: string;
};

type FileUpload = {
  name: string;
  id: string;
  timestamp: number;
};
export const userRecords: UserRecord[] = [];
export const fileUploads: FileUpload[] = [];
