---

title: 'Release with Lerna 🚀'
description: 'In this post, I want to share how to automate the release process of packages with Lerna.'
date: '06/15/2024'
draft: false

---

In this post, I want to share how to create a monorepo with **Lerna** and automate the **release** process of the packages.

We'll cover some common problems encountered when working with monorepos and how to solve them.

By the end of this post, I hope you can create a monorepo with **Lerna** with a good DX and automate the **release** process of the packages.

## Disclaimer

We'll be using `pnpm` as the package manager throughout the post, but you can use `npm` or `yarn` without any problems.

## Getting Started

Let's start by creating a project with **Lerna**.

```sh
mkdir my-workspace
cd my-workspace
pnpm dlx lerna init
```

This will create a folder structure like this:

```
📁 /my-workspace
└── 📄 package.json
└── 📄 lerna.json
└── 📄 pnpm-workspace.yaml
└── 📄 pnpm-lock.yaml
```

## Adding Packages

Let's add 3 packages to our workspace to play around with the monorepo.

```sh
pnpm lerna create --es-module --yes @my-workspace/sum
pnpm lerna create --es-module --yes @my-workspace/subtract
pnpm lerna create --es-module --yes @my-workspace/calculator
```

This will create a folder structure like this:

```
📁 /my-workspace
└── 📁 packages
|   └── 📁 calculator/
|   |   └── 📁 __tests__/
|   |   |   └── 📄 calculator.test.js
|   |   └── 📁 src/
|   |   |   └── 📄 calculator.js
|   |   └── 📄 package.json
|   |   └── 📄 README.md
|   └── 📁 sum/
|   └── 📁 subtract/
└── 📄 package.json
└── 📄 lerna.json
└── 📄 pnpm-workspace.yaml
└── 📄 pnpm-lock.yaml
```

Now let's add the `sum` and `subtract` packages as dependencies to the `calculator` package.

```sh
pnpm add @my-workspace/sum --filter @my-workspace/calculator
pnpm add @my-workspace/subtract --filter @my-workspace/calculator
```

__Note: In a monorepo, dependency management should always be done from the workspace root by your package manager. Check your package manager's "workspace" documentation for more information.__

Lerna uses **NX** under the hood, so you can use the `graph` command from NX to visualize the dependency graph.

```sh
pnpm dlx nx graph
```

This will open a page in your browser with the dependency graph. The graph should look like this:

## Building the Packages 🏗️

Let's create a build process for the packages. This will get us closer to what we have today when looking at a real project and will also introduce a common problem encountered in monorepos.

We'll use [unbuild](https://github.com/unjs/unbuild) to build the packages. So let's add this dependency to our packages.

```sh
pnpm add -r -D unbuild 
```

Then, let's add a `build` script to the `package.json` of each package.

```sh
pnpm recursive exec -- pnpm pkg set scripts.build="unbuild"
```

The **unbuild** by default requires the CJS output file name to be `file.cjs` and the ESM to be `file.mjs`. So let's update these fields in the `package.json`.

Make sure the `package.json` of each package has these fields with these values:

```json
// packages/sum/package.json
{
  "main": "dist/sum.cjs",
  "module": "dist/sum.mjs"
}
```

Do this for all packages.

Once done, let's build the packages to ensure everything is working.

```sh
pnpm lerna run build
```

## Implementing the Packages 💻

Let's make a simple implementation for each package. The idea is to have a `sum` package that takes a list of numbers and returns their sum, a `subtract` package that takes a list of numbers and returns their subtraction, and a `calculator` package that takes an operation __(`sum` or `subtract`)__ and a list of numbers and returns the result of the operation.

```js
// packages/sum/src/sum.js
export default function sum(...numbers) {
  return numbers.reduce((acc, curr) => acc + curr, 0);
}
```

```js
// packages/subtract/src/subtract.js
export default function subtract(...numbers) {
  const [head, ...tail] = numbers;
  return tail.reduce((acc, curr) => acc - curr, head);
}
```

```js
// packages/calculator/src/calculator.js
import sum from '@my-workspace/sum';
import subtract from '@my-workspace/subtract';

export default function calculator(operation, ...numbers) {
  switch (operation) {
    case 'sum':
      return sum(...numbers);
    case 'subtract':
      return subtract(...numbers);
  }
}
```

## Testing the Packages 🧪

With the implementation ready, let's add tests to validate if our implementation really works.

Lerna, by default, creates the test script as follows:

```json
{
  "scripts": {
    "test": "node ./__tests__/@my-workspace/subtract.test.js"
  }
}
```

This path does not match the path of the test file. So let's update the script:

```json
{
  "scripts": {
    "test": "node ./__tests__/subtract.test.js"
  }
}
```

Do this for all packages.

Let's update the tests for each package to test the implementation.

```js
// packages/sum/__tests__/sum.test.js
import sum from '../src/sum.js';
import { strict as assert } from 'assert';

assert.strictEqual(sum(1, 2), 3);
console.info('sum tests passed');
```

```js
// packages/subtract/__tests__/subtract.test.js
import subtract from '../src/subtract.js';
import { strict as assert } from 'assert';

assert.strictEqual(subtract(5, 4), 1);
console.info('subtract tests passed');
```

```js
// packages/calculator/__tests__/calculator.test.js
import calculator from '../src/calculator.js';
import { strict as assert } from 'assert';

assert.strictEqual(calculator('sum', 1, 2), 3);
assert.strictEqual(calculator('subtract', 5, 3), 2);
console.info('calculator tests passed');
```

Let's run the tests to ensure everything is working.

```sh
pnpm lerna run test
```

If you followed all the steps correctly, the tests will **not** pass. This happens because `@my-workspace/calculator` is looking at an old version of `@my-workspace/sum` and `@my-workspace/subtract`.

You can force this error by running the command:

```sh
pnpm lerna exec -- rm -rf dist
```

This will delete the `dist` folder from all packages. And if you run the tests again, they will fail.

## Task Dependencies 📋

Lerna doesn't handle task dependencies very well. So, we'll use **nx** to solve this problem. Remember that Lerna already uses **nx** under the hood, so we won't add a new dependency to the project.

Let's initialize **nx** in the workspace.

```sh
pnpm dlx nx init --interactive false
```

This command (among other things) will add an `nx.json` file to the root of the workspace with the following configuration:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main"
}
```

With **NX**, we can configure task dependencies. For example, let's add the following configuration to `nx.json`:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "targetDefaults": {
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

You can think of `targetDefaults` as the `npm scripts` of the packages. So, we're saying that to run the `test` script of a package, we first need to run the `build` script of the packages it depends on.

Now, if we run the tests again, they will pass.

For this next command, let's get to know the **NX** CLI, which is more user-friendly than Lerna's when it comes to running scripts.

```sh
pnpm nx test @my-workspace/calculator --output-style stream
```

Running this command, we can see the step-by-step of what is happening:
1. Run the `build` script of `@my-workspace/sum`
2. Run the `build` script of `@my-workspace/subtract`
3. Run the `test` script of `@my-workspace/calculator`

With this knowledge alone, we can solve the task dependency problem, but let's continue.

### Automatic Versioning 🔄

To automate the versioning of the packages, we first need the workspace to follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). Lerna will use the commit history to generate the changelog and version the packages following [semver](https://semver.org/).

Let's start by updating the `version` key in `lerna.json`. Here, we'll tell Lerna that we want to version the packages independently. This means each package will have its own version.

```json
{
  "version": "independent"
}
```

It is also possible for the entire monorepo to have a single version. To do this, just change the `version` value to `0.0.0` (initial version).

```json
{
  "version": "0.0.0"
}
```

Now let's add a `command.version` key with some configurations.

```json
{
  "command": {
    "version": {
      "ignoreChanges": [
        "**/__tests__/**",
        "**/*.md"
      ],
      "allowBranch": "main",
      "conventionalCommits": true,
      "message": "chore(release): publish"
    }
  }
}
```

- `ignoreChanges`: Changes that should not be considered for versioning.
- `allowBranch`: Branch that Lerna should consider for versioning.
- `conventionalCommits`: Enables commit-based versioning.
- `message`: Versioning commit message.

With all this configured, let's create a **GitHub Action** to handle the release.

## Creating a GitHub Action 🤖

Let's create a `.github/workflows/release.yaml` file with the following content:

```yaml
name: Release

on:
  workflow_dispatch:

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest

    env:
      CI: true
      GH_TOKEN: ${{ secrets.GH_TOKEN }}
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

    steps:
      - uses: actions/checkout@main
        with:
          fetch-depth: 0

      - uses: fregante/setup-git-user@v1

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          check-latest: true

      - name: Install dependencies
        run: pnpm install --prefer-offline --frozen-lockfile

      - name: Run release
        run: pnpm lerna version --yes --create-release github
```

- `workflow_dispatch`: An event that allows manually running the action. You can run the action by going to the `Actions` tab of your repository and clicking the `Run workflow` button. Feel free to change the event to `push` or any other event you find necessary.
- `env.GH_TOKEN`: Lerna needs this token for two things:
  - To push the versioning commit with its git tags to the remote repository.
  - To create the release on GitHub.

  You can find the necessary permissions for this token and how to create it in the [Lerna documentation](https://github.com/lerna/lerna/tree/main/libs/commands/version#--create-release-type).
- `env.NPM_TOKEN`: Lerna needs this token to publish the packages to NPM.
- `actions/checkout@main`: Clones the repository. The `fetch-depth: 0` option is necessary for Lerna to fetch the repository's git tags. All versioning is based on tags.
- `fregante/setup-git-user@v1`: Sets up the git user who will make the versioning commit and create the release.
- `lerna version`: This command will version the packages and create the release on GitHub.

## Publishing to NPM 📦

If you have packages in your workspace that need to be published to NPM, you can run the following command after `lerna version`:

```shell
pnpm lerna publish from-git --yes
```

This command will publish the packages to NPM. Packages with `private: true` in their `package.json` will not be published.

If you want to publish private packages to NPM, add:

```json
{
  "publishConfig": {
    "access": "restricted"
  }
}
```
to the package's `package.json`.

## Conclusion 🎉

With all this configured, you can automate the release of the packages. Lerna will version the packages based on commits, generate the changelog, and create the release on GitHub.

We also covered some common problems encountered when working with monorepos.

Well, this was a long post, but I hope it was useful. I tried to cover as many aspects as possible about **monorepos** at an introductory level that I think are important.

The link to the complete project is [here](https://www.github.com/vitebo), feel free to take a look and see how everything is configured.

In this project, there is still much we can improve when thinking about tooling, such as:
- Customizing the changelog to our liking (not just having "fix" and "feat")
- Adding a lint to ensure commits follow the standard
- Running tests and lint in the CI only for the packages that were changed
- Configuring eslint and typescript in the monorepo
- And much more...

I'll try to cover these topics in future posts.

I hope you enjoyed the post and see you next time! 🚀
