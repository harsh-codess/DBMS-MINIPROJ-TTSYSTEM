-- ============================================================================
-- PanelGrid — Sample SQL Queries for Viva
-- ============================================================================
-- Paste these into the Neon SQL Editor (or psql) to demonstrate
-- the system's query capabilities. All queries use the existing views
-- defined in db/schema.sql.
-- ============================================================================


-- ============================================================================
-- Q1. Faculty Weekly Timetable (e.g. Shamala Devi — viva demo)
-- ============================================================================
-- Shows the complete weekly schedule for a specific faculty member,
-- ordered by day and time slot.

SELECT
    full_name                             AS "Faculty",
    duty_window                           AS "Duty Window",
    CASE weekday
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END                                   AS "Day",
    start_time::text                      AS "From",
    end_time::text                        AS "To",
    subject                               AS "Subject",
    kind                                  AS "Type",
    panel                                 AS "Panel",
    COALESCE(lab_batch, '—')              AS "Batch",
    room                                  AS "Room"
FROM v_faculty_timetable
WHERE full_name = 'Shamala Devi'
ORDER BY weekday, start_time;


-- ============================================================================
-- Q2. Panel Timetable (e.g. Panel G — student view)
-- ============================================================================
-- Shows the full weekly timetable for a panel, with lab batch info
-- for practical sessions.

SELECT
    panel                                 AS "Panel",
    COALESCE(lab_batch, '—')              AS "Batch",
    CASE weekday
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END                                   AS "Day",
    start_time::text                      AS "From",
    end_time::text                        AS "To",
    subject                               AS "Subject",
    kind                                  AS "Type",
    faculty                               AS "Teacher",
    room                                  AS "Room"
FROM v_panel_timetable
WHERE panel = 'G'
ORDER BY lab_batch NULLS FIRST, weekday, start_time;


-- ============================================================================
-- Q3. Room Occupancy (e.g. LAB-CS-1)
-- ============================================================================
-- Shows which classes occupy a specific room across the week.

SELECT
    room                                  AS "Room",
    kind                                  AS "Room Type",
    CASE weekday
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END                                   AS "Day",
    start_time::text                      AS "From",
    end_time::text                        AS "To",
    subject                               AS "Subject",
    faculty                               AS "Faculty",
    panel                                 AS "Panel"
FROM v_room_occupancy
WHERE room = 'LAB-CS-1'
ORDER BY weekday, start_time;


-- ============================================================================
-- Q4. Workload vs Scheduled — Theory & Practical Hours
-- ============================================================================
-- For each faculty: shows their assigned hours from teaching_assignments
-- versus the hours actually placed into timetable_entry.
-- Highlights unplaced gaps.

SELECT
    f.full_name                           AS "Faculty",
    dw.code                               AS "Duty Window",
    vl.assigned_theory_hours              AS "Assigned Theory",
    vl.assigned_practical_hours           AS "Assigned Practical",
    COUNT(CASE WHEN s.kind = 'theory'    THEN 1 END) AS "Placed Theory",
    COUNT(CASE WHEN s.kind = 'practical' THEN 1 END) AS "Placed Practical",
    vl.assigned_theory_hours
      - COUNT(CASE WHEN s.kind = 'theory' THEN 1 END) AS "Unplaced Theory",
    vl.assigned_practical_hours
      - COUNT(CASE WHEN s.kind = 'practical' THEN 1 END) AS "Unplaced Practical"
FROM faculty f
JOIN duty_window dw ON dw.id = f.duty_window_id
JOIN v_faculty_load vl ON vl.faculty_id = f.id
LEFT JOIN timetable_entry te ON te.faculty_id = f.id
LEFT JOIN teaching_assignment ta ON ta.id = te.assignment_id
LEFT JOIN subject s ON s.id = ta.subject_id
GROUP BY f.id, f.full_name, dw.code,
         vl.assigned_theory_hours, vl.assigned_practical_hours
ORDER BY f.full_name;


-- ============================================================================
-- Q5. Clash Detection — Faculty Double-Booking Check
-- ============================================================================
-- If the system is working correctly, this query returns ZERO rows.
-- Any rows indicate a faculty member is double-booked in a period.

SELECT
    f.full_name                           AS "Faculty",
    per.weekday                           AS "Weekday",
    per.start_time::text                  AS "Period Start",
    COUNT(*)                              AS "Entries (should be 1)"
FROM timetable_entry te
JOIN faculty f ON f.id = te.faculty_id
JOIN period per ON per.id = te.period_id
GROUP BY f.full_name, per.weekday, per.start_time
HAVING COUNT(*) > 1
ORDER BY f.full_name, per.weekday, per.start_time;


-- ============================================================================
-- Q6. Clash Detection — Room Double-Booking Check
-- ============================================================================
-- If the system is working correctly, this query returns ZERO rows.
-- Any rows indicate a room is double-booked in a period.

SELECT
    r.code                                AS "Room",
    per.weekday                           AS "Weekday",
    per.start_time::text                  AS "Period Start",
    COUNT(*)                              AS "Entries (should be 1)"
FROM timetable_entry te
JOIN room r ON r.id = te.room_id
JOIN period per ON per.id = te.period_id
GROUP BY r.code, per.weekday, per.start_time
HAVING COUNT(*) > 1
ORDER BY r.code, per.weekday, per.start_time;


-- ============================================================================
-- Q7. Clash Detection — Panel Theory Double-Booking Check
-- ============================================================================
-- Ensures no panel has two theory lectures in the same period.
-- Returns ZERO rows if no clashes.

SELECT
    pan.code                              AS "Panel",
    per.weekday                           AS "Weekday",
    per.start_time::text                  AS "Period Start",
    COUNT(*)                              AS "Theory Entries (should be 1)"
FROM timetable_entry te
JOIN panel pan ON pan.id = te.panel_id
JOIN period per ON per.id = te.period_id
WHERE te.lab_batch_id IS NULL
GROUP BY pan.code, per.weekday, per.start_time
HAVING COUNT(*) > 1;


-- ============================================================================
-- Q8. Dashboard Statistics
-- ============================================================================
-- Quick summary of the entire system state.

SELECT
    (SELECT COUNT(*) FROM faculty)              AS "Total Faculty",
    (SELECT COUNT(*) FROM room)                 AS "Total Rooms",
    (SELECT COUNT(*) FROM subject)              AS "Total Subjects",
    (SELECT COUNT(*) FROM panel)                AS "Total Panels",
    (SELECT COUNT(*) FROM teaching_assignment)  AS "Total Assignments",
    (SELECT COUNT(*) FROM timetable_entry)      AS "Placed Entries",
    (SELECT COALESCE(SUM(weekly_hours), 0)
       FROM teaching_assignment)                AS "Total Assigned Hours";


-- ============================================================================
-- Q9. All Duty Windows with Faculty Count
-- ============================================================================
-- Shows how many faculty belong to each duty window.

SELECT
    dw.code                               AS "Duty Window",
    dw.starts_at::text                    AS "Start",
    dw.ends_at::text                      AS "End",
    COUNT(f.id)                           AS "Faculty Count"
FROM duty_window dw
LEFT JOIN faculty f ON f.duty_window_id = dw.id
GROUP BY dw.id, dw.code, dw.starts_at, dw.ends_at
ORDER BY dw.starts_at;


-- ============================================================================
-- Q10. Subjects with Assignment Count per Panel
-- ============================================================================
-- How many hours of each subject are assigned to each panel.

SELECT
    s.code                                AS "Subject",
    s.name                                AS "Subject Name",
    s.kind                                AS "Type",
    p.code                                AS "Panel",
    COALESCE(lb.code, '—')               AS "Batch",
    ta.weekly_hours                       AS "Weekly Hours",
    f.full_name                           AS "Assigned Faculty"
FROM teaching_assignment ta
JOIN subject s ON s.id = ta.subject_id
JOIN panel p ON p.id = ta.panel_id
JOIN faculty f ON f.id = ta.faculty_id
LEFT JOIN lab_batch lb ON lb.id = ta.lab_batch_id
ORDER BY s.code, p.code, lb.code NULLS FIRST;


-- ============================================================================
-- Q11. Room Utilization Rate
-- ============================================================================
-- For each room, how many periods are occupied vs total available
-- teachable periods across the week.

SELECT
    r.code                                AS "Room",
    r.kind                                AS "Type",
    r.capacity                            AS "Capacity",
    COUNT(te.id)                          AS "Occupied Periods",
    (SELECT COUNT(*) FROM period
     WHERE kind = 'teachable')            AS "Total Teachable Periods",
    ROUND(
        COUNT(te.id)::numeric /
        NULLIF((SELECT COUNT(*) FROM period WHERE kind = 'teachable'), 0) * 100,
        1
    )                                     AS "Utilization %"
FROM room r
LEFT JOIN timetable_entry te ON te.room_id = r.id
GROUP BY r.id, r.code, r.kind, r.capacity
ORDER BY "Utilization %" DESC NULLS LAST;


-- ============================================================================
-- Q12. Faculty Teaching Breakdown (Subjects & Panels)
-- ============================================================================
-- What each faculty member teaches, to which panel, and how many hours.

SELECT
    f.full_name                           AS "Faculty",
    dw.code                               AS "Duty Window",
    s.code                                AS "Subject",
    s.kind                                AS "Type",
    p.code                                AS "Panel",
    COALESCE(lb.code, '—')               AS "Batch",
    ta.weekly_hours                       AS "Hours/Week"
FROM teaching_assignment ta
JOIN faculty f ON f.id = ta.faculty_id
JOIN duty_window dw ON dw.id = f.duty_window_id
JOIN subject s ON s.id = ta.subject_id
JOIN panel p ON p.id = ta.panel_id
LEFT JOIN lab_batch lb ON lb.id = ta.lab_batch_id
ORDER BY f.full_name, s.code;
