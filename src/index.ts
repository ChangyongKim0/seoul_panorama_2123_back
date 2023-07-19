const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");

import fs from "fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const keys = JSON.parse(fs.readFileSync("secret/key.json", "utf8")).back;
const ACCESS_KEY = keys.accessKey;
const SECRET_ACCESS_KEY = keys.secretAccessKey;
const REGION = "ap-northeast-2";
const s3 = new S3Client({
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_ACCESS_KEY },
});

const run = async () => {
  try {
    // const results = await s3.send(
    //   new PutObjectCommand({
    //     Bucket: "seoulpanorama2123-readonly-test-1",
    //     Key: "key.txt",
    //     Body: "bodfy",
    //   })
    // );
    const results2 = await s3.send(
      new GetObjectCommand({
        Bucket: "seoulpanorama2123-readonly-test-1",
        Key: "key.txt",
      })
    );
    console.log("success");
    // console.log(results);
    const str = await results2.Body?.transformToString();
    return str;
  } catch (e: any) {
    console.log("error");
    console.log({ ...e });
    // e.name === "NoSuchKey",
    // e.name === "NoSuchBucket",
    // e.name === "PermanentRedirect",
    // e.name === "AccessDenied",
  }
};

console.log(run());
console.log(keys);

var app = express();

// app.opts

// app.use(cors({
//     origins: ['https://api.propi.moohae.net', 'https://propi.moohae.net'],   // defaults to ['*']
//     credentials: true,                 // defaults to false
//     // headers: ['x-foo']                 // sets expose-headers
// }));

// app.use(
//   cors({
//     origins: ["https://api.propi.moohae.net"],
//   })
// );

const port = 3401;
app.set("port", port);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req: unknown, res: { send: (data: unknown) => unknown }) => {
  run().then((str) => res.send(str));

  console.log("server testing ok");
});

app.listen(port, () => {
  console.log("Express listening on port", port);
});

// console.log("d");
