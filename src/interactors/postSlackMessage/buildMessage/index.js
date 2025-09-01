const { t } = require('../../../i18n');
const buildSubtitle = require('./buildSubtitle');
const buildReviewer = require('./buildReviewer');

module.exports = ({
  org,
  repos,
  reviewers,
  pullRequest,
  periodLength,
  displayCharts,
}) => ({
  blocks: [
    ...buildSubtitle({
      t,
      org,
      repos,
      pullRequest,
      periodLength,
    }),

    buildReviewer({
      t,
      reviewers,
      displayCharts,
    }),
  ],
});
