function find_num_categories(values) {
    if (!values.includes("")) {
        if (!values.includes(null)) {
            return (values.length);
        }
        return (values.indexOf(null) + 1);
    }
    return (values.indexOf("") + 1)
}

function row_indexer(part, row) {
    if (row.includes(part)) {
        return row.indexOf(part);
    }
    return -1;
}

function column_indexer(part, sheet, column) {
    for (let i = 0; i < sheet.length; i++) {
        if (sheet[i][column] != null && sheet[i][column].includes(part)) {
            return i;
        }
    }
    return -1;
}

function sheet_indexer(part, sheet, offset=1) {
    for (let i = 0; i < sheet.length; i++) {
        if (sheet[i].includes(part)) {
            return [i + offset, sheet[i].indexOf(part) + offset];
        }
    }
    return [-1, -1];
}

function checkWidth(values, format, cell) {
    if (values[0].length <= cell[1]) {
        for (let j = 0; j <= cell[1] - values[0].length; j++) {
            for (let i = 0; i < values.length; i++) {
                values[i].push(null);
                format[i].push(null);
            }
        }
    }
    return [values, format];
}

function checkHeight(values, format, cell) {
    if (values.length <= cell[0]) {
        for (let j = 0; j <= cell[0] - values.length; j++) {
            let valueRow = [];
            for (let i = 0; i < values[0].length; i++) {
                valueRow.push(null)
            }
            values.push(valueRow);
            format.push(valueRow);
        }
    }
    return [values, format];
}

function parseUserRange(range){
    if (typeof range === "string"){
        const output = new Set();
        const split_range = range.split(",");
        split_range.forEach(item => {
            item = item.trim();
            if (item.includes("-")){
                const split_item = item.split("-");
                if (split_item.length !== 2){
                    throw "ERROR: Range had an invalid dash in parseUserRange"
                }
                const start = parseInt(split_item[0]);
                const end = parseInt(split_item[1]);
                if (Number.isNaN(start) || Number.isNaN(end)){
                    throw "ERROR: Range had invalid numbers in parseUserRange"
                }
                for (let i = start; i <= end; i++){
                    output.add(i);
                }
            }
            else{
                const num = parseInt(item);
                if (Number.isNaN(num)){
                    throw "ERROR: Range had an invalid number in parseUserRange"
                }
                output.add(num);
            }
        });
        return output;
    }
    throw "ERROR: Range was not of type String in parseUserRange"
}