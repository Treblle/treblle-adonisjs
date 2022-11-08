# treblle-adonisjs

The offical Treblle package for AdonisJS

## Installation

```sh
npm i treblle-adonisjs --save
```

After installation run the configuration:

```sh
node ace configure treblle-adonisjs
```

This will create the `treblle-adonisjs` config in `config/treblle.ts`.

`treblle-adonisjs` relies on the following environment variables:

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

## Setup

`treblle-adonisjs` exposes a middleware that you can add globally in your `start/kernel.ts` global middleware array like so:

```ts
Server.middleware.register([() => import('treblle-adonisjs')])
```

And that's it, Treblle will now monitor your API.

## Named middleware

Assuming you have an AdonisJS app that's not completely an API i.e a fullstack app that exposes API endpoints in say `api/v1`, you can use a named middleware so you can apply Treblle's middleware to the routes you want to monitor and observe. For example we can do:

```ts
// start/kernel.ts
Server.middleware.registerNamed({
  treblle: () => import('treblle-adonisjs')
})
```

Then in `routes.ts` you can have:

```ts
Route.group(() => {
  Route.post('/posts', async ({ request }) => {
    return { success: true, message: 'Post created successfully', data: request.body() }
  })
  Route.post('/users/login', async ({ request }) => {
    return { success: true, message: 'Log in successful', data: request.body() }
  })
  Route.post('/licenses', async ({ request }) => {
    return { success: true, message: 'License created successfully', data: request.body() }
  })
  Route.post('/error', async ({ response }) => {
    return response.status(500).send({ success: false, message: 'Something went wrong' })
  })
})
  .prefix('/api/v1')
  .middleware('treblle')
```
