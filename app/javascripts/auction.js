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
var auction;

var convdataTime;

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

            var pathArray = window.location.search;
            if (pathArray.length != 0){
                self.refreshAuction();
            }
        });
    },

    setStatus: function (message) {
        var status = document.getElementById("status");
        status.innerHTML = message;
    },

    getAuction: function (auctionId) {
        var self = this;

        var auctionInstance;
        conceptAuction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.getAuction.call(auctionId);
        }).then(function (_auction) {
            console.log("getAuction"+auctionId);
            console.log("Retrieving auction with ID:" + auctionId);
            auction = _auction;
            console.log("getAuction"+auction);
        }).catch(function (e) {
            console.log(e);
            self.setStatus("Error retrieving auction; see log.");
        });
    },

    convertUnixTimeToDate: function (unixtimestamp) {
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
        convdataTime = month + '-' + day + '-' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    },

    refreshAuction: function () {
        var self = this;

        var pathArray = window.location.search.split('=');
        var auctionId = pathArray[1];

        self.getAuction(auctionId);

        var output = "";
        output += "<table class='auctionDetails'>";
        output += "<tr><td class='auctionlabel'>Name:</td><td>" + auction[0] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Description:</td><td>" + auction[1] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Start Time:</td><td>" + auction[2] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Expiration Time:</td><td>" + auction[3] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Start Price:</td><td>" + web3.fromWei(auction[4], "ether") + " ETH" + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Status:</td><td>" + auction[5] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Seller:</td><td>" + auction[6] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Current Bidder:</td><td>" + auction[7] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Current Bid:</td><td>" + web3.fromWei(auction[8], "ether") + " ETH" + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Current Bid Time:</td><td>" + auction[9] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Bid Count:</td><td>" + auction[10] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Asset ID:</td><td>" + auction[11] + "</td></tr>";
        output += "<tr><td class='auctionlabel'>Auction ID:</td><td>" + auctionId + "</td></tr>";

        //Place bid button
        if (auction[11] == true && (Math.floor(Date.now() / 1000)) <= auction[5]) {
            output += "<tr><td class='auctionLabel'>Bid (in eth):</td><td><input type='text' id='bid_value' placeholder='eg 3.0'></input></td></tr>";
            output += "<tr><td class='auctionLabel'>&nbsp;</td><td><button id='bid_button' class='btn btn-primary' onclick='placeBid()'>Place Bid</button></td></tr>";
        }

        //End auction button
        if (auction[11] == true && (Math.floor(Date.now() / 1000)) > auction[5]) {
            output += "<tr><td class='auctionLabel'>End Auction:</td><td><button id='end_button' onclick='endAuction()'>End Auction</button></td></tr>";
        }
        output += "</table>";

        var container = document.getElementById("auction_container");
        container.innerHTML = output;
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
