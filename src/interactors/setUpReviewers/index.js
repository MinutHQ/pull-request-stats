const buildReviewTimeLink = require('./buildReviewTimeLink');
const getContributions = require('./getContributions');
const calculateTotals = require('./calculateTotals');
const sortByStats = require('./sortByStats');

const applyLimit = (data, limit) => {
  if (limit && limit > 0 && Number.isInteger(limit)) {
    return data.slice(0, limit);
  }
  return data;
};

const getUrls = ({ reviewer, periodLength }) => ({
  timeToReview: buildReviewTimeLink(reviewer, periodLength),
});

module.exports = ({
  sortBy,
  reviewers,
  periodLength,
  limit = null,
}) => {
  const allStats = reviewers.map((r) => r.stats);
  const totals = calculateTotals(allStats);

  const sortedReviewers = sortByStats(reviewers, sortBy);
  const limitedReviewers = applyLimit(sortedReviewers, limit);

  const result = limitedReviewers.map((reviewer) => {
    const contributions = getContributions(reviewer, totals);
    const urls = getUrls({ reviewer, periodLength });
    return {
      ...reviewer,
      contributions,
      urls,
    };
  });

  return result;
};
