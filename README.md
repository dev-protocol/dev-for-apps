# Strapi application for Stakes.social

## Quick Start

need to set up postgresql beforehand,
either run it in docker or modify `config/database.js` file to fit your environment.

```
$ docker build -t strapi-for-ss:latest .
$ docker run -p 1337:1337 -it strapi-for-ss yarn start
```

access to http://localhost:1337
