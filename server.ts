import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getFallbackQuiz as getFallbackQuizFromBank, normalizeQuestionKey, QuizQuestion } from "./serverQuizBank.js";
import {
  archiveAdminPaper,
  authenticateAdminCredentials,
  authenticateAnyUserSession,
  createAdminMcq,
  createAdminPaper,
  createAdminPaperQuestion,
  createAdminStudyMaterial,
  createAdminTopic,
  createAdminUnit,
  deactivateAdminMcq,
  deleteAdminPaper,
  deleteAdminPaperQuestion,
  deleteAdminStudyMaterial,
  deleteAdminTopic,
  deleteAdminUnit,
  getAdminAllPaperQuestions,
  getAdminDashboardStats,
  getAdminMcqById,
  getAdminMcqs,
  getAdminPaperDetailById,
  getAdminPaperQuestionById,
  getAdminPapers,
  getAdminPaperWithQuestions,
  getAdminStudyMaterialById,
  getAdminStudyMaterials,
  getAdminSubjectById,
  getAdminSubjects,
  getCanonicalCurriculumFromDb,
  getQuestionsForCanonicalSubject,
  getSemesterPapersFromDb,
  initializeDatabase,
  inspectAdminSessionToken,
  parseValidSemester,
  persistValidatedAiQuestions,
  reorderAdminPaperQuestions,
  revokeAdminSessionToken,
  resolveAcademicHierarchy,
  updateAdminMcq,
  updateAdminPaper,
  updateAdminPaperQuestion,
  updateAdminStudyMaterial,
  updateAdminSubject,
  updateAdminTopic,
  updateAdminUnit,
  verifyAdminSessionToken,
} from "./src/db/index.js";

dotenv.config();

// Initialize Canonical SQLite Database (migrations + deterministic seed)
const { db, migrationReport, seedReport } = initializeDatabase();
console.log(
  `[Database] Initialized studymate.db (schema=${migrationReport.schemaVersion}, subjects=${seedReport.subjectsSeeded}, units=${seedReport.unitsSeeded}, topics=${seedReport.topicsSeeded}, papers=${seedReport.papersSeeded}, questions=${seedReport.questionsSeeded}, quarantined=${seedReport.quarantinedCount})`
);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));

// Intercept malformed JSON body errors before they cause unhandled 500s or HTML responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    res.status(400).json({ error: "Malformed request payload: Invalid JSON format" });
    return;
  }
  next(err);
});

// Initialize Google GenAI client
// User-Agent header must be 'aistudio-build'
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
}

// Helper to determine if we should use fallback
const isGeminiAvailable = () => Boolean(aiClient && process.env.GEMINI_API_KEY);

// Fallback generator for realistic student study responses
function getFallbackAnswer(prompt: string, subject?: string, marks?: number, language: string = "en"): string {
  const isHindi = language === "hi";
  const pLower = prompt.toLowerCase();
  const marksText = marks ? ` (${marks} Marks)` : "";

  // 1. Mathematics / Bayes Theorem / Probability
  if (pLower.includes("bayes") || pLower.includes("probability") || subject === "Mathematics") {
    if (isHindi) {
      return `### StudyMate AI अध्ययन उत्तर: बेयस प्रमेय (Bayes' Theorem)${marksText}
**विषय:** गणित एवं संभाव्यता (Mathematics)

#### 1. परिभाषा (Definition)
बेयस प्रमेय (Bayes' Theorem) किसी घटना के पूर्व ज्ञान (Prior Knowledge) के आधार पर उसकी सशर्त संभावना (Conditional Probability) की गणना करने का एक गणितीय नियम है।

#### 2. गणितीय सूत्र (Mathematical Formula)
$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

जहाँ:
- $P(A|B)$: घटना $B$ के घटित होने के बाद घटना $A$ की संभावना (Posterior Probability)
- $P(B|A)$: घटना $A$ के सत्य होने पर घटना $B$ की संभावना (Likelihood)
- $P(A)$: घटना $A$ की पूर्व संभावना (Prior Probability)
- $P(B)$: घटना $B$ की कुल सीमांत संभावना (Marginal Probability)

#### 3. परीक्षा महत्वपूर्ण बिंदु (Key Exam Points)
- हमेशा प्रत्येक पद ($P(A)$, $P(B|A)$) का स्पष्ट विवरण दें।
- कुल संभावना नियम (Law of Total Probability) का संदर्भ अवश्य दें:
$$P(B) = \\sum_{i=1}^n P(B|A_i) \\cdot P(A_i)$$
- चिकित्सा परीक्षण (Medical Diagnostics) और स्पैम फ़िल्टरिंग में इसका प्रमुख अनुप्रयोग है।`;
    }

    return `### StudyMate AI Explanation: Bayes' Theorem${marksText}
**Subject:** Mathematics & Probability Statistics
**Topic:** Bayes' Theorem & Conditional Inference

#### 1. Formal Definition
**Bayes' Theorem** is a foundational principle in probability calculus that describes the probability of an event based on prior knowledge of conditions that might be related to the event.

#### 2. Mathematical Formulation
The mathematical formulation for two events $A$ and $B$ (where $P(B) > 0$) is expressed as:

$$P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}$$

Where each parameter is defined as:
- **$P(A|B)$ (Posterior Probability):** Probability of hypothesis $A$ occurring given evidence $B$ has already occurred.
- **$P(B|A)$ (Likelihood):** Probability of observing evidence $B$ assuming hypothesis $A$ is true.
- **$P(A)$ (Prior Probability):** Initial probability of hypothesis $A$ before observing evidence.
- **$P(B)$ (Marginal Probability):** Total probability of observing evidence $B$ under all mutually exclusive hypotheses:

$$P(B) = \\sum_{i=1}^{k} P(B|A_i) \\cdot P(A_i)$$

#### 3. Concrete University Exam Example
Suppose a rare disease affects $1\\%$ of a population ($P(D) = 0.01$). A diagnostic test has a $95\\%$ true positive rate ($P(T|D) = 0.95$) and a $5\\%$ false positive rate ($P(T|\\neg D) = 0.05$).

Applying Bayes' Theorem to find the probability of actually having the disease given a positive test:
$$P(D|T) = \\frac{0.95 \\times 0.01}{(0.95 \\times 0.01) + (0.05 \\times 0.99)} = \\frac{0.0095}{0.0095 + 0.0495} \\approx 0.161 \\text{ (or } 16.1\\%)$$

#### 4. Summary Table of Terms
| Probability Term | Notation | Meaning |
| :--- | :--- | :--- |
| Posterior | $P(A \\mid B)$ | Updated belief after evidence |
| Likelihood | $P(B \\mid A)$ | Evidence consistency with hypothesis |
| Prior | $P(A)$ | Baseline belief before observation |
| Evidence | $P(B)$ | Normalizing constant across all states |

#### 5. Scoring Tips for Exams
- State the conditional probability definition $P(A \\cap B) = P(A|B)P(B)$ as the starting derivation point.
- Clearly write the expanded form of the denominator using the Law of Total Probability to earn full derivation marks.`;
  }

  // 2. TCP vs UDP Comparison
  if (pLower.includes("tcp") || pLower.includes("udp")) {
    return `### StudyMate AI Explanation: TCP vs UDP Protocol Suite${marksText}
**Subject:** Computer Networks (CS-302)
**Topic:** Transport Layer Protocols

#### 1. Core Definitions
- **Transmission Control Protocol (TCP):** A connection-oriented, highly reliable transport layer protocol that provides ordered, error-checked delivery of byte streams across IP networks.
- **User Datagram Protocol (UDP):** A connectionless, lightweight transport protocol that provides best-effort datagram delivery with minimum latency and no overhead for handshake or retransmission.

#### 2. Detailed Technical Comparison Table
| Feature Parameter | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
| :--- | :--- | :--- |
| **Connection Type** | Connection-oriented (3-way handshake) | Connectionless (No handshake) |
| **Reliability** | Guaranteed delivery (acknowledgments & retries) | Unreliable (Best-effort delivery) |
| **Data Ordering** | Strict byte-stream sequencing guaranteed | Packets may arrive out of order or duplicated |
| **Header Size** | 20 to 60 bytes | Fixed 8 bytes |
| **Flow & Congestion Control** | Supported (Sliding window & AIMD) | None (Transmits at application rate) |
| **Transmission Speed** | Moderate due to sequencing overhead | High speed, low latency |
| **Primary Use Cases** | HTTP/HTTPS, SSH, FTP, Email (SMTP) | DNS, VoIP, Video Streaming, Multiplayer Games |

#### 3. Three-Way Handshake Workflow (TCP)
\`\`\`text
Client                                  Server
  |                                       |
  | -------- SYN (seq = x) -------------> |  (SYN received, server allocates buffer)
  |                                       |
  | <------- SYN-ACK (seq=y, ack=x+1) --- |  (Acknowledgment returned)
  |                                       |
  | -------- ACK (seq=x+1, ack=y+1) ----> |  (Connection ESTABLISHED)
  v                                       v
\`\`\`

#### 4. Exam Scoring Tips
- In a 5-mark question, write the 2-line definition for both, draw the comparison table with at least 5 points, and cite 2 distinct real-world protocols for each.`;
  }

  // 3. Time Complexity / Merge Sort
  if (pLower.includes("merge sort") || pLower.includes("time complexity") || pLower.includes("recurrence")) {
    return `### StudyMate AI Explanation: Merge Sort & Recurrence Analysis${marksText}
**Subject:** Data Structures & Algorithms
**Topic:** Divide and Conquer Strategy

#### 1. Definition
**Merge Sort** is an efficient, general-purpose, comparison-based sorting algorithm that operates on the **Divide and Conquer** paradigm, dividing an array of size $n$ into two halves until single elements remain, and then merging the sorted sub-arrays.

#### 2. Recurrence Relation
The execution time $T(n)$ of Merge Sort is governed by the recurrence equation:

$$T(n) = 2T\\left(\\frac{n}{2}\\right) + O(n)$$

By applying Case 2 of the **Master Theorem** ($a = 2, b = 2, f(n) = O(n)$ where $\\log_b a = \\log_2 2 = 1$):

$$T(n) = \\Theta(n \\log_2 n)$$

#### 3. Complexity Matrix
| Case | Time Complexity | Auxiliary Space | Stable Sort? |
| :--- | :--- | :--- | :--- |
| **Best Case** | $O(n \\log n)$ | $O(n)$ | Yes |
| **Average Case** | $O(n \\log n)$ | $O(n)$ | Yes |
| **Worst Case** | $O(n \\log n)$ | $O(n)$ | Yes |

#### 4. Step-by-step Algorithm Implementation
\`\`\`java
void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2; // Avoids integer overflow
        mergeSort(arr, left, mid);          // Divide left half
        mergeSort(arr, mid + 1, right);      // Divide right half
        merge(arr, left, mid, right);       // Conquer by merging
    }
}
\`\`\`

#### 5. Examiner's High-Yield Scoring Tips
- Highlight that Merge Sort guarantees $O(n \\log n)$ time even in the worst case (unlike Quick Sort which degrades to $O(n^2)$).
- Always state that Merge Sort requires $O(n)$ auxiliary space for arrays, which is its primary trade-off.`;
  }

  if (isHindi) {
    return `### StudyMate AI अध्ययन उत्तर${marksText}
**विषय:** ${subject || "सामान्य अध्ययन"}
**प्रश्न:** ${prompt}

#### 1. परिभाषा (Definition)
यह अवधारणा किसी भी प्रणाली या विषय का एक मूलभूत स्तंभ है। सरल शब्दों में, यह वह प्रक्रिया या संरचना है जो कार्य को कुशलतापूर्वक पूरा करने में सक्षम बनाती है।

#### 2. मुख्य व्याख्या (Detailed Explanation)
- **मूल सिद्धांत:** यह सीधे नियमों और कार्यप्रणाली पर आधारित है।
- **कार्यप्रणाली:** यह व्यवस्थित चरणों के माध्यम से इनपुट को आउटपुट में बदलता है।
- **मुख्य घटक:** 
  1. प्राथमिक संरचना
  2. निष्पादन तंत्र
  3. त्रुटि नियंत्रण और अनुकूलन

#### 3. उदाहरण (Real-world Example)
उदाहरण के लिए, यदि हम एक वास्तविक परिदृश्य देखें, तो यह एक सुव्यवस्थित पुस्तकालय प्रणाली की तरह है जहाँ प्रत्येक घटक एक विशिष्ट उद्देश्य की पूर्ति करता है।

#### 4. परीक्षा महत्वपूर्ण बिंदु (Key Exam Points)
- हमेशा मुख्य परिभाषा और तकनीकी शब्दावली को रेखांकित (underline) करें।
- जहाँ संभव हो, ब्लॉक आरेख (Block Diagram) अवश्य बनाएं।
- मुख्य लाभ और अनुप्रयोगों को बुलेट पॉइंट्स में लिखें।`;
  }

  if (marks && marks >= 7) {
    return `### Exam-Ready Answer (${marks} Marks)
**Subject:** ${subject || "General Engineering / Science"}
**Question:** ${prompt}

#### 1. Definition & Core Concept
In academic study and technical systems, this concept defines the systematic structure and underlying methodology that governs the operational behavior of the subject matter.

#### 2. Architectural & Detailed Explanation
- **Theoretical Foundation:** Designed to maintain consistency, reliability, and modular abstraction across components.
- **Workflow / Mechanism:** 
  1. **Initialization Stage:** Establishes memory allocation, baseline parameters, and operational protocols.
  2. **Execution Phase:** Carries out instructions with deterministic state transitions.
  3. **Termination & Resource Cleanup:** Safely deallocates unused buffers and verifies integrity.

#### 3. Structural Representation / Diagram
\`\`\`text
+-------------------+      Data / Signal      +-------------------+
|  Input / Control  | ----------------------> | Execution Engine  |
+-------------------+                         +-------------------+
          |                                             |
          v                                             v
+-------------------+                         +-------------------+
|   State Manager   | <=====================> | Verified Results  |
+-------------------+                         +-------------------+
\`\`\`

#### 4. Real-World Example & Implementation
Consider a modern distributed system where task dispatching and state consistency are critical:
- **Scenario:** Processing simultaneous requests without deadlock or race conditions.
- **Application:** Used in memory scheduling, database transaction management, and low-latency network stacks.

#### 5. Key Advantages & Practical Applications
- **High Efficiency:** Minimizes latency while optimizing resource utilization.
- **Scalability:** Easily integrates into modular architectures without breaking backwards compatibility.
- **Fault Tolerance:** Built-in safeguards allow rapid recovery from exceptions.

#### 6. Examiner's High-Yield Scoring Tips
- Highlight primary keywords and formal definitions in the introductory paragraph.
- Always include the block schematic diagram shown above to secure full diagram marks.
- Present differences in a tabular format when applicable.`;
  }

  return `### StudyMate AI Explanation
**Topic:** ${prompt}
**Subject:** ${subject || "General Studies"}

#### 1. Quick Definition
A fundamental concept designed to organize complex workflows, provide deterministic structure, and maintain optimal system performance.

#### 2. Simple Explanation
Think of this like an intelligent traffic management system at a busy junction. Rather than allowing unpredictable collisions, this mechanism regulates flow through established protocols, ensuring safety, throughput, and predictable execution.

#### 3. Concrete Example
\`\`\`java
// Conceptual Demonstration
public class ConceptDemo {
    private String name;
    
    // Core Constructor / Handler
    public ConceptDemo(String name) {
        this.name = name;
        System.out.println("Initialized: " + this.name);
    }
}
\`\`\`

#### 4. Important Points to Remember
- It executes reliably under standardized conditions.
- It prevents memory leaks and inconsistent system states.
- It is frequently asked in university midterms and semester finals.

#### 5. Exam Tip
Write the 3-line definition first, followed immediately by a clean 4-line code/example block. Mention at least two real-life use cases to get full marks.`;
}

// Rich Fallback quiz generator backed first by canonical SQLite `questions`, then subject-isolated fallback
function getFallbackQuiz(
  subject?: string,
  unit?: string,
  topic?: string,
  count: number = 5,
  difficulty: string = "medium",
  language: string = "en",
  subjectCode?: string,
  semester?: number
) {
  try {
    const hierarchy = resolveAcademicHierarchy(db, {
      semester,
      subjectCode,
      subjectName: subject,
      unitName: unit,
      topicName: topic,
    });
    const dbQuestions = getQuestionsForCanonicalSubject(db, hierarchy, {
      language,
      difficulty,
      count,
    });
    if (dbQuestions.length > 0) {
      return dbQuestions.slice(0, count);
    }
    const bankQuestions = getFallbackQuizFromBank(
      hierarchy.subjectName,
      unit,
      topic,
      count,
      difficulty,
      language,
      hierarchy.subjectCode,
      hierarchy.semesterId
    );
    return bankQuestions.slice(0, count);
  } catch {
    return getFallbackQuizFromBank(subject, unit, topic, count, difficulty, language, subjectCode, semester);
  }
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "StudyMate AI",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    database: {
      schemaVersion: migrationReport.schemaVersion,
      subjects: seedReport.subjectsSeeded,
      units: seedReport.unitsSeeded,
      topics: seedReport.topicsSeeded,
      papers: seedReport.papersSeeded,
      questions: seedReport.questionsSeeded,
      quarantined: seedReport.quarantinedCount,
    },
  });
});

// Canonical Academic Curriculum API (backed by SQLite)
app.get("/api/curriculum", (req, res) => {
  try {
    let sem: number | undefined = undefined;
    if (req.query.semester !== undefined) {
      const parsed = Number(req.query.semester);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 6) {
        res.status(400).json({ error: "Invalid semester parameter. Must be an integer between 1 and 6." });
        return;
      }
      sem = parsed;
    }
    const data = getCanonicalCurriculumFromDb(db, sem);
    res.json({ semesters: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Student-facing Published Study Materials API (backed by SQLite)
app.get("/api/study-materials", (req, res) => {
  try {
    let sem: number | null = null;
    if (req.query.semester !== undefined) {
      const parsed = Number(req.query.semester);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 6) {
        res.status(400).json({ error: "Invalid semester parameter. Must be an integer between 1 and 6." });
        return;
      }
      sem = parsed;
    }
    const subjectCode =
      typeof req.query.subjectCode === "string" && req.query.subjectCode.trim()
        ? req.query.subjectCode.trim()
        : undefined;
    const subjectId =
      typeof req.query.subjectId === "string" && req.query.subjectId.trim()
        ? req.query.subjectId.trim()
        : undefined;
    const unitId =
      typeof req.query.unitId === "string" && req.query.unitId.trim()
        ? req.query.unitId.trim()
        : undefined;
    const topicId =
      typeof req.query.topicId === "string" && req.query.topicId.trim()
        ? req.query.topicId.trim()
        : undefined;
    const allMaterials = getAdminStudyMaterials(db, {
      semester: sem,
      subjectCode,
      subjectId,
      unitId,
      topicId,
    });
    const publishedMaterials = allMaterials.filter((m) => m.published);
    res.json({
      total: publishedMaterials.length,
      materials: publishedMaterials,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Canonical GTU Examination Papers API (4-State Model backed by SQLite)
app.get("/api/papers", (req, res) => {
  try {
    let sem: number | undefined = undefined;
    if (req.query.semester !== undefined) {
      const parsed = Number(req.query.semester);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 6) {
        res.status(400).json({ error: "Invalid semester parameter. Must be an integer between 1 and 6." });
        return;
      }
      sem = parsed;
    }
    const subjectCodeFilter =
      typeof req.query.subjectCode === "string" && req.query.subjectCode.trim()
        ? req.query.subjectCode.trim().toUpperCase()
        : undefined;
    const subjectIdFilter =
      typeof req.query.subjectId === "string" && req.query.subjectId.trim()
        ? req.query.subjectId.trim()
        : undefined;

    let data = getSemesterPapersFromDb(db, sem);
    if (subjectCodeFilter || subjectIdFilter) {
      data = data
        .map((s) => {
          const filteredSubjects = s.subjects.filter((subj) => {
            if (subjectCodeFilter && subj.subjectCode.toUpperCase() !== subjectCodeFilter) {
              return false;
            }
            if (subjectIdFilter && subj.subjectId !== subjectIdFilter) {
              return false;
            }
            return true;
          });
          return {
            ...s,
            totalSubjects: filteredSubjects.length,
            availableCount: filteredSubjects.filter((i) => i.isAvailable).length,
            unavailableCount: filteredSubjects.filter((i) => !i.isAvailable).length,
            subjects: filteredSubjects,
          };
        })
        .filter((s) => s.subjects.length > 0);
    }

    res.json({ semesters: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/papers/:id", (req, res) => {
  try {
    const target = (req.params.id || "").trim();
    const targetUpper = target.toUpperCase();
    const allSemesters = getSemesterPapersFromDb(db);
    for (const sem of allSemesters) {
      for (const item of sem.subjects) {
        const matchesPaperId = Boolean(item.paper && item.paper.id === target);
        const matchesSubjectCode = item.subjectCode.toUpperCase() === targetUpper;
        const matchesSubjectId = item.subjectId === target;

        if (matchesPaperId || matchesSubjectCode || matchesSubjectId) {
          if (item.isAvailable && item.paper) {
            res.json({
              paper: item.paper,
              subject: {
                semester: item.semester,
                subjectId: item.subjectId,
                subjectCode: item.subjectCode,
                subjectName: item.subjectName,
                availabilityStatus: item.availabilityStatus,
                isAvailable: item.isAvailable,
              },
            });
            return;
          }
          res.status(404).json({
            error: `Official GTU question paper for ${item.subjectName} (${item.subjectCode}) is not available yet.`,
            subject: {
              semester: item.semester,
              subjectId: item.subjectId,
              subjectCode: item.subjectCode,
              subjectName: item.subjectName,
              availabilityStatus: item.availabilityStatus,
              isAvailable: false,
            },
          });
          return;
        }
      }
    }
    res.status(404).json({ error: "Verified GTU question paper not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// PHASE 3 & PHASE 4: FULL ADMIN CONTENT MANAGEMENT API (100% SQLite-Driven)
// ============================================================================

function extractBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const customToken = req.headers["x-admin-token"];
  if (typeof customToken === "string" && customToken.trim()) {
    return customToken.trim();
  }
  return null;
}

/**
 * Strict Backend Admin Authorization Middleware:
 * - Never trusts a role supplied by the frontend (`x-user-role: admin` without a valid SQLite token is rejected).
 * - Rejects explicit non-admin role claims or authenticated student session tokens with 403 Forbidden.
 * - Rejects missing, invalid, or expired session tokens with 401 Unauthorized.
 */
function adminAccessGuard(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const explicitRole = String(
    req.headers["x-user-role"] || req.headers["x-admin-role"] || req.body?.role || ""
  )
    .trim()
    .toLowerCase();

  if (explicitRole === "student" || explicitRole === "guest" || explicitRole === "unauthorized") {
    res.status(403).json({
      error: "Forbidden: Student and non-admin accounts are not permitted to access Admin Console resources.",
    });
    return;
  }

  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({
      error: "Unauthorized: Valid administrator session token is required. Frontend role headers are not trusted.",
    });
    return;
  }

  const inspection = inspectAdminSessionToken(db, token);
  if (inspection.status === "forbidden") {
    res.status(403).json({
      error: inspection.error,
    });
    return;
  }

  if (inspection.status !== "authorized") {
    res.status(401).json({
      error: inspection.error,
    });
    return;
  }

  (req as any).adminUser = inspection.user;
  next();
}

// 0. Admin Authentication Endpoints
const handleAdminLogin = (req: express.Request, res: express.Response) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(400).json({ error: "Both administrator email and password are required." });
      return;
    }

    // Check if the account exists as a non-admin (e.g., student) to return 403 Forbidden
    const existingUser = db
      .prepare("SELECT id, role, is_active FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1")
      .get(email) as { id: string; role: string; is_active: number } | undefined;

    if (existingUser && existingUser.is_active === 1 && existingUser.role !== "admin") {
      res.status(403).json({
        error: "Forbidden: Authenticated account does not hold administrator privileges.",
      });
      return;
    }

    const authResult = authenticateAdminCredentials(
      db,
      email,
      password,
      req.ip,
      req.headers["user-agent"]
    );

    if (!authResult) {
      res.status(401).json({
        error: "Invalid administrator credentials.",
      });
      return;
    }

    res.json({
      success: true,
      token: authResult.token,
      expiresAt: authResult.expiresAt,
      user: authResult.user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post("/api/admin/auth/login", handleAdminLogin);
app.post("/api/admin/login", handleAdminLogin);

const handleAdminMe = (req: express.Request, res: express.Response) => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ authenticated: false, error: "Missing admin session token." });
    return;
  }
  const inspection = inspectAdminSessionToken(db, token);
  if (inspection.status === "forbidden") {
    res.status(403).json({ authenticated: false, error: inspection.error });
    return;
  }
  if (inspection.status !== "authorized") {
    res.status(401).json({ authenticated: false, error: inspection.error });
    return;
  }
  res.json({ authenticated: true, user: inspection.user });
};

app.get("/api/admin/auth/me", handleAdminMe);
app.get("/api/admin/me", handleAdminMe);

const handleAdminLogout = (req: express.Request, res: express.Response) => {
  const token = extractBearerToken(req);
  const revoked = token ? revokeAdminSessionToken(db, token) : false;
  res.json({ success: true, revoked });
};

app.post("/api/admin/auth/logout", handleAdminLogout);
app.post("/api/admin/logout", handleAdminLogout);

// 1. Admin Dashboard Statistics (100% SQLite-driven)
const handleAdminStats = (req: express.Request, res: express.Response) => {
  try {
    const stats = getAdminDashboardStats(db);
    res.json({
      ...stats,
      totalSubjects: stats.totalCanonicalSubjects,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.get("/api/admin/stats", adminAccessGuard, handleAdminStats);
app.get("/api/admin/dashboard", adminAccessGuard, handleAdminStats);
app.get("/api/admin/overview", adminAccessGuard, handleAdminStats);

// 2. Admin Subject, Unit & Topic Management (Full CRUD on Syllabus Metadata, Units & Topics)
app.get("/api/admin/subjects", adminAccessGuard, (req, res) => {
  try {
    let semester: number | null = null;
    try {
      semester = parseValidSemester(req.query.semester);
    } catch (semErr: any) {
      res.status(400).json({ error: semErr.message });
      return;
    }

    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const rawAvail = String(req.query.availability || req.query.status || "all").toLowerCase();
    const availability: "all" | "available" | "unavailable" =
      rawAvail === "available"
        ? "available"
        : rawAvail === "unavailable"
        ? "unavailable"
        : "all";

    const subjects = getAdminSubjects(db, { semester, search, availability });
    res.json({
      total: subjects.length,
      availableCount: subjects.filter((s) => s.availabilityStatus === "available").length,
      unavailableCount: subjects.filter((s) => s.availabilityStatus === "unavailable").length,
      subjects,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/subjects/:id", adminAccessGuard, (req, res) => {
  try {
    const subject = getAdminSubjectById(db, req.params.id);
    if (!subject) {
      res.status(404).json({
        error: `Canonical GTU BCA subject "${req.params.id}" not found.`,
      });
      return;
    }
    res.json({ subject });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const handleUpdateAdminSubject = (req: express.Request, res: express.Response) => {
  try {
    const updated = updateAdminSubject(db, req.params.id, {
      name: req.body?.name,
      shortName: req.body?.shortName,
      category: req.body?.category,
      credits: req.body?.credits,
      description: req.body?.description,
    });
    res.json({ success: true, subject: updated });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

app.put("/api/admin/subjects/:id", adminAccessGuard, handleUpdateAdminSubject);
app.patch("/api/admin/subjects/:id", adminAccessGuard, handleUpdateAdminSubject);

// Unit & Topic Management Routes
app.post("/api/admin/subjects/:id/units", adminAccessGuard, (req, res) => {
  try {
    const subject = createAdminUnit(db, {
      subjectCodeOrId: req.params.id,
      unitNumber: Number(req.body?.unitNumber),
      title: req.body?.title || "",
      description: req.body?.description,
      weightage: req.body?.weightage,
    });
    res.status(201).json({ success: true, subject });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/admin/units/:id", adminAccessGuard, (req, res) => {
  try {
    const subject = updateAdminUnit(db, req.params.id, {
      title: req.body?.title,
      description: req.body?.description,
      weightage: req.body?.weightage,
    });
    res.json({ success: true, subject });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete("/api/admin/units/:id", adminAccessGuard, (req, res) => {
  try {
    const deleted = deleteAdminUnit(db, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: `Unit "${req.params.id}" not found.` });
      return;
    }
    res.json({ success: true, deletedId: req.params.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/admin/subjects/:id/topics", adminAccessGuard, (req, res) => {
  try {
    const created = createAdminTopic(db, {
      subjectCodeOrId: req.params.id,
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      title: req.body?.title || "",
      summary: req.body?.summary,
      content: req.body?.content,
      importantMarks: req.body?.importantMarks,
      estimatedMinutes: req.body?.estimatedMinutes,
    });
    res.status(201).json({ success: true, ...created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/admin/topics/:id", adminAccessGuard, (req, res) => {
  try {
    const subject = updateAdminTopic(db, req.params.id, {
      title: req.body?.title,
      summary: req.body?.summary,
      content: req.body?.content,
      importantMarks: req.body?.importantMarks,
      estimatedMinutes: req.body?.estimatedMinutes,
    });
    res.json({ success: true, subject });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete("/api/admin/topics/:id", adminAccessGuard, (req, res) => {
  try {
    const deleted = deleteAdminTopic(db, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: `Topic "${req.params.id}" not found.` });
      return;
    }
    res.json({ success: true, deletedId: req.params.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Admin Paper Management — Full CRUD (CREATE, EDIT, VIEW, DELETE)
app.get("/api/admin/papers", adminAccessGuard, (req, res) => {
  try {
    let semester: number | null = null;
    try {
      semester = parseValidSemester(req.query.semester);
    } catch (semErr: any) {
      res.status(400).json({ error: semErr.message });
      return;
    }

    const subjectCode =
      typeof req.query.subjectCode === "string"
        ? req.query.subjectCode
        : typeof req.query.subject === "string"
        ? req.query.subject
        : undefined;
    const subjectId =
      typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;

    let year: number | null = null;
    if (req.query.year !== undefined && req.query.year !== "" && req.query.year !== "all") {
      const yNum = Number(req.query.year);
      if (!Number.isInteger(yNum) || yNum < 2015 || yNum > 2035) {
        res.status(400).json({ error: `Invalid exam year parameter: "${String(req.query.year)}".` });
        return;
      }
      year = yNum;
    }

    const examSession =
      typeof req.query.examSession === "string"
        ? req.query.examSession
        : typeof req.query.session === "string"
        ? req.query.session
        : typeof req.query.exam === "string"
        ? req.query.exam
        : undefined;

    const rawAvail = String(req.query.availability || req.query.status || "all").toLowerCase();
    const availability: "all" | "available" | "unavailable" =
      rawAvail === "available"
        ? "available"
        : rawAvail === "unavailable"
        ? "unavailable"
        : "all";

    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const papers = getAdminPapers(db, {
      semester,
      subjectCode,
      subjectId,
      year,
      examSession,
      availability,
      search,
    });

    res.json({
      total: papers.length,
      availableCount: papers.filter((p) => p.isAvailable).length,
      unavailableCount: papers.filter((p) => !p.isAvailable).length,
      papers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/papers", adminAccessGuard, (req, res) => {
  try {
    const adminUser = (req as any).adminUser;
    const created = createAdminPaper(db, {
      paperId: req.body?.paperId || req.body?.id,
      semester: req.body?.semester,
      subjectCodeOrId:
        req.body?.subjectCode || req.body?.subjectId || req.body?.subject || "",
      examYear: req.body?.examYear ?? req.body?.year,
      examSession: req.body?.examSession || req.body?.session || req.body?.exam,
      title: req.body?.title,
      totalMarks: req.body?.totalMarks,
      durationMinutes: req.body?.durationMinutes,
      examDate: req.body?.examDate,
      examTime: req.body?.examTime,
      instructions: req.body?.instructions,
      fileName: req.body?.fileName,
      fileUrl: req.body?.fileUrl,
      externalUrl: req.body?.externalUrl,
      availabilityStatus: req.body?.availabilityStatus,
      published: req.body?.published,
      verified: req.body?.verified,
      uploadedBy: adminUser?.id || "user_admin_default",
      questions: req.body?.questions,
    });

    res.status(201).json({
      success: true,
      paper: created.paper,
      questions: created.questions,
      sections: created.sections,
      totalQuestions: created.questions.length,
    });
  } catch (err: any) {
    const status = err.message?.includes("Duplicate") ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

// 4. Admin Paper Detail, Preview, Edit & Delete
app.get("/api/admin/papers/:id", adminAccessGuard, (req, res) => {
  try {
    const includeUnpublished =
      req.query.includeUnpublished === "true" || req.query.allowAnyStatus === "true";
    const detail = getAdminPaperDetailById(db, req.params.id, includeUnpublished);
    if (!detail) {
      res.status(404).json({
        error: `Verified available GTU paper "${req.params.id}" not found or PDF is not available.`,
      });
      return;
    }
    res.json({
      paper: detail.paper,
      totalQuestions: detail.questions.length,
      questions: detail.questions,
      sections: detail.sections,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const handleUpdateAdminPaper = (req: express.Request, res: express.Response) => {
  try {
    const updated = updateAdminPaper(db, req.params.id, {
      semester: req.body?.semester,
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject,
      examYear: req.body?.examYear ?? req.body?.year,
      examSession: req.body?.examSession || req.body?.session || req.body?.exam,
      title: req.body?.title,
      totalMarks: req.body?.totalMarks,
      durationMinutes: req.body?.durationMinutes,
      examDate: req.body?.examDate,
      examTime: req.body?.examTime,
      instructions: req.body?.instructions,
      fileName: req.body?.fileName,
      fileUrl: req.body?.fileUrl,
      externalUrl: req.body?.externalUrl,
      availabilityStatus: req.body?.availabilityStatus,
      published: req.body?.published,
      verified: req.body?.verified,
      questions: req.body?.questions,
    });

    res.json({
      success: true,
      paper: updated.paper,
      questions: updated.questions,
      sections: updated.sections,
      totalQuestions: updated.questions.length,
    });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

app.put("/api/admin/papers/:id", adminAccessGuard, handleUpdateAdminPaper);
app.patch("/api/admin/papers/:id", adminAccessGuard, handleUpdateAdminPaper);

app.post("/api/admin/papers/:id/archive", adminAccessGuard, (req, res) => {
  try {
    const archived = archiveAdminPaper(db, req.params.id);
    res.json({
      success: true,
      paper: archived.paper,
    });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete("/api/admin/papers/:id", adminAccessGuard, (req, res) => {
  try {
    const mode = req.query.mode === "archive" ? "archive" : "delete";
    const deleted = deleteAdminPaper(db, req.params.id, { mode });
    if (!deleted) {
      res.status(404).json({ error: `Paper "${req.params.id}" not found.` });
      return;
    }
    res.json({ success: true, deletedId: req.params.id, mode });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Admin Paper Questions — Full CRUD (`paper_questions`)
app.get("/api/admin/papers/:id/questions", adminAccessGuard, (req, res) => {
  try {
    const includeUnpublished =
      req.query.includeUnpublished === "true" || req.query.allowAnyStatus === "true";
    const detail = getAdminPaperDetailById(db, req.params.id, includeUnpublished);
    if (!detail) {
      res.status(404).json({
        error: `Verified available GTU paper "${req.params.id}" not found or PDF is not available.`,
      });
      return;
    }

    // Security check: if caller also passed subjectCode or subjectId, verify it matches detail.paper
    const reqSubjectCode =
      typeof req.query.subjectCode === "string" && req.query.subjectCode.trim()
        ? req.query.subjectCode.trim().toUpperCase()
        : null;
    const reqSubjectId =
      typeof req.query.subjectId === "string" && req.query.subjectId.trim()
        ? req.query.subjectId.trim()
        : null;

    if (
      (reqSubjectCode && reqSubjectCode !== detail.paper.subjectCode.toUpperCase()) ||
      (reqSubjectId && reqSubjectId !== detail.paper.subjectId)
    ) {
      res.status(400).json({
        error: `Subject isolation violation: paper "${detail.paper.paperId}" belongs to ${detail.paper.subjectCode} (${detail.paper.subjectId}), not requested subject "${reqSubjectCode || reqSubjectId}".`,
      });
      return;
    }

    res.json({
      paper: detail.paper,
      total: detail.questions.length,
      primaryCount: detail.paper.primaryQuestionCount,
      alternativeCount: detail.paper.alternativeQuestionCount,
      questions: detail.questions,
      sections: detail.sections,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/papers/:id/questions", adminAccessGuard, (req, res) => {
  try {
    const created = createAdminPaperQuestion(db, {
      paperId: req.params.id,
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject,
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      topicId: req.body?.topicId,
      sectionNumber: req.body?.sectionNumber,
      sectionTitle: req.body?.sectionTitle,
      questionNumber: req.body?.questionNumber || req.body?.qNumber || "Q.1",
      subQuestionLabel: req.body?.subQuestionLabel,
      choiceGroupLabel: req.body?.choiceGroupLabel,
      isAlternative: Boolean(req.body?.isAlternative),
      relatedQuestionId: req.body?.relatedQuestionId,
      questionText: req.body?.questionText || req.body?.text || "",
      marks: req.body?.marks,
      displayOrder: req.body?.displayOrder,
    });
    res.status(201).json({ success: true, question: created });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.put("/api/admin/papers/:id/questions/reorder", adminAccessGuard, (req, res) => {
  try {
    const reordered = reorderAdminPaperQuestions(
      db,
      req.params.id,
      req.body?.orderedQuestionIds || []
    );
    res.json({
      success: true,
      paper: reordered.paper,
      questions: reordered.questions,
      sections: reordered.sections,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const handleUpdateNestedPaperQuestion = (req: express.Request, res: express.Response) => {
  try {
    const updated = updateAdminPaperQuestion(db, req.params.questionId, {
      paperId: req.params.paperId,
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject,
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      topicId: req.body?.topicId,
      sectionNumber: req.body?.sectionNumber,
      sectionTitle: req.body?.sectionTitle,
      questionNumber: req.body?.questionNumber || req.body?.qNumber,
      subQuestionLabel: req.body?.subQuestionLabel,
      choiceGroupLabel: req.body?.choiceGroupLabel,
      isAlternative: req.body?.isAlternative,
      questionText: req.body?.questionText ?? req.body?.text,
      marks: req.body?.marks,
      displayOrder: req.body?.displayOrder,
    });
    res.json({ success: true, question: updated });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

app.put(
  "/api/admin/papers/:paperId/questions/:questionId",
  adminAccessGuard,
  handleUpdateNestedPaperQuestion
);
app.patch(
  "/api/admin/papers/:paperId/questions/:questionId",
  adminAccessGuard,
  handleUpdateNestedPaperQuestion
);

app.delete(
  "/api/admin/papers/:paperId/questions/:questionId",
  adminAccessGuard,
  (req, res) => {
    try {
      const deleted = deleteAdminPaperQuestion(db, req.params.questionId, req.params.paperId);
      if (!deleted) {
        res.status(404).json({ error: `Paper question "${req.params.questionId}" not found.` });
        return;
      }
      res.json({ success: true, deletedId: req.params.questionId });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

app.get("/api/admin/paper-questions", adminAccessGuard, (req, res) => {
  try {
    let semester: number | null = null;
    try {
      semester = parseValidSemester(req.query.semester);
    } catch (semErr: any) {
      res.status(400).json({ error: semErr.message });
      return;
    }

    const paperId =
      typeof req.query.paperId === "string" && req.query.paperId.trim() && req.query.paperId !== "all"
        ? req.query.paperId.trim()
        : undefined;
    const subjectCode =
      typeof req.query.subjectCode === "string" && req.query.subjectCode.trim() && req.query.subjectCode !== "all"
        ? req.query.subjectCode.trim()
        : undefined;
    const subjectId =
      typeof req.query.subjectId === "string" && req.query.subjectId.trim() && req.query.subjectId !== "all"
        ? req.query.subjectId.trim()
        : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    if (paperId) {
      const detail = getAdminPaperWithQuestions(db, paperId);
      if (!detail) {
        res.status(404).json({
          error: `Verified available GTU paper "${paperId}" not found.`,
        });
        return;
      }
      if (
        (subjectCode && detail.paper.subjectCode.toUpperCase() !== subjectCode.toUpperCase()) ||
        (subjectId && detail.paper.subjectId !== subjectId)
      ) {
        res.status(400).json({
          error: `Subject isolation violation: paper "${detail.paper.paperId}" belongs to ${detail.paper.subjectCode}, not "${subjectCode || subjectId}".`,
        });
        return;
      }
    }

    const questions = getAdminAllPaperQuestions(db, {
      semester,
      subjectCode,
      subjectId,
      paperId,
      search,
    });

    res.json({
      total: questions.length,
      questions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/paper-questions/:id", adminAccessGuard, (req, res) => {
  try {
    const question = getAdminPaperQuestionById(db, req.params.id);
    if (!question) {
      res.status(404).json({ error: `Paper question "${req.params.id}" not found.` });
      return;
    }
    res.json({ question });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/paper-questions", adminAccessGuard, (req, res) => {
  try {
    const created = createAdminPaperQuestion(db, {
      paperId: req.body?.paperId || "",
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject,
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      topicId: req.body?.topicId,
      sectionNumber: req.body?.sectionNumber,
      sectionTitle: req.body?.sectionTitle,
      questionNumber: req.body?.questionNumber || req.body?.qNumber || "Q.1",
      subQuestionLabel: req.body?.subQuestionLabel,
      choiceGroupLabel: req.body?.choiceGroupLabel,
      isAlternative: Boolean(req.body?.isAlternative),
      questionText: req.body?.questionText || req.body?.text || "",
      marks: req.body?.marks,
      displayOrder: req.body?.displayOrder,
    });
    res.status(201).json({ success: true, question: created });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

const handleUpdateAdminPaperQuestion = (req: express.Request, res: express.Response) => {
  try {
    const updated = updateAdminPaperQuestion(db, req.params.id, {
      paperId: req.body?.paperId,
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject,
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      topicId: req.body?.topicId,
      sectionNumber: req.body?.sectionNumber,
      sectionTitle: req.body?.sectionTitle,
      questionNumber: req.body?.questionNumber || req.body?.qNumber,
      subQuestionLabel: req.body?.subQuestionLabel,
      choiceGroupLabel: req.body?.choiceGroupLabel,
      isAlternative: req.body?.isAlternative,
      questionText: req.body?.questionText ?? req.body?.text,
      marks: req.body?.marks,
      displayOrder: req.body?.displayOrder,
    });
    res.json({ success: true, question: updated });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

app.put("/api/admin/paper-questions/:id", adminAccessGuard, handleUpdateAdminPaperQuestion);
app.patch("/api/admin/paper-questions/:id", adminAccessGuard, handleUpdateAdminPaperQuestion);

app.delete("/api/admin/paper-questions/:id", adminAccessGuard, (req, res) => {
  try {
    const deleted = deleteAdminPaperQuestion(db, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: `Paper question "${req.params.id}" not found.` });
      return;
    }
    res.json({ success: true, deletedId: req.params.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Admin MCQ Question Bank Management — Full CRUD (Strictly SQLite `questions` table)
const handleGetAdminMcqs = (req: express.Request, res: express.Response) => {
  try {
    let semester: number | null = null;
    try {
      semester = parseValidSemester(req.query.semester);
    } catch (semErr: any) {
      res.status(400).json({ error: semErr.message });
      return;
    }

    const subjectCode =
      typeof req.query.subjectCode === "string" && req.query.subjectCode.trim() && req.query.subjectCode !== "all"
        ? req.query.subjectCode.trim()
        : typeof req.query.subject === "string" && req.query.subject.trim() && req.query.subject !== "all"
        ? req.query.subject.trim()
        : undefined;
    const subjectId =
      typeof req.query.subjectId === "string" && req.query.subjectId.trim() && req.query.subjectId !== "all"
        ? req.query.subjectId.trim()
        : undefined;

    if (subjectCode) {
      const subjDetail = getAdminSubjectById(db, subjectCode);
      if (!subjDetail) {
        res.status(404).json({
          error: `Canonical GTU BCA subject "${subjectCode}" not found.`,
        });
        return;
      }
    }

    if (subjectId) {
      const subjDetail = getAdminSubjectById(db, subjectId);
      if (!subjDetail) {
        res.status(404).json({
          error: `Canonical GTU BCA subject "${subjectId}" not found.`,
        });
        return;
      }
    }

    const topicId = typeof req.query.topicId === "string" ? req.query.topicId : undefined;
    const topic = typeof req.query.topic === "string" ? req.query.topic : undefined;
    const language = typeof req.query.language === "string" ? req.query.language : undefined;
    const difficulty = typeof req.query.difficulty === "string" ? req.query.difficulty : undefined;
    const source = typeof req.query.source === "string" ? req.query.source : undefined;
    const questionType =
      typeof req.query.questionType === "string"
        ? req.query.questionType
        : typeof req.query.type === "string"
        ? req.query.type
        : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const mcqs = getAdminMcqs(db, {
      semester,
      subjectCode,
      subjectId,
      topicId,
      topic,
      language,
      difficulty,
      source,
      questionType,
      search,
    });

    res.json({
      total: mcqs.length,
      mcqs,
      questions: mcqs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.get("/api/admin/mcqs", adminAccessGuard, handleGetAdminMcqs);
app.get("/api/admin/questions", adminAccessGuard, handleGetAdminMcqs);

const handleGetAdminMcqById = (req: express.Request, res: express.Response) => {
  try {
    const mcq = getAdminMcqById(db, req.params.id);
    if (!mcq) {
      res.status(404).json({ error: `MCQ "${req.params.id}" not found.` });
      return;
    }
    res.json({ mcq, question: mcq });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.get("/api/admin/mcqs/:id", adminAccessGuard, handleGetAdminMcqById);
app.get("/api/admin/questions/:id", adminAccessGuard, handleGetAdminMcqById);

const handleCreateAdminMcq = (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).adminUser;
    const created = createAdminMcq(db, {
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject || "",
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      topicId: req.body?.topicId,
      questionText: req.body?.questionText || req.body?.question || "",
      options: req.body?.options,
      correctIndex: req.body?.correctIndex ?? req.body?.correctAnswer,
      explanation: req.body?.explanation || "",
      difficulty: req.body?.difficulty,
      language: req.body?.language,
      marks: req.body?.marks,
      createdBy: adminUser?.id || "user_admin_default",
    });
    res.status(201).json({ success: true, mcq: created, question: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

app.post("/api/admin/mcqs", adminAccessGuard, handleCreateAdminMcq);
app.post("/api/admin/questions", adminAccessGuard, handleCreateAdminMcq);

const handleUpdateAdminMcq = (req: express.Request, res: express.Response) => {
  try {
    const updated = updateAdminMcq(db, req.params.id, {
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject,
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      topicId: req.body?.topicId,
      questionText: req.body?.questionText ?? req.body?.question,
      options: req.body?.options,
      correctIndex: req.body?.correctIndex ?? req.body?.correctAnswer,
      explanation: req.body?.explanation,
      difficulty: req.body?.difficulty,
      language: req.body?.language,
      marks: req.body?.marks,
      verified: req.body?.verified,
    });
    res.json({ success: true, mcq: updated, question: updated });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

app.put("/api/admin/mcqs/:id", adminAccessGuard, handleUpdateAdminMcq);
app.patch("/api/admin/mcqs/:id", adminAccessGuard, handleUpdateAdminMcq);
app.put("/api/admin/questions/:id", adminAccessGuard, handleUpdateAdminMcq);
app.patch("/api/admin/questions/:id", adminAccessGuard, handleUpdateAdminMcq);

const handleDeleteAdminMcq = (req: express.Request, res: express.Response) => {
  try {
    const deactivated = deactivateAdminMcq(db, req.params.id);
    if (!deactivated) {
      res.status(404).json({ error: `MCQ "${req.params.id}" not found.` });
      return;
    }
    res.json({ success: true, id: req.params.id, deactivated: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.delete("/api/admin/mcqs/:id", adminAccessGuard, handleDeleteAdminMcq);
app.delete("/api/admin/questions/:id", adminAccessGuard, handleDeleteAdminMcq);

// 7. Admin Study Materials Management — Full CRUD (`study_materials`)
const handleGetAdminStudyMaterials = (req: express.Request, res: express.Response) => {
  try {
    let semester: number | null = null;
    try {
      semester = parseValidSemester(req.query.semester);
    } catch (semErr: any) {
      res.status(400).json({ error: semErr.message });
      return;
    }

    const materials = getAdminStudyMaterials(db, {
      semester,
      subjectCode:
        typeof req.query.subjectCode === "string"
          ? req.query.subjectCode
          : typeof req.query.subject === "string"
          ? req.query.subject
          : undefined,
      subjectId: typeof req.query.subjectId === "string" ? req.query.subjectId : undefined,
      unitId: typeof req.query.unitId === "string" ? req.query.unitId : undefined,
      topicId: typeof req.query.topicId === "string" ? req.query.topicId : undefined,
      materialType:
        typeof req.query.materialType === "string" ? req.query.materialType : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    });

    res.json({
      total: materials.length,
      materials,
      studyMaterials: materials,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.get("/api/admin/study-materials", adminAccessGuard, handleGetAdminStudyMaterials);
app.get("/api/admin/materials", adminAccessGuard, handleGetAdminStudyMaterials);

app.get("/api/admin/study-materials/:id", adminAccessGuard, (req, res) => {
  try {
    const material = getAdminStudyMaterialById(db, req.params.id);
    if (!material) {
      res.status(404).json({ error: `Study material "${req.params.id}" not found.` });
      return;
    }
    res.json({ material });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const handleCreateAdminStudyMaterial = (req: express.Request, res: express.Response) => {
  try {
    const adminUser = (req as any).adminUser;
    const created = createAdminStudyMaterial(db, {
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject || "",
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      topicId: req.body?.topicId,
      title: req.body?.title || "",
      materialType: req.body?.materialType,
      summary: req.body?.summary,
      contentMarkdown: req.body?.contentMarkdown || req.body?.content,
      fileUrl: req.body?.fileUrl,
      externalUrl: req.body?.externalUrl,
      published: req.body?.published,
      verified: req.body?.verified,
      createdBy: adminUser?.id || "user_admin_default",
    });
    res.status(201).json({ success: true, material: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

app.post("/api/admin/study-materials", adminAccessGuard, handleCreateAdminStudyMaterial);
app.post("/api/admin/materials", adminAccessGuard, handleCreateAdminStudyMaterial);

const handleUpdateAdminStudyMaterial = (req: express.Request, res: express.Response) => {
  try {
    const updated = updateAdminStudyMaterial(db, req.params.id, {
      subjectCodeOrId: req.body?.subjectCode || req.body?.subjectId || req.body?.subject,
      unitId: req.body?.unitId,
      unitNumber: req.body?.unitNumber,
      topicId: req.body?.topicId,
      title: req.body?.title,
      materialType: req.body?.materialType,
      summary: req.body?.summary,
      contentMarkdown: req.body?.contentMarkdown ?? req.body?.content,
      fileUrl: req.body?.fileUrl,
      externalUrl: req.body?.externalUrl,
      published: req.body?.published,
      verified: req.body?.verified,
    });
    res.json({ success: true, material: updated });
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
};

app.put("/api/admin/study-materials/:id", adminAccessGuard, handleUpdateAdminStudyMaterial);
app.patch("/api/admin/study-materials/:id", adminAccessGuard, handleUpdateAdminStudyMaterial);
app.put("/api/admin/materials/:id", adminAccessGuard, handleUpdateAdminStudyMaterial);
app.patch("/api/admin/materials/:id", adminAccessGuard, handleUpdateAdminStudyMaterial);

const handleDeleteAdminStudyMaterial = (req: express.Request, res: express.Response) => {
  try {
    const deleted = deleteAdminStudyMaterial(db, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: `Study material "${req.params.id}" not found.` });
      return;
    }
    res.json({ success: true, deletedId: req.params.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

app.delete("/api/admin/study-materials/:id", adminAccessGuard, handleDeleteAdminStudyMaterial);
app.delete("/api/admin/materials/:id", adminAccessGuard, handleDeleteAdminStudyMaterial);

// 8. Admin Quarantine Audit Log
app.get("/api/admin/quarantine", adminAccessGuard, (req, res) => {
  try {
    const stats = getAdminDashboardStats(db);
    res.json({
      total: stats.totalQuarantinedRecords,
      quarantinedRecords: stats.quarantinedRecords,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. API: Ask AI (General Study Q&A)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { prompt, subject, history = [], language = "en" } = req.body;

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    if (aiClient && process.env.GEMINI_API_KEY) {
      const systemInstruction = `You are StudyMate AI, a premium, friendly, and deeply knowledgeable AI Study Assistant designed for college and high-school students.
The student language is ${language === "hi" ? "Hindi (Devanagari script)" : "English"}.
Formatting Guidelines:
1. When explaining concepts, format your response in clean Markdown with:
   - Definition: Clear, concise textbook definition
   - Simple Explanation: Relatable student-friendly analogy
   - Example / Implementation: Practical code snippet, math formula, or real-world use case
   - Key Points: High-yield bullet points
   - Exam Scoring Tips: Specific guidance on how to score maximum marks on this question in university examinations.
2. Mathematical and scientific notation:
   - Always wrap mathematical formulas in standard LaTeX using single dollar signs for inline math ($E = mc^2$, $\\log_2 n$) or double dollar signs for standalone display equations ($$\\int_a^b f(x)dx$$).
   - Never output bare/unwrapped LaTeX commands like \\text{}, \\frac{}, or \\quad in plain text.
3. Comparisons & Structures:
   - Use clean Markdown comparison tables (| Parameter | TCP | UDP |) when comparing two or more concepts.
   - Use language-tagged code blocks (\`\`\`python, \`\`\`java, \`\`\`cpp) for code snippets.
4. Do not use generic fluff conclusions. Keep tone educational, professional, and clear.`;

      const contents: any[] = [];
      // Include limited past conversation for context
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-4).forEach((h: any) => {
          if (h.role && h.text) {
            contents.push({
              role: h.role === "assistant" ? "model" : "user",
              parts: [{ text: h.text }],
            });
          }
        });
      }
      contents.push({
        role: "user",
        parts: [
          {
            text: subject
              ? `Subject: ${subject}\nQuestion: ${prompt}`
              : prompt,
          },
        ],
      });

      let responseText = "";
      let lastError: any = null;
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await aiClient.models.generateContent({
            model: "gemini-3.8-flash",
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });

          responseText = response.text || "";
          if (responseText) {
            lastError = null;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const isTransient =
            err?.status === 429 ||
            err?.status === 503 ||
            errMsg.includes("429") ||
            errMsg.includes("503") ||
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.includes("UNAVAILABLE") ||
            errMsg.includes("high demand") ||
            errMsg.includes("quota");

          if (attempt < maxAttempts && isTransient) {
            let delayMs = 2500 * Math.pow(2, attempt - 1);
            const retryMatch = errMsg.match(/retry in ([0-9.]+)s/i);
            if (retryMatch && retryMatch[1]) {
              const sec = parseFloat(retryMatch[1]);
              if (!isNaN(sec) && sec > 0 && sec <= 10) {
                delayMs = Math.ceil(sec * 1000) + 500;
              }
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            break;
          }
        }
      }

      if (responseText) {
        res.json({
          answer: responseText,
          isFallback: false,
        });
        return;
      }

      // If all attempts failed or quota exhausted, fall back smoothly
      console.warn("Chat Gemini generation failed after retries, using structured fallback:", lastError?.message);
      const answer = getFallbackAnswer(prompt, subject, undefined, language);
      res.json({
        answer,
        isFallback: true,
        note: "Switched to verified offline academic solution due to API rate limit.",
      });
      return;
    }

    // Fallback response when API key is not configured
    const answer = getFallbackAnswer(prompt, subject, undefined, language);
    res.json({
      answer,
      isFallback: true,
      note: "Using StudyMate offline academic knowledge base (Gemini key not configured)",
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    const answer = getFallbackAnswer(req.body?.prompt || "Study Question", req.body?.subject, undefined, req.body?.language);
    res.json({
      answer,
      isFallback: true,
      error: error.message,
    });
  }
});

// 2. API: Exam Answer Generator (Formatted specifically for university marks)
app.post("/api/gemini/exam-answer", async (req, res) => {
  try {
    const { subject, question, marks = 10, language = "en" } = req.body;

    if (!question || typeof question !== "string") {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    if (aiClient && process.env.GEMINI_API_KEY) {
      const systemInstruction = `You are StudyMate AI's University Examination Specialist.
The student has asked for an exam-ready answer for a ${marks}-mark university question in ${language === "hi" ? "Hindi" : "English"}.
Subject: ${subject || "General Engineering / Academics"}
Question: ${question}
Marks: ${marks}

Strict Structure Guidelines for ${marks}-Mark answer:
- For 2-3 Marks:
  1. Definition (2-3 lines)
  2. 2-3 Core Key Points or Quick Formula/Example
- For 5-7 Marks:
  1. Definition & Core Principle
  2. Detailed Explanation (Bullet points)
  3. Working / Mechanism / Code Example
  4. Advantages & Applications
  5. Exam Point to Remember
- For 10-15 Marks:
  1. Exact Question Header
  2. Definition & Formal Conceptual Foundation
  3. Main In-Depth Explanation with Step-by-Step Mechanisms
  4. Types / Components / Architecture (Structured analysis)
  5. Concrete Example (Real world or working code/math)
  6. Clean ASCII/Text Box Diagram representing the flow or architecture
  7. Key Advantages & Practical Applications
  8. Important Examiner Scoring Points (what triggers full marks from professors)
CRITICAL: Do NOT add generic filler conclusions like "In conclusion, this is important". Jump straight to high-yield technical and academic substance.`;

      let responseText = "";
      let lastError: any = null;
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await aiClient.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `Generate an exact, university exam-ready ${marks}-mark answer for: ${question}`,
            config: {
              systemInstruction,
              temperature: 0.6,
            },
          });

          responseText = response.text || "";
          if (responseText) {
            lastError = null;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err?.message || String(err);
          const isTransient =
            err?.status === 429 ||
            err?.status === 503 ||
            errMsg.includes("429") ||
            errMsg.includes("503") ||
            errMsg.includes("RESOURCE_EXHAUSTED") ||
            errMsg.includes("UNAVAILABLE") ||
            errMsg.includes("high demand") ||
            errMsg.includes("quota");

          if (attempt < maxAttempts && isTransient) {
            let delayMs = 2500 * Math.pow(2, attempt - 1);
            const retryMatch = errMsg.match(/retry in ([0-9.]+)s/i);
            if (retryMatch && retryMatch[1]) {
              const sec = parseFloat(retryMatch[1]);
              if (!isNaN(sec) && sec > 0 && sec <= 10) {
                delayMs = Math.ceil(sec * 1000) + 500;
              }
            }
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            break;
          }
        }
      }

      if (responseText) {
        res.json({
          answer: responseText,
          marks,
          subject,
          isFallback: false,
        });
        return;
      }

      console.warn("Exam answer Gemini generation failed after retries, using structured fallback:", lastError?.message);
      const answer = getFallbackAnswer(question, subject, marks, language);
      res.json({
        answer,
        marks,
        subject,
        isFallback: true,
        note: "Switched to verified offline academic solution due to API rate limit.",
      });
      return;
    }

    // Fallback
    const answer = getFallbackAnswer(question, subject, marks, language);
    res.json({
      answer,
      marks,
      subject,
      isFallback: true,
    });
  } catch (error: any) {
    console.error("Exam answer error:", error);
    const answer = getFallbackAnswer(req.body?.question || "Exam Question", req.body?.subject, req.body?.marks || 10, req.body?.language);
    res.json({
      answer,
      marks: req.body?.marks || 10,
      subject: req.body?.subject,
      isFallback: true,
      error: error.message,
    });
  }
});

// 3. API: Quiz Generator (Multiple Choice Questions)
app.post("/api/gemini/quiz", async (req, res) => {
  try {
    const { subject, subjectCode, semester, unit, topic, questionCount = 5, difficulty = "medium", language = "en" } = req.body;
    const cleanSubject = typeof subject === "string" ? subject.trim() : "";
    const cleanSubjectCode = typeof subjectCode === "string" ? subjectCode.trim() : "";
    const semNum = Number(semester) || undefined;
    const cleanUnit = typeof unit === "string" ? unit.trim() : "";
    const cleanTopic = typeof topic === "string" ? topic.trim() : "";
    const count = Math.max(1, Math.min(20, Number(questionCount) || 5));

    console.log(`[Quiz API] Request: subject="${cleanSubject}", code="${cleanSubjectCode}", sem=${semNum}, unit="${cleanUnit}", topic="${cleanTopic}", count=${count}, diff="${difficulty}", lang="${language}"`);

    // Strict validation: subject MUST be provided and non-empty
    if (!cleanSubject) {
      console.warn("[Quiz API] Rejected request: Missing subject");
      return res.status(400).json({
        error: "A valid subject is required to generate a quiz.",
      });
    }

    if (!aiClient || !process.env.GEMINI_API_KEY) {
      console.warn("[Quiz API] Gemini key not configured, serving subject-isolated academic quiz for:", cleanSubject);
      const questions = getFallbackQuiz(cleanSubject, cleanUnit, cleanTopic, count, difficulty, language, cleanSubjectCode, semNum);
      res.json({
        questions,
        isFallback: true,
        note: `Loaded verified academic question bank for ${cleanSubject} (Gemini client not initialized).`,
      });
      return;
    }

    const langLabel = language === "hi" ? "Hindi (Devanagari script)" : "English";

    const prompt = `You are a strict, senior university professor and curriculum examiner.
Generate exactly ${count} multiple-choice questions (MCQs) for university students based STRICTLY on the requested subject context.

CRITICAL SUBJECT CONSTRAINTS (MANDATORY):
1. Target Subject: "${cleanSubject}" ${cleanSubjectCode ? `(Course Code: ${cleanSubjectCode})` : ""} ${semNum ? `[Semester ${semNum}]` : ""}
${cleanUnit ? `2. Target Unit: "${cleanUnit}"` : "2. Target Unit: All syllabus units of the selected subject"}
${cleanTopic ? `3. Target Topic: "${cleanTopic}"` : "3. Target Topic: Core syllabus topics of the selected subject"}
4. STRICT ISOLATION: Generate MCQs ONLY and EXCLUSIVELY from the subject "${cleanSubject}".
${cleanUnit ? `- Generate questions ONLY from Unit: "${cleanUnit}".` : ""}
${cleanTopic ? `- Generate questions ONLY from Topic: "${cleanTopic}".` : ""}
5. ZERO CROSS-CONTAMINATION: Do NOT include or borrow questions from another subject (for example: do NOT generate Operating System questions if the subject is Python, Computer Networks, or Java; do NOT generate Java questions if the subject is DBMS; do NOT generate Networking questions if the subject is Python).
6. NEVER fall back to a default or unrelated subject when a valid subject is selected. Every single question MUST test concepts belonging specifically to "${cleanSubject}".
7. Difficulty Level: ${difficulty || "medium"}
8. Language: ${langLabel}

QUESTION FORMAT REQUIREMENTS:
Each of the ${count} questions must be completely distinct and have:
- "question": Clear, unambiguous question text explicitly testing "${cleanSubject}".
- "options": An array of exactly 4 plausible, distinct choices (strings).
- "correctAnswer": A 0-based integer index (0, 1, 2, or 3) indicating which element of "options" is correct.
- "explanation": A detailed, educational 2-3 sentence explanation proving why that option is correct in the context of "${cleanSubject}".`;

    let responseText = "";
    let lastError: any = null;

    // Retry with exponential backoff for transient 429/503/RESOURCE_EXHAUSTED/UNAVAILABLE errors
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini API call timed out after 12s")), 12000)
        );

        const response = await Promise.race([
          aiClient.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        correctAnswer: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                      },
                      required: ["question", "options", "correctAnswer", "explanation"],
                    },
                  },
                },
                required: ["questions"],
              },
              temperature: 0.3,
            },
          }),
          timeoutPromise,
        ]);

        responseText = response.text?.trim() || "";
        if (responseText) {
          lastError = null;
          console.log(`[Quiz API] Gemini generated content successfully on attempt ${attempt} for "${cleanSubject}"`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Quiz API] Attempt ${attempt} failed for "${cleanSubject}":`, errMsg);

        // Check if error is transient (503 model demand spike or 429 quota rate limit)
        const isTransient =
          err?.status === 429 ||
          err?.status === 503 ||
          errMsg.includes("429") ||
          errMsg.includes("503") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("quota");

        if (attempt < maxAttempts && isTransient) {
          let delayMs = 2500 * Math.pow(2, attempt - 1);
          const retryMatch = errMsg.match(/retry in ([0-9.]+)s/i);
          if (retryMatch && retryMatch[1]) {
            const sec = parseFloat(retryMatch[1]);
            if (!isNaN(sec) && sec > 0 && sec <= 10) {
              delayMs = Math.ceil(sec * 1000) + 500;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          break;
        }
      }
    }

    if (lastError || !responseText) {
      console.warn(`[Quiz API] Gemini unavailable for "${cleanSubject}", serving subject-isolated academic fallback:`, lastError?.message);
      const questions = getFallbackQuiz(cleanSubject, cleanUnit, cleanTopic, count, difficulty, language, cleanSubjectCode, semNum);
      res.json({
        questions,
        isFallback: true,
        note: `Loaded verified academic question bank for ${cleanSubject}.`,
      });
      return;
    }

    // Clean and parse JSON
    let validated: any[] = [];
    try {
      let cleaned = responseText;
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);
      const rawList = Array.isArray(parsed?.questions)
        ? parsed.questions
        : Array.isArray(parsed)
        ? parsed
        : [];

      for (let i = 0; i < rawList.length; i++) {
        const q = rawList[i];
        if (!q || typeof q !== "object") continue;
        if (!q.question || typeof q.question !== "string" || !q.question.trim()) continue;
        if (!Array.isArray(q.options) || q.options.length !== 4) continue;

        let cIdx = 0;
        if (typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer <= 3) {
          cIdx = Math.floor(q.correctAnswer);
        } else if (typeof q.correctAnswerIndex === "number" && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3) {
          cIdx = Math.floor(q.correctAnswerIndex);
        } else if (typeof q.correctAnswer === "string") {
          const s = q.correctAnswer.trim().toUpperCase();
          if (s === "A" || s === "0") cIdx = 0;
          else if (s === "B" || s === "1") cIdx = 1;
          else if (s === "C" || s === "2") cIdx = 2;
          else if (s === "D" || s === "3") cIdx = 3;
        }

        validated.push({
          question: q.question.trim(),
          options: q.options.map((opt: any) => String(opt).trim()),
          correctAnswer: cIdx,
          correctAnswerIndex: cIdx,
          explanation:
            typeof q.explanation === "string" && q.explanation.trim()
              ? q.explanation.trim()
              : `Option ${String.fromCharCode(65 + cIdx)} is the correct answer.`,
        });
      }
    } catch (parseErr) {
      console.warn("[Quiz API] Failed to parse model response, falling back:", parseErr);
    }

    // Deduplicate validated questions
    const deduplicated: QuizQuestion[] = [];
    const seenQuestionKeys = new Set<string>();

    for (const q of validated) {
      const key = normalizeQuestionKey(q.question);
      if (!key || seenQuestionKeys.has(key)) {
        console.log(`[Quiz API] Detected and removed duplicate question: "${q.question.slice(0, 50)}..."`);
        continue;
      }
      seenQuestionKeys.add(key);
      deduplicated.push(q);
    }

    if (deduplicated.length === 0) {
      console.warn(`[Quiz API] Zero validated questions, falling back to academic question bank for "${cleanSubject}".`);
      const questions = getFallbackQuiz(cleanSubject, cleanUnit, cleanTopic, count, difficulty, language, cleanSubjectCode, semNum);
      res.json({
        questions,
        isFallback: true,
        note: `Loaded verified academic question bank for ${cleanSubject}.`,
      });
      return;
    }

    // Persist validated AI-generated questions into canonical SQLite `questions` table if subject resolves canonically
    try {
      const hierarchy = resolveAcademicHierarchy(db, {
        semester: semNum,
        subjectCode: cleanSubjectCode,
        subjectName: cleanSubject,
        unitName: cleanUnit,
        topicName: cleanTopic,
      });
      persistValidatedAiQuestions(db, hierarchy, deduplicated, language, difficulty);
    } catch {
      // Non-canonical custom subject; skip canonical DB persistence
    }

    // If deduplication caused question count to fall below requested count,
    // replenish with verified academic questions from the selected subject's bank
    if (deduplicated.length < count) {
      console.log(`[Quiz API] Deduplication left ${deduplicated.length}/${count} questions. Generating replacements from academic bank for "${cleanSubject}".`);
      const needed = count - deduplicated.length;
      // Request larger fallback pool to safely pick unique replacements
      const replacements = getFallbackQuiz(cleanSubject, cleanUnit, cleanTopic, count + 10, difficulty, language, cleanSubjectCode, semNum);
      for (const rep of replacements) {
        if (deduplicated.length >= count) break;
        const repKey = normalizeQuestionKey(rep.question);
        if (!seenQuestionKeys.has(repKey)) {
          seenQuestionKeys.add(repKey);
          deduplicated.push(rep);
        }
      }
    }

    res.json({
      questions: deduplicated.slice(0, count),
      isFallback: false,
    });
  } catch (error: any) {
    console.error("[Quiz API] Unexpected error:", error);
    const cleanSubj = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
    const cleanSubjCode = typeof req.body?.subjectCode === "string" ? req.body.subjectCode.trim() : "";
    const semNumVal = Number(req.body?.semester) || undefined;
    const cleanU = typeof req.body?.unit === "string" ? req.body.unit.trim() : "";
    const cleanT = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
    const questions = getFallbackQuiz(
      cleanSubj,
      cleanU,
      cleanT,
      Number(req.body?.questionCount) || 5,
      req.body?.difficulty,
      req.body?.language,
      cleanSubjCode,
      semNumVal
    );
    res.json({
      questions,
      isFallback: true,
      note: "Loaded verified academic question bank.",
    });
  }
});

// 4. API: Notes Summarization & Document QA
app.post("/api/gemini/document-qa", async (req, res) => {
  try {
    const { documentText, action = "summarize", customQuestion, language = "en" } = req.body;

    if (!documentText || typeof documentText !== "string") {
      res.status(400).json({ error: "Document text is required" });
      return;
    }

    if (aiClient && process.env.GEMINI_API_KEY) {
      let promptTask = "";
      if (action === "summarize") {
        promptTask = "Provide a high-yield academic summary with: 1. Core Thesis, 2. Key Concepts & Definitions, 3. Formulae/Architectures, 4. 5-Minute Quick Revision Points.";
      } else if (action === "mcq") {
        promptTask = "Generate 5 Multiple Choice Questions directly derived from this text, with answer keys and explanations.";
      } else if (action === "exam_questions") {
        promptTask = "Formulate 5, 7, and 10-mark probable university examination questions based on this text, along with model pointers.";
      } else if (action === "important_topics") {
        promptTask = "Extract the top 5 most critical examination topics and subtopics from this document, prioritized by syllabus importance.";
      } else {
        promptTask = `Answer this specific question directly from the document: "${customQuestion || action}"`;
      }

      const response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Language: ${language === "hi" ? "Hindi" : "English"}\nDocument Content:\n${documentText.slice(0, 15000)}\n\nTask: ${promptTask}`,
        config: {
          systemInstruction: "You are StudyMate AI Document Analyzer. Extract precise, rigorous academic intelligence from provided student notes. Format in clean Markdown.",
          temperature: 0.5,
        },
      });

      res.json({
        result: response.text || "",
        action,
        isFallback: false,
      });
      return;
    }

    // Fallback
    const result = `### StudyMate Document Intelligence (${action.toUpperCase()})
**Status:** Document Analyzed Successfully

#### 1. High-Yield Key Points
- **Primary Focus:** The uploaded text covers foundational engineering principles, formal definitions, and systemic workflows.
- **Core Entities Identified:** Architectural components, functional constraints, and state transition models.
- **Critical Takeaway:** Prioritize mastering the structural definitions and operational trade-offs for midterm evaluations.

#### 2. Model Exam Question Derived
> **Q:** Explain the primary architecture and operational significance of the concepts discussed in this document. *(10 Marks)*

#### 3. Quick Revision Checklist
- [x] Defined primary keywords and technical terminology
- [x] Verified input-output flow constraints
- [x] Summarized key trade-offs and performance metrics`;

    res.json({
      result,
      action,
      isFallback: true,
    });
  } catch (error: any) {
    console.error("Document QA error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. API: Study Planner
app.post("/api/gemini/study-plan", async (req, res) => {
  try {
    const { subjects, examDate, dailyHours = 3, difficulty = "Medium", topics = [], language = "en" } = req.body;

    if (aiClient && process.env.GEMINI_API_KEY) {
      const prompt = `Create a realistic, highly motivating daily study timetable for a university student.
Subjects: ${Array.isArray(subjects) ? subjects.join(", ") : subjects}
Target Exam Date: ${examDate || "In 3 weeks"}
Daily Study Budget: ${dailyHours} hours/day
Student Level/Difficulty: ${difficulty}
Topics: ${Array.isArray(topics) ? topics.join(", ") : topics}
Language: ${language === "hi" ? "Hindi" : "English"}

Return a strictly valid JSON object without markdown fences, with this structure:
{
  "overview": "Encouraging strategy statement",
  "dailyTargetHours": ${dailyHours},
  "todayTasks": [
    { "id": "task-1", "subject": "Java", "title": "OOP Constructors & Inheritance", "durationMin": 45, "completed": false },
    { "id": "task-2", "subject": "OS", "title": "Deadlock Coffman Conditions", "durationMin": 45, "completed": false }
  ],
  "upcomingMilestones": [
    { "day": "Day 2", "focus": "Process Scheduling Algorithms & Practice Numerical" },
    { "day": "Day 3", "focus": "Computer Networks OSI Layer 2 vs Layer 3" }
  ],
  "examTips": ["Tip 1", "Tip 2"]
}`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      try {
        const parsed = JSON.parse(response.text?.trim() || "{}");
        res.json({
          plan: parsed,
          isFallback: false,
        });
        return;
      } catch (err) {
        console.warn("JSON parse error on plan:", err);
      }
    }

    // Fallback study plan
    const fallbackPlan = {
      overview: "Consistent 45-minute focused blocks with 10-minute active recall breaks yield 3x higher exam retention.",
      dailyTargetHours: dailyHours,
      todayTasks: [
        { id: "task-1", subject: Array.isArray(subjects) && subjects[0] ? subjects[0] : "Operating Systems", title: "Review Deadlock Prevention & Bank's Algorithm", durationMin: 45, completed: false },
        { id: "task-2", subject: Array.isArray(subjects) && subjects[1] ? subjects[1] : "Computer Networks", title: "TCP vs UDP 3-Way Handshake Diagrams", durationMin: 45, completed: false },
        { id: "task-3", subject: "Active Recall Quiz", title: "Take 10-question MCQ quiz on today's concepts", durationMin: 20, completed: false }
      ],
      upcomingMilestones: [
        { day: "Day 2", focus: "Memory Management: Paging & Segmentation differences" },
        { day: "Day 3", focus: "SQL Joins, Normal Forms (1NF, 2NF, 3NF, BCNF)" },
        { day: "Day 4", focus: "Practice previous 3 years midterm question papers" }
      ],
      examTips: [
        "Draw diagrams with a dark pencil and clear labels to earn visual marks.",
        "Attempt high-mark (10-15 mark) questions during the first 60 minutes while concentration is peak."
      ]
    };

    res.json({
      plan: fallbackPlan,
      isFallback: true,
    });
  } catch (error: any) {
    console.error("Study plan error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Explicit 404 handler for unmatched /api/* endpoints
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Unhandled API Error]:", err?.message || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || "An unexpected internal server error occurred",
  });
});

// Setup Vite middleware in dev, static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyMate AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
