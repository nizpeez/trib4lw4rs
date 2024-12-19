if (window.location.href.indexOf('&screen=main') < 0) {
    window.location.assign(game_data.link_base_pure + "main");
}

var sourceID = 0;
var resource = {};
var sources = [];
var WHWoodCap = game_data.village.wood;
var WHStoneCap = game_data.village.stone;
var WHIronCap = game_data.village.iron;
var WHCap = game_data.village.storage_max;

$("#building_wrapper").prepend(`
<table>
    <tr>
        <th id="currentSelection">No village chosen</th>
        <th>Set Resources:</th>
        <td class="res"><span class="icon header wood"></span><input type="number" id="manualWood" placeholder="Wood" style="width: 60px;"></td>
        <td class="res"><span class="icon header stone"></span><input type="number" id="manualStone" placeholder="Stone" style="width: 60px;"></td>
        <td class="res"><span class="icon header iron"></span><input type="number" id="manualIron" placeholder="Iron" style="width: 60px;"></td>
        <td>
            <input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="manualRequest" value="Request Resources" onclick="manualRequestRes()">
        </td>
        <td>
            <input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="showSourceSelect" value="Change Source" onclick="showSourceSelect()">
        </td>
    </tr>
</table>
`);

function showSourceSelect() {
    sources = [];
    $.get("/game.php?&screen=overview_villages&mode=prod&group=0&page=-1&", function (resourcePage) {
        let rowsResPage = $(resourcePage).find("#production_table tr").not(":first");
        $.each(rowsResPage, function (index) {
            let tempX = rowsResPage.eq(index).find("span.quickedit-vn").text().trim().match(/(\d+)\|(\d+)/)[1];
            let tempY = rowsResPage.eq(index).find("span.quickedit-vn").text().trim().match(/(\d+)\|(\d+)/)[2];
            let tempDistance = checkDistance(tempX, tempY, game_data.village.x, game_data.village.y);
            let tempResourcesHTML = rowsResPage[index].children[3].innerHTML;
            let tempWood = $(rowsResPage[index].children[3]).find(".wood").text().replace(".", "");
            let tempStone = $(rowsResPage[index].children[3]).find(".stone").text().replace(".", "");
            let tempIron = $(rowsResPage[index].children[3]).find(".iron").text().replace(".", "");
            let tempVillageID = $(rowsResPage).eq(index).find('span[data-id]').attr("data-id");
            let tempVillageName = $(rowsResPage).eq(index).find('.quickedit-label').text().trim();
            let tempMerchants = rowsResPage[index].children[5].innerText;

            if (tempVillageID != game_data.village.id) {
                sources.push({ 
                    "name": tempVillageName, 
                    "id": tempVillageID, 
                    "resources": tempResourcesHTML, 
                    "x": tempX, 
                    "y": tempY, 
                    "distance": tempDistance, 
                    "wood": tempWood, 
                    "stone": tempStone, 
                    "iron": tempIron,
                    "merchants": tempMerchants 
                });
            }
        });

        sources.sort(function (left, right) { return left.distance - right.distance; });
        displaySourceSelection();
    });
}

function displaySourceSelection() {
    let htmlSelection = `<div style='width:700px;'><h1>Select village where resources will be pulled from</h1><br>
        <table class="vis" style='width:700px;'>
            <tr>
                <th>Village name</th>
                <th>Resources</th>
                <th>Distance</th>
                <th>Merchants</th>
            </tr>`;
    $.each(sources, function (ind) {
        htmlSelection += `
            <tr class="trclass" style="cursor: pointer" onclick="storeSourceID(${sources[ind].id},'${sources[ind].name}',${sources[ind].wood},${sources[ind].stone},${sources[ind].iron},${sources[ind].merchants.match(/(\d+)\//)[1]})">
                <td>${sources[ind].name}</td>
                <td>${sources[ind].resources}</td>
                <td>${sources[ind].distance}</td>
                <td>${sources[ind].merchants}</td>
            </tr>`;
    });
    htmlSelection += "</table></div>";
    Dialog.show("Content", htmlSelection);
}

function storeSourceID(id, name, wood, stone, iron, merchants) {
    sourceID = id;
    UI.SuccessMessage(`Using ${name} as source village.`);
    $("#currentSelection").text(name);
}

function checkDistance(x1, y1, x2, y2) {
    let a = x1 - x2;
    let b = y1 - y2;
    return Math.round(Math.hypot(a, b));
}

function manualRequestRes() {
    let manualWood = parseInt($("#manualWood").val()) || 0;
    let manualStone = parseInt($("#manualStone").val()) || 0;
    let manualIron = parseInt($("#manualIron").val()) || 0;

    if (!sourceID) {
        alert("Please select a source village first!");
        return;
    }

    if (manualWood + WHWoodCap > WHCap || manualStone + WHStoneCap > WHCap || manualIron + WHIronCap > WHCap) {
        alert("Not enough storage space for this action!");
        throw Error("Out of space");
    }

    resource[sourceID] = {
        "wood": manualWood,
        "stone": manualStone,
        "iron": manualIron
    };

    TribalWars.post('market', { ajaxaction: 'call', village: game_data.village.id }, {
        "select-village": sourceID,
        "target_id": game_data.village.id,
        "resource": {
            "wood": manualWood,
            "stone": manualStone,
            "iron": manualIron
        }
    }, function (e) {
        UI.SuccessMessage(`Resources requested: ${manualWood} wood, ${manualStone} stone, ${manualIron} iron.`);
    }).fail(function () {
        alert("Request failed. Please check your connection or try again later.");
    });
}

showSourceSelect();
