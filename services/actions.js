// find user by transactionId

import { User, OtpRequest } from "../models/User.js";
import bcrypt from "bcryptjs";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SECRET_KEY = 0xa3b1c2d3n;

/**
 * Deletes all transactions for a user by their mobile number.
 * @param {string} mobile - The mobile number of the user.
 * @returns {Promise<void>}
 */
const deleteAllTransactions = async (mobile) => {
  await User.updateOne({ mobile }, { $set: { transactions: [] } });
  console.log("All recent transactions are deleted");
};

/**
 * Encodes a BigInt number into a base62 string.
 * @param {bigint|number} num - The number to encode.
 * @returns {string} The base62 encoded string.
 */
function base62Encode(num) {
  let encoded = "";
  const base = 62n;
  num = BigInt(num);
  while (num > 0n) {
    encoded = BASE62[Number(num % base)] + encoded;
    num = num / base;
  }
  return encoded.padStart(8, "0");
}

/**
 * Decodes a base62 string into a BigInt number.
 * @param {string} str - The base62 encoded string.
 * @returns {bigint} The decoded number.
 */
function base62Decode(str) {
  let num = 0n;
  const base = 62n;
  for (let char of str) {
    const value = BigInt(BASE62.indexOf(char));
    num = num * base + value;
  }
  return num;
}

/**
 * Encrypts a 12-digit phone number using a secret key and base62 encoding.
 * @param {string} phoneNumber - The phone number to encrypt (must be 12 digits).
 * @returns {string} The encrypted base62 string.
 * @throws {Error} If the phone number is not exactly 10 digits.
 */
function encrypt(phoneNumber) {
  if (!/^\d{12}$/.test(phoneNumber)) {
    throw new Error("Phone number must be exactly 10 digits.");
  }
  const num = BigInt(phoneNumber);
  const obfuscated = num ^ SECRET_KEY;
  return base62Encode(obfuscated);
}

/**
 * Decrypts a base62-encoded cipher text back to the original phone number.
 * @param {string} cipherText - The base62 encoded cipher text (8 characters).
 * @returns {string} The decrypted phone number as a string.
 * @throws {Error} If the cipher text is not exactly 8 base62 characters.
 */
function decrypt(cipherText) {
  if (!/^[0-9A-Za-z]{8}$/.test(cipherText)) {
    throw new Error("Cipher text must be exactly 8 base62 characters.");
  }
  const decoded = base62Decode(cipherText);
  const original = decoded ^ SECRET_KEY;
  return original.toString().padStart(10, "0");
}

/**
 * Generates a random 5-character alphanumeric code.
 * @returns {string} The generated code.
 */
function generateAlphaCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Finds a user by their phone number.
 * @param {string} phone - The user's phone number.
 * @returns {Promise<{success: boolean, code: number, data?: any, message?: string}>}
 */
const findUserByPhone = async (phone) => {
  try {
    const user = await User.findOne({ mobile: phone });
    if (!user) {
      return { success: false, code: 404, message: "User not found" };
    }

    return { success: true, code: 200, data: user };
  } catch (error) {
    console.error("Error finding user by phone:", error);
    return {
      success: false,
      code: 500,
      message: "Error finding user by phone",
    };
  }
};

/**
 * Finds an OTP request by phone number.
 * @param {string} phone - The phone number associated with the OTP.
 * @returns {Promise<{success: boolean, code: number, data?: any, message?: string}>}
 */
const findOtpByPhone = async (phone) => {
  try {
    const otp = await OtpRequest.findOne({ phone });
    if (!otp) {
      return { success: false, code: 404, message: "OTP not found" };
    }
    return { success: true, code: 200, data: otp };
  } catch (error) {
    console.error("Error finding OTP:", error);
    return { success: false, code: 500, message: "Error finding OTP" };
  }
};

/**
 * Creates a new user in the database.
 * @param {string} name - The user's name.
 * @param {string} mobile - The user's mobile number.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @param {string} [referralCode] - Optional referral code.
 * @returns {Promise<{success: boolean, code: number, data?: any, message?: string}>}
 */
const createNewUser = async (name, mobile, email, password, referralCode) => {
  try {
    // Check if user already exists
    let user = await findUserByPhone(mobile);
    if (user.code == 200) {
      return { success: false, code: 409, message: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // CRST-0GDt8GQT-A7F
    let newUser;
    if (referralCode) {
      const validReferral = await findReferral(referralCode);
      if (!validReferral) {
        return { success: false, code: 403 };
      }
      newUser = new User({
        name,
        mobile,
        email,
        password: hashedPassword,
        referredBy: referralCode,
        referralCodes: [],
      });
    } else {
      newUser = new User({
        name,
        mobile,
        email,
        password: hashedPassword,
        referralCodes: [],
      });
    }
    await newUser.save();
    return { success: true, code: 201, data: newUser };
  } catch (err) {
    console.error("Error creating user:", err);
    return { success: false, code: 400 };
  }
};

/**
 * Finds and validates a referral code, removes it from the user's list, and increments totalReferrals.
 * @param {string} referralCode - The referral code to validate.
 * @returns {Promise<true|{success: boolean, message: string, error?: any}>}
 */
const findReferral = async (referralCode) => {
  try {
    const phone = `+${decrypt(referralCode.split("-")[1])}`;

    const user = await User.findOne({
      mobile: phone,
      referralCodes: referralCode,
    });

    if (!user) {
      console.log("No user found with this referral code");
      return {
        success: false,
        message: "User not found or referral code does not exist",
      };
    }

    await User.updateOne(
      { mobile: phone },
      { $pull: { referralCodes: referralCode }, $inc: { totalReferrals: 1 } }
    );

    console.log("Referral code removed and totalReferrals incremented");
    return true;
  } catch (err) {
    return { success: false, message: "Server error", error: err };
  }
};

/**
 * Deletes all OTP requests from the database.
 * @returns {Promise<void>}
 */
const deleteOldOtpRequests = async () => {
  try {
    await OtpRequest.deleteMany({});

    console.log(`Deleted all OTP Requests in the DB`);
  } catch (error) {
    console.error("Error deleting old OTP requests:", error);
  }
};

/**
 * Removes all referral codes from all users in the database.
 * @returns {Promise<void>}
 */
const deleteOldReferrals = async () => {
  try {
    await User.updateMany({}, { $unset: { referralCodes: [] } });
    console.log(`Deleted all users with no referral codes in the DB`);
  } catch (error) {
    console.error("Error deleting old OTP requests:", error);
  }
};

/**
 * Checks if a transaction has timed out (over 3 minutes old).
 * @param {string|Date} transactionTime - The transaction time.
 * @returns {boolean} True if timed out, false otherwise.
 */
function isTransactionTimedOut(transactionTime) {
  const now = Date.now();
  return now - new Date(transactionTime).getTime() > 3 * 60 * 1000;
}

/**
 * Maps Cashfree payment status and timeout to internal status.
 * @param {string} cfStatus - The Cashfree status (e.g., 'PAID', 'ACTIVE').
 * @param {boolean} isTimeout - Whether the transaction timed out.
 * @returns {string} The mapped status ('SUCCESS', 'FAILED', or 'PENDING').
 */
function mapCashfreeStatus(cfStatus, isTimeout) {
  if (cfStatus === "PAID") return "SUCCESS";
  if (cfStatus === "ACTIVE") return isTimeout ? "FAILED" : "PENDING";
  return "FAILED";
}

/**
 * Checks if a user is a super admin by their ID.
 * @param {string} id - The user ID.
 * @returns {Promise<{success: boolean, code: number, data?: any, message?: string}>}
 */
const checkIsSuperAdmin = async (id) => {
  try {
    const admin = await User.findOne({ _id: id });
    if (!admin) {
      return { success: false, code: 404, message: "No Such Admin Exists" };
    }
    if (admin.isAdmin && admin.role !== "super_admin") {
      return { success: false, code: 403, message: "You are not super admin to perform such action" };
    }

    return { success: true, code: 200, data: admin };
  } catch (error) {
    console.error("Error deleting old OTP requests:", error);
    return { success: false, code: 500, message: "Error deleting old OTP requests" };
  }
}

/**
 * Finds an admin user by their ID.
 * @param {string} id - The admin user ID.
 * @returns {Promise<{success: boolean, code: number, data?: any, message?: string}>}
 */
const findAdminById = async (id) => {
  try {
    const admin = await User.findOne({ _id: id })
    if (!admin) {
      return { success: false, code: 404, message: "No such user in the database" };
    }
    if (admin.isAdmin) {
      return { success: false, code: 403, message: "Not an Admin" };
    }
    return { success: true, code: 200, data: admin };
  }
  catch (error) {
    console.error("Error finding admin by phone:", error);
    return { success: false, code: 500, message: "Error finding admin by phone" };
  }
}

/**
 * Gets the date range string from today to the next 1 day.
 * @returns {string} The date range in 'YYYY-MM-DD_YYYY-MM-DD' format.
 */
function getTodayToNext1DaysRange() {
  const today = new Date();

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const start = `${yyyy}-${mm}-${dd}`;

  const future = new Date(today);
  future.setDate(future.getDate() + 1);
  const yyyy2 = future.getFullYear();
  const mm2 = String(future.getMonth() + 1).padStart(2, '0');
  const dd2 = String(future.getDate()).padStart(2, '0');
  const end = `${yyyy2}-${mm2}-${dd2}`;

  return `${start}_${end}`;
}

/**
 * Gets the date range string from today to the next 7 days.
 * @returns {string} The date range in 'YYYY-MM-DD_YYYY-MM-DD' format.
 */
function getTodayToNext7DaysRange() {
  const today = new Date();

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const start = `${yyyy}-${mm}-${dd}`;

  const future = new Date(today);
  future.setDate(future.getDate() + 7);
  const yyyy2 = future.getFullYear();
  const mm2 = String(future.getMonth() + 1).padStart(2, '0');
  const dd2 = String(future.getDate()).padStart(2, '0');
  const end = `${yyyy2}-${mm2}-${dd2}`;

  return `${start}_${end}`;
}

/**
 * Updates the last seen timestamp for a user.
 * @param {string} userId - The user's ID.
 * @returns {Promise<{success: boolean, code: number, data?: any, message?: string}>}
 */
const updateUserLastSeen = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, code: 404, message: "User not found" };
    }

    user.lastSeen = new Date();
    await user.save();

    return { success: true, code: 200, data: user };
  } catch (error) {
    console.error("Error updating user's last seen:", error);
    return { success: false, code: 500, message: "Error updating user's last seen" };
  }
}

/**
 * Parses a date-time string in 'YYYY-MM-DD HH:mm:ss' format to a Date object.
 * @param {string} dateTimeStr - The date-time string.
 * @returns {Date|null} The parsed Date object, or null if invalid.
 */
function getTimeFromString(dateTimeStr) {
  // Expects format: "YYYY-MM-DD HH:mm:ss"
  if (!dateTimeStr) return null;
  const [datePart, timePart] = dateTimeStr.split(' ');
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  if (
    [year, month, day, hour, minute, second].some(
      (v) => isNaN(v) || v === undefined
    )
  ) {
    return null;
  }
  return new Date(year, month - 1, day, hour, minute, second);
}

export {
  getTodayToNext7DaysRange,
  getTodayToNext1DaysRange,
  findUserByPhone,
  findOtpByPhone,
  createNewUser,
  deleteOldOtpRequests,
  deleteOldReferrals,
  mapCashfreeStatus,
  isTransactionTimedOut,
  checkIsSuperAdmin,
  findAdminById,
  updateUserLastSeen,
  deleteAllTransactions,
  getTimeFromString
};
