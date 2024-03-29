import { AckFn, RespondArguments, SayFn, SlashCommand } from "@slack/bolt";

import { MessageError } from "./errors";
import { ChatBot } from "./types";
import { getFaceQuiz } from "./quiz";
import { fetchUsers } from "./data";
import { placeExplorerScan, getScan, truncate } from "./auditBaseApi";
import { placeUploadScan } from "./auditbase/placeUpload";

const getFaceQuizCommand =
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

    try {
      await ack();
      const slackUsers = await fetchUsers({ app });
      console.log("slackUsers: ", slackUsers);
      console.log("command.user_id: ", command.user_id);

      const quiz = await getFaceQuiz({
        exclude: [command.user_id],
        slackUsers,
      });
      console.log("quiz: ", quiz.blocks);
      await app.dm({ user: command.user_id, blocks: quiz.blocks });
    } catch (error) {
      if (error instanceof MessageError) {
        await app.dm({
          user: command.user_id,
          text: (error as MessageError).message,
        });
      } else {
        throw error;
      }
    }
  };

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
    const WEBHOOK_URL =
      "https://https://slack-bot-3-11d6a34b27bc.herokuapp.com/webhook";

    try {
      await ack();
      if (command.text) {
        const strs = command.text.split(" ");
        if (strs.length < 2) {
          await app.dm({
            user: command.user_id,
            text: "chainId and address are required",
          });
          return;
        }
        const apiKey = strs.length > 2 ? strs[2] : "";

        console.log("chainId: ", strs[0]);
        console.log("address: ", strs[1]);
        const result = await placeExplorerScan(strs[0], strs[1], apiKey);
        console.log("result: ", result);
      }
    } catch (error) {
      if (error instanceof MessageError) {
        console.log("error: ", error);
        await app.dm({
          user: command.user_id,
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
    console.log("command: ", command);
    console.log("ack: ", ack);
    console.log("says: ", say);

    const WEBHOOK_URL =
      "https://https://slack-bot-3-11d6a34b27bc.herokuapp.com/webhook";

    try {
      await ack();
      const args = parseCommand(command.text);
      const key = args.apiKey;
      const result = await placeUploadScan(args.args, key);
      await app.dm({
        user: command.user_id,
        text: JSON.stringify(result),
      });
    } catch (error) {
      if (error instanceof MessageError) {
        console.log("error: ", error);
        await app.dm({
          user: command.user_id,
          text: (error as MessageError).message,
        });
      } else {
        console.log("error2: ", error);
        await app.dm({
          user: command.user_id,
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
    console.log("command: ", command);
    console.log("ack: ", ack);
    console.log("says: ", say);
    const WEBHOOK_URL =
      "https://https://slack-bot-3-11d6a34b27bc.herokuapp.com/webhook";

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
        console.log("got here at scan");

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
            user: command.user_id,
            blocks,
          });
        } else {
          await app.dm({ user: command.user_id, text: JSON.stringify(result) });
        }
        console.log("result: ", result);
      }
    } catch (error) {
      if (error instanceof MessageError) {
        console.log("error: ", error);
        await app.dm({
          user: command.user_id,
          text: (error as MessageError).message,
        });
      } else {
        throw error;
      }
    }
  };

export const addSlashCommands = (app: ChatBot) => {
  app.command("/facequiz", getFaceQuizCommand(app));
  app.command("/scans-explorer", getExplorerScan(app));
  app.command("/scans", getScans(app));
  app.command("/scans-upload", getUploadScan(app));
};
