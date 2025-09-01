const input = require('./mocks/pullRequests');
const getReviewers = require('../index');

const getAuthors = (reviewers) => reviewers.map((r) => r.author.login);

describe('Interactors | getReviewers', () => {
  it('groups reviews by author and calculate its stats', () => {
    const result = getReviewers(input);
    expect(result.length).toEqual(2);
    expect(getAuthors(result)).toContain('manuelmhtr', 'jartmez');

    result.forEach((reviewer) => {
      expect(reviewer).toHaveProperty('author');
      expect(reviewer.author).toHaveProperty('id');
      expect(reviewer.author).toHaveProperty('login');

      expect(reviewer).toHaveProperty('reviews');
      expect(reviewer.reviews.length > 0).toBe(true);

      expect(reviewer).toHaveProperty('stats');
      expect(reviewer.stats).toHaveProperty('timeToReview');
    });
  });

  it('excludes reviewers when the option is passed', () => {
    const result = getReviewers(input, { excludeStr: 'manuelmhtr' });
    expect(result.length).toEqual(1);
    expect(getAuthors(result)).not.toContain('manuelmhtr');
  });

  it('includes required authors with default stats when they are not in the reviewers list', () => {
    const result = getReviewers(input, { requiredAuthors: 'requireduser1,requireduser2' });
    expect(result.length).toEqual(4); // 2 existing + 2 required
    expect(getAuthors(result)).toContain('manuelmhtr', 'jartmez', 'requireduser1', 'requireduser2');

    const requiredUser1 = result.find((r) => r.author.login === 'requireduser1');
    expect(requiredUser1).toBeDefined();
    expect(requiredUser1.author.id).toBe('required-requireduser1');
    expect(requiredUser1.author.url).toBe('https://github.com/requireduser1');
    expect(requiredUser1.author.avatarUrl).toBe('https://github.com/requireduser1.png');
    expect(requiredUser1.reviews).toEqual([]);
    expect(requiredUser1.stats).toEqual({
      totalReviews: 0,
      totalComments: 0,
      commentsPerReview: 0,
      timeToReview: Infinity,
    });
  });

  it('does not duplicate required authors that are already in the reviewers list', () => {
    const result = getReviewers(input, { requiredAuthors: 'manuelmhtr,requireduser1' });
    expect(result.length).toEqual(3); // 2 existing + 1 required (manuelmhtr already exists)
    expect(getAuthors(result)).toContain('manuelmhtr', 'jartmez', 'requireduser1');

    const manuelmhtrCount = result.filter((r) => r.author.login === 'manuelmhtr').length;
    expect(manuelmhtrCount).toBe(1);
  });

  it('handles empty requiredAuthors parameter', () => {
    const result = getReviewers(input, { requiredAuthors: '' });
    expect(result.length).toEqual(2);
    expect(getAuthors(result)).toContain('manuelmhtr', 'jartmez');
  });

  it('handles undefined requiredAuthors parameter', () => {
    const result = getReviewers(input, { requiredAuthors: undefined });
    expect(result.length).toEqual(2);
    expect(getAuthors(result)).toContain('manuelmhtr', 'jartmez');
  });

  it('trims whitespace from required authors', () => {
    const result = getReviewers(input, { requiredAuthors: ' requireduser1 , requireduser2 ' });
    expect(result.length).toEqual(4);
    expect(getAuthors(result)).toContain('requireduser1', 'requireduser2');
  });

  it('sets timeToReview to Infinity for required authors with no reviews', () => {
    const result = getReviewers(input, { requiredAuthors: 'requireduser1' });
    const requiredUser = result.find((r) => r.author.login === 'requireduser1');
    expect(requiredUser.stats.timeToReview).toBe(Infinity);
  });
});
