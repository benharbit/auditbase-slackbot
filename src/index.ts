require("dotenv").config();

import { createApp } from "./app";
import { addEvents } from "./events";
import { addSlashCommands } from "./commands";
import { createHandler, addHttpHandlers } from "./http";
import { WebClient } from "@slack/web-api";
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

const receiver = createHandler({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const app = createApp({
  slackBotToken: process.env.SLACK_BOT_TOKEN!,
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET!,
  receiver,
});

const getFileList = async () => {
  client.files.list({ channel: "C05DJHR4PCK" }).then((result) => {
    console.log("result", JSON.stringify(result));
    if (result?.files) {
      result.files.forEach((x: any) => {
        console.log(`filezzz: ${JSON.stringify(x)}`);
      });
    }
  });
};

addSlashCommands(app);
addEvents(app);
addHttpHandlers({
  app,
  receiver,
  allowedTokens: [process.env.WEBHOOK_TOKEN!],
  dmChannel: process.env.SLACK_WEBHOOK_CHANNEL || "#random",
});

(async () => {
  await app.start(process.env.PORT as string);
  console.log(`⚡️ Bolt app is listening at localhost:${process.env.PORT}`);
})();
