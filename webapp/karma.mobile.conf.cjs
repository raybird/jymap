module.exports = config => {
  require('./karma.conf.cjs')(config);
  config.set({ browsers: ['ChromeHeadlessMobile'], client: { args: ['mobile'] } });
};
