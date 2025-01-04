/*
 File containing main CRUD methods
 - Publish Ticket
 - Read off the spreadsheet
 - Update Ticket
 - Delete Ticket
 */


function publishTicket(config, sheet_class, home_class, max, setting, home_sheet) {
    // Config Values
    let int_sec_cell = sheet_indexer(config.internal_sec, sheet_class.values);
    let priority;
    const int_category = [], int_item = [];
    let existing = true; // A bool to check if the ticket is already existing

    // If the internal section is not found, throw an error
    if (int_sec_cell[0] === 0 && int_sec_cell[1] === 0) {
        throw "Internal Section Not Found";
    }

    // loops through all internal categories
    // Grabs the category and item names
    for (let i = 0; i < sheet_class.values.length - int_sec_cell[0]; i++) {
        let temp_category = sheet_class.values[int_sec_cell[0] + i][int_sec_cell[1] - 2];
        if (temp_category == null) {
            break;
        }

        int_category.push(temp_category);
        int_item.push(sheet_class.values[int_sec_cell[0] + i][int_sec_cell[1] - 1])
    }

    // Finds the status item
    const int_status = [int_sec_cell[0] + int_category.indexOf(config.status) + 1, int_sec_cell[1]]

    // Auto-publishes the ticket if the status is set to the first category
    if (int_category.includes(config.status) && int_item.includes(config.status_categories[0]) && config.auto_publish) {
        sheet_class.setValues(int_status, config.status_categories[1]);
    }

    // If a ticket # is already set, it checks sets num to that value
    // Else it assumes the ticket is not existing and updates config values
    if (int_category.includes(config.sheet_n)) {
        const num = sheet_class.values[int_sec_cell[0] + int_category.indexOf(config.sheet_n)][int_sec_cell[1] - 1];
        if (num == null || setting === "___ALL___") {
            existing = false;
            sheet_class.setValues([int_sec_cell[0] + int_category.indexOf(config.sheet_n) + 1, int_sec_cell[1]], config.total_tickets + 1);
            config.set_config_value("Total Saved Tickets", config.total_tickets + 1);
        }
    }

    // If the ticket is existing, it finds the row of the ticket
    if (!existing) {
        config.set_config_value("Current Active Tickets", config.act_sheets + 1);
    } else {
        let existing_row = null;

        for (let i = 0; i < home_class.values.length - SUBJECT_CELL[0]; i++) {
            let link_cell = home_class.format[SUBJECT_CELL[0] + i][SUBJECT_CELL[1] - 1];
            if (link_cell == null || link_cell === "") {
                break;
            } else {
                for (let j = 0; j < link_cell.length; j++) {
                    if (link_cell[j][2].includes(sheet_class.sheet.getSheetId().toString())) {
                        existing_row = 1 + i + SUBJECT_CELL[0];
                        break;
                    }
                }
            }
        }

        if (existing_row != null) {
            config.set_config_value("Current Active Tickets", existing_row - SUBJECT_CELL[0]);
        } else {
            sheet_class.setValues([int_sec_cell[0] + int_category.indexOf(config.sheet_n) + 1, int_sec_cell[1]], config.total_tickets + 1);
            config.set_config_value("Current Active Tickets", config.total_tickets + 1);
            config.set_config_value("Total Saved Tickets", config.total_tickets + 1);
            existing = false;
        }
    }

    const cat_row = home_class.values[SUBJECT_CELL[0] - 1];

    config.filtered_secs.forEach(sec => {
        let fil_sec_cell = sheet_indexer(sec, sheet_class.values);
        console.log(sec);

        for (let i = 0; i < sheet_class.values.length - fil_sec_cell[0]; i++) {
            let category = sheet_class.values[fil_sec_cell[0] + i][fil_sec_cell[1] - 2];
            let item = sheet_class.values[fil_sec_cell[0] + i][fil_sec_cell[1] - 1];
            if (category === "" || category == null) break;

            let cat_pos = row_indexer(category, cat_row);

            // Normally checks if the format and values have an incongruity, that is values has a value but format doesn't
            // This is fixed from the sanitization in SheetClass
            //
            // if (sheet_class.values[fil_sec_cell[0] + i - 1][fil_sec_cell[1] - 1] == null) {
            //     item = item.copy().setText(sheet_class.values[fil_sec_cell[0] + i - 1][fil_sec_cell[1] - 1]).build();
            // }

            if (category.includes("Priority")) {
                priority = item;
            }

            if (cat_pos === -1) {
                cat_pos = find_num_categories(cat_row) - 1;
                checkWidth(home_class.values, home_class.format, [0, cat_pos]);
                home_class.setValues([SUBJECT_CELL[0], cat_pos], category);
                cat_row[cat_pos] = category;
            }
            home_class.setRichValue([SUBJECT_CELL[0] + config.act_sheets, cat_pos + 1],
                item, sheet_class.format[fil_sec_cell[0] + i][fil_sec_cell[1] - 1], true);
        }
    });

    const subject = sheet_indexer(config.sections[0], sheet_class.values);

    // Old Implementation of sheet_name
    //
    // const sheet_name = SpreadsheetApp.newRichTextValue()
    //     .setText(sheet_class.values[subject[0]][subject[1] - 1])
    //     .setLinkUrl("#gid=" + sheet_class.sheet.getSheetId())
    //     .build();

    const sheet_name = [
        [0, sheet_class.values[subject[0]][subject[1] - 1].length, "#gid=" + sheet_class.sheet.getSheetId(), 0, 0, 1]];

    const priority_cell = sheet_indexer(config.priority_title, home_class.values);
    const priority_index = config.priority_list.indexOf(priority);

    home_class.setRichValue([SUBJECT_CELL[0] + config.act_sheets, SUBJECT_CELL[1]],
        sheet_class.values[subject[0]][subject[1] - 1], sheet_name, false);

    if (existing) {
        deletePriority(config, home_class, config.priority_list, priority_cell, "#gid=" + sheet_class.sheet.getSheetId());
    }

    if (!config.priority_exclusion.includes(sheet_class.values[int_status[0] - 1][int_status[1] - 1])) {
        const cur_pri_tick = config.current_priority_tickets(priority_index, 1);
        console.log(cur_pri_tick);
        console.log("PublishTicket: Setting Priority Cell:" + JSON.stringify([priority_cell[0] + cur_pri_tick + 2, priority_cell[1] + priority_index]))
        console.log("PublishTicket: Subject Cell:" + JSON.stringify(subject));
        home_class.setRichValue([priority_cell[0] + cur_pri_tick + 2, priority_cell[1] + priority_index],
            sheet_class.values[subject[0]][subject[1] - 1], sheet_name);
    }

    return true;
}

function updateTicket(tickets, home_class, head){
    for (const ticket of tickets){
        const link = home_class.format[ticket][SUBJECT_CELL[1] - 1];

        for (let j = 0; j < link.length; j++) {
            if (link[j][2] !== 0) {
                const sheet = SPREAD.getSheets().filter(function (s) {
                    return s.getSheetId().toString() === link[j][2].split("gid=")[1];
                })[0];
                const sheet_class = new SheetClass(sheet, sheet.getDataRange());
                const numCat = find_num_categories(head);
                for (let i = SUBJECT_CELL[1]; i < numCat - 1; i++) {
                    const cell = sheet_indexer(head[i], sheet_class.values);
                    // how to get RTV from ticket?
                    sheet_class.setRichValue([cell[0], cell[1] + 1], home_class.values[ticket][i], home_class.format[ticket][i], false);
                }
            }
        }
    }
}

function deleteTicket(config, home_class, text) {
    const home_n = sheet_indexer(config.sheet_n, home_class.values);
    const priority_cell = sheet_indexer(config.priority_title, home_class.values);

    const ticket = findTicketById(home_class, home_n, SUBJECT_CELL, text);
    const link = ticket[0];
    const row = ticket[1];

    for (let j = 0; j < link.length; j++) {
        if (link[j][2] !== 0) {
            const sheet = SPREAD.getSheets().filter(function (s) {
                return s.getSheetId().toString() === link[j][2].split("gid=")[1];
            })[0];

            deletePriority(config, home_class, priority_cell, link[j][2])
            const cat_row = home_class.values[SUBJECT_CELL[0] - 1];

            const last_cat = find_num_categories(cat_row);
            checkWidth(home_class.values, home_class.format, [0, last_cat]);
            home_class.sheet.getRange(row + 1, SUBJECT_CELL[1], 1, last_cat - SUBJECT_CELL[1]).deleteCells(SpreadsheetApp.Dimension.ROWS);

            for (let temp_col = SUBJECT_CELL[1]; temp_col < last_cat; temp_col++) {
                checkHeight(home_class.values, home_class.format, [home_class.values.length, 0]);
                for (let temp_row = row; temp_row < home_class.values.length - 1; temp_row++) {
                    home_class.format[temp_row][temp_col - 1] = home_class.format[temp_row + 1][temp_col - 1];
                    home_class.values[temp_row][temp_col - 1] = home_class.values[temp_row + 1][temp_col - 1];
                }
            }
            home_class.format.pop();
            home_class.values.pop();

            config.set_config_value("Current Active Tickets", config.act_sheets - 1);

            if (sheet != null) {
                const scriptProperties = PropertiesService.getScriptProperties();
                const panel_item_names = SS_INFO.getRange(3, 1, 1, 1).getValue().split("::");
                const panel_names = SS_INFO.getRange(1, 1, 1, 1).getValue().split("::");
                let saved_tickets = findTickets(scriptProperties, panel_names[panel_item_names.indexOf(HOME_SHEET_NAME)]);
                saved_tickets.splice(saved_tickets.indexOf(sheet.getName()));
                saveValue(scriptProperties, HOME_SHEET_NAME + "_tickets", saved_tickets).then(r => console.log(r + "Tickets Uploaded"));

                SPREAD.deleteSheet(sheet);
            }
            SpreadsheetApp.flush();
            return;
        }
    }
}