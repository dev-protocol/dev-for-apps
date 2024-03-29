# Strapi application for Dev Apps

## How to development

### with Docker Compose

1. run strapi and postgresql with Docker Compose

```bash
docker compose -f docker-compose.local.yml up -d
```

### run strapi standalone

1. Copy `.env.example` and rename it to `.env`.

```bash
cp .env.example .env
```

2. Write environment variables to `.env`. If you want to use the existing DB, please contact the administrators.

example for local env:

```
# .env
NODE_ENV=development
DATABASE_HOST='localhost'
DATABASE_PORT=5432
DATABASE_NAME='strapi'
DATABASE_USERNAME='strapi'
DATABASE_PASSWORD='strapi'
```

3. Install dependencies.

```bash
yarn
```

4. Start Strapi on your local server.

```bash
yarn develop
```

### change schema and more change settings

1. Open the local Strapi on your browser and edit the content types etc. The edited result is output to JSON files managed by git.

2. Apply the formatter and commit.

```bash
yarn lint
git add .
git commit -am 'Your awesome changes'
```

3. All you have to do is PR!
