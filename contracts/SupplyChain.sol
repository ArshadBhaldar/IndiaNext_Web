// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain
 * @notice Agricultural supply chain traceability contract for IndiaNext.
 *         Uses Role-Based Access Control and event-driven checkpoint
 *         logging for gas-optimized transit tracking.
 */
contract SupplyChain {
    // ---------------------------------------------------------------
    //  Enums
    // ---------------------------------------------------------------

    /// @notice The lifecycle states a batch can be in.
    enum BatchState {
        Harvested,
        InTransit,
        AtRetail,
        Sold
    }

    /// @notice Access-control roles.
    enum Role {
        None,
        Admin,
        Farmer,
        Logistics,
        Retailer
    }

    // ---------------------------------------------------------------
    //  Data Structures
    // ---------------------------------------------------------------

    /// @notice Core data for a single harvest batch.
    struct HarvestBatch {
        string batchId;
        address farmerAddress;
        string ipfsCID;
        uint256 timestamp;
        BatchState state;
    }

    // ---------------------------------------------------------------
    //  State Variables
    // ---------------------------------------------------------------

    /// @dev Contract deployer — the initial admin.
    address public admin;

    /// @dev Role mapping for every address.
    mapping(address => Role) public roles;

    /// @dev Batch storage keyed by batchId string.
    mapping(string => HarvestBatch) public batches;

    /// @dev Quick existence check for a batchId.
    mapping(string => bool) public batchExists;

    // ---------------------------------------------------------------
    //  Events (gas-optimized — transit history lives here, not state)
    // ---------------------------------------------------------------

    event RoleGranted(address indexed account, Role role);

    event BatchCreated(
        string indexed batchId,
        address indexed farmer,
        string ipfsCID,
        uint256 timestamp
    );

    event CheckpointLogged(
        string indexed batchId,
        address indexed handler,
        string location,
        string gpsLat,
        string gpsLong,
        uint256 timestamp
    );

    event BatchStateChanged(
        string indexed batchId,
        BatchState previousState,
        BatchState newState,
        uint256 timestamp
    );

    // ---------------------------------------------------------------
    //  Modifiers
    // ---------------------------------------------------------------

    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Access denied: insufficient role");
        _;
    }

    modifier onlyAdmin() {
        require(
            roles[msg.sender] == Role.Admin,
            "Access denied: admin only"
        );
        _;
    }

    modifier batchMustExist(string memory _batchId) {
        require(batchExists[_batchId], "Batch does not exist");
        _;
    }

    // ---------------------------------------------------------------
    //  Constructor
    // ---------------------------------------------------------------

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.Admin;
        emit RoleGranted(msg.sender, Role.Admin);
    }

    // ---------------------------------------------------------------
    //  Admin Functions
    // ---------------------------------------------------------------

    /**
     * @notice Assign a role to an address. Admin-only.
     * @param _account The address to grant the role to.
     * @param _role    The role to grant.
     */
    function grantRole(address _account, Role _role) external onlyAdmin {
        require(_account != address(0), "Cannot grant role to zero address");
        roles[_account] = _role;
        emit RoleGranted(_account, _role);
    }

    // ---------------------------------------------------------------
    //  Farmer Functions
    // ---------------------------------------------------------------

    /**
     * @notice Create a new harvest batch. Farmer-only.
     * @param _batchId Unique human-readable batch identifier.
     * @param _ipfsCID IPFS content identifier for certificates/photos.
     */
    function createBatch(
        string memory _batchId,
        string memory _ipfsCID
    ) external onlyRole(Role.Farmer) {
        require(!batchExists[_batchId], "Batch ID already exists");

        batches[_batchId] = HarvestBatch({
            batchId: _batchId,
            farmerAddress: msg.sender,
            ipfsCID: _ipfsCID,
            timestamp: block.timestamp,
            state: BatchState.Harvested
        });

        batchExists[_batchId] = true;

        emit BatchCreated(_batchId, msg.sender, _ipfsCID, block.timestamp);
    }

    // ---------------------------------------------------------------
    //  Logistics Functions
    // ---------------------------------------------------------------

    /**
     * @notice Log a transit checkpoint. Logistics-only.
     *         Emits an event instead of writing to state for gas savings.
     *         Also transitions batch to InTransit on first call.
     * @param _batchId  Batch to update.
     * @param _location Human-readable location name.
     * @param _gpsLat   GPS latitude as a string.
     * @param _gpsLong  GPS longitude as a string.
     */
    function updateTransit(
        string memory _batchId,
        string memory _location,
        string memory _gpsLat,
        string memory _gpsLong
    ) external onlyRole(Role.Logistics) batchMustExist(_batchId) {
        HarvestBatch storage batch = batches[_batchId];

        require(
            batch.state == BatchState.Harvested ||
                batch.state == BatchState.InTransit,
            "Batch is not in a transitable state"
        );

        // Transition from Harvested → InTransit on the first checkpoint
        if (batch.state == BatchState.Harvested) {
            BatchState prev = batch.state;
            batch.state = BatchState.InTransit;
            emit BatchStateChanged(_batchId, prev, BatchState.InTransit, block.timestamp);
        }

        emit CheckpointLogged(
            _batchId,
            msg.sender,
            _location,
            _gpsLat,
            _gpsLong,
            block.timestamp
        );
    }

    // ---------------------------------------------------------------
    //  Retailer Functions
    // ---------------------------------------------------------------

    /**
     * @notice Mark a batch as received at the retail location. Retailer-only.
     * @param _batchId Batch to update.
     */
    function receiveAtRetail(
        string memory _batchId
    ) external onlyRole(Role.Retailer) batchMustExist(_batchId) {
        HarvestBatch storage batch = batches[_batchId];
        require(
            batch.state == BatchState.InTransit,
            "Batch must be InTransit to receive at retail"
        );

        BatchState prev = batch.state;
        batch.state = BatchState.AtRetail;
        emit BatchStateChanged(_batchId, prev, BatchState.AtRetail, block.timestamp);
    }

    /**
     * @notice Mark a batch as sold. Retailer-only.
     * @param _batchId Batch to update.
     */
    function markSold(
        string memory _batchId
    ) external onlyRole(Role.Retailer) batchMustExist(_batchId) {
        HarvestBatch storage batch = batches[_batchId];
        require(
            batch.state == BatchState.AtRetail,
            "Batch must be AtRetail to mark as sold"
        );

        BatchState prev = batch.state;
        batch.state = BatchState.Sold;
        emit BatchStateChanged(_batchId, prev, BatchState.Sold, block.timestamp);
    }

    // ---------------------------------------------------------------
    //  View Functions
    // ---------------------------------------------------------------

    /**
     * @notice Get the on-chain data for a batch.
     * @param _batchId Batch to query.
     * @return The HarvestBatch struct.
     */
    function getBatch(
        string memory _batchId
    ) external view batchMustExist(_batchId) returns (HarvestBatch memory) {
        return batches[_batchId];
    }
}
