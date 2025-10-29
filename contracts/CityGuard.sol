// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title CityGuard - Encrypted Report Storage with FHE
/// @notice Stores encrypted citizen reports with FHE-protected sensitive data
/// @dev Uses ChaCha20 for content encryption and FHE eaddress for key protection
contract CityGuard is SepoliaConfig {
    struct Report {
        address reporter;
        string title;
        bytes encryptedData; // ChaCha20 ciphertext (nonce || ciphertext)
        eaddress encryptedKey; // FHE-encrypted address-shaped decryption key
        uint64 createdAt; // unix timestamp
        ReportStatus status;
    }

    enum ReportStatus {
        Pending,
        Reviewed,
        Resolved
    }

    Report[] private _reports;
    mapping(address => uint256[]) private _reportsByReporter;

    event ReportSubmitted(
        uint256 indexed id,
        address indexed reporter,
        string title,
        uint64 createdAt
    );

    event ReportStatusUpdated(
        uint256 indexed id,
        ReportStatus newStatus
    );

    /// @notice Submit a new encrypted report
    /// @param title A short plaintext title for listing
    /// @param encryptedData The ChaCha20 ciphertext bytes (nonce || ciphertext)
    /// @param encKey External encrypted address input handle
    /// @param inputProof The Zama input proof for `encKey`
    function submitReport(
        string calldata title,
        bytes calldata encryptedData,
        externalEaddress encKey,
        bytes calldata inputProof
    ) external {
        eaddress key = FHE.fromExternal(encKey, inputProof);

        Report memory r;
        r.reporter = msg.sender;
        r.title = title;
        r.encryptedData = encryptedData;
        r.encryptedKey = key;
        r.createdAt = uint64(block.timestamp);
        r.status = ReportStatus.Pending;

        _reports.push(r);
        uint256 id = _reports.length - 1;
        _reportsByReporter[msg.sender].push(id);

        // ACL: allow contract and reporter to access the encrypted key
        FHE.allowThis(_reports[id].encryptedKey);
        FHE.allow(_reports[id].encryptedKey, msg.sender);

        emit ReportSubmitted(id, msg.sender, title, r.createdAt);
    }

    /// @notice Get total report count
    /// @return count Total number of reports
    function getReportCount() external view returns (uint256 count) {
        return _reports.length;
    }

    /// @notice Get report count for a specific reporter
    /// @param reporter The address to query
    /// @return count Number of reports by this reporter
    function getReportCountByReporter(address reporter) external view returns (uint256 count) {
        return _reportsByReporter[reporter].length;
    }

    /// @notice Get report IDs for a specific reporter
    /// @param reporter The address to query
    /// @return ids Array of report IDs
    function getReportIdsByReporter(address reporter) external view returns (uint256[] memory ids) {
        return _reportsByReporter[reporter];
    }

    /// @notice Get metadata for a report
    /// @param id The report ID
    /// @return reporter Reporter address
    /// @return title Title string
    /// @return createdAt Timestamp (seconds)
    /// @return status Report status
    function getReportMeta(uint256 id)
        external
        view
        returns (
            address reporter,
            string memory title,
            uint64 createdAt,
            ReportStatus status
        )
    {
        Report storage r = _reports[id];
        return (r.reporter, r.title, r.createdAt, r.status);
    }

    /// @notice Get the encrypted data for a report
    /// @param id The report ID
    /// @return data The ChaCha20 ciphertext bytes
    function getReportData(uint256 id) external view returns (bytes memory data) {
        return _reports[id].encryptedData;
    }

    /// @notice Get the encrypted key for a report
    /// @param id The report ID
    /// @return encKey The FHE-encrypted key
    function getEncryptedKey(uint256 id) external view returns (eaddress encKey) {
        return _reports[id].encryptedKey;
    }

    /// @notice Update report status (only reporter can update)
    /// @param id The report ID
    /// @param newStatus The new status
    function updateReportStatus(uint256 id, ReportStatus newStatus) external {
        require(id < _reports.length, "Report does not exist");
        require(_reports[id].reporter == msg.sender, "Only reporter can update status");
        
        _reports[id].status = newStatus;
        emit ReportStatusUpdated(id, newStatus);
    }
}
