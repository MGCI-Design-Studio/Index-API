// Requires:
// util.js
// properties_manip.js

function findTicketsFromSpread(scriptProperties, panel, home) {
    const non_tickets = SS_INFO.getRange(2, 1, 1, 1).getValue().split("::");

    let sheets = SPREAD.getSheets();
    let section_tickets = [];
    sheets.forEach((sheet) => {
        if (!non_tickets.includes(sheet.getName())) {
            // If the ticket is of the right ticketing system
            if (sheet.getRange(1, 1, 1, 1).getValue().includes(panel)) {
                section_tickets.push(sheet.getName());
            }
        }
    });
    console.log("Found Tickets are: " + section_tickets);
    saveValue(scriptProperties, home + "_tickets", section_tickets)
        .then(r => console.log("Tickets Uploaded"));

    return section_tickets;
}

function findAllTickets(scriptProperties, panels) {
    let panel_item_names = SS_INFO.getRange(3, 1, 1, 1).getValue().split("::");
    const non_tickets = SS_INFO.getRange(2, 1, 1, 1).getValue().split("::");
    let sheets = SPREAD.getSheets();

    for (let i = 0; i < panel_item_names.length; i++) {
        let section_tickets = [];
        sheets.forEach((sheet) => {
            if (!non_tickets.includes(sheet.getName())) {
                // If the ticket is of the right ticketing system
                if (sheet.getRange(1, 1, 1, 1).getValue().includes(panel_item_names[i])) {
                    section_tickets.push(sheet.getName());
                }
            }
        });
        console.log("Found Tickets are: " + section_tickets);
        saveValue(scriptProperties, panels[i] + "_tickets", section_tickets)
            .then(r => console.log("Tickets Uploaded"));
    }
}

function findTickets(scriptProperties, ticket, home) {
    let tickets;
    try {
        let tickets_data = unpackProperties(scriptProperties.getProperty(home + "_tickets"));
        if (tickets_data === null) {
            tickets = findTicketsFromSpread(scriptProperties, ticket, home);
        } else {
            tickets = tickets_data;
        }
    } catch (err) {
        console.log(err);
        tickets = findTicketsFromSpread(scriptProperties, ticket, home);
    }

    return tickets;
}

function findTicketById(home_class, home_n, sub_cell, text){
    for (let i = home_n[0]; i < home_class.values.length; i++) {
        if (home_class.values[i][home_n[1] - 1].toString() === text.toString()) {
            return([home_class.format[i][sub_cell[1] - 1], i]);
        }
    }
    return [null, -1];
}