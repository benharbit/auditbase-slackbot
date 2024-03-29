import { ChatBot } from "./types";

import express from "express";
import { ExpressReceiver } from "@slack/bolt";

export const createHandler = (props: { signingSecret: string }) =>
  new ExpressReceiver(props);

export const addHttpHandlers = (args: {
  app: ChatBot;
  receiver: ExpressReceiver;
  allowedTokens: string[];
  dmChannel: string;
}) => {
  args.receiver.router.use(express.json({ limit: "50mb" }));
  args.receiver.router.use(
    express.urlencoded({ extended: true, limit: "50mb" })
  );
  args.receiver.router.get("/secret-page", (req, res) => {
    console.log(`req.query: ${JSON.stringify(req.query)}`);

    const token = req.query.token as string;

    const hasAccess = token && args.allowedTokens.includes(token);

    if (!hasAccess) {
      console.log(`Attempted accessing http handler without valid token`);
      return res.send("OK");
    }
    args.app.dm({
      user: args.dmChannel,
      text: "/secret-page got a get request",
    });
    res.send(`Super`);
  });
  args.receiver.router.post("/webhook", (req, res) => {
    const token = req.query.token as string;
    console.log(`webhook received: ${JSON.stringify(req)}`);
    for (const key in req.body) {
      console.log(`key: ${key}`);
    }
    return res.send("OK");
    const hasAccess = token && args.allowedTokens.includes(token);
    if (!hasAccess) {
      console.log(`Attempted accessing POST webhook without valid token`);
      return res.send("OK");
    }
    const dataLength = JSON.stringify(req.body).length;
    console.log(`POST /webhook received:`);
    console.log(JSON.stringify(req.body, undefined, 2));
    args.app.dm({
      user: args.dmChannel,
      text: `/webhook got a POST request with data of length ${dataLength}`,
    });
    res.send(`Super`);
  });
};
