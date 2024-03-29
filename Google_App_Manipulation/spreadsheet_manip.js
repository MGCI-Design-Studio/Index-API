// Requires:
// util.js
// properties_manip.js

class SheetClass {
    constructor(sheet, range, values, format) {
        this.sheet = sheet;

        if (range !== null) {
            this.values = range.getValues();
            this.format = range.getRichTextValues();
        } else {
            this.values = values;
            this.format = format;
        }
    }

    setValues(cell, value) {
        checkHeight(this.values, this.format, cell);
        this.values[cell[0] - 1][cell[1] - 1] = value;
        if (this.format != null) this.format[cell[0] - 1][cell[1] - 1] = [0, 0, 0, 0, 0, 0, 1]

        setSSValues(this.sheet, cell, value).then(r => console.log("value at " + cell + " set as : " + value));
        return value;
    }

    setRichValue(cell, text, value, is_rtv = false) {
        if (text == null) {
            text = "";
        }
        checkHeight(this.values, this.format, cell);
        let RTV;
        if (is_rtv) {
            if (typeof text != "string") {
                RTV = SheetClass.JSONtoRichValue(text.toString(), [[0, 0, 0, "Jetbrains Mono", 0, "0", 1]]);
            }
            else{
                console.log("RTV is: " + text);
                RTV = value;
            }
        } else {
            RTV = SheetClass.JSONtoRichValue(text.toString(), value);
        }

        setRTValues(this.sheet, cell, RTV).then();

        if (this.format != null && is_rtv) {
            this.format[cell[0] - 1][cell[1] - 1] = SheetClass.richValueToJSON(text.toString(), RTV)[1];
        }
        else if (this.format != null && !is_rtv) {
            this.format[cell[0] - 1][cell[1] - 1] = value;
        }
        this.values[cell[0] - 1][cell[1] - 1] = text;

        return text;
    }

    static richValueToJSON(text, value) {
        const runs = value.getRuns();
        const json = [text, []];
        runs.forEach(run => {
            let runTS = run.getTextStyle();
            let TS = 1;

            if (runTS.isBold()) TS *= 2;
            if (runTS.isItalic()) TS *= 3;
            if (runTS.isStrikethrough()) TS *= 5;
            if (runTS.isUnderline()) TS *= 7;

            let color = runTS.getForegroundColorObject() == null ? "0" : runTS.getForegroundColorObject().asRgbColor().asHexString();

            let runArray = [run.getStartIndex(),
                run.getEndIndex(),
                // If the run has a link
                run.getLinkUrl() == null ? 0 : run.getLinkUrl(),
                runTS.getFontFamily() == null ? 0 : runTS.getFontFamily(),
                runTS.getFontSize() == null ? 0 : runTS.getFontSize(),
                color,
                TS];

            if (runArray) {
                json[1].push(runArray);
            }
        });
        return json;
    }

    static JSONtoRichValue(text, json) {
        if (text == null){
            text = "";
        }
        let richValue = SpreadsheetApp.newRichTextValue().setText(text.toString());

        if (json != null) {
            json.forEach(run => {
                // If the run has a link
                if (run[2] !== 0) richValue = richValue.setLinkUrl(run[0], run[1], run[2]);

                // Checks if any text style is applied
                if (run[3] !== 0 && run[4] !== 0 && run[5] !== "0" && run[6] !== 1) {

                    let TS = SpreadsheetApp.newTextStyle();
                    // Font Family
                    if (run[3] !== 0) TS = TS.setFontFamily(run[3]);
                    // Font Size
                    if (run[4] !== 0) TS.setFontSize(run[4]);

                    richValue = richValue.setTextStyle(run[0], run[1],
                        TS.setForegroundColor(run[5])
                        .setBold(run[6] % 2 === 0)
                        .setItalic(run[6] % 3 === 0)
                        .setStrikethrough(run[6] % 5 === 0)
                        .setUnderline(run[6] % 7 === 0)
                        .build());
                }
            });
        }
        return richValue.build();
    }
}

async function setSSValues(sheet, cell, value) {
    sheet.getRange(cell[0], cell[1], 1, 1).setValue(value);
}

async function setRTValues(sheet, cell, value) {
    sheet.getRange(cell[0], cell[1], 1, 1).setRichTextValue(value);
}

// Turns the grabbed files into the JSON used to store
function formatToJSON(format, values, formatRTV = false) {
    let grid = [];
    let rowN = 0;

    values.forEach((row, row_index) => {

        const isEmpty = row.every(function (a) {
            return a == null || a === "";
        });
        if (isEmpty) rowN++;
        else {
            if (rowN !== 0) {
                grid.push(["◊", rowN, row.length]);
                rowN = 0;
            }
            let gridRow = [];
            let columnN = 0;

            row.forEach((cell, column_index) => {
                if (cell === "" || cell === '' || cell == null) {
                    columnN++;
                } else {
                    if (columnN !== 0) {
                        gridRow.push(columnN);
                        columnN = 0;
                    }

                    // Checks if the cell is a rich text value
                    if (formatRTV) {
                        if (format[row_index][column_index] !== null || format[row_index][column_index] !== "") {
                            gridRow.push(SheetClass.richValueToJSON(cell, format[row_index][column_index]));
                        }
                        // Else it pushes the value of the cell
                        else gridRow.push([cell.toString(), [[0, 0, 0, 0, 0, "0", 1]]]);
                    } else {
                        if (format[row_index][column_index] !== null || format[row_index][column_index] !== "") {
                            gridRow.push([cell.toString(), format[row_index][column_index]]);
                        }
                        // Else it pushes the value of the cell
                        else gridRow.push([cell.toString(), [[0, 0, 0, 0, 0, "0", 1]]]);
                    }
                }
            });
            if (columnN !== 0) {
                gridRow.push(columnN);
            }
            grid.push(gridRow);
        }
    });
    if (rowN !== 0) {
        grid.push([rowN, values[0].length]);
    }
    return grid;
}