const ivm = require('isolated-vm');
const execa = require('execa');

const code = () => `(async () => {
  log('hello')
  await cmd('test') 
  log('world')
})()`;

const logCallback = function (...args) {
  console.log(...args);
};

const cmd = async function (...args) {
  try {
    await execa.command(args.join(' '), {
      detached: false,
      windowsHide: true,
    });
  } catch (err) {
    console.log('expected error');
  }
  return '';
};

(async () => {
  const isolate = new ivm.Isolate({ memoryLimit: 2048 });
  const context = await isolate.createContext();
  const jail = context.global;
  jail.setSync('global', jail.derefInto());
  await context.evalClosure(
    `global.log = function(...args) {
    $0.applyIgnored(undefined, args, { arguments: { copy: true } });
  }`,
    [logCallback],
    { arguments: { reference: true } },
  );

  await context.evalClosure(
    `global.cmd = (...args) => { 
      return $0.applySync(undefined, args, { arguments: { copy: true }, result: { promise: true, copy: true } });
    }`,
    [cmd],
    { arguments: { reference: true } },
  );

  try {
    await context.eval(code(), { reference: true });
  } catch (err) {
    console.log('JS execution - %s', err);
  } finally {
    // commenting out this line prints "world"
    context.release();
  }
})();
