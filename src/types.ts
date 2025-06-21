export type TAllowedLang =
    | "PY2" | "CPP03" | "RUBY18" | "PHP" | "PERL" | "PY3" | "C" | "PAS"
    | "CPP11" | "MONOCS" | "HASK" | "GO" | "PYPY" | "PYPY3" | "F95" | "NASM"
    | "RUBY" | "LUA" | "OCAML" | "TUR" | "JAVA8" | "V8JS" | "D" | "BF"
    | "OBJC" | "CPP14" | "MONOVB" | "CLANG" | "CLANGX" | "DART" | "TCL"
    | "CBL" | "MONOFS" | "SCM" | "ADA" | "AWK" | "RUST" | "COFFEE" | "PRO"
    | "FORTH" | "ICK" | "TEXT" | "SCALA" | "SWIFT" | "GAS32" | "GASARM"
    | "GAS64" | "SED" | "JAVA" | "NASM64" | "RKT" | "GROOVY" | "KOTLIN"
    | "PIKE" | "CPP17" | "SBCL" | "C11" | "ZIG" | "CPP20";

export interface IProblemData {
    // Basic information
    code: string; // Unique identifier for the problem
    name: string;
    body: string;
    org: string[];
    
    // Limits
    timeLimit: number; // in seconds
    memoryLimit: number; // in MB
    allowedLanguages: TAllowedLang[];

    // I/O
    input: string;
    output: string;
    
    // Metadata
    category: string[];
    type: string[];
    points: number;
    author: string[];
    curator: string[];
    tester: string[];
    pdf?: string; // PDF Statement name.
    solution?: string;
}