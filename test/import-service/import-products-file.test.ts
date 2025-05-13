import { main } from "../../lib/import-service-stack/importProductsFile";
import { APIGatewayProxyEvent } from "aws-lambda";
import {
  expect,
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
} from "@jest/globals";

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn(() => ({})),
    PutObjectCommand: jest.fn((params) => params),
  };
});

jest.mock("@aws-sdk/s3-request-presigner", () => {
  return {
    getSignedUrl: jest.fn(),
  };
});

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("importProductsFile Lambda", () => {
  const OLD_ENV = process.env;
  const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<
    typeof getSignedUrl
  >;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.BUCKET_NAME = "test-bucket";
    process.env.UPLOADED_FOLDER = "uploaded";
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("should return signed URL when provided valid CSV filename", async () => {
    const mockedUrl =
      "https://test-bucket.s3.amazonaws.com/uploaded/test-file.csv";
    mockGetSignedUrl.mockResolvedValueOnce(mockedUrl);

    const event = {
      queryStringParameters: {
        name: "test-file.csv",
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await main(event);

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: "test-bucket",
      Key: "uploaded/test-file.csv",
      ContentType: "text/csv",
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty("signedUrl", mockedUrl);

    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin", "*");
    expect(result.headers).toHaveProperty(
      "Access-Control-Allow-Credentials",
      true
    );
    expect(result.headers).toHaveProperty(
      "Access-Control-Allow-Methods",
      "GET"
    );
  });

  it("should return 400 when filename is missing", async () => {
    const event = {
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const result = await main(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty("message", "Invalid or missing file name");

    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("should return 400 when file is not a CSV", async () => {
    const event = {
      queryStringParameters: {
        name: "test-file.txt",
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await main(event);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty("message", "File must be a .csv file");

    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("should return 500 when S3 signing fails", async () => {
    mockGetSignedUrl.mockRejectedValueOnce(
      new Error("Failed to generate signed URL")
    );

    const event = {
      queryStringParameters: {
        name: "test-file.csv",
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await main(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty("message", "Error generating upload URL");
    expect(body.error).toBe("Failed to generate signed URL");
  });
});
