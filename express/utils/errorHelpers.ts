export function getErrorDetails(err: unknown) {
  if (err instanceof Error) {
    const statusMatch = err.message.match(/\[(\d{3}) [^\]]+\]/);
    const reasonMatch = err.message.match(/"reason":"([^"]+)"/);
    const localizedMessageMatch = err.message.match(/"message":"([^"]+)"/);

    return {
      type: err.name,
      statusCode: statusMatch?.[1],
      code: reasonMatch?.[1],
      message: localizedMessageMatch?.[1] ?? err.message,
    };
  }

  if (typeof err === 'object' && err !== null) {
    return err;
  }

  return {
    message: String(err),
  };
}

export function createDevErrorResponse(message: string, err: unknown) {
  return process.env.NODE_ENV === 'production'
    ? { message }
    : {
        message,
        details: getErrorDetails(err),
      };
}

const errorHelpers = {
  getErrorDetails,
  createDevErrorResponse,
};

export default errorHelpers;
