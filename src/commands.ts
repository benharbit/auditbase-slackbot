import { AckFn, RespondArguments, SayFn, SlashCommand } from "@slack/bolt";

import { MessageError } from "./errors";
import { ChatBot } from "./types";
import { getFaceQuiz } from "./quiz";
import { fetchUsers } from "./data";
import { sendExplorerScanRequest } from "./auditBaseApi";

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

    try {
      await ack();
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

export const addSlashCommands = (app: ChatBot) => {
  app.command("/facequiz", getFaceQuizCommand(app));
  app.command("/explorer-scan", getExplorerScan(app));
};
