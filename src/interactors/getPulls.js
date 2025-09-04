const { fetchPullRequests } = require('../fetchers');
const { parsePullRequest } = require('../parsers');
const core = require('@actions/core');

const filterNullAuthor = ({ node }) => !!node.author;

const ownerFilter = ({ org, repos }) => {
  if (org) return `org:${org}`;
  return (repos || []).map((r) => `repo:${r}`).join(' ');
};

const buildQuery = ({ org, repos }) => {
  return `type:pr sort:created-desc ${ownerFilter({ org, repos })}`;
};

// eslint-disable-next-line arrow-body-style
const filterPullsByTitle = ({ pulls, excludeTitleRegex }) => {
  return pulls.filter((pull) => !pull.title.match(excludeTitleRegex));
};

const filterReviewsByDate = ({ pulls, startDate }) => {
  const startDateObj = new Date(startDate);
  core.info(`Filtering reviews with startDate: ${startDateObj.toISOString()}`);
  
  return pulls
    .map((pull) => {
      const originalReviewCount = (pull.reviews || []).length;
      const filteredReviews = (pull.reviews || []).filter((review) => {
        const reviewDate = new Date(review.submittedAt);
        const isValid = reviewDate >= startDateObj;
        if (!isValid && originalReviewCount > 0) {
          core.info(`Filtered out review from ${reviewDate.toISOString()} (before ${startDateObj.toISOString()})`);
        }
        return isValid;
      });
      
      if (originalReviewCount > 0 && filteredReviews.length === 0) {
        core.info(`PR "${pull.title}" had ${originalReviewCount} reviews but none after ${startDateObj.toISOString()}`);
      }
      
      return {
        ...pull,
        reviews: filteredReviews,
      };
    })
    .filter((pull) => pull.reviews.length > 0);
};

const getPullRequests = async (params) => {
  const { limit, excludeTitleRegex, startDate } = params;
  const data = await fetchPullRequests(params);
  const edges = data.search.edges || [];
  core.info(`Fetched ${edges.length} PR edges from API`);
  
  let results = edges
    .filter(filterNullAuthor)
    .map(parsePullRequest);
  core.info(`After filtering null authors and parsing: ${results.length} PRs`);

  if (excludeTitleRegex) {
    const beforeTitleFilter = results.length;
    results = filterPullsByTitle({ pulls: results, excludeTitleRegex });
    core.info(`After title filtering (${excludeTitleRegex}): ${results.length} PRs (removed ${beforeTitleFilter - results.length})`);
  }

  if (startDate) {
    const beforeDateFilter = results.length;
    const totalReviews = results.reduce((sum, pr) => sum + (pr.reviews || []).length, 0);
    core.info(`Before date filtering: ${beforeDateFilter} PRs with ${totalReviews} total reviews`);
    
    results = filterReviewsByDate({ pulls: results, startDate });
    const afterTotalReviews = results.reduce((sum, pr) => sum + (pr.reviews || []).length, 0);
    core.info(`After date filtering (startDate: ${startDate}): ${results.length} PRs with ${afterTotalReviews} reviews (removed ${beforeDateFilter - results.length} PRs)`);
  }

  if (edges.length < limit) return results;

  const last = results[results.length - 1];
  if (!last) return results;
  
  return results.concat(await getPullRequests({ ...params, after: last.cursor }));
};

module.exports = ({
  octokit,
  org,
  repos,
  excludeTitleRegex,
  startDate,
  itemsPerPage = 100,
}) => {
  const search = buildQuery({ org, repos });
  core.info(`search: ${search}`);
  return getPullRequests({
    octokit, search, limit: itemsPerPage, excludeTitleRegex, startDate,
  });
};
