const email = "sairajpatil0204@gmail.com";

async function sendOtp() {
  const res = await fetch("http://localhost:3000/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  console.log("Send OTP response:", data);
  return { res, data };
}

async function verifyOtp(otp) {
  const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  console.log("Verify OTP response:", data);
  const setCookie = res.headers.get("set-cookie");
  console.log("Set-Cookie header:", setCookie);
  return { res, data, setCookie };
}

// Main
sendOtp()
  .then(({ data }) => {
    const otp = data.devOtp;
    if (!otp) throw new Error("No devOtp in response");
    return verifyOtp(otp);
  })
  .then(({ setCookie }) => {
    if (!setCookie) throw new Error("No Set-Cookie header");
    const cookie = setCookie;
    // Now fetch analytics with the cookie
    return fetch("http://localhost:3000/api/analytics/summary", {
      method: "GET",
      headers: { "Cookie": cookie },
    }).then(res => {
      console.log("Analytics response status:", res.status);
      console.log("Analytics response headers:", Object.fromEntries(res.headers.entries()));
      return res.text().then(text => ({
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: text
      }));
    });
  })
  .then(result => {
    console.log("Analytics response body:", result.body);
  })
  .catch(err => {
    console.error("Error:", err);
  });