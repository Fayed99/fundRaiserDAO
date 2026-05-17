// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FundRaiserDAO {
    error InvalidCampaign();
    error InvalidInput();
    error NotCreator();
    error AlreadyWithdrawn();
    error NothingToWithdraw();
    error WithdrawUnavailable();

    struct Campaign {
        address payable creator;
        string title;
        string shortDescription;
        string description;
        string category;
        string[] images;
        uint256 goal;
        uint256 pledged;
        uint64 deadline;
        uint64 createdAt;
        uint32 backers;
        bool withdrawn;
    }

    struct CampaignView {
        uint256 id;
        address creator;
        string title;
        string shortDescription;
        string description;
        string category;
        string[] images;
        uint256 goal;
        uint256 pledged;
        uint64 deadline;
        uint64 createdAt;
        uint32 backers;
        uint32 commentCount;
        uint32 updateCount;
        bool withdrawn;
    }

    struct Comment {
        address author;
        string message;
        uint64 createdAt;
    }

    struct Update {
        string message;
        uint64 createdAt;
    }

    uint256 public campaignCount;
    uint256 public totalRaised;
    uint256 public totalPledges;

    mapping(uint256 => Campaign) private campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributionOf;
    mapping(uint256 => Comment[]) private comments;
    mapping(uint256 => Update[]) private updates;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 goal, uint64 deadline);
    event Pledged(uint256 indexed campaignId, address indexed backer, uint256 amount);
    event CommentAdded(uint256 indexed campaignId, address indexed author, string message);
    event UpdatePosted(uint256 indexed campaignId, string message);
    event Withdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);

    function createCampaign(
        string calldata title,
        string calldata shortDescription,
        string calldata description,
        string calldata category,
        string[] calldata images,
        uint256 goal,
        uint64 durationDays
    ) external returns (uint256 campaignId) {
        if (
            bytes(title).length == 0 ||
            bytes(title).length > 80 ||
            bytes(shortDescription).length == 0 ||
            bytes(shortDescription).length > 140 ||
            bytes(description).length == 0 ||
            bytes(category).length == 0 ||
            images.length == 0 ||
            images.length > 6 ||
            goal == 0 ||
            durationDays == 0 ||
            durationDays > 365
        ) {
            revert InvalidInput();
        }

        campaignId = campaignCount++;
        Campaign storage campaign = campaigns[campaignId];
        campaign.creator = payable(msg.sender);
        campaign.title = title;
        campaign.shortDescription = shortDescription;
        campaign.description = description;
        campaign.category = category;
        campaign.goal = goal;
        campaign.deadline = uint64(block.timestamp + uint256(durationDays) * 1 days);
        campaign.createdAt = uint64(block.timestamp);

        for (uint256 i = 0; i < images.length; i++) {
            if (bytes(images[i]).length == 0 || bytes(images[i]).length > 500) revert InvalidInput();
            campaign.images.push(images[i]);
        }

        emit CampaignCreated(campaignId, msg.sender, goal, campaign.deadline);
    }

    function pledge(uint256 campaignId) external payable {
        _pledge(campaignId);
    }

    function pledgeWithComment(uint256 campaignId, string calldata message) external payable {
        _pledge(campaignId);
        _addComment(campaignId, message);
    }

    function addComment(uint256 campaignId, string calldata message) external {
        _requireCampaign(campaignId);
        _addComment(campaignId, message);
    }

    function postUpdate(uint256 campaignId, string calldata message) external {
        Campaign storage campaign = _requireCampaign(campaignId);
        if (msg.sender != campaign.creator) revert NotCreator();
        if (bytes(message).length == 0 || bytes(message).length > 500) revert InvalidInput();

        updates[campaignId].push(Update({message: message, createdAt: uint64(block.timestamp)}));
        emit UpdatePosted(campaignId, message);
    }

    function withdraw(uint256 campaignId) external {
        Campaign storage campaign = _requireCampaign(campaignId);
        if (msg.sender != campaign.creator) revert NotCreator();
        if (campaign.withdrawn) revert AlreadyWithdrawn();
        if (campaign.pledged == 0) revert NothingToWithdraw();
        if (block.timestamp < campaign.deadline && campaign.pledged < campaign.goal) revert WithdrawUnavailable();

        campaign.withdrawn = true;
        uint256 amount = campaign.pledged;
        (bool ok,) = campaign.creator.call{value: amount}("");
        require(ok, "TRANSFER_FAILED");

        emit Withdrawn(campaignId, msg.sender, amount);
    }

    function getCampaign(uint256 campaignId) external view returns (CampaignView memory) {
        Campaign storage campaign = _requireCampaign(campaignId);
        return _campaignView(campaignId, campaign);
    }

    function getCampaigns() external view returns (CampaignView[] memory views) {
        views = new CampaignView[](campaignCount);
        for (uint256 i = 0; i < campaignCount; i++) {
            views[i] = _campaignView(i, campaigns[i]);
        }
    }

    function getComments(uint256 campaignId) external view returns (Comment[] memory) {
        _requireCampaign(campaignId);
        return comments[campaignId];
    }

    function getUpdates(uint256 campaignId) external view returns (Update[] memory) {
        _requireCampaign(campaignId);
        return updates[campaignId];
    }

    function _campaignView(uint256 campaignId, Campaign storage campaign) private view returns (CampaignView memory) {
        return CampaignView({
            id: campaignId,
            creator: campaign.creator,
            title: campaign.title,
            shortDescription: campaign.shortDescription,
            description: campaign.description,
            category: campaign.category,
            images: campaign.images,
            goal: campaign.goal,
            pledged: campaign.pledged,
            deadline: campaign.deadline,
            createdAt: campaign.createdAt,
            backers: campaign.backers,
            commentCount: uint32(comments[campaignId].length),
            updateCount: uint32(updates[campaignId].length),
            withdrawn: campaign.withdrawn
        });
    }

    function _pledge(uint256 campaignId) private {
        Campaign storage campaign = _requireCampaign(campaignId);
        if (msg.value == 0 || block.timestamp > campaign.deadline || campaign.withdrawn) revert InvalidInput();

        if (contributionOf[campaignId][msg.sender] == 0) {
            campaign.backers++;
        }

        contributionOf[campaignId][msg.sender] += msg.value;
        campaign.pledged += msg.value;
        totalRaised += msg.value;
        totalPledges++;

        emit Pledged(campaignId, msg.sender, msg.value);
    }

    function _addComment(uint256 campaignId, string calldata message) private {
        if (bytes(message).length == 0 || bytes(message).length > 500) revert InvalidInput();
        comments[campaignId].push(Comment({author: msg.sender, message: message, createdAt: uint64(block.timestamp)}));
        emit CommentAdded(campaignId, msg.sender, message);
    }

    function _requireCampaign(uint256 campaignId) private view returns (Campaign storage campaign) {
        if (campaignId >= campaignCount) revert InvalidCampaign();
        campaign = campaigns[campaignId];
    }
}
