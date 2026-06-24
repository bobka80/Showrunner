/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Main.gs - Routing, Global Includes, and Software Summary
 */

// @INDEX: ROUTING -> Web App Get/Post
function doGet(e) {
  let loginTemplate = HtmlService.createTemplateFromFile('Login');
  loginTemplate.scriptUrl = ScriptApp.getService().getUrl();
  loginTemplate.errorMsg = "none";
  return loginTemplate.evaluate().setTitle('System Login').addMetaTag('viewport', 'width=device-width, initial-scale=1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  let crewName = e.parameter.name || "";
  let passcode = e.parameter.passcode || "";
  
  let authResult = authenticateUser(crewName, passcode); // Routed to Security.gs
  
  if (authResult.success) {
    let template = HtmlService.createTemplateFromFile('Index');
    template.userName = authResult.name;
    template.userAccess = authResult.access;
    template.userPermissionsB64 = Utilities.base64Encode(JSON.stringify(authResult.permissions || {}));
    return template.evaluate()
      .setTitle('SM Showrunner Command Center')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // INCORRECT CREDENTIALS ROUTE
  let loginTemplate = HtmlService.createTemplateFromFile('Login');
  loginTemplate.scriptUrl = ScriptApp.getService().getUrl();
  loginTemplate.errorMsg = authResult.error; 
  
  return loginTemplate.evaluate()
    .setTitle('System Login')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
// --- HIGH SPEED PAYLOAD ENGINES ---
// ==========================================
// @INDEX: PAYLOAD -> High Speed Boot Payload
function getBootPayload(crewName) {
  IS_READ_ONLY_EXECUTION = true;
  const profile = getUserSecurityProfile(crewName);
  let projects = getExistingProjects();
  let monthData = getGlobalMonthData(projects);
  
  let conflicts = getActiveConflicts();

  if (profile.tunneling && profile.uid) {
     monthData.shifts = monthData.shifts.filter(s => (s.user_uid || s.email) === profile.uid);
     let assignedProjectIds = new Set(monthData.shifts.map(s => s.projectId));
     projects = projects.filter(p => assignedProjectIds.has(p.id));
  }
  let extras = getTasksAndNotifs(crewName);

  return {
    directory: getSystemDirectory(),
    settings: getSystemSettings(),
    visuals: {
      timeline: getModuleVisualSettings('timeline', 'current'),
      cal: getModuleVisualSettings('cal', 'current'),
      mini: getModuleVisualSettings('mini', 'current'),
      mr: getModuleVisualSettings('mr', 'current'),
      asset: getModuleVisualSettings('asset', 'current'),
      projectAsset: getModuleVisualSettings('projectAsset', 'current'),
      legacy: getVaultAsset('visual_settings_1', getVaultAsset('visual_settings', null))
    },
    managerConfig: getManagerConfig(crewName),
    projects: projects,
    monthData: monthData,
    tasks: extras.tasks,
    notifs: extras.notifs,
    conflicts: conflicts
  };
}

function getRefreshPayload(crewName) {
  IS_READ_ONLY_EXECUTION = true;
  const profile = getUserSecurityProfile(crewName);
  let projects = getExistingProjects();
  let monthData = getGlobalMonthData(projects);
  
  let conflicts = getActiveConflicts();

  if (profile.tunneling && profile.uid) {
     monthData.shifts = monthData.shifts.filter(s => (s.user_uid || s.email) === profile.uid);
     let assignedProjectIds = new Set(monthData.shifts.map(s => s.projectId));
     projects = projects.filter(p => assignedProjectIds.has(p.id));
  }
  let extras = getTasksAndNotifs(crewName);

  return { projects: projects, monthData: monthData, managerConfig: getManagerConfig(crewName), tasks: extras.tasks, notifs: extras.notifs, conflicts: conflicts };
}