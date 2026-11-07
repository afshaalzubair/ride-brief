-- Audits that should be read before quoting a number.
-- duplicate_death_keys and null_death_keys must be zero.
-- The excluded counts explain records the briefing deliberately omits.

CREATE OR REPLACE TABLE mart_quality AS
SELECT
    'staging_person_rows' AS check_id,
    'info' AS level,
    (SELECT COUNT(*) FROM stg_person) AS n,
    'Person rows loaded from the 2023 national CSV.' AS detail
UNION ALL
SELECT
    'staging_vehicle_rows',
    'info',
    (SELECT COUNT(*) FROM stg_vehicle),
    'Vehicle rows loaded from the 2023 national CSV.'
UNION ALL
SELECT
    'staging_accident_rows',
    'info',
    (SELECT COUNT(*) FROM stg_accident),
    'Fatal crashes loaded from the accident file.'
UNION ALL
SELECT
    'motorcycle_crashes',
    'info',
    (SELECT COUNT(*) FROM fact_motorcycle_crash),
    'Fatal crashes with at least one in-transport vehicle of body type 80-89.'
UNION ALL
SELECT
    'motorcyclist_deaths',
    'info',
    (SELECT COUNT(*) FROM fact_motorcyclist_death),
    'Operators and passengers killed on body types 80-89.'
UNION ALL
SELECT
    'duplicate_death_keys',
    'pass',
    (
        SELECT COUNT(*)
        FROM (
            SELECT st_case, veh_no, per_no
            FROM fact_motorcyclist_death
            GROUP BY 1, 2, 3
            HAVING COUNT(*) > 1
        ) AS dupes
    ),
    'Death records that share a case, vehicle, and person number. Must be zero.'
UNION ALL
SELECT
    'null_death_keys',
    'pass',
    (
        SELECT COUNT(*)
        FROM fact_motorcyclist_death
        WHERE st_case IS NULL
           OR veh_no IS NULL
           OR per_no IS NULL
           OR state_code IS NULL
    ),
    'Death records missing the join key or crash state. Must be zero.'
UNION ALL
SELECT
    'unmapped_state',
    'pass',
    (
        SELECT COUNT(*)
        FROM fact_motorcyclist_death
        WHERE state_name IS NULL
    ),
    'Death records whose state code is not in the 50 states or the District of Columbia.'
UNION ALL
SELECT
    'body_type_mismatch',
    'info',
    (
        SELECT COUNT(*)
        FROM fact_motorcyclist_death AS d
        INNER JOIN stg_vehicle AS v
            ON d.st_case = v.st_case
           AND d.veh_no = v.veh_no
        WHERE d.body_typ IS DISTINCT FROM v.body_typ
    ),
    'Death records whose person-file body type disagrees with the vehicle file.'
UNION ALL
SELECT
    'excluded_died_prior',
    'info',
    (
        SELECT COUNT(*)
        FROM stg_person
        WHERE inj_sev = 6
          AND per_typ IN (1, 2)
          AND body_typ BETWEEN 80 AND 89
    ),
    'Riders coded as died prior to the crash (injury severity 6), excluded from the death count.'
UNION ALL
SELECT
    'excluded_unknown_occupant',
    'info',
    (
        SELECT COUNT(*)
        FROM stg_person
        WHERE inj_sev = 4
          AND per_typ = 9
          AND body_typ BETWEEN 80 AND 89
    ),
    'Fatally injured motorcycle occupants of unknown person type, excluded from the rider count.'
UNION ALL
SELECT
    'helmet_group_sum',
    'pass',
    (
        SELECT COUNT(*)
        FROM fact_motorcyclist_death
        WHERE helmet_group IN ('Used', 'Not used', 'Unknown')
    ),
    'Deaths with a helmet group. Must equal the death count.'
UNION ALL
SELECT
    'drinking_group_sum',
    'pass',
    (
        SELECT COUNT(*)
        FROM fact_motorcyclist_death
        WHERE drinking_group IN ('Involved', 'Not involved', 'Unknown')
    ),
    'Deaths with a police-reported alcohol group. Must equal the death count.';
