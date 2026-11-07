"""Download FARS 2023, build the DuckDB warehouse, and publish the briefing."""

from __future__ import annotations

import json
import shutil
import urllib.request
import zipfile
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

import duckdb

from excel_brief import write_workbook

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
EXTRACT = RAW / "extracted" / "FARS2023NationalCSV"
ZIP_PATH = RAW / "FARS2023NationalCSV.zip"
DB_PATH = ROOT / "data" / "processed" / "ride_brief.duckdb"
JSON_PATH = ROOT / "data" / "processed" / "briefing.json"
PUBLIC_JSON = ROOT / "public" / "data" / "briefing.json"
XLSX_PATH = ROOT / "data" / "processed" / "ride_brief_2023.xlsx"
PUBLIC_XLSX = ROOT / "public" / "ride_brief_2023.xlsx"
SQL_DIR = ROOT / "sql"
FARS_URL = "https://static.nhtsa.gov/nhtsa/downloads/FARS/2023/National/FARS2023NationalCSV.zip"
MANUAL_URL = "https://crashstats.nhtsa.dot.gov/Api/Public/Publication/813794"

NEEDED = ("accident.csv", "vehicle.csv", "person.csv")


def main() -> None:
    ensure_extract()
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()
    con = duckdb.connect(str(DB_PATH))
    try:
        load_staging(con)
        for name in ("01_dimensions.sql", "02_facts.sql", "03_quality.sql", "04_marts.sql"):
            run_script(con, SQL_DIR / name)
        assert_warehouse(con)
        payload = build_payload(con)
        write_json(payload)
        publish_excel(con, payload)
    finally:
        con.close()
    print(
        f"Motorcyclists killed: {payload['overview']['motorcyclistDeaths']:,} | "
        f"Fatal crashes with a motorcycle: {payload['overview']['motorcycleCrashes']:,}"
    )
    print(f"Wrote {JSON_PATH}")
    print(f"Wrote {XLSX_PATH}")


def ensure_extract() -> None:
    if all((EXTRACT / name).exists() for name in NEEDED):
        return
    RAW.mkdir(parents=True, exist_ok=True)
    if not ZIP_PATH.exists():
        print(f"Downloading {FARS_URL}")
        urllib.request.urlretrieve(FARS_URL, ZIP_PATH)
    EXTRACT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ZIP_PATH) as archive:
        for name in NEEDED:
            member = f"FARS2023NationalCSV/{name}"
            archive.extract(member, RAW / "extracted")


def load_staging(con: duckdb.DuckDBPyConnection) -> None:
    specs = {
        "stg_accident": (
            EXTRACT / "accident.csv",
            {
                "STATE": "state_code",
                "ST_CASE": "st_case",
                "MONTH": "month",
                "DAY": "day",
                "DAY_WEEK": "day_week",
                "HOUR": "hour",
                "VE_FORMS": "ve_forms",
                "LGT_COND": "lgt_cond",
                "YEAR": "year",
            },
        ),
        "stg_vehicle": (
            EXTRACT / "vehicle.csv",
            {
                "STATE": "state_code",
                "ST_CASE": "st_case",
                "VEH_NO": "veh_no",
                "BODY_TYP": "body_typ",
            },
        ),
        "stg_person": (
            EXTRACT / "person.csv",
            {
                "STATE": "state_code",
                "ST_CASE": "st_case",
                "VEH_NO": "veh_no",
                "PER_NO": "per_no",
                "PER_TYP": "per_typ",
                "INJ_SEV": "inj_sev",
                "BODY_TYP": "body_typ",
                "AGE": "age",
                "SEX": "sex",
                "HELM_USE": "helm_use",
                "HELM_MIS": "helm_mis",
                "DRINKING": "drinking",
                "ALC_RES": "alc_res",
                "ALC_STATUS": "alc_status",
            },
        ),
    }
    for table, (path, columns) in specs.items():
        select_list = ", ".join(
            f"TRY_CAST({source} AS INTEGER) AS {alias}" for source, alias in columns.items()
        )
        con.execute(
            f"""
            CREATE TABLE {table} AS
            SELECT {select_list}
            FROM read_csv(?, header = true, all_varchar = true)
            """,
            [str(path)],
        )
        print(f"Loaded {table}: {con.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]:,} rows")


def run_script(con: duckdb.DuckDBPyConnection, path: Path) -> None:
    lines = []
    for line in path.read_text().splitlines():
        if line.strip().startswith("--"):
            continue
        lines.append(line)
    for statement in "\n".join(lines).split(";"):
        if statement.strip():
            con.execute(statement)


def assert_warehouse(con: duckdb.DuckDBPyConnection) -> None:
    overview = row(con, "SELECT * FROM mart_overview")
    quality = {item["check_id"]: item["n"] for item in rows(con, "SELECT * FROM mart_quality")}
    deaths = overview["motorcyclist_deaths"]
    if not 5000 <= deaths <= 8000:
        raise SystemExit(f"Death count {deaths} is outside the expected FARS range.")
    if not 6200 <= deaths <= 6500:
        print(f"Warning: death count {deaths} is outside the narrow band around the published 2023 figure.")
    for check_id in ("duplicate_death_keys", "null_death_keys", "unmapped_state"):
        if quality[check_id] != 0:
            raise SystemExit(f"{check_id} = {quality[check_id]}")
    if quality["helmet_group_sum"] != deaths or quality["drinking_group_sum"] != deaths:
        raise SystemExit("Grouped helmet or alcohol counts do not cover every death.")
    part_checks = [
        overview["helmet_used"] + overview["helmet_not_used"] + overview["helmet_unknown"],
        overview["drinking_involved"] + overview["drinking_not_involved"] + overview["drinking_unknown"],
        overview["daytime"] + overview["nighttime"] + overview["time_unknown"],
        overview["weekday"] + overview["weekend"] + overview["week_unknown"],
        overview["operator_deaths"] + overview["passenger_deaths"],
        overview["single_vehicle"] + overview["multi_vehicle"],
    ]
    if any(part != deaths for part in part_checks):
        raise SystemExit(f"A composition does not sum to {deaths}: {part_checks}")
    state_sum = con.execute("SELECT COALESCE(SUM(deaths), 0) FROM mart_state").fetchone()[0]
    if state_sum != deaths:
        raise SystemExit(f"State deaths {state_sum} do not match the national count {deaths}.")
    hour_sum = con.execute("SELECT COALESCE(SUM(deaths), 0) FROM mart_hour").fetchone()[0]
    if hour_sum + overview["time_unknown"] != deaths:
        raise SystemExit("Hour counts plus unknown time do not match the death count.")
    bad_year = con.execute(
        "SELECT COUNT(*) FROM fact_motorcycle_crash WHERE year IS DISTINCT FROM 2023"
    ).fetchone()[0]
    if bad_year:
        raise SystemExit(f"{bad_year} motorcycle crashes are not coded as 2023.")
    if quality["body_type_mismatch"]:
        print(f"Note: {quality['body_type_mismatch']} death rows disagree with the vehicle body type.")


def build_payload(con: duckdb.DuckDBPyConnection) -> dict:
    overview = row(con, "SELECT * FROM mart_overview")
    bac = row(con, "SELECT * FROM mart_bac")
    return {
        "meta": {
            "title": "Ride Brief",
            "year": 2023,
            "release": "Final",
            "sourceName": "NHTSA Fatality Analysis Reporting System",
            "sourceUrl": FARS_URL,
            "manual": "Fatality Analysis Reporting System Analytical User's Manual, 1975-2024 (DOT HS 813 794, April 2026)",
            "manualUrl": MANUAL_URL,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "geography": "50 states and the District of Columbia. Puerto Rico is not in the national file.",
        },
        "overview": camel_keys(overview),
        "helmet": rows(con, """
            SELECT helmet_group AS "group", deaths, share_of_deaths AS share
            FROM mart_helmet
        """),
        "helmetCodes": rows(con, """
            SELECT code, helmet_label AS label, helmet_group AS "group", deaths
            FROM mart_helmet_code
        """),
        "bodyTypes": rows(con, """
            SELECT code, body_label AS label, deaths, share_of_deaths AS share
            FROM mart_body_type
        """),
        "alcohol": rows(con, """
            SELECT drinking_group AS "group", deaths, share_of_deaths AS share
            FROM mart_alcohol
        """),
        "bac": camel_keys(bac),
        "hours": rows(con, "SELECT hour, deaths FROM mart_hour ORDER BY hour"),
        "dayOfWeek": rows(con, """
            SELECT code, day_name AS label, deaths FROM mart_day_week ORDER BY day_order
        """),
        "dayPart": rows(con, """
            SELECT day_part AS "group", deaths, share_of_deaths AS share FROM mart_day_part
        """),
        "weekPart": rows(con, """
            SELECT week_part AS "group", deaths, share_of_deaths AS share FROM mart_week_part
        """),
        "months": rows(con, """
            SELECT month, month_name AS label, deaths FROM mart_month ORDER BY month
        """),
        "age": rows(con, """
            SELECT age_band AS band, age_order AS sort, deaths, share_of_deaths AS share
            FROM mart_age ORDER BY age_order
        """),
        "sex": rows(con, """
            SELECT sex_label AS label, deaths, share_of_deaths AS share FROM mart_sex
        """),
        "roles": rows(con, """
            SELECT role AS label, deaths, share_of_deaths AS share FROM mart_role
        """),
        "vehicles": rows(con, """
            SELECT vehicle_count_group AS "group", deaths, share_of_deaths AS share
            FROM mart_vehicles
        """),
        "otherDeaths": rows(con, """
            SELECT who, deaths, share_of_other_deaths AS share FROM mart_other_death ORDER BY deaths DESC
        """),
        "states": rows(con, """
            SELECT
                state_code AS "stateCode",
                state_name AS name,
                state_postal AS postal,
                deaths,
                share_of_national AS share,
                death_rank AS "deathRank",
                cumulative_share AS "cumulativeShare",
                helmet_used AS "helmetUsed",
                helmet_not_used AS "helmetNotUsed",
                helmet_unknown AS "helmetUnknown",
                helmet_known AS "helmetKnown",
                nonuse_among_known AS "nonuseAmongKnown",
                nighttime,
                nighttime_share AS "nighttimeShare",
                alcohol_involved AS "alcoholInvolved",
                alcohol_unknown AS "alcoholUnknown"
            FROM mart_state
            ORDER BY deaths DESC, state_name
        """),
        "quality": rows(con, """
            SELECT check_id AS id, level, n, detail FROM mart_quality
        """),
        "definitions": rows(con, """
            SELECT topic, rule FROM dim_definition ORDER BY sort_order
        """),
    }


def publish_excel(con: duckdb.DuckDBPyConnection, payload: dict) -> None:
    deaths = rows(con, """
        SELECT
            state_name, helmet_group, drinking_group, day_part, week_part,
            hour_value, day_name, age_band, sex_label, role,
            vehicle_count_group, body_label, month_name, st_case, bac_group
        FROM fact_motorcyclist_death
        ORDER BY state_name, st_case, veh_no, per_no
    """)
    states = rows(con, "SELECT state_name, state_postal FROM dim_state ORDER BY state_name")
    definitions = payload["definitions"]
    dictionary = rows(con, """
        SELECT 'Helmet' AS list_name, CAST(helm_use AS VARCHAR) AS code, helmet_label AS label, helmet_group AS note
        FROM dim_helmet
        UNION ALL
        SELECT 'Alcohol', CAST(drinking AS VARCHAR), drinking_label, drinking_group FROM dim_drinking
        UNION ALL
        SELECT 'Body type', CAST(body_typ AS VARCHAR), body_label, boundary_note FROM dim_body_type
        UNION ALL
        SELECT 'Person type', CAST(per_typ AS VARCHAR), role_label,
               CASE WHEN in_rider_count THEN 'Included in the rider death count' ELSE 'Excluded from the rider death count' END
        FROM dim_person_type
        ORDER BY 1, 2
    """)
    warehouse = {key: payload["overview"][camel(key)] for key in (
        "motorcyclist_deaths",
        "helmet_used",
        "helmet_not_used",
        "helmet_unknown",
        "known_helmet_nonuse",
        "drinking_involved",
        "drinking_not_involved",
        "drinking_unknown",
        "daytime",
        "nighttime",
        "time_unknown",
        "weekday",
        "weekend",
        "week_unknown",
        "single_vehicle",
        "multi_vehicle",
    )}
    write_workbook(XLSX_PATH, deaths, states, definitions, dictionary, warehouse)
    PUBLIC_XLSX.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(XLSX_PATH, PUBLIC_XLSX)


def write_json(payload: dict) -> None:
    text = json.dumps(payload, indent=2)
    for path in (JSON_PATH, PUBLIC_JSON):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text + "\n")


def rows(con: duckdb.DuckDBPyConnection, sql: str) -> list[dict]:
    cursor = con.execute(sql)
    columns = [item[0] for item in cursor.description]
    return [{columns[index]: clean(value) for index, value in enumerate(record)} for record in cursor.fetchall()]


def row(con: duckdb.DuckDBPyConnection, sql: str) -> dict:
    found = rows(con, sql)
    if len(found) != 1:
        raise SystemExit(f"Expected one row, found {len(found)} for: {sql[:80]}")
    return found[0]


def clean(value):
    if isinstance(value, Decimal):
        return float(value)
    return value


def camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(part[:1].upper() + part[1:] for part in parts[1:])


def camel_keys(record: dict) -> dict:
    return {camel(key): clean(value) for key, value in record.items()}


if __name__ == "__main__":
    main()
