
require('ts-node').register({
    compilerOptions: {
        module: 'commonjs',
        esModuleInterop: true
    }
});
require('./src/utils/testMoon.ts');
