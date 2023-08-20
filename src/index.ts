const middy = require("@middy/core");

import "reflect-metadata";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpSecurityHeaders from "@middy/http-security-headers";

import { WarehouseHandler, OrdersHandler } from "./endpoints";

// warehouse functions handlers
const getIngredientsHandler = middy(WarehouseHandler.getIngredients)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

// Kitchen functions handlers
const ordersHandler = middy(OrdersHandler.createOrder)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

const listOrdersHandler = middy(OrdersHandler.listOrdersHandler)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

const listCurrentOrdersHandler = middy(OrdersHandler.listCurrentOrdersHandler)
  .use(cors())
  .use(httpSecurityHeaders())
  .use(jsonBodyParser())
  .use(httpErrorHandler());

module.exports = {
  getIngredientsHandler,
  ordersHandler,
  listOrdersHandler,
  listCurrentOrdersHandler,
};
