import { languages } from '@/constants';

// Map DMOJ language codes to Shiki language identifiers
export const getShikiLanguage = (dmojLanguage: string): string => {
  const langMap: { [key: string]: string } = {
    // C/C++ variants
    'C': 'c',
    'CLANG': 'c',
    'CPP03': 'cpp',
    'CPP11': 'cpp', 
    'CPP14': 'cpp',
    'CPP17': 'cpp',
    'CPP20': 'cpp',
    'CPP23': 'cpp',
    'CLANGX': 'cpp',
    
    // Python variants
    'PY2': 'python',
    'PY3': 'python',
    'PYPY': 'python',
    'PYPY3': 'python',
    
    // Java variants
    'JAVA8': 'java',
    'JAVA11': 'java',
    'JAVA17': 'java',
    
    // JavaScript
    'V8JS': 'javascript',
    'JS': 'javascript',
    'NODE': 'javascript',
    
    // Other languages
    'RUST': 'rust',
    'GO': 'go',
    'SWIFT': 'swift',
    'KOTLIN': 'kotlin',
    'RUBY': 'ruby',
    'RUBY18': 'ruby',
    'PHP': 'php',
    'PERL': 'perl',
    'LUA': 'lua',
    'PAS': 'pascal',
    'HASK': 'haskell',
    'OCAML': 'ocaml',
    'D': 'd',
    'MONOCS': 'csharp',
    'MONOVB': 'vb',
    'F95': 'fortran',
    'NASM': 'asm',
    'BF': 'brainfuck',
    'OBJC': 'objective-c',
    'TUR': 'text', // Turing doesn't have specific support
    'TEXT': 'text',
  };

  return langMap[dmojLanguage] || 'text';
};

// Get language display name from DMOJ code
export const getLanguageDisplayName = (dmojLanguage: string): string => {
  const lang = languages.find(l => l.value === dmojLanguage);
  return lang ? lang.label : dmojLanguage;
};
