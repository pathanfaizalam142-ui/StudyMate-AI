import { GTUSemesterCurriculum, GTUSubject, GTUTopic, SubjectItem } from '../types';

/**
 * Centralized GTU BCA Curriculum Configuration & Data Layer.
 * Official Gujarat Technological University (GTU) Bachelor of Computer Applications (BCA) curriculum.
 * Structure: Semester (1 to 6) -> Subjects -> Units -> Topics with GTU Subject Codes, categories,
 * important examination questions (2M, 3M, 5M, 7M, 10M, 15M), and key study notes.
 * 
 * Designed to be future-database ready (e.g. Firebase Firestore or REST API adapter).
 */

export const GTU_BCA_CURRICULUM: GTUSemesterCurriculum[] = [
  // ==========================================
  // SEMESTER 1
  // ==========================================
  {
    semester: 1,
    title: 'Semester 1',
    description: 'Foundations of Computer Organization, Programming in C, Web Technologies, and Computational Mathematics.',
    subjects: [
      {
        code: 'BCA101',
        name: 'Fundamental of Computer Organization',
        shortName: 'FCO',
        category: 'Core Computer Science',
        credits: 4,
        description: 'Von Neumann architecture, logic gates, memory hierarchy, CPU instruction cycles, and I/O interfacing.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Introduction to Digital Computers & Number Systems',
            weightage: '20%',
            topics: [
              {
                id: 'fco-u1-t1',
                title: 'Block Diagram of Digital Computer',
                summary: 'Von Neumann architecture components: ALU, Control Unit, Memory Unit, Input and Output devices with system bus connections.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Draw and explain the block diagram of a digital computer with the functional role of each subsystem.', marks: 10 },
                  { question: 'What is the Von Neumann stored-program concept? State its key limitations.', marks: 5 },
                  { question: 'Define CPU, ALU, and Control Unit.', marks: 3 }
                ]
              },
              {
                id: 'fco-u1-t2',
                title: 'Number Systems & Base Conversions',
                summary: 'Binary, Octal, Decimal, and Hexadecimal representations; 1s and 2s complement arithmetic; BCD and Gray codes.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Convert (110101.11)2 to Decimal and Hexadecimal. Perform (28)10 - (15)10 using 2s complement.', marks: 7 },
                  { question: 'Differentiate between 1s complement and 2s complement representation with examples.', marks: 5 },
                  { question: 'Convert (472.625)10 to Octal and Binary.', marks: 3 }
                ]
              },
              {
                id: 'fco-u1-t3',
                title: 'Logic Gates & Boolean Algebra Laws',
                summary: 'Basic gates (AND, OR, NOT), Universal gates (NAND, NOR), De Morgan’s Theorems, and truth tables.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Why are NAND and NOR gates called Universal Gates? Realize AND, OR, and NOT gates using only NOR gates.', marks: 7 },
                  { question: 'State and prove De Morgan\'s Theorems algebraically and using truth tables.', marks: 5 },
                  { question: 'Draw symbol and truth table of XOR and XNOR gates.', marks: 3 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Combinational & Sequential Circuits',
            weightage: '25%',
            topics: [
              {
                id: 'fco-u2-t1',
                title: 'Adders: Half Adder and Full Adder',
                summary: 'Circuit design, Boolean truth tables, sum and carry expressions, logic diagram implementation.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Design a Full Adder circuit. Derive its truth table, Boolean expressions for Sum and Carry, and draw the logic circuit.', marks: 7 },
                  { question: 'Explain Half Adder with truth table and K-map simplification.', marks: 5 }
                ]
              },
              {
                id: 'fco-u2-t2',
                title: 'Multiplexers, Demultiplexers & Encoders',
                summary: '4:1 and 8:1 MUX operation, line decoders, priority encoders, data routing.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain 8-to-1 Multiplexer with functional block diagram, truth table, and logic gate implementation.', marks: 7 },
                  { question: 'Differentiate between Multiplexer and Demultiplexer with neat diagrams.', marks: 5 }
                ]
              },
              {
                id: 'fco-u2-t3',
                title: 'Flip-Flops: RS, JK, D, and T Flip-Flops',
                summary: 'Clocked latches, race-around condition, Master-Slave JK flip-flop, state tables and excitation diagrams.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Master-Slave JK Flip-Flop. How does it eliminate the race-around condition?', marks: 10 },
                  { question: 'Explain the working of RS and D Flip-Flops with circuit diagram and characteristic table.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Memory Organization & Hierarchy',
            weightage: '25%',
            topics: [
              {
                id: 'fco-u3-t1',
                title: 'Memory Hierarchy and Cache Memory',
                summary: 'Levels of memory (Registers, L1/L2/L3 Cache, RAM, Secondary Storage), Cache hit ratio, mapping techniques.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the Memory Hierarchy in modern computer systems with respect to access time, cost, and capacity.', marks: 7 },
                  { question: 'What is Cache Memory? Explain Direct Mapping, Associative Mapping, and Set-Associative Mapping.', marks: 10 },
                  { question: 'Define Cache Hit, Cache Miss, and Hit Ratio.', marks: 3 }
                ]
              },
              {
                id: 'fco-u3-t2',
                title: 'Primary vs Secondary Memory & RAM/ROM',
                summary: 'SRAM vs DRAM, Mask ROM, PROM, EPROM, EEPROM, Flash memory, Magnetic disks and SSDs.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Compare Static RAM (SRAM) and Dynamic RAM (DRAM) with structural comparison table.', marks: 5 },
                  { question: 'Explain different types of ROM (PROM, EPROM, EEPROM) with applications.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'CPU Architecture & Instruction Cycle',
            weightage: '30%',
            topics: [
              {
                id: 'fco-u4-t1',
                title: 'Instruction Cycle & Addressing Modes',
                summary: 'Fetch, Decode, Execute, Interrupt phases; Program Counter (PC), Instruction Register (IR), Accumulator; Immediate, Direct, Indirect addressing.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the basic computer instruction cycle (Fetch, Decode, Read Effective Address, Execute) with flowchart.', marks: 10 },
                  { question: 'Explain various CPU Addressing Modes (Immediate, Direct, Indirect, Register Indirect, Indexed) with examples.', marks: 7 }
                ]
              },
              {
                id: 'fco-u4-t2',
                title: 'Input-Output Organization & DMA',
                summary: 'Programmed I/O, Interrupt-driven I/O, Direct Memory Access (DMA) controller and bus arbitration.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Direct Memory Access (DMA) transfer mechanism with neat block diagram of DMA controller.', marks: 10 },
                  { question: 'Compare Programmed I/O, Interrupt-Driven I/O, and DMA.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA102',
        name: 'Fundamental of Programming',
        shortName: 'FOP (C Programming)',
        category: 'Core Programming',
        credits: 4,
        description: 'Structured programming logic, control flow, functions, arrays, pointers, structures, and file operations in C.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Introduction to Programming & C Basics',
            weightage: '20%',
            topics: [
              {
                id: 'fop-u1-t1',
                title: 'Algorithms, Flowcharts & Structure of C Program',
                summary: 'Problem solving concepts, pseudo-code, compilation process (Preprocessor, Compiler, Assembler, Linker).',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Explain the structure of a C program with example. Discuss the role of preprocessor directives.', marks: 7 },
                  { question: 'Draw flowchart and write algorithm to find the largest of three numbers.', marks: 5 }
                ]
              },
              {
                id: 'fop-u1-t2',
                title: 'Data Types, Operators & Expressions',
                summary: 'Primitive data types (int, float, char, double), arithmetic, relational, logical, bitwise operators, type casting.',
                importantMarks: [2, 3, 5],
                examQuestions: [
                  { question: 'Explain operator precedence and associativity in C with appropriate expressions.', marks: 5 },
                  { question: 'Explain bitwise operators in C (&, |, ^, ~, <<, >>) with examples.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Control Structures & Loops',
            weightage: '25%',
            topics: [
              {
                id: 'fop-u2-t1',
                title: 'Decision Making (if-else, switch-case)',
                summary: 'Simple if, if-else, nested if-else, else-if ladder, switch statement with break and default.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Explain switch-case statement with syntax, rules, flowchart, and a menu-driven arithmetic calculator program.', marks: 7 },
                  { question: 'Compare if-else ladder vs switch-case statement.', marks: 5 }
                ]
              },
              {
                id: 'fop-u2-t2',
                title: 'Looping Statements (while, do-while, for)',
                summary: 'Entry-controlled vs exit-controlled loops, break, continue, goto statements, nested loops.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Differentiate between while and do-while loop with syntax, flowcharts, and C programs.', marks: 5 },
                  { question: 'Write a C program to check whether a given integer is a Prime Number or Armstrong Number.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Arrays, Strings & Functions',
            weightage: '30%',
            topics: [
              {
                id: 'fop-u3-t1',
                title: '1D & 2D Arrays and String Manipulations',
                summary: 'Array declaration, initialization, 2D matrix addition and multiplication, string library functions (strlen, strcpy, strcmp, strcat).',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Write a C program to multiply two 3x3 matrices and print the resultant matrix.', marks: 10 },
                  { question: 'Explain string handling functions in string.h with syntax and example code.', marks: 7 }
                ]
              },
              {
                id: 'fop-u3-t2',
                title: 'User-Defined Functions & Recursion',
                summary: 'Function definition, declaration, call-by-value vs call-by-reference, recursion, base condition.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'What is Recursion? Write a recursive function in C to find the factorial of a number and Fibonacci sequence.', marks: 7 },
                  { question: 'Differentiate between Call by Value and Call by Reference with working C code.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'Pointers, Structures & File Management',
            weightage: '25%',
            topics: [
              {
                id: 'fop-u4-t1',
                title: 'Pointers & Dynamic Memory Allocation',
                summary: 'Pointer declaration, dereferencing, pointer arithmetic, malloc(), calloc(), realloc(), free().',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'What is a Pointer? Explain Dynamic Memory Allocation functions (malloc, calloc, realloc, free) with examples.', marks: 10 },
                  { question: 'Write a C program to swap two numbers using pointers.', marks: 5 }
                ]
              },
              {
                id: 'fop-u4-t2',
                title: 'Structures, Unions & File I/O in C',
                summary: 'struct vs union, array of structures, fopen(), fclose(), fprintf(), fscanf(), fread(), fwrite().',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Differentiate between Structure and Union in C with memory allocation diagrams and examples.', marks: 7 },
                  { question: 'Write a C program to read student data from a text file and write filtered records to another file.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA103',
        name: 'Fundamentals of Web Technology',
        shortName: 'FWT (HTML, CSS, JS)',
        category: 'Web Development',
        credits: 4,
        description: 'Semantic HTML5, responsive CSS3 styling, client-side scripting with JavaScript, DOM manipulation.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Internet & HTML5 Fundamentals',
            weightage: '25%',
            topics: [
              {
                id: 'fwt-u1-t1',
                title: 'HTML5 Document Structure & Semantic Elements',
                summary: 'DOCTYPE, html, head, body tags, semantic tags (header, nav, article, section, footer, aside).',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Explain HTML5 semantic elements and their advantages over traditional div tags.', marks: 7 },
                  { question: 'Explain tables, lists (ordered, unordered, definition) and hyperlinks in HTML.', marks: 5 }
                ]
              },
              {
                id: 'fwt-u1-t2',
                title: 'HTML Forms & Form Validation Controls',
                summary: 'Input types (text, email, password, radio, checkbox, date), select dropdown, textarea, pattern attribute.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Design a student registration form in HTML5 utilizing diverse input elements and validation attributes.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'CSS3 Styles, Box Model & Layouts',
            weightage: '25%',
            topics: [
              {
                id: 'fwt-u2-t1',
                title: 'CSS Selectors & CSS Box Model',
                summary: 'Inline, Internal, External CSS; Class, ID, Pseudo-classes; Margin, Border, Padding, Content box model.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the CSS Box Model with neat labeled schematic diagram and property details.', marks: 7 },
                  { question: 'Explain different types of CSS Selectors with syntax and examples.', marks: 5 }
                ]
              },
              {
                id: 'fwt-u2-t2',
                title: 'Responsive Web Design & Flexbox',
                summary: 'Viewport meta tag, Media Queries, Flexbox container and item properties (justify-content, align-items).',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain CSS Flexbox layout model with key properties for parent and child elements.', marks: 7 },
                  { question: 'Write CSS media queries to make a webpage responsive across mobile, tablet, and desktop.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Client-Side JavaScript Basics',
            weightage: '25%',
            topics: [
              {
                id: 'fwt-u3-t1',
                title: 'JavaScript Variables, Functions & Events',
                summary: 'var, let, const scopes; arrow functions; click, submit, change, mouseover event handlers.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Differentiate between var, let, and const in JavaScript with scope examples.', marks: 5 },
                  { question: 'Write a JavaScript program to validate a user registration form (Email and Password length).', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'DOM Manipulation & Dynamic Interactions',
            weightage: '25%',
            topics: [
              {
                id: 'fwt-u4-t1',
                title: 'Document Object Model (DOM) Tree & Manipulation',
                summary: 'getElementById, querySelector, createElement, appendChild, innerHTML, classList manipulation.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'What is DOM? Explain DOM tree traversal and element manipulation methods in JavaScript with examples.', marks: 10 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA104',
        name: 'Fundamentals of Statistical Methods',
        shortName: 'Statistics-1',
        category: 'Applied Mathematics',
        credits: 4,
        description: 'Measures of central tendency, dispersion, probability theory, binomial and normal distributions.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Data Representation & Central Tendency',
            weightage: '25%',
            topics: [
              {
                id: 'fsm-u1-t1',
                title: 'Mean, Median & Mode for Grouped/Ungrouped Data',
                summary: 'Arithmetic mean, weighted mean, median calculation using ogives, empirical relation between mean, median, mode.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Define Mean, Median, and Mode. State the empirical formula relating them for a moderately skewed distribution.', marks: 5 },
                  { question: 'Calculate Arithmetic Mean and Median for given continuous frequency distribution data.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Measures of Dispersion',
            weightage: '25%',
            topics: [
              {
                id: 'fsm-u2-t1',
                title: 'Standard Deviation, Variance & Coefficient of Variation',
                summary: 'Range, Mean Deviation, Variance formula, Standard deviation, Karl Pearson’s coefficient of variation (C.V.).',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Calculate Standard Deviation and Coefficient of Variation for given grouped frequency data.', marks: 7 },
                  { question: 'Why is Standard Deviation regarded as the best measure of dispersion? Compare it with Mean Deviation.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Probability Theory & Conditional Probability',
            weightage: '25%',
            topics: [
              {
                id: 'fsm-u3-t1',
                title: 'Addition & Multiplication Theorems, Bayes Theorem',
                summary: 'Sample space, mutually exclusive events, independent events, conditional probability P(A|B), Bayes Theorem derivation.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'State and prove Bayes Theorem of probability. Solve a standard diagnostic testing numerical problem.', marks: 10 },
                  { question: 'Explain Addition Theorem of Probability for two intersecting events.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'Probability Distributions',
            weightage: '25%',
            topics: [
              {
                id: 'fsm-u4-t1',
                title: 'Binomial, Poisson & Normal Distribution',
                summary: 'Probability mass functions, mean and variance of Binomial distribution (np, npq), properties of standard normal curve.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'State the conditions and properties of Binomial Distribution. Prove that its Mean = np and Variance = npq.', marks: 7 },
                  { question: 'Explain the properties of Normal Distribution curve with sketch.', marks: 5 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA105',
        name: 'Mathematics-1',
        shortName: 'Maths-1',
        category: 'Mathematics',
        credits: 4,
        description: 'Set theory, relations, matrices and determinants, differential calculus, limits and continuity.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Set Theory & Relations',
            weightage: '25%',
            topics: [
              {
                id: 'm1-u1-t1',
                title: 'Sets, Venn Diagrams & Cartesian Products',
                summary: 'Types of sets, Venn diagrams, union, intersection, complement, equivalence relations.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'State and prove De Morgan\'s laws in Set Theory using element containment.', marks: 5 },
                  { question: 'Define Reflexive, Symmetric, and Transitive relations. What is an Equivalence Relation?', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Matrices & Determinants',
            weightage: '25%',
            topics: [
              {
                id: 'm1-u2-t1',
                title: 'Matrix Operations, Inverse & Cramer’s Rule',
                summary: 'Matrix multiplication, transpose, adjoint, matrix inversion A^-1 = adj(A)/|A|, system of linear equations solving.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Find the inverse of a 3x3 matrix using the Adjoint method.', marks: 7 },
                  { question: 'Solve system of 3 linear equations using Cramer\'s Rule.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Limits & Continuity',
            weightage: '25%',
            topics: [
              {
                id: 'm1-u3-t1',
                title: 'Limits of Algebraic and Trigonometric Functions',
                summary: 'Left-hand limit, right-hand limit, standard limit formulas, continuity at a point.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Evaluate lim(x->0) (sin x / x) and lim(x->a) (x^n - a^n)/(x - a).', marks: 5 },
                  { question: 'Discuss the continuity of f(x) = (x^2 - 4)/(x - 2) at x = 2.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'Differential Calculus',
            weightage: '25%',
            topics: [
              {
                id: 'm1-u4-t1',
                title: 'Derivatives, Product/Quotient Rules, Chain Rule',
                summary: 'First principles, product rule d(uv)/dx, quotient rule, chain rule, maxima and minima.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Find dy/dx using chain rule for composite trigonometric and logarithmic functions.', marks: 5 },
                  { question: 'Explain conditions for Maxima and Minima of a single variable function with an optimization problem.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA106',
        name: 'Office Automation',
        shortName: 'Office Automation',
        category: 'Practical Applications',
        credits: 2,
        description: 'Word processing, spreadsheet analysis, formula automation, presentation design, and cloud office tools.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Advanced Word Processing & Formatting',
            weightage: '30%',
            topics: [
              {
                id: 'oa-u1-t1',
                title: 'Mail Merge, Styles, Table of Contents & References',
                summary: 'Mail merge wizard, data sources, citations, automated index generation, formatting templates.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Explain the step-by-step process of performing Mail Merge in MS Word with diagrams.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Spreadsheets: Formulas, Charts & VLOOKUP',
            weightage: '40%',
            topics: [
              {
                id: 'oa-u2-t1',
                title: 'Formulas, VLOOKUP, HLOOKUP & Pivot Tables',
                summary: 'SUM, AVERAGE, IF, COUNTIF, nested formulas, VLOOKUP/XLOOKUP lookup functions, Pivot tables for data analysis.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain VLOOKUP and HLOOKUP functions in Excel with syntax and practical examples.', marks: 7 },
                  { question: 'What is a Pivot Table in Excel? Explain how to summarize large sales data using Pivot Table.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Presentation Tools & Automation',
            weightage: '30%',
            topics: [
              {
                id: 'oa-u3-t1',
                title: 'Slide Master, Animation Schemes & Macros',
                summary: 'Slide transitions, custom animations, Slide Master templating, basic macro recording.',
                importantMarks: [3, 5],
                examQuestions: [
                  { question: 'What is Slide Master in MS PowerPoint? Explain its advantages in consistent design.', marks: 5 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA107',
        name: 'Communication Skills',
        shortName: 'Comm Skills',
        category: 'Humanities & Soft Skills',
        credits: 2,
        description: 'Grammar mechanics, business correspondence, presentation skills, group discussions, and listening skills.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Basics of Business Communication',
            weightage: '50%',
            topics: [
              {
                id: 'cs-u1-t1',
                title: 'Communication Cycle, Types & Barriers',
                summary: 'Sender, encoding, channel, decoding, receiver, feedback; verbal vs non-verbal; physical, psychological, semantic barriers.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Explain the 7 Cs of effective business communication with examples.', marks: 7 },
                  { question: 'Discuss various barriers to communication and methods to overcome them.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Written Business Correspondence',
            weightage: '50%',
            topics: [
              {
                id: 'cs-u2-t1',
                title: 'Formal Email Writing, Resume & Letters',
                summary: 'Professional email etiquette, job application cover letter, chronological and functional resume formats.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Draft a professional resume and cover letter applying for a Junior Web Developer position.', marks: 10 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA108',
        name: 'Indian Knowledge System',
        shortName: 'IKS',
        category: 'Value Added Course',
        credits: 2,
        description: 'Vedic mathematics, historical contributions of Indian scholars in astronomy, architecture, metallurgy, and philosophy.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Introduction to IKS & Vedic Mathematics',
            weightage: '50%',
            topics: [
              {
                id: 'iks-u1-t1',
                title: 'Vedic Math Sutras & Mathematical Heritage',
                summary: 'Contributions of Aryabhata, Brahmagupta, Bhaskara II, Nilakantha Somayaji; Ekadhikena Purvena, Nikhilam sutras.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Discuss the historical contribution of Aryabhata in astronomy, trigonometry, and place-value number system.', marks: 7 },
                  { question: 'Explain two Vedic Mathematics sutras for rapid mental calculation with step-by-step examples.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Science, Technology & Philosophy in Ancient India',
            weightage: '50%',
            topics: [
              {
                id: 'iks-u2-t1',
                title: 'Ancient Metallurgy, Ayurveda & Architecture',
                summary: 'Delhi Iron Pillar metallurgy, Sushruta Samhita surgical tools, Vastu Shastra town planning and sustainability.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Write a comprehensive note on ancient Indian achievements in metallurgy and water harvesting systems.', marks: 7 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================
  // SEMESTER 2
  // ==========================================
  {
    semester: 2,
    title: 'Semester 2',
    description: 'Data Structures, Relational Database Management Systems, Advanced Web Tech, and Statistics-2.',
    subjects: [
      {
        code: 'BCA201',
        name: 'Data Structure',
        shortName: 'DS (Data Structures)',
        category: 'Core Computer Science',
        credits: 4,
        description: 'Linear and non-linear data structures: Arrays, Stacks, Queues, Linked Lists, Trees, Graphs, Sorting & Searching algorithms.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Introduction to Data Structures & Stacks',
            weightage: '25%',
            topics: [
              {
                id: 'ds-u1-t1',
                title: 'Stack Operations, Infix to Postfix & Applications',
                summary: 'LIFO principle, PUSH and POP algorithms, stack overflow/underflow, expression evaluation, recursion.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Define Stack. Write complete algorithms for PUSH and POP operations with overflow/underflow checks.', marks: 7 },
                  { question: 'Convert the following infix expression into postfix using Stack: A + (B * C - (D / E ^ F) * G) * H.', marks: 7 },
                  { question: 'Explain how Stack is used in evaluation of postfix expressions with an example.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Queues: Linear, Circular, Priority & Deque',
            weightage: '25%',
            topics: [
              {
                id: 'ds-u2-t1',
                title: 'Circular Queue & Priority Queue Operations',
                summary: 'FIFO principle, Enqueue and Dequeue, circular increment using modulo arithmetic, front/rear pointers.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Circular Queue. Why is it preferred over a Simple Linear Queue? Write algorithms for INSERT and DELETE.', marks: 10 },
                  { question: 'Explain Priority Queue and Double-Ended Queue (Deque) with applications.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Linked Lists (Singly, Doubly, Circular)',
            weightage: '25%',
            topics: [
              {
                id: 'ds-u3-t1',
                title: 'Singly Linked List: Insertion, Deletion & Traversal',
                summary: 'Dynamic memory node structure, insert at start/middle/end, delete node, reverse linked list.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Write C functions to insert a node at the beginning, at the end, and after a specified node in Singly Linked List.', marks: 10 },
                  { question: 'Differentiate between Singly Linked List and Doubly Linked List with memory representation diagrams.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'Trees, Graphs, Sorting & Searching',
            weightage: '25%',
            topics: [
              {
                id: 'ds-u4-t1',
                title: 'Binary Search Tree (BST) & Tree Traversals',
                summary: 'Binary tree definition, BST property, Inorder, Preorder, Postorder traversal algorithms, height and depth.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Binary Search Tree (BST). Insert elements: 45, 23, 78, 12, 34, 67, 89 and show Inorder, Preorder, Postorder traversals.', marks: 10 },
                  { question: 'Compare Bubble Sort, Quick Sort, and Merge Sort with time and space complexity comparison table.', marks: 7 },
                  { question: 'Explain Binary Search algorithm with code and time complexity analysis.', marks: 5 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA202',
        name: 'Database Management System',
        shortName: 'DBMS (SQL & ER)',
        category: 'Core Computer Science',
        credits: 4,
        description: 'Relational data models, ER diagrams, Normalization (1NF to BCNF), SQL queries, Transaction management, ACID properties.',
        units: [
          {
            unitNumber: 1,
            unitName: 'DBMS Concepts & Architecture',
            weightage: '20%',
            topics: [
              {
                id: 'dbms-u1-t1',
                title: '3-Tier Database Architecture & Data Independence',
                summary: 'Physical, Logical, and View levels; Physical and Logical data independence; File system vs DBMS.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the 3-Tier ANSI/SPARC Database Architecture with a neat diagram. Discuss physical and logical data independence.', marks: 10 },
                  { question: 'Differentiate between Traditional File System and Database Management System (DBMS).', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Entity-Relationship (ER) Modeling',
            weightage: '25%',
            topics: [
              {
                id: 'dbms-u2-t1',
                title: 'ER Diagrams, Keys & Cardinality Constraints',
                summary: 'Entities, weak entities, attributes, primary, foreign, candidate, super keys; 1:1, 1:N, M:N relationships.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Design an ER Diagram for a University Examination Management System showing all entities, attributes, primary keys, and relationships.', marks: 10 },
                  { question: 'Explain Super Key, Candidate Key, Primary Key, and Foreign Key with an example table.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Relational Model, Normalization & Functional Dependencies',
            weightage: '30%',
            topics: [
              {
                id: 'dbms-u3-t1',
                title: 'Normalization: 1NF, 2NF, 3NF, and BCNF',
                summary: 'Anomalies (Insertion, Deletion, Update); Functional dependencies; Normal form definitions and decomposition rules.',
                importantMarks: [5, 7, 10, 15],
                examQuestions: [
                  { question: 'What is Normalization? Explain 1NF, 2NF, 3NF, and BCNF with suitable relational examples and dependency diagrams.', marks: 15 },
                  { question: 'Explain Partial Functional Dependency and Transitive Functional Dependency with examples.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'Structured Query Language (SQL) & Transactions',
            weightage: '25%',
            topics: [
              {
                id: 'dbms-u4-t1',
                title: 'SQL DDL, DML, Joins & ACID Properties',
                summary: 'CREATE, ALTER, DROP; SELECT, INSERT, UPDATE, DELETE; INNER, LEFT, RIGHT OUTER JOIN; Atomicity, Consistency, Isolation, Durability.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain SQL Joins (Inner Join, Left Outer Join, Right Outer Join, Full Outer Join) with query examples and Venn diagrams.', marks: 10 },
                  { question: 'Explain ACID Properties of transactions with banking account transfer scenario.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA203',
        name: 'Advanced Web Technology',
        shortName: 'AWT (PHP & MySQL)',
        category: 'Web Development',
        credits: 4,
        description: 'Server-side programming using PHP, session management, form processing, MySQL database connectivity (PDO/mysqli).',
        units: [
          {
            unitNumber: 1,
            unitName: 'PHP Fundamentals & Server Execution',
            weightage: '25%',
            topics: [
              {
                id: 'awt-u1-t1',
                title: 'PHP Syntax, Variables, Superglobals & Arrays',
                summary: 'PHP tags, data types, $_GET, $_POST, $_REQUEST, indexed and associative arrays.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Differentiate between $_GET and $_POST methods in PHP with form processing examples.', marks: 5 },
                  { question: 'Explain associative arrays in PHP and iterate over them using foreach loop.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'State Management: Cookies & Sessions',
            weightage: '25%',
            topics: [
              {
                id: 'awt-u2-t1',
                title: 'HTTP Cookies vs PHP Sessions',
                summary: 'setcookie(), $_COOKIE, session_start(), $_SESSION, session_destroy(), session security.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Compare Cookies and Sessions in PHP. Write code to create, read, and destroy a login session.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'PHP MySQL Database Connectivity',
            weightage: '30%',
            topics: [
              {
                id: 'awt-u3-t1',
                title: 'CRUD Operations with MySQLi and Prepared Statements',
                summary: 'Database connection, INSERT, SELECT, UPDATE, DELETE queries, SQL injection prevention.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Write a complete PHP script to connect to MySQL database and implement User Registration and Login with password hashing.', marks: 10 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'AJAX & JSON Integration',
            weightage: '20%',
            topics: [
              {
                id: 'awt-u4-t1',
                title: 'Asynchronous Requests & JSON Parsing',
                summary: 'XMLHttpRequest, fetch API, json_encode(), json_decode(), asynchronous form validation.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Explain AJAX workflow with XMLHttpRequest object and fetch API with an asynchronous live search example.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA204',
        name: 'Advanced Statistical Methods',
        shortName: 'Statistics-2',
        category: 'Applied Mathematics',
        credits: 4,
        description: 'Correlation, regression analysis, hypothesis testing (z-test, t-test, chi-square), ANOVA, and time series analysis.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Correlation & Regression Analysis',
            weightage: '30%',
            topics: [
              {
                id: 'asm-u1-t1',
                title: 'Karl Pearson Correlation & Linear Regression Lines',
                summary: 'Scatter diagrams, Pearson coefficient r, Spearman rank correlation, regression line equations of Y on X and X on Y.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Calculate Karl Pearson’s coefficient of correlation (r) for given bivariate data. Interpret the result.', marks: 7 },
                  { question: 'Derive regression equations of Y on X and X on Y using the method of least squares.', marks: 10 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Testing of Hypothesis & Large Sample Tests',
            weightage: '35%',
            topics: [
              {
                id: 'asm-u2-t1',
                title: 'Null Hypothesis, Type I/II Errors & Z-Test',
                summary: 'H0 vs H1, critical region, p-value, 1% and 5% level of significance, testing difference of means for large samples.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Type I and Type II errors in hypothesis testing with decision matrix diagram.', marks: 5 },
                  { question: 'Perform Z-test to check if two independent sample means differ significantly at 5% significance level.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Small Sample Tests & Chi-Square',
            weightage: '35%',
            topics: [
              {
                id: 'asm-u3-t1',
                title: 'Student’s t-Test & Chi-Square Test of Independence',
                summary: 'Degrees of freedom, paired t-test for before-and-after experiments, contingency tables, goodness of fit.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Chi-Square Test of Independence with formula, degrees of freedom, and contingency table calculation.', marks: 7 },
                  { question: 'Apply Paired t-Test for evaluating training program effectiveness.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA205',
        name: 'Mathematics-2',
        shortName: 'Maths-2',
        category: 'Mathematics',
        credits: 4,
        description: 'Integral calculus, definite integrals, differential equations, graph theory basics, and vector algebra.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Integral Calculus & Techniques',
            weightage: '35%',
            topics: [
              {
                id: 'm2-u1-t1',
                title: 'Integration by Substitution, Parts & Partial Fractions',
                summary: 'Standard integration formulas, definite integrals, Fundamental Theorem of Calculus, area under curves.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Evaluate definite integrals using Integration by Parts formula: int u dv = uv - int v du.', marks: 7 },
                  { question: 'Find area bounded between parabolas and straight lines using definite integrals.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Differential Equations of First Order',
            weightage: '35%',
            topics: [
              {
                id: 'm2-u2-t1',
                title: 'Variable Separable, Homogeneous & Linear Equations',
                summary: 'Order and degree, variable separable method, integrating factor (I.F.) for linear differential equations dy/dx + Py = Q.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Solve first order linear differential equations using Integrating Factor method.', marks: 7 },
                  { question: 'Solve homogeneous differential equations dy/dx = f(y/x) using substitution y = vx.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Introduction to Graph Theory',
            weightage: '30%',
            topics: [
              {
                id: 'm2-u3-t1',
                title: 'Graphs, Paths, Trees & Planar Graphs',
                summary: 'Vertices, edges, degree of vertex, Handshaking Lemma, Euler and Hamiltonian paths, spanning trees.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'State and prove the Handshaking Lemma for undirected graphs: sum deg(v) = 2|E|.', marks: 5 },
                  { question: 'Define Eulerian graph and Hamiltonian graph with examples and diagrams.', marks: 5 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA206',
        name: 'Data Analytics using Spreadsheet',
        shortName: 'Spreadsheet Analytics',
        category: 'Practical Applications',
        credits: 2,
        description: 'Advanced Excel modeling, What-If analysis, Goal Seek, Solver, statistical charting, and macro automation.',
        units: [
          {
            unitNumber: 1,
            unitName: 'What-If Analysis & Optimization',
            weightage: '50%',
            topics: [
              {
                id: 'das-u1-t1',
                title: 'Goal Seek, Data Tables & Solver Tool',
                summary: 'Scenario manager, one-variable and two-variable data tables, linear programming constraints using Solver.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Explain Goal Seek and Scenario Manager in Excel with a business break-even analysis example.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Advanced Data Visualization & Dashboards',
            weightage: '50%',
            topics: [
              {
                id: 'das-u2-t1',
                title: 'Interactive Dashboards, Slicers & Sparklines',
                summary: 'PivotCharts, slicers, timeline filters, conditional formatting with color scales, KPI indicator cards.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Design an interactive executive sales dashboard in Excel using Pivot Tables, Slicers, and Charts.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA207',
        name: 'Technical Writing',
        shortName: 'Tech Writing',
        category: 'Humanities & Soft Skills',
        credits: 2,
        description: 'Technical report preparation, project documentation, research abstracts, manual creation, and APA referencing.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Technical Reports & Proposals',
            weightage: '100%',
            topics: [
              {
                id: 'tw-u1-t1',
                title: 'Structure of Technical Project Report',
                summary: 'Title page, abstract, table of contents, introduction, methodology, results, conclusion, IEEE/APA references.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Outline the standard structure of an undergraduate software engineering technical project report.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA208',
        name: 'Professional Ethics',
        shortName: 'Ethics',
        category: 'Humanities & Values',
        credits: 2,
        description: 'Cyber ethics, intellectual property rights (IPR), software licensing, privacy regulations, and professional conduct.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Cyber Ethics & Intellectual Property',
            weightage: '100%',
            topics: [
              {
                id: 'pe-u1-t1',
                title: 'IPR, Patents, Copyright & Data Privacy',
                summary: 'Software piracy, open source vs proprietary licenses, digital rights, IT Act 2000, GDPR principles.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Explain Intellectual Property Rights (IPR) covering Copyrights, Patents, and Trademarks for software.', marks: 7 },
                  { question: 'Discuss major provisions and penal sections of the Information Technology Act (IT Act 2000).', marks: 7 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================
  // SEMESTER 3
  // ==========================================
  {
    semester: 3,
    title: 'Semester 3',
    description: 'Operating Systems, Java OOP, Computer Networks, Mathematical Foundation for AI, Web Projects & Version Control.',
    subjects: [
      {
        code: 'BCA301',
        name: 'Operating System',
        shortName: 'OS (Operating Systems)',
        category: 'Core Systems',
        credits: 4,
        description: 'Process management, CPU scheduling, inter-process communication, Deadlocks, memory management, virtual memory, file systems.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Introduction to OS & Process Management',
            weightage: '25%',
            topics: [
              {
                id: 'os-u1-t1',
                title: 'OS Roles, Dual-Mode Operation & System Calls',
                summary: 'Kernel vs User mode, Interrupt handling, System calls (fork, exec, wait, exit), monolithic vs microkernel.',
                importantMarks: [3, 5, 7, 10],
                examQuestions: [
                  { question: 'Explain Dual-Mode Operation (User Mode vs Kernel Mode) in modern operating systems and how privileged instructions are protected.', marks: 7 },
                  { question: 'What is a System Call? Explain the step-by-step mechanism of system call execution with a diagram.', marks: 7 }
                ]
              },
              {
                id: 'os-u1-t2',
                title: 'Process State Transitions & PCB',
                summary: 'New, Ready, Running, Waiting, Terminated states; Process Control Block (PCB) attributes, context switching.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Draw and explain the 5-State Process Transition Model in detail with triggers.', marks: 7 },
                  { question: 'What is a Process Control Block (PCB)? Detail the information maintained inside a PCB.', marks: 5 }
                ]
              },
              {
                id: 'os-u1-t3',
                title: 'CPU Scheduling Algorithms',
                summary: 'Preemptive vs Non-preemptive; FCFS, SJF, SRTF, Round Robin (RR), Priority Scheduling; Turnaround and Waiting times.',
                importantMarks: [5, 7, 10, 15],
                examQuestions: [
                  { question: 'Consider 4 processes with given Burst Times and Arrival Times. Draw Gantt Chart and calculate Average Turnaround and Waiting Times for Round Robin (Quantum = 2ms) and Shortest Remaining Time First (SRTF).', marks: 10 },
                  { question: 'Compare FCFS, SJF, and Round Robin scheduling algorithms with trade-offs.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Process Synchronization & Deadlocks',
            weightage: '30%',
            topics: [
              {
                id: 'os-u2-t1',
                title: 'Critical Section Problem & Semaphores',
                summary: 'Race condition, 3 requirements (Mutual Exclusion, Progress, Bounded Waiting); Peterson’s Solution; Counting and Binary Semaphores.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'What is the Critical Section problem? State and explain the three necessary criteria to solve it.', marks: 7 },
                  { question: 'Explain Counting Semaphores and Binary Semaphores with wait() (P) and signal() (V) atomic operations.', marks: 7 },
                  { question: 'Explain the classical Producer-Consumer Problem and its solution using Semaphores.', marks: 10 }
                ]
              },
              {
                id: 'os-u2-t2',
                title: 'Deadlock: 4 Coffman Conditions & Prevention',
                summary: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait; Resource Allocation Graph (RAG); Deadlock avoidance vs prevention.',
                importantMarks: [5, 7, 10, 15],
                examQuestions: [
                  { question: 'Define Deadlock in Operating Systems. Explain the four necessary Coffman conditions with real-life analogies. How can each condition be invalidated for prevention?', marks: 10 },
                  { question: 'Explain Banker\'s Algorithm for Deadlock Avoidance. Given Allocation, Max, and Available matrices, determine if the system is in a Safe State.', marks: 15 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Memory Management & Virtual Memory',
            weightage: '25%',
            topics: [
              {
                id: 'os-u3-t1',
                title: 'Paging, Segmentation & Address Translation',
                summary: 'Logical vs Physical address space; Page tables, Translation Lookaside Buffer (TLB), internal vs external fragmentation.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Paging hardware with address translation mechanism using Page Table and TLB. Draw neat schematic diagram.', marks: 10 },
                  { question: 'Differentiate between Paging and Segmentation with a comparative analysis table.', marks: 7 }
                ]
              },
              {
                id: 'os-u3-t2',
                title: 'Virtual Memory & Page Replacement Algorithms',
                summary: 'Demand paging, Page fault sequence, Belady’s anomaly, FIFO, Optimal (OPT), Least Recently Used (LRU) algorithms.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'For reference string: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2 with 3 frames, calculate page faults using FIFO, LRU, and Optimal algorithms.', marks: 10 },
                  { question: 'What is Belady\'s Anomaly? Demonstrate how FIFO page replacement suffers from it.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'File Systems & Storage Management',
            weightage: '20%',
            topics: [
              {
                id: 'os-u4-t1',
                title: 'File Allocation Methods & Disk Scheduling',
                summary: 'Contiguous, Linked, Indexed allocation; Disk scheduling: FCFS, SSTF, SCAN (Elevator), C-SCAN, LOOK.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Compare Contiguous, Linked, and Indexed file allocation methods with advantages and disadvantages.', marks: 7 },
                  { question: 'Explain SCAN and C-SCAN Disk Scheduling algorithms with head movement diagrams.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA302',
        name: 'Object Oriented Programming with Java',
        shortName: 'Java (OOP)',
        category: 'Core Programming',
        credits: 4,
        description: 'Java OOP concepts, JVM architecture, inheritance, polymorphism, interfaces, packages, exception handling, multithreading, collections.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Java Architecture & Language Basics',
            weightage: '20%',
            topics: [
              {
                id: 'java-u1-t1',
                title: 'Java Features, JVM, JRE, and JDK Architecture',
                summary: 'Platform independence, bytecode, JVM execution engine, JIT compiler, ClassLoader, garbage collection.',
                importantMarks: [3, 5, 7, 10],
                examQuestions: [
                  { question: 'Explain JVM (Java Virtual Machine) Architecture with neat block diagram covering ClassLoader, Memory areas, and Execution Engine.', marks: 10 },
                  { question: 'Why is Java called platform-independent and secure? Discuss the role of Bytecode and JVM.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Core OOP Principles in Java',
            weightage: '30%',
            topics: [
              {
                id: 'java-u2-t1',
                title: 'Classes, Objects, Constructors & this Keyword',
                summary: 'Object instantiation, default vs parameterized constructors, constructor overloading, constructor chaining with this().',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Explain Constructor Overloading and Constructor Chaining in Java with complete code examples.', marks: 7 },
                  { question: 'Explain the significance and usages of \'this\' keyword in Java.', marks: 5 }
                ]
              },
              {
                id: 'java-u2-t2',
                title: 'Inheritance & Method Overriding',
                summary: 'Single, Multilevel, Hierarchical inheritance; super keyword; runtime polymorphism; final keyword with classes and methods.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'What is Polymorphism? Differentiate between Method Overloading (Compile-time) and Method Overriding (Runtime) with Java programs.', marks: 10 },
                  { question: 'Explain the \'super\' keyword in Java for invoking superclass constructors and methods.', marks: 5 }
                ]
              },
              {
                id: 'java-u2-t3',
                title: 'Abstract Classes & Interfaces',
                summary: 'Pure abstraction, default and static methods in interfaces, multiple inheritance realization in Java.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Compare Abstract Class and Interface in Java with a structural comparison table and code sample.', marks: 7 },
                  { question: 'Demonstrate how Java achieves Multiple Inheritance using Interfaces.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Packages, Exceptions & Multithreading',
            weightage: '30%',
            topics: [
              {
                id: 'java-u3-t1',
                title: 'Packages & Access Specifiers',
                summary: 'User-defined packages, classpath, private, default, protected, public access scopes across packages.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Explain Access Specifiers in Java (private, default, protected, public) with visibility matrix.', marks: 5 },
                  { question: 'Write steps and code to create and import a user-defined package in Java.', marks: 5 }
                ]
              },
              {
                id: 'java-u3-t2',
                title: 'Exception Handling Mechanism',
                summary: 'try, catch, finally, throw, throws; checked vs unchecked exceptions; creating custom user exceptions.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Exception Handling hierarchy in Java. Write a program demonstrating try, catch, and finally blocks.', marks: 7 },
                  { question: 'How do you create and throw a Custom (User-defined) Exception in Java? Give a bank insufficient balance example.', marks: 7 }
                ]
              },
              {
                id: 'java-u3-t3',
                title: 'Multithreading & Thread Synchronization',
                summary: 'Thread lifecycle, Thread class vs Runnable interface, sleep(), join(), synchronized keyword, inter-thread communication (wait, notify).',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the Life Cycle of a Thread in Java with state diagram. Compare extending Thread class vs implementing Runnable interface.', marks: 10 },
                  { question: 'Why is Thread Synchronization necessary in Java? Demonstrate synchronized methods with code.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'Collections Framework & File Streams',
            weightage: '20%',
            topics: [
              {
                id: 'java-u4-t1',
                title: 'Java Collections: List, Set, and Map',
                summary: 'ArrayList, LinkedList, HashSet, HashMap, Iterator, Generics in Java.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Java Collection Framework hierarchy. Differentiate between ArrayList and LinkedList with internal working.', marks: 7 },
                  { question: 'Explain HashMap in Java: internal working of hashing, buckets, and collision resolution.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA303',
        name: 'Computer Networking',
        shortName: 'CN (Networking)',
        category: 'Core Systems',
        credits: 4,
        description: 'OSI 7-layer model, TCP/IP protocol suite, transmission media, framing, IP addressing, subnetting, routing, transport layer protocols.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Network Models & Physical Layer',
            weightage: '25%',
            topics: [
              {
                id: 'cn-u1-t1',
                title: 'OSI 7-Layer Reference Model vs TCP/IP Suite',
                summary: 'Physical, Data Link, Network, Transport, Session, Presentation, Application layers; encapsulation and protocol data units (PDU).',
                importantMarks: [5, 7, 10, 15],
                examQuestions: [
                  { question: 'Explain the OSI 7-Layer Reference Model in detail. State the primary responsibilities and protocols of each layer with neat diagram.', marks: 15 },
                  { question: 'Compare OSI Reference Model with TCP/IP Protocol Suite with layer mapping diagram.', marks: 7 }
                ]
              },
              {
                id: 'cn-u1-t2',
                title: 'Transmission Media & Network Topologies',
                summary: 'Twisted pair, Coaxial, Fiber optic cables; Mesh, Star, Bus, Ring topologies; circuit vs packet switching.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Compare Star, Mesh, and Bus network topologies with diagrams, advantages, and disadvantages.', marks: 7 },
                  { question: 'Compare Guided media (Fiber Optic, UTP) vs Unguided wireless transmission.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Data Link Layer & Error Control',
            weightage: '25%',
            topics: [
              {
                id: 'cn-u2-t1',
                title: 'Framing, Error Detection (CRC) & Sliding Window',
                summary: 'Bit stuffing, Byte stuffing; Cyclic Redundancy Check (CRC), Checksum; Stop-and-Wait, Go-Back-N, Selective Repeat ARQ.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Cyclic Redundancy Check (CRC) error detection method with a polynomial division numerical example.', marks: 10 },
                  { question: 'Explain Go-Back-N and Selective Repeat Sliding Window protocols with sequence diagrams.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Network Layer, IP Addressing & Routing',
            weightage: '25%',
            topics: [
              {
                id: 'cn-u3-t1',
                title: 'IPv4 Addressing, Subnetting & CIDR',
                summary: 'Class A, B, C, D, E addresses; Subnet masks, network ID, broadcast ID, CIDR slash notation, IPv6 comparison.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Classful IPv4 Addressing. Given IP address 192.168.10.45/26, determine Network Address, Broadcast Address, and Subnet Mask.', marks: 10 },
                  { question: 'Differentiate between IPv4 and IPv6 packet headers and address spaces.', marks: 5 }
                ]
              },
              {
                id: 'cn-u3-t2',
                title: 'Routing Protocols: Distance Vector vs Link State',
                summary: 'Distance Vector Routing (Bellman-Ford, Count-to-Infinity problem); Link State Routing (Dijkstra algorithm, OSPF).',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Link State Routing algorithm using Dijkstra shortest path algorithm with a network graph example.', marks: 10 },
                  { question: 'Explain Distance Vector Routing and the Count-to-Infinity problem.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 4,
            unitName: 'Transport & Application Layer Protocols',
            weightage: '25%',
            topics: [
              {
                id: 'cn-u4-t1',
                title: 'TCP vs UDP Protocols & 3-Way Handshake',
                summary: 'Connection-oriented vs connectionless, 3-way handshake (SYN, SYN-ACK, ACK), sliding window flow control, congestion avoidance.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Compare TCP and UDP protocols in detail across connection type, header size, speed, and use cases. Illustrate the TCP 3-way handshake.', marks: 10 },
                  { question: 'Explain DNS (Domain Name System) architecture, query resolution process, and DNS record types.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA304',
        name: 'Mathematical Foundation for AI',
        shortName: 'Maths for AI',
        category: 'AI & Data Science',
        credits: 4,
        description: 'Linear algebra (vectors, matrices, eigenvalues), multivariable calculus (gradients, partial derivatives), and probability foundations for ML.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Linear Algebra for Machine Learning',
            weightage: '35%',
            topics: [
              {
                id: 'mfai-u1-t1',
                title: 'Vector Spaces, Dot Products & Matrix Decomposition',
                summary: 'Vector spaces, linear independence, dot and cross products, orthogonal matrices, Eigenvalues and Eigenvectors.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Find Eigenvalues and corresponding Eigenvectors for a given 2x2 or 3x3 matrix.', marks: 7 },
                  { question: 'Explain the geometric intuition of Principal Component Analysis (PCA) and Eigen decomposition.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Multivariable Calculus & Gradient Descent',
            weightage: '35%',
            topics: [
              {
                id: 'mfai-u2-t1',
                title: 'Partial Derivatives, Gradient Vector & Gradient Descent',
                summary: 'Partial differentiation, Jacobian matrix, Hessian matrix, learning rate, Batch vs Stochastic Gradient Descent.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Gradient Descent optimization algorithm with mathematical derivation, learning rate tuning, and loss curve graph.', marks: 10 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Probability & Information Theory for AI',
            weightage: '30%',
            topics: [
              {
                id: 'mfai-u3-t1',
                title: 'Entropy, Cross-Entropy & Maximum Likelihood',
                summary: 'Shannon Entropy, Cross-Entropy loss in neural networks, Kullback-Leibler (KL) divergence, Maximum Likelihood Estimation (MLE).',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Define Entropy and Cross-Entropy loss. Explain why cross-entropy is preferred in classification neural networks.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA305',
        name: 'Web Development Project',
        shortName: 'Web Project',
        category: 'Project & Practical',
        credits: 2,
        description: 'Full-stack dynamic web development project applying database design, backend APIs, responsive frontends, and authentication.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Full-Stack Architecture & Deployment',
            weightage: '100%',
            topics: [
              {
                id: 'wdp-u1-t1',
                title: 'MVC Architecture, REST APIs & Session Auth',
                summary: 'Model-View-Controller design pattern, RESTful endpoint conventions, token and session auth, project documentation.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the Model-View-Controller (MVC) architectural pattern with a data-flow diagram.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA306',
        name: 'Version Controlling',
        shortName: 'Git & GitHub',
        category: 'Practical Tools',
        credits: 2,
        description: 'Git distributed version control, commit history, branching strategies, merge conflicts, GitHub remote repositories, and PR workflows.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Git Basics, Branching & Collaborative Workflows',
            weightage: '100%',
            topics: [
              {
                id: 'vc-u1-t1',
                title: 'Git Commands, Branching & Resolving Merge Conflicts',
                summary: 'git init, add, commit, push, pull, branch, checkout, merge, rebase, resolving merge conflicts, pull request workflow.',
                importantMarks: [3, 5, 7, 10],
                examQuestions: [
                  { question: 'Explain Git three-tree architecture (Working Directory, Staging Area, Repository) with command transitions.', marks: 7 },
                  { question: 'Explain the step-by-step process of creating a branch, resolving a merge conflict, and submitting a Pull Request in Git/GitHub.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA307',
        name: 'Design Thinking and Innovation',
        shortName: 'Design Thinking',
        category: 'Interdisciplinary',
        credits: 2,
        description: 'Human-centered design mindset: Empathize, Define, Ideate, Prototype, and Test frameworks for software innovations.',
        units: [
          {
            unitNumber: 1,
            unitName: 'The 5-Stage Design Thinking Framework',
            weightage: '100%',
            topics: [
              {
                id: 'dti-u1-t1',
                title: 'Empathize, Define, Ideate, Prototype, and Test',
                summary: 'User empathy maps, problem statement framing, brainstorming, low-fidelity wireframing, user feedback loops.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the five stages of the Design Thinking process with a practical software product case study.', marks: 10 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================
  // SEMESTER 4
  // ==========================================
  {
    semester: 4,
    title: 'Semester 4',
    description: 'Python Programming, Software Engineering, Mobile Application Development, Information Security, and Cloud Computing.',
    subjects: [
      {
        code: 'BCA401',
        name: 'Python Programming',
        shortName: 'Python',
        category: 'Core Programming',
        credits: 4,
        description: 'Python syntax, control flow, data structures (Lists, Tuples, Dictionaries, Sets), OOP, File I/O, NumPy, and Pandas basics.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Python Foundations & Data Structures',
            weightage: '30%',
            topics: [
              {
                id: 'py-u1-t1',
                title: 'Lists, Tuples, Dictionaries & List Comprehension',
                summary: 'Mutable vs immutable structures, slicing, dictionary key-value methods, list comprehensions, lambda functions.',
                importantMarks: [3, 5, 7],
                examQuestions: [
                  { question: 'Differentiate between List and Tuple in Python with syntax, mutability, and performance examples.', marks: 5 },
                  { question: 'Explain List Comprehension in Python with syntax and examples converting conventional loops.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'OOP, Modules & File Handling in Python',
            weightage: '35%',
            topics: [
              {
                id: 'py-u2-t1',
                title: 'Classes, __init__, Inheritance & Exception Handling',
                summary: 'Class instantiation, self parameter, constructor __init__, try-except-finally blocks, reading and writing files.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Demonstrate Object Oriented Programming in Python: define a class with __init__ constructor and show inheritance.', marks: 7 },
                  { question: 'Explain file handling in Python: open(), read(), write(), and the \'with\' statement.', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Data Science Libraries: NumPy & Pandas',
            weightage: '35%',
            topics: [
              {
                id: 'py-u3-t1',
                title: 'NumPy Arrays & Pandas DataFrames',
                summary: 'ndarray operations, broadcasting, Pandas Series and DataFrame, filtering, groupby, reading CSV files.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain NumPy array creation, slicing, and broadcasting with code examples.', marks: 7 },
                  { question: 'Explain Pandas DataFrame operations: loading CSV, selecting columns, filtering rows, and groupby aggregations.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA402',
        name: 'Software Engineering',
        shortName: 'SE (Software Engg)',
        category: 'Core Computer Science',
        credits: 4,
        description: 'SDLC models (Waterfall, Spiral, Agile Scrum), SRS documentation, UML diagrams, software testing, and maintenance.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Software Process Models & Agile',
            weightage: '30%',
            topics: [
              {
                id: 'se-u1-t1',
                title: 'Waterfall, Spiral Model & Agile Scrum Framework',
                summary: 'Phases of SDLC; sequential vs iterative models; Agile principles, Scrum roles (Product Owner, Scrum Master), sprints.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Compare Waterfall Model and Spiral Model with diagrams, strengths, and risk-management trade-offs.', marks: 7 },
                  { question: 'Explain the Agile Scrum methodology: Scrum Team roles, Sprint planning, Daily Standup, and Sprint Retrospective.', marks: 10 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Software Requirements Specification & UML Modeling',
            weightage: '35%',
            topics: [
              {
                id: 'se-u2-t1',
                title: 'SRS Characteristics, Use Case & Class Diagrams',
                summary: 'Functional vs non-functional requirements; IEEE 830 SRS standard; Use Case Diagrams, Class Diagrams, Sequence Diagrams.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'What is SRS? Explain the characteristics of a good Software Requirements Specification document according to IEEE standards.', marks: 7 },
                  { question: 'Draw Use Case Diagram and Class Diagram for an Online Food Delivery or Hospital Management System.', marks: 10 }
                ]
              }
            ]
          },
          {
            unitNumber: 3,
            unitName: 'Software Testing & Quality Assurance',
            weightage: '35%',
            topics: [
              {
                id: 'se-u3-t1',
                title: 'White-Box vs Black-Box Testing & Verification/Validation',
                summary: 'Unit, Integration, System, Acceptance testing; Boundary Value Analysis (BVA), Equivalence Partitioning; Cyclomatic Complexity.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Compare Black-Box Testing and White-Box Testing. Explain Boundary Value Analysis (BVA) and Equivalence Class Partitioning.', marks: 10 },
                  { question: 'Explain Cyclomatic Complexity with Control Flow Graph calculation.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA403',
        name: 'Mobile Application Development',
        shortName: 'Mobile App (Android/Flutter)',
        category: 'Mobile Computing',
        credits: 4,
        description: 'Android architecture, Activity lifecycle, UI layouts, Intents, SQLite local storage, and modern cross-platform development.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Android Architecture & Activity Lifecycle',
            weightage: '50%',
            topics: [
              {
                id: 'mad-u1-t1',
                title: 'Android Stack & Activity Lifecycle States',
                summary: 'Linux kernel, HAL, native libraries, Android runtime (ART), Application Framework; onCreate, onStart, onResume, onPause, onStop, onDestroy.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the Android OS Architecture stack with block diagram.', marks: 10 },
                  { question: 'Explain the Activity Lifecycle in Android with state transition diagram and callback methods.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Intents, UI Layouts & SQLite Storage',
            weightage: '50%',
            topics: [
              {
                id: 'mad-u2-t1',
                title: 'Explicit vs Implicit Intents & SQLite Database',
                summary: 'Linear, Relative, Constraint layouts; passing data between Activities via Intent extras; SQLiteOpenHelper CRUD queries.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Differentiate between Explicit and Implicit Intents with code snippets.', marks: 5 },
                  { question: 'Write steps and code to perform CRUD operations using SQLiteOpenHelper in Android.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA404',
        name: 'Information Security',
        shortName: 'InfoSec',
        category: 'Cybersecurity',
        credits: 4,
        description: 'CIA triad, cryptography (Symmetric vs Asymmetric), RSA algorithm, digital signatures, firewalls, and network vulnerabilities.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Security Principles & Cryptography',
            weightage: '100%',
            topics: [
              {
                id: 'is-u1-t1',
                title: 'CIA Triad, Symmetric vs Asymmetric Cryptography & RSA',
                summary: 'Confidentiality, Integrity, Availability; DES, AES; Public-Private key cryptography, RSA mathematical calculation, Hash functions (SHA-256).',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the CIA Triad in Information Security with real-world security violations.', marks: 5 },
                  { question: 'Explain the RSA algorithm with step-by-step mathematical key generation and encryption/decryption numerical.', marks: 10 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA405',
        name: 'Cloud Computing',
        shortName: 'Cloud Computing',
        category: 'Emerging Tech',
        credits: 3,
        description: 'NIST cloud definition, service models (IaaS, PaaS, SaaS), deployment models (Public, Private, Hybrid), virtualization, containers.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Cloud Architecture, Service Models & Virtualization',
            weightage: '100%',
            topics: [
              {
                id: 'cc-u1-t1',
                title: 'IaaS, PaaS, SaaS & Hypervisor Virtualization',
                summary: 'Cloud characteristics (on-demand self-service, broad network access, resource pooling, rapid elasticity); Type 1 and Type 2 hypervisors.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Compare IaaS, PaaS, and SaaS cloud service delivery models with examples and responsibility matrices.', marks: 7 },
                  { question: 'Explain Virtualization in Cloud Computing. Compare Type-1 (Bare-Metal) and Type-2 (Hosted) Hypervisors.', marks: 7 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================
  // SEMESTER 5
  // ==========================================
  {
    semester: 5,
    title: 'Semester 5',
    description: 'Machine Learning, Web Frameworks (Node.js/React), Cyber Forensics, Big Data Analytics, and Mini Project.',
    subjects: [
      {
        code: 'BCA501',
        name: 'Machine Learning',
        shortName: 'ML',
        category: 'AI & Data Science',
        credits: 4,
        description: 'Supervised vs Unsupervised learning, Linear Regression, Logistic Regression, Decision Trees, K-Means clustering, Neural Networks.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Supervised Learning Algorithms',
            weightage: '50%',
            topics: [
              {
                id: 'ml-u1-t1',
                title: 'Linear & Logistic Regression, Decision Trees',
                summary: 'Cost functions, Gradient descent, Sigmoid activation, Information Gain, Gini Impurity, Confusion Matrix, Precision, Recall.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Linear Regression and cost function optimization using Gradient Descent.', marks: 7 },
                  { question: 'Explain Confusion Matrix and calculate Accuracy, Precision, Recall, and F1-Score for a medical prediction model.', marks: 7 },
                  { question: 'Explain Decision Tree construction using Entropy and Information Gain.', marks: 10 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Unsupervised Learning & Deep Learning Basics',
            weightage: '50%',
            topics: [
              {
                id: 'ml-u2-t1',
                title: 'K-Means Clustering, PCA & Artificial Neural Networks',
                summary: 'Centroid initialization, Elbow method, Perceptron model, Multi-Layer Perceptron (MLP), backpropagation algorithm.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain K-Means Clustering algorithm with step-by-step flowchart and the Elbow method for choosing K.', marks: 7 },
                  { question: 'Explain the working of an Artificial Neural Network (Perceptron, Activation functions, Backpropagation).', marks: 10 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA502',
        name: 'Web Frameworks',
        shortName: 'React & Node.js (MERN)',
        category: 'Web Development',
        credits: 4,
        description: 'React component architecture, JSX, hooks (useState, useEffect), Node.js runtime, Express routing, MongoDB integration.',
        units: [
          {
            unitNumber: 1,
            unitName: 'React.js Component Architecture',
            weightage: '50%',
            topics: [
              {
                id: 'wf-u1-t1',
                title: 'React Components, Props, State & Hooks',
                summary: 'Functional components, Virtual DOM reconciliation, useState, useEffect, controlled components, context API.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Virtual DOM in React and how reconciliation algorithm improves rendering performance.', marks: 7 },
                  { question: 'Explain useState and useEffect React Hooks with practical asynchronous data fetching code.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Node.js & Express RESTful APIs',
            weightage: '50%',
            topics: [
              {
                id: 'wf-u2-t1',
                title: 'Event Loop, Middleware & REST Endpoints',
                summary: 'Non-blocking I/O event loop, Express routing, custom middleware, JWT authentication, MongoDB Mongoose schema.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the Node.js Event Loop architecture and non-blocking asynchronous I/O model.', marks: 7 },
                  { question: 'Write an Express.js backend script defining REST API routes (GET, POST, PUT, DELETE) with error handling middleware.', marks: 10 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA503',
        name: 'Cyber Security & Forensics',
        shortName: 'Cyber Forensics',
        category: 'Cybersecurity',
        credits: 4,
        description: 'Digital evidence collection, chain of custody, memory analysis, web application security (OWASP Top 10), penetration testing basics.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Digital Forensics & Incident Response',
            weightage: '50%',
            topics: [
              {
                id: 'csf-u1-t1',
                title: 'Evidence Acquisition, Chain of Custody & File System Forensics',
                summary: 'Volatile vs non-volatile memory, bitstream disk imaging, hash verification (MD5/SHA1), legal admissibility.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the Digital Forensics Investigation Process (Identification, Preservation, Collection, Analysis, Reporting).', marks: 10 },
                  { question: 'What is Chain of Custody? Why is it crucial in courtroom presentation of digital evidence?', marks: 5 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'OWASP Top 10 & Web Vulnerabilities',
            weightage: '50%',
            topics: [
              {
                id: 'csf-u2-t1',
                title: 'SQL Injection, Cross-Site Scripting (XSS) & CSRF',
                summary: 'SQLi detection and remediation, Stored vs Reflected XSS, Cross-Site Request Forgery tokens, security headers.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain SQL Injection (SQLi) attack mechanism with vulnerable code and secure prepared statements remediation.', marks: 7 },
                  { question: 'Explain Cross-Site Scripting (XSS) attacks (Stored, Reflected, DOM-based) and prevention techniques.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA504',
        name: 'Big Data Analytics',
        shortName: 'Big Data',
        category: 'Data Science',
        credits: 3,
        description: '5 Vs of Big Data, Hadoop HDFS architecture, MapReduce programming paradigm, NoSQL databases, Apache Spark overview.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Hadoop HDFS Architecture & MapReduce',
            weightage: '100%',
            topics: [
              {
                id: 'bda-u1-t1',
                title: 'HDFS NameNode/DataNode & MapReduce Workflow',
                summary: '5 Vs (Volume, Velocity, Variety, Veracity, Value); HDFS block replication; Map, Shuffle and Sort, Reduce phases.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain HDFS (Hadoop Distributed File System) Architecture with NameNode, DataNode, and block replication.', marks: 10 },
                  { question: 'Explain MapReduce execution workflow with a Word Count example.', marks: 7 }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================
  // SEMESTER 6
  // ==========================================
  {
    semester: 6,
    title: 'Semester 6',
    description: 'Industry Capstone Project, Advanced Technologies (IoT / Blockchain / AI Ethics), and Professional Seminar.',
    subjects: [
      {
        code: 'BCA601',
        name: 'Internet of Things (IoT)',
        shortName: 'IoT',
        category: 'Emerging Tech',
        credits: 4,
        description: 'IoT architecture, sensor interfacing, microcontrollers (Arduino/Raspberry Pi), communication protocols (MQTT, CoAP), cloud IoT platforms.',
        units: [
          {
            unitNumber: 1,
            unitName: 'IoT Architecture & Sensing Protocols',
            weightage: '50%',
            topics: [
              {
                id: 'iot-u1-t1',
                title: 'IoT 4-Layer Architecture, Sensors & MQTT Protocol',
                summary: 'Perception, Network, Middleware, Application layers; analog vs digital sensors; publish-subscribe MQTT vs HTTP.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain the 4-layer IoT Architecture with functional components at each layer.', marks: 10 },
                  { question: 'Compare MQTT and HTTP protocols for resource-constrained IoT devices.', marks: 7 }
                ]
              }
            ]
          },
          {
            unitNumber: 2,
            unitName: 'Microcontrollers & Smart Applications',
            weightage: '50%',
            topics: [
              {
                id: 'iot-u2-t1',
                title: 'Arduino/Raspberry Pi & Smart City/Home Systems',
                summary: 'GPIO pins, PWM, I2C, SPI communication; smart agriculture, home automation, industrial IoT use cases.',
                importantMarks: [5, 7],
                examQuestions: [
                  { question: 'Design an IoT-based Smart Agriculture Monitoring System with block diagram, sensors, and cloud communication.', marks: 10 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA602',
        name: 'Blockchain Technology',
        shortName: 'Blockchain',
        category: 'Emerging Tech',
        credits: 4,
        description: 'Decentralized ledgers, cryptographic hashes, Merkle trees, consensus algorithms (PoW, PoS), smart contracts, Ethereum.',
        units: [
          {
            unitNumber: 1,
            unitName: 'Blockchain Foundations & Consensus',
            weightage: '100%',
            topics: [
              {
                id: 'bc-u1-t1',
                title: 'Block Architecture, Merkle Tree, PoW & Smart Contracts',
                summary: 'Block header, nonce, difficulty, Merkle root; Proof of Work vs Proof of Stake; Solidity smart contract execution on EVM.',
                importantMarks: [5, 7, 10],
                examQuestions: [
                  { question: 'Explain Blockchain internal architecture: Block header, previous block hash, nonce, and Merkle tree.', marks: 10 },
                  { question: 'Compare Proof of Work (PoW) and Proof of Stake (PoS) consensus mechanisms with security and energy trade-offs.', marks: 7 }
                ]
              }
            ]
          }
        ]
      },
      {
        code: 'BCA603',
        name: 'Major Industry Capstone Project',
        shortName: 'Major Project',
        category: 'Industry Capstone',
        credits: 12,
        description: 'Full-lifecycle software development project executed according to industry Agile standards, complete with live deployment and viva.',
        units: [
          {
            unitNumber: 1,
            unitName: 'End-to-End Software Engineering & Deployment',
            weightage: '100%',
            topics: [
              {
                id: 'mp-u1-t1',
                title: 'Project Lifecycle, Architecture, Testing & Presentation',
                summary: 'Problem formulation, feasibility analysis, database design, API security, automated CI/CD deployment, viva defense.',
                importantMarks: [10, 15],
                examQuestions: [
                  { question: 'Present the architectural design, entity relationship model, and security protocols of your Capstone Project.', marks: 15 }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * Helper API and Search Utilities for the GTU BCA Curriculum.
 * Designed so that when we connect a remote database later (Firestore, Supabase),
 * only this file's functions need to adapt their data-fetching promises!
 */

export function getAllSemesters(): number[] {
  return GTU_BCA_CURRICULUM.map((s) => s.semester);
}

export function getCurriculumBySemester(semester: number): GTUSemesterCurriculum | undefined {
  return GTU_BCA_CURRICULUM.find((s) => s.semester === semester);
}

export function getAllSubjects(): (GTUSubject & { semester: number })[] {
  const list: (GTUSubject & { semester: number })[] = [];
  GTU_BCA_CURRICULUM.forEach((sem) => {
    sem.subjects.forEach((subj) => {
      list.push({ ...subj, semester: sem.semester });
    });
  });
  return list;
}

export function findSubjectByCodeOrName(query: string): (GTUSubject & { semester: number }) | undefined {
  const q = query.trim().toLowerCase();
  for (const sem of GTU_BCA_CURRICULUM) {
    for (const subj of sem.subjects) {
      if (
        subj.code.toLowerCase() === q ||
        subj.name.toLowerCase().includes(q) ||
        subj.shortName?.toLowerCase().includes(q)
      ) {
        return { ...subj, semester: sem.semester };
      }
    }
  }
  return undefined;
}

export function getAllGTUSubjectsFlat(): SubjectItem[] {
  const list: SubjectItem[] = [];
  for (const sem of GTU_BCA_CURRICULUM) {
    for (const subj of sem.subjects) {
      let icon = 'layers';
      const n = subj.name.toLowerCase();
      if (n.includes('java') || n.includes('python') || n.includes('c programming') || n.includes('c++') || n.includes('.net') || n.includes('php')) {
        icon = 'code';
      } else if (n.includes('network') || n.includes('web') || n.includes('internet') || n.includes('cloud')) {
        icon = 'network';
      } else if (n.includes('database') || n.includes('dbms') || n.includes('data structure')) {
        icon = 'layers';
      } else if (n.includes('operating system') || n.includes('unix') || n.includes('linux') || n.includes('hardware')) {
        icon = 'cpu';
      } else if (n.includes('math') || n.includes('statistical')) {
        icon = 'math';
      } else if (n.includes('design') || n.includes('software engineering') || n.includes('e-commerce')) {
        icon = 'design';
      }

      list.push({
        id: `gtu-${subj.code.toLowerCase()}`,
        name: subj.name,
        code: subj.code,
        iconName: icon,
        category: subj.category,
        semester: sem.semester,
      });
    }
  }
  return list;
}

export interface SearchResultItem {
  semester: number;
  subjectCode: string;
  subjectName: string;
  unitNumber?: number;
  unitName?: string;
  topicId?: string;
  topicTitle?: string;
  type: 'subject' | 'unit' | 'topic';
  matchText: string;
}

export function searchGTUBcaCurriculum(query: string): SearchResultItem[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  for (const sem of GTU_BCA_CURRICULUM) {
    for (const subj of sem.subjects) {
      // Check subject match
      if (
        subj.name.toLowerCase().includes(q) ||
        subj.code.toLowerCase().includes(q) ||
        subj.shortName?.toLowerCase().includes(q)
      ) {
        results.push({
          semester: sem.semester,
          subjectCode: subj.code,
          subjectName: subj.name,
          type: 'subject',
          matchText: `${subj.code}: ${subj.name}`,
        });
      }

      // Check units and topics
      for (const unit of subj.units) {
        if (unit.unitName.toLowerCase().includes(q)) {
          results.push({
            semester: sem.semester,
            subjectCode: subj.code,
            subjectName: subj.name,
            unitNumber: unit.unitNumber,
            unitName: unit.unitName,
            type: 'unit',
            matchText: `Unit ${unit.unitNumber}: ${unit.unitName}`,
          });
        }

        for (const topic of unit.topics) {
          if (
            topic.title.toLowerCase().includes(q) ||
            topic.summary.toLowerCase().includes(q) ||
            topic.examQuestions?.some((eq) => eq.question.toLowerCase().includes(q))
          ) {
            results.push({
              semester: sem.semester,
              subjectCode: subj.code,
              subjectName: subj.name,
              unitNumber: unit.unitNumber,
              unitName: unit.unitName,
              topicId: topic.id,
              topicTitle: topic.title,
              type: 'topic',
              matchText: topic.title,
            });
          }
        }
      }
    }
  }

  return results.slice(0, 20);
}
