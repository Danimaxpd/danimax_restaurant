# Serverless Framework Node Express API on AWS Danimax Restaurant

This project was made by [danimaxpd](https://github.com/Danimaxpd)

> The objective of this technical task is to create Being able to solve the need of the restaurant manager, who must be able to tell the kitchen that a meal must be prepared
> dish, the kitchen randomly selects the dish to be prepared and asks the warehouse for
> food, the required ingredients, if the warehouse has availability, deliver the
> ingredients to the kitchen, if you don't have to buy them in the market place. when the kitchen
> receives the ingredients, prepares the dish, and delivers the prepared dish.

**For this I have implemented a serverless event-oriented solution, which allows us to manage random dishes dynamically and very quickly.**

## Anatomy

This project configures a single function, `api`, which is responsible for handling all incoming requests thanks to the `httpApi` event. As the event is configured in a way to accept all incoming requests, `express` framework is responsible for routing and handling requests internally. Implementation takes advantage of [`serverless-http`](https://github.com/serverless/serverless) package, which allows you to wrap existing `express` applications. Also the project implement the [`Lift plugin`](https://github.com/getlift/lift/blob/master/docs/queue.md) and [aws-sdk/client-sqs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-sqs/) are the responsible to create the SQS and workers to handle the queues and deploy all the infrastructure to AWS.

### App flow

![diagram flow Of the danimax_restaurant project](https://lh3.googleusercontent.com/fife/AKsag4N8uHqb6KdzHgoJE9tXhg9Ne9YlFVALg5as3yti6BRKr6OxB9xo7dY1RGfdk4a5fs3b1WeYpcO0gapYBcYrhHn3uyQ6LfT0t5xWw0vDpPGP0lLZ8QrHZnrHd-UJI7dB6EJlblTISuZoOOnTHoBNShGqDCT2oP774mxoVRFUlA4ipN_5klo0f6MJ3SfhL3ESh5X9lzpX1jp1LmrK-SCn9Gr9g9w7h1a0OyY3hHjNn8G-m_M2sd0Rc6waZlMGvOzY8-v5Qlnt-gMfZkbfzoqIjuV3b1cZZmaMmApKesglOGsXugJS2L8v2aSilAixamo7YNufluimjMVg_8bWT-K-0lbP4KyTI4TDRjzSoJSnBxKgCbc55SDXPsyiGLhjKNCnTO6oTItblcHhy9TTuJQCzA9bUYnVkrr8Trz0RuQNnWVvkyQ4E41V351zLz1JEoeEmqWAJu2Gduh5mQZ9iOoA_UmMnxbVkw60EGZ62M-TYSpemqsA_wyDtPTCAU1RQ2acwKtFxq7fCadQOzvBKX4pT5OjjB0lFGcmMPq4PhUzM4Gm2qs6j7y5T4p_HJCyKbmIzR32TxaJL0lAyiS6E9H_T2t61yGwDmZlfvVmuCDf0chrK3BMuun3PBeb6-ipWY-UJ78AFbe5f1NaiCI6pI_cNjBM5BV5j5iAxNIqIZfAz7zb0YHk9gfpyEM40YkME3r9-NM9zKXwh759jgGhmAdM-9aaL5l2CAaABX4QVyyZKTrYTP62dTFbU-STqiA5zZpltGi5KDMSJcWlm_5hPPPECGnvd0e_gs-xI5Nlm2ly_wlUwDGuwynMgWHKZCQ1FK-t0Ag2eN7xTQvcil75AUeS2Eebg1MK-cAhWJhnS9ByM_jMnRrnYLj8oDKLkwRUbQfm-tQQ2WZLkSt4qCSVoh3qq5RFeNOZBFjbnqFacyqsCtNGuk6QlS-kV_8Gc6OcALuXsPmXl-7JXWsVoipO8t7ZzyeJW6ERUhUhXMbTaFeEyZ7wI3Z9ETB9Z5lo38fUQE33bIRsIZBfO-c3m-WK6SRPhF3poWioXYVYzYw8r1PItHzrI3Nv9Kb9sVCkrLtKLZk-oX8yu7r0sApvfgEQPYZKHTF24we4_VI7ZfGBUmpaYeT0vXLZSm5_oW7GFtD4ywYsym-Prrbl--oP8wx7lMh9-lwdxLfDMngzTQ38R4rDiXghJzR1WB9FcxpSp2GvQZq3MQ3fPaBRazmoA-bdzRr7mOfPpkY208pPwJWWGrxubcP7fKprn_o4TBqDnfiGnDMHRTapDKIaIYJWGBJXayR-xPGrilkBbgYeKAvmu-OeLE7MEFAnTVOGjZJf34UPtwKzCiicbA0NxXi-nA6QTV21ZHXOWmHQ9J22KsPnMC1AkBN5uo1z6WsKnoLylh7DPMv6euQlDyIe6LdBnjAt7O6Wu3nNQoA0yUYRbSK7CN7r98tniibHhY-4phW3duFfsY-jiBAl_lp2ZbcBrAdUBsvE3M8LzDgS7gwHIH5JAMGmFhg6j64v3zvM2XqnxqDmQRSVkf7ymfWLXG62sdcRDv4WvpTzzZeDTC_UQQCm49UAM1oqapxXaWcD_ZE1B8V_l-gKVoJWnsqNvF84JqE=w1920-h947)

[Image Link](https://drive.google.com/file/d/12qfZ4ljZ0U1xe7RiBUugt-rXDxwJhaCV/view?usp=sharing)

## Available scripts

In the project directory, you can run:

### `npm run deploy`

To start the deploy of the app.

```
Note: you need to setup the AWS CLi in your local machine.
```

### `npm run deploy:offline`

To start the deploy of the app in you local machine.

### Docker Compose

when you run docker-compose command, it will create the application and run the serverless framework in offline mode.

```
docker-compose up --build -d
```

**Notes:**

- You need to create the database and upload the collections from the folder `src/seeds/**` in order to avoid erros when you use the local endpoints.
- The SQS is not implemented in local, a fast solution is deploy the application and follow the next steps:
  1. Create and copy the sqs urls in the `.env` file.
  2. Comment the enviroment lines in the `serverless.yml` file.
  3. Finally re-run your docker compose command.

## Enviroments

#### QUEUE URLS

_SQS queue this is to use in offline mode, the url is set dynamically when the serverless is deploy_

`WAREHOUSE_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/..../restaurantMicroservices-dev-warehouse.fifo"` :
`KITCHEN_COOK_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/..../restaurantMicroservices-dev-kitchenCook.fifo"` :
`AWS_REGION="us-east-1"`: Set the region of the SQS Client

#### Database URL

`DB_URL="mongodb+srv://danimaxrestaurant:...@cluster0.b8i2dxx.mongodb.net/danimax_restaurant"` : Db string url to connect and storage the data.

#### Buy ingredients

`APP_BUY_INGREDIENTS="https://recruitment.alegra.com/api/farmers-market/buy"` : Endpoint url To buy new ingredients

### Deployment

Install dependencies with:

```
npm install
```

and then deploy with:

```
serverless deploy
```

After running deploy, you should see output similar to:

```bash
> ncc build src/index.ts

ncc: Version 0.36.1
ncc: Compiling file index.js into CJS
ncc: Using typescript@4.7.4 (local user-provided)
 410kB  dist/code-points.mem
2508kB  dist/index.js
2918kB  [5823ms] - ncc 0.36.1

Deploying restaurantMicroservices to stage dev (us-east-1)
Using deployment bucket 'danimaxrestaurantlambda'
Updated deployment bucket public access block
Using deployment bucket 'danimaxrestaurantlambda'
Updated deployment bucket public access block

✔ Service deployed to stack restaurantMicroservices-dev (79s)

endpoints:
  POST - https://sk3aw5.execute-api.us-east-1.amazonaws.com/dev/v1/orders
  POST - https://jsk3aw5.execute-api.us-east-1.amazonaws.com/dev/v1/re_process_order
  GET - https://qk3aw5.execute-api.us-east-1.amazonaws.com/dev/v1/orders
  GET - https://k3aw5.execute-api.us-east-1.amazonaws.com/dev/v1/orders/current
functions:
  kitchenOrders: restaurantMicroservices-dev-kitchenOrders (65 MB)
  kitchenReProcessOrder: restaurantMicroservices-dev-kitchenReProcessOrder (65 MB)
  kitchenListOrders: restaurantMicroservices-dev-kitchenListOrders (65 MB)
  kitchenListCurrentOrders: restaurantMicroservices-dev-kitchenListCurrentOrders (65 MB)
  kitchenCookWorker: restaurantMicroservices-dev-kitchenCookWorker (65 MB)
  warehouseWorker: restaurantMicroservices-dev-warehouseWorker (65 MB)
kitchenCook: https://sqs.us-east-1.amazonaws.com/824500/restaurantMicroservices-dev-kitchenCook
warehouse: https://sqs.us-east-1.amazonaws.com/82548700/restaurantMicroservices-dev-warehouse
```

_Note_: In current form, after deployment, your API is public and can be invoked by anyone. For production deployments, you might want to configure an authorizer. For details on how to do that, refer to [`httpApi` event docs](https://www.serverless.com/framework/docs/providers/aws/events/http-api/).

### Invocation

After successful deployment, you can call the created application via HTTP:

```bash
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/
```

Which should result in the following response (use Postman programs to run the available endpoints):

```
REFER TO POSTMAN Folder
```

### Local development

It is also possible to emulate API Gateway and Lambda locally by using `serverless-offline` plugin.

You can start local emulation with:

```
serverless offline
```
