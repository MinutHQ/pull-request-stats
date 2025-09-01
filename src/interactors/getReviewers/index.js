const calculateReviewsStats = require('./calculateReviewsStats');
const filterReviewer = require('./filterReviewer');
const parseExclude = require('./parseExclude');
const groupReviews = require('./groupReviews');

const parseArray = (value) => (value ? value.split(',').map((item) => item.trim()) : []);

const createDefaultAuthor = (login) => ({
  id: `required-${login}`,
  url: `https://github.com/${login}`,
  login,
  avatarUrl: `https://github.com/${login}.png`,
});

const createDefaultStats = () => ({
  totalReviews: 0,
  totalComments: 0,
  commentsPerReview: 0,
  timeToReview: Infinity,
});

module.exports = (pulls, { excludeStr, requiredAuthors } = {}) => {
  const exclude = parseExclude(excludeStr);
  const requiredAuthorsList = parseArray(requiredAuthors);

  const reviewers = groupReviews(pulls)
    .filter(({ author }) => filterReviewer(exclude, author.login))
    .map(({ author, reviews }) => {
      const stats = calculateReviewsStats(reviews);
      return { author, reviews, stats };
    });

  // Add required authors that are not already in the reviewers list
  const existingLogins = new Set(reviewers.map((r) => r.author.login));
  const missingRequiredAuthors = requiredAuthorsList.filter((login) => !existingLogins.has(login));

  const requiredReviewers = missingRequiredAuthors.map((login) => {
    const defaultAuthor = createDefaultAuthor(login);
    const defaultStats = createDefaultStats();
    return {
      author: defaultAuthor,
      reviews: [],
      stats: defaultStats,
    };
  });

  const result = [...reviewers, ...requiredReviewers];
  return result;
};
