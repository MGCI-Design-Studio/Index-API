async function updateStorage(){
    const scriptProperties = PropertiesService.getScriptProperties();
    let panels = SS_INFO.getRange(1, 1, 1, 1).getValue().split("::");

    let config_values;
    for (let i = 0; i < panels.length; i++) {
        let home = SPREAD.getSheetByName(panels[i]);
        HOME_SHEET_NAME = panels[i];
        let config = SPREAD.getSheetByName(panels[i] + " Config");
        const home_range = home.getDataRange();
        config_values = new Config(config, config.getDataRange().getValues(), false);
        let raw_values = formatToJSON(home_range.getRichTextValues(), home_range.getValues(), true);
        await saveValues(scriptProperties, raw_values, config_values.toJSON(), home_sheet).then(r => console.log(r));
    }
    await findAllTickets(scriptProperties, panels);
}

function findSignInEmails(){
    const scriptProperties = PropertiesService.getScriptProperties();
    let sign_in_info = [];
    let sign_in_tokens = [];
    try{
        // Get the unpacked values
        let sign_in_data = unpackProperties(scriptProperties.getProperty("authorization"));
        sign_in_tokens = sign_in_data[0];
        sign_in_info = sign_in_data[1];
    }
    catch (err) {
        console.log(err);
        const personnel = home_builder(
            scriptProperties,
            SPREAD.getSheetByName("Personnel"),
            "Personnel",
            SPREAD.getSheetByName("Personnel Config")
        );
        sign_in_tokens = Config.find_sections("Sign-In Email:", personnel[0].values);

        const branch_info = Config.find_sections("Branch:", personnel[0].values);
        const position_info = Config.find_sections("Position:Priority", personnel[0].values);
        const names = Config.find_sections("Employee", personnel[0].values);

        for (let i = 0; i < branch_info.length; i++) {
            sign_in_info.push([branch_info[i], position_info[i], names[i]]);
        }
        saveValue(scriptProperties, "authorization", [sign_in_tokens, sign_in_info])
            .then(r => console.log(r));
    }

    return [sign_in_tokens, sign_in_info];
}

function checkAccess(email){
    const sign_in_data = findSignInEmails();
    if (sign_in_data[0].includes(email)){
        return sign_in_data[1][sign_in_data[0].indexOf(email)];
    }
    return false;
}

function doGet(e) {
    Logger.log(Utilities.jsonStringify(e));
    if (!e.parameter.page) {
        // When no specific page requested, return "home page"
        return HtmlService.createTemplateFromFile("Web_App/index").evaluate();
    }
    // else, use page parameter to pick an html file from the script
    return HtmlService.createTemplateFromFile(e.parameter["page"]).evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getContent(filename) {
    return HtmlService.createTemplateFromFile(filename).getRawContent();
}

function getPanels(accountData){
    if (accountData) {
        if (accountData.position < 3) {
            return (SS_INFO.getRange(1, 1, 1, 1).getValue().split("::"));
        }
        else if (accountData.position < 4) {
            return (["Tasks", "Inventory", "Shift Outline System"]);
        }
        else if (accountData.position < 5) {
            return (["Tasks"]);
        }
    }
    return ([]);
}

function getItems(panels, email){
    const scriptProperties = PropertiesService.getScriptProperties();
    let panel_item_names = SS_INFO.getRange(3, 1, 1, 1).getValue().split("::");
    let items = [];
    if (panels.length > 0) {
        panels.forEach((panel, ind) => {
            let panel_items;
            try {
                panel_items = unpackProperties(scriptProperties.getProperty(panel + "_tickets"));
                HOME_SHEET_NAME = panel;
            } catch (err) {
                console.log(err);
                HOME_SHEET_NAME = getPanels({position: 0})[ind];
                panel_items = findTicketsFromSpread(scriptProperties, panel_item_names[ind], home_sheet);
            }
            if (HOME_SHEET_NAME === panel){
                items.push(panel_items);
            }
        });
    }
    else {
        items = [[]];
    }
    console.log(panels);
    return items;
}

async function getPanelData(panel, isPanel = false){
    if (isPanel) {
        const scriptProperties = PropertiesService.getScriptProperties();
        try {
            // Get the unpacked values
            let data = scriptProperties.getProperty(panel);
            if (data === null) {
                throw "No data found";
            }
            return data;

        } catch (err) {
            console.log(err);
            const config = SPREAD.getSheetByName(panel + " Config");
            const home = SPREAD.getSheetByName(panel);
            HOME_SHEET_NAME = panel;
            const home_range = home.getDataRange();
            let config_values = new Config(config, config.getDataRange().getValues(), false);
            let raw_values = formatToJSON(home_range.getRichTextValues(), home_range.getValues(), true);

            await saveValues(scriptProperties, raw_values, config_values.toJSON(), home_sheet).then(r => console.log(r));
            return packProperties({
                "values": raw_values,
                "config": config_values.toJSON(),
            });
        }
    }
    else{
        const sheet = SPREAD.getSheetByName(panel);
        const sheet_range = sheet.getDataRange();

        let raw_values = formatToJSON(sheet_range.getRichTextValues(), sheet_range.getValues(), true);

        return packProperties(raw_values);
    }
}