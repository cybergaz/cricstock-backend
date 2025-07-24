// find user by transactionId

import { User, OtpRequest } from "../models/User.js";
import bcrypt from "bcryptjs";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SECRET_KEY = 0xa3b1c2d3n;

const deleteAllTransactions = async (mobile) => {
  await User.updateOne({ mobile }, { $set: { transactions: [] } });
  console.log("All recent transactions are deleted");
};

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

function base62Decode(str) {
  let num = 0n;
  const base = 62n;
  for (let char of str) {
    const value = BigInt(BASE62.indexOf(char));
    num = num * base + value;
  }
  return num;
}

// Fixed encrypt/decrypt for 10-digit phone numbers, with improved validation and consistent output
export function encrypt(phoneNumber) {
  // Accepts a 10-digit phone number as string or number
  if (typeof phoneNumber === "number") phoneNumber = phoneNumber.toString();
  if (!/^\d{10}$/.test(phoneNumber)) {
    throw new Error("Phone number must be exactly 10 digits.");
  }
  // Pad to 12 digits if needed (for legacy compatibility, but we use 10 digits)
  // const padded = phoneNumber.padStart(12, "0");
  const num = BigInt(phoneNumber);
  const obfuscated = num ^ SECRET_KEY;
  return base62Encode(obfuscated);
}

export function decrypt(cipherText) {
  if (typeof cipherText !== "string") {
    throw new Error("Cipher text must be a string.");
  }
  // Accepts strings like "CRST-008md0Ak-O9I8Y" and extracts the last base62 substring of 8 or more characters
  // Will match "008md0Ak" in the example above
  const base62Match = cipherText.match(/([0-9A-Za-z]{8,})(?!.*[0-9A-Za-z]{8,})/);
  if (!base62Match) {
    throw new Error("Cipher text must contain at least 8 base62 characters.");
  }
  const base62Part = base62Match[1];
  const decoded = base62Decode(base62Part);
  const original = decoded ^ SECRET_KEY;
  // Always return 10 digits, pad with zeros if needed
  let phone = original.toString();
  if (phone.length > 10) {
    // If more than 10 digits, take the last 10 (in case of accidental padding)
    phone = phone.slice(-10);
  } else if (phone.length < 10) {
    phone = phone.padStart(10, "0");
  }
  return phone;
}

function generateAlphaCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

const createNewUser = async (name, mobile, email, password, referralCode) => {
  try {
    // Check if user already exists
    let user = await findUserByPhone(mobile);
    if (user.code == 200) {
      return { success: false, code: 409, message: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser;
    if (referralCode) {
      const validReferralResult = await findReferral(referralCode);
      if (!validReferralResult.success) {
        return validReferralResult;
      }
      const referredBy = validReferralResult.phone;

      newUser = new User({
        name,
        mobile,
        email,
        password: hashedPassword,
        referredBy: referredBy,
        referralCodes: [],
      });
    }
    else {
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

const findReferral = async (referralCode) => {
  try {
    const phone = `+91${decrypt(referralCode)}`;

    const user = await User.findOne({
      mobile: phone
    });

    if (!user) {
      return {
        success: false,
        message: "User not found or referral code does not exist",
      };
    }
    if (!Array.isArray(user.referralCodes) || !user.referralCodes.includes(referralCode)) {
      return {
        success: false,
        message: "Referral code not found in user's referralCodes array",
      };
    }

    return { success: true, message: "Referral code is valid", phone };

  } catch (err) {
    return { success: false, message: "Server error" };
  }
};

const updateReferrerDetails = async (referred_by_phone, referral_code) => {
  try {
    // remove the referral_Code from referredByUser's referralCodes array
    await User.updateOne(
      { mobile: referred_by_phone },
      { $pull: { referralCodes: referral_code }, $inc: { totalReferrals: 1 } },
    );

  } catch (err) {
    return { success: false, message: "Error handling referral codes" };
  }
}

const deleteOldOtpRequests = async () => {
  try {
    await OtpRequest.deleteMany({});

    console.log(`Deleted all OTP Requests in the DB`);
  } catch (error) {
    console.error("Error deleting old OTP requests:", error);
  }
};

const deleteOldReferrals = async () => {
  try {
    await User.updateMany({}, { $unset: { referralCodes: [] } });
    console.log(`Deleted all users with no referral codes in the DB`);
  } catch (error) {
    console.error("Error deleting old OTP requests:", error);
  }
};

function isTransactionTimedOut(transactionTime) {
  const now = Date.now();
  return now - new Date(transactionTime).getTime() > 3 * 60 * 1000;
}

function mapCashfreeStatus(cfStatus, isTimeout) {
  if (cfStatus === "PAID") return "SUCCESS";
  if (cfStatus === "ACTIVE") return isTimeout ? "FAILED" : "PENDING";
  return "FAILED";
}

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
  findReferral,
  updateReferrerDetails,
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
