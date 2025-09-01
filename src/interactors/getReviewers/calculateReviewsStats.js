const { sum, median, divide } = require('../../utils');

const getProperty = (list, prop) => list.map((el) => el[prop]);

module.exports = (reviews) => {
  // Handle empty reviews array
  if (!reviews || reviews.length === 0) {
    return {
      totalReviews: 0,
      totalComments: 0,
      commentsPerReview: 0,
      timeToReview: Infinity,
    };
  }

  const pullRequestIds = getProperty(reviews, 'pullRequestId');
  const totalReviews = new Set(pullRequestIds).size;
  const totalComments = sum(getProperty(reviews, 'commentsCount'));

  return {
    totalReviews,
    totalComments,
    commentsPerReview: divide(totalComments, totalReviews),
    timeToReview: median(getProperty(reviews, 'timeToReview')),
  };
};
