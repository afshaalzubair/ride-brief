-- One row per fatal crash that involved an in-transport motorcycle,
-- and one row per motorcyclist who died in such a crash.

CREATE OR REPLACE TABLE fact_motorcycle_crash AS
WITH motorcycle_cases AS (
    SELECT DISTINCT st_case
    FROM stg_vehicle
    WHERE body_typ BETWEEN 80 AND 89
)
SELECT
    a.st_case,
    a.state_code,
    a.month,
    a.day,
    a.day_week,
    a.hour,
    a.ve_forms,
    a.lgt_cond,
    a.year
FROM stg_accident AS a
INNER JOIN motorcycle_cases AS m
    ON a.st_case = m.st_case;

CREATE OR REPLACE TABLE fact_motorcyclist_death AS
WITH riders AS (
    SELECT
        p.st_case,
        p.veh_no,
        p.per_no,
        a.state_code,
        a.month,
        a.day_week,
        a.hour,
        a.ve_forms,
        p.per_typ,
        p.body_typ,
        p.age,
        p.sex,
        p.helm_use,
        p.helm_mis,
        p.drinking,
        p.alc_res,
        p.alc_status
    FROM stg_person AS p
    INNER JOIN stg_accident AS a
        ON p.st_case = a.st_case
    WHERE p.inj_sev = 4
      AND p.per_typ IN (1, 2)
      AND p.body_typ BETWEEN 80 AND 89
)
SELECT
    r.st_case,
    r.veh_no,
    r.per_no,
    r.state_code,
    s.state_name,
    s.state_postal,
    r.month,
    mo.month_name,
    r.day_week,
    dw.day_name,
    r.hour,
    CASE
        WHEN r.hour BETWEEN 0 AND 23 THEN r.hour
        ELSE NULL
    END AS hour_value,
    r.ve_forms,
    r.per_typ,
    pt.role_label AS role,
    r.body_typ,
    bt.body_label,
    r.age,
    CASE
        WHEN r.age BETWEEN 0 AND 15 THEN 'Under 16'
        WHEN r.age BETWEEN 16 AND 20 THEN '16-20'
        WHEN r.age BETWEEN 21 AND 24 THEN '21-24'
        WHEN r.age BETWEEN 25 AND 29 THEN '25-29'
        WHEN r.age BETWEEN 30 AND 39 THEN '30-39'
        WHEN r.age BETWEEN 40 AND 49 THEN '40-49'
        WHEN r.age BETWEEN 50 AND 59 THEN '50-59'
        WHEN r.age BETWEEN 60 AND 120 THEN '60 or older'
        ELSE 'Unknown'
    END AS age_band,
    CASE r.sex
        WHEN 1 THEN 'Male'
        WHEN 2 THEN 'Female'
        ELSE 'Not reported'
    END AS sex_label,
    r.helm_use,
    h.helmet_label,
    CASE
        WHEN r.helm_use IN (5, 16, 19) THEN 'Used'
        WHEN r.helm_use = 17 THEN 'Not used'
        ELSE 'Unknown'
    END AS helmet_group,
    r.helm_mis,
    r.drinking,
    dk.drinking_label,
    CASE
        WHEN r.drinking = 1 THEN 'Involved'
        WHEN r.drinking = 0 THEN 'Not involved'
        ELSE 'Unknown'
    END AS drinking_group,
    r.alc_res,
    CASE
        WHEN r.alc_res BETWEEN 0 AND 940 THEN 'Numeric result'
        WHEN r.alc_res = 996 THEN 'Test not given'
        WHEN r.alc_res = 998 THEN 'Positive, value not coded'
        WHEN r.alc_res = 997 THEN 'Tested, result unknown'
        ELSE 'No numeric result'
    END AS bac_group,
    CASE
        WHEN r.hour BETWEEN 6 AND 17 THEN 'Daytime'
        WHEN r.hour BETWEEN 0 AND 5 OR r.hour BETWEEN 18 AND 23 THEN 'Nighttime'
        ELSE 'Unknown'
    END AS day_part,
    CASE
        WHEN (r.day_week = 2 AND r.hour BETWEEN 6 AND 23)
          OR r.day_week IN (3, 4, 5)
          OR (r.day_week = 6 AND r.hour BETWEEN 0 AND 17)
            THEN 'Weekday'
        WHEN (r.day_week = 6 AND r.hour BETWEEN 18 AND 23)
          OR r.day_week IN (1, 7)
          OR (r.day_week = 2 AND r.hour BETWEEN 0 AND 5)
            THEN 'Weekend'
        ELSE 'Unknown'
    END AS week_part,
    CASE
        WHEN r.ve_forms = 1 THEN 'Single-vehicle'
        WHEN r.ve_forms > 1 THEN 'Multi-vehicle'
        ELSE 'Unknown'
    END AS vehicle_count_group
FROM riders AS r
LEFT JOIN dim_state AS s
    ON r.state_code = s.state_code
LEFT JOIN dim_month AS mo
    ON r.month = mo.month
LEFT JOIN dim_day_week AS dw
    ON r.day_week = dw.day_week
LEFT JOIN dim_person_type AS pt
    ON r.per_typ = pt.per_typ
LEFT JOIN dim_body_type AS bt
    ON r.body_typ = bt.body_typ
LEFT JOIN dim_helmet AS h
    ON r.helm_use = h.helm_use
LEFT JOIN dim_drinking AS dk
    ON r.drinking = dk.drinking;

-- People killed in a motorcycle-involved fatal crash who were not on the motorcycle.
CREATE OR REPLACE TABLE fact_other_death AS
SELECT
    p.st_case,
    p.veh_no,
    p.per_no,
    p.per_typ,
    p.body_typ,
    CASE
        WHEN p.per_typ IN (1, 2, 9) THEN 'Occupant of another vehicle'
        WHEN p.per_typ = 5 THEN 'Pedestrian'
        WHEN p.per_typ IN (6, 7) THEN 'Bicyclist or other cyclist'
        ELSE 'Other person'
    END AS who
FROM stg_person AS p
INNER JOIN fact_motorcycle_crash AS c
    ON p.st_case = c.st_case
WHERE p.inj_sev = 4
  AND NOT EXISTS (
      SELECT 1
      FROM fact_motorcyclist_death AS d
      WHERE d.st_case = p.st_case
        AND d.veh_no = p.veh_no
        AND d.per_no = p.per_no
  );
