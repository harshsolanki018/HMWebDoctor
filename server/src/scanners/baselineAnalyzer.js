const htmlparser2 = require('htmlparser2');

/**
 * Baseline HTML Document Analyzer
 * Performs safe, lightweight streaming parsing of HTML content to extract document baseline metadata.
 *
 * @param {string} html Raw HTML response body
 * @returns {object} Extracted baseline metadata
 */
function analyzeBaseline(html) {
  if (typeof html !== 'string') {
    throw new TypeError('HTML content must be a string');
  }

  let title = null;
  let lang = null;
  let charset = null;
  let description = null;
  let hasDoctype = false;

  let inTitle = false;
  let titleBuffer = '';

  const parser = new htmlparser2.Parser(
    {
      onprocessinginstruction(name, data) {
        if (data.toLowerCase().startsWith('!doctype')) {
          hasDoctype = true;
        }
      },
      onopentag(name, attribs) {
        const tagName = name.toLowerCase();

        if (tagName === 'html' && attribs.lang) {
          lang = attribs.lang.trim();
        }

        if (tagName === 'title') {
          inTitle = true;
          titleBuffer = '';
        }

        if (tagName === 'meta') {
          // Direct charset attribute: <meta charset="utf-8">
          if (attribs.charset) {
            charset = attribs.charset.trim();
          }

          // http-equiv content-type: <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          if (
            attribs['http-equiv'] &&
            attribs['http-equiv'].toLowerCase() === 'content-type' &&
            attribs.content
          ) {
            const match = attribs.content.match(/charset=([^\s;]+)/i);
            if (match && match[1]) {
              charset = match[1].replace(/['"]/g, '').trim();
            }
          }

          // Meta description: <meta name="description" content="..."> or <meta property="og:description" content="...">
          const nameAttr = (attribs.name || attribs.property || '').toLowerCase();
          if (nameAttr === 'description' || nameAttr === 'og:description') {
            if (!description && attribs.content) {
              description = attribs.content.trim();
            }
          }
        }
      },
      ontext(text) {
        if (inTitle) {
          titleBuffer += text;
        }
      },
      onclosetag(name) {
        if (name.toLowerCase() === 'title') {
          inTitle = false;
          if (titleBuffer.trim()) {
            title = titleBuffer.trim();
          }
        }
      },
    },
    { decodeEntities: true }
  );

  parser.write(html);
  parser.end();

  return {
    title,
    lang,
    charset,
    description,
    documentSizeBytes: Buffer.byteLength(html, 'utf8'),
    hasDoctype,
  };
}

module.exports = {
  analyzeBaseline,
};
