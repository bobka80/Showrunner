function dumpDB() {
  try {
    const sheets = verifyVaultSchema(true);
    const crewData = getSheetData(sheets.crew);
    const roleData = getSheetData(sheets.roles);
    
    let result = "--- CREW ROSTER ---\n";
    if (crewData && crewData.length > 0) {
      result += crewData[0].join(" | ") + "\n";
      for (let i = 1; i < crewData.length; i++) {
        result += crewData[i].join(" | ") + "\n";
      }
    }
    
    result += "\n--- IAM ROLES ---\n";
    if (roleData && roleData.length > 0) {
      result += roleData[0].join(" | ") + "\n";
      for (let i = 1; i < roleData.length; i++) {
        result += roleData[i].join(" | ") + "\n";
      }
    }
    return result;
  } catch(e) {
    return "ERROR: " + e.message;
  }
}
