function dumpCrewData() {
  const ss = SpreadsheetApp.openById('1EzqvZQM5VanEB1_XxZT7lRd8YfXSTMcBVRVx3mGElz8');
  const sheet = ss.getSheetByName('Crew_Roster');
  if (!sheet) return "No Crew_Roster sheet";
  const data = sheet.getDataRange().getValues();
  return JSON.stringify(data, null, 2);
}
