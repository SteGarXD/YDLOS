const base = require('@gravity-ui/prettier-config');

/** LF everywhere so eslint (prettier/prettier) matches CI and Unix checkouts on Windows. */
module.exports = {...base, endOfLine: 'lf'};
