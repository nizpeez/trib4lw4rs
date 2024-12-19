if (window.location.href.indexOf('&screen=main') < 0) {
    // Redireciona para a tela principal do jogo
    window.location.assign(game_data.link_base_pure + "main");
}

var sourceID = 0;
var sourceWood = 0;
var sourceStone = 0;
var sourceIron = 0;
var sourceMerchants = 0;

var WHWoodCap = game_data.village.wood;
var WHStoneCap = game_data.village.stone;
var WHIronCap = game_data.village.iron;
var WHCap = game_data.village.storage_max;

// Adiciona a interface para entrada de recursos manuais e para alterar a fonte
$("#building_wrapper").prepend(`
<table>
    <tr>
        <th id="currentSelection">No village chosen</th>
        <th>Resources:</th>
        <td class="res"><span class="icon header wood"></span><span id="sourceWood">0</span></td>
        <td class="res"><span class="icon header stone"></span><span id="sourceStone">0</span></td>
        <td class="res"><span class="icon header iron"></span><span id="sourceIron">0</span></td>
        <td class="res">Merchants: <span id="sourceMerchants">0</span></td>
        <td>
            <input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="showSourceSelect" value="Change Source" onclick="showSourceSelect()">
        </td>
    </tr>
    <tr>
        <th></th>
        <th>Set Resources:</th>
        <td class="res"><input type="number" id="manualWood" placeholder="Wood" style="width: 60px;"></td>
        <td class="res"><input type="number" id="manualStone" placeholder="Stone" style="width: 60px;"></td>
        <td class="res"><input type="number" id="manualIron" placeholder="Iron" style="width: 60px;"></td>
        <td>
            <input type="button" class="btn evt-confirm-btn btn-confirm-yes" id="manualRequest" value="Request Resources" onclick="manualRequestRes()">
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
            let tempWood = parseInt($(rowsResPage[index].children[3]).find(".wood").text().replace(".", "")) || 0;
            let tempStone = parseInt($(rowsResPage[index].children[3]).find(".stone").text().replace(".", "")) || 0;
            let tempIron = parseInt($(rowsResPage[index].children[3]).find(".iron").text().replace(".", "")) || 0;
            let tempVillageID = $(rowsResPage).eq(index).find('span[data-id]').attr("data-id");
            let tempVillageName = $(rowsResPage).eq(index).find('.quickedit-label').text().trim();
            let tempMerchants = parseInt(rowsResPage[index].children[5].innerText.split("/")[0]) || 0;

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
    let htmlSelection = `
    <div style='width:700px;'>
        <h1>Select village where res will be pulled from</h1>
        <p style="text-align: center; font-size: 12px;">Script made by Sophie "Shinko to Kuma"</p>
        <table class="vis" style='width:100%; text-align:center; border-spacing: 5px;'>
            <tr>
                <th style="width:30%; text-align:left;">Village name</th>
                <th style="width:40%; text-align:left;">Resources</th>
                <th style="width:15%;">Distance</th>
                <th style="width:15%;">Merchants</th>
            </tr>`;
    $.each(sources, function (ind) {
        htmlSelection += `
            <tr class="trclass" style="cursor: pointer;" 
                onclick="storeSourceID(${sources[ind].id},'${sources[ind].name}',${sources[ind].wood},${sources[ind].stone},${sources[ind].iron},${sources[ind].merchants})">
                <td style="text-align:left;">${sources[ind].name}</td>
                <td style="text-align:left;">
                    <span class="icon header wood"></span> ${sources[ind].wood.toLocaleString()} 
                    <span class="icon header stone"></span> ${sources[ind].stone.toLocaleString()} 
                    <span class="icon header iron"></span> ${sources[ind].iron.toLocaleString()}
                </td>
                <td>${sources[ind].distance}</td>
                <td>${sources[ind].merchants}/235</td>
            </tr>`;
    });
    htmlSelection += `
        </table>
    </div>`;
    Dialog.show("Content", htmlSelection);
}


// Armazena a aldeia fonte selecionada
function storeSourceID(id, name, wood, stone, iron, merchants) {
    sourceID = id;
    sourceWood = wood;
    sourceStone = stone;
    sourceIron = iron;
    sourceMerchants = merchants;

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

    TribalWars.post('market', { ajaxaction: 'call', village: game_data.village.id }, {
        "select-village": sourceID,
        "target_id": 0,
        "resource": {
            "wood": manualWood,
            "stone": manualStone,
            "iron": manualIron
        }
    }, function () {
        UI.SuccessMessage(`Resources requested: ${manualWood} wood, ${manualStone} stone, ${manualIron} iron.`);
    });
}

// Exibe a interface de seleção de aldeia no início
showSourceSelect();
