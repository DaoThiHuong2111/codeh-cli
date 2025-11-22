/**
 * Syntax highlighting using lowlight
 */

import {createLowlight} from 'lowlight';

import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import markdown from 'highlight.js/lib/languages/markdown';
import xml from 'highlight.js/lib/languages/xml'; // For HTML
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';

const lowlight = createLowlight();

lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('typescript', typescript);
lowlight.register('ts', typescript);
lowlight.register('python', python);
lowlight.register('py', python);
lowlight.register('json', json);
lowlight.register('bash', bash);
lowlight.register('sh', bash);
lowlight.register('shell', bash);
lowlight.register('markdown', markdown);
lowlight.register('md', markdown);
lowlight.register('html', xml);
lowlight.register('xml', xml);
lowlight.register('css', css);
lowlight.register('sql', sql);
lowlight.register('java', java);
lowlight.register('cpp', cpp);
lowlight.register('c++', cpp);
lowlight.register('c', cpp);
lowlight.register('go', go);
lowlight.register('golang', go);
lowlight.register('rust', rust);
lowlight.register('rs', rust);
lowlight.register('ruby', ruby);
lowlight.register('rb', ruby);
lowlight.register('php', php);

/**
 * Highlight code with syntax highlighting
 * @param code - Code to highlight
 * @param language - Language name
 * @returns Highlighted tokens
 */
export function highlightCode(code: string, language: string | null) {
	if (!code) return null;

	try {
		if (!language) {
			return lowlight.highlightAuto(code);
		}

		const lang = language.toLowerCase();

		if (!lowlight.registered(lang)) {
			return null;
		}

		return lowlight.highlight(lang, code);
	} catch (error) {
		return null;
	}
}

/**
 * Check if a language is supported
 * @param language - Language name
 * @returns True if language is registered
 */
export function isLanguageSupported(language: string): boolean {
	if (!language) return false;
	return lowlight.registered(language.toLowerCase());
}

/**
 * Get list of all registered languages
 * @returns Array of language names
 */
export function getSupportedLanguages(): string[] {
	return lowlight.listLanguages();
}

// Export lowlight instance for advanced usage
export {lowlight};
