---
title: 'Release com Lerna 🚀'
description: 'Nesse post eu queria compartilhar um pouco sobre como automatizar o processo de
release de pacotes com o Lerna.'
date: '06/15/2024'
draft: false
---

Neste post, quero compartilhar como criar um monorepo com o **Lerna** e
automatizar o processo de **release** dos pacotes.

Vamos cobrir alguns problemas comuns que encontramos ao trabalhar com monorepos
e como resolvê-los.

Espero que no final deste post você consiga criar um monorepo com o **Lerna** 
com uma boa DX e automatizar o processo de **release** dos pacotes.

## Disclaimer

Vamos seguir todo o post utilizando o `pnpm` como gerenciador de pacotes, mas você pode usar o `npm` ou `yarn` sem problemas.

## Começando

Vamos começar criando um projeto com o **Lerna**.

```sh
mkdir my-workspace
cd my-workspace
pnpm dlx lerna init
```

Isso vai criar uma estrutura de pastas parecida com esta:

```
📁 /my-workspace
└── 📄 package.json
└── 📄 lerna.json
└── 📄 pnpm-workspace.yaml
└── 📄 pnpm-lock.yaml
```

## Adicionando pacotes

Vamos adicionar 3 pacotes ao nosso workspace para brincar com o mono-repo.

```sh
pnpm lerna create --es-module --yes @my-workspace/sum
pnpm lerna create --es-module --yes @my-workspace/subtract
pnpm lerna create --es-module --yes @my-workspace/calculator
```

Isso vai criar uma estrutura de pastas parecida com esta:

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

Agora vamos adicionar os pacotes `sum` e `subtract` como dependência no pacote
`calculator`.

```sh
pnpm add @my-workspace/sum --filter @my-workspace/calculator
pnpm add @my-workspace/subtract --filter @my-workspace/calculator
```

__OBS: É importante notar que em um monorepo o controle de dependências deve
sempre ser feito a partir da raiz do workspace pelo seu gerenciador de pacotes.
Consulte a documentação de "workspace" do seu gerenciador de pacotes para mais
informações.__

O Lerna utiliza o **NX** por debaixo dos panos, então é possível utilizar o comando `graph` do NX para visualizar o gráfico de dependências.

```sh
pnpm dlx nx graph
```

Isso vai abrir uma página no seu navegador com o gráfico de dependências. O gráfico deve parecer com isso:

## Fazendo o build dos pacotes 🏗️

Vamos criar um processo de build para os pacotes. Isso vai fazer a gente chegar mais perto do que temos hoje
quando olhamos para um projeto real. Isso tambem vai nos apresentar um problema comum que encontramos em monorepos.

Vamos utilizar o [unbuild](https://github.com/unjs/unbuild) para fazer o build dos pacotes. Então vamos adicionar essa dependência nos nossos pacotes.

```sh
pnpm add -r -D unbuild 
```

E logo em seguida, vamos adicionar um script de `build` no `package.json` de cada pacote.

```sh
pnpm recursive exec -- pnpm pkg set scripts.build="unbuild"
```

O **unbuild** por padrão exige que o nome do arquivo de saída CJS seja `file.cjs` e o ESM seja `file.mjs`. Então vamos atualizar esses campos no `package.json`.

Garanta que os `package.json` de cada pacote tenham esses campos com esses valores:

```json
// packages/sum/package.json
{
  "main": "dist/sum.cjs",
  "module": "dist/sum.mjs"
}
```

Vamos fazer isso em todos os pacotes.

Feito isso, vamos fazer o build dos pacotes para garantir que tudo está funcionando.

```sh
pnpm lerna run build
```

## Implementando os pacotes 💻

Vamos fazer uma implementação bem boba para cada pacote. A idea é ter um pacote
`sum` que vai receber uma lista de números e retornar a soma deles, um pacote
`subtract` que vai receber uma lista de números e retornar a subtração deles e
um pacote `calculator` que vai receber uma operação __(`sum` ou `subtract`)__ 
e uma lista de números e retornar o resultado da operação.

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

## Testando os pacotes 🧪

Com a implementação pronta, vamos adicionar testes para validar se a nossa
implementação realmente funciona.

O Lerna, por padrão, cria o script de teste da seguinte maneira:

```json
{
  "scripts": {
    "test": "node ./__tests__/@my-workspace/subtract.test.js"
  }
}
```

Esse caminho não bate com o caminho do arquivo de teste. Então vamos atualizar o script:

```json
{
  "scripts": {
    "test": "node ./__tests__/subtract.test.js"
  }
}
```

Faça isso para todos os pacotes.

Vamos atualizar os testes para cada pacote para testar a implementação.

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

Vamos rodar os testes para garantir que tudo está funcionando.

```sh
pnpm lerna run test
```

Se você seguiu todos os passos corretamente, os testes **não** vão passar. Isso acontece porque o `@my-workspace/calculator` está olhando para uma versão antiga do `@my-workspace/sum` e `@my-workspace/subtract`.

Você consegue forçar esse erro rodando o comando:

```sh
pnpm lerna exec -- rm -rf dist
```

Isso vai deletar a pasta `dist` de todos os pacotes. E se você rodar os testes novamente, eles vão quebrar.

## Dependências de tarefas 📋

O Lerna não sabe lidar muito bem com esse problema de dependências de tarefas. Por isso, vamos utilizar o **nx** para resolver esse problema. Lembrando que o Lerna já utiliza o **nx** por debaixo dos panos, então não vamos adicionar uma dependência nova ao projeto.

Vamos inicializar o **nx** no workspace.

```sh
pnpm dlx nx init --interactive false
```

Esse comando (além de outras coisas) vai adicionar um arquivo `nx.json` na raiz do workspace com a seguinte configuração:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main"
}
```

Com o **NX** conseguimos configurar as dependências de tarefas. Por exemplo, vamos adicionar a seguinte configuração no `nx.json`:

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

Voc6e pode entender os `targetDefaults` como os `npm scripts` dos pacotes. Então estamos dizendo que, para rodar o script `test` de um pacote, primeiro precisamos rodar o script `build` dos pacotes que ele depende.

Agora, se rodarmos os testes novamente, eles vão passar.

Para esse próximo comando vamos aproveitar e conhecer a CLI do **NX**, que é mais amigável que a do Lerna quando se trata de rodar scripts.

```sh
pnpm nx test @my-workspace/calculator --output-style stream
```

Rodando esse comando conseguimos ver o passo a passo do que está acontecendo:
1. Roda o script `build` do `@my-workspace/sum`
2. Roda o script `build` do `@my-workspace/subtract`
3. Roda o script `test` do `@my-workspace/calculator`

Só com esse conhecimento já conseguimos resolver o problema de dependências de tarefas, mas vamos continuar.

### Versionamento automático 🔄

Para automatizar o versionamento dos pacotes, precisamos primeiro que o workspace siga o [convencional commits](https://www.conventionalcommits.org/en/v1.0.0/). O Lerna vai usar o histórico de commits para gerar o changelog e versionar os pacotes seguindo o [semver](https://semver.org/).

Vamos começar atualizando a chave `version` no `lerna.json`. Aqui vamos dizer para o Lerna que queremos versionar os pacotes de forma independente. Isso significa que cada pacote vai ter sua própria versão.

```json
{
  "version": "independent"
}
```

Também é possível que o monorepo inteiro tenha uma versão única. Para isso, basta trocar o valor de `version` para `0.0.0` (versão inicial).

```json
{
  "version": "0.0.0"
}
```

Agora vamos adicionar uma chave `command.version` com algumas configurações.

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

- `ignoreChanges`: Alterações que não devem ser consideradas para o versionamento.
- `allowBranch`: Branch que o Lerna deve considerar para fazer o versionamento.
- `conventionalCommits`: Habilita o versionamento baseado nos commits.
- `message`: Mensagem do commit de versionamento.

Com tudo isso configurado, vamos criar uma **GitHub Action** para fazer o release.

## Criando uma GitHub Action 🤖

Vamos criar um arquivo `.github/workflows/release.yaml` com o seguinte conteúdo:

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

- `workflow_dispatch`: É um evento que permite rodar a action manualmente. Você pode rodar a action indo na aba `Actions` do seu repositório e clicando no botão `Run workflow`. Fique à vontade para mudar o evento para `push` ou qualquer outro evento que você achar necessário.
- `env.GH_TOKEN`: O Lerna precisa desse token para duas coisas:
  - Enviar o commit de versionamento com as suas git tags para o repositório remoto.
  - Criar o release no GitHub.

  Você consegue ver as permissões necessárias para esse token e como criá-lo na [documentação do Lerna](https://github.com/lerna/lerna/tree/main/libs/commands/version#--create-release-type).
- `env.NPM_TOKEN`: O Lerna precisa desse token para publicar os pacotes no NPM.
- `actions/checkout@main`: Clona o repositório. A opção `fetch-depth: 0` é necessária para que o Lerna consiga pegar as git tags do repositório. Todo versionamento é baseado nas tags.
- `fregante/setup-git-user@v1`: Configura o usuário do git que vai fazer o commit de versionamento e criar o release.
- `lerna version`: Esse comando vai fazer o versionamento dos pacotes e criar a release no GitHub.

## Publicando no NPM 📦

Caso você tenha no seu workspace pacotes que devem ser publicados no NPM, você pode rodar o seguinte comando depois do `lerna version`:

```shell
pnpm lerna publish from-git --yes
```

Esse comando vai publicar os pacotes no NPM. Pacotes com `private: true` no `package.json` não serão publicados.

Se você deseja publicar pacotes privados no NPM, adicione:

```json
{
  "publishConfig": {
    "access": "restricted"
  }
}
```
no `package.json` do pacote.

## Conclusão 🎉

Com tudo isso configurado, você consegue fazer o release dos pacotes de forma automática. O Lerna vai versionar os pacotes baseado nos commits, gerar o changelog e criar o release no GitHub.

Sem contar que vimos como resolver alguns problemas comuns que encontramos ao trabalhar com monorepos.

Bom, este foi um post bem longo. Mas espero que tenha sido útil. Tentei cobrir o máximo de coisas possíveis sobre **monorepos** em um nivel mais inicial que eu acho que são importantes.

O link para o projeto completo está [aqui](https://www.github.com/vitebo), fique à vontade para dar uma olhada e ver como tudo está configurado.

Ainda neste projeto, há muita coisa que podemos melhorar quando pensamos em tooling, como por exemplo:
- Customizar o changelog a nosso gosto (não ter apenas "fix" e "feat")
- Adicionar um lint para garantir que os commits estão seguindo o padrão
- Rodar os testes e lint no CI apenas dos pacotes que foram alterados
- Configurar eslint e typescript no monorepo
- E muito mais...

Vou tentar cobrir esses tópicos em posts futuros.

Espero que tenha gostado do post e até a próxima! 🚀
