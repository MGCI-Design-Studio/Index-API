# MGCI Design Studio Index Application
___
A GAS Application for automated spreadsheet modification with an embedded Website (DEPRECATED)

## Demo: 
<img width="1866" height="1041" alt="image" src="https://github.com/user-attachments/assets/e3a99908-d5ed-40f5-aef4-e244e6284590" />

- [Connected Web App](https://bit.ly/MGDS_Index)

## Project Structure
- WebApp contains the React website code, using Google App Script as the backend
- Panels contains scripts to be used on the spreadsheet
- Google_App_Manipulation is a seperately maintained library of helper scripts to manipulate a Google Spreadsheet using Google App Script

### Features
- Google OAuth implemented on the Web App (Weren't used in production due to TDSB restrictions)
- Efficient grabbing and caching of spreadsheet data
- Full CRUD control of each Spreadsheet using Google App Script
- Dynamically generated tabs for Spreadsheet display

## Terminology
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

## Main Methods
- resetProps()
- createEmptyHandler(`name`, `template_sheet`, `home`)
- publishOne(`ticket`, `home`)
- publishAll(`panel`, `home`)
- updateTicketHandler(`interval`, `updateSettings`, `home`)
- deleteTicketHandler(`ticketNum`, `home`)
