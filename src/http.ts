import { ChatBot } from "./types";
import { userRecords } from "./constants";

import express from "express";
import { ExpressReceiver } from "@slack/bolt";
import { fileUploads } from "./constants";

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

  args.receiver.router.post("/slack-events", (req, res) => {
    const eventType = req.body.event?.type;
    if (req.body.type === "url_verification") {
      return res.send({ challenge: req.body.challenge });
    }

    if (eventType === "file_shared") {
      const fileId = req.body.event?.file_id;
      if (fileId) {
        console.log(`pushed to file uploads ${fileId}`);
        fileUploads.push({
          id: fileId,
          timestamp: req.body.event?.file?.event_ts,
          name: "",
        });
        res.send("OK");
      }
    }

    const rtnText = "received slack event: " + JSON.stringify(req.body);
    args.app.dm({
      user: process.env.MAIN_CHANNEL || "#random",
      text: rtnText,
    });
    return res.send({ challenge: req.body.challenge });
  });

  args.receiver.router.post("/webhook", (req, res) => {
    try {
      const token = req.query.token as string;
      console.log(`webhook received`);
      for (let x in req) {
        console.log(`req key: ${x}`);
      }

      if (req?.body) {
        for (const x in req.body) {
          console.log(`req body key: ${x}`);
          //console.log("type of key: ", typeof req.body[x]);
        }
      }

      if (req.body["result"]) {
        for (const x in req.body["result"]) {
          console.log(`key: ${x}`);
          //console.log("type of key: ", typeof req.body["result"][x]);
        }
      } else if (req?.body?.issues) {
        //branch from aiscan
        console.log("issues found");
        const rtnVal =
          "Webhook AI Scan Results Received: \n" +
          JSON.stringify(req.body["issues"]);
        args.app.dm({
          user: process.env.MAIN_CHANNEL || "#random",
          text: JSON.stringify(rtnVal),
        });
        return res.send("OK");
      } else {
        console.log("no issues found");
        console.log("req.body", req.body);
      }

      console.log(
        `webhook sending db: ${JSON.stringify(process.env.MAIN_CHANNEL)}`
      );
      args.app.dm({
        user: process.env.MAIN_CHANNEL || "#random",
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
    } catch (error: Error | any) {
      console.log(`error in webhook: ${error}`);
      return res.send("OK");
    }
  });
};

export const addEventHandler = (args: {
  app: ChatBot;
  receiver: ExpressReceiver;
  allowedTokens: string[];
  dmChannel: string;
}) => {
  args.receiver.router.use(express.json({ limit: "50mb" }));
  args.receiver.router.use(
    express.urlencoded({ extended: true, limit: "50mb" })
  );
  args.receiver.router.post("/slack-events", (req, res) => {
    if (req.body.type === "url_verification") {
      return res.send({ challenge: req.body.challenge });
    }

    const rtnText = "received slack event: " + JSON.stringify(req.query);
    args.app.dm({
      user: process.env.MAIN_CHANNEL || "#random",
      text: rtnText,
    });
    return res.send({ challenge: req.body.challenge });
  });
};
