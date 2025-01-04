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
        await saveValues(scriptProperties, raw_values, config_values.toJSON(), home).then(r => console.log(r));
    }
    await findAllTickets(scriptProperties, panels);
}

function findSignInEmails(){
    const scriptProperties = PropertiesService.getScriptProperties();
    let sign_in_tokens = [];
    try{
        // Get the unpacked values
        sign_in_tokens = unpackProperties(scriptProperties.getProperty("authorization"));
    }
    catch (err) {
        console.log(err);
        sign_in_tokens = SS_INFO.getRange(4, 1, 1, 1).getValue().split("::");
        saveValue(scriptProperties, "authorization", sign_in_tokens)
            .then(r => console.log(r));
    }

    return sign_in_tokens;
}

function checkAccess(email){
    const sign_in_data = findSignInEmails();
    if (sign_in_data.includes(email.toLowerCase())){
        console.log(email);
        return "Access Granted";
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
                panel_items = findTicketsFromSpread(scriptProperties, panel_item_names[ind], HOME_SHEET_NAME);
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

            await saveValues(scriptProperties, raw_values, config_values.toJSON(), HOME_SHEET_NAME).then(r => console.log(r));
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