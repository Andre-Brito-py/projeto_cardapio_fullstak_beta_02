import Joi from 'joi';

/**
 * Schema de validação para criação de produto
 */
export const createFoodSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Nome é obrigatório',
            'string.min': 'Nome deve ter no mínimo 3 caracteres',
            'string.max': 'Nome deve ter no máximo 100 caracteres'
        }),

    description: Joi.string()
        .max(500)
        .required()
        .messages({
            'string.empty': 'Descrição é obrigatória',
            'string.max': 'Descrição deve ter no máximo 500 caracteres'
        }),

    price: Joi.number()
        .positive()
        .required()
        .messages({
            'number.base': 'Preço deve ser um número',
            'number.positive': 'Preço deve ser maior que zero',
            'any.required': 'Preço é obrigatório'
        }),

    category: Joi.string()
        .required()
        .messages({
            'string.empty': 'Categoria é obrigatória'
        }),

    image: Joi.string()
        .optional(),

    extras: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required(),
                price: Joi.number().min(0).required()
            })
        )
        .optional(),

    addonCategories: Joi.array()
        .optional(),

    categoryAddons: Joi.object()
        .optional(),

    useOldSystem: Joi.boolean()
        .optional()
});

/**
 * Schema de validação para atualização de produto
 */
export const updateFoodSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[a-f0-9]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'ID do produto inválido'
        }),

    name: Joi.string()
        .min(3)
        .max(100)
        .optional(),

    description: Joi.string()
        .max(500)
        .optional(),

    price: Joi.number()
        .positive()
        .optional(),

    category: Joi.string()
        .optional(),

    extras: Joi.array()
        .optional(),

    addonCategories: Joi.array()
        .optional(),

    categoryAddons: Joi.object()
        .optional(),

    useOldSystem: Joi.boolean()
        .optional()
});

/**
 * Schema de validação para atualizar status de estoque
 */
export const updateStockSchema = Joi.object({
    id: Joi.string()
        .pattern(/^[a-f0-9]{24}$/)
        .required(),

    isOutOfStock: Joi.boolean()
        .optional(),

    outOfStockAddons: Joi.array()
        .items(Joi.string())
        .optional(),

    outOfStockAddonCategories: Joi.array()
        .items(Joi.string())
        .optional()
});
