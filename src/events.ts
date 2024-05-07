import { ChatBot } from "./types";

const handle_file_upload = (app: ChatBot) => {
  app.action("file_upload", async ({ ack, say, action, body }) => {
    await ack();
  });
};

export const addEvents = (app: ChatBot) => {};
