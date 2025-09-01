const { t } = require('../../../../i18n');
const buildReviewer = require('../buildReviewer');
const reviewers = require('../../../__tests__/mocks/populatedReviewers.json');

const [firstReviewer] = reviewers;
const defaultParams = {
  t,
  reviewers: [firstReviewer],
  displayCharts: false,
};

const EXPECTED_TABLE = {
  type: 'table',
  column_settings: [
    {
      is_wrapped: true,
    },
    {
      align: 'right',
    },
    {
      align: 'right',
    },
    {
      align: 'right',
    },
  ],
  rows: [
    [
      {
        type: 'raw_text',
        text: 'Reviewer',
      },
      {
        type: 'raw_text',
        text: t('table.columns.totalReviews'),
      },
      {
        type: 'raw_text',
        text: t('table.columns.totalComments'),
      },
      {
        type: 'raw_text',
        text: t('table.columns.timeToReview'),
      },
    ],
    [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'emoji',
                name: 'link',
              },
              {
                text: ' user1',
                type: 'text',
              },
            ],
          },
        ],
      },
      {
        type: 'raw_text',
        text: '4',
      },
      {
        type: 'raw_text',
        text: '1',
      },
      {
        type: 'raw_text',
        text: '34m',
      },
    ],
  ],
};

describe('Interactors | postSlackMessage | .buildReviewer', () => {
  describe('simplest case', () => {
    it('builds a table with reviewers data', () => {
      const response = buildReviewer({ ...defaultParams });
      expect(response).toEqual(EXPECTED_TABLE);
    });
  });

  describe('requiring charts', () => {
    it('adds medals to reviewer names', () => {
      const response = buildReviewer({ ...defaultParams, displayCharts: true });
      const expectedTable = {
        ...EXPECTED_TABLE,
        rows: [
          EXPECTED_TABLE.rows[0], // header row
          [
            {
              type: 'rich_text',
              elements: [
                {
                  type: 'rich_text_section',
                  elements: [
                    {
                      type: 'emoji',
                      name: 'link',
                    },
                    {
                      text: ' user1 :first_place_medal:',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
            {
              type: 'raw_text',
              text: '4',
            },
            {
              type: 'raw_text',
              text: '1',
            },
            {
              type: 'raw_text',
              text: '34m',
            },
          ],
        ],
      };
      expect(response).toEqual(expectedTable);
    });
  });

  describe('without charts', () => {
    it('shows reviewer name without medals', () => {
      const response = buildReviewer({ ...defaultParams, displayCharts: false });
      expect(response).toEqual(EXPECTED_TABLE);
    });
  });
});
