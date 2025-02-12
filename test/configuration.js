/**
 * @typedef {import('unified').ParserFunction} ParserFunction
 * @typedef {import('unist').Literal} Literal
 */

import {sep} from 'node:path'
import test from 'tape'
import {engine} from '../index.js'
import {noop} from './util/noop-processor.js'
import {spy} from './util/spy.js'

const fixtures = new URL('fixtures/', import.meta.url)

test('configuration', (t) => {
  t.plan(16)

  t.test('should fail fatally when custom rc files are missing', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        cwd: new URL('one-file/', fixtures),
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot read given file `.foorc`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
      }
    )
  })

  t.test('should fail fatally when custom rc files are empty', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        cwd: new URL('malformed-rc-empty/', fixtures),
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse given file `.foorc`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
      }
    )
  })

  t.test('should fail fatally when custom rc files are invalid', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        streamError: stderr.stream,
        cwd: new URL('malformed-rc-invalid/', fixtures),
        files: ['.'],
        rcPath: '.foorc.js',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 3).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse given file `.foorc.js`',
          'Error: Expected preset, not `false`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
      }
    )
  })

  t.test('should support `.rc.js` scripts (1)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('malformed-rc-script/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `.foorc.js`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should fail')
      }
    )
  })

  t.test('should support `.rc.js` scripts (2)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('rc-script/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should support valid .rc scripts'
        )
      }
    )
  })

  t.test('should support `.rc.js` scripts (3)', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('rc-script/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should use Node’s module caching (coverage)'
        )
      }
    )
  })

  t.test('should support `.rc.mjs` module', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop,
        cwd: new URL('rc-module-mjs/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt'],
        plugins: [
          function () {
            const settings = this.data('settings')
            return () => {
              t.deepEqual(
                settings,
                {foo: 'bar'},
                'should process files w/ settings'
              )
            }
          }
        ]
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should use Node’s module caching (coverage)'
        )
      }
    )
  })

  t.test('should support `.rc.cjs` module', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop,
        cwd: new URL('rc-module-cjs/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt'],
        plugins: [
          function () {
            const settings = this.data('settings')
            return () => {
              t.deepEqual(
                settings,
                {foo: 'bar'},
                'should process files w/ settings'
              )
            }
          }
        ]
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should use Node’s module caching (coverage)'
        )
      }
    )
  })

  t.test('should support `.rc.yaml` config files', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('malformed-rc-yaml/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `.foorc.yaml`'
        ].join('\n')

        t.deepEqual(
          [error, code, actual],
          [null, 1, expected],
          'should fail fatally when custom .rc files are malformed'
        )
      }
    )
  })

  t.test('should support custom rc files', (t) => {
    const stderr = spy()

    t.plan(5)

    engine(
      {
        processor: noop,
        cwd: new URL('rc-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcPath: '.foorc',
        extensions: ['txt'],
        plugins: [
          function () {
            const settings = this.data('settings')
            return () => {
              t.deepEqual(
                settings,
                {foo: 'bar'},
                'should process files w/ settings'
              )
            }
          }
        ]
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'four.txt: no issues found',
          'nested' + sep + 'three.txt: no issues found',
          'one.txt: no issues found',
          'two.txt: no issues found',
          ''
        ].join('\n')

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test('should support searching package files', (t) => {
    const cwd = new URL('malformed-package-file/', fixtures)
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd,
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 2).join('\n')

        const expected = [
          'one.txt',
          '  1:1  error  Error: Cannot parse file `package.json`'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
      }
    )
  })

  t.test('should support custom rc files', (t) => {
    const stderr = spy()

    t.plan(5)

    engine(
      {
        processor: noop,
        cwd: new URL('rc-file/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        rcName: '.foorc',
        extensions: ['txt'],
        plugins: [
          function () {
            const settings = this.data('settings')
            return () => {
              t.deepEqual(
                settings,
                {foo: 'bar'},
                'should process files w/ settings'
              )
            }
          }
        ]
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'four.txt: no issues found',
          'nested' + sep + 'three.txt: no issues found',
          'one.txt: no issues found',
          'two.txt: no issues found',
          ''
        ].join('\n')

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test('should support no config files', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('simple-structure/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        const expected = [
          'nested' + sep + 'three.txt: no issues found',
          'nested' + sep + 'two.txt: no issues found',
          'one.txt: no issues found',
          ''
        ].join('\n')

        t.deepEqual(
          [error, code, stderr()],
          [null, 0, expected],
          'should report'
        )
      }
    )
  })

  t.test('should not search if `detectConfig` is `false`', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop,
        cwd: new URL('malformed-rc-script/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        extensions: ['txt'],
        detectConfig: false,
        rcName: '.foorc'
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should not search for config if `detectConfig` is set to `false`'
        )
      }
    )
  })

  t.test('should cascade `settings`', (t) => {
    const stderr = spy()

    t.plan(2)

    engine(
      {
        processor: noop().use(function () {
          t.deepEqual(this.data('settings'), {alpha: true}, 'should configure')

          Object.assign(this, {
            /**
             * @type {ParserFunction}
             * @returns {Literal}
             */
            Parser(doc) {
              return {type: 'text', value: doc}
            }
          })
        }),
        cwd: new URL('config-settings/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        rcName: '.foorc',
        extensions: ['txt']
      },
      (error, code) => {
        t.deepEqual(
          [error, code, stderr()],
          [null, 0, 'one.txt: no issues found\n'],
          'should report'
        )
      }
    )
  })

  t.test('should ignore unconfigured `packages.json`', (t) => {
    const stderr = spy()

    t.plan(1)

    engine(
      {
        processor: noop(),
        cwd: new URL('config-monorepo-package/', fixtures),
        streamError: stderr.stream,
        files: ['.'],
        packageField: 'fooConfig',
        extensions: ['txt']
      },
      (error, code) => {
        const actual = stderr().split('\n').slice(0, 4).join('\n')
        const expected = [
          'packages' + sep + 'deep' + sep + 'one.txt',
          '  1:1  error  Error: Cannot parse file `package.json`',
          'Cannot import `plugin.js`',
          'Error: Boom!'
        ].join('\n')

        t.deepEqual([error, code, actual], [null, 1, expected], 'should report')
      }
    )
  })
})
