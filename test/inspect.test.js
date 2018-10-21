var test = require('tap').test;
var path = require('path');

var plugin = require('../lib');
var subProcess = require('../lib/sub-process');

test('happy inspect', function (t) {
  chdirToPkg(['path', 'to', 'pkg']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'Gopkg.lock');
        t.end();
      });

      t.test('root pkg', function (t) {
        t.match(pkg, {
          name: 'path/to/pkg',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', function (t) {
        var deps = pkg.dependencies;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('pkg relative path', function (t) {
  chdirToPkg(['path']);

  return plugin.inspect('.', 'to/pkg/Gopkg.lock')
    .then(function (result) {
      // var plugin = result.plugin;
      var pkg = result.package;

      t.test('dependencies', function (t) {
        var deps = pkg.dependencies;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('pkg with local import', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-local-import']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.end();
      });

      t.test('dependencies', function (t) {
        t.match(pkg, {
          version: '',
          dependencies: {
            'gitpub.com/meal/dinner': {
              version: 'v0.0.7',
              dependencies: {
                'gitpub.com/food/salad': {
                  version: 'v1.3.7',
                  dependencies: {
                    'gitpub.com/nature/vegetables/tomato': {
                      version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                    },
                  },
                },
              },
            },
          },
        }, 'local subpkg merged with root');

        t.end();
      });
    });
});

test('pkg with internal subpkg', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-internal-subpkg']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.end();
      });

      t.test('dependencies', function (t) {
        t.match(pkg, {
          version: '',
          dependencies: {
            'gitpub.com/meal/dinner': {
              version: 'v0.0.7',
              dependencies: {
                'gitpub.com/food/salad': {
                  version: 'v1.3.7',
                  dependencies: {
                    'gitpub.com/nature/vegetables/tomato': {
                      version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                    },
                  },
                },
              },
            },
          },
        }, 'internal subpkgps are not in tree, but their children are');

        t.end();
      });
    });
});

test('multi-root project', function (t) {
  chdirToPkg(['path', 'to', 'multiroot-pkg']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'Gopkg.lock');
        t.end();
      });

      t.test('root pkg', function (t) {
        t.match(pkg, {
          name: 'path/to/multiroot-pkg',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', function (t) {
        var deps = pkg.dependencies;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });

    }).then(function () {
      var goResolveTool =
        path.join(__dirname, '..', 'gosrc', 'resolve-deps.go');
      return subProcess.execute('go', [
        'run',
        goResolveTool,
        '-list',
        '-ignoredPkgs=path/to/multiroot-pkg/shouldskip/ignored_pkg,' +
          'path/to/multiroot-pkg/shouldskip/ignored_pkg_wildcard/*',
      ]).then(function (result) {
        t.test('resolved deps', function (t) {
          var list = JSON.parse(result);
          t.same(list.sort(), [
            '.',
            'gitpub.com/food/salad',
            'gitpub.com/meal/dinner',
            'gitpub.com/nature/vegetables/cucamba',
            'gitpub.com/nature/vegetables/tomato',
            'path/to/multiroot-pkg',
            'path/to/multiroot-pkg/cmd/tool',
            'path/to/multiroot-pkg/lib',
            'path/to/multiroot-pkg/should-ignore-deps/only_test_files',
          ].sort(), 'list of resolved deps as expected');
          t.end();
        });
      });
    });
});

test('multi-root project without code at root', function (t) {
  chdirToPkg(['path', 'to', 'multiroot-pkg-without-root']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'Gopkg.lock');
        t.end();
      });

      t.test('root pkg', function (t) {
        t.match(pkg, {
          name: 'path/to/multiroot-pkg-without-root',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', function (t) {
        var deps = pkg.dependencies;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.match(deps['gitpub.com/meal/dinner/desert'], {
          version: 'v0.0.7',
          dependencies: {},
        }, 'dinner/desert is a direct dependency');

        t.end();
      });

    }).then(function () {
      var goResolveTool =
        path.join(__dirname, '..', 'gosrc', 'resolve-deps.go');
      return subProcess.execute('go', [
        'run',
        goResolveTool,
        '-list',
      ]).then(function (result) {
        t.test('resolved deps', function (t) {
          var list = JSON.parse(result);
          t.same(list.sort(), [
            '.',
            'gitpub.com/food/salad',
            'gitpub.com/meal/dinner',
            'gitpub.com/meal/dinner/desert',
            'gitpub.com/nature/vegetables/cucamba',
            'gitpub.com/nature/vegetables/tomato',
            'path/to/multiroot-pkg-without-root/cmd/tool',
            'path/to/multiroot-pkg-without-root/cmd/util',
            'path/to/multiroot-pkg-without-root/lib',
          ].sort(), 'list of resolved deps as expected');
          t.end();
        });
      });
    });
});

test('no Go code', function (t) {
  chdirToPkg(['path', 'to', 'empty']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'Gopkg.lock');
        t.end();
      });

      t.test('root pkg', function (t) {
        t.same(pkg, {
          name: 'path/to/empty',
          dependencies: {},
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });
    }
    );
});

test('with external ignores', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-ignores']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'Gopkg.lock');
        t.end();
      });

      t.test('root pkg', function (t) {
        t.match(pkg, {
          name: 'path/to/pkg-with-ignores',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', function (t) {
        var deps = pkg.dependencies;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'depends on tomato and cucamba, even though vegetables are ignored');


        t.type(
          deps['gitpub.com/nature/vegetables'], 'undefined',
          'vegetables pkg is ignored');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('with external ignores (govendor)', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-ignores-govendor']);

  return plugin.inspect('.', 'vendor/vendor.json')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'vendor/vendor.json');
        t.end();
      });

      t.test('root pkg', function (t) {
        t.match(pkg, {
          name: 'path/to/pkg-with-ignores-govendor',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', function (t) {
        var deps = pkg.dependencies;
        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
        }, 'salad is a dep');

        var saladDeps = deps['gitpub.com/food/salad'].dependencies;
        t.type(
          deps['gitpub.com/nature/vegetables'], 'undefined',
          'vegetables pkg is ignored');
        t.type(
          saladDeps['gitpub.com/nature/vegetables/tomato'], 'undefined',
          'tomato is ignored');
        t.type(
          saladDeps['gitpub.com/nature/vegetables/cucamba'], 'undefined',
          'tomato is ignored');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});


test('missing vendor/ folder', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-missing-vendor-folder']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function (error) {
      t.equal(
        error.message,
        'Unresolved packages:\n' +
        ' -  gitpub.com/food/salad\n' +
        ' -  gitpub.com/meal/dinner\n' +
        '\nUnresolved imports found, please run `dep ensure`');
    });
});

test('missing some packages in vendor/ folder (dep)', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-partial-vendor-folder']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function (error) {
      t.equal(
        error.message,
        'Unresolved packages:\n' +
        ' -  gitpub.com/nature/vegetables/cucamba\n' +
        ' -  gitpub.com/nature/vegetables/tomato\n' +
        '\nUnresolved imports found, please run `dep ensure`');
    });
});

test('missing some packages in vendor/ folder (govendor)', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-partial-vendor-folder']);

  return plugin.inspect('.', 'vendor/vendor.json')
    .then(function () {
      t.fail('should have failed');
    }).catch(function (error) {
      t.equal(
        error.message,
        'Unresolved packages:\n' +
        ' -  gitpub.com/nature/vegetables/cucamba\n' +
        ' -  gitpub.com/nature/vegetables/tomato\n' +
        '\nUnresolved imports found, please run `govendor sync`');
    });
});

test('cyclic import', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-cycle']);

  return plugin.inspect('.', 'vendor/vendor.json')
    .then(function () {
      t.fail('should have failed');
    }).catch(function (error) {
      t.match(error.message, 'import cycle');
      t.pass();
    });
});

test('corrupt Gopkg.lock', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-corrupt-gopkg-lock']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

test('corrupt Gopkg.toml', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-corrupt-gopkg-toml']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

test('missing Gopkg.toml', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-missing-gopkg-toml']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

test('GOPATH not defined', function (t) {
  chdirToPkg(['path', 'to', 'pkg']);
  delete process.env['GOPATH'];

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

test('pkg without external deps', function (t) {
  chdirToPkg(['path', 'to', 'pkg-without-deps']);

  return plugin.inspect('.', 'Gopkg.lock')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'Gopkg.lock');
        t.end();
      });

      t.test('pkg', function (t) {
        t.same(pkg, {
          name: 'path/to/pkg-without-deps',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
          dependencies: {},
        });
        t.end();
      });
    });
});

test('happy inspect govendor', function (t) {
  chdirToPkg(['path', 'to', 'pkg']);

  return plugin.inspect('.', 'vendor/vendor.json')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'vendor/vendor.json');
        t.end();
      });

      t.test('root pkg', function (t) {
        t.match(pkg, {
          name: 'path/to/pkg',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', function (t) {
        var deps = pkg.dependencies;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('inspect govendor with alternate case', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-alternate-govendor']);

  return plugin.inspect('.', 'vendor/vendor.json')
    .then(function (result) {
      var plugin = result.plugin;
      var pkg = result.package;

      t.test('plugin', function (t) {
        t.ok(plugin, 'plugin');
        t.equal(plugin.name, 'snyk-go-plugin', 'name');
        t.match(plugin.runtime, /^go\d+/, 'engine');
        t.equal(plugin.targetFile, 'vendor/vendor.json');
        t.end();
      });

      t.test('root pkg', function (t) {
        t.match(pkg, {
          name: 'path/to/pkg-with-alternate-govendor',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
          dependencies: {
            'gitpub.com/drink/juice': {
              version: '#23b2ba882803c3f509a94d5e79f61924126100cf',
            },
          },
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', function (t) {
        var deps = pkg.dependencies;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('corrupt vendor.json', function (t) {
  chdirToPkg(['path', 'to', 'pkg-with-corrupt-govendor-json']);

  return plugin.inspect('.', 'vendor/vendor.json')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

function chdirToPkg(pkgPathArray) {
  process.env['GOPATH'] = path.resolve(__dirname, 'fixtures', 'gopath');
  process.chdir(
    // use apply() instead of the spread `...` operator to support node v4
    path.resolve.apply(
      null,
      [__dirname, 'fixtures', 'gopath', 'src'].concat(pkgPathArray)
    )
  );
}
