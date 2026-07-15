# DAL client inventory (generated)

**Regenerate:** `node scripts/dal-client-inventory.js` · **Pre-ship:** `--check` must match this file when DAL hot paths change · **Handbook:** [dal-pre-ship-gates.md](dal-pre-ship-gates.md)

**Generated:** 2026-07-15 · **Root HTML modules scanned:** 92

**Campaign:** [data-access-layer.md](data-access-layer.md) · **Server discovery:** [dal-phase0-discovery-2026-07-13.md](dal-phase0-discovery-2026-07-13.md)

---

## `google.script.run` by server function

| Server function | Client files |
|-----------------|--------------|
| `getBootPayload` | `01a_Calendar_Core.html` |
| `getClientsVault` | `01a_Calendar_Core.html` |
| `getRefreshPayload` | `01a_Calendar_Core.html`, `11_Station_Shell.html`, `11c_Station_Core_2.html`, `11h_Station_Project_Logic_2.html` |
| `getVehiclesVault` | `01a_Calendar_Core.html`, `06d_Admin_Fleet.html` |
| `clearAllNotifications` | `01b_Calendar_Tasks.html` |
| `deleteNotification` | `01b_Calendar_Tasks.html` |
| `deleteTaskData` | `01b_Calendar_Tasks.html` |
| `getTasksNotifsPayload` | `01b_Calendar_Tasks.html` |
| `markSingleNotifRead` | `01b_Calendar_Tasks.html` |
| `postponeNotification` | `01b_Calendar_Tasks.html` |
| `saveTaskData` | `01b_Calendar_Tasks.html` |
| `getAssetRegistry` | `01d_Calendar_Mobile.html`, `02_Project_Editor_Logistics.html`, `02a_Project_Equipment.html`, `06b1_Admin_Assets_Core.html`, `11_Station_Shell.html`, `11c_Station_Core_2.html` |
| `provisionNewAsset` | `01d_Calendar_Mobile.html`, `06b2_Admin_Assets_Form.html`, `06f_Admin_Audit.html` |
| `getProjectAssets` | `01h_Mobile_Assets.html`, `02_Project_Editor_Logistics.html`, `02a_Project_Equipment.html`, `02e5_Logic_Sync.html`, `02e7_Dal_Firestore_Client.html` |
| `updateProjectReadiness` | `01h_Mobile_Assets.html`, `02_Project_Editor_Logistics.html`, `02d_Equipment_Render.html`, `03a_Timeline_Boot.html` |
| `getDesktopLockPrefix` | `01i_Desktop_Lock.html` |
| `verifyDesktopLockUnlock` | `01i_Desktop_Lock.html` |
| `getMobileScanBootstrap` | `01j_Mobile_Scan.html` |
| `pullStagedMobileScan` | `01j_Mobile_Scan.html` |
| `resolveMobileScanTag` | `01j_Mobile_Scan.html` |
| `setMobileAssetStatus` | `01j_Mobile_Scan.html` |
| `batchProcessOperations` | `02c_Project_Operations.html` |
| `finalizeEventOperation` | `02c_Project_Operations.html` |
| `processRfidScan` | `02c_Project_Operations.html` |
| `saveProjectAssetsDelta` | `02c_Project_Operations.html`, `02e5_Logic_Sync.html` |
| `startEventOperation` | `02c_Project_Operations.html` |
| `closeDalSession` | `02e6_Dal_Session.html`, `03a1_Timeline_Dal_Session.html` |
| `getDalSessionInfo` | `02e6_Dal_Session.html`, `03a1_Timeline_Dal_Session.html` |
| `openDalSession` | `02e6_Dal_Session.html` |
| `getDalFirebaseClientAuth` | `02e7_Dal_Firestore_Client.html` |
| `deleteProjectFull` | `02_Project_Editor_Core.html` |
| `generateProjectFolders` | `02_Project_Editor_Core.html` |
| `printEquipmentList` | `02_Project_Editor_Core.html` |
| `reportProjectPresence` | `02_Project_Editor_Core.html`, `03a_Timeline_Boot.html` |
| `restoreProjectWithConflictCheck` | `02_Project_Editor_Core.html` |
| `saveEventFromUI` | `02_Project_Editor_Core.html` |
| `setProjectStatus` | `02_Project_Editor_Core.html` |
| `triggerManualCrewEmail` | `02_Project_Editor_Core.html` |
| `generateLogisticsPayloadAPI` | `02_Project_Editor_Logistics.html` |
| `getTimelineData` | `02_Project_Editor_Logistics.html`, `03a_Timeline_Boot.html` |
| `saveTimelineData` | `02_Project_Editor_Logistics.html`, `03a_Timeline_Boot.html` |
| `saveTruckArrangementAPI` | `02_Project_Editor_Logistics.html`, `05a_Truck_Arrangement.html` |
| `beginDalSession` | `03a1_Timeline_Dal_Session.html` |
| `finishDalSession` | `03a1_Timeline_Dal_Session.html` |
| `getGlobalMonthData` | `04b_Equipment_Tracker.html` |
| `getUnifiedTrackerData` | `04b_Equipment_Tracker.html` |
| `deleteLeave` | `04_Month_Roster.html`, `07_Core_Globals.html` |
| `saveLeave` | `04_Month_Roster.html` |
| `deleteWarehouseEntity` | `05_Warehouse_Engine.html` |
| `getWarehouseData` | `05_Warehouse_Engine.html`, `06_System_Admin.html`, `06b1_Admin_Assets_Core.html`, `06b2_Admin_Assets_Form.html` |
| `saveWarehouseArea` | `05_Warehouse_Engine.html` |
| `saveWarehouseDraft` | `05_Warehouse_Engine.html` |
| `saveWarehouseRoot` | `05_Warehouse_Engine.html` |
| `saveWarehouseZone` | `05_Warehouse_Engine.html` |
| `deleteRoleConfig` | `06a_Admin_IAM.html` |
| `deleteUserFromVault` | `06a_Admin_IAM.html` |
| `getSecureIamDirectory` | `06a_Admin_IAM.html` |
| `provisionNewUser` | `06a_Admin_IAM.html` |
| `saveDirectoryUpdate` | `06a_Admin_IAM.html` |
| `saveRoleConfig` | `06a_Admin_IAM.html` |
| `deleteVaultAsset` | `06b1_Admin_Assets_Core.html`, `06f_Admin_Audit.html` |
| `getAuditFlags` | `06b1_Admin_Assets_Core.html` |
| `getReviewedAssets` | `06b1_Admin_Assets_Core.html` |
| `setAssetReviewedStatus` | `06b1_Admin_Assets_Core.html`, `06b2_Admin_Assets_Form.html` |
| `getVaultAsset` | `06b2_Admin_Assets_Form.html`, `06f_Admin_Audit.html` |
| `saveVaultAsset` | `06b2_Admin_Assets_Form.html`, `06e_Admin_Automation.html`, `06f_Admin_Audit.html` |
| `clearAllAuditFlags` | `06b3_Admin_Assets_Audit.html` |
| `resolveAuditGroup` | `06b3_Admin_Assets_Audit.html` |
| `saveAuditGroups` | `06b3_Admin_Assets_Audit.html` |
| `getModuleVisualSettings` | `06c_Admin_Visuals.html` |
| `saveModuleVisualSettings` | `06c_Admin_Visuals.html` |
| `saveSystemSettings` | `06c_Admin_Visuals.html` |
| `deleteVehicleVault` | `06d_Admin_Fleet.html` |
| `saveVehicleVault` | `06d_Admin_Fleet.html` |
| `getEntityAuditHistory` | `06e_Admin_Automation.html` |
| `getHostDriveDirectory` | `06e_Admin_Automation.html` |
| `getManagerConfig` | `06e_Admin_Automation.html` |
| `processChecklistAction` | `06e_Admin_Automation.html` |
| `runMonthlyLogArchive` | `06e_Admin_Automation.html` |
| `runRetroactiveDriveSync` | `06e_Admin_Automation.html` |
| `runYearlyEngineArchive` | `06e_Admin_Automation.html` |
| `saveManagerConfig` | `06e_Admin_Automation.html` |
| `saveSystemTags` | `06e_Admin_Automation.html` |
| `backupDatabaseFile` | `06g_Admin_Database.html` |
| `getLiveDatabaseStatus` | `06g_Admin_Database.html` |
| `repairLiveDatabaseLayout` | `06g_Admin_Database.html` |
| `restoreDatabaseFromBackup` | `06g_Admin_Database.html` |
| `revertDatabaseOperation` | `06g_Admin_Database.html` |
| `deleteStationProfileConfig` | `06h_Admin_Station_Profiles.html` |
| `getSecureStationProfilesDirectory` | `06h_Admin_Station_Profiles.html` |
| `saveStationProfileConfig` | `06h_Admin_Station_Profiles.html` |
| `deleteClientVault` | `06_System_Admin.html` |
| `provisionNewClient` | `06_System_Admin.html` |
| `apiLogoutSession` | `07_Core_Globals.html` |
| `beginDatabaseBackupLock` | `07_Core_Globals.html` |
| `changeMyPasscode` | `07_Core_Globals.html` |
| `endDatabaseBackupLock` | `07_Core_Globals.html` |
| `getDatabaseBackupHealth` | `07_Core_Globals.html` |
| `runNightlyBackup` | `07_Core_Globals.html` |
| `acknowledgeConflict` | `08_Conflict_Manager.html` |
| `approveShiftPayments` | `09_Financials_Hub.html` |
| `getFinancialSettings` | `09_Financials_Hub.html` |
| `getFinancialsData` | `09_Financials_Hub.html` |
| `saveFinancialSettings` | `09_Financials_Hub.html` |
| `setProjectDifficultyMultiplier` | `09_Financials_Hub.html` |
| `issueFcmRegistrationKey` | `10a_Notifications_Boot.html` |
| `prepareFcmRegistrationBridge` | `10a_Notifications_Boot.html` |
| `saveMyFcmDeviceToken` | `10a_Notifications_Boot.html` |
| `cleanupFcmDevicesForUser` | `10c_Notifications_Admin.html` |
| `getFcmDevicesFleetAdminDetail` | `10c_Notifications_Admin.html` |
| `getFirebasePushSetupStatus` | `10c_Notifications_Admin.html` |
| `revokeFcmDeviceByTokenKey` | `10c_Notifications_Admin.html` |
| `saveFcmDeviceToken` | `10c_Notifications_Admin.html` |
| `saveFirebaseVapidKey` | `10c_Notifications_Admin.html` |
| `sendTestPushNotification` | `10c_Notifications_Admin.html` |
| `sendTestPushToDevice` | `10c_Notifications_Admin.html` |
| `getStationHostProjects` | `11_Station_Shell.html`, `11c_Station_Core_2.html` |
| `getStationWarehouseProjects` | `11_Station_Shell.html`, `11c_Station_Core_2.html` |
| `getStationShellBootstrap` | `11_Station_Shell.html`, `11c_Station_Init.html` |
| `getStationEquipmentRfidMap` | `11_Station_Shell.html`, `11d_Station_Rfid.html` |
| `processStationRfidScan` | `11_Station_Shell.html`, `11d_Station_Rfid_3.html` |
| `setStationAssetStatus` | `11_Station_Shell.html`, `11e_Station_ScanPanel.html`, `11g_Station_Vault_2.html` |
| `getStationVaultList` | `11_Station_Shell.html`, `11g_Station_Vault.html` |
| `recordStationAssetRfid` | `11_Station_Shell.html`, `11g_Station_Vault_2.html` |
| `enrollStationCrewRfidTag` | `11_Station_Shell.html`, `11g_Station_Vault_Crew.html` |
| `getStationCrewRfidList` | `11_Station_Shell.html`, `11g_Station_Vault_Crew.html` |

## `localStorage` keys

| Key | Client files |
|-----------------|--------------|
| `sm_clients_cache` | `01a_Calendar_Core.html`, `06_System_Admin.html` |
| `sm_fleet_cache` | `01a_Calendar_Core.html`, `06d_Admin_Fleet.html` |
| `sm_phantom_payload` | `01a_Calendar_Core.html`, `01b_Calendar_Tasks.html`, `01e_Mobile_Crew_Hub.html`, `08_Conflict_Manager.html`, `11_Station_Shell.html`, `11c_Station_Core_2.html`, `11h_Station_Project_Logic_2.html`, `11m_Station_Dock_Logic.html` |
| `sm_tasks_notifs_cache` | `01b_Calendar_Tasks.html` |
| `sm_pa_cache_` | `01h_Mobile_Assets.html` |
| `sm_lock_idle_min_` | `01i_Desktop_Lock.html` |
| `sm_mobile_qr_pending` | `01j_Mobile_Scan.html` |
| `sm_mobile_scan_reopen_panel` | `01j_Mobile_Scan.html` |
| `sm_session_token` | `01j_Mobile_Scan.html`, `07_Core_Globals.html`, `Index.html`, `Login.html` |
| `sm_vault_cache` | `02a_Project_Equipment.html`, `06b1_Admin_Assets_Core.html`, `06b2_Admin_Assets_Form.html`, `11_Station_Shell.html`, `11c_Station_Core_2.html` |
| `sm_offer_lang` | `02d_Equipment_Render.html`, `02g_Project_Reports.html` |
| `sm_company_name` | `02g_Project_Reports.html` |
| `sm_logistics_def_` | `02_Project_Editor_Logistics.html` |
| `sm_wh_cache` | `06_System_Admin.html`, `06b1_Admin_Assets_Core.html` |
| `sm_user_theme` | `07_Core_Globals.html` |
| `sr_fcm_reg_key` | `10a_Notifications_Boot.html`, `Index.html` |
| `sm_auto_login_off_` | `Index.html`, `Login.html` |
| `sm_session_expires` | `Index.html`, `Login.html` |
| `sm_crew_name` | `Login.html` |
| `sm_lock_prefix_` | `Login.html` |

## Per-file summary

| File | `google.script.run` calls | `localStorage` keys |
|---------------------|---------------------------|---------------------|
| 00a_UI_Layers.html | 0 | 0 |
| 00b_UI_Hubs.html | 0 | 0 |
| 00c_UI_Forms.html | 0 | 0 |
| 00d_UI_Visuals.html | 0 | 0 |
| 00e_UI_Modals.html | 0 | 0 |
| 01a_Calendar_Core.html | 4 | 3 |
| 01b_Calendar_Tasks.html | 7 | 2 |
| 01c_Calendar_Mini.html | 0 | 0 |
| 01d_Calendar_Mobile.html | 2 | 0 |
| 01e_Mobile_Crew_Hub.html | 0 | 1 |
| 01f_Mobile_Phase_Rail.html | 0 | 0 |
| 01g_Mobile_Tasks.html | 0 | 0 |
| 01h_Mobile_Assets.html | 2 | 1 |
| 01i_Desktop_Lock.html | 2 | 1 |
| 01j_Mobile_Scan.html | 4 | 3 |
| 02_Project_Editor_Core.html | 8 | 0 |
| 02_Project_Editor_Logistics.html | 7 | 1 |
| 02_Project_Editor_Map.html | 0 | 0 |
| 02a_Project_Equipment.html | 2 | 1 |
| 02b_Project_Syntax.html | 0 | 0 |
| 02c_Project_Operations.html | 5 | 0 |
| 02d_Equipment_Render.html | 1 | 1 |
| 02e1_Logic_State.html | 0 | 0 |
| 02e2_Logic_CRUD.html | 0 | 0 |
| 02e3_Logic_Clipboard.html | 0 | 0 |
| 02e4_Logic_Containers.html | 0 | 0 |
| 02e5_Logic_Sync.html | 2 | 0 |
| 02e6_Dal_Session.html | 3 | 0 |
| 02e7_Dal_Firestore_Client.html | 2 | 0 |
| 02g_Project_Reports.html | 0 | 2 |
| 03a_Timeline_Boot.html | 4 | 0 |
| 03a1_Timeline_Dal_Session.html | 4 | 0 |
| 03b_Timeline_Shifts.html | 0 | 0 |
| 03c_Timeline_Phases.html | 0 | 0 |
| 03d_Timeline_Crew.html | 0 | 0 |
| 03e_Timeline_UX.html | 0 | 0 |
| 03f_Timeline_Mobile.html | 0 | 0 |
| 04_Month_Roster.html | 2 | 0 |
| 04b_Equipment_Tracker.html | 2 | 0 |
| 05_Warehouse_Engine.html | 6 | 0 |
| 05a_Truck_Arrangement.html | 1 | 0 |
| 05b_Loadin_Plan.html | 0 | 0 |
| 06_System_Admin.html | 3 | 2 |
| 06a_Admin_IAM.html | 6 | 0 |
| 06b1_Admin_Assets_Core.html | 6 | 2 |
| 06b2_Admin_Assets_Form.html | 5 | 1 |
| 06b3_Admin_Assets_Audit.html | 3 | 0 |
| 06b4_Admin_Assets_QR.html | 0 | 0 |
| 06c_Admin_Visuals.html | 3 | 0 |
| 06d_Admin_Fleet.html | 3 | 1 |
| 06e_Admin_Automation.html | 10 | 0 |
| 06f_Admin_Audit.html | 4 | 0 |
| 06g_Admin_Database.html | 5 | 0 |
| 06h_Admin_Station_Profiles.html | 3 | 0 |
| 07_Core_Globals.html | 7 | 2 |
| 07b_Grid_Engine.html | 0 | 0 |
| 07c_Generalization_Engine.html | 0 | 0 |
| 08_Conflict_Manager.html | 1 | 1 |
| 09_Financials_Hub.html | 5 | 0 |
| 10a_Notifications_Boot.html | 3 | 1 |
| 10c_Notifications_Admin.html | 8 | 0 |
| 11_Station_Shell.html | 12 | 2 |
| 11a_Station_Gun_Drivers.html | 0 | 0 |
| 11b_Station_Styles.html | 0 | 0 |
| 11c_Station_Core_2.html | 4 | 2 |
| 11c_Station_Core_3.html | 0 | 0 |
| 11c_Station_Core_4.html | 0 | 0 |
| 11c_Station_Core.html | 0 | 0 |
| 11c_Station_Init.html | 1 | 0 |
| 11d_Station_Rfid_2.html | 0 | 0 |
| 11d_Station_Rfid_3.html | 1 | 0 |
| 11d_Station_Rfid.html | 1 | 0 |
| 11e_Station_ScanPanel.html | 1 | 0 |
| 11f_Station_Vault.html | 0 | 0 |
| 11g_Station_Vault_2.html | 2 | 0 |
| 11g_Station_Vault_Crew.html | 2 | 0 |
| 11g_Station_Vault.html | 1 | 0 |
| 11h_Station_Project_Logic_2.html | 1 | 1 |
| 11h_Station_Project_Logic.html | 0 | 0 |
| 11h_Station_Project.html | 0 | 0 |
| 11i_Station_Settings_Logic.html | 0 | 0 |
| 11i_Station_Settings.html | 0 | 0 |
| 11j_Station_Phone_UI.html | 0 | 0 |
| 11k_Station_Dock_UI.html | 0 | 0 |
| 11l_Station_Dock_Scale.html | 0 | 0 |
| 11m_Station_Dock_Logic.html | 0 | 1 |
| 11n_Station_Dock_Screensaver.html | 0 | 0 |
| Index.html | 0 | 4 |
| Login.html | 0 | 5 |
| Styles_Mobile.html | 0 | 0 |
| Styles.html | 0 | 0 |
| Widget.html | 0 | 0 |

---

*Do not hand-edit — regenerate with `node scripts/dal-client-inventory.js`.*
