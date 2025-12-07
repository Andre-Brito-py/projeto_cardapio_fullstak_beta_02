/**
 * Middleware genérico de validação usando Joi schemas
 */
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Retornar todos os erros, não apenas o primeiro
            stripUnknown: true // Remover campos desconhecidos
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors
            });
        }

        // Sub write validated data de volta ao req.body
        req.body = value;
        next();
    };
};
