"""Excel briefing whose summary cells are formulas over the death-level sheet."""

from __future__ import annotations

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.page import PageMargins

INK = "1C1915"
CREAM = "F7F1E6"
PAPER = "F3ECDF"
COPPER = "9C3418"
FOREST = "1F4D3A"
WHITE = "FFFcf7"
LINE = "D9D0C1"
AMBER = "F4E2C4"

THIN = Border(
    left=Side(style="thin", color=LINE),
    right=Side(style="thin", color=LINE),
    top=Side(style="thin", color=LINE),
    bottom=Side(style="thin", color=LINE),
)

FILL_INK = PatternFill("solid", fgColor=INK)
FILL_CREAM = PatternFill("solid", fgColor=CREAM)
FILL_PAPER = PatternFill("solid", fgColor=PAPER)
FILL_AMBER = PatternFill("solid", fgColor=AMBER)
FILL_WHITE = PatternFill("solid", fgColor=WHITE)

FONT_TITLE = Font(name="Calibri", size=20, bold=True, color=INK)
FONT_HEAD = Font(name="Calibri", size=11, bold=True, color=CREAM)
FONT_LABEL = Font(name="Calibri", size=11, bold=True, color=INK)
FONT_BODY = Font(name="Calibri", size=11, color=INK)
FONT_SMALL = Font(name="Calibri", size=10, italic=True, color="5C564C")
FONT_WHITE = Font(name="Calibri", size=11, color=CREAM)

DEATH_FIELDS = [
    ("state_name", "State"),
    ("helmet_group", "Helmet"),
    ("drinking_group", "Police-reported alcohol"),
    ("day_part", "Time of day"),
    ("week_part", "Week part"),
    ("hour_value", "Hour"),
    ("day_name", "Day of week"),
    ("age_band", "Age band"),
    ("sex_label", "Sex"),
    ("role", "Role"),
    ("vehicle_count_group", "Vehicles in crash"),
    ("body_label", "Body type"),
    ("month_name", "Month"),
    ("st_case", "FARS case"),
    ("bac_group", "BAC coding"),
]


def _prepare(ws, title: str, landscape: bool = False) -> None:
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape" if landscape else "portrait"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.page_setup.paperSize = ws.PAPERSIZE_TABLOID
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_margins = PageMargins(left=0.5, right=0.5, top=0.7, bottom=0.6, header=0.3, footer=0.3)
    ws.oddHeader.left.text = "Ride Brief  |  2023 FARS motorcycle deaths"
    ws.oddFooter.left.text = "Census of fatal crashes. Not a risk-per-mile ranking."
    ws.oddFooter.right.text = "Page &P"
    ws.sheet_properties.tabColor = INK
    ws.freeze_panes = "A2"
    if title:
        ws.oddHeader.center.text = title


def _header_row(ws, headers: list[str]) -> None:
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(1, col, header)
        cell.font = FONT_HEAD
        cell.fill = FILL_INK
        cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws.row_dimensions[1].height = 30
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}1"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{max(ws.max_row, 2)}"


def _widths(ws, widths: list[float]) -> None:
    for index, width in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(index)].width = width


def write_workbook(path, deaths: list[dict], states: list[dict], definitions: list[dict], dictionary: list[dict], warehouse: dict) -> None:
    last = len(deaths) + 1
    wb = Workbook()

    brief = wb.active
    brief.title = "Brief"
    _write_brief(brief, definitions, warehouse)

    summary = wb.create_sheet("Summary")
    _write_summary(summary, last, warehouse)

    state_sheet = wb.create_sheet("States")
    _write_states(state_sheet, states, last)

    hours = wb.create_sheet("Hours")
    _write_hours(hours, last)

    death_sheet = wb.create_sheet("Deaths")
    _write_deaths(death_sheet, deaths)

    dictionary_sheet = wb.create_sheet("Dictionary")
    _write_dictionary(dictionary_sheet, dictionary)

    checks = wb.create_sheet("Checks")
    _write_checks(checks)

    wb.properties.title = "Ride Brief 2023"
    wb.properties.subject = "NHTSA FARS motorcycle fatal-crash briefing"
    wb.properties.creator = "Ride Brief"
    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def _write_brief(ws, definitions: list[dict], warehouse: dict) -> None:
    _prepare(ws, "Brief")
    ws.freeze_panes = "A8"
    ws.merge_cells("A1:B1")
    ws["A1"] = "Ride Brief"
    ws["A1"].font = Font(name="Calibri", size=28, bold=True, color=INK)
    ws.merge_cells("A2:B2")
    ws["A2"] = "2023 U.S. motorcycle deaths in traffic crashes"
    ws["A2"].font = Font(name="Calibri", size=14, color=COPPER)
    ws.merge_cells("A3:B3")
    ws["A3"] = (
        f"Warehouse count of motorcyclists killed: {warehouse['motorcyclist_deaths']:,}. "
        "The Summary sheet recomputes that count with Excel formulas over the Deaths sheet."
    )
    ws["A3"].font = FONT_BODY
    ws["A3"].alignment = Alignment(wrap_text=True)
    ws.row_dimensions[3].height = 32

    ws["A5"] = "Topic"
    ws["B5"] = "Rule used in this briefing"
    for col in (1, 2):
        ws.cell(5, col).font = FONT_HEAD
        ws.cell(5, col).fill = FILL_INK
    for index, row in enumerate(definitions, start=6):
        ws.cell(index, 1, row["topic"]).font = FONT_LABEL
        ws.cell(index, 1).fill = FILL_AMBER
        ws.cell(index, 1).alignment = Alignment(vertical="top", wrap_text=True)
        cell = ws.cell(index, 2, row["rule"])
        cell.font = FONT_BODY
        cell.alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[index].height = 48
        ws.cell(index, 1).border = THIN
        ws.cell(index, 2).border = THIN
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 110
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = "1:5"
    ws.sheet_properties.tabColor = COPPER


def _metric_rows(last: int) -> list[tuple[str, str, str, str]]:
    """Return label, formula, warehouse key, number format."""
    b = f"Deaths!$B$2:$B${last}"
    c = f"Deaths!$C$2:$C${last}"
    d = f"Deaths!$D$2:$D${last}"
    e = f"Deaths!$E$2:$E${last}"
    k = f"Deaths!$K$2:$K${last}"
    return [
        ("Motorcyclists killed", f'=COUNTA(Deaths!$A$2:$A${last})', "motorcyclist_deaths", "#,##0"),
        ("Helmet used", f'=COUNTIF({b},"Used")', "helmet_used", "#,##0"),
        ("Helmet not used", f'=COUNTIF({b},"Not used")', "helmet_not_used", "#,##0"),
        ("Helmet unknown", f'=COUNTIF({b},"Unknown")', "helmet_unknown", "#,##0"),
        ("Helmet non-use among known status", '=IF((B9+B10)=0,"",B10/(B9+B10))', "known_helmet_nonuse", "0.0%"),
        ("Police-reported alcohol involved", f'=COUNTIF({c},"Involved")', "drinking_involved", "#,##0"),
        ("Police-reported alcohol not involved", f'=COUNTIF({c},"Not involved")', "drinking_not_involved", "#,##0"),
        ("Police-reported alcohol unknown", f'=COUNTIF({c},"Unknown")', "drinking_unknown", "#,##0"),
        ("Daytime deaths (6:00 a.m.-5:59 p.m.)", f'=COUNTIF({d},"Daytime")', "daytime", "#,##0"),
        ("Nighttime deaths (6:00 p.m.-5:59 a.m.)", f'=COUNTIF({d},"Nighttime")', "nighttime", "#,##0"),
        ("Time of day unknown", f'=COUNTIF({d},"Unknown")', "time_unknown", "#,##0"),
        ("Weekday deaths", f'=COUNTIF({e},"Weekday")', "weekday", "#,##0"),
        ("Weekend deaths", f'=COUNTIF({e},"Weekend")', "weekend", "#,##0"),
        ("Week part unknown", f'=COUNTIF({e},"Unknown")', "week_unknown", "#,##0"),
        ("Single-vehicle crash", f'=COUNTIF({k},"Single-vehicle")', "single_vehicle", "#,##0"),
        ("Multi-vehicle crash", f'=COUNTIF({k},"Multi-vehicle")', "multi_vehicle", "#,##0"),
    ]


def _write_summary(ws, last: int, warehouse: dict) -> None:
    _prepare(ws, "Summary", landscape=True)
    ws.freeze_panes = "A7"
    ws.merge_cells("A1:D1")
    ws["A1"] = "Summary"
    ws["A1"].font = FONT_TITLE
    ws.merge_cells("A2:D2")
    ws["A2"] = (
        "Column B is an Excel formula over the Deaths sheet. Column C is the same total from the DuckDB warehouse, "
        "frozen when this file was built. Column D should read Match."
    )
    ws["A2"].font = FONT_SMALL
    ws["A2"].alignment = Alignment(wrap_text=True)
    ws.row_dimensions[2].height = 32
    headers = ["Metric", "Excel formula", "Warehouse total", "Audit"]
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(6, col, header)
        cell.font = FONT_HEAD
        cell.fill = FILL_INK
    metrics = _metric_rows(last)
    for offset, (label, formula, key, fmt) in enumerate(metrics):
        row = 8 + offset
        ws.cell(row, 1, label).font = FONT_BODY
        formula_cell = ws.cell(row, 2, formula)
        formula_cell.font = FONT_LABEL
        formula_cell.number_format = fmt
        warehouse_cell = ws.cell(row, 3, warehouse[key])
        warehouse_cell.font = FONT_BODY
        warehouse_cell.number_format = fmt
        audit = ws.cell(row, 4, f'=IF(OR(B{row}="",C{row}=""),"",IF(ABS(B{row}-C{row})<0.000001,"Match","Check"))')
        audit.font = FONT_LABEL
        audit.alignment = Alignment(horizontal="center")
        for col in range(1, 5):
            ws.cell(row, col).border = THIN
            ws.cell(row, col).fill = FILL_WHITE if offset % 2 == 0 else FILL_CREAM
    end = 7 + len(metrics)
    ws.conditional_formatting.add(
        f"D8:D{end}",
        FormulaRule(formula=['D8="Match"'], fill=PatternFill("solid", fgColor="DCE8E1"), font=Font(name="Calibri", color=FOREST, bold=True)),
    )
    ws.conditional_formatting.add(
        f"D8:D{end}",
        FormulaRule(formula=['D8="Check"'], fill=PatternFill("solid", fgColor="F4D6CC"), font=Font(name="Calibri", color=COPPER, bold=True)),
    )
    note_row = end + 2
    ws.merge_cells(start_row=note_row, start_column=1, end_row=note_row, end_column=4)
    ws.cell(
        note_row,
        1,
        "Helmet non-use among known status divides not-used by used plus not-used. It leaves unknown helmet records out of the denominator. "
        "Police-reported alcohol is not a blood-alcohol result. Daytime, nighttime, weekday, and weekend follow the NCSA cuts in the FARS manual.",
    ).font = FONT_SMALL
    ws.cell(note_row, 1).alignment = Alignment(wrap_text=True)
    ws.row_dimensions[note_row].height = 48
    _widths(ws, [52, 22, 22, 14])
    ws.auto_filter.ref = f"A6:D{end}"
    ws.print_title_rows = "1:6"
    ws.sheet_properties.tabColor = COPPER


def _write_states(ws, states: list[dict], last: int) -> None:
    _prepare(ws, "States", landscape=True)
    headers = [
        "State",
        "Deaths",
        "Helmet used",
        "Helmet not used",
        "Helmet unknown",
        "Non-use among known",
        "Nighttime",
        "Alcohol involved",
        "Alcohol unknown",
        "Rank by deaths",
    ]
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(1, col, header)
        cell.font = FONT_HEAD
        cell.fill = FILL_INK
        cell.alignment = Alignment(wrap_text=True, vertical="center")
    ws.row_dimensions[1].height = 32
    ordered = sorted(states, key=lambda row: row["state_name"])
    for index, state in enumerate(ordered):
        row = index + 2
        ws.cell(row, 1, state["state_name"]).font = FONT_BODY
        formulas = {
            2: f'=COUNTIF(Deaths!$A$2:$A${last},A{row})',
            3: f'=COUNTIFS(Deaths!$A$2:$A${last},A{row},Deaths!$B$2:$B${last},"Used")',
            4: f'=COUNTIFS(Deaths!$A$2:$A${last},A{row},Deaths!$B$2:$B${last},"Not used")',
            5: f'=COUNTIFS(Deaths!$A$2:$A${last},A{row},Deaths!$B$2:$B${last},"Unknown")',
            6: f'=IF((C{row}+D{row})=0,"",D{row}/(C{row}+D{row}))',
            7: f'=COUNTIFS(Deaths!$A$2:$A${last},A{row},Deaths!$D$2:$D${last},"Nighttime")',
            8: f'=COUNTIFS(Deaths!$A$2:$A${last},A{row},Deaths!$C$2:$C${last},"Involved")',
            9: f'=COUNTIFS(Deaths!$A$2:$A${last},A{row},Deaths!$C$2:$C${last},"Unknown")',
            10: f'=RANK(B{row},$B$2:$B${1 + len(ordered)},0)',
        }
        for col, formula in formulas.items():
            cell = ws.cell(row, col, formula)
            cell.font = FONT_BODY
            cell.number_format = "0.0%" if col == 6 else "#,##0"
        for col in range(1, 11):
            ws.cell(row, col).border = THIN
            if index % 2:
                ws.cell(row, col).fill = FILL_CREAM
    end = 1 + len(ordered)
    total_row = end + 1
    ws.cell(total_row, 1, "All states").font = FONT_LABEL
    for col in range(2, 6):
        letter = get_column_letter(col)
        cell = ws.cell(total_row, col, f"=SUM({letter}2:{letter}{end})")
        cell.font = FONT_LABEL
        cell.number_format = "#,##0"
    for col in (7, 8, 9):
        letter = get_column_letter(col)
        cell = ws.cell(total_row, col, f"=SUM({letter}2:{letter}{end})")
        cell.font = FONT_LABEL
        cell.number_format = "#,##0"
    ws.cell(total_row, 6, f'=IF((C{total_row}+D{total_row})=0,"",D{total_row}/(C{total_row}+D{total_row}))')
    ws.cell(total_row, 6).number_format = "0.0%"
    ws.cell(total_row, 6).font = FONT_LABEL
    for col in range(1, 11):
        ws.cell(total_row, col).fill = FILL_AMBER
        ws.cell(total_row, col).border = THIN
    note = total_row + 2
    ws.merge_cells(start_row=note, start_column=1, end_row=note, end_column=10)
    ws.cell(
        note,
        1,
        "Rank is by count of motorcyclists killed. It is not a ranking of risk. FARS has no miles ridden, so a larger count often follows a larger riding population.",
    ).font = FONT_SMALL
    _widths(ws, [24, 12, 14, 18, 16, 22, 14, 18, 18, 16])
    ws.auto_filter.ref = f"A1:J{end}"
    ws.freeze_panes = "B2"
    ws.print_title_rows = "1:1"
    ws.page_setup.orientation = "landscape"


def _write_hours(ws, last: int) -> None:
    _prepare(ws, "Hours", landscape=True)
    ws["A1"] = "Hour"
    ws["B1"] = "Deaths"
    ws["C1"] = "NCSA day part"
    for col in range(1, 4):
        ws.cell(1, col).font = FONT_HEAD
        ws.cell(1, col).fill = FILL_INK
    for hour in range(24):
        row = hour + 2
        label = f"{hour:02d}:00"
        ws.cell(row, 1, label).font = FONT_BODY
        # ISNUMBER keeps a blank unknown hour from counting as 0. Excel COUNTIF treats blanks as zero.
        ws.cell(
            row,
            2,
            f'=SUMPRODUCT((Deaths!$F$2:$F${last}={hour})*(ISNUMBER(Deaths!$F$2:$F${last})))',
        ).font = FONT_BODY
        ws.cell(row, 2).number_format = "#,##0"
        part = "Daytime" if 6 <= hour <= 17 else "Nighttime"
        ws.cell(row, 3, part).font = FONT_BODY
        for col in range(1, 4):
            ws.cell(row, col).border = THIN
            ws.cell(row, col).fill = FILL_CREAM if part == "Daytime" else FILL_WHITE
    ws["A26"] = "Unknown"
    ws["B26"] = f'=COUNTIF(Deaths!$D$2:$D${last},"Unknown")'
    ws["C26"] = "Hour missing or 99"
    for col in range(1, 4):
        ws.cell(26, col).font = FONT_LABEL
        ws.cell(26, col).fill = FILL_AMBER
        ws.cell(26, col).border = THIN
    ws["B26"].number_format = "#,##0"
    chart = BarChart()
    chart.type = "col"
    chart.title = "Motorcyclists killed by hour"
    chart.y_axis.title = "Deaths"
    chart.x_axis.title = None
    data = Reference(ws, min_col=2, min_row=1, max_row=25)
    cats = Reference(ws, min_col=1, min_row=2, max_row=25)
    chart.add_data(data, titles_from_data=True)
    chart.set_categories(cats)
    chart.shape = 4
    chart.legend = None
    chart.dataLabels = DataLabelList()
    chart.y_axis.majorGridlines = None
    chart.style = 10
    chart.width = 24
    chart.height = 8
    ws.add_chart(chart, "E2")
    _widths(ws, [14, 12, 22])
    ws.freeze_panes = "A2"
    ws.sheet_properties.tabColor = "1F4D3A"


def _write_deaths(ws, deaths: list[dict]) -> None:
    _prepare(ws, "Deaths", landscape=True)
    headers = [label for _, label in DEATH_FIELDS]
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(1, col, header)
        cell.font = FONT_HEAD
        cell.fill = FILL_INK
        cell.alignment = Alignment(wrap_text=True, vertical="center")
    ws.row_dimensions[1].height = 30
    for row_index, record in enumerate(deaths, start=2):
        for col, (field, _) in enumerate(DEATH_FIELDS, start=1):
            value = record[field]
            cell = ws.cell(row_index, col, value)
            cell.font = FONT_BODY
            cell.border = THIN
            if field == "st_case" and value is not None:
                cell.number_format = "0"
            if row_index % 2 == 0:
                cell.fill = FILL_CREAM
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{max(len(deaths) + 1, 2)}"
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(DEATH_FIELDS))}{len(deaths) + 1}"
    widths = [22, 14, 26, 14, 14, 10, 14, 14, 14, 14, 20, 42, 14, 14, 28]
    _widths(ws, widths)
    ws.page_setup.fitToWidth = 1
    ws.print_title_rows = "1:1"
    ws.sheet_view.zoomScale = 110


def _write_dictionary(ws, dictionary: list[dict]) -> None:
    _prepare(ws, "Dictionary", landscape=True)
    headers = ["List", "Code", "Label", "Group or note"]
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(1, col, header)
        cell.font = FONT_HEAD
        cell.fill = FILL_INK
    for index, row in enumerate(dictionary, start=2):
        values = [row["list_name"], row["code"], row["label"], row["note"]]
        for col, value in enumerate(values, start=1):
            cell = ws.cell(index, col, value)
            cell.font = FONT_BODY
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            cell.border = THIN
            if index % 2 == 0:
                cell.fill = FILL_CREAM
    ws.auto_filter.ref = f"A1:D{max(len(dictionary) + 1, 2)}"
    ws.freeze_panes = "A2"
    _widths(ws, [18, 14, 62, 55])
    ws.page_setup.fitToWidth = 1


def _write_checks(ws) -> None:
    _prepare(ws, "Checks")
    ws.freeze_panes = "A6"
    ws.merge_cells("A1:B1")
    ws["A1"] = "How to audit this workbook"
    ws["A1"].font = FONT_TITLE
    lines = [
        "Open the Summary sheet and confirm every Audit cell reads Match. That means the Excel formulas agree with the DuckDB warehouse.",
        "The Deaths sheet is one row per motorcyclist killed. Filters on that sheet are the source for every COUNTIF and COUNTIFS formula.",
        "The States sheet does not paste state totals. Each count is a COUNTIFS against Deaths, and the rank is Excel's RANK.",
        "The Hours sheet counts numeric hours with SUMPRODUCT and ISNUMBER, so a blank unknown hour is not treated as midnight. Unknown hour is counted from the Time of day column.",
        "If you edit a death row, Summary column D should switch from Match to Check for the metric you changed. Column C stays at the original warehouse total.",
        "Do not add a column of miles ridden and divide. This file does not contain exposure, and a death count divided by a made-up denominator would be a new claim.",
    ]
    for index, line in enumerate(lines, start=3):
        ws.merge_cells(start_row=index, start_column=1, end_row=index, end_column=2)
        ws.cell(index, 1, line).font = FONT_BODY
        ws.cell(index, 1).alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[index].height = 36
    ws.column_dimensions["A"].width = 40
    ws.column_dimensions["B"].width = 80
    ws.sheet_properties.tabColor = FOREST
