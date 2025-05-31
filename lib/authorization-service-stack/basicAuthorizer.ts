import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import {
  validateAuthorizationToken,
  decodeBasicAuthToken,
  validateCredentials,
  createSuccessResponse,
  type AuthResult,
} from "./utils/auth-utils";

export const main = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<AuthResult> => {
  console.log("Authorization event:", JSON.stringify(event, null, 2));

  const authorizationToken = event.authorizationToken;

  try {
    validateAuthorizationToken(authorizationToken);

    const { username, password } = decodeBasicAuthToken(authorizationToken);

    validateCredentials(username, password);

    return createSuccessResponse(username);
  } catch (error) {
    console.error("Authorization error:", error);
    throw new Error("Unauthorized");
  }
};
