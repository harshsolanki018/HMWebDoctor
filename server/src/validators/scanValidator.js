const { z } = require('zod');

const scanRequestSchema = z.object({
  url: z
    .string({
      required_error: 'Target URL is required',
      invalid_type_error: 'Target URL must be a string',
    })
    .trim()
    .min(1, 'Target URL cannot be empty')
    .refine(
      (val) => {
        let input = val;
        if (!/^https?:\/\//i.test(input)) {
          input = `https://${input}`;
        }
        try {
          const parsed = new URL(input);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Invalid URL format. Provide a valid http:// or https:// URL.' }
    ),
});

function validateScanRequest(req, res, next) {
  const result = scanRequestSchema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.') || 'url',
      message: err.message,
    }));

    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'INVALID_URL',
        message: formattedErrors[0].message,
        details: formattedErrors,
      },
    });
  }

  req.validatedBody = result.data;
  next();
}

module.exports = {
  validateScanRequest,
  scanRequestSchema,
};
