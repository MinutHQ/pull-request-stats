const JSURL = require('jsurl');

const URL = 'https://app.flowwer.dev/charts/review-time/';
const MAX_URI_LENGTH = 1024;
const CHARS_PER_REVIEW = 16;

const toSeconds = (ms) => {
  if (ms === Infinity || ms === -Infinity) {
    return Infinity;
  }
  return Math.round(ms / 1000);
};

const compressInt = (int) => {
  if (int === Infinity || int === -Infinity) {
    return 'inf';
  }
  return int.toString(36);
};

const compressDate = (date) => compressInt(Math.round(date.getTime() / 1000));

const parseReview = ({ submittedAt, timeToReview }) => ({
  d: compressDate(submittedAt),
  t: timeToReview === Infinity ? 'inf' : compressInt(toSeconds(timeToReview)),
});

const buildUri = ({ author, period, reviews }) => {
  // Filter out any reviews with Infinity timeToReview to prevent JSURL issues
  const validReviews = reviews.filter((review) => review.t !== 'inf');

  const data = JSURL.stringify({
    u: {
      i: `${author.id}`,
      n: author.login,
    },
    p: period,
    r: validReviews,
  });

  const uri = `${URL}${data}`;
  const exceededLength = uri.length - MAX_URI_LENGTH;
  if (exceededLength <= 0) return uri;

  // Remove at least one, but trying to guess exactly how many to remove.
  const reviewsToRemove = Math.max(1, Math.ceil(exceededLength / CHARS_PER_REVIEW));
  return buildUri({ author, period, reviews: reviews.slice(reviewsToRemove) });
};

module.exports = (reviewer, period) => {
  const { author, reviews } = reviewer || {};
  const parsedReviews = (reviews || [])
    .map((r) => ({ ...r, submittedAt: new Date(r.submittedAt) }))
    .sort((a, b) => a.submittedAt - b.submittedAt)
    .map(parseReview);

  return buildUri({
    author,
    period,
    reviews: parsedReviews,
  });
};
