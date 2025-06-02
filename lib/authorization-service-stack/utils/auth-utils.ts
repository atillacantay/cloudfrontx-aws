interface AuthResult {
  principalId: string;
  policyDocument: {
    Version: string;
    Statement: Array<{
      Action: string;
      Effect: string;
      Resource: string;
    }>;
  };
  context?: {
    username: string;
  };
}

export const validateAuthorizationToken = (
  authorizationToken: string
): AuthResult | null => {
  if (!authorizationToken) {
    console.log("No authorization token provided - returning 401");
    throw new Error("Unauthorized: No authorization token provided");
  }

  if (!authorizationToken.startsWith("Basic ")) {
    console.log("Invalid authorization token format - returning 401");
    throw new Error("Unauthorized: Invalid authorization token format");
  }

  return null;
};

export const decodeBasicAuthToken = (
  authorizationToken: string
): { username: string; password: string } => {
  const token = authorizationToken.substring(6);
  const decodedToken = Buffer.from(token, "base64").toString("utf-8");
  console.log("Decoded authorization token:", decodedToken);

  const [username, password] = decodedToken.split(":");

  console.log("Decoded username:", username);

  return { username, password };
};

export const validateCredentials = (
  username: string,
  password: string
): AuthResult | null => {
  const expectedPassword = process.env[username];

  if (!expectedPassword || expectedPassword !== password) {
    console.log("Invalid credentials for user:", username, "- returning 403");
    throw new Error("Forbidden: Invalid credentials");
  }

  return null;
};

export const createSuccessResponse = (username: string): AuthResult => {
  console.log("Authorization successful for user:", username);

  return {
    principalId: username,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: "*",
        },
      ],
    },
    context: {
      username: username,
    },
  };
};

export type { AuthResult };
