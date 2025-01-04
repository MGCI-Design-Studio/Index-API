// TASK
function task_empty(){
  HOME_SHEET_NAME = "Orders";
  TEMPLATE_SHEET_NAME = "Orders Template"
  createEmptyHandler();
}

function task_publish(){
  HOME_SHEET_NAME = "Orders";
  TEMPLATE_SHEET_NAME = "Orders Template"
  publishTicketHandler();
}

function task_publish_all(){
  HOME_SHEET_NAME = "Orders";
  TEMPLATE_SHEET_NAME = "Orders Template"
  publishAll("Task");
}

function task_delete(){
  HOME_SHEET_NAME = "Orders";
  TEMPLATE_SHEET_NAME = "Orders Template"
  deleteTicketHandler();
}