import { AckFn, RespondArguments, SayFn, SlashCommand } from "@slack/bolt";

import { MessageError } from "./errors";
import { ChatBot } from "./types";
import { placeExplorerScan, getScan, truncate } from "./auditBaseApi";
import { placeUploadScan } from "./auditbase/placeUpload";
import { placeAiScan } from "./auditbase/aiScan";

const parseCommand = (text: string) => {
  const args = text.split(" ");
  let i = 0;
  let apiKey = "";
  const rtnArgs = [];
  while (i < args.length) {
    if (args[i].trim() === "key") {
      if (i < args.length - 1) {
        apiKey = args[i + 1];
        ++i;
      }
    } else {
      rtnArgs.push(args[i]);
    }
    ++i;
  }
  return {
    args: rtnArgs,
    apiKey,
  };
};

const getWebhookUrl = (slackChannel: string, type: string) => {
  const WEBHOOK_URL = `${process.env.AUDITBASE_WEBHOOK_URL}?slackChannel=${slackChannel}&scanType=${type}`;
  return WEBHOOK_URL;
};

const getDMDestination = (command: SlashCommand) => {
  return command.channel_id;
};

const getExplorerScan =
  (app: ChatBot) =>
  async ({
    command,
    ack,
    say,
  }: {
    command: SlashCommand;
    ack: AckFn<string | RespondArguments>;
    say: SayFn;
  }) => {
    console.log("command: ", command);
    console.log("ack: ", ack);
    console.log("says: ", say);
    const webhookUrl = getWebhookUrl(command.channel_id, "explorer");
    const dmDestination = getDMDestination(command);
    try {
      await ack();
      if (command.text) {
        const strs = command.text.split(" ");
        if (strs.length < 2) {
          await app.dm({
            user: command.channel_id,
            text: "chainId and address are required",
          });
          return;
        }
        const apiKey = strs.length > 2 ? strs[2] : "";
        const result = await placeExplorerScan(
          strs[0],
          strs[1],
          apiKey,
          webhookUrl
        );
        await app.dm({
          user: dmDestination,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  "Scan has been submitted successfully. \n " +
                  `Scan submission result: ${JSON.stringify(result)}`,
              },
            },
          ],
          text: `Explorer Scan submission result: ${JSON.stringify(
            result
          )} </span>`,
        });
      }
    } catch (error) {
      if (error instanceof MessageError) {
        console.log("error: ", error);
        await app.dm({
          user: dmDestination,
          text: (error as MessageError).message,
        });
      } else {
        throw error;
      }
    }
  };

const getUploadScan =
  (app: ChatBot) =>
  async ({
    command,
    ack,
    say,
  }: {
    command: SlashCommand;
    ack: AckFn<string | RespondArguments>;
    say: SayFn;
  }) => {
    const webHookUrl = getWebhookUrl(command.channel_id, "upload");
    const dmDestination = getDMDestination(command);
    try {
      await ack();
      const args = parseCommand(command.text);
      const key = args.apiKey;
      const result = await placeUploadScan(args.args, key, webHookUrl);
      await app.dm({
        user: dmDestination,
        text: `Place upload return value: ${JSON.stringify(result)}`,
      });
    } catch (error) {
      if (error instanceof MessageError) {
        console.log("error: ", error);
        await app.dm({
          user: dmDestination,
          text: (error as MessageError).message,
        });
      } else if (error instanceof Error) {
        console.log("error3: ", error);
        await app.dm({
          user: dmDestination,
          text: `Error: ${error.message}`,
        });
      } else {
        console.log("error2: ", error);
        await app.dm({
          user: dmDestination,
          text: `error with ${JSON.stringify(error)}`,
        });
      }
    }
  };

const getAiScan =
  (app: ChatBot) =>
  async ({
    command,
    ack,
    say,
  }: {
    command: SlashCommand;
    ack: AckFn<string | RespondArguments>;
    say: SayFn;
  }) => {
    const webhookUrl = getWebhookUrl(command.channel_id, "ai");
    const dmDestination = getDMDestination(command);

    try {
      await ack();
      const args = parseCommand(command.text);
      const key = args.apiKey || process.env.AUDITBASE_API_KEY || "";

      const result = await placeAiScan(args.args[0], key, webhookUrl);
      await app.dm({
        user: dmDestination,
        text: `AI place scan response: ${JSON.stringify(result)}`,
      });
    } catch (error) {
      if (error instanceof MessageError) {
        console.log("MessageError: ", error);
        await app.dm({
          user: dmDestination,
          text: (error as MessageError).message,
        });
      } else if (error instanceof Error) {
        console.log("Error: ", error);
        await app.dm({
          user: dmDestination,
          text: `Error: ${error.message}`,
        });
      } else {
        console.log("Other error: ", error);
        await app.dm({
          user: dmDestination,
          text: `error with ${JSON.stringify(error)}`,
        });
      }
    }
  };

const getScans =
  (app: ChatBot) =>
  async ({
    command,
    ack,
    say,
  }: {
    command: SlashCommand;
    ack: AckFn<string | RespondArguments>;
    say: SayFn;
  }) => {
    const dmDestination = getDMDestination(command);
    try {
      const DO_TRUNCATE = true;

      await ack();
      if (typeof (command.text, "string")) {
        const args = command.text.split(" ");
        let i = 0;
        let apiKey = "";
        let scanId = "";
        while (i < args.length) {
          if (args[i].trim() === "key") {
            if (i < args.length - 1) {
              apiKey = args[i + 1];
              ++i;
            }
          } else {
            scanId = args[i];
          }
          ++i;
        }

        const result = await getScan(scanId, apiKey);
        if (result.statusCode === 200) {
          const blocks = [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: "Scan has been completed successfully",
              },
            },
            {
              type: "section",
              text: {
                type: "plain_text",
                text: `Number of issues: ${result.numIssues}`,
              },
            },
            {
              type: "section",
              text: {
                type: "plain_text",
                text: `Truncated reports: ${truncate(result.result)}`,
              },
            },
          ];
          await app.dm({
            user: dmDestination,
            blocks,
          });
        } else {
          await app.dm({ user: dmDestination, text: JSON.stringify(result) });
        }
      }
    } catch (error) {
      if (error instanceof MessageError) {
        console.log("error: ", error);
        await app.dm({
          user: dmDestination,
          text: (error as MessageError).message,
        });
      } else {
        throw error;
      }
    }
  };

export const addSlashCommands = (app: ChatBot) => {
  app.command("/scans-explorer", getExplorerScan(app));
  app.command("/scans", getScans(app));
  app.command("/scans-upload", getUploadScan(app));
  app.command("/scans-ai", getAiScan(app));
};
