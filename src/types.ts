import { Member } from "@slack/web-api/dist/response/UsersListResponse";

require("dotenv").config();
import { App, Block, KnownBlock } from "@slack/bolt";

export class ChatBot extends App {
  async dm({
    user,
    blocks,
    text = "",
    markdown = false,
  }: {
    user: string;
    blocks?: Array<Block | KnownBlock>;
    text?: string;
    markdown?: boolean;
  }) {
    const token = process.env.SLACK_BOT_TOKEN;
    await this.client.chat.postMessage({
      channel: user,
      token,
      blocks,
      text,
      markdown,
    });
  }
}

export type User = Member & { hasImage: () => Promise<boolean> } & Required<
    Pick<Member, "profile" | "id">
  >;
