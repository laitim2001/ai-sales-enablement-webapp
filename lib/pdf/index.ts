/**
 * PDF Generation Module
 *
 * 統一導出所有 PDF 相關功能
 *
 * @module lib/pdf
 */

export {
  generatePDFFromHTML,
  generatePDFFromURL,
  closeBrowser,
  DEFAULT_FOOTER_TEMPLATE,
  DEFAULT_HEADER_TEMPLATE,
  type PDFGenerationOptions,
} from './pdf-generator';

export {
  generateProposalHTML,
  generateSimplePDFHTML,
  type ProposalPDFData,
} from './proposal-pdf-template';
