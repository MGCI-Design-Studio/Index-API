// PERSONNEL
function personnel_empty(){
  HOME_SHEET_NAME = "Personnel";
  TEMPLATE_SHEET_NAME = "Personnel Template"
  createEmptyHandler();
}

function personnel_publish(){
  HOME_SHEET_NAME = "Personnel";
  TEMPLATE_SHEET_NAME = "Personnel Template"
  publishTicketHandler();
}

function personnel_publish_all(){
  HOME_SHEET_NAME = "Personnel";
  TEMPLATE_SHEET_NAME = "Personnel Template"
  publishAll("Personnel");
}

function personnel_delete(){
  HOME_SHEET_NAME = "Personnel";
  TEMPLATE_SHEET_NAME = "Personnel Template"
  deleteTicketHandler();
}