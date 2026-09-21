-- PanelGrid schema (PostgreSQL / Neon)
--
-- ER (for the viva):
--   branch 1--* semester 1--* panel 1--* lab_batch
--   duty_window 1--* faculty 1--* teaching_assignment
--   subject 1--* teaching_assignment *--1 panel
--   teaching_assignment *--0..1 lab_batch
--   room 1--* timetable_entry *--1 period
--   teaching_assignment 1--* timetable_entry
--
-- timetable_entry is the generated week. Unique indexes stop
-- a faculty, room, whole panel, or lab batch from double-booking a period.

CREATE TABLE duty_window (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  starts_at   TIME NOT NULL,
  ends_at     TIME NOT NULL,
  CHECK (ends_at > starts_at)
);

CREATE TABLE branch (
  id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

CREATE TABLE semester (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id  INTEGER NOT NULL REFERENCES branch (id),
  number     SMALLINT NOT NULL CHECK (number BETWEEN 1 AND 8),
  UNIQUE (branch_id, number)
);

CREATE TABLE panel (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  semester_id  INTEGER NOT NULL REFERENCES semester (id),
  code         TEXT NOT NULL,
  UNIQUE (semester_id, code)
);

CREATE TABLE lab_batch (
  id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  panel_id  INTEGER NOT NULL REFERENCES panel (id),
  code      TEXT NOT NULL,
  UNIQUE (panel_id, code)
);

CREATE TABLE faculty (
  id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name            TEXT NOT NULL,
  duty_window_id       INTEGER NOT NULL REFERENCES duty_window (id),
  max_theory_hours     NUMERIC(4, 1) NOT NULL CHECK (max_theory_hours >= 0),
  max_practical_hours  NUMERIC(4, 1) NOT NULL CHECK (max_practical_hours >= 0)
);

CREATE TABLE subject (
  id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  kind  TEXT NOT NULL CHECK (kind IN ('theory', 'practical'))
);

CREATE TABLE room (
  id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code      TEXT NOT NULL UNIQUE,
  kind      TEXT NOT NULL CHECK (kind IN ('classroom', 'lab')),
  lab_type  TEXT,
  capacity  INTEGER NOT NULL CHECK (capacity > 0),
  CHECK (
    (kind = 'classroom' AND lab_type IS NULL)
    OR (kind = 'lab' AND lab_type IS NOT NULL)
  )
);

CREATE TABLE teaching_assignment (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  faculty_id    INTEGER NOT NULL REFERENCES faculty (id),
  subject_id    INTEGER NOT NULL REFERENCES subject (id),
  panel_id      INTEGER NOT NULL REFERENCES panel (id),
  lab_batch_id  INTEGER REFERENCES lab_batch (id),
  weekly_hours  NUMERIC(4, 1) NOT NULL CHECK (weekly_hours > 0)
);

CREATE INDEX teaching_assignment_faculty_idx ON teaching_assignment (faculty_id);
CREATE INDEX teaching_assignment_panel_idx ON teaching_assignment (panel_id);

CREATE TABLE period (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  weekday     SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 6),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('teachable', 'lunch')),
  CHECK (end_time > start_time),
  UNIQUE (weekday, start_time)
);

CREATE TABLE timetable_entry (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assignment_id  INTEGER NOT NULL REFERENCES teaching_assignment (id),
  faculty_id     INTEGER NOT NULL REFERENCES faculty (id),
  panel_id       INTEGER NOT NULL REFERENCES panel (id),
  lab_batch_id   INTEGER REFERENCES lab_batch (id),
  room_id        INTEGER NOT NULL REFERENCES room (id),
  period_id      INTEGER NOT NULL REFERENCES period (id),
  session_id     UUID,
  UNIQUE (faculty_id, period_id),
  UNIQUE (room_id, period_id)
);

CREATE UNIQUE INDEX timetable_panel_period_uidx
  ON timetable_entry (panel_id, period_id)
  WHERE lab_batch_id IS NULL;

CREATE UNIQUE INDEX timetable_batch_period_uidx
  ON timetable_entry (lab_batch_id, period_id)
  WHERE lab_batch_id IS NOT NULL;

CREATE INDEX timetable_entry_period_idx ON timetable_entry (period_id);

CREATE VIEW v_faculty_load AS
SELECT
  f.id AS faculty_id,
  f.full_name,
  f.max_theory_hours,
  f.max_practical_hours,
  COALESCE(SUM(CASE WHEN s.kind = 'theory' THEN ta.weekly_hours END), 0) AS assigned_theory_hours,
  COALESCE(SUM(CASE WHEN s.kind = 'practical' THEN ta.weekly_hours END), 0) AS assigned_practical_hours
FROM faculty f
LEFT JOIN teaching_assignment ta ON ta.faculty_id = f.id
LEFT JOIN subject s ON s.id = ta.subject_id
GROUP BY f.id, f.full_name, f.max_theory_hours, f.max_practical_hours;

CREATE VIEW v_faculty_timetable AS
SELECT
  f.full_name,
  dw.code AS duty_window,
  p.weekday,
  p.start_time,
  p.end_time,
  sub.code AS subject,
  sub.kind,
  pan.code AS panel,
  lb.code AS lab_batch,
  r.code AS room
FROM timetable_entry te
JOIN faculty f ON f.id = te.faculty_id
JOIN duty_window dw ON dw.id = f.duty_window_id
JOIN period p ON p.id = te.period_id
JOIN teaching_assignment ta ON ta.id = te.assignment_id
JOIN subject sub ON sub.id = ta.subject_id
JOIN panel pan ON pan.id = te.panel_id
LEFT JOIN lab_batch lb ON lb.id = te.lab_batch_id
JOIN room r ON r.id = te.room_id;

CREATE VIEW v_panel_timetable AS
SELECT
  pan.code AS panel,
  lb.code AS lab_batch,
  p.weekday,
  p.start_time,
  p.end_time,
  sub.code AS subject,
  sub.kind,
  f.full_name AS faculty,
  r.code AS room
FROM timetable_entry te
JOIN panel pan ON pan.id = te.panel_id
LEFT JOIN lab_batch lb ON lb.id = te.lab_batch_id
JOIN period p ON p.id = te.period_id
JOIN teaching_assignment ta ON ta.id = te.assignment_id
JOIN subject sub ON sub.id = ta.subject_id
JOIN faculty f ON f.id = te.faculty_id
JOIN room r ON r.id = te.room_id;

CREATE VIEW v_room_occupancy AS
SELECT
  r.code AS room,
  r.kind,
  p.weekday,
  p.start_time,
  p.end_time,
  f.full_name AS faculty,
  pan.code AS panel,
  sub.code AS subject
FROM timetable_entry te
JOIN room r ON r.id = te.room_id
JOIN period p ON p.id = te.period_id
JOIN faculty f ON f.id = te.faculty_id
JOIN panel pan ON pan.id = te.panel_id
JOIN teaching_assignment ta ON ta.id = te.assignment_id
JOIN subject sub ON sub.id = ta.subject_id;
