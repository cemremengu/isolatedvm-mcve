```js
  try {
    await context.eval(code(), { reference: true });
  } catch (err) {
    console.log('JS execution - %s', err);
  } finally {
    // commenting out this line prints "world" (as expected)
    context.release();
  }
 ```
 