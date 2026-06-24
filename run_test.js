
let currentProjectAssets = [
    { assetId: 'CHILD-1', qty: '6', formula: 'Standalone', location: 'General' },
    { assetId: 'CHILD-2', qty: '1', formula: 'Standalone', location: 'General' },
    { assetId: 'CHILD-3', qty: '0.25', formula: 'Standalone', location: 'General' }
];

let globalAssets = [
    { id: 'CHILD-1', name: 'Par Can', containerType: 'CASE-1' },
    { id: 'CHILD-2', name: 'Strobe', containerType: 'Strobe Case ' },
    { id: 'CHILD-3', name: 'Fluid Kit Comp', containerType: 'CASE-3', isConsumable: true },
    { id: 'CASE-1', name: 'Par Can Meatrack', capacity: '4' },
    { id: 'CASE-2', name: 'Strobe Case', capacity: '2' },
    { id: 'CASE-3', name: 'Fluid Case', capacity: '1' }
];

let window = {
    insertIntoProjectAssets: function(obj) {
        currentProjectAssets.push(obj);
    }
};

function recalcAutoContainers() {
    if (!currentProjectAssets) return;
    
    let usedContainerUids = new Set();
    currentProjectAssets.forEach(pa => {
        if (pa.containerUid) usedContainerUids.add(pa.containerUid);
    });
    
    // Backup existing auto containers to preserve UIDs and truck spatial data
    let existingAuto = currentProjectAssets.filter(pa => pa.isAuto || pa.formula === 'Auto-Container');
    currentProjectAssets = currentProjectAssets.filter(pa => !pa.isAuto && pa.formula !== 'Auto-Container');
    
    // 2. Identify fixtures that need packing
    let fixturesToPack = [];
    currentProjectAssets.forEach(pa => {
        if (pa.isAuto) return; 
        let asset = globalAssets.find(a => a.id === pa.assetId);
        if (asset && asset.containerType && String(asset.containerType).trim() !== '') {
            let pUuidMatch = globalAssets.find(p => p.id === asset.containerType);
            let pNameMatch = globalAssets.find(p => String(p.name || '').toLowerCase().trim() === String(asset.containerType || '').toLowerCase().trim() && parseFloat(p.capacity) > 0);
            let parent = pUuidMatch || pNameMatch;
            if (parent && parent.capacity && parseFloat(parent.capacity) > 0) {
                fixturesToPack.push({ pa, asset, parent });
            }
        }
    });

    let containerCounts = {};
    fixturesToPack.forEach(f => {
        let locKey = (f.pa.location || 'General') + "|||" + (f.pa.formula || 'Standalone');
        if (!containerCounts[locKey]) containerCounts[locKey] = {};
        if (!containerCounts[locKey][f.parent.id]) containerCounts[locKey][f.parent.id] = 0;
        let isCons = (f.asset.isConsumable === true || f.asset.isConsumable === 'true');
        containerCounts[locKey][f.parent.id] += isCons ? (parseFloat(f.pa.qty) || 0) : (parseInt(f.pa.qty, 10) || 0);
    });
    
    Object.keys(containerCounts).forEach(locKey => {
        let pts = locKey.split("|||");
        let loc = pts[0];
        let form = pts[1];
        
        Object.keys(containerCounts[locKey]).forEach(parentId => {
            let parent = globalAssets.find(p => p.id === parentId);
            let cap = parseFloat(parent.capacity) || 1;
            let needed = Math.ceil(containerCounts[locKey][parentId] / cap);
            
            // AUTO-BUMP: If the user draws a partial case and there's only one type of component in this case group, round up the component quantity to fill the case.
            let bumpGroup = fixturesToPack.filter(f => f.parent.id === parentId && (f.pa.location || 'General') === loc && (f.pa.formula || 'Standalone') === form && !f.pa.isExplicitlyUnpacked);
            let totalCap = needed * cap;
            let currentCount = containerCounts[locKey][parentId];
            
            if (bumpGroup.length > 0 && totalCap > currentCount) {
                let allSame = bumpGroup.every(f => f.pa.assetId === bumpGroup[0].pa.assetId);
                if (allSame) {
                    let diff = totalCap - currentCount;
                    let samplePa = bumpGroup[0].pa;
                    let isCons = (bumpGroup[0].asset.isConsumable === true || bumpGroup[0].asset.isConsumable === 'true');
                    let isBulk = (bumpGroup[0].asset.type === 'Bulk');
                    
                    if (isCons || isBulk) {
                        samplePa.qty = isCons ? (parseFloat(samplePa.qty) + diff) : (parseInt(samplePa.qty, 10) + diff);
                    } else {
                        for (let k = 0; k < diff; k++) {
                            let clone = {...samplePa, qty: 1};
                            delete clone.uid; delete clone.truckX; delete clone.truckY; delete clone.truckZ;
                            if (typeof window.insertIntoProjectAssets === 'function') window.insertIntoProjectAssets(clone);
                            else currentProjectAssets.push(clone);
                            fixturesToPack.push({ pa: clone, asset: bumpGroup[0].asset, parent: bumpGroup[0].parent });
                        }
                    }
                    containerCounts[locKey][parentId] = totalCap;
                }
            }

            let manualQty = 0;
            currentProjectAssets.forEach(pa => {
                if (pa.assetId === parentId && !pa.isAuto && (pa.location || 'General') === loc && (pa.formula || 'Standalone') === form) {
                    let isCons = (parent.isConsumable === true || parent.isConsumable === 'true');
                    manualQty += isCons ? (parseFloat(pa.qty) || 0) : (parseInt(pa.qty, 10) || 0);
                }
            });
            
            let autoNeeded = needed - manualQty;
            if (autoNeeded > 0) {
                let validRecycled = existingAuto.filter(pa => pa.assetId === parentId && (pa.location || 'General') === loc && (pa.formula || 'Standalone') === form);
                
                existingAuto = existingAuto.filter(pa => !(pa.assetId === parentId && (pa.location || 'General') === loc && (pa.formula || 'Standalone') === form));
                
                let remainingNeeded = autoNeeded;
                
                validRecycled.forEach(recycled => {
                    let rQty = parseInt(recycled.qty, 10) || 1;
                    if (remainingNeeded > 0) {
                        let take = Math.min(rQty, remainingNeeded);
                        for (let k = 0; k < take; k++) {
                            let clone = {...recycled, qty: 1};
                            if (k > 0) { 
                                delete clone.uid; delete clone.truckX; delete clone.truckY; delete clone.truckZ; 
                            }
                                if (typeof window.insertIntoProjectAssets === 'function') window.insertIntoProjectAssets(clone);
                                else currentProjectAssets.push(clone);
                        }
                        remainingNeeded -= take;
                    }
                });
                
                if (remainingNeeded > 0) {
                    for (let k = 0; k < remainingNeeded; k++) {
                        if (typeof window.insertIntoProjectAssets === 'function') window.insertIntoProjectAssets({ assetId: parentId, qty: 1, formula: form, location: loc, isAuto: true });
                        else currentProjectAssets.push({ assetId: parentId, qty: 1, formula: form, location: loc, isAuto: true });
                    }
                }
            }

            // EXPLICITLY LINK ITEMS WITHOUT SLICING
            let cid = form !== 'Standalone' ? (parentId + "|||" + form) : parentId;
            let itemsInGroup = fixturesToPack.filter(f => f.parent.id === parentId && (f.pa.location || 'General') === loc && (f.pa.formula || 'Standalone') === form && !f.pa.isExplicitlyUnpacked);
            
            itemsInGroup.forEach(f => {
                f.pa.containerUid = cid;
            });
        });
    });
    
    // FINAL STEP: Salvage any auto-containers that are actively holding cargo
    existingAuto.forEach(leftover => {
        let cid = (leftover.formula && leftover.formula !== 'Standalone') ? (leftover.assetId + "|||" + leftover.formula) : leftover.assetId;
        if (usedContainerUids.has(cid)) {
            if (typeof window.insertIntoProjectAssets === 'function') window.insertIntoProjectAssets(leftover);
            else currentProjectAssets.push(leftover);
        }
    });
}

console.log("Before:", currentProjectAssets.length);
recalcAutoContainers();
console.log("After:", currentProjectAssets.length);
console.log(currentProjectAssets);
