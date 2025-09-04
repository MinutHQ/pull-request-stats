const getPulls = require('../getPulls');
const { parsePullRequest } = require('../../parsers');
const { fetchPullRequests } = require('../../fetchers');

jest.mock('../../parsers', () => ({ parsePullRequest: jest.fn() }));
jest.mock('../../fetchers', () => ({ fetchPullRequests: jest.fn() }));

const buildResponse = (items) => {
  const edges = [{ cursor: 'CURSOR', node: { id: 123, author: null } }];

  for (let i = 0; i < items; i += 1) {
    edges.push({ cursor: 'CURSOR', node: { id: i, author: {} } });
  }

  return { search: { edges } };
};

describe('Interactors | .getPulls', () => {
  parsePullRequest.mockImplementation((data) => ({ ...data, reviews: [] }));
  fetchPullRequests.mockImplementation(() => buildResponse(1));

  const octokit = 'OCTOKIT';
  const date = '2021-10-14T06:00:00.000Z';
  const input = {
    octokit,
    org: null,
    repos: ['org/repo1'],
    startDate: new Date(date),
    itemsPerPage: 3,
  };

  beforeEach(jest.clearAllMocks);

  describe('Building the query', () => {
    const testQuery = async ({ params, expectedQuery }) => {
      const results = await getPulls(params);
      expect(results.length).toBe(1);
      expect(parsePullRequest).toBeCalledTimes(1);
      expect(fetchPullRequests).toBeCalledTimes(1);
      expect(fetchPullRequests).toHaveBeenLastCalledWith({
        octokit,
        search: expectedQuery,
        limit: input.itemsPerPage,
      });
    };

    it('queries without date filter', () => {
      const params = { ...input, startDate: undefined };
      const expectedQuery = `type:pr sort:author-date repo:${input.repos[0]}`;
      return testQuery({ params, expectedQuery });
    });

    it('queries for multiple repos when sending multiple', () => {
      const repos = ['org1/repo1', 'org1/repo2', 'org2/repo3'];
      const params = { ...input, repos, startDate: undefined };
      const reposFilter = `repo:${repos[0]} repo:${repos[1]} repo:${repos[2]}`;
      const expectedQuery = `type:pr sort:author-date ${reposFilter}`;
      return testQuery({ params, expectedQuery });
    });

    it('queries for an organization when sending one, ignores repos if passed', () => {
      const org = 'mycoolorganization';
      const params = { ...input, org, startDate: undefined };
      const expectedQuery = `type:pr sort:author-date org:${org}`;
      return testQuery({ params, expectedQuery });
    });
  });

  describe('Pagination', () => {
    it('passes the page limit', async () => {
      const itemsPerPage = 999;
      await getPulls({ ...input, itemsPerPage, startDate: undefined });
      expect(fetchPullRequests).toBeCalledTimes(1);
      expect(fetchPullRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({
          limit: itemsPerPage,
        }),
      );
    });

    it('calls fetcher multiple times when there are more items', async () => {
      const itemsPerPage = 3;

      fetchPullRequests
        .mockReturnValueOnce(buildResponse(itemsPerPage))
        .mockReturnValueOnce(buildResponse(1));

      await getPulls({ ...input, itemsPerPage, startDate: undefined });
      expect(parsePullRequest).toBeCalledTimes(itemsPerPage + 1);
      expect(fetchPullRequests).toBeCalledTimes(2);
      expect(fetchPullRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({
          after: 'CURSOR',
        }),
      );
    });

    it('calls fetcher the expected amount of times when there are null pr author items', async () => {
      const itemsPerPage = 3;

      const nullAuthorResponse = buildResponse(itemsPerPage);
      nullAuthorResponse.search.edges[0].node.author = null;

      fetchPullRequests
        .mockReturnValueOnce(nullAuthorResponse)
        .mockReturnValueOnce(buildResponse(1));

      await getPulls({ ...input, itemsPerPage, startDate: undefined });
      expect(parsePullRequest).toBeCalledTimes(itemsPerPage + 1);
      expect(fetchPullRequests).toBeCalledTimes(2);
      expect(fetchPullRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({
          after: 'CURSOR',
        }),
      );
    });
  });

  describe('Review date filtering', () => {
    it('filters reviews by submission date and removes PRs with no matching reviews', async () => {
      const reviewDate1 = new Date('2021-06-10T10:00:00.000Z');
      const reviewDate2 = new Date('2021-06-15T10:00:00.000Z');
      const startDate = new Date('2021-06-12T00:00:00.000Z');

      const mockPRData = [
        { id: 'pr1', reviews: [
          { submittedAt: reviewDate1 }, // Before startDate - should be filtered out
          { submittedAt: reviewDate2 }  // After startDate - should be kept
        ]},
        { id: 'pr2', reviews: [
          { submittedAt: reviewDate1 }  // Before startDate - PR should be removed
        ]},
        { id: 'pr3', reviews: [
          { submittedAt: reviewDate2 }  // After startDate - should be kept
        ]},
      ];

      let callIndex = 0;
      parsePullRequest.mockImplementation(() => mockPRData[callIndex++] || { id: 'default', reviews: [] });
      fetchPullRequests.mockImplementation(() => ({ 
        search: { 
          edges: [
            { cursor: 'c1', node: { id: 'pr1', author: {} }},
            { cursor: 'c2', node: { id: 'pr2', author: {} }},
            { cursor: 'c3', node: { id: 'pr3', author: {} }},
          ]
        }
      }));

      const results = await getPulls({ ...input, startDate });
      
      // Should return 2 PRs (pr1 and pr3), pr2 should be filtered out
      expect(results.length).toBe(2);
      expect(results[0].id).toBe('pr1');
      expect(results[0].reviews.length).toBe(1); // Only the review after startDate
      expect(results[1].id).toBe('pr3');
      expect(results[1].reviews.length).toBe(1);
    });
  });
});
