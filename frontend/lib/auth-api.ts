const TATVA_AUTH_BASE = "https://devapi.tatvaops.com/users/api";

export const authApi = {
  // Step 1: Send OTP
  sendOtp: async (phoneNumber: string) => {
    const res = await fetch(`${TATVA_AUTH_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    return res.json();
  },

  // Step 2: Verify OTP
  verifyOtp: async (phoneNumber: string, otp: string) => {
    const res = await fetch(`${TATVA_AUTH_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    return res.json(); // This returns the JWT Token and User ID
  },

  // Step 3: Update Profile
  updateUser: async (userId: string, token: string, formData: FormData) => {
    const res = await fetch(`${TATVA_AUTH_BASE}/users/${userId}`, {
      method: "PUT",
      headers: { 
        "Authorization": `Bearer ${token}` 
        // Note: Don't set Content-Type header for FormData; browser does it automatically
      },
      body: formData,
    });
    return res.json();
  }
};