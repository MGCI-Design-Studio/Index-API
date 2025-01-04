// Requires:
// util.js
// properties_manip.js
// spreadsheet_manip.js

function home_builder(storage = false, home, home_name, config) {
    let home_class, config_values; // declare our outputs

    if (storage) {
        // Try to grab config and home values from script properties storage
        try {
            // Get the unpacked values
            let home_values = unpackProperties(storage.getProperty(home_name));

            if (home_values === null) throw "No Home Values In Storage"; // if there are no values in storage
            config_values = new Config(config, home_values["config"], true);


            let script_values = JSONToFormat(home_values["values"]);
            let home_format = script_values[1];

            home_values = script_values[0];
            home_class = new SheetClass(home, null, home_values, home_format);

            console.log("home_builder: Home and Config Sheets Built From Storage. Exiting");
            return [home_class, config_values];
        } catch (err) {
            console.log("home_builder: Error in grabbing home and config from storage: " + err);
        }
    }

    console.log("home_builder: Reading from Spreadsheet")
    const home_range = home.getDataRange();

    config_values = new Config(config, config.getDataRange().getValues(), false);
    let raw_values = formatToJSON(home_range.getRichTextValues(), home_range.getValues(), true);
    if (storage){
        saveValues(storage, raw_values, config_values.toJSON(), home_name).then(r => console.log(r));
    }
    console.log("home_builder: JSON Values: ");
    console.log(JSON.stringify(raw_values));
    raw_values = JSONToFormat(raw_values);

    home_class = new SheetClass(home, null, raw_values[0], raw_values[1]);

    console.log("home_builder: Home and Config Sheets Built From Spreadsheet. Exiting");
    return [home_class, config_values];
}

async function saveValues(scriptProperties, values, config_values, home) {
    scriptProperties.setProperty(home, packProperties({
        "values": values,
        "config": config_values,
    }));

    return ("200, Saved Values");
}