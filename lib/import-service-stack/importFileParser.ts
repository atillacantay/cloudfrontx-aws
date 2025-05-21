import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Event } from "aws-lambda";
import * as csv from "csv-parser";
import { ProductWithStock } from "../product-service-stack/types";

const s3Client = new S3Client({});
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME || "";
const UPLOADED_FOLDER = process.env.UPLOADED_FOLDER || "uploaded";
const PARSED_FOLDER = process.env.PARSED_FOLDER || "parsed";
const CATALOG_ITEMS_QUEUE_URL = process.env.CATALOG_ITEMS_QUEUE_URL || "";

export const main = async (event: S3Event): Promise<void> => {
  try {
    console.log("S3 Event: ", JSON.stringify(event, null, 2));

    for (const record of event.Records) {
      // Get the key of the object that triggered the event
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
      console.log(`Processing file: ${key}`);

      if (!key.startsWith(`${UPLOADED_FOLDER}/`)) {
        console.log(`Skipping file not in uploaded folder: ${key}`);
        continue;
      }

      const getObjectParams = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      const s3Stream = await s3Client.send(
        new GetObjectCommand(getObjectParams)
      );
      const stream = s3Stream.Body;

      if (!stream) {
        console.error("Failed to get stream from S3 object");
        continue;
      }

      await new Promise<void>((resolve, reject) => {
        stream
          // @ts-ignore - csv-parser types don't match the S3 stream type
          .pipe(csv())
          .on("data", async (data: any) => {
            try {
              const formattedData: ProductWithStock = {
                ...data,
                price: data.price ? Number(data.price) : 0,
                count: data.count ? Number(data.count) : 0,
              };

              if (CATALOG_ITEMS_QUEUE_URL) {
                await sqsClient.send(
                  new SendMessageCommand({
                    QueueUrl: CATALOG_ITEMS_QUEUE_URL,
                    MessageBody: JSON.stringify(formattedData),
                  })
                );
                console.log(
                  `Event record sent to SQS: ${JSON.stringify(formattedData)}`
                );
              } else {
                console.warn(
                  "CATALOG_ITEMS_QUEUE_URL not set, skipping SQS send"
                );
              }
            } catch (error) {
              console.error("Error sending to SQS:", error);
            }
          })
          .on("error", (error: Error) => {
            console.error("Error parsing CSV:", error);
            reject(error);
          })
          .on("end", async () => {
            console.log(`Finished processing file: ${key}`);

            try {
              // Copy to parsed folder
              const targetKey = key.replace(
                `${UPLOADED_FOLDER}/`,
                `${PARSED_FOLDER}/`
              );

              await s3Client.send(
                new CopyObjectCommand({
                  Bucket: BUCKET_NAME,
                  CopySource: `${BUCKET_NAME}/${key}`,
                  Key: targetKey,
                })
              );

              console.log(`File copied to: ${targetKey}`);

              // Delete from uploaded folder
              await s3Client.send(
                new DeleteObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: key,
                })
              );

              console.log(`Original file deleted: ${key}`);
              resolve();
            } catch (error) {
              console.error("Error moving file:", error);
              reject(error);
            }
          });
      });
    }

    console.log("CSV processing completed successfully");
  } catch (error) {
    console.error("Error in importFileParser:", error);
    throw error;
  }
};
