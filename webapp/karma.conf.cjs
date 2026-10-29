module.exports = config => config.set({
  frameworks: ['jasmine', '@angular-devkit/build-angular'],
  plugins: [
    require('karma-jasmine'),
    require('karma-chrome-launcher'),
    require('@angular-devkit/build-angular/plugins/karma')
  ],
  customLaunchers: {
    ChromeHeadlessDesktop: {
      base: 'ChromeHeadless',
      flags: ['--window-size=1440,1000', '--force-device-scale-factor=1']
    },
    ChromeHeadlessMobile: {
      base: 'ChromeHeadless',
      flags: ['--window-size=390,844', '--force-device-scale-factor=1']
    }
  },
  browsers: ['ChromeHeadlessDesktop'],
  client: { args: ['desktop'] },
  reporters: ['progress'],
  singleRun: true
});
