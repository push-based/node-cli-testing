# node-cli-testing

### A e2e-testing library for node CLI and processes including sandbox generation on the fly
 
[![npm](https://img.shields.io/npm/v/%40push-based%2Fnode-cli-testing.svg)](https://www.npmjs.com/package/%40push-based%2Fnode-cli-testing)


## Motivation

Testing node code is easy as long as you can stick to unit tests (testing input and output of a single function).
When it comes to more complex scenarios it get's pretty hard.
Node processes, file outputs, integration tests, and console output is a hassle and involves many moving gears that are hard to setup an keep stable.

This is what this library tackles. A smooth out of the box experience for testing node CLIs and processes with unit, integration and e2e tests.


## Features

- Testing node process output (`stdout`, `stderr`, `exitCode`)
- Handle `.rc.jons` files
- Simulate keyboard interaction
- Test console output
- Initializing a sandbox environment for each test
- Automatically creating files needed for the test 
- Cleanup after tests
- Helpers to check the generated files and folders of a node process

## Install

You can install the node-cli-testing over `npm` or `yarn` as following:

```text
npm install --save @push-based/node-cli-testing
# or
yarn add @push-based/node-cli-testing
```

## Setup

The `node-cli-testing` lib can be imported as following:

```ts
import { CliProject } from '@push-based/node-cli-testing/cli-project';

let projectSandbox: CliProject;

const cfg: ProjectConfig = {
  root: './',
  bin: 'cli.js'
};

describe('The CLI configuration in default mode', () => {
  beforeEach(async () => {
    projectSandbox = await CliProjectFactory.create(cfg);
  });
  afterEach(async () => {
    projectSandbox = await CliProjectFactory.teardown(cfg);
  });

  it('should work', async () => {
    const { exitCode, stdout, stderr } = await projectSandbox.exec();
  });

});
```

## Basic Usage of the `CliProject` wrapper

### Setup a basic project and tests

The `CliProject` class makes it easy to execute a node file and handle it's in and outputs as well as process arguments.
Let's set up a simple test for a CLI:


```ts
import { CliProject, CliProjectFactory } from '@push-based/node-cli-testing/cli-project';

let projectSandbox: CliProject;

const cfg: ProjectConfig = {
  root: './', // the directory in which the test should take place
  bin: 'cli.js' // the bin file the gets executed as node process
};

describe('The CLI', () => {
  beforeEach(async () => {
    projectSandbox = await CliProjectFactory.create(cfg);
  });
  afterEach(async () => {
    projectSandbox = await CliProjectFactory.teardown(cfg);
  });

  it('should work', async () => {
    const { exitCode, stdout, stderr } = await projectSandbox.exec();
    expect(stdin).toContain('some console output');
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
  });

});
```

### Use setup helper

As is it kind of repetitive to set up `beforeEach` and `afterEach` this library provides a helper. 
This comes in handy when there are many different setups in one describe block. 

The helper consumes a configuration for the project and handles setup and teardown internally.

```ts
import { ProjectConfig, withProject } from '@push-based/node-cli-testing/cli-project';

const cfg: ProjectConfig = {
  root: './',
  bin: 'cli.js' 
};
const cfg2: ProjectConfig = {
  root: './other/',
  bin: 'cli.js' 
};

describe('The CLI', () => {

  it('should work in version 1', withProject(cfg, async (prj) => {
    const { exitCode } = await prj.exec();
    expect(exitCode).toBe(0);
   })
  );
  
  it('should work in version 2', withProject(cfg2, async (prj) => {
    const { exitCode } = await prj.exec();
    expect(exitCode).toBe(0);
   })
  );

});
```

### Use process arguments

Node processes can retrieve arguments over `process.argv` to be configurable.
In the next snippet we pass arguments to a node process:


```typescript
import { CliProject } from '@push-based/node-cli-testing/cli-project';

// Set up here.
// Details see the above example for setup a basic CLI project and test it

describe('The CLI', () => {
  beforeEach(/* same as in above */);
  afterEach(/* same as in above */);

  it('should work with params', async () => {
    // We can pass proces params as simple object ans it transporms it to standard process param style
    const { exitCode, stdout, stderr } = await projectSandbox.exec({verbose: true, count: 42, names: ['Srashti', 'Eliran', 'Mike']});
    
    expect(stdin).toContain('verbose mode is active');
    expect(stdin).toContain('count is 42');
    expect(stdin).toContain('names are Srashti, Eliran, Mike');
    
  });

});
```

The example above takes an object to define the process args like this:
```
{ verbose: false, count: 42, names: ['Srashti', 'Eliran', 'Mike'] }
```

Internally it converts them to the following string and passes it to the defined process:
```
--no-verbose --count=42 --name=Srashti --name=Eliran --name=Mike 
```

### Test keyboard interaction

Often processes running in the console prompt to users and ask for some input.
The lib exports some helper constants to interact simulate keyboard interaction.  

```typescript
import { CliProject, DOWN, SPACE, ENTER, DECLINE_BOOLEAN } from '@push-based/node-cli-testing/cli-project';

describe('The CLI', () => {
  beforeEach(/* ... */);
  afterEach(/* ... */);

  it('should work with params', async () => {
    const { stdout } = await projectSandbox.exec({prompt: true}, [DOWN, SPACE, ENTER, DECLINE_BOOLEAN]);
    
    expect(stdin).toContain('You selected the first option and hit enter');
    expect(stdin).toContain('You declined the option to generate a new file');
  });

});
```

### Test file interaction

```typescript
import { CliProject, CliProjectFactory } from '@push-based/node-cli-testing/cli-project';

let projectSandbox: CliProject;

const cfg: ProjectConfig = {
  root: './',
  bin: 'cli.js',
  create: {
    'fileA.txt': 'Content of file A'
  },
  delete: ['fileA.txt', 'fileB.txt']
};

describe('The CLI in a folder structure', () => {
  beforeEach(async () => {
    projectSandbox = await CliProjectFactory.create(cfg);
    // files from cfg.create are created here
    await projectSandbox.setup();
  });
  afterEach(async () => {
    // files from cfg.delete are deleted here    
    await projectSandbox.teardown();
  });

  it('should copy a file', async () => {
    const { exitCode, stdout, stderr } = await projectSandbox.exec({source: 'fileA.txt', dest: 'fileB.txt'});
    expect(stdout).toContain('file copied');
    
    const fileAContent = fs.readFileSync('fileA.txt', 'utf8').toString();
    const fileBContent = fs.readFileSync('fileB.txt', 'utf8').toString();
    
    expect(fileAContent).toBe(fileBContent);
  });

});
```

The `CliProject` will create all defined files from cfg.create when `CliProject#setup` is called.
The `CliProject` will delete all defined filesNames from cfg.delete when `CliProject#teardown` is called.

### Working with a `.rc.json` file

Often CLIs can be configured over a `.rc.json` file containing some default configuration.
Let's create a test for this scenario:

```typescript
import { CliProject, CliProjectFactory } from '@push-based/node-cli-testing/cli-project';

type MyRcJson = {
  count: number
};

let projectSandbox: CliProject<MyRcJson>;

const cfg: ProjectConfig<MyRcJson> = {
  root: './',
  bin: 'cli.js',
  rcFile: {
    '.rc.json': {
        count: 42
    }
  }
};

describe('The CLI configured over the .rc file', () => {
  beforeEach(async () => {
    projectSandbox = await CliProjectFactory.create(cfg);
    await projectSandbox.setup();
  });
  afterEach(async () => { 
    await projectSandbox.teardown();
  });

  it('should have count of 42', async () => {
    const { stdout } = await projectSandbox.exec();
    expect(stdout).toContain('count is 42');
  });

});
```

The `CliProject` will create the `.rc.json` file when `CliProject#setup` is called.
The `CliProject` will delete the `.rc.json` file when `CliProject#setup` is called.

You can also create multiple rc files at once:

```typescript
import { CliProject, CliProjectFactory } from '@push-based/node-cli-testing/cli-project';

const cfg: ProjectConfig = {
  root: './',
  bin: 'cli.js',
  rcFile: {
    '.rc.json': {
        count: 42
    }
  }
};

```

## Advanced Usage

### Creating custom CLI wrapper

Let's extend the `CliProject` class to add custom logic to handle a command:

```typescript
import { CliProject, CliProjectFactory, TestResult } from '@push-based/node-cli-testing/cli-project';


type MyRcJson = {
  count: number
};

export class MyCliProject extends CliProject<MyRcJson> {
  
  constructor() {
    super();
  }

  $myCommand(processParams?: Partial<{count: number}>, userInput?: string[]): Promise<TestResult> {
    const prcParams: ProcessParams = { _: 'my-command', ...processParams } as ProcessParams;
    return this.exec(prcParams, userInput);
  }

}
```

Next, for better DX let's create a custom factory: 

```
export class MyCliProjectFactory {
  static async create(cfg: ProjectConfig<MyRcJson>): Promise<MyCliProject<MyRcJson>> {
    const prj = new MyCliProject();
    await prj._setup(cfg);
    return prj;
  }
}
```

Now we can use it in our tests like this:

```typescript
let projectSandbox: MyCliProject;

const cfg: ProjectConfig<MyRcJson> = {
  root: './',
  bin: 'cli.js'
};

describe('The CLI configuration in default mode', () => {
  beforeEach(async () => {
    projectSandbox = await MyCliProjectFactory.create(cfg);
  });

  it('should work', async () => {
    const { stdout } = await projectSandbox.$myCommand({count: 42});
    expect(stdout).toContain('count is 42');
  });

});
```

The above test would be equivalent to:
`node cli.js my-command --count=42`



