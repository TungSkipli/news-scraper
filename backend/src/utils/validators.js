const validateUrl = (url) => {
  if (!url) {
    return {
      valid: false,
      message: 'URL is required'
    };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      valid: false,
      message: 'Invalid URL format. URL must start with http:// or https://'
    };
  }

  return {
    valid: true,
    message: 'URL is valid'
  };
};

const validateUrlArray = (urls) => {
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return {
      valid: false,
      message: 'URLs array is required'
    };
  }

  return {
    valid: true,
    message: 'URLs array is valid'
  };
};

module.exports = {
  validateUrl,
  validateUrlArray
};
