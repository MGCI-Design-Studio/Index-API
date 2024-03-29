// Shifts
function shift_empty(){
  home_sheet = "Shifts";
  config_sheet = "Shifts Config";
  template_sheet = "SOS Template"
  createEmptyHandler();
}

function shift_publish(){
  home_sheet = "Shifts";
  config_sheet = "Shifts Config";
  template_sheet = "SOS Template"
  publishTicketHandler();
}

function shift_publish_all(){
  home_sheet = "Shifts";
  config_sheet = "Shifts Config";
  template_sheet = "SOS Template"
  publishAll("Shift");
}

function shift_delete(){
  home_sheet = "Shifts";
  config_sheet = "Shifts Config";
  template_sheet = "SOS Template"
  deleteTicketHandler();
}