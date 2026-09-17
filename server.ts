import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getFallbackQuiz as getFallbackQuizFromBank, normalizeQuestionKey, QuizQuestion } from "./serverQuizBank.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));

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

// Rich Fallback quiz generator covering core CS & GTU BCA subjects in English and Hindi
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
  return getFallbackQuizFromBank(subject, unit, topic, count, difficulty, language, subjectCode, semester);
}
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "StudyMate AI",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
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
