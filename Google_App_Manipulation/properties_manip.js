async function saveValue(scriptProperties, key, value) {
    scriptProperties.setProperty(key, packProperties(value));

    return ("200, Saved Values");
}

function getSavedValue(scriptProperties, key) {
    return (unpackProperties(scriptProperties.getProperty(key)));
}

function packProperties(value) {
    console.log("Unpacked Prop Size: " + JSON.stringify(value).length);
    return (Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(value), 'application/x-gzip')).getBytes()));
}

function unpackProperties(value) {
    console.log("Packed Prop Size: " + value.length);
    return (JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(value), 'application/x-gzip')).getDataAsString()));
}