const express = require('express');
const { getProfile, updateProfile } = require('../controllers/profileController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getProfile);
router.put('/', upload.single('avatar'), updateProfile);

module.exports = router;

