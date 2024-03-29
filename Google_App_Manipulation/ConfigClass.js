class Config {
    constructor(config, values, isSaved = false) {
        this.sheet = config;
        if (!isSaved) {
            let found_values = [];
            found_values.push(this.find_config_value("Maximum Search Length", values));
            found_values.push(this.find_sections("Priority List", values));
            found_values.push(this.find_config_value("Priority Section Title", values));
            found_values.push(this.find_config_value("Auto Publish", values));
            found_values.push(this.find_sections("Form Section Names", values));
            found_values.push(this.find_sections("Filtered Section Names", values));
            found_values.push(this.find_config_value("Internal Section Name", values));
            found_values.push(this.find_config_value("Internal Sheet Number Title", values));
            found_values.push(this.find_sections("Priority Exclusion", values));
            found_values.push(this.find_sections("Internal Status Naming", values));
            found_values.push(this.find_sections("Current Priority Tickets", values));
            found_values.push(this.find_config_value("Current Active Tickets", values));
            found_values.push(this.find_config_value("Total Saved Tickets", values));

            values = found_values;
        }

        console.log(values);

        this.max = values[0][0];
        this.priority_list = values[1][0];
        this.priority_title = values[2][0];
        this.auto_publish = values[3][0];
        this.sections = values[4][0];
        this.filtered_secs = values[5][0];
        this.internal_sec = values[6][0];
        this.sheet_n = values[7][0];
        this.priority_exclusion = values[8][0];
        this.status_categories = values[9][0];

        this.values = {
            "Maximum Search Length": [values[0][1],
                (value) => {
                    this.max = value;
                }],
            "Priority List": [values[1][1],
                (value) => {
                    this.priority_list = value;
                }],
            "Priority Section Title": [values[2][1],
                (value) => {
                    this.priority_title = value;
                }],
            "Auto Publish": [values[3][1],
                (value) => {
                    this.auto_publish = value;
                }],
            "Form Section Names": [values[4][1],
                (value) => {
                    this.sections = value;
                }],
            "Filtered Section Names": [values[5][1],
                (value) => {
                    this.filtered_secs = value;
                }],
            "Internal Section Name": [values[6][1],
                (value) => {
                    this.internal_sec = value;
                }],
            "Internal Sheet Number Title": [values[7][1],
                (value) => {
                    this.sheet_n = value;
                }],
            "Priority Exclusion": [values[8][1],
                (value) => {
                    this.priority_exclusion = value;
                }],
            "Internal Status Naming": [values[9][1],
                (value) => {
                    this.status_categories = value;
                }],
        }

        if (!isSaved) {
            this.status = this.status_categories[0];
            this.status_categories.shift();
            this.priority_tickets = values[10][0];
            this.act_sheets = values[11][0];
            this.total_tickets = values[12][0];

            this.values["Status"] = [values[9][1],
                (value) => {
                    this.status = value;
                }];
            this.values["Current Priority Tickets"] = [values[10][1],
                (value, ticket) => {
                    this.priority_tickets[ticket] = value;
                }];
            this.values["Current Active Tickets"] = [values[11][1],
                (value) => {
                    this.act_sheets = value;
                }];
            this.values["Total Saved Tickets"] = [values[12][1],
                (value) => {
                    this.total_tickets = value;
                }];
        } else {
            this.status = values[10][0];
            this.priority_tickets = values[11][0];
            this.act_sheets = values[12][0];
            this.total_tickets = values[13][0];

            this.values["Status"] = [values[10][1],
                function (value) {
                    this.status = value
                }];
            this.values["Current Priority Tickets"] = [values[11][1],
                (value, ticket) => {
                    this.priority_tickets[ticket] = value
                }];
            this.values["Current Active Tickets"] = [values[12][1],
                (value) => {
                    this.act_sheets = value
                }];
            this.values["Total Saved Tickets"] = [values[13][1],
                (value) => {
                    this.total_tickets = value
                }];
        }
    }

    find_sections(name, sheet) {
        const cell = sheet_indexer(name, sheet);
        const sections = [];

        for (let i = 1; i < sheet.length - cell[0]; i++) {
            const value = sheet[cell[0] + i][cell[1] - 1];
            if (value === "" || value == null) {
                return [sections, cell[1] - 1];
            }
            sections.push(value);
        }

        return [sections, cell[1] - 1];
    }

    static find_sections(name, sheet) {
        const cell = sheet_indexer(name, sheet);
        const sections = [];

        for (let i = 0; i < sheet.length - cell[0]; i++) {
            const value = sheet[cell[0] + i][cell[1] - 1];
            if (value === "" || value == null) {
                return [sections, cell[1] - 1];
            }
            sections.push(value);
        }

        return sections;
    }

    find_config_value(name, sheet) {
        if (!sheet[0].includes(name)) {
            SpreadsheetApp.getUi().alert("The config value:" + name + " does not exist");
            return;
        }
        const cell = row_indexer(name, sheet[0]);
        return [sheet[2][cell], cell];
    }

    set_config_value(name, value) {
        const cell = this.values[name];
        setSSValues(this.sheet, [3, cell[0] + 1], value).then(r => console.log("config value: " + name + " set as : " + value));
        cell[1](value);
    }

    current_priority_tickets(priority, value) {
        const cell = this.values["Current Priority Tickets"];
        const ticket_cell = this.sheet.getRange(priority + 2, cell[0] + 1, 1, 1);
        const tickets = this.priority_tickets[priority];

        ticket_cell.setValue(tickets + value);
        cell[1](tickets + value, priority);
        return tickets;
    }

    toJSON () {
        let output = [];
        output.push([this.max, this.values["Maximum Search Length"][0]]);
        output.push([this.priority_list, this.values["Priority List"][0]]);
        output.push([this.priority_title, this.values["Priority Section Title"][0]]);
        output.push([this.auto_publish, this.values["Auto Publish"][0]]);
        output.push([this.sections, this.values["Form Section Names"][0]]);
        output.push([this.filtered_secs, this.values["Filtered Section Names"][0]]);
        output.push([this.internal_sec, this.values["Internal Section Name"][0]]);
        output.push([this.sheet_n, this.values["Internal Sheet Number Title"][0]]);
        output.push([this.priority_exclusion, this.values["Priority Exclusion"][0]]);
        output.push([this.status_categories, this.values["Internal Status Naming"][0]]);
        output.push([this.status, this.values["Status"][0]]);
        output.push([this.priority_tickets, this.values["Current Priority Tickets"][0]]);
        output.push([this.act_sheets, this.values["Current Active Tickets"][0]]);
        output.push([this.total_tickets, this.values["Total Saved Tickets"][0]]);

        return output;
    }
}