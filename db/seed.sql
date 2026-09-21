-- Seed: CSE Sem 5, Shamala / Ramesh / Neha, panels G F H
-- Hours are per week. Shamala: 4h theory + 8h practical.

INSERT INTO duty_window (code, starts_at, ends_at) VALUES
  ('08-15', '08:00', '15:00'),
  ('09-16', '09:00', '16:00'),
  ('10-17', '10:00', '17:00');

INSERT INTO branch (code, name) VALUES
  ('CSE', 'Computer Science and Engineering');

INSERT INTO semester (branch_id, number)
SELECT id, 5 FROM branch WHERE code = 'CSE';

INSERT INTO panel (semester_id, code)
SELECT s.id, p.code
FROM semester s
JOIN branch b ON b.id = s.branch_id
CROSS JOIN (VALUES ('G'), ('F'), ('H')) AS p(code)
WHERE b.code = 'CSE' AND s.number = 5;

INSERT INTO lab_batch (panel_id, code)
SELECT p.id, p.code || n.n
FROM panel p
CROSS JOIN (VALUES ('1'), ('2')) AS n(n);

INSERT INTO faculty (full_name, duty_window_id, max_theory_hours, max_practical_hours) VALUES
  ('Shamala Patil',  (SELECT id FROM duty_window WHERE code = '09-16'), 4, 8),
  ('Ramesh Kulkarni', (SELECT id FROM duty_window WHERE code = '08-15'), 4, 8),
  ('Neha Joshi',      (SELECT id FROM duty_window WHERE code = '10-17'), 4, 8);

INSERT INTO subject (code, name, kind) VALUES
  ('DBMS',    'Database Management Systems', 'theory'),
  ('DSA-LAB', 'Data Structures Lab',         'practical'),
  ('OS',      'Operating Systems',           'theory'),
  ('OS-LAB',  'Operating Systems Lab',       'practical'),
  ('CN',      'Computer Networks',           'theory'),
  ('CN-LAB',  'Computer Networks Lab',       'practical');

INSERT INTO room (code, kind, lab_type, capacity) VALUES
  ('R-204', 'classroom', NULL,          60),
  ('R-201', 'classroom', NULL,          60),
  ('Lab-2', 'lab',       'programming', 30),
  ('Lab-1', 'lab',       'programming', 30);

-- Shamala: DBMS 2+1+1 theory, DSA lab 2h × 4 batches = 8 practical
INSERT INTO teaching_assignment (faculty_id, subject_id, panel_id, lab_batch_id, weekly_hours)
SELECT f.id, s.id, p.id, NULL, v.hours
FROM faculty f
JOIN subject s ON s.code = 'DBMS'
JOIN (
  SELECT 'G'::text AS panel, 2.0 AS hours
  UNION ALL SELECT 'F', 1.0
  UNION ALL SELECT 'H', 1.0
) v ON TRUE
JOIN panel p ON p.code = v.panel
WHERE f.full_name = 'Shamala Patil';

INSERT INTO teaching_assignment (faculty_id, subject_id, panel_id, lab_batch_id, weekly_hours)
SELECT f.id, s.id, lb.panel_id, lb.id, 2.0
FROM faculty f
JOIN subject s ON s.code = 'DSA-LAB'
JOIN lab_batch lb ON lb.code IN ('G1', 'G2', 'F1', 'H1')
WHERE f.full_name = 'Shamala Patil';

INSERT INTO teaching_assignment (faculty_id, subject_id, panel_id, lab_batch_id, weekly_hours)
SELECT f.id, s.id, p.id, NULL, v.hours
FROM faculty f
JOIN subject s ON s.code = 'OS'
JOIN (
  SELECT 'G'::text AS panel, 2.0 AS hours
  UNION ALL SELECT 'H', 2.0
) v ON TRUE
JOIN panel p ON p.code = v.panel
WHERE f.full_name = 'Ramesh Kulkarni';

INSERT INTO teaching_assignment (faculty_id, subject_id, panel_id, lab_batch_id, weekly_hours)
SELECT f.id, s.id, lb.panel_id, lb.id, 2.0
FROM faculty f
JOIN subject s ON s.code = 'OS-LAB'
JOIN lab_batch lb ON lb.code IN ('G1', 'G2', 'H1', 'H2')
WHERE f.full_name = 'Ramesh Kulkarni';

INSERT INTO teaching_assignment (faculty_id, subject_id, panel_id, lab_batch_id, weekly_hours)
SELECT f.id, s.id, p.id, NULL, 4.0
FROM faculty f
JOIN subject s ON s.code = 'CN'
JOIN panel p ON p.code = 'F'
WHERE f.full_name = 'Neha Joshi';

INSERT INTO teaching_assignment (faculty_id, subject_id, panel_id, lab_batch_id, weekly_hours)
SELECT f.id, s.id, lb.panel_id, lb.id, 4.0
FROM faculty f
JOIN subject s ON s.code = 'CN-LAB'
JOIN lab_batch lb ON lb.code IN ('F1', 'F2')
WHERE f.full_name = 'Neha Joshi';

-- Mon–Sat (1–6), 08:00–17:00, lunch 12:00–13:00
INSERT INTO period (weekday, start_time, end_time, kind)
SELECT d.weekday, t.start_time, t.end_time, t.kind
FROM generate_series(1, 6) AS d(weekday)
CROSS JOIN (
  VALUES
    ('08:00'::time, '09:00'::time, 'teachable'),
    ('09:00'::time, '10:00'::time, 'teachable'),
    ('10:00'::time, '11:00'::time, 'teachable'),
    ('11:00'::time, '12:00'::time, 'teachable'),
    ('12:00'::time, '13:00'::time, 'lunch'),
    ('13:00'::time, '14:00'::time, 'teachable'),
    ('14:00'::time, '15:00'::time, 'teachable'),
    ('15:00'::time, '16:00'::time, 'teachable'),
    ('16:00'::time, '17:00'::time, 'teachable')
) AS t(start_time, end_time, kind);
