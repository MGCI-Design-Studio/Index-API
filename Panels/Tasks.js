// TASK
function task_empty(){
  home_sheet = "Orders";
  config_sheet = "Orders Config";
  template_sheet = "Orders Template"
  createEmptyHandler();
}

function task_publish(){
  home_sheet = "Orders";
  config_sheet = "Orders Config";
  template_sheet = "Orders Template"
  publishTicketHandler();
}

function task_publish_all(){
  home_sheet = "Orders";
  config_sheet = "Orders Config";
  template_sheet = "Orders Template"
  publishAll("Task");
}

function task_delete(){
  home_sheet = "Orders";
  config_sheet = "Orders Config";
  template_sheet = "Orders Template"
  deleteTicketHandler();
}