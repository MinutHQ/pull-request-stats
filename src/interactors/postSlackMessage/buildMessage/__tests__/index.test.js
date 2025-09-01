const buildMessage = require('../index');
const buildSubtitle = require('../buildSubtitle');
const buildReviewer = require('../buildReviewer');

const SUBTITLE = 'SUBTITLE';
const REVIEWER_TABLE = 'REVIEWER_TABLE';

jest.mock('../buildSubtitle', () => jest.fn(() => [SUBTITLE]));
jest.mock('../buildReviewer', () => jest.fn(() => REVIEWER_TABLE));

const defaultOptions = {
  reviewers: ['REVIEWER 1'],
  pullRequest: 'PULL REQUEST',
  periodLength: 'PERIOD LENGTH',
  disableLinks: 'DISABLE LINKS',
  displayCharts: 'DISPLAY CHARTS',
};

describe('Interactors | postSlackMessage | .buildMessage', () => {
  beforeEach(() => {
    buildSubtitle.mockClear();
    buildReviewer.mockClear();
  });

  it('returns the expected structure', () => {
    const response = buildMessage({ ...defaultOptions });
    expect(response).toEqual({
      blocks: [
        SUBTITLE,
        REVIEWER_TABLE,
      ],
    });
  });

  it('calls builders with the correct parameters', () => {
    buildMessage({ ...defaultOptions });
    expect(buildSubtitle).toHaveBeenCalledWith({
      t: expect.anything(),
      pullRequest: defaultOptions.pullRequest,
      periodLength: defaultOptions.periodLength,
    });
    expect(buildReviewer).toHaveBeenCalledWith({
      t: expect.anything(),
      reviewers: defaultOptions.reviewers,
      displayCharts: defaultOptions.displayCharts,
    });
  });

  it('calls buildReviewer once with all reviewers', () => {
    const reviewers = ['REVIEWER 1', 'REVIEWER 2', 'REVIEWER 3'];
    buildMessage({ ...defaultOptions, reviewers });
    expect(buildReviewer).toHaveBeenCalledTimes(1);
    expect(buildReviewer).toHaveBeenCalledWith({
      t: expect.anything(),
      reviewers,
      displayCharts: defaultOptions.displayCharts,
    });
  });
});
