const Joi = require("joi");

exports.placeOrderSchema = Joi.object({
  total_amount: Joi.number().positive().required(),
  address: Joi.string().min(10).required(),
  payment_method: Joi.string()
    .valid("COD", "UPI", "CARD")
    .required(),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required()
      })
    )
    .min(1)
    .required()
});

exports.updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("SHIPPED")
    .required()
});
