import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const keys = JSON.parse(fs.readFileSync("secret/key.json", "utf8")).back;
const ACCESS_KEY = keys.accessKey;
const SECRET_ACCESS_KEY = keys.secretAccessKey;
const REGION = "ap-northeast-2";
const s3 = new S3Client({
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_ACCESS_KEY },
});

type Data = { Bucket: string; Key: string; Body: any };
type Bucket = { Bucket: string };

export const putObject = async (data: Data) => {
  try {
    const results = await s3.send(new PutObjectCommand(data));
    console.log("success");
    return results;
  } catch (e) {
    console.log("error");
    console.log(e);
  }
};
