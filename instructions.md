The `treblle-adonisjs` SDK has been configured successfully. The treblle configuration stored inside `config/treblle.ts` file relies on the following environment variables:

- `TREBLLE_API_KEY`
- `TREBLLE_PROJECT_ID`

So make sure you touch your `.env` file to have those environment variables(You can find the values in your Treblle dashboard)

Since `treblle-adonisjs` depends on the above environment variables, we recommend validating them.

Open the `env.ts` file and paste the following code inside the `Env.rules` object.

```ts
TREBLLE_API_KEY: Env.schema.string(),
TREBLLE_PROJECT_ID: Env.schema.string(),
```

- Here we expect both `TREBLLE_API_KEY` and `TREBLLE_PROJECT_ID` environment variables to be always present
- And both should be valid strings
