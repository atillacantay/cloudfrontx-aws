export const formatSuccessResponse = (data: any, statusCode = 200) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
    },
    body: JSON.stringify(data),
  };
};

export const formatErrorResponse = (
  message: string,
  statusCode = 500,
  errorDetails?: string
) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
    },
    body: JSON.stringify({
      message,
      ...(errorDetails && { error: errorDetails }),
    }),
  };
};
