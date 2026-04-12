function getErrorDetails(err: unknown) {
  if (err instanceof Error) {
    const statusMatch = /\[(\d{3}) [^\]]+\]/.exec(err.message);
    const reasonMatch = /"reason":"([^"]+)"/.exec(err.message);
    const localizedMessageMatch = /"message":"([^"]+)"/.exec(err.message);

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

function createDevErrorResponse(message: string, err: unknown) {
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
