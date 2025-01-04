// INVENTORY
function inventory_empty(){
  HOME_SHEET_NAME = "Inventory";
  TEMPLATE_SHEET_NAME = "Inventory Template"
  createEmptyHandler();
}

function inventory_publish(){
  HOME_SHEET_NAME = "Inventory";
  TEMPLATE_SHEET_NAME = "Inventory Template"
  publishTicketHandler();
}

function inventory_publish_all(){
  HOME_SHEET_NAME = "Inventory";
  TEMPLATE_SHEET_NAME = "Inventory Template"
  publishAll("Inventory");
}

function inventory_delete(){
  HOME_SHEET_NAME = "Inventory";
  TEMPLATE_SHEET_NAME = "Inventory Template"
  deleteTicketHandler();
}