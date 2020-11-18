# Strapi application for Dev Apps

## How to development

1. Copy `.env.example` and rename it to `.env`.

```bash
cp .env.example .env
```

2. Write environment variables to `.env`. If you want to use the existing DB, please contact the administrators.

3. Install dependencies.

```bash
yarn
```

4. Start Strapi on your local server.

```bash
yarn develop
```

5. Open the local Strapi on your browser and edit the content types etc. The edited result is output to JSON files managed by git.

6. Apply the formatter and commit.

```bash
yarn lint
git add .
git commit -am 'Your awesome changes'
```

7. All you have to do is PR!
