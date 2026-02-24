// GET /api/profile
const getProfile = async (req, res, next) => {
  try {
    const user = req.userEntity;

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('[Profile] Failed to get profile', { message: error.message });
    next(error);
  }
};

// PUT /api/profile
const updateProfile = async (req, res, next) => {
  try {
    const user = req.userEntity;
    const { name, bio } = req.body;

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    if (req.file) {
      user.avatarUrl = `/uploads/${req.file.filename}`;
    }

    await user.save();

    console.log('[Profile] Updated profile', { id: user._id.toString() });

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('[Profile] Failed to update profile', {
      message: error.message,
    });
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

