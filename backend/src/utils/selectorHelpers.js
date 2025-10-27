const trySelectors = (selectors, callback, fallback = '') => {
  for (const selector of selectors) {
    try {
      const result = callback(selector);
      if (result) return result;
    } catch (e) {
      continue;
    }
  }
  return fallback;
};

const getSelectorExtractor = (selectors) => {
  return (selectorList, extractor) => {
    for (const selector of selectorList) {
      try {
        const result = extractor(selector);
        if (result) return result;
      } catch (e) {
        continue;
      }
    }
    return null;
  };
};

module.exports = {
  trySelectors,
  getSelectorExtractor
};
