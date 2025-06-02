import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME || "";
const UPLOADED_FOLDER = process.env.UPLOADED_FOLDER || "uploaded";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || "*"; // For CORS

export const main = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("importProductsFile event: ", JSON.stringify(event, null, 2));

  try {
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          message: "Invalid or missing file name",
        }),
      };
    }

    if (!fileName.toLowerCase().endsWith(".csv")) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          message: "File must be a .csv file",
        }),
      };
    }

    // Create a presigned URL for uploading to S3
    const key = `${UPLOADED_FOLDER}/${fileName}`;
    const putObjectParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: "text/csv",
    };

    const command = new PutObjectCommand(putObjectParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    console.log(`Generated signed URL for ${key}:`, signedUrl);

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        signedUrl,
      }),
    };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: "Error generating upload URL",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

const getCorsHeaders = () => {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS,
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  };
};
