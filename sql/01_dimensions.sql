-- Code lists for the 2023 final FARS file.
-- Attributes follow the FARS Analytical User's Manual, 1975-2024
-- (DOT HS 813 794), using the 2019-later or 2020-later column where the
-- manual splits history by year.

CREATE OR REPLACE TABLE dim_state (
    state_code INTEGER PRIMARY KEY,
    state_postal VARCHAR,
    state_name VARCHAR
);

INSERT INTO dim_state VALUES
    (1, 'AL', 'Alabama'),
    (2, 'AK', 'Alaska'),
    (4, 'AZ', 'Arizona'),
    (5, 'AR', 'Arkansas'),
    (6, 'CA', 'California'),
    (8, 'CO', 'Colorado'),
    (9, 'CT', 'Connecticut'),
    (10, 'DE', 'Delaware'),
    (11, 'DC', 'District of Columbia'),
    (12, 'FL', 'Florida'),
    (13, 'GA', 'Georgia'),
    (15, 'HI', 'Hawaii'),
    (16, 'ID', 'Idaho'),
    (17, 'IL', 'Illinois'),
    (18, 'IN', 'Indiana'),
    (19, 'IA', 'Iowa'),
    (20, 'KS', 'Kansas'),
    (21, 'KY', 'Kentucky'),
    (22, 'LA', 'Louisiana'),
    (23, 'ME', 'Maine'),
    (24, 'MD', 'Maryland'),
    (25, 'MA', 'Massachusetts'),
    (26, 'MI', 'Michigan'),
    (27, 'MN', 'Minnesota'),
    (28, 'MS', 'Mississippi'),
    (29, 'MO', 'Missouri'),
    (30, 'MT', 'Montana'),
    (31, 'NE', 'Nebraska'),
    (32, 'NV', 'Nevada'),
    (33, 'NH', 'New Hampshire'),
    (34, 'NJ', 'New Jersey'),
    (35, 'NM', 'New Mexico'),
    (36, 'NY', 'New York'),
    (37, 'NC', 'North Carolina'),
    (38, 'ND', 'North Dakota'),
    (39, 'OH', 'Ohio'),
    (40, 'OK', 'Oklahoma'),
    (41, 'OR', 'Oregon'),
    (42, 'PA', 'Pennsylvania'),
    (44, 'RI', 'Rhode Island'),
    (45, 'SC', 'South Carolina'),
    (46, 'SD', 'South Dakota'),
    (47, 'TN', 'Tennessee'),
    (48, 'TX', 'Texas'),
    (49, 'UT', 'Utah'),
    (50, 'VT', 'Vermont'),
    (51, 'VA', 'Virginia'),
    (53, 'WA', 'Washington'),
    (54, 'WV', 'West Virginia'),
    (55, 'WI', 'Wisconsin'),
    (56, 'WY', 'Wyoming');

CREATE OR REPLACE TABLE dim_body_type (
    body_typ INTEGER PRIMARY KEY,
    body_label VARCHAR,
    in_briefing BOOLEAN,
    boundary_note VARCHAR
);

INSERT INTO dim_body_type VALUES
    (80, 'Two-wheel motorcycle (excluding motor scooters)', TRUE, 'Included. FARS body type 80.'),
    (81, 'Moped', TRUE, 'Included. FARS body type 81.'),
    (82, 'Three-wheel motorcycle (2 rear wheels)', TRUE, 'Included. FARS body type 82.'),
    (83, 'Off-road motorcycle', TRUE, 'Included. FARS body type 83.'),
    (84, 'Motor scooter', TRUE, 'Included. FARS body type 84.'),
    (85, 'Unenclosed three-wheel motorcycle or autocycle (1 rear wheel)', TRUE, 'Included. FARS body type 85.'),
    (86, 'Enclosed three-wheel motorcycle or autocycle (1 rear wheel)', TRUE, 'Included. FARS body type 86. Autocycles often have belts as well as helmets.'),
    (87, 'Unknown three-wheel motorcycle type', TRUE, 'Included. FARS body type 87.'),
    (88, 'Other motored cycle (mini-bike, pocket motorcycle)', TRUE, 'Included. FARS body type 88.'),
    (89, 'Unknown motored cycle type', TRUE, 'Included. FARS body type 89.'),
    (90, 'ATV (all-terrain vehicle)', FALSE, 'Excluded. Coded separately from motorcycles.'),
    (91, 'Snowmobile', FALSE, 'Excluded.');

CREATE OR REPLACE TABLE dim_helmet (
    helm_use INTEGER PRIMARY KEY,
    helmet_label VARCHAR,
    helmet_group VARCHAR
);

INSERT INTO dim_helmet VALUES
    (5, 'DOT-compliant motorcycle helmet', 'Used'),
    (16, 'Helmet, other than DOT-compliant', 'Used'),
    (19, 'Helmet, unknown if DOT-compliant', 'Used'),
    (17, 'No helmet', 'Not used'),
    (20, 'Not applicable', 'Unknown'),
    (96, 'Not a motor vehicle occupant', 'Unknown'),
    (98, 'Not reported', 'Unknown'),
    (99, 'Unknown if helmet worn', 'Unknown');

CREATE OR REPLACE TABLE dim_drinking (
    drinking INTEGER PRIMARY KEY,
    drinking_label VARCHAR,
    drinking_group VARCHAR
);

INSERT INTO dim_drinking VALUES
    (0, 'No (alcohol not involved)', 'Not involved'),
    (1, 'Yes (alcohol involved)', 'Involved'),
    (8, 'Not reported', 'Unknown'),
    (9, 'Reported as unknown', 'Unknown');

CREATE OR REPLACE TABLE dim_person_type (
    per_typ INTEGER PRIMARY KEY,
    role_label VARCHAR,
    in_rider_count BOOLEAN
);

INSERT INTO dim_person_type VALUES
    (1, 'Operator', TRUE),
    (2, 'Passenger', TRUE),
    (9, 'Unknown occupant type in a motor vehicle in transport', FALSE);

CREATE OR REPLACE TABLE dim_day_week (
    day_week INTEGER PRIMARY KEY,
    day_name VARCHAR,
    day_order INTEGER
);

INSERT INTO dim_day_week VALUES
    (1, 'Sunday', 1),
    (2, 'Monday', 2),
    (3, 'Tuesday', 3),
    (4, 'Wednesday', 4),
    (5, 'Thursday', 5),
    (6, 'Friday', 6),
    (7, 'Saturday', 7);

CREATE OR REPLACE TABLE dim_month (
    month INTEGER PRIMARY KEY,
    month_name VARCHAR
);

INSERT INTO dim_month VALUES
    (1, 'January'),
    (2, 'February'),
    (3, 'March'),
    (4, 'April'),
    (5, 'May'),
    (6, 'June'),
    (7, 'July'),
    (8, 'August'),
    (9, 'September'),
    (10, 'October'),
    (11, 'November'),
    (12, 'December');

CREATE OR REPLACE TABLE dim_age_band (
    age_band VARCHAR PRIMARY KEY,
    age_order INTEGER
);

INSERT INTO dim_age_band VALUES
    ('Under 16', 1),
    ('16-20', 2),
    ('21-24', 3),
    ('25-29', 4),
    ('30-39', 5),
    ('40-49', 6),
    ('50-59', 7),
    ('60 or older', 8),
    ('Unknown', 9);

CREATE OR REPLACE TABLE dim_definition (
    sort_order INTEGER,
    topic VARCHAR,
    rule VARCHAR
);

INSERT INTO dim_definition VALUES
    (1, 'Question', 'Among people killed on motorcycles in U.S. traffic crashes in 2023, how were helmet use, police-reported alcohol involvement, time of day, and state distributed?'),
    (2, 'Source', 'NHTSA Fatality Analysis Reporting System, 2023 Final National CSV. The 2024 national file is an Annual Report File and can still be revised, so this briefing stays on the final year.'),
    (3, 'Geography', 'The national file covers the 50 states and the District of Columbia. Puerto Rico is published separately and is not included.'),
    (4, 'Fatal crash', 'A crash in the accident file in which at least one in-transport vehicle has body type 80 through 89.'),
    (5, 'Motorcyclist killed', 'A person in the person file with injury severity 4 (fatal), person type 1 (operator) or 2 (passenger), and body type 80 through 89. Injury severity 6 (died prior to the crash) is excluded. Unknown occupant type is excluded and counted in the quality checks.'),
    (6, 'Other people killed', 'People with injury severity 4 in a motorcycle-involved fatal crash who are not in the motorcyclist-killed set. They include occupants of other vehicles, pedestrians, and bicyclists.'),
    (7, 'Helmet', 'Used means HELM_USE 5, 16, or 19. Not used means 17. Every other code, including not reported and unknown, stays in Unknown. Unknown is never folded into not used.'),
    (8, 'Police-reported alcohol', 'DRINKING is the officer''s judgment. 1 is involved, 0 is not involved, 8 and 9 stay unknown. The manual says this element does not mean alcohol caused the crash. It is not NHTSA''s alcohol-impaired-driving statistic, which uses measured and imputed blood alcohol concentration.'),
    (9, 'Numeric BAC', 'ALC_RES values 0 through 940 are numeric results, in units of 0.001 g/dL, so 80 means 0.08 g/dL. Value 940 means 0.94 g/dL or greater and is counted as at or above 0.08. Values 995 through 999 are not numeric. This briefing does not impute missing tests.'),
    (10, 'Time of day', 'NCSA classification: daytime is hour 6 through 17 (6:00 a.m. through 5:59 p.m.). Nighttime is hours 0 through 5 and 18 through 23. Hour 99 or a missing hour is unknown.'),
    (11, 'Week part', 'NCSA classification: weekend runs from 6:00 p.m. Friday through 5:59 a.m. Monday. Hours that fall in neither the weekday nor the weekend rule are unknown.'),
    (12, 'What this cannot say', 'FARS is a census of fatal crashes, not of all crashes and not of miles ridden. A state with more deaths is not shown to be more dangerous per mile. Helmet and alcohol figures describe people who died, not the effect of a helmet or of alcohol.');
