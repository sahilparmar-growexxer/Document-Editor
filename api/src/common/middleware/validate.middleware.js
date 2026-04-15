import AppError from '../errors/AppError.js';
import errorCodes from '../errors/errorCodes.js';

function validate(schema) {
  return (req, _res, next) => {

    console.log("BODY:", req.body);
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return next(
        new AppError(
          result.error.issues.map((i) => i.message).join(', '),
          400,
          errorCodes.VALIDATION_ERROR
        )
      );
    }

    req.validated = result.data;
    return next();
  };
}

export default validate;
