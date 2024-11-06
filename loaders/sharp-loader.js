const sharp = require('sharp');
const loaderUtils = require('loader-utils');

module.exports = async function (content) {
  const callback = this.async();
  const options = loaderUtils.getOptions(this) || {};

  try {
    const result = await sharp(content, { failOnError: false })
      .toFormat('jpeg')
      .jpeg({ quality: options.quality || 85 })
      .toBuffer();

    callback(null, result);
  } catch (error) {
    callback(error);
  }
};

module.exports.raw = true;