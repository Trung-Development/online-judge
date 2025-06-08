// Programming languages
export const languages = [
  { value: "PY2", label: "Python 2", template: "", extension: "py" },
  {
    value: "CPP03",
    label: "C++03",
    template:
      "#include <bits/stdc++.h>\r\n\r\nusing namespace std;\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "cpp",
  },
  { value: "RUBY18", label: "Ruby 1.8", template: "", extension: "rb" },
  { value: "PHP", label: "PHP", template: "", extension: "php" },
  { value: "PERL", label: "Perl", template: "", extension: "pl" },
  { value: "PY3", label: "Python 3", template: "", extension: "py" },
  {
    value: "C",
    label: "C",
    template: "#include <stdio.h>\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "c",
  },
  { value: "PAS", label: "Pascal", template: "", extension: "pas" },
  {
    value: "CPP11",
    label: "C++11",
    template:
      "#include <bits/stdc++.h>\r\n\r\nusing namespace std;\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "cpp",
  },
  { value: "MONOCS", label: "C#", template: "", extension: "cs" },
  { value: "HASK", label: "Haskell", template: "", extension: "hs" },
  { value: "GO", label: "Go", template: "", extension: "go" },
  { value: "PYPY", label: "PyPy 2", template: "", extension: "py" },
  { value: "PYPY3", label: "PyPy 3", template: "", extension: "py" },
  { value: "F95", label: "Fortran", template: "", extension: "f95" },
  { value: "NASM", label: "NASM", template: "", extension: "asm" },
  { value: "RUBY", label: "Ruby", template: "", extension: "rb" },
  { value: "LUA", label: "Lua", template: "", extension: "lua" },
  { value: "OCAML", label: "OCaml", template: "", extension: "ml" },
  { value: "TUR", label: "Turing", template: "", extension: "t" },
  {
    value: "JAVA8",
    label: "Java 8",
    template:
      "import java.io.*;\r\nimport java.util.*;\r\n\r\npublic class Main {\r\n    public static void main(String[] args) {\r\n\r\n    }\r\n}",
    extension: "java",
  },
  {
    value: "V8JS",
    label: "V8 JavaScript",
    template:
      "/* \r\n * This is a custom version of V8 that adds six functions in order to perform I/O and aid in online judging.\r\n *\r\n * * `print(...)`: similar to Python's `print`, prints all argument separated by space followed by new line.\r\n * * `flush()`: flushes stdout, ensuring everything output by `print()` immediately shows up.\r\n * * `gets()`: similar to the Ruby equivalent, returns one line of input from `stdin`.\r\n * * `read(bytes)`: read `bytes` bytes from stdin as an `ArrayBuffer`.\r\n * * `write(buffer)`: write a typed array, `ArrayBuffer`, or a view of `ArrayBuffer` to stdout.\r\n * * `quit(code)`: exits the program with `code`.\r\n * * You can also assign to the global variable `autoflush` to control whether `print()` flushes.\r\n *\r\n */",
    extension: "js",
  },
  {
    value: "D",
    label: "D",
    template: "import std.stdio;\r\n\r\nvoid main() {\r\n\r\n}",
    extension: "d",
  },
  { value: "BF", label: "Brain****", template: "", extension: "c" },
  { value: "OBJC", label: "Objective-C", template: "", extension: "m" },
  {
    value: "CPP14",
    label: "C++14",
    template:
      "#include <bits/stdc++.h>\r\n\r\nusing namespace std;\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "cpp",
  },
  { value: "MONOVB", label: "Visual Basic", template: "", extension: "vb" },
  {
    value: "CLANG",
    label: "Clang",
    template: "#include <stdio.h>\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "c",
  },
  {
    value: "CLANGX",
    label: "Clang++",
    template:
      "#include <bits/stdc++.h>\r\n\r\nusing namespace std;\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "cpp",
  },
  { value: "DART", label: "Dart", template: "", extension: "dart" },
  { value: "TCL", label: "TCL", template: "", extension: "tcl" },
  { value: "CBL", label: "COBOL", template: "", extension: "cbl" },
  { value: "MONOFS", label: "F#", template: "", extension: "fs" },
  { value: "SCM", label: "Scheme", template: "", extension: "scm" },
  { value: "ADA", label: "Ada", template: "", extension: "adb" },
  { value: "AWK", label: "AWK", template: "", extension: "awk" },
  {
    value: "RUST",
    label: "Rust",
    template:
      '#[macro_use] extern crate dmoj;\r\n\r\nfn main() {\r\n    println!("Hello, World!");\r\n}',
    extension: "rs",
  },
  { value: "COFFEE", label: "CoffeeScript", template: "", extension: "coffee" },
  { value: "PRO", label: "Prolog", template: "", extension: "pl" },
  { value: "FORTH", label: "Forth", template: "", extension: "fs" },
  { value: "ICK", label: "INTERCAL", template: "", extension: "i" },
  { value: "TEXT", label: "Text", template: "", extension: "txt" },
  {
    value: "SCALA",
    label: "Scala",
    template:
      "// Must be the same name as the problem code\r\nobject problemcode extends App {\r\n    \r\n}",
    extension: "scala",
  },
  { value: "SWIFT", label: "Swift", template: "", extension: "swift" },
  { value: "GAS32", label: "Assembly (x86)", template: "", extension: "asm" },
  { value: "GASARM", label: "Assembly (ARM)", template: "", extension: "asm" },
  { value: "GAS64", label: "Assembly (x64)", template: "", extension: "asm" },
  { value: "SED", label: "Sed", template: "", extension: "sed" },
  {
    value: "JAVA",
    label: "Java",
    template:
      "import java.io.*;\r\nimport java.util.*;\r\n\r\npublic class Main {\r\n    public static void main(String[] args) {\r\n\r\n    }\r\n}",
    extension: "java",
  },
  { value: "NASM64", label: "NASM64", template: "", extension: "asm" },
  { value: "RKT", label: "Racket", template: "#lang racket", extension: "rkt" },
  { value: "GROOVY", label: "Groovy", template: "", extension: "groovy" },
  { value: "KOTLIN", label: "Kotlin", template: "", extension: "kt" },
  { value: "PIKE", label: "Pike", template: "", extension: "pike" },
  {
    value: "CPP17",
    label: "C++17",
    template:
      "#include <bits/stdc++.h>\r\n\r\nusing namespace std;\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "cpp",
  },
  { value: "SBCL", label: "Lisp", template: "", extension: "cl" },
  {
    value: "C11",
    label: "C11",
    template: "#include <stdio.h>\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "c",
  },
  { value: "ZIG", label: "Zig", template: "", extension: "zig" },
  {
    value: "CPP20",
    label: "C++20",
    template:
      "#include <bits/stdc++.h>\r\n\r\nusing namespace std;\r\n\r\nint main() {\r\n    return 0;\r\n}",
    extension: "cpp",
  },
].sort((a, b) => a.label.localeCompare(b.label));
