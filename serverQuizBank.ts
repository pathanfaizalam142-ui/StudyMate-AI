import curriculumDataRaw from "./src/data/curriculumData.json" with { type: "json" };

// Subject-isolated university academic question banks for StudyMate AI
// Zero cross-contamination: each subject draws exclusively from its own curated pool

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  correctAnswerIndex: number;
  explanation: string;
}

export function normalizeQuestionKey(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\u0900-\u097F]/g, "")
    .trim();
}

interface CurriculumTopic {
  id: string;
  title: string;
  summary: string;
}

interface CurriculumUnit {
  unitNumber: number;
  unitName: string;
  topics: CurriculumTopic[];
  examQuestions: string[];
}

interface CurriculumSubject {
  semester: number;
  code: string;
  name: string;
  shortName: string;
  description: string;
  units: CurriculumUnit[];
}

const curriculumData = curriculumDataRaw as unknown as CurriculumSubject[];

// 1. COMPUTER NETWORKS
const netQuestionsEn: QuizQuestion[] = [
  {
    question: "At which layer of the 7-layer OSI reference model do TCP and UDP operate?",
    options: [
      "Network Layer (Layer 3)",
      "Transport Layer (Layer 4)",
      "Data Link Layer (Layer 2)",
      "Session Layer (Layer 5)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Transmission Control Protocol (TCP) and User Datagram Protocol (UDP) operate at Layer 4 (Transport Layer) to deliver end-to-end process-to-process communication.",
  },
  {
    question: "Which default well-known port is utilized by DNS (Domain Name System)?",
    options: [
      "Port 22 (SSH)",
      "Port 53 (DNS)",
      "Port 80 (HTTP)",
      "Port 443 (HTTPS)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "DNS servers listen for queries on port 53, primarily over UDP for rapid name resolution and TCP for zone transfers.",
  },
  {
    question: "What is the total address length in bits of an Internet Protocol version 4 (IPv4) address?",
    options: ["16 bits", "32 bits", "64 bits", "128 bits"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "An IPv4 address consists of 32 bits divided into 4 octets, whereas IPv6 uses 128 bits.",
  },
  {
    question: "In TCP connection establishment, what is the sequence of the 3-Way Handshake?",
    options: [
      "ACK → SYN → SYN-ACK",
      "SYN → SYN-ACK → ACK",
      "FIN → ACK → FIN-ACK",
      "SYN → PSH → ACK",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "TCP initiates a connection through a three-way handshake: Client sends SYN, Server replies with SYN-ACK, and Client sends ACK.",
  },
  {
    question: "Which protocol is responsible for mapping an IP address to a physical MAC address on a local area network?",
    options: ["DHCP", "ARP (Address Resolution Protocol)", "RARP", "ICMP"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "ARP (Address Resolution Protocol) broadcasts a query to discover the physical MAC address associated with an assigned IPv4 address.",
  },
  {
    question: "Which of the following routing protocols uses Dijkstra's shortest path algorithm?",
    options: [
      "Distance Vector Routing (RIP)",
      "Link State Routing (OSPF)",
      "Path Vector Routing (BGP)",
      "Flooding Routing",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "OSPF (Open Shortest Path First) is a Link State routing protocol that runs Dijkstra's algorithm to calculate the shortest path tree to every node.",
  },
  {
    question: "What is the default subnet mask for a standard Class C IPv4 network?",
    options: [
      "255.0.0.0 (/8)",
      "255.255.0.0 (/16)",
      "255.255.255.0 (/24)",
      "255.255.255.255 (/32)",
    ],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "Class C addresses use 24 network bits and 8 host bits, yielding the standard subnet mask 255.255.255.0 (/24).",
  },
];

const netQuestionsHi: QuizQuestion[] = [
  {
    question: "OSI मॉडल के किस लेयर पर TCP और UDP प्रोटोकॉल कार्य करते हैं?",
    options: [
      "नेटवर्क लेयर (Layer 3)",
      "ट्रांसपोर्ट लेयर (Layer 4)",
      "डेटा लिंक लेयर (Layer 2)",
      "एप्लिकेशन लेयर (Layer 7)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "TCP और UDP ट्रांसपोर्ट लेयर (लेयर 4) के प्रोटोकॉल हैं जो प्रोसेस-टू-प्रोसेस एंड-टू-एंड संचार प्रदान करते हैं।",
  },
  {
    question: "DNS (Domain Name System) सामान्यतः किस पोर्ट नंबर पर कार्य करता है?",
    options: ["Port 21", "Port 25", "Port 53", "Port 80"],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "DNS सामान्यतः डोमेन नाम रिज़ॉल्यूशन के लिए UDP/TCP पोर्ट 53 का उपयोग करता है।",
  },
  {
    question: "IPv4 एड्रेस में कुल कितने बिट्स (Bits) होते हैं?",
    options: ["16 बिट्स", "32 बिट्स", "64 बिट्स", "128 बिट्स"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "IPv4 एड्रेस 32 बिट्स (4 बाइट्स) का होता है, जबकि IPv6 एड्रेस 128 बिट्स का होता है।",
  },
  {
    question: "TCP कनेक्शन स्थापना में 3-वे हैंडशेक (3-Way Handshake) का सही क्रम क्या है?",
    options: [
      "ACK → SYN → SYN-ACK",
      "SYN → SYN-ACK → ACK",
      "FIN → ACK → FIN-ACK",
      "SYN → PSH → ACK",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "TCP कनेक्शन शुरू करने के लिए क्लाइंट पहले SYN भेजता है, सर्वर SYN-ACK भेजता है, और फिर क्लाइंट ACK पुष्टि भेजता है।",
  },
  {
    question: "स्थानीय नेटवर्क पर IP एड्रेस को फिजिकल MAC एड्रेस में बदलने के लिए कौन सा प्रोटोकॉल जिम्मेदार है?",
    options: ["DHCP", "ARP (Address Resolution Protocol)", "RARP", "ICMP"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "ARP (एड्रेस रिज़ॉल्यूशन प्रोटोकॉल) ज्ञात IP पते के अनुरूप डिवाइस का भौतिक MAC पता खोजने के लिए ब्रॉडकास्ट करता है।",
  },
];

// 2. JAVA / OOP
const javaQuestionsEn: QuizQuestion[] = [
  {
    question: "Which Object-Oriented concept is demonstrated when a subclass provides its own specific implementation of a parent class method?",
    options: [
      "Method Overloading (Static Polymorphism)",
      "Method Overriding (Dynamic Runtime Polymorphism)",
      "Encapsulation through access modifiers",
      "Static Constructor Binding",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Method Overriding is dynamic runtime polymorphism where a derived class provides a specific implementation of an inherited method.",
  },
  {
    question: "In the Java Virtual Machine (JVM), where are object instances dynamically allocated?",
    options: [
      "Call Stack frame",
      "Heap Memory space",
      "CPU Program Counter",
      "Native Method Stack",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "In Java, all objects created with 'new' reside in Heap Memory, which is automatically managed by the Garbage Collector.",
  },
  {
    question: "Why are String objects designed to be immutable in Java?",
    options: [
      "To prevent methods from taking parameters",
      "For Security, Thread Safety, and String Constant Pool optimization",
      "Because Java does not support character arrays",
      "To eliminate Heap memory overhead completely",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Immutability allows Java to safely reuse strings in the String Constant Pool, guarantees thread safety across threads, and secures network sockets.",
  },
  {
    question: "Which of the following exceptions is an UNCHECKED exception in Java?",
    options: [
      "java.io.IOException",
      "java.sql.SQLException",
      "java.lang.NullPointerException",
      "java.lang.ClassNotFoundException",
    ],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "NullPointerException inherits from RuntimeException, making it an unchecked exception that does not require mandatory try-catch or throws clauses.",
  },
  {
    question: "What keyword is used in Java to prevent a class from being inherited (subclassed)?",
    options: ["static", "final", "abstract", "synchronized"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "The 'final' keyword applied to a class declaration prevents any subclass from extending it (e.g. public final class String).",
  },
  {
    question: "Which collection interface in Java guarantees unique elements and does not permit duplicates?",
    options: ["List", "Set", "Queue", "Vector"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "The Set interface (e.g., HashSet, TreeSet) models a mathematical set and strictly prohibits duplicate elements.",
  },
];

const javaQuestionsHi: QuizQuestion[] = [
  {
    question: "जावा (Java) में मेथड ओवरराइडिंग (Method Overriding) किस प्रकार के बहुरूपता (Polymorphism) का उदाहरण है?",
    options: [
      "कंपाइल-टाइम पॉलीमॉर्फिज्म",
      "रन-टाइम (डायनामिक) पॉलीमॉर्फिज्म",
      "स्टैटिक बाइंडिंग",
      "प्रीप्रोसेसर पॉलीमॉर्फिज्म",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "मेथड ओवरराइडिंग रनटाइम पॉलीमॉर्फिज्म का उदाहरण है, जहाँ मेथड का निर्णय प्रोग्राम के निष्पादन के समय ऑब्जेक्ट के प्रकार के आधार पर होता है।",
  },
  {
    question: "जावा में ऑब्जेक्ट्स (Objects) को मेमोरी के किस भाग में आवंटित किया जाता है?",
    options: [
      "स्टैक मेमोरी (Stack Memory)",
      "हीप मेमोरी (Heap Memory)",
      "रजिस्टर (Registers)",
      "मेथड एरिया कोड सेगमेंट",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "जावा में सभी ऑब्जेक्ट्स और उनके इंस्टेंस वेरिएबल हीप (Heap) मेमोरी में आवंटित होते हैं, जबकि लोकल वेरिएबल स्टैक में रहते हैं।",
  },
  {
    question: "जावा में स्ट्रिंग (String) ऑब्जेक्ट्स को इम्यूटेबल (Immutable) क्यों बनाया गया है?",
    options: [
      "ताकि स्ट्रिंग का आकार कभी न बदले",
      "सुरक्षा (Security), थ्रेड-सेफ्टी और स्ट्रिंग पूल कैशिंग के लिए",
      "कंपाइलर की गति बढ़ाने के लिए",
      "मेमोरी स्पेस को सीमित करने के लिए",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "स्ट्रिंग की इम्यूटेबिलिटी स्ट्रिंग कांस्टेंट पूल को संभव बनाती है, मल्टीथ्रेडिंग में डेटा करप्शन रोकती है और नेटवर्क कनेक्शन में सुरक्षा प्रदान करती है।",
  },
  {
    question: "जावा में अनचेक्ड अपवाद (Unchecked Exception) का सही उदाहरण कौन सा है?",
    options: [
      "IOException",
      "SQLException",
      "NullPointerException",
      "ClassNotFoundException",
    ],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "NullPointerException, RuntimeException का उपवर्ग है, इसलिए यह एक अनचेक्ड अपवाद है जिसे कंपाइलर अनिवार्य रूप से पकड़ने के लिए बाध्य नहीं करता।",
  },
];

// 3. OPERATING SYSTEMS
const osQuestionsEn: QuizQuestion[] = [
  {
    question: "In Operating Systems, which of the following is NOT one of the necessary Coffman conditions for a Deadlock?",
    options: [
      "Mutual Exclusion",
      "Hold and Wait",
      "Preemption Allowed",
      "Circular Wait",
    ],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed, deadlock is avoided.",
  },
  {
    question: "Which CPU scheduling algorithm is prone to the 'Convoy Effect'?",
    options: [
      "Round Robin (RR)",
      "Shortest Job First (SJF)",
      "First-Come, First-Served (FCFS)",
      "Priority Scheduling",
    ],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "In FCFS, when a CPU-intensive process executes first, all shorter I/O-bound processes wait behind it, causing the convoy effect.",
  },
  {
    question: "Belady's Anomaly in memory management is observed in which page replacement algorithm?",
    options: [
      "Least Recently Used (LRU)",
      "First In First Out (FIFO)",
      "Optimal Page Replacement (OPT)",
      "Least Frequently Used (LFU)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "In FIFO page replacement, allocating more physical page frames can paradoxically increase the number of page faults.",
  },
  {
    question: "What is the primary objective of Dijkstra's Banker's Algorithm?",
    options: [
      "Deadlock Detection",
      "Deadlock Avoidance by ensuring safe states",
      "Deadlock Recovery through process termination",
      "Disk Head Scheduling",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Banker's Algorithm is a deadlock avoidance algorithm that tests for safety by simulating the allocation of maximum predetermined resources.",
  },
  {
    question: "What role does the Translation Lookaside Buffer (TLB) play in virtual memory architecture?",
    options: [
      "Replaces the central CPU registers",
      "Caches virtual-to-physical address translations to accelerate lookup",
      "Synchronizes thread states in multi-core environments",
      "Acts as secondary flash storage for paging files",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "TLB is a fast associative hardware cache that speeds up virtual-to-physical address translation by storing recent page table entries.",
  },
];

const osQuestionsHi: QuizQuestion[] = [
  {
    question: "ऑपरेटिंग सिस्टम (OS) में डेडलॉक (Deadlock) के लिए निम्नलिखित में से कौन सी कॉफ़मैन शर्त आवश्यक नहीं है?",
    options: [
      "म्युचुअल एक्सक्लूजन (Mutual Exclusion)",
      "होल्ड एंड वेट (Hold and Wait)",
      "प्रीएम्पशन की अनुमति (Preemption Allowed)",
      "सर्कुलर वेट (Circular Wait)",
    ],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "डेडलॉक के 4 कॉफ़मैन नियम हैं: Mutual Exclusion, Hold and Wait, No Preemption (प्रीएम्पशन न होना), और Circular Wait। यदि प्रीएम्पशन की अनुमति हो तो डेडलॉक नहीं हो सकता।",
  },
  {
    question: "कौन सा CPU शेड्यूलिंग एल्गोरिदम 'कॉन्वॉय इफ़ेक्ट' (Convoy Effect) से पीड़ित हो सकता है?",
    options: [
      "राउंड रॉबिन (Round Robin)",
      "शॉर्टेस्ट जॉब फर्स्ट (SJF)",
      "फ़र्स्ट कम फ़र्स्ट सर्व्ड (FCFS)",
      "प्रायोरिटी शेड्यूलिंग (Priority Scheduling)",
    ],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "FCFS में यदि एक लंबा CPU-बाउंड प्रोसेस पहले आ जाता है, तो सभी छोटे I/O प्रोसेस उसके पीछे अटके रह जाते हैं, जिसे कॉन्वॉय इफ़ेक्ट कहा जाता है।",
  },
  {
    question: "मेमोरी मैनेजमेंट में बेलेडी विसंगति (Belady's Anomaly) किस पेज रिप्लेसमेंट एल्गोरिदम में देखी जाती है?",
    options: [
      "LRU (लीस्ट रीसेंटली यूज़्ड)",
      "FIFO (फ़र्स्ट इन फ़र्स्ट आउट)",
      "ऑप्टिमल पेज रिप्लेसमेंट",
      "LFU (लीस्ट फ्रीक्वेंटली यूज़्ड)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "FIFO एल्गोरिदम में कभी-कभी अधिक पेज फ्रेम आवंटित करने पर भी पेज फॉल्ट की संख्या बढ़ जाती है, जिसे बेलेडी विसंगति कहते हैं।",
  },
  {
    question: "बैंकर्स एल्गोरिदम (Banker's Algorithm) का प्राथमिक उद्देश्य क्या है?",
    options: [
      "डेडलॉक का पता लगाना (Deadlock Detection)",
      "डेडलॉक से बचाव (Deadlock Avoidance)",
      "डेडलॉक से पुनर्प्राप्ति (Deadlock Recovery)",
      "डिस्क शेड्यूलिंग (Disk Scheduling)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "बैंकर्स एल्गोरिदम एक डेडलॉक अवाइडेंस (बचाव) एल्गोरिदम है जो सुरक्षित स्थिति (Safe State) की पुष्टि करने के बाद ही रिसोर्स आवंटित करता है।",
  },
];

// 4. DATABASE MANAGEMENT SYSTEMS / SQL
const dbmsQuestionsEn: QuizQuestion[] = [
  {
    question: "Which normal form removes partial functional dependencies on composite primary keys?",
    options: [
      "First Normal Form (1NF)",
      "Second Normal Form (2NF)",
      "Third Normal Form (3NF)",
      "Boyce-Codd Normal Form (BCNF)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "2NF requires the table to be in 1NF and mandates that no non-prime attribute is partially dependent on any candidate key.",
  },
  {
    question: "What does the 'A' represent in ACID transaction properties of a DBMS?",
    options: [
      "Authentication",
      "Atomicity (All or Nothing execution)",
      "Availability",
      "Authorization",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Atomicity guarantees that all operations within a database transaction complete successfully, or all changes are rolled back entirely.",
  },
  {
    question: "Which SQL constraint enforces referential integrity between parent and child tables?",
    options: ["PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "A FOREIGN KEY constraint prevents invalid data from being inserted into the child table by requiring values to exist in the parent table's PRIMARY KEY.",
  },
  {
    question: "Which type of SQL JOIN returns all rows from the left table and matching rows from the right table?",
    options: ["INNER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "CROSS JOIN"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "LEFT OUTER JOIN retrieves every record from the left table, paired with matched records from the right table or NULLs where matches fail.",
  },
  {
    question: "In relational algebra, which operation is used to project specific columns from a relation?",
    options: [
      "Selection (σ)",
      "Projection (π)",
      "Cartesian Product (×)",
      "Intersection (∩)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Projection (pi, π) chooses specified attributes (columns) and eliminates duplicate tuples from a relation.",
  },
];

const dbmsQuestionsHi: QuizQuestion[] = [
  {
    question: "डेटाबेस में आंशिक निर्भरता (Partial Functional Dependency) को हटाने के लिए कौन सा नॉर्मल फॉर्म आवश्यक है?",
    options: [
      "प्रथम नॉर्मल फॉर्म (1NF)",
      "द्वितीय नॉर्मल फॉर्म (2NF)",
      "तृतीय नॉर्मल फॉर्म (3NF)",
      "BCNF",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "2NF में टेबल का 1NF में होना और कंपोजिट प्राइमरी की पर किसी भी गैर-की विशेषता की आंशिक निर्भरता का न होना अनिवार्य है।",
  },
  {
    question: "DBMS में ACID प्रॉपर्टीज में 'A' का क्या अर्थ है?",
    options: [
      "ऑथेंटिकेशन (Authentication)",
      "एटॉमीसिटी (Atomicity - All or Nothing)",
      "अवेलेबिलिटी (Availability)",
      "एनालिसिस (Analysis)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "एटॉमीसिटी (Atomicity) यह सुनिश्चित करती है कि लेन-देन (Transaction) के सभी कार्य या तो पूरी तरह से सफल हों या कुछ भी न हो (All or Nothing)।",
  },
  {
    question: "दो तालिकाओं के बीच रेफरेंशियल इंटीग्रिटी बनाए रखने के लिए किस SQL बाधा (Constraint) का उपयोग किया जाता है?",
    options: ["PRIMARY KEY", "FOREIGN KEY", "CHECK", "NOT NULL"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "FOREIGN KEY एक टेबल के कॉलम को दूसरी टेबल की PRIMARY KEY से जोड़कर रेफरेंशियल इंटीग्रिटी सुनिश्चित करती है।",
  },
];

// 5. DATA STRUCTURES & C
const dsQuestionsEn: QuizQuestion[] = [
  {
    question: "Which traversal of a Binary Search Tree (BST) produces the elements in ascending sorted order?",
    options: [
      "Preorder Traversal (Root, Left, Right)",
      "Inorder Traversal (Left, Root, Right)",
      "Postorder Traversal (Left, Right, Root)",
      "Level-order Traversal (BFS)",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Inorder traversal visits Left subtree, then Root, then Right subtree, strictly yielding elements in monotonically increasing order in a BST.",
  },
  {
    question: "What is the worst-case time complexity of Merge Sort?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Merge Sort consistently divides subproblems and merges in linear time, guaranteeing O(n log n) in best, average, and worst cases.",
  },
  {
    question: "What data structure operates on the Last-In, First-Out (LIFO) principle?",
    options: ["Queue", "Stack", "Linked List", "Binary Heap"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "A Stack restricts insertion and deletion to one end (the top), adhering to the Last-In First-Out (LIFO) protocol.",
  },
  {
    question: "What is the time complexity of searching for an element in a balanced AVL or Red-Black Tree with n nodes?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Self-balancing binary search trees maintain a maximum height bounded by O(log n), ensuring search, insert, and delete take O(log n).",
  },
];

const dsQuestionsHi: QuizQuestion[] = [
  {
    question: "बाइनरी सर्च ट्री (BST) का इन-ऑर्डर ट्रैवर्सल (Inorder Traversal) किस क्रम में नोड्स उत्पन्न करता है?",
    options: [
      "घटते (Descending) क्रम में",
      "बढ़ते (Ascending / Sorted) क्रम में",
      "रैंडम क्रम में",
      "नोड इंसर्शन के क्रम में",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "किसी भी बाइनरी सर्च ट्री (BST) का इन-ऑर्डर ट्रैवर्सल (Left -> Root -> Right) तत्वों को हमेशा आरोही (Sorted) क्रम में प्रिंट करता है।",
  },
  {
    question: "मर्ज सॉर्ट (Merge Sort) एल्गोरिदम का सबसे खराब स्थिति (Worst-case) समय जटिलता क्या है?",
    options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "मर्ज सॉर्ट डिवाइड एंड कॉन्कर विधि पर आधारित है और सभी मामलों (Best, Average, Worst) में O(n log n) समय जटिलता की गारंटी देता है।",
  },
  {
    question: "स्टैक (Stack) डेटा संरचना किस सिद्धांत पर कार्य करती है?",
    options: [
      "FIFO (First In First Out)",
      "LIFO (Last In First Out)",
      "Priority Based",
      "Random Access",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "स्टैक LIFO (Last In, First Out) सिद्धांत पर काम करता है, जहाँ जो तत्व सबसे अंत में पुश (Push) होता है वह सबसे पहले पॉप (Pop) होता है।",
  },
];

// 6. WEB DEVELOPMENT & TECHNOLOGIES
const webQuestionsEn: QuizQuestion[] = [
  {
    question: "Which HTTP request method is defined as idempotent according to RFC specifications?",
    options: ["POST", "GET and PUT", "PATCH (without condition)", "CONNECT"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "GET, PUT, and DELETE methods are idempotent because executing them multiple times produces the identical side effect on the server state.",
  },
  {
    question: "What is the primary difference between localStorage and sessionStorage in browser web APIs?",
    options: [
      "sessionStorage persists across browser restarts; localStorage does not",
      "localStorage persists indefinitely until cleared; sessionStorage expires when the browser tab closes",
      "localStorage has a 4KB limit; sessionStorage has 5MB",
      "sessionStorage is sent with every HTTP request cookie",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "localStorage data persists until manually removed by user or script, whereas sessionStorage lives only for the duration of the page session.",
  },
  {
    question: "In CSS, which display model arranges elements in a two-dimensional grid of rows and columns?",
    options: ["display: flex", "display: grid", "display: inline-block", "display: table-cell"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "CSS Grid Layout is designed specifically for two-dimensional layouts, controlling both rows and columns simultaneously.",
  },
  {
    question: "In JavaScript, which mechanism allows execution of asynchronous operations without blocking the main call stack?",
    options: ["Event Loop and Task Queue", "Garbage Collector", "Compiler Optimization Pass", "Synchronous File Lock"],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "The JavaScript Event Loop monitors the call stack and dequeues callback tasks from the task/microtask queue when the stack clears.",
  },
  {
    question: "What does the 'Same-Origin Policy' enforce in web browsers?",
    options: [
      "Allows any script to read document cookies from other domains",
      "Restricts documents and scripts loaded by one origin from accessing resources from another origin",
      "Forces all web pages to use the HTTPS protocol exclusively",
      "Prevents CSS files from loading external web fonts",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Same-Origin Policy (SOP) is a critical browser security boundary that isolates potentially malicious documents loaded from different origins.",
  },
];

const webQuestionsHi: QuizQuestion[] = [
  {
    question: "ब्राउज़र वेब API में localStorage और sessionStorage के बीच प्राथमिक अंतर क्या है?",
    options: [
      "sessionStorage स्थायी है; localStorage नहीं",
      "localStorage अनिश्चित काल तक रहता है; sessionStorage टैब बंद होते ही समाप्त हो जाता है",
      "localStorage कुकीज़ के साथ सर्वर को भेजा जाता है",
      "sessionStorage केवल बैकएंड सर्वर पर काम करता है",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "localStorage डेटा ब्राउज़र बंद होने के बाद भी सुरक्षित रहता है, जबकि sessionStorage केवल वर्तमान ब्राउज़र टैब सत्र तक सीमित रहता है।",
  },
  {
    question: "HTTP विनिर्देशों के अनुसार निम्नलिखित में से कौन सा मेथड आइडमपोटेंट (Idempotent) है?",
    options: ["POST", "GET और PUT", "PATCH", "CONNECT"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "GET, PUT और DELETE आइडमपोटेंट होते हैं क्योंकि इन्हें कई बार कॉल करने पर भी सर्वर स्थिति पर समान प्रभाव पड़ता है।",
  },
  {
    question: "CSS में कौन सा डिस्प्ले मॉडल दो-आयामी (Rows और Columns) लेआउट प्रदान करता है?",
    options: ["display: flex", "display: grid", "display: inline-block", "display: inline"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "CSS Grid लेआउट दो-आयामी (पंक्तियों और स्तंभों) ग्रिड संरचना को नियंत्रित करने के लिए डिज़ाइन किया गया है।",
  },
  {
    question: "जावास्क्रिप्ट (JavaScript) में नॉन-ब्लॉकिंग एसिंक्रोनस कोड निष्पादित करने के लिए कौन सा तंत्र कार्य करता है?",
    options: ["इवेंट लूप और टास्क कतार (Event Loop & Task Queue)", "गारबेज कलेक्टर", "मेमोरी स्वैप", "सिंक्रोनस लॉक"],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "इवेंट लूप कॉल स्टैक और टास्क क्यू का समन्वय करके एसिंक्रोनस कॉलबैक को गैर-अवरोधक तरीके से चलाता है।",
  },
  {
    question: "वेब ब्राउज़र में सेम-ओरिजिन पॉलिसी (Same-Origin Policy) का क्या उद्देश्य है?",
    options: [
      "किसी भी डोमेन को बिना अनुमति कुकीज़ पढ़ने देना",
      "एक ऑरिजिन के स्क्रिप्ट को दूसरे ऑरिजिन के रिसोर्स तक अनधिकृत पहुँच से रोकना",
      "सभी वेबसाइटों के लिए पासवर्ड अनिवार्य करना",
      "ब्राउज़र कैश को पूरी तरह अक्षम करना",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "सेम-ओरिजिन पॉलिसी एक सुरक्षा तंत्र है जो अलग-अलग डोमेन के बीच अनधिकृत डेटा एक्सेस को प्रतिबंधित करता है।",
  },
];

// 7. PYTHON PROGRAMMING
const pythonQuestionsEn: QuizQuestion[] = [
  {
    question: "Which of the following built-in data types in Python is IMMUTABLE?",
    options: ["List", "Dictionary", "Tuple", "Set"],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "In Python, Tuples, Strings, and Numbers are immutable; once created, their internal state cannot be modified in place.",
  },
  {
    question: "What is the output of the Python expression: [x**2 for x in range(4) if x % 2 == 0]?",
    options: ["[0, 1, 4, 9]", "[0, 4]", "[1, 9]", "[4]"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "range(4) produces 0, 1, 2, 3. The condition x % 2 == 0 filters 0 and 2. Squaring them yields [0, 4].",
  },
  {
    question: "In Python, what keyword is used to create an anonymous inline function?",
    options: ["def", "lambda", "inline", "func"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "The 'lambda' keyword creates small anonymous functions syntactically restricted to a single expression.",
  },
  {
    question: "Which Python dictionary method safely retrieves a value for a key without throwing a KeyError if missing?",
    options: ["dict.fetch()", "dict.get()", "dict.lookup()", "dict.popitem()"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "dict.get(key, default) returns the value if present, or None/specified default if the key does not exist.",
  },
  {
    question: "What does the '__init__' method represent in a Python class definition?",
    options: [
      "The class destructor",
      "The instance initializer constructor method",
      "A static class variable decorator",
      "The string representation method",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "'__init__' is the constructor method called automatically whenever a new instance of the class is instantiated.",
  },
];

const pythonQuestionsHi: QuizQuestion[] = [
  {
    question: "पायथन (Python) में निम्नलिखित में से कौन सा डेटा प्रकार इम्यूटेबल (अपरिवर्तनीय) है?",
    options: ["List", "Dictionary", "Tuple", "Set"],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "पायथन में Tuple और String इम्यूटेबल होते हैं, जिनका निर्माण होने के बाद उनके मानों को सीधे बदला नहीं जा सकता।",
  },
  {
    question: "पायथन में अनाम (Anonymous) इनलाइन फ़ंक्शन बनाने के लिए किस कीवर्ड का उपयोग किया जाता है?",
    options: ["def", "lambda", "inline", "function"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "lambda कीवर्ड का उपयोग बिना नाम के छोटे इनलाइन फ़ंक्शंस को परिभाषित करने के लिए किया जाता है।",
  },
  {
    question: "पायथन डिक्शनरी में बिना KeyError के मान सुरक्षित रूप से प्राप्त करने के लिए कौन सा मेथड है?",
    options: ["dict.search()", "dict.get()", "dict.find()", "dict.pull()"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "dict.get() मेथड की (Key) मौजूद न होने पर त्रुटि देने के बजाय डिफ़ॉल्ट मान (जैसे None) देता है।",
  },
  {
    question: "पायथन क्लास में '__init__' मेथड का मुख्य कार्य क्या है?",
    options: [
      "ऑब्जेक्ट को नष्ट करना",
      "ऑब्जेक्ट कंस्ट्रक्टर (इनिशियलाइज़र) के रूप में कार्य करना",
      "क्लास को इनहेरिट करना",
      "मेमोरी क्लीनअप करना",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "__init__ पायथन में कंस्ट्रक्टर मेथड है, जो नया ऑब्जेक्ट बनते ही अपने-आप निष्पादित होता है।",
  },
  {
    question: "पायथन में [x for x in range(5) if x % 2 != 0] का आउटपुट क्या होगा?",
    options: ["[0, 2, 4]", "[1, 3]", "[1, 3, 5]", "[0, 1, 2, 3, 4]"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "range(5) में 0,1,2,3,4 होते हैं। x % 2 != 0 विषम संख्याएँ (1 और 3) चुनता है।",
  },
];

// 8. SOFTWARE ENGINEERING
const seQuestionsEn: QuizQuestion[] = [
  {
    question: "In software engineering, which architectural metric evaluates the degree to which module elements belong together?",
    options: ["Coupling", "Cohesion", "Inheritance depth", "Polymorphism"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Cohesion measures the strength of relationship between the internal methods and data of a single module; high cohesion is ideal.",
  },
  {
    question: "Which SDLC model is best suited for projects where user requirements are uncertain or continually evolving?",
    options: ["Waterfall Model", "Agile / Scrum", "V-Model", "Big Bang Model"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Agile methodologies use iterative sprints and regular feedback to adapt seamlessly to changing user requirements.",
  },
  {
    question: "What is the primary difference between Black-box testing and White-box testing?",
    options: [
      "Black-box testing inspects internal code paths; White-box does not",
      "White-box testing inspects internal code and branch logic; Black-box focuses purely on external inputs/outputs",
      "Black-box testing is performed exclusively by compilers",
      "White-box testing is only conducted in production environments",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "White-box testing tests internal structures and implementation logic, while Black-box testing validates functionality against requirements without internal code visibility.",
  },
  {
    question: "In software metrics, what does Cyclomatic Complexity measure?",
    options: [
      "Total lines of code (LOC)",
      "Number of linearly independent execution paths through program source code",
      "Network latency between client and database server",
      "Cost estimation for project developers",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "Cyclomatic complexity measures the number of decision points (conditions and branches) to determine independent control flow paths.",
  },
  {
    question: "Which document represents the formal agreement of functional and non-functional system capabilities between client and developers?",
    options: [
      "Software Requirements Specification (SRS)",
      "Source Code Repository Git Log",
      "User Acceptance Test Run Sheet",
      "Database Schema Migration Script",
    ],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "The Software Requirements Specification (SRS) formally captures all behavioral, functional, and non-functional commitments of a software system.",
  },
];

const seQuestionsHi: QuizQuestion[] = [
  {
    question: "सॉफ्टवेयर इंजीनियरिंग में अच्छे डिजाइन के लिए कौन सा सिद्धांत सबसे महत्वपूर्ण है?",
    options: [
      "हाई कपलिंग और लो कोहेशन",
      "हाई कोहेशन और लो कपलिंग (High Cohesion, Low Coupling)",
      "कोई टेस्टिंग न करना",
      "सभी कोड एक ही फ़ाइल में लिखना",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "हाई कोहेशन सुनिश्चित करता है कि मॉड्यूल के तत्व एक साथ कार्य करें, और लो कपलिंग सुनिश्चित करता है कि मॉड्यूल एक-दूसरे पर कम निर्भर हों।",
  },
  {
    question: "सॉफ्टवेयर विकास में एजाइल (Agile) पद्धति का सबसे बड़ा लाभ क्या है?",
    options: [
      "बदलती आवश्यकताओं के प्रति तीव्र अनुकूलन और पुनरावृत्ति (Iterative) डिलीवरी",
      "परियोजना में किसी ग्राहक संवाद की आवश्यकता न होना",
      "कोई कोड टेस्ट न करना",
      "केवल एक ही बार अंत में सॉफ्टवेयर डिलीवर करना",
    ],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "एजाइल मॉडल छोटे-छोटे स्प्रिंट्स के माध्यम से परिवर्तनों को आसानी से स्वीकार करता है और नियमित फीडबैक पर कार्य करता है।",
  },
  {
    question: "सॉफ्टवेयर टेस्टिंग में ब्लैक-बॉक्स और व्हाइट-बॉक्स टेस्टिंग में मुख्य अंतर क्या है?",
    options: [
      "ब्लैक-बॉक्स में आंतरिक कोड की जांच होती है",
      "व्हाइट-बॉक्स में आंतरिक कोड लॉजिक की जांच होती है, जबकि ब्लैक-बॉक्स में इनपुट-आउटपुट व्यवहार देखा जाता है",
      "दोनों में कोई अंतर नहीं है",
      "व्हाइट-बॉक्स केवल हार्डवेयर के लिए होता है",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "व्हाइट-बॉक्स टेस्टिंग आंतरिक कोड संरचना पर आधारित होती है, जबकि ब्लैक-बॉक्स विनिर्देशों के अनुसार बाहरी कार्यप्रणाली का परीक्षण करती है।",
  },
  {
    question: "सॉफ्टवेयर विकास जीवन चक्र (SDLC) में SRS का पूरा नाम क्या है?",
    options: [
      "Software Requirements Specification",
      "System Resource Standard",
      "Standard Release System",
      "Source Reliability Service",
    ],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "SRS (Software Requirements Specification) सॉफ्टवेयर की कार्यात्मक और गैर-कार्यात्मक आवश्यकताओं का औपचारिक दस्तावेज़ है।",
  },
  {
    question: "सॉफ्टवेयर रखरखाव (Software Maintenance) में रिग्रेशन टेस्टिंग (Regression Testing) क्यों की जाती है?",
    options: [
      "यह सुनिश्चित करने के लिए कि नए बदलावों से मौजूदा कार्यप्रणाली में कोई त्रुटि न आई हो",
      "सॉफ्टवेयर का आकार बढ़ाने के लिए",
      "इंटरनेट कनेक्शन की गति मापने के लिए",
      "डेटाबेस को खाली करने के लिए",
    ],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "रिग्रेशन टेस्टिंग यह पुष्टि करती है कि कोड में किए गए हालिया सुधार या नए फीचर से पहले से काम कर रहे फीचर्स में कोई नई समस्या नहीं आई है।",
  },
];

// 9. COMPUTER ORGANIZATION / FCO
const coQuestionsEn: QuizQuestion[] = [
  {
    question: "In Von Neumann architecture, which subsystem coordinates and directs the operations of all other CPU components?",
    options: [
      "Arithmetic Logic Unit (ALU)",
      "Control Unit (CU)",
      "Memory Address Register (MAR)",
      "Input Buffer",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "The Control Unit (CU) fetches, decodes, and orchestrates the execution of instructions across the CPU and system bus.",
  },
  {
    question: "Which level in the computer memory hierarchy delivers the lowest access latency to the processor core?",
    options: ["Main RAM", "CPU Registers", "Level 2 (L2) Cache", "Secondary SSD"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "CPU Registers operate within fractions of a clock cycle on the CPU die, offering the lowest access latency.",
  },
  {
    question: "What is the primary function of the Program Counter (PC) register in a central processor?",
    options: [
      "Stores the memory address of the next instruction to be fetched and executed",
      "Counts the total number of arithmetic operations performed by the ALU",
      "Stores the result of the previous comparison instruction",
      "Maintains the interrupt vector table offset",
    ],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "The Program Counter (PC) holds the memory address from which the CPU will fetch the next instruction.",
  },
  {
    question: "In computer arithmetic, what representation standard is universally employed to represent signed integers in modern processors?",
    options: ["Sign-Magnitude", "One's Complement", "Two's Complement", "Excess-64 Notation"],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "Two's complement has a single representation for zero (no negative zero) and allows identical binary addition logic for signed and unsigned integers.",
  },
  {
    question: "What is the purpose of instruction pipelining in CPU microarchitectures?",
    options: [
      "Overlapping the execution stages of multiple instructions to maximize instruction throughput",
      "Replacing physical memory with optical storage lines",
      "Preventing cache misses completely",
      "Reducing clock speed to conserve CPU battery life",
    ],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "Instruction pipelining divides instruction processing into discrete stages (fetch, decode, execute, writeback) running in parallel across multiple instructions.",
  },
];

const coQuestionsHi: QuizQuestion[] = [
  {
    question: "वॉन न्यूमैन (Von Neumann) आर्किटेक्चर में कौन सा भाग अन्य सभी CPU घटकों के कार्यों का समन्वय और नियंत्रण करता है?",
    options: [
      "अरिथमेटिक लॉजिक यूनिट (ALU)",
      "कंट्रोल यूनिट (Control Unit - CU)",
      "मेमोरी एड्रेस रजिस्टर",
      "हार्ड डिस्क ड्राइव",
    ],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "कंट्रोल यूनिट (CU) निर्देशों को फेच, डीकोड और निष्पादित करके पूरे कंप्यूटर सिस्टम की गतिविधियों का संचालन करती है।",
  },
  {
    question: "कंप्यूटर मेमोरी पदानुक्रम (Memory Hierarchy) में सबसे तेज़ एक्सेस स्पीड किसकी होती है?",
    options: ["मेन रैम (RAM)", "CPU रजिस्टर्स", "हार्ड डिस्क", "L3 कैश"],
    correctAnswer: 1,
    correctAnswerIndex: 1,
    explanation: "CPU रजिस्टर्स सीधे प्रोसेसर के अंदर होते हैं और सबसे कम लेटेंसी व उच्चतम गति प्रदान करते हैं।",
  },
  {
    question: "प्रोग्राम काउंटर (Program Counter - PC) रजिस्टर का मुख्य कार्य क्या है?",
    options: [
      "अगले निष्पादित होने वाले निर्देश का मेमोरी पता (Address) रखना",
      "किए गए कुल प्रोग्रामों की गिनती करना",
      "गलतियों की संख्या गिनना",
      "ऑपरेटिंग सिस्टम का नाम स्टोर करना",
    ],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "प्रोग्राम काउंटर (PC) उस अगले निर्देश के मेमोरी एड्रेस को ट्रैक करता है जिसे CPU द्वारा निष्पादित किया जाना है।",
  },
  {
    question: "आधुनिक कंप्यूटरों में ऋणात्मक (Signed) पूर्णांकों को दर्शाने के लिए किस विधि का सबसे अधिक उपयोग होता है?",
    options: ["साइन-मैग्निट्यूड", "1 का पूरक (1's Complement)", "2 का पूरक (2's Complement)", "रोमन अंक"],
    correctAnswer: 2,
    correctAnswerIndex: 2,
    explanation: "2's complement में शून्य का केवल एक ही प्रतिनिधित्व होता है और जोड़ व घटाव के लिए समान हार्डवेयर परिपथ का उपयोग किया जा सकता है।",
  },
  {
    question: "CPU में इंस्ट्रक्शन पाइपलाइनिंग (Pipelining) का मुख्य उद्देश्य क्या है?",
    options: [
      "एक साथ कई निर्देशों के चरणों को समानांतर निष्पादित कर थ्रूपुट बढ़ाना",
      "मेमोरी क्षमता को दोगुना करना",
      "सिस्टम को रीबूट करना",
      "मॉनिटर के रिज़ॉल्यूशन को नियंत्रित करना",
    ],
    correctAnswer: 0,
    correctAnswerIndex: 0,
    explanation: "पाइपलाइनिंग निर्देशों के निष्पादन को विभिन्न चरणों (Fetch, Decode, Execute) में विभाजित करती है ताकि प्रोसेसर की समग्र गति बढ़ सके।",
  },
];

export function getFallbackQuiz(
  subject?: string,
  unit?: string,
  topic?: string,
  count: number = 5,
  difficulty: string = "medium",
  language: string = "en",
  subjectCode?: string,
  semester?: number
): QuizQuestion[] {
  const isHindi = language === "hi";
  const s = (subject || "").toLowerCase().trim();
  const sc = (subjectCode || "").toLowerCase().trim();
  const u = (unit || "").toLowerCase().trim();
  const t = (topic || "").toLowerCase().trim();
  const contextTerm = topic || unit || subject || "Core Syllabus";

  // Select pool strictly by Subject Code or Subject Name matching (NEVER cross-pollinate subjects)
  let selectedPoolEn: QuizQuestion[] = [];
  let selectedPoolHi: QuizQuestion[] = [];

  if (
    sc === "bca402" ||
    sc === "bca205" ||
    s.includes("network") ||
    s.includes("networking") ||
    s.includes("data communication")
  ) {
    selectedPoolEn = netQuestionsEn;
    selectedPoolHi = netQuestionsHi;
  } else if (
    sc === "bca303" ||
    sc === "bca501" ||
    s.includes("java") ||
    s.includes("oop") ||
    s.includes("object oriented")
  ) {
    selectedPoolEn = javaQuestionsEn;
    selectedPoolHi = javaQuestionsHi;
  } else if (
    sc === "bca302" ||
    s.includes("operating system") ||
    s.includes(" os") ||
    s === "os" ||
    s.includes("unix") ||
    s.includes("linux")
  ) {
    selectedPoolEn = osQuestionsEn;
    selectedPoolHi = osQuestionsHi;
  } else if (
    sc === "bca202" ||
    sc === "bca401" ||
    s.includes("database") ||
    s.includes("dbms") ||
    s.includes("sql") ||
    s.includes("rdbms")
  ) {
    selectedPoolEn = dbmsQuestionsEn;
    selectedPoolHi = dbmsQuestionsHi;
  } else if (
    sc === "bca201" ||
    sc === "bca102" ||
    s.includes("data structure") ||
    s.includes("programming in c") ||
    s.includes("fundamental of programming") ||
    s.includes("c++") ||
    s.includes("algorithm")
  ) {
    selectedPoolEn = dsQuestionsEn;
    selectedPoolHi = dsQuestionsHi;
  } else if (
    sc === "bca103" ||
    sc === "bca304" ||
    s.includes("web") ||
    s.includes("php") ||
    s.includes("javascript") ||
    s.includes("html")
  ) {
    selectedPoolEn = webQuestionsEn;
    selectedPoolHi = webQuestionsHi;
  } else if (
    sc === "bca403" ||
    s.includes("python")
  ) {
    selectedPoolEn = pythonQuestionsEn;
    selectedPoolHi = pythonQuestionsHi;
  } else if (
    sc === "bca404" ||
    s.includes("software engineering") ||
    s.includes("software") ||
    s === "se"
  ) {
    selectedPoolEn = seQuestionsEn;
    selectedPoolHi = seQuestionsHi;
  } else if (
    sc === "bca101" ||
    s.includes("computer organization") ||
    s.includes("fco") ||
    s.includes("architecture")
  ) {
    selectedPoolEn = coQuestionsEn;
    selectedPoolHi = coQuestionsHi;
  }

  // Active pool based on requested language
  const basePool = isHindi
    ? (selectedPoolHi.length > 0 ? selectedPoolHi : selectedPoolEn)
    : selectedPoolEn;

  // Match curriculum subject from GTU BCA syllabus database by code, name, or shortName
  const matchedCurriculumSubject = curriculumData.find((cs) => {
    const csCode = (cs.code || "").toLowerCase().trim();
    const csName = (cs.name || "").toLowerCase().trim();
    const csShort = (cs.shortName || "").toLowerCase().trim();
    if (sc && (csCode === sc || csCode.includes(sc) || sc.includes(csCode))) return true;
    if (s && (csName === s || csName.includes(s) || s.includes(csName))) return true;
    if (s && (csShort === s || csShort.includes(s) || s.includes(csShort))) return true;
    return false;
  });

  // Generate curriculum-derived questions if subject is found in syllabus
  const curriculumPool: QuizQuestion[] = [];
  if (matchedCurriculumSubject) {
    const sName = matchedCurriculumSubject.name;
    const sDesc = matchedCurriculumSubject.description || "Core university curriculum";

    // 1. Core Overview / Foundational questions
    if (isHindi) {
      curriculumPool.push({
        question: `${sName}: इस विषय का संपूर्ण शैक्षणिक दायरा और मुख्य उद्देश्य क्या है?`,
        options: [
          `${sDesc.slice(0, 55)} के मुख्य सिद्धांतों और व्यावहारिक कौशल में प्रवीणता प्राप्त करना`,
          `सैद्धांतिक अवधारणाओं को पूरी तरह अनदेखा कर केवल अनुमान लगाना`,
          `पाठ्यक्रम को बिना किसी व्यावहारिक समस्या समाधान के पूरा करना`,
          `यह विषय आधुनिक सॉफ्टवेयर उद्योग और प्रणालियों से असंबद्ध है`,
        ],
        correctAnswer: 0,
        correctAnswerIndex: 0,
        explanation: `${sName} का प्राथमिक उद्देश्य छात्रों को ${sDesc} में पारंगत बनाना है।`,
      });
      curriculumPool.push({
        question: `${sName}: विश्वविद्यालय परीक्षा में उच्च अंक प्राप्त करने के लिए सबसे महत्वपूर्ण दृष्टिकोण क्या है?`,
        options: [
          `प्रत्येक इकाई के तकनीकी सिद्धांतों, आरेखों और समस्या-समाधान का व्यवस्थित और गहन अध्ययन`,
          `केवल यादृच्छिक अनुमान लगाना और मुख्य अवधारणाओं को छोड़ देना`,
          `महत्वपूर्ण इकाइयों और आधिकारिक पाठ्यक्रम विनिर्देशों की उपेक्षा करना`,
          `आधिकारिक संदर्भ पुस्तकों और प्रयोगशाला प्रयोगों को छोड़ना`,
        ],
        correctAnswer: 0,
        correctAnswerIndex: 0,
        explanation: `${sName} में उच्च अंक प्राप्त करने के लिए संरचित पाठ्यक्रम कवरेज और व्यावहारिक विश्लेषण अनिवार्य है।`,
      });
    } else {
      curriculumPool.push({
        question: `In ${sName}: What is the primary academic scope and foundational objective of this curriculum?`,
        options: [
          `Mastering core concepts in ${sDesc.slice(0, 65)} and their practical engineering applications`,
          `Focusing exclusively on obsolete methodologies without contemporary relevance`,
          `Bypassing systematic problem analysis in favor of unverified assumptions`,
          `Discarding foundational principles and industry-aligned standards`,
        ],
        correctAnswer: 0,
        correctAnswerIndex: 0,
        explanation: `The academic objective of ${sName} centers on: ${sDesc}.`,
      });
      curriculumPool.push({
        question: `In ${sName}: Which evaluative criterion is most critical for university examination success?`,
        options: [
          `Demonstrating conceptual rigor, architectural reasoning, and accurate technical terminology across all units`,
          `Relying purely on superficial memorization without functional comprehension`,
          `Disregarding unit weightages and core syllabus specifications`,
          `Omitting structured explanations and practical problem analysis`,
        ],
        correctAnswer: 0,
        correctAnswerIndex: 0,
        explanation: `Academic excellence in ${sName} requires thorough mastery of core principles and analytical rigor.`,
      });
    }

    // 2. Unit-level questions
    matchedCurriculumSubject.units.forEach((unitObj) => {
      if (isHindi) {
        curriculumPool.push({
          question: `${sName} [यूनिट ${unitObj.unitNumber}: ${unitObj.unitName}]: इस इकाई का केंद्रीय शैक्षणिक ध्यान क्या है?`,
          options: [
            `${unitObj.unitName.slice(0, 50)} से संबंधित अवधारणाओं, कार्यप्रणाली और व्यावहारिक अनुप्रयोगों का गहन अध्ययन`,
            `इस इकाई का संपूर्ण पाठ्यक्रम में कोई व्यावहारिक महत्व नहीं है`,
            `यह इकाई केवल परिचयात्मक है और इसमें से प्रश्न नहीं पूछे जाते`,
            `इसके सिद्धांतों को आधुनिक सॉफ्टवेयर उद्योग में अमान्य माना गया है`,
          ],
          correctAnswer: 0,
          correctAnswerIndex: 0,
          explanation: `${sName} की यूनिट ${unitObj.unitNumber} (${unitObj.unitName}) पाठ्यक्रम का एक अनिवार्य घटक है।`,
        });
      } else {
        curriculumPool.push({
          question: `In ${sName} [Unit ${unitObj.unitNumber}: ${unitObj.unitName}]: What is the fundamental competency developed in this module?`,
          options: [
            `In-depth analytical understanding of ${unitObj.unitName.slice(0, 55)} and its core technical mechanisms`,
            `Superficial exposure with no practical problem-solving capability`,
            `Application of deprecated practices that violate current standards`,
            `Complete exclusion of formal evaluation metrics and assessments`,
          ],
          correctAnswer: 0,
          correctAnswerIndex: 0,
          explanation: `Unit ${unitObj.unitNumber} (${unitObj.unitName}) in ${sName} is designed to build rigorous competency in its subject area.`,
        });
      }

      // 3. Exam questions from curriculum
      unitObj.examQuestions.forEach((eq) => {
        const qClean = eq.replace(/^(explain|describe|discuss|differentiate between|what is|write a|compare)\s+/i, "").replace(/[.?]+$/, "");
        if (isHindi) {
          curriculumPool.push({
            question: `${sName} [${unitObj.unitName}]: "${eq}" के संदर्भ में सही शैक्षणिक कथन कौन सा है?`,
            options: [
              `${qClean.slice(0, 50)} के मुख्य सिद्धांतों और व्यावहारिक क्रियान्वयन को समझना आवश्यक है`,
              `यह प्रश्न पाठ्यक्रम के दायरे से बाहर है और परीक्षा में नहीं पूछा जाता`,
              `इसके लिए किसी तर्क या संरचित आरेख की आवश्यकता नहीं है`,
              `इसका आधुनिक कंप्यूटर विज्ञान और अनुप्रयोगों से कोई संबंध नहीं है`,
            ],
            correctAnswer: 0,
            correctAnswerIndex: 0,
            explanation: `${sName} (यूनिट ${unitObj.unitNumber}: ${unitObj.unitName}) के अनुसार "${eq}" एक महत्वपूर्ण परीक्षा प्रश्न है।`,
          });
        } else {
          curriculumPool.push({
            question: `In ${sName} (${unitObj.unitName}), regarding "${eq}": Which analytical statement is academically sound?`,
            options: [
              `Understanding the operational mechanics and applications of ${qClean.slice(0, 55)} is essential`,
              `This concept contradicts standard computational principles and is non-assessable`,
              `Memorization of keywords without understanding the underlying design is sufficient`,
              `This theoretical principle has no practical relevance in computing systems`,
            ],
            correctAnswer: 0,
            correctAnswerIndex: 0,
            explanation: `In ${sName} (Unit ${unitObj.unitNumber}: ${unitObj.unitName}), comprehensive knowledge of "${eq}" forms a key GTU evaluation objective.`,
          });
        }
      });

      // 4. Topic-level questions
      unitObj.topics.forEach((topicObj) => {
        if (isHindi) {
          curriculumPool.push({
            question: `${sName} (${topicObj.title}): इस विषय का मुख्य तकनीकी उद्देश्य क्या है?`,
            options: [
              `${topicObj.summary.slice(0, 60)} के अनुसार मुख्य सिद्धांतों को क्रियान्वित करना`,
              `किसी भी मानक एल्गोरिदम या संरचना का उपयोग न करना`,
              `केवल सतही चर्चा जो वास्तविक अनुप्रयोग में उपयोगी नहीं है`,
              `उपरोक्त में से कोई भी प्रासंगिक नहीं है`,
            ],
            correctAnswer: 0,
            correctAnswerIndex: 0,
            explanation: `${sName} में "${topicObj.title}" का अध्ययन: ${topicObj.summary}`,
          });
          curriculumPool.push({
            question: `${sName} [${unitObj.unitName}]: "${topicObj.title}" में सर्वोत्तम व्यावहारिक दृष्टिकोण क्या है?`,
            options: [
              `${topicObj.summary.slice(0, 55)} के आधार पर संरचित समाधान तैयार करना`,
              `सिस्टम प्रदर्शन और डेटा अखंडता को पूरी तरह अनदेखा करना`,
              `बिना किसी सत्यापन के अनियंत्रित कार्यान्वयन करना`,
              `मानक उद्योग मानकों का बहिष्कार करना`,
            ],
            correctAnswer: 0,
            correctAnswerIndex: 0,
            explanation: `${topicObj.title} के अंतर्गत ${topicObj.summary} का पालन करने से विश्वसनीयता सुनिश्चित होती है।`,
          });
        } else {
          curriculumPool.push({
            question: `In ${sName} (${unitObj.unitName}): What is the primary academic focus of "${topicObj.title}"?`,
            options: [
              `It encompasses ${topicObj.summary.slice(0, 70)} to establish fundamental domain mastery`,
              `It focuses solely on deprecated paradigms with no real-world applicability`,
              `It eliminates the necessity for computational efficiency and structured verification`,
              `It is an optional topic with zero assessment value in the curriculum`,
            ],
            correctAnswer: 0,
            correctAnswerIndex: 0,
            explanation: `In ${sName} (Unit: ${unitObj.unitName}), the topic "${topicObj.title}" focuses on: ${topicObj.summary}.`,
          });
          curriculumPool.push({
            question: `In ${sName}: Which engineering practice is recommended when working with "${topicObj.title}"?`,
            options: [
              `Applying validated state handling and structured techniques according to ${topicObj.summary.slice(0, 60)}`,
              `Bypassing systematic testing and error boundaries in favor of ad-hoc implementation`,
              `Ignoring boundary constraints, data integrity, and architectural specifications`,
              `Assuming non-deterministic behavior without formal verification`,
            ],
            correctAnswer: 0,
            correctAnswerIndex: 0,
            explanation: `Best practices for "${topicObj.title}" in ${sName} require structured application of: ${topicObj.summary}.`,
          });
        }
      });
    });
  }

  // Combine curated static pool (if matching) and curriculum pool
  const allEligibleQuestions = [...basePool, ...curriculumPool];

  // Filter or prioritize questions matching unit/topic keywords if available
  const prioritized: QuizQuestion[] = [];
  const secondary: QuizQuestion[] = [];

  for (const item of allEligibleQuestions) {
    const qStr = `${item.question} ${item.explanation}`.toLowerCase();
    if ((u && qStr.includes(u)) || (t && qStr.includes(t))) {
      prioritized.push(item);
    } else {
      secondary.push(item);
    }
  }

  const combinedCandidatePool = [...prioritized, ...secondary];
  const finalQuestions: QuizQuestion[] = [];
  const seenKeys = new Set<string>();

  // Add questions up to count with strict deduplication
  for (const q of combinedCandidatePool) {
    if (finalQuestions.length >= count) break;
    const key = normalizeQuestionKey(q.question);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    finalQuestions.push(q);
  }

  // If still need more questions (or if subject was outside predefined list),
  // dynamically synthesize unique, distinct questions STRICTLY for this specific subject and unit/topic.
  // NEVER fall back to another subject, and NEVER create duplicate questions!
  let synthCounter = 1;
  const topicAspectsEn = [
    "Core Architectural Foundations",
    "Functional Methodology & Implementation",
    "Data Integrity & Boundary Conditions",
    "Algorithmic Complexity & Optimization",
    "Standardized Evaluation & Verification",
    "Industry Deployment & Security Constraints",
    "Analytical Design & State Management",
    "Practical Problem Solving & Diagnostics",
  ];
  const topicAspectsHi = [
    "मूल स्थापत्य सिद्धांत एवं आधारभूत संरचना",
    "कार्यात्मक कार्यप्रणाली एवं व्यावहारिक क्रियान्वयन",
    "डेटा अखंडता एवं सीमा स्थितियां",
    "एल्गोरिद्मिक जटिलता एवं अनुकूलन",
    "मानकीकृत मूल्यांकन एवं सत्यापन",
    "उद्योग अनुप्रयोग एवं सुरक्षा बाधाएं",
    "विश्लेषणात्मक डिजाइन एवं स्थिति प्रबंधन",
    "व्यावहारिक समस्या निवारण एवं निदान",
  ];

  while (finalQuestions.length < count) {
    const cleanSubj = subject || "Subject Studies";
    const aspectIdx = (synthCounter - 1) % topicAspectsEn.length;
    let newQ: QuizQuestion;
    if (isHindi) {
      const aspect = topicAspectsHi[aspectIdx];
      newQ = {
        question: `${cleanSubj} [${contextTerm}] - ${aspect} (#${synthCounter}): कौन सा कथन सबसे सटीक है?`,
        options: [
          `सिद्धांतों का व्यवस्थित और व्यावहारिक अनुप्रयोग प्रणाली की स्थिरता सुनिश्चित करता है`,
          `बिना विश्लेषण के मनमाना निष्पादन करना सर्वोत्तम अभ्यास है`,
          `पाठ्यक्रम के इस पहलू का आधुनिक प्रणालियों में कोई उपयोग नहीं है`,
          `इसकी शुद्धता और प्रभावशीलता का परीक्षण नहीं किया जा सकता`,
        ],
        correctAnswer: 0,
        correctAnswerIndex: 0,
        explanation: `${cleanSubj} में ${contextTerm} के अंतर्गत ${aspect} का अध्ययन उच्च स्तरीय तकनीकी दक्षता सुनिश्चित करता है।`,
      };
    } else {
      const aspect = topicAspectsEn[aspectIdx];
      newQ = {
        question: `In ${cleanSubj} [${contextTerm}] - ${aspect} (#${synthCounter}): Which analytical principle is correct?`,
        options: [
          `Structured specifications and verified constraints ensure reliable execution and domain integrity`,
          `Ignoring computational complexity and boundary constraints is standard in production`,
          `This domain rejects modular abstraction and standardized protocols`,
          `Deterministic behavior cannot be achieved in this syllabus curriculum`,
        ],
        correctAnswer: 0,
        correctAnswerIndex: 0,
        explanation: `In the study of ${cleanSubj}, ${aspect} within ${contextTerm} requires formal architectural adherence and verified state handling.`,
      };
    }

    const key = normalizeQuestionKey(newQ.question);
    synthCounter++;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    finalQuestions.push(newQ);
  }

  return finalQuestions.slice(0, count);
}
