// TODO:
// Add in the possiblity for submitting images, files, and videos to the form
// Create an update_ticket method

const TICKET_SPREADSHEET_ID = "1UzUPH0S1dvv3oP_y40rfRDnmOj4S6oGpWwRXd8JLCj0";
const SPREAD = SpreadsheetApp.openById(TICKET_SPREADSHEET_ID);
const SS_INFO = SPREAD.getSheetByName("Spreadsheet Info");
let HOME_SHEET_NAME;
let TEMPLATE_SHEET_NAME;
let SUBJECT_CELL;

function setHomeSheetName(home) {
    if (home !== false) {
        HOME_SHEET_NAME = home;
    }
}

// Resets All Stored Data
function resetProps() {
    const scriptProperties = PropertiesService.getScriptProperties();
    console.log(scriptProperties.getProperties());
    scriptProperties.deleteAllProperties();
}

// Creates a dialog box in the Spreadsheet
// The user will then input a string
// This string is then passed into createEmpty()
async function createEmptyUI() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.prompt(
        'Sheet Name:',
        ui.ButtonSet.OK_CANCEL);

    // Process the user's response.
    const button = result.getSelectedButton();
    const text = result.getResponseText();

    if (button === ui.Button.OK) {
        await createEmptyHandler(text, TEMPLATE_SHEET_NAME, HOME_SHEET_NAME);
    }
}

// Creates an empty ticket with the given name
async function createEmptyHandler(name, template_sheet, home = false) {
    setHomeSheetName(home);
    const template = SPREAD.getSheetByName(template_sheet);
    const sheet = template.copyTo(SPREAD);

    let unique_name = false;
    let counter = 0;

    // Attempts to rename the sheet with the name parameter
    // If the name already exists, GAS will throw an error, and we will add a number to the end of it
    while (!unique_name) {
        try {
            // If the original name is unique, we add no number
            if (counter === 0) {
                sheet.setName(name);
            } else {
                sheet.setName(name + counter);
            }
            unique_name = true;
        } catch (err) {
            counter++;
        }
    }

    // Un-hides the sheet
    sheet.showSheet();

    // Publishes the ticket to display on the home page
    await publishTicketHandler(["___SET-SUBJECT___", sheet]);
}

// Function to publish all tickets
// Simply calls the publishTicketHandler() method with the required parameters
async function publishAll(panel, home = false) {
    setHomeSheetName(home);
    await publishTicketHandler(["___ALL___", panel]);
}

// Publishes the currently active ticket
async function publishOneActive() {
    const TICKET = SPREAD.getActiveSheet();
    const TICKET_RANGE = TICKET.getDataRange();
    const TICKET_CLASS = new SheetClass(TICKET, TICKET_RANGE);
    await publishTicketHandler([TICKET_CLASS]);
}

async function publishOne(ticket, home = false) {
    setHomeSheetName(home);
    const TICKET = SPREAD.getSheetByName(ticket);
    const TICKET_RANGE = TICKET.getDataRange();
    const TICKET_CLASS = new SheetClass(TICKET, TICKET_RANGE);
    await publishTicketHandler([TICKET_CLASS]);
}

// Does the required prep-work before calling the publishTicket() method
async function publishTicketHandler(tickets) {
    // Sets the config sheet and home sheet
    // Attempts to grab them from storage, and if not found, creates them
    const raw_config = SPREAD.getSheetByName(HOME_SHEET_NAME + " Config");
    const home = SPREAD.getSheetByName(HOME_SHEET_NAME);

    const scriptProperties = PropertiesService.getScriptProperties();
    const raw_sheets = home_builder(scriptProperties, home, HOME_SHEET_NAME, raw_config);

    let home_class = raw_sheets[0];
    let config = raw_sheets[1];
    let setting = null;

    console.log(config.sections);

    // The Subject cell of the home page
    SUBJECT_CELL = sheet_indexer(config.sections[0], home_class.values);

    // If called from PublishAll
    // Finds all the tickets connected to that home page, and publishes them
    if (tickets[0] === "___ALL___") {
        setting = tickets[0];

        // A variable to store the coordinates of the priority section
        const PRIORITY_CELL = sheet_indexer(config.priority_title, home_class.values);

        // Deletes the priority section as otherwise it might lead to confusion
        // The main ticket section is not deleted
        // as it is easier to assume that more tickets were added, rather than deleted
        new Promise(function (resolve) {
            resolve(home_class.sheet.getRange(PRIORITY_CELL[0] + 2, PRIORITY_CELL[1], config.max, config.priority_list.length).clearContent());
        });

        for (let i = 1; i < home_class.values.length - PRIORITY_CELL[0]; i++) {
            for (let j = 0; j < config.priority_list.length; j++) {
                home_class.format[PRIORITY_CELL[0] + i][PRIORITY_CELL[1] + j - 1] = null;
                home_class.values[PRIORITY_CELL[0] + i][PRIORITY_CELL[1] + j - 1] = null;
            }
        }

        // Config values reset
        config.set_config_value("Total Saved Tickets", 0);
        config.set_config_value("Current Active Tickets", 0);

        const cell = config.values["Current Priority Tickets"];
        let zero_array = [];
        for (let i = 0; i < config.priority_tickets.length; i++) {
            cell[1](0, i);
            zero_array.push([0]);
        }
        new Promise(function (resolve) {
            resolve(config.sheet.getRange(2, cell[0] + 1, config.priority_tickets.length, 1).setValues(zero_array));
        });

        // Tickets are found
        tickets = findTickets(scriptProperties, tickets[1], HOME_SHEET_NAME);

        // Tickets are published using a promise array
        for (let i = 0; i < tickets.length; i++) {
            let ticket = tickets[i];
            tickets[i] = new Promise(function (resolve) {
                const sheet = SPREAD.getSheetByName(ticket);
                const sheet_range = sheet.getDataRange();
                resolve(new SheetClass(sheet, sheet_range));
            }).then(r => {
                publishTicket(config, r, home_class, config.max, setting);
            });
        }
    }

    // If called from CreateEmpty
    if (tickets[0] === "___SET-SUBJECT___") {
        // Creates ticket_class and sets the subject cell of the ticket
        const ticket_range = tickets[1].getDataRange();
        const ticket_class = new SheetClass(tickets[1], null, ticket_range.getValues(), ticket_range.getRichTextValues());
        const TICKET_SUBJECT_CELL = sheet_indexer(config.sections[0], ticket_class.values);
        ticket_class.setValues([TICKET_SUBJECT_CELL[0] + 1, TICKET_SUBJECT_CELL[1]], tickets[1].getName());

        // Adds the ticket to the list of saved tickets
        const panels = SS_INFO.getRange(1, 1, 1, 1).getValue().split("::");
        const PANEL_ITEM_NAMES = SS_INFO.getRange(3, 1, 1, 1).getValue().split("::");

        // Finds the tickets already saved
        let saved_tickets = findTickets(scriptProperties, PANEL_ITEM_NAMES[panels.indexOf(HOME_SHEET_NAME)], HOME_SHEET_NAME);
        if (!saved_tickets.includes(tickets[1].getName())) {
            saved_tickets.push(tickets[1].getName());
        }

        saveValue(scriptProperties, HOME_SHEET_NAME + "_tickets", saved_tickets)
            .then(r => console.log("Tickets Uploaded"));

        // Sets the tickets array to the ticket_class to publish
        tickets = [ticket_class];
    }

    // For loops through the ticket array
    // If the ticket is a promise, it awaits it
    // Otherwise, it publishes the ticket
    for (const ticket of tickets) {
        if (typeof ticket === "object" && typeof ticket.then === "function") {
            await ticket;
        } else {
            publishTicket(config, ticket, home_class, config.max, setting);
        }
    }

    SpreadsheetApp.flush();

    // Uploads all values to storage
    await scriptProperties.setProperty(HOME_SHEET_NAME, packProperties({
        "values": formatToJSON(home_class.format, home_class.values, false),
        "config": config.toJSON(),
    }));

    console.log("Publish Properties Set");
}

// MAIN TICKET PUBLISHING METHOD
function publishTicket(config, sheet_class, home_class, max, setting, home_sheet) {
    // Config Values
    let int_sec_cell = sheet_indexer(config.internal_sec, sheet_class.values);
    let priority;

    // A bool to check if the ticket is already existing
    let existing = true;

    // If the internal section is not found, throw an error
    if (int_sec_cell[0] === 0 && int_sec_cell[1] === 0) {
        throw "Internal Section Not Found";
    }

    const int_category = [];
    const int_item = [];

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

            // Normally checks if the format and values have an incongruity, that is values has a value but format doesn't
            // This is fixed from the sanitization in SheetClass
            //
            // if (sheet_class.values[fil_sec_cell[0] + i - 1][fil_sec_cell[1] - 1] == null) {
            //     item = item.copy().setText(sheet_class.values[fil_sec_cell[0] + i - 1][fil_sec_cell[1] - 1]).build();
            // }

            if (category.includes("Priority")) {
                priority = item;
            }

            let cat_pos = row_indexer(category, cat_row);

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
        deletePriority(config, home_class, config.priority_list, priority_cell, "#gid=" + sheet_class.sheet.getSheetId(), max);
    }

    if (!config.priority_exclusion.includes(sheet_class.values[int_status[0] - 1][int_status[1] - 1])) {
        const cur_pri_tick = config.current_priority_tickets(priority_index, 1);

        home_class.setRichValue([priority_cell[0] + cur_pri_tick + 2, priority_cell[1] + priority_index],
            sheet_class.values[subject[0]][subject[1] - 1], sheet_name);
    }
}

async function updateTicketHandler(text = null, settings = "__FIND_DIFFERENCES__", home = false) {
    setHomeSheetName(home);
    const scriptProperties = PropertiesService.getScriptProperties();
    const raw_config = SPREAD.getSheetByName(HOME_SHEET_NAME + " Config");
    const home_raw = SPREAD.getSheetByName(HOME_SHEET_NAME);

    const raw_sheets = home_builder(scriptProperties, home_raw, HOME_SHEET_NAME, raw_config);
    let old_home_class = raw_sheets[0];
    const config = raw_sheets[1];

    const home_range = home_raw.getDataRange();
    const raw_values = JSONToFormat(formatToJSON(home_range.getRichTextValues(), home_range.getValues(), true));
    const home_class = new SheetClass(home, null, raw_values[0], raw_values[1]);

    // The Subject cell and header row of the home page
    SUBJECT_CELL = sheet_indexer(config.sections[0], home_class.values);
    const HEAD_VALUES = home_class.values[SUBJECT_CELL[0] - 1];
    const NUM_CATEGORIES = find_num_categories(HEAD_VALUES);
    const HOME_N = sheet_indexer(config.sheet_n, home_class.values);

    // The Subject cell and header row of the saved home page
    const OLD_SUBJECT_CELL = sheet_indexer(config.sections[0], old_home_class.values);
    const OLD_HEAD_VALUES = old_home_class.values[OLD_SUBJECT_CELL[0] - 1];

    let tickets = new Set();

    if (settings === "__FIND_DIFFERENCES__") {
        let row = [];

        for (let j = SUBJECT_CELL[0]; j < home_class.values.length; j++) {
            const cell = column_indexer(home_class.values[j][SUBJECT_CELL[1] - 1], old_home_class.values, OLD_SUBJECT_CELL[1] - 1);
            row.push(cell);
        }

        for (let i = SUBJECT_CELL[1]; i < NUM_CATEGORIES; i++){
            const category = row_indexer(HEAD_VALUES[i], OLD_HEAD_VALUES);
            for (let j = SUBJECT_CELL[0]; j < home_class.values.length; j++) {
                if (row[j - SUBJECT_CELL[0]] === -1){
                    deleteTicket(config, old_home_class, home_class.values[j][HOME_N[1] - 1]);
                }
                else if (!tickets.has(j)) {
                    if (home_class.values[j][i] == null && old_home_class.values[row[j - SUBJECT_CELL[0]]][category] == null) {

                    }
                    else if ((home_class.values[j][i] == null) ^ (old_home_class.values[row[j - SUBJECT_CELL[0]]][category] == null)) {
                        tickets.add(j);
                    }
                    else if (home_class.values[j][i].toString() !== old_home_class.values[row[j - SUBJECT_CELL[0]]][category].toString()) {
                        tickets.add(j);
                    }
                }
            }
        }

        old_home_class = home_class;
    }
    else if (settings === "__TICKET__"){
        const ticket_ids = parseUserRange(text);

        for (const id of ticket_ids){
            const old_row = findTicketById(old_home_class, HOME_N, SUBJECT_CELL, id)[1];
            if (old_row !== -1) {
                const new_row = findTicketById(home_class, HOME_N, SUBJECT_CELL, id)[1];
                if (new_row === -1) {
                    deleteTicket(config, old_home_class, id);
                }
                else {
                    for (let i = SUBJECT_CELL[1]; i < NUM_CATEGORIES; i++) {
                        const category = row_indexer(HEAD_VALUES[i], OLD_HEAD_VALUES);
                        old_home_class.values[new_row][i] = home_class.values[old_row][category];
                        old_home_class.format[new_row][i] = home_class.format[old_row][category];
                    }
                    tickets.add(new_row);
                }
            }
        }
    }
    else {
        throw "ERROR: Invalid Settings given in Update Ticket Handler"
    }

    console.log("TO UPDATE TICKETS:")
    console.log([...tickets].join(' '));

    updateTicket(tickets, home_class, HEAD_VALUES);
    SpreadsheetApp.flush();

    await scriptProperties.setProperty(HOME_SHEET_NAME, packProperties({
        "values": formatToJSON(old_home_class.format, old_home_class.values, false),
        "config": config.toJSON(),
    }));

    return "Function Run Successfully";
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

async function deleteTicketHandler(text = null, home = false) {
    setHomeSheetName(home);
    const scriptProperties = PropertiesService.getScriptProperties();
    const raw_config = SPREAD.getSheetByName(HOME_SHEET_NAME + " Config");
    const home_raw = SPREAD.getSheetByName(HOME_SHEET_NAME);
    const raw_sheets = home_builder(scriptProperties, home_raw, HOME_SHEET_NAME, raw_config);

    let home_class = raw_sheets[0];
    let config = raw_sheets[1];

    // The Subject cell of the home page
    SUBJECT_CELL = sheet_indexer(config.sections[0], home_class.values);

    if (text == null) {
        const ui = SpreadsheetApp.getUi();
        const result = ui.prompt(
            config.sheet_n,
            ui.ButtonSet.OK_CANCEL);

        // Process the user's response.
        const button = result.getSelectedButton();

        if (button === ui.Button.OK) {
            text = result.getResponseText();
        }
    }
    deleteTicket(config, home_class, text);

    await scriptProperties.setProperty(HOME_SHEET_NAME, packProperties({
        "values": formatToJSON(home_class.format, home_class.values, false),
        "config": config.toJSON(),
    }));

    return "Function Run Successfully";
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

            deletePriority(config, home_class, priority_cell, link[j][2], config.max)
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

function deletePriority(config, home_class, priority_cell, link, max) {
    for (let i = 2; i < home_class.values.length - priority_cell; i++) {
        for (let j = -1; j < config.priority_list.length; j++) {
            let checkCell = home_class.format[priority_cell[0] + i - 1][priority_cell[1] + j - 1];
            if (checkCell != null && checkCell !== "") {
                for (let k = 0; k < checkCell.length; k++) {
                    if (checkCell[k][2] === link) {
                        home_class.sheet.getRange(priority_cell[0] + i, priority_cell[1] + j, 1, 1).deleteCells(SpreadsheetApp.Dimension.ROWS);

                        for (let temp_row = priority_cell[0] + i - 1; temp_row < home_class.values.length - 1; temp_row++) {
                            home_class.format[temp_row][priority_cell[1] + j - 1] = home_class.format[temp_row + 1][priority_cell[1] + j - 1];
                            home_class.values[temp_row][priority_cell[1] + j - 1] = home_class.values[temp_row + 1][priority_cell[1] + j - 1];
                        }
                        config.current_priority_tickets(j, -1);
                        i = max;
                        j = config.priority_list.length;
                    }
                }
            }
        }
    }
}