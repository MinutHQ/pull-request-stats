const { durationToString } = require('../../../utils');

const MEDALS = [
  ':first_place_medal:',
  ':second_place_medal:',
  ':third_place_medal:',
]; /* 🥇🥈🥉 */

const buildTableRow = ({
  index, reviewer, displayCharts,
}) => {
  const { login } = reviewer.author;
  const { stats } = reviewer;

  const medal = displayCharts ? MEDALS[index] : null;
  const medalName = medal ? medal.replace(/:/g, '') : null; // Remove colons for emoji name

  const timeToReviewStr = durationToString(stats.timeToReview);

  // Build reviewer name with optional medal
  const reviewerElements = [
    {
      text: login,
      type: 'text',
    },
  ];

  if (medalName) {
    reviewerElements.push({
      type: 'emoji',
      name: medalName,
    });
  }

  return [
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: reviewerElements,
        },
      ],
    },
    {
      type: 'raw_text',
      text: stats.totalReviews.toString(),
    },
    {
      type: 'raw_text',
      text: stats.totalComments.toString(),
    },
    {
      type: 'raw_text',
      text: timeToReviewStr,
    },
  ];
};

module.exports = ({
  t,
  reviewers,
  displayCharts,
}) => {
  // Build header row
  const headerRow = [
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
  ];

  // Build data rows
  const dataRows = reviewers.map((reviewer, index) => buildTableRow({
    index,
    reviewer,
    displayCharts,
  }));

  return {
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
      headerRow,
      ...dataRows,
    ],
  };
};
