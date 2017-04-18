'use strict';

var path = require('path'),
    util = require('util'),
    Q = require('q'),
    pngToIco = require('png-to-ico'),
    fs = require('fs');

var pwabuilderLib = require('pwabuilder-lib');

var CustomError = pwabuilderLib.CustomError,
    PlatformBase = pwabuilderLib.PlatformBase,
    manifestTools = pwabuilderLib.manifestTools,
    fileTools = pwabuilderLib.fileTools;

var constants = require('./constants');

var packager = require('electron-packager');
var npm = require('npm');

function Platform (packageName, platforms) {

  var self = this;
  var manifestFilePath;
  var name;

  PlatformBase.call(this, constants.platform.id, constants.platform.name, packageName, __dirname);

  // save platform list
  self.platforms = platforms;

  // override create function
  self.create = function (w3cManifestInfo, rootDir, options, callback) {
    if (w3cManifestInfo.format !== pwabuilderLib.constants.BASE_MANIFEST_FORMAT) {
      return Q.reject(new CustomError('The \'' + w3cManifestInfo.format + '\' manifest format is not valid for this platform.'));
    }

    var deferred = Q.defer();

    self.info('Generating the ' + constants.platform.name + ' app...');

    // if the platform dir doesn't exist, create it
    var platformDir = path.join(rootDir, constants.platform.id);
    var sourceTemplateDir = path.join(self.baseDir, 'template');
    var targetTemplateDir = path.join(platformDir, 'template');

    self.debug('Creating the ' + constants.platform.name + ' app folder...');
    fileTools.mkdirp(platformDir)
      // download icons to the app's folder
      .then(function () {
        return self.downloadIcons(w3cManifestInfo.content, w3cManifestInfo.content.start_url, platformDir);
      })
      .then(function() {
        //converting png to ico
        var bestMatch = self.findBestIconMatch(w3cManifestInfo.content.icons, constants);

        if (bestMatch) {
          var inputImageFileName = path.join(platformDir, bestMatch.src);
          var outputIconFileName = path.join(platformDir, 'app.ico');
          self.debug('Generating the \'app.ico\' from:' + inputImageFileName);

          if (bestMatch.src.endsWith('.ico')) {
            // just copy the existing ico as app.ico
            fs.writeFileSync(outputIconFileName, fs.readFileSync(inputImageFileName));
          } else {
            pngToIco(inputImageFileName)
              .then(function(buf) {
                fs.writeFileSync(outputIconFileName, buf);
              })
              .catch(console.error);
          }
        }
      })
      //copy the electron app template
      .then(function () {
          return fileTools.copyFolder(sourceTemplateDir, targetTemplateDir)
          .catch(function (err) {
            return Q.reject(new CustomError('Failed to copy the project template to the source folder.', err));
          });
      })
      // copy the documentation
      .then(function () {
        return self.copyDocumentation(platformDir);
      })
      // write generation info (telemetry)
      .then(function () {
        return self.writeGenerationInfo(w3cManifestInfo, platformDir);
      })
      // persist the platform-specific manifest
      .then(function () {
        self.debug('Copying the ' + constants.platform.name + ' manifest to the app folder...');
        manifestFilePath = path.join(platformDir, 'manifest.json');
        return manifestTools.writeToFile(w3cManifestInfo, manifestFilePath);
      })
      .then(function() {
        var packageFilePath = path.join(platformDir, '/template/package.json');

        fs.readFile(packageFilePath, 'utf8', function (err,data) {
          if (err) {
            deferred.reject(err);
            return self.debug(err);
          }
          name = w3cManifestInfo.content.short_name.replace(/ /g,'');
          var result = data.replace(/replace/g, name);

          fs.writeFile(packageFilePath, result, 'utf8', function (err) {
            if (err) {
              deferred.reject(err);
              return self.debug(err);
            }
            self.debug('Generating ' + constants.platform.name + ' package');

            npm.load({
                loaded: false
            }, function (err) {
                if (err) {
                  deferred.reject(err);
                  return self.debug(err);
                }

                // installing dependencies
                var deps = ['electron@^1.6.2','electron-window-state@^3.0.3','color@^0.11.3'];

                npm.commands.install(targetTemplateDir, deps, function (err) {
                  if (err) {
                    deferred.reject(err);
                    return self.debug(err);
                  }
                  packager({
                      name: name,
                      dir: platformDir+'/template',
                      arch: constants.platform.arch,
                      platform: constants.platform.type,
                      out: platformDir+'/out',
                      prune: true,
                      icon: path.join(platformDir, 'app.ico'),
                      overwrite: true
                  }, function done (err) {
                    if (err) {
                      deferred.reject(err);
                      return self.debug(err);
                    }

                    var p = path.join(platformDir, '/out/',
                                        name + '-' + constants.platform.type + '-' +
                                        constants.platform.arch +'/resources/manifest.json');

                    fileTools.copyFile(manifestFilePath, p)
                      .then(function() {
                        deferred.resolve();
                      })
                      .catch(function (err) {
                        deferred.reject(err);
                        return self.debug(err);
                      });
                  });
              });
          });
        });
      });
    })
    .catch(function (err) {
      deferred.reject(err);
      return self.debug(err);
    });

    return deferred.promise.nodeify(callback);
  };

  self.getManifestIcons = function (manifest) {
    return (manifest.icons || []).map(function (icon) { return icon.src; });
  };

  self.getManifestIcon = function (manifest, size) {
    size = size.trim().toLowerCase();
    return (manifest.icons || []).find(function (icon) {
      return icon.sizes.split(/\s+/).find(function (iconSize) {
        var dimensions = iconSize.toLowerCase().split('x');
        return dimensions.length === 2 && dimensions[0] === size.toString() && dimensions[1] === size.toString();
      });
    });
  };

  self.addManifestIcon = function (manifest, fileName, size) {
    if (!manifest.icons) {
      manifest.icons = [];
    }
    size = size.toLowerCase().trim();
    manifest.icons.push({ 'src': fileName, 'sizes': size + 'x' + size, 'default': true });
  };

  self.findBestIconMatch = function (icons, params) {

    // lookup for an ico file first
    let image = icons.find(function(icon) {
      return icon.src.endsWith('.ico');
    });

    // lookup for the best provided png image.
    params.platform.preferredIconSizes.forEach(function(size) {
      if (image === undefined){
        image = icons.find(function(icon) {
          return icon.src.endsWith('.png') && icon.sizes.indexOf(size) !== -1 && !icon.default;
        });
      }
    });

    // fallback to manifoldjs logo, if needed.
    params.platform.preferredIconSizes.forEach(function(size) {
      if (image === undefined){
        image = icons.find(function(icon) {
          return icon.src.endsWith('.png') && icon.sizes.indexOf(size) !== -1 && icon.default;
        });
      }
    });

    return image;
  };
}

util.inherits(Platform, PlatformBase);

module.exports = Platform;