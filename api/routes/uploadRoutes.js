// Routes for file uploads and IPFS pinning.

const express = require("express");
const router = express.Router();

const {
  uploadCertificate,
  uploadPhoto,
  uploadMetadata,
} = require("../controllers/uploadController");

// @route   POST /api/upload/certificate
// @desc    Upload an organic certificate → pin to IPFS
router.post("/certificate", ...uploadCertificate);

// @route   POST /api/upload/photo
// @desc    Upload a harvest/transit photo → pin to IPFS
router.post("/photo", ...uploadPhoto);

// @route   POST /api/upload/metadata
// @desc    Pin JSON metadata to IPFS
router.post("/metadata", uploadMetadata);

module.exports = router;
