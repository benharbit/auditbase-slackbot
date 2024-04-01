import { ChatBot } from "./types";
import { userRecords } from "./constants";

import express from "express";
import { ExpressReceiver } from "@slack/bolt";

const truncateIssues = (data: Array<any>) => {
  console.log("is array", data instanceof Array);
  console.log("type of ", typeof data);
  if (data.length < 10) {
    return JSON.stringify(data);
  }

  return (
    JSON.stringify(data.slice(0, 1)) +
    `...............${data.length - 2} issues in between...........` +
    JSON.stringify(data.slice(data.length - 1, data.length))
  );
};

const webhookPrint = (data: any) => {
  const issues = data["result"]["issues"];
  const scanId = data["scan_id"];
  return (
    "Webhook Results: \n" +
    JSON.stringify({
      scan_id: scanId,
      status: data["status"],
      truncated_issues: truncateIssues(issues),
    }) +
    "\n" +
    `Num issues: ${data?.result?.issues?.length}\n`
  );
};
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
    console.log(`webhook received`);
    if (req.body["result"]) {
      for (const x in req.body["result"]) {
        console.log(`key: ${x}`);
        //console.log("type of key: ", typeof req.body["result"][x]);
      }
    } else if (req.body["issues"]) {
      //branch from aiscan
      const rtnVal =
        "Webhook AI Scan Results Received: \n" +
        JSON.stringify(req.body["issues"]);
      args.app.dm({
        user: "D06RQD9064A",
        text: JSON.stringify(rtnVal),
      });
      return res.send("OK");
    }

    args.app.dm({
      user: "D06RQD9064A",
      text: webhookPrint(req.body),
    });

    const found_records = userRecords.filter(
      (user) => user === req.body["scan_id"]
    );

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
