/**
 * PHASE 1.1 & PHASE 2 — AUTHORITATIVE SQLITE RELATIONAL SCHEMA CONTRACT
 * Project: StudentMate-AI — AI-Powered Personalized Academic Learning Platform
 */

export const PHASE_1_1_SCHEMA_VERSION = "001_phase1_1_canonical_schema";

export const PHASE_1_1_SCHEMA_SQL = `
-- ============================================================================
-- 0. SCHEMA MIGRATIONS & QUARANTINE AUDIT TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quarantined_legacy_records (
  id TEXT PRIMARY KEY,
  source_table TEXT NOT NULL,
  legacy_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  quarantined_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 1. USERS, SESSIONS & PASSWORD RESET TOKENS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  semester INTEGER NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 6),
  branch TEXT NOT NULL DEFAULT 'BCA',
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak INTEGER NOT NULL DEFAULT 1 CHECK (streak >= 0),
  last_active_date TEXT,
  weak_topics_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(weak_topics_json)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 2. CANONICAL ACADEMIC HIERARCHY (SEMESTERS -> SUBJECTS -> UNITS -> TOPICS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS semesters (
  id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 6),
  number INTEGER NOT NULL UNIQUE CHECK (number BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  category TEXT NOT NULL DEFAULT 'Core',
  credits INTEGER NOT NULL DEFAULT 4 CHECK (credits >= 1),
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (id, semester_id)
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_number INTEGER NOT NULL CHECK (unit_number >= 1),
  title TEXT NOT NULL,
  description TEXT,
  weightage TEXT,
  order_index INTEGER NOT NULL DEFAULT 1 CHECK (order_index >= 1),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (subject_id, unit_number),
  UNIQUE (id, subject_id)
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  important_marks_json TEXT CHECK (important_marks_json IS NULL OR json_valid(important_marks_json)),
  order_index INTEGER NOT NULL DEFAULT 1 CHECK (order_index >= 1),
  estimated_minutes INTEGER NOT NULL DEFAULT 30 CHECK (estimated_minutes >= 5),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (unit_id, order_index),
  UNIQUE (id, unit_id, subject_id),
  FOREIGN KEY (unit_id, subject_id) REFERENCES units(id, subject_id) ON DELETE RESTRICT
);

-- ============================================================================
-- 3. STUDY MATERIALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_materials (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL CHECK (material_type IN ('notes', 'summary', 'formula_sheet', 'cheatsheet', 'reference_link', 'question_bank')),
  summary TEXT,
  content_markdown TEXT,
  file_url TEXT,
  external_url TEXT,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  verified INTEGER NOT NULL DEFAULT 1 CHECK (verified IN (0, 1)),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 4. PREVIOUS YEAR EXAMINATION PAPERS (4-STATE MODEL) & PAPER QUESTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  subject_code_snapshot TEXT NOT NULL,
  subject_name_snapshot TEXT NOT NULL,
  exam_year INTEGER NOT NULL CHECK (exam_year BETWEEN 2015 AND 2035),
  exam_session TEXT NOT NULL CHECK (exam_session IN ('Summer', 'Winter')),
  title TEXT NOT NULL,
  availability_status TEXT NOT NULL DEFAULT 'unavailable'
    CHECK (availability_status IN ('available', 'unavailable', 'pending_verification', 'archived')),
  source_type TEXT NOT NULL DEFAULT 'none'
    CHECK (source_type IN ('local', 'remote', 'generated_structured', 'none')),
  file_url TEXT,
  external_url TEXT,
  file_name TEXT,
  file_size TEXT,
  total_pages INTEGER CHECK (total_pages IS NULL OR total_pages >= 1),
  total_marks INTEGER NOT NULL DEFAULT 70 CHECK (total_marks > 0),
  duration_minutes INTEGER NOT NULL DEFAULT 150 CHECK (duration_minutes > 0),
  instructions_json TEXT CHECK (instructions_json IS NULL OR json_valid(instructions_json)),
  exam_date TEXT,
  exam_time TEXT,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (subject_id, exam_year, exam_session),
  FOREIGN KEY (subject_id, semester_id) REFERENCES subjects(id, semester_id) ON DELETE RESTRICT,
  CHECK (
    (availability_status = 'available' AND verified = 1 AND published = 1 AND (file_url IS NOT NULL OR external_url IS NOT NULL))
    OR
    (availability_status IN ('unavailable', 'pending_verification', 'archived') AND NOT (published = 1 AND verified = 1))
  )
);

CREATE TABLE IF NOT EXISTS paper_questions (
  id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  section_number INTEGER NOT NULL CHECK (section_number >= 1),
  section_title TEXT NOT NULL,
  question_number TEXT NOT NULL,
  sub_question_label TEXT,
  choice_group_label TEXT,
  is_alternative INTEGER NOT NULL DEFAULT 0 CHECK (is_alternative IN (0, 1)),
  question_text TEXT NOT NULL,
  marks INTEGER NOT NULL CHECK (marks > 0),
  frequency_count INTEGER NOT NULL DEFAULT 1 CHECK (frequency_count >= 1),
  display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order >= 1),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (paper_id, display_order)
);

-- ============================================================================
-- 5. MCQ QUESTION BANK (SOFT DELETE + DETERMINISTIC HASH DEDUPLICATION)
-- ============================================================================
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  options_json TEXT NOT NULL CHECK (json_valid(options_json) AND json_array_length(options_json) = 4),
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  marks INTEGER NOT NULL DEFAULT 1 CHECK (marks >= 1),
  source TEXT NOT NULL CHECK (source IN ('seed', 'admin', 'ai', 'pyq')),
  ai_generated INTEGER NOT NULL DEFAULT 0 CHECK (ai_generated IN (0, 1)),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (subject_id, question_hash)
);

-- ============================================================================
-- 6. QUIZZES, QUIZ_QUESTIONS JOIN TABLE & HISTORICAL QUIZ ATTEMPTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  quiz_type TEXT NOT NULL DEFAULT 'practice' CHECK (quiz_type IN ('practice', 'subject_mastery', 'unit_test', 'ai_adaptive', 'mock_exam')),
  subject_id TEXT REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  total_questions INTEGER NOT NULL CHECK (total_questions >= 1),
  total_marks INTEGER NOT NULL CHECK (total_marks >= 1),
  time_limit_minutes INTEGER NOT NULL DEFAULT 15 CHECK (time_limit_minutes >= 1),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_published INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  display_order INTEGER NOT NULL CHECK (display_order >= 1),
  marks INTEGER NOT NULL DEFAULT 1 CHECK (marks >= 1),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (quiz_id, question_id),
  UNIQUE (quiz_id, display_order)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT REFERENCES quizzes(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total > 0 AND score <= total),
  accuracy_percent REAL NOT NULL CHECK (accuracy_percent BETWEEN 0 AND 100),
  time_taken_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_taken_seconds >= 0),
  xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  question_text_snapshot TEXT NOT NULL,
  options_snapshot_json TEXT NOT NULL CHECK (json_valid(options_snapshot_json) AND json_array_length(options_snapshot_json) = 4),
  correct_index_snapshot INTEGER NOT NULL CHECK (correct_index_snapshot BETWEEN 0 AND 3),
  explanation_snapshot TEXT,
  selected_index INTEGER CHECK (selected_index IS NULL OR (selected_index BETWEEN 0 AND 3)),
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (attempt_id, question_id)
);

-- ============================================================================
-- 7. STUDENT PROGRESS, WEAK TOPICS, STUDY PLANS, SAVED ITEMS & RECOMMENDATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
  mastery_score REAL NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'mastered', 'needs_revision')),
  is_weak_topic INTEGER NOT NULL DEFAULT 0 CHECK (is_weak_topic IN (0, 1)),
  weakness_score REAL NOT NULL DEFAULT 0 CHECK (weakness_score BETWEEN 0 AND 100),
  quiz_attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (quiz_attempts_count >= 0),
  correct_answers_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers_count >= 0),
  total_answers_count INTEGER NOT NULL DEFAULT 0 CHECK (total_answers_count >= 0),
  ai_queries_count INTEGER NOT NULL DEFAULT 0 CHECK (ai_queries_count >= 0),
  last_studied_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, topic_id),
  FOREIGN KEY (topic_id, unit_id, subject_id) REFERENCES topics(id, unit_id, subject_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS study_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  target_exam_date TEXT,
  daily_hours REAL NOT NULL DEFAULT 2.0 CHECK (daily_hours > 0 AND daily_hours <= 16),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  generated_by TEXT NOT NULL DEFAULT 'ai' CHECK (generated_by IN ('ai', 'manual', 'system')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS study_plan_items (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'revision' CHECK (item_type IN ('revision', 'practice_quiz', 'pyq_solve', 'weak_topic_review', 'reading')),
  scheduled_date TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 45 CHECK (duration_minutes > 0),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  completed_at TEXT,
  order_index INTEGER NOT NULL DEFAULT 1 CHECK (order_index >= 1),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('note', 'ai_answer', 'paper_question', 'study_material', 'quiz_question', 'flashcard_deck')),
  target_id TEXT NOT NULL,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL CHECK (json_valid(content_json)),
  tags_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags_json)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, item_type, target_id)
);

CREATE TABLE IF NOT EXISTS user_recommendations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  rec_type TEXT NOT NULL CHECK (rec_type IN ('weak_topic_remediation', 'next_topic', 'pyq_practice', 'revision_due', 'quiz_challenge')),
  priority INTEGER NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  reason TEXT NOT NULL,
  action_label TEXT NOT NULL,
  action_target_json TEXT NOT NULL CHECK (json_valid(action_target_json)),
  is_dismissed INTEGER NOT NULL DEFAULT 0 CHECK (is_dismissed IN (0, 1)),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 8. AI CONVERSATIONS, MESSAGES, RAG DOCUMENTS & CITATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'tutor' CHECK (mode IN ('tutor', 'exam_prep', 'concept_breakdown', 'code_mentor', 'rag_qa')),
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  grounding_mode TEXT NOT NULL DEFAULT 'syllabus_grounded' CHECK (grounding_mode IN ('syllabus_grounded', 'rag_grounded', 'general')),
  tokens_estimate INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('syllabus', 'textbook_chapter', 'lecture_notes', 'gtu_paper', 'reference_guide')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL UNIQUE,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes >= 0),
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  page_count INTEGER CHECK (page_count IS NULL OR page_count >= 1),
  chunk_count INTEGER NOT NULL DEFAULT 0 CHECK (chunk_count >= 0),
  indexing_status TEXT NOT NULL DEFAULT 'pending' CHECK (indexing_status IN ('pending', 'processing', 'indexed', 'failed')),
  indexing_error TEXT,
  vector_collection TEXT NOT NULL DEFAULT 'studymate_academic_chunks',
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_official INTEGER NOT NULL DEFAULT 1 CHECK (is_official IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subject_id, semester_id) REFERENCES subjects(id, semester_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS document_chunks_metadata (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  page_number INTEGER CHECK (page_number IS NULL OR page_number >= 1),
  section_heading TEXT,
  token_count INTEGER NOT NULL CHECK (token_count > 0),
  char_start INTEGER NOT NULL CHECK (char_start >= 0),
  char_end INTEGER NOT NULL CHECK (char_end >= char_start),
  chunk_hash TEXT NOT NULL,
  embedding_id TEXT NOT NULL UNIQUE,
  preview_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS ai_message_citations (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  chunk_metadata_id TEXT REFERENCES document_chunks_metadata(id) ON DELETE SET NULL,
  paper_id TEXT REFERENCES papers(id) ON DELETE SET NULL,
  citation_label TEXT NOT NULL,
  relevance_score REAL CHECK (relevance_score IS NULL OR (relevance_score BETWEEN 0 AND 1)),
  excerpt TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 9. HIERARCHY INTEGRITY TRIGGERS (PREVENT CROSS-SUBJECT / UNIT / TOPIC DRIFT)
-- ============================================================================

-- 9.1 questions hierarchy validation
CREATE TRIGGER IF NOT EXISTS trg_questions_hierarchy_ins
BEFORE INSERT ON questions
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in questions: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    )
    THEN RAISE(ABORT, 'Hierarchy violation in questions: topic_id does not belong to unit_id/subject_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_questions_hierarchy_upd
BEFORE UPDATE ON questions
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.subject_id != OLD.subject_id
    THEN RAISE(ABORT, 'Immutable hierarchy violation: question subject_id cannot be changed after creation')
  END;
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in questions: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    )
    THEN RAISE(ABORT, 'Hierarchy violation in questions: topic_id does not belong to unit_id/subject_id')
  END;
END;

-- 9.2 paper_questions hierarchy validation (must match parent paper's subject_id)
CREATE TRIGGER IF NOT EXISTS trg_paper_questions_hierarchy_ins
BEFORE INSERT ON paper_questions
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM papers WHERE id = NEW.paper_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in paper_questions: subject_id does not match parent paper subject_id')
  END;
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in paper_questions: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    )
    THEN RAISE(ABORT, 'Hierarchy violation in paper_questions: topic_id does not belong to unit_id/subject_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_paper_questions_hierarchy_upd
BEFORE UPDATE ON paper_questions
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.subject_id != OLD.subject_id
    THEN RAISE(ABORT, 'Immutable hierarchy violation: paper_question subject_id cannot be changed after creation')
  END;
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM papers WHERE id = NEW.paper_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in paper_questions: subject_id does not match parent paper subject_id')
  END;
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in paper_questions: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    )
    THEN RAISE(ABORT, 'Hierarchy violation in paper_questions: topic_id does not belong to unit_id/subject_id')
  END;
END;

-- 9.3 study_materials hierarchy validation
CREATE TRIGGER IF NOT EXISTS trg_study_materials_hierarchy_ins
BEFORE INSERT ON study_materials
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in study_materials: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    )
    THEN RAISE(ABORT, 'Hierarchy violation in study_materials: topic_id does not belong to unit_id/subject_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_study_materials_hierarchy_upd
BEFORE UPDATE ON study_materials
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in study_materials: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    )
    THEN RAISE(ABORT, 'Hierarchy violation in study_materials: topic_id does not belong to unit_id/subject_id')
  END;
END;

-- 9.4 quizzes & quiz_questions hierarchy validation (prevent cross-subject quiz contamination)
CREATE TRIGGER IF NOT EXISTS trg_quizzes_hierarchy_ins
BEFORE INSERT ON quizzes
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND (NEW.subject_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    ))
    THEN RAISE(ABORT, 'Hierarchy violation in quizzes: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND (NEW.subject_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    ))
    THEN RAISE(ABORT, 'Hierarchy violation in quizzes: topic_id does not belong to unit_id/subject_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_quiz_questions_subject_match_ins
BEFORE INSERT ON quiz_questions
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM quizzes qz
      JOIN questions q ON q.id = NEW.question_id
      WHERE qz.id = NEW.quiz_id
        AND qz.subject_id IS NOT NULL
        AND q.subject_id != qz.subject_id
    )
    THEN RAISE(ABORT, 'Cross-subject contamination blocked: question subject_id does not match quiz subject_id')
  END;
END;

-- 9.5 documents & document_chunks_metadata hierarchy validation
CREATE TRIGGER IF NOT EXISTS trg_documents_hierarchy_ins
BEFORE INSERT ON documents
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in documents: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    )
    THEN RAISE(ABORT, 'Hierarchy violation in documents: topic_id does not belong to unit_id/subject_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_doc_chunks_hierarchy_ins
BEFORE INSERT ON document_chunks_metadata
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM documents WHERE id = NEW.document_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in document_chunks_metadata: subject_id does not match parent document')
  END;
  SELECT CASE
    WHEN NEW.unit_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM units WHERE id = NEW.unit_id AND subject_id = NEW.subject_id
    )
    THEN RAISE(ABORT, 'Hierarchy violation in document_chunks_metadata: unit_id does not belong to subject_id')
  END;
  SELECT CASE
    WHEN NEW.topic_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM topics
      WHERE id = NEW.topic_id
        AND subject_id = NEW.subject_id
        AND (NEW.unit_id IS NULL OR unit_id = NEW.unit_id)
    )
    THEN RAISE(ABORT, 'Hierarchy violation in document_chunks_metadata: topic_id does not belong to unit_id/subject_id')
  END;
END;

-- ============================================================================
-- 10. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_topics_unit ON topics(unit_id, order_index);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);

CREATE INDEX IF NOT EXISTS idx_study_materials_hierarchy ON study_materials(subject_id, unit_id, topic_id);

CREATE INDEX IF NOT EXISTS idx_papers_semester_subject ON papers(semester_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_papers_availability ON papers(availability_status, published, verified);
CREATE INDEX IF NOT EXISTS idx_paper_questions_paper ON paper_questions(paper_id, display_order);
CREATE INDEX IF NOT EXISTS idx_paper_questions_subject_unit ON paper_questions(subject_id, unit_id, topic_id);

CREATE INDEX IF NOT EXISTS idx_questions_active_pool ON questions(subject_id, unit_id, topic_id, language, difficulty, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source, is_active);

CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject_id, is_published);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, display_order);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_question ON quiz_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_subject ON quiz_attempts(subject_id, user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt ON quiz_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_question ON quiz_attempt_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user_weak ON user_topic_progress(user_id, is_weak_topic, weakness_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_subject ON user_topic_progress(user_id, subject_id);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_study_plan_items_plan ON study_plan_items(plan_id, order_index);
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id, item_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user ON user_recommendations(user_id, is_dismissed, priority DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject_id, indexing_status, is_active);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc ON document_chunks_metadata(document_id, chunk_index);
`;
