pragma solidity ^0.4.22;

contract ConceptAuction {

    struct Asset {
        uint256 ownerIdentifier;
        uint256 timestamp;
        address owner;
        string ownerFirstName;
        string ownerLastName;
        string name;
        bool status;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        uint256 ownerIdentifier;
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
        bool status;
        mapping (uint256 => Bid) bids;
    }

    uint256 private assetCount;
    uint256 private auctionCount;

    mapping(uint256 => Asset) private assets;
    mapping(uint256 => Auction) private auctions;
    mapping(address => uint256[]) private assetsAddedByUser;
    mapping(address => uint256[]) private auctionsOpenedByUser;
    mapping(address => uint256[]) private auctionsBidByUser;
    mapping(address => uint256) private refunds;

    address private owner;

    // Events that will be checked by DAPPs
    event AssetCreation(uint256 id, address owner, string assetName);
    event AuctionCreation(uint256 id, string name, uint256 startPrice);
    event AuctionCancelation(uint256 id);
    event AuctionFinish(uint256 auctionId, address winner, uint256 amount);
    event BidPlacement(uint auctionId, address bidder, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner is allowed to use this operation");
        _;
    }

    modifier onlySeller(uint _auctionId) {
        require(msg.sender == auctions[_auctionId].seller, "Only seller is allowed to use this operation");
        _;
    }

    modifier onlyLive(uint _auctionId, uint _currentBidTimestamp) {
        Auction memory current = auctions[_auctionId];
        require(_currentBidTimestamp < current.expirationTime, "This operation should be performed if auction is live");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function createAsset(
        uint256  _ownerIdentifier, uint256 _timestamp, string _ownerFirstName, string _ownerLastName,
        string _assetName) external returns (uint256 _assetId) {

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
        uint256 _startPrice, uint256 _assetId) external payable returns (uint256 _auctionId) {

        require(0 < _expirationTime, "Expiration time cannot be set to zero or lower.");
        require(0 < _startPrice, "Start price cannot be set to zero or lower.");
        require(assets[_assetId].status == false, "Asset cannot be auctioned as it is already in another auction right now.");

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
        auctions[_auctionId].assetIdentifier = _assetId;
        auctions[_auctionId].status = true;        
        setAssetStatus(_assetId,true);

        auctionsOpenedByUser[msg.sender].push(_auctionId);

        emit AuctionCreation(_auctionId, _name, _startPrice);
    }

    //Asset related getters
    function getAsset(uint256 _assetId) external view returns(
        uint256,uint256,address,string,string,string,bool) {
        Asset memory current = assets[_assetId];
        return (
            current.ownerIdentifier,
            current.timestamp,
            current.owner,
            current.ownerFirstName,
            current.ownerLastName,
            current.name,
            current.status
            );
    }

    function getAssetCount() external view returns(uint256){
        return assetCount;
    }

    function getAssetOwnerIdentifier(uint256 _assetId) external view returns(uint256) {
        return assets[_assetId].ownerIdentifier;
    }

    function getAssetTimestamp(uint256 _assetId) external view returns(uint256) {
        return assets[_assetId].timestamp;
    }

    function getAssetOwner(uint256 _assetId) external view returns(address) {
        return assets[_assetId].owner;
    }

    function getAssetOwnerFirstName(uint256 _assetId) external view returns(string) {
        return assets[_assetId].ownerFirstName;
    }

    function getAssetOwnerLastName(uint256 _assetId) external view returns(string) {
        return assets[_assetId].ownerLastName;
    }

    function getAssetName(uint256 _assetId) external view returns(string) {
        return assets[_assetId].name;
    }

    function getAssetStatus(uint256 _assetId) external view returns(bool) {
        return assets[_assetId].status;
    }

    function getAssetCountForUser(address _user) external view returns (uint256) {
        return assetsAddedByUser[_user].length;
    }

    //Asset related setters
    //Maybe add onlyContract like a limiter
    //Transferlerde alan kişi ilk onaylama, onaylamadan sonra
    function setAssetOwnerIdentifier(uint256 _assetId, uint _newAssetOwnerIdentifier) private returns (bool) {
        if(assets[_assetId].ownerIdentifier != 0){
            assets[_assetId].ownerIdentifier = _newAssetOwnerIdentifier;
            return true;
        }else{
            return false;
        }
    }

    function setAssetTimestamp(uint256 _assetId, uint256 _timestamp) private returns (bool) {
        if(assets[_assetId].timestamp != 0){
            assets[_assetId].timestamp = _timestamp;
            return true;
        }else{
            return false;
        }
    }
    
    function setOwner(uint256 _assetId, address _newOwner) private returns (bool) {
        if(assets[_assetId].owner != 0){
            assets[_assetId].owner = _newOwner;
            return true;
        }else{
            return false;
        }
    }

    function setAssetOwnerFirstName(uint256 _assetId, string _newAssetOwnerFirstName) private returns (bool) {
        if(bytes(assets[_assetId].ownerFirstName).length != 0){
            assets[_assetId].ownerFirstName = _newAssetOwnerFirstName;
            return true;
        }else{
            return false;
        }
    }

    function setAssetOwnerLastName(uint256 _assetId, string _newAssetOwnerLastName) private returns (bool) {
        if(bytes(assets[_assetId].ownerLastName).length != 0){
            assets[_assetId].ownerLastName = _newAssetOwnerLastName;
            return true;
        }else{
            return false;
        }
    }

    function setAssetStatus(uint256 _assetId, bool _status) private returns (bool) {
        if(bytes(assets[_assetId].name).length != 0){
            assets[_assetId].status = _status;
            return true;
        }else{
            return false;
        }
    }

    //Auction related getters
    function getAuctionCount() external view returns(uint256) {
        return auctionCount;
    }

    function getAuction(uint256 _auctionId) external view returns(
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

    function getAuctionName(uint256 _auctionId) external view returns(string) {
        return auctions[_auctionId].name;
    }

    function getAuctionDescription(uint256 _auctionId) external view returns(string) {
        return auctions[_auctionId].description;
    }

    function getAuctionStartTime(uint256 _auctionId) external view returns(uint256) {
        return auctions[_auctionId].startTime;
    }

    function getAuctionExpirationTime(uint256 _auctionId) external view returns(uint256) {
        return auctions[_auctionId].expirationTime;
    }

    function getAuctionStartPrice(uint256 _auctionId) external view returns(uint256) {
        return auctions[_auctionId].startPrice;
    }

    function getAuctionStatus(uint256 _auctionId) external view returns (bool) {
        return auctions[_auctionId].status;
    }

    function getAuctionCurrentBidder(uint256 _auctionId) external view returns(address) {
        return auctions[_auctionId].currentBidBidder;
    }

    function getAuctionCurrentBidAmount(uint256 _auctionId) external view returns(uint256) {
        return auctions[_auctionId].currentBidAmount;
    }

    function getAuctionCurrentBidTimestamp(uint256 _auctionId) external view returns(uint256) {
        return auctions[_auctionId].currentBidTimestamp;
    }

    function getAuctionSeller(uint256 _auctionId) external view returns(address) {
        return auctions[_auctionId].seller;
    }

    function getAuctionBidCount(uint256 _auctionId) external view returns(uint256) {
        return auctions[_auctionId].bidCount;
    }

    function getAuctionCountForUser(address _user) external view returns (uint256) {
        return auctionsOpenedByUser[_user].length;
    }

    //Auction related setters
    function placeBid(
        uint256 _auctionId, uint256 _currentBidTimestamp, uint256 _ownerIdentifier,
        string _ownerFirstName, string _ownerLastName) external payable onlyLive(_auctionId, _currentBidTimestamp) returns (bool) {
        Auction storage currentAuction = auctions[_auctionId];
        require(
            msg.value >= currentAuction.currentBidAmount,
            "Bid placement failed as the amount that is sent as bid is lower than current bid."
        );

        uint256 bidId = currentAuction.bidCount++;
        currentAuction.bids[bidId] = Bid(msg.sender, msg.value, _currentBidTimestamp, _ownerIdentifier, _ownerFirstName, _ownerLastName);

        currentAuction.currentBidBidder = msg.sender;
        currentAuction.currentBidAmount = msg.value;
        currentAuction.currentBidTimestamp = _currentBidTimestamp;

        auctionsBidByUser[msg.sender].push(_auctionId);

        if (bidId > 0) {
            Bid memory previousBid = currentAuction.bids[bidId - 1];
            refunds[previousBid.bidder] += previousBid.amount;

            transferRefundNow(previousBid.bidder);
        }

        emit BidPlacement(_auctionId, msg.sender, msg.value);

        return true;
    }

    function cancelAuction(uint256 _auctionId, uint256 _expirationTime) external onlySeller(_auctionId) returns (bool) {
        Auction storage currentAuction = auctions[_auctionId];
        uint256 bidCount = currentAuction.bidCount;

        if (bidCount > 0) {
            Bid memory highestBid = currentAuction.bids[bidCount - 1];
            refunds[highestBid.bidder] += highestBid.amount;
        }
        currentAuction.expirationTime = _expirationTime;
        currentAuction.status = false;

        Asset storage currentAsset = assets[currentAuction.assetIdentifier];
        currentAsset.status = false;

        emit AuctionCancelation(_auctionId);

        transferRefundNow(highestBid.bidder);
        
        return true;
    }

    function finishAuction(uint256 _auctionId, uint256 _timestamp) external returns (bool) {
        Auction storage currentAuction = auctions[_auctionId];

        require(currentAuction.status == true, "Finish auction failed as auction needs to be active to be finished.");
        require(_timestamp > currentAuction.expirationTime, "Finish auction failed as expiration time is not reached.");

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
            
            transferRefundNow(currentAuction.seller);

            return true;
        }
    }

    //Refund related methods
    function getRefundValue() external view returns (uint256) {
        return refunds[msg.sender];
    }

    function transferRefund() external {
        uint256 refundAmount = refunds[msg.sender];
        if (refundAmount > 0) {
            refunds[msg.sender] = 0;
            msg.sender.transfer(refundAmount);
        }
    }

    function transferRefundNow(address _highestBidder) public {
        uint256 refundAmount = refunds[_highestBidder];
        if (refundAmount > 0) {
            refunds[_highestBidder] = 0;
            _highestBidder.transfer(refundAmount);
        }
    }
}
