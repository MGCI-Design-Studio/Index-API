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
    return await publishTicketHandler(["___SET-SUBJECT___", sheet]);
}

// Function to publish all tickets
// Simply calls the publishTicketHandler() method with the required parameters
async function publishAll(panel, home = false) {
    setHomeSheetName(home);
    return await publishTicketHandler(["___ALL___", panel]);
}

// Publishes the currently active ticket
async function publishOneActive() {
    const TICKET = SPREAD.getActiveSheet();
    const TICKET_RANGE = TICKET.getDataRange();
    const TICKET_CLASS = new SheetClass(TICKET, TICKET_RANGE);
    return await publishTicketHandler([TICKET_CLASS]);
}

async function publishOne(ticket, home = false) {
    setHomeSheetName(home);
    const TICKET = SPREAD.getSheetByName(ticket);
    const TICKET_RANGE = TICKET.getDataRange();
    const TICKET_CLASS = new SheetClass(TICKET, TICKET_RANGE);
    return await publishTicketHandler([TICKET_CLASS]);
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
    return true;
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

function deletePriority(config, home_class, priority_cell, link, max) {
    // Starts checking cells 2 below the title cell
    for (let i = 2; i < home_class.values.length - priority_cell; i++) {
        // Checks the range of priorities left to right
        for (let j = -1; j < config.priority_list.length; j++) {
            let checkCell = home_class.format[priority_cell[0] + i - 1][priority_cell[1] + j - 1]; // Grabs the cell
            if (checkCell != null && checkCell !== "") { // Checks if the cell has nothing in it
                // Loops through the RTV runs (GAS)
                for (let k = 0; k < checkCell.length; k++) {
                    if (checkCell[k][2] === link) { // If that specific run has the link, deletes it
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