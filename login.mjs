const email = "sairajpatil0204@gmail.com";

async function sendOtp() {
  const res = await fetch("http://localhost:3000/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  console.log("Send OTP response:", data);
  return res;
}

async function verifyOtp(otp) {
  const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  console.log("Verify OTP response:", data);
  // The response should include the user and set a cookie
  return res;
}

// Send OTP
sendOtp().then(() => {
  console.log("OTP sent. Check the logs for the OTP or your email.");
  // In a real scenario, you would wait for user input, but for now we exit.
  // We'll manually check the logs.
});