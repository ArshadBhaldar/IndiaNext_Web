// Upload controller — handles file uploads and IPFS pinning.

const multer = require("multer");
const ipfsService = require("../services/ipfsService");

// Multer config: store files in memory (we pin directly to IPFS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    // Allow images and PDFs (certificates)
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported. Use JPEG, PNG, WebP, GIF, or PDF.`));
    }
  },
});

/**
 * POST /api/upload/certificate
 * Accepts a single file (field name "file"), pins to IPFS.
 */
const uploadCertificate = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
      }

      if (!ipfsService.isAvailable()) {
        return res.status(200).json({
          success: true,
          message: "File received but IPFS pinning is not configured. CID is a mock placeholder.",
          data: {
            fileName: req.file.originalname,
            size: req.file.size,
            cid: `mock-cid-${Date.now()}`,
            gatewayUrl: null,
          },
        });
      }

      const result = await ipfsService.pinFile(req.file.buffer, req.file.originalname);

      res.status(200).json({
        success: true,
        message: "Certificate pinned to IPFS successfully.",
        data: {
          fileName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          cid: result.cid,
          gatewayUrl: result.gatewayUrl,
        },
      });
    } catch (err) {
      console.error("uploadCertificate error:", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  },
];

/**
 * POST /api/upload/photo
 * Accepts a single image (field name "file"), pins to IPFS.
 */
const uploadPhoto = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
      }

      if (!ipfsService.isAvailable()) {
        return res.status(200).json({
          success: true,
          message: "Photo received but IPFS pinning is not configured. CID is a mock placeholder.",
          data: {
            fileName: req.file.originalname,
            size: req.file.size,
            cid: `mock-cid-${Date.now()}`,
            gatewayUrl: null,
          },
        });
      }

      const result = await ipfsService.pinFile(req.file.buffer, req.file.originalname);

      res.status(200).json({
        success: true,
        message: "Photo pinned to IPFS successfully.",
        data: {
          fileName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          cid: result.cid,
          gatewayUrl: result.gatewayUrl,
        },
      });
    } catch (err) {
      console.error("uploadPhoto error:", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  },
];

/**
 * POST /api/upload/metadata
 * Accepts JSON body, pins to IPFS as metadata.
 */
const uploadMetadata = async (req, res) => {
  try {
    const { metadata, name } = req.body;

    if (!metadata) {
      return res.status(400).json({ success: false, message: "'metadata' field is required." });
    }

    if (!ipfsService.isAvailable()) {
      return res.status(200).json({
        success: true,
        message: "Metadata received but IPFS pinning is not configured.",
        data: {
          cid: `mock-cid-${Date.now()}`,
          gatewayUrl: null,
        },
      });
    }

    const result = await ipfsService.pinJSON(metadata, name || "batch-metadata");

    res.status(200).json({
      success: true,
      message: "Metadata pinned to IPFS successfully.",
      data: {
        cid: result.cid,
        gatewayUrl: result.gatewayUrl,
      },
    });
  } catch (err) {
    console.error("uploadMetadata error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { uploadCertificate, uploadPhoto, uploadMetadata };
