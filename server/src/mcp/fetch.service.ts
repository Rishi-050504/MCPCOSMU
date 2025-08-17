import axios from 'axios';
import * as cheerio from 'cheerio';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

// --- Configuration for Security and Control ---
const AXIOS_TIMEOUT = 5000; // 5-second timeout for requests
const MAX_CONTENT_LENGTH = 10000; // Limit content to 10,000 characters
const ALLOWED_DOMAINS = [ // Prevent abuse by only allowing known, useful domains
  'developer.mozilla.org',
  'react.dev',
  'nodejs.org',
  'www.npmjs.com',
  'github.com', // For documentation in repos
  'stackoverflow.com',
  // Add other trusted documentation sites here
];

export class FetchMcp {
  /**
   * Fetches and intelligently parses a URL for its main textual content.
   * @param url The URL to fetch.
   * @returns A string containing the cleaned, relevant text from the page.
   */
  async fetchAndParseContent(url: string): Promise<string> {
    try {
      const parsedUrl = new URL(url);
      // Security Check: Is the domain allowed?
      if (!ALLOWED_DOMAINS.some(domain => parsedUrl.hostname.endsWith(domain))) {
        console.warn(`[FetchMCP] Denied access to disallowed domain: ${parsedUrl.hostname}`);
        return `Error: Access to the domain '${parsedUrl.hostname}' is not permitted.`;
      }

      console.log(`[FetchMCP] Fetching content from: ${url}`);
      const response = await axios.get(url, {
        timeout: AXIOS_TIMEOUT,
        maxBodyLength: MAX_CONTENT_LENGTH * 2, // Allow slightly larger raw download
        maxContentLength: MAX_CONTENT_LENGTH * 2,
      });

      // Use Cheerio to parse the HTML and extract meaningful text
      const $ = cheerio.load(response.data);
      
      // Remove irrelevant tags to clean up the content
      $('script, style, nav, footer, header, aside').remove();

      // Extract text from common content-holding tags
      let textContent = '';
      $('body').find('h1, h2, h3, p, pre, code, li').each((i, elem) => {
        textContent += $(elem).text().trim() + '\n';
      });

      // Return a snippet of the cleaned text
      return textContent.substring(0, MAX_CONTENT_LENGTH);

    } catch (error: any) {
      console.error(`[FetchMCP] Error fetching URL: ${url}`, error.message);
      if (axios.isAxiosError(error)) {
        return `Error: Could not fetch content. Status code: ${error.response?.status || 'N/A'}`;
      }
      return `Error: An unexpected error occurred while fetching the URL.`;
    }
  }

  static getToolSpec(): FunctionDeclaration {
    return {
      name: 'fetchContent',
      description: 'Fetches the clean, readable text content of a given URL. Use this to look up documentation, articles, or security advisories from allowed domains.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          url: {
            type: SchemaType.STRING,
            description: 'The full URL to fetch the content from.',
          },
        },
        required: ['url'],
      },
    };
  }
}