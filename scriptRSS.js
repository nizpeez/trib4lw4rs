// Redirecionar para a tela principal, se necessário
if (window.location.href.indexOf('&screen=main') < 0) {
    window.location.assign(game_data.link_base_pure + "main");
}

var sourceID = 0;
var sources = [];
var sourceWood = 0;
var sourceStone = 0;
var sourceIron = 0;
var sourceMerchants = 0;
var WHCap = game_data.village.storage_max;

cssClassesSophie = `
<style>
.res{
padding: 1px 1px 1px 18px;
}
.trclass:hover { background: #40D0E0 !important; }
.trclass:hover td { background: transparent; }
</style>`;

$("#contentContainer").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);
$("#building_wrapper").prepend(`
<table><tr>
<th id="currentSelection">No village chosen</th>
<th>Res:</th>
<td class="res"><span class="icon header wood"></span><span id="sourceWood">0</span></td>
<td class="res"><span class="icon header stone"></span><span id="sourceStone">0</span></td>
<td class="res"><span class="icon header iron"></span><span id="sourceIron">0</span></td>
<th>Merchants:</th>
<td class="res"><span id="sourceMerchants">0</span></td>
</tr><tr>
<th>Set Resources:</th>
<td class="res"><input type="number" id="manualWood" placeholder="Wood"></td>
<td class="res"><input type="number" id="manualStone" placeholder="Stone"></td>
<td class="res"><input type="number" id="manualIron" placeholder="Iron"></td>
<th><input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="requestResources" onclick="manualRequestRes()" value="Request Resources"></th>
<th><input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="showSourceSelect" onclick="showSourceSelect()" value="Change Source"></th>
</tr></table>
`);

function manualRequestRes() {
    var manualWood = parseInt($("#manualWood").val()) || 0;
    var manualStone = parseInt($("#manualStone").val()) || 0;
    var manualIron = parseInt($("#manualIron").val()) || 0;

    if (sourceID === 0) {
        alert("No source village selected. Please select a source using 'Change Source'.");
        return;
    }

    if (manualWood + sourceWood > WHCap || manualStone + sourceStone > WHCap || manualIron + sourceIron > WHCap) {
        alert("Not enough storage space for this action!");
        return;
    }

    console.log("Preparing to request resources:", { 
        sourceID: sourceID, 
        target_id: game_data.village.id, 
        wood: manualWood, 
        stone: manualStone, 
        iron: manualIron 
    });

    // Realiza a chamada ao servidor
    TribalWars.post('market', 
        { ajaxaction: 'call', village: game_data.village.id }, 
        {
            "select-village": sourceID,
            "target_id": game_data.village.id,
            "resource": {
                "wood": manualWood,
                "stone": manualStone,
                "iron": manualIron
            }
        }, 
        function (response) {
            if (response.error) {
                console.error("Server returned an error:", response.error);
                alert("Error: " + response.error);
            } else {
                UI.SuccessMessage(`Resources requested successfully: ${manualWood} wood, ${manualStone} stone, ${manualIron} iron.`);
                console.log("Request completed successfully:", response);
            }
        }
    ).fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Request failed:", textStatus, errorThrown);
        alert("Request failed. Please check your connection or try again later.");
    });
}


function showSourceSelect() {
    sources = [];
    $.get("/game.php?&screen=overview_villages&mode=prod&group=0&page=-1&", function (resourcePage) {
        rowsResPage = $(resourcePage).find("#production_table tr").not(":first");
        $.each(rowsResPage, function (index) {
            var tempX = $(this).find("span.quickedit-vn").text().trim().match(/(\d+)\|(\d+)/)[1];
            var tempY = $(this).find("span.quickedit-vn").text().trim().match(/(\d+)\|(\d+)/)[2];
            var tempDistance = Math.hypot(tempX - game_data.village.x, tempY - game_data.village.y);
            var tempResourcesHTML = this.children[3].innerHTML;
            var tempWood = $(this.children[3]).find(".wood").text().replace(".", "");
            var tempStone = $(this.children[3]).find(".stone").text().replace(".", "");
            var tempIron = $(this.children[3]).find(".iron").text().replace(".", "");
            var tempVillageID = $(this).find('span[data-id]').attr("data-id");
            var tempVillageName = $(this).find('.quickedit-label').text().trim();
            var tempMerchants = this.children[5].innerText;

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

        var htmlSelection = `<div style='width:700px;'><h1>Select village where resources will be pulled from</h1><br><table class="vis" style='width:700px;'>
            <tr>
                <th>Village Name</th>
                <th>Resources</th>
                <th>Distance</th>
                <th>Merchants</th>
            </tr>`;

        $.each(sources, function (ind) {
            htmlSelection += `
            <tr class="trclass" style="cursor: pointer" onclick="storeSourceID(${this.id}, '${this.name}', ${this.wood}, ${this.stone}, ${this.iron}, ${this.merchants.match(/(\d+)\//)[1]})">
                <td>${this.name}</td>
                <td>${this.resources}</td>
                <td>${this.distance.toFixed(1)}</td>
                <td>${this.merchants}</td>
            </tr>`;
        });

        htmlSelection += "</table></div>";

        Dialog.show("Content", htmlSelection);
    });
}

function storeSourceID(id, name, wood, stone, iron, merchants) {
    sourceID = id;
    sourceWood = parseInt(wood);
    sourceStone = parseInt(stone);
    sourceIron = parseInt(iron);
    sourceMerchants = parseInt(merchants);
    UI.SuccessMessage(`Using ${name} as source village.`);
    $("#currentSelection").text(name);
    $("#sourceWood").text(sourceWood);
    $("#sourceStone").text(sourceStone);
    $("#sourceIron").text(sourceIron);
    $("#sourceMerchants").text(sourceMerchants);
}
