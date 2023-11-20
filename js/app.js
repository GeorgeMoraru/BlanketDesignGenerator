(function() {

var width = 1;
var height = 1;
var blanket = [];
var patternList = [];

var createBlanket = function() {
    updateWidth();
    updateHeight();
    updateQuantity();
    generateBlanket();
    displayBlanket();
};

var generateBlanket = function () {
     for(var i = 0;i < height;i++) {
         blanket[i] = [];
         for (var j = 0; j < width;j++) {
             blanket[i][j] = getNextPattern(i,j);
        }
    }
};
var getNextPattern = function(i,j) {
    var patternNo = getRandomPatternNo();
    if (patternList[patternNo] == 0) {
        patternNo = getNextPattern();
    } else {
        patternList[patternNo] = patternList[patternNo] - 1;
    };

    return patternNo;
}

    var updateQuantity = function() {
    for(var i=0;i<patternList.length;i++) {
        var patternEl = document.querySelector("#pattern" + i);
        var quantity = parseInt(patternEl.querySelector("input").value) || 1;
        patternList[i] = quantity;
    }
};

var updateWidth = function(){
    width = parseInt(document.querySelector("#columns").value) || width;
};

var updateHeight = function(){
    height = parseInt(document.querySelector("#rows").value) || height;
};

var addPatternUI = function() {
    var patternNo = patternList.length;
    var settings = document.createElement("div");
    settings.className = "settings";
    settings.id="pattern"+patternNo;

    var settingsName = document.createElement("div");
    settingsName.className = "setting-name";
    settingsName.innerText = "Pattern #" + patternNo;

    var settingsValue = document.createElement("div");
    settingsValue.className = "settings-value";
    
    var patternSymbol = document.createElement("div");
    patternSymbol.className = "patternSymbol";
    patternSymbol.style = "background-color:#" + generateRandomColor();

    var countInput = document.createElement("input");
    countInput.type = "text";
    countInput.className = "short";
    updateWidth();
    updateHeight();
    countInput.value = width * height;
    patternList.push(width * height);

    settingsValue.appendChild(patternSymbol);
    settingsValue.appendChild(countInput);

    settings.appendChild(settingsName);
    settings.appendChild(settingsValue);

    var settingsContainer = document.querySelector("#add-pattern-btn").parentElement;
    var patternBtn = document.querySelector("#add-pattern-btn");
    settingsContainer.insertBefore(settings, patternBtn);    
};

var generateRandomColor = function () {
    return Math.floor(Math.random() * 16777215).toString(16);
};

var getRandomPatternNo = function() {

    return Math.floor(Math.random() * patternList.length);
}

var displayBlanket = function() {
    var blanketEl = document.createElement("table");
    blanketEl.className = "blanket";
    for(var i=0;i<height;i++)
    {
        var row = document.createElement("tr");
        blanketEl.appendChild(row);
        
        for(var j=0;j<width;j++) {
            var column = document.createElement("td");
            column.className = "cellSqaure";
            var patternEl = document.querySelector("#pattern" + blanket[i][j]);
            var style = patternEl.querySelector(".patternSymbol").getAttribute("style");
            column.style = style;
            row.appendChild(column);
        }
    }
    var blanketContainer = document.querySelector("#blanket-container");
    if(blanketContainer.hasChildNodes()) 
    {
        blanketContainer.removeChild(blanketContainer.firstChild);
    }
    
    blanketContainer.appendChild(blanketEl);
};

var bindEvents = function() {
    addPatternUI();
    var generateBlanketElem = document.querySelector("#settings-btn");
    generateBlanketElem.addEventListener('click', createBlanket);

    var patternBtn = document.querySelector("#add-pattern-btn");
    patternBtn.addEventListener('click', addPatternUI);
};

document.addEventListener("DOMContentLoaded", bindEvents);
})();