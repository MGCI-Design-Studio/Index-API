// Turns compressed array into the JSON used for the code
function JSONToFormat(compressed) {
    let format = [];
    let values = [];
    compressed.forEach(row => {
        let formatRow = [];
        let valueRow = [];

        if (row[0] === '◊') {
            for (let i = 0; i < row[1]; i++) {
                for (let j = 0; j < row[2]; j++) {
                    valueRow.push(null);
                }
                format.push(valueRow);
                values.push(valueRow);

                formatRow = [];
                valueRow = [];
            }
        } else {
            row.forEach(cell => {
                if (Number.isInteger(cell)) {
                    for (let i = 0; i < cell; i++) {
                        formatRow.push(null);
                        valueRow.push(null);
                    }
                } else {
                    if (typeof cell === 'string') {
                        valueRow.push(cell);
                        formatRow.push([[0, 0, 0, 0, "0", 1]])
                    } else {
                        valueRow.push(cell[0]);
                        formatRow.push(cell[1]);
                    }
                }
            });
            format.push(formatRow);
            values.push(valueRow);
        }
    });
    return [values, format];
}