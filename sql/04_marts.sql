-- Aggregates for the briefing. Window functions rank states and build
-- a running share so a reader can see concentration without treating
-- the rank as a risk ranking.

CREATE OR REPLACE TABLE mart_helmet AS
SELECT
    helmet_group,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_deaths
FROM fact_motorcyclist_death
GROUP BY helmet_group;

CREATE OR REPLACE TABLE mart_helmet_code AS
SELECT
    d.helm_use AS code,
    COALESCE(h.helmet_label, 'Code not in the 2019-later helmet list') AS helmet_label,
    d.helmet_group,
    COUNT(*) AS deaths
FROM fact_motorcyclist_death AS d
LEFT JOIN dim_helmet AS h
    ON d.helm_use = h.helm_use
GROUP BY 1, 2, 3
ORDER BY deaths DESC;

CREATE OR REPLACE TABLE mart_body_type AS
SELECT
    d.body_typ AS code,
    COALESCE(b.body_label, 'Unlisted body type') AS body_label,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_deaths
FROM fact_motorcyclist_death AS d
LEFT JOIN dim_body_type AS b
    ON d.body_typ = b.body_typ
GROUP BY 1, 2
ORDER BY deaths DESC;

CREATE OR REPLACE TABLE mart_alcohol AS
SELECT
    drinking_group,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_deaths
FROM fact_motorcyclist_death
GROUP BY drinking_group;

CREATE OR REPLACE TABLE mart_bac AS
SELECT
    COUNT(*) AS deaths,
    COUNT(*) FILTER (WHERE alc_res BETWEEN 0 AND 940) AS numeric_results,
    COUNT(*) FILTER (WHERE alc_res BETWEEN 80 AND 940) AS at_or_above_008,
    COUNT(*) FILTER (WHERE alc_res BETWEEN 0 AND 79) AS below_008,
    COUNT(*) FILTER (WHERE alc_res = 996) AS test_not_given,
    COUNT(*) FILTER (WHERE alc_res = 998) AS positive_value_missing,
    COUNT(*) FILTER (WHERE alc_res = 997) AS tested_result_unknown,
    COUNT(*) FILTER (
        WHERE alc_res IS NULL OR alc_res NOT BETWEEN 0 AND 940
    ) AS no_numeric_result
FROM fact_motorcyclist_death;

CREATE OR REPLACE TABLE mart_hour AS
SELECT
    h.hour,
    COALESCE(c.deaths, 0) AS deaths
FROM generate_series(0, 23) AS h(hour)
LEFT JOIN (
    SELECT hour_value AS hour, COUNT(*) AS deaths
    FROM fact_motorcyclist_death
    WHERE hour_value IS NOT NULL
    GROUP BY 1
) AS c
    ON h.hour = c.hour
ORDER BY h.hour;

CREATE OR REPLACE TABLE mart_day_week AS
SELECT
    dw.day_week AS code,
    dw.day_name,
    dw.day_order,
    COUNT(d.st_case) AS deaths
FROM dim_day_week AS dw
LEFT JOIN fact_motorcyclist_death AS d
    ON dw.day_week = d.day_week
GROUP BY 1, 2, 3
ORDER BY dw.day_order;

CREATE OR REPLACE TABLE mart_day_part AS
SELECT
    day_part,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_deaths
FROM fact_motorcyclist_death
GROUP BY day_part;

CREATE OR REPLACE TABLE mart_week_part AS
SELECT
    week_part,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_deaths
FROM fact_motorcyclist_death
GROUP BY week_part;

CREATE OR REPLACE TABLE mart_month AS
SELECT
    m.month,
    m.month_name,
    COUNT(d.st_case) AS deaths
FROM dim_month AS m
LEFT JOIN fact_motorcyclist_death AS d
    ON m.month = d.month
GROUP BY 1, 2
ORDER BY m.month;

CREATE OR REPLACE TABLE mart_age AS
SELECT
    b.age_band,
    b.age_order,
    COUNT(d.st_case) AS deaths,
    COUNT(d.st_case) * 1.0 / NULLIF(SUM(COUNT(d.st_case)) OVER (), 0) AS share_of_deaths
FROM dim_age_band AS b
LEFT JOIN fact_motorcyclist_death AS d
    ON b.age_band = d.age_band
GROUP BY 1, 2
ORDER BY b.age_order;

CREATE OR REPLACE TABLE mart_sex AS
SELECT
    sex_label,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_deaths
FROM fact_motorcyclist_death
GROUP BY sex_label;

CREATE OR REPLACE TABLE mart_role AS
SELECT
    role,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_deaths
FROM fact_motorcyclist_death
GROUP BY role;

CREATE OR REPLACE TABLE mart_vehicles AS
SELECT
    vehicle_count_group,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_deaths
FROM fact_motorcyclist_death
GROUP BY vehicle_count_group;

CREATE OR REPLACE TABLE mart_other_death AS
SELECT
    who,
    COUNT(*) AS deaths,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS share_of_other_deaths
FROM fact_other_death
GROUP BY who
ORDER BY deaths DESC;

CREATE OR REPLACE TABLE mart_state AS
WITH counts AS (
    SELECT
        s.state_code,
        s.state_postal,
        s.state_name,
        COUNT(d.st_case) AS deaths,
        COUNT(d.st_case) FILTER (WHERE d.helmet_group = 'Used') AS helmet_used,
        COUNT(d.st_case) FILTER (WHERE d.helmet_group = 'Not used') AS helmet_not_used,
        COUNT(d.st_case) FILTER (WHERE d.helmet_group = 'Unknown') AS helmet_unknown,
        COUNT(d.st_case) FILTER (WHERE d.day_part = 'Nighttime') AS nighttime,
        COUNT(d.st_case) FILTER (WHERE d.drinking_group = 'Involved') AS alcohol_involved,
        COUNT(d.st_case) FILTER (WHERE d.drinking_group = 'Unknown') AS alcohol_unknown
    FROM dim_state AS s
    LEFT JOIN fact_motorcyclist_death AS d
        ON s.state_code = d.state_code
    GROUP BY 1, 2, 3
)
SELECT
    state_code,
    state_postal,
    state_name,
    deaths,
    SUM(deaths) OVER () AS national_deaths,
    deaths * 1.0 / NULLIF(SUM(deaths) OVER (), 0) AS share_of_national,
    RANK() OVER (ORDER BY deaths DESC, state_name) AS death_rank,
    SUM(deaths) OVER (
        ORDER BY deaths DESC, state_name
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) * 1.0 / NULLIF(SUM(deaths) OVER (), 0) AS cumulative_share,
    helmet_used,
    helmet_not_used,
    helmet_unknown,
    helmet_used + helmet_not_used AS helmet_known,
    helmet_not_used * 1.0 / NULLIF(helmet_used + helmet_not_used, 0) AS nonuse_among_known,
    nighttime,
    nighttime * 1.0 / NULLIF(deaths, 0) AS nighttime_share,
    alcohol_involved,
    alcohol_unknown
FROM counts
ORDER BY deaths DESC, state_name;

CREATE OR REPLACE TABLE mart_overview AS
SELECT
    (SELECT COUNT(*) FROM fact_motorcycle_crash) AS motorcycle_crashes,
    (SELECT COUNT(*) FROM fact_motorcyclist_death) AS motorcyclist_deaths,
    (SELECT COUNT(*) FROM fact_other_death) AS other_deaths,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE helmet_group = 'Used') AS helmet_used,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE helmet_group = 'Not used') AS helmet_not_used,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE helmet_group = 'Unknown') AS helmet_unknown,
    (
        SELECT COUNT(*) FILTER (WHERE helmet_group = 'Not used') * 1.0
             / NULLIF(COUNT(*) FILTER (WHERE helmet_group IN ('Used', 'Not used')), 0)
        FROM fact_motorcyclist_death
    ) AS known_helmet_nonuse,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE drinking_group = 'Involved') AS drinking_involved,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE drinking_group = 'Not involved') AS drinking_not_involved,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE drinking_group = 'Unknown') AS drinking_unknown,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE day_part = 'Daytime') AS daytime,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE day_part = 'Nighttime') AS nighttime,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE day_part = 'Unknown') AS time_unknown,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE week_part = 'Weekday') AS weekday,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE week_part = 'Weekend') AS weekend,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE week_part = 'Unknown') AS week_unknown,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE vehicle_count_group = 'Single-vehicle') AS single_vehicle,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE vehicle_count_group = 'Multi-vehicle') AS multi_vehicle,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE role = 'Operator') AS operator_deaths,
    (SELECT COUNT(*) FROM fact_motorcyclist_death WHERE role = 'Passenger') AS passenger_deaths,
    (
        SELECT COUNT(*)
        FROM fact_motorcyclist_death
        WHERE helmet_group = 'Used'
          AND helm_mis = 1
    ) AS helmet_misuse_indicated,
    (
        SELECT COALESCE(SUM(deaths), 0) * 1.0 / NULLIF((SELECT COUNT(*) FROM fact_motorcyclist_death), 0)
        FROM (
            SELECT deaths
            FROM mart_state
            ORDER BY deaths DESC, state_name
            LIMIT 10
        ) AS top_states
    ) AS top10_share;
