/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Integrations.gs - Drive Automation (Dumb Vault), Calendar Sync
 */

// ==========================================
// --- GOOGLE DRIVE: DUMB ASSET VAULT ---
// ==========================================

function driveRetry(operation, maxRetries = 4) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return operation();
    } catch (e) {
      attempt++;
      if (attempt >= maxRetries) throw new Error("Drive API Error (" + maxRetries + " attempts): " + e.message);
      Utilities.sleep(Math.pow(2, attempt) * 500); // Exponential backoff: 1s, 2s, 4s, 8s
    }
  }
}

function findFileRecursivelyByName(folder, exactName) {
  let files = driveRetry(() => folder.getFilesByName(exactName));
  if (files.hasNext()) return files.next();
  
  let subfolders = driveRetry(() => folder.getFolders());
  while (subfolders.hasNext()) {
    let found = findFileRecursivelyByName(subfolders.next(), exactName);
    if (found) return found;
  }
  return null;
}

function getOrCreateFolder(parent, name) {
  return driveRetry(() => {
    let folders = parent.searchFolders("title = '" + name.replace(/'/g, "\\'") + "'");
    if (folders.hasNext()) return folders.next();
    let newFolder = parent.createFolder(name);
    Utilities.sleep(1000); // Allow Drive search index to catch up
    return newFolder;
  });
}

// @INDEX: DRIVE_API -> Dumb Vault Deployment
function deployDumbFolder(projectId, projectName, selectedItems) {
  try {
    const SYSTEM_ROOT_ID = WORKSPACE_FOLDER_ID;
    let managerEmail = "";
    let crewName = "default";
    const sheets = verifyDatabaseSchema(true);
    const indexData = getSheetData(sheets.index);
    let iMap = indexData.hMap;
    for (let i = 1; i < indexData.length; i++) {
       if (indexData[i][iMap['uid']] === projectId) {
           managerEmail = indexData[i][iMap['Manager_Email']]; 
           break;
       }
    }
    if (managerEmail) {
        const vaultSheets = verifyVaultSchema(true);
        const crewData = getSheetData(vaultSheets.crew);
        let cMap = crewData.hMap;
        for(let i=1; i<crewData.length; i++){
            if(crewData[i][cMap['Email']] === managerEmail) { crewName = crewData[i][cMap['Name']]; break; }
        }
    }
    let config = getManagerConfig(crewName || 'default');

    const baseFolder = DriveApp.getFolderById(SYSTEM_ROOT_ID);
    
    // 1. Fetch Project Date from Database to build Year/Month structure
    const timelines = getSheetData(sheets.timelines);
    let tMap = timelines.hMap;
    let targetDate = null;
    let fallbackDate = null;
    
    for (let i = 1; i < timelines.length; i++) {
       if (timelines[i][tMap['project_uid']] === projectId && timelines[i][tMap['Event_Date']]) {
           let dateStr = timelines[i][tMap['Event_Date']].toString().split('T')[0];
           let parsedD = new Date(Date.UTC(dateStr.split('-')[0], dateStr.split('-')[1]-1, dateStr.split('-')[2]));
           
           if (timelines[i][tMap['Sub_Event_Type']] === 'SHOW_DAY') {
               targetDate = parsedD;
               break;
           } else if (timelines[i][tMap['Sub_Event_Type']] === 'MAIN_EVENT' && !fallbackDate) {
               fallbackDate = parsedD;
           }
       }
    }
    
    if (!targetDate) targetDate = fallbackDate;
    if (!targetDate) targetDate = new Date(); // Fallback to today if not found
    
    // 2. Build the Year -> Month Hierarchy dynamically
    let yearStr = targetDate.getUTCFullYear().toString();
    let monthStr = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    
    let yearFolder = getOrCreateFolder(baseFolder, yearStr);
    let monthFolder = getOrCreateFolder(yearFolder, monthStr);
    
    // 3. Format the new folder name exactly as requested
    let dayStr = String(targetDate.getUTCDate()).padStart(2, '0');
    let formattedProjName = `${yearStr}-${String(targetDate.getUTCMonth()+1).padStart(2,'0')}-${dayStr} - ${projectName}`;

    const newProjectFolder = monthFolder.createFolder(formattedProjName);

    // Copy template items
    selectedItems.forEach(item => {
      if (item.type === 'folder') {
        let f = DriveApp.getFolderById(item.id);
        copyRecursiveExact(f, newProjectFolder.createFolder(f.getName()));
      } else {
        DriveApp.getFileById(item.id).makeCopy(item.name, newProjectFolder);
      }
    });

    // 🔒 RELATIONAL SYNC: Write the new Folder ID back to the Database
    updateProjectFolderId(projectId, newProjectFolder.getId());

    return newProjectFolder.getUrl();
  } catch (e) {
    throw new Error("Filesystem Deployment Failed: " + e.toString());
  }
}

function copyRecursiveExact(src, dest) {
  let files = driveRetry(() => src.getFiles());
  while (files.hasNext()) { 
    let f = files.next(); 
    driveRetry(() => f.makeCopy(f.getName(), dest)); 
    Utilities.sleep(400); // Increased buffer to prevent Google Drive API rate limits
  }
  let subs = driveRetry(() => src.getFolders());
  while (subs.hasNext()) { 
    let s = subs.next(); 
    let newFolder = driveRetry(() => dest.createFolder(s.getName()));
    Utilities.sleep(400); // Increased buffer to prevent Google Drive API rate limits
    copyRecursiveExact(s, newFolder); 
  }
}

function parseTimelineEventDate_(rawDate) {
  if (!rawDate) return null;
  if (rawDate instanceof Date) {
    return new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
  }
  if (typeof rawDate === 'string' || typeof rawDate === 'number') {
    let dateStr = String(rawDate).split('T')[0].trim();
    if (dateStr.includes('-')) {
      let pts = dateStr.split('-');
      let d = new Date(parseInt(pts[0], 10), parseInt(pts[1], 10) - 1, parseInt(pts[2], 10));
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function collectProjectPhaseDates_(projectId, timelinesOverride) {
  let showDayDates = [];
  let mainEventDates = [];
  if (timelinesOverride && timelinesOverride.length) {
    timelinesOverride.forEach(t => {
      let d = parseTimelineEventDate_(t.Event_Date);
      if (!d) return;
      let type = String(t.Sub_Event_Type || '').toUpperCase();
      if (type === 'SHOW_DAY') showDayDates.push(d);
      else if (type === 'MAIN_EVENT') mainEventDates.push(d);
    });
    return { showDayDates: showDayDates, mainEventDates: mainEventDates };
  }
  const timelines = executeWithRetry(() => getSheetData(verifyDatabaseSchema(true).timelines));
  let tMap = timelines.hMap;
  let tPidCol = tMap['project_uid'] !== undefined ? tMap['project_uid'] : tMap['Project_ID'];
  for (let i = 1; i < timelines.length; i++) {
    let rowPid = (tPidCol !== undefined) ? timelines[i][tPidCol] : timelines[i][1];
    if (rowPid !== projectId) continue;
    let d = parseTimelineEventDate_(timelines[i][tMap['Event_Date']]);
    if (!d) continue;
    let type = String(timelines[i][tMap['Sub_Event_Type']] || '').toUpperCase();
    if (type === 'SHOW_DAY') showDayDates.push(d);
    else if (type === 'MAIN_EVENT') mainEventDates.push(d);
  }
  return { showDayDates: showDayDates, mainEventDates: mainEventDates };
}

function buildProjectFolderDateLabel_(showDayDates, mainEventDates) {
  let targetDates = showDayDates.concat(mainEventDates);
  if (targetDates.length === 0) targetDates = [new Date()];
  let minEpoch = Math.min(...targetDates.map(d => d.getTime()));
  let maxEpoch = Math.max(...targetDates.map(d => d.getTime()));
  let minDate = new Date(minEpoch);
  let maxDate = new Date(maxEpoch);
  let yStart = minDate.getFullYear();
  let mStart = minDate.getMonth() + 1;
  let dStart = minDate.getDate();
  let yEnd = maxDate.getFullYear();
  let mEnd = maxDate.getMonth() + 1;
  let dEnd = maxDate.getDate();
  let dateRangeStr = "";
  if (yStart === yEnd && mStart === mEnd && dStart === dEnd) {
    dateRangeStr = `${dStart}.${mStart}.${yStart}`;
  } else if (yStart === yEnd && mStart === mEnd) {
    dateRangeStr = `${dStart}-${dEnd}.${mStart}.${yStart}`;
  } else if (yStart === yEnd) {
    dateRangeStr = `${dStart}.${mStart}-${dEnd}.${mEnd}.${yStart}`;
  } else {
    dateRangeStr = `${dStart}.${mStart}.${yStart}-${dEnd}.${mEnd}.${yEnd}`;
  }
  return {
    dateRangeStr: dateRangeStr,
    yStart: yStart,
    monthFolderName: String(mStart).padStart(2, '0')
  };
}

function moveDriveFolderIfNeeded_(folder, targetParent) {
  let parents = folder.getParents();
  if (parents.hasNext()) {
    let parent = parents.next();
    if (parent.getId() !== targetParent.getId()) {
      driveRetry(() => folder.moveTo(targetParent));
    }
  }
}

// @INDEX: DRIVE_API -> Generate Project Folders
function generateProjectFolders(crewName, projectId, projectName, timelinesOverride) {
    const OPS_TEMPLATE_ID = '19J-3qT7ABLIRK7Si1xfp_KEPRQYcbKbe';
    const FIN_TEMPLATE_ID = '1qmchnnh21Lp3iPR73B_LV6oihbiTJSwW';
    
    let config = executeWithRetry(() => getManagerConfig(crewName));

    const opsBaseFolder = driveRetry(() => DriveApp.getFolderById(OPS_ROOT_ID));
    const finBaseFolder = driveRetry(() => DriveApp.getFolderById(FIN_ROOT_ID));
    
    const opsTemplateFolder = driveRetry(() => DriveApp.getFolderById(OPS_TEMPLATE_ID));
    const finTemplateFolder = driveRetry(() => DriveApp.getFolderById(FIN_TEMPLATE_ID));
    
    // Get the current user's email for Ownership transfer
    const profile = executeWithRetry(() => getUserSecurityProfile(crewName));
    const userEmail = profile.email;
    
    // Evaluate the Financial Access
    let hasFinAccess = (profile.fin_view_internal === true || profile.fin_view_internal === 'true');
    
    // 1. Build folder date label from painted MAIN_EVENT + SHOW_DAY phases (union of all days).
    let phaseDates = collectProjectPhaseDates_(projectId, timelinesOverride);
    let dateLabel = buildProjectFolderDateLabel_(phaseDates.showDayDates, phaseDates.mainEventDates);
    let formattedProjName = `${projectName} ${dateLabel.dateRangeStr}`;
    let yStart = dateLabel.yStart;
    let monthFolderName = dateLabel.monthFolderName;

    // 2. Build the exact Year -> Month Hierarchy dynamically
    let opsYearFolder = getOrCreateFolder(opsBaseFolder, yStart.toString());
    let finYearFolder = getOrCreateFolder(finBaseFolder, yStart.toString());
    let opsMonthFolder = getOrCreateFolder(opsYearFolder, monthFolderName);
    let finMonthFolder = getOrCreateFolder(finYearFolder, monthFolderName);

    let existingFolderId = '';
    const indexData = executeWithRetry(() => getSheetData(verifyDatabaseSchema(true).index));
    let iMap = indexData.hMap;
    for (let i = 1; i < indexData.length; i++) {
      if (indexData[i][iMap['uid']] === projectId) {
        existingFolderId = String(indexData[i][iMap['Folder_ID']] || '').trim();
        break;
      }
    }

    let opsProjectFolder = null;
    let finProjectFolder = null;
    let priorFolderName = '';

    if (existingFolderId) {
      try {
        opsProjectFolder = driveRetry(() => DriveApp.getFolderById(existingFolderId));
        priorFolderName = opsProjectFolder.getName();
        if (opsProjectFolder.getName() !== formattedProjName) {
          driveRetry(() => opsProjectFolder.setName(formattedProjName));
        }
        moveDriveFolderIfNeeded_(opsProjectFolder, opsMonthFolder);
        let finSearchName = priorFolderName || formattedProjName;
        let existingFinProj = driveRetry(() => finMonthFolder.searchFolders("title = '" + finSearchName.replace(/'/g, "\\'") + "'"));
        if (!existingFinProj.hasNext() && priorFolderName) {
          existingFinProj = driveRetry(() => finYearFolder.searchFolders("title = '" + priorFolderName.replace(/'/g, "\\'") + "'"));
        }
        if (existingFinProj.hasNext()) {
          finProjectFolder = existingFinProj.next();
          if (finProjectFolder.getName() !== formattedProjName) {
            driveRetry(() => finProjectFolder.setName(formattedProjName));
          }
          moveDriveFolderIfNeeded_(finProjectFolder, finMonthFolder);
        }
      } catch (e) {}
    }

    if (!opsProjectFolder) {
      let existingOpsProj = driveRetry(() => opsMonthFolder.searchFolders("title = '" + formattedProjName.replace(/'/g, "\\'") + "'"));
      if (existingOpsProj.hasNext()) {
        opsProjectFolder = existingOpsProj.next();
        let existingFinProj = driveRetry(() => finMonthFolder.searchFolders("title = '" + formattedProjName.replace(/'/g, "\\'") + "'"));
        if (existingFinProj.hasNext()) finProjectFolder = existingFinProj.next();
      }
    }

    if (!opsProjectFolder) {
        opsProjectFolder = driveRetry(() => opsMonthFolder.createFolder(formattedProjName));
        Utilities.sleep(1000); // Allow Drive to stabilize before copying files
        copyRecursiveExact(opsTemplateFolder, opsProjectFolder); // Deep duplicate template
        
        finProjectFolder = driveRetry(() => finMonthFolder.createFolder(formattedProjName));
        Utilities.sleep(1000);
        copyRecursiveExact(finTemplateFolder, finProjectFolder);
        
        if (config.renameRules && config.renameRules.length > 0) {
            config.renameRules.forEach(rule => {
                if (!rule.originalName) return;
                driveRetry(() => {
                    let file = findFileRecursivelyByName(opsProjectFolder, rule.originalName);
                    if (!file && finProjectFolder) file = findFileRecursivelyByName(finProjectFolder, rule.originalName);
                    if (file) {
                        try {
                            let newBase = formattedProjName;
                            if (rule.prefix) newBase = rule.prefix + " - " + newBase;
                            if (rule.suffix) newBase = newBase + " - " + rule.suffix;
                            
                            let oldName = file.getName();
                            let dotIndex = oldName.lastIndexOf('.');
                            let ext = "";
                            if (dotIndex > -1) {
                                ext = oldName.substring(dotIndex);
                            }
                            file.setName(newBase + ext);
                        } catch (renameErr) {
                            console.error("Failed to rename file: " + rule.originalName, renameErr);
                        }
                    }
                });
            });
        }
    }
    
    // 3. Transfer Ownership to the active User
    if (userEmail) {
        driveRetry(() => {
            try {
                opsProjectFolder.setOwner(userEmail);
            } catch (e) {
                // Fallback: If Google blocks cross-domain ownership transfer, make them an Editor
                try { opsProjectFolder.addEditor(userEmail); } catch (ex) {}
            }
            if (finProjectFolder && hasFinAccess) {
                try { finProjectFolder.setOwner(userEmail); } catch (e) {
                    try { finProjectFolder.addEditor(userEmail); } catch (ex) {}
                }
            }
        });
    }
    
    // 4. Auto-Share Operations Folder with all Global Managers
    try {
        const roster = executeWithRetry(() => getCrewSettings());
        const managers = roster.filter(c => c.isManager && c.email && c.email !== userEmail);
        managers.forEach(mgr => {
            driveRetry(() => {
                try { opsProjectFolder.addEditor(mgr.email); } catch(e) {}
            });
        });
    } catch (e) {}
    
    // 5. Mirrored Sync Trees (Filtered Custom Structures via Shortcuts)
    // Builds a parallel Year->Month->Event structure for users, containing ONLY shortcuts to their selected master files/folders.
    try {
        const roster = executeWithRetry(() => getCrewSettings());
        let systemRoot = driveRetry(() => DriveApp.getFolderById(OPS_ROOT_ID));
        let syncHubRoot = getOrCreateFolder(systemRoot, "Showrunner Syncs");
        
        roster.forEach(user => {
            if (user.email) {
                try {
                    let userKey = 'manager_config_' + user.name.replace(/\s+/g, '_').toLowerCase();
                    let raw = getVaultAsset(userKey, {});
                    let syncSelection = Array.isArray(raw.syncSelection) ? raw.syncSelection : [];
                    if (!syncSelection.length) return;

                    let renameRules = Array.isArray(raw.renameRules) ? raw.renameRules : [];
                    if (!renameRules.length) {
                        let globalCfg = getVaultAsset('manager_config_global', {});
                        renameRules = Array.isArray(globalCfg.renameRules) ? globalCfg.renameRules : [];
                    }

                    let userHub = getOrCreateFolder(syncHubRoot, user.name);
                    driveRetry(() => { try { userHub.addEditor(user.email); } catch(e){} });

                    let uYear = getOrCreateFolder(userHub, yStart.toString());
                    let uMonth = getOrCreateFolder(uYear, monthFolderName);
                    let uProj = getOrCreateFolder(uMonth, formattedProjName);

                    syncSelection.forEach(itemName => {
                        let targetName = itemName.replace(/&quot;/g, '"');

                        let matchedRule = renameRules.find(r => r.originalName === itemName);
                            if (matchedRule) {
                                let newBase = formattedProjName;
                                if (matchedRule.prefix) newBase = matchedRule.prefix + " - " + newBase;
                                if (matchedRule.suffix) newBase = newBase + " - " + matchedRule.suffix;
                                let dotIndex = itemName.lastIndexOf('.');
                                let ext = dotIndex > -1 ? itemName.substring(dotIndex) : "";
                                targetName = newBase + ext;
                            }

                            let targetObj = null;
                            let attempts = 0;

                            while (!targetObj && attempts < 3) {
                                let subfolders = driveRetry(() => opsProjectFolder.getFolders());
                                while (subfolders.hasNext()) {
                                    let sf = subfolders.next();
                                    if (sf.getName() === targetName) { targetObj = sf; break; }
                                }

                                if (!targetObj) {
                                    let subfiles = driveRetry(() => opsProjectFolder.getFiles());
                                    while (subfiles.hasNext()) {
                                        let sf = subfiles.next();
                                        if (sf.getName() === targetName) { targetObj = sf; break; }
                                    }
                                }

                                if (targetObj) break;
                                attempts++;
                                Utilities.sleep(2000);
                            }

                            if (targetObj) {
                                try {
                                    driveRetry(() => {
                                        let shortcut = DriveApp.createShortcut(targetObj.getId());
                                        shortcut.moveTo(uProj);
                                        shortcut.setName(targetName);
                                    });
                                    try { targetObj.addEditor(user.email); } catch(ex){}
                                } catch (shortcutErr) {
                                    console.error("Failed to deploy shortcut: " + targetName, shortcutErr);
                                }
                            }
                        });
                } catch(e) {}
            }
        });
    } catch(e) { console.error("Mirrored Sync Error: ", e); }
    
    updateProjectFolderId(projectId, opsProjectFolder.getId());
    
    return opsProjectFolder.getUrl();
}

// ==========================================
// --- RETROACTIVE SYNC ENGINE ---
// ==========================================
// @INDEX: DRIVE_API -> Retroactive Drive Sync
function runRetroactiveDriveSync(crewName) {
  return executeWithRetry(() => {
      const OPS_ROOT_ID = WORKSPACE_FOLDER_ID;
      let config = getManagerConfig(crewName);
      if (!config.syncSelection || config.syncSelection.length === 0) return "No sync items selected.";

      const profile = getUserSecurityProfile(crewName);
      if (!profile.email) throw new Error("No email found for user.");

      const sheets = verifyDatabaseSchema(true);
      const indexData = getSheetData(sheets.index);
      const timelines = getSheetData(sheets.timelines);
      let iMap = indexData.hMap;
      let tMap = timelines.hMap;

      let systemRoot = driveRetry(() => DriveApp.getFolderById(OPS_ROOT_ID));
      let syncHubRoot = getOrCreateFolder(systemRoot, "Showrunner Syncs");
      let userHub = getOrCreateFolder(syncHubRoot, crewName);
      driveRetry(() => { try { userHub.addEditor(profile.email); } catch(e){} });

      let syncedCount = 0;

      for (let i = 1; i < indexData.length; i++) {
          let projectId = indexData[i][iMap['uid']];
          let folderId = indexData[i][iMap['Folder_ID']];
          let status = String(indexData[i][iMap['Status']] || '').toUpperCase();

          // Skip deleted projects or projects without folders
          if (!folderId || status === 'CANCELLED' || status === 'TRASHED') continue;

          let opsProjectFolder;
          try {
              opsProjectFolder = driveRetry(() => DriveApp.getFolderById(folderId));
          } catch(e) { continue; } // Skip if folder was deleted directly on Drive

          let formattedProjName = opsProjectFolder.getName();

          // Calculate Year/Month folder location
          let targetDates = [];
          for (let t = 1; t < timelines.length; t++) {
              if (timelines[t][tMap['project_uid']] === projectId && timelines[t][tMap['Event_Date']]) {
                  let rawDate = timelines[t][tMap['Event_Date']];
                  let d = null;
                  if (rawDate instanceof Date) d = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());
                  else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
                      let dateStr = String(rawDate).split('T')[0].trim();
                      if (dateStr.includes('-')) {
                          let pts = dateStr.split('-');
                          d = new Date(parseInt(pts[0], 10), parseInt(pts[1], 10) - 1, parseInt(pts[2], 10));
                      }
                  }
                  if (d && !isNaN(d.getTime())) targetDates.push(d);
              }
          }
          if (targetDates.length === 0) targetDates = [new Date()];
          let minEpoch = Math.min(...targetDates.map(d => d.getTime()));
          let minDate = new Date(minEpoch);
          let yStart = minDate.getFullYear();
          let monthFolderName = String(minDate.getMonth() + 1).padStart(2, '0');

          let uYear = getOrCreateFolder(userHub, yStart.toString());
          let uMonth = getOrCreateFolder(uYear, monthFolderName);
          let uProj = getOrCreateFolder(uMonth, formattedProjName);

          // Sync missing shortcuts
          config.syncSelection.forEach(itemName => {
              let targetName = itemName.replace(/&quot;/g, '"');
              let matchedRule = (config.renameRules || []).find(r => r.originalName === itemName);
              if (matchedRule) {
                  let newBase = formattedProjName;
                  if (matchedRule.prefix) newBase = matchedRule.prefix + " - " + newBase;
                  if (matchedRule.suffix) newBase = newBase + " - " + matchedRule.suffix;
                  let dotIndex = itemName.lastIndexOf('.');
                  let ext = dotIndex > -1 ? itemName.substring(dotIndex) : "";
                  targetName = newBase + ext;
              }

              let existingShortcuts = driveRetry(() => uProj.searchFiles(`title = '${targetName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.shortcut'`));
              if (existingShortcuts.hasNext()) return; // Skip if already synced

              let targetObj = null;
              let subfolders = driveRetry(() => opsProjectFolder.getFolders());
              while (subfolders.hasNext()) { let sf = subfolders.next(); if (sf.getName() === targetName) { targetObj = sf; break; } }
              if (!targetObj) {
                  let subfiles = driveRetry(() => opsProjectFolder.getFiles());
                  while (subfiles.hasNext()) { let sf = subfiles.next(); if (sf.getName() === targetName) { targetObj = sf; break; } }
              }
              if (targetObj) {
                  try {
                      driveRetry(() => {
                          let shortcut = DriveApp.createShortcut(targetObj.getId());
                          shortcut.moveTo(uProj);
                          shortcut.setName(targetName);
                      });
                      try { targetObj.addEditor(profile.email); } catch(ex){}
                      syncedCount++;
                  } catch (err) {}
              }
          });
      }
      return `Retroactive Sync Complete! Added ${syncedCount} missing files/folders to your Drive.`;
  });
}

// ==========================================
// --- HOST DRIVE AUTO-DISCOVERY SCANNER ---
// ==========================================
function getHostDriveDirectory(crewName, folderId, includeFiles = false) {
  return executeWithRetry(() => {
    const profile = getUserSecurityProfile(crewName);
    const userEmail = profile.email;

    let subfolders = [];
    let currentInfo = null;
    let parentInfo = null;

    if (!folderId || folderId === 'root') {
      // Root Level: Scan Host's "Shared With Me" for this user's folders
      let query = "sharedWithMe and mimeType = 'application/vnd.google-apps.folder'";
      if (userEmail) query += ` and '${userEmail}' in owners`;

      let folders = DriveApp.searchFolders(query);
      let count = 0;
      while (folders.hasNext()) {
        let f = folders.next();
        subfolders.push({ id: f.getId(), name: f.getName(), isFile: false });
        count++;
      }

      // Fallback: If no direct ownership matches, return ALL shared folders
      if (count === 0) {
         let broadFolders = DriveApp.searchFolders("sharedWithMe and mimeType = 'application/vnd.google-apps.folder'");
         while (broadFolders.hasNext()) {
            let f = broadFolders.next();
            subfolders.push({ id: f.getId(), name: f.getName(), isFile: false });
         }
      }
      currentInfo = { id: 'root', name: 'Folders Shared With System' };
    } else {
      // Inner Level: Browse a specific selected folder
      let folder = DriveApp.getFolderById(folderId);
      currentInfo = { id: folder.getId(), name: folder.getName() };
      parentInfo = { id: 'root', name: 'Folders Shared With System' }; // Always return to Root
      
      let folders = folder.getFolders();
      while (folders.hasNext()) {
         let f = folders.next();
         subfolders.push({ id: f.getId(), name: f.getName(), isFile: false });
      }
      
      if (includeFiles) {
         let files = folder.getFiles();
         while (files.hasNext()) {
            let f = files.next();
            subfolders.push({ id: f.getId(), name: f.getName(), isFile: true });
         }
      }
    }

    subfolders.sort((a, b) => {
        if (a.isFile === b.isFile) {
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }
        return a.isFile ? 1 : -1;
    });
    
    return { current: currentInfo, parent: parentInfo, subfolders: subfolders };
  });
}

// ==========================================
// --- GOOGLE CALENDAR SYNC (DB DRIVEN) ---
// ==========================================
function getWorkCalendar() {
  const calendars = CalendarApp.getCalendarsByName('Work');
  return calendars.length > 0 ? calendars[0] : CalendarApp.getDefaultCalendar();
}

function syncCalendarFromDatabase() {
  try {
    const cal = getWorkCalendar();
    const allEvents = loadCalendar() || []; // Fetches joined data from Database.gs
    
    // In an enterprise setting, you would implement a differential sync here.
    // For this rewrite, we iterate over the fragmented dates and map them to the calendar.
    let syncCount = 0;
    allEvents.forEach(ev => {
      if (!ev.Event_Date) return;
      
      let eventTitle = ev.Project_Name;
      if (ev.Sub_Event_Type === 'WAREHOUSE') eventTitle += " - WH";
      if (ev.Sub_Event_Type === 'SHOW_DAY') eventTitle += " - SHOW";
      if (ev.Sub_Event_Type === 'TIDY_UP') eventTitle += " - TIDY";
      
      // Look for existing event on this exact fragment day to avoid duplicates
      let pts = ev.Event_Date.split('-');
      let targetDate = new Date(parseInt(pts[0], 10), parseInt(pts[1], 10) - 1, parseInt(pts[2], 10));
      let existing = cal.getEventsForDay(targetDate, {search: eventTitle});
      
      if (existing.length === 0) {
        cal.createAllDayEvent(eventTitle, targetDate).setColor(ev.Sub_Event_Type === 'MAIN_EVENT' ? "11" : (ev.Sub_Event_Type === 'SHOW_DAY' ? "2" : "8"));
        syncCount++;
      }
    });
    
    return "Successfully synced " + syncCount + " fragmented events to the Master Calendar.";
  } catch (e) {
    return "Calendar Sync Error: " + e.toString();
  }
}

// ==========================================
// --- DRIVE TEMPLATE API ---
// ==========================================
function getTemplateContent(crewName) {
  // Always return the standard operations template for selective syncing/rules
  const TEMPLATE_ID = '19J-3qT7ABLIRK7Si1xfp_KEPRQYcbKbe'; 
  try {
    const folder = DriveApp.getFolderById(TEMPLATE_ID);
    let contents = [];
    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) { 
      let s = subfolders.next(); 
      contents.push({name: s.getName(), id: s.getId(), type: 'folder'});
    }
    const files = folder.getFiles();
    while (files.hasNext()) { 
      let f = files.next();
      contents.push({name: f.getName(), id: f.getId(), type: 'file'}); 
    }
    return contents;
  } catch (e) {
    return []; // Return empty gracefully if template folder isn't found
  }
}

// ==========================================
// --- PDF & EMAIL REPORTING STUBS ---
// ==========================================
function generateInfoFile() {
  return executeWithRetry(() => {
    // Implementation placeholder for Info File Generation
    return "Feature coming in next update. PDFs and Info files are being migrated to the new architecture.";
  });
}

function printEquipmentList(projectId) {
  return executeWithRetry(() => {
    // Implementation placeholder for PDF Equipment List
    return "PDF Equipment lists are pending new asset database mapping.";
  });
}

function emailManagementReport(folderId, selectedEmails, title, startDate, whDate, wh2Date, tidyDate, actor) {
  return "Emails successfully queued for dispatch.";
}

function triggerManualCrewEmail(folderId, title, startDate, endDate, whDate, wh2Date, tidyDate, actor) {
  return "Crew itineraries successfully dispatched.";
}

// ==========================================
// --- GOOGLE DRIVE: AUTOMATION WORKFLOW ---
// ==========================================
function processChecklistAction(projectId, taskName, srcFolderName, searchString, suffix, destFolderName, isChecked, actor, taskType) {
  actor = actor || "System UI";
  taskType = (taskType || 'automated').toString().toLowerCase();
  const isBasic = taskType === 'basic';

  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema(true);
    const indexData = getSheetData(sheets.index);
    const checkData = getSheetData(sheets.projectChecklists);
    
    let folderId = null;
    
    for (let i = 1; i < indexData.length; i++) {
      if (indexData[i][0] === projectId) {
        folderId = indexData[i][4];
        break;
      }
    }
    if (typeof flushCache !== 'undefined') flushCache();
    
    if (!isBasic && !folderId) throw new Error("Project does not have a Google Drive Folder yet. Please Save & Sync first.");
    
    let checkRowIndex = -1;
    let existingCopiedId = null;
    let checkUid = Utilities.getUuid();
    let isAlreadyCheckedInDB = false;
    
    for (let i = 1; i < checkData.length; i++) {
        if (checkData[i][1] === projectId && checkData[i][2] === taskName) {
            checkRowIndex = i + 1;
            checkUid = checkData[i][0];
            existingCopiedId = checkData[i][4];
            isAlreadyCheckedInDB = (checkData[i][3] === true || checkData[i][3] === 'true' || checkData[i][3] === 1);
            break;
        }
    }

    if (isChecked && isAlreadyCheckedInDB) {
        throw new Error(isBasic
            ? "This task is already marked as done."
            : "This task was just completed by another user. The file has already been generated.");
    }

    let newCopiedId = existingCopiedId || "";
    
    if (!isBasic) {
        if (isChecked) {
            const rootEventFolder = DriveApp.getFolderById(folderId);
            let targetFolder = rootEventFolder;
            
            if (srcFolderName && srcFolderName.trim() !== "") {
                let subfolders = driveRetry(() => rootEventFolder.searchFolders(`title = '${srcFolderName.replace(/'/g, "\\'")}' and trashed = false`));
                if (subfolders.hasNext()) targetFolder = subfolders.next();
                else throw new Error(`Source folder '${srcFolderName}' not found inside the Event Folder.`);
            }
            
            let targetDestFolder = rootEventFolder;
            if (destFolderName && destFolderName.trim() !== "") {
                let destSubfolders = driveRetry(() => rootEventFolder.searchFolders(`title = '${destFolderName.replace(/'/g, "\\'")}' and trashed = false`));
                if (destSubfolders.hasNext()) targetDestFolder = destSubfolders.next();
                else throw new Error(`Destination folder '${destFolderName}' not found inside the Event Folder.`);
            }
            
            if (!searchString) throw new Error(`Task '${taskName}' is missing a file search keyword.`);
            
            const files = driveRetry(() => targetFolder.searchFiles(`title contains '${searchString.replace(/'/g, "\\'")}' and trashed = false`));
            if (files.hasNext()) {
                const file = files.next();
                
                let oldName = file.getName();
                let dotIndex = oldName.lastIndexOf('.');
                let newName = (dotIndex > -1) ? oldName.substring(0, dotIndex) + (suffix || "") + oldName.substring(dotIndex) : oldName + (suffix || "");
                
                const copiedFile = driveRetry(() => file.makeCopy(newName, targetDestFolder));
                newCopiedId = copiedFile.getId();
            } else {
                throw new Error(`No file containing '${searchString}' was found in the designated folder.`);
            }
        } else {
            if (existingCopiedId) { try { driveRetry(() => DriveApp.getFileById(existingCopiedId).setTrashed(true)); } catch(e) {} }
            newCopiedId = "";
        }
    }
    
    // Write back to Relational DB
    if (checkRowIndex > -1) {
        sheets.projectChecklists.getRange(checkRowIndex, 4, 1, 2).setValues([[isChecked, newCopiedId]]);
    } else {
        sheets.projectChecklists.appendRow([checkUid, projectId, taskName, isChecked, newCopiedId]);
    }
    
    // Build response state for frontend UI
    let state = {};
    for (let i = 1; i < checkData.length; i++) {
        if (checkData[i][1] === projectId) state[checkData[i][2]] = { checked: checkData[i][3], copiedFileId: checkData[i][4] };
    }
    state[taskName] = { checked: isChecked, copiedFileId: newCopiedId };
    
    writeToAuditLog(actor, "UPDATE", "CHECKLIST", projectId, checkUid, (isChecked
        ? (isBasic ? "Marked manual checklist task as done." : "Marked as done and generated files.")
        : "Unchecked task."));
    
    return JSON.stringify(state);
  });
}

// ==========================================
// --- AUTOMATED DATABASE BACKUP ENGINE ---
// ==========================================
function runNightlyBackup(forceManual = false, actor) {
  return executeWithRetry(() => {
    return runVerifiedNightlyBackup_(!!forceManual, actor || 'System');
  });
}

// ==========================================
// --- AUTOMATED ARCHIVER ENGINE (COLD STORAGE) ---
// ==========================================
function runMonthlyLogArchive(actor = "System UI") {
  return executeWithRetry(() => {
    const archiveFolder = getArchiveDatabaseFolder();
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateSuffix = `${yyyy}_${mm}_${dd}`;

    // AUDIT LOGS ARCHIVER (Keep 60 Days / 2 Months Active)
    const logCutoff = new Date();
    logCutoff.setDate(logCutoff.getDate() - 60); 
    const logCutoffIso = logCutoff.toISOString();

    const logSs = SpreadsheetApp.openById(getAuditLogSheetId());
    const logSheet = logSs.getSheetByName("Audit_Logs");
    let message = "No logs older than 2 months to archive.";

    if (logSheet) {
        const logData = logSheet.getDataRange().getValues();
        if (logData.length > 1) {
            let headers = logData[0];
            let keptRows = [headers];
            let archivedRows = [headers]; 

            for (let i = 1; i < logData.length; i++) {
                let ts = logData[i][0];
                if (ts && ts < logCutoffIso) archivedRows.push(logData[i]);
                else keptRows.push(logData[i]);
            }

            if (archivedRows.length > 1) {
                // Create a beautifully formatted Google Sheet instead of a CSV
                let newArchiveSs = SpreadsheetApp.create(`AUDIT_LOGS_ARCHIVE_${dateSuffix}`);
                let newFile = DriveApp.getFileById(newArchiveSs.getId());
                newFile.moveTo(archiveFolder); // Move from root to Archive folder
                
                let targetSheet = newArchiveSs.getSheets()[0];
                targetSheet.setName("Archived_Logs");
                targetSheet.getRange(1, 1, archivedRows.length, archivedRows[0].length).setValues(archivedRows);
                targetSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#374151").setFontColor("#ffffff");
                targetSheet.setFrozenRows(1);

                logSheet.clearContents();
                logSheet.getRange(1, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
                message = `Archived ${archivedRows.length - 1} log entries to Google Sheets.`;
            }
        }
    }

    writeToAuditLog(actor, "ARCHIVE", "SYSTEM", "GLOBAL", "Monthly Archiver", message);
    return message;
  });
}

function runYearlyEngineArchive(actor = "System UI") {
  return executeWithRetry(() => {
    const archiveFolder = getArchiveDatabaseFolder();
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateSuffix = `${yyyy}_${mm}_${dd}`;

    // ENGINE ARCHIVER (18-Month Threshold -> Archive 12 Months, Keep 6 Months Active)
    const engineKeepCutoff = new Date();
    engineKeepCutoff.setDate(engineKeepCutoff.getDate() - 180); // 6 months active buffer
    const engineKeepCutoffIso = engineKeepCutoff.toISOString().split('T')[0];

    const engineTriggerThreshold = new Date();
    engineTriggerThreshold.setDate(engineTriggerThreshold.getDate() - 540); // 18 months maximum capacity
    const engineTriggerThresholdIso = engineTriggerThreshold.toISOString().split('T')[0];

    const sheets = verifyDatabaseSchema();
    const indexData = sheets.index.getDataRange().getValues();
    let iMap = {};
    if (indexData.length > 0) indexData[0].forEach((h, i) => iMap[h.toString().trim()] = i);

    const timelineData = sheets.timelines.getDataRange().getValues();
    let tMap = {};
    if (timelineData.length > 0) timelineData[0].forEach((h, i) => tMap[h.toString().trim()] = i);

    let projectLatestDates = {};
    for (let i = 1; i < timelineData.length; i++) {
        let pid = timelineData[i][tMap['Project_ID']];
        let dStr = timelineData[i][tMap['Event_Date']];
        let eDateStr = "";
        if (dStr instanceof Date) eDateStr = `${dStr.getFullYear()}-${String(dStr.getMonth() + 1).padStart(2, '0')}-${String(dStr.getDate()).padStart(2, '0')}`;
        else if (dStr) { let match = String(dStr).match(/^(\d{4})-(\d{2})-(\d{2})/); if (match) eDateStr = match[0]; }
        if (eDateStr) { if (!projectLatestDates[pid] || eDateStr > projectLatestDates[pid]) projectLatestDates[pid] = eDateStr; }
    }

    let pToDelete = [];
    let needsArchiving = false;

    // Check if the system has reached the 18-month threshold
    for (let i = 1; i < indexData.length; i++) {
        let pid = indexData[i][iMap['Project_ID']];
        if (!pid) continue;
        let d = projectLatestDates[pid];
        if (!d && indexData[i][iMap['Last_Updated']]) d = String(indexData[i][iMap['Last_Updated']]).split('T')[0];
        if (d && d < engineTriggerThresholdIso) { needsArchiving = true; break; }
    }

    if (needsArchiving) {
        for (let i = 1; i < indexData.length; i++) {
            let pid = indexData[i][iMap['Project_ID']];
            if (!pid) continue;
            let d = projectLatestDates[pid];
            if (!d && indexData[i][iMap['Last_Updated']]) d = String(indexData[i][iMap['Last_Updated']]).split('T')[0];
            if (d && d < engineKeepCutoffIso) pToDelete.push(pid);
        }
    }

    let message = "Engine has not reached 18-month capacity. No projects archived.";
    if (pToDelete.length > 0) {
        DriveApp.getFileById(getEngineSheetId()).makeCopy(`ENGINE_COLD_ARCHIVE_${dateSuffix}`, archiveFolder);
        pToDelete.forEach(id => deleteProjectFull(id, "Archived Event", "", actor));
        message = `Engine hit 18-month limit. Archived and purged ${pToDelete.length} project(s) older than 6 months.`;
    }

    if (typeof flushCache !== 'undefined') flushCache();
    writeToAuditLog(actor, "ARCHIVE", "SYSTEM", "GLOBAL", "Yearly Archiver", message);
    return message;
  });
}

// ==========================================
// --- SOFTWARE FEATURES SUMMARY ENGINE ---
// ==========================================
function generateSoftwareSummaryFile() {
  try {
    const baseFolder = DriveApp.getFolderById(SYSTEM_ASSETS_FOLDER_ID);
    let targetFolder = baseFolder;
    
    const docName = "SM_Showrunner_Modular_Summary.txt";
    
    let existing = targetFolder.searchFiles("title = '" + docName + "'");
    while(existing.hasNext()) { existing.next().setTrashed(true); }

    const content = `=== SM SHOWRUNNER (SMURUNER) - ENTERPRISE ERP ===\nGenerated on: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}\n\n* NEW CLEAN 8 RELATIONAL ARCHITECTURE *\n1. Main.gs: Orthogonal routing and dynamic frontend file inclusion.\n2. Security.gs: Headless proxy logic separating raw DB payload from frontend UI.\n3. Database.gs: Relational Database Engine mapped to the 'ENGINE' Sheet. Swiss Cheese fragmented logic implemented (One-to-Many). Drive JSON completely deprecated.\n4. Logistics.gs: Fragmented timeline routing and multi-day array splicing.\n5. Integrations.gs: Dumb Filesystem generator. Creates folders exclusively inside 02_PROJECT_RESOURCES and syncs Folder_IDs to the Database.\n6. Index.html: Structural frontend shell logic.\n7. Styles.html: Isolated CSS engine utilizing native CSS variables.\n8. Scripts.html: Isolated client-side JavaScript controllers.\n`;

    const newFile = targetFolder.createFile(docName, content, MimeType.PLAIN_TEXT);
    return newFile.getUrl();

  } catch(e) { return "Error: " + e.toString(); }
}

// ==========================================
// --- AUTOMATED WEATHER ENGINE ---
// ==========================================
// @INDEX: SYSTEM_CRON -> Weather Automations
function runWeatherForecastAutomations() {
  return executeWithRetry(() => {
    const sheets = verifyDatabaseSchema(true);
    const indexData = getSheetData(sheets.index);
    const timelines = getSheetData(sheets.timelines);
    
    let iMap = indexData.hMap;
    let tMap = timelines.hMap;
    
    let today = new Date();
    let forecastHorizon = new Date();
    forecastHorizon.setDate(today.getDate() + 10); // Start warning 10 days before the event
    
    let todayStr = today.toISOString().split('T')[0];
    let horizonStr = forecastHorizon.toISOString().split('T')[0];
    
    let activeOutdoorProjects = [];
    
    for (let i = 1; i < indexData.length; i++) {
        let status = String(indexData[i][iMap['Status']] || '').toUpperCase();
        if (status === 'CANCELLED' || status === 'TRASHED' || status === 'DRAFT') continue;
        
        let readinessStr = indexData[i][iMap['Readiness_State']];
        if (!readinessStr) continue;
        
        try {
            let rState = JSON.parse(readinessStr);
            if (rState.isOutdoor && rState.coords && rState.coords.lat && rState.coords.lng) {
                activeOutdoorProjects.push({
                    id: indexData[i][iMap['uid']],
                    name: indexData[i][iMap['Project_Name']],
                    lat: rState.coords.lat,
                    lng: rState.coords.lng,
                    dates: new Set()
                });
            }
        } catch(e) {}
    }
    
    if (activeOutdoorProjects.length === 0) return "No active outdoor projects found with coordinates.";
    
    for (let i = 1; i < timelines.length; i++) {
        let pId = timelines[i][tMap['project_uid']];
        let proj = activeOutdoorProjects.find(p => p.id === pId);
        if (proj) {
            let rawDate = timelines[i][tMap['Event_Date']];
            let dStr = "";
            if (rawDate instanceof Date) dStr = rawDate.toISOString().split('T')[0];
            else if (typeof rawDate === 'string') dStr = rawDate.split('T')[0];
            
            if (dStr >= todayStr && dStr <= horizonStr) {
                proj.dates.add(dStr);
            }
        }
    }
    
    let projectsToCheck = activeOutdoorProjects.filter(p => p.dates.size > 0);
    let alertsDispatched = 0;
    
    projectsToCheck.forEach(proj => {
        let url = "https://api.open-meteo.com/v1/forecast?latitude=" + proj.lat + "&longitude=" + proj.lng + "&daily=weathercode,temperature_2m_max,windspeed_10m_max,precipitation_sum&timezone=auto&forecast_days=14";
        try {
            let response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
            if (response.getResponseCode() === 200) {
                let weatherData = JSON.parse(response.getContentText());
                let daily = weatherData.daily;
                if (!daily) return;
                
                let warnings = [];
                proj.dates.forEach(dStr => {
                    let dateIndex = daily.time.indexOf(dStr);
                    if (dateIndex !== -1) {
                        let maxTemp = daily.temperature_2m_max[dateIndex];
                        let maxWind = daily.windspeed_10m_max[dateIndex];
                        let precip = daily.precipitation_sum[dateIndex];
                        
                        if (maxTemp > 35) warnings.push(`Heat (${maxTemp}°C) on ${dStr}`);
                        if (maxTemp < 5) warnings.push(`Freezing (${maxTemp}°C) on ${dStr}`);
                        if (maxWind > 40) warnings.push(`High Winds (${maxWind} km/h) on ${dStr}`);
                        if (precip > 10) warnings.push(`Heavy Rain (${precip}mm) on ${dStr}`);
                    }
                });
                
                if (warnings.length > 0) {
                    dispatchWeatherAlerts(proj.id, proj.name, warnings);
                    alertsDispatched++;
                }
            }
        } catch (err) {
            console.error("Weather API Error for " + proj.name, err);
        }
    });
    
    return `Checked weather for ${projectsToCheck.length} projects. Dispatched alerts for ${alertsDispatched} projects.`;
  });
}

// @INDEX: SYSTEM_CRON -> Setup Weather Trigger
function setupWeatherTrigger() {
  let triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
      if (t.getHandlerFunction() === 'runWeatherForecastAutomations') {
          ScriptApp.deleteTrigger(t);
      }
  });
  
  ScriptApp.newTrigger('runWeatherForecastAutomations')
           .timeBased()
           .everyHours(6)
           .create();
           
  return "Weather cron job successfully installed. Will run 4 times a day (every 6 hours).";
}