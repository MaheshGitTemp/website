 
const prepareDBData = require('../services/db');
const { convertCredentials } = require('../services/passwordfunction');
const {
  generateAccessToken,
  generateRefreshToken,
  accessCookieOptions,
  refreshCookieOptions
} = require('./tokenController');

const { processImage } = require('../services/imageService');
exports.register = async (req, res) => {
  try {
    const data = req.body;
    let obj = await prepareDBData.register(data);
    if (!obj) {
      res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'Data Already Exists.' })}`);
    } else {
      res.status(200).send(`${JSON.stringify({ status: 'Success', result: 'Data Registered Successfully.' })}`);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

exports.login = async (req, res) => {
  try {
    const data    = req.body;
    const userobj = await prepareDBData.GetUserDetails(data.uemail);

    if (!userobj || userobj.length === 0) {
      return res.status(200).json({ status: 'Failure', result: 'Data Does not Exists.' });
    }

    const accountStatus = userobj[0].status;

    if (accountStatus === 'Closed') {
      return res.status(200).json({
        status: 'Failure',
        result: 'This account has been closed. Please contact support.'
      });
    }

    if (accountStatus === 'Blocked') {
      return res.status(200).json({
        status: 'Failure',
        result: 'Your account has been blocked. Please contact support.'
      });
    }


    if (userobj[0].upassword === 'Closed') {
      return res.status(200).json({
        status: 'Failure',
        result: 'This account has been closed. Please contact support.'
      });
    }

    const decryptedPassword = await convertCredentials(userobj, false);
    if (data.upassword !== decryptedPassword || data.uemail !== userobj[0].uemail) {
      return res.status(401).json({ status: 'Failure', result: 'Invalid Credentials.' });
    }

    const tokenPayload = {
      uid:     userobj[0].uid,
      uemail:  userobj[0].uemail,
      ugender: userobj[0].ugender
    };

    const accessToken  = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);


    res.cookie('accessToken',  accessToken,  accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

 
    return res.status(200).json({
      status: 'Success',
      result: 'Login Successfully.',
      data: {
        userId:     userobj[0].uid,
        userGender: userobj[0].ugender
   
      }
    });

  } catch (error) {
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const data = req.body;
    let user   = await prepareDBData.GetUserById(data.id);
    if (!user) {
      res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'No User Found.' })}`);
    } else {
      res.status(200).send(user);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const gender = req.query.gender || null;

    const result = await prepareDBData.GetAllUsers(page, limit, gender);

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(200).json({ status: 'Success', data: [], total: 0, page, limit });
    }

    return res.status(200).json({
      status: 'Success',
      data:   result.rows,
      total:  result.total,
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({ status: 'Failure', error: error.message });
  }
};



exports.uploadProfileImages = async (req, res) => {
  try {
    const { gallery } = req.body;
 
    if (!gallery) {
      return res.status(400).json({ status: 'Failure', result: 'No gallery data provided.' });
    }
 
    const items   = JSON.parse(gallery);
    const userId  = req.user.uid;
    const processed = [];
 
    for (const item of items) {
      // item.imagepath is a base64 string from frontend
      const paths = await processImage(item.imagepath, userId);
 
      processed.push({
        imagepath:        paths.original,  // full size
        imagepath_medium: paths.medium,    // 600×800
        imagepath_thumb:  paths.thumb,     // 150×150
        isprofile:        item.isprofile || false,
        userid:           userId,
        updateddate:      item.updateddate || new Date().toISOString().split('T')[0]
      });
    }
 
    // Save all 3 paths per image to DB
    const savedList = JSON.stringify(processed);
    const result    = await prepareDBData.SaveUserGallery(savedList);
 
    return res.status(200).json({
      status: 'Success',
      result: 'Images uploaded successfully.',
      data:   result
    });
 
  } catch (error) {
    console.error('uploadProfileImages error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

exports.DeleteUserGalleryRecord = async (req, res) => {
  try {
    const { id, user_id } = req.body;
    if (!id || !user_id) {
      return res.status(400).json({ status: 'Failure', result: 'Gallery record id and user_id are required.' });
    }
    const result = await prepareDBData.DeleteUserGalleryRecord(Number(id), Number(user_id));
    if (!result.success) {
      return res.status(400).json({ status: 'Failure', result: result.message });
    }
    return res.status(200).json({ status: 'Success', result: result.message, deletedId: result.deletedId });
  } catch (error) {
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── Update User Records ──────────────────────────────────────────────────────
exports.updateUserRecords = async (req, res) => {
  try {
    const data      = req.body;
    let userDetails = await prepareDBData.GetUserDetailsById(data.uid);
    if (userDetails.length === 0) {
      let result = await prepareDBData.SaveUserDetails(data);
      if (result) {
        res.status(200).send(`${JSON.stringify({ status: 'Success', result: 'User Details Updated Successfully.', userdetials: data })}`);
      } else {
        res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'Records not Saved. Please check data once..' })}`);
      }
    } else {
      let result = await prepareDBData.UpdateUserDetails(data);
      if (result) {
        res.status(200).send(`${JSON.stringify({ status: 'Success', userdetials: data, result: 'User Details Updated Successfully.' })}`);
      } else {
        res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'Records not Saved. Please check data once..' })}`);
      }
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Fetch All User Details ───────────────────────────────────────────────────
exports.FetchAllUserDetails = async (req, res) => {
  try {
    const data      = req.body;
    let userGallery = await prepareDBData.FetchAllUserDetails(data.uid);
    if (!userGallery) {
      res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'No details Found.' })}`);
    } else {
      res.status(200).send(userGallery[0]);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Fetch List Data ──────────────────────────────────────────────────────────
exports.Fetchlistdata = async (req, res) => {
  try {
    const {
      gender, ageFrom, ageTo, maritalStatus,
      heightFrom, heightTo, country, state, city,
      caste, education, occupation, annualIncome,
      workingLocation, page = 1, limit = 20
    } = req.body;

    const result = await prepareDBData.Fetchlistdata({
      gender, ageFrom, ageTo, maritalStatus,
      heightFrom, heightTo, country, state, city,
      caste, education, occupation, annualIncome,
      workingLocation,
      page:  Number(page)  || 1,
      limit: Number(limit) || 20
    });

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(200).json({ status: 'Success', data: [], total: 0, page: Number(page), limit: Number(limit) });
    }

    return res.status(200).json({
      status: 'Success',
      data:   result.rows,
      total:  result.total,
      page:   Number(page),
      limit:  Number(limit)
    });
  } catch (error) {
    res.status(500).json({ status: 'Failure', error: error.message });
  }
};

// ─── Get User Records ─────────────────────────────────────────────────────────
exports.getUserRecords = async (req, res) => {
  try {
    let userdetails = await prepareDBData.getAllUserDetails();
    if (!userdetails) {
      res.status(200).send(`${JSON.stringify({ status: 'Failure', result: 'No details Found.' })}`);
    } else {
      res.status(200).send(userdetails);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Update User Registration Details ────────────────────────────────────────
exports.UpdateUserRegistrationDetails = async (req, res) => {
  try {
    const data = req.body;
    let result = await prepareDBData.UpdateUserRegistrationDetails(data);
    if (result) {
      res.status(200).send(`data: ${JSON.stringify({ status: 'ok', result: 'User Details Updated Successfully.', userdetials: data })}`);
    } else {
      res.status(200).send(`data: ${JSON.stringify({ status: 'fail', result: 'Records not Saved. Please check data once..' })}`);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Update User Profile Status ───────────────────────────────────────────────
exports.updateUserProfileStatus = async (req, res) => {
  try {
    const { id } = req.body;
    let result   = await prepareDBData.updateUserProfileStatus(id);
    if (result.success) {
      res.status(200).send({ status: 'ok',   result: result.message, userdetials: { id } });
    } else {
      res.status(200).send({ status: 'fail', result: result.message });
    }
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};

// ─── Get Public Profile (no auth needed) ─────────────────────────────────────
exports.getPublicProfile = async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ status: 'Failure', result: 'uid is required.' });
    }
    const data = await prepareDBData.getPublicProfile(uid);
    if (!data) {
      return res.status(200).json({ status: 'Failure', result: 'Profile not found.' });
    }
    return res.status(200).json({ status: 'Success', data });
  } catch (error) {
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.user.uid; // from auth cookie middleware

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'Failure',
        result: 'New password must be at least 6 characters.'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: 'Failure',
        result: 'New password must be different from current password.'
      });
    }

    // Get current encrypted password from DB
    const userRecord = await prepareDBData.getUserPassword(uid);
    if (!userRecord) {
      return res.status(404).json({ status: 'Failure', result: 'User not found.' });
    }

    // Decrypt and validate current password
    const decrypted = await convertCredentials([{ upassword: userRecord.upassword }], false);
    if (decrypted !== currentPassword) {
      return res.status(200).json({
        status: 'Failure',
        result: 'Current password is incorrect.'
      });
    }

    // Encrypt new password using same encryption
    const encrypted = await convertCredentials({ upassword: newPassword }, true);

    // Update in DB
    const updated = await prepareDBData.updateUserPassword(uid, encrypted);
    if (!updated) {
      return res.status(500).json({ status: 'Failure', result: 'Failed to update password.' });
    }

    return res.status(200).json({
      status: 'Success',
      result: 'Password updated successfully.'
    });

  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── Close Account ────────────────────────────────────────────────────────────
// POST /api/closeAccount
// uid taken from HttpOnly cookie (req.user.uid)
exports.closeAccount = async (req, res) => {
  try {
    const uid = req.user.uid; // from auth middleware

    const closed = await prepareDBData.closeAccount(uid);
    if (!closed) {
      return res.status(404).json({ status: 'Failure', result: 'User not found.' });
    }

    // Clear cookies — force logout after closing
    res.clearCookie('accessToken',  { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });

    return res.status(200).json({
      status: 'Success',
      result: 'Account closed successfully.'
    });
  } catch (error) {
    console.error('closeAccount error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── Reset Password (Forgot Password flow) ────────────────────────────────────
// POST /api/resetPassword
// Body: { email, newPassword }
// Public route — no auth needed (user is not logged in)
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Email and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'Failure',
        result: 'Password must be at least 6 characters.'
      });
    }

    // Check email exists
    const userobj = await prepareDBData.GetUserDetails(email);
    if (!userobj || userobj.length === 0) {
      return res.status(200).json({
        status: 'Failure',
        result: 'No account found with this email.'
      });
    }

    // Check account not closed/blocked
    if (userobj[0].status === 'Closed' || userobj[0].status === 'Blocked') {
      return res.status(200).json({
        status: 'Failure',
        result: 'This account is not active. Please contact support.'
      });
    }

    // Encrypt new password using same encryption as signup
    const encrypted = await convertCredentials({ upassword: newPassword }, true);

    // Update password in DB
    const updated = await prepareDBData.updatePasswordByEmail(email, encrypted);
    if (!updated) {
      return res.status(500).json({
        status: 'Failure',
        result: 'Failed to reset password. Please try again.'
      });
    }

    return res.status(200).json({
      status: 'Success',
      result: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD to controllers/dbController.js
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. getPrivacySettings ────────────────────────────────────────────────────
// GET /api/getPrivacySettings  — auth protected
// uid comes from HttpOnly cookie via req.user.uid
exports.getPrivacySettings = async (req, res) => {
  try {
    const uid = req.user.uid;

    const data = await prepareDBData.getPrivacySettings(uid);
    if (!data) {
      return res.status(404).json({ status: 'Failure', result: 'User not found.' });
    }

    return res.status(200).json({
      status: 'Success',
      data: {
        hide_email:   data.hide_email,
        hide_phone:   data.hide_phone,
        hide_gallery: data.hide_gallery,
        hide_picture: data.hide_picture
      }
    });
  } catch (error) {
    console.error('getPrivacySettings controller error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── 2. updatePrivacySettings ─────────────────────────────────────────────────
// POST /api/updatePrivacySettings  — auth protected
// Body: { hide_email, hide_phone, hide_gallery, hide_picture }
exports.updatePrivacySettings = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { hide_email, hide_phone, hide_gallery, hide_picture } = req.body;

    // Validate all 4 are boolean
    if (
      typeof hide_email   !== 'boolean' ||
      typeof hide_phone   !== 'boolean' ||
      typeof hide_gallery !== 'boolean' ||
      typeof hide_picture !== 'boolean'
    ) {
      return res.status(400).json({
        status: 'Failure',
        result: 'All privacy fields must be boolean values.'
      });
    }

    const updated = await prepareDBData.updatePrivacySettings(
      uid, hide_email, hide_phone, hide_gallery, hide_picture
    );

    if (!updated) {
      return res.status(404).json({ status: 'Failure', result: 'User not found.' });
    }

    return res.status(200).json({
      status: 'Success',
      result: 'Privacy settings updated successfully.',
      data: {
        hide_email:   updated.hide_email,
        hide_phone:   updated.hide_phone,
        hide_gallery: updated.hide_gallery,
        hide_picture: updated.hide_picture
      }
    });
  } catch (error) {
    console.error('updatePrivacySettings controller error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── 3. REPLACE existing getUserMobile ────────────────────────────────────────
// Find exports.getUserMobile in dbController.js and replace entirely with this:
exports.getUserMobile = async (req, res) => {
  try {
    const { uid } = req.body;
    const requesterId = req.user.uid;

    if (!uid) {
      return res.status(400).json({ status: 'Failure', result: 'uid is required.' });
    }

    const data = await prepareDBData.getUserMobile(Number(uid));
    if (!data) {
      return res.status(200).json({ status: 'Failure', result: 'User not found.' });
    }

    // Owner always sees their own contact info
    const isOwner = Number(requesterId) === Number(uid);

    return res.status(200).json({
      status: 'Success',
      data: {
        uid:    data.uid,
        uphone: isOwner || !data.hide_phone ? data.uphone : null,
        uemail: isOwner || !data.hide_email ? data.uemail : null,
        hide_phone: data.hide_phone,
        hide_email: data.hide_email
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};

// ─── 4. REPLACE existing GetUserGallery ───────────────────────────────────────
// Find exports.GetUserGallery in dbController.js and replace with this:
exports.GetUserGallery = async (req, res) => {
  try {
    const { uid }       = req.body;
    // requesterId may be null for public/unauthenticated calls
    const requesterId   = req.user ? req.user.uid : null;

    if (!uid) {
      return res.status(400).json({ status: 'Failure', result: 'uid is required.' });
    }

    const data = await prepareDBData.GetUserGallery(Number(uid), requesterId);

    return res.status(200).json(data);
  } catch (error) {
    console.error('GetUserGallery controller error:', error);
    res.status(500).json({ status: 'Failure', result: error.message });
  }
};