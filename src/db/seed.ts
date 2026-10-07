import curriculumDataRaw from "../data/curriculumData.json" with { type: "json" };
import { GTU_BCA_CURRICULUM } from "../data/gtuBcaCurriculum";
import { GTU_QUESTION_PAPERS } from "../data/gtuPapersData";
import { AppDatabase } from "./connection";
import { computeQuestionHash, hashPasswordScrypt } from "./hash";

interface CanonicalTopicSource {
  id: string;
  title: string;
  summary: string;
}

interface CanonicalUnitSource {
  unitNumber: number;
  unitName: string;
  topics: CanonicalTopicSource[];
  examQuestions?: string[];
}

interface CanonicalSubjectSource {
  semester: number;
  code: string;
  name: string;
  shortName: string;
  description: string;
  units: CanonicalUnitSource[];
}

export interface SeedCuratedQuestion {
  subjectCode: string;
  unitNumber: number;
  language: "en" | "hi";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

/**
 * Approved Paper Mappings Contract (Phase 1.1 & Phase 1.2):
 * - Direct canonical matches: BCA101, BCA102, BCA103 (unavailable), BCA202, BCA302
 * - Explicit approved remappings:
 *   - Data Structures (gtu-paper-sem3-ds-2025-winter) → BCA201
 *   - Operating System (gtu-paper-sem4-os-2026-summer) → BCA301
 *   - Computer Networks (gtu-paper-sem4-cn-2025-winter) → BCA303
 *   - Python Programming (gtu-paper-sem5-python-2026-summer) → BCA401
 *   - React/Node (gtu-paper-sem6-web-2026-summer) → BCA502
 * - Explicit quarantines / exclusions:
 *   - C++ (gtu-paper-sem2-cpp-2026-summer) → QUARANTINE / EXCLUDE
 *   - Ambiguous/shifted unverified placeholders → QUARANTINE / EXCLUDE
 */
export const APPROVED_PAPER_TARGET_CODE_BY_ID: Record<
  string,
  | { action: "map"; targetSubjectCode: string; remapNote?: string }
  | { action: "quarantine"; reason: string }
> = {
  "gtu-paper-sem1-fco-2026-summer": {
    action: "map",
    targetSubjectCode: "BCA101",
  },
  "gtu-paper-sem1-cp-2025-winter": {
    action: "map",
    targetSubjectCode: "BCA102",
  },
  "gtu-paper-sem1-wt-2026-summer": {
    action: "map",
    targetSubjectCode: "BCA103",
  },
  "gtu-paper-sem1-math-2025-winter": {
    action: "quarantine",
    reason:
      "Ambiguous subject mapping: source paper has code BCA104 with title 'Computational Discrete Mathematics' (unavailable placeholder), whereas canonical BCA104 is 'Fundamentals of Statistical Methods' and BCA105 is 'Mathematics-1'. Quarantined without guessing.",
  },
  "gtu-paper-sem2-cpp-2026-summer": {
    action: "quarantine",
    reason:
      "Approved Phase 1.2 Exclusion: C++ paper ('Object-Oriented Programming with C++', legacy code BCA201) quarantined because no canonical C++ subject exists in the GTU BCA curriculum.",
  },
  "gtu-paper-sem2-dbms-2025-winter": {
    action: "map",
    targetSubjectCode: "BCA202",
  },
  "gtu-paper-sem3-ds-2025-winter": {
    action: "map",
    targetSubjectCode: "BCA201",
    remapNote: "Approved Phase 1.2 Mapping: Data Structures → BCA201 (Sem 2)",
  },
  "gtu-paper-sem3-java-2026-summer": {
    action: "map",
    targetSubjectCode: "BCA302",
  },
  "gtu-paper-sem4-os-2026-summer": {
    action: "map",
    targetSubjectCode: "BCA301",
    remapNote: "Approved Phase 1.2 Mapping: Operating System → BCA301 (Sem 3)",
  },
  "gtu-paper-sem4-cn-2025-winter": {
    action: "map",
    targetSubjectCode: "BCA303",
    remapNote: "Approved Phase 1.2 Mapping: Computer Networks → BCA303 (Sem 3)",
  },
  "gtu-paper-sem5-python-2026-summer": {
    action: "map",
    targetSubjectCode: "BCA401",
    remapNote: "Approved Phase 1.2 Mapping: Python Programming → BCA401 (Sem 4)",
  },
  "gtu-paper-sem5-se-2025-winter": {
    action: "quarantine",
    reason:
      "Ambiguous shifted unavailable placeholder: source paper has Sem 5 code BCA502 with title 'Software Engineering & Agile Methodologies' (isAvailable: false), whereas canonical BCA502 is 'Web Frameworks' and 'Software Engineering' is Sem 4 BCA402. Quarantined without guessing.",
  },
  "gtu-paper-sem6-web-2026-summer": {
    action: "map",
    targetSubjectCode: "BCA502",
    remapNote: "Approved Phase 1.2 Mapping: React/Node → BCA502 (Sem 5)",
  },
  "gtu-paper-sem6-cloud-2025-winter": {
    action: "quarantine",
    reason:
      "Ambiguous shifted unavailable placeholder: source paper has Sem 6 code BCA602 with title 'Cloud Computing & DevOps' (isAvailable: false), whereas canonical BCA602 is 'Blockchain Technology' and 'Cloud Computing' is Sem 4 BCA405. Quarantined without guessing.",
  },
};

/**
 * Authentic, curated static MCQ pools extracted from `serverQuizBank.ts` (lines 45-968),
 * mapped strictly to their true canonical GTU BCA subject codes without any synthetic filler.
 */
export const VERIFIED_STATIC_MCQ_BANK: SeedCuratedQuestion[] = [
  // =========================================================================
  // BCA101: Fundamental of Computer Organization (CO / FCO Pool)
  // =========================================================================
  {
    subjectCode: "BCA101",
    unitNumber: 1,
    language: "en",
    difficulty: "medium",
    question: "In Von Neumann architecture, which subsystem coordinates and directs the operations of all other CPU components?",
    options: [
      "Arithmetic Logic Unit (ALU)",
      "Control Unit (CU)",
      "Memory Address Register (MAR)",
      "Input Buffer",
    ],
    correctIndex: 1,
    explanation: "The Control Unit (CU) fetches, decodes, and orchestrates the execution of instructions across the CPU and system bus.",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 3,
    language: "en",
    difficulty: "easy",
    question: "Which level in the computer memory hierarchy delivers the lowest access latency to the processor core?",
    options: ["Main RAM", "CPU Registers", "Level 2 (L2) Cache", "Secondary SSD"],
    correctIndex: 1,
    explanation: "CPU Registers operate within fractions of a clock cycle on the CPU die, offering the lowest access latency.",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 4,
    language: "en",
    difficulty: "medium",
    question: "What is the primary function of the Program Counter (PC) register in a central processor?",
    options: [
      "Stores the memory address of the next instruction to be fetched and executed",
      "Counts the total number of arithmetic operations performed by the ALU",
      "Stores the result of the previous comparison instruction",
      "Maintains the interrupt vector table offset",
    ],
    correctIndex: 0,
    explanation: "The Program Counter (PC) holds the memory address from which the CPU will fetch the next instruction.",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 1,
    language: "en",
    difficulty: "medium",
    question: "In computer arithmetic, what representation standard is universally employed to represent signed integers in modern processors?",
    options: ["Sign-Magnitude", "One's Complement", "Two's Complement", "Excess-64 Notation"],
    correctIndex: 2,
    explanation: "Two's complement has a single representation for zero (no negative zero) and allows identical binary addition logic for signed and unsigned integers.",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 4,
    language: "en",
    difficulty: "hard",
    question: "What is the purpose of instruction pipelining in CPU microarchitectures?",
    options: [
      "Overlapping the execution stages of multiple instructions to maximize instruction throughput",
      "Replacing physical memory with optical storage lines",
      "Preventing cache misses completely",
      "Reducing clock speed to conserve CPU battery life",
    ],
    correctIndex: 0,
    explanation: "Instruction pipelining divides instruction processing into discrete stages (fetch, decode, execute, writeback) running in parallel across multiple instructions.",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 1,
    language: "hi",
    difficulty: "medium",
    question: "वॉन न्यूमैन (Von Neumann) आर्किटेक्चर में कौन सा भाग अन्य सभी CPU घटकों के कार्यों का समन्वय और नियंत्रण करता है?",
    options: [
      "अरिथमेटिक लॉजिक यूनिट (ALU)",
      "कंट्रोल यूनिट (Control Unit - CU)",
      "मेमोरी एड्रेस रजिस्टर",
      "हार्ड डिस्क ड्राइव",
    ],
    correctIndex: 1,
    explanation: "कंट्रोल यूनिट (CU) निर्देशों को फेच, डीकोड और निष्पादित करके पूरे कंप्यूटर सिस्टम की गतिविधियों का संचालन करती है।",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 3,
    language: "hi",
    difficulty: "easy",
    question: "कंप्यूटर मेमोरी पदानुक्रम (Memory Hierarchy) में सबसे तेज़ एक्सेस स्पीड किसकी होती है?",
    options: ["मेन रैम (RAM)", "CPU रजिस्टर्स", "हार्ड डिस्क", "L3 कैश"],
    correctIndex: 1,
    explanation: "CPU रजिस्टर्स सीधे प्रोसेसर के अंदर होते हैं और सबसे कम लेटेंसी व उच्चतम गति प्रदान करते हैं।",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 4,
    language: "hi",
    difficulty: "medium",
    question: "प्रोग्राम काउंटर (Program Counter - PC) रजिस्टर का मुख्य कार्य क्या है?",
    options: [
      "अगले निष्पादित होने वाले निर्देश का मेमोरी पता (Address) रखना",
      "किए गए कुल प्रोग्रामों की गिनती करना",
      "गलतियों की संख्या गिनना",
      "ऑपरेटिंग सिस्टम का नाम स्टोर करना",
    ],
    correctIndex: 0,
    explanation: "प्रोग्राम काउंटर (PC) उस अगले निर्देश के मेमोरी एड्रेस को ट्रैक करता है जिसे CPU द्वारा निष्पादित किया जाना है।",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 1,
    language: "hi",
    difficulty: "medium",
    question: "आधुनिक कंप्यूटरों में ऋणात्मक (Signed) पूर्णांकों को दर्शाने के लिए किस विधि का सबसे अधिक उपयोग होता है?",
    options: ["साइन-मैग्निट्यूड", "1 का पूरक (1's Complement)", "2 का पूरक (2's Complement)", "रोमन अंक"],
    correctIndex: 2,
    explanation: "2's complement में शून्य का केवल एक ही प्रतिनिधित्व होता है और जोड़ व घटाव के लिए समान हार्डवेयर परिपथ का उपयोग किया जा सकता है।",
  },
  {
    subjectCode: "BCA101",
    unitNumber: 4,
    language: "hi",
    difficulty: "hard",
    question: "CPU में इंस्ट्रक्शन पाइपलाइनिंग (Pipelining) का मुख्य उद्देश्य क्या है?",
    options: [
      "एक साथ कई निर्देशों के चरणों को समानांतर निष्पादित कर थ्रूपुट बढ़ाना",
      "मेमोरी क्षमता को दोगुना करना",
      "सिस्टम को रीबूट करना",
      "मॉनिटर के रिज़ॉल्यूशन को नियंत्रित करना",
    ],
    correctIndex: 0,
    explanation: "पाइपलाइनिंग निर्देशों के निष्पादन को विभिन्न चरणों (Fetch, Decode, Execute) में विभाजित करती है ताकि प्रोसेसर की समग्र गति बढ़ सके।",
  },

  // =========================================================================
  // BCA103: Fundamentals of Web Technology (Web Pool)
  // =========================================================================
  {
    subjectCode: "BCA103",
    unitNumber: 1,
    language: "en",
    difficulty: "medium",
    question: "Which HTTP request method is defined as idempotent according to RFC specifications?",
    options: ["POST", "GET and PUT", "PATCH (without condition)", "CONNECT"],
    correctIndex: 1,
    explanation: "GET, PUT, and DELETE methods are idempotent because executing them multiple times produces the identical side effect on the server state.",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 3,
    language: "en",
    difficulty: "medium",
    question: "What is the primary difference between localStorage and sessionStorage in browser web APIs?",
    options: [
      "sessionStorage persists across browser restarts; localStorage does not",
      "localStorage persists indefinitely until cleared; sessionStorage expires when the browser tab closes",
      "localStorage has a 4KB limit; sessionStorage has 5MB",
      "sessionStorage is sent with every HTTP request cookie",
    ],
    correctIndex: 1,
    explanation: "localStorage data persists until manually removed by user or script, whereas sessionStorage lives only for the duration of the page session.",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 2,
    language: "en",
    difficulty: "easy",
    question: "In CSS, which display model arranges elements in a two-dimensional grid of rows and columns?",
    options: ["display: flex", "display: grid", "display: inline-block", "display: table-cell"],
    correctIndex: 1,
    explanation: "CSS Grid Layout is designed specifically for two-dimensional layouts, controlling both rows and columns simultaneously.",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 3,
    language: "en",
    difficulty: "hard",
    question: "In JavaScript, which mechanism allows execution of asynchronous operations without blocking the main call stack?",
    options: ["Event Loop and Task Queue", "Garbage Collector", "Compiler Optimization Pass", "Synchronous File Lock"],
    correctIndex: 0,
    explanation: "The JavaScript Event Loop monitors the call stack and dequeues callback tasks from the task/microtask queue when the stack clears.",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 4,
    language: "en",
    difficulty: "medium",
    question: "What does the 'Same-Origin Policy' enforce in web browsers?",
    options: [
      "Allows any script to read document cookies from other domains",
      "Restricts documents and scripts loaded by one origin from accessing resources from another origin",
      "Forces all web pages to use the HTTPS protocol exclusively",
      "Prevents CSS files from loading external web fonts",
    ],
    correctIndex: 1,
    explanation: "Same-Origin Policy (SOP) is a critical browser security boundary that isolates potentially malicious documents loaded from different origins.",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 3,
    language: "hi",
    difficulty: "medium",
    question: "ब्राउज़र वेब API में localStorage और sessionStorage के बीच प्राथमिक अंतर क्या है?",
    options: [
      "sessionStorage स्थायी है; localStorage नहीं",
      "localStorage अनिश्चित काल तक रहता है; sessionStorage टैब बंद होते ही समाप्त हो जाता है",
      "localStorage कुकीज़ के साथ सर्वर को भेजा जाता है",
      "sessionStorage केवल बैकएंड सर्वर पर काम करता है",
    ],
    correctIndex: 1,
    explanation: "localStorage डेटा ब्राउज़र बंद होने के बाद भी सुरक्षित रहता है, जबकि sessionStorage केवल वर्तमान ब्राउज़र टैब सत्र तक सीमित रहता है।",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 1,
    language: "hi",
    difficulty: "medium",
    question: "HTTP विनिर्देशों के अनुसार निम्नलिखित में से कौन सा मेथड आइडमपोटेंट (Idempotent) है?",
    options: ["POST", "GET और PUT", "PATCH", "CONNECT"],
    correctIndex: 1,
    explanation: "GET, PUT और DELETE आइडमपोटेंट होते हैं क्योंकि इन्हें कई बार कॉल करने पर भी सर्वर स्थिति पर समान प्रभाव पड़ता है।",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 2,
    language: "hi",
    difficulty: "easy",
    question: "CSS में कौन सा डिस्प्ले मॉडल दो-आयामी (Rows और Columns) लेआउट प्रदान करता है?",
    options: ["display: flex", "display: grid", "display: inline-block", "display: inline"],
    correctIndex: 1,
    explanation: "CSS Grid लेआउट दो-आयामी (पंक्तियों और स्तंभों) ग्रिड संरचना को नियंत्रित करने के लिए डिज़ाइन किया गया है।",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 3,
    language: "hi",
    difficulty: "hard",
    question: "जावास्क्रिप्ट (JavaScript) में नॉन-ब्लॉकिंग एसिंक्रोनस कोड निष्पादित करने के लिए कौन सा तंत्र कार्य करता है?",
    options: ["इवेंट लूप और टास्क कतार (Event Loop & Task Queue)", "गारबेज कलेक्टर", "मेमोरी स्वैप", "सिंक्रोनस लॉक"],
    correctIndex: 0,
    explanation: "इवेंट लूप कॉल स्टैक और टास्क क्यू का समन्वय करके एसिंक्रोनस कॉलबैक को गैर-अवरोधक तरीके से चलाता है।",
  },
  {
    subjectCode: "BCA103",
    unitNumber: 4,
    language: "hi",
    difficulty: "medium",
    question: "वेब ब्राउज़र में सेम-ओरिजिन पॉलिसी (Same-Origin Policy) का क्या उद्देश्य है?",
    options: [
      "किसी भी डोमेन को बिना अनुमति कुकीज़ पढ़ने देना",
      "एक ऑरिजिन के स्क्रिप्ट को दूसरे ऑरिजिन के रिसोर्स तक अनधिकृत पहुँच से रोकना",
      "सभी वेबसाइटों के लिए पासवर्ड अनिवार्य करना",
      "ब्राउज़र कैश को पूरी तरह अक्षम करना",
    ],
    correctIndex: 1,
    explanation: "सेम-ओरिजिन पॉलिसी एक सुरक्षा तंत्र है जो अलग-अलग डोमेन के बीच अनधिकृत डेटा एक्सेस को प्रतिबंधित करता है।",
  },

  // =========================================================================
  // BCA201: Data Structure (DS Pool)
  // =========================================================================
  {
    subjectCode: "BCA201",
    unitNumber: 4,
    language: "en",
    difficulty: "medium",
    question: "Which traversal of a Binary Search Tree (BST) produces the elements in ascending sorted order?",
    options: [
      "Preorder Traversal (Root, Left, Right)",
      "Inorder Traversal (Left, Root, Right)",
      "Postorder Traversal (Left, Right, Root)",
      "Level-order Traversal (BFS)",
    ],
    correctIndex: 1,
    explanation: "Inorder traversal visits Left subtree, then Root, then Right subtree, strictly yielding elements in monotonically increasing order in a BST.",
  },
  {
    subjectCode: "BCA201",
    unitNumber: 4,
    language: "en",
    difficulty: "medium",
    question: "What is the worst-case time complexity of Merge Sort?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    correctIndex: 1,
    explanation: "Merge Sort consistently divides subproblems and merges in linear time, guaranteeing O(n log n) in best, average, and worst cases.",
  },
  {
    subjectCode: "BCA201",
    unitNumber: 1,
    language: "en",
    difficulty: "easy",
    question: "What data structure operates on the Last-In, First-Out (LIFO) principle?",
    options: ["Queue", "Stack", "Linked List", "Binary Heap"],
    correctIndex: 1,
    explanation: "A Stack restricts insertion and deletion to one end (the top), adhering to the Last-In First-Out (LIFO) protocol.",
  },
  {
    subjectCode: "BCA201",
    unitNumber: 4,
    language: "en",
    difficulty: "hard",
    question: "What is the time complexity of searching for an element in a balanced AVL or Red-Black Tree with n nodes?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctIndex: 1,
    explanation: "Self-balancing binary search trees maintain a maximum height bounded by O(log n), ensuring search, insert, and delete take O(log n).",
  },
  {
    subjectCode: "BCA201",
    unitNumber: 4,
    language: "hi",
    difficulty: "medium",
    question: "बाइनरी सर्च ट्री (BST) का इन-ऑर्डर ट्रैवर्सल (Inorder Traversal) किस क्रम में नोड्स उत्पन्न करता है?",
    options: [
      "घटते (Descending) क्रम में",
      "बढ़ते (Ascending / Sorted) क्रम में",
      "रैंडम क्रम में",
      "नोड इंसर्शन के क्रम में",
    ],
    correctIndex: 1,
    explanation: "किसी भी बाइनरी सर्च ट्री (BST) का इन-ऑर्डर ट्रैवर्सल (Left -> Root -> Right) तत्वों को हमेशा आरोही (Sorted) क्रम में प्रिंट करता है।",
  },
  {
    subjectCode: "BCA201",
    unitNumber: 4,
    language: "hi",
    difficulty: "medium",
    question: "मर्ज सॉर्ट (Merge Sort) एल्गोरिदम का सबसे खराब स्थिति (Worst-case) समय जटिलता क्या है?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    correctIndex: 1,
    explanation: "मर्ज सॉर्ट डिवाइड एंड कॉन्कर विधि पर आधारित है और सभी मामलों (Best, Average, Worst) में O(n log n) समय जटिलता की गारंटी देता है।",
  },
  {
    subjectCode: "BCA201",
    unitNumber: 1,
    language: "hi",
    difficulty: "easy",
    question: "स्टैक (Stack) डेटा संरचना किस सिद्धांत पर कार्य करती है?",
    options: [
      "FIFO (First In First Out)",
      "LIFO (Last In First Out)",
      "Priority Based",
      "Random Access",
    ],
    correctIndex: 1,
    explanation: "स्टैक LIFO (Last In, First Out) सिद्धांत पर काम करता है, जहाँ जो तत्व सबसे अंत में पुश (Push) होता है वह सबसे पहले पॉप (Pop) होता है।",
  },

  // =========================================================================
  // BCA202: Database Management System (DBMS Pool)
  // =========================================================================
  {
    subjectCode: "BCA202",
    unitNumber: 3,
    language: "en",
    difficulty: "medium",
    question: "Which normal form removes partial functional dependencies on composite primary keys?",
    options: [
      "First Normal Form (1NF)",
      "Second Normal Form (2NF)",
      "Third Normal Form (3NF)",
      "Boyce-Codd Normal Form (BCNF)",
    ],
    correctIndex: 1,
    explanation: "2NF requires the table to be in 1NF and mandates that no non-prime attribute is partially dependent on any candidate key.",
  },
  {
    subjectCode: "BCA202",
    unitNumber: 4,
    language: "en",
    difficulty: "easy",
    question: "What does the 'A' represent in ACID transaction properties of a DBMS?",
    options: [
      "Authentication",
      "Atomicity (All or Nothing execution)",
      "Availability",
      "Authorization",
    ],
    correctIndex: 1,
    explanation: "Atomicity guarantees that all operations within a database transaction complete successfully, or all changes are rolled back entirely.",
  },
  {
    subjectCode: "BCA202",
    unitNumber: 2,
    language: "en",
    difficulty: "easy",
    question: "Which SQL constraint enforces referential integrity between parent and child tables?",
    options: ["PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK"],
    correctIndex: 1,
    explanation: "A FOREIGN KEY constraint prevents invalid data from being inserted into the child table by requiring values to exist in the parent table's PRIMARY KEY.",
  },
  {
    subjectCode: "BCA202",
    unitNumber: 4,
    language: "en",
    difficulty: "medium",
    question: "Which type of SQL JOIN returns all rows from the left table and matching rows from the right table?",
    options: ["INNER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "CROSS JOIN"],
    correctIndex: 1,
    explanation: "LEFT OUTER JOIN retrieves every record from the left table, paired with matched records from the right table or NULLs where matches fail.",
  },
  {
    subjectCode: "BCA202",
    unitNumber: 3,
    language: "en",
    difficulty: "medium",
    question: "In relational algebra, which operation is used to project specific columns from a relation?",
    options: [
      "Selection (σ)",
      "Projection (π)",
      "Cartesian Product (×)",
      "Intersection (∩)",
    ],
    correctIndex: 1,
    explanation: "Projection (pi, π) chooses specified attributes (columns) and eliminates duplicate tuples from a relation.",
  },
  {
    subjectCode: "BCA202",
    unitNumber: 3,
    language: "hi",
    difficulty: "medium",
    question: "डेटाबेस में आंशिक निर्भरता (Partial Functional Dependency) को हटाने के लिए कौन सा नॉर्मल फॉर्म आवश्यक है?",
    options: [
      "प्रथम नॉर्मल फॉर्म (1NF)",
      "द्वितीय नॉर्मल फॉर्म (2NF)",
      "तृतीय नॉर्मल फॉर्म (3NF)",
      "BCNF",
    ],
    correctIndex: 1,
    explanation: "2NF में टेबल का 1NF में होना और कंपोजिट प्राइमरी की पर किसी भी गैर-की विशेषता की आंशिक निर्भरता का न होना अनिवार्य है।",
  },
  {
    subjectCode: "BCA202",
    unitNumber: 4,
    language: "hi",
    difficulty: "easy",
    question: "DBMS में ACID प्रॉपर्टीज में 'A' का क्या अर्थ है?",
    options: [
      "ऑथेंटिकेशन (Authentication)",
      "एटॉमीसिटी (Atomicity - All or Nothing)",
      "अवेलेबिलिटी (Availability)",
      "एनालिसिस (Analysis)",
    ],
    correctIndex: 1,
    explanation: "एटॉमीसिटी (Atomicity) यह सुनिश्चित करती है कि लेन-देन (Transaction) के सभी कार्य या तो पूरी तरह से सफल हों या कुछ भी न हो (All or Nothing)।",
  },
  {
    subjectCode: "BCA202",
    unitNumber: 2,
    language: "hi",
    difficulty: "easy",
    question: "दो तालिकाओं के बीच रेफरेंशियल इंटीग्रिटी बनाए रखने के लिए किस SQL बाधा (Constraint) का उपयोग किया जाता है?",
    options: ["PRIMARY KEY", "FOREIGN KEY", "CHECK", "NOT NULL"],
    correctIndex: 1,
    explanation: "FOREIGN KEY एक टेबल के कॉलम को दूसरी टेबल की PRIMARY KEY से जोड़कर रेफरेंशियल इंटीग्रिटी सुनिश्चित करती है।",
  },

  // =========================================================================
  // BCA301: Operating System (OS Pool)
  // =========================================================================
  {
    subjectCode: "BCA301",
    unitNumber: 2,
    language: "en",
    difficulty: "medium",
    question: "In Operating Systems, which of the following is NOT one of the necessary Coffman conditions for a Deadlock?",
    options: [
      "Mutual Exclusion",
      "Hold and Wait",
      "Preemption Allowed",
      "Circular Wait",
    ],
    correctIndex: 2,
    explanation: "The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlock is avoided.",
  },
  {
    subjectCode: "BCA301",
    unitNumber: 1,
    language: "en",
    difficulty: "medium",
    question: "Which CPU scheduling algorithm is prone to the 'Convoy Effect'?",
    options: [
      "Round Robin (RR)",
      "Shortest Job First (SJF)",
      "First-Come, First-Served (FCFS)",
      "Priority Scheduling",
    ],
    correctIndex: 2,
    explanation: "In FCFS, when a CPU-intensive process executes first, all shorter I/O-bound processes wait behind it, causing the convoy effect.",
  },
  {
    subjectCode: "BCA301",
    unitNumber: 3,
    language: "en",
    difficulty: "medium",
    question: "Belady's Anomaly in memory management is observed in which page replacement algorithm?",
    options: [
      "Least Recently Used (LRU)",
      "First In First Out (FIFO)",
      "Optimal Page Replacement (OPT)",
      "Least Frequently Used (LFU)",
    ],
    correctIndex: 1,
    explanation: "In FIFO page replacement, allocating more physical page frames can paradoxically increase the number of page faults.",
  },
  {
    subjectCode: "BCA301",
    unitNumber: 2,
    language: "en",
    difficulty: "medium",
    question: "What is the primary objective of Dijkstra's Banker's Algorithm?",
    options: [
      "Deadlock Detection",
      "Deadlock Avoidance by ensuring safe states",
      "Deadlock Recovery through process termination",
      "Disk Head Scheduling",
    ],
    correctIndex: 1,
    explanation: "Banker's Algorithm is a deadlock avoidance algorithm that tests for safety by simulating the allocation of maximum predetermined resources.",
  },
  {
    subjectCode: "BCA301",
    unitNumber: 3,
    language: "en",
    difficulty: "hard",
    question: "What role does the Translation Lookaside Buffer (TLB) play in virtual memory architecture?",
    options: [
      "Replaces the central CPU registers",
      "Caches virtual-to-physical address translations to accelerate lookup",
      "Synchronizes thread states in multi-core environments",
      "Acts as secondary flash storage for paging files",
    ],
    correctIndex: 1,
    explanation: "TLB is a fast associative hardware cache that speeds up virtual-to-physical address translation by storing recent page table entries.",
  },
  {
    subjectCode: "BCA301",
    unitNumber: 2,
    language: "hi",
    difficulty: "medium",
    question: "ऑपरेटिंग सिस्टम (OS) में डेडलॉक (Deadlock) के लिए निम्नलिखित में से कौन सी कॉफ़मैन शर्त आवश्यक नहीं है?",
    options: [
      "म्युचुअल एक्सक्लूजन (Mutual Exclusion)",
      "होल्ड एंड वेट (Hold and Wait)",
      "प्रीएम्पशन की अनुमति (Preemption Allowed)",
      "सर्कुलर वेट (Circular Wait)",
    ],
    correctIndex: 2,
    explanation: "डेडलॉक के 4 कॉफ़मैन नियम हैं: Mutual Exclusion, Hold and Wait, No Preemption (प्रीएम्पशन न होना), और Circular Wait। यदि प्रीएम्पशन की अनुमति हो तो डेडलॉक नहीं हो सकता।",
  },
  {
    subjectCode: "BCA301",
    unitNumber: 1,
    language: "hi",
    difficulty: "medium",
    question: "कौन सा CPU शेड्यूलिंग एल्गोरिदम 'कॉन्वॉय इफ़ेक्ट' (Convoy Effect) से पीड़ित हो सकता है?",
    options: [
      "राउंड रॉबिन (Round Robin)",
      "शॉर्टेस्ट जॉब फर्स्ट (SJF)",
      "फ़र्स्ट कम फ़र्स्ट सर्व्ड (FCFS)",
      "प्रायोरिटी शेड्यूलिंग (Priority Scheduling)",
    ],
    correctIndex: 2,
    explanation: "FCFS में यदि एक लंबा CPU-बाउंड प्रोसेस पहले आ जाता है, तो सभी छोटे I/O प्रोसेस उसके पीछे अटके रह जाते हैं, जिसे कॉन्वॉय इफ़ेक्ट कहा जाता है।",
  },
  {
    subjectCode: "BCA301",
    unitNumber: 3,
    language: "hi",
    difficulty: "medium",
    question: "मेमोरी मैनेजमेंट में बेलेडी विसंगति (Belady's Anomaly) किस पेज रिप्लेसमेंट एल्गोरिदम में देखी जाती है?",
    options: [
      "LRU (लीस्ट रीसेंटली यूज़्ड)",
      "FIFO (फ़र्स्ट इन फ़र्स्ट आउट)",
      "ऑप्टिमल पेज रिप्लेसमेंट",
      "LFU (लीस्ट फ्रीक्वेंटली यूज़्ड)",
    ],
    correctIndex: 1,
    explanation: "FIFO एल्गोरिदम में कभी-कभी अधिक पेज फ्रेम आवंटित करने पर भी पेज फॉल्ट की संख्या बढ़ जाती है, जिसे बेलेडी विसंगति कहते हैं।",
  },
  {
    subjectCode: "BCA301",
    unitNumber: 2,
    language: "hi",
    difficulty: "medium",
    question: "बैंकर्स एल्गोरिदम (Banker's Algorithm) का प्राथमिक उद्देश्य क्या है?",
    options: [
      "डेडलॉक का पता लगाना (Deadlock Detection)",
      "डेडलॉक से बचाव (Deadlock Avoidance)",
      "डेडलॉक से पुनर्प्राप्ति (Deadlock Recovery)",
      "डिस्क शेड्यूलिंग (Disk Scheduling)",
    ],
    correctIndex: 1,
    explanation: "बैंकर्स एल्गोरिदम एक डेडलॉक अवाइडेंस (बचाव) एल्गोरिदम है जो सुरक्षित स्थिति (Safe State) की पुष्टि करने के बाद ही रिसोर्स आवंटित करता है।",
  },

  // =========================================================================
  // BCA302: Object Oriented Programming with Java (Java Pool)
  // =========================================================================
  {
    subjectCode: "BCA302",
    unitNumber: 2,
    language: "en",
    difficulty: "medium",
    question: "Which Object-Oriented concept is demonstrated when a subclass provides its own specific implementation of a parent class method?",
    options: [
      "Method Overloading (Static Polymorphism)",
      "Method Overriding (Dynamic Runtime Polymorphism)",
      "Encapsulation through access modifiers",
      "Static Constructor Binding",
    ],
    correctIndex: 1,
    explanation: "Method Overriding is dynamic runtime polymorphism where a derived class provides a specific implementation of an inherited method.",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 1,
    language: "en",
    difficulty: "easy",
    question: "In the Java Virtual Machine (JVM), where are object instances dynamically allocated?",
    options: [
      "Call Stack frame",
      "Heap Memory space",
      "CPU Program Counter",
      "Native Method Stack",
    ],
    correctIndex: 1,
    explanation: "In Java, all objects created with 'new' reside in Heap Memory, which is automatically managed by the Garbage Collector.",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 1,
    language: "en",
    difficulty: "medium",
    question: "Why are String objects designed to be immutable in Java?",
    options: [
      "To prevent methods from taking parameters",
      "For Security, Thread Safety, and String Constant Pool optimization",
      "Because Java does not support character arrays",
      "To eliminate Heap memory overhead completely",
    ],
    correctIndex: 1,
    explanation: "Immutability allows Java to safely reuse strings in the String Constant Pool, guarantees thread safety across threads, and secures network sockets.",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 3,
    language: "en",
    difficulty: "medium",
    question: "Which of the following exceptions is an UNCHECKED exception in Java?",
    options: [
      "java.io.IOException",
      "java.sql.SQLException",
      "java.lang.NullPointerException",
      "java.lang.ClassNotFoundException",
    ],
    correctIndex: 2,
    explanation: "NullPointerException inherits from RuntimeException, making it an unchecked exception that does not require mandatory try-catch or throws clauses.",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 2,
    language: "en",
    difficulty: "easy",
    question: "What keyword is used in Java to prevent a class from being inherited (subclassed)?",
    options: ["static", "final", "abstract", "synchronized"],
    correctIndex: 1,
    explanation: "The 'final' keyword applied to a class declaration prevents any subclass from extending it (e.g. public final class String).",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 4,
    language: "en",
    difficulty: "easy",
    question: "Which collection interface in Java guarantees unique elements and does not permit duplicates?",
    options: ["List", "Set", "Queue", "Vector"],
    correctIndex: 1,
    explanation: "The Set interface (e.g., HashSet, TreeSet) models a mathematical set and strictly prohibits duplicate elements.",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 2,
    language: "hi",
    difficulty: "medium",
    question: "जावा (Java) में मेथड ओवरराइडिंग (Method Overriding) किस प्रकार के बहुरूपता (Polymorphism) का उदाहरण है?",
    options: [
      "कंपाइल-टाइम पॉलीमॉर्फिज्म",
      "रन-टाइम (डायनामिक) पॉलीमॉर्फिज्म",
      "स्टैटिक बाइंडिंग",
      "प्रीप्रोसेसर पॉलीमॉर्फिज्म",
    ],
    correctIndex: 1,
    explanation: "मेथड ओवरराइडिंग रनटाइम पॉलीमॉर्फिज्म का उदाहरण है, जहाँ मेथड का निर्णय प्रोग्राम के निष्पादन के समय ऑब्जेक्ट के प्रकार के आधार पर होता है।",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 1,
    language: "hi",
    difficulty: "easy",
    question: "जावा में ऑब्जेक्ट्स (Objects) को मेमोरी के किस भाग में आवंटित किया जाता है?",
    options: [
      "स्टैक मेमोरी (Stack Memory)",
      "हीप मेमोरी (Heap Memory)",
      "रजिस्टर (Registers)",
      "मेथड एरिया कोड सेगमेंट",
    ],
    correctIndex: 1,
    explanation: "जावा में सभी ऑब्जेक्ट्स और उनके इंस्टेंस वेरिएबल हीप (Heap) मेमोरी में आवंटित होते हैं, जबकि लोकल वेरिएबल स्टैक में रहते हैं।",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 1,
    language: "hi",
    difficulty: "medium",
    question: "जावा में स्ट्रिंग (String) ऑब्जेक्ट्स को इम्यूटेबल (Immutable) क्यों बनाया गया है?",
    options: [
      "ताकि स्ट्रिंग का आकार कभी न बदले",
      "सुरक्षा (Security), थ्रेड-सेफ्टी और स्ट्रिंग पूल कैशिंग के लिए",
      "कंपाइलर की गति बढ़ाने के लिए",
      "मेमोरी स्पेस को सीमित करने के लिए",
    ],
    correctIndex: 1,
    explanation: "स्ट्रिंग की इम्यूटेबिलिटी स्ट्रिंग कांस्टेंट पूल को संभव बनाती है, मल्टीथ्रेडिंग में डेटा करप्शन रोकती है और नेटवर्क कनेक्शन में सुरक्षा प्रदान करती है।",
  },
  {
    subjectCode: "BCA302",
    unitNumber: 3,
    language: "hi",
    difficulty: "medium",
    question: "जावा में अनचेक्ड अपवाद (Unchecked Exception) का सही उदाहरण कौन सा है?",
    options: [
      "IOException",
      "SQLException",
      "NullPointerException",
      "ClassNotFoundException",
    ],
    correctIndex: 2,
    explanation: "NullPointerException, RuntimeException का उपवर्ग है, इसलिए यह एक अनचेक्ड अपवाद है जिसे कंपाइलर अनिवार्य रूप से पकड़ने के लिए बाध्य नहीं करता।",
  },

  // =========================================================================
  // BCA303: Computer Networking (Networks Pool)
  // =========================================================================
  {
    subjectCode: "BCA303",
    unitNumber: 4,
    language: "en",
    difficulty: "easy",
    question: "At which layer of the 7-layer OSI reference model do TCP and UDP operate?",
    options: [
      "Network Layer (Layer 3)",
      "Transport Layer (Layer 4)",
      "Data Link Layer (Layer 2)",
      "Session Layer (Layer 5)",
    ],
    correctIndex: 1,
    explanation: "Transmission Control Protocol (TCP) and User Datagram Protocol (UDP) operate at Layer 4 (Transport Layer) to deliver end-to-end process-to-process communication.",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 4,
    language: "en",
    difficulty: "easy",
    question: "Which default well-known port is utilized by DNS (Domain Name System)?",
    options: [
      "Port 22 (SSH)",
      "Port 53 (DNS)",
      "Port 80 (HTTP)",
      "Port 443 (HTTPS)",
    ],
    correctIndex: 1,
    explanation: "DNS servers listen for queries on port 53, primarily over UDP for rapid name resolution and TCP for zone transfers.",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 3,
    language: "en",
    difficulty: "easy",
    question: "What is the total address length in bits of an Internet Protocol version 4 (IPv4) address?",
    options: ["16 bits", "32 bits", "64 bits", "128 bits"],
    correctIndex: 1,
    explanation: "An IPv4 address consists of 32 bits divided into 4 octets, whereas IPv6 uses 128 bits.",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 4,
    language: "en",
    difficulty: "medium",
    question: "In TCP connection establishment, what is the sequence of the 3-Way Handshake?",
    options: [
      "ACK → SYN → SYN-ACK",
      "SYN → SYN-ACK → ACK",
      "FIN → ACK → FIN-ACK",
      "SYN → PSH → ACK",
    ],
    correctIndex: 1,
    explanation: "TCP initiates a connection through a three-way handshake: Client sends SYN, Server replies with SYN-ACK, and Client sends ACK.",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 2,
    language: "en",
    difficulty: "medium",
    question: "Which protocol is responsible for mapping an IP address to a physical MAC address on a local area network?",
    options: ["DHCP", "ARP (Address Resolution Protocol)", "RARP", "ICMP"],
    correctIndex: 1,
    explanation: "ARP (Address Resolution Protocol) broadcasts a query to discover the physical MAC address associated with an assigned IPv4 address.",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 3,
    language: "en",
    difficulty: "medium",
    question: "Which of the following routing protocols uses Dijkstra's shortest path algorithm?",
    options: [
      "Distance Vector Routing (RIP)",
      "Link State Routing (OSPF)",
      "Path Vector Routing (BGP)",
      "Flooding Routing",
    ],
    correctIndex: 1,
    explanation: "OSPF (Open Shortest Path First) is a Link State routing protocol that runs Dijkstra's algorithm to calculate the shortest path tree to every node.",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 3,
    language: "en",
    difficulty: "easy",
    question: "What is the default subnet mask for a standard Class C IPv4 network?",
    options: [
      "255.0.0.0 (/8)",
      "255.255.0.0 (/16)",
      "255.255.255.0 (/24)",
      "255.255.255.255 (/32)",
    ],
    correctIndex: 2,
    explanation: "Class C addresses use 24 network bits and 8 host bits, yielding the standard subnet mask 255.255.255.0 (/24).",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 4,
    language: "hi",
    difficulty: "easy",
    question: "OSI मॉडल के किस लेयर पर TCP और UDP प्रोटोकॉल कार्य करते हैं?",
    options: [
      "नेटवर्क लेयर (Layer 3)",
      "ट्रांसपोर्ट लेयर (Layer 4)",
      "डेटा लिंक लेयर (Layer 2)",
      "एप्लिकेशन लेयर (Layer 7)",
    ],
    correctIndex: 1,
    explanation: "TCP और UDP ट्रांसपोर्ट लेयर (लेयर 4) के प्रोटोकॉल हैं जो प्रोसेस-टू-प्रोसेस एंड-टू-एंड संचार प्रदान करते हैं।",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 4,
    language: "hi",
    difficulty: "easy",
    question: "DNS (Domain Name System) सामान्यतः किस पोर्ट नंबर पर कार्य करता है?",
    options: ["Port 21", "Port 25", "Port 53", "Port 80"],
    correctIndex: 2,
    explanation: "DNS सामान्यतः डोमेन नाम रिज़ॉल्यूशन के लिए UDP/TCP पोर्ट 53 का उपयोग करता है।",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 3,
    language: "hi",
    difficulty: "easy",
    question: "IPv4 एड्रेस में कुल कितने बिट्स (Bits) होते हैं?",
    options: ["16 बिट्स", "32 बिट्स", "64 बिट्स", "128 बिट्स"],
    correctIndex: 1,
    explanation: "IPv4 एड्रेस 32 बिट्स (4 बाइट्स) का होता है, जबकि IPv6 एड्रेस 128 बिट्स का होता है।",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 4,
    language: "hi",
    difficulty: "medium",
    question: "TCP कनेक्शन स्थापना में 3-वे हैंडशेक (3-Way Handshake) का सही क्रम क्या है?",
    options: [
      "ACK → SYN → SYN-ACK",
      "SYN → SYN-ACK → ACK",
      "FIN → ACK → FIN-ACK",
      "SYN → PSH → ACK",
    ],
    correctIndex: 1,
    explanation: "TCP कनेक्शन शुरू करने के लिए क्लाइंट पहले SYN भेजता है, सर्वर SYN-ACK भेजता है, और फिर क्लाइंट ACK पुष्टि भेजता है।",
  },
  {
    subjectCode: "BCA303",
    unitNumber: 2,
    language: "hi",
    difficulty: "medium",
    question: "स्थानीय नेटवर्क पर IP एड्रेस को फिजिकल MAC एड्रेस में बदलने के लिए कौन सा प्रोटोकॉल जिम्मेदार है?",
    options: ["DHCP", "ARP (Address Resolution Protocol)", "RARP", "ICMP"],
    correctIndex: 1,
    explanation: "ARP (एड्रेस रिज़ॉल्यूशन प्रोटोकॉल) ज्ञात IP पते के अनुरूप डिवाइस का भौतिक MAC पता खोजने के लिए ब्रॉडकास्ट करता है।",
  },

  // =========================================================================
  // BCA401: Python Programming (Python Pool)
  // =========================================================================
  {
    subjectCode: "BCA401",
    unitNumber: 1,
    language: "en",
    difficulty: "easy",
    question: "Which of the following built-in data types in Python is IMMUTABLE?",
    options: ["List", "Dictionary", "Tuple", "Set"],
    correctIndex: 2,
    explanation: "In Python, Tuples, Strings, and Numbers are immutable; once created, their internal state cannot be modified in place.",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 1,
    language: "en",
    difficulty: "medium",
    question: "What is the output of the Python expression: [x**2 for x in range(4) if x % 2 == 0]?",
    options: ["[0, 1, 4, 9]", "[0, 4]", "[1, 9]", "[4]"],
    correctIndex: 1,
    explanation: "range(4) produces 0, 1, 2, 3. The condition x % 2 == 0 filters 0 and 2. Squaring them yields [0, 4].",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 1,
    language: "en",
    difficulty: "easy",
    question: "In Python, what keyword is used to create an anonymous inline function?",
    options: ["def", "lambda", "inline", "func"],
    correctIndex: 1,
    explanation: "The 'lambda' keyword creates small anonymous functions syntactically restricted to a single expression.",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 1,
    language: "en",
    difficulty: "medium",
    question: "Which Python dictionary method safely retrieves a value for a key without throwing a KeyError if missing?",
    options: ["dict.fetch()", "dict.get()", "dict.lookup()", "dict.popitem()"],
    correctIndex: 1,
    explanation: "dict.get(key, default) returns the value if present, or None/specified default if the key does not exist.",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 2,
    language: "en",
    difficulty: "easy",
    question: "What does the '__init__' method represent in a Python class definition?",
    options: [
      "The class destructor",
      "The instance initializer constructor method",
      "A static class variable decorator",
      "The string representation method",
    ],
    correctIndex: 1,
    explanation: "'__init__' is the constructor method called automatically whenever a new instance of the class is instantiated.",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 1,
    language: "hi",
    difficulty: "easy",
    question: "पायथन (Python) में निम्नलिखित में से कौन सा डेटा प्रकार इम्यूटेबल (अपरिवर्तनीय) है?",
    options: ["List", "Dictionary", "Tuple", "Set"],
    correctIndex: 2,
    explanation: "पायथन में Tuple और String इम्यूटेबल होते हैं, जिनका निर्माण होने के बाद उनके मानों को सीधे बदला नहीं जा सकता।",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 1,
    language: "hi",
    difficulty: "easy",
    question: "पायथन में अनाम (Anonymous) इनलाइन फ़ंक्शन बनाने के लिए किस कीवर्ड का उपयोग किया जाता है?",
    options: ["def", "lambda", "inline", "function"],
    correctIndex: 1,
    explanation: "lambda कीवर्ड का उपयोग बिना नाम के छोटे इनलाइन फ़ंक्शंस को परिभाषित करने के लिए किया जाता है।",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 1,
    language: "hi",
    difficulty: "medium",
    question: "पायथन डिक्शनरी में बिना KeyError के मान सुरक्षित रूप से प्राप्त करने के लिए कौन सा मेथड है?",
    options: ["dict.search()", "dict.get()", "dict.find()", "dict.pull()"],
    correctIndex: 1,
    explanation: "dict.get() मेथड की (Key) मौजूद न होने पर त्रुटि देने के बजाय डिफ़ॉल्ट मान (जैसे None) देता है।",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 2,
    language: "hi",
    difficulty: "easy",
    question: "पायथन क्लास में '__init__' मेथड का मुख्य कार्य क्या है?",
    options: [
      "ऑब्जेक्ट को नष्ट करना",
      "ऑब्जेक्ट कंस्ट्रक्टर (इनिशियलाइज़र) के रूप में कार्य करना",
      "क्लास को इनहेरिट करना",
      "मेमोरी क्लीनअप करना",
    ],
    correctIndex: 1,
    explanation: "__init__ पायथन में कंस्ट्रक्टर मेथड है, जो नया ऑब्जेक्ट बनते ही अपने-आप निष्पादित होता है।",
  },
  {
    subjectCode: "BCA401",
    unitNumber: 1,
    language: "hi",
    difficulty: "medium",
    question: "पायथन में [x for x in range(5) if x % 2 != 0] का आउटपुट क्या होगा?",
    options: ["[0, 2, 4]", "[1, 3]", "[1, 3, 5]", "[0, 1, 2, 3, 4]"],
    correctIndex: 1,
    explanation: "range(5) में 0,1,2,3,4 होते हैं। x % 2 != 0 विषम संख्याएँ (1 और 3) चुनता है।",
  },

  // =========================================================================
  // BCA402: Software Engineering (SE Pool)
  // =========================================================================
  {
    subjectCode: "BCA402",
    unitNumber: 2,
    language: "en",
    difficulty: "medium",
    question: "In software engineering, which architectural metric evaluates the degree to which module elements belong together?",
    options: ["Coupling", "Cohesion", "Inheritance depth", "Polymorphism"],
    correctIndex: 1,
    explanation: "Cohesion measures the strength of relationship between the internal methods and data of a single module; high cohesion is ideal.",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 1,
    language: "en",
    difficulty: "easy",
    question: "Which SDLC model is best suited for projects where user requirements are uncertain or continually evolving?",
    options: ["Waterfall Model", "Agile / Scrum", "V-Model", "Big Bang Model"],
    correctIndex: 1,
    explanation: "Agile methodologies use iterative sprints and regular feedback to adapt seamlessly to changing user requirements.",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 3,
    language: "en",
    difficulty: "medium",
    question: "What is the primary difference between Black-box testing and White-box testing?",
    options: [
      "Black-box testing inspects internal code paths; White-box does not",
      "White-box testing inspects internal code and branch logic; Black-box focuses purely on external inputs/outputs",
      "Black-box testing is performed exclusively by compilers",
      "White-box testing is only conducted in production environments",
    ],
    correctIndex: 1,
    explanation: "White-box testing tests internal structures and implementation logic, while Black-box testing validates functionality against requirements without internal code visibility.",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 3,
    language: "en",
    difficulty: "hard",
    question: "In software metrics, what does Cyclomatic Complexity measure?",
    options: [
      "Total lines of code (LOC)",
      "Number of linearly independent execution paths through program source code",
      "Network latency between client and database server",
      "Cost estimation for project developers",
    ],
    correctIndex: 1,
    explanation: "Cyclomatic complexity measures the number of decision points (conditions and branches) to determine independent control flow paths.",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 2,
    language: "en",
    difficulty: "easy",
    question: "Which document represents the formal agreement of functional and non-functional system capabilities between client and developers?",
    options: [
      "Software Requirements Specification (SRS)",
      "Source Code Repository Git Log",
      "User Acceptance Test Run Sheet",
      "Database Schema Migration Script",
    ],
    correctIndex: 0,
    explanation: "The Software Requirements Specification (SRS) formally captures all behavioral, functional, and non-functional commitments of a software system.",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 2,
    language: "hi",
    difficulty: "medium",
    question: "सॉफ्टवेयर इंजीनियरिंग में अच्छे डिजाइन के लिए कौन सा सिद्धांत सबसे महत्वपूर्ण है?",
    options: [
      "हाई कपलिंग और लो कोहेशन",
      "हाई कोहेशन और लो कपलिंग (High Cohesion, Low Coupling)",
      "कोई टेस्टिंग न करना",
      "सभी कोड एक ही फ़ाइल में लिखना",
    ],
    correctIndex: 1,
    explanation: "हाई कोहेशन सुनिश्चित करता है कि मॉड्यूल के तत्व एक साथ कार्य करें, और लो कपलिंग सुनिश्चित करता है कि मॉड्यूल एक-दूसरे पर कम निर्भर हों।",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 1,
    language: "hi",
    difficulty: "easy",
    question: "सॉफ्टवेयर विकास में एजाइल (Agile) पद्धति का सबसे बड़ा लाभ क्या है?",
    options: [
      "बदलती आवश्यकताओं के प्रति तीव्र अनुकूलन और पुनरावृत्ति (Iterative) डिलीवरी",
      "परियोजना में किसी ग्राहक संवाद की आवश्यकता न होना",
      "कोई कोड टेस्ट न करना",
      "केवल एक ही बार अंत में सॉफ्टवेयर डिलीवर करना",
    ],
    correctIndex: 0,
    explanation: "एजाइल मॉडल छोटे-छोटे स्प्रिंट्स के माध्यम से परिवर्तनों को आसानी से स्वीकार करता है और नियमित फीडबैक पर कार्य करता है।",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 3,
    language: "hi",
    difficulty: "medium",
    question: "सॉफ्टवेयर टेस्टिंग में ब्लैक-बॉक्स और व्हाइट-बॉक्स टेस्टिंग में मुख्य अंतर क्या है?",
    options: [
      "ब्लैक-बॉक्स में आंतरिक कोड की जांच होती है",
      "व्हाइट-बॉक्स में आंतरिक कोड लॉजिक की जांच होती है, जबकि ब्लैक-बॉक्स में इनपुट-आउटपुट व्यवहार देखा जाता है",
      "दोनों में कोई अंतर नहीं है",
      "व्हाइट-बॉक्स केवल हार्डवेयर के लिए होता है",
    ],
    correctIndex: 1,
    explanation: "व्हाइट-बॉक्स टेस्टिंग आंतरिक कोड संरचना पर आधारित होती है, जबकि ब्लैक-बॉक्स विनिर्देशों के अनुसार बाहरी कार्यप्रणाली का परीक्षण करती है।",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 2,
    language: "hi",
    difficulty: "easy",
    question: "सॉफ्टवेयर विकास जीवन चक्र (SDLC) में SRS का पूरा नाम क्या है?",
    options: [
      "Software Requirements Specification",
      "System Resource Standard",
      "Standard Release System",
      "Source Reliability Service",
    ],
    correctIndex: 0,
    explanation: "SRS (Software Requirements Specification) सॉफ्टवेयर की कार्यात्मक और गैर-कार्यात्मक आवश्यकताओं का औपचारिक दस्तावेज़ है।",
  },
  {
    subjectCode: "BCA402",
    unitNumber: 3,
    language: "hi",
    difficulty: "medium",
    question: "सॉफ्टवेयर रखरखाव (Software Maintenance) में रिग्रेशन टेस्टिंग (Regression Testing) क्यों की जाती है?",
    options: [
      "यह सुनिश्चित करने के लिए कि नए बदलावों से मौजूदा कार्यप्रणाली में कोई त्रुटि न आई हो",
      "सॉफ्टवेयर का आकार बढ़ाने के लिए",
      "इंटरनेट कनेक्शन की गति मापने के लिए",
      "डेटाबेस को खाली करने के लिए",
    ],
    correctIndex: 0,
    explanation: "रिग्रेशन टेस्टिंग यह पुष्टि करती है कि कोड में किए गए हालिया सुधार या नए फीचर से पहले से काम कर रहे फीचर्स में कोई नई समस्या नहीं आई है।",
  },
];

export interface SeedReport {
  semestersSeeded: number;
  subjectsSeeded: number;
  unitsSeeded: number;
  topicsSeeded: number;
  studyMaterialsSeeded: number;
  papersSeeded: number;
  paperQuestionsSeeded: number;
  questionsSeeded: number;
  quizzesSeeded: number;
  quizQuestionsSeeded: number;
  quarantinedCount: number;
}

/**
 * Deterministic, idempotent database seeder implementing Phase 1.1 & Phase 1.2 contract.
 * Authority hierarchy:
 *   1. Canonical curriculum (`src/data/curriculumData.json`, enriched with non-conflicting metadata from `gtuBcaCurriculum.ts`)
 *   2. `src/data/gtuPapersData.ts` (strictly applying Approved Paper Mappings and quarantining C++ & ambiguous entries)
 *   3. `serverQuizBank.ts` (strictly seeding verified static pools to canonical subjects and quarantining misrouted/synthetic items)
 */
export function seedDatabase(db: AppDatabase): SeedReport {
  const canonicalSubjects = curriculumDataRaw as unknown as CanonicalSubjectSource[];

  // Build lookup of secondary enrichment metadata from gtuBcaCurriculum.ts ONLY where code AND subject domain match
  const secondaryByCode = new Map<
    string,
    {
      category?: string;
      credits?: number;
      unitWeightages: Map<number, string>;
      topicMarks: Map<string, number[]>;
    }
  >();

  const canonicalCodeSet = new Set(canonicalSubjects.map((s) => s.code.toUpperCase()));

  const runSeedTx = db.transaction(() => {
    const upsertQuarantine = db.prepare(`
      INSERT INTO quarantined_legacy_records (id, source_table, legacy_id, reason, payload_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        reason = excluded.reason,
        payload_json = excluded.payload_json
    `);

    // Audit gtuBcaCurriculum.ts against canonical curriculumData.json
    for (const semBlock of GTU_BCA_CURRICULUM) {
      for (const secSubj of semBlock.subjects) {
        const canonicalMatch = canonicalSubjects.find(
          (cs) => cs.code.toUpperCase() === secSubj.code.toUpperCase()
        );
        const isSameDomain =
          canonicalMatch &&
          (canonicalMatch.name.toLowerCase().includes(secSubj.name.toLowerCase().slice(0, 10)) ||
            secSubj.name.toLowerCase().includes(canonicalMatch.name.toLowerCase().slice(0, 10)));

        if (canonicalMatch && isSameDomain) {
          const unitWeightages = new Map<number, string>();
          const topicMarks = new Map<string, number[]>();
          for (const u of secSubj.units) {
            if (u.weightage) {
              unitWeightages.set(u.unitNumber, u.weightage);
            }
            for (const t of u.topics) {
              if (Array.isArray(t.importantMarks)) {
                topicMarks.set(t.id, t.importantMarks);
              }
            }
          }
          secondaryByCode.set(secSubj.code.toUpperCase(), {
            category: secSubj.category,
            credits: secSubj.credits,
            unitWeightages,
            topicMarks,
          });
        } else {
          // Quarantine conflicting or non-canonical secondary curriculum entry
          const qId = `quarantine_curr_${secSubj.code}_sem${semBlock.semester}`;
          upsertQuarantine.run(
            qId,
            "gtuBcaCurriculum.ts",
            `${secSubj.code} (${secSubj.name})`,
            canonicalCodeSet.has(secSubj.code.toUpperCase())
              ? `Conflicting subject definition in gtuBcaCurriculum.ts: ${secSubj.code} is '${secSubj.name}' (Sem ${semBlock.semester}), whereas canonical curriculumData.json defines ${secSubj.code} as '${canonicalMatch?.name}' (Sem ${canonicalMatch?.semester}). Canonical curriculumData.json authority preserved.`
              : `Non-canonical subject code ${secSubj.code} ('${secSubj.name}') in gtuBcaCurriculum.ts does not exist in canonical curriculumData.json.`,
            JSON.stringify({
              semester: semBlock.semester,
              code: secSubj.code,
              name: secSubj.name,
              shortName: secSubj.shortName,
            })
          );
        }
      }
    }

    // 1. Seed Semesters (1..6)
    const upsertSemester = db.prepare(`
      INSERT INTO semesters (id, number, title, is_active)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        number = excluded.number,
        title = excluded.title,
        is_active = 1
    `);

    for (let sem = 1; sem <= 6; sem++) {
      upsertSemester.run(sem, sem, `Semester ${sem}`);
    }

    // 2. Seed Canonical Subjects, Units, Topics, and Syllabus Study Materials
    const upsertSubject = db.prepare(`
      INSERT INTO subjects (id, semester_id, code, name, short_name, category, credits, description, is_active, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        semester_id = excluded.semester_id,
        code = excluded.code,
        name = excluded.name,
        short_name = excluded.short_name,
        category = excluded.category,
        credits = excluded.credits,
        description = excluded.description,
        is_active = 1,
        updated_at = datetime('now')
    `);

    const upsertUnit = db.prepare(`
      INSERT INTO units (id, subject_id, unit_number, title, description, weightage, order_index, is_active, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        subject_id = excluded.subject_id,
        unit_number = excluded.unit_number,
        title = excluded.title,
        description = excluded.description,
        weightage = excluded.weightage,
        order_index = excluded.order_index,
        is_active = 1,
        updated_at = datetime('now')
    `);

    const upsertTopic = db.prepare(`
      INSERT INTO topics (id, subject_id, unit_id, title, summary, content, important_marks_json, order_index, estimated_minutes, is_active, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 30, 1, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        subject_id = excluded.subject_id,
        unit_id = excluded.unit_id,
        title = excluded.title,
        summary = excluded.summary,
        content = excluded.content,
        important_marks_json = excluded.important_marks_json,
        order_index = excluded.order_index,
        is_active = 1,
        updated_at = datetime('now')
    `);

    const upsertStudyMaterial = db.prepare(`
      INSERT INTO study_materials (id, subject_id, unit_id, topic_id, title, material_type, summary, content_markdown, published, verified, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        subject_id = excluded.subject_id,
        unit_id = excluded.unit_id,
        topic_id = excluded.topic_id,
        title = excluded.title,
        material_type = excluded.material_type,
        summary = excluded.summary,
        content_markdown = excluded.content_markdown,
        published = 1,
        verified = 1,
        updated_at = datetime('now')
    `);

    // Maps for fast canonical hierarchy resolution during paper & question seeding
    const subjectMetaByCode = new Map<
      string,
      {
        subjectId: string;
        code: string;
        name: string;
        semesterId: number;
        unitIdsByNumber: Map<number, string>;
        firstTopicIdByUnitNumber: Map<number, string>;
      }
    >();

    for (const subj of canonicalSubjects) {
      const code = subj.code.trim().toUpperCase();
      const subjectId = `subj_${code}`;
      const enrichment = secondaryByCode.get(code);
      const category = enrichment?.category || "Core";
      const credits = enrichment?.credits || 4;

      upsertSubject.run(
        subjectId,
        subj.semester,
        code,
        subj.name.trim(),
        subj.shortName?.trim() || subj.name.trim(),
        category,
        credits,
        subj.description?.trim() || null
      );

      const unitIdsByNumber = new Map<number, string>();
      const firstTopicIdByUnitNumber = new Map<number, string>();

      for (let uIdx = 0; uIdx < subj.units.length; uIdx++) {
        const u = subj.units[uIdx];
        const unitNumber = u.unitNumber || uIdx + 1;
        const unitId = `unit_${code}_u${unitNumber}`;
        const weightage = enrichment?.unitWeightages.get(unitNumber) || "25%";

        upsertUnit.run(
          unitId,
          subjectId,
          unitNumber,
          u.unitName.trim(),
          `Unit ${unitNumber} of ${subj.name}: ${u.unitName.trim()}`,
          weightage,
          unitNumber
        );

        unitIdsByNumber.set(unitNumber, unitId);

        for (let tIdx = 0; tIdx < u.topics.length; tIdx++) {
          const t = u.topics[tIdx];
          const orderIndex = tIdx + 1;
          const topicId = `topic_${code}_${t.id}`;
          const marksArr = enrichment?.topicMarks.get(t.id) || [3, 5, 7];

          upsertTopic.run(
            topicId,
            subjectId,
            unitId,
            t.title.trim(),
            t.summary.trim(),
            `### ${t.title.trim()}\n\n${t.summary.trim()}`,
            JSON.stringify(marksArr),
            orderIndex
          );

          if (orderIndex === 1) {
            firstTopicIdByUnitNumber.set(unitNumber, topicId);
          }

          // Seed canonical topic revision notes in study_materials
          const matId = `mat_notes_${topicId}`;
          upsertStudyMaterial.run(
            matId,
            subjectId,
            unitId,
            topicId,
            `${code} Unit ${unitNumber}: ${t.title.trim()} — Revision Notes`,
            "notes",
            t.summary.trim(),
            `# ${t.title.trim()}\n**Subject:** ${subj.name} (${code}) • **Unit ${unitNumber}:** ${u.unitName}\n\n## Core Syllabus Summary\n${t.summary.trim()}`
          );
        }

        // Seed unit-level GTU exam question bank in study_materials if examQuestions exist
        if (Array.isArray(u.examQuestions) && u.examQuestions.length > 0) {
          const qbId = `mat_qb_${unitId}`;
          const firstTopicId = firstTopicIdByUnitNumber.get(unitNumber) || null;
          const mdLines = u.examQuestions.map((q, idx) => `${idx + 1}. ${q}`).join("\n");
          upsertStudyMaterial.run(
            qbId,
            subjectId,
            unitId,
            firstTopicId,
            `${code} Unit ${unitNumber}: ${u.unitName.trim()} — Important GTU Exam Questions`,
            "question_bank",
            `Curated GTU examination questions for ${subj.name} Unit ${unitNumber} (${u.unitName.trim()}).`,
            `# Important GTU Examination Questions\n**Subject:** ${subj.name} (${code})\n**Unit ${unitNumber}:** ${u.unitName.trim()}\n\n${mdLines}`
          );
        }
      }

      subjectMetaByCode.set(code, {
        subjectId,
        code,
        name: subj.name.trim(),
        semesterId: subj.semester,
        unitIdsByNumber,
        firstTopicIdByUnitNumber,
      });
    }

    // 3. Seed GTU Examination Papers & Paper Questions using Approved Mappings ONLY
    const upsertPaper = db.prepare(`
      INSERT INTO papers (
        id, semester_id, subject_id, subject_code_snapshot, subject_name_snapshot,
        exam_year, exam_session, title, availability_status, source_type,
        file_url, external_url, file_name, file_size, total_pages,
        total_marks, duration_minutes, instructions_json, exam_date, exam_time,
        published, verified, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 150, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        semester_id = excluded.semester_id,
        subject_id = excluded.subject_id,
        subject_code_snapshot = excluded.subject_code_snapshot,
        subject_name_snapshot = excluded.subject_name_snapshot,
        exam_year = excluded.exam_year,
        exam_session = excluded.exam_session,
        title = excluded.title,
        availability_status = excluded.availability_status,
        source_type = excluded.source_type,
        file_url = excluded.file_url,
        file_name = excluded.file_name,
        file_size = excluded.file_size,
        total_pages = excluded.total_pages,
        total_marks = excluded.total_marks,
        instructions_json = excluded.instructions_json,
        exam_date = excluded.exam_date,
        exam_time = excluded.exam_time,
        published = excluded.published,
        verified = excluded.verified,
        updated_at = datetime('now')
    `);

    const upsertPaperQuestion = db.prepare(`
      INSERT INTO paper_questions (
        id, paper_id, subject_id, unit_id, topic_id,
        section_number, section_title, question_number, sub_question_label,
        choice_group_label, is_alternative, question_text, marks,
        frequency_count, display_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        paper_id = excluded.paper_id,
        subject_id = excluded.subject_id,
        unit_id = excluded.unit_id,
        topic_id = excluded.topic_id,
        section_number = excluded.section_number,
        section_title = excluded.section_title,
        question_number = excluded.question_number,
        sub_question_label = excluded.sub_question_label,
        choice_group_label = excluded.choice_group_label,
        is_alternative = excluded.is_alternative,
        question_text = excluded.question_text,
        marks = excluded.marks,
        display_order = excluded.display_order
    `);

    for (const rawPaper of GTU_QUESTION_PAPERS) {
      const mappingRule = APPROVED_PAPER_TARGET_CODE_BY_ID[rawPaper.id];

      if (!mappingRule) {
        // Any unknown paper not in the approved mapping table is quarantined automatically (DO NOT GUESS)
        upsertQuarantine.run(
          `quarantine_paper_${rawPaper.id}`,
          "gtuPapersData.ts",
          rawPaper.id,
          `Unmapped paper ID '${rawPaper.id}' (${rawPaper.subjectCode}: ${rawPaper.subject}) quarantined because it has no approved canonical mapping.`,
          JSON.stringify(rawPaper)
        );
        continue;
      }

      if (mappingRule.action === "quarantine") {
        // Ensure quarantined paper is removed if it ever existed in papers
        db.prepare("DELETE FROM papers WHERE id = ?").run(rawPaper.id);
        upsertQuarantine.run(
          `quarantine_paper_${rawPaper.id}`,
          "gtuPapersData.ts",
          rawPaper.id,
          mappingRule.reason,
          JSON.stringify({
            id: rawPaper.id,
            originalSemester: rawPaper.semester,
            originalSubjectCode: rawPaper.subjectCode,
            originalSubject: rawPaper.subject,
            year: rawPaper.year,
            exam: rawPaper.exam,
            isAvailable: rawPaper.isAvailable,
          })
        );
        continue;
      }

      const targetMeta = subjectMetaByCode.get(mappingRule.targetSubjectCode);
      if (!targetMeta) {
        throw new Error(
          `Canonical subject '${mappingRule.targetSubjectCode}' not found for approved paper '${rawPaper.id}'`
        );
      }

      const hasVerifiedContent = Boolean(rawPaper.isAvailable && rawPaper.paperContent);
      const availabilityStatus = hasVerifiedContent ? "available" : "unavailable";
      const sourceType = hasVerifiedContent ? "local" : "none";
      const published = hasVerifiedContent ? 1 : 0;
      const verified = hasVerifiedContent ? 1 : 0;
      const fileUrl = hasVerifiedContent ? `/api/papers/${rawPaper.id}` : null;
      const pc = rawPaper.paperContent;

      upsertPaper.run(
        rawPaper.id,
        targetMeta.semesterId,
        targetMeta.subjectId,
        targetMeta.code,
        targetMeta.name,
        rawPaper.year,
        rawPaper.exam,
        `GTU BCA Sem ${targetMeta.semesterId} - ${targetMeta.name} (${targetMeta.code}) ${rawPaper.exam} ${rawPaper.year}`,
        availabilityStatus,
        sourceType,
        fileUrl,
        rawPaper.fileName || null,
        rawPaper.fileSize || null,
        rawPaper.totalPages || null,
        pc?.totalMarks || 70,
        pc?.instructions ? JSON.stringify(pc.instructions) : null,
        pc?.date || null,
        pc?.time || null,
        published,
        verified
      );

      if (hasVerifiedContent && pc && Array.isArray(pc.sections)) {
        const maxUnitNum = Math.max(...Array.from(targetMeta.unitIdsByNumber.keys()), 1);
        let displayOrder = 1;

        for (let sIdx = 0; sIdx < pc.sections.length; sIdx++) {
          const sec = pc.sections[sIdx];
          const sectionNumber = sIdx + 1;
          // Map section index deterministically to a valid unit belonging to targetMeta.subjectId
          const mappedUnitNum = Math.min(sectionNumber, maxUnitNum);
          const unitId = targetMeta.unitIdsByNumber.get(mappedUnitNum) || null;
          const topicId = targetMeta.firstTopicIdByUnitNumber.get(mappedUnitNum) || null;

          for (const q of sec.questions) {
            const primaryId = `pq_${rawPaper.id}_${displayOrder}`;
            const subMatch = q.qNumber.match(/\(([a-z])\)/i);
            const subLabel = subMatch ? subMatch[1].toLowerCase() : null;

            upsertPaperQuestion.run(
              primaryId,
              rawPaper.id,
              targetMeta.subjectId,
              unitId,
              topicId,
              sectionNumber,
              sec.title,
              q.qNumber,
              subLabel,
              q.qNumber,
              0,
              q.text.trim(),
              q.marks,
              displayOrder
            );
            displayOrder++;

            if (q.orQuestion) {
              const altId = `pq_${rawPaper.id}_${displayOrder}`;
              upsertPaperQuestion.run(
                altId,
                rawPaper.id,
                targetMeta.subjectId,
                unitId,
                topicId,
                sectionNumber,
                sec.title,
                q.orQuestion.qNumber,
                subLabel,
                q.qNumber,
                1,
                q.orQuestion.text.trim(),
                q.orQuestion.marks,
                displayOrder
              );
              displayOrder++;
            }
          }
        }
      }
    }

    // 4. Quarantine Legacy Misrouted / Synthetic Rules from `serverQuizBank.ts`
    const legacyQuizMisroutes = [
      {
        id: "quarantine_quizbank_misroute_bca102_ds",
        legacyCode: "BCA102 -> dsQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA102 to Data Structures pool (dsQuestions), whereas canonical BCA102 is Fundamental of Programming (C) and Data Structure is BCA201.",
      },
      {
        id: "quarantine_quizbank_misroute_bca205_net",
        legacyCode: "BCA205 -> netQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA205 to Computer Networks pool, whereas canonical BCA205 is Mathematics-2 and Computer Networking is BCA303.",
      },
      {
        id: "quarantine_quizbank_misroute_bca302_os",
        legacyCode: "BCA302 -> osQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA302 to Operating Systems pool, whereas canonical BCA302 is Object Oriented Programming with Java and Operating System is BCA301.",
      },
      {
        id: "quarantine_quizbank_misroute_bca303_java",
        legacyCode: "BCA303 -> javaQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA303 to Java pool, whereas canonical BCA303 is Computer Networking and Java is BCA302.",
      },
      {
        id: "quarantine_quizbank_misroute_bca304_web",
        legacyCode: "BCA304 -> webQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA304 to Web pool, whereas canonical BCA304 is Mathematical Foundation for AI.",
      },
      {
        id: "quarantine_quizbank_misroute_bca401_dbms",
        legacyCode: "BCA401 -> dbmsQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA401 to DBMS pool, whereas canonical BCA401 is Python Programming and DBMS is BCA202.",
      },
      {
        id: "quarantine_quizbank_misroute_bca402_net",
        legacyCode: "BCA402 -> netQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA402 to Computer Networks pool, whereas canonical BCA402 is Software Engineering.",
      },
      {
        id: "quarantine_quizbank_misroute_bca403_python",
        legacyCode: "BCA403 -> pythonQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA403 to Python pool, whereas canonical BCA403 is Mobile Application Development and Python is BCA401.",
      },
      {
        id: "quarantine_quizbank_misroute_bca404_se",
        legacyCode: "BCA404 -> seQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA404 to Software Engineering pool, whereas canonical BCA404 is Information Security and Software Engineering is BCA402.",
      },
      {
        id: "quarantine_quizbank_misroute_bca501_java",
        legacyCode: "BCA501 -> javaQuestions",
        reason:
          "Legacy serverQuizBank.ts routed BCA501 to Java pool, whereas canonical BCA501 is Machine Learning.",
      },
      {
        id: "quarantine_quizbank_synthetic_templates",
        legacyCode: "serverQuizBank:curriculumPool+synthCounter",
        reason:
          "Excluded synthetic boilerplate MCQ generators (lines 1090-1361 of serverQuizBank.ts) per Phase 1.1 Section 6 & Phase 1.2 Rule 9 ('Do NOT fabricate missing papers or questions').",
      },
    ];

    for (const item of legacyQuizMisroutes) {
      upsertQuarantine.run(
        item.id,
        "serverQuizBank.ts",
        item.legacyCode,
        item.reason,
        JSON.stringify(item)
      );
    }

    // 5. Seed Verified Static MCQs into `questions` and link via `quizzes` + `quiz_questions`
    const upsertQuestion = db.prepare(`
      INSERT INTO questions (
        id, subject_id, unit_id, topic_id,
        question_text, question_hash, language, options_json,
        correct_index, explanation, difficulty, marks,
        source, ai_generated, verified, is_active, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'seed', 0, 1, 1, datetime('now'))
      ON CONFLICT(subject_id, question_hash) DO UPDATE SET
        unit_id = excluded.unit_id,
        topic_id = excluded.topic_id,
        question_text = excluded.question_text,
        language = excluded.language,
        options_json = excluded.options_json,
        correct_index = excluded.correct_index,
        explanation = excluded.explanation,
        difficulty = excluded.difficulty,
        verified = 1,
        is_active = 1,
        updated_at = datetime('now')
    `);

    const seededQuestionIdsBySubjectLang = new Map<string, string[]>();

    for (const q of VERIFIED_STATIC_MCQ_BANK) {
      const meta = subjectMetaByCode.get(q.subjectCode);
      if (!meta) {
        throw new Error(`Unknown canonical subjectCode '${q.subjectCode}' in VERIFIED_STATIC_MCQ_BANK`);
      }
      const unitId = meta.unitIdsByNumber.get(q.unitNumber) || meta.unitIdsByNumber.get(1) || null;
      const topicId =
        meta.firstTopicIdByUnitNumber.get(q.unitNumber) ||
        meta.firstTopicIdByUnitNumber.get(1) ||
        null;

      const qHash = computeQuestionHash(q.question);
      const deterministicQuestionId = `q_seed_${meta.code}_${qHash.slice(0, 16)}`;

      upsertQuestion.run(
        deterministicQuestionId,
        meta.subjectId,
        unitId,
        topicId,
        q.question.trim(),
        qHash,
        q.language,
        JSON.stringify(q.options),
        q.correctIndex,
        q.explanation.trim(),
        q.difficulty
      );

      // Fetch the actual id stored in case an existing row matched (subject_id, question_hash)
      const row = db
        .prepare("SELECT id FROM questions WHERE subject_id = ? AND question_hash = ?")
        .get(meta.subjectId, qHash) as { id: string };

      const groupKey = `${meta.code}:${q.language}`;
      const list = seededQuestionIdsBySubjectLang.get(groupKey) || [];
      if (!list.includes(row.id)) {
        list.push(row.id);
      }
      seededQuestionIdsBySubjectLang.set(groupKey, list);
    }

    // 6. Seed Canonical Practice Quizzes & `quiz_questions` Relational Join Records
    const upsertQuiz = db.prepare(`
      INSERT INTO quizzes (
        id, title, quiz_type, subject_id, unit_id, topic_id,
        language, difficulty, total_questions, total_marks,
        time_limit_minutes, is_published
      )
      VALUES (?, ?, 'practice', ?, NULL, NULL, ?, 'medium', ?, ?, 15, 1)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        subject_id = excluded.subject_id,
        language = excluded.language,
        total_questions = excluded.total_questions,
        total_marks = excluded.total_marks,
        is_published = 1
    `);

    const upsertQuizQuestion = db.prepare(`
      INSERT INTO quiz_questions (id, quiz_id, question_id, display_order, marks)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(quiz_id, question_id) DO UPDATE SET
        display_order = excluded.display_order,
        marks = excluded.marks
    `);

    for (const [groupKey, questionIds] of seededQuestionIdsBySubjectLang.entries()) {
      if (questionIds.length === 0) continue;
      const [code, lang] = groupKey.split(":") as [string, "en" | "hi"];
      const meta = subjectMetaByCode.get(code)!;
      const quizId = `quiz_seed_${code}_${lang}`;
      const title =
        lang === "hi"
          ? `${meta.name} (${code}) - अभ्यास प्रश्नोत्तरी`
          : `${meta.name} (${code}) - Canonical Practice Quiz`;

      upsertQuiz.run(
        quizId,
        title,
        meta.subjectId,
        lang,
        questionIds.length,
        questionIds.length
      );

      for (let i = 0; i < questionIds.length; i++) {
        const displayOrder = i + 1;
        const qqId = `qq_${quizId}_${displayOrder}`;
        upsertQuizQuestion.run(qqId, quizId, questionIds[i], displayOrder);
      }
    }

    // 7. Seed Default Admin & Student Accounts (INSERT OR IGNORE so existing users are never overwritten)
    const insertUserIfMissing = db.prepare(`
      INSERT OR IGNORE INTO users (
        id, name, email, password_hash, role, semester, branch, xp, streak, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, 'BCA', ?, 1, 1)
    `);

    const deterministicSaltAdmin = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
    const deterministicSaltStudent = "f0e1d2c3b4a5968778695a4b3c2d1e0f";

    insertUserIfMissing.run(
      "user_admin_default",
      "GTU Academic Admin",
      "admin@studymate.ai",
      hashPasswordScrypt("admin123", deterministicSaltAdmin),
      "admin",
      6,
      500
    );

    insertUserIfMissing.run(
      "user_student_default",
      "Aarav Patel",
      "student@studymate.ai",
      hashPasswordScrypt("student123", deterministicSaltStudent),
      "student",
      3,
      120
    );
  });

  runSeedTx();

  const count = (table: string): number => {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number };
    return Number(row.c);
  };

  return {
    semestersSeeded: count("semesters"),
    subjectsSeeded: count("subjects"),
    unitsSeeded: count("units"),
    topicsSeeded: count("topics"),
    studyMaterialsSeeded: count("study_materials"),
    papersSeeded: count("papers"),
    paperQuestionsSeeded: count("paper_questions"),
    questionsSeeded: count("questions"),
    quizzesSeeded: count("quizzes"),
    quizQuestionsSeeded: count("quiz_questions"),
    quarantinedCount: count("quarantined_legacy_records"),
  };
}
