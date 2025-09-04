module.exports = (pulls) => {
  const removeOwnPulls = ({ isOwnPull }) => !isOwnPull;

  const removeWithEmptyId = ({ id }) => !!id;

  const all = Object.values(pulls).reduce((acc, pull) => {
    // Debug each review before filtering
    console.log(`\n--- PR ${pull.id} (${pull.title}) ---`);
    console.log(`Total reviews: ${pull.reviews.length}`);
    
    pull.reviews.forEach((review, index) => {
      console.log(`Review ${index + 1}: author=${review.author?.login || 'NO_AUTHOR'}, isOwnPull=${review.isOwnPull}, id=${review.id || 'NO_ID'}`);
    });
    
    // Test each filter separately to see which one is removing reviews
    // const afterOwnPullsFilter = pull.reviews.filter(removeOwnPulls); // Commented out to count ALL reviews
    const afterOwnPullsFilter = pull.reviews; // Count all reviews including self-reviews
    const afterIdFilter = afterOwnPullsFilter.filter(removeWithEmptyId);
    
    console.log(`After ownPulls filter: ${afterOwnPullsFilter.length} reviews`);
    console.log(`After ID filter: ${afterIdFilter.length} reviews`);
    
    const reviews = afterIdFilter.map((r) => ({ ...r, pullRequestId: pull.id }));
    
    console.log(`Final reviews: ${reviews.length}`);
    
    return acc.concat(reviews);
  }, []);

  // Group reviews by author ID - this will now count ALL reviews from each author
  // including multiple re-reviews on the same PR
  const byAuthor = all.reduce((acc, review) => {
    const { author, isOwnPull, ...other } = review;
    const key = author.id;

    if (!acc[key]) acc[key] = { author, reviews: [] };

    // Always push the review - this ensures multiple reviews from same author on same PR are counted
    acc[key].reviews.push(other);
    return acc;
  }, {});

  // Debug logging to see what's being grouped
  console.log(`\n=== Review Grouping Debug ===`);
  Object.entries(byAuthor).forEach(([authorId, authorData]) => {
    console.log(`Author ${authorData.author.login} (${authorId}): ${authorData.reviews.length} reviews`);
    // Show PR IDs for each review to verify multiple reviews on same PR are counted
    const prCounts = authorData.reviews.reduce((acc, review) => {
      acc[review.pullRequestId] = (acc[review.pullRequestId] || 0) + 1;
      return acc;
    }, {});
    Object.entries(prCounts).forEach(([prId, count]) => {
      if (count > 1) {
        console.log(`  - PR ${prId}: ${count} reviews (multiple reviews detected!)`);
      }
    });
  });
  console.log(`=== End Review Grouping Debug ===\n`);

  return Object.values(byAuthor);
};
