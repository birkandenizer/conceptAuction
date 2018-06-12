pragma solidity ^0.4.21;

contract ConceptAuction {

    struct Asset {
        uint256 ownerIdentifier;//TC kimlik gibi
        uint256 timestamp;
        address owner;
        string ownerFirstName;
        string ownerLastName;
        string name;
        bool status;//In auction or not
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        uint256 ownerIdentifier;//TC kimlik gibi
        string ownerFirstName;
        string ownerLastName;
    }

    struct Auction {
        address seller;
        address currentBidBidder;
        string name;
        string description;
        uint256 startTime;
        uint256 expirationTime;
        uint256 startPrice;
        uint256 currentBidAmount;
        uint256 currentBidTimestamp;
        uint256 bidCount;
        uint256 assetIdentifier;
        bool status;//Active or not
        mapping (uint256 => Bid) bids;
    }

    uint256 public assetCount;
    uint256 public auctionCount;

    mapping(uint256 => Asset) public assets;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256[]) public assetsAddedByUser;
    mapping(address => uint256[]) public auctionsOpenedByUser;
    mapping(address => uint256[]) public auctionsBidByUser;
    mapping(address => uint256) public refunds;

    address public owner;

    // Events that will be checked by DAPPs
    event AssetCreation(uint256 id, address owner, string assetName);
    event AuctionCreation(uint256 id, string name, uint256 startPrice);
    event AuctionCancelation(uint256 id);
    event AuctionFinish(uint256 auctionId, address winner, uint256 amount);
    event BidPlacement(uint auctionId, address bidder, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlySeller(uint auctionId) {
        require(msg.sender == auctions[auctionId].seller);
        _;
    }

    modifier onlyLive(uint auctionId) {
        Auction memory current = auctions[auctionId];
        require(block.timestamp <= current.expirationTime);
        _;
    }

    function ConceptAuction() public {
        owner = msg.sender;
    }

    // Maybe we can add default fallback here
    function createAsset(
        uint256  _ownerIdentifier, uint256 _timestamp, string _ownerFirstName, string _ownerLastName,
        string _assetName) public returns (uint256 _assetId) {

        _assetId = assetCount++;
        assets[_assetId].ownerIdentifier = _ownerIdentifier;
        assets[_assetId].timestamp = _timestamp;
        assets[_assetId].owner = msg.sender;
        assets[_assetId].ownerFirstName = _ownerFirstName;
        assets[_assetId].ownerLastName = _ownerLastName;
        assets[_assetId].name = _assetName;
        assets[_assetId].status = false;

        assetsAddedByUser[msg.sender].push(_assetId);

        emit AssetCreation(_assetId, msg.sender, _assetName);
    }
    
    function createAuction(
        string _name, string _description,
        uint256 _startTime, uint256 _expirationTime,
        uint256 _startPrice, uint256 _assetId) public payable returns (uint256 _auctionId) {

        require(block.timestamp <= (_startTime + _expirationTime));
        require(0 < _startPrice);
        require(assets[_assetId].status == false);

        _auctionId = auctionCount++;
        auctions[_auctionId].seller = msg.sender;
        auctions[_auctionId].currentBidBidder = msg.sender;
        auctions[_auctionId].name = _name;
        auctions[_auctionId].description = _description;
        auctions[_auctionId].startTime = _startTime;
        auctions[_auctionId].expirationTime = (_startTime + _expirationTime);
        auctions[_auctionId].startPrice = _startPrice;
        auctions[_auctionId].currentBidAmount = _startPrice;
        auctions[_auctionId].currentBidTimestamp = _startTime;
        auctions[_auctionId].bidCount = 0;
        auctions[_auctionId].assetIdentifier = assetCount;
        auctions[_auctionId].status = true;        
        setAssetStatus(_assetId,true);

        auctionsOpenedByUser[msg.sender].push(_auctionId);

        emit AuctionCreation(_auctionId, _name, _startPrice);
    }

    //Asset related getters
    function getAssetCount() public view returns(uint256){
        return assetCount;
    }

    function getAssetOwnerIdentifier(uint256 _assetId) public view returns(uint256) {
        return assets[_assetId].ownerIdentifier;
    }

    function getAssetTimestamp(uint256 _assetId) public view returns(uint256) {
        return assets[_assetId].timestamp;
    }

    function getAssetOwner(uint256 _assetId) public view returns(address) {
        return assets[_assetId].owner;
    }

    function getAssetOwnerFirstName(uint256 _assetId) public view returns(string) {
        return assets[_assetId].ownerFirstName;
    }

    function getAssetOwnerLastName(uint256 _assetId) public view returns(string) {
        return assets[_assetId].ownerLastName;
    }

    function getAssetName(uint256 _assetId) public view returns(string) {
        return assets[_assetId].name;
    }

    function getAssetStatus(uint256 _assetId) public view returns(bool) {
        return assets[_assetId].status;
    }

    function getAssetCountForUser(address _user) public view returns (uint256) {
        return assetsAddedByUser[_user].length;
    }

    //Asset related setters
    //Maybe add onlyContract like a limiter
    //Transferlerde alan kişi ilk onaylama, onaylamadan sonra
    function setAssetOwnerIdentifier(uint256 _assetId, uint _newAssetOwnerIdentifier) public returns (bool) {
        if(assets[_assetId].ownerIdentifier != 0){
            assets[_assetId].ownerIdentifier = _newAssetOwnerIdentifier;
            return true;
        }else{
            return false;
        }
    }

    function setAssetTimestamp(uint256 _assetId, uint256 _timestamp) public returns (bool) {
        if(assets[_assetId].timestamp != 0){
            assets[_assetId].timestamp = _timestamp;
            return true;
        }else{
            return false;
        }
    }
    
    function setOwner(uint256 _assetId, address _newOwner) public returns (bool) {
        if(assets[_assetId].owner != 0){
            assets[_assetId].owner = _newOwner;
            return true;
        }else{
            return false;
        }
    }

    function setAssetOwnerFirstName(uint256 _assetId, string _newAssetOwnerFirstName) public returns (bool) {
        if(bytes(assets[_assetId].ownerFirstName).length != 0){
            assets[_assetId].ownerFirstName = _newAssetOwnerFirstName;
            return true;
        }else{
            return false;
        }
    }

    function setAssetOwnerLastName(uint256 _assetId, string _newAssetOwnerLastName) public returns (bool) {
        if(bytes(assets[_assetId].ownerLastName).length != 0){
            assets[_assetId].ownerLastName = _newAssetOwnerLastName;
            return true;
        }else{
            return false;
        }
    }

    function setAssetStatus(uint256 _assetId, bool _status) public returns (bool) {
        if(bytes(assets[_assetId].name).length != 0){
            assets[_assetId].status = _status;
            return true;
        }else{
            return false;
        }
    }

    //Auction related getters
    function getAuctionCount() public view returns(uint256) {
        return auctionCount;
    }

    function getAuction(uint256 _auctionId) public view returns(
        string,string,uint256,uint256,uint256,bool,address,address,uint256,uint256,uint256,uint256) {
        Auction memory current = auctions[_auctionId];
        return (
            current.name,
            current.description,
            current.startTime,
            current.expirationTime,
            current.startPrice,
            current.status,
            current.seller,
            current.currentBidBidder,
            current.currentBidAmount,
            current.currentBidTimestamp,
            current.bidCount,
            current.assetIdentifier
            );
    }

    function getAuctionName(uint256 _auctionId) public view returns(string) {
        return auctions[_auctionId].name;
    }

    function getAuctionDescription(uint256 _auctionId) public view returns(string) {
        return auctions[_auctionId].description;
    }

    function getAuctionStartTime(uint256 _auctionId) public view returns(uint256) {
        return auctions[_auctionId].startTime;
    }

    function getAuctionExpirationTime(uint256 _auctionId) public view returns(uint256) {
        return auctions[_auctionId].expirationTime;
    }

    function getAuctionStartPrice(uint256 _auctionId) public view returns(uint256) {
        return auctions[_auctionId].startPrice;
    }

    function getAuctionStatus(uint256 _auctionId) public view returns (bool) {
        return auctions[_auctionId].status;
    }

    function getAuctionCurrentBidder(uint256 _auctionId) public view returns(address) {
        return auctions[_auctionId].currentBidBidder;
    }

    function getAuctionCurrentBidAmount(uint256 _auctionId) public view returns(uint256) {
        return auctions[_auctionId].currentBidAmount;
    }

    function getAuctionCurrentBidTimestamp(uint256 _auctionId) public view returns(uint256) {
        return auctions[_auctionId].currentBidTimestamp;
    }

    function getAuctionSeller(uint256 _auctionId) public view returns(address) {
        return auctions[_auctionId].seller;
    }

    function getAuctionBidCount(uint256 _auctionId) public view returns(uint256) {
        return auctions[_auctionId].bidCount;
    }

    function getAuctionCountForUser(address _user) public view returns (uint256) {
        return auctionsOpenedByUser[_user].length;
    }

    //Auction related setters
    function placeBid(
        uint256 _auctionId, uint256 _currentBidTimestamp, uint256 _ownerIdentifier,
        string _ownerFirstName, string _ownerLastName) public payable onlyLive(_auctionId) returns (bool) {
        Auction storage currentAuction = auctions[_auctionId];
        require(msg.value > currentAuction.currentBidAmount);

        uint256 bidId = currentAuction.bidCount++;
        currentAuction.bids[bidId] = Bid(msg.sender, msg.value, _currentBidTimestamp, _ownerIdentifier, _ownerFirstName, _ownerLastName);

        currentAuction.currentBidBidder = msg.sender;
        currentAuction.currentBidAmount = msg.value;
        currentAuction.currentBidTimestamp = _currentBidTimestamp;

        auctionsBidByUser[msg.sender].push(_auctionId);

        if (bidId > 0) {
            Bid memory previousBid = currentAuction.bids[bidId - 1];
            refunds[previousBid.bidder] += previousBid.amount;
        }

        emit BidPlacement(_auctionId, msg.sender, msg.value);

        return true;
    }

    function cancelAuction(uint256 _auctionId, uint256 _expirationTime) public onlySeller(_auctionId) returns (bool) {
        Auction storage currentAuction = auctions[_auctionId];
        uint256 bidCount = currentAuction.bidCount;

        if (bidCount > 0) {
            Bid memory highestBid = currentAuction.bids[bidCount - 1];
            refunds[highestBid.bidder] += highestBid.amount;
        }
        currentAuction.expirationTime = _expirationTime;
        currentAuction.status = false;

        emit AuctionCancelation(_auctionId);
        
        return true;
    }

    function finishAuction(uint256 _auctionId, uint256 _timestamp) public returns (bool) {
        Auction storage currentAuction = auctions[_auctionId];

        require(currentAuction.status == true);
        require(block.timestamp > currentAuction.expirationTime);

        if (currentAuction.bidCount == 0) {
            currentAuction.status = false;
            return true;
        } else {
            Bid memory highestBid = currentAuction.bids[currentAuction.bidCount - 1];
            
            setAssetOwnerIdentifier(currentAuction.assetIdentifier, highestBid.ownerIdentifier);
            setAssetTimestamp(currentAuction.assetIdentifier, _timestamp);
            setOwner(currentAuction.assetIdentifier, highestBid.bidder);
            setAssetOwnerFirstName(currentAuction.assetIdentifier, highestBid.ownerFirstName);
            setAssetOwnerLastName(currentAuction.assetIdentifier, highestBid.ownerLastName);
            setAssetStatus(currentAuction.assetIdentifier, false);

            refunds[currentAuction.seller] += currentAuction.currentBidAmount;
            currentAuction.status = false;

            emit AuctionFinish(_auctionId, highestBid.bidder, currentAuction.currentBidAmount);
            
            return true;
        }
    }

    //Refund related methods
    function getRefundValue() public view returns (uint256) {
        return refunds[msg.sender];
    }

    function transferRefund() public {
        uint256 refundAmount = refunds[msg.sender];
        if (refundAmount > 0) {
            refunds[msg.sender] = 0;
            msg.sender.transfer(refundAmount);
        }
    }
}
