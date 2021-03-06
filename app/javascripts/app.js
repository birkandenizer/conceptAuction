// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import conceptAuctionArtifacts from '../../build/contracts/ConceptAuction.json'

// conceptAuction is our usable abstraction, which we'll use through the code below.
var conceptAuction = contract(conceptAuctionArtifacts);

var accounts;
var account;
var tempAuction;
var auctions = [];
var assets = [];

window.App = {
    start: function () {
        var self = this;

        // Bootstrap the conceptAuction abstraction for Use.
        conceptAuction.setProvider(web3.currentProvider);

        // Get the initial account balance so it can be displayed.
        web3.eth.getAccounts(function (err, accs) {
            if (err != null) {
                alert("There was an error fetching your accounts.");
                return;
            }

            if (accs.length == 0) {
                alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
                return;
            }

            accounts = accs;
            account = accounts[0];

            var pathname = window.location.pathname;
            if (pathname == "/" || pathname == "/index.html") {
                self.refreshAccountInfo();
                self.refreshAssetCount();
                self.refreshAssetCountForUser();
                self.refreshAuctionCount();
                self.refreshAuctionCountForUser();
            } else if (pathname == "/auctions.html") {
                self.refreshAuctions();
            } else if (pathname == "/createAuction.html") {
                self.refreshAssets();
            }

            var pathArray = window.location.search;
            if (pathArray.length != 0) {
                self.refreshAuction();
            } 
        });
    },

    setStatus: function (message) {
        var status = document.getElementById("status");
        status.innerHTML = message;
    },

    refreshAccountInfo: function () {
        var accountAddress = document.getElementById("accountAddress");
        accountAddress.innerHTML = account;

        var accountBalance = document.getElementById("accountBalance");
        web3.eth.getBalance(account, function (err, balance) {
            accountBalance.innerHTML = web3.fromWei(balance, "ether") + " ETH";
        });
    },

    refreshAssetCount: function () {
        var self = this;

        var asset;
        conceptAuction.deployed().then(function (instance) {
            asset = instance;
            return asset.getAssetCount.call();
        }).then(function (value) {
            var assetCount_element = document.getElementById("assetCount");
            assetCount_element.innerHTML = value.valueOf();
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error getting assetCount; see log.");
        });
    },

    refreshAssetCountForUser: function () {
        var self = this;

        var asset;
        conceptAuction.deployed().then(function (instance) {
            asset = instance;
            return asset.getAssetCountForUser.call(account);
        }).then(function (value) {
            var assetCount_element = document.getElementById("myAssetCount");
            assetCount_element.innerHTML = value.valueOf();
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error getting assetCountForUser; see log.");
        });
    },

    listAssets: function (value) {
        var self = this;

        if (assets.length < value) {
            console.log("listAuctions Delaying display operation to finish retrieving auctions");
            setTimeout(self.listAssets, 500, value);
        } else {

            var assetList = document.getElementById("assetList");
            var output = "";
            for (var j = 0; j < value; j++) {
                var asset = assets[j];
                if (asset[2] ==  account) {
                    output = output + "<tr>";
                    output = output + "<td>" + asset[7] + "</td>";
                    output = output + "<td>" + asset[5] + "</td>";
                    output = output + "<td>" + asset[6] + "</td>";
                    output = output + "<td>" + convertUnixTimeToDate(asset[1]) + "</td>";
                    output = output + "<td>" + asset[0] + "</td>";
                    output = output + "<td>" + asset[3] + "</td>";
                    output = output + "<td>" + asset[4] + "</td>";
                    output = output + "<td>" + asset[2] + "</td>";
                    output = output + "</tr>";
                }
            }
            console.log("Listing assets");
            assetList.innerHTML = output;
        }
    },

    refreshAssets: function () {
        var self = this;

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.getAssetCount.call();
        }).then(function (value) {
            self.fetchAssets(value);
            self.listAssets(value);
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error refreshing assets; see log.");
        });
    },

    fetchAssets: function (value) {
        var self = this;

        for (var i = 0; i < value; i++) {
            self.getAsset(i);
        }
    },

    getAsset: function (assetId) {
        var self = this;

        var auctionInstance;
        conceptAuction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.getAsset.call(assetId);
        }).then(function (asset) {
            console.log("Retrieving asset with ID:" + assetId);
            asset[7] = assetId;
            assets.push(asset);
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error retrieving asset; see log.");
        });
    },

    getAuction: function (auctionId) {
        var self = this;

        var auctionInstance;
        conceptAuction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.getAuction.call(auctionId);
        }).then(function (auction) {
            console.log("Retrieving auction with ID:" + auctionId);
            auction[12] = auctionId;
            auctions.push(auction);
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error retrieving auction; see log.");
        });
    },

    fetchAuctions: function (value) {
        var self = this;

        for (var i = 0; i < value; i++) {
            self.getAuction(i);
        }
    },

    listAuctions: function (value) {
        var self = this;

        if (auctions.length < value) {
            console.log("listAuctions Delaying display operation to finish retrieving auctions");
            setTimeout(self.listAuctions, 500, value);
        } else {

            var auctionList = document.getElementById("auctionList");
            var output = "";
            for (var j = 0; j < value; j++) {
                var auction = auctions[j];
                if (auction[3] > (Math.floor(Date.now() / 1000))) {
                    output = output + "<tr>";
                    output = output + "<td><a href='auction.html?auctionId=" + auction[12] + "'>" + auction[0] + "</a></td>";
                    output = output + "<td>" + auction[1] + "</td>";
                    output = output + "<td>" + web3.fromWei(auction[8], "ether") + " ETH" + "</td>";
                    output = output + "<td>" + auction[10] + "</td>";
                    output = output + "<td>" + convertUnixTimeToDate(auction[3]) + "</td>";
                    output = output + "</tr>";
                }
            }
            console.log("Listing auctions");
            auctionList.innerHTML = output;
        }
    },

    refreshAuctionCount: function () {
        var self = this;

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.getAuctionCount.call();
        }).then(function (value) {
            var auctionCount_element = document.getElementById("auctionCount");
            auctionCount_element.innerHTML = value.valueOf();

            self.fetchAuctions(value);
            //self.listAuctions(value);
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error getting auctionCount; see log.");
        });
    },

    refreshAuctions: function () {
        var self = this;

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.getAuctionCount.call();
        }).then(function (value) {
            self.fetchAuctions(value);
            self.listAuctions(value);
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error getting auctionCount; see log.");
        });
    },

    refreshAuctionCountForUser: function () {
        var self = this;

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.getAuctionCountForUser.call(account);
        }).then(function (value) {
            var auctionCount_element = document.getElementById("myAuctionCount");
            auctionCount_element.innerHTML = value.valueOf();
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error getting myAuctionCountForUser; see log.");
        });
    },

    refreshAuction: function () {
        var self = this;

        var pathArray = window.location.search.split('=');
        var auctionId = pathArray[1];

        var tempAuction;

        var auctionInstance;
        conceptAuction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.getAuction.call(auctionId);
        }).then(function (auction) {
            console.log("getAuctionV2 auction:" + auction);

            var output = "";
            output += "<table class='auctionDetails'>";
            output += "<tr><td class='auctionlabel'>Name:</td><td>" + auction[0] + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Description:</td><td>" + auction[1] + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Start Time:</td><td>" + convertUnixTimeToDate(auction[2]) + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Expiration Time:</td><td>" + convertUnixTimeToDate(auction[3]) + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Start Price:</td><td>" + web3.fromWei(auction[4], "ether") + " ETH" + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Status:</td><td>" + auction[5] + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Seller:</td><td>" + auction[6] + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Current Bidder:</td><td>" + auction[7] + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Current Bid:</td><td>" + web3.fromWei(auction[8], "ether") + " ETH" + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Current Bid Time:</td><td>" + convertUnixTimeToDate(auction[9]) + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Bid Count:</td><td>" + auction[10] + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Asset ID:</td><td>" + auction[11] + "</td></tr>";
            output += "<tr><td class='auctionlabel'>Auction ID:</td><td>" + auctionId + "</td></tr>";

            

            //Place bid button
            if (auction[5] == true && (Math.floor(Date.now() / 1000)) <= auction[3]) {
                output += "<tr><td class='auctionLabel'>Owner Identifier:</td><td><input type='text' id='ownerIdentifier' placeholder='e.g., 01234567890'></input></td></tr>";
                output += "<tr><td class='auctionLabel'>Owner First Name:</td><td><input type='text' id='ownerFirstName' placeholder='e.g., John'></input></td></tr>";
                output += "<tr><td class='auctionLabel'>Owner Last Name:</td><td><input type='text' id='ownerLastName' placeholder='e.g., Doe'></input></td></tr>";
                output += "<tr><td class='auctionLabel'>Bid:</td><td><input type='text' id='bid_value' placeholder='e.g., 3.0 Ether'></input></td></tr>";
                output += "<tr><td class='auctionLabel'>&nbsp;</td><td><button id='placeBid' class='btn btn-primary' onclick='App.placeBid(" + auction[8] + ")'>Place Bid</button></td></tr>";
            }

            //Cancel auction button
            if (auction[5] == true && (Math.floor(Date.now() / 1000)) < auction[3]  && auction[6]==account) {
                output += "<tr><td class='auctionLabel'>Cancel Auction:</td><td><button id='cancelAuction' value='"+ auction[6] +"' onclick='App.cancelAuction()'>Cancel Auction</button></td></tr>";
            }

            //Finish auction button
            if (auction[5] == true && (Math.floor(Date.now() / 1000)) > auction[3]) {
                output += "<tr><td class='auctionLabel'>Finish Auction:</td><td><button id='finishAuction' value='"+ auction[6] +"' onclick='App.finishAuction()'>Finish Auction</button></td></tr>";
            }
            output += "</table>";

            var container = document.getElementById("auctionInformation");
            container.innerHTML = output;


        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error retrieving auction; see log.");
        });
    },

    createAsset: function () {
        var self = this;

        var ownerIdentifier = parseInt(document.getElementById("ownerIdentifier").value);
        var ownerFirstName = document.getElementById("ownerFirstName").value;
        var ownerLastName = document.getElementById("ownerLastName").value;
        var assetName = document.getElementById("assetName").value;

        this.setStatus("Creating asset... (please wait)");

        var asset;
        conceptAuction.deployed().then(function (instance) {
            asset = instance;
            return asset.createAsset(ownerIdentifier, (Math.floor(Date.now() / 1000)), ownerFirstName, ownerLastName, assetName, { from: account, gas: 800000 });
        }).then(function () {
            self.setStatus("Asset created!");
            self.refreshAssetCount();
            self.refreshAssetCountForUser();
            window.location.reload(true);
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error creating asset; see log.");
        });
    },

    createAuction: function () {
        var self = this;

        var name = document.getElementById("auctionName").value;
        var description = document.getElementById("auctionDescription").value;
        var expirationTime = parseInt(document.getElementById("expirationTime").value);
        var startPrice = parseInt(document.getElementById("startPrice").value);
        startPrice = web3.toWei(startPrice, "ether");
        var assetId = parseInt(document.getElementById("assetId").value);

        this.setStatus("Creating auction... (please wait)");

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.createAuction(name, description, (Math.floor(Date.now() / 1000)), expirationTime, startPrice, assetId, { from: account, gas: 800000 });
        }).then(function () {
            self.setStatus("Auction created!");
            self.refreshAuctionCount();
            self.refreshAuctionCountForUser();
            window.location.href = '../auctions.html';
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error creating auction; see log.");
        });
    },

    placeBid: function (currentBid) {
        var self = this;

        var bid = document.getElementById("bid_value").value;
        bid = web3.toWei(bid, "ether");

        var pathArray = window.location.search.split('=');
        var auctionId = pathArray[1];

        var ownerIdentifier = document.getElementById("ownerIdentifier").value;
        var ownerFirstName = document.getElementById("ownerFirstName").value;
        var ownerLastName = document.getElementById("ownerLastName").value;

        this.setStatus("Placing bid... (please wait)");

        if (bid < currentBid) {
            setStatus("Bid needs to be at least " + currentBid);
            return;
        }

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.placeBid(auctionId, (Math.floor(Date.now() / 1000)), ownerIdentifier, ownerFirstName, ownerLastName, { from: account, value:bid, gas: 800000 });
        }).then(function () {
            self.setStatus("Bid placed!");
            self.refreshAuction();
            window.location.reload(true);
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error placing bid; see log.");
        });
    },

    cancelAuction: function () {
        var self = this;

        var pathArray = window.location.search.split('=');
        var auctionId = pathArray[1];

        var auctionOwner = document.getElementById("cancelAuction").value;
        
        this.setStatus("Canceling auction... (please wait)");

        if (auctionOwner != account) {
            setStatus("You need to be auction owner to cancel");
            return;
        }

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.cancelAuction(auctionId, (Math.floor(Date.now() / 1000)), { from: account, gas: 800000 });
        }).then(function () {
            self.setStatus("Auction canceled!");
            self.refreshAuctions();
            self.refreshAssets();
            window.location.href = '../auctions.html';
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error canceling auction; see log.");
        });
    },

    finishAuction: function () {
        var self = this;

        var pathArray = window.location.search.split('=');
        var auctionId = pathArray[1];

        this.setStatus("Finishing auction... (please wait)");

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.finishAuction(auctionId, (Math.floor(Date.now() / 1000)), { from: account, gas: 800000 });
        }).then(function () {
            self.setStatus("Auction finished!");
            self.refreshAuctions();
            self.refreshAssets();
            window.location.href = '../auctions.html';
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error finishing auction; see log.");
        });
    },

    sendCoin: function () {
        var self = this;

        var amount = parseInt(document.getElementById("amount").value);
        var receiver = document.getElementById("receiver").value;

        this.setStatus("Initiating transaction... (please wait)");

        var auction;
        conceptAuction.deployed().then(function (instance) {
            auction = instance;
            return auction.sendCoin(receiver, amount, { from: account });
        }).then(function () {
            self.setStatus("Transaction complete!");
            self.refreshAuctionCount();
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error sending coin; see log.");
        });
    }
};

window.addEventListener('load', function () {
    // Checking if Web3 has been injected by the browser (Mist/auctionMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 conceptAuction, ensure you've configured that source properly. If using auctionMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-auctionmask")
        // Use Mist/auctionMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to auctionmask for development. More info here: http://truffleframework.com/tutorials/truffle-and-auctionmask");
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    App.start();
});

// Converts Unix time to more readable version
function convertUnixTimeToDate(unixtimestamp) {
    var convdataTime;
    // Months array
    var months_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Convert timestamp to milliseconds
    var date = new Date(unixtimestamp * 1000);
    // Year
    var year = date.getFullYear();
    // Month
    var month = months_arr[date.getMonth()];
    // Day
    var day = date.getDate();
    // Hours
    var hours = date.getHours();
    // Minutes
    var minutes = "0" + date.getMinutes();
    // Seconds
    var seconds = "0" + date.getSeconds();
    // Display date time in MM-dd-yyyy h:m:s format
    convdataTime = month + ' ' + day + ' ' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    console.log("convdataTime");
    console.log(convdataTime);
    return convdataTime;
}