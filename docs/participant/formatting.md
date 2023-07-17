# Formatting

All of these checks are performed on CI in Github Actions.

## Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

```sh
npm run typecheck
```

## Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

```sh
npm run lint
```

## Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save.

There's also a `npm run format` script you can run to format all files in the project.

```sh
npm run format
```
