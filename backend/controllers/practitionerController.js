import axios from "axios";

// STEP 1: Generate OTP
export const generateAadhaarOtp = async (req, res) => {
  try {
    const { aadhaar } = req.body;

    if (!aadhaar) {
      return res.status(400).json({ success: false, message: "Aadhaar number is required" });
    }

    const response = await axios.post(
      "https://hpridsbx.abdm.gov.in/api/v2/registration/aadhaar/generateOtp",
      { aadhaar },
      {
        headers: {
          Authorization: `Bearer ${process.env.HPRID_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Generate OTP error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
};

// STEP 2: Verify OTP
export const verifyAadhaarOtp = async (req, res) => {
  try {
    const { txnId, otp } = req.body;

    if (!txnId || !otp) {
      return res.status(400).json({ success: false, message: "txnId and otp are required" });
    }

    const response = await axios.post(
      "https://hpridsbx.abdm.gov.in/api/v2/registration/aadhaar/verifyOTP",
      { txnId, otp },
      {
        headers: {
          Authorization: `Bearer ${process.env.HPRID_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Verify OTP error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
};

// STEP 3: Check HPID account existence
export const verifyPractitionerHPID = async (req, res) => {
  try {
    const { txnId } = req.body;

    if (!txnId) {
      return res.status(400).json({ success: false, message: "txnId is required" });
    }

    const response = await axios.post(
      "https://hpridsbx.abdm.gov.in/api/v2/registration/aadhaar/checkHpIdAccountExist",
      { txnId, preverifiedCheck: true },
      {
        headers: {
          Authorization: `Bearer ${process.env.HPRID_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("HPID verification error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
};
