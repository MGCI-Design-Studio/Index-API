# MGCI Design Studio Index Application
___
## A GAS Application for automated spreadsheet modification

Terminology
- `name` name the ticket should have
- `ticket` name of the ticket
- `ticketNum` the ticket number
- `template_sheet` name of the template sheet
- `home` name of the homepage of the ticket
- `panel` identifier at the top left of every ticket
- `interval` a list of intervals separated by commas. Each interval should be like `N1-N2`
- `updateSettings` either `"__FIND_DIFFERENCES__"` or `"__TICKET__"`
	- `"__FIND_DIFFERENCES__"` no interval needed, finds differences and updates them
	- `"__TICKET__"` uses the interval

Main Methods
- resetProps()
- createEmptyUI()
- createEmptyHandler(`name`, `template_sheet`, `home`)
- publishOne(`ticket`, `home`)
- publishAll(`panel`, `home`)
- updateTicketHandler(`interval`, `updateSettings`, `home`)
- deleteTicketHandler(`ticketNum`, `home`)
