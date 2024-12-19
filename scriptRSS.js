if (window.location.href.indexOf('&screen=main') < 0) {
    // Redireciona para a tela principal do jogo
    window.location.assign(game_data.link_base_pure + "main");
}

var sourceID = 0;
var resource = {};
var sources = [];

// Inicializa os recursos disponíveis e a capacidade do armazém
var WHWoodCap = game_data.village.wood;
var WHStoneCap = game_data.village.stone;
var WHIronCap = game_data.village.iron;
var WHCap = game_data.village.storage_max;
var sourceWood = 0;
var sourceStone = 0;
var sourceIron = 0;
var sourceMerchants = 0;

cssClassesSophie = `
<style>
.res {
    padding: 3px 10px;
    font-size: 12px;
    text-align: center;
}
.trclass:hover { background: #40D0E0 !important; }
.trclass:hover td { background: transparent; }
.vis td, .vis th {
    padding: 5px;
    font-size: 12px;
    line-height: 20px;
    vertical-align: middle;
}
.vis th {
    background-color: #f4f4f4;
    border-bottom: 1px solid #d3d3d3;
}
.vis .icon {
    margin-right: 5px;
    vertical-align: middle;
    position: relative;
    top: 1px;
}
</style>`;

$("#contentContainer").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);

// Adiciona a interface para entrada de recursos manuais e para alterar a fonte
$("#building_wrapper").prepend(`
<table>
    <tr>
        <th id="currentSelection">No village chosen</th>
        <th>Res:</th>
        <td class="res"><span class="icon header wood"></span><span id="sourceWood">0</span></td>
        <td class="res"><span class="icon header stone"></span><span id="sourceStone">0</span></td>
        <td class="res"><span class="icon header iron"></span><span id="sourceIron">0</span></td>
        <th>Merchants:</th>
        <td class="res"><span id="sourceMerchants">0</span></td>
    </tr>
    <tr>
        <th>Set Resources:</th>
        <td class="res"><input type="number" id="manualWood" placeholder="Wood" style="width: 60px;"></td>
        <td class="res"><input type="number" id="manualStone" placeholder="Stone" style="width: 60px;"></td>
        <td class="res"><input type="number" id="manualIron" placeholder="Iron" style="width: 60px;"></td>
        <td>
            <input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="manualRequest" value="Request Resources" onclick="manualRequestRes()">
        </td>
        <td>
            <input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="showSourceSelect" value="Change Source" onclick="showSourceSelect()">
        </td>
    </tr>
</table>
`);

// Função para mostrar a lista de aldeias fonte
function showSourceSelect() {
    sources = [];
    $.get("/game.php?&screen=overview_villages&mode=prod&group=0&page=-1&", function (resourcePage) {
        let rowsResPage = $(resourcePage).find("#production_table tr").not(":first");
        $.each(rowsResPage, function (index) {
            let tempX = rowsResPage.eq(index).find("span.quickedit-vn").text().trim().match(/(\d+)\|(\d+)/)[1];
            let tempY = rowsResPage.eq(index).find("span.quickedit-vn").text().trim().match(/(\d+)\|(\d+)/)[2];
            let tempDistance = checkDistance(tempX, tempY, game_data.village.x, game_data.village.y);
            let tempResourcesHTML = rowsResPage[index].children[3].innerHTML;
            let tempWood = $(rowsResPage[index].children[3]).find(".wood").text().replace(".", "") || "0";
            let tempStone = $(rowsResPage[index].children[3]).find(".stone").text().replace(".", "") || "0";
            let tempIron = $(rowsResPage[index].children[3]).find(".iron").text().replace(".", "") || "0";
            let tempVillageID = $(rowsResPage).eq(index).find('span[data-id]').attr("data-id");
            let tempVillageName = $(rowsResPage).eq(index).find('.quickedit-label').text().trim();
            let tempMerchantsMatch = (rowsResPage[index].children[5].innerText && rowsResPage[index].children[5].innerText.match(/(\d+)\//)) || [];
            let tempMerchants = tempMerchantsMatch[1] || "0";

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

// Exibe a interface para selecionar uma aldeia fonte
function displaySourceSelection() {
    let htmlSelection = `<div style='width:700px;'><h1>Select village where res will be pulled from</h1><br>
        <table class="vis" style='width:700px;'>
            <tr>
                <th>Village name</th>
                <th>Resources</th>
                <th>Distance</th>
                <th>Merchants</th>
            </tr>`;
    $.each(sources, function (ind) {
        htmlSelection += `
            <tr class="trclass" style="cursor: pointer" onclick="storeSourceID(${sources[ind].id},'${sources[ind].name}',${sources[ind].wood},${sources[ind].stone},${sources[ind].iron},${sources[ind].merchants})">
                <td>${sources[ind].name}</td>
                <td>${sources[ind].resources}</td>
                <td>${sources[ind].distance}</td>
                <td>${sources[ind].merchants}</td>
            </tr>`;
    });
    htmlSelection += "</table></div>";
    Dialog.show("Content", htmlSelection);
}

// Armazena a aldeia fonte selecionada
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

// Calcula a distância entre duas coordenadas
function checkDistance(x1, y1, x2, y2) {
    let a = x1 - x2;
    let b = y1 - y2;
    return Math.round(Math.hypot(a, b));
}

// Realiza o pedido manual de recursos
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
        "target_id": 0,
        "resource": resource
    }, function (e) {
        UI.SuccessMessage(`Resources requested: ${manualWood} wood, ${manualStone} stone, ${manualIron} iron.`);
    });
}

// Exibe a interface de seleção de aldeia no início
showSourceSelect();
